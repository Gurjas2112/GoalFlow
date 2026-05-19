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
    // Run independent base queries in parallel
    const [departments, cycles, achievements] = await Promise.all([
      prisma.department.findMany({
        select: {
          id: true,
          name: true,
          users: { where: { role: 'EMPLOYEE' }, select: { id: true } },
        },
      }),
      prisma.goalCycle.findMany({
        select: { id: true, year: true, phase: true },
        orderBy: { openDate: 'asc' },
      }),
      // Single query for ALL achievements with completed actuals, with the minimal
      // joins needed to derive (departmentId, cycleId, userId).
      prisma.achievement.findMany({
        where: { actual: { not: null } },
        select: {
          cycleId: true,
          goal: {
            select: {
              goalSheet: {
                select: {
                  userId: true,
                  user: { select: { departmentId: true, role: true } },
                },
              },
            },
          },
        },
      }),
    ]);

    // Build set of (deptId|cycleId) -> Set<userId> in one pass
    const completedMap = new Map<string, Set<string>>();
    for (const a of achievements) {
      const u = a.goal.goalSheet.user;
      if (!u || u.role !== 'EMPLOYEE' || !u.departmentId) continue;
      const key = `${u.departmentId}|${a.cycleId}`;
      let set = completedMap.get(key);
      if (!set) {
        set = new Set<string>();
        completedMap.set(key, set);
      }
      set.add(a.goal.goalSheet.userId);
    }

    const result = [];
    for (const dept of departments) {
      const total = dept.users.length;
      if (total === 0) continue;
      for (const cycle of cycles) {
        const completed = completedMap.get(`${dept.id}|${cycle.id}`)?.size ?? 0;
        result.push({
          department: dept.name,
          cycle: `${cycle.year}-${cycle.phase}`,
          completionRate: Math.round((completed / total) * 100),
          completed,
          total,
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
    const [managers, cycles] = await Promise.all([
      prisma.user.findMany({
        where: { role: 'MANAGER' },
        select: {
          id: true,
          name: true,
          reports: { select: { id: true } },
        },
      }),
      prisma.goalCycle.findMany({
        where: { phase: { in: ['Q1', 'Q2', 'Q3', 'Q4'] } },
        orderBy: { openDate: 'desc' },
        take: 4,
        select: { id: true },
      }),
    ]);

    const cycleIds = cycles.map((c) => c.id);
    const allTeamIds = managers.flatMap((m) => m.reports.map((r) => r.id));

    if (allTeamIds.length === 0 || cycleIds.length === 0) {
      res.json([]);
      return;
    }

    // Batch-fetch all goal sheets in scope, then all check-ins for those sheets,
    // and approved-goal counts grouped by user — three queries total.
    const [sheets, checkIns, approvedGroup] = await Promise.all([
      prisma.goalSheet.findMany({
        where: { userId: { in: allTeamIds }, cycleId: { in: cycleIds } },
        select: { id: true, userId: true },
      }),
      prisma.checkIn.findMany({
        where: {
          managerId: { in: managers.map((m) => m.id) },
          goalSheet: { userId: { in: allTeamIds }, cycleId: { in: cycleIds } },
        },
        select: { managerId: true },
      }),
      prisma.goalSheet.groupBy({
        by: ['userId'],
        where: { userId: { in: allTeamIds }, status: { in: ['APPROVED', 'LOCKED'] } },
        _count: { _all: true },
      }),
    ]);

    // sheets per user
    const sheetCountByUser = new Map<string, number>();
    for (const s of sheets) {
      sheetCountByUser.set(s.userId, (sheetCountByUser.get(s.userId) ?? 0) + 1);
    }
    // check-ins per manager
    const checkInsByManager = new Map<string, number>();
    for (const c of checkIns) {
      checkInsByManager.set(c.managerId, (checkInsByManager.get(c.managerId) ?? 0) + 1);
    }
    // approved goal sheets per user
    const approvedByUser = new Map<string, number>();
    for (const r of approvedGroup) {
      approvedByUser.set(r.userId, r._count._all);
    }

    const result = [];
    for (const manager of managers) {
      const teamIds = manager.reports.map((r) => r.id);
      if (teamIds.length === 0) continue;

      let totalSheets = 0;
      let goalsApproved = 0;
      for (const uid of teamIds) {
        totalSheets += sheetCountByUser.get(uid) ?? 0;
        goalsApproved += approvedByUser.get(uid) ?? 0;
      }
      const checkInsCompleted = checkInsByManager.get(manager.id) ?? 0;

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
