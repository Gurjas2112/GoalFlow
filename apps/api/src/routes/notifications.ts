import { Router, Response } from 'express';
import { AuthRequest, requireAuth, requireRole } from '../middleware/auth';
import { getNotificationLog } from '../utils/notify';
import { checkAndFireEscalations } from '../jobs/escalationTrigger';

const router = Router();

// GET /api/notifications/log — Admin: view notification history
router.get('/log', requireAuth, requireRole('ADMIN'), (req: AuthRequest, res: Response) => {
  res.json(getNotificationLog());
});

// POST /api/notifications/trigger-escalations — Admin: manually trigger escalation check
router.post('/trigger-escalations', requireAuth, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const result = await checkAndFireEscalations();
    res.json({ message: 'Escalation check completed', ...result });
  } catch (err) {
    res.status(500).json({ error: 'Escalation check failed' });
  }
});

export default router;
