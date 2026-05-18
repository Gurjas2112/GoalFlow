// Standalone email sanity check — uses SMTP via Nodemailer.
// Run from project root:
//   node scripts/test-email.mjs <recipient-email>
//
// Requires SMTP_HOST, SMTP_USER, SMTP_PASS in apps/api/.env (or in the env).
// Optional: SMTP_PORT (default 587), SMTP_FROM_EMAIL.

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

console.log('─'.repeat(60));
console.log('Email test');
console.log('  Recipient:        ', to);
if (!(smtpHost && smtpUser && smtpPass)) {
  console.error('❌ No SMTP transport configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS.');
  process.exit(1);
}
console.log('  Transport:         SMTP (Nodemailer)');
console.log('  SMTP host:        ', smtpHost);
console.log('  SMTP port:        ', process.env.SMTP_PORT || '587 (default)');
console.log('  SMTP user:        ', smtpUser);
console.log('  SMTP pass:        ', '***' + smtpPass.slice(-2) + ' (' + smtpPass.length + ' chars)');
console.log('─'.repeat(60));

const html = `<p>Hello from the GoalFlow email CLI test.</p>
              <p>Sent at: ${new Date().toISOString()}</p>`;

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
