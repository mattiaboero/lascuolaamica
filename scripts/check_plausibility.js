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
  // Dal lotto 2 delle famiglie: le prime regole sui conteggi. Le otto di sopra
  // guardano velocita' e capienze, e i numeri assurdi di questi tre template
  // ci passavano sotto — un allenatore con 912 atleti, una scuola con 197
  // classi, una ricetta con 8 millilitri di latte per tre persone.
  { re: /\b(allenatore)\b[^.?!]{0,40}?(\d[\d.]*)\s*atleti/gi, min: 1, max: 60, cosa: 'atleti di un allenatore' },
  { re: /\b(una scuola)\b[^.?!]{0,40}?(\d[\d.]*)\s*classi/gi, min: 1, max: 60, cosa: 'classi di una scuola' },
  { re: /\b(ricetta)\b[^.?!]{0,60}?(\d[\d.]*)\s*millilitri/gi, min: 50, max: 5000, cosa: 'millilitri in una ricetta' },
  // Dal lotto 3 delle famiglie.
  { re: /\b(treno)\b[^.?!]{0,40}?(\d[\d.]*)\s*vagoni/gi, min: 1, max: 30, cosa: 'vagoni di un treno' },
  { re: /\b(classe)\b[^.?!]{0,20}?(\d[\d.]*)\s*alunni/gi, min: 12, max: 30, cosa: 'alunni di una classe' },
  // Dal lotto 4 delle famiglie: 5-12 grammi di farina, zucchero o burro per
  // quattro persone sono un cucchiaino.
  { re: /\b(ricetta)\b[^.?!]{0,60}?(\d[\d.]*)\s*grammi/gi, min: 50, max: 5000, cosa: 'grammi in una ricetta' },
  // Dal lotto 5 delle famiglie: il template degli sconti sceglieva il prezzo
  // a caso senza guardare l'oggetto, e ne uscivano un libro da 190 euro e uno
  // zaino da 210.
  { re: /\b(libro)\s+costa\s+(\d[\d.]*)\s*euro/gi, min: 1, max: 60, cosa: 'prezzo di un libro' },
  { re: /\b(zaino)\s+costa\s+(\d[\d.]*)\s*euro/gi, min: 5, max: 150, cosa: 'prezzo di uno zaino' },
  // Dal lotto 1 delle istanze: "una scuola con 42 classi con 5 alunni
  // ciascuna". La regola sugli alunni guardava "classe ... alunni" e questa
  // forma al plurale le sfuggiva.
  { re: /\b(classi con)\s*(\d[\d.]*)\s*alunni\s+(?:ciascuna|ognuna|l'una|per classe)/gi,
    min: 15, max: 28, cosa: 'alunni per classe' },
  // Dal lotto 2 delle istanze: 13 euro per un chilo di banane, e biscotti
  // venduti a 23 euro l'uno. Il numero da guardare e' sempre il secondo
  // gruppo catturato, come nelle altre regole.
  { re: /kg di (banane|arance|mele|pere|pesche|kiwi|mandarini|ananas)\s+a\s+(\d[\d.]*)\s*euro al kg/gi,
    min: 1, max: 8, cosa: 'prezzo della frutta al kg' },
  { re: /(biscotti|caramelle|merendine) possibile a\s+(\d[\d.]*)\s*euro l'uno/gi,
    min: 1, max: 3, cosa: "prezzo di un dolcetto" },
  // Dal lotto 3 delle istanze: figurine vendute a 24 euro l'una.
  { re: /(figurine|caramelle|adesivi) possibile a\s+(\d[\d.]*)\s*euro l'un[ao]/gi,
    min: 1, max: 3, cosa: 'prezzo di una figurina' },
  // Dal lotto 2 delle istanze: un campo che rende 13 kg di grano per ettaro.
  // La resa vera sta sui 3.000-8.000 kg, cioe' 30-80 quintali.
  { re: /\b(produce)\s+(\d[\d.]*)\s*kg di grano per ettaro/gi,
    min: 3000, max: 9000, cosa: 'resa di grano per ettaro' },
  // Dal lotto 8 delle istanze: nove "campi da calcetto" da 8x4 a 23x12 metri.
  // Un campo da calcetto sta sui 25-42 m di lunghezza: quelli erano orti.
  { re: /\b(campo da calcetto) misura\s+(\d[\d.]*)\s*m per/gi,
    min: 25, max: 45, cosa: 'lunghezza di un campo da calcetto' },
  // Dal lotto 9 delle istanze: "Un atleta percorre 11 m al minuto", cioe'
  // 0,66 km/h. Un atleta cammina a 5-6 km/h (un centinaio di metri al
  // minuto) e corre a 12-20.
  { re: /\b(atleta) percorre\s+(\d[\d.]*)\s*m al minuto/gi,
    min: 80, max: 500, cosa: 'metri al minuto di un atleta' },
  // Dal lotto 25 delle istanze: "Una famiglia spende 12 euro al mese". Le
  // spese di una famiglia stanno sulle migliaia: quelle cifre sono di un
  // abbonamento, non di un bilancio familiare.
  { re: /\b(famiglia) spende\s+(\d[\d.]*)\s*euro al mese/gi,
    min: 500, max: 9000, cosa: 'spesa mensile di una famiglia' },
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
