#!/usr/bin/env node
'use strict';

// Ambiti e sottoaree presenti per materia e classe, con il numero di domande
// attive (bonus escluse): base per il confronto con i traguardi delle nuove
// Indicazioni Nazionali (DM 221/2025). Non modifica le domande.
//
// Uso: node scripts/temi_per_materia_classe.js
// Scrive reports/indicazioni-2025/temi-per-materia-classe.csv

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'reports', 'indicazioni-2025', 'temi-per-materia-classe.csv');
const MATERIE = ['matematica', 'problemi', 'italiano', 'inglese', 'civica', 'storia', 'geografia', 'scienze'];

const csv = (v) => {
  const s = String(v === undefined || v === null ? '' : v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const righe = [['materia', 'classe', 'ambito', 'sottoarea', 'domande_attive']];
let totale = 0;
for (const materia of MATERIE) {
  const { questions } = JSON.parse(fs.readFileSync(path.join(ROOT, 'json', `${materia}.json`), 'utf8'));
  const conta = new Map();
  for (const q of questions) {
    if (q.active === false || q.bonus) continue;
    const key = [q.class, q.area || '', q.subarea || ''].join('\u0000');
    conta.set(key, (conta.get(key) || 0) + 1);
  }
  [...conta.entries()]
    .map(([key, n]) => [...key.split('\u0000'), n])
    .sort((a, b) => Number(a[0]) - Number(b[0]) || a[1].localeCompare(b[1], 'it') || a[2].localeCompare(b[2], 'it'))
    .forEach(([classe, ambito, sottoarea, n]) => {
      righe.push([materia, classe, ambito, sottoarea, n]);
      totale += n;
    });
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, righe.map((r) => r.map(csv).join(',')).join('\n') + '\n');
console.log(`${path.relative(ROOT, OUT)}: ${righe.length - 1} righe, ${totale} domande attive`);
