#!/usr/bin/env node
'use strict';

// Smoke di /tabelline con e senza JavaScript: regressione della 4.21.1.
// La pagina e' statica e deve funzionare identica nei due casi: niente avviso
// noscript, tabella prima dei video, «dell'8» e non «del 8».
//
// Uso: node scripts/tabelline_smoke.js   (E2E_BASE_URL come run_e2e.sh)

const { chromium } = require('playwright');

const BASE = (process.env.E2E_BASE_URL || 'http://127.0.0.1:4173').replace(/\/+$/, '');

async function check(browser, javaScriptEnabled) {
  const context = await browser.newContext({ javaScriptEnabled });
  const page = await context.newPage();
  const errors = [];
  try {
    const res = await page.goto(`${BASE}/tabelline.html`, { waitUntil: 'load' });
    if (!res || !res.ok()) errors.push(`HTTP ${res ? res.status() : 'nessuna risposta'}`);

    const main = page.locator('main#contenuto-principale');
    if (!(await main.locator('h1').isVisible())) errors.push('h1 del contenuto principale non visibile');
    if ((await main.locator('.tab-table tbody tr').count()) !== 9) errors.push('la tabella non ha 9 righe');
    if (!(await main.locator('#tabellaTitle').isVisible())) errors.push('#tabellaTitle non visibile');

    const html = await page.content();
    if (/<noscript/i.test(html)) errors.push('<noscript> presente');
    if (!html.includes("Tabellina dell'8")) errors.push("manca «Tabellina dell'8»");
    if (/\bdel 8\b/i.test(html)) errors.push('grafia «del 8» presente');

    const tabella = html.indexOf('id="tabellaTitle"');
    const video = html.indexOf('id="videoTitle"');
    if (tabella < 0 || video < 0 || tabella > video) errors.push('la tabella non precede i video');
  } finally {
    await context.close();
  }
  return errors;
}

async function main() {
  const browser = await chromium.launch();
  let fail = 0;
  try {
    for (const js of [true, false]) {
      const errors = await check(browser, js);
      process.stdout.write(`${errors.length ? '[FAIL]' : '[OK]'} tabelline JS=${js ? 'on' : 'off'}\n`);
      errors.forEach((e) => process.stdout.write(`  - ${e}\n`));
      fail += errors.length;
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
