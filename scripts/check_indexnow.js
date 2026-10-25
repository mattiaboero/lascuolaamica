#!/usr/bin/env node
'use strict';

// scripts/indexnow.js senza rete, con una sitemap di prova: filtro per data
// (--since), sitemap intera (--all), zero URL (esce con 0 e lo dice), data
// sbagliata rifiutata, "oggi" in ora italiana. Il CLI si prova solo con --dry
// o con zero URL: nessuna richiesta parte.
//
// Uso: node scripts/check_indexnow.js

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { daSegnalare, cambiati, oggiRoma } = require('./indexnow');

const SITEMAP = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://lascuolaamica.it/</loc>
    <lastmod>2026-09-30</lastmod>
  </url>
  <url>
    <loc>https://lascuolaamica.it/matematica</loc>
    <lastmod>2026-10-23</lastmod>
  </url>
  <url>
    <loc>https://lascuolaamica.it/tabelline</loc>
    <lastmod>2026-10-24</lastmod>
  </url>
</urlset>
`;

const tutti = ['https://lascuolaamica.it/', 'https://lascuolaamica.it/matematica', 'https://lascuolaamica.it/tabelline'];

// Filtro per data: lastmod >= since, estremo compreso.
assert.deepStrictEqual(daSegnalare(SITEMAP, { since: '2026-10-24' }), ['https://lascuolaamica.it/tabelline']);
assert.deepStrictEqual(daSegnalare(SITEMAP, { since: '2026-10-23' }), tutti.slice(1));
assert.deepStrictEqual(daSegnalare(SITEMAP, { since: '2026-01-01' }), tutti);
// --all: tutta la sitemap, qualunque data.
assert.deepStrictEqual(daSegnalare(SITEMAP, { since: '2099-01-01', all: true }), tutti);
// Zero URL.
assert.deepStrictEqual(daSegnalare(SITEMAP, { since: '2026-10-25' }), []);
// Data sbagliata e sitemap vuota: errore, non un invio a caso.
assert.throws(() => daSegnalare(SITEMAP, { since: '24/10/2026' }), /AAAA-MM-GG/);
assert.throws(() => daSegnalare('<urlset></urlset>', { since: '2026-10-24' }), /non contiene URL/);
// Oggi in ora italiana: alle 23:30 UTC del 24 a Roma e' gia' il 25.
assert.strictEqual(oggiRoma(new Date('2026-10-24T23:30:00Z')), '2026-10-25');
assert.strictEqual(oggiRoma(new Date('2026-10-24T21:30:00Z')), '2026-10-24');

// CLI: zero URL esce con 0 e lo dice; --dry stampa senza inviare.
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'indexnow-'));
const file = path.join(dir, 'sitemap.xml');
fs.writeFileSync(file, SITEMAP);
const cli = (...a) => execFileSync(process.execPath, [path.join(__dirname, 'indexnow.js'), '--sitemap', file, ...a], { encoding: 'utf8' });
assert.match(cli('--since', '2026-10-25'), /Niente da segnalare/);
const dry = cli('--dry', '--since', '2026-10-24');
assert.match(dry, /\[DRY\] 1 URL \(lastmod dal 2026-10-24\)/);
assert.match(dry, /tabelline/);
assert.doesNotMatch(dry, /matematica/);
assert.match(cli('--dry', '--all'), /\[DRY\] 3 URL \(tutta la sitemap\)/);
fs.rmSync(dir, { recursive: true, force: true });

// --da-commit: gli URL il cui lastmod differisce fra due sitemap.
const conDate = (d) => SITEMAP.replace('2026-09-30', d[0]).replace('2026-10-23', d[1]).replace('2026-10-24', d[2]);
assert.deepStrictEqual(cambiati(SITEMAP, SITEMAP), []);
assert.deepStrictEqual(cambiati(SITEMAP, conDate(['2026-09-30', '2026-10-25', '2026-10-24'])), ['https://lascuolaamica.it/matematica']);
assert.deepStrictEqual(cambiati(SITEMAP, conDate(['2026-10-25', '2026-10-25', '2026-10-25'])), tutti);
// CLI: HEAD contro HEAD non cambia niente, nessuna richiesta parte.
assert.strictEqual(execFileSync(process.execPath, [path.join(__dirname, 'indexnow.js'), '--da-commit', 'HEAD'], { encoding: 'utf8' }), 'IndexNow: 0 URL\n');

console.log('[OK] indexnow: filtro per data, --all, zero URL, --dry, oggi in ora italiana, --da-commit');
