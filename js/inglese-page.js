const __sa = window.SA = window.SA || {};

__sa.subjectConfig = {
  subject: 'inglese',
  totalQ: 10,
  pointsPerQ: 10,
  lbKey: 'englishAdventure_lb_v2',
  cursorKey: 'englishAdventure_cursor_v1',
  historyKey: 'englishAdventure_history_v2',
  metricsKey: 'englishAdventure_quality_v1',
  classPrefKey: 'englishAdventure_class_pref_v1',
  leaderboardAreaFallback: 'Livello',
  defaultArea: 'mixed',
  questionsSource: {
    subject: 'inglese',
    path: 'json/index.json',
    includeBonusRows: true
  },
  answerMode: 'mcq',
  renderMode: 'bilingual',
  maxLevelDistance: 2,
  maxGradeDistance: 1,
  mixedRepeatLimit: 2,
  softmaxTemperature: 1.2,
  softmaxTopK: 6,
  bonusLabels: {
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard'
  },
  bgIcons: ['🔤', '📚', '✏️', '📝', '🌍', '🗣️', '🎯'],
  feedbackOk: ['Esatto! 🎉', 'Complimenti! ⭐', 'Wow! 🌟', 'Yes! 🎊', 'Super! 💪', 'Continua così! 🚀', 'Top! 🔥'],
  feedbackKo: ['Quasi! 😅', 'Try again! 💪', 'Non mollare! 🌈', 'Keep going! ✨'],
  classMeta: {
    2: { subtitle: 'Prime parole' },
    3: { subtitle: 'Lessico e frasi' },
    4: { subtitle: 'Costruzione frasi' },
    5: { subtitle: 'Comprensione avanzata' }
  },
  classProfiles: {
    2: { 2: 1 },
    3: { 2: 0.35, 3: 0.65 },
    4: { 3: 0.4, 4: 0.6 },
    5: { 4: 0.35, 5: 0.65 }
  },
  levels: [
    {
      key: 1,
      label: 'Principiante',
      icon: '🌊',
      subtitle: 'Percorso base',
      topics: 'Colori · Numeri · Animali · Famiglia · Saluti',
      filters: {
        subareas: ['lessico_base'],
        areas: ['colori', 'numeri', 'animali', 'famiglia', 'saluti'],
        fallbackDifficulty: [1]
      }
    },
    {
      key: 2,
      label: 'Esploratore',
      icon: '🤿',
      subtitle: 'Percorso intermedio',
      topics: 'Giorni · Meteo · Cibo · Mesi · Verbo to be e have got',
      filters: {
        subareas: ['frasi_semplici'],
        areas: ['giorni', 'meteo', 'cibo', 'mesi', 'have_got', 'to_be', 'routine_quotidiana'],
        fallbackDifficulty: [2]
      }
    },
    {
      key: 3,
      label: 'Campione',
      icon: '🦈',
      subtitle: 'Percorso avanzato',
      topics: 'Routine quotidiana · Sport · Casa · Domande · Hobby',
      filters: {
        subareas: ['uso_guidato', 'comprensione_in_contesto'],
        areas: ['routine_quotidiana', 'sport', 'casa', 'domande', 'hobby'],
        fallbackDifficulty: [4]
      }
    }
  ],
  areas: [
    { key: 'mixed', label: 'Sessione mista', icon: '🎯', title: 'Sessione Mista', subtitle: 'Domande da tutte le aree del livello' },
    { key: 'animali', label: 'Animali', icon: '🐾', title: 'Animali', subtitle: 'Lessico e comprensione' },
    { key: 'casa', label: 'Casa', icon: '🏠', title: 'Casa', subtitle: 'Stanze e oggetti' },
    { key: 'cibo', label: 'Cibo', icon: '🍎', title: 'Cibo', subtitle: 'Parole di ogni giorno' },
    { key: 'colori', label: 'Colori', icon: '🎨', title: 'Colori', subtitle: 'Vocabulary base' },
    { key: 'corpo_umano', label: 'Corpo umano', icon: '🧍', title: 'Corpo umano', subtitle: 'Parti del corpo' },
    { key: 'domande', label: 'Domande', icon: '❓', title: 'Domande', subtitle: 'Question forms' },
    { key: 'famiglia', label: 'Famiglia', icon: '👨‍👩‍👧', title: 'Famiglia', subtitle: 'Parenti e relazioni' },
    { key: 'giorni', label: 'Giorni', icon: '📅', title: 'Giorni', subtitle: 'Settimana e routine' },
    { key: 'have_got', label: 'Have got', icon: '🧩', title: 'Have got', subtitle: 'Possesso e descrizioni' },
    { key: 'hobby', label: 'Hobby', icon: '🎯', title: 'Hobby', subtitle: 'Tempo libero' },
    { key: 'mesi', label: 'Mesi', icon: '🗓️', title: 'Mesi', subtitle: 'Calendario e stagioni' },
    { key: 'meteo', label: 'Meteo', icon: '🌦️', title: 'Meteo', subtitle: 'Weather words' },
    { key: 'numeri', label: 'Numeri', icon: '🔢', title: 'Numeri', subtitle: 'Count and compare' },
    { key: 'routine_quotidiana', label: 'Routine quotidiana', icon: '⏰', title: 'Routine quotidiana', subtitle: 'Daily routine' },
    { key: 'saluti', label: 'Saluti', icon: '👋', title: 'Saluti', subtitle: 'Greetings and manners' },
    { key: 'sport', label: 'Sport', icon: '⚽', title: 'Sport', subtitle: 'Azioni e preferenze' },
    { key: 'to_be', label: 'To be', icon: '🔤', title: 'To be', subtitle: 'Verbo essere' }
  ]
};
