'use strict';
const express  = require('express');
const path     = require('path');
const fs       = require('fs');
const crypto   = require('crypto');

const app  = express();
const ROOT = __dirname;

// ── Admin config ──────────────────────────────────────────────────────────────
// Change this password to whatever you want. It is NEVER sent to the browser.
const ADMIN_PASSWORD = 'YourSecretPass123!';
// Secret route name — 13 random chars already set. Change if you want.
const ADMIN_ROUTE    = '/xK9mPqR3tZwL7';
// Session tokens stored in memory (cleared on restart)
const SESSIONS       = new Set();
// Where download logs are stored
const LOG_FILE       = path.join(ROOT, 'downloads.json');

// ── Helpers ───────────────────────────────────────────────────────────────────
function readLogs() {
  try { return JSON.parse(fs.readFileSync(LOG_FILE, 'utf8')); }
  catch { return []; }
}

function appendLog(entry) {
  const logs = readLogs();
  logs.push(entry);
  fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
}

function getClientIP(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

async function getGeoInfo(ip) {
  // Uses free ip-api.com (no key needed, 45 req/min)
  try {
    const http = require('http');
    return await new Promise((resolve) => {
      const req = http.get(`http://ip-api.com/json/${ip}?fields=country,regionName,city,isp,status`, (res) => {
        let data = '';
        res.on('data', d => data += d);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.status === 'success') {
              resolve({ country: json.country, region: json.regionName, city: json.city, isp: json.isp });
            } else {
              resolve({ country: 'Unknown', region: '', city: '', isp: '' });
            }
          } catch { resolve({ country: 'Unknown', region: '', city: '', isp: '' }); }
        });
      });
      req.on('error', () => resolve({ country: 'Unknown', region: '', city: '', isp: '' }));
      req.setTimeout(3000, () => { req.destroy(); resolve({ country: 'Timeout', region: '', city: '', isp: '' }); });
    });
  } catch { return { country: 'Unknown', region: '', city: '', isp: '' }; }
}

function parseUserAgent(ua) {
  if (!ua) return { browser: 'Unknown', os: 'Unknown', device: 'Unknown' };

  let browser = 'Unknown';
  if (/Edg\//.test(ua))            browser = 'Edge';
  else if (/OPR\/|Opera/.test(ua)) browser = 'Opera';
  else if (/Chrome\//.test(ua))    browser = 'Chrome';
  else if (/Firefox\//.test(ua))   browser = 'Firefox';
  else if (/Safari\//.test(ua))    browser = 'Safari';

  let os = 'Unknown';
  if (/Windows NT/.test(ua))      os = 'Windows';
  else if (/Mac OS X/.test(ua))   os = 'macOS';
  else if (/Android/.test(ua))    os = 'Android';
  else if (/iPhone|iPad/.test(ua))os = 'iOS';
  else if (/Linux/.test(ua))      os = 'Linux';

  let device = 'Desktop';
  if (/Mobi|Android|iPhone/.test(ua)) device = 'Mobile';
  else if (/iPad|Tablet/.test(ua))    device = 'Tablet';

  return { browser, os, device };
}

function requireAdminSession(req, res, next) {
  const token = req.headers['x-admin-token'] || req.query.token;
  if (token && SESSIONS.has(token)) return next();
  res.status(401).json({ error: 'Unauthorized' });
}

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.static(ROOT));

// ── Public routes ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => res.sendFile(path.join(ROOT, 'index.html')));
app.get('/generator',  (req, res) => res.sendFile(path.join(ROOT, 'generator.html')));
app.get('/food-bill',  (req, res) => res.sendFile(path.join(ROOT, 'food-generator.html')));

// ── Admin: serve login page ───────────────────────────────────────────────────
app.get(ADMIN_ROUTE, (req, res) => {
  res.sendFile(path.join(ROOT, 'xK9mPqR3tZwL7.html'));
});

// ── Admin: login API (password checked server-side ONLY) ─────────────────────
app.post('/api/admin-login', (req, res) => {
  const { password } = req.body || {};
  if (!password) return res.status(400).json({ error: 'Missing password' });

  // Constant-time comparison to prevent timing attacks
  const a = Buffer.from(password.padEnd(64));
  const b = Buffer.from(ADMIN_PASSWORD.padEnd(64));
  const match = a.length === b.length && crypto.timingSafeEqual(a, b);

  if (!match) return res.status(403).json({ error: 'Wrong password' });

  const token = crypto.randomBytes(32).toString('hex');
  SESSIONS.add(token);
  // Auto-expire token after 4 hours
  setTimeout(() => SESSIONS.delete(token), 4 * 60 * 60 * 1000);
  res.json({ token });
});

// ── Admin: get logs ───────────────────────────────────────────────────────────
app.get('/api/admin-logs', requireAdminSession, (req, res) => {
  res.json(readLogs());
});

// ── Admin: clear logs ─────────────────────────────────────────────────────────
app.delete('/api/admin-logs', requireAdminSession, (req, res) => {
  fs.writeFileSync(LOG_FILE, '[]');
  res.json({ ok: true });
});

// ── PNG Download (with tracking) ──────────────────────────────────────────────
app.post('/api/download-receipt', async (req, res) => {
  const { html, width, height } = req.body;
  if (!html) return res.status(400).json({ error: 'Missing html' });

  // Collect tracking info (async, don't block download)
  const ip       = getClientIP(req);
  const ua       = req.headers['user-agent'] || '';
  const referer  = req.headers['referer'] || '';
  const { browser, os, device } = parseUserAgent(ua);
  const timestamp = new Date().toISOString();

  // Fire geo lookup without awaiting so download isn't slowed
  getGeoInfo(ip).then(geo => {
    appendLog({ timestamp, ip, country: geo.country, region: geo.region, city: geo.city, isp: geo.isp, browser, os, device, referer });
  }).catch(() => {
    appendLog({ timestamp, ip, country: 'Unknown', region: '', city: '', isp: '', browser, os, device, referer });
  });

  let browser2;
  try {
    const puppeteerCore  = require('puppeteer-core');
    const chromium       = require('@sparticuz/chromium');
    const executablePath = await chromium.executablePath();

    browser2 = await puppeteerCore.launch({
      executablePath,
      headless: chromium.headless,
      args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox',
             '--disable-dev-shm-usage', '--disable-gpu'],
      defaultViewport: chromium.defaultViewport,
    });

    const page = await browser2.newPage();
    await page.setViewport({ width: (width||300)+40, height: (height||900)+40, deviceScaleFactor: 3 });

    const BASE = `http://localhost:${PORT}`;
    const pageHtml = `<!DOCTYPE html>
<html><head>
  <meta charset="UTF-8"/>
  <base href="${BASE}/"/>
  <link rel="stylesheet" href="${BASE}/assets/css/common.css"/>
  <link rel="stylesheet" href="${BASE}/templates/template-1/style.css"/>
  <link rel="stylesheet" href="${BASE}/templates/template-2/style.css"/>
  <link rel="stylesheet" href="${BASE}/templates/template-3/style.css"/>
  <link rel="stylesheet" href="${BASE}/templates/template-4/style.css"/>
  <link rel="stylesheet" href="${BASE}/templates/template-5/style.css"/>
  <link rel="stylesheet" href="${BASE}/templates/template-6/style.css"/>
  <link rel="stylesheet" href="${BASE}/templates/template-7/style.css"/>
  <link rel="stylesheet" href="${BASE}/templates/template-8/style.css"/>
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;font-weight:normal}
    html,body{background:transparent;overflow:hidden;padding:12px;width:${(width||300)+24}px}
    .template-container{transform:none!important;zoom:1!important;box-shadow:none!important}
    .template-content,.template-content *{font-weight:normal!important;color:inherit}
    .label{font-weight:normal!important;color:inherit!important;background:none!important;padding:0!important;border-radius:0!important;display:inline!important;font-size:inherit!important}
  </style>
</head><body>${html}</body></html>`;

    await page.setContent(pageHtml, { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1200));

    const el = await page.$('.template-container');
    if (!el) throw new Error('.template-container not found');

    const buf = await el.screenshot({ type: 'png', omitBackground: true });
    res.set({
      'Content-Type':        'image/png',
      'Content-Disposition': 'attachment; filename="fuel-receipt.png"',
      'Content-Length':      buf.length,
    });
    res.end(buf);

  } catch (err) {
    console.error('Screenshot error:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    if (browser2) await browser2.close().catch(() => {});
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Running on port ${PORT}`));
