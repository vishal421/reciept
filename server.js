'use strict';
const express  = require('express');
const path     = require('path');
const fs       = require('fs');
const crypto   = require('crypto');

const app  = express();
const ROOT = __dirname;

// ── Puppeteer concurrency queue ───────────────────────────────────────────────
// Limit concurrent Chromium launches to prevent OOM on small AWS instances.
// All download requests beyond MAX_CONCURRENT queue and wait their turn.
const MAX_CONCURRENT = 3;
let   _activeLaunches = 0;
const _launchQueue    = [];

function acquireLaunchSlot() {
  return new Promise((resolve) => {
    const tryAcquire = () => {
      if (_activeLaunches < MAX_CONCURRENT) {
        _activeLaunches++;
        resolve();
      } else {
        _launchQueue.push(tryAcquire);
      }
    };
    tryAcquire();
  });
}

function releaseLaunchSlot() {
  _activeLaunches--;
  if (_launchQueue.length > 0) {
    const next = _launchQueue.shift();
    next();
  }
}

// ── In-memory rate limiter (no extra npm package needed) ─────────────────────
// Max MAX_RPM requests per IP per minute on the download endpoints.
const MAX_RPM       = 10;
const _rateBuckets  = new Map(); // ip → { count, resetAt }

function isRateLimited(ip) {
  const now  = Date.now();
  let bucket = _rateBuckets.get(ip);
  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + 60_000 };
    _rateBuckets.set(ip, bucket);
  }
  bucket.count++;
  if (bucket.count > MAX_RPM) return true;
  return false;
}

// Clean up stale buckets every 5 minutes to prevent unbounded map growth
setInterval(() => {
  const now = Date.now();
  for (const [ip, b] of _rateBuckets) {
    if (now > b.resetAt) _rateBuckets.delete(ip);
  }
}, 5 * 60_000);

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
  // FIX: cap log at 10,000 entries — drop oldest — prevents unbounded file growth
  const capped = logs.length > 10000 ? logs.slice(logs.length - 10000) : logs;
  fs.writeFileSync(LOG_FILE, JSON.stringify(capped, null, 2));
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

// Gzip compression — reduces HTML/CSS/JS transfer size by ~70%
// Install: npm install compression
try {
  const compression = require('compression');
  app.use(compression({ level: 6, threshold: 1024 }));
} catch (e) {
  // compression not installed — run: npm install compression
}

// Security & performance headers
app.use((req, res, next) => {
  // Prevent MIME-type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Basic XSS protection for older browsers
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Don't embed in iframes (clickjacking)
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  // Cross-Origin Opener Policy — fixes COOP warning in PageSpeed Best Practices
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // HTTPS only for 1 year (only set if behind HTTPS proxy/nginx)
  if (req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  next();
});

// Cache-Control headers for static assets — improves PageSpeed score
app.use((req, res, next) => {
  const url = req.url;
  if (/\.(woff2|woff|ttf)$/.test(url)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // 1 year
  } else if (/\.(jpg|jpeg|png|svg|gif|webp)$/.test(url)) {
    res.setHeader('Cache-Control', 'public, max-age=2592000'); // 30 days
  } else if (/\.(css|js)$/.test(url)) {
    res.setHeader('Cache-Control', 'public, max-age=604800'); // 7 days
  }
  next();
});
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

// ── Shared Puppeteer page builder ─────────────────────────────────────────────
// Both PNG and PDF endpoints use identical HTML structure — centralised here.
function buildReceiptPageHtml(BASE, html, width) {
  return `<!DOCTYPE html>
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
  <link rel="stylesheet" href="${BASE}/templates/template-9/style.css"/>
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;font-weight:normal}
    html,body{background:transparent;overflow:visible;padding:0;margin:0;width:${width||300}px}
    .template-container{transform:none!important;zoom:1!important;box-shadow:none!important;background-size:cover!important;background-repeat:no-repeat!important}
    .template-content,.template-content *{font-weight:normal!important;color:inherit}
    .label{font-weight:normal!important;color:inherit!important;background:none!important;padding:0!important;border-radius:0!important;display:inline!important;font-size:inherit!important}
  </style>
</head><body>${html}</body></html>`;
}

// ── PNG Download (with tracking) ──────────────────────────────────────────────
app.post('/api/download-receipt', async (req, res) => {
  const { html, width, height } = req.body;
  if (!html) return res.status(400).json({ error: 'Missing html' });

  // FIX: Rate limit — max 10 downloads/min per IP
  const ip = getClientIP(req);
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a minute.' });
  }

  // Collect tracking info (async, don't block download)
  const ua       = req.headers['user-agent'] || '';
  const referer  = req.headers['referer'] || '';
  const { browser, os, device } = parseUserAgent(ua);
  const timestamp = new Date().toISOString();

  getGeoInfo(ip).then(geo => {
    appendLog({ timestamp, ip, country: geo.country, region: geo.region, city: geo.city, isp: geo.isp, browser, os, device, referer });
  }).catch(() => {
    appendLog({ timestamp, ip, country: 'Unknown', region: '', city: '', isp: '', browser, os, device, referer });
  });

  // FIX: Queue — wait for a Puppeteer slot rather than launching unbounded instances
  await acquireLaunchSlot();
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
    await page.setViewport({ width: (width||300)+80, height: (height||900)+400, deviceScaleFactor: 3 });

    const BASE     = `http://localhost:${PORT}`;
    const pageHtml = buildReceiptPageHtml(BASE, html, width);

    await page.setContent(pageHtml, { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));

    const el = await page.$('.template-container');
    if (!el) throw new Error('.template-container not found');

    // Resize viewport to exact element dimensions for pixel-perfect crop
    const box = await el.boundingBox();
    if (box) {
      await page.setViewport({
        width:  Math.ceil(box.width  + box.x + 32),
        height: Math.ceil(box.height + box.y + 32),
        deviceScaleFactor: 3,
      });
      await new Promise(r => setTimeout(r, 300));
    }

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
    releaseLaunchSlot();
  }
});

// ── PDF Download ──────────────────────────────────────────────────────────────
app.post('/api/download-receipt-pdf', async (req, res) => {
  const { html, width, height } = req.body;
  if (!html) return res.status(400).json({ error: 'Missing html' });

  // FIX: Rate limit — shared with PNG, same 10/min per IP bucket
  const ip = getClientIP(req);
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a minute.' });
  }

  // FIX: Queue — wait for a Puppeteer slot
  await acquireLaunchSlot();
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
    // deviceScaleFactor:3 → ~300 DPI, PNG-like sharpness
    await page.setViewport({ width: (width||300)+80, height: (height||900)+400, deviceScaleFactor: 3 });

    const BASE     = `http://localhost:${PORT}`;
    const pageHtml = buildReceiptPageHtml(BASE, html, width);

    await page.setContent(pageHtml, { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));

    const el = await page.$('.template-container');
    if (!el) throw new Error('.template-container not found');

    const box = await el.boundingBox();

    // FIX: Resize viewport to match element before pdf() — same as PNG handler.
    // Without this, tall receipts can be clipped in the PDF.
    if (box) {
      await page.setViewport({
        width:  Math.ceil(box.width  + box.x + 32),
        height: Math.ceil(box.height + box.y + 32),
        deviceScaleFactor: 3,
      });
      await new Promise(r => setTimeout(r, 300));
    }

    // Exact element dimensions → single page, zero distortion
    const pdfWidth  = Math.ceil(box ? box.width  : width  || 300);
    const pdfHeight = Math.ceil(box ? box.height : height || 700);

    const buf = await page.pdf({
      width:           pdfWidth  + 'px',
      height:          pdfHeight + 'px',
      printBackground: true,
      // Zero margins → receipt fills the page exactly, no white borders, no splits
      margin: { top: '0px', bottom: '0px', left: '0px', right: '0px' },
    });

    res.set({
      'Content-Type':        'application/pdf',
      'Content-Disposition': 'attachment; filename="fuel-receipt.pdf"',
      'Content-Length':      buf.length,
    });
    res.end(buf);

  } catch (err) {
    console.error('PDF error:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    if (browser2) await browser2.close().catch(() => {});
    releaseLaunchSlot();
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Running on port ${PORT}`));
