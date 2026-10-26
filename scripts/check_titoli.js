#!/usr/bin/env node
'use strict';

// Titoli, description e H1 di ogni pagina della sitemap, senza rete e senza
// browser. Per ogni <loc> (https://lascuolaamica.it/ -> index.html,
// https://lascuolaamica.it/<nome> -> <nome>.html):
//   titolo-lunghezza       <title> da 30 a 60 caratteri
//   description-lunghezza  <meta name="description"> da 110 a 160 caratteri
//   titolo-unico           nessun'altra pagina con lo stesso <title>
//   description-unica      nessun'altra pagina con la stessa description
//   h1-unico               esattamente un <h1
// Caratteri contati dopo aver decodificato le entita' HTML, spazi compressi.
//
// Uso: node scripts/check_titoli.js

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ORIGINE = 'https://lascuolaamica.it/';
const NOMI = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

function decodifica(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (tutto, e) => {
    if (e[0] === '#') return String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
    return NOMI[e.toLowerCase()] ?? tutto;
  });
}

const testo = (s) => decodifica(s).replace(/\s+/g, ' ').trim();
const lunghezza = (s) => [...s].length;

function leggi(file) {
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8').replace(/<!--[\s\S]*?-->/g, '');
  const titolo = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const meta = (html.match(/<meta\b[^>]*>/gi) || []).find((m) => /\bname\s*=\s*["']description["']/i.test(m));
  const content = meta && meta.match(/\bcontent\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
  return {
    titolo: titolo ? testo(titolo[1]) : '',
    description: content ? testo(content[1] ?? content[2]) : '',
    h1: (html.match(/<h1[\s>]/gi) || []).length,
  };
}

const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
const pagine = [...sitemap.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => {
  const nome = m[1].slice(ORIGINE.length);
  return { file: nome ? `${nome}.html` : 'index.html' };
});

const errori = [];
pagine.forEach((p) => Object.assign(p, leggi(p.file)));
pagine.forEach((p) => {
  const n = lunghezza(p.titolo);
  if (n < 30 || n > 60) errori.push(`${p.file} titolo-lunghezza ${n}`);
  const d = lunghezza(p.description);
  if (d < 110 || d > 160) errori.push(`${p.file} description-lunghezza ${d}`);
  if (pagine.some((q) => q !== p && q.titolo === p.titolo)) errori.push(`${p.file} titolo-unico ${p.titolo}`);
  if (pagine.some((q) => q !== p && q.description === p.description)) errori.push(`${p.file} description-unica ${p.description}`);
  if (p.h1 !== 1) errori.push(`${p.file} h1-unico ${p.h1}`);
});

if (errori.length) {
  errori.forEach((e) => process.stdout.write(`ERRORE titoli: ${e}\n`));
  process.exit(1);
}
process.stdout.write(`OK titoli: ${pagine.length} pagine\n`);
