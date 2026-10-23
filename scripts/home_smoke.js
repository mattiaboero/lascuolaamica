#!/usr/bin/env node
'use strict';

// Home (fase 4): prima le materie, nav principale, niente comparse.
// - a 375x667 le 8 schede materia finiscono entro i primi 1.500px;
// - <nav aria-label="Principale"> esiste ed e' il primo landmark dopo l'header;
// - Tab dalla cima: link di salto, i link del nav, poi «Scegli la materia»;
// - sopra la piega nessun elemento del contenuto ha opacita' sotto 1, gia'
//   al DOMContentLoaded (le comparse partivano da 0 o da .35). Sole, nuvole e
//   colline sono decorativi, fuori da .wrapper, e non contano.
//
// Uso: node scripts/home_smoke.js   (E2E_BASE_URL come run_e2e.sh)

const { chromium } = require('playwright');

const BASE = (process.env.E2E_BASE_URL || 'http://127.0.0.1:4173').replace(/\/+$/, '');
const MATERIE = ['/matematica', '/inglese', '/problemi', '/civica', '/geografia', '/storia', '/scienze', '/italiano'];

async function caso(browser, w, h) {
  const mobile = w < 768;
  const context = await browser.newContext({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile, serviceWorkers: 'block' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  try {
    await page.goto(`${BASE}/index.html`, { waitUntil: 'domcontentloaded' });
    const trasparenti = await page.evaluate(() => {
      const vh = window.innerHeight;
      const out = [];
      document.querySelectorAll('.wrapper *').forEach((e) => {
        const r = e.getBoundingClientRect();
        if (!r.width || !r.height || r.top >= vh || r.bottom <= 0) return;
        let o = 1;
        for (let n = e; n && n !== document.body; n = n.parentElement) o *= Number(window.getComputedStyle(n).opacity);
        if (o < 0.999) out.push(`${e.tagName.toLowerCase()}.${e.className || ''} (${o.toFixed(2)})`);
      });
      return out;
    });
    if (trasparenti.length) errors.push(`sopra la piega con opacita' sotto 1: ${trasparenti.slice(0, 5).join(', ')}`);

    await page.waitForLoadState('networkidle');

    if (mobile) {
      const fondi = await page.evaluate((hrefs) => hrefs.map((href) => {
        const a = document.querySelector(`.subject-card[href="${href}"]`);
        return [href, a ? Math.round(a.getBoundingClientRect().bottom + window.scrollY) : null];
      }), MATERIE);
      fondi.forEach(([href, bottom]) => {
        if (bottom === null) errors.push(`manca la scheda ${href}`);
        else if (bottom > 1500) errors.push(`scheda ${href} finisce a ${bottom}px, oltre i 1.500`);
      });
    }

    const landmark = await page.evaluate(() => {
      const sel = 'header, nav, main, aside, footer, [role="banner"], [role="navigation"], [role="main"], [role="contentinfo"], section[aria-label], section[aria-labelledby]';
      return [...document.querySelectorAll(sel)].map((e) => `${e.tagName.toLowerCase()}${e.getAttribute('aria-label') ? `[${e.getAttribute('aria-label')}]` : ''}`);
    });
    if (landmark[0] !== 'header' || landmark[1] !== 'nav[Principale]') errors.push(`landmark in ordine: ${landmark.slice(0, 3).join(', ')}`);

    const atteso = ['Vai al contenuto principale', 'Per insegnanti', 'Per genitori', 'FAQ', 'Scegli la materia'];
    const visti = [];
    for (let i = 0; i < atteso.length; i++) {
      await page.keyboard.press('Tab');
      visti.push(await page.evaluate(() => (document.activeElement.textContent || '').trim().split('\n')[0].trim()));
    }
    if (visti.join('|') !== atteso.join('|')) errors.push(`ordine di Tab: ${visti.join(' → ')}`);
  } finally {
    await context.close();
  }
  return errors;
}

async function main() {
  const browser = await chromium.launch();
  let fail = 0;
  try {
    for (const [w, h] of [[375, 667], [768, 1024], [1440, 900]]) {
      const errors = await caso(browser, w, h);
      process.stdout.write(`${errors.length ? '[FAIL]' : '[OK]'} home ${w}x${h}\n`);
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
