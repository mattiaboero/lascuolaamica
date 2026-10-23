#!/usr/bin/env node
'use strict';

// Timer di gioco facoltativo (shared.js, SA.playWindow). Spento di default:
// «Inizia!» parte subito in una materia, nel Bosco e in Spacca-Muri, senza
// modale e senza nessun elemento del timer a schermo. Acceso dal pannello
// Info: la sessione parte alla prima partita, dopo 30 minuti la partita si
// chiude e parte la pausa, dopo altri 60 si gioca di nuovo. Spegnerlo durante
// la pausa sblocca subito. Un record vecchio con la pausa in corso non blocca
// nessuno a timer spento.
//
// L'orologio e' simulato (page.clock): nessuna attesa reale di 30 minuti.
//
// Uso: node scripts/timer_gioco_smoke.js   (E2E_BASE_URL come run_e2e.sh)

const { chromium } = require('playwright');

const BASE = (process.env.E2E_BASE_URL || 'http://127.0.0.1:4173').replace(/\/+$/, '');
const TIMER_KEY = 'scuolaAmica_play_timer_v1';
const WINDOW_KEY = 'scuolaAmica_play_window_v1';
const T0 = new Date('2026-10-23T09:00:00+02:00').getTime();
const MIN = 60 * 1000;

async function nuovaPagina(browser, storage) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.clock.install({ time: T0 });
  // Solo al primo caricamento: dopo, lo stato lo decide la pagina.
  await page.addInitScript((items) => {
    if (sessionStorage.getItem('__seeded')) return;
    sessionStorage.setItem('__seeded', '1');
    Object.entries(items).forEach(([k, v]) => localStorage.setItem(k, v));
  }, storage);
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  return { context, page, errors };
}

const modaleAperta = (page) => page.locator('#modalPromptShared.open').count();
const giocoAttivo = (page) => page.locator('#screenGame.active').count();
const leggi = (page, key) => page.evaluate((k) => localStorage.getItem(k), key);

async function nessunTimerVisibile(page, errors, dove) {
  const elementi = await page.locator('[data-play-window-panel], .play-window-panel, [data-play-window-pill]').count();
  if (elementi) errors.push(`${dove}: ${elementi} elementi del timer nella pagina`);
  const testo = await page.evaluate(() => document.body.innerText);
  if (/Attiva 30 minuti|30:00/.test(testo)) errors.push(`${dove}: testo del timer visibile`);
}

async function avviaQuiz(page) {
  await page.locator('#screenStart [data-action="start-game"]').click();
  await page.waitForTimeout(300);
}

// a) timer spento: si parte subito ovunque.
async function timerSpento(browser) {
  const { context, page, errors } = await nuovaPagina(browser, {});
  try {
    await page.goto(`${BASE}/index.html`, { waitUntil: 'networkidle' });
    await nessunTimerVisibile(page, errors, 'home');

    await page.goto(`${BASE}/matematica.html`, { waitUntil: 'networkidle' });
    await nessunTimerVisibile(page, errors, '/matematica');
    await avviaQuiz(page);
    if (await modaleAperta(page)) errors.push('/matematica: modale aperta a timer spento');
    if (!(await giocoAttivo(page))) errors.push('/matematica: la partita non parte');
    await nessunTimerVisibile(page, errors, '/matematica in gioco');

    await page.goto(`${BASE}/bosco.html`, { waitUntil: 'networkidle' });
    await nessunTimerVisibile(page, errors, '/bosco');
    await page.locator('#boscoOverlayBtn').click();
    await page.waitForTimeout(200);
    if (await modaleAperta(page)) errors.push('/bosco: modale aperta a timer spento');
    if (!(await page.evaluate(() => window.SA.bosco.state.inGioco))) errors.push('/bosco: non si entra nel bosco');

    await page.goto(`${BASE}/breakout.html`, { waitUntil: 'networkidle' });
    await nessunTimerVisibile(page, errors, '/breakout');
    await page.locator('#classGrid .class-btn', { hasText: 'Classe 3ª' }).click();
    await page.locator('[data-action="start-game"]').first().click();
    await page.waitForTimeout(500);
    if (await modaleAperta(page)) errors.push('/breakout: modale aperta a timer spento');
    if (!(await page.evaluate(() => window.SA.breakout.state.running))) errors.push('/breakout: la partita non parte');
  } finally {
    await context.close();
  }
  return errors;
}

// b) timer acceso: 30 minuti, pausa di 60, poi di nuovo.
async function timerAcceso(browser) {
  const { context, page, errors } = await nuovaPagina(browser, { [TIMER_KEY]: '1' });
  try {
    await page.goto(`${BASE}/matematica.html`, { waitUntil: 'networkidle' });
    await nessunTimerVisibile(page, errors, '/matematica');
    await avviaQuiz(page);
    if (await modaleAperta(page)) errors.push('alla prima partita si apre una modale');
    if (!(await giocoAttivo(page))) errors.push('alla prima partita il gioco non parte');
    if (!(await leggi(page, WINDOW_KEY))) errors.push('la sessione non e\' partita alla prima partita');
    await nessunTimerVisibile(page, errors, '/matematica in gioco');

    await page.clock.fastForward(30 * MIN + 2000);
    await page.waitForSelector('#modalPromptShared.open', { timeout: 5000 });
    const fine = await page.locator('#sharedPromptTitle').textContent();
    if (!/Tempo di gioco terminato/.test(fine)) errors.push(`dopo 30 minuti titolo «${fine}»`);
    if (await giocoAttivo(page)) errors.push('dopo 30 minuti la partita resta aperta');
    await page.locator('#sharedPromptConfirm').click();

    await avviaQuiz(page);
    const msg = await page.locator('#sharedPromptMessage').textContent();
    if (!/tra 60 minuti/.test(msg) || !/pannello Info/.test(msg)) errors.push(`messaggio di pausa: «${msg}»`);
    const focus = await page.evaluate(() => document.activeElement && document.activeElement.id);
    if (focus !== 'sharedPromptMessage') errors.push(`focus durante la pausa su «${focus}»`);
    if (await giocoAttivo(page)) errors.push('durante la pausa la partita parte');
    await page.locator('#sharedPromptConfirm').click();

    await page.clock.fastForward(60 * MIN);
    await avviaQuiz(page);
    if (await modaleAperta(page)) errors.push('dopo la pausa si apre una modale');
    if (!(await giocoAttivo(page))) errors.push('dopo la pausa la partita non parte');
  } finally {
    await context.close();
  }
  return errors;
}

// c) spegnere il timer durante la pausa sblocca subito.
async function spentoInPausa(browser) {
  const inizio = T0 - 40 * MIN;
  const record = JSON.stringify({ startedAt: inizio, expiresAt: inizio + 30 * MIN, cooldownUntil: inizio + 90 * MIN });
  const { context, page, errors } = await nuovaPagina(browser, { [TIMER_KEY]: '1', [WINDOW_KEY]: record });
  try {
    await page.goto(`${BASE}/matematica.html`, { waitUntil: 'networkidle' });
    await avviaQuiz(page);
    if (!(await modaleAperta(page))) errors.push('in pausa non compare il messaggio');
    await page.locator('#sharedPromptConfirm').click();

    await page.locator('[data-open-modal="modalInfoHub"]').first().click();
    const sw = page.locator('#playTimerSwitch');
    if ((await sw.getAttribute('role')) !== 'switch') errors.push('l\'interruttore non ha role="switch"');
    const nome = await sw.evaluate((el) => el.labels && el.labels[0] && el.labels[0].textContent.trim());
    if (nome !== 'Tempo di gioco (per i genitori)') errors.push(`etichetta interruttore «${nome}»`);
    if (!(await sw.isChecked())) errors.push('interruttore spento con il timer acceso');
    await sw.focus();
    await page.keyboard.press('Space');
    if (await sw.isChecked()) errors.push('la barra spaziatrice non spegne l\'interruttore');
    if (await leggi(page, TIMER_KEY) !== '0') errors.push('timer non salvato come spento');
    if (await leggi(page, WINDOW_KEY)) errors.push('la pausa resta in memoria dopo lo spegnimento');
    await page.keyboard.press('Escape');

    await avviaQuiz(page);
    if (await modaleAperta(page)) errors.push('spento il timer, compare ancora una modale');
    if (!(await giocoAttivo(page))) errors.push('spento il timer, la partita non parte');
  } finally {
    await context.close();
  }
  return errors;
}

// d) record vecchio con pausa attiva, timer mai acceso: non blocca.
async function recordVecchio(browser) {
  const inizio = T0 - 35 * MIN;
  const record = JSON.stringify({ startedAt: inizio, expiresAt: inizio + 30 * MIN, cooldownUntil: inizio + 90 * MIN });
  const { context, page, errors } = await nuovaPagina(browser, { [WINDOW_KEY]: record });
  try {
    await page.goto(`${BASE}/matematica.html`, { waitUntil: 'networkidle' });
    if (await leggi(page, WINDOW_KEY)) errors.push('il record vecchio non viene cancellato');
    await avviaQuiz(page);
    if (await modaleAperta(page)) errors.push('il record vecchio apre una modale');
    if (!(await giocoAttivo(page))) errors.push('il record vecchio blocca la partita');
  } finally {
    await context.close();
  }
  return errors;
}

async function main() {
  const browser = await chromium.launch();
  let fail = 0;
  const casi = [
    ['timer spento: si parte subito ovunque', timerSpento],
    ['timer acceso: 30 minuti, pausa di 60, di nuovo', timerAcceso],
    ['spegnere il timer durante la pausa sblocca', spentoInPausa],
    ['record vecchio in pausa, timer spento: nessun blocco', recordVecchio]
  ];
  try {
    for (const [nome, fn] of casi) {
      const errors = await fn(browser);
      process.stdout.write(`${errors.length ? '[FAIL]' : '[OK]'} ${nome}\n`);
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
