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
  "Quale è il fiume più lungo d'Europa?",
  'Con 90 euro compro 3 magliette e mi avanza 15 euro.',
  'Sommiamo le quantità di entrambi: 11 + 14 = 25 uva.',
  'Il libro? Lo ho preso ieri.',
  'In scatola ci sono 108 matite. Ne usi 13. Quante restano?',
  "Alla domanda 'Dove sfocia un fiume?' la risposta più corretta è...",
  'Prima: 5h30 + 4h45 = 10h15.',
  'Distribuisci 24 adesivi a 3 bambini in uguale misura. Quanti ne riceve ognuno?',
  'Quando starnutiamo, per non spargere i germi dovremmo?',
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
  'A quale apparato appartiene soprattutto il/i cuore?',
  "L'ambiente è il comportamento corretto.",
  'Secondo i Greci, gli dei abitavano sul Monte Olimpo.',
  "Il Monte Olimpo era considerato la dimora degli dei.",
  'Un campo di 5400 mq viene diviso in 25 lotti identici.',
  '42 - 22 = 20 farfalle rimasti.',
  'Martina raccoglie 20 gomme al mattino e 22 nel pomeriggio. Quanti ne ha in tutto?',
  "'ca-sa' è divisa bene",
  "L'ombra si forma quando un corpo?",
  'I Fenici erano famosi soprattutto come?',
  'Il soggetto è "Fatima\' e il predicato è \'ha comprato".',
  'Quale sistema di scrittura usavano gli egizi?',
  "Gli egizi appartengono all'antichita.",
  "Nell'acqua è la risposta corretta.",
  'Sia vegetali sia animali è la risposta corretta.',
  'Quante ciliegine riceve ogni bambino se li divide in parti uguali?',
  'La rana vive soprattutto nel stagno.',
  'A che cosa serve di solito il stazione?',
  "Sei in un parco e hai una bottiglietta vuota. Non c'è un cestino vicino. cosa è meglio fare?",
  '27 + 10 =?',
  "La risposta corretta è 'l'euro'.",
  'Che cosa mostra più rispetto quando vuoi ricordare su quale valore si fonda la Repubblica italiana?',
  'Fungo è un essere vivente.',
  'Le energie rinnovabili sono importanti perché?',
  'Un oggetto metallico lasciato al sole diventa…',
  'Se vuoi spiegare il volontariato, qual è il comportamento corretto?',
  'In una situazione in cui vuoi spiegare che cosa significa sostenibilità, cosa è meglio fare?',
  'Prima: 336 ÷ 7. Poi: 336 ÷ 7 = 48.',
  'Gli antichi egizi costruivano piramidi di pietra.',
  'Prima: 4 × 3 = 12 biscotti. Poi: i biscotti totali sono 12.',
  "Ma aspetta: sol- vs ste-: confrontiamo la seconda lettera.",
  'Prima: 3 x 1,20 = 3,60 euro per i quaderni.',
  'Plurali irregolari: uomo/uomini, dio/dei, bue/buoi.',
  'La mamma ha comprato 32 palline e vuole distribuirli in parti uguali.',
  'Nella successione corretta, mi sveglio è la risposta giusta.',
  "Quando un oggetto blocca la luce si forma un'?",
];

const CORRETTE = [
  "Quale tra queste parole ha la doppia 'l'?",
  "What is the -ing form of the verb 'run'?",
  "Nella successione corretta, 'mi sveglio' è la risposta giusta.",
  'La mamma ha comprato 32 palline e vuole distribuirle in parti uguali.',
  "'Qualche' e 'dei' indicano una quantità positiva.",
  "Sulla linea del tempo il primo elemento è 'mi sveglio'.",
  'Prima: 3 × 1,20 = 3,60 euro per i quaderni.',
  'Come si chiamavano le costruzioni a gradoni che i Sumeri dedicavano agli dèi?',
  'Prima: 12 × 5 = 60 pagine. Poi: 60 + 24 = 84 pagine.',
  'Il treno aspetta in stazione e riparte alle 9.',
  'I mercanti fenici viaggiavano per tutto il Mediterraneo.',
  'I palazzi cretesi erano centri di governo e di culto.',
  'Prima: 252 mele ÷ 9 scatole. Poi: 252 ÷ 9 = 28.',
  'Prima: velocità × tempo. Poi: 95 × 4 = 380 km.',
  'Se vuoi bere a scuola, qual è il comportamento corretto?',
  'In una situazione in cui devi buttare un rifiuto, cosa è meglio fare?',
  "Il giornale è di carta e si differenzia nella raccolta corretta.",
  'Secondo i Greci, gli dèi abitavano sul Monte Olimpo.',
  'Un campo di 5400 m² viene diviso in 25 lotti identici.',
  'La risposta corretta è dei Greci.',
  '42 - 22 = 20 farfalle rimaste.',
  'I fiumi possono essere usati per la navigazione.',
  'Martina raccoglie 20 gomme al mattino e 22 nel pomeriggio. Quante ne ha in tutto?',
  'Pietro raccoglie 13 libri al mattino e 16 nel pomeriggio. Quanti ne ha in tutto?',
  "'ca-sa' è divisa bene.",
  'Un ciclista viaggia a 26 km/h. In 18 ore quanti km percorre?',
  'Quale materiale è duro come un chiodo?',
  'Cosa succede agli animali come il riccio in inverno?',
  'Fino a dove arriva la libertà di una persona?',
  'Come si sentiva il mercante?',
  "Leggi: 'Il treno arriva alle tre.' Quando arriva il treno?",
  'Zeus era il più potente degli dèi greci e regnava sullOlimpo.',
  "Il soggetto è 'Fatima' e il predicato è 'ha comprato'.",
  'La risposta corretta è "l\'effetto delle abitudini sull\'ambiente".',
  'Quale sistema di scrittura usavano gli Egizi?',
  'I vasi greci erano decorati con scene di vita quotidiana.',
  "La risposta corretta è 'sia vegetali sia animali'.",
  'La risposta corretta è "nell\'acqua".',
  "'Sul' è la preposizione articolata su+il, ma 'sul zaino' sarebbe sbagliato.",
  'Un treno viaggia a 96 km/h. Quanti km percorre in 2 ore?',
  'La rana vive soprattutto nello stagno.',
  'Il sole scalda il sasso e il sale si scioglie nel sugo.',
  "Nel XX secolo la popolazione si è concentrata nelle città.",
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

// Dal lotto 30: refusi che nessuna regex puo' descrivere, perche' la parola
// sbagliata e' plausibile ("Terrazamento", "Aerogramma"). Il segnale e'
// statistico: una parola quasi assente nel corpus a un passo da una molto
// piu' frequente. Le aree di ortografia, lessico e grammatica restano fuori
// perche' li' le grafie sbagliate sono i distrattori, e sono volute.
const PAROLE_LEGITTIME = new Set(['contrae', 'copia', 'rubano']);

function controllaRefusi() {
  const dir = path.join(__dirname, '..', 'json');
  const salta = /ortograf|lessic|lingua|morfolog|grammatic|riflession/i;
  const freq = new Map();
  const dove = new Map();
  for (const f of fs.readdirSync(dir).filter((n) => n.endsWith('.json'))) {
    if (f.includes('index') || f.includes('changelog')) continue;
    const dati = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    const domande = Array.isArray(dati) ? dati : dati.questions;
    if (!Array.isArray(domande)) continue;
    for (const q of domande) {
      if (q.subject === 'inglese') continue;
      const escluso = salta.test(`${q.area || ''} ${q.subarea || ''}`);
      const testo = [q.question, q.explanation, q.answer].concat(q.options || [])
        .filter((v) => typeof v === 'string').join(' ').toLowerCase();
      for (const w of testo.match(/[a-zà-ù]{5,}/g) || []) {
        freq.set(w, (freq.get(w) || 0) + 1);
        if (!escluso && !dove.has(w)) dove.set(w, q.id);
      }
    }
  }
  const sospetti = [];
  for (const [w, id] of dove) {
    const n = freq.get(w);
    if (n > 2 || PAROLE_LEGITTIME.has(w)) continue;
    const candidati = [];
    for (let i = 1; i < w.length; i += 1) {
      if ('bcdfglmnprstvz'.includes(w[i])) candidati.push(w.slice(0, i) + w[i] + w.slice(i));
      // Dal lotto 36: anche la direzione opposta, una doppia di troppo
      // ("starrebbero" per "starebbero"). Serve la simmetria, perche' il
      // difetto nasce nello stesso modo.
      if (w[i] === w[i - 1] && 'bcdfglmnprstvz'.includes(w[i])) candidati.push(w.slice(0, i) + w.slice(i + 1));
      candidati.push(w.slice(0, i - 1) + w[i] + w[i - 1] + w.slice(i + 1));
    }
    for (const c of candidati) {
      if (c !== w && (freq.get(c) || 0) >= 5 && freq.get(c) >= 5 * n) {
        sospetti.push(`${w} (${id}) → forse "${c}", che nel corpus compare ${freq.get(c)} volte`);
        break;
      }
    }
  }
  return sospetti.sort();
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

  const refusi = controllaRefusi();
  if (refusi.length) {
    fallito = true;
    console.error('[ERROR] parole rare a un passo da una parola frequente del corpus (probabili refusi):');
    refusi.forEach((r) => console.error(`  - ${r}`));
    console.error('  se la parola e\' corretta, aggiungila a PAROLE_LEGITTIME in check_grammar_rules.js');
  }

  if (fallito) process.exit(1);
  console.log(`regole grammaticali: ${regole.length} attive, ${SBAGLIATE.length} esempi intercettati, ${CORRETTE.length} frasi corrette non toccate; nessun refuso statistico.`);
}

main();
