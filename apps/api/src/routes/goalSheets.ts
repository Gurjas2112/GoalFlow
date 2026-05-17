import { Router, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest, requireAuth, requireRole } from '../middleware/auth';
import { writeAudit } from '../utils/audit';
import { notifyGoalSubmitted, notifyGoalApproved, notifyGoalReturned } from '../utils/notify';

const router = Router();

// GET /api/goal-sheets/my — Employee: get own sheet for active cycle
router.get('/my', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const cycleId = req.query.cycleId as string | undefined;
    let cycle;

    if (cycleId) {
      cycle = await prisma.goalCycle.findUnique({ where: { id: cycleId } });
    } else {
      // Find active cycle (override or current date)
      const now = new Date();
      cycle = await prisma.goalCycle.findFirst({
        where: {
          OR: [
            { isOverride: true },
            { openDate: { lte: now }, closeDate: { gte: now } },
          ],
        },
        orderBy: { isOverride: 'desc' },
      });
    }

    if (!cycle) {
      res.json(null);
      return;
    }

    const sheet = await prisma.goalSheet.findFirst({
      where: { userId: req.user!.id, cycleId: cycle.id },
      include: {
        goals: { orderBy: { createdAt: 'asc' } },
        cycle: true,
      },
    });

    res.json({ sheet, cycle });
  } catch (err) {
    console.error('Get my sheet error:', err);
    res.status(500).json({ error: 'Failed to fetch goal sheet' });
  }
});

// GET /api/goal-sheets/team — Manager: get all team members' sheets
router.get('/team', requireAuth, requireRole('MANAGER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const cycleId = req.query.cycleId as string | undefined;
    let cycle;

    if (cycleId) {
      cycle = await prisma.goalCycle.findUnique({ where: { id: cycleId } });
    } else {
      const now = new Date();
      cycle = await prisma.goalCycle.findFirst({
        where: {
          OR: [
            { isOverride: true },
            { openDate: { lte: now }, closeDate: { gte: now } },
          ],
        },
        orderBy: { isOverride: 'desc' },
      });
    }

    if (!cycle) {
      res.json([]);
      return;
    }

    const whereClause = req.user!.role === 'ADMIN'
      ? { cycleId: cycle.id }
      : { cycleId: cycle.id, user: { managerId: req.user!.id } };

    const sheets = await prisma.goalSheet.findMany({
      where: whereClause,
      include: {
        user: { include: { department: true } },
        goals: true,
        cycle: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json(sheets);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch team sheets' });
  }
});

// GET /api/goal-sheets/:id — Get specific sheet
router.get('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const sheet = await prisma.goalSheet.findUnique({
      where: { id: req.params.id },
      include: {
        user: { include: { department: true, manager: { select: { id: true, name: true } } } },
        goals: {
          orderBy: { createdAt: 'asc' },
          include: { achievements: true },
        },
        cycle: true,
        checkIns: {
          include: { manager: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!sheet) {
      res.status(404).json({ error: 'Goal sheet not found' });
      return;
    }

    // Auth gate: employee can only see own, manager can see reports, admin can see all
    if (
      req.user!.role === 'EMPLOYEE' &&
      sheet.userId !== req.user!.id
    ) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    if (
      req.user!.role === 'MANAGER' &&
      sheet.userId !== req.user!.id &&
      sheet.user.managerId !== req.user!.id
    ) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    res.json(sheet);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch goal sheet' });
  }
});

// POST /api/goal-sheets — Employee: create new goal sheet
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { cycleId } = req.body;
    if (!cycleId) {
      res.status(400).json({ error: 'cycleId is required' });
      return;
    }

    // Check cycle exists and is open
    const cycle = await prisma.goalCycle.findUnique({ where: { id: cycleId } });
    if (!cycle) {
      res.status(404).json({ error: 'Cycle not found' });
      return;
    }

    // Check no existing sheet for this cycle
    const existing = await prisma.goalSheet.findFirst({
      where: { userId: req.user!.id, cycleId },
    });
    if (existing) {
      res.status(409).json({ error: 'Goal sheet already exists for this cycle', sheet: existing });
      return;
    }

    const sheet = await prisma.goalSheet.create({
      data: { userId: req.user!.id, cycleId },
      include: { goals: true, cycle: true },
    });

    res.status(201).json(sheet);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create goal sheet' });
  }
});

// POST /api/goal-sheets/:id/submit — Employee: submit sheet
router.post('/:id/submit', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const sheet = await prisma.goalSheet.findUnique({
      where: { id: req.params.id },
      include: { goals: true },
    });

    if (!sheet) {
      res.status(404).json({ error: 'Goal sheet not found' });
      return;
    }
    if (sheet.userId !== req.user!.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    if (sheet.status !== 'DRAFT' && sheet.status !== 'RETURNED') {
      res.status(400).json({ error: 'Can only submit DRAFT or RETURNED sheets' });
      return;
    }

    // Validate
    const goals = sheet.goals;
    if (goals.length === 0) {
      res.status(400).json({ error: 'At least one goal is required' });
      return;
    }
    if (goals.length > 8) {
      res.status(400).json({ error: 'Maximum 8 goals allowed' });
      return;
    }
    const total = goals.reduce((s, g) => s + g.weightage, 0);
    if (total !== 100) {
      res.status(400).json({ error: `Total weightage must equal 100%. Current: ${total}%` });
      return;
    }
    const underMin = goals.filter((g) => g.weightage < 10);
    if (underMin.length > 0) {
      res.status(400).json({ error: 'Each goal must have at least 10% weightage' });
      return;
    }

    const updated = await prisma.goalSheet.update({
      where: { id: req.params.id },
      data: { status: 'SUBMITTED', submittedAt: new Date() },
      include: { goals: true, user: true },
    });

    await writeAudit({
      userId: req.user!.id,
      goalSheetId: sheet.id,
      action: 'GOAL_SHEET_SUBMITTED',
    });

    // Notify manager
    if (updated.user?.managerId) {
      const mgr = await prisma.user.findUnique({ where: { id: updated.user.managerId } });
      if (mgr) notifyGoalSubmitted(updated.user.name, mgr.email, sheet.id).catch(() => {});
    }

    res.json(updated);
  } catch (err) {
    console.error('Submit error:', err);
    res.status(500).json({ error: 'Failed to submit goal sheet' });
  }
});

// POST /api/goal-sheets/:id/approve — Manager: approve
router.post('/:id/approve', requireAuth, requireRole('MANAGER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const sheet = await prisma.goalSheet.findUnique({
      where: { id: req.params.id },
      include: { goals: true, user: true },
    });

    if (!sheet) {
      res.status(404).json({ error: 'Goal sheet not found' });
      return;
    }
    if (sheet.status !== 'SUBMITTED') {
      res.status(400).json({ error: 'Can only approve SUBMITTED sheets' });
      return;
    }

    // Validate again
    const total = sheet.goals.reduce((s, g) => s + g.weightage, 0);
    if (total !== 100) {
      res.status(400).json({ error: `Cannot approve: weightage total is ${total}%, must be 100%` });
      return;
    }

    const now = new Date();
    const updated = await prisma.goalSheet.update({
      where: { id: req.params.id },
      data: {
        status: 'LOCKED',
        approvedAt: now,
        lockedAt: now,
      },
      include: { goals: true, user: true },
    });

    await writeAudit({
      userId: req.user!.id,
      goalSheetId: sheet.id,
      action: 'GOAL_SHEET_APPROVED',
    });

    // Notify employee
    notifyGoalApproved(sheet.user!.name, sheet.user!.email).catch(() => {});

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve goal sheet' });
  }
});

// POST /api/goal-sheets/:id/return — Manager: return for rework
router.post('/:id/return', requireAuth, requireRole('MANAGER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { reason } = req.body;
    if (!reason) {
      res.status(400).json({ error: 'Return reason is required' });
      return;
    }

    const sheet = await prisma.goalSheet.findUnique({
      where: { id: req.params.id },
    });
    if (!sheet) {
      res.status(404).json({ error: 'Goal sheet not found' });
      return;
    }
    if (sheet.status !== 'SUBMITTED') {
      res.status(400).json({ error: 'Can only return SUBMITTED sheets' });
      return;
    }

    const updated = await prisma.goalSheet.update({
      where: { id: req.params.id },
      data: { status: 'RETURNED' },
      include: { goals: true, user: true },
    });

    await writeAudit({
      userId: req.user!.id,
      goalSheetId: sheet.id,
      action: 'GOAL_SHEET_RETURNED',
      fieldName: 'reason',
      newValue: reason,
    });

    // Notify employee
    const emp = await prisma.user.findUnique({ where: { id: sheet.userId } });
    if (emp) notifyGoalReturned(emp.name, emp.email, reason).catch(() => {});

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to return goal sheet' });
  }
});

// POST /api/goal-sheets/:id/unlock — Admin: unlock locked sheet
router.post('/:id/unlock', requireAuth, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const sheet = await prisma.goalSheet.findUnique({
      where: { id: req.params.id },
    });
    if (!sheet) {
      res.status(404).json({ error: 'Goal sheet not found' });
      return;
    }

    const updated = await prisma.goalSheet.update({
      where: { id: req.params.id },
      data: { status: 'DRAFT', lockedAt: null, approvedAt: null },
      include: { goals: true },
    });

    await writeAudit({
      userId: req.user!.id,
      goalSheetId: sheet.id,
      action: 'GOAL_SHEET_UNLOCKED',
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to unlock goal sheet' });
  }
});

export default router;
