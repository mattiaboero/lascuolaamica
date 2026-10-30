#!/usr/bin/env node
'use strict';

// Accessibilita' automatica (WCAG 2.2 AA con axe-core) e titoli senza emoji.
// - axe su home, /matematica (scelta e partita), /tabelline,
//   /tabellina-del-27, /bosco, /sistema-solare, /gioco-tabelline, /privacy,
//   in tema chiaro e scuro: zero violazioni.
// - Su tutte le pagine pubbliche nessun H1 ha emoji nel nome accessibile
//   (le emoji stanno in <span aria-hidden="true">).
// axe non vede tutto (il contrasto sui gradienti lo misura
// npm run check:contrast): conta come controllo minimo, non come verifica.
//
// Uso: node scripts/a11y_smoke.js   (E2E_BASE_URL come run_e2e.sh)

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const BASE = (process.env.E2E_BASE_URL || 'http://127.0.0.1:4173').replace(/\/+$/, '');
const AXE = require.resolve('axe-core/axe.min.js');
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const EMOJI = /\p{Extended_Pictographic}/u;

const PROVE = [
  { nome: 'home', url: '/index.html' },
  { nome: '/matematica (scelta)', url: '/matematica.html' },
  {
    nome: '/matematica (partita)',
    url: '/matematica.html',
    prima: async (page) => {
      await page.locator('#screenStart [data-action="start-game"]').click();
      await page.waitForSelector('#screenGame.active');
      await page.locator('#answers .answer-btn').first().click();
      await page.waitForTimeout(300);
    }
  },
  { nome: '/tabelline', url: '/tabelline.html' },
  { nome: '/tabellina-del-27', url: '/tabellina-del-27.html' },
  { nome: '/bosco', url: '/bosco.html' },
  { nome: '/sistema-solare', url: '/sistema-solare.html' },
  { nome: '/gioco-tabelline', url: '/gioco-tabelline.html' },
  { nome: '/privacy', url: '/privacy.html' }
];

async function axe(page) {
  await page.addScriptTag({ path: AXE });
  return page.evaluate(async (tags) => {
    const r = await window.axe.run(document, { runOnly: { type: 'tag', values: tags }, resultTypes: ['violations'] });
    return r.violations.map((v) => ({ id: v.id, impatto: v.impact, nodi: v.nodes.slice(0, 3).map((n) => n.target.join(' ')) }));
  }, TAGS);
}

async function main() {
  const browser = await chromium.launch();
  const errori = [];
  try {
    for (const tema of ['light', 'dark']) {
      for (const prova of PROVE) {
        const context = await browser.newContext({ viewport: { width: 412, height: 823 }, colorScheme: tema, serviceWorkers: 'block', reducedMotion: 'reduce' });
        const page = await context.newPage();
        await page.goto(`${BASE}${prova.url}`, { waitUntil: 'networkidle' });
        if (prova.prima) await prova.prima(page);
        const violazioni = await axe(page);
        violazioni.forEach((v) => errori.push(`${prova.nome} (${tema}): ${v.id} [${v.impatto}] ${v.nodi.join(' | ')}`));
        await context.close();
      }
    }

    // H1 di tutte le pagine pubbliche (radice del repo, *.html).
    const pagine = fs.readdirSync(path.join(__dirname, '..')).filter((f) => f.endsWith('.html'));
    const context = await browser.newContext({ serviceWorkers: 'block' });
    const page = await context.newPage();
    for (const f of pagine) {
      await page.goto(`${BASE}/${f}`, { waitUntil: 'domcontentloaded' });
      const titoli = await page.getByRole('heading', { level: 1 }).evaluateAll((els) => els.map((e) => e.id || e.className));
      for (let i = 0; i < titoli.length; i++) {
        const snap = await page.getByRole('heading', { level: 1 }).nth(i).ariaSnapshot();
        if (EMOJI.test(snap)) errori.push(`${f}: H1 con emoji nel nome accessibile (${snap.trim()})`);
      }
    }
    await context.close();
  } finally {
    await browser.close();
  }
  process.stdout.write(`${errori.length ? '[FAIL]' : '[OK]'} accessibilita': axe WCAG 2.2 AA su ${PROVE.length} viste x 2 temi, H1 senza emoji\n`);
  errori.forEach((e) => process.stdout.write(`  - ${e}\n`));
  return errori.length ? 1 : 0;
}

main().then((code) => process.exit(code)).catch((err) => {
  console.error('[KO]', err.message);
  process.exit(1);
});
