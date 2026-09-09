#!/usr/bin/env node
// Dal lotto 5 delle istanze. La posizione della risposta non era casuale: in
// geografia il 79% delle domande aveva la risposta in prima posizione, in
// italiano il 46% in seconda, e la quarta valeva il 13% contro il 25% atteso.
// Chi toccava sempre il primo pulsante passava geografia senza saperne nulla,
// ed e' lo stesso difetto trovato nella campagna inglese, dove la risposta si
// riconosceva perche' era l'unica al plurale: la domanda si risolve senza
// sapere la materia.
//
// Il controllo guarda solo le domande servite (active !== false) e lascia un
// margine: con 4 opzioni l'atteso e' 25%, qui si accetta 18-33% per materia.

const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'json');
const MIN = 0.18;
const MAX = 0.33;

function righe(payload) {
  if (Array.isArray(payload)) return payload;
  for (const chiave of ['questions', 'domande', 'items', 'data']) {
    if (Array.isArray(payload[chiave])) return payload[chiave];
  }
  return [];
}

const errori = [];
let totali = 0;

for (const file of fs.readdirSync(DIR).filter((f) => f.endsWith('.json'))) {
  if (file === 'index.json' || file === 'changelog.json') continue;
  const qs = righe(JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8')))
    .filter((q) => q && q.active !== false && Array.isArray(q.options));
  if (qs.length < 40) continue;
  const conteggio = [0, 0, 0, 0];
  qs.forEach((q) => { conteggio[q.answerIndex] += 1; });
  totali += qs.length;
  conteggio.forEach((n, i) => {
    const quota = n / qs.length;
    if (quota < MIN || quota > MAX) {
      errori.push(`  [${file}] la risposta e in posizione ${i + 1} nel ${(quota * 100).toFixed(0)}% delle domande (atteso 25%, ammesso ${MIN * 100}-${MAX * 100}%)`);
    }
  });
}

if (errori.length) {
  console.error(`[ERROR] la posizione della risposta e prevedibile:`);
  errori.forEach((e) => console.error(e));
  process.exit(1);
}
console.log(`posizione della risposta: distribuita su tutte e quattro le opzioni in ogni materia (${totali} domande).`);
