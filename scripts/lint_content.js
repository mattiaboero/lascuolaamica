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
// Nomi propri di persona presenti nel corpus. In italiano il genere del pronome
// dipende dal referente e nessuna regex lo deduce dal testo, quindi le due liste
// vanno enumerate: check_grammar_rules.js rilegge il corpus a ogni build e
// fallisce se compare un nome che non sta in nessuna delle due, cosi' la lista
// non puo' restare indietro in silenzio (era gia' successo due volte).
const NOMI_PERSONA_F = 'Ada|Aisha|Alice|Amina|Amy|Anna|Arianna|Asel|Bea|Beatrice|Chiara|Claudia|Elena|Elisa|Emma|Fatima|Francesca|Giada|Giorgia|Giulia|Grace|Irene|Julia|Laura|Lea|Lena|Lisa|Lucy|Maria|Marina|Marta|Martina|Mei|Mia|Monica|Nadia|Nina|Olivia|Paola|Priya|Rima|Roberta|Sara|Sarah|Serena|Sofia|Valentina|Yasmin';
const NOMI_PERSONA_M = 'Ahmed|Alessandro|Amir|Andrea|Carlo|Dan|Daniele|Davide|Emilio|Fabio|Filippo|Francesco|Gianni|Giacomo|Giorgio|Giovanni|Giulio|Ivo|Jack|Jake|Leo|Lorenzo|Luca|Marco|Marino|Mario|Matteo|Mattia|Mike|Nicola|Omar|Paolo|Paul|Pedro|Peter|Pietro|Riccardo|Roberto|Sam|Simone|Soren|Stefano|Tom|Tommaso|Yusuf';
const VERBI_DATIVO = 'rimane|resta|restano|rimangono|serve|servono|applicano|danno|chiedono';
// Nomi femminili plurali usati nei problemi col prezzo unitario: "4 magliette a
// 18 euro l'uno" e' l'accordo rotto dal template, che era scritto per "libri".
const NOMI_FEMMINILI_PREZZO = 'magliette|sciarpe|maglie|matite|penne|granite|figurine|caramelle|scarpe|borse|gonne';
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
  { pattern: /^(?:Gatto|Cane|Sasso|Albero|Fiore|Sedia|Tavolo|Acqua|Pietra|Legno|Vetro|Ferro|Pesce|Nuvola|Farfalla|Uccello|Cavallo|Ape|Roccia|Neve|Pioggia|Vento|Sabbia|Erba|Foglia|Automobile|Fungo|Matita)\s+(?:è|era|ha)(?=\s|$)/,
    msg: "manca l'articolo a inizio frase (es. \"Gatto è un essere\" invece di \"Il gatto è un essere\")" },
  // In italiano una domanda non puo' finire con una preposizione: se la frase e'
  // sospesa e sono le opzioni a completarla, va chiusa con i puntini. Il corpus
  // usava entrambe le forme (374 con i puntini, 204 col punto interrogativo);
  // uniformato nella 4.12.55. La copula ("...il tempo è?") resta fuori dalla
  // regola: li' il punto interrogativo puo' essere corretto ("Che ore sono?").
  { pattern: /\b(?:in|di|dal|dalla|dallo|con|per|su|tra|fra|a|attraverso|verso|senza)\?\s*$/i,
    soloDomanda: true,
    msg: 'domanda che termina con una preposizione sospesa: usare i puntini di sospensione (es. "serve a...")' },
  // Stesse frasi sospese, altre due forme trovate col secondo lotto: chiuse con
  // un articolo o una preposizione articolata invece che con una preposizione
  // semplice, e chiuse col punto invece che col punto interrogativo. Nessuna
  // delle due puo' chiudere una frase italiana, quindi non servono eccezioni.
  // Il /i finale e' assente di proposito: "contiene il suono GLI?" cita un
  // gruppo di lettere in maiuscolo, non usa un articolo.
  { pattern: /\b(?:il|lo|la|i|gli|le|un|uno|una|nel|nello|nella|nei|negli|nelle|del|dello|della|dei|degli|delle|al|allo|alla|ai|agli|alle|sul|sulla|sui|sulle|col|coi)\?\s*$/,
    soloDomanda: true,
    msg: 'domanda che termina con un articolo o una preposizione articolata: usare i puntini di sospensione' },
  { pattern: /\b(?:a|ad|da|di|in|con|su|per|tra|fra|e|o|ma|perché|più|meno|il|lo|la|i|gli|le|un|uno|una|nel|nella|nei|nelle|del|della|dei|delle|al|alla|ai|alle|dal|dalla|verso)\.\s*$/i,
    soloDomanda: true,
    msg: 'frase sospesa chiusa con un punto: usare i puntini di sospensione' },
  // Trovate dal lotto 4: doppio punto interrogativo e domanda senza alcuna
  // punteggiatura finale ("...il tempo è" senza ne' "?" ne' puntini).
  { pattern: /\?\?/, soloDomanda: true, msg: 'doppio punto interrogativo' },
  // Dal lotto 5: pronome maschile con un soggetto femminile. La regola nomina i
  // nomi propri usati nel corpus, perche' in italiano il genere del pronome
  // dipende dal referente e nessuna regex lo deduce dal testo.
  { pattern: new RegExp(`\\b(?:${NOMI_PERSONA_F})\\b(?:(?!\\b(?:${NOMI_PERSONA_M})\\b)[\\s\\S])*\\bgli\\s+(?:${VERBI_DATIVO})\\b`),
    msg: 'pronome maschile "gli" con un soggetto femminile (es. "Sara ... gli rimane")' },
  { pattern: /\b(?:una famiglia|una bambina|una signora|una maestra|una nonna|una mamma|una ragazza|una turista)\b(?:(?!\b(?:un|il|lo)\s)[\s\S])*\bgli\s+(?:rimane|resta|restano|rimangono|serve|servono)\b/i,
    msg: 'pronome maschile "gli" con un soggetto femminile comune (es. "Una famiglia ... gli rimane")' },
  { pattern: new RegExp(`\\b\\d+\\s+(?:${NOMI_FEMMINILI_PREZZO})\\s+a\\s+[\\d,]+\\s+euro\\s+l'uno\\b`, 'i'),
    msg: `accordo: "l'uno" con un nome femminile (serve "l'una", es. "4 magliette a 18 euro l'una")` },
  { pattern: /\bperch[ée]\?\s*$/, soloDomanda: true,
    msg: 'domanda che termina con "perché?": se sono le opzioni a completarla, usare i puntini' },
  // Dal lotto 8: il template lasciava l'alternativa di genere da risolvere e
  // nessuno la risolveva ("al senso del/della udito"). Vale solo sulla domanda:
  // in inglese le spiegazioni usano "il/la suo/sua" per spiegare che 'his' e
  // 'her' non distinguono la cosa posseduta, e li' la doppia forma e' voluta.
  { pattern: /\b(?:il|lo|la|i|gli|le|un|uno|una|del|dello|della|dei|degli|delle|nel|nello|nella|nei|negli|nelle|al|allo|alla|ai|agli|alle)\/(?:il|lo|la|i|gli|le|un|uno|una|del|dello|della|dei|degli|delle|nel|nello|nella|nei|negli|nelle|al|allo|alla|ai|agli|alle)\b/,
    soloDomanda: true,
    msg: 'alternativa di genere non risolta dal template (es. "al senso del/della udito")' },
  // Dal lotto 9: nell'aritmetica il segno di uguale era attaccato al punto
  // interrogativo in 340 domande ("27 + 10 =?").
  { pattern: /=\s*\?/, soloDomanda: true,
    msg: 'operazione chiusa con "=?": formulare la domanda per esteso ("Quanto fa 27 + 10?")' },
  // Dal lotto 9: la spiegazione cita la risposta fra apici singoli, ma il valore
  // contiene a sua volta un apostrofo e gli apici si chiudono nel punto
  // sbagliato ("La risposta corretta è 'l'euro'."). In quel caso servono le
  // virgolette doppie, che il corpus usa gia' in civica.
  { pattern: /è '[^']*'[^']*'\./,
    msg: "apici singoli chiusi male attorno a un valore che contiene un apostrofo (usare le virgolette doppie)" },
  // Dal lotto 9: i tre stem alternativi di civica erano stati incollati anche
  // sopra domande di definizione, dove non hanno senso ("Che cosa mostra più
  // rispetto quando vuoi ricordare su quale valore si fonda la Repubblica?").
  { pattern: /^(?:Quale scelta è più responsabile|Che cosa mostra più rispetto|Quale risposta aiuta di più la comunità) quando (?:vuoi|devi) (?:spiegare|ricordare|dire|indicare|descrivere|capire|collegare|riconoscere|fare un esempio)\b/,
    soloDomanda: true,
    msg: 'stem di civica incollato sopra una domanda di definizione: serve una domanda diretta' },
  // Dal lotto 11: minuscola dopo il punto. Nasce dalle riscritture della 4.12.64,
  // dove "cosa fai?" e' diventato "cosa e' meglio fare?" anche in coda a una
  // frase gia' chiusa. Le abbreviazioni di datazione ("2000 a.C. e' piu'
  // antica"), i puntini e le citazioni di punteggiatura restano fuori.
  { pattern: /(?<!\b[ad])(?<!\b[ad]\.[CcEe])(?<!\.\.)\.\s+[a-zà-ù]/,
    soloDomanda: true,
    msg: 'minuscola dopo il punto' },
  // Dal lotto 12: davanti a s+consonante, z, gn, ps si usano lo/uno/nello/dello,
  // non il/un/nel/del ("Rana vive nel stagno", "il stazione"). L'elenco delle
  // parole e' quello che compare davvero nel corpus: "sole", "sale", "sasso" e
  // gli altri nomi con s+vocale prendono "il" e non c'entrano con la regola.
  { pattern: /(?<!['’])\b(?:il|un|nel|del|al|dal|sul|col)\s+(?:s[bcdfglmnpqrtvz]|z|gn|ps|pn)[a-zà-ù]+/i,
    msg: 'serve lo/uno/nello/dello davanti a s+consonante, z, gn o ps (es. "nello stagno", non "nel stagno")' },
  // Dal lotto 13: la spiegazione mette la risposta prima della copula
  // ("Nell'acqua è la risposta corretta.", "Sia vegetali sia animali è la
  // risposta corretta."). La 4.12.64 aveva invertito solo i casi in cui la
  // risposta era una parola sola, perche' li' il problema era l'articolo
  // mancante; ne restavano 92 in cui la risposta e' un'intera espressione, e
  // l'inversione risolve anche l'accordo ("animali è").
  { pattern: /^(?!La risposta corretta)[^.!?]+\s+è la risposta corretta\./,
    soloSpiegazione: true,
    msg: 'spiegazione con la risposta prima della copula: scrivere "La risposta corretta è \'x\'."' },
  // Dal lotto 13: clitico maschile con un oggetto femminile plurale, altro
  // effetto del template scritto per "biscotti" e riusato con "ciliegine"
  // ("Quante ciliegine riceve ogni bambino se li divide in parti uguali?").
  { pattern: new RegExp(`\\b(?:${NOMI_FEMMINILI_PREZZO}|ciliegine|mele|pere|banane|carote|monete|conchiglie|palline|uova|fragole)\\b[^.?!]{0,140}\\bli\\s+(?:divide|dividono|distribuisce|conta|mette)\\b`, 'i'),
    msg: 'clitico maschile "li" con un oggetto femminile plurale (es. "ciliegine ... se li divide")' },
  { pattern: /…/, msg: 'puntini di sospensione in carattere unicode: usare tre punti separati' },
  { pattern: /[a-zàèéìòù]$/, soloDomanda: true,
    msg: 'domanda senza punteggiatura finale: serve "?" oppure i puntini di sospensione' },
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
  // Dal lotto 8: 151 domande di civica chiedevano "cosa fai?" e offrivano
  // risposte all'infinito ("alzare la mano"). In italiano quella domanda vuole
  // un verbo di seconda persona; con l'infinito la consegna giusta e' "cosa e'
  // meglio fare?". Serve confrontare domanda e opzioni, quindi non e' una regex
  // di GRAMMATICA. Le domande con opzioni gia' alla seconda persona ("Lo chiudi
  // bene") restano valide e non scattano.
  if (subject !== 'inglese' && /cosa fai\?\s*$/i.test(question || '')) {
    const opts = (options || []).filter((o) => typeof o === 'string' && o.trim());
    const infinito = (o) => /^(?:non\s+|mai\s+)?[a-zà-ù']+(?:are|ere|ire|urre|orre)(?:l[oaie]|gli|gliel[oaie]|ne|si|ti|mi|ci|vi|tene|sene)?\b/i.test(o.trim());
    if (opts.length && opts.every(infinito)) {
      errors.push({ level: 'error', field: 'question', msg: 'grammatica — "cosa fai?" con opzioni all\'infinito: la consegna giusta e\' "cosa e\' meglio fare?"' });
    }
  }

  // Dal lotto 11: un solo distrattore all'indicativo dentro un elenco di
  // infiniti ("cercare dialogo | umiliare l'altro | vince il piu' forte").
  // Serve confrontare le opzioni fra loro, quindi non e' una regex di GRAMMATICA.
  if (subject !== 'inglese') {
    const opts = (options || []).filter((o) => typeof o === 'string' && o.trim());
    const inf = (o) => /^(?:non\s+|mai\s+)?[a-zà-ù']+(?:are|ere|ire|urre|orre)(?:l[oaie]|gli|ne|si|ti|mi|ci|vi|tene|sene)?\b/i.test(o.trim());
    if (opts.length >= 3 && opts.filter(inf).length === opts.length - 1) {
      const fuori = opts.find((o) => !inf(o));
      if (/^(?:vince|serve|vale|conta|riguarda|interessa|segnala|indica|protegge|approva|gestisce|dirige|sceglie|aiuta|decide|contiene|spiega|perde|resta)\b/i.test(fuori.trim())) {
        errors.push({ level: 'error', field: 'options', msg: `grammatica — un distrattore all'indicativo ("${fuori}") in un elenco di infiniti` });
      }
    }
  }

  // Dal lotto 10: la frase sospesa dei lotti 2-6, ma chiusa da un verbo o da un
  // nome invece che da una preposizione ("Gli animali onnivori mangiano?", "La
  // rotazione della Terra causa?"). Il segnale e' che nella domanda non compare
  // nessuna parola interrogativa, quindi quel "?" non chiude niente. Serve pero'
  // guardare anche le opzioni: con risposte si'/no o vero/falso la domanda e'
  // legittima ("Le polis greche erano unite in un unico Stato? — no, erano
  // citta'-stato autonome"), e una regex sul solo testo non puo' saperlo.
  // Nota: niente \b dopo "perche'" e "cos'", perche' in JavaScript una lettera
  // accentata non e' un carattere di parola e quel confine non fa mai match.
  if (subject !== 'inglese' && /[a-zà-ù]\?\s*$/i.test(question || '')) {
    const interrogativa = /\b(?:chi|cosa|quale|quali|qual|quanto|quanta|quanti|quante|come|dove|quando)\b|perch[ée]|cos['’]|com['’]|qual['’]|\bqual\s+è|\bche\s+[a-zà-ù]+|\b(?:in|di|a|con|per|da|su)\s+(?:che|quale|quali)\b/i.test(question);
    const alternativa = /\s+o\s+[^?]{0,40}\?\s*$/i.test(question);
    const siNo = (options || []).some((o) => typeof o === 'string' && /^\s*(sì|no|vero|falso)\b/i.test(o));
    if (!interrogativa && !alternativa && !siNo) {
      errors.push({ level: 'error', field: 'question', msg: 'grammatica — frase sospesa chiusa con "?" senza nessuna parola interrogativa: usare i puntini (es. "Gli animali onnivori mangiano...")' });
    }
  }

  const isItalianText = subject !== 'inglese';
  if (isItalianText) {
    const testoIt = `${question || ''} ${explanation || ''}`;
    for (const regola of GRAMMATICA) {
      // Le regole sulla frase sospesa valgono solo sul testo della domanda: in
      // una spiegazione "molti dei", "contiene GLI" o "tre A." sono corretti.
      // soloDomanda / soloSpiegazione: alcune regole valgono su un campo solo.
      // Sul testo concatenato la punteggiatura dell'altro campo interferisce —
      // i puntini di una domanda sospesa spezzano un pattern ancorato a inizio
      // frase — e certe forme sono corrette in un campo e sbagliate nell'altro.
      const bersaglio = regola.soloDomanda ? (question || '')
        : regola.soloSpiegazione ? (explanation || '')
        : testoIt;
      if (regola.pattern.test(bersaglio)) {
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
