#!/usr/bin/env node
'use strict';

// Aggiornamento silenzioso del service worker (shared.js): con un worker in
// attesa non compare nessun modale e il sito non si ricarica durante una
// partita; la versione nuova si attiva alla navigazione successiva (al
// massimo 1 s di attesa, senza rete il link funziona come prima), oppure
// quando la scheda torna visibile dopo almeno 30 minuti nascosta, se non si
// sta giocando e non si e' nel Sistema Solare. Orologio simulato
// (page.clock) e visibilita' della scheda comandata dal test.
//
// Un server statico suo serve sw.js e, a comando, una variante che a un
// messaggio «versione?» risponde «variante»: cosi' si sa quale worker
// controlla la pagina.
//
// Uso: node scripts/sw_update_smoke.js

const http = require('http');
const fs = require('fs');
const path = require('path');
const { fileServito } = require('./lib/percorso_sicuro.js');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json' };
const VARIANTE = "\nself.addEventListener('message', (e) => { if (e.data === 'versione?' && e.source) e.source.postMessage('variante'); });\n";
let variante = false;
// Variante che ignora skipWaiting: il worker nuovo resta in attesa, per
// provare il tempo massimo di 1 s sul clic.
let bloccata = false;
const BLOCCA = 'self.skipWaiting = () => Promise.resolve();\n';

function serve() {
  const server = http.createServer((req, res) => {
    const trovato = fileServito(ROOT, req.url);
    if (!trovato) {
      res.writeHead(404);
      res.end();
      return;
    }
    const { file, rel } = trovato;
    const headers = { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' };
    if (rel === 'sw.js') {
      res.writeHead(200, headers);
      res.end((bloccata ? BLOCCA : '') + fs.readFileSync(file, 'utf8') + (variante ? VARIANTE : ''));
      return;
    }
    res.writeHead(200, headers);
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

const versione = (page) => page.evaluate(() => new Promise((resolve) => {
  const sw = navigator.serviceWorker;
  if (!sw.controller) { resolve('nessuna'); return; }
  const t = setTimeout(() => resolve('vecchia'), 2000);
  sw.addEventListener('message', (e) => { clearTimeout(t); resolve(e.data); }, { once: true });
  sw.controller.postMessage('versione?');
}));

// Scheda nascosta per «minuti» di orologio simulato, poi di nuovo visibile.
async function assente(page, minuti) {
  await page.evaluate(() => { window.__visibilita = 'hidden'; document.dispatchEvent(new Event('visibilitychange')); });
  await page.clock.fastForward(minuti * 60 * 1000);
  await page.evaluate(() => { window.__visibilita = 'visible'; document.dispatchEvent(new Event('visibilitychange')); });
}

async function preparaWorkerInAttesa(page, opzioni) {
  variante = true;
  bloccata = !!(opzioni && opzioni.bloccata);
  await page.evaluate(async () => { const reg = await navigator.serviceWorker.getRegistration(); await reg.update(); });
  // waitForFunction con una funzione async prende la Promise come «vera»:
  // si interroga la registrazione finche' il worker nuovo non e' in attesa.
  for (let i = 0; i < 120; i++) {
    if (await page.evaluate(async () => !!(await navigator.serviceWorker.getRegistration()).waiting)) return;
    await page.waitForTimeout(250);
  }
  throw new Error('il worker nuovo non e\' mai arrivato in attesa');
}

async function apri(browser, base, url, opzioni) {
  variante = false;
  bloccata = false;
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  // Visibilita' della scheda comandata dal test: in headless e' sempre visible.
  await context.addInitScript(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => window.__visibilita || 'visible' });
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => (window.__visibilita || 'visible') === 'hidden' });
  });
  const page = await context.newPage();
  if (opzioni && opzioni.orologio) await page.clock.install();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(`${base}${url}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload({ waitUntil: 'networkidle' });
  if ((await versione(page)) !== 'vecchia') errors.push('la pagina non e\' controllata dal worker iniziale');
  return { context, page, errors };
}

// Partita in corso + worker in attesa + scheda che torna visibile: niente
// modale, niente ricaricamento, versione vecchia ancora attiva.
async function nessunRicaricamento(page, errors, inGioco) {
  await page.evaluate(() => { window.__marcatore = 1; });
  await preparaWorkerInAttesa(page);
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await page.waitForTimeout(2500);
  const stato = await page.evaluate(() => ({ marcatore: window.__marcatore, modale: !!document.querySelector('.modal-overlay.open') }));
  if (stato.marcatore !== 1) errors.push('la pagina si e\' ricaricata durante la partita');
  if (stato.modale) errors.push('e\' comparso un modale');
  if (!(await page.evaluate(inGioco))) errors.push('la partita non e\' piu\' in corso');
  if ((await versione(page)) !== 'vecchia') errors.push('la versione nuova si e\' attivata durante la partita');
}

async function main() {
  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();
  let fail = 0;
  const report = (nome, errors) => {
    process.stdout.write(`${errors.length ? '[FAIL]' : '[OK]'} ${nome}\n`);
    errors.forEach((e) => process.stdout.write(`  - ${e}\n`));
    fail += errors.length;
  };
  try {
    // 1. Quiz: durante la partita niente; al clic su «Menu» la home e' gia' nuova.
    {
      const { context, page, errors } = await apri(browser, base, '/matematica.html');
      await page.locator('#screenStart [data-action="start-game"]').click();
      await page.waitForSelector('#screenGame.active');
      await nessunRicaricamento(page, errors, () => !!document.querySelector('#screenGame.active'));
      await Promise.all([page.waitForURL(`${base}/`, { timeout: 15000 }), page.locator('a.back-btn').click()]);
      await page.waitForLoadState('networkidle');
      if ((await versione(page)) !== 'variante') errors.push('dopo la navigazione la versione nuova non e\' attiva');
      report('quiz: niente durante la partita, versione nuova alla navigazione successiva', errors);
      await context.close();
    }
    // 2. Bosco dentro la radura.
    {
      const { context, page, errors } = await apri(browser, base, '/bosco.html');
      await page.locator('#boscoOverlayBtn').click();
      await page.waitForFunction(() => window.SA.bosco.state.inGioco);
      await nessunRicaricamento(page, errors, () => window.SA.bosco.state.inGioco);
      report('Bosco: niente mentre si gioca', errors);
      await context.close();
    }
    // 3. Spacca-Muri con la pallina in gioco.
    {
      const { context, page, errors } = await apri(browser, base, '/breakout.html');
      await page.locator('#classGrid .class-btn', { hasText: 'Classe 3ª' }).click();
      await page.locator('[data-action="start-game"]').first().click();
      await page.waitForFunction(() => window.SA.breakout.state.running);
      await nessunRicaricamento(page, errors, () => window.SA.breakout.state.running);
      report('Spacca-Muri: niente mentre si gioca', errors);
      await context.close();
    }
    // 4. Ritorno sulla scheda dopo 5 minuti: niente ricaricamento; la versione
    //    nuova arriva alla navigazione successiva.
    {
      const { context, page, errors } = await apri(browser, base, '/faq.html', { orologio: true });
      await preparaWorkerInAttesa(page);
      if (await page.evaluate(() => !!document.querySelector('.modal-overlay.open'))) errors.push('e\' comparso un modale');
      await page.evaluate(() => { window.__marcatore = 1; });
      await assente(page, 5);
      await page.waitForTimeout(1500);
      if ((await page.evaluate(() => window.__marcatore)) !== 1) errors.push('la pagina si e\' ricaricata dopo 5 minuti');
      if ((await versione(page)) !== 'vecchia') errors.push('la versione nuova si e\' attivata al ritorno dopo 5 minuti');
      await Promise.all([page.waitForURL(`${base}/`, { timeout: 15000 }), page.locator('a.back-btn').click()]);
      await page.waitForLoadState('networkidle');
      if ((await versione(page)) !== 'variante') errors.push('alla navigazione successiva la versione nuova non e\' attiva');
      report('ritorno dopo 5 minuti: niente ricaricamento, versione nuova alla navigazione', errors);
      await context.close();
    }
    // 5. Ritorno sulla scheda dopo 31 minuti, senza partita: ricaricamento.
    {
      const { context, page, errors } = await apri(browser, base, '/faq.html', { orologio: true });
      await preparaWorkerInAttesa(page);
      await Promise.all([page.waitForEvent('load', { timeout: 15000 }), assente(page, 31)]);
      await page.waitForLoadState('networkidle');
      if ((await versione(page)) !== 'variante') errors.push('dopo il ritorno la versione nuova non e\' attiva');
      report('ritorno dopo 31 minuti senza partita: ricaricamento con la versione nuova', errors);
      await context.close();
    }
    // 6. Sistema Solare: nessun ricaricamento al ritorno, nemmeno dopo 31 minuti
    //    e fuori da viaggio e film.
    {
      const { context, page, errors } = await apri(browser, base, '/sistema-solare.html', { orologio: true });
      await preparaWorkerInAttesa(page);
      await page.evaluate(() => { window.__marcatore = 1; });
      if (await page.evaluate(() => window.SA.sistemaSolare.inCorso())) errors.push('viaggio o film gia\' in corso: il caso non prova niente');
      await assente(page, 31);
      await page.waitForTimeout(1500);
      if ((await page.evaluate(() => window.__marcatore)) !== 1) errors.push('il Sistema Solare si e\' ricaricato');
      if ((await versione(page)) !== 'vecchia') errors.push('la versione nuova si e\' attivata nel Sistema Solare');
      report('Sistema Solare: niente ricaricamento al ritorno dopo 31 minuti', errors);
      await context.close();
    }
    // 7. Tempo massimo superato: il worker nuovo non si attiva, la navigazione
    //    parte comunque entro poco piu' di 1 s.
    {
      const { context, page, errors } = await apri(browser, base, '/faq.html');
      await preparaWorkerInAttesa(page, { bloccata: true });
      const t0 = Date.now();
      await Promise.all([page.waitForURL(`${base}/`, { timeout: 15000 }), page.locator('a.back-btn').click()]);
      const ms = Date.now() - t0;
      if (ms > 2500) errors.push(`la navigazione e' partita dopo ${ms} ms`);
      await page.waitForLoadState('networkidle');
      if ((await versione(page)) !== 'vecchia') errors.push('il worker bloccato risulta attivo');
      report(`tempo massimo superato: navigazione dopo ${ms} ms, versione vecchia ancora attiva`, errors);
      await context.close();
    }
    // 8. Senza rete: il link interno funziona come prima, senza trattenere il
    //    clic e senza attivare il worker nuovo.
    {
      const { context, page, errors } = await apri(browser, base, '/faq.html');
      await preparaWorkerInAttesa(page);
      await context.setOffline(true);
      const t0 = Date.now();
      await Promise.all([page.waitForURL(`${base}/`, { timeout: 15000 }), page.locator('a.back-btn').click()]);
      const ms = Date.now() - t0;
      await page.waitForLoadState('domcontentloaded');
      const titolo = await page.evaluate(() => (document.querySelector('h1') || {}).textContent || '');
      if (!/La Scuola Amica/.test(titolo)) errors.push(`senza rete la home non si apre (titolo «${titolo.trim()}»)`);
      const ancoraInAttesa = await page.evaluate(async () => !!(await navigator.serviceWorker.getRegistration()).waiting);
      if (!ancoraInAttesa) errors.push('senza rete il worker nuovo e\' stato attivato');
      report(`senza rete: link interno aperto dalla cache in ${ms} ms, worker nuovo ancora in attesa`, errors);
      await context.close();
    }
  } finally {
    await browser.close();
    server.close();
  }
  return fail ? 1 : 0;
}

main().then((code) => process.exit(code)).catch((err) => {
  console.error('[KO]', err.message);
  process.exit(1);
});
