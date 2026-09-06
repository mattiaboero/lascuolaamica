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
];

const CORRETTE = [
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

  if (fallito) process.exit(1);
  console.log(`regole grammaticali: ${regole.length} attive, ${SBAGLIATE.length} esempi intercettati, ${CORRETTE.length} frasi corrette non toccate.`);
}

main();
