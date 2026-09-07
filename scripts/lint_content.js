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
  { pattern: /\b(?:primo|ultimo)\s+elemento\s+è\s+(?!['"])|successione corretta,\s+(?!['"])/,
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
        const doppia = options.filter((o) => typeof o === 'string')
          .find((o) => new RegExp(`^\\s*(?:solo\\s+|soltanto\\s+|sempre\\s+)?(?:${BASI[base]})\\s`, 'i').test(o));
        if (doppia) {
          errors.push({ level: 'error', field: 'options', msg: `preposizione ripetuta fra la domanda ("${fine[1]}...") e l'opzione ("${doppia}")` });
        }
      }
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
