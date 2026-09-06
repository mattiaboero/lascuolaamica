#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const SUBJECTS = ['matematica', 'problemi', 'italiano', 'inglese', 'civica', 'geografia', 'storia', 'scienze'];
const JSON_DIR = path.join(__dirname, '..', 'json');

// Italian linguistic patterns to check
const COMMON_MISTAKES = {
  accents: [
    { pattern: /\bperche\b/gi, message: 'missing accent: "perche" → "perché"' },
    { pattern: /\bpoiche\b/gi, message: 'missing accent: "poiche" → "poiché"' },
    { pattern: /\bbenche\b/gi, message: 'missing accent: "benche" → "benché"' },
    { pattern: /\bfinche\b/gi, message: 'missing accent: "finche" → "finché"' },
    { pattern: /\bqual'\s*è\b/g, message: 'should be "qual è" (no apostrophe)' },
    // Truncated accented words: these spellings are unambiguously wrong in Italian.
    // Skipped when the correctly-accented counterpart also appears (intentional teaching contrast).
    { pattern: /\b(citta|universita|societa|liberta|verita|qualita|attivita|identita|virtu|gioventu)\b/gi,
      check: (text) => !hasAccentedCounterpart(text),
      message: 'missing final accent on a truncated word (e.g. "citta" → "città")' },
  ],
  spacing: [
    { pattern: /\s{2,}/g, message: 'double or multiple spaces' },
    { pattern: /\s+[,;:.!?]/g, message: 'space before punctuation' },
  ],
};

// Truncated-accent pairs (bare → accented). Used to suppress false positives in
// ortografia questions that deliberately quote the wrong form next to the right one.
const ACCENT_PAIRS = {
  citta: 'città', universita: 'università', societa: 'società', liberta: 'libertà',
  verita: 'verità', qualita: 'qualità', attivita: 'attività', identita: 'identità',
  virtu: 'virtù', gioventu: 'gioventù',
};
function hasAccentedCounterpart(text) {
  const lower = text.toLowerCase();
  for (const [bare, accented] of Object.entries(ACCENT_PAIRS)) {
    if (new RegExp(`\\b${bare}\\b`, 'i').test(lower) && lower.includes(accented)) return true;
  }
  return false;
}

// Common typos
const TYPOS = ['the', 'tha', 'yuo', 'recieve', 'occured', 'knowwn'];

// Red-flag patterns surfaced by the F3 pedagogical QA review.
const GENERATOR_META = /ricontroll|aggiorno (la )?risposta|ricalcolo|aggiorno risposta|come (assistente|modello)|non posso rispondere/i;
const SELF_CONTRADICTION = /tutte le opzioni conteng|tutte.{0,30}derivano.{0,30}ma scegliamo|scegliamo la più comune|ma 'questa' è la più/i;
const ANOMALOUS_ACCENT = /[íúÍÚ]/; // acute on i/u — not used in standard Italian (which uses ì/ù grave)
// D3: dangling cross-references. A quiz question is served standalone and shuffled,
// so any pointer to another question/number/"above" is a broken artifact (e.g. the
// scienze "nella domanda n.X" batch culled in 4.11.4). Checked on the QUESTION field
// only — explanations legitimately say things like "nella domanda indiretta l'ordine…".
const DANGLING_REFERENCE = /\bdomanda\s+n\.?\s*\d+|\bdomanda precedente\b|\b(come visto|vedi|figura|immagine)\s+(qui\s+)?sopra\b|nell'esercizio precedente/i;

// Accordo grammaticale rotto dalla sostituzione del nome nei template generati.
// Origine reale: una famiglia di problemi diceva "richiede 8 burro (in grammi).
// Quante burro (in grammi) servono...", e la stessa causa aveva prodotto "Un
// borsa", "Nella laboratorio", "Quante biscotti" in 55 domande su tre materie.
// I nomi negli elenchi sono quelli davvero presenti nel corpus; le esclusioni
// sono deliberate e verificate: "sale" (stanze, non il sale), "moto" (il moto di
// rivoluzione in scienze), "zuccheri" (plurale legittimo in biologia), "caffè"
// (numerabile: "tre caffè").
const NOMI_MASSA = 'burro|zucchero|farina|farine|latte|olio|pane|riso|miele|marmellata|panna';
const NOMI_MASCHILI = 'biscotti|cioccolatini|panini|euro|libri|quaderni|grammi|millilitri|litri|alunni|bambini|laboratorio|parco|negozio|cortile|magazzino|giardino|astuccio|frutteto|campo';
const NOMI_FEMMINILI = 'borsa|giacca|scarpe|maglietta|penna|matita|aula|palestra|biblioteca|fattoria|figurine|caramelle|pagine|mele|cameretta|cucina|stanza|classe|scuola|finestra|porta|piscina|libreria|cartoleria';
const GRAMMATICA = [
  { pattern: /\((?:in|espress[oa] in)\s+(?:grammi|chilogrammi|metri|centimetri|litri|minuti|euro|km|kg|cm|ml)\)/i,
    msg: 'unita di misura tra parentesi dopo il nome (artefatto di template: "8 burro (in grammi)" invece di "8 grammi di burro")' },
  { pattern: new RegExp(`\\b\\d+\\s+(?:${NOMI_MASSA})\\b`, 'i'),
    msg: 'numero seguito da un nome non numerabile senza unita di misura (es. "8 burro")' },
  { pattern: new RegExp(`\\bquant[ei]\\s+(?:${NOMI_MASSA})\\b`, 'i'),
    msg: 'quanti/quante davanti a un nome non numerabile (serve "quanto" o l\'unita di misura)' },
  { pattern: new RegExp(`\\bquante\\s+(?:${NOMI_MASCHILI})\\b`, 'i'), msg: 'accordo: "quante" davanti a un nome maschile' },
  { pattern: new RegExp(`\\bquanti\\s+(?:${NOMI_FEMMINILI})\\b`, 'i'), msg: 'accordo: "quanti" davanti a un nome femminile' },
  { pattern: new RegExp(`\\b(?:un|il)\\s+(?:${NOMI_FEMMINILI})\\b`, 'i'), msg: 'accordo: articolo maschile davanti a un nome femminile' },
  { pattern: new RegExp(`\\b(?:una|la)\\s+(?:${NOMI_MASCHILI})\\b`, 'i'), msg: 'accordo: articolo femminile davanti a un nome maschile' },
  { pattern: new RegExp(`\\b(?:nella|della)\\s+(?:${NOMI_MASCHILI})\\b`, 'i'), msg: 'accordo: preposizione femminile davanti a un nome maschile' },
  { pattern: new RegExp(`\\bnel\\s+(?:${NOMI_FEMMINILI})\\b`, 'i'), msg: 'accordo: "nel" davanti a un nome femminile' },
  { pattern: /\b(?:un)\s+(?:zaino|zucchero|studente|spazzolino|stadio)\b/i, msg: 'serve "uno" davanti a z- o s+consonante (es. "uno zaino")' },
  // Participio maschile davanti a un soggetto femminile: stessa causa, il
  // template e' scritto per un nome maschile e il nome viene sostituito.
  { pattern: new RegExp(`\\b(?:fatto|finito|riempito|costruito|usato)\\s+(?:una|la|un')\\s*(?:${NOMI_FEMMINILI}|chiave|finestra)\\b`, 'i'),
    msg: 'accordo: participio maschile con un soggetto femminile (es. "fatto una finestra")' },
  { pattern: /\b(?:nella|della|alla|la)\s+(?:aula|arancia|automobile|entrata|isola|uscita|ora)\b/i,
    msg: "manca l'elisione davanti a vocale (es. \"nella aula\" invece di \"nell'aula\")" },
  // Trovate dal lotto di prova sulle domande a scheletro unico: participio
  // maschile dopo un nome femminile plurale nelle spiegazioni ("10 lumache
  // rimasti") e frase che inizia con un nome comune senza articolo.
  { pattern: /\b(?:lumache|galline|mele|pere|caramelle|figurine|pagine|matite|penne|uova|scatole|piante|fragole)\s+(?:rimasti|finiti|venduti|mangiati|comprati)\b/i,
    msg: 'accordo: participio maschile dopo un nome femminile plurale (es. "10 lumache rimasti")' },
  { pattern: /^(?:Gatto|Cane|Sasso|Albero|Fiore|Sedia|Tavolo|Acqua|Pietra|Legno|Vetro|Ferro)\s+(?:è|era|ha)(?=\s|$)/,
    msg: "manca l'articolo a inizio frase (es. \"Gatto è un essere\" invece di \"Il gatto è un essere\")" },
];

function checkQuestion(subject, classNum, area, question, options, answer, explanation, difficulty) {
  const errors = [];

  // Check field presence and type
  if (!question || typeof question !== 'string' || !question.trim()) {
    errors.push({ level: 'error', field: 'question', msg: 'question is empty' });
  }

  // F3 QA red flags — these are blocking because they signal broken or leaked content.
  const fullText = `${question || ''} ${explanation || ''} ${(options || []).join(' ')}`;
  if (GENERATOR_META.test(fullText)) {
    errors.push({ level: 'error', field: 'text', msg: 'generator meta-text leaked into content' });
  }
  if (explanation && SELF_CONTRADICTION.test(explanation)) {
    errors.push({ level: 'error', field: 'explanation', msg: 'self-contradictory "all options qualify" explanation' });
  }
  if (question && DANGLING_REFERENCE.test(question)) {
    errors.push({ level: 'error', field: 'question', msg: 'dangling cross-reference in question (e.g. "domanda n.X" / "vedi sopra") — quiz questions must be self-contained' });
  }
  const isItalianText = subject !== 'inglese';
  if (isItalianText) {
    const testoIt = `${question || ''} ${explanation || ''}`;
    for (const regola of GRAMMATICA) {
      if (regola.pattern.test(testoIt)) {
        errors.push({ level: 'error', field: 'text', msg: `grammatica — ${regola.msg}` });
      }
    }
  }
  if (isItalianText && ANOMALOUS_ACCENT.test(`${question || ''} ${explanation || ''}`)) {
    errors.push({ level: 'warn', field: 'text', msg: 'anomalous accent character (í/ú/ì) in Italian text' });
  }

  if (!Array.isArray(options) || options.length !== 4) {
    errors.push({ level: 'error', field: 'options', msg: `options must be array of 4 items, got ${options ? options.length : 'null'}` });
  }

  if (!answer || typeof answer !== 'string' || !answer.trim()) {
    errors.push({ level: 'error', field: 'answer', msg: 'answer is empty' });
  } else if (options && Array.isArray(options) && !options.includes(answer)) {
    errors.push({ level: 'error', field: 'answer', msg: 'answer not in options' });
  }

  if (!explanation || typeof explanation !== 'string' || !explanation.trim()) {
    errors.push({ level: 'warn', field: 'explanation', msg: 'explanation is empty or missing' });
  }

  if (difficulty === null || difficulty === undefined || ![1, 2, 3].includes(difficulty)) {
    errors.push({ level: 'error', field: 'difficulty', msg: `difficulty must be 1, 2, or 3, got ${difficulty}` });
  }

  if (!area || typeof area !== 'string' || !area.trim()) {
    errors.push({ level: 'warn', field: 'area', msg: 'area is empty or missing' });
  }

  // Italian linguistic checks (only for IT subjects)
  const isItalian = subject !== 'inglese';
  if (isItalian && question) {
    const text = question + ' ' + (explanation || '');

    // Apply every linguistic rule group (accents, apostrophes, spacing, quotes).
    for (const group of Object.values(COMMON_MISTAKES)) {
      group.forEach(rule => {
        if (rule.check && !rule.check(text)) return;
        rule.pattern.lastIndex = 0; // global regexes keep lastIndex between .test() calls
        if (rule.pattern.test(text)) {
          errors.push({ level: 'warn', field: 'text', msg: rule.message });
        }
      });
    }

    // Check for typos in options/explanation
    if (explanation) {
      TYPOS.forEach(typo => {
        if (new RegExp(`\\b${typo}\\b`, 'i').test(explanation)) {
          errors.push({ level: 'warn', field: 'explanation', msg: `possible typo: "${typo}"` });
        }
      });
    }
  }

  return errors;
}

function processSubject(subject) {
  const jsonFile = path.join(JSON_DIR, `${subject}.json`);

  if (!fs.existsSync(jsonFile)) {
    return { subject, total: 0, errors: 0, warnings: 0, details: [] };
  }

  const data = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));

  let questions = [];
  for (const v of Object.values(data)) {
    if (Array.isArray(v)) {
      questions = v;
      break;
    }
  }

  let totalErrors = 0;
  let totalWarnings = 0;
  const errorDetails = [];

  questions.forEach((q, idx) => {
    const errs = checkQuestion(
      subject,
      q.class,
      q.area,
      q.question,
      q.options,
      q.answer,
      q.explanation,
      q.difficulty
    );

    errs.forEach(err => {
      if (err.level === 'error') {
        totalErrors++;
      } else if (err.level === 'warn') {
        totalWarnings++;
      }

      // Store first few errors per subject for reporting
      if (errorDetails.length < 10) {
        errorDetails.push({
          idx,
          id: q.id,
          field: err.field,
          msg: err.msg,
          level: err.level,
        });
      }
    });
  });

  return {
    subject,
    total: questions.length,
    errors: totalErrors,
    warnings: totalWarnings,
    details: errorDetails,
  };
}

function main() {
  console.log('\n=== Content Linting Report ===\n');

  let totalErrors = 0;
  let totalWarnings = 0;

  console.log(`${'Subject'.padEnd(15)} ${'Total'.padEnd(8)} ${'Errors'.padEnd(8)} ${'Warnings'.padEnd(8)}`);
  console.log('='.repeat(50));

  const results = [];

  SUBJECTS.forEach(subject => {
    const result = processSubject(subject);
    results.push(result);

    console.log(`${result.subject.padEnd(15)} ${String(result.total).padEnd(8)} ${String(result.errors).padEnd(8)} ${String(result.warnings).padEnd(8)}`);

    totalErrors += result.errors;
    totalWarnings += result.warnings;
  });

  console.log('='.repeat(50));
  console.log(`${'TOTAL'.padEnd(15)} ${''.padEnd(8)} ${String(totalErrors).padEnd(8)} ${String(totalWarnings).padEnd(8)}\n`);

  // Print error details
  if (totalErrors > 0 || totalWarnings > 0) {
    console.log('=== First errors/warnings (per subject) ===\n');
    results.forEach(result => {
      if (result.details.length > 0) {
        console.log(`${result.subject}:`);
        result.details.slice(0, 3).forEach(detail => {
          const prefix = detail.level === 'error' ? '❌' : '⚠️ ';
          console.log(`  ${prefix} [id: ${detail.id}] ${detail.field}: ${detail.msg}`);
        });
        console.log();
      }
    });
  }

  if (totalErrors > 0) {
    console.log(`\n❌ ${totalErrors} blocking error(s) found.\n`);
    process.exit(1);
  } else if (totalWarnings > 0) {
    console.log(`\n⚠️  ${totalWarnings} warning(s) found (not blocking).\n`);
    process.exit(0);
  } else {
    console.log('✅ All content checks passed.\n');
    process.exit(0);
  }
}

main();
