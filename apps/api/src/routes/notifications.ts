import { Router, Response } from 'express';
import { AuthRequest, requireAuth, requireRole } from '../middleware/auth';
import { getNotificationLog, getNotificationConfig, sendTestEmail } from '../utils/notify';
import { checkAndFireEscalations } from '../jobs/escalationTrigger';

const router = Router();

// GET /api/notifications/log — Admin: view notification history
router.get('/log', requireAuth, requireRole('ADMIN'), (req: AuthRequest, res: Response) => {
  res.json(getNotificationLog());
});

// GET /api/notifications/config — Admin: check which providers are configured
router.get('/config', requireAuth, requireRole('ADMIN'), (req: AuthRequest, res: Response) => {
  res.json(getNotificationConfig());
});

// POST /api/notifications/test-email — Admin: send a SendGrid test email
router.post('/test-email', requireAuth, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  const to = String(req.body?.to || '').trim();
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    res.status(400).json({ error: 'Valid recipient email required' });
    return;
  }
  const result = await sendTestEmail(to);
  if (result.ok) {
    res.json({ ok: true, statusCode: result.statusCode, message: `Test email sent to ${to}` });
  } else {
    res.status(502).json({ ok: false, statusCode: result.statusCode, error: result.error });
  }
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
