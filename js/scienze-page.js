const __sa = window.SA = window.SA || {};
__sa.subjectConfig = {
  totalQ: 10,
  pointsPerQ: 10,
  lbKey: 'scienze_lb_v3',
  cursorKey: 'scienze_cursor_v3',
  defaultArea: 'mixed',
  questionsSource: {
    subject: 'scienze',
    path: 'json/index.json',
    areaMap: {
      phys: [
        'materia_energia_fenomeni',
        'materia_materiali',
        'materia_materiali_trasformazioni',
        'forze_luce_suono',
        'aria_acqua_suolo_materia',
        'metodo_scientifico'
      ],
      env: ['ecosistemi_ambiente', 'terra_stagioni_ambiente', 'viventi_ambiente', 'astronomia_terra'],
      life: ['viventi_biologia', 'viventi_non_viventi'],
      human: ['corpo_umano_salute', 'scienza_tecnologia']
    }
  },
  bgIcons: ['🔬', '🧪', '🌱', '🧠', '🌧️', '☀️'],
  feedbackOk: ['Esatto!', 'Ottimo!', 'Benissimo!', 'Continua così!'],
  feedbackKo: ['Riprova!', 'Quasi!', 'Ci siamo quasi!', 'Un altro tentativo!'],
  areas: [
    { key: 'mixed', label: 'Sessione mista', icon: '🎯', title: 'Sessione Mista', subtitle: 'Domande da tutti gli ambiti' },
    { key: 'phys', label: 'Fenomeni fisici', icon: '🧪', title: 'Fenomeni Fisici e Chimici', subtitle: 'Materia, energia e trasformazioni' },
    { key: 'env', label: 'Ambienti e cicli', icon: '🌦️', title: 'Ambienti e Cicli', subtitle: 'Acqua, stagioni, ecosistemi' },
    { key: 'life', label: 'Viventi e corpo', icon: '🧬', title: 'Viventi e Corpo Umano', subtitle: 'Piante, animali e salute' },
    { key: 'human', label: 'Uomo e natura', icon: '♻️', title: 'Uomo, Natura e Tecnologia', subtitle: 'Risorse, prevenzione, rispetto' }
  ]
};
