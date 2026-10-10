const __sa = window.SA = window.SA || {};
__sa.subjectConfig = {
  totalQ: 10,
  pointsPerQ: 10,
  lbKey: 'geografia_lb_v3',
  cursorKey: 'geografia_cursor_v3',
  defaultArea: 'mixed',
  questionsSource: {
    subject: 'geografia',
    path: 'json/index.json',
    areaMap: {
      orient: ['orientamento', 'orientamento_mappe', 'strumenti_orientamento', 'geo_graficita'],
      maps: ['orientamento_carte', 'sistema_territoriale', 'territorio_sicurezza'],
      land: ['paesaggio', 'paesaggi_terra', 'paesaggi_acqua', 'antropico_ambiente', 'regioni_antropica'],
      it: ['italia_europa', 'territorio_italiano', 'geografia_fisica_italia', 'idrografia_clima_italia']
    }
  },
  bgIcons: ['🗺️', '🧭', '🌍', '🏞️', '🏔️', '🌊'],
  feedbackOk: ['Esatto!', 'Ottimo!', 'Benissimo!', 'Continua così!'],
  feedbackKo: ['Riprova!', 'Quasi!', 'Ci siamo quasi!', 'Un altro tentativo!'],
  areas: [
    { key: 'mixed', label: 'Sessione mista', icon: '🎯', title: 'Sessione Mista', subtitle: 'Domande da tutti gli ambiti' },
    { key: 'orient', label: 'Orientamento', icon: '🧭', title: 'Orientamento', subtitle: 'Punti cardinali e percorsi' },
    { key: 'maps', label: 'Carte e mappe', icon: '🗺️', title: 'Carte e Mappe', subtitle: 'Legende, simboli e scale' },
    { key: 'land', label: 'Paesaggi', icon: '🏞️', title: 'Paesaggi', subtitle: 'Elementi fisici e antropici' },
    { key: 'it', label: 'Italia e Europa', icon: '🇮🇹', title: 'Italia e Europa', subtitle: 'Territorio e relazioni' }
  ],
  bonusQuestions: {
    easy: [
      { q: 'Bonus facile: quali sono i quattro punti cardinali principali?', a: 'Nord, Sud, Est, Ovest', d: ['Nord, Ovest, Alto, Basso', 'Nord, Sud, Destra, Sinistra', 'Est, Ovest, Caldo, Freddo'] },
      { q: 'Bonus facile: la legenda si trova su...', a: 'mappa o carta geografica', d: ['calcolatrice', 'quaderno di musica', 'orologio'] },
      { q: 'Bonus facile: una montagna è un elemento...', a: 'fisico', d: ['antropico', 'digitale', 'stradale'] },
      { q: 'Bonus facile: Italia è in...', a: 'Europa', d: ['Africa', 'America', 'Asia'] }
    ],
    medium: [
      { q: 'Bonus medio: in una carta, 1 cm rappresenta 1 km reali. Questa informazione è...', a: 'la scala', d: ['la legenda sonora', 'la latitudine media', 'la quota termica'] },
      { q: 'Bonus medio: un territorio con fiumi e suolo fertile favorisce...', a: 'agricoltura', d: ['assenza totale di vita', 'solo traffico aereo', 'nessuna attività economica'] },
      { q: 'Bonus medio: quale coppia contiene solo elementi antropici?', a: 'strada e ponte', d: ['fiume e ponte', 'bosco e collina', 'mare e lago'] },
      { q: 'Bonus medio: se guardi il sole a mezzogiorno in Italia, in genere è verso...', a: 'sud', d: ['nord', 'ovest', 'est'] }
    ],
    hard: [
      { q: 'Bonus difficile: per studiare le differenze di popolazione tra regioni quale carta scegli?', a: 'Carta tematica demografica', d: ['Carta fisica dei rilievi', "Pianta dell'aula", 'Carta nautica senza dati'] },
      { q: 'Bonus difficile: un territorio costiero con porto e rete stradale favorisce soprattutto...', a: 'scambi commerciali', d: ['isolamento totale', 'scomparsa dei trasporti', 'assenza di attività umane'] },
      { q: 'Bonus difficile: qual è la sequenza corretta da piccolo a grande?', a: 'quartiere, città, regione, stato, continente', d: ['città, quartiere, continente, regione, stato', 'regione, strada, quartiere, pianeta, città', 'stato, quartiere, continente, casa, regione'] },
      { q: 'Bonus difficile: due carte della stessa zona con scale diverse mostrano che...', a: 'più grande scala = più dettagli', d: ['più grande scala = meno dettagli', 'la scala non cambia nulla', 'scala e legenda sono uguali sempre'] }
    ]
  }
};
