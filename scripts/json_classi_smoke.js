#!/usr/bin/env node
'use strict';

// Domande per classe (dalla 4.26.0): /matematica scarica solo le classi che
// servono alla classe scelta (json/matematica/c<N>.json, questions-loader.js),
// mai il file intero; al cambio classe arriva solo la classe nuova e si
// gioca; offline una classe gia' usata funziona, una mai aperta da' il
// messaggio di sempre. Rete lenta come il test del CLS (150 ms, 1,6 Mbit/s).
//
// Uso: node scripts/json_classi_smoke.js   (E2E_BASE_URL come run_e2e.sh)

const { chromium } = require('playwright');

const BASE = (process.env.E2E_BASE_URL || 'http://127.0.0.1:4173').replace(/\/+$/, '');
const CLASSE = 'matematica_programma_cursor_v3_class_pref_v1';

async function nuovaPagina(browser, { classe, sw }) {
  const context = await browser.newContext({ viewport: { width: 412, height: 823 }, serviceWorkers: sw ? 'allow' : 'block' });
  if (classe) await context.addInitScript(([k, v]) => { if (!sessionStorage.getItem('__seed')) { sessionStorage.setItem('__seed', '1'); localStorage.setItem(k, v); } }, [CLASSE, String(classe)]);
  const page = await context.newPage();
  const json = [];
  page.on('request', (r) => { if (r.url().includes('/json/')) json.push(new URL(r.url()).pathname); });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  return { context, page, json, errors };
}

async function lenta(context, page) {
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8 });
}

const aree = (page) => page.locator('#areaGrid .area-btn:not([hidden])').count();

async function gioca(page) {
  await page.locator('#screenStart [data-action="start-game"]').click();
  await page.waitForSelector('#screenGame.active', { timeout: 15000 });
  return page.locator('#qText').innerText();
}

// a) rete lenta, classe 4: solo 3ª, 4ª, 5ª e bonus; poi la 1ª.
async function soloLeClassiScelte(browser) {
  const { context, page, json, errors } = await nuovaPagina(browser, { classe: 4 });
  try {
    await lenta(context, page);
    await page.goto(`${BASE}/matematica.html`, { waitUntil: 'networkidle', timeout: 60000 });
    const domande = json.filter((p) => p !== '/json/index.json').sort();
    const attese = ['/json/matematica/bonus.json', '/json/matematica/c3.json', '/json/matematica/c4.json', '/json/matematica/c5.json'];
    if (JSON.stringify(domande) !== JSON.stringify(attese)) errors.push(`classe 4 scarica ${domande.join(', ')}`);
    if (!(await aree(page))) errors.push('classe 4: nessun ambito');

    json.length = 0;
    await page.locator('.class-btn[data-class="1"]').click();
    await page.waitForLoadState('networkidle');
    if (JSON.stringify(json) !== JSON.stringify(['/json/matematica/c1.json'])) errors.push(`cambio in 1ª scarica ${json.join(', ') || 'niente'}`);
    if (!(await aree(page))) errors.push('1ª: nessun ambito');
    const testo = await gioca(page);
    if (!testo.trim()) errors.push('1ª: domanda vuota');
  } catch (err) {
    errors.push(err.message.split('\n')[0]);
  } finally {
    await context.close();
  }
  return errors;
}

// b) offline: la 3ª usata con la rete si gioca senza; la 1ª mai aperta no.
async function offline(browser) {
  const { context, page, json, errors } = await nuovaPagina(browser, { classe: 3, sw: true });
  try {
    await page.goto(`${BASE}/matematica.html`, { waitUntil: 'networkidle' });
    await page.evaluate(() => navigator.serviceWorker.ready);
    // Seconda apertura con il service worker al comando: le classi passano da lui.
    await page.reload({ waitUntil: 'networkidle' });
    if (!(await page.evaluate(() => !!navigator.serviceWorker.controller))) throw new Error('service worker non attivo');
    await context.setOffline(true);
    json.length = 0;
    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(800);
    if (!(await aree(page))) errors.push('offline, 3ª: nessun ambito');
    const testo = await gioca(page);
    if (!testo.trim()) errors.push('offline, 3ª: domanda vuota');
    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(800);
    await page.locator('.class-btn[data-class="1"]').click();
    const messaggio = await page.waitForSelector('#modalPromptShared.open', { timeout: 8000 }).then(() => page.locator('#modalPromptShared').innerText()).catch(() => '');
    if (!/Non riesco a caricare le domande/.test(messaggio)) errors.push('offline, 1ª mai aperta: nessun messaggio');
  } catch (err) {
    errors.push(err.message.split('\n')[0]);
  } finally {
    await context.close();
  }
  return errors;
}

async function main() {
  const browser = await chromium.launch();
  let fail = 0;
  try {
    const prove = [
      ['rete lenta: solo le classi scelte, poi la 1ª', soloLeClassiScelte],
      ['offline: la classe usata si gioca, quella mai aperta da\' il messaggio', offline]
    ];
    for (const [nome, prova] of prove) {
      const errors = await prova(browser);
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
