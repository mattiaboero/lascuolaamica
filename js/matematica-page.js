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
  ],
  bonusQuestions: {
    easy: [
      { q: 'Bonus facile: quanto fa 4 + 5?', a: '9', d: ['8', '10', '7'] },
      { q: 'Bonus facile: quanto fa 3 x 3?', a: '9', d: ['6', '12', '8'] },
      { q: 'Bonus facile: quale numero viene dopo 29?', a: '30', d: ['28', '31', '39'] },
      { q: 'Bonus facile: meta di 10?', a: '5', d: ['4', '6', '10'] },
      // grade: 1 = bonus della 1ª, che non vede gli altri (fitsClassOneRule)
      { q: 'Bonus facile: quanto fa 3 + 2?', a: '5', d: ['4', '6', '3'], grade: 1 },
      { q: 'Bonus facile: quale numero viene dopo 9?', a: '10', d: ['8', '11', '19'], grade: 1 }
    ],
    medium: [
      { q: 'Bonus medio: perimetro di un rettangolo con lati 7 e 3?', a: '20', d: ['21', '14', '10'] },
      { q: 'Bonus medio: 2/4 è equivalente a...', a: '1/2', d: ['1/4', '2/3', '3/4'] },
      { q: 'Bonus medio: 125 x 10 = ?', a: '1250', d: ['125', '250', '1205'] },
      { q: 'Bonus medio: 84 diviso 7 = ?', a: '12', d: ['11', '13', '10'] },
      { q: 'Bonus medio: quanto fa 8 + 5?', a: '13', d: ['12', '14', '3'], grade: 1 }
    ],
    hard: [
      { q: 'Bonus difficile: quale numero è contemporaneamente multiplo di 3 e di 4?', a: '24', d: ['18', '20', '27'] },
      { q: 'Bonus difficile: 2,5 + 1,75 = ?', a: '4,25', d: ['3,25', '4,5', '4,15'] },
      { q: 'Bonus difficile: area di un rettangolo 12 x 8?', a: '96', d: ['48', '88', '104'] },
      { q: 'Bonus difficile: in una classe 3/5 degli alunni sono 15. Quanti alunni ci sono in tutto?', a: '25', d: ['20', '30', '35'] },
      { q: 'Bonus difficile: quanto fa 15 - 7?', a: '8', d: ['7', '9', '22'], grade: 1 }
    ]
  }
};
