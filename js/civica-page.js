const __sa = window.SA = window.SA || {};

__sa.subjectConfig = {
  subject: 'civica',
  totalQ: 10,
  pointsPerQ: 10,
  lbKey: 'educazioneCivica_lb_v1',
  cursorKey: 'educazioneCivica_cursor_v1',
  historyKey: 'educazioneCivica_history_v2',
  metricsKey: 'educazioneCivica_quality_v1',
  classPrefKey: 'educazioneCivica_class_pref_v1',
  defaultArea: 'mixed',
  questionsSource: {
    subject: 'civica',
    path: 'json/index.json',
    includeBonusRows: true,
    areaMap: {
      rules: 'costituzione_regole_comunita',
      env: 'ambiente_rispetto_terra',
      digital: 'cittadinanza_digitale_online',
      road: 'strada_gentilezza_sicurezza'
    }
  },
  bgIcons: ['🏛️', '📜', '🌍', '♻️', '💻', '🤝', '🚸', '🇮🇹', '💡'],
  feedbackOk: ['Esatto! 🎉', 'Ottimo! ⭐', 'Wow! 🌟', 'Giusto! ✅', 'Continua così! 🚀'],
  feedbackKo: ['Non è questa 🙂', 'Ecco la giusta ✨', 'Guarda qui sotto 👇'],
  areas: [
    {
      key: 'mixed',
      label: 'Sessione mista',
      icon: '🎯',
      title: 'Sessione mista',
      subtitle: 'Domande da tutti gli ambiti'
    },
    {
      key: 'rules',
      label: 'Costituzione e regole',
      icon: '📜',
      title: 'Costituzione e regole',
      subtitle: 'Vivere insieme'
    },
    {
      key: 'env',
      label: 'Ambiente',
      icon: '🌍',
      title: 'Ambiente',
      subtitle: 'Rispetto della Terra'
    },
    {
      key: 'digital',
      label: 'Cittadinanza digitale',
      icon: '💻',
      title: 'Cittadinanza digitale',
      subtitle: 'Comportamento online'
    },
    {
      key: 'road',
      label: 'Strada e gentilezza',
      icon: '🚸',
      title: 'Strada e gentilezza',
      subtitle: 'Sicurezza e rispetto'
    }
  ],
  classMeta: {
    2: { subtitle: 'Prime regole' },
    3: { subtitle: 'Regole e ambiente' },
    4: { subtitle: 'Scelte giuste' },
    5: { subtitle: 'Cittadini in azione' }
  },
  classProfiles: {
    2: { 2: 1 },
    3: { 2: 0.35, 3: 0.65 },
    4: { 2: 0.15, 3: 0.35, 4: 0.5 },
    5: { 3: 0.15, 4: 0.35, 5: 0.5 }
  },
  mixedRepeatLimit: 2,
  targetGradeWeight: 12,
  classDistanceWeight: 6,
  softmaxTemperature: 1.2,
  softmaxTopK: 6
};
