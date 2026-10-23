#!/usr/bin/env node
// La sintesi vocale del sito usa solo voci installate sul dispositivo. Una
// voce di rete (Chrome desktop ne offre) manda testo e indirizzo IP a un
// server esterno, e il sito e' per bambini. L'unico punto che puo' far
// parlare il browser e' speakLocal in shared.js, che sceglie solo voci con
// localService === true.
//
// Questo controllo fallisce se un file del sito chiama speechSynthesis.speak
// o costruisce una SpeechSynthesisUtterance fuori da speakLocal.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const HELPER_FILE = 'shared.js';
const HELPER = 'speakLocal';
// SA.voice.speak e' la via ammessa: tutto il resto che chiama .speak( no.
const PATTERN = /(?<!SA\.voice)\.speak\s*\(|SpeechSynthesisUtterance\s*\(/g;

function siteFiles() {
  const root = fs.readdirSync(ROOT).filter((f) => /\.(js|html)$/.test(f) && !f.startsWith('._'));
  const js = fs.readdirSync(path.join(ROOT, 'js'))
    .filter((f) => f.endsWith('.js') && !f.startsWith('._'))
    .map((f) => `js/${f}`);
  return root.concat(js);
}

function helperRange(source) {
  const start = source.indexOf(`  function ${HELPER}(`);
  if (start === -1) return null;
  const end = source.indexOf('\n  }\n', start);
  return end === -1 ? null : [start, end];
}

function main() {
  const errors = [];
  let inside = 0;
  for (const file of siteFiles()) {
    const source = fs.readFileSync(path.join(ROOT, file), 'utf8');
    const range = file === HELPER_FILE ? helperRange(source) : null;
    if (file === HELPER_FILE && !range) errors.push(`${file}: ${HELPER} non trovata`);
    for (const match of source.matchAll(PATTERN)) {
      if (range && match.index > range[0] && match.index < range[1]) {
        inside += 1;
        continue;
      }
      const line = source.slice(0, match.index).split('\n').length;
      errors.push(`${file}:${line}: «${match[0]}» fuori da ${HELPER_FILE} ${HELPER}`);
    }
  }
  if (inside === 0) errors.push(`${HELPER_FILE}: ${HELPER} non chiama piu' speechSynthesis.speak`);

  if (errors.length) {
    errors.forEach((e) => console.error(`[ERROR] ${e}`));
    console.error('La sintesi vocale passa solo da SA.voice.speak (shared.js), che usa voci locali.');
    process.exit(1);
  }
  console.log(`sintesi vocale: speak solo in ${HELPER_FILE} ${HELPER}.`);
}

main();
