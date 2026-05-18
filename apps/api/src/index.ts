import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import authRouter from './routes/auth';
import usersRouter from './routes/users';
import goalSheetsRouter from './routes/goalSheets';
import goalsRouter from './routes/goals';
import achievementsRouter from './routes/achievements';
import checkInsRouter from './routes/checkIns';
import cyclesRouter from './routes/cycles';
import reportsRouter from './routes/reports';
import auditRouter from './routes/audit';
import escalationsRouter from './routes/escalations';
import analyticsRouter from './routes/analytics';
import ssoRouter from './routes/sso';
import notificationsRouter from './routes/notifications';
import { startEscalationJob } from './jobs/escalationTrigger';
import { syncAzureADUsers } from './services/azureSync';

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/auth', ssoRouter);
app.use('/api/users', usersRouter);
app.use('/api/goal-sheets', goalSheetsRouter);
app.use('/api/goals', goalsRouter);
app.use('/api/achievements', achievementsRouter);
app.use('/api/check-ins', checkInsRouter);
app.use('/api/cycles', cyclesRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/audit', auditRouter);
app.use('/api/escalations', escalationsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/notifications', notificationsRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ GoalFlow API running on port ${PORT}`);

  // Start escalation trigger job (runs every 60 minutes)
  startEscalationJob();

  // Auto-sync Azure AD users on startup
  syncAzureADUsers().catch((err) => {
    console.error('⚠️ Azure AD sync on startup failed:', err);
    console.log('💡 You can manually sync using: POST /api/users/sync/azure');
  });
});

export default app;

