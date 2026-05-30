'use strict';
const express = require('express');
const path    = require('path');

const app  = express();
const ROOT = __dirname; // always = /opt/render/project/src/mainfolder (or local equivalent)

app.use(express.json({ limit: '2mb' }));

// Serve everything in the same folder as server.js
app.use(express.static(ROOT));

app.get('/', (req, res) => {
  res.sendFile(path.join(ROOT, 'index.html'));
});

/* ────────────────────────────────────────────────────────
   POST /api/download-receipt
   Accepts { html, width, height }
   Returns a PNG screenshot of the receipt
──────────────────────────────────────────────────────── */
app.post('/api/download-receipt', async (req, res) => {
  const { html, width, height } = req.body;
  if (!html) return res.status(400).json({ error: 'Missing html' });

  let browser;
  try {
    const puppeteerCore = require('puppeteer-core');
    const chromium      = require('@sparticuz/chromium');

    const executablePath = await chromium.executablePath();

    browser = await puppeteerCore.launch({
      executablePath,
      headless: chromium.headless,
      args: [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--font-render-hinting=none',
      ],
      defaultViewport: chromium.defaultViewport,
    });

    const page = await browser.newPage();

    const vpWidth  = (width  || 300) + 40;
    const vpHeight = (height || 900) + 40;
    await page.setViewport({ width: vpWidth, height: vpHeight, deviceScaleFactor: 3 });

    const BASE = `http://localhost:${PORT}`;

    const pageHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <base href="${BASE}/"/>
  <link rel="stylesheet" href="${BASE}/assets/css/common.css"/>
  <link rel="stylesheet" href="${BASE}/templates/template-1/style.css"/>
  <link rel="stylesheet" href="${BASE}/templates/template-2/style.css"/>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      background: transparent;
      overflow: hidden;
      padding: 12px;
      width: ${(width || 300) + 24}px;
    }
    .template-container {
      transform: none !important;
      filter: none !important;
      zoom: 1 !important;
      box-shadow: none !important;
    }
  </style>
</head>
<body>${html}</body>
</html>`;

    await page.setContent(pageHtml, { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1200));

    const el = await page.$('.template-container');
    if (!el) throw new Error('.template-container not found in rendered HTML');

    const imgBuffer = await el.screenshot({ type: 'png', omitBackground: true });

    res.set({
      'Content-Type':        'image/png',
      'Content-Disposition': 'attachment; filename="fuel-receipt.png"',
      'Content-Length':      imgBuffer.length,
    });
    res.end(imgBuffer);

  } catch (err) {
    console.error('Screenshot error:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Fuel Receipt Generator running → http://localhost:${PORT}`);
  console.log(`Serving files from: ${ROOT}`);
});
