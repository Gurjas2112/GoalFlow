/**
 * Escalation Trigger Job
 * Runs periodically to evaluate escalation rules and fire escalations
 * for overdue goals, unapproved sheets, and missed check-ins.
 */
import prisma from '../prisma';

export async function checkAndFireEscalations() {
  const now = new Date();

  // Fetch all active rules
  const rules = await prisma.escalationRule.findMany({
    where: { isActive: true },
  });

  let totalCreated = 0;

  for (const rule of rules) {
    const cutoff = new Date(now.getTime() - rule.triggerAfterDays * 24 * 60 * 60 * 1000);

    if (rule.eventType === 'GOAL_NOT_SUBMITTED') {
      // Find employees with DRAFT sheets created before cutoff
      const staleSheets = await prisma.goalSheet.findMany({
        where: {
          status: 'DRAFT',
          createdAt: { lte: cutoff },
        },
        include: { user: true },
      });

      for (const sheet of staleSheets) {
        // Check if escalation already exists for this user + reason
        const existing = await prisma.escalation.findFirst({
          where: {
            userId: sheet.userId,
            reason: `GOAL_NOT_SUBMITTED_${rule.triggerAfterDays}D`,
            status: 'OPEN',
          },
        });
        if (existing) continue;

        await prisma.escalation.create({
          data: {
            userId: sheet.userId,
            ruleId: rule.id,
            reason: `GOAL_NOT_SUBMITTED_${rule.triggerAfterDays}D`,
            status: 'OPEN',
          },
        });
        totalCreated++;
        console.log(`⚠️ Escalation: ${sheet.user.name} has not submitted goals (${rule.triggerAfterDays}d overdue)`);
      }
    }

    if (rule.eventType === 'GOAL_NOT_APPROVED') {
      // Find SUBMITTED sheets older than cutoff
      const staleSheets = await prisma.goalSheet.findMany({
        where: {
          status: 'SUBMITTED',
          submittedAt: { lte: cutoff },
        },
        include: { user: { include: { manager: true } } },
      });

      for (const sheet of staleSheets) {
        const targetUserId = sheet.user.managerId || sheet.userId;
        const existing = await prisma.escalation.findFirst({
          where: {
            userId: targetUserId,
            reason: `GOAL_NOT_APPROVED_${rule.triggerAfterDays}D`,
            status: 'OPEN',
          },
        });
        if (existing) continue;

        await prisma.escalation.create({
          data: {
            userId: targetUserId,
            ruleId: rule.id,
            reason: `GOAL_NOT_APPROVED_${rule.triggerAfterDays}D`,
            status: 'OPEN',
          },
        });
        totalCreated++;
        console.log(`⚠️ Escalation: ${sheet.user.name}'s goals not approved by manager (${rule.triggerAfterDays}d overdue)`);
      }
    }

    if (rule.eventType === 'CHECKIN_NOT_DONE') {
      // Find LOCKED sheets in active check-in cycle without check-ins
      const activeCycle = await prisma.goalCycle.findFirst({
        where: {
          phase: { in: ['Q1', 'Q2', 'Q3', 'Q4'] },
          openDate: { lte: now },
          closeDate: { gte: now },
        },
      });

      if (activeCycle) {
        const cycleOpenedAgo = new Date(activeCycle.openDate.getTime() + rule.triggerAfterDays * 24 * 60 * 60 * 1000);
        if (now >= cycleOpenedAgo) {
          const sheetsWithoutCheckin = await prisma.goalSheet.findMany({
            where: {
              status: 'LOCKED',
              checkIns: { none: { cycleId: activeCycle.id } },
            },
            include: { user: true },
          });

          for (const sheet of sheetsWithoutCheckin) {
            const existing = await prisma.escalation.findFirst({
              where: {
                userId: sheet.userId,
                reason: `CHECKIN_NOT_DONE_${rule.triggerAfterDays}D`,
                status: 'OPEN',
              },
            });
            if (existing) continue;

            await prisma.escalation.create({
              data: {
                userId: sheet.userId,
                ruleId: rule.id,
                reason: `CHECKIN_NOT_DONE_${rule.triggerAfterDays}D`,
                status: 'OPEN',
              },
            });
            totalCreated++;
            console.log(`⚠️ Escalation: ${sheet.user.name} has not completed check-in (${rule.triggerAfterDays}d overdue)`);
          }
        }
      }
    }
  }

  return { processed: rules.length, escalationsCreated: totalCreated, timestamp: now.toISOString() };
}

// Start the recurring job
export function startEscalationJob(intervalMs = 60 * 60 * 1000) {
  // Run once on startup (after 10s delay to let DB connect)
  setTimeout(() => {
    checkAndFireEscalations()
      .then(result => console.log('✅ Escalation check completed:', result))
      .catch(err => console.error('❌ Escalation check failed:', err));
  }, 10000);

  // Then run every hour
  const interval = setInterval(() => {
    checkAndFireEscalations()
      .then(result => console.log('✅ Escalation check completed:', result))
      .catch(err => console.error('❌ Escalation check failed:', err));
  }, intervalMs);

  console.log(`🔔 Escalation trigger job started (interval: ${intervalMs / 60000} mins)`);
  return interval;
}
