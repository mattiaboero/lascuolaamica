#!/usr/bin/env node
'use strict';

// Classi e ambiti delle pagine materia sono scritti nell'HTML (dalla 4.24.1,
// per non spostare «Inizia!» quando arriva il JSON) e ricostruiti dal motore.
// Le due copie devono restare identiche: un ambito rinominato in
// js/<materia>-page.js non sposta il layout, quindi il test del CLS non lo
// vedrebbe. Per ogni pagina materia:
// - markup statico (pagina caricata senza JavaScript) e markup del motore
//   (stessa pagina, dati arrivati, primo accesso: 3ª e Sessione mista) devono
//   coincidere: testi, ordine, classi, id, attributi aria e data-*;
// - etichetta «Scegli la classe», griglia classi e griglia ambiti compaiono
//   una volta sola, anche dopo l'arrivo dei dati (in /civica l'etichetta
//   era doppia).
//
// Serve un browser: lo script usa Playwright e un server statico suo, quindi
// non dipende da un server gia' acceso.
//
// Uso: node scripts/check_static_grids.js

const http = require('http');
const fs = require('fs');
const path = require('path');
const { fileServito } = require('./lib/percorso_sicuro.js');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const PAGES = ['matematica', 'problemi', 'italiano', 'inglese', 'civica', 'storia', 'geografia', 'scienze'];
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif', '.woff2': 'font/woff2' };

function serve() {
  const server = http.createServer((req, res) => {
    const trovato = fileServito(ROOT, req.url);
    if (!trovato) {
      res.writeHead(404);
      res.end();
      return;
    }
    const { file } = trovato;
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

// Fotografia confrontabile di etichetta e griglie.
function snapshot() {
  const attrs = (e) => [...e.attributes]
    .filter((a) => a.name !== 'style')
    .map((a) => `${a.name}=${a.value}`)
    .sort()
    .join(' ');
  const node = (e) => ({
    tag: e.tagName.toLowerCase(),
    attrs: attrs(e),
    text: e.children.length ? undefined : e.textContent.trim(),
    children: [...e.children].map(node)
  });
  const pick = (sel) => [...document.querySelectorAll(sel)];
  const one = (sel) => {
    const list = pick(sel);
    return list.length === 1 ? node(list[0]) : null;
  };
  return {
    count: {
      label: pick('.class-selector-label').length,
      classGrid: pick('#classGrid, .class-grid').length,
      areaGrid: pick('#areaGrid, .area-grid').length
    },
    label: one('.class-selector-label'),
    classGrid: one('#classGrid'),
    areaGrid: one('#areaGrid')
  };
}

function diff(a, b, where, out) {
  if (JSON.stringify(a) === JSON.stringify(b)) return;
  if (!a || !b || a.tag !== b.tag || a.attrs !== b.attrs || a.text !== b.text || a.children.length !== b.children.length) {
    const show = (n) => (n ? `<${n.tag} ${n.attrs}>${n.text !== undefined ? n.text : `(${n.children.length} figli)`}` : 'assente');
    out.push(`${where}: statico ${show(a)} | motore ${show(b)}`);
    return;
  }
  a.children.forEach((c, i) => diff(c, b.children[i], `${where} > ${i + 1}`, out));
}

async function main() {
  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();
  const errors = [];
  try {
    for (const pagina of PAGES) {
      const url = `${base}/${pagina}.html`;
      const noJs = await browser.newContext({ javaScriptEnabled: false, serviceWorkers: 'block' });
      const p1 = await noJs.newPage();
      await p1.goto(url, { waitUntil: 'domcontentloaded' });
      const statico = await p1.evaluate(snapshot);
      await noJs.close();

      const js = await browser.newContext({ serviceWorkers: 'block' });
      const p2 = await js.newPage();
      await p2.goto(url, { waitUntil: 'networkidle' });
      await p2.waitForSelector('html[data-classe]');
      const motore = await p2.evaluate(snapshot);
      await js.close();

      const err = [];
      for (const [k, v] of Object.entries(motore.count)) {
        const atteso = k === 'areaGrid' && statico.count.areaGrid === 0 ? 0 : 1;
        if (v !== atteso) err.push(`${k} compare ${v} volte dopo l'arrivo dei dati`);
        if (statico.count[k] !== v) err.push(`${k}: ${statico.count[k]} nell'HTML, ${v} col motore`);
      }
      diff(statico.label, motore.label, 'etichetta', err);
      diff(statico.classGrid, motore.classGrid, 'classi', err);
      diff(statico.areaGrid, motore.areaGrid, 'ambiti', err);
      process.stdout.write(`${err.length ? '[FAIL]' : '[OK]'} /${pagina}: markup statico e motore ${err.length ? 'diversi' : 'identici'}\n`);
      err.forEach((e) => process.stdout.write(`  - ${e}\n`));
      errors.push(...err);
    }
  } finally {
    await browser.close();
    server.close();
  }
  if (errors.length) {
    console.error('Allinea il markup statico in <materia>.html a quello del motore (js/<materia>-page.js).');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('[KO]', err.message);
  process.exit(1);
});
