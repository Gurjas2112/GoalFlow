import { Router, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest, requireAuth, requireRole } from '../middleware/auth';
import { writeAudit } from '../utils/audit';

const router = Router();

// POST /api/goals — Add goal to a sheet
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { goalSheetId, thrustArea, title, description, uomType, target, deadline, weightage } = req.body;

    const sheet = await prisma.goalSheet.findUnique({
      where: { id: goalSheetId },
      include: { goals: true },
    });

    if (!sheet) {
      res.status(404).json({ error: 'Goal sheet not found' });
      return;
    }

    // Only owner or manager can add goals
    if (sheet.userId !== req.user!.id && req.user!.role !== 'MANAGER' && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    if (sheet.status !== 'DRAFT' && sheet.status !== 'RETURNED') {
      res.status(400).json({ error: 'Can only add goals to DRAFT or RETURNED sheets' });
      return;
    }

    if (sheet.goals.length >= 8) {
      res.status(400).json({ error: 'Maximum 8 goals per sheet' });
      return;
    }

    if (weightage < 10) {
      res.status(400).json({ error: 'Minimum weightage is 10%' });
      return;
    }

    const goal = await prisma.goal.create({
      data: {
        goalSheetId,
        thrustArea,
        title,
        description: description || '',
        uomType,
        target: parseFloat(target),
        deadline: deadline ? new Date(deadline) : null,
        weightage: parseInt(weightage),
      },
    });

    res.status(201).json(goal);
  } catch (err) {
    console.error('Create goal error:', err);
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

// PUT /api/goals/:id — Update goal
router.put('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const goal = await prisma.goal.findUnique({
      where: { id: req.params.id },
      include: { goalSheet: true },
    });

    if (!goal) {
      res.status(404).json({ error: 'Goal not found' });
      return;
    }

    const sheet = goal.goalSheet;
    const isOwner = sheet.userId === req.user!.id;
    const isManagerOrAdmin = req.user!.role === 'MANAGER' || req.user!.role === 'ADMIN';

    // If sheet is locked, only admin can edit (and we audit it)
    if (sheet.status === 'LOCKED' || sheet.status === 'APPROVED') {
      if (req.user!.role !== 'ADMIN') {
        res.status(400).json({ error: 'Goals are locked. Only Admin can edit.' });
        return;
      }
      // Log audit for post-lock edits
      const changes = req.body;
      for (const [field, newVal] of Object.entries(changes)) {
        const oldVal = (goal as any)[field];
        if (oldVal !== undefined && String(oldVal) !== String(newVal)) {
          await writeAudit({
            userId: req.user!.id,
            goalId: goal.id,
            goalSheetId: sheet.id,
            action: 'GOAL_FIELD_EDITED_POST_LOCK',
            fieldName: field,
            oldValue: String(oldVal),
            newValue: String(newVal),
          });
        }
      }
    } else if (sheet.status === 'SUBMITTED') {
      // Manager can edit during review
      if (!isManagerOrAdmin) {
        res.status(400).json({ error: 'Sheet is submitted. Only manager can edit.' });
        return;
      }
    } else {
      // DRAFT or RETURNED — employee can edit
      if (!isOwner && !isManagerOrAdmin) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }
    }

    // For shared goals (non-primary), only weightage is editable
    if (goal.isShared && !goal.isPrimaryOwner) {
      const allowedFields = ['weightage'];
      const updateData: any = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = field === 'weightage' ? parseInt(req.body[field]) : req.body[field];
        }
      }
      const updated = await prisma.goal.update({
        where: { id: req.params.id },
        data: updateData,
      });
      res.json(updated);
      return;
    }

    const updateData: any = {};
    const fields = ['thrustArea', 'title', 'description', 'uomType', 'target', 'deadline', 'weightage'];
    for (const field of fields) {
      if (req.body[field] !== undefined) {
        if (field === 'target') updateData[field] = parseFloat(req.body[field]);
        else if (field === 'weightage') updateData[field] = parseInt(req.body[field]);
        else if (field === 'deadline') updateData[field] = req.body[field] ? new Date(req.body[field]) : null;
        else updateData[field] = req.body[field];
      }
    }

    const updated = await prisma.goal.update({
      where: { id: req.params.id },
      data: updateData,
    });

    res.json(updated);
  } catch (err) {
    console.error('Update goal error:', err);
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

// DELETE /api/goals/:id — Delete goal from draft sheet
router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const goal = await prisma.goal.findUnique({
      where: { id: req.params.id },
      include: { goalSheet: true },
    });

    if (!goal) {
      res.status(404).json({ error: 'Goal not found' });
      return;
    }

    if (goal.goalSheet.status !== 'DRAFT' && goal.goalSheet.status !== 'RETURNED') {
      res.status(400).json({ error: 'Can only delete goals from DRAFT or RETURNED sheets' });
      return;
    }

    if (goal.goalSheet.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    await prisma.goal.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

// POST /api/goals/shared — Admin/Manager: push shared goal to multiple employees
router.post('/shared', requireAuth, requireRole('MANAGER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { thrustArea, title, description, uomType, target, deadline, weightage, employeeIds } = req.body;

    if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      res.status(400).json({ error: 'employeeIds array is required' });
      return;
    }

    // Find active cycle
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
      res.status(400).json({ error: 'No active cycle found' });
      return;
    }

    const createdGoals = [];

    for (const employeeId of employeeIds) {
      // Find or create goal sheet for employee
      let sheet = await prisma.goalSheet.findFirst({
        where: { userId: employeeId, cycleId: cycle.id },
        include: { goals: true },
      });

      if (!sheet) {
        sheet = await prisma.goalSheet.create({
          data: { userId: employeeId, cycleId: cycle.id },
          include: { goals: true },
        });
      }

      if (sheet.goals.length >= 8) continue;

      const goal = await prisma.goal.create({
        data: {
          goalSheetId: sheet.id,
          thrustArea,
          title,
          description: description || '',
          uomType,
          target: parseFloat(target),
          deadline: deadline ? new Date(deadline) : null,
          weightage: parseInt(weightage),
          isShared: true,
          isPrimaryOwner: createdGoals.length === 0, // First one is primary
          sharedFromId: createdGoals.length > 0 ? createdGoals[0].id : null,
        },
      });

      createdGoals.push(goal);

      await writeAudit({
        userId: req.user!.id,
        goalId: goal.id,
        goalSheetId: sheet.id,
        action: 'SHARED_GOAL_PUSHED',
        newValue: `Shared to employee ${employeeId}`,
      });
    }

    // Update first goal's sharedFromId to null (it IS the primary)
    if (createdGoals.length > 0) {
      await prisma.goal.update({
        where: { id: createdGoals[0].id },
        data: { isPrimaryOwner: true },
      });
    }

    res.status(201).json(createdGoals);
  } catch (err) {
    console.error('Shared goal error:', err);
    res.status(500).json({ error: 'Failed to push shared goals' });
  }
});

export default router;
