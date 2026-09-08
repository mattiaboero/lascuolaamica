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
// I nomi aggiunti dal lotto 58 (ghiaccio, sole, cielo...) vengono da un
// difetto vero: "tra la neve e la ghiaccio". Dedurre il genere da una regex
// non si puo': "moto", "foto", "radio", "mano" sono femminili nonostante la
// finale, quindi l'elenco resta esplicito.
const NOMI_MASCHILI = 'biscotti|cioccolatini|panini|euro|libri|quaderni|grammi|millilitri|litri|alunni|bambini|laboratorio|parco|negozio|cortile|magazzino|giardino|astuccio|frutteto|campo|ghiaccio|sole|vento|fiume|lago|monte|bosco|cielo|suolo|terreno|calore|corpo|sangue|cuore|cervello|denaro|lavoro|giorno|mese|numero|gruppo|regno|paese|popolo|pianeta|colore|peso|volume|suono|rumore|movimento|piede|braccio|naso|occhio|orecchio|lamponi|mirtilli|acini|evidenziatori|pennarelli|pastelli|adesivi|palloncini|uccellini|cioccolatini|bonbon';
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
  { pattern: new RegExp(`(?<![a-zà-ùA-ZÀ-Ù])(?:la|una|della|nella|alla|dalla|sulla)\\s+(?:${NOMI_MASCHILI})(?![a-zà-ùA-ZÀ-Ù])`, 'i'),
    msg: 'accordo: articolo o preposizione femminile davanti a un nome maschile (es. "la ghiaccio")' },
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
  { pattern: /\b\d+\s+[a-zà-ù]{4,}e\s+(?:rimast|finit|vendut|mangiat|comprat|raccolt|usat|pres|pers|contat|distribuit|arrivat|cadut|nat|cresciut|colorat|piantat|sistemat|regalat|trovat)i\b/i,
    msg: 'accordo: participio maschile dopo un nome femminile plurale (es. "10 lumache rimasti")' },
  { pattern: /\b(?:gomme|figurine|matite|caramelle|mele|pere|banane|carote|ciliegine|fragole|farfalle|capre|penne|scatole|monete|conchiglie|palline|pagine|magliette|sciarpe)\b[^.?!]*[.?!][^.?!]*\bQuanti\s+ne\b/,
    soloDomanda: true,
    msg: 'accordo: "Quanti ne" riferito a un nome femminile (serve "Quante ne")' },
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
  // Dal lotto 37: il \b iniziale faceva scattare la regola su "agli dèi?",
  // perche' in JavaScript una lettera accentata non e' un carattere di parola
  // e fra "è" e "i" c'e' un confine: l'alternativa "i" trovava l'ultima
  // lettera di "dèi". E' la quinta volta in questa campagna che \b apre un
  // confine dentro una parola accentata. Serve il lookbehind esplicito.
  { pattern: /(?<![a-zà-ùA-ZÀ-Ù])(?:il|lo|la|i|gli|le|un|uno|una|nel|nello|nella|nei|negli|nelle|del|dello|della|dei|degli|delle|al|allo|alla|ai|agli|alle|sul|sulla|sui|sulle|col|coi)\?\s*$/,
    soloDomanda: true,
    msg: 'domanda che termina con un articolo o una preposizione articolata: usare i puntini di sospensione' },
  // Dal lotto 53: la stessa cosa con l'articolo eliso ("si forma un'?",
  // "avviene l'?"). La regola sopra elenca le forme intere e non vedeva
  // queste quattro. L'articolo deve essere preceduto da uno spazio: in
  // "la doppia 'l'?" e "il verbo 'run'?" l'apostrofo chiude una citazione.
  { pattern: /(?<=\s)(?:un|l|dell|nell|all|sull|dall|quest)['’]\s*\?\s*$/,
    soloDomanda: true,
    msg: "domanda che termina con un articolo eliso: usare i puntini di sospensione" },
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
  // Dal lotto 93: participio maschile con un nome femminile contato ("6 api
  // rimasti").
  { pattern: /(?<![a-zà-ùA-ZÀ-Ù])(?:api|mele|pere|caramelle|figurine|palline|matite|penne|galline|arance|banane|fragole|pesche|uova|monete|foglie|scatole|torte)\s+(?:rimasti|restati|contati|venduti|mangiati|usati|distribuiti)(?![a-zà-ùA-ZÀ-Ù])/i,
    msg: 'accordo: participio maschile con un nome femminile (es. "6 api rimasti")' },
  // Dal lotto 92: domanda chiusa da un avverbio sospeso ("a risentirne sono
  // anche?", "quando l'acqua bolle diventa anche?"): manca la parola che
  // regge la risposta. "non cresce da solo?" resta fuori, perche' li' il
  // "solo" e' un aggettivo del soggetto.
  { pattern: /(?<![a-zà-ùA-ZÀ-Ù])(?:sono|diventa|resta|rimane|serve)\s+anche\s*\?\s*$/i,
    soloDomanda: true,
    msg: 'domanda chiusa da un avverbio sospeso ("...sono anche?")' },
  // Dal lotto 92: riferimento alla classe scolastica dentro la domanda
  // ("Studiare gli Ebrei in quarta serve a..."): la domanda parla al
  // programma, non all'alunno.
  { pattern: /(?<![a-zà-ùA-ZÀ-Ù])in (?:seconda|terza|quarta|quinta)(?![a-zà-ùA-ZÀ-Ù])/i,
    soloDomanda: true,
    msg: 'riferimento alla classe scolastica dentro la domanda' },
  // Dal lotto 89: complemento di tempo senza preposizione all'inizio della
  // frase ("La notte nel cielo si vedono le stelle" invece di "Di notte").
  { pattern: /^(?:La notte|Il giorno|La mattina|La sera|Il pomeriggio)\s+(?:in|nel|nella|sul|sulla|al|alla)(?![a-zà-ùA-ZÀ-Ù])/,
    soloDomanda: true,
    msg: 'complemento di tempo senza preposizione (es. "La notte nel cielo": serve "Di notte")' },
  // Dal lotto 86: participio passato al posto del verbo coniugato ("le strade
  // collegate tutto l'impero" invece di "collegavano"): il participio non
  // regge l'oggetto che segue.
  { pattern: /(?<![a-zà-ùA-ZÀ-Ù])(?:collegate|attraversate|governate|coperte|circondate|toccate)\s+(?:tutto|tutta|tutti|tutte|il|la|lo|i|gli|le)\s+[a-zà-ù]/,
    soloSpiegazione: true,
    msg: 'participio passato al posto del verbo coniugato (es. "le strade collegate tutto l\'impero")' },
  // Dal lotto 85: verbo pronominale privato del "si" e coordinato con un
  // intransitivo ("il muscolo abbassa e sale"): il primo verbo cosi' regge un
  // oggetto che non c'e'.
  { pattern: /(?<![a-zà-ùA-ZÀ-Ù])(?<!si )(?:abbassa|alza|solleva|muove|sposta|piega|gira|riempie|svuota)\s+e\s+(?:sale|scende|torna|risale|cade|resta)(?![a-zà-ùA-ZÀ-Ù])/i,
    msg: 'verbo pronominale senza "si" ("abbassa e sale": serve "si abbassa e si alza")' },
  // Dal lotto 79: "avere bisogno" regge "di", che nell'interrogativa sparisce
  // ("Quante ore di sonno ha bisogno un bambino?").
  { pattern: /(?<![Dd]i\s)(?<![a-zà-ùA-ZÀ-Ù])[Qq]uant[ie]\s+[a-zà-ù]+(?:\s+[a-zà-ù]+){0,3}\s+ha(?:nno)?\s+bisogno(?![a-zà-ùA-ZÀ-Ù])/,
    soloDomanda: true,
    msg: '"avere bisogno" regge "di": serve "Di quante ore ha bisogno...?"' },
  // Dal lotto 75: "Come sono i colori...?" dove la domanda chiede quali sono,
  // non come sono fatti.
  { pattern: /^Come (?:sono|è)\s+(?:i|le|gli|il|la|lo)\s+[a-zà-ù]+\s+(?:della|del|dei|delle|di)\b/,
    soloDomanda: true,
    msg: '"Come sono/è" dove la domanda chiede quali sono: usare "Quali/Quale"' },
  // Dal lotto 74: frase sospesa chiusa dal punto interrogativo invece che dai
  // puntini ("...avviene una trasformazione?" con opzioni 'fisica',
  // 'chimica'): le opzioni completano la frase, non rispondono a una
  // domanda. Il pattern nomina i verbi che introducono il nome da
  // qualificare, cosi' le centocinquanta domande vere della forma "Quale
  // parola e' un nome?" restano fuori.
  { pattern: /(?<![a-zà-ùA-ZÀ-Ù])(?:avviene|si ha|si verifica|si tratta di)\s+(?:una|un|uno)\s+[a-zà-ù]+\?\s*$/,
    soloDomanda: true,
    msg: 'frase sospesa chiusa con il punto interrogativo: usare i puntini di sospensione' },
  // Dal lotto 73: passo moltiplicativo inutile nel calcolo di una frazione
  // unitaria ("1/2 di 28: 28 / 2 = 14; poi 14 x 1 = 14"). Quaranta
  // spiegazioni. Le tabelline dell'uno e le scomposizioni tipo 19 = 20 - 1
  // restano fuori: il "x 1" li' e' il punto dell'esercizio, e infatti non
  // nominano nessuna frazione.
  { pattern: /1\/\d[\s\S]{0,120}?×\s*1\s*=/,
    soloSpiegazione: true,
    msg: 'passo "× 1" inutile nel calcolo di una frazione unitaria' },
  // Dal lotto 72: "quale e'" al posto di "qual e'". Il troncamento davanti al
  // verbo essere e' obbligatorio e non vuole apostrofo. Cinque domande.
  // L'opzione "quale e'?" di ita-4-ortografia-003 e' un distrattore voluto e
  // resta fuori: le regex di GRAMMATICA le opzioni non le vedono.
  { pattern: /(?<![a-zà-ùA-ZÀ-Ù])[Qq]uale\s+è(?![a-zà-ùA-ZÀ-Ù])/,
    msg: 'accordo: "quale è" al posto di "qual è"' },
  // Dal lotto 72: verbo al singolare con una quantita' plurale ("mi avanza 15
  // euro").
  { pattern: /(?<![a-zà-ùA-ZÀ-Ù])(?:avanza|rimane|resta|manca)\s+(?:[2-9]|\d{2,})\s+(?:euro|metri|litri|chili|grammi|centesimi|punti|pagine|giorni|ore)(?![a-zà-ùA-ZÀ-Ù])/i,
    msg: 'accordo: verbo singolare con una quantita\' plurale (es. "mi avanza 15 euro")' },
  // Dal lotto 71: risultato di un conto seguito da un nome di massa al posto
  // dell'unita' contata ("11 + 14 = 25 uva", invece di "25 acini d'uva").
  { pattern: /=\s*\d+\s+(?:uva|acqua|latte|sabbia|farina|riso|zucchero|pane)(?![a-zà-ùA-ZÀ-Ù])/i,
    soloSpiegazione: true,
    msg: 'risultato seguito da un nome di massa: manca l\'unita\' contata (es. "25 acini d\'uva")' },
  // Dal lotto 67: pronome non eliso davanti a "ho" ("Lo ho preso ieri"),
  // per giunta in una domanda che insegna i pronomi.
  { pattern: /(?<![a-zà-ùA-ZÀ-Ù])(?:lo|la)\s+ho(?![a-zà-ùA-ZÀ-Ù])/i,
    msg: 'pronome non eliso davanti a "ho": si scrive "l\'ho", non "lo ho"' },
  // Dal lotto 64: nome contenitore senza articolo dopo la preposizione
  // semplice ("estrarre un asso da mazzo di 40 carte").
  { pattern: /(?<![a-zà-ùA-ZÀ-Ù])(?:da|in|con|su)\s+(?:mazzo|sacchetto|cesto|scatola|urna|cestino|barattolo)(?![a-zà-ùA-ZÀ-Ù])/i,
    msg: 'nome contenitore senza articolo dopo la preposizione (es. "da mazzo di 40 carte")' },
  // Dal lotto 62: domanda che ne incapsula un'altra ("Alla domanda 'Dove
  // sfocia un fiume?' la risposta piu' corretta e'..."), quando basta fare la
  // domanda interna.
  { pattern: /Alla domanda\s*['‘“"]/, soloDomanda: true,
    msg: 'domanda che ne incapsula un\'altra: fare direttamente la domanda interna' },
  // Dal lotto 62: notazione oraria compatta in una spiegazione ("5h30"),
  // mentre domande e opzioni scrivono sempre "5 ore e 30 minuti".
  { pattern: /(?<![a-zà-ùA-ZÀ-Ù0-9])\d{1,2}\s*h\s*\d{2}(?:min)?(?![0-9])/,
    msg: 'notazione oraria compatta ("5h30", "2h 25min"): usare "5 ore e 30 minuti"' },
  // Dal lotto 59: "in uguale misura" vale "nella stessa proporzione", non "in
  // parti uguali". Lo usavano 35 problemi di divisione, mentre le loro stesse
  // spiegazioni dicevano gia' "in parti uguali".
  { pattern: /(?<![a-zà-ùA-ZÀ-Ù])in ugual[e]?\s+misura(?![a-zà-ùA-ZÀ-Ù])/i,
    soloDomanda: true,
    msg: `"in uguale misura" indica una proporzione: per una divisione serve "in parti uguali"` },
  // Dal lotto 59: domanda che finisce con un verbo servile e il punto
  // interrogativo ("...per non spargere i germi dovremmo?"): manca la cosa da
  // fare. E' la variante con il verbo della regola del lotto 53.
  { pattern: /(?<![a-zà-ùA-ZÀ-Ù])(?:dovremmo|dovremo|dobbiamo|possiamo|potremmo|bisogna|conviene|serve)\s*\?\s*$/i,
    soloDomanda: true,
    msg: 'domanda che finisce con un verbo servile: manca quello che si deve fare' },
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
  // Dal lotto 26: la regola vedeva tre dei cinque stem della famiglia. Gli
  // altri due ("Se vuoi spiegare il volontariato, qual e' il comportamento
  // corretto?", "In una situazione in cui vuoi spiegare la prudenza, cosa e'
  // meglio fare?") avevano lo stesso difetto e nessuno li guardava: 17
  // domande in nove temi, con le varianti 3-5 gia' sistemate accanto.
  { pattern: /^(?:(?:Quale scelta è più responsabile|Che cosa mostra più rispetto|Quale risposta aiuta di più la comunità|In una situazione in cui) (?:quando )?|Se )(?:vuoi|devi) (?:spiegare|ricordare|dire|indicare|descrivere|capire|collegare|riconoscere|fare un esempio)\b/,
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
  { pattern: /^(?!(?:La|Il|Lo|L'|Gli|Le)\s*[a-zà-ù ]*?corrett[ao][a-zà-ù ]*\s+è\b)[^.!?]+\s+è\s+(?:il|lo|la|l'|un|uno|una)?\s*(?:[a-zà-ù]+\s+){0,2}corrett[ao]\./,
    soloSpiegazione: true,
    msg: 'spiegazione con la risposta prima della copula: scrivere "La risposta corretta è \'x\'."' },
  // Dal lotto 13: clitico maschile con un oggetto femminile plurale, altro
  // effetto del template scritto per "biscotti" e riusato con "ciliegine"
  // ("Quante ciliegine riceve ogni bambino se li divide in parti uguali?").
  // Dal lotto 46: la regola cercava il clitico staccato ("se li divide") e non
  // vedeva quello attaccato al verbo ("32 palline e vuole distribuirli").
  { pattern: new RegExp(`\\b(?:${NOMI_FEMMINILI_PREZZO}|ciliegine|mele|pere|banane|carote|monete|conchiglie|palline|uova|fragole)\\b[^.?!]{0,140}(?:\\bli\\s+(?:divide|dividono|distribuisce|conta|mette)\\b|[a-zà-ù]{3,}(?:r|nd)li\\b)`, 'i'),
    msg: 'clitico maschile "li" con un oggetto femminile plurale (es. "palline ... distribuirli")' },
  // Dal lotto 14: citazione aperta con la virgoletta doppia e chiusa con
  // l'apice singolo ("Il soggetto è \"Fatima' e il predicato è 'ha comprato\".").
  // L'apostrofo vero sta fra due lettere (dell'acqua, l'ombra): qui invece
  // l'apice e' seguito da spazio o punteggiatura, quindi e' una chiusura.
  { pattern: /"[^"\n]{1,60}?[a-zà-ùA-Z?]'(?=[\s.,;:)])/,
    msg: 'citazione aperta con le virgolette doppie e chiusa con l\'apice singolo' },
  // Dal lotto 14: nome di popolo in minuscolo quando fa da sostantivo ("dei
  // greci", "gli egizi"). Come aggettivo la minuscola e' corretta ("i vasi
  // greci"), quindi la regola chiede l'articolo o la preposizione articolata
  // subito prima, che e' il segnale del sostantivo.
  // Dal lotto 29: fra l'articolo e il nome di popolo puo' esserci un aggettivo
  // ("Gli antichi egizi"), e li' la regola del lotto 14 non arrivava. La lista
  // degli aggettivi e' chiusa e contiene solo quelli che in italiano stanno
  // prima del nome: se in mezzo c'e' un sostantivo ("i mercanti fenici", "i
  // palazzi cretesi") allora e' il popolo a fare da aggettivo, e la minuscola
  // e' corretta.
  { pattern: /(?<![a-zà-ùA-ZÀ-Ù])(?:[Ii]|[Gg]li|[Dd]ei|[Dd]egli|[Aa]i|[Aa]gli|[Dd]ai|[Dd]agli|[Nn]ei|[Nn]egli|[Cc]oi)\s+(?:(?:antichi|primi|ultimi|grandi|altri|stessi|veri|nuovi|vecchi|molti|tanti|pochi|numerosi|vari|diversi|potenti|famosi|ricchi)\s+)?(?:fenici|etruschi|sumeri|egizi|greci|romani|babilonesi|assiri|micenei|cretesi|persiani|ateniesi|spartani|ebrei|mesopotamici|minoici|cartaginesi|celti|longobardi|franchi|unni)\b/,
    msg: 'nome di popolo in minuscolo usato come sostantivo (es. "gli egizi" invece di "gli Egizi")' },
  // Dal lotto 15: frase sospesa in cui "quando" o "come" sono congiunzioni, non
  // interrogativi ("L'ombra si forma quando un corpo?", "Un materiale
  // trasparente come il vetro?"). Il controllo del lotto 10 le lasciava passare
  // perche' cerca una parola interrogativa e quelle due lo sono solo a volte.
  // Il segnale che le distingue e' che dopo la congiunzione non c'e' nessun
  // verbo: "dove arriva la liberta'?" e "come si sentiva il mercante?" hanno un
  // verbo e restano fuori, "quando l'acqua?" no.
  { pattern: /\bquando\s+(?:il|lo|la|i|gli|le|un|uno|una|l'|un')\s*[a-zà-ù]+(?:\s+(?:in|di|a|da|su)\s+[a-zà-ù]+)?\s*\?\s*$|\b(?:quando|come|si)\s*\?\s*$/,
    soloDomanda: true,
    msg: 'frase sospesa con "quando" o "come" usati da congiunzione: usare i puntini' },
  // Dal lotto 16: spiegazione che finisce senza punteggiatura ("'ca-sa' è
  // divisa bene"). Le domande possono chiudersi con i puntini o col punto
  // interrogativo, ma una spiegazione e' sempre un'affermazione compiuta.
  { pattern: /[a-zà-ù0-9]$/,
    soloSpiegazione: true,
    msg: 'spiegazione senza punteggiatura finale' },
  // Dal lotto 20: "dei" come plurale di "dio" va accentato, per distinguerlo
  // dalla preposizione articolata. Il corpus usava gia' "dèi" sette volte e
  // "dei" otto. La regola chiede un quantificatore o un articolo davanti, che
  // e' il segnale del sostantivo: "dei greci" da solo resta ambiguo e fuori.
  // Dal lotto 42: la regola chiedeva un quantificatore o un articolo davanti,
  // e non vedeva l'elenco dei plurali irregolari di ita-3-morfologia-9207
  // ("uomo/uomini, dio/dei, bue/buoi"), dove la coppia con la barra e' il
  // contesto che rende "dei" un sostantivo. Resta fuori l'articolo partitivo,
  // che in ita-3-lingua-9188 e' citato correttamente senza accento.
  { pattern: /\b(?:gli|molti|tanti|questi|quegli|altri|numerosi|vari|degli|agli|dagli|sugli|negli|cogli)\s+dei\b|\bdio\s*\/\s*dei\b/i,
    msg: 'plurale di "dio" senza accento: serve "dèi" (es. "gli dèi", "dio/dèi")' },
  // Dal lotto 20: unita di superficie e volume scritte senza esponente. Il
  // corpus usa cm² 118 volte e cm2 16, m² 56 e mq 12: uniformate all'esponente.
  { pattern: /\b(?:cm2|m2|mq|cmq|kmq|cm3|dm3|mc)\b/,
    msg: 'unita di misura senza esponente (usare cm², m², cm³)' },
  // Dal lotto 27: spiegazione a due passi in cui il primo passo ripete
  // l'operazione del secondo senza aggiungere niente ("Prima: 1872 / 8. Poi:
  // 1872 / 8 = 234 km per viaggio."). Il template a due passi ha senso quando
  // il primo passo dice qualcosa in piu' — la formula, l'unita', il dato da
  // isolare ("Prima: 252 mele / 9 scatole.", "Prima: velocita' x tempo.") —
  // e quei casi restano fuori perche' il testo dei due passi non coincide.
  { pattern: /^Prima:\s*([^.=]+?)\.\s*Poi:\s*\1\s*=/,
    soloSpiegazione: true,
    msg: 'spiegazione a due passi in cui il primo ripete il calcolo del secondo senza aggiungere niente' },
  // Dal lotto 32: la faccia opposta dello stesso difetto. Qui e' il secondo
  // passo a non fare niente: "Prima: 4 x 3 = 12 biscotti. Poi: i biscotti
  // totali sono 12." Il "Poi" non contiene nessun calcolo e ripete il numero
  // gia' trovato, quindi il problema aveva un passo solo mentre l'area dice
  // due operazioni.
  { pattern: /^Prima:[^.]*\.\s*Poi:\s*[^.=]*\.?\s*$/,
    soloSpiegazione: true,
    msg: 'spiegazione a due passi in cui il secondo non contiene nessun calcolo' },
  // Dal lotto 32: frammenti di ragionamento rimasti dentro la spiegazione
  // ("Ma aspetta: sol- vs ste-", "Rivediamo: 132 - 48 = 84", "Attenzione:
  // 'mamma' e' una parola trisillaba? No, ha due sillabe"). Sono passaggi di
  // chi scriveva che correggeva se stesso: il bambino legge un ripensamento
  // invece di una spiegazione.
  { pattern: /\bMa aspetta\b|\bRivediamo\b|\bRicontrolliamo\b|\bCorreggo\b|\bAnzi,|\?\s*No,\s/,
    soloSpiegazione: true,
    msg: 'frammento di ragionamento rimasto nella spiegazione (ripensamento o autocorrezione)' },
  // Dal lotto 39: nelle sequenze la spiegazione citava il valore senza
  // virgolette ("il primo elemento è mi sveglio", "l'ultimo elemento è
  // primo giorno di scuola"). Senza gli apici la frase si legge come se il
  // valore fosse parte del discorso, e con le risposte che sono verbi non
  // sta in piedi. Il corpus cita fra apici singoli ovunque.
  { pattern: /successione corretta,\s+(?!['"])/,
    soloSpiegazione: true,
    msg: 'valore citato senza apici nella spiegazione di una sequenza' },
  // Dal lotto 39: segno di moltiplicazione scritto con la lettera x. Il
  // corpus usa il simbolo × 2.413 volte.
  { pattern: /\d\s*[xX]\s*\d/,
    msg: 'moltiplicazione scritta con la lettera x invece del simbolo ×' },
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
  // Dal lotto 21: apostrofi e virgolette tipografiche. Il corpus usa le forme
  // dritte (16.986 apostrofi e 2.342 virgolette) e ne aveva 102 curve, entrate
  // da copia-incolla. I caporali «» restano ammessi: sono l'oggetto degli
  // esercizi sul discorso diretto.
  {
    const campi = [question, explanation, answer].concat(options || []).filter((v) => typeof v === 'string');
    const trovato = campi.join(' ').match(/[’‘“”…−–]/);
    if (trovato) {
      errors.push({ level: 'error', field: 'text', msg: `carattere tipografico da normalizzare: "${trovato[0]}" (usare ' " - e i tre punti separati)` });
    }
    // Dal lotto 28: lettere di altri alfabeti finite dentro parole italiane.
    // "cilieги" aveva due caratteri cirillici al posto di "gi" e "iniziň" una
    // enne con caron al posto della o accentata: a schermo si leggono quasi
    // come le lettere giuste, quindi nessuno se ne accorgeva. Il greco e i
    // simboli fonetici del corpus (etimologie, /dʒ/) restano fuori dal set.
    const estranea = campi.join(' ').match(/[\u0400-\u04FF]|[čćďěľĺňřšťůžČĆĎĚĽĹŇŘŠŤŮŽ]/);
    if (estranea) {
      errors.push({ level: 'error', field: 'text', msg: `lettera estranea all'alfabeto italiano: "${estranea[0]}" (probabile carattere sostituito per errore)` });
    }
  }

  // Dal lotto 21: punto dentro la citazione e un altro subito fuori ("La
  // risposta corretta è \"Disegno la mia aula vista dall'alto.\"."). Basta
  // quello interno. Il caso con "?" o "!" dentro le virgolette e' invece
  // corretto e resta fuori: li' il punto esterno chiude la frase che contiene
  // la citazione ("Risponde alla domanda 'che cosa?'.").
  if (/\.["'»]\s*\./.test(`${question || ''} ${explanation || ''}`)) {
    errors.push({ level: 'error', field: 'text', msg: 'punteggiatura doppia: il punto e\' ripetuto dentro e fuori la citazione' });
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
    const interrogativa = /\b(?:chi|cosa|quale|quali|qual|quanto|quanta|quanti|quante|come|dove|quando)\b|perch[ée]|cos['’]|com['’]|qual['’]|\bqual\s+è|(?:^|[.!?,]\s*|['"»]\s+)che\s+[a-zà-ù]+|\b(?:in|di|a|con|per|da|su)\s+(?:che|quale|quali)\b/i.test(question);
    const alternativa = /\s+o\s+[^?]{0,40}\?\s*$/i.test(question);
    const siNo = (options || []).some((o) => typeof o === 'string' && /^\s*(sì|no|vero|falso)\b/i.test(o));
    if (!interrogativa && !alternativa && !siNo) {
      errors.push({ level: 'error', field: 'question', msg: 'grammatica — frase sospesa chiusa con "?" senza nessuna parola interrogativa: usare i puntini (es. "Gli animali onnivori mangiano...")' });
    }
  }

  // Dal lotto 26: lo stem finisce con un articolo elidibile ("Il suono si
  // propaga meglio nell'...", "La latitudine misura la distanza dall'...") e
  // una sola opzione comincia per vocale. L'apostrofo esclude le altre tre,
  // quindi la domanda si indovina senza saperne niente. In sci-5-fisica-008
  // nascondeva anche un errore di fisica: la risposta suggerita era "aria",
  // ma il suono viaggia piu' veloce nei solidi.
  if (subject !== 'inglese' && Array.isArray(options)
      && /\b(?:nell|dell|all|sull|dall|coll|l|un|quest|bell|grand)'\s*\.{2,}\s*$/.test(question || '')) {
    const vocaliche = options.filter((o) => typeof o === 'string' && /^\s*[haeiouàèéìòù]/i.test(o));
    if (vocaliche.length === 1) {
      errors.push({ level: 'error', field: 'question', msg: `stem con l'articolo elidibile e una sola opzione che inizia per vocale ("${vocaliche[0]}"): la risposta si indovina dall'apostrofo` });
    }
  }

  // Dal lotto 25: manca la d eufonica davanti a una parola che inizia per e
  // ("Sardegna e Elba", "indici e elenchi", "15 biscotti e Elena"). Il corpus
  // usava gia' "ed" 82 volte contro 13: qui era rimasta indietro la minoranza.
  // Servono almeno due lettere dopo la e, perche' "davanti a I e E" elenca due
  // lettere dell'alfabeto, non due parole, e li' la d non va. Il controllo
  // guarda anche le opzioni: meta' dei casi stava li' ("Sardegna e Elba"), e
  // le regex di GRAMMATICA vedono solo domanda e spiegazione.
  if (subject !== 'inglese') {
    const tutti = [question, explanation, answer].concat(options || []).filter((v) => typeof v === 'string');
    const trovato = tutti.join(' | ').match(/(?<![a-zà-ùA-ZÀ-Ù])e\s+[eE][a-zà-ùA-ZÀ-Ù]\w*/);
    if (trovato) {
      errors.push({ level: 'error', field: 'text', msg: `manca la d eufonica in "${trovato[0]}" (es. "indici ed elenchi")` });
    }
  }

  // Dal lotto 25: la spiegazione canonica esisteva in tre forme incoerenti
  // (apici singoli 854, virgolette doppie 855, risposta nuda 685). Il corpus
  // cita fra apici singoli ovunque (2749 volte contro 6), quindi la forma
  // canonica e' quella; le virgolette doppie restano solo quando la risposta
  // contiene un apostrofo e gli apici si chiuderebbero nel punto sbagliato.
  // Il confronto e' con la stringa esatta: cosi' il controllo verifica insieme
  // il formato e il fatto che la spiegazione citi davvero la risposta giusta.
  if (subject !== 'inglese' && /^\s*La risposta corretta è\s/.test(explanation || '')) {
    const valore = typeof answer === 'string' && answer.includes("'") ? `"${answer}"` : `'${answer}'`;
    // Se la risposta finisce gia' con un punto ("prima di 1000 a.C.", "Disegno
    // la mia aula vista dall'alto."), il punto esterno lo raddoppierebbe: la
    // regola del lotto 21 tiene solo quello interno.
    const atteso = `La risposta corretta è ${valore}${/\.$/.test(String(answer)) ? '' : '.'}`;
    if ((explanation || '').trim() !== atteso) {
      errors.push({ level: 'error', field: 'explanation', msg: `spiegazione canonica in forma non uniforme: scrivere ${atteso}` });
    }
  }

  // Dal lotto 55: nome di mestiere al maschile con un nome proprio femminile
  // ("Il contadino Irene ha piantato..."). Il template incollava sempre "Il
  // contadino" davanti al nome estratto, e in sei problemi su dodici quel
  // nome era femminile. Le liste dei nomi sono le stesse usate per il
  // pronome, e il meta-controllo verifica a ogni build che restino allineate
  // al corpus.
  if (subject !== 'inglese') {
    const tutti = [question, explanation].filter((v) => typeof v === 'string').join(' | ');
    const sbagliato = tutti.match(new RegExp(`\\b(?:Il|Un)\\s+[a-zà-ù]+o\\s+(?:${NOMI_PERSONA_F})\\b`))
      || tutti.match(new RegExp(`\\b(?:La|Una)\\s+[a-zà-ù]+a\\s+(?:${NOMI_PERSONA_M})\\b`));
    if (sbagliato) {
      errors.push({ level: 'error', field: 'text', msg: `nome di mestiere e nome proprio di genere diverso: "${sbagliato[0]}"` });
    }
  }

  // Dal lotto 54: frase sospesa chiusa dal punto interrogativo in cui "come" o
  // "quando" stanno dentro un inciso fra virgole ("Anche gli animali, come le
  // persone, per vivere devono?"). Li' non sono interrogativi ma congiunzioni,
  // e il controllo del lotto 10 le lascia passare proprio perche' cerca la
  // presenza di quelle parole. Servono due condizioni insieme, e per questo
  // la regola non puo' stare fra le regex di GRAMMATICA: l'inciso fra virgole,
  // e l'assenza di qualsiasi altra parola interrogativa. Senza la seconda
  // condizione scattava su tre domande vere ("Quale scelta ... come ... ?").
  if (subject !== 'inglese' && /[a-zà-ù]\?\s*$/i.test(question || '')
      && !/\b(?:chi|cosa|quale|quali|qual|quanto|quanta|quanti|quante|dove)\b|perch[ée]|cos['’]|com['’]|qual['’]/i.test(question || '')
      && /,\s*(?:come|quando)\s[^,]*,/i.test(question || '')) {
    const siNo = (options || []).some((o) => typeof o === 'string' && /^\s*(sì|no|vero|falso)\b/i.test(o));
    if (!siNo) {
      errors.push({ level: 'error', field: 'question', msg: 'frase sospesa con "come" o "quando" dentro un inciso: usare i puntini' });
    }
  }

  // Dal lotto 52: la famiglia delle spiegazioni di sequenza, chiusa per intero.
  // I lotti 39, 49 e 51 l'avevano affrontata tre volte con tre regex diverse,
  // una per ogni formulazione incontrata ("il primo elemento è", "l'elemento
  // centrale è", "nella successione corretta"), e ogni volta ne restava
  // fuori un'altra: "Il primo elemento della successione è mi vesto" erano
  // le ultime sedici. Il criterio adesso non elenca piu' le formulazioni:
  // se la spiegazione parla di un "elemento" e finisce citando esattamente
  // la risposta senza apici, il valore va fra apici. Cosi' non serve
  // aggiornare la regola quando compare una variante nuova.
  if (subject !== 'inglese' && typeof answer === 'string' && /\belemento\b/.test(explanation || '')) {
    // Niente \b davanti a "è": e' non un carattere di parola, e prima c'e' uno
    // spazio, quindi quel confine non esiste e la regola non scatterebbe mai.
    // Settima volta in questa campagna, la seconda in due lotti.
    const coda = String(explanation).trim().match(/(?:^|\s)è\s+(.+?)\.?$/);
    if (coda && coda[1].trim() === answer.trim() && !/["']/.test(coda[1])) {
      errors.push({ level: 'error', field: 'explanation', msg: `valore citato senza apici nella spiegazione di una sequenza: "${coda[1]}"` });
    }
  }

  // Dal lotto 50: spiegazione inglese con il verbo alla terza persona dopo un
  // soggetto che non la vuole ("They uses are.", "I uses am."). Il template
  // incollava il pronome davanti a "uses" senza accordarlo, e il risultato e'
  // inglese sbagliato in una domanda che insegna proprio l'accordo del verbo
  // essere. "Painting uses brushes" resta fuori: li' il soggetto e' un nome.
  if (subject === 'inglese' && /\b(?:I|You|We|They|He|She|It)\s+uses\b/.test(explanation || '')) {
    errors.push({ level: 'error', field: 'explanation', msg: 'spiegazione inglese con "uses" dopo un pronome: accordo del verbo sbagliato' });
  }

  // Dal lotto 49: opzione che porta fra parentesi la stessa parola con cui la
  // domanda definisce quello che cerca ("Quale dei seguenti pronomi è
  // relativo?" con l'opzione "che (relativo)"). La parentesi e' una glossa
  // di servizio rimasta nel testo, e indica la risposta senza che serva
  // sapere niente.
  if (subject !== 'inglese' && Array.isArray(options)) {
    const dom = String(question || '').toLowerCase();
    const spia = options.filter((o) => typeof o === 'string')
      .find((o) => (o.match(/\(([^)]{3,25})\)/g) || []).some((par) => {
        const dentro = par.slice(1, -1).toLowerCase().trim();
        return dentro.split(/\s+/).length <= 2 && dom.includes(dentro.slice(0, 6));
      }));
    if (spia) {
      errors.push({ level: 'error', field: 'options', msg: `glossa fra parentesi che ripete la parola chiave della domanda: "${spia}"` });
    }
  }

  // Dal lotto 48: domanda al plurale con la spiegazione canonica al singolare
  // ("Quali parti della pianta stanno sotto terra?" spiegata con "La parte
  // corretta e' 'radici'."). Nelle domande sorelle il numero coincide, quindi
  // il disallineamento segnala che uno dei due e' stato cambiato da solo.
  if (subject !== 'inglese' && /^Quali\s/.test(question || '')
      // Niente \b dopo "è": in JavaScript una lettera accentata non e' un
      // carattere di parola, quindi fra "è" e lo spazio non c'e' nessun
      // confine e la regola non scatterebbe mai. Sesta volta in questa
      // campagna (lotti 10, 14, 15, 24, 37 e ora 48).
      // Solo i template che nominano la cosa ("La parte corretta", "La parola
      // corretta"): "La risposta corretta" parla della risposta, non
      // dell'oggetto, e con una domanda al plurale sta benissimo.
      && /^L[ae]\s+(?:parte|funzione|parola|stagione|trasformazione)\s+corretta\s+è(?=\s|$)/.test(explanation || '')) {
    errors.push({ level: 'error', field: 'explanation', msg: 'domanda al plurale e spiegazione canonica al singolare' });
  }

  // Dal lotto 47: nelle domande sul soggetto la risposta deve comprendere
  // l'articolo, perche' e' quello che il corpus insegna altrove
  // ("Il soggetto include l'articolo: 'Il treno'"). ita-2-grammatica-9215
  // citava "La bambina gioca" e dava per giusta "bambina" da sola, con "La"
  // come opzione a se'.
  if (subject !== 'inglese' && /\bsoggetto\b|chi compie/i.test(question || '') && typeof answer === 'string') {
    const citata = String(question).match(/'([^']+)'/);
    const conArticolo = citata && citata[1].match(/^(?:Il|Lo|La|I|Gli|Le|Un|Una)\s+([a-zà-ù]+)/);
    if (conArticolo && answer.trim().toLowerCase() === conArticolo[1].toLowerCase()) {
      errors.push({ level: 'error', field: 'answer', msg: `il soggetto va indicato con l'articolo: "${conArticolo[0]}", non "${answer}"` });
    }
  }

  // Dal lotto 46: parola italiana che finisce per consonante nei problemi e in
  // matematica. In italiano quasi nessuna parola finisce per consonante: le
  // eccezioni sono i prestiti (album, tablet, croissant), le forme tronche
  // regolari (qual, nessun, vuol) e qualche nome proprio, e in queste due
  // materie sono trentuno in tutto, elencate qui sotto. Il resto e' un
  // troncamento del template: "ogni quadern costa" nel lotto 16, "ogni penn"
  // nel 32, "ogni squadr" e "ogni evidenziator" adesso. Il controllo del
  // lotto 30 non poteva vederli, perche' e' statistico e la parola giusta
  // non compare da nessun'altra parte nel corpus.
  if (subject === 'problemi' || subject === 'matematica') {
    const PRESTITI = new Set(['album', 'alcun', 'ananas', 'autobus', 'basket', 'bonbon', 'brioches',
      'budget', 'camion', 'chances', 'ciascun', 'container', 'croissant', 'dessert', 'donuts',
      'download', 'film', 'jolly', 'krapfen', 'muffin', 'nessun', 'pullman', 'qual', 'quel',
      'sport', 'stop', 'tablet', 'vuol', 'wafer', 'weekend', 'yogurt']);
    const tutti = [question, explanation, answer].concat(options || [])
      .filter((v) => typeof v === 'string').join(' ');
    const tronca = (tutti.match(/(?<![a-zà-ùA-ZÀ-Ù'’])[a-zà-ù]{4,}(?=[\s.,;:!?)"]|$)/g) || [])
      .find((w) => !'aeiouàèéìòù'.includes(w[w.length - 1]) && !PRESTITI.has(w));
    if (tronca) {
      errors.push({ level: 'error', field: 'text', msg: `parola troncata o prestito non previsto: "${tronca}" (se e' una parola vera, aggiungila all'elenco in lint_content.js)` });
    }
  }

  // Dal lotto 45: lo stem finisce con una preposizione e l'opzione la ripete
  // ("Il Po scorre principalmente nel..." con "solo nelle isole", "dipende
  // da..." con "solo dalla Luna"). Letti insieme danno "nel solo nelle
  // isole". In tutti e dieci i casi trovati la risposta giusta era l'unica a
  // combaciare, quindi il difetto era anche un indizio. La soluzione adottata
  // e' spostare la preposizione dentro tutte e quattro le opzioni.
  if (subject !== 'inglese' && Array.isArray(options)) {
    const BASI = {
      a: 'a|ad|al|allo|alla|ai|agli|alle',
      da: 'da|dal|dallo|dalla|dai|dagli|dalle',
      di: 'di|del|dello|della|dei|degli|delle',
      in: 'in|nel|nello|nella|nei|negli|nelle',
      su: 'su|sul|sullo|sulla|sui|sugli|sulle',
      con: 'con|col|coi',
    };
    const fine = String(question || '').trim()
      .match(/(?<![a-zà-ù])(a|ad|al|allo|alla|ai|agli|alle|da|dal|dalla|dai|dagli|di|del|della|dei|degli|delle|in|nel|nella|nei|negli|su|sul|sulla|con)\s*\.\.\.$/);
    if (fine) {
      const base = Object.keys(BASI).find((b) => new RegExp(`^(?:${BASI[b]})$`).test(fine[1]));
      if (base) {
        const testa = (o) => {
          const m = String(o).match(/^\s*(?:solo\s+|soltanto\s+|sempre\s+)?([a-zà-ù]+)\s/i);
          return m ? Object.keys(BASI).find((b) => new RegExp(`^(?:${BASI[b]})$`, 'i').test(m[1])) : null;
        };
        const doppia = options.filter((o) => typeof o === 'string').find((o) => testa(o) === base);
        if (doppia) {
          errors.push({ level: 'error', field: 'options', msg: `preposizione ripetuta fra la domanda ("${fine[1]}...") e l'opzione ("${doppia}")` });
        }
        // Dal lotto 56: variante opposta. "La Svizzera confina con l'Italia
        // a..." aveva fra le opzioni "solo con le isole": la preposizione
        // dell'opzione non ripete quella dello stem, la contraddice, e letta
        // di seguito da' "a solo con le isole".
        const discorde = options.filter((o) => typeof o === 'string')
          .find((o) => { const b = testa(o); return b && b !== base; });
        if (discorde) {
          errors.push({ level: 'error', field: 'options', msg: `preposizione dell'opzione ("${discorde}") incompatibile con quella della domanda ("${fine[1]}...")` });
        }
      }
    }
  }

  // Dal lotto 70: stem che chiede di identificare un ente gia' nominato
  // ("Qual e' il Parlamento Europeo e chi lo elegge?"): la prima meta' non e'
  // una domanda sensata e le opzioni rispondono solo alla seconda. La regola
  // e' stretta di proposito: le altre domande doppie del corpus ("Chi era
  // Giulio Cesare e perche' e' importante?") hanno opzioni che rispondono a
  // tutte e due le meta', e restano fuori.
  if (subject !== 'inglese') {
    if (/^Qual è (?:il|la|lo|l')\s+[A-ZÀ-Ù]/.test(String(question || ''))) {
      errors.push({ level: 'error', field: 'question', msg: 'lo stem chiede "qual e\'" di un ente gia\' nominato: serve "che cos\'e\'" o la domanda vera' });
    }
  }

  // Dal lotto 69: spiegazione che ammette che nessuna opzione risponde alla
  // domanda. ita-4-lingua-9322 chiedeva quale parola della frase avesse un
  // prefisso negativo e la sua stessa spiegazione diceva "Tra le opzioni
  // date, nessuna ha un prefisso negativo". Il difetto era documentato per
  // iscritto e nessun controllo lo guardava.
  if (subject !== 'inglese') {
    const ammissione = String(explanation || '')
      .match(/nessun[ao]\s+(?:delle\s+)?(?:opzioni|risposte)\b|nessuna\s+ha\s+un\b|la risposta corretta avrebbe\b|non (?:compare|è|c'è) tra le opzioni\b/i);
    if (ammissione) {
      errors.push({ level: 'error', field: 'explanation', msg: `la spiegazione ammette che la domanda non ha risposta ("${ammissione[0]}")` });
    }
  }

  // Dal lotto 68: domanda che chiede il numero maggiore o minore fra quattro
  // numeri, con la spiegazione che ne confronta solo una parte ("0,7 e'
  // maggiore degli altri numeri proposti"). Chi sbaglia scegliendo un numero
  // che la spiegazione non nomina non trova scritto perche' e' sbagliato.
  if (subject !== 'inglese' && Array.isArray(options)) {
    const confronto = /(?:più piccolo|più grande|maggiore|minore)\b/i.test(String(question || ''));
    const numeri = options.filter((o) => typeof o === 'string' && /^[\d.,]+\s*\w{0,4}$/.test(o.trim()));
    if (confronto && numeri.length === options.length && numeri.length >= 3) {
      const fuori = numeri.filter((o) => !String(explanation || '').includes(o.trim()));
      if (fuori.length) {
        errors.push({ level: 'error', field: 'explanation', msg: `la spiegazione del confronto non nomina ${fuori.join(', ')}` });
      }
    }
  }

  // Dal lotto 67: la domanda dice "In questa frase" ma la frase non c'e': le
  // uniche virgolette racchiudono il pezzo da analizzare ("'con il pennello'
  // e'..."), e l'esempio sta solo nella spiegazione. Le altre trenta domande
  // della stessa famiglia la frase la citano, chiusa dalla punteggiatura.
  if (subject !== 'inglese') {
    const d = String(question || '').trim();
    if (/^In questa frase\b/.test(d) && !/['‘][^'’]*[.!?]['’]/.test(d)) {
      errors.push({ level: 'error', field: 'question', msg: 'la domanda dice "In questa frase" ma la frase non e\' citata' });
    }
  }

  // Dal lotto 66: opzione con l'esempio d'uso incollato dentro, nella forma
  // "molto bello: 'molto'". La risposta e' la parola fra apici, il resto e'
  // una nota di redazione finita fra le opzioni.
  if (subject !== 'inglese' && Array.isArray(options)) {
    const nota = options.filter((o) => typeof o === 'string')
      .find((o) => /:\s*['‘“].+['’”]\s*$/.test(o));
    if (nota) {
      errors.push({ level: 'error', field: 'options', msg: `opzione con una nota d'uso incollata dentro: "${nota}"` });
    }
  }

  // Dal lotto 66: la domanda dice "Osserva la tabella" ma la tabella non c'e',
  // i dati sono in linea nel testo.
  if (subject !== 'inglese') {
    const d = String(question || '');
    const rimanda = /Osserva (?:la tabella|il grafico|il diagramma)/i.test(d)
      || /^In un (?:grafico|istogramma|diagramma)\b|^In una tabella\b/i.test(d);
    if (rimanda && !/[|\n]/.test(d)) {
      errors.push({ level: 'error', field: 'question', msg: 'la domanda rimanda a una tabella o a un grafico che non ci sono: i dati sono in linea' });
    }
  }

  // Dal lotto 65: la domanda chiede quale parola "vuole l'apostrofo" e la
  // risposta e' l'unica che l'apostrofo ce l'ha gia' scritto: alla domanda
  // com'e' posta rispondono semmai le altre tre. Stesso difetto della regola
  // del lotto 63 sull'accento. Due casi, riscritti come "quale di queste
  // espressioni e' scritta correttamente".
  if (subject !== 'inglese' && typeof answer === 'string') {
    if (/(?:vuole|richiede|serve)\s+l'apostrofo/i.test(String(question || '')) && /['’]/.test(answer)) {
      errors.push({ level: 'error', field: 'question', msg: `la domanda chiede quale parola vuole l'apostrofo ma la risposta ("${answer}") ce l'ha gia'` });
    }
  }

  // Dal lotto 64: stem che finisce con "c'e'..." o "ci sono..." e opzioni che
  // cominciano per preposizione, cioe' complementi che dopo quel verbo non
  // stanno: "dove e' piu' sicuro pedalare quando c'e'..." con "Sulla pista
  // ciclabile". La stessa forma con opzioni che sono sintagmi nominali va
  // bene ("dove ci sono... trasporti, energia e manodopera") e resta fuori.
  if (subject !== 'inglese' && Array.isArray(options)) {
    const sospeso = /(?<![a-zà-ùA-ZÀ-Ù])(?:c'è|ci sono)\s*\.\.\.$/i.test(String(question || '').trim());
    if (sospeso) {
      const PREP = 'a|ad|in|su|con|da|per|tra|fra|al|allo|alla|ai|agli|alle|nel|nello|nella|nei|negli|nelle|sul|sullo|sulla|sui|sugli|sulle|dal|dalla|dai|dagli|dalle';
      const complemento = options.filter((o) => typeof o === 'string')
        .find((o) => new RegExp(`^\\s*(?:${PREP})\\s`, 'i').test(o));
      if (complemento) {
        errors.push({ level: 'error', field: 'options', msg: `la domanda finisce con un verbo che vuole un nome ma l'opzione e' un complemento ("${complemento}")` });
      }
    }
  }

  // Dal lotto 63: la domanda chiede quale parola "ha l'accento scritto", cioe'
  // la presenza dell'accento, e piu' di un'opzione ce l'ha: "pero'" con
  // l'accento sbagliato ('pero') risponde alla domanda quanto la risposta
  // giusta. Le domande sull'accento *corretto* o sulla sua *posizione* non
  // rientrano: li' piu' opzioni accentate sono il punto dell'esercizio.
  if (subject !== 'inglese' && Array.isArray(options)) {
    if (/l'accento (?:scritto|grafico)/i.test(String(question || ''))) {
      const accentate = options.filter((o) => typeof o === 'string' && /[àèéìòóù]/.test(o));
      if (accentate.length > 1) {
        errors.push({ level: 'error', field: 'options', msg: `la domanda chiede quale parola ha l'accento scritto ma ce l'hanno in ${accentate.length}: ${accentate.join(', ')}` });
      }
    }
  }

  // Dal lotto 62: rettangolo con la larghezza maggiore della lunghezza ("18 m
  // di larghezza e 5 m di lunghezza"). Tre casi: scambiate le etichette, i
  // numeri e quindi la risposta restano quelli.
  if (subject !== 'inglese') {
    const lati = String(question || '')
      .match(/(\d+(?:[.,]\d+)?)\s*m\w*\s+di\s+larghezza\s+e\s+(\d+(?:[.,]\d+)?)\s*m\w*\s+di\s+lunghezza/i)
      || String(question || '').match(/largo\s+(\d+(?:[.,]\d+)?)\s*m\w*\s+e\s+lungo\s+(\d+(?:[.,]\d+)?)\s*m/i);
    if (lati) {
      const larga = Number(lati[1].replace(',', '.'));
      const lunga = Number(lati[2].replace(',', '.'));
      if (larga > lunga) {
        errors.push({ level: 'error', field: 'question', msg: `rettangolo con la larghezza (${lati[1]}) maggiore della lunghezza (${lati[2]})` });
      }
    }
  }

  // Dal lotto 61: spiegazione in due passi dove il primo non calcola niente e
  // ripete solo i numeri del secondo ("Prima: 320 mattoni / 8 operai. Poi:
  // 320 / 8 = 40."). Sedici casi, uniti in un passo solo che tiene le parole
  // del primo e il risultato del secondo. E' la variante senza ripetizione
  // letterale della regola del lotto 27, che confrontava i due passi con una
  // backreference e quindi vedeva solo i testi identici.
  if (subject !== 'inglese') {
    const passi = String(explanation || '').trim()
      .match(/^Prima:\s*(.+?)\.\s*Poi:\s*(.+?)\s*=\s*(.+?)\.?$/);
    if (passi && !passi[1].includes('=')) {
      const n1 = passi[1].match(/\d+(?:[.,]\d+)?/g) || [];
      const n2 = passi[2].match(/\d+(?:[.,]\d+)?/g) || [];
      if (n1.length && n1.join('|') === n2.join('|')) {
        errors.push({ level: 'error', field: 'explanation', msg: `spiegazione in due passi dove il primo ripete i numeri del secondo senza calcolare ("${passi[1]}")` });
      }
    }
    // Dal lotto 96: la domanda chiede quale parola e' scritta correttamente e
  // la spiegazione ammette che lo sono anche altre opzioni ("'Pane' e 'mela'
  // sono scritte correttamente"). Erano tre risposte giuste su quattro.
  if (subject !== 'inglese' && typeof answer === 'string' && Array.isArray(options)) {
    if (/scritt[ao]\s+(?:in modo\s+)?corrett/i.test(String(question || ''))) {
      const e = String(explanation || '');
      const altra = options.filter((o) => typeof o === 'string' && o.trim().toLowerCase() !== answer.trim().toLowerCase())
        .find((o) => new RegExp(`${o.trim()}['’]?\\s*(?:e\\s+['‘]?[a-zà-ù]+['’]?\\s*)?son[oe]\\s+scritt[ei]\\s+corrett`, 'i').test(e));
      if (altra) {
        errors.push({ level: 'error', field: 'options', msg: `la spiegazione dice che anche "${altra}" e' scritta correttamente: la domanda ha piu' di una risposta` });
      }
    }
  }

  // Dal lotto 95: domanda di confronto con i dati in linea ("lunedi' 12
  // presenze, martedi' 15, mercoledi' 9") e spiegazione che si ferma al
  // numero ("15 e' il numero maggiore") senza dire a quale giorno
  // corrisponde: chi sbaglia non trova la risposta, trova solo il conto.
  // Dal lotto 97 la regola vale anche per le domande di posizione ("quale
  // colore e' al secondo posto?"), che hanno lo stesso difetto.
  // I nomi vanno cercati con [a-zà-ù] e non con \w: in JavaScript \w le lettere
  // accentate non le prende, e "lunedi'" restava fuori.
  if (subject !== 'inglese' && typeof answer === 'string') {
    const d = String(question || '');
    const dati = /[a-zà-ùA-ZÀ-Ù]+\s+\d+[^,]{0,15},\s*[a-zà-ùA-ZÀ-Ù]+\s+\d+/.test(d);
    const confronto = /(?:più|meno|maggiore|minore|probabile|posto|primo|second[oa]|ultim[oa])/i.test(d);
    if (dati && confronto && !String(explanation || '').toLowerCase().includes(answer.trim().toLowerCase())) {
      errors.push({ level: 'error', field: 'explanation', msg: `la spiegazione del confronto non nomina la risposta ("${answer}")` });
    }
  }

  // Dal lotto 94: opzione che elenca piu' voci e ne ripete una ("Liguria,
  // Emilia-Romagna, Marche, Umbria, Lazio, Liguria"): l'elenco sembra lungo
  // sei ma di regioni ne nomina cinque.
  if (subject !== 'inglese' && Array.isArray(options)) {
    for (const o of options) {
      if (typeof o !== 'string' || (o.match(/,/g) || []).length < 2) continue;
      const pezzi = o.split(',').map((x) => x.trim().toLowerCase()).filter(Boolean);
      const ripetuto = pezzi.find((x, i) => pezzi.indexOf(x) !== i);
      if (ripetuto) {
        errors.push({ level: 'error', field: 'options', msg: `l'opzione "${o}" ripete "${ripetuto}" nell'elenco` });
      }
    }
  }

  // Dal lotto 91: "Come si chiama la densita' di popolazione?" — il termine
  // e' gia' scritto nella domanda e la risposta e' la sua definizione: la
  // domanda giusta e' "Che cos'e'". Restano fuori le domande che il concetto
  // lo descrivono invece di nominarlo ("Come si chiama la parte piu' alta di
  // una montagna?"), riconoscibili perche' il gruppo dopo l'articolo e' piu'
  // lungo di due parole.
  if (subject !== 'inglese' && typeof answer === 'string') {
    const nome = String(question || '').trim()
      .match(/^Come si chiama\s+(?:il|la|lo|l'|i|le|gli)\s+([a-zà-ù]+(?:\s+(?:di|del|della|dei|delle)\s+[a-zà-ù]+)?)\s*\?$/);
    if (nome && answer.trim().split(/\s+/).length >= 4) {
      errors.push({ level: 'error', field: 'question', msg: `la domanda nomina gia' "${nome[1]}" e la risposta ne e' la definizione: chiedere "che cos'e'"` });
    }
  }

  // Dal lotto 90: lo stem sospeso, unito all'opzione, produce una
  // contraddizione. "Il sasso e' un essere..." con l'opzione "non vivente"
  // dava "un essere non vivente", che e' un ossimoro: un essere, per
  // definizione, vive. Il controllo ricompone la frase e cerca le formule
  // impossibili.
  if (subject !== 'inglese' && Array.isArray(options)) {
    const IMPOSSIBILI = [/esser[ei]\s+non\s+vivent[ei]/i, /vivente\s+non\s+vivo/i];
    const tronco = String(question || '').trim().replace(/\.\.\.$/, '').trim();
    if (tronco !== String(question || '').trim()) {
      for (const o of options) {
        if (typeof o !== 'string') continue;
        const frase = `${tronco} ${o.trim()}`;
        const brutta = IMPOSSIBILI.find((r) => r.test(frase));
        if (brutta) {
          errors.push({ level: 'error', field: 'options', msg: `la domanda unita all'opzione "${o}" da' una frase contraddittoria: "${frase}"` });
        }
      }
    }
  }

  // Dal lotto 88: divisione scritta con i due punti invece di ÷ ("Divisione:
  // 28: 4 = 7"), mentre 694 spiegazioni usano il segno. Gli orari restano
  // fuori: "dalle 16:10 alle 17:10" non ha lo spazio dopo i due punti, e la
  // prima forma pretende la parola "Divisione".
  if (subject !== 'inglese') {
    const e = String(explanation || '');
    if (/Divisione:\s*\d+\s*:\s*\d+/.test(e) || /(?<!\d)\d+:\s+\d+\s*=/.test(e)) {
      errors.push({ level: 'error', field: 'explanation', msg: 'divisione scritta con i due punti: usare il segno ÷' });
    }
  }

  // Dal lotto 87: contenitore e contenuto incompatibili, segno che il
  // generatore ha combinato due modelli ("In un astuccio ci sono 7 libri").
  // La tabella e' volutamente stretta: elenca solo le coppie impossibili
  // viste davvero, perche' "astuccio con 26 adesivi" o "libreria con 32
  // scaffali" sono verosimili e non vanno segnalate.
  if (subject !== 'inglese') {
    const IMPOSSIBILI = {
      astuccio: /(?:libri|palloni|biciclette|sedie|scatoloni)/i,
      portamonete: /(?:libri|matite|palloni)/i,
      pollaio: /(?:libri|matite|automobili)/i,
    };
    const d = String(question || '');
    for (const [contenitore, vietati] of Object.entries(IMPOSSIBILI)) {
      const m = d.match(new RegExp(`(?<![a-zà-ù])${contenitore}(?![a-zà-ù])[^.?!]{0,40}?\\d+\\s+([a-zà-ù]+)`, 'i'));
      if (m && vietati.test(m[1])) {
        errors.push({ level: 'error', field: 'question', msg: `contenitore e contenuto incompatibili: "${contenitore}" con "${m[1]}"` });
      }
    }
  }

  // Dal lotto 84: due opzioni che dicono la stessa cosa, una col
  // quantificatore e una senza ("Diversi" e "Tutti diversi" fra i lati di un
  // triangolo): il secondo distrattore non aggiunge niente.
  if (subject !== 'inglese' && Array.isArray(options)) {
    const nude = options.filter((o) => typeof o === 'string')
      .map((o) => o.trim().toLowerCase().replace(/^(?:tutti|tutte|tutto|tutta)\s+/, ''));
    for (let i = 0; i < nude.length; i += 1) {
      for (let j = i + 1; j < nude.length; j += 1) {
        if (nude[i] && nude[i] === nude[j]) {
          errors.push({ level: 'error', field: 'options', msg: `due opzioni dicono la stessa cosa: "${options[i]}" e "${options[j]}"` });
        }
      }
    }
  }

  // Dal lotto 83: domanda che risponde a se stessa. "Quale punto cardinale
  // indica l'Ovest?" con risposta "O": il punto cardinale e' gia' scritto
  // nella domanda e l'opzione ne e' l'iniziale. Tre casi, riscritti come
  // "Quale lettera indica l'Ovest sulla rosa dei venti?".
  if (subject !== 'inglese' && typeof answer === 'string') {
    const cardinale = String(question || '')
      .match(/Quale punto cardinale indica\s+(?:il|lo|l')\s*(Nord|Sud|Est|Ovest)/i);
    if (cardinale && answer.trim().toUpperCase() === cardinale[1][0].toUpperCase()) {
      errors.push({ level: 'error', field: 'question', msg: `la domanda nomina "${cardinale[1]}" e la risposta e' la sua iniziale: si risponde da sola` });
    }
  }

  // Dal lotto 81: domanda sul diminutivo con due opzioni diminutive
  // ("librino" e "libretto"): la domanda ha due risposte giuste. Stesso
  // controllo per l'accrescitivo.
  if (subject !== 'inglese' && Array.isArray(options)) {
    const d = String(question || '');
    const CATEGORIE = [
      { nome: 'diminutivo', chiede: /diminutivo/i, coda: /(?:in|ett|ell|icin|olin)[oaie]$/i },
      { nome: 'accrescitivo', chiede: /accrescitivo/i, coda: /on[aei]$/i },
    ];
    for (const cat of CATEGORIE) {
      if (!cat.chiede.test(d)) continue;
      const trovate = options.filter((o) => typeof o === 'string' && cat.coda.test(o.trim()));
      if (trovate.length > 1) {
        errors.push({ level: 'error', field: 'options', msg: `la domanda chiede un ${cat.nome} e fra le opzioni ce ne sono ${trovate.length}: ${trovate.join(', ')}` });
      }
    }
  }

  // Dal lotto 80: due opzioni che sono la stessa frazione scritta in modo
  // diverso. In mat-5-logica_e_dati-004 una delle due era la risposta
  // ("1/10" e "4/40"), quindi la domanda aveva due risposte giuste; nelle
  // altre due sprecavano un distrattore.
  if (subject !== 'inglese' && Array.isArray(options)) {
    const valori = new Map();
    for (const o of options) {
      if (typeof o !== 'string') continue;
      const m = o.trim().match(/^(\d+)\s*\/\s*(\d+)$/);
      if (!m || Number(m[2]) === 0) continue;
      const v = Number(m[1]) / Number(m[2]);
      if (valori.has(v)) {
        errors.push({ level: 'error', field: 'options', msg: `due opzioni valgono la stessa frazione: "${valori.get(v)}" e "${o.trim()}"` });
      }
      valori.set(v, o.trim());
    }
  }

  // Dal lotto 79: due domande messe in fila, la prima chiusa dai due punti
  // ("Dove va l'accento: quale parola e' scritta giusta?"). Gli altri stem
  // con i due punti aprono con un elenco o con un'ambientazione, non con
  // un'interrogativa, e restano fuori.
  if (subject !== 'inglese') {
    const d = String(question || '').trim();
    if (/^(?:Dove|Come|Quando|Perch[ée]|Quale|Quali|Chi|Che cosa|Cosa)\b[^:?]{0,50}:\s*(?:qual|quale|quali|chi|come|dove|quando|perch[ée]|che cosa|cosa)\b/i.test(d)) {
      errors.push({ level: 'error', field: 'question', msg: 'due domande in fila nello stesso stem: tenerne una sola' });
    }
  }

  // Dal lotto 78: la notazione oraria compatta stava nelle opzioni ("2h
  // 25min"), che le regex di GRAMMATICA non vedono. Stessa regola, applicata
  // alle opzioni.
  if (subject !== 'inglese' && Array.isArray(options)) {
    const compatta = options.filter((o) => typeof o === 'string')
      .find((o) => /(?<![a-zà-ùA-ZÀ-Ù0-9])\d{1,2}\s*h\s*\d{2}(?:min)?(?![0-9])/.test(o));
    if (compatta) {
      errors.push({ level: 'error', field: 'options', msg: `notazione oraria compatta nell'opzione "${compatta}": usare "2 ore e 25 minuti"` });
    }
  }

  // Dal lotto 77: domanda a esclusione con il "non" in minuscolo. Trenta
  // domande del corpus scrivono "Quale ... NON ..." in maiuscolo proprio
  // perche' la negazione, letta di fretta, sparisce; una sola sfuggiva.
  // Il verbo va chiuso con un lookahead e non con \b: dopo "puo'" la \b non
  // fa mai match, perche' in JavaScript le lettere accentate non sono
  // caratteri di parola.
  if (subject !== 'inglese') {
    const d = String(question || '');
    if (/(?<![a-zà-ùA-ZÀ-Ù])(?:[Qq]uale|[Qq]uali|[Cc]he cosa|[Cc]osa)(?![a-zà-ùA-ZÀ-Ù])[\s\S]{0,40}?(?<![a-zà-ùA-ZÀ-Ù])non(?![a-zà-ùA-ZÀ-Ù])\s+(?:è|appartiene|fa parte|serve|può|sono|rientra|vive|indica)(?![a-zà-ùA-ZÀ-Ù])/.test(d)
        && /\?\s*$/.test(d)) {
      errors.push({ level: 'error', field: 'question', msg: 'domanda a esclusione con "non" in minuscolo: il corpus lo scrive "NON"' });
    }
  }

  // Dal lotto 76: conteggi sbagliati sul cubo. mat-5-geometria-012 diceva
  // "8 spigoli verticali": i verticali sono 4, gli spigoli in tutto 12. Il
  // cubo ha 6 facce, 12 spigoli, 8 vertici, e sono numeri fissi: si possono
  // controllare.
  if (subject !== 'inglese' && /(?<![a-zà-ùA-ZÀ-Ù])cubo(?![a-zà-ùA-ZÀ-Ù])/i.test(String(explanation || ''))) {
    const ATTESI = { facce: 6, spigoli: 12, vertici: 8 };
    for (const m of String(explanation).matchAll(/(\d+)\s+(facce|spigoli|vertici)(\s+verticali)?/gi)) {
      const atteso = m[3] ? 4 : ATTESI[m[2].toLowerCase()];
      if (Number(m[1]) !== atteso) {
        errors.push({ level: 'error', field: 'explanation', msg: `il cubo non ha ${m[1]} ${m[2]}${m[3] || ''}: ne ha ${atteso}` });
      }
    }
  }

  // Dal lotto 93: area di un rettangolo spiegata con "lato × lato", che e' la
  // formula del quadrato.
  if (subject !== 'inglese'
      && /rettangol/i.test(String(question || ''))
      && /area\s*=\s*lato\s*×\s*lato/i.test(String(explanation || ''))) {
    errors.push({ level: 'error', field: 'explanation', msg: 'area di un rettangolo spiegata con "lato × lato": è la formula del quadrato' });
  }

  // Dal lotto 76: area di un giardino spiegata con "base x altezza". Un
  // giardino ha lunghezza e larghezza, e le domande le nominano cosi'.
  if (subject !== 'inglese'
      && /(?:giardino|campo|terreno|orto)\b[\s\S]{0,60}rettangolare/i.test(String(question || ''))
      && /Area\s*=\s*base\s*×\s*altezza/i.test(String(explanation || ''))) {
    errors.push({ level: 'error', field: 'explanation', msg: 'area di un giardino spiegata con "base × altezza": usare "lunghezza × larghezza"' });
  }

  // Dal lotto 75: la domanda chiede un valore approssimativo e la spiegazione
  // risponde "esattamente", contraddicendola; in sto-5-linea_del_tempo-9152
  // l'opzione giusta era anche l'unica precisa (324) fra tre numeri tondi, e
  // si riconosceva senza fare il conto.
  if (subject !== 'inglese') {
    const approssima = /approssimativamente|all'incirca|(?<![a-zà-ùA-ZÀ-Ù])circa(?![a-zà-ùA-ZÀ-Ù])/i.test(String(question || ''));
    if (approssima && /(?<![a-zà-ùA-ZÀ-Ù])esattamente(?![a-zà-ùA-ZÀ-Ù])/i.test(String(explanation || ''))) {
      errors.push({ level: 'error', field: 'explanation', msg: 'la domanda chiede un valore approssimativo ma la spiegazione dice "esattamente"' });
    }
  }

  // Dal lotto 73: variante con i conti diversi ma lo stesso risultato
    // ("Prima: 52 / 4 = 13. Poi: 1/4 di 52 = 13 carte."): il secondo passo
    // riscrive il primo in un'altra notazione, non aggiunge un calcolo.
    const stessoRisultato = String(explanation || '').trim()
      .match(/^Prima:\s*.+?\s*=\s*([\d.,]+)\.\s*Poi:\s*.+?\s*=\s*([\d.,]+)\s*\w*\.$/);
    if (stessoRisultato && stessoRisultato[1] === stessoRisultato[2]) {
      errors.push({ level: 'error', field: 'explanation', msg: `spiegazione in due passi che arrivano tutti e due a ${stessoRisultato[1]}` });
    }
  }

  // Dal lotto 60: la glossa fra parentesi di un'opzione ne scrive la forma
  // accentata, cioe' la risposta: "pero (congiunzione pero')" in una domanda
  // che chiede quale parola vuole l'accento. Il confronto e' fra la parola
  // nuda e le parole della glossa, ignorando i segni diacritici.
  if (subject !== 'inglese' && Array.isArray(options)) {
    const senzaAccenti = (w) => w.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const rivelatrice = options.filter((o) => typeof o === 'string').find((o) => {
      const m = o.match(/^\s*([a-zà-ùA-ZÀ-Ù']+)\s*\(([^)]*)\)\s*$/);
      if (!m) return false;
      return (m[2].match(/[a-zà-ùA-ZÀ-Ù']+/g) || [])
        .some((w) => senzaAccenti(w) === senzaAccenti(m[1]) && w.toLowerCase() !== m[1].toLowerCase());
    });
    if (rivelatrice) {
      errors.push({ level: 'error', field: 'options', msg: `la glossa dell'opzione "${rivelatrice}" ne scrive la forma accentata` });
    }
  }

  // Dal lotto 60: lo stem chiede un comportamento o una scelta, cioe' un
  // nome, e le opzioni sono all'imperativo ("Cammina sul lato sinistro").
  // Uniformate all'infinito, come nelle altre centinaia di domande di questa
  // forma.
  if (subject !== 'inglese' && Array.isArray(options)) {
    const chiedeNome = /Quale (?:comportamento|scelta)|modo giusto di comportarsi/i.test(String(question || ''));
    const IMPERATIVI = 'Cammina|Corri|Chiedi|Aspetta|Rispondi|Vai|Fai|Metti|Usa|Guarda|Chiudi|Apri|Butta|Prendi|Lascia|Spegni|Accendi|Scrivi|Leggi|Dai|Vieni';
    const imperativa = chiedeNome && options.filter((o) => typeof o === 'string')
      .find((o) => new RegExp(`^(?:${IMPERATIVI})(?![a-zà-ùA-ZÀ-Ù])`).test(o.trim()));
    if (imperativa) {
      errors.push({ level: 'error', field: 'options', msg: `la domanda chiede un comportamento ma l'opzione e' all'imperativo ("${imperativa}")` });
    }
  }

  // Dal lotto 59: stem sospeso con un avverbio di grado ("Roma controllo'
  // territori molto...") e opzioni che dopo quell'avverbio non stanno in
  // piedi: "molto solo italiani", "molto temporanea di un solo giorno". Due
  // casi, risolti togliendo l'avverbio dallo stem.
  if (subject !== 'inglese' && Array.isArray(options)) {
    const grado = String(question || '').trim()
      .match(/(?<![a-zà-ùA-ZÀ-Ù])(molto|assai|piuttosto|parecchio)\s*\.\.\.$/i);
    if (grado) {
      const incoerente = options.filter((o) => typeof o === 'string')
        .find((o) => /^\s*(?:solo|soltanto)\b/i.test(o) || /\sdi un solo\s/i.test(o));
      if (incoerente) {
        errors.push({ level: 'error', field: 'options', msg: `l'avverbio "${grado[1]}..." della domanda non regge l'opzione "${incoerente}"` });
      }
    }
  }

  // Dal lotto 58: l'accordo sbagliato stava in un'opzione ("Per mimetizzarsi
  // tra la neve e la ghiaccio"), e le regex di GRAMMATICA vedono solo domanda
  // e spiegazione. Stessa regola, applicata alle opzioni.
  if (subject !== 'inglese' && Array.isArray(options)) {
    const femminile = new RegExp(`(?<![a-zà-ùA-ZÀ-Ù])(?:la|una|della|nella|alla|dalla|sulla)\\s+(?:${NOMI_MASCHILI})(?![a-zà-ùA-ZÀ-Ù])`, 'i');
    const sbagliata = options.filter((o) => typeof o === 'string').find((o) => femminile.test(o));
    if (sbagliata) {
      errors.push({ level: 'error', field: 'options', msg: `accordo: articolo o preposizione femminile davanti a un nome maschile nell'opzione "${sbagliata}"` });
    }
  }

  // Dal lotto 58: lo stem promette una parola sola ma la risposta e' un
  // sintagma ("Quale parola e' un verbo al trapassato prossimo?" con "avevo
  // mangiato"). Undici casi, risolti cambiando il nome nello stem: "forma
  // verbale", "espressione", "frase" secondo quello che sono le opzioni.
  if (subject !== 'inglese' && typeof answer === 'string') {
    const promessa = /^\s*(?:Quale|Che)\s+parola\b/i.test(String(question || ''));
    // la glossa fra parentesi non conta: "hai (verbo avere)" resta una parola
    const nuda = answer.replace(/\([^)]*\)/g, '').trim();
    if (promessa && /\s/.test(nuda)) {
      errors.push({ level: 'error', field: 'question', msg: `la domanda chiede "quale parola" ma la risposta e' un gruppo di parole ("${answer}")` });
    }
  }

  // Dal lotto 57: variante con i puntini della regola del lotto 53. Lo stem
  // finisce con un articolo eliso ("Il mare che bagna Venezia e' l'...") e fra
  // le opzioni ce n'e' almeno una che comincia per consonante: quelle non
  // possono seguire l'elisione, quindi la domanda ne scarta due o tre prima
  // ancora di essere capita. Otto casi, risolti riscrivendo lo stem come
  // domanda diretta ("Quale mare bagna Venezia?").
  if (subject !== 'inglese' && Array.isArray(options)) {
    const eliso = String(question || '').trim()
      .match(/(?<=\s)(un|l|dell|nell|all|sull|dall|quest)['’]\s*\.\.\.$/);
    if (eliso) {
      const incompatibile = options.filter((o) => typeof o === 'string')
        .find((o) => /^[bcdfghjklmnpqrstvwxyz]/i.test(o.trim()));
      if (incompatibile) {
        errors.push({ level: 'error', field: 'options', msg: `l'articolo eliso della domanda ("${eliso[1]}'...") esclude l'opzione "${incompatibile}"` });
      }
    }
  }

  // Dal lotto 56: la stessa congiunzione ripetuta dentro una domanda sola,
  // segno di due stesure sovrapposte ("Quale scelta e' piu' responsabile
  // quando cammini quando e' buio?", tre casi in civ-3-str). Le citazioni fra
  // apici vanno tolte prima: "Leggi: 'Quando il sole tramonto'...' Quando
  // accade?" e' corretta.
  if (subject !== 'inglese') {
    const senzaCitazioni = String(question || '').replace(/'[^']*'|"[^"]*"|«[^»]*»/g, ' ');
    // "come" e "se" sono esclusi: la prima occorrenza e' interrogativa e la
    // seconda comparativa o completiva ("Come dobbiamo comportarci con i beni
    // comuni, come una panchina?"), nove casi tutti legittimi.
    const ripetuta = ['quando', 'dove', 'perche', 'mentre']
      .find((c) => {
        const forma = c === 'perche' ? 'perch[ée]' : c;
        return (senzaCitazioni.match(new RegExp(`(?<![a-zà-ùA-ZÀ-Ù])${forma}(?![a-zà-ùA-ZÀ-Ù])`, 'gi')) || []).length >= 2;
      });
    if (ripetuta) {
      errors.push({ level: 'error', field: 'question', msg: `congiunzione "${ripetuta}" ripetuta nella stessa domanda` });
    }
  }

  // Dal lotto 45: la regola del lotto 20 sul plurale di "dio" sta fra le
  // regex di GRAMMATICA, che vedono solo domanda e spiegazione: "Molti dei
  // del mare" era un'opzione e nessuno la guardava.
  if (subject !== 'inglese' && Array.isArray(options)) {
    const senzaAccento = options.filter((o) => typeof o === 'string')
      .find((o) => /\b(?:gli|molti|tanti|questi|quegli|altri|numerosi|vari|degli|agli|dagli|sugli|negli|cogli)\s+dei\b/i.test(o));
    if (senzaAccento) {
      errors.push({ level: 'error', field: 'options', msg: `plurale di "dio" senza accento in un'opzione: "${senzaAccento}"` });
    }
  }

  // Dal lotto 44: punto cardinale in maiuscolo dove indica una direzione e
  // non una regione. Il criterio fissato nel lotto 23 e' quello: "il Nord
  // Italia" e' una regione e vuole la maiuscola, "a nord del ponte" e' una
  // direzione e vuole la minuscola. Nella forma "a <direzione> di X" si
  // tratta sempre di una direzione, e il corpus si divideva quasi a meta'
  // (nove maiuscole contro otto minuscole).
  {
    const tutti = [question, explanation, answer].concat(options || [])
      .filter((v) => typeof v === 'string').join(' | ');
    const trovato = tutti.match(/\ba\s+(?:Nord|Sud|Est|Ovest)\s+(?:di|del|della|dell'|dei|degli|delle)\b/);
    if (trovato) {
      errors.push({ level: 'error', field: 'text', msg: `punto cardinale in maiuscolo dove indica una direzione: "${trovato[0]}"` });
    }
  }

  // Dal lotto 43: due opzioni che valgono lo stesso numero scritto in due
  // modi ("3,5" e "3,50"). Il bambino che sceglie quella giusta nel modo
  // sbagliato viene segnato in errore, e per l'aritmetica 3,5 e 3,50 sono lo
  // stesso numero. Il confronto e' sul valore, non sulla stringa, e tiene
  // conto dell'unita' di misura: "1 litro" e "1 kg" restano distinti.
  if (Array.isArray(options)) {
    const visti = new Map();
    for (const o of options) {
      if (typeof o !== 'string') continue;
      const m = o.trim().match(/^(\d+(?:[.,]\d+)?)\s*([a-zA-Zà-ù²³°/ ]*)$/);
      if (!m) continue;
      const chiave = `${Number(m[1].replace(/\./g, '').replace(',', '.'))}|${m[2].trim().toLowerCase()}`;
      if (visti.has(chiave)) {
        errors.push({ level: 'error', field: 'options', msg: `due opzioni con lo stesso valore: "${visti.get(chiave)}" e "${o}"` });
        break;
      }
      visti.set(chiave, o);
    }
  }

  // Dal lotto 41: spaziatura attorno alla punteggiatura. In italiano non si
  // lascia spazio prima di un segno e se ne lascia uno dopo la virgola. Le
  // opzioni che nominavano un segno lo scrivevano staccato ("Il punto
  // interrogativo ?") mentre la spiegazione della stessa domanda lo metteva
  // fra parentesi, e un gruppo di lettere era scritto "M,R,G,T".
  {
    // I campi si guardano uno per uno e non concatenati: in ita-2-ortografia-007
    // le opzioni sono i segni di punteggiatura da soli ("?", "!", ","), e
    // unendoli con un separatore si creerebbe uno spazio prima del segno che
    // nel testo non c'e'.
    const campiTesto = [question, explanation, answer].concat(options || [])
      .filter((v) => typeof v === 'string' && v.trim().length > 2);
    for (const t of campiTesto) {
      const spazio = t.match(/\S\s+[,;:!?](?!\))/);
      if (spazio) {
        errors.push({ level: 'error', field: 'text', msg: `spazio prima della punteggiatura in "${spazio[0].trim()}"` });
        break;
      }
    }
    for (const t of campiTesto) {
      const virgola = t.match(/[a-zA-ZÀ-Ùà-ù],(?=[a-zA-ZÀ-Ùà-ù])/);
      if (virgola) {
        errors.push({ level: 'error', field: 'text', msg: `manca lo spazio dopo la virgola in "${virgola[0]}"` });
        break;
      }
    }
  }

  // Dal lotto 40: stem sospeso chiuso dai due punti invece che dai puntini
  // ("Un angolo ottuso è:", "Il perimetro si misura in:"). Un lotto
  // precedente aveva lasciato correre questi 57 casi ritenendoli due punti
  // che introducono un elenco, ma nessuno introduce un elenco: sono le
  // stesse frasi sospese uniformate ai puntini nei lotti 2-6, e le opzioni
  // sono alternative fra cui sceglierne una. Restano fuori le consegne
  // all'imperativo ("Scegli la parola scritta in modo CORRETTO:"), dove i
  // due punti annunciano davvero le scelte.
  if (subject !== 'inglese' && /:\s*$/.test(question || '')
      && !/^(?:Scegli|Indica|Completa|Leggi|Osserva|Metti|Trova|Individua|Collega)\b/.test(question || '')) {
    errors.push({ level: 'error', field: 'question', msg: 'frase sospesa chiusa dai due punti: usare i puntini di sospensione' });
  }

  // Dal lotto 37: il rovescio del difetto del lotto 24. Li' erano frasi
  // sospese chiuse dal punto interrogativo; qui sono domande vere chiuse dai
  // puntini ("Leggi: '...' Che tipo di testo e'..."). Il segnale e' di nuovo
  // la posizione: conta solo l'ultimo segmento, quello dopo l'ultima virgola,
  // punto o citazione chiusa. "Quando disegni l'aula piu' piccola, stai
  // facendo..." finisce con "stai facendo" e resta fuori, perche' li'
  // "quando" apre una subordinata e la sospensione e' voluta. "Chi" non entra
  // nell'elenco: in "Chi inquina un fiume danneggia..." e' un relativo.
  if (subject !== 'inglese' && /\.\.\.\s*$/.test(question || '')) {
    const ultimo = String(question).trim().split(/[,.!?]\s+|['"»]\s+/).pop().trim();
    // Dal lotto 38: la maiuscola conta. Provata la variante che ignora
    // maiuscole e minuscole, produce quattro falsi positivi: in "definito
    // 'morfologicamente vario' perche'...", "diversi strati, come..." e
    // "dove e' piu' sicuro pedalare quando c'e'..." la parola interrogativa
    // e' minuscola perche' non apre la domanda, e i puntini sono giusti.
    if (/^(?:Cosa|Che cosa|Che|Quale|Quali|Qual|Quanto|Quanta|Quanti|Quante|Come|Dove|Perch[ée])\b/.test(ultimo)) {
      errors.push({ level: 'error', field: 'question', msg: `domanda vera chiusa dai puntini invece che dal punto interrogativo ("${ultimo}")` });
    }
  }

  // Dal lotto 35: nelle domande a scelta il "non" che rovescia la risposta va
  // in maiuscolo, come gia' in quindici domande su ventisei ("Quale parola
  // NON e' un sinonimo di 'grande'?"). In minuscolo si legge di sfuggita e la
  // risposta si capovolge. Restano fuori i casi in cui la negazione e' solo
  // un pezzo di una descrizione piu' lunga, riconoscibili dalla "e" che
  // coordina prima ("e non ha sbocco al mare").
  if (subject !== 'inglese'
      && /^(?:Quale|Quali|Che cosa|Cosa|Chi)\b(?![^?]*\se\s[^?]*\bnon\b)[^?]*?\bnon\s+(?:appartiene|è|ha|fa|rientra|vale|serve|contiene|indica|usa|si trova|fa parte|dipende|si dovrebbe|si deve)\b/.test(question || '')) {
    errors.push({ level: 'error', field: 'question', msg: 'domanda a scelta con la negazione in minuscolo: scrivere "NON" in maiuscolo' });
  }

  // Dal lotto 35: nota di redazione finita dentro un'opzione ("dottoressa
  // (non esiste medica)"), che per giunta contraddiceva la risposta giusta.
  if (Array.isArray(options)) {
    const nota = options.filter((o) => typeof o === 'string')
      .find((o) => /\((?:non esiste|non si dice|sbagliato|errato|forma errata|non corretto)/i.test(o));
    if (nota) {
      errors.push({ level: 'error', field: 'options', msg: `nota di redazione dentro un'opzione ("${nota}")` });
    }
  }

  // Dal lotto 34: la stessa domanda scrive i numeri in due formati, con e
  // senza il punto delle migliaia ("3.206 + 2.784 = 5990"). Meta' l'aveva
  // prodotta il lotto 31, che aveva tolto il punto solo ai numeri presenti
  // fra le opzioni lasciando gli operandi come stavano. Il criterio e' che
  // dentro una domanda il formato sia uno solo: le famiglie che usano il
  // punto ovunque restano come sono.
  {
    const tutti = [question, explanation, answer].concat(options || [])
      .filter((v) => typeof v === 'string').join(' | ');
    if (/\b\d{1,3}\.\d{3}\b/.test(tutti) && /(?<![\d.,:])\d{4,6}(?![\d,]|\.\d)/.test(tutti)) {
      errors.push({ level: 'error', field: 'text', msg: 'numeri scritti in due formati nella stessa domanda (con e senza il punto delle migliaia)' });
    }
  }

  // Dal lotto 33: un'opzione che rimanda alle altre per posizione ("entrambe
  // b e c", "tutte le precedenti"). Le opzioni vengono mescolate a ogni
  // partita, quindi quella lettera non indica piu' niente: in
  // ita-5-ortografia-9347 era anche la risposta giusta.
  // sto-2-cronologia-9051 chiama A, B e C tre eventi dentro la domanda: li'
  // "Tra A e C" indica quegli eventi, non la posizione delle opzioni, quindi
  // le domande che introducono da sole quelle lettere restano fuori.
  if (Array.isArray(options) && !/(?:^|[\s('"])[ABCD](?:[\s,.)'"]|$)/.test(question || '')) {
    const posizionale = options.filter((o) => typeof o === 'string')
      .find((o) => /\b(?:entrambe?\s+[abcd]\b|[abcd]\s+e\s+[abcd]\b|tutte le precedenti|nessuna delle precedenti|le prime due|la prima e la seconda)/i.test(o));
    if (posizionale) {
      errors.push({ level: 'error', field: 'options', msg: `opzione che rimanda alle altre per posizione ("${posizionale}"): le opzioni vengono mescolate` });
    }
  }

  // Dal lotto 33: articolo o preposizione articolata non elisa davanti a
  // vocale ("il ospedale", "nel albero"), prodotta dal template che incolla
  // "il" davanti a qualsiasi nome. Le domande che chiedono quale forma sia
  // corretta restano fuori: li' la forma sbagliata e' il distrattore.
  if (subject !== 'inglese' && !/corrett|sbagliat|giust[ao]\b/i.test(question || '')) {
    const tutti = [question, explanation, answer].concat(options || []).filter((v) => typeof v === 'string');
    const trovato = tutti.join(' | ').match(/(?<![a-zà-ù'])\b(?:il|nel|del|al|dal|sul|col)\s+[aeiouàèéìòù][a-zà-ù]{2,}/i);
    if (trovato) {
      errors.push({ level: 'error', field: 'text', msg: `articolo non eliso davanti a vocale: "${trovato[0]}"` });
    }
  }

  // Dal lotto 32: in un problema con la risposta numerica, il numero della
  // risposta non compare da nessuna parte nella spiegazione. In
  // pro-4-due_operazioni-9100 la spiegazione dimostrava 84 mentre la
  // risposta segnata era 44, e 84 non era nemmeno fra le opzioni: il
  // controllo aritmetico non se ne accorgeva, perche' tutte le uguaglianze
  // erano giuste. Le spiegazioni in colonna restano fuori: li' il risultato
  // si compone cifra per cifra e non compare mai intero.
  if ((subject === 'problemi' || subject === 'matematica') && typeof answer === 'string'
      && explanation && explanation.includes('=') && !/colonna/i.test(explanation)) {
    const m = answer.trim().match(/^(\d[\d.]*(?:,\d+)?)(?:\s*[a-zA-Zà-ù²³°/]+\.?)?$/);
    if (m) {
      const valore = m[1].replace(/\./g, '');
      const presenti = (explanation.match(/\d[\d.]*(?:,\d+)?/g) || []).map((n) => n.replace(/\./g, ''));
      if (!presenti.includes(valore)) {
        errors.push({ level: 'error', field: 'explanation', msg: `la risposta è ${answer} ma quel numero non compare nella spiegazione` });
      }
    }
  }

  // Dal lotto 31: nome di mare scritto in modo non uniforme. Il corpus usa
  // "Mar" davanti al nome 125 volte contro 30 fra "mar", "mare" e "Mare", e
  // in geo-4-fiumi_laghi_mari_vul-9140 le quattro opzioni erano tutte in
  // minuscolo mentre la domanda accanto usava la maiuscola. "Mare del Nord"
  // resta com'e', perche' quello e' il suo nome italiano.
  if (subject !== 'inglese') {
    const tutti = [question, explanation, answer].concat(options || []).filter((v) => typeof v === 'string');
    const trovato = tutti.join(' | ').match(/\b(?:[Mm]are|mar)\s+(?:Mediterraneo|Adriatico|Tirreno|Ionio|Ligure|Rosso|Nero|Baltico|Caspio|Morto)\b/);
    if (trovato) {
      errors.push({ level: 'error', field: 'text', msg: `nome di mare non uniforme: "${trovato[0]}" (il corpus usa "Mar ...")` });
    }
    const nord = tutti.join(' | ').match(/\bMar\s+del\s+Nord\b/);
    if (nord) {
      errors.push({ level: 'error', field: 'text', msg: 'il nome italiano è "Mare del Nord", non "Mar del Nord"' });
    }
  }

  // Dal lotto 31: la spiegazione scrive il risultato con il punto delle
  // migliaia ("48 x 36 = 1.728") mentre l'opzione da scegliere e' "1728". Il
  // bambino confronta due stringhe diverse, e in italiano il punto separa
  // anche i decimali in altri contesti. Il controllo scatta solo quando il
  // numero senza punto e' davvero una delle opzioni, quindi le cifre grandi
  // che non compaiono fra le risposte (80.000 km di strade) restano libere.
  if (subject !== 'inglese' && Array.isArray(options) && explanation) {
    const opzioni = new Set(options.filter((o) => typeof o === 'string').map((o) => o.trim()));
    const disallineato = (explanation.match(/\b\d{1,3}\.\d{3}\b/g) || [])
      .find((n) => opzioni.has(n.replace(/\./g, '')));
    if (disallineato) {
      errors.push({ level: 'error', field: 'explanation', msg: `numero scritto "${disallineato}" nella spiegazione ma "${disallineato.replace(/\./g, '')}" fra le opzioni` });
    }
  }

  // Dal lotto 29: la domanda chiede quale opzione NON rientra in una categoria,
  // ma la spiegazione afferma che ci rientrano tutte ("Quale parola NON
  // appartiene alla famiglia di 'acqua'?" con "Tutte le parole appartengono
  // alla famiglia di 'acqua'"). Cosi' la domanda non ha nessuna risposta
  // giusta. E' il secondo caso del genere nella campagna, dopo quello del
  // lotto 23, e in tutti e due il segnale era la spiegazione che si
  // contraddiceva da sola.
  if (subject !== 'inglese' && /\bNON\b/.test(question || '')
      && /\b(?:Tutte|Tutti)\b[^.]{0,70}\b(?:appartengono|sono|hanno|derivano|contengono|indicano)\b/.test(explanation || '')) {
    errors.push({ level: 'error', field: 'explanation', msg: 'domanda che chiede quale opzione NON rientra, ma la spiegazione dice che ci rientrano tutte: nessuna risposta è giusta' });
  }

  // Dal lotto 25: la spiegazione ammette come valido anche un distrattore
  // ("prima vengono i nonni (o i bisnonni)" con "I bisnonni" fra le opzioni).
  // Se la spiegazione stessa concede l'alternativa, la domanda non ha una sola
  // risposta giusta. Serve il confronto con le opzioni, quindi sta qui e non
  // fra le regex di GRAMMATICA.
  if (subject !== 'inglese' && Array.isArray(options) && explanation) {
    const senzaSegni = (s) => String(s).toLowerCase().replace(/[^a-zà-ù ]+/g, ' ').replace(/\s+/g, ' ').trim();
    const distrattori = options.filter((o) => o !== answer).map(senzaSegni);
    for (const m of explanation.matchAll(/\((?:o|oppure)\s+([^)]{2,40})\)/gi)) {
      if (distrattori.includes(senzaSegni(m[1]))) {
        errors.push({ level: 'error', field: 'explanation', msg: `la spiegazione ammette come valido anche il distrattore "${m[1]}"` });
      }
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
