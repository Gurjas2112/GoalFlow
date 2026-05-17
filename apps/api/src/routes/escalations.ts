import { Router, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest, requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// GET /api/escalations — Admin: list open escalations
router.get('/', requireAuth, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const status = (req.query.status as string) || 'OPEN';
    const escalations = await prisma.escalation.findMany({
      where: { status: status as any },
      include: { user: { select: { name: true, email: true, department: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(escalations);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch escalations' });
  }
});

// PUT /api/escalations/:id/resolve — Admin: mark resolved
router.put('/:id/resolve', requireAuth, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const escalation = await prisma.escalation.update({
      where: { id: req.params.id },
      data: { status: 'RESOLVED', resolvedAt: new Date() },
    });
    res.json(escalation);
  } catch (err) {
    res.status(500).json({ error: 'Failed to resolve escalation' });
  }
});

// GET /api/escalations/rules — Admin: list escalation rules
router.get('/rules', requireAuth, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const rules = await prisma.escalationRule.findMany({
      orderBy: { eventType: 'asc' },
    });
    res.json(rules);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch escalation rules' });
  }
});

// POST /api/escalations/rules — Admin: create rule
router.post('/rules', requireAuth, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { eventType, triggerAfterDays, notifyRole, isActive } = req.body;
    const rule = await prisma.escalationRule.create({
      data: {
        eventType,
        triggerAfterDays: parseInt(triggerAfterDays),
        notifyRole,
        isActive: isActive !== undefined ? isActive : true,
      },
    });
    res.status(201).json(rule);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create escalation rule' });
  }
});

// PUT /api/escalations/rules/:id — Admin: update rule
router.put('/rules/:id', requireAuth, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { triggerAfterDays, notifyRole, isActive } = req.body;
    const rule = await prisma.escalationRule.update({
      where: { id: req.params.id },
      data: {
        ...(triggerAfterDays !== undefined && { triggerAfterDays: parseInt(triggerAfterDays) }),
        ...(notifyRole && { notifyRole }),
        ...(isActive !== undefined && { isActive }),
      },
    });
    res.json(rule);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update escalation rule' });
  }
});

export default router;
