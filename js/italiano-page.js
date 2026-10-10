const __sa = window.SA = window.SA || {};
__sa.subjectConfig = {
  totalQ: 10,
  pointsPerQ: 10,
  lbKey: 'italiano_lb_v3',
  cursorKey: 'italiano_cursor_v3',
  defaultArea: 'mixed',
  questionsSource: {
    subject: 'italiano',
    path: 'json/index.json',
    areaField: 'subarea',
    areaMap: {
      oral: ['lingua', 'lessico'],
      read: ['lettura'],
      write: ['scrittura', 'ortografia', 'alfabeto'],
      gram: ['grammatica', 'morfologia', 'sintassi', 'riflessione_sulla_lingua']
    }
  },
  bgIcons: ['📖', '✍️', '📝', '🔤', '💬', '📚'],
  feedbackOk: ['Esatto!', 'Ottimo!', 'Complimenti!', 'Continua così!'],
  feedbackKo: ['Riprova!', 'Quasi!', 'Ci siamo quasi!', 'Un altro tentativo!'],
  areas: [
    { key: 'mixed', label: 'Sessione mista', icon: '🎯', title: 'Sessione Mista', subtitle: 'Domande da tutti gli ambiti' },
    { key: 'oral', label: 'Ascolto e parlato', icon: '💬', title: 'Ascolto e Parlato', subtitle: 'Comunicazione orale' },
    { key: 'read', label: 'Lettura', icon: '📖', title: 'Lettura', subtitle: 'Comprensione del testo' },
    { key: 'write', label: 'Scrittura', icon: '✍️', title: 'Scrittura', subtitle: 'Produzione di testi' },
    { key: 'gram', label: 'Lessico e grammatica', icon: '🔤', title: 'Lessico e Grammatica', subtitle: 'Riflessione linguistica' }
  ]
};
