#!/usr/bin/env node
// Verifica che il vecchio handle del canale YouTube non torni nei file
// pubblicati. Dalla 4.22.20 il canale e' @lascuolaamica: @ceciliaeilpapamattone
// resta solo nelle voci storiche di CHANGELOG.md, che non viene pubblicato.
//
// Gira in fondo a npm run verify, dopo npm run export, perche' guarda
// export/: la cartella che Cloudflare pubblica.

const fs = require('fs');
const path = require('path');

const EXPORT = path.join(__dirname, '..', 'export');
const VECCHIO = /ceciliaeilpapamattone/i;

function file(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(function (e) {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? file(p) : [p];
  });
}

if (!fs.existsSync(EXPORT)) {
  console.error('check:export-canale: manca export/, lancia prima npm run export');
  process.exit(1);
}

const trovati = file(EXPORT).filter(function (p) {
  return !path.basename(p).startsWith('._') && VECCHIO.test(fs.readFileSync(p, 'latin1'));
});

if (trovati.length) {
  console.error('check:export-canale: il vecchio canale @ceciliaeilpapamattone e\' ancora in:');
  trovati.forEach(function (p) { console.error('  ' + path.relative(EXPORT, p)); });
  process.exit(1);
}
console.log('check:export-canale: ok, nessun @ceciliaeilpapamattone in export/');
