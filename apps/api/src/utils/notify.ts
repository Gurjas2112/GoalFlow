/**
 * Notification utilities with retry logic and in-memory logging.
 *
 * Email transport priority (first one configured wins):
 *   1. SMTP via Nodemailer  — set SMTP_HOST, SMTP_USER, SMTP_PASS (free with
 *      Gmail App Passwords, no third-party signup required).
 *   2. SendGrid HTTP API    — set SENDGRID_API_KEY.
 *
 * Teams transport: TEAMS_WEBHOOK_URL.
 *
 * Notifications are non-blocking — app works fully without them configured.
 */
import https from 'https';
import http from 'http';
import nodemailer, { Transporter } from 'nodemailer';

// ═══ NOTIFICATION LOG ═══
interface NotificationLog {
  event: string;
  recipient: string;
  channel: 'EMAIL' | 'TEAMS';
  status: 'SUCCESS' | 'FAILED' | 'RETRYING' | 'SKIPPED';
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

export function getNotificationConfig() {
  const sendgridKey = process.env.SENDGRID_API_KEY || '';
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_FROM_EMAIL || '';
  const teamsUrl = process.env.TEAMS_WEBHOOK_URL || '';
  const smtpHost = process.env.SMTP_HOST || '';
  const smtpUser = process.env.SMTP_USER || '';
  return {
    smtp: {
      configured: !!(smtpHost && smtpUser),
      host: smtpHost || null,
      port: process.env.SMTP_PORT || null,
      user: smtpUser || null,
    },
    sendgrid: {
      configured: !!sendgridKey,
      apiKeyHint: sendgridKey ? `${sendgridKey.slice(0, 5)}… (${sendgridKey.length} chars)` : null,
      fromEmail: fromEmail || null,
      fromEmailConfigured: !!fromEmail,
    },
    teams: {
      configured: !!teamsUrl,
    },
    activeEmailTransport: smtpHost && smtpUser ? 'SMTP' : (sendgridKey ? 'SENDGRID' : 'NONE'),
  };
}

export async function sendTestEmail(to: string) {
  const html = `<div style="font-family:sans-serif;padding:20px">
    <h2 style="color:#6366f1">✅ GoalFlow Email Test</h2>
    <p>This is a test email triggered from the Admin Notifications page.</p>
    <p>If you received this, your email integration is working.</p>
    <p style="color:#888;font-size:12px">Sent at ${new Date().toISOString()}</p>
  </div>`;
  const smtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
  const useSmtp = smtpConfigured;
  const transportName = useSmtp ? 'SMTP' : 'SendGrid';
  try {
    const status = useSmtp
      ? await sendSmtpRaw(to, 'GoalFlow Email Test', html)
      : await sendEmailRaw(to, 'GoalFlow Email Test', html);
    notificationQueue.push({
      event: `Email Test (${transportName})`, recipient: to, channel: 'EMAIL',
      status: 'SUCCESS', attempt: 1, timestamp: new Date(),
    });
    return { ok: true, transport: transportName, statusCode: status };
  } catch (err: any) {
    notificationQueue.push({
      event: `Email Test (${transportName})`, recipient: to, channel: 'EMAIL',
      status: 'FAILED', attempt: 1, error: err?.message || String(err), timestamp: new Date(),
    });
    return { ok: false, transport: transportName, statusCode: err?.statusCode || null, error: err?.message || String(err) };
  }
}

// ═══ SMTP TRANSPORT (Nodemailer) — free alternative to SendGrid ═══
let cachedTransporter: Transporter | null = null;
function getSmtpTransporter(): Transporter | null {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  if (cachedTransporter) return cachedTransporter;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465 (SMTPS), false for 587 (STARTTLS)
    auth: { user, pass },
  });
  return cachedTransporter;
}

async function sendSmtpRaw(to: string, subject: string, html: string): Promise<number> {
  const transporter = getSmtpTransporter();
  if (!transporter) throw new Error('SMTP not configured');
  const from = process.env.SMTP_FROM_EMAIL || process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_USER!;
  await transporter.sendMail({
    from: `"GoalFlow" <${from}>`,
    to,
    subject,
    html,
  });
  return 250; // SMTP success code
}

// ═══ SENDGRID EMAIL WITH RETRY ═══
async function sendEmailRaw(to: string, subject: string, html: string): Promise<number> {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) throw new Error('SENDGRID_API_KEY not configured');

  const data = JSON.stringify({
    personalizations: [{ to: [{ email: to }] }],
    from: { email: process.env.SENDGRID_FROM_EMAIL || 'gsgbmcc@gmail.com', name: 'GoalFlow' },
    subject,
    content: [{ type: 'text/html', value: html }],
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.sendgrid.com', path: '/v3/mail/send', method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Content-Length': data.length },
    }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.statusCode);
        } else {
          // Pull SendGrid's structured error so the admin sees the real reason
          // (e.g. "The from address does not match a verified Sender Identity").
          const body = Buffer.concat(chunks).toString('utf8');
          let detail = body;
          try {
            const json = JSON.parse(body);
            if (Array.isArray(json.errors) && json.errors.length) {
              detail = json.errors.map((er: any) => er.message || JSON.stringify(er)).join('; ');
            }
          } catch { /* leave raw body */ }
          const e: any = new Error(`SendGrid returned ${res.statusCode}: ${detail}`);
          e.statusCode = res.statusCode;
          e.body = body;
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function sendEmailWithRetry(to: string, subject: string, html: string, retryCount = 0): Promise<void> {
  const smtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
  const apiKey = process.env.SENDGRID_API_KEY;

  if (!smtpConfigured && !apiKey) {
    console.warn('⚠️ No email transport configured — skipped:', subject, '→', to);
    notificationQueue.push({
      event: subject, recipient: to, channel: 'EMAIL',
      status: 'SKIPPED', attempt: 0,
      error: 'No email transport configured (set SMTP_HOST/SMTP_USER/SMTP_PASS or SENDGRID_API_KEY)',
      timestamp: new Date(),
    });
    return;
  }

  // Prefer SMTP when configured — it's free with Gmail app passwords and
  // sidesteps SendGrid's sender-verification requirements.
  const useSmtp = smtpConfigured;
  const send = useSmtp
    ? () => sendSmtpRaw(to, subject, html)
    : () => sendEmailRaw(to, subject, html);
  const transportName = useSmtp ? 'SMTP' : 'SendGrid';

  try {
    await send();
    notificationQueue.push({
      event: subject, recipient: to, channel: 'EMAIL',
      status: 'SUCCESS', attempt: retryCount + 1, timestamp: new Date(),
    });
    console.log(`✅ Email sent via ${transportName} to ${to}: ${subject}`);
  } catch (err: any) {
    const error = err.message || String(err);
    const status = err?.statusCode;
    const retriable = !(typeof status === 'number' && status >= 400 && status < 500);

    if (retriable && retryCount < MAX_RETRIES) {
      notificationQueue.push({
        event: subject, recipient: to, channel: 'EMAIL',
        status: 'RETRYING', attempt: retryCount + 1, error, timestamp: new Date(),
      });
      console.log(`⏳ Retrying email to ${to} via ${transportName} (attempt ${retryCount + 2}/${MAX_RETRIES + 1})`);
      setTimeout(() => sendEmailWithRetry(to, subject, html, retryCount + 1), RETRY_DELAY_MS);
    } else {
      notificationQueue.push({
        event: subject, recipient: to, channel: 'EMAIL',
        status: 'FAILED', attempt: retryCount + 1, error, timestamp: new Date(),
      });
      console.error(`❌ Email failed via ${transportName} to ${to} after ${MAX_RETRIES + 1} attempts:`, error);
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
          const e: any = new Error(`Teams webhook returned ${res.statusCode}`);
          e.statusCode = res.statusCode;
          reject(e);
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
    notificationQueue.push({
      event: title, recipient: 'Teams Channel', channel: 'TEAMS',
      status: 'SKIPPED', attempt: 0,
      error: 'TEAMS_WEBHOOK_URL not configured on the server',
      timestamp: new Date(),
    });
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
    const status = err?.statusCode;
    const retriable = !(typeof status === 'number' && status >= 400 && status < 500);

    if (retriable && retryCount < MAX_RETRIES) {
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

export async function notifyAccountCreated(employeeName: string, employeeEmail: string, temporaryPassword: string) {
  const link = `${baseUrl()}/login`;
  await sendEmailWithRetry(employeeEmail, '👋 Welcome to GoalFlow — Your Account Created',
    `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <h2 style="color:#6366f1">Welcome to GoalFlow! 👋</h2>
      <p>Hi <strong>${employeeName}</strong>,</p>
      <p>Your account has been created by the admin team. You can now log in to GoalFlow and start managing your goals.</p>
      
      <div style="background:#f0f4ff;border-left:4px solid #6366f1;padding:15px;margin:20px 0;border-radius:4px">
        <p style="margin:0 0 10px 0"><strong>Login Credentials:</strong></p>
        <p style="margin:5px 0;font-family:monospace;background:white;padding:10px;border-radius:4px">
          <strong>Email:</strong> ${employeeEmail}
        </p>
        <p style="margin:5px 0;font-family:monospace;background:white;padding:10px;border-radius:4px">
          <strong>Password:</strong> ${temporaryPassword}
        </p>
        <p style="color:#f59e0b;font-weight:600;margin-top:10px">⚠️ Please change this password after your first login.</p>
      </div>
      
      <p><a href="${link}" style="display:inline-block;background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:20px 0">Log In to GoalFlow →</a></p>
      
      <p style="color:#888;font-size:12px;margin-top:30px">GoalFlow — Goal Setting & Tracking Portal<br/>Manage your goals and track progress efficiently.</p>
    </div>`
  );
}
