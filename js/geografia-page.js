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
  ]
};
