#!/usr/bin/env node
// Le regole di accordo grammaticale di lint_content.js sono regex, e una regex
// puo' smettere di funzionare senza che nessuno se ne accorga: e' successo con
// "Gatto è un essere", dove il \b dopo "è" non fa mai match perche' in
// JavaScript le lettere accentate non sono caratteri di parola, e la regola
// sembrava attiva mentre non intercettava niente.
//
// Questo controllo verifica due cose a ogni build: che ogni regola scatti sul
// suo esempio sbagliato, e che nessuna scatti sulle frasi corrette insidiose
// (i "tre caffè", "il moto di rivoluzione", "3 sale", "gli zuccheri" che
// avevano prodotto falsi positivi durante la revisione del corpus).

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const LINT = path.join(__dirname, 'lint_content.js');

const SBAGLIATE = [
  'Una ricetta richiede 8 burro (in grammi).',
  'Servono 8 burro per la torta.',
  'Quante burro servono?',
  'Quante biscotti ha mangiato?',
  'Quanti figurine hai?',
  'Un borsa costa 10 euro.',
  'Una laboratorio grande.',
  'Nella laboratorio ci sono libri.',
  'Nel fattoria vivono animali.',
  'Un zaino costa 20 euro.',
  'Di quale materiale è fatto una finestra?',
  'Nella aula ci sono 20 banchi.',
  '10 lumache rimasti sul prato.',
  'Gatto è un essere vivente.',
  'Una password serve a?',
  'Il Monte Bianco si trova nelle?',
  'Il cuore batte dentro il.',
  'Quale terreno trattiene più acqua??',
  'Se cade neve, il tempo è',
  'Nuvola è un essere vivente.',
  "Sara compra 4 magliette. In cassa gli applicano uno sconto.",
  'Una famiglia spende 35 euro al giorno. Quanto gli rimane?',
  "Sara compra 4 magliette a 18 euro l'uno.",
  "Irene compra 7 sciarpe a 16 euro l'uno.",
  'Automobile è un essere vivente.',
  'Quale organo è legato soprattutto al senso del/della udito?',
  "Sei in un parco e hai una bottiglietta vuota. Non c'è un cestino vicino. cosa è meglio fare?",
  '27 + 10 =?',
  "La risposta corretta è 'l'euro'.",
  'Che cosa mostra più rispetto quando vuoi ricordare su quale valore si fonda la Repubblica italiana?',
  'Fungo è un essere vivente.',
  'Le energie rinnovabili sono importanti perché?',
  'Un oggetto metallico lasciato al sole diventa…',
];

const CORRETTE = [
  "Una civiltà vissuta nel 2000 a.C. è più antica di una del 500 a.C.?",
  'Sulla linea del tempo, 3000 a.C. viene...',
  "Quale complemento risponde alla domanda 'chi? che cosa?' dopo un verbo transitivo?",
  'Perché il ghiaccio si scioglie al sole?',
  'Tutto quello che si legge su internet è sempre vero?',
  'La preistoria viene prima o dopo la storia?',
  'In "Luca va a scuola in bicicletta", che complemento è "in bicicletta"?',
  'Con quale fase comincia il ciclo vitale di un essere vivente?',
  'Quanto fa 27 + 10?',
  'La risposta corretta è "l\'euro".',
  "La risposta corretta è 'il mare'.",
  'Che cosa mostra più rispetto quando entri in biblioteca?',
  'Un bambino ha 60 euro. Compra 4 pacchi di figurine. Quanto gli rimane?',
  'Un contadino ha 120 mele. Ne vende 30. Quante mele gli restano?',
  "Marco compra 3 puzzle a 14 euro l'uno. Quanto paga?",
  "Sara compra 4 magliette a 18 euro l'una. Quanto paga?",
  "Chiara ha 104 euro e vuole comprare figurine a 15 euro l'una. Quante ne compra?",
  'Una ricetta richiede 8 grammi di burro.',
  'Quanti grammi di burro servono?',
  'Una borsa costa 10 euro.',
  'Nel laboratorio ci sono libri.',
  'Il gatto è un essere vivente.',
  '10 lumache rimaste sul prato.',
  'Tre caffè al bar.',
  'Il moto di rivoluzione della Terra.',
  'La palestra ha 3 sale.',
  'Gli zuccheri della mela vengono assorbiti.',
  "Nell'aula ci sono 20 banchi.",
  'Una password serve a...',
  'Quale strumento usi per sapere che ore sono?',
  'Quanti pacchi ci sono?',
  'Il Monte Bianco si trova nelle Alpi.',
  "Arrotonda 3,7 all'unità più vicina.",
  'Tra queste parole, individua la preposizione semplice.',
  'Quale parola contiene il suono GLI?',
  "Luca compra 4 magliette. In cassa gli applicano uno sconto.",
  'Perché il ghiaccio si scioglie al sole?',
];

function caricaRegole() {
  const src = fs.readFileSync(LINT, 'utf8');
  const testa = src.slice(0, src.indexOf('function checkQuestion')) + '\nthis.__G = GRAMMATICA;';
  const ctx = { module: {}, require, console, __dirname };
  vm.createContext(ctx);
  vm.runInContext(testa, ctx);
  if (!Array.isArray(ctx.__G) || !ctx.__G.length) {
    throw new Error('GRAMMATICA non trovata in lint_content.js');
  }
  return ctx.__G;
}


// Le due liste di nomi propri in lint_content.js sono l'unico modo di sapere il
// genere del referente, e sono gia' rimaste indietro due volte mentre il corpus
// cresceva (lotto 5 e lotto 7): la regola sembrava attiva e lasciava passare
// "Irene ... gli applicano". Qui il corpus viene riletto a ogni build e ogni
// nome che fa da soggetto va classificato, altrimenti il controllo fallisce.
const NON_NOMI = new Set([
  'Cosa', 'Chi', 'Come', 'Dove', 'Quando', 'Quanto', 'Quanta', 'Quanti', 'Quante',
  'Quale', 'Quali', 'Ognuno', 'Ognuna', 'Nessuno', 'Poi', 'Una', 'Uno', 'Studiare',
  'Roma', 'Italia', 'Terra', 'Padana', 'Indo', 'Mediterraneo', 'Solare', 'Paese',
]);

function controllaNomiClassificati(sorgente) {
  const lista = (nome) => {
    const m = sorgente.match(new RegExp(`const ${nome} = '([^']+)'`));
    if (!m) throw new Error(`${nome} non trovata in lint_content.js`);
    return new Set(m[1].split('|'));
  };
  const noti = new Set([...lista('NOMI_PERSONA_F'), ...lista('NOMI_PERSONA_M')]);
  const dir = path.join(__dirname, '..', 'json');
  const verbi = 'ha|compra|legge|corre|mangia|prepara|raccoglie|guadagna|spende|percorre|riceve|porta|studia|gioca';
  const re = new RegExp(`\\b([A-Z][a-zà-ù]{2,})\\s+(?:${verbi})\\b`, 'g');
  const sconosciuti = new Set();
  for (const f of fs.readdirSync(dir).filter((n) => n.endsWith('.json'))) {
    if (f.includes('index') || f.includes('changelog')) continue;
    const dati = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    const domande = Array.isArray(dati) ? dati : dati.questions;
    if (!Array.isArray(domande)) continue;
    for (const q of domande) {
      for (const m of String(q.question || '').matchAll(re)) {
        if (!noti.has(m[1]) && !NON_NOMI.has(m[1])) sconosciuti.add(m[1]);
      }
    }
  }
  return [...sconosciuti].sort();
}

function main() {
  const regole = caricaRegole();
  let fallito = false;

  const mai = regole.filter((r) => !SBAGLIATE.some((t) => r.pattern.test(t)));
  if (mai.length) {
    fallito = true;
    console.error(`[ERROR] ${mai.length} regole non scattano su nessun esempio (regex rotta o esempio mancante):`);
    mai.forEach((r) => console.error(`  - ${r.msg}`));
  }

  const scoperte = SBAGLIATE.filter((t) => !regole.some((r) => r.pattern.test(t)));
  if (scoperte.length) {
    fallito = true;
    console.error('[ERROR] frasi sbagliate non intercettate da nessuna regola:');
    scoperte.forEach((t) => console.error(`  - ${t}`));
  }

  const falsi = CORRETTE.filter((t) => regole.some((r) => r.pattern.test(t)));
  if (falsi.length) {
    fallito = true;
    console.error('[ERROR] falsi positivi su frasi corrette:');
    falsi.forEach((t) => console.error(`  - ${t} → ${regole.find((r) => r.pattern.test(t)).msg}`));
  }

  const sconosciuti = controllaNomiClassificati(fs.readFileSync(LINT, 'utf8'));
  if (sconosciuti.length) {
    fallito = true;
    console.error('[ERROR] nomi propri nel corpus non classificati in NOMI_PERSONA_F / NOMI_PERSONA_M:');
    sconosciuti.forEach((n) => console.error(`  - ${n} (aggiungilo alla lista giusta in lint_content.js)`));
  }

  if (fallito) process.exit(1);
  console.log(`regole grammaticali: ${regole.length} attive, ${SBAGLIATE.length} esempi intercettati, ${CORRETTE.length} frasi corrette non toccate.`);
}

main();
