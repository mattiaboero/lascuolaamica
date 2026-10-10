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
      write: ['scrittura', 'ortografia', 'alfabeto'],
      gram: ['grammatica', 'morfologia', 'sintassi', 'riflessione_sulla_lingua']
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
