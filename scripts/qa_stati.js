#!/usr/bin/env node
'use strict';

// Gli stati del quiz che il caricamento non mostra: scelta del livello,
// domanda, risposta giusta e sbagliata con la spiegazione, scelta e domanda
// bonus, risultato, ripasso degli errori, finestre Info (con Privacy, Cookie,
// Ultimi aggiornamenti, Il Progetto), Progressi e Classifica vuoti e pieni,
// ritorno alla schermata iniziale («Cambia ambito»: la pagina deve tornare in
// cima, non sul testo per adulti). Finestra Progressi: Esc chiude e il focus
// torna al pulsante. Piu' le finestre di home e /premi. Otto materie in
// cinque modi (telefono 360, tablet 768, desktop 1280, Okabe-Ito 360, zoom al
// 200%). In ogni stato le regole di scripts/lib/qa_regole.js, piu' errori
// JavaScript e richieste verso altri host.
//
// Math.random ha un seme fisso per materia e modo: le domande sono sempre le
// stesse, un errore si riproduce.
//
// Uso: node scripts/qa_stati.js [--rapporto] [--solo matematica,...]

const http = require('http');
const fs = require('fs');
const path = require('path');
const { fileServito } = require('./lib/percorso_sicuro.js');
const { controlla } = require('./lib/qa_regole.js');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.mp3': 'audio/mpeg' };
const ARGS = process.argv.slice(2);
const RAPPORTO = ARGS.includes('--rapporto');
const TUTTE = ['matematica', 'italiano', 'inglese', 'storia', 'geografia', 'scienze', 'civica', 'problemi'];
const SOLO_FINESTRE = ['index', 'premi'];
const MATERIE = ARGS.includes('--solo') ? ARGS[ARGS.indexOf('--solo') + 1].split(',') : TUTTE.concat(SOLO_FINESTRE);
const TELEFONO = { isMobile: true, hasTouch: true };
const MODI = [
  { nome: 'telefono-360', viewport: { width: 360, height: 740 }, ...TELEFONO },
  { nome: 'tablet-768', viewport: { width: 768, height: 1024 }, hasTouch: true },
  { nome: 'desktop-1280', viewport: { width: 1280, height: 800 } },
  { nome: 'okabe-360', viewport: { width: 360, height: 740 }, ...TELEFONO, query: '?palette=okabe-ito' },
  { nome: 'zoom-200', viewport: { width: 640, height: 400 }, deviceScaleFactor: 2 }
];
const ESCLUDI = ['canvas', '.skip-link'];
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

function semeFisso(seme) {
  let s = seme >>> 0;
  Math.random = () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function giro(browser, base, materia, modo, seme) {
  const { nome, query, ...opzioni } = modo;
  const context = await browser.newContext({ ...opzioni, serviceWorkers: 'block', reducedMotion: 'reduce' });
  await context.addInitScript(semeFisso, seme);
  const page = await context.newPage();
  const trovati = [];
  const host = new URL(base).host;
  let stato = 'caricamento';
  page.on('pageerror', (e) => trovati.push({ stato, regola: 'errore-js', dove: 'pagina', dettaglio: e.message.split('\n')[0] }));
  page.on('console', (m) => { if (m.type() === 'error') trovati.push({ stato, regola: 'errore-console', dove: 'pagina', dettaglio: m.text().slice(0, 120) }); });
  page.on('request', (r) => {
    const u = new URL(r.url());
    if (/^https?:$/.test(u.protocol) && u.host !== host) trovati.push({ stato, regola: 'richiesta-esterna', dove: 'pagina', dettaglio: r.url().slice(0, 120) });
  });
  const visti = new Set();
  const guarda = async (nuovo) => {
    stato = nuovo;
    if (visti.has(nuovo)) return;
    visti.add(nuovo);
    await page.waitForTimeout(120);
    for (const inFondo of [false, true]) {
      if (inFondo) await page.evaluate(() => { const m = document.querySelector('.modal-overlay.open .modal-body, [aria-modal="true"] .modal-body'); if (m) m.scrollTop = m.scrollHeight; window.scrollTo(0, document.documentElement.scrollHeight); });
      else await page.evaluate(() => window.scrollTo(0, 0));
      for (const p of await page.evaluate(controlla, { escludi: ESCLUDI, inFondo })) {
        if (!inFondo || p.regola === 'coperto') trovati.push({ ...p, stato: nuovo });
      }
    }
  };
  const attivo = (sel) => page.locator(sel).count().then((n) => n > 0);

  try {
    await page.goto(`${base}/${materia === 'index' ? '' : materia}${query || ''}`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.evaluate(() => document.fonts.ready);

    // Finestre dalla schermata iniziale
    const finestre = [
      ['info', '[data-open-modal="modalInfoHub"]'],
      ['progressi', '[data-action="show-progress"]'],
      ['classifica', '[data-action="show-leaderboard"]']
    ];
    for (const [nomeFinestra, sel] of finestre) {
      const btn = page.locator(sel).filter({ visible: true }).first();
      if (!(await btn.count())) continue;
      await btn.click();
      await page.waitForTimeout(200);
      await guarda(`finestra-${nomeFinestra}`);
      if (nomeFinestra === 'info') {
        for (const testo of ['Privacy Policy', 'Cookie Policy', 'Versione', 'Il Progetto']) {
          const interno = page.locator('.info-hub-btn', { hasText: testo }).first();
          if (!(await interno.count())) continue;
          await interno.click();
          await page.waitForTimeout(200);
          await guarda(`finestra-info-${testo.split(' ')[0].toLowerCase()}`);
          await page.keyboard.press('Escape');
          await page.waitForTimeout(150);
        }
      }
      await page.keyboard.press('Escape');
      await page.waitForTimeout(150);
      if (await attivo('.modal-overlay.open')) await page.keyboard.press('Escape');
    }

    if (SOLO_FINESTRE.includes(materia)) return finale();

    // Partita, da una pagina appena caricata
    stato = 'avvio';
    await page.goto(`${base}/${materia}${query || ''}`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.evaluate(() => document.fonts.ready);
    await page.locator('#screenStart [data-action="start-game"]').click();
    await page.waitForSelector('#screenLevels.active, #screenGame.active', { timeout: 15000 });
    if (await attivo('#screenLevels.active')) {
      await guarda('livelli');
      await page.locator('#screenLevels [data-action="start-level"]:not([disabled])').first().click();
      await page.waitForSelector('#screenGame.active', { timeout: 15000 });
    }
    await guarda('domanda');
    for (let i = 0; i < 12; i += 1) {
      if (await attivo('#screenBonusPick.active')) break;
      // prima risposta 1, poi si cambia tasto per vedere anche l'altro esito
      await page.keyboard.press(String((i % 4) + 1));
      await page.locator('#qNext').waitFor({ state: 'visible', timeout: 5000 });
      const giusta = await page.evaluate(() => Boolean(document.querySelector('#answers .answer-btn.correct[aria-pressed="true"], #answers .answer-btn.chosen.correct')) || !document.querySelector('#answers .answer-btn.wrong'));
      await guarda(giusta ? 'risposta-giusta' : 'risposta-sbagliata');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(80);
    }
    await page.waitForSelector('#screenBonusPick.active', { timeout: 10000 });
    await guarda('bonus-scelta');
    await page.locator('[data-action="bonus-pick"]').first().click();
    await page.waitForSelector('#screenBonusQuestion.active', { timeout: 5000 });
    await guarda('bonus-domanda');
    await page.locator('#bonusAnswers .answer-btn').first().click();
    await page.waitForSelector('#screenResult.active', { timeout: 10000 });
    await page.waitForTimeout(300);
    await guarda('risultato');

    // Progressi con le partite appena giocate: dialogo con focus dentro,
    // Esc chiude, il focus torna al pulsante.
    await page.locator('#progressBtn').click();
    await page.waitForSelector('#progressOverlay [role="dialog"]', { timeout: 5000 });
    await guarda('progressi-pieni');
    const dentro = await page.evaluate(() => Boolean(document.activeElement && document.activeElement.closest('#progressOverlay')));
    if (!dentro) trovati.push({ stato, regola: 'focus', dove: '#progressOverlay', dettaglio: 'all\'apertura il focus non e\' nel dialogo' });
    await page.keyboard.press('Escape');
    const chiuso = await page.evaluate(() => !document.getElementById('progressOverlay') && document.activeElement && document.activeElement.id === 'progressBtn');
    if (!chiuso) trovati.push({ stato, regola: 'focus', dove: '#progressOverlay', dettaglio: 'Esc non chiude o il focus non torna a Progressi' });

    // Classifica con almeno una partita
    await page.locator('[data-action="show-leaderboard"]').filter({ visible: true }).first().click();
    await page.waitForSelector('#screenLeaderboard.active', { timeout: 5000 });
    await guarda('classifica-piena');

    // Ritorno alla schermata iniziale: in cima, classi nella finestra.
    await page.locator('#screenLeaderboard [data-action="go-start"]').filter({ visible: true }).first().click();
    await page.waitForSelector('#screenStart.active', { timeout: 5000 });
    await page.waitForTimeout(150);
    const ritorno = await page.evaluate(() => {
      const label = document.querySelector('#screenStart .section-label');
      const r = label ? label.getBoundingClientRect() : null;
      return { y: Math.round(window.scrollY), top: r ? Math.round(r.top) : null, h: window.innerHeight };
    });
    if (ritorno.top === null || ritorno.top < 0 || ritorno.top > ritorno.h) {
      trovati.push({ stato: 'ritorno-start', regola: 'ritorno-start', dove: '#screenStart', dettaglio: `scrollY ${ritorno.y}, «Scegli la classe» a ${ritorno.top}px su ${ritorno.h}` });
    }
    visti.add('ritorno-start');

    const ripassa = page.locator('[data-action="start-ripassa"]').filter({ visible: true }).first();
    if (await ripassa.count()) {
      await ripassa.click();
      await page.waitForSelector('#screenGame.active', { timeout: 10000 });
      await guarda('ripasso');
    }
  } catch (err) {
    trovati.push({ stato, regola: 'giro', dove: 'pagina', dettaglio: err.message.split('\n')[0] });
  } finally {
    await context.close();
  }
  return finale();

  function finale() {
    const attesi = SOLO_FINESTRE.includes(materia)
      ? ['finestra-info', 'finestra-info-versione']
      : ['domanda', 'risposta-sbagliata', 'bonus-scelta', 'bonus-domanda', 'risultato', 'progressi-pieni', 'classifica-piena', 'ritorno-start', 'finestra-info'];
    for (const atteso of attesi) {
      if (!visti.has(atteso) && !trovati.some((t) => t.stato === atteso && t.regola === 'stato-mancante')) {
        trovati.push({ stato: atteso, regola: 'stato-mancante', dove: 'pagina', dettaglio: 'stato mai raggiunto' });
      }
    }
    return trovati.map((t) => ({ ...t, pagina: materia, modo: nome }));
  }
}

async function main() {
  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();
  const coda = [];
  MATERIE.forEach((materia, i) => MODI.forEach((modo, j) => coda.push([materia, modo, 1000 + i * 10 + j])));
  const tutti = [];
  const inizio = Date.now();
  try {
    await Promise.all(Array.from({ length: 4 }, async () => {
      while (coda.length) {
        const [materia, modo, seme] = coda.shift();
        tutti.push(...await giro(browser, base, materia, modo, seme));
      }
    }));
  } finally {
    await browser.close();
    server.close();
  }
  const usate = new Set();
  const errori = tutti.filter((t) => {
    const i = ECCEZIONI.findIndex((e) => new RegExp(e.pagina).test(t.pagina) && new RegExp(e.modo).test(t.modo) && new RegExp(e.stato).test(t.stato) && e.regola === t.regola && t.dove.includes(e.dove));
    if (i >= 0) { usate.add(i); return false; }
    return true;
  });
  errori.sort((a, b) => a.regola.localeCompare(b.regola) || a.pagina.localeCompare(b.pagina) || a.stato.localeCompare(b.stato) || a.modo.localeCompare(b.modo));
  for (const e of errori) process.stdout.write(`ERRORE stati: ${e.regola} /${e.pagina} ${e.stato} ${e.modo} ${e.dove} ${e.dettaglio}\n`);
  if (!ARGS.includes('--solo')) ECCEZIONI.forEach((e, i) => { if (!usate.has(i)) { errori.push(e); process.stdout.write(`ERRORE stati: eccezione non piu' usata, toglierla: ${JSON.stringify(e)}\n`); } });
  const giri = MATERIE.length * MODI.length;
  // MATERIE contiene anche home e /premi (solo finestre)
  const secondi = Math.round((Date.now() - inizio) / 1000);
  if (errori.length && !RAPPORTO) {
    process.stdout.write(`stati: ${errori.length} problemi su ${giri} partite (${secondi}s)\n`);
    process.exit(1);
  }
  process.stdout.write(`${errori.length ? 'RAPPORTO' : 'OK'} stati: ${MATERIE.length} materie x ${MODI.length} modi = ${giri} partite, ${errori.length} problemi (${secondi}s)\n`);
}

main().catch((err) => {
  process.stderr.write(`${err.stack || err}\n`);
  process.exit(1);
});
