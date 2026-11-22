#!/usr/bin/env node
'use strict';

// Tutte le pagine del sito, in tutte le modalita' che un visitatore usa:
// telefono (360, 390), tablet (768 verticale, 1024 orizzontale), desktop
// (1280, 1440), palette Okabe-Ito (360 e 1280) e zoom al 200% (finestra da
// 1280x800 vista come 640x400 a densita' 2). Ogni giro in un contesto nuovo,
// senza service worker, con riduzione del movimento.
//
// Su ogni giro: le regole di scripts/lib/qa_regole.js (scroll orizzontale,
// riquadri vuoti, testo attaccato, elementi senza stile, sovrapposizioni,
// testo coperto o tagliato, bersagli piccoli, font estranei), piu' errori
// JavaScript, errori in console e richieste verso altri host (il sito non ne
// deve fare).
//
// Le eccezioni stanno in ECCEZIONI, ognuna col suo motivo. Un'eccezione che non
// scatta piu' fa fallire il controllo: va tolta.
//
// Uso: node scripts/qa_pagine.js [--rapporto] [--solo pagina.html,...]
//      --rapporto  stampa tutto ed esce 0 (per smistare i problemi)

const http = require('http');
const fs = require('fs');
const path = require('path');
const { fileServito } = require('./lib/percorso_sicuro.js');
const { controlla, attendiRender } = require('./lib/qa_regole.js');
// QA_BROWSER=webkit fa girare gli stessi controlli nel motore di Safari.
const playwright = require('playwright');
const MOTORE = process.env.QA_BROWSER || 'chromium';
if (!['chromium', 'webkit'].includes(MOTORE)) throw new Error(`QA_BROWSER sconosciuto: ${MOTORE}`);

const ROOT = path.join(__dirname, '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.bin': 'application/octet-stream', '.mp3': 'audio/mpeg', '.txt': 'text/plain' };
const ARGS = process.argv.slice(2);
const RAPPORTO = ARGS.includes('--rapporto');
const SOLO = ARGS.includes('--solo') ? ARGS[ARGS.indexOf('--solo') + 1].split(',') : null;
const PAGINE = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html') && (!SOLO || SOLO.includes(f))).sort();

const TELEFONO = { isMobile: true, hasTouch: true };
const MODI = [
  { nome: 'telefono-360', viewport: { width: 360, height: 740 }, ...TELEFONO },
  { nome: 'telefono-390', viewport: { width: 390, height: 844 }, ...TELEFONO },
  { nome: 'tablet-768', viewport: { width: 768, height: 1024 }, hasTouch: true },
  { nome: 'tablet-1024', viewport: { width: 1024, height: 768 }, hasTouch: true },
  { nome: 'desktop-1280', viewport: { width: 1280, height: 800 } },
  { nome: 'desktop-1440', viewport: { width: 1440, height: 900 } },
  { nome: 'okabe-360', viewport: { width: 360, height: 740 }, ...TELEFONO, query: '?palette=okabe-ito' },
  { nome: 'okabe-1280', viewport: { width: 1280, height: 800 }, query: '?palette=okabe-ito' },
  { nome: 'zoom-200', viewport: { width: 640, height: 400 }, deviceScaleFactor: 2 }
];

// Selettori esclusi dalle regole su tutte le pagine, con il motivo.
const ESCLUDI = [
  '.ss-app', // Sistema Solare: scena WebGL a tutto schermo con pannelli sovrapposti per scelta
  'canvas', // i giochi disegnano su canvas
  '.skip-link', // compare solo col focus
  '.ruota-telefono' // gioco di Nina in verticale: cartello «gira il telefono» a tutto schermo, per scelta
];

// Eccezioni puntuali: { pagina (regex), modo (regex), regola, dove (sottostringa), motivo }.
const ECCEZIONI = [];

function serve() {
  const server = http.createServer((req, res) => {
    const trovato = fileServito(ROOT, req.url) || fileServito(ROOT, `${req.url.split(/[?#]/)[0]}.html`);
    if (!trovato) {
      res.writeHead(404);
      res.end();
      return;
    }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(trovato.file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    fs.createReadStream(trovato.file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

async function giro(browser, base, pagina, modo) {
  const { nome, query, ...opzioni } = modo;
  const context = await browser.newContext({ ...opzioni, serviceWorkers: 'block', reducedMotion: 'reduce' });
  const page = await context.newPage();
  const trovati = [];
  const host = new URL(base).host;
  page.on('pageerror', (e) => trovati.push({ regola: 'errore-js', dove: 'pagina', dettaglio: e.message.split('\n')[0] }));
  page.on('console', (m) => { if (m.type() === 'error') trovati.push({ regola: 'errore-console', dove: 'pagina', dettaglio: m.text().slice(0, 120) }); });
  page.on('request', (r) => {
    const u = new URL(r.url());
    if (/^https?:$/.test(u.protocol) && u.host !== host) trovati.push({ regola: 'richiesta-esterna', dove: 'pagina', dettaglio: r.url().slice(0, 120) });
  });
  page.on('response', (r) => { if (r.status() >= 400 && new URL(r.url()).host === host) trovati.push({ regola: 'risorsa-mancante', dove: 'pagina', dettaglio: `${r.status()} ${new URL(r.url()).pathname}` }); });
  try {
    await page.goto(`${base}/${pagina}${query || ''}`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(150);
    await attendiRender(page);
    trovati.push(...await page.evaluate(controlla, { escludi: ESCLUDI }));
    // le domande frequenti aperte: il testo chiuso nei <details> va visto
    const chiavi = new Set(trovati.map((t) => `${t.regola}|${t.dove}`));
    if (await page.evaluate(() => { const d = document.querySelectorAll('details:not([open])'); d.forEach((x) => { x.open = true; }); return d.length; })) {
      await page.waitForTimeout(80);
      for (const p of await page.evaluate(controlla, { escludi: ESCLUDI })) {
        if (!chiavi.has(`${p.regola}|${p.dove}`)) trovati.push({ ...p, dettaglio: `${p.dettaglio} (details aperti)` });
      }
    }
    // in fondo alla pagina (anche se non scorre): li' sticky e fixed non
    // devono coprire niente
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(100);
    for (const p of await page.evaluate(controlla, { escludi: ESCLUDI, inFondo: true })) if (p.regola === 'coperto') trovati.push({ ...p, dettaglio: `${p.dettaglio} (in fondo)` });
  } catch (err) {
    trovati.push({ regola: 'giro', dove: 'pagina', dettaglio: err.message.split('\n')[0] });
  } finally {
    await context.close();
  }
  return trovati.map((t) => ({ ...t, pagina, modo: nome }));
}

async function main() {
  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await playwright[MOTORE].launch();
  const coda = [];
  for (const pagina of PAGINE) for (const modo of MODI) coda.push([pagina, modo]);
  const tutti = [];
  const inizio = Date.now();
  try {
    const lavoratori = Array.from({ length: 4 }, async () => {
      while (coda.length) {
        const [pagina, modo] = coda.shift();
        tutti.push(...await giro(browser, base, pagina, modo));
      }
    });
    await Promise.all(lavoratori);
  } finally {
    await browser.close();
    server.close();
  }

  const usate = new Set();
  const errori = tutti.filter((t) => {
    const i = ECCEZIONI.findIndex((e) => new RegExp(e.pagina).test(t.pagina) && new RegExp(e.modo).test(t.modo) && e.regola === t.regola && t.dove.includes(e.dove));
    if (i >= 0) { usate.add(i); return false; }
    return true;
  });
  const giri = PAGINE.length * MODI.length;
  errori.sort((a, b) => a.regola.localeCompare(b.regola) || a.pagina.localeCompare(b.pagina) || a.modo.localeCompare(b.modo));
  for (const e of errori) process.stdout.write(`ERRORE qa: ${e.regola} /${e.pagina} ${e.modo} ${e.dove} ${e.dettaglio}\n`);
  if (!SOLO) ECCEZIONI.forEach((e, i) => { if (!usate.has(i)) errori.push(e) && process.stdout.write(`ERRORE qa: eccezione non piu' usata, toglierla: ${JSON.stringify(e)}\n`); });
  const secondi = Math.round((Date.now() - inizio) / 1000);
  if (errori.length && !RAPPORTO) {
    process.stdout.write(`qa: ${errori.length} problemi su ${giri} giri (${secondi}s)\n`);
    process.exit(1);
  }
  process.stdout.write(`${errori.length ? 'RAPPORTO' : 'OK'} qa: ${PAGINE.length} pagine x ${MODI.length} modi = ${giri} giri, ${errori.length} problemi (${secondi}s)\n`);
}

main().catch((err) => {
  process.stderr.write(`${err.stack || err}\n`);
  process.exit(1);
});
