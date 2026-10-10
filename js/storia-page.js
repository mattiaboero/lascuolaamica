const __sa = window.SA = window.SA || {};
__sa.subjectConfig = {
  totalQ: 10,
  pointsPerQ: 10,
  lbKey: 'storia_lb_v3',
  cursorKey: 'storia_cursor_v3',
  defaultArea: 'mixed',
  questionsSource: {
    subject: 'storia',
    path: 'json/index.json',
    areaMap: {
      chrono: ['linea_del_tempo', 'tempo_strumenti'],
      sources: ['fonti_storiche', 'metodo_storico_fonti', 'fonti_linea_antiche_civilta'],
      periods: [
        'origine_terra_vita',
        'preistoria_paleolitico',
        'preistoria_neolitico_metalli',
        'egizi',
        'mesopotamia',
        'civilta_greca',
        'civilta_mediterranee',
        'altre_civilta_ebrei',
        'italia_antica_etruschi',
        'roma_monarchia',
        'roma_repubblica',
        'roma_impero_cristianesimo_fine'
      ],
      links: ['storia_personale_familiare', 'successione_contemporaneita', 'tempo_periodizzazione']
    }
  },
  bgIcons: ['📜', '🏺', '⏳', '🕰️', '📚', '🏛️'],
  feedbackOk: ['Esatto!', 'Ottimo!', 'Ben fatto!', 'Continua così!'],
  feedbackKo: ['Riprova!', 'Quasi!', 'Ci sei quasi!', 'Ritenta!'],
  areas: [
    { key: 'mixed', label: 'Sessione mista', icon: '🎯', title: 'Sessione Mista', subtitle: 'Domande da tutti gli ambiti' },
    { key: 'chrono', label: 'Cronologia', icon: '⏳', title: 'Cronologia', subtitle: 'Prima, dopo, linee del tempo' },
    { key: 'sources', label: 'Fonti storiche', icon: '📜', title: 'Fonti Storiche', subtitle: 'Documenti, tracce e testimonianze' },
    { key: 'periods', label: 'Periodizzazione', icon: '🕰️', title: 'Periodizzazione', subtitle: 'Epoche e civiltà' },
    { key: 'links', label: 'Passato e presente', icon: '🔎', title: 'Passato e Presente', subtitle: 'Cambiamenti nel tempo' }
  ]
};
