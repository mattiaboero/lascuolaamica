#!/usr/bin/env node
// Le spiegazioni dei problemi mostrano il calcolo passo per passo, e finora
// nessuno lo verificava. Il lotto 15 ne ha trovati 28 sbagliati: nove sconti
// del 25% troncati ("770 x 25/100 = 192", che fa 192,50), un resto calcolato
// male, dieci divisioni con gli operandi invertiti ("8 / 400 = 50" per una
// classe di 8 alunni che raccoglie 400 euro) e otto sottrazioni presentate
// come divisioni. Un calcolo sbagliato in una spiegazione insegna il metodo
// sbagliato, quindi vale un controllo a ogni build.
//
// Il controllo e' volutamente stretto: verifica solo le uguaglianze isolate
// "a OP b = c". Restano fuori, perche' sono forme corrette che un parser
// ingenuo segnalerebbe:
//   - le catene con piu' uguali ("(12+6)x7:2 = 18x7:2 = 126:2 = 63");
//   - le divisioni con resto esplicito ("175 : 17 = 10 (con resto 5)");
//   - le frazioni ("3/6 = 1/2") e gli orari ("2:30 - 2:15 = 15 minuti");
//   - le somme ripetute che spiegano la moltiplicazione ("2+2+2+2 = 8").

const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'json');
const EPS = 1e-9;

function numero(s) {
  // 1.234,50 -> 1234.50 ; il punto e' separatore di migliaia, la virgola decimale
  const v = Number(s.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(v) ? v : null;
}

function applica(a, op, b) {
  switch (op) {
    case '+': return a + b;
    case '-':
    case '−': return a - b;
    case '*':
    case 'x':
    case '×': return a * b;
    default: return b === 0 ? null : a / b;
  }
}

function controlla(testo) {
  const problemi = [];
  // una sola uguaglianza: niente altro "=" ne' altri operatori attaccati intorno
  const re = /(?<![\d,.:/])(\d[\d.]*(?:,\d+)?)\s*([+\-−*x×÷:/])\s*(\d[\d.]*(?:,\d+)?)\s*=\s*(\d[\d.]*(?:,\d+)?)(?![\d]|[.,]\d|[:/]\d)/g;
  for (const m of testo.matchAll(re)) {
    const prima = testo.slice(Math.max(0, m.index - 12), m.index);
    const dopo = testo.slice(m.index + m[0].length, m.index + m[0].length + 16);
    // catena: se prima o dopo l'uguaglianza c'e' un altro operatore o un'altra
    // cifra, questa non e' un'operazione isolata ma un pezzo di una piu' lunga
    // ("2+2+2+2 = 8", "770 x 25/100 = 192", "3x25 + 50 = 125").
    if (/(?:[=\d+\-−*x×÷]|\d[:/])\s*$/.test(prima) || /^\s*(?:[+\-−*x×÷=]|[:/]\s*\d)/.test(dopo)) continue;
    if (/\(\s*con resto|resto\s*\d/i.test(dopo)) continue;                                   // divisione con resto
    if (/\d\s*:\s*\d{2}\b/.test(m[0]) || /\bore\b|\bminuti\b/i.test(dopo)) continue;         // orari
    if ((m[2] === '/' || m[2] === ':') && /^\s*\/|^\s*\d+\/\d/.test(dopo)) continue;         // frazioni
    const a = numero(m[1]); const b = numero(m[3]); const c = numero(m[4]);
    if (a === null || b === null || c === null) continue;
    const atteso = applica(a, m[2], b);
    if (atteso === null) continue;
    if (Math.abs(atteso - c) > EPS) {
      problemi.push({ espressione: m[0].trim(), atteso });
    }
  }
  return problemi;
}

function main() {
  let sbagliate = 0; let controllate = 0;
  const errori = [];
  for (const file of fs.readdirSync(DIR).filter((n) => n.endsWith('.json'))) {
    if (file.includes('index') || file.includes('changelog')) continue;
    const dati = JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8'));
    const domande = Array.isArray(dati) ? dati : dati.questions;
    if (!Array.isArray(domande)) continue;
    for (const q of domande) {
      const testo = String(q.explanation || '');
      if (!testo) continue;
      const trovati = controlla(testo);
      controllate += 1;
      if (trovati.length) {
        sbagliate += 1;
        trovati.forEach((p) => errori.push(`  [${q.id}] "${p.espressione}" — il risultato e' ${p.atteso}`));
      }
    }
  }
  if (errori.length) {
    console.error(`[ERROR] ${sbagliate} spiegazioni contengono un calcolo sbagliato:`);
    errori.forEach((e) => console.error(e));
    process.exit(1);
  }
  console.log(`calcoli nelle spiegazioni: ${controllate} spiegazioni controllate, nessuna uguaglianza sbagliata.`);
}

main();
