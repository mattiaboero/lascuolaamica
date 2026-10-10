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
  ],
  bonusQuestions: {
    easy: [
      { q: "Bonus facile: l'acqua ghiacciata è allo stato...", a: 'solido', d: ['liquido', 'gassoso', 'plasma'] },
      { q: 'Bonus facile: quale organo pompa il sangue?', a: 'Cuore', d: ['Polmone', 'Stomaco', 'Fegato'] },
      { q: 'Bonus facile: le piante hanno bisogno di luce per...', a: 'fotosintesi', d: ['correre', 'nuotare', 'volare'] },
      { q: 'Bonus facile: differenziare i rifiuti serve a...', a: 'riciclare', d: ['sprecare', 'inquinare', 'nascondere'] }
    ],
    medium: [
      { q: 'Bonus medio: in un circuito semplice, se interrompi un filo la lampadina...', a: 'si spegne', d: ['diventa più luminosa', 'cambia colore da sola', 'suona'] },
      { q: "Bonus medio: nel ciclo dell'acqua, dopo evaporazione e condensazione avviene...", a: 'precipitazione', d: ['fotosintesi', 'combustione', 'fusione'] },
      { q: 'Bonus medio: quale scelta aiuta di più la salute?', a: 'mangiare vario e fare attività fisica', d: ['saltare sempre colazione', 'bere solo bibite zuccherate', 'dormire pochissimo'] },
      { q: 'Bonus medio: produttori, consumatori e decompositori descrivono...', a: 'relazioni in ecosistema', d: ['tipi di strumenti musicali', 'forme geometriche', 'periodi storici'] }
    ],
    hard: [
      { q: 'Bonus difficile: una miscela di acqua e sabbia si separa meglio con...', a: 'filtrazione', d: ['fotosintesi', 'fermentazione', 'ossidazione'] },
      { q: 'Bonus difficile: per ridurre rischio idrico in città è utile soprattutto...', a: 'mantenere puliti canali e suolo permeabile', d: ['cementificare tutto', 'gettare rifiuti nei tombini', 'chiudere parchi urbani'] },
      { q: 'Bonus difficile: quale sequenza è corretta in una catena alimentare semplice?', a: 'erba, coniglio, volpe', d: ['volpe, erba, coniglio', 'coniglio, volpe, erba', 'erba, volpe, coniglio'] },
      { q: 'Bonus difficile: un esperimento scientifico affidabile richiede...', a: 'osservazione, misura e verifica', d: ['solo intuizione', 'solo velocità', 'nessuna registrazione dati'] }
    ]
  }
};
