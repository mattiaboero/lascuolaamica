#!/usr/bin/env node
'use strict';

// CLS delle pagine materia con rete e CPU lente, come PageSpeed mobile:
// dal caricamento a quando il motore ha costruito la schermata iniziale
// (html[data-classe], poi un secondo e mezzo di margine), la somma dei layout
// shift (PerformanceObserver, tipo layout-shift) deve restare sotto 0,01.
// Fino alla 4.24.0 classi e ambiti nascevano dal JS dopo il JSON della
// materia (2,5 MB per matematica) e spingevano giu' «Inizia!».
//
// Uso: node scripts/cls_smoke.js [pagina ...]   (E2E_BASE_URL come run_e2e.sh)

const { chromium } = require('playwright');

const BASE = (process.env.E2E_BASE_URL || 'http://127.0.0.1:4173').replace(/\/+$/, '');
const PAGES = process.argv.slice(2).length ? process.argv.slice(2) : ['matematica', 'inglese', 'geografia'];
const SOGLIA = 0.01;

async function misura(browser, pagina) {
  const context = await browser.newContext({ viewport: { width: 412, height: 823 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1.75, serviceWorkers: 'block' });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.addInitScript(() => {
    window.__shifts = [];
    new window.PerformanceObserver((list) => {
      list.getEntries().forEach((e) => {
        if (e.hadRecentInput) return;
        window.__shifts.push({
          value: e.value,
          time: Math.round(e.startTime),
          sources: e.sources.map((s) => (s.node ? (s.node.id || s.node.className || s.node.nodeName) : '?'))
        });
      });
    }).observe({ type: 'layout-shift', buffered: true });
  });
  try {
    await page.goto(`${BASE}/${pagina}.html`, { waitUntil: 'load', timeout: 120000 });
    await page.waitForSelector('html[data-classe]', { timeout: 120000 });
    await page.waitForSelector('#screenStart [data-action="start-game"]', { state: 'visible' });
    await page.waitForTimeout(1500);
    return await page.evaluate(() => window.__shifts);
  } finally {
    await context.close();
  }
}

async function main() {
  const browser = await chromium.launch();
  let fail = 0;
  try {
    for (const pagina of PAGES) {
      const shifts = await misura(browser, pagina);
      const cls = shifts.reduce((a, s) => a + s.value, 0);
      const ok = cls < SOGLIA;
      process.stdout.write(`${ok ? '[OK]' : '[FAIL]'} /${pagina} CLS ${cls.toFixed(4)}\n`);
      if (!ok) shifts.forEach((s) => process.stdout.write(`  - ${s.value.toFixed(4)} a ${s.time} ms: ${s.sources.join(', ')}\n`));
      if (!ok) fail += 1;
    }
  } finally {
    await browser.close();
  }
  return fail ? 1 : 0;
}

main().then((code) => process.exit(code)).catch((err) => {
  console.error('[KO]', err.message);
  process.exit(1);
});
