import { Router, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest, requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// POST /api/check-ins — Manager: create check-in comment
router.post('/', requireAuth, requireRole('MANAGER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { goalSheetId, cycleId, comment } = req.body;
    if (!goalSheetId || !comment) {
      res.status(400).json({ error: 'goalSheetId and comment are required' });
      return;
    }

    // Determine cycle
    let cId = cycleId;
    if (!cId) {
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
      cId = cycle?.id;
    }

    if (!cId) {
      res.status(400).json({ error: 'No active cycle found' });
      return;
    }

    const checkIn = await prisma.checkIn.create({
      data: {
        goalSheetId,
        managerId: req.user!.id,
        cycleId: cId,
        comment,
      },
      include: {
        manager: { select: { name: true } },
      },
    });

    res.status(201).json(checkIn);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create check-in' });
  }
});

// GET /api/check-ins/:goalSheetId — Get check-in history
router.get('/:goalSheetId', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const checkIns = await prisma.checkIn.findMany({
      where: { goalSheetId: req.params.goalSheetId },
      include: {
        manager: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(checkIns);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch check-ins' });
  }
});

export default router;
