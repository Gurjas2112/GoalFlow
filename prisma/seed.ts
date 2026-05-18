import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding GoalFlow demo data...');

  // ── Departments ────────────────────────────────────────────────────
  const [engineering, sales, operations, hr, finance] = await Promise.all([
    prisma.department.upsert({ where: { name: 'Engineering' }, update: {}, create: { name: 'Engineering' } }),
    prisma.department.upsert({ where: { name: 'Sales' },       update: {}, create: { name: 'Sales' } }),
    prisma.department.upsert({ where: { name: 'Operations' },  update: {}, create: { name: 'Operations' } }),
    prisma.department.upsert({ where: { name: 'HR' },          update: {}, create: { name: 'HR' } }),
    prisma.department.upsert({ where: { name: 'Finance' },     update: {}, create: { name: 'Finance' } }),
  ]);

  // ── Users (matches LoginPage Quick Demo buttons) ───────────────────
  const pwHash = await bcrypt.hash('Demo@123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@goalflow.demo' },
    update: { role: 'ADMIN', departmentId: hr.id },
    create: { name: 'Demo Admin', email: 'admin@goalflow.demo', passwordHash: pwHash, role: 'ADMIN', departmentId: hr.id },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@goalflow.demo' },
    update: { role: 'MANAGER', departmentId: engineering.id },
    create: { name: 'Demo Manager', email: 'manager@goalflow.demo', passwordHash: pwHash, role: 'MANAGER', departmentId: engineering.id },
  });

  const emp1 = await prisma.user.upsert({
    where: { email: 'emp1@goalflow.demo' },
    update: { role: 'EMPLOYEE', departmentId: engineering.id, managerId: manager.id },
    create: { name: 'Demo Employee 1', email: 'emp1@goalflow.demo', passwordHash: pwHash, role: 'EMPLOYEE', departmentId: engineering.id, managerId: manager.id },
  });

  const emp2 = await prisma.user.upsert({
    where: { email: 'emp2@goalflow.demo' },
    update: { role: 'EMPLOYEE', departmentId: engineering.id, managerId: manager.id },
    create: { name: 'Demo Employee 2', email: 'emp2@goalflow.demo', passwordHash: pwHash, role: 'EMPLOYEE', departmentId: engineering.id, managerId: manager.id },
  });

  // Legacy admin entry kept for backward compatibility with any existing data
  await prisma.user.upsert({
    where: { email: 'demo-admin@goalflow.test' },
    update: {},
    create: { name: 'Legacy Admin', email: 'demo-admin@goalflow.test', passwordHash: pwHash, role: 'ADMIN', departmentId: hr.id },
  });

  // ── Active GoalCycle (override = freshly opened for demos) ─────────
  const year = new Date().getFullYear();
  const openDate = new Date(year, 0, 1);
  const closeDate = new Date(year, 11, 31);

  // We want a single canonical active cycle. Since there is no unique constraint on (phase, year),
  // look it up first and create only if missing.
  let cycle = await prisma.goalCycle.findFirst({ where: { phase: 'GOAL_SETTING', year, isOverride: true } });
  if (!cycle) {
    cycle = await prisma.goalCycle.create({
      data: { phase: 'GOAL_SETTING', year, openDate, closeDate, isOverride: true },
    });
  }

  // ── Quarterly check-in windows (per BRD §2.3) ──────────────────────
  // Phase 1   — 1 May  → 30 Jun  (year N)
  // Q1        — 1 Jul  → 30 Sep  (year N)
  // Q2        — 1 Oct  → 31 Dec  (year N)
  // Q3        — 1 Jan  → 28 Feb  (year N+1)
  // Q4/Annual — 1 Mar  → 30 Apr  (year N+1)
  //
  // These are seeded without isOverride so they auto-activate by date.
  // Admins can still flip an override on any one of them via the Cycles page.
  const quarterlyWindows: Array<{
    phase: 'Q1' | 'Q2' | 'Q3' | 'Q4';
    year: number;
    openDate: Date;
    closeDate: Date;
  }> = [
    { phase: 'Q1', year,     openDate: new Date(year, 6, 1),  closeDate: new Date(year, 8, 30) },   // Jul–Sep
    { phase: 'Q2', year,     openDate: new Date(year, 9, 1),  closeDate: new Date(year, 11, 31) },  // Oct–Dec
    { phase: 'Q3', year: year + 1, openDate: new Date(year + 1, 0, 1), closeDate: new Date(year + 1, 1, 28) },   // Jan–Feb (next FY)
    { phase: 'Q4', year: year + 1, openDate: new Date(year + 1, 2, 1), closeDate: new Date(year + 1, 3, 30) },   // Mar–Apr (next FY)
  ];

  for (const w of quarterlyWindows) {
    const existing = await prisma.goalCycle.findFirst({
      where: { phase: w.phase, year: w.year },
    });
    if (!existing) {
      await prisma.goalCycle.create({
        data: {
          phase: w.phase,
          year: w.year,
          openDate: w.openDate,
          closeDate: w.closeDate,
          isOverride: false,
        },
      });
    }
  }

  // ── Escalation rules ───────────────────────────────────────────────
  const existingRules = await prisma.escalationRule.count();
  if (existingRules === 0) {
    await prisma.escalationRule.createMany({
      data: [
        // NOTE: eventType strings must match those handled in
        // apps/api/src/jobs/escalationTrigger.ts. Keep these in sync.
        { eventType: 'GOAL_NOT_SUBMITTED', triggerAfterDays: 7,  notifyRole: 'MANAGER', isActive: true },
        { eventType: 'GOAL_NOT_APPROVED',  triggerAfterDays: 3,  notifyRole: 'ADMIN',   isActive: true },
        { eventType: 'CHECKIN_NOT_DONE',   triggerAfterDays: 14, notifyRole: 'MANAGER', isActive: true },
      ],
    });
  }

  // ── Sample goal sheets ─────────────────────────────────────────────
  // emp1: APPROVED + LOCKED sheet with two goals — demonstrates lock/audit
  let sheet1 = await prisma.goalSheet.findFirst({ where: { userId: emp1.id, cycleId: cycle.id } });
  if (!sheet1) {
    sheet1 = await prisma.goalSheet.create({
      data: {
        userId: emp1.id,
        cycleId: cycle.id,
        status: 'LOCKED',
        submittedAt: new Date(),
        approvedAt: new Date(),
        lockedAt: new Date(),
        goals: {
          create: [
            { thrustArea: 'Delivery',  title: 'Ship feature X', description: 'Launch by Q2',   uomType: 'TIMELINE',     target: 100, weightage: 60 },
            { thrustArea: 'Quality',   title: 'Reduce bugs',    description: 'Bug count < 5',  uomType: 'NUMERIC_MIN',  target: 5,   weightage: 40 },
          ],
        },
      },
    });
  }

  // emp2: DRAFT sheet — demonstrates the create/submit flow
  let sheet2 = await prisma.goalSheet.findFirst({ where: { userId: emp2.id, cycleId: cycle.id } });
  if (!sheet2) {
    sheet2 = await prisma.goalSheet.create({
      data: {
        userId: emp2.id,
        cycleId: cycle.id,
        status: 'DRAFT',
        goals: {
          create: [
            { thrustArea: 'Growth',  title: 'Customer onboarding', description: 'Onboard 10+ accounts', uomType: 'NUMERIC_MAX', target: 10, weightage: 100 },
          ],
        },
      },
    });
  }

  console.log('✅ Seed complete!');
  console.log('');
  console.log('📋 Demo credentials (password: Demo@123):');
  console.log('  Admin    → admin@goalflow.demo');
  console.log('  Manager  → manager@goalflow.demo');
  console.log('  Employee → emp1@goalflow.demo (has locked sheet)');
  console.log('  Employee → emp2@goalflow.demo (has draft sheet)');
  console.log('');
  console.log(`🗓️  Active cycle: GOAL_SETTING ${year} (override)`);
  console.log('🚨 Escalation rules: 3 active');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
