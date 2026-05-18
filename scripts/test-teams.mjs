// Live test of TEAMS_WEBHOOK_URL — posts the same MessageCard format the API uses.
// Usage:   node scripts/test-teams.mjs
import https from 'https';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z_]+)="?(.*?)"?$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const url = process.env.TEAMS_WEBHOOK_URL;
if (!url) { console.error('TEAMS_WEBHOOK_URL not set'); process.exit(1); }

const card = {
  '@type': 'MessageCard',
  '@context': 'http://schema.org/extensions',
  themeColor: '6366f1',
  summary: 'GoalFlow Teams Test',
  sections: [{
    activityTitle: '🎯 GoalFlow: Teams Webhook Test',
    activitySubtitle: new Date().toLocaleString(),
    text: 'If you see this card, the Teams webhook is **correctly configured** ✅',
  }],
  potentialAction: [{
    '@type': 'OpenUri',
    name: 'Open in GoalFlow',
    targets: [{ os: 'default', uri: process.env.APP_BASE_URL || 'https://goal-flow-theta.vercel.app' }],
  }],
};

const u = new URL(url);
const data = JSON.stringify(card);
const req = https.request({
  hostname: u.hostname, path: u.pathname + u.search, method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
}, (res) => {
  const chunks = [];
  res.on('data', (c) => chunks.push(c));
  res.on('end', () => {
    const body = Buffer.concat(chunks).toString('utf8');
    console.log(`HTTP ${res.statusCode} ${res.statusMessage}`);
    console.log(`Body: ${body || '(empty)'}`);
    process.exit(res.statusCode >= 200 && res.statusCode < 300 ? 0 : 2);
  });
});
req.on('error', (e) => { console.error('REQUEST ERROR:', e.message); process.exit(3); });
req.write(data); req.end();
