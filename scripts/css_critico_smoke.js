#!/usr/bin/env node
'use strict';

// CSS critico delle pagine materia (scripts/build_css_critico.js): la pagina
// avviata col solo <style> inline deve essere identica, pixel per pixel, a
// quella coi fogli completi accesi. Se differisce, al caricamento qualcosa
// cambierebbe aspetto o si sposterebbe: npm run css:critico.
// Otto pagine, telefono e computer, tema chiaro e scuro, pagina intera.
//
// Uso: node scripts/css_critico_smoke.js   (E2E_BASE_URL come run_e2e.sh)

const { chromium } = require('playwright');

const BASE = (process.env.E2E_BASE_URL || 'http://127.0.0.1:4173').replace(/\/+$/, '');
const PAGINE = ['matematica', 'problemi', 'italiano', 'inglese', 'civica', 'storia', 'geografia', 'scienze'];
(async () => {
  const b = await chromium.launch();
  let ko = 0;
  for (const p of PAGINE) {
    for (const vp of [{ width: 375, height: 667 }, { width: 1280, height: 800 }]) {
      for (const scheme of ['light', 'dark']) {
        const ctx = await b.newContext({ viewport: vp, colorScheme: scheme, serviceWorkers: 'block', reducedMotion: 'reduce' });
        const page = await ctx.newPage();
        // lazy-css.js senza l'accensione dei fogli completi
        await page.route('**/js/lazy-css.js', (r) => r.fulfill({ body: '', contentType: 'text/javascript' }));
        await page.goto(`${BASE}/${p}.html?x=${Date.now()}`, { waitUntil: 'networkidle' });
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(300);
        const prima = await page.screenshot({ fullPage: true });
        await page.evaluate(() => document.querySelectorAll('link[data-css-completo]').forEach((l) => { l.media = 'all'; }));
        await page.waitForTimeout(500);
        const dopo = await page.screenshot({ fullPage: true });
        const uguale = prima.equals(dopo);
        if (!uguale) ko += 1;
        console.log(`${uguale ? '[OK]' : '[FAIL]'} ${p} ${vp.width} ${scheme}${uguale ? '' : ': col solo CSS critico la pagina e\' diversa'}`);
        await ctx.close();
      }
    }
  }
  await b.close();
  process.exit(ko ? 1 : 0);
})();
