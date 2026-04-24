const __sa = window.SA = window.SA || {};
__sa.subjectConfig = {
  totalQ: 10,
  pointsPerQ: 10,
  lbKey: 'italiano_lb_v3',
  cursorKey: 'italiano_cursor_v3',
  defaultArea: 'mixed',
  questionsSource: {
    subject: 'italiano',
    path: 'json/index.json',
    areaField: 'subarea',
    areaMap: {
      oral: ['lingua', 'lessico'],
      read: ['lettura'],
      write: ['scrittura', 'ortografia'],
      gram: ['grammatica', 'morfologia', 'sintassi']
    }
  },
  bgIcons: ['📖', '✍️', '📝', '🔤', '💬', '📚'],
  feedbackOk: ['Esatto!', 'Ottimo!', 'Complimenti!', 'Continua così!'],
  feedbackKo: ['Riprova!', 'Quasi!', 'Ci siamo quasi!', 'Un altro tentativo!'],
  areas: [
    { key: 'mixed', label: 'Sessione mista', icon: '🎯', title: 'Sessione Mista', subtitle: 'Domande da tutti gli ambiti' },
    { key: 'oral', label: 'Ascolto e parlato', icon: '💬', title: 'Ascolto e Parlato', subtitle: 'Comunicazione orale' },
    { key: 'read', label: 'Lettura', icon: '📖', title: 'Lettura', subtitle: 'Comprensione del testo' },
    { key: 'write', label: 'Scrittura', icon: '✍️', title: 'Scrittura', subtitle: 'Produzione di testi' },
    { key: 'gram', label: 'Lessico e grammatica', icon: '🔤', title: 'Lessico e Grammatica', subtitle: 'Riflessione linguistica' }
  ],
  banks: {
    oral: [
      { q: 'Durante una conversazione in classe è corretto...', a: 'ascoltare e aspettare il proprio turno', d: ['interrompere sempre', 'parlare sopra gli altri', 'non ascoltare'] },
      { q: 'Quando racconti un fatto in modo chiaro è utile usare...', a: 'ordine degli eventi', d: ['frasi a caso', 'solo parole difficili', 'solo gesti'] },
      { q: "L'ascolto attivo significa...", a: 'capire e rispondere con attenzione', d: ['stare in silenzio senza seguire', 'guardare altrove', 'cambiare argomento subito'] },
      { q: 'In una discussione rispettosa conviene...', a: 'considerare anche idee diverse', d: ['deridere chi non la pensa uguale', 'urlare', 'uscire dalla classe'] },
      { q: 'Per fare una domanda chiara è importante...', a: 'usare parole precise', d: ['parlare velocissimo', 'usare solo gesti', 'non finire la frase'] },
      { q: 'Riassumere un racconto significa...', a: 'dire le informazioni principali', d: ['ripetere ogni parola', 'inventare un testo nuovo', 'cambiare lingua'] },
      { q: 'Quando ascolti una storia puoi capire meglio se...', a: 'riconosci personaggi e azioni', d: ['conti le lettere', 'misuri il foglio', 'colori il testo'] },
      { q: 'Parlare in modo adeguato alla situazione significa...', a: 'scegliere tono e parole adatte', d: ['usare sempre le stesse frasi', 'sussurrare sempre', 'gridare sempre'] },
      { q: 'Un buon intervento orale è...', a: "coerente con l'argomento", d: ['fuori tema', 'casuale', 'senza verbo'] },
      { q: 'Chiedere chiarimenti quando non capisci è...', a: 'utile e corretto', d: ['sbagliato', 'vietato', 'inutile'] },
      { q: 'Durante un dialogo, guardare chi parla aiuta a...', a: 'comprendere meglio', d: ['distrarsi', 'sbagliare apposta', 'cambiare storia'] },
      { q: 'Nel racconto orale, le parole prima-dopo-intanto servono a...', a: 'ordinare le azioni', d: ['misurare distanze', 'contare sillabe', 'descrivere colori'] }
    ],
    read: [
      { q: 'Leggere non significa solo pronunciare parole, ma anche...', a: 'capire il testo', d: ['colorare il foglio', 'scrivere numeri', 'contare righe'] },
      { q: 'Il titolo di un brano aiuta a...', a: "anticipare l'argomento", d: ['calcolare punteggi', 'scegliere la penna', 'misurare il tempo'] },
      { q: "Per trovare un'informazione specifica in un testo conviene...", a: 'rileggere i passaggi utili', d: ['saltare tutto', "guardare solo l'ultima parola", 'chiudere il libro'] },
      { q: 'La lettura silenziosa serve a...', a: 'comprendere con attenzione', d: ['parlare più forte', 'non capire', 'fare disegni'] },
      { q: 'Le parole sconosciute si possono capire anche...', a: 'dal contesto', d: ['a caso', 'ignorandole sempre', 'cambiando testo'] },
      { q: 'In un racconto, i personaggi sono...', a: 'chi compie le azioni', d: ['solo i titoli', 'solo i luoghi', 'solo le date'] },
      { q: 'La lettura espressiva ad alta voce richiede...', a: 'pause e intonazione adeguate', d: ['voce monotona sempre uguale', 'nessuna pausa', 'massima velocità'] },
      { q: 'Un testo informativo serve soprattutto a...', a: 'fornire notizie e spiegazioni', d: ['raccontare fiabe inventate', 'fare calcoli', 'disegnare mappe'] },
      { q: 'Per verificare la comprensione puoi...', a: 'rispondere a domande sul testo', d: ['copiarlo tutto', 'scrivere numeri casuali', 'cambiare argomento'] },
      { q: 'Leggere regolarmente aiuta ad arricchire...', a: 'lessico e idee', d: ['solo calligrafia', 'solo memoria dei numeri', 'solo velocità di corsa'] },
      { q: 'In una poesia, ritmo e suono delle parole sono...', a: 'elementi importanti', d: ['irrilevanti sempre', 'errori', 'solo decorazioni'] },
      { q: 'Se un testo ha inizio, sviluppo e conclusione, la struttura è...', a: 'organizzata', d: ['casuale', 'incompleta sempre', 'impossibile'] }
    ],
    write: [
      { q: 'Scrivere un testo chiaro richiede...', a: 'idee ordinate', d: ['frasi casuali', 'solo parole lunghe', 'solo maiuscole'] },
      { q: 'In un racconto, la sequenza corretta è spesso...', a: 'inizio, sviluppo, fine', d: ['fine, inizio, sviluppo', 'sviluppo, fine, inizio', 'non serve ordine'] },
      { q: 'La punteggiatura serve a...', a: 'rendere il testo comprensibile', d: ['decorare il foglio', 'allungare parole', 'sostituire i verbi'] },
      { q: 'Prendere appunti aiuta a...', a: 'ricordare informazioni importanti', d: ['dimenticare tutto', 'scrivere a caso', 'evitare la lettura'] },
      { q: 'Un testo descrittivo presenta soprattutto...', a: 'caratteristiche di persone, luoghi o oggetti', d: ['solo dialoghi', 'solo calcoli', 'solo date storiche'] },
      { q: 'Rivedere un testo prima di consegnarlo permette di...', a: 'correggere errori e migliorare chiarezza', d: ['aggiungere errori', 'cancellare tutto', 'saltare la conclusione'] },
      { q: 'La lettera o email a una persona reale ha scopo...', a: 'comunicativo', d: ['geografico', 'matematico', 'sportivo'] },
      { q: 'Per scrivere bene è utile anche...', a: 'leggere molto', d: ['evitare libri', 'non fare bozze', 'usare solo abbreviazioni'] },
      { q: 'Un testo argomentativo semplice contiene...', a: 'opinione e motivazioni', d: ['solo titolo', 'solo una parola', 'solo disegni'] },
      { q: 'Il capoverso serve a...', a: 'separare idee diverse', d: ['allungare il foglio', 'cambiare lingua', 'eliminare punti'] },
      { q: "Quando descrivi un'esperienza personale, è utile usare...", a: 'dettagli concreti', d: ['frasi senza senso', 'solo numeri', 'parole ripetute a caso'] },
      { q: 'Riscrivere un testo in modo più breve è una forma di...', a: 'rielaborazione', d: ['copia meccanica', 'traduzione numerica', 'distrazione'] }
    ],
    gram: [
      { q: 'Il verbo indica spesso...', a: 'azione o stato', d: ['solo colore', 'solo numero', 'solo luogo'] },
      { q: 'Nella frase "Il gatto corre", il verbo è...', a: 'corre', d: ['gatto', 'il', 'frase'] },
      { q: 'Il sinonimo di "felice" può essere...', a: 'contento', d: ['triste', 'lento', 'vuoto'] },
      { q: 'Il contrario di "alto" è...', a: 'basso', d: ['lungo', 'stretto', 'chiaro'] },
      { q: 'Il soggetto di una frase è...', a: "chi compie o subisce l'azione", d: ["sempre l'ultima parola", 'sempre un aggettivo', 'solo un avverbio'] },
      { q: 'Scegli la frase con accordo corretto:', a: 'Le bambine sono contente', d: ['Le bambine e contento', 'Le bambine e contente', 'Le bambina sono contente'] },
      { q: 'Una frase completa contiene almeno...', a: 'soggetto e predicato', d: ['solo articolo', 'solo punto finale', 'solo aggettivo'] },
      { q: 'Il dizionario aiuta a...', a: 'capire significato e uso delle parole', d: ['misurare peso', 'disegnare mappe', 'calcolare aree'] },
      { q: 'La parola "casa" al plurale diventa...', a: 'case', d: ['casi', 'caso', 'casas'] },
      { q: 'Nella frase "Marco legge un libro", il nome comune è...', a: 'libro', d: ['Marco', 'legge', 'un'] },
      { q: 'La virgola serve spesso a...', a: 'separare elementi o pause brevi', d: ['chiudere il testo sempre', 'sostituire il verbo', 'scrivere maiuscolo'] },
      { q: 'Riflettere sulle parole aiuta a...', a: 'migliorare precisione linguistica', d: ['dimenticare lessico', 'scrivere meno', 'evitare la lettura'] }
    ]
  },
  bonusQuestions: {
    easy: [
      { q: 'Bonus facile: quale parola è un verbo?', a: 'correre', d: ['rosso', 'tavolo', 'lento'] },
      { q: 'Bonus facile: il contrario di "caldo" è...', a: 'freddo', d: ['alto', 'chiaro', 'veloce'] },
      { q: 'Bonus facile: leggere un testo serve a...', a: 'capire un messaggio', d: ['colorare a caso', 'misurare il banco', 'fare somme'] },
      { q: 'Bonus facile: in una frase il punto finale indica...', a: "fine dell'enunciato", d: ['inizio titolo', 'domanda obbligatoria', 'errore ortografico'] }
    ],
    medium: [
      { q: 'Bonus medio: quale frase è scritta correttamente?', a: 'I bambini giocano in giardino.', d: ['I bambini gioca in giardino.', 'I bambini giocano in giardino', 'I bambini giocano In giardino'] },
      { q: 'Bonus medio: una sintesi efficace contiene...', a: 'idee principali senza dettagli inutili', d: ['tutte le parole del testo', 'solo il titolo', 'solo esempi casuali'] },
      { q: 'Bonus medio: per arricchire il lessico è utile...', a: 'leggere testi vari e usare il dizionario', d: ['ripetere sempre le stesse parole', 'evitare nuovi termini', 'scrivere senza rileggere'] },
      { q: 'Bonus medio: quale coppia è di sinonimi?', a: 'veloce-rapido', d: ['alto-basso', 'giorno-notte', 'chiuso-aperto'] }
    ],
    hard: [
      { q: 'Bonus difficile: quale opzione descrive meglio un testo argomentativo?', a: 'presenta una opinione con motivazioni', d: ['elenca solo nomi', 'descrive solo un luogo', 'riporta solo dialoghi'] },
      { q: 'Bonus difficile: nella frase "Ieri abbiamo letto una storia interessante", qual è il complemento oggetto?', a: 'una storia interessante', d: ['Ieri', 'abbiamo letto', 'noi (sottinteso)'] },
      { q: 'Bonus difficile: quale sequenza migliora la revisione di un testo?', a: 'controllo contenuto, ortografia, punteggiatura, chiarezza', d: ['punteggiatura e basta', 'solo titolo', 'nessuna revisione'] },
      { q: 'Bonus difficile: scegliere parole adatte al destinatario significa...', a: 'adattare registro e stile comunicativo', d: ['usare sempre parole difficili', 'scrivere identico in ogni situazione', 'eliminare la punteggiatura'] }
    ]
  }
};
window.SUBJECT_CONFIG = __sa.subjectConfig;
