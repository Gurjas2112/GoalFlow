// Email notification via SendGrid + Teams webhook
import https from 'https';
import http from 'http';

// ═══ SENDGRID EMAIL ═══
export async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) return;

  const data = JSON.stringify({
    personalizations: [{ to: [{ email: to }] }],
    from: { email: process.env.SENDGRID_FROM_EMAIL || 'noreply@goalflow.demo', name: 'GoalFlow' },
    subject,
    content: [{ type: 'text/html', value: html }],
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.sendgrid.com', path: '/v3/mail/send', method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Content-Length': data.length },
    }, (res) => { res.on('data', () => {}); res.on('end', () => resolve(res.statusCode)); });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// ═══ TEAMS WEBHOOK ═══
export async function sendTeamsNotification(title: string, message: string, deepLink?: string) {
  const webhookUrl = process.env.TEAMS_WEBHOOK_URL;
  if (!webhookUrl) return;

  const card = {
    '@type': 'MessageCard', '@context': 'http://schema.org/extensions',
    themeColor: '6366f1', summary: title,
    sections: [{
      activityTitle: `🎯 GoalFlow: ${title}`,
      activitySubtitle: new Date().toLocaleString(),
      text: message,
    }],
    potentialAction: deepLink ? [{
      '@type': 'OpenUri', name: 'Open in GoalFlow',
      targets: [{ os: 'default', uri: deepLink }],
    }] : [],
  };

  const url = new URL(webhookUrl);
  const data = JSON.stringify(card);
  const mod = url.protocol === 'https:' ? https : http;

  return new Promise((resolve, reject) => {
    const req = mod.request({
      hostname: url.hostname, path: url.pathname + url.search, method: 'POST', port: url.port || (url.protocol === 'https:' ? 443 : 80),
      headers: { 'Content-Type': 'application/json', 'Content-Length': data.length },
    }, (res) => { res.on('data', () => {}); res.on('end', () => resolve(res.statusCode)); });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// ═══ NOTIFICATION PRESETS ═══
const baseUrl = () => process.env.APP_BASE_URL || 'http://localhost:5173';

export async function notifyGoalSubmitted(employeeName: string, managerEmail: string, sheetId: string) {
  const link = `${baseUrl()}/manager/sheet/${sheetId}`;
  await sendEmail(managerEmail, `${employeeName} submitted goals for review`,
    `<h2>Goal Sheet Submitted</h2><p><strong>${employeeName}</strong> has submitted their goal sheet for your review.</p><p><a href="${link}" style="background:#6366f1;color:white;padding:10px 20px;border-radius:8px;text-decoration:none">Review Goals →</a></p>`
  );
  await sendTeamsNotification('Goals Submitted', `**${employeeName}** submitted their goal sheet for review.`, link);
}

export async function notifyGoalApproved(employeeName: string, employeeEmail: string) {
  await sendEmail(employeeEmail, 'Your goals have been approved & locked',
    `<h2>Goals Approved ✅</h2><p>Hi <strong>${employeeName}</strong>, your goal sheet has been approved and locked by your manager.</p><p><a href="${baseUrl()}/employee/goals" style="background:#34d399;color:white;padding:10px 20px;border-radius:8px;text-decoration:none">View Goals →</a></p>`
  );
  await sendTeamsNotification('Goals Approved', `**${employeeName}**'s goals have been approved and locked.`);
}

export async function notifyGoalReturned(employeeName: string, employeeEmail: string, reason: string) {
  await sendEmail(employeeEmail, 'Your goals need revision',
    `<h2>Goals Returned 🔄</h2><p>Hi <strong>${employeeName}</strong>, your manager has returned your goal sheet with feedback:</p><blockquote>${reason}</blockquote><p><a href="${baseUrl()}/employee/goals" style="background:#f59e0b;color:white;padding:10px 20px;border-radius:8px;text-decoration:none">Edit Goals →</a></p>`
  );
  await sendTeamsNotification('Goals Returned', `**${employeeName}**'s goals need revision: ${reason}`);
}

export async function notifyCheckInReminder(employeeName: string, employeeEmail: string) {
  await sendEmail(employeeEmail, 'Quarterly check-in reminder',
    `<h2>Check-in Reminder ⏰</h2><p>Hi <strong>${employeeName}</strong>, please complete your quarterly goal check-in.</p><p><a href="${baseUrl()}/employee/checkin" style="background:#6366f1;color:white;padding:10px 20px;border-radius:8px;text-decoration:none">Log Check-in →</a></p>`
  );
}
