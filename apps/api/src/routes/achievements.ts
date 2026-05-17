import { Router, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest, requireAuth } from '../middleware/auth';
import { computeScore } from '../utils/scoreCompute';

const router = Router();

// PUT /api/achievements/:goalId — Employee: log actual achievement
router.put('/:goalId', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { actual, actualDate, status, cycleId } = req.body;
    const goal = await prisma.goal.findUnique({
      where: { id: req.params.goalId },
      include: { goalSheet: true, sharedCopies: true },
    });

    if (!goal) {
      res.status(404).json({ error: 'Goal not found' });
      return;
    }

    if (goal.goalSheet.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    // Non-primary shared goals cannot update achievement directly
    if (goal.isShared && !goal.isPrimaryOwner) {
      res.status(400).json({ error: 'Shared goal achievements are synced from the primary owner' });
      return;
    }

    // Determine active cycle for check-in
    let activeCycleId = cycleId;
    if (!activeCycleId) {
      const now = new Date();
      const cycle = await prisma.goalCycle.findFirst({
        where: {
          OR: [
            { isOverride: true },
            { openDate: { lte: now }, closeDate: { gte: now } },
          ],
        },
        orderBy: { isOverride: 'desc' },
      });
      if (!cycle) {
        res.status(400).json({ error: 'No active cycle window open' });
        return;
      }
      activeCycleId = cycle.id;
    }

    // Compute score
    const actualVal = actual !== undefined ? parseFloat(actual) : 0;
    const score = computeScore({
      uomType: goal.uomType,
      target: goal.target,
      actual: actualVal,
      deadline: goal.deadline || undefined,
      actualDate: actualDate ? new Date(actualDate) : undefined,
    });

    // Upsert achievement
    const achievement = await prisma.achievement.upsert({
      where: {
        goalId_cycleId: { goalId: req.params.goalId, cycleId: activeCycleId },
      },
      update: {
        actual: actualVal,
        actualDate: actualDate ? new Date(actualDate) : null,
        status: status || 'ON_TRACK',
        score,
      },
      create: {
        goalId: req.params.goalId,
        cycleId: activeCycleId,
        actual: actualVal,
        actualDate: actualDate ? new Date(actualDate) : null,
        status: status || 'NOT_STARTED',
        score,
      },
    });

    // If primary owner of shared goal, propagate to all copies
    if (goal.isPrimaryOwner && goal.isShared && goal.sharedCopies.length > 0) {
      for (const copy of goal.sharedCopies) {
        await prisma.achievement.upsert({
          where: {
            goalId_cycleId: { goalId: copy.id, cycleId: activeCycleId },
          },
          update: {
            actual: actualVal,
            actualDate: actualDate ? new Date(actualDate) : null,
            status: status || 'ON_TRACK',
            score,
          },
          create: {
            goalId: copy.id,
            cycleId: activeCycleId,
            actual: actualVal,
            actualDate: actualDate ? new Date(actualDate) : null,
            status: status || 'NOT_STARTED',
            score,
          },
        });
      }
    }

    res.json(achievement);
  } catch (err) {
    console.error('Achievement update error:', err);
    res.status(500).json({ error: 'Failed to update achievement' });
  }
});

// GET /api/achievements/sheet/:sheetId — Get all achievements for a sheet
router.get('/sheet/:sheetId', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const cycleId = req.query.cycleId as string | undefined;

    const sheet = await prisma.goalSheet.findUnique({
      where: { id: req.params.sheetId },
      include: { goals: true },
    });

    if (!sheet) {
      res.status(404).json({ error: 'Goal sheet not found' });
      return;
    }

    const goalIds = sheet.goals.map((g) => g.id);
    const whereClause: any = { goalId: { in: goalIds } };
    if (cycleId) whereClause.cycleId = cycleId;

    const achievements = await prisma.achievement.findMany({
      where: whereClause,
      include: {
        goal: true,
        cycle: true,
      },
    });

    res.json(achievements);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch achievements' });
  }
});

export default router;
