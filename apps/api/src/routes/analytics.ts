import { Router, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest, requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// GET /api/analytics/qoq — Quarter-on-quarter achievement scores
router.get('/qoq', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { userId, departmentId } = req.query as Record<string, string>;

    const whereClause: any = { score: { not: null } };
    if (userId) {
      whereClause.goal = { goalSheet: { userId } };
    }
    if (departmentId) {
      whereClause.goal = {
        ...whereClause.goal,
        goalSheet: {
          ...whereClause.goal?.goalSheet,
          user: { departmentId },
        },
      };
    }

    const achievements = await prisma.achievement.findMany({
      where: whereClause,
      include: {
        cycle: { select: { phase: true, year: true } },
        goal: {
          select: {
            weightage: true,
            goalSheet: {
              select: {
                userId: true,
                user: { select: { name: true, departmentId: true } },
              },
            },
          },
        },
      },
    });

    const grouped: Record<string, { total: number; weightSum: number; count: number }> = {};
    for (const a of achievements) {
      const key = `${a.cycle.year}-${a.cycle.phase}`;
      if (!grouped[key]) grouped[key] = { total: 0, weightSum: 0, count: 0 };
      grouped[key].total += (a.score! * a.goal.weightage);
      grouped[key].weightSum += a.goal.weightage;
      grouped[key].count += 1;
    }

    const result = Object.entries(grouped)
      .map(([period, data]) => ({
        period,
        avgScore: data.weightSum > 0
          ? Math.round((data.total / data.weightSum) * 100)
          : 0,
        goalCount: data.count,
      }))
      .sort((a, b) => a.period.localeCompare(b.period));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch QoQ data' });
  }
});

// GET /api/analytics/heatmap — Completion rate per department per cycle
router.get('/heatmap', requireAuth, requireRole('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const departments = await prisma.department.findMany({
      include: { users: { select: { id: true, role: true } } },
    });
    const cycles = await prisma.goalCycle.findMany({ orderBy: { openDate: 'asc' } });

    const result = [];
    for (const dept of departments) {
      for (const cycle of cycles) {
        const employeeIds = dept.users.filter((u) => u.role === 'EMPLOYEE').map((u) => u.id);
        if (employeeIds.length === 0) continue;

        const completedAchievements = await prisma.achievement.findMany({
          where: {
            cycleId: cycle.id,
            goal: { goalSheet: { userId: { in: employeeIds } } },
            actual: { not: null },
          },
          select: { goal: { select: { goalSheet: { select: { userId: true } } } } },
        });

        const uniqueCompleted = new Set(
          completedAchievements.map((a) => a.goal.goalSheet.userId)
        ).size;

        result.push({
          department: dept.name,
          cycle: `${cycle.year}-${cycle.phase}`,
          completionRate: Math.round((uniqueCompleted / employeeIds.length) * 100),
          completed: uniqueCompleted,
          total: employeeIds.length,
        });
      }
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch heatmap data' });
  }
});

// GET /api/analytics/goal-distribution — By thrust area, UoM, status
router.get('/goal-distribution', requireAuth, requireRole('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const [byThrustArea, byUoM, byStatus] = await Promise.all([
      prisma.goal.groupBy({
        by: ['thrustArea'],
        _count: { _all: true },
        orderBy: { _count: { thrustArea: 'desc' } },
      }),
      prisma.goal.groupBy({
        by: ['uomType'],
        _count: { _all: true },
      }),
      prisma.achievement.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
    ]);

    res.json({
      byThrustArea: byThrustArea.map((r) => ({ name: r.thrustArea, count: r._count._all })),
      byUoM: byUoM.map((r) => ({ name: r.uomType, count: r._count._all })),
      byStatus: byStatus.map((r) => ({ name: r.status, count: r._count._all })),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch distribution data' });
  }
});

// GET /api/analytics/manager-effectiveness
router.get('/manager-effectiveness', requireAuth, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const managers = await prisma.user.findMany({
      where: { role: 'MANAGER' },
      include: { reports: { select: { id: true, name: true } } },
    });

    const cycles = await prisma.goalCycle.findMany({
      where: { phase: { in: ['Q1', 'Q2', 'Q3', 'Q4'] } },
      orderBy: { openDate: 'desc' },
      take: 4,
    });

    const result = [];
    for (const manager of managers) {
      const teamIds = manager.reports.map((r) => r.id);
      if (teamIds.length === 0) continue;

      let totalSheets = 0;
      let checkInsCompleted = 0;

      for (const cycle of cycles) {
        const sheets = await prisma.goalSheet.findMany({
          where: { userId: { in: teamIds }, cycleId: cycle.id },
        });
        totalSheets += sheets.length;

        const checkIns = await prisma.checkIn.count({
          where: {
            goalSheetId: { in: sheets.map((s) => s.id) },
            managerId: manager.id,
          },
        });
        checkInsCompleted += checkIns;
      }

      const goalsApproved = await prisma.goalSheet.count({
        where: {
          userId: { in: teamIds },
          status: { in: ['APPROVED', 'LOCKED'] },
        },
      });

      result.push({
        managerId: manager.id,
        managerName: manager.name,
        teamSize: teamIds.length,
        totalSheetsInPeriod: totalSheets,
        checkInsCompleted,
        checkInRate: totalSheets > 0
          ? Math.round((checkInsCompleted / totalSheets) * 100)
          : 0,
        goalsApproved,
      });
    }

    res.json(result.sort((a, b) => b.checkInRate - a.checkInRate));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch manager effectiveness' });
  }
});

export default router;
