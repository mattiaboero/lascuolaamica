const __sa = window.SA = window.SA || {};
__sa.subjectConfig = {
  classes: [1, 2, 3, 4, 5],
  totalQ: 10,
  pointsPerQ: 10,
  lbKey: 'matematica_programma_lb_v3',
  cursorKey: 'matematica_programma_cursor_v3',
  defaultArea: 'mixed',
  questionsSource: {
    subject: 'matematica',
    path: 'json/index.json',
    areaMap: {
      tables: 'tabelline',
      arith: 'aritmetica',
      problems: 'problemi',
      geo: 'geometria',
      logic: 'logica_e_dati'
    }
  },
  bgIcons: ['🔢', '📐', '📏', '🧮', '➗', '➕', '✖️'],
  feedbackOk: ['Esatto!', 'Wow!', 'Ottimo!', 'Continua così!'],
  feedbackKo: ['Riprova!', 'Quasi!', 'Non mollare!', 'Dai, ancora un tentativo!'],
  areas: [
    { key: 'mixed', label: 'Sessione mista', icon: '🎯', title: 'Sessione Mista', subtitle: 'Domande da tutti gli ambiti' },
    { key: 'tables', label: 'Tabelline', icon: '✖️', title: 'Tabelline', subtitle: 'Moltiplicazioni veloci' },
    { key: 'arith', label: 'Aritmetica', icon: '🧮', title: 'Aritmetica', subtitle: 'Numeri e calcolo' },
    { key: 'problems', label: 'Problemi', icon: '🧠', title: 'Problemi', subtitle: 'Testo e operazioni' },
    { key: 'geo', label: 'Geometria e misura', icon: '📐', title: 'Geometria e Misura', subtitle: 'Figure, perimetri, unità' },
    { key: 'logic', label: 'Logica e dati', icon: '📊', title: 'Logica e Dati', subtitle: 'Sequenze e probabilità' }
  ]
};
