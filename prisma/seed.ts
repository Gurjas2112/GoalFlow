import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create departments
  const engineering = await prisma.department.upsert({
    where: { name: 'Engineering' },
    update: {},
    create: { name: 'Engineering' },
  });

  const sales = await prisma.department.upsert({
    where: { name: 'Sales' },
    update: {},
    create: { name: 'Sales' },
  });

  const operations = await prisma.department.upsert({
    where: { name: 'Operations' },
    update: {},
    create: { name: 'Operations' },
  });

  const hr = await prisma.department.upsert({
    where: { name: 'HR' },
    update: {},
    create: { name: 'HR' },
  });

  // Hash passwords
  const adminHash = await bcrypt.hash('Admin@123', 10);
  const managerHash = await bcrypt.hash('Manager@123', 10);
  const empHash = await bcrypt.hash('Emp@123', 10);

  // Create admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@goalflow.demo' },
    update: {},
    create: {
      name: 'Anita Sharma',
      email: 'admin@goalflow.demo',
      passwordHash: adminHash,
      role: 'ADMIN',
      departmentId: hr.id,
    },
  });

  // Create manager
  const manager = await prisma.user.upsert({
    where: { email: 'manager@goalflow.demo' },
    update: {},
    create: {
      name: 'Rahul Mehta',
      email: 'manager@goalflow.demo',
      passwordHash: managerHash,
      role: 'MANAGER',
      departmentId: engineering.id,
    },
  });

  // Create employees
  const emp1 = await prisma.user.upsert({
    where: { email: 'emp1@goalflow.demo' },
    update: {},
    create: {
      name: 'Priya Patel',
      email: 'emp1@goalflow.demo',
      passwordHash: empHash,
      role: 'EMPLOYEE',
      departmentId: engineering.id,
      managerId: manager.id,
    },
  });

  const emp2 = await prisma.user.upsert({
    where: { email: 'emp2@goalflow.demo' },
    update: {},
    create: {
      name: 'Arjun Singh',
      email: 'emp2@goalflow.demo',
      passwordHash: empHash,
      role: 'EMPLOYEE',
      departmentId: engineering.id,
      managerId: manager.id,
    },
  });

  // Create a Sales manager and employee for variety
  const salesManager = await prisma.user.upsert({
    where: { email: 'salesmgr@goalflow.demo' },
    update: {},
    create: {
      name: 'Kavita Rao',
      email: 'salesmgr@goalflow.demo',
      passwordHash: managerHash,
      role: 'MANAGER',
      departmentId: sales.id,
    },
  });

  const salesEmp = await prisma.user.upsert({
    where: { email: 'sales1@goalflow.demo' },
    update: {},
    create: {
      name: 'Vikram Desai',
      email: 'sales1@goalflow.demo',
      passwordHash: empHash,
      role: 'EMPLOYEE',
      departmentId: sales.id,
      managerId: salesManager.id,
    },
  });

  // Create Goal Cycles
  const goalSettingCycle = await prisma.goalCycle.create({
    data: {
      phase: 'GOAL_SETTING',
      year: 2025,
      openDate: new Date('2025-05-01'),
      closeDate: new Date('2025-05-31'),
      isOverride: true, // Always open for demo
    },
  });

  const q1Cycle = await prisma.goalCycle.create({
    data: {
      phase: 'Q1',
      year: 2025,
      openDate: new Date('2025-07-01'),
      closeDate: new Date('2025-07-31'),
      isOverride: false,
    },
  });

  const q2Cycle = await prisma.goalCycle.create({
    data: {
      phase: 'Q2',
      year: 2025,
      openDate: new Date('2025-10-01'),
      closeDate: new Date('2025-10-31'),
      isOverride: false,
    },
  });

  const q3Cycle = await prisma.goalCycle.create({
    data: {
      phase: 'Q3',
      year: 2026,
      openDate: new Date('2026-01-01'),
      closeDate: new Date('2026-01-31'),
      isOverride: false,
    },
  });

  const q4Cycle = await prisma.goalCycle.create({
    data: {
      phase: 'Q4',
      year: 2026,
      openDate: new Date('2026-03-01'),
      closeDate: new Date('2026-04-30'),
      isOverride: false,
    },
  });

  // Create sample goal sheet for emp1 (LOCKED — ready for check-in demo)
  const sheet1 = await prisma.goalSheet.create({
    data: {
      userId: emp1.id,
      cycleId: goalSettingCycle.id,
      status: 'LOCKED',
      submittedAt: new Date('2025-05-05'),
      approvedAt: new Date('2025-05-07'),
      lockedAt: new Date('2025-05-07'),
    },
  });

  // Create 4 goals for emp1
  const goal1 = await prisma.goal.create({
    data: {
      goalSheetId: sheet1.id,
      thrustArea: 'Revenue',
      title: 'Increase quarterly product revenue',
      description: 'Drive product revenue growth through feature launches and customer engagement',
      uomType: 'NUMERIC_MIN',
      target: 1000000,
      weightage: 30,
    },
  });

  const goal2 = await prisma.goal.create({
    data: {
      goalSheetId: sheet1.id,
      thrustArea: 'Efficiency',
      title: 'Reduce average turnaround time',
      description: 'Optimize processes to reduce TAT for customer deliverables',
      uomType: 'NUMERIC_MAX',
      target: 24,
      weightage: 25,
    },
  });

  const goal3 = await prisma.goal.create({
    data: {
      goalSheetId: sheet1.id,
      thrustArea: 'Delivery',
      title: 'Launch v2.0 platform',
      description: 'Complete and launch the v2.0 platform with all P0 features',
      uomType: 'TIMELINE',
      target: 0,
      deadline: new Date('2025-09-30'),
      weightage: 25,
    },
  });

  const goal4 = await prisma.goal.create({
    data: {
      goalSheetId: sheet1.id,
      thrustArea: 'Safety',
      title: 'Zero production incidents',
      description: 'Maintain zero critical production incidents throughout the quarter',
      uomType: 'ZERO',
      target: 0,
      weightage: 20,
    },
  });

  // Create sample achievements for Q1 (to show in reports)
  await prisma.achievement.create({
    data: {
      goalId: goal1.id,
      cycleId: q1Cycle.id,
      actual: 850000,
      status: 'ON_TRACK',
      score: 0.85,
    },
  });

  await prisma.achievement.create({
    data: {
      goalId: goal2.id,
      cycleId: q1Cycle.id,
      actual: 28,
      status: 'ON_TRACK',
      score: 0.857,
    },
  });

  // Create a shared goal pushed from manager to both employees
  const sharedGoalPrimary = await prisma.goal.create({
    data: {
      goalSheetId: sheet1.id,
      thrustArea: 'Customer Satisfaction',
      title: 'Achieve NPS score of 70+',
      description: 'Department-wide KPI for customer satisfaction',
      uomType: 'NUMERIC_MIN',
      target: 70,
      weightage: 0, // Will be adjusted by employees (not counted until they set it)
      isShared: true,
      isPrimaryOwner: true,
    },
  });

  // Create sheet for emp2 (DRAFT — for goal creation demo)
  const sheet2 = await prisma.goalSheet.create({
    data: {
      userId: emp2.id,
      cycleId: goalSettingCycle.id,
      status: 'DRAFT',
    },
  });

  // Add shared goal copy for emp2
  await prisma.goal.create({
    data: {
      goalSheetId: sheet2.id,
      thrustArea: 'Customer Satisfaction',
      title: 'Achieve NPS score of 70+',
      description: 'Department-wide KPI for customer satisfaction',
      uomType: 'NUMERIC_MIN',
      target: 70,
      weightage: 0,
      isShared: true,
      isPrimaryOwner: false,
      sharedFromId: sharedGoalPrimary.id,
    },
  });

  // Create check-in from manager for emp1
  await prisma.checkIn.create({
    data: {
      goalSheetId: sheet1.id,
      managerId: manager.id,
      cycleId: q1Cycle.id,
      comment: 'Good progress on revenue targets. TAT needs improvement — let\'s discuss process optimizations. Platform launch is on track.',
    },
  });

  // Create escalation rules
  await prisma.escalationRule.createMany({
    data: [
      { eventType: 'GOAL_NOT_SUBMITTED', triggerAfterDays: 7, notifyRole: 'EMPLOYEE', isActive: true },
      { eventType: 'GOAL_NOT_SUBMITTED', triggerAfterDays: 14, notifyRole: 'MANAGER', isActive: true },
      { eventType: 'GOAL_NOT_APPROVED', triggerAfterDays: 5, notifyRole: 'MANAGER', isActive: true },
      { eventType: 'GOAL_NOT_APPROVED', triggerAfterDays: 10, notifyRole: 'ADMIN', isActive: true },
      { eventType: 'CHECKIN_NOT_DONE', triggerAfterDays: 7, notifyRole: 'EMPLOYEE', isActive: true },
    ],
  });

  // Create audit log entries for demo
  await prisma.auditLog.create({
    data: {
      userId: manager.id,
      goalSheetId: sheet1.id,
      action: 'GOAL_SHEET_APPROVED',
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: emp1.id,
      goalSheetId: sheet1.id,
      action: 'GOAL_SHEET_SUBMITTED',
    },
  });

  // Create a SUBMITTED sheet for salesEmp (manager can demo approve flow)
  const salesSheet = await prisma.goalSheet.create({
    data: {
      userId: salesEmp.id,
      cycleId: goalSettingCycle.id,
      status: 'SUBMITTED',
      submittedAt: new Date('2026-05-15'),
    },
  });

  await prisma.goal.createMany({
    data: [
      {
        goalSheetId: salesSheet.id,
        thrustArea: 'Revenue',
        title: 'New client acquisition',
        description: 'Sign 10 new enterprise contracts in Q1',
        uomType: 'NUMERIC_MIN',
        target: 10,
        weightage: 35,
      },
      {
        goalSheetId: salesSheet.id,
        thrustArea: 'Customer Satisfaction',
        title: 'Client retention rate',
        description: 'Maintain 95%+ client retention rate',
        uomType: 'NUMERIC_MIN',
        target: 95,
        weightage: 25,
      },
      {
        goalSheetId: salesSheet.id,
        thrustArea: 'Efficiency',
        title: 'Reduce sales cycle time',
        description: 'Average deal closure within 30 days',
        uomType: 'NUMERIC_MAX',
        target: 30,
        weightage: 20,
      },
      {
        goalSheetId: salesSheet.id,
        thrustArea: 'Innovation',
        title: 'Launch partner program',
        description: 'Design and launch channel partner program by Aug 31',
        uomType: 'TIMELINE',
        target: 0,
        deadline: new Date('2026-08-31'),
        weightage: 20,
      },
    ],
  });

  // Create Q2 achievements for emp1 (shows QoQ trend in analytics)
  await prisma.achievement.create({
    data: {
      goalId: goal1.id,
      cycleId: q2Cycle.id,
      actual: 920000,
      status: 'ON_TRACK',
      score: 0.92,
    },
  });

  await prisma.achievement.create({
    data: {
      goalId: goal2.id,
      cycleId: q2Cycle.id,
      actual: 22,
      status: 'COMPLETED',
      score: 1.0,
    },
  });

  await prisma.achievement.create({
    data: {
      goalId: goal4.id,
      cycleId: q1Cycle.id,
      actual: 1,
      status: 'ON_TRACK',
      score: 0.8,
    },
  });

  // Create sample escalation events for demo
  await prisma.escalation.create({
    data: {
      userId: emp2.id,
      reason: 'GOAL_NOT_SUBMITTED_7D',
      status: 'OPEN',
    },
  });

  await prisma.escalation.create({
    data: {
      userId: manager.id,
      reason: 'GOAL_NOT_APPROVED_5D',
      status: 'RESOLVED',
      resolvedAt: new Date('2026-05-12'),
    },
  });

  console.log('✅ Seed complete!');
  console.log('');
  console.log('📋 Demo credentials:');
  console.log('  Admin:       admin@goalflow.demo / Admin@123');
  console.log('  Manager:     manager@goalflow.demo / Manager@123');
  console.log('  Sales Mgr:   salesmgr@goalflow.demo / Manager@123');
  console.log('  Employee 1:  emp1@goalflow.demo / Emp@123  (LOCKED sheet — check-in ready)');
  console.log('  Employee 2:  emp2@goalflow.demo / Emp@123  (DRAFT sheet — creation demo)');
  console.log('  Sales Emp:   sales1@goalflow.demo / Emp@123 (SUBMITTED — approval demo)');
  console.log('');
  console.log('🎯 Demo flow:');
  console.log('  1. Login as emp1 → See locked goals + achievements');
  console.log('  2. Login as manager → See team + approve salesEmp sheet');
  console.log('  3. Login as admin → Analytics + escalations + audit log');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
