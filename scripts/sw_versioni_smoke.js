#!/usr/bin/env node
'use strict';

// Dopo un rilascio una pagina non esegue CSS o JS di una versione diversa
// dal suo HTML (25/10/2026: /matematica con HTML 4.27.1 e subject-quiz-core.js
// 4.26.1, servito dal worker vecchio con Cache First).
//
// Un server statico suo serve i sorgenti come due rilasci: N (la versione del
// repo) e N+1 (99.0.0), con l'HTML trasformato come nell'export
// (scripts/versiona_asset.js). In N+1 l'id «qText» diventa «qTesto» nell'HTML e
// nel motore: con il JS vecchio il quiz non mostrerebbe la domanda. Si installa
// N, si pubblica N+1 e si ricarica la pagina senza cliccare link: il worker
// attivo e' ancora quello di N, ma SA.version deve essere quella dell'HTML e il
// quiz deve partire. Lo stesso per i JSON che il JS scarica con fetch: in
// N+1 il campo «corpi» di js/sistema-solare-dati.json diventa «corpiCelesti»,
// nel file e in js/sistema-solare.js.
//
// Il caso di controllo, senza ?v=, deve mostrare il difetto: se non lo
// mostra, il test non proverebbe niente.
//
// Uso: node scripts/sw_versioni_smoke.js

const http = require('http');
const fs = require('fs');
const path = require('path');
const { fileServito } = require('./lib/percorso_sicuro.js');
const { chromium } = require('playwright');
const { versiona, leggiVersione } = require('./versiona_asset.js');

const ROOT = path.join(__dirname, '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };
const N = leggiVersione(ROOT);
const N1 = '99.0.0';
// Il worker dice la sua versione: cosi' si sa chi controlla la pagina.
const CHI_SEI = "\nself.addEventListener('message', (e) => { if (e.data === 'versione?' && e.source) e.source.postMessage(self.SA.version); });\n";

// Rilascio servito ora: versione, e se l'HTML porta ?v=.
const rilascio = { versione: N, conV: true };

function contenuto(file, rel) {
  let testo = fs.readFileSync(file, 'utf8');
  const nuovo = rilascio.versione === N1;
  if (rel === 'app-version.js') return testo.replace(/APP_VERSION = '[^']+'/, `APP_VERSION = '${rilascio.versione}'`);
  if (rel === 'sw.js') return testo + CHI_SEI + `// ${rilascio.versione}\n`;
  if (nuovo && rel === 'subject-quiz-core.js') testo = testo.split("$('qText')").join("$('qTesto')");
  if (nuovo && rel === 'js/sistema-solare.js') testo = testo.split('DATI.corpi').join('DATI.corpiCelesti');
  if (nuovo && rel === 'js/sistema-solare-dati.json') {
    const dati = JSON.parse(testo);
    dati.corpiCelesti = dati.corpi;
    delete dati.corpi;
    return JSON.stringify(dati);
  }
  if (rel.endsWith('.html')) {
    if (nuovo) testo = testo.replace('id="qText"', 'id="qTesto"');
    if (rilascio.conV) testo = versiona(testo, rilascio.versione);
  }
  return testo;
}

function serve() {
  const server = http.createServer((req, res) => {
    const trovato = fileServito(ROOT, req.url);
    if (!trovato) {
      res.writeHead(404);
      res.end();
      return;
    }
    const { file, rel } = trovato;
    const tipo = TYPES[path.extname(file)] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': tipo, 'Cache-Control': 'no-cache' });
    if (/\.(html|js)$/.test(rel) || rel === 'js/sistema-solare-dati.json') res.end(contenuto(file, rel));
    else fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

const workerAttivo = (page) => page.evaluate(() => new Promise((resolve) => {
  const sw = navigator.serviceWorker;
  if (!sw.controller) { resolve('nessuno'); return; }
  const t = setTimeout(() => resolve('muto'), 2000);
  sw.addEventListener('message', (e) => { clearTimeout(t); resolve(e.data); }, { once: true });
  sw.controller.postMessage('versione?');
}));

// Versione dell'HTML (la ?v= di app-version.js, se c'e') e versione del JS.
const versioni = (page) => page.evaluate(() => {
  const tag = document.querySelector('script[src*="app-version.js"]');
  return { html: new URL(tag.src).searchParams.get('v'), js: window.SA && window.SA.version };
});

async function quizParte(page, idTesto) {
  await page.locator('#screenStart [data-action="start-game"]').click();
  await page.waitForSelector('#screenGame.active', { timeout: 10000 });
  await page.waitForFunction((id) => {
    const el = document.getElementById(id);
    return !!(el && el.textContent.trim());
  }, idTesto, { timeout: 10000 });
}

// Installa N e ricarica: la pagina e' controllata dal worker di N.
async function installaN(browser, base, conV, url = '/matematica.html') {
  Object.assign(rilascio, { versione: N, conV });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  const errors = [];
  // Errori della pagina a parte: nel caso di controllo sono attesi.
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  await page.goto(`${base}${url}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload({ waitUntil: 'networkidle' });
  if ((await workerAttivo(page)) !== N) errors.push(`la pagina non e' controllata dal worker di ${N}`);
  return { context, page, errors, pageErrors };
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
    // 1-2. N installata (con ?v=, e senza come la 4.27.1 in produzione), N+1
    //      pubblicata, la pagina si ricarica senza clic su un link.
    for (const conV of [true, false]) {
      const { context, page, errors, pageErrors } = await installaN(browser, base, conV);
      Object.assign(rilascio, { versione: N1, conV: true });
      await page.reload({ waitUntil: 'networkidle' });
      if ((await workerAttivo(page)) !== N) errors.push('il worker di N non controlla piu\' la pagina: il caso non prova niente');
      const v = await versioni(page);
      if (v.html !== N1) errors.push(`HTML ${v.html}, atteso ${N1}`);
      if (v.js !== v.html) errors.push(`HTML ${v.html} con JS ${v.js}`);
      await quizParte(page, 'qTesto').catch((e) => errors.push(`il quiz non parte: ${e.message.split('\n')[0]}`));
      report(`N ${conV ? 'con' : 'senza'} ?v=, poi N+1: HTML e JS ${N1} col worker di ${N}, quiz avviato`, errors.concat(pageErrors));
      await context.close();
    }
    // 3. Controllo: senza ?v= il worker di N serve il JS vecchio all'HTML nuovo.
    {
      const { context, page, errors } = await installaN(browser, base, false);
      Object.assign(rilascio, { versione: N1, conV: false });
      await page.reload({ waitUntil: 'networkidle' });
      const js = await page.evaluate(() => window.SA.version);
      if (js !== N) errors.push(`senza ?v= la pagina ha JS ${js}: il test non vedrebbe il difetto`);
      report(`controllo: senza ?v= l'HTML ${N1} gira con JS ${N} (il difetto che il test cerca)`, errors);
      await context.close();
    }
    // 4. Senza rete con N installata: la pagina si apre dalla cache, con CSS e
    //    JS della sua versione presi dal precache (URL con ?v=).
    {
      const { context, page, errors, pageErrors } = await installaN(browser, base, true);
      await context.setOffline(true);
      await page.reload({ waitUntil: 'load' });
      const v = await versioni(page);
      if (v.html !== N || v.js !== N) errors.push(`senza rete HTML ${v.html} e JS ${v.js}, atteso ${N}`);
      const stile = await page.evaluate(() => Array.from(document.styleSheets).filter((s) => s.href && s.href.includes('subject-quiz-theme.css')).length);
      if (!stile) errors.push('senza rete subject-quiz-theme.css non e\' caricato');
      await quizParte(page, 'qText').catch((e) => errors.push(`senza rete il quiz non parte: ${e.message.split('\n')[0]}`));
      report('senza rete: pagina, CSS e JS dalla cache con ?v=, quiz avviato', errors.concat(pageErrors));
      await context.close();
    }
    // 5. Installazione dalla home, che non carica il motore del quiz: la
    //    precache ha gli URL con ?v=, gli stessi dell'export. Senza rete un JS
    //    con un'altra ?v= o senza (pagina salvata prima dell'aggiornamento)
    //    prende il file con lo stesso percorso, come prima di ?v=.
    {
      const { context, page, errors, pageErrors } = await installaN(browser, base, true, '/');
      const inCache = await page.evaluate(async (v) => {
        const cache = await caches.open(window.SA.cacheName);
        const urls = ['/subject-quiz-core.js', '/js/matematica-page.js', '/subject-quiz-theme.css'];
        return Promise.all(urls.map(async (u) => [u, !!(await cache.match(`${u}?v=${v}`))]));
      }, N);
      inCache.filter(([, ok]) => !ok).forEach(([u]) => errors.push(`precache senza ${u}?v=${N}`));
      await context.setOffline(true);
      const stati = await page.evaluate(() => Promise.all(['/subject-quiz-core.js?v=0.0.1', '/subject-quiz-core.js']
        .map((u) => fetch(u).then((r) => `${u} ${r.status}`, () => `${u} errore`))));
      stati.filter((st) => !st.endsWith(' 200')).forEach((st) => errors.push(`senza rete ${st}`));
      report('precache con ?v= dalla home; senza rete altre ?v= servite dallo stesso percorso', errors.concat(pageErrors));
      await context.close();
    }
    // 6. JSON scaricato con fetch: N installata sul Sistema Solare, N+1
    //    pubblicata con «corpi» rinominato, ricarica senza clic. La pagina deve
    //    ricevere il JSON di N+1 e partire.
    {
      const { context, page, errors, pageErrors } = await installaN(browser, base, true, '/sistema-solare.html');
      Object.assign(rilascio, { versione: N1, conV: true });
      const risposta = page.waitForResponse((r) => new URL(r.url()).pathname === '/js/sistema-solare-dati.json');
      await page.reload({ waitUntil: 'networkidle' });
      if ((await workerAttivo(page)) !== N) errors.push('il worker di N non controlla piu\' la pagina: il caso non prova niente');
      const dati = await (await risposta).json();
      if (!dati.corpiCelesti) errors.push(`la pagina ha letto sistema-solare-dati.json di ${N}`);
      await page.waitForFunction(() => !!(window.SA && window.SA.sistemaSolare), null, { timeout: 20000 })
        .catch(() => errors.push('il Sistema Solare non parte'));
      report(`Sistema Solare: HTML ${N1} legge sistema-solare-dati.json di ${N1} col worker di ${N}`, errors.concat(pageErrors));
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
