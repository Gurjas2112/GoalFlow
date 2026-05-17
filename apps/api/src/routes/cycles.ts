import { Router, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest, requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// GET /api/cycles/active — Return currently open cycle
router.get('/active', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
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
    res.json(cycle);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch active cycle' });
  }
});

// GET /api/cycles — Admin: list all cycles
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const cycles = await prisma.goalCycle.findMany({
      orderBy: [{ year: 'desc' }, { openDate: 'desc' }],
    });
    res.json(cycles);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch cycles' });
  }
});

// POST /api/cycles — Admin: create new cycle
router.post('/', requireAuth, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { phase, year, openDate, closeDate, isOverride } = req.body;
    if (!phase || !year || !openDate || !closeDate) {
      res.status(400).json({ error: 'phase, year, openDate, closeDate are required' });
      return;
    }

    const cycle = await prisma.goalCycle.create({
      data: {
        phase,
        year: parseInt(year),
        openDate: new Date(openDate),
        closeDate: new Date(closeDate),
        isOverride: isOverride || false,
      },
    });

    res.status(201).json(cycle);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create cycle' });
  }
});

// PUT /api/cycles/:id — Admin: update cycle
router.put('/:id', requireAuth, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { phase, year, openDate, closeDate, isOverride } = req.body;
    const cycle = await prisma.goalCycle.update({
      where: { id: req.params.id },
      data: {
        ...(phase && { phase }),
        ...(year && { year: parseInt(year) }),
        ...(openDate && { openDate: new Date(openDate) }),
        ...(closeDate && { closeDate: new Date(closeDate) }),
        ...(isOverride !== undefined && { isOverride }),
      },
    });
    res.json(cycle);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update cycle' });
  }
});

// POST /api/cycles/:id/override — Admin: force-open a cycle
router.post('/:id/override', requireAuth, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    // Turn off all other overrides
    await prisma.goalCycle.updateMany({
      where: { isOverride: true },
      data: { isOverride: false },
    });

    const cycle = await prisma.goalCycle.update({
      where: { id: req.params.id },
      data: { isOverride: true },
    });

    res.json(cycle);
  } catch (err) {
    res.status(500).json({ error: 'Failed to override cycle' });
  }
});

export default router;
