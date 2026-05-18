import { PrismaClient } from '@prisma/client';
const bcrypt = require('bcryptjs');

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

  // ── Escalation rules ───────────────────────────────────────────────
  const existingRules = await prisma.escalationRule.count();
  if (existingRules === 0) {
    await prisma.escalationRule.createMany({
      data: [
        { eventType: 'GOAL_SHEET_NOT_SUBMITTED', triggerAfterDays: 7,  notifyRole: 'MANAGER', isActive: true },
        { eventType: 'GOAL_SHEET_NOT_APPROVED',  triggerAfterDays: 3,  notifyRole: 'ADMIN',   isActive: true },
        { eventType: 'CHECKIN_OVERDUE',          triggerAfterDays: 14, notifyRole: 'MANAGER', isActive: true },
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
