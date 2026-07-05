#!/usr/bin/env node
// Verifica che la voce piu' recente di UPDATE_LOG (shared.js), mostrata nel
// popup "Info" agli utenti, citi APP_VERSION (app-version.js) come versione
// massima nel campo `date`. Senza questo controllo il log resta silenziosamente
// indietro di N release ogni volta che una versione viene rilasciata senza che
// nessuno tocchi shared.js (successo gia' due volte: 4.10.2->4.12.17, poi di
// nuovo 4.12.18->4.12.20).

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SHARED_PATH = path.join(ROOT, 'shared.js');
const APP_VERSION_PATH = path.join(ROOT, 'app-version.js');

function extractAppVersion(source) {
  const match = source.match(/const APP_VERSION = '([\d.]+)'/);
  if (!match) {
    throw new Error("Impossibile trovare APP_VERSION in app-version.js");
  }
  return match[1];
}

function extractFirstUpdateLogDate(source) {
  const marker = 'const UPDATE_LOG = [';
  const start = source.indexOf(marker);
  if (start === -1) {
    throw new Error('Impossibile trovare UPDATE_LOG in shared.js');
  }
  const dateMatch = source.slice(start).match(/date:\s*'([^']+)'/);
  if (!dateMatch) {
    throw new Error('Impossibile trovare il campo date della prima voce di UPDATE_LOG');
  }
  return dateMatch[1];
}

function extractMaxVersionFromDateLabel(dateLabel) {
  const versions = dateLabel.match(/\d+\.\d+\.\d+/g) || [];
  if (versions.length === 0) {
    throw new Error(`Nessuna versione trovata nell'etichetta: '${dateLabel}'`);
  }
  return versions.sort((a, b) => {
    const pa = a.split('.').map(Number);
    const pb = b.split('.').map(Number);
    for (let i = 0; i < 3; i += 1) {
      if (pa[i] !== pb[i]) return pa[i] - pb[i];
    }
    return 0;
  }).pop();
}

function main() {
  const appVersionSource = fs.readFileSync(APP_VERSION_PATH, 'utf8');
  const sharedSource = fs.readFileSync(SHARED_PATH, 'utf8');

  const appVersion = extractAppVersion(appVersionSource);
  const dateLabel = extractFirstUpdateLogDate(sharedSource);
  const logVersion = extractMaxVersionFromDateLabel(dateLabel);

  if (logVersion !== appVersion) {
    console.error(`[ERROR] UPDATE_LOG (shared.js) non allineato: prima voce cita fino a '${logVersion}' ('${dateLabel}'), ma APP_VERSION e' '${appVersion}'.`);
    console.error("Aggiungi/aggiorna la voce piu' recente di UPDATE_LOG in shared.js.");
    process.exitCode = 1;
    return;
  }

  console.error(`UPDATE_LOG: prima voce allineata alla versione corrente (${appVersion}).`);
}

main();
