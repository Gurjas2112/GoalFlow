// Standalone email sanity check — supports SMTP (Nodemailer) OR SendGrid.
// Run from project root:
//   node scripts/test-email.mjs <recipient-email>
//
// Picks transport by env: if SMTP_HOST + SMTP_USER + SMTP_PASS are set, uses
// SMTP; else if SENDGRID_API_KEY is set, uses SendGrid. Reads apps/api/.env
// as a fallback.

import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(__dirname, '..', 'apps', 'api', 'package.json'));

function loadDotenv() {
  const envPath = path.join(__dirname, '..', 'apps', 'api', '.env');
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2];
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadDotenv();

const to = process.argv[2];
if (!to) {
  console.error('❌ Usage: node scripts/test-email.mjs <recipient-email>');
  process.exit(1);
}

const smtpHost = process.env.SMTP_HOST;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const sgKey = process.env.SENDGRID_API_KEY;

console.log('─'.repeat(60));
console.log('Email test');
console.log('  Recipient:        ', to);
if (smtpHost && smtpUser && smtpPass) {
  console.log('  Transport:         SMTP (Nodemailer)');
  console.log('  SMTP host:        ', smtpHost);
  console.log('  SMTP port:        ', process.env.SMTP_PORT || '587 (default)');
  console.log('  SMTP user:        ', smtpUser);
  console.log('  SMTP pass:        ', '***' + smtpPass.slice(-2) + ' (' + smtpPass.length + ' chars)');
} else if (sgKey) {
  console.log('  Transport:         SendGrid');
  console.log('  API key:          ', sgKey.slice(0, 5) + '… (' + sgKey.length + ' chars)');
  console.log('  From:             ', process.env.SENDGRID_FROM_EMAIL || 'gsgbmcc@gmail.com');
} else {
  console.error('❌ No email transport configured. Set SMTP_HOST/SMTP_USER/SMTP_PASS or SENDGRID_API_KEY.');
  process.exit(1);
}
console.log('─'.repeat(60));

const html = `<p>Hello from the GoalFlow email CLI test.</p>
              <p>Sent at: ${new Date().toISOString()}</p>`;

if (smtpHost && smtpUser && smtpPass) {
  const nodemailer = require('nodemailer');
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port,
    secure: port === 465,
    auth: { user: smtpUser, pass: smtpPass },
  });
  try {
    await transporter.verify();
    console.log('✓ SMTP server reachable');
    const info = await transporter.sendMail({
      from: `"GoalFlow Test" <${process.env.SMTP_FROM_EMAIL || smtpUser}>`,
      to,
      subject: 'GoalFlow Email CLI Test',
      html,
    });
    console.log('messageId:', info.messageId);
    console.log('accepted: ', info.accepted);
    console.log('rejected: ', info.rejected);
    console.log('response: ', info.response);
    console.log('\n✅ SUCCESS — check the inbox (and spam folder).');
  } catch (err) {
    console.error('\n❌ SMTP FAILED:', err.message || err);
    if (err.response) console.error('server response:', err.response);
    process.exit(2);
  }
} else {
  const payload = JSON.stringify({
    personalizations: [{ to: [{ email: to }] }],
    from: { email: process.env.SENDGRID_FROM_EMAIL || 'gsgbmcc@gmail.com', name: 'GoalFlow Test' },
    subject: 'GoalFlow SendGrid CLI Test',
    content: [{ type: 'text/html', value: html }],
  });
  const req = https.request(
    {
      hostname: 'api.sendgrid.com',
      path: '/v3/mail/send',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sgKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    },
    (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        console.log('HTTP status: ', res.statusCode);
        console.log('Response body:', body || '(empty)');
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('\n✅ SUCCESS — check the inbox.');
        } else {
          console.log('\n❌ FAILED. Read the body above.');
        }
      });
    }
  );
  req.on('error', (err) => { console.error('Network error:', err); process.exit(2); });
  req.write(payload);
  req.end();
}
