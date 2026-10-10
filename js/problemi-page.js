const __sa = window.SA = window.SA || {};

__sa.subjectConfig = {
  subject: 'problemi',
  totalQ: 10,
  pointsPerQ: 10,
  lbKey: 'problemiMatematica_lb_v1',
  cursorKey: 'problemiMatematica_cursor_v1',
  historyKey: 'problemiMatematica_history_v2',
  metricsKey: 'problemiMatematica_quality_v1',
  classPrefKey: 'problemiMatematica_class_pref_v1',
  leaderboardAreaFallback: 'Problemi',
  defaultArea: 'problemi',
  questionsSource: {
    subject: 'problemi',
    path: 'json/index.json',
    includeBonusRows: true
  },
  answerMode: 'numeric',
  bgIcons: ['🧠', '📘', '📐', '🧩', '✏️', '🔢', '📏', '💡'],
  feedbackOk: ['Esatto! 🎉', 'Ottimo! ⭐', 'Wow! 🌟', 'Giusto! ✅', 'Continua così! 🚀'],
  feedbackKo: ['Riprova! 💪', 'Quasi! ✨', 'Non mollare! 🌈'],
  areas: [
    {
      key: 'problemi',
      label: 'Problemi',
      icon: '🧠',
      title: 'Problemi',
      subtitle: 'Testo e operazioni'
    }
  ],
  classMeta: {
    2: { subtitle: 'Problemi base' },
    3: { subtitle: 'Addizione e sottrazione' },
    4: { subtitle: 'Piu passaggi' },
    5: { subtitle: 'Problemi avanzati' }
  },
  softmaxTemperature: 1.2
};
