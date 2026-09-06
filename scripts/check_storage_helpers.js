#!/usr/bin/env node
// I wrapper storageGet/storageSet attorno a localStorage sono copiati in quattro
// moduli. Non sono stati unificati di proposito: shared.js viene caricato per
// ultimo su tutte e 23 le pagine, quindi non puo' esporre gli helper agli altri
// tre in tempo per il loro init, e un modulo condiviso richiederebbe un nuovo
// <script> in ogni pagina per ~30 righe di codice stabile.
//
// Le copie pero' erano gia' divergenti: js/breakout.js aveva perso le chiamate
// a debugWarn, quindi un localStorage che lancia (Safari in navigazione
// privata, quota piena) falliva li' senza lasciare traccia nemmeno in debug.
// Questo controllo impedisce che tornino a divergere in silenzio.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const FILES = ['shared.js', 'subject-quiz-core.js', 'js/rewards.js', 'js/breakout.js'];
const HELPERS = ['storageGet', 'storageSet'];

function extract(source, name) {
  const start = source.indexOf(`  function ${name}(`);
  if (start === -1) return null;
  const end = source.indexOf('\n  }\n', start);
  if (end === -1) return null;
  return source.slice(start, end + 5);
}

function main() {
  const sources = new Map(FILES.map((f) => [f, fs.readFileSync(path.join(ROOT, f), 'utf8')]));
  let failed = false;

  for (const name of HELPERS) {
    const blocks = new Map();
    for (const [file, source] of sources) {
      const body = extract(source, name);
      if (!body) {
        console.error(`[ERROR] ${file}: ${name} non trovata`);
        failed = true;
        continue;
      }
      blocks.set(file, body);
    }
    const reference = blocks.get(FILES[0]);
    for (const [file, body] of blocks) {
      if (body !== reference) {
        console.error(`[ERROR] ${file}: ${name} diverge dalla copia in ${FILES[0]}`);
        console.error(`--- ${FILES[0]}\n${reference}--- ${file}\n${body}`);
        failed = true;
      }
    }
  }

  if (failed) {
    console.error('Le copie degli helper di storage devono restare identiche.');
    process.exit(1);
  }
  console.log(`storage helpers: ${HELPERS.join(', ')} identici in ${FILES.length} moduli.`);
}

main();
