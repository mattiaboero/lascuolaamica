#!/usr/bin/env node
'use strict';

// CLS delle pagine materia con rete e CPU lente, come PageSpeed mobile:
// dal caricamento a quando il motore ha costruito la schermata iniziale
// (html[data-classe], poi un secondo e mezzo di margine), la somma dei layout
// shift (PerformanceObserver, tipo layout-shift) deve restare sotto 0,01.
// Fino alla 4.24.0 classi e ambiti nascevano dal JS dopo il JSON della
// materia (2,5 MB per matematica) e spingevano giu' «Inizia!».
//
// Quando fallisce stampa pagina, CLS totale e per ogni spostamento il
// selettore dell'elemento sorgente, il valore e l'istante; lo stesso
// dettaglio, per tutte le pagine, va in test-results/cls/cls.json (in CI
// diventa un artifact).
//
// Uso: node scripts/cls_smoke.js [pagina ...]   (E2E_BASE_URL come run_e2e.sh)

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const BASE = (process.env.E2E_BASE_URL || 'http://127.0.0.1:4173').replace(/\/+$/, '');
const PAGES = process.argv.slice(2).length ? process.argv.slice(2) : ['matematica', 'inglese', 'geografia'];
const SOGLIA = 0.01;
const REPORT = path.join(__dirname, '..', 'test-results', 'cls', 'cls.json');

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
          sources: e.sources.map((s) => {
            // Selettore leggibile: fino a quattro antenati, con id o classi.
            const passo = (n) => {
              if (!n || n.nodeType !== 1) return n && n.nodeName ? n.nodeName.toLowerCase() : '?';
              if (n.id) return `${n.tagName.toLowerCase()}#${n.id}`;
              const cls = [...n.classList].slice(0, 2).map((c) => `.${c}`).join('');
              return `${n.tagName.toLowerCase()}${cls}`;
            };
            const parti = [];
            for (let n = s.node, i = 0; n && n.nodeType === 1 && i < 4; n = n.parentElement, i += 1) {
              parti.unshift(passo(n));
              if (n.id) break;
            }
            return {
              selettore: parti.length ? parti.join(' > ') : passo(s.node),
              prima: s.previousRect ? [Math.round(s.previousRect.y), Math.round(s.previousRect.height)] : null,
              dopo: s.currentRect ? [Math.round(s.currentRect.y), Math.round(s.currentRect.height)] : null
            };
          })
        });
      });
    }).observe({ type: 'layout-shift', buffered: true });
  });
  try {
    await page.goto(`${BASE}/${pagina}.html`, { waitUntil: 'load', timeout: 120000 });
    await page.waitForSelector('html[data-classe]', { timeout: 120000 });
    await page.waitForSelector('#screenStart [data-action="start-game"]', { state: 'visible' });
    await page.waitForTimeout(1500);
    return { shifts: await page.evaluate(() => window.__shifts) };
  } catch (err) {
    // Anche quando si interrompe: quello che e' stato registrato fin li'.
    const shifts = await page.evaluate(() => window.__shifts || []).catch(() => []);
    return { shifts, errore: err.message.split('\n')[0] };
  } finally {
    await context.close();
  }
}

async function main() {
  const browser = await chromium.launch();
  let fail = 0;
  const risultati = [];
  try {
    for (const pagina of PAGES) {
      const { shifts, errore } = await misura(browser, pagina);
      const cls = shifts.reduce((a, s) => a + s.value, 0);
      const ok = !errore && cls < SOGLIA;
      risultati.push({ pagina, cls: Number(cls.toFixed(4)), soglia: SOGLIA, ok, errore: errore || null, shifts });
      process.stdout.write(`${ok ? '[OK]' : '[FAIL]'} /${pagina} CLS ${cls.toFixed(4)}${errore ? ` (interrotto: ${errore})` : ''}\n`);
      if (!ok) {
        shifts.forEach((s) => {
          process.stdout.write(`  - ${s.value.toFixed(4)} a ${s.time} ms\n`);
          s.sources.forEach((src) => process.stdout.write(`      ${src.selettore} (y,altezza prima ${JSON.stringify(src.prima)} dopo ${JSON.stringify(src.dopo)})\n`));
        });
        fail += 1;
      }
    }
  } finally {
    await browser.close();
    fs.mkdirSync(path.dirname(REPORT), { recursive: true });
    fs.writeFileSync(REPORT, JSON.stringify(risultati, null, 1));
  }
  return fail ? 1 : 0;
}

main().then((code) => process.exit(code)).catch((err) => {
  console.error('[KO]', err.message);
  process.exit(1);
});
