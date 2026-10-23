#!/usr/bin/env node
'use strict';

// Focus alla chiusura dei modali con Esc: torna all'elemento che aveva aperto
// il modale, e se quell'elemento non c'e' piu' va al titolo principale (mai
// a <body>, da dove il Tab ripartirebbe da inizio pagina).
//
// Uso: node scripts/modal_focus_smoke.js   (E2E_BASE_URL come run_e2e.sh)

const { chromium } = require('playwright');

const BASE = (process.env.E2E_BASE_URL || 'http://127.0.0.1:4173').replace(/\/+$/, '');

const descrivi = () => {
  const a = document.activeElement;
  if (!a || a === document.body) return 'body';
  return `${a.tagName.toLowerCase()}${a.id ? '#' + a.id : ''} «${(a.textContent || '').trim().slice(0, 30)}»`;
};

// openModal sposta il focus nel modale con un setTimeout: focus e tasti vanno
// dati dopo, altrimenti quel setTimeout li scavalca (E2E su main, 4.24.3).
const focusDentro = (page, sel) => page.waitForFunction(
  (s) => { const m = document.querySelector(s); return !!(m && m.contains(document.activeElement)); },
  sel,
  { timeout: 5000 }
);

// Apre con la tastiera (focus + Invio), chiude con Esc, controlla il focus.
async function caso(browser, { nome, url, width = 1280, prepara, opener, prima, apertoSu, atteso }) {
  const mobile = width < 768;
  const context = await browser.newContext({ viewport: { width, height: 800 }, isMobile: mobile, hasTouch: mobile, serviceWorkers: 'block' });
  if (prepara) await context.addInitScript(prepara);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  try {
    await page.goto(`${BASE}${url}`, { waitUntil: 'networkidle' });
    if (prima) await prima(page);
    const btn = page.locator(opener).first();
    await btn.focus();
    await btn.evaluate((e) => e.setAttribute('data-test-opener', '1'));
    await page.keyboard.press('Enter');
    await page.waitForSelector(apertoSu, { timeout: 5000 });
    await focusDentro(page, apertoSu);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    const esito = await page.evaluate((sel) => {
      const a = document.activeElement;
      return {
        sulPulsante: !!(a && a.getAttribute('data-test-opener') === '1'),
        sulTitolo: !!(a && a.matches('h1')),
        ancoraAperto: !!document.querySelector(sel)
      };
    }, apertoSu);
    const dove = await page.evaluate(descrivi);
    if (esito.ancoraAperto) errors.push(`Esc non ha chiuso ${apertoSu}`);
    if (atteso === 'opener' && !esito.sulPulsante) errors.push(`focus su ${dove}, non sull'elemento che l'aveva aperto`);
    if (atteso === 'titolo' && !esito.sulTitolo) errors.push(`focus su ${dove}, non sul titolo principale`);
  } catch (err) {
    errors.push(err.message.split('\n')[0]);
  } finally {
    await context.close();
  }
  process.stdout.write(`${errors.length ? '[FAIL]' : '[OK]'} ${nome}\n`);
  errors.forEach((e) => process.stdout.write(`  - ${e}\n`));
  return errors.length;
}

const apriInfo = async (page) => {
  await page.locator('.site-footer [data-open-modal="modalInfoHub"], footer [data-open-modal="modalInfoHub"]').first().click();
  await page.waitForSelector('#modalInfoHub.open');
  await focusDentro(page, '#modalInfoHub.open');
};

const pausa = () => {
  const t = Date.now() - 40 * 60000;
  localStorage.setItem('scuolaAmica_play_timer_v1', '1');
  localStorage.setItem('scuolaAmica_play_window_v1', JSON.stringify({ startedAt: t, expiresAt: t + 1800000, cooldownUntil: t + 5400000 }));
};

async function main() {
  const browser = await chromium.launch();
  let fail = 0;
  try {
    const casi = [
      { nome: 'Info dal footer (/matematica)', url: '/matematica.html', opener: '.site-footer [data-open-modal="modalInfoHub"]', apertoSu: '#modalInfoHub.open', atteso: 'opener' },
      { nome: 'Info in alto (/matematica, 375 px)', url: '/matematica.html', width: 375, opener: '.header-info-btn', apertoSu: '#modalInfoHub.open', atteso: 'opener' },
      { nome: 'Info dal footer (home)', url: '/index.html', opener: 'footer [data-open-modal="modalInfoHub"]', apertoSu: '#modalInfoHub.open', atteso: 'opener' },
      { nome: 'Info dal footer (/privacy)', url: '/privacy.html', opener: '.site-footer [data-open-modal="modalInfoHub"]', apertoSu: '#modalInfoHub.open', atteso: 'opener' },
      { nome: 'Info > Versione (Ultimi aggiornamenti)', url: '/matematica.html', prima: apriInfo, opener: '#modalInfoHub .info-hub-btn >> text=/^Versione/', apertoSu: '#modalUpdates.open', atteso: 'opener' },
      { nome: 'Info > Il Progetto', url: '/matematica.html', prima: apriInfo, opener: '#modalInfoHub .info-hub-btn >> text=Il Progetto', apertoSu: '#modalProject.open', atteso: 'opener' },
      { nome: 'Info > Cancella dati locali (conferma)', url: '/matematica.html', prima: apriInfo, opener: '#modalInfoHub .info-hub-btn-danger', apertoSu: '#modalPromptShared.open', atteso: 'opener' },
      { nome: 'Avviso di pausa del timer (Inizia!)', url: '/matematica.html', prepara: pausa, opener: '#screenStart [data-action="start-game"]', apertoSu: '#modalPromptShared.open', atteso: 'opener' },
      { nome: 'Avviso di pausa nel Bosco (Entra nel bosco)', url: '/bosco.html', prepara: pausa, opener: '#boscoOverlayBtn', apertoSu: '#modalPromptShared.open', atteso: 'opener' },
      {
        nome: 'Bosco: «Come si gioca» dentro la radura',
        url: '/bosco.html',
        prima: async (page) => { await page.locator('#boscoOverlayBtn').click(); await page.waitForSelector('#boscoOverlay:not(.open)', { state: 'attached' }); await page.waitForTimeout(300); },
        opener: '[data-action="toggle-help"]',
        apertoSu: '#boscoOverlay.open',
        atteso: 'opener'
      },
      {
        // L'elemento che aveva aperto Info sparisce mentre Info e' aperto:
        // il focus va al titolo principale, non a <body>.
        nome: 'Elemento di apertura sparito: focus sul titolo',
        url: '/matematica.html',
        width: 375,
        opener: '.header-info-btn',
        apertoSu: '#modalInfoHub.open',
        atteso: 'titolo',
        prima: async (page) => {
          await page.evaluate(() => {
            const btn = document.querySelector('.header-info-btn');
            btn.addEventListener('click', () => setTimeout(() => btn.remove(), 0), { once: true });
          });
        }
      }
    ];
    for (const c of casi) fail += await caso(browser, c);

    // Bosco prima di entrare: Esc chiude «Come si gioca» e riporta al cancello,
    // con il focus sul suo pulsante.
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, serviceWorkers: 'block' });
    const page = await context.newPage();
    await page.goto(`${BASE}/bosco.html`, { waitUntil: 'networkidle' });
    await page.locator('[data-action="toggle-help"]').click();
    await page.waitForFunction(() => window.SA.bosco.state.helpOpen, null, { timeout: 5000 });
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !window.SA.bosco.state.helpOpen, null, { timeout: 5000 });
    const cancello = await page.evaluate(() => ({ titolo: document.getElementById('boscoOverlayTitle').textContent, focus: document.activeElement && document.activeElement.id }));
    const ok = cancello.titolo === 'Il Bosco delle Lettere' && cancello.focus === 'boscoOverlayBtn';
    process.stdout.write(`${ok ? '[OK]' : '[FAIL]'} Bosco: Esc su «Come si gioca» prima di entrare riporta al cancello\n`);
    if (!ok) { process.stdout.write(`  - ${JSON.stringify(cancello)}\n`); fail += 1; }
    await context.close();
  } finally {
    await browser.close();
  }
  return fail ? 1 : 0;
}

main().then((code) => process.exit(code)).catch((err) => {
  console.error('[KO]', err.message);
  process.exit(1);
});
