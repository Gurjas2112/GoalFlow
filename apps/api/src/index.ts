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

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRouter);
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

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ GoalFlow API running on port ${PORT}`);
});

export default app;
