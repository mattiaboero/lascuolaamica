#!/usr/bin/env node
'use strict';

// Gioco delle tabelline (/gioco-tabelline, "Nina e le isole del vento").
// - Si carica senza errori JS e senza richieste fallite; le 13 immagini WebP
//   arrivano e le musiche .m4a e gli effetti .wav rispondono 200.
// - Titolo, "Come si gioca", Opzioni e mappa delle nove isole si aprono; la
//   partita parte e la pausa si apre con Esc.
// - Timer di gioco (SA.playWindow): spento, la partita parte; acceso e in
//   pausa, la partita non parte e compare "Pausa dal gioco"; acceso e in
//   scadenza, alla fine dei 30 minuti si torna al titolo con "Tempo di gioco
//   terminato".
// - iPhone in verticale: compare l'invito a girare il telefono. iPhone in
//   orizzontale e iPad: niente invito, la partita parte al tocco e i comandi
//   touch si vedono. Su iPhone in orizzontale la scena e' panoramica (piu'
//   larga di 960 punti), su iPad resta 960.
//
// Uso: node scripts/gioco_tabelline_smoke.js   (E2E_BASE_URL come run_e2e.sh)

const { chromium, devices } = require('playwright');

const BASE = (process.env.E2E_BASE_URL || 'http://127.0.0.1:4173').replace(/\/+$/, '');
const URL_PAGINA = `${BASE}/gioco-tabelline.html`;
const problemi = [];

async function apri(browser, opzioni, prima) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block', ...opzioni });
  const page = await context.newPage();
  page.on('pageerror', (e) => problemi.push(`errore JS: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') problemi.push(`console: ${m.text()}`); });
  page.on('response', (r) => { if (r.status() >= 400) problemi.push(`HTTP ${r.status()}: ${r.url()}`); });
  if (prima) await page.addInitScript(prima);
  await page.goto(URL_PAGINA, { waitUntil: 'networkidle' });
  await page.waitForSelector('#loading[hidden]', { state: 'attached', timeout: 20000 });
  return { context, page };
}
const inGioco = (page) => page.evaluate(() => !document.getElementById('hud').hidden);
const alTitolo = (page) => page.evaluate(() => !!document.querySelector('.title-screen'));

async function main() {
  const browser = await chromium.launch();
  try {
    let { context, page } = await apri(browser, {});
    const immagini = await page.evaluate(() => performance.getEntriesByType('resource')
      .filter((r) => /\/assets\/gioco-tabelline\/art\/.+\.webp$/.test(r.name)).length);
    if (immagini !== 13) problemi.push(`immagini caricate: ${immagini} invece di 13`);
    const audio = await page.evaluate(async () => {
      const nomi = ['theme_0.m4a', 'theme_1.m4a', 'theme_2.m4a', 'coin.wav', 'jump.wav'];
      return Promise.all(nomi.map(async (n) => (await fetch(`/assets/gioco-tabelline/audio/${n}`)).status));
    });
    if (audio.some((s) => s !== 200)) problemi.push(`audio: ${audio.join(',')}`);
    await page.click('#help');
    if (!(await page.getByText('Una riparatrice tra le nuvole').isVisible())) problemi.push('"Come si gioca" non si apre');
    await page.click('#understood');
    await page.click('#options');
    if (!(await page.getByText('Scegli il tuo vento').isVisible())) problemi.push('Opzioni non si aprono');
    await page.click('#done');
    await page.click('#map');
    if ((await page.locator('.island-card').count()) !== 9) problemi.push('la mappa non ha 9 isole');
    await page.click('#back-title');
    await page.click('#start');
    await page.waitForTimeout(600);
    if (!(await inGioco(page))) problemi.push('timer spento: la partita non parte');
    await page.keyboard.press('Escape');
    if (!(await page.getByText('Una pausa tra le nuvole').isVisible())) problemi.push('Esc non apre la pausa');
    await context.close();

    ({ context, page } = await apri(browser, {}, () => {
      const ora = Date.now();
      localStorage.setItem('scuolaAmica_play_timer_v1', '1');
      localStorage.setItem('scuolaAmica_play_window_v1', JSON.stringify({ startedAt: ora - 31 * 60000, expiresAt: ora - 60000, cooldownUntil: ora + 59 * 60000 }));
    }));
    await page.click('#start');
    await page.waitForTimeout(600);
    if (await inGioco(page)) problemi.push('timer in pausa: la partita parte lo stesso');
    if (!(await page.getByText('Pausa dal gioco').isVisible())) problemi.push('timer in pausa: manca l\'avviso');
    await context.close();

    ({ context, page } = await apri(browser, {}, () => {
      const ora = Date.now();
      localStorage.setItem('scuolaAmica_play_timer_v1', '1');
      localStorage.setItem('scuolaAmica_play_window_v1', JSON.stringify({ startedAt: ora - 30 * 60000 + 3000, expiresAt: ora + 3000, cooldownUntil: ora + 3000 + 60 * 60000 }));
    }));
    await page.click('#start');
    await page.waitForTimeout(500);
    if (!(await inGioco(page))) problemi.push('timer attivo: la partita non parte');
    await page.waitForTimeout(4500);
    if ((await inGioco(page)) || !(await alTitolo(page))) problemi.push('timer scaduto: il gioco non torna al titolo');
    if (!(await page.getByText('Tempo di gioco terminato').isVisible())) problemi.push('timer scaduto: manca l\'avviso');
    await context.close();

    ({ context, page } = await apri(browser, { ...devices['iPhone 13'] }));
    if (!(await page.getByText('Gira il telefono in orizzontale').isVisible())) problemi.push('iPhone verticale: manca l\'invito a girare il telefono');
    await context.close();

    for (const [nome, dev] of [['iPhone orizzontale', devices['iPhone 13 landscape']], ['iPad', devices['iPad (gen 7) landscape']]]) {
      ({ context, page } = await apri(browser, { ...dev }));
      await page.locator('#start').tap();
      await page.waitForTimeout(700);
      if (!(await inGioco(page))) problemi.push(`${nome}: la partita non parte al tocco`);
      const touch = await page.evaluate(() => window.getComputedStyle(document.getElementById('touch-controls')).display);
      if (touch !== 'flex') problemi.push(`${nome}: comandi touch nascosti (${touch})`);
      if (await page.getByText('Gira il telefono in orizzontale').isVisible()) problemi.push(`${nome}: compare l'invito a girare il telefono`);
      const larghezza = await page.evaluate(() => document.getElementById('game').width);
      if (nome === 'iPhone orizzontale' && larghezza <= 960) problemi.push(`iPhone orizzontale: scena non panoramica (${larghezza} punti)`);
      if (nome === 'iPad' && larghezza !== 960) problemi.push(`iPad: scena di ${larghezza} punti invece di 960`);
      await context.close();
    }
  } finally {
    await browser.close();
  }
  if (problemi.length) {
    problemi.forEach((p) => process.stdout.write(`[FAIL] gioco-tabelline: ${p}\n`));
    process.exit(1);
  }
  process.stdout.write('[OK] gioco-tabelline: caricamento, menu, partita, timer e touch\n');
}

main().catch((e) => {
  process.stderr.write(`[FAIL] gioco-tabelline: ${e.message}\n`);
  process.exit(1);
});
