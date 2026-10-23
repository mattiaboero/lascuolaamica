#!/usr/bin/env node
'use strict';

// Quiz su smartphone: durante una partita le quattro risposte e «Avanti»
// devono stare dentro la finestra, e niente di fisso (il footer, fino alla
// 4.23.0 una barra alta fino a 169px) deve coprirle. elementFromPoint al
// centro di ogni risposta e appena sopra il suo bordo inferiore deve
// restituire la risposta stessa.
//
// Uso: node scripts/quiz_viewport_smoke.js   (E2E_BASE_URL come run_e2e.sh)

const { chromium } = require('playwright');

const BASE = (process.env.E2E_BASE_URL || 'http://127.0.0.1:4173').replace(/\/+$/, '');
const VIEWS = [[375, 667], [390, 844]];
const PAGES = ['matematica', 'inglese'];

// Per ogni elemento: dentro la finestra e libero al centro e al bordo basso.
function controlla(page, selector) {
  return page.evaluate((sel) => {
    const vh = window.innerHeight;
    return [...document.querySelectorAll(sel)].filter((e) => e.offsetParent !== null).map((e, i) => {
      const r = e.getBoundingClientRect();
      const x = r.left + r.width / 2;
      const punti = [r.top + r.height / 2, r.bottom - 2];
      const sopra = punti.map((y) => (y >= 0 && y <= vh ? document.elementFromPoint(x, y) : null))
        .filter((t) => t && t !== e && !e.contains(t))
        .map((t) => t.className || t.tagName);
      return { i: i + 1, top: Math.round(r.top), bottom: Math.round(r.bottom), vh, dentro: r.top >= 0 && r.bottom <= vh, sopra };
    });
  }, selector);
}

async function caso(browser, w, h, pagina) {
  const context = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  try {
    await page.goto(`${BASE}/${pagina}.html`, { waitUntil: 'networkidle' });
    await page.locator('#screenStart [data-action="start-game"]').click();
    if (await page.locator('#screenLevels.active').count()) {
      await page.locator('#screenLevels [data-action="start-level"]:not([disabled])').first().click();
    }
    await page.waitForSelector('#screenGame.active');
    await page.waitForTimeout(1000); // scroll morbido verso la scheda

    const risposte = await controlla(page, '#answers .answer-btn');
    if (risposte.length !== 4) errors.push(`${risposte.length} risposte invece di 4`);
    risposte.forEach((r) => {
      if (!r.dentro) errors.push(`risposta ${r.i} fuori dalla finestra (${r.top}-${r.bottom}, finestra ${r.vh})`);
      if (r.sopra.length) errors.push(`risposta ${r.i} coperta da ${r.sopra.join(', ')}`);
    });

    // Tocco con un evento, non con click(): click() scorrerebbe la pagina da
    // solo e nasconderebbe proprio il difetto che si cerca.
    await page.locator('#answers .answer-btn').first().dispatchEvent('click');
    await page.waitForSelector('#qNext:not([hidden])');
    await page.waitForTimeout(400);
    const [avanti] = await controlla(page, '#qNext');
    if (!avanti) errors.push('«Avanti» non compare');
    else {
      if (!avanti.dentro) errors.push(`«Avanti» fuori dalla finestra (${avanti.top}-${avanti.bottom}, finestra ${avanti.vh})`);
      if (avanti.sopra.length) errors.push(`«Avanti» coperto da ${avanti.sopra.join(', ')}`);
    }
  } finally {
    await context.close();
  }
  return errors;
}

async function main() {
  const browser = await chromium.launch();
  let fail = 0;
  try {
    for (const [w, h] of VIEWS) {
      for (const pagina of PAGES) {
        const errors = await caso(browser, w, h, pagina);
        process.stdout.write(`${errors.length ? '[FAIL]' : '[OK]'} /${pagina} ${w}x${h}\n`);
        errors.forEach((e) => process.stdout.write(`  - ${e}\n`));
        fail += errors.length;
      }
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
