/**
 * Notification utilities with retry logic and in-memory logging.
 * Supports SendGrid email and Microsoft Teams webhooks.
 * Notifications are non-blocking — app works fully without them configured.
 */
import https from 'https';
import http from 'http';

// ═══ NOTIFICATION LOG ═══
interface NotificationLog {
  event: string;
  recipient: string;
  channel: 'EMAIL' | 'TEAMS';
  status: 'SUCCESS' | 'FAILED' | 'RETRYING';
  attempt: number;
  error?: string;
  timestamp: Date;
}

const notificationQueue: NotificationLog[] = [];
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;

export function getNotificationLog() {
  return notificationQueue.slice(-100);
}

// ═══ SENDGRID EMAIL WITH RETRY ═══
async function sendEmailRaw(to: string, subject: string, html: string): Promise<number> {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) throw new Error('SENDGRID_API_KEY not configured');

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
    }, (res) => {
      res.on('data', () => {});
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.statusCode);
        } else {
          reject(new Error(`SendGrid returned ${res.statusCode}`));
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function sendEmailWithRetry(to: string, subject: string, html: string, retryCount = 0): Promise<void> {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ SendGrid not configured — email skipped:', subject, '→', to);
    return;
  }

  try {
    await sendEmailRaw(to, subject, html);
    notificationQueue.push({
      event: subject, recipient: to, channel: 'EMAIL',
      status: 'SUCCESS', attempt: retryCount + 1, timestamp: new Date(),
    });
    console.log(`✅ Email sent to ${to}: ${subject}`);
  } catch (err: any) {
    const error = err.message || String(err);

    if (retryCount < MAX_RETRIES) {
      notificationQueue.push({
        event: subject, recipient: to, channel: 'EMAIL',
        status: 'RETRYING', attempt: retryCount + 1, error, timestamp: new Date(),
      });
      console.log(`⏳ Retrying email to ${to} (attempt ${retryCount + 2}/${MAX_RETRIES + 1})`);
      setTimeout(() => sendEmailWithRetry(to, subject, html, retryCount + 1), RETRY_DELAY_MS);
    } else {
      notificationQueue.push({
        event: subject, recipient: to, channel: 'EMAIL',
        status: 'FAILED', attempt: retryCount + 1, error, timestamp: new Date(),
      });
      console.error(`❌ Email failed to ${to} after ${MAX_RETRIES + 1} attempts:`, error);
    }
  }
}

// ═══ TEAMS WEBHOOK WITH RETRY ═══
async function sendTeamsRaw(title: string, message: string, deepLink?: string): Promise<number> {
  const webhookUrl = process.env.TEAMS_WEBHOOK_URL;
  if (!webhookUrl) throw new Error('TEAMS_WEBHOOK_URL not configured');

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
      hostname: url.hostname, path: url.pathname + url.search, method: 'POST',
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    }, (res) => {
      res.on('data', () => {});
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.statusCode);
        } else {
          reject(new Error(`Teams webhook returned ${res.statusCode}`));
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function sendTeamsWithRetry(title: string, message: string, deepLink?: string, retryCount = 0): Promise<void> {
  const webhookUrl = process.env.TEAMS_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn('⚠️ Teams webhook not configured — notification skipped:', title);
    return;
  }

  try {
    await sendTeamsRaw(title, message, deepLink);
    notificationQueue.push({
      event: title, recipient: 'Teams Channel', channel: 'TEAMS',
      status: 'SUCCESS', attempt: retryCount + 1, timestamp: new Date(),
    });
    console.log(`✅ Teams notification sent: ${title}`);
  } catch (err: any) {
    const error = err.message || String(err);

    if (retryCount < MAX_RETRIES) {
      notificationQueue.push({
        event: title, recipient: 'Teams Channel', channel: 'TEAMS',
        status: 'RETRYING', attempt: retryCount + 1, error, timestamp: new Date(),
      });
      setTimeout(() => sendTeamsWithRetry(title, message, deepLink, retryCount + 1), RETRY_DELAY_MS);
    } else {
      notificationQueue.push({
        event: title, recipient: 'Teams Channel', channel: 'TEAMS',
        status: 'FAILED', attempt: retryCount + 1, error, timestamp: new Date(),
      });
      console.error(`❌ Teams notification failed after ${MAX_RETRIES + 1} attempts:`, error);
    }
  }
}

// ═══ NOTIFICATION PRESETS ═══
const baseUrl = () => process.env.APP_BASE_URL || 'http://localhost:5173';

export async function notifyGoalSubmitted(employeeName: string, managerEmail: string, sheetId: string) {
  const link = `${baseUrl()}/manager/review/${sheetId}`;
  await sendEmailWithRetry(managerEmail, `📋 ${employeeName} submitted goals for review`,
    `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px">
      <h2 style="color:#6366f1">Goal Sheet Submitted</h2>
      <p><strong>${employeeName}</strong> has submitted their goal sheet for your review.</p>
      <p><a href="${link}" style="display:inline-block;background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Review Goals →</a></p>
      <p style="color:#888;font-size:12px;margin-top:20px">GoalFlow — Goal Setting & Tracking Portal</p>
    </div>`
  );
  await sendTeamsWithRetry('Goals Submitted', `**${employeeName}** submitted their goal sheet for review.`, link);
}

export async function notifyGoalApproved(employeeName: string, employeeEmail: string) {
  const link = `${baseUrl()}/employee/goals`;
  await sendEmailWithRetry(employeeEmail, '✅ Your goals have been approved & locked',
    `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px">
      <h2 style="color:#34d399">Goals Approved ✅</h2>
      <p>Hi <strong>${employeeName}</strong>, your goal sheet has been approved and locked by your manager.</p>
      <p><a href="${link}" style="display:inline-block;background:#34d399;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">View Goals →</a></p>
      <p style="color:#888;font-size:12px;margin-top:20px">GoalFlow — Goal Setting & Tracking Portal</p>
    </div>`
  );
  await sendTeamsWithRetry('Goals Approved', `**${employeeName}**'s goals have been approved and locked.`, link);
}

export async function notifyGoalReturned(employeeName: string, employeeEmail: string, reason: string) {
  const link = `${baseUrl()}/employee/goals`;
  await sendEmailWithRetry(employeeEmail, '🔄 Your goals need revision',
    `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px">
      <h2 style="color:#f59e0b">Goals Returned 🔄</h2>
      <p>Hi <strong>${employeeName}</strong>, your manager has returned your goal sheet with feedback:</p>
      <blockquote style="border-left:4px solid #f59e0b;padding:10px 15px;background:#fef3c7;border-radius:4px;margin:15px 0">${reason}</blockquote>
      <p><a href="${link}" style="display:inline-block;background:#f59e0b;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Edit Goals →</a></p>
      <p style="color:#888;font-size:12px;margin-top:20px">GoalFlow — Goal Setting & Tracking Portal</p>
    </div>`
  );
  await sendTeamsWithRetry('Goals Returned', `**${employeeName}**'s goals returned for revision: ${reason}`, link);
}

export async function notifyCheckInReminder(employeeName: string, employeeEmail: string) {
  const link = `${baseUrl()}/employee/checkin`;
  await sendEmailWithRetry(employeeEmail, '⏰ Quarterly check-in reminder',
    `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px">
      <h2 style="color:#6366f1">Check-in Reminder ⏰</h2>
      <p>Hi <strong>${employeeName}</strong>, please complete your quarterly goal check-in.</p>
      <p><a href="${link}" style="display:inline-block;background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Log Check-in →</a></p>
      <p style="color:#888;font-size:12px;margin-top:20px">GoalFlow — Goal Setting & Tracking Portal</p>
    </div>`
  );
}
