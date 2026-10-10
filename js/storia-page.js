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
  ],
  bonusQuestions: {
    easy: [
      { q: 'Bonus facile: cosa viene prima, ieri o oggi?', a: 'Ieri', d: ['Oggi', 'Domani', 'Dipende dal mese'] },
      { q: 'Bonus facile: un racconto dei nonni è una fonte...', a: 'orale', d: ['scritta', 'chimica', 'numerica'] },
      { q: 'Bonus facile: un secolo quanti anni dura?', a: '100', d: ['10', '50', '1000'] },
      { q: 'Bonus facile: una foto antica serve per conoscere...', a: 'il passato', d: ['il futuro certo', 'solo la geografia', 'solo la matematica'] }
    ],
    medium: [
      { q: 'Bonus medio: quale azione è più corretta quando due fonti non coincidono?', a: 'Confrontarle con altre prove', d: ['Sceglierne una a caso', 'Ignorarle entrambe', 'Usare solo la memoria'] },
      { q: 'Bonus medio: la periodizzazione serve soprattutto a...', a: 'organizzare e interpretare la storia', d: ['eliminare le date', 'sostituire le fonti', 'saltare gli eventi'] },
      { q: 'Bonus medio: qual è una fonte materiale?', a: 'Un vaso antico', d: ['Una formula', 'Una nuvola', 'Un pronostico'] },
      { q: 'Bonus medio: confrontare passato e presente aiuta a capire...', a: 'cambiamenti e permanenze', d: ['solo la cronologia futura', 'solo i nomi propri', 'solo i voti scolastici'] }
    ],
    hard: [
      { q: 'Bonus difficile: quale sequenza è cronologicamente corretta?', a: 'preistoria, età antica, medioevo, età moderna, età contemporanea', d: ['medioevo, preistoria, età antica, età moderna, contemporanea', 'età moderna, medioevo, preistoria, antica, contemporanea', 'preistoria, medioevo, antica, moderna, contemporanea'] },
      { q: 'Bonus difficile: se una testimonianza orale è in contrasto con un documento scritto, lo storico dovrebbe...', a: 'valutare attendibilità e contesto di entrambe', d: ['accettare solo la più recente', 'scartare tutte le fonti', 'scegliere quella più breve'] },
      { q: 'Bonus difficile: per ricostruire la storia del quartiere quale insieme di fonti è più adatto?', a: 'foto, mappe, testimonianze, documenti comunali', d: ['solo racconti inventati', 'solo risultati sportivi', 'solo previsioni meteo'] },
      { q: 'Bonus difficile: la storia come disciplina richiede soprattutto...', a: 'metodo di ricerca e interpretazione critica', d: ['memoria senza verifica', 'risposte immediate senza domande', 'solo elenco di date'] }
    ]
  }
};
