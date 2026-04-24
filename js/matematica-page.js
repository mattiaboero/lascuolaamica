const __sa = window.SA = window.SA || {};
__sa.subjectConfig = {
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
  banks: {
    tables: [
      { q: 'Quanto fa 7 x 6?', a: '42', d: ['36', '48', '56'] },
      { q: 'Quanto fa 8 x 4?', a: '32', d: ['28', '36', '24'] },
      { q: 'Quanto fa 9 x 3?', a: '27', d: ['21', '24', '30'] },
      { q: 'Quanto fa 5 x 8?', a: '40', d: ['35', '48', '45'] },
      { q: 'Quanto fa 6 x 6?', a: '36', d: ['30', '42', '32'] },
      { q: 'Quanto fa 4 x 9?', a: '36', d: ['45', '32', '34'] },
      { q: 'Quanto fa 3 x 7?', a: '21', d: ['24', '18', '27'] },
      { q: 'Quanto fa 2 x 8?', a: '16', d: ['14', '18', '12'] },
      { q: 'Quanto fa 10 x 7?', a: '70', d: ['60', '77', '80'] },
      { q: 'Quanto fa 11 x 3?', a: '33', d: ['31', '36', '30'] },
      { q: 'Quanto fa 12 x 2?', a: '24', d: ['22', '26', '20'] },
      { q: 'Quanto fa 9 x 9?', a: '81', d: ['72', '90', '79'] }
    ],
    arith: [
      { q: 'Qual è il doppio di 18?', a: '36', d: ['34', '28', '38'] },
      { q: 'Qual è la metà di 24?', a: '12', d: ['10', '14', '8'] },
      { q: 'Quanto fa 320 + 80?', a: '400', d: ['390', '410', '380'] },
      { q: 'Quanto fa 700 - 250?', a: '450', d: ['350', '500', '550'] },
      { q: 'Quale numero è maggiore?', a: '3,4', d: ['3,04', '3,14', '3,09'] },
      { q: '0,7 + 0,2 fa...', a: '0,9', d: ['0,72', '0,5', '0,12'] },
      { q: 'Qual è una frazione equivalente a 1/2?', a: '2/4', d: ['2/3', '3/8', '1/3'] },
      { q: 'Qual è il valore di 4 x (5 + 2)?', a: '28', d: ['22', '18', '30'] },
      { q: 'Quale numero è multiplo di 6?', a: '42', d: ['44', '45', '41'] },
      { q: 'Se moltiplichi 35 x 10 ottieni...', a: '350', d: ['35', '305', '360'] },
      { q: 'Se dividi 840 per 10 ottieni...', a: '84', d: ['8,4', '8400', '74'] },
      { q: 'Qual è il numero primo?', a: '29', d: ['21', '27', '33'] }
    ],
    problems: [
      { q: 'Sara ha 15 figurine e ne riceve 8. Quante figurine ha ora?', a: '23', d: ['22', '24', '21'] },
      { q: 'In una scatola ci sono 32 caramelle. Ne mangiano 9. Quante restano?', a: '23', d: ['21', '24', '22'] },
      { q: 'Un autobus ha 26 posti occupati e 14 liberi. Quanti posti ha in tutto?', a: '40', d: ['38', '42', '36'] },
      { q: 'Luca compra 3 quaderni da 4 euro ciascuno. Quanto spende?', a: '12', d: ['7', '16', '9'] },
      { q: 'Giulia ha 48 perline e le divide in 6 sacchetti uguali. Quante perline per sacchetto?', a: '8', d: ['6', '7', '9'] },
      { q: 'Una partita dura 90 minuti. Se ne sono passati 35, quanti minuti mancano?', a: '55', d: ['45', '65', '60'] },
      { q: 'Marta legge 12 pagine al giorno per 5 giorni. Quante pagine legge?', a: '60', d: ['50', '72', '48'] },
      { q: 'In classe ci sono 24 alunni. 13 sono presenti al mattino e 11 al pomeriggio. Quanti in tutto nei due momenti?', a: '24', d: ['22', '26', '20'] },
      { q: 'Un gioco costa 37 euro. Hai 25 euro. Quanti euro mancano?', a: '12', d: ['10', '11', '13'] },
      { q: 'Un contadino raccoglie 18 mele e 14 pere. Quanta frutta raccoglie in tutto?', a: '32', d: ['30', '34', '31'] },
      { q: 'Sono le 8:00. La lezione finisce alle 11:00. Quanto dura?', a: '3 ore', d: ['2 ore', '4 ore', '1 ora'] },
      { q: 'Hai 50 punti e ne perdi 17. Quanti punti restano?', a: '33', d: ['32', '34', '31'] }
    ],
    geo: [
      { q: 'Quanti lati ha un triangolo?', a: '3', d: ['4', '5', '2'] },
      { q: 'Quanti lati ha un rettangolo?', a: '4', d: ['3', '5', '6'] },
      { q: 'Perimetro di un quadrato con lato 6 cm?', a: '24 cm', d: ['12 cm', '18 cm', '30 cm'] },
      { q: 'Area di un rettangolo 5 x 3?', a: '15', d: ['8', '10', '18'] },
      { q: 'Due rette che non si incontrano mai sono...', a: 'parallele', d: ['incidenti', 'perpendicolari', 'oblique'] },
      { q: 'Un angolo retto misura...', a: '90°', d: ['45°', '180°', '60°'] },
      { q: '1 metro equivale a...', a: '100 centimetri', d: ['10 centimetri', '1000 centimetri', '50 centimetri'] },
      { q: '1 litro equivale a...', a: '1000 millilitri', d: ['100 millilitri', '10 millilitri', '10000 millilitri'] },
      { q: 'Quale figura ha tutte le facce quadrate?', a: 'Cubo', d: ['Sfera', 'Cilindro', 'Cono'] },
      { q: 'Il perimetro misura...', a: 'la lunghezza del contorno', d: ['lo spazio interno', 'il peso', "l'altezza"] },
      { q: 'Se ruoti una figura senza cambiarne forma fai una...', a: 'rotazione', d: ['simmetria assiale', 'traslazione in scala', 'divisione'] },
      { q: 'Quale unità usi per misurare una penna?', a: 'centimetri', d: ['litri', 'chilogrammi', 'gradi'] }
    ],
    logic: [
      { q: 'Completa la sequenza: 2, 4, 6, 8, ...', a: '10', d: ['9', '12', '7'] },
      { q: 'Quale parola NON appartiene al gruppo? quadrato, rettangolo, triangolo, banana', a: 'banana', d: ['quadrato', 'rettangolo', 'triangolo'] },
      { q: 'Lanci un dado normale. Ottenere 7 è...', a: 'impossibile', d: ['sicuro', 'probabile', 'possibile'] },
      { q: 'In un sacchetto ci sono solo palline rosse. Pescare una rossa è...', a: 'sicuro', d: ['impossibile', 'incerto', 'mai'] },
      { q: 'Se oggi è lunedì, domani è...', a: 'martedì', d: ['domenica', 'mercoledì', 'venerdì'] },
      { q: "Quale numero rende vera l'uguaglianza? 15 + __ = 20", a: '5', d: ['4', '3', '6'] },
      { q: 'In un grafico a barre, la barra più alta indica...', a: 'quantità maggiore', d: ['quantità minore', 'zero', 'errore'] },
      { q: 'Completa: 1, 3, 5, 7, ...', a: '9', d: ['8', '10', '11'] },
      { q: 'Quale scelta è una classificazione corretta?', a: 'Animali: mammiferi e uccelli', d: ['Animali: veloci e triangolo', 'Animali: acqua e lunedì', 'Animali: 2 e rosso'] },
      { q: 'Se in classe ci sono 12 femmine e 11 maschi, in totale sono...', a: '23', d: ['22', '24', '21'] },
      { q: 'In una tabella meteo, 0 mm di pioggia significa...', a: 'nessuna pioggia', d: ['pioggia forte', 'neve sicura', 'temporale'] },
      { q: 'Qual è la regola? 5, 10, 15, 20', a: 'Aggiungi 5', d: ['Raddoppia', 'Sottrai 5', 'Aggiungi 2'] }
    ]
  },
  bonusQuestions: {
    easy: [
      { q: 'Bonus facile: quanto fa 4 + 5?', a: '9', d: ['8', '10', '7'] },
      { q: 'Bonus facile: quanto fa 3 x 3?', a: '9', d: ['6', '12', '8'] },
      { q: 'Bonus facile: quale numero viene dopo 29?', a: '30', d: ['28', '31', '39'] },
      { q: 'Bonus facile: meta di 10?', a: '5', d: ['4', '6', '10'] }
    ],
    medium: [
      { q: 'Bonus medio: perimetro di un rettangolo con lati 7 e 3?', a: '20', d: ['21', '14', '10'] },
      { q: 'Bonus medio: 2/4 è equivalente a...', a: '1/2', d: ['1/4', '2/3', '3/4'] },
      { q: 'Bonus medio: 125 x 10 = ?', a: '1250', d: ['125', '250', '1205'] },
      { q: 'Bonus medio: 84 diviso 7 = ?', a: '12', d: ['11', '13', '10'] }
    ],
    hard: [
      { q: 'Bonus difficile: quale numero è contemporaneamente multiplo di 3 e di 4?', a: '24', d: ['18', '20', '27'] },
      { q: 'Bonus difficile: 2,5 + 1,75 = ?', a: '4,25', d: ['3,25', '4,5', '4,15'] },
      { q: 'Bonus difficile: area di un rettangolo 12 x 8?', a: '96', d: ['48', '88', '104'] },
      { q: 'Bonus difficile: in una classe 3/5 degli alunni sono 15. Quanti alunni ci sono in tutto?', a: '25', d: ['20', '30', '35'] }
    ]
  }
};
