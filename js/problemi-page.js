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
  banks: {
    problemi: [
      { q: 'Il fornaio ha sfornato 36 brioches. Le mette in confezioni da 6. Quante confezioni riesce a fare?', a: '6', d: ['7', '1', '3'] },
      { q: 'Martina fa 5 pagine di matematica e 8 pagine di italiano. Quante pagine ha fatto in tutto?', a: '13', d: ['11', '19', '6'] },
      { q: 'Sul prato ci sono 49 uccellini. 37 se ne vanno. Quanti uccellini rimangono?', a: '12', d: ['13', '4', '9'] },
      { q: 'Il fornaio ha sfornato 24 croissant. Le mette in confezioni da 2. Quante confezioni riesce a fare?', a: '12', d: ['13', '15', '2'] },
      { q: 'Una confezione contiene 7 penne. Quante penne ci sono in 6 confezioni?', a: '42', d: ['13', '36', '48'] },
      { q: 'Nel cortile di Simone ci sono 30 anatroccoli. Arrivano altri 15. Quanti anatroccoli ci sono in tutto?', a: '45', d: ['42', '49', '48'] },
      { q: 'In cartoleria ogni penn costa 10 euro. Matteo ne compra 9. Quanto spende in tutto?', a: '90', d: ['112', '78', '96'] },
      { q: 'Sara ha 65 figurine e ne riceve 8. Quante figurine ha ora?', a: '73', d: ['77', '76', '68'] },
      { q: 'Elena fa 20 pagine di matematica e 11 pagine di italiano. Quante pagine ha fatto in tutto?', a: '31', d: ['46', '39', '38'] },
      { q: 'Una scuola ha 689 alunni. 292 sono in gita. Quanti sono rimasti a scuola?', a: '397', d: ['297', '1191', '403'] },
      { q: 'La mamma di Roberta ha 21 ciliegine e ha invitato 6 amici di Roberta. Quante ciliegine riceve ogni bambino se li divide in parti uguali?', a: '3', d: ['6', '21', '7'] },
      { q: 'In una biblioteca entrano 143 persone la mattina, 89 il pomeriggio e 54 la sera. Quante persone entrano in tutto?', a: '286', d: ['276', '296', '256'] },
      { q: 'Un bambino ha 96 mattoncini Lego. Li divide in 8 gruppi uguali e poi aggiunge 5 mattoncini a ogni gruppo. Quanti mattoncini ci sono per ogni gruppo?', a: '17', d: ['12', '14', '21'] },
      { q: 'In classe ci sono 32 squadre. I bambini ne usano 22. Quante squadre restano inutilizzate?', a: '10', d: ['1', '19', '14'] },
      { q: 'Una libreria ha 46 libri sullo scaffale in alto e 30 su quello in basso. Quanti libri in tutto?', a: '76', d: ['16', '86', '70'] },
      { q: 'Nel cortile di Chiara ci sono 33 uccellini. Arrivano altri 5. Quanti uccellini ci sono in tutto?', a: '38', d: ['47', '42', '23'] },
      { q: 'Un album costa 12 euro. Marco paga con 20 euro. Quanto resto riceve?', a: '8 euro', d: ['7 euro', '10 euro', '6 euro'] },
      { q: 'Sul treno salgono 267 persone. A una fermata ne scendono 94. Quante persone restano sul treno?', a: '173', d: ['163', '361', '183'] },
      { q: 'Il fornaio ha sfornato 16 muffin. Le mette in confezioni da 2. Quante confezioni riesce a fare?', a: '8', d: ['5', '12', '17'] },
      { q: 'Luca ha 17 pastelli. La maestra gliene regala altri 23. Quanti pastelli ha adesso?', a: '40', d: ['25', '30', '34'] }
    ]
  }
,
  classMeta: {
    2: { subtitle: 'Problemi base' },
    3: { subtitle: 'Addizione e sottrazione' },
    4: { subtitle: 'Piu passaggi' },
    5: { subtitle: 'Problemi avanzati' }
  },
  softmaxTemperature: 1.2
};
