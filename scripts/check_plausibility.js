#!/usr/bin/env node
// I problemi sono generati da template che abbinano numeri casuali a soggetti
// concreti, e il numero a volte contraddice il soggetto: un aereo che vola a 15
// km/h (4.12.72), una piscina da 88 litri (4.12.73). La matematica torna, ma il
// testo descrive una cosa impossibile, e un bambino di quarta un aereo lento
// come una bicicletta lo nota.
//
// Il controllo copre solo i soggetti che hanno un ordine di grandezza noto e
// senza eccezioni ragionevoli. Gli intervalli sono larghi di proposito: servono
// a intercettare l'assurdo, non a discutere il caso limite.

const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'json');

const REGOLE = [
  { re: /\b(aereo)\b[^.?!]{0,40}?(\d[\d.]*)\s*km\/h/gi, min: 300, max: 1000, cosa: 'velocita di un aereo' },
  { re: /\b(nave)\b[^.?!]{0,40}?(\d[\d.]*)\s*km\/h/gi, min: 10, max: 60, cosa: 'velocita di una nave' },
  { re: /\b(treno)\b[^.?!]{0,40}?(\d[\d.]*)\s*km\/h/gi, min: 40, max: 350, cosa: 'velocita di un treno' },
  { re: /\b(bicicletta|ciclista)\b[^.?!]{0,40}?(\d[\d.]*)\s*km\/h/gi, min: 5, max: 45, cosa: 'velocita in bicicletta' },
  { re: /\b(automobile|auto)\b[^.?!]{0,40}?(\d[\d.]*)\s*km\/h/gi, min: 20, max: 140, cosa: "velocita di un'automobile" },
  { re: /\b(piscina)\b[^.?!]{0,50}?(\d[\d.]*)\s*litri/gi, min: 1000, max: 1e9, cosa: 'capienza di una piscina' },
  { re: /\b(bottiglia|bottiglietta|bicchiere)\b[^.?!]{0,40}?(\d[\d.]*)\s*litri/gi, min: 0, max: 10, cosa: 'capienza di una bottiglia' },
  { re: /\b(maratona)\b[^.?!]{0,40}?(\d[\d.]*)\s*km\b/gi, min: 40, max: 44, cosa: 'lunghezza di una maratona' },
];

function main() {
  const errori = [];
  for (const file of fs.readdirSync(DIR).filter((n) => n.endsWith('.json'))) {
    if (file.includes('index') || file.includes('changelog')) continue;
    const dati = JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8'));
    const domande = Array.isArray(dati) ? dati : dati.questions;
    if (!Array.isArray(domande)) continue;
    for (const q of domande) {
      const testo = String(q.question || '');
      for (const regola of REGOLE) {
        regola.re.lastIndex = 0;
        for (const m of testo.matchAll(regola.re)) {
          const v = Number(m[2].replace(/\./g, ''));
          if (!Number.isFinite(v)) continue;
          if (v < regola.min || v > regola.max) {
            errori.push(`  [${q.id}] ${regola.cosa}: ${v} (plausibile ${regola.min}-${regola.max}) — "${m[0].trim()}"`);
          }
        }
      }
    }
  }
  if (errori.length) {
    console.error(`[ERROR] ${errori.length} dati fisicamente implausibili:`);
    errori.forEach((e) => console.error(e));
    process.exit(1);
  }
  console.log('plausibilita dei dati nei problemi: nessun valore fuori scala.');
}

main();
