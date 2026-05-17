import { Router, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest, requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// GET /api/reports/achievement — All employees' planned vs actual
router.get('/achievement', requireAuth, requireRole('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const cycleId = req.query.cycleId as string | undefined;
    const departmentId = req.query.departmentId as string | undefined;

    const whereClause: any = {};
    if (cycleId) whereClause.cycleId = cycleId;

    const achievements = await prisma.achievement.findMany({
      where: whereClause,
      include: {
        goal: {
          include: {
            goalSheet: {
              include: {
                user: { include: { department: true } },
              },
            },
          },
        },
        cycle: true,
      },
    });

    let filtered = achievements;
    if (departmentId) {
      filtered = achievements.filter(
        (a) => a.goal.goalSheet.user.departmentId === departmentId
      );
    }

    // For manager role, only show team members
    if (req.user!.role === 'MANAGER') {
      filtered = filtered.filter(
        (a) => a.goal.goalSheet.user.managerId === req.user!.id
      );
    }

    const report = filtered.map((a) => ({
      employeeName: a.goal.goalSheet.user.name,
      employeeEmail: a.goal.goalSheet.user.email,
      department: a.goal.goalSheet.user.department?.name || '',
      goalTitle: a.goal.title,
      thrustArea: a.goal.thrustArea,
      uomType: a.goal.uomType,
      target: a.goal.target,
      weightage: a.goal.weightage,
      actual: a.actual,
      score: a.score,
      status: a.status,
      cycle: `${a.cycle.year}-${a.cycle.phase}`,
    }));

    res.json(report);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// GET /api/reports/achievement/export — CSV download
router.get('/achievement/export', requireAuth, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const cycleId = req.query.cycleId as string | undefined;
    const whereClause: any = {};
    if (cycleId) whereClause.cycleId = cycleId;

    const achievements = await prisma.achievement.findMany({
      where: whereClause,
      include: {
        goal: {
          include: {
            goalSheet: {
              include: { user: { include: { department: true } } },
            },
          },
        },
        cycle: true,
      },
    });

    const headers = 'Employee,Email,Department,Goal,Thrust Area,UoM,Target,Weightage,Actual,Score,Status,Cycle\n';
    const rows = achievements
      .map((a) => {
        return [
          `"${a.goal.goalSheet.user.name}"`,
          `"${a.goal.goalSheet.user.email}"`,
          `"${a.goal.goalSheet.user.department?.name || ''}"`,
          `"${a.goal.title}"`,
          `"${a.goal.thrustArea}"`,
          `"${a.goal.uomType}"`,
          a.goal.target,
          a.goal.weightage,
          a.actual ?? '',
          a.score != null ? (a.score * 100).toFixed(1) + '%' : '',
          a.status,
          `${a.cycle.year}-${a.cycle.phase}`,
        ].join(',');
      })
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=achievement_report.csv');
    res.send(headers + rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to export report' });
  }
});

// GET /api/reports/completion — Check-in completion rates
router.get('/completion', requireAuth, requireRole('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const cycleId = req.query.cycleId as string | undefined;

    const employees = await prisma.user.findMany({
      where: { role: 'EMPLOYEE' },
      include: {
        department: true,
        manager: { select: { id: true, name: true } },
        goalSheets: {
          where: cycleId ? { cycleId } : {},
          include: {
            goals: {
              include: {
                achievements: cycleId ? { where: { cycleId } } : true,
              },
            },
            checkIns: true,
          },
        },
      },
    });

    const result = employees.map((emp) => {
      const sheet = emp.goalSheets[0];
      const goalCount = sheet?.goals.length || 0;
      const achievementCount = sheet?.goals.reduce(
        (sum, g) => sum + g.achievements.length,
        0
      ) || 0;
      const checkInCount = sheet?.checkIns.length || 0;

      return {
        employeeId: emp.id,
        employeeName: emp.name,
        department: emp.department?.name || '',
        manager: emp.manager?.name || '',
        sheetStatus: sheet?.status || 'NO_SHEET',
        goalCount,
        achievementCount,
        checkInCount,
        isCheckInComplete: achievementCount >= goalCount && goalCount > 0,
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch completion data' });
  }
});

export default router;
