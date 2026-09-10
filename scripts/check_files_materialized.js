#!/usr/bin/env node
// Verifica che ogni file tracciato da git sia davvero sul disco, prima che
// npm run verify cominci a fidarsene.
//
// Il repo vive in iCloud Drive, e iCloud sfratta i file lasciando segnaposti:
// la dimensione dichiarata resta quella vera, ma leggerli restituisce zero
// byte. Il 9 settembre 2026 e' successo a prepublish-check.sh: girava in un
// istante, non stampava niente e usciva 0, e npm run verify risultava verde
// senza aver eseguito un solo controllo. Un controllo che non parte esce 0
// esattamente come uno che passa: per questo il sintomo si cerca qui, in testa
// alla catena, invece di sperare che ogni script se ne accorga da solo.
//
// Il segno e' la differenza fra quanto dichiara stat() e quanto si riesce a
// leggere. Non si usa il flag "dataless" del filesystem: Node non lo espone, e
// soprattutto il difetto che ci ha morso era la lettura vuota, non il flag.

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// Funzione pura, cosi' l'autoverifica in fondo la puo' provare senza un file
// davvero sfrattato: macOS non lascia sfrattare un file a comando se la
// cartella e' in "Conserva download".
function trovaSegnaposto(files, dimensione, leggi) {
  const problemi = [];
  files.forEach(function (file) {
    const attesa = dimensione(file);
    if (attesa === null || attesa === 0) return; // cancellato o davvero vuoto
    const letti = leggi(file);
    if (letti !== attesa) problemi.push({ file: file, attesa: attesa, letti: letti });
  });
  return problemi;
}

function dimensioneSuDisco(file) {
  try {
    const st = fs.statSync(path.join(ROOT, file));
    return st.isFile() ? st.size : null;
  } catch (e) {
    return null; // tracciato ma rimosso nell'albero di lavoro: non e' affar nostro
  }
}

function byteLetti(file) {
  try {
    return fs.readFileSync(path.join(ROOT, file)).length;
  } catch (e) {
    return -1;
  }
}

function autoverifica() {
  const dichiarate = { 'buono.sh': 120, 'sfrattato.sh': 22091, 'vuoto.md': 0 };
  const lette = { 'buono.sh': 120, 'sfrattato.sh': 0, 'vuoto.md': 0 };
  const trovati = trovaSegnaposto(Object.keys(dichiarate),
    function (f) { return dichiarate[f]; },
    function (f) { return lette[f]; });
  if (trovati.length !== 1 || trovati[0].file !== 'sfrattato.sh') {
    throw new Error('autoverifica fallita: il caso di prepublish-check.sh del 9 settembre non verrebbe intercettato');
  }
}

function main() {
  autoverifica();

  const files = execFileSync('git', ['ls-files', '-z'], { cwd: ROOT })
    .toString('utf8')
    .split('\0')
    .filter(Boolean);

  const problemi = trovaSegnaposto(files, dimensioneSuDisco, byteLetti);

  if (problemi.length) {
    console.error(`[ERROR] ${problemi.length} file tracciati non sono davvero sul disco (segnaposto iCloud?):`);
    problemi.slice(0, 20).forEach(function (p) {
      console.error(`  ${p.file}: ${p.attesa} byte dichiarati, ${p.letti} letti`);
    });
    if (problemi.length > 20) console.error(`  ... e altri ${problemi.length - 20}`);
    console.error('Rileggili per scaricarli (cat file > /dev/null) e rilancia: i controlli successivi girerebbero su file vuoti.');
    process.exit(1);
  }

  console.error(`file sul disco: tutti i ${files.length} file tracciati si leggono per intero.`);
}

main();
