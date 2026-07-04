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
  ],
  banks: {
    colori: [
      { q: 'What colour is a strawberry?', a: 'red', d: ['green', 'black', 'blue'] },
      { q: 'What colour is the sun?', a: 'yellow', d: ['purple', 'black', 'orange'] },
      { q: 'What colour are clouds usually?', a: 'white', d: ['red', 'black', 'green'] },
      { q: 'What colour is the sun in many drawings?', a: 'yellow', d: ['black', 'pink', 'grey'] },
      { q: 'What colour is a tomato?', a: 'red', d: ['white', 'grey', 'brown'] },
      { q: 'What colour is chocolate?', a: 'brown', d: ['white', 'blue', 'pink'] }
    ],
    numeri: [
      { q: 'How do you say the number \'6\' in English?', a: 'six', d: ['sixteen', 'seven', 'sick'] },
      { q: 'How many legs does a cat have? Choose the correct English word?', a: 'four', d: ['two', 'three', 'five'] },
      { q: 'How do you say the number \'5\' in English?', a: 'five', d: ['four', 'six', 'nine'] },
      { q: 'What number comes after 7?', a: '8', d: ['6', '9', '10'] },
      { q: 'How do you say the number \'12\' in English?', a: 'twelve', d: ['twenty', 'two', 'ten'] },
      { q: 'How many fingers are on one hand?', a: '5', d: ['4', '6', '10'] }
    ],
    animali: [
      { q: 'Which animal is very tall and has a long neck?', a: 'giraffe', d: ['lion', 'rabbit', 'pig'] },
      { q: 'This animal has a very long neck. What is it?', a: 'giraffe', d: ['elephant', 'zebra', 'lion'] },
      { q: 'Complete: \'A bird can ___.\'', a: 'fly', d: ['swim', 'read', 'drive'] },
      { q: 'How do you say \'uccello\' in English?', a: 'bird', d: ['bear', 'bee', 'bull'] },
      { q: 'Which animal has long ears and likes carrots?', a: 'rabbit', d: ['lion', 'zebra', 'cow'] },
      { q: 'The cat is under the table.', a: 'Il gatto è sotto il tavolo.', d: ['So nuotare molto bene.', 'Lei ama le mele.', 'Noi beviamo acqua ogni giorno.'] }
    ],
    corpo_umano: [
      { q: 'Which part has teeth?', a: 'mouth', d: ['hand', 'foot', 'shoulder'] },
      { q: 'Which part do you use to see?', a: 'eyes', d: ['ears', 'hands', 'feet'] },
      { q: 'What do we use to see?', a: 'eyes', d: ['ears', 'hands', 'feet'] },
      { q: 'What do we use to hear?', a: 'ears', d: ['eyes', 'nose', 'mouth'] },
      { q: 'How do you say \'mano\' in English?', a: 'hand', d: ['foot', 'head', 'leg'] },
      { q: 'Which part do you clap?', a: 'hands', d: ['knees', 'shoulders', 'toes'] }
    ],
    famiglia: [
      { q: 'Your father\'s father is your...', a: 'grandfather', d: ['uncle', 'brother', 'cousin'] },
      { q: 'What is the English word for \'mamma\'?', a: 'mum', d: ['dad', 'brother', 'sister'] },
      { q: 'Your mother’s husband is your...', a: 'father', d: ['brother', 'cousin', 'uncle'] },
      { q: 'How do you say \'mamma\' in English?', a: 'mother', d: ['father', 'sister', 'brother'] },
      { q: 'What is the English word for \'papa\'?', a: 'dad', d: ['uncle', 'granddad', 'brother'] },
      { q: 'How do you say \'papà\' in English?', a: 'father', d: ['mother', 'brother', 'sister'] }
    ],
    saluti: [
      { q: 'What do you say when you leave school?', a: 'Goodbye', d: ['Thank you', 'Hello', 'Please'] },
      { q: 'Your friend is leaving. What do you say?', a: 'Goodbye', d: ['Hello', 'Good morning', 'Please'] },
      { q: 'What do you say before going to sleep?', a: 'Good night', d: ['Good morning', 'Hello', 'Please'] },
      { q: 'Someone asks \'How are you?\' You feel great. What do you answer?', a: 'I am fine, thank you', d: ['I am sad', 'Goodbye', 'My name is Tom'] },
      { q: 'What do you say after “Thank you”?', a: 'You’re welcome', d: ['Good night', 'Hello', 'See you tomorrow'] },
      { q: 'What do you say when someone helps you?', a: 'Thank you', d: ['Goodbye', 'Good night', 'Hello'] }
    ],
    giorni: [
      { q: 'Which day comes after \'Wednesday\'?', a: 'Thursday', d: ['Tuesday', 'Monday', 'Sunday'] },
      { q: 'Which is the first day of the school week in English?', a: 'Monday', d: ['Sunday', 'Friday', 'Saturday'] },
      { q: 'Which day comes after Saturday?', a: 'Sunday', d: ['Monday', 'Friday', 'Thursday'] },
      { q: 'What day comes before Friday?', a: 'Thursday', d: ['Monday', 'Saturday', 'Wednesday'] },
      { q: 'Which is a weekend day?', a: 'Sunday', d: ['Wednesday', 'Thursday', 'Tuesday'] },
      { q: 'What is the first day of the school week in Italy?', a: 'Monday', d: ['Sunday', 'Saturday', 'Friday'] }
    ],
    meteo: [
      { q: 'Which weather has a lot of rain?', a: 'rainy', d: ['sunny', 'hot', 'dry'] },
      { q: 'What do you say when it is raining?', a: 'It is rainy', d: ['It is sunny', 'It is windy', 'It is cold'] },
      { q: 'If you see lightning and hear thunder, it is...', a: 'stormy', d: ['sunny', 'snowy', 'hot'] },
      { q: 'If there are many clouds, the weather is...', a: 'cloudy', d: ['sunny', 'stormy', 'snowy'] },
      { q: 'What is the weather like when you need an umbrella?', a: 'rainy', d: ['sunny', 'snowy', 'windy'] },
      { q: 'If the wind is strong, it is...', a: 'windy', d: ['cloudy', 'rainy', 'foggy'] }
    ],
    cibo: [
      { q: 'Which food do hens give us?', a: 'eggs', d: ['rice', 'bread', 'soup'] },
      { q: 'Which drink is white and comes from cows?', a: 'milk', d: ['juice', 'tea', 'water'] },
      { q: 'We drink water every day.', a: 'Noi beviamo acqua ogni giorno.', d: ['Noi dormiamo tutto il giorno.', 'Noi mangiamo pizza ogni mattina.', 'Noi andiamo al mare in inverno.'] },
      { q: 'Which food is sweet?', a: 'cake', d: ['rice', 'fish', 'egg'] },
      { q: 'Which one is a drink?', a: 'water', d: ['bread', 'cheese', 'apple'] },
      { q: 'How do you say \'pane\' in English?', a: 'bread', d: ['meat', 'rice', 'egg'] }
    ],
    mesi: [
      { q: 'Which month is often linked to Christmas?', a: 'December', d: ['March', 'July', 'February'] },
      { q: 'Which month comes before November?', a: 'October', d: ['December', 'January', 'September'] },
      { q: 'Christmas is in which month?', a: 'December', d: ['October', 'November', 'January'] },
      { q: 'What is the first month of the year?', a: 'January', d: ['March', 'February', 'December'] },
      { q: 'How many months are in a year?', a: 'twelve', d: ['ten', 'eleven', 'thirteen'] },
      { q: 'January is the ... month of the year.', a: 'first', d: ['second', 'sixth', 'tenth'] }
    ],
    to_be: [
      { q: 'Complete: \'My parents ___ teachers.\'', a: 'are', d: ['am', 'is', 'be'] },
      { q: 'Complete: He ___ brave.', a: 'is', d: ['are', 'am', 'be'] },
      { q: 'Choose the correct form: \'She ___ my best friend.\'?', a: 'is', d: ['am', 'are', 'be'] },
      { q: 'Complete: We __ at school.', a: 'are', d: ['is', 'am', 'be'] },
      { q: 'Complete: I ___ quiet.', a: 'am', d: ['are', 'be', 'is'] },
      { q: 'Complete: I __ happy.', a: 'am', d: ['is', 'are', 'be'] }
    ],
    have_got: [
      { q: 'Complete: She has got long __.', a: 'hair', d: ['hairs', 'tooth', 'foots'] },
      { q: 'How many legs has a ant got?', a: 'six', d: ['four', 'two', 'eight'] },
      { q: 'Complete: My brother __ got a blue bag.', a: 'has', d: ['have', 'are', 'am'] },
      { q: 'Complete: \'We ___ got three cats at home.\'?', a: 'have', d: ['has', 'is', 'am'] },
      { q: 'How many legs has a frog got?', a: 'four', d: ['eight', 'two', 'ten'] },
      { q: 'Complete: The cat has got four __.', a: 'legs', d: ['leg', 'wing', 'tails'] }
    ],
    routine_quotidiana: [
      { q: 'When do you usually have lunch?', a: 'At noon or midday', d: ['In the morning', 'At night', 'At 7 am'] },
      { q: 'I have lunch at one. What do I do at one?', a: 'I have lunch.', d: ['I go to bed.', 'I go to school.', 'I have breakfast.'] },
      { q: 'I have breakfast at 7:30. What do I do at 7:30?', a: 'I have breakfast.', d: ['I go to school.', 'I play outside.', 'I wake up.'] },
      { q: 'What do you do in the morning when you wake up?', a: 'get up', d: ['go to sleep', 'watch TV at night', 'have dinner'] },
      { q: 'I have breakfast at seven.', a: 'Faccio colazione alle sette.', d: ['Faccio i compiti alle sette.', 'Vado a letto alle sette.', 'Esco di casa alle sette di sera.'] },
      { q: 'Which routine is usually before lunch?', a: 'go to school', d: ['go to bed', 'dream', 'sleep at night'] }
    ],
    casa: [
      { q: 'Where do you usually sleep at night?', a: 'in the bedroom', d: ['in the bathroom', 'in the kitchen', 'in the garden'] },
      { q: 'Which room is best for sleeping?', a: 'bedroom', d: ['bathroom', 'garage', 'kitchen'] },
      { q: 'Where do you cook food?', a: 'kitchen', d: ['bedroom', 'bathroom', 'garden'] },
      { q: 'Where do you wash your hands?', a: 'bathroom', d: ['garage', 'living room', 'balcony'] },
      { q: 'Which room has a table and chairs for meals?', a: 'kitchen', d: ['garage', 'bathroom', 'garden'] },
      { q: 'Where do you brush your teeth?', a: 'bathroom', d: ['living room', 'kitchen', 'garden'] }
    ],
    sport: [
      { q: 'Which sport do you do in a pool?', a: 'swimming', d: ['basketball', 'running', 'skating'] },
      { q: 'Where do you usually play basketball?', a: 'in the gym', d: ['in the garden', 'in the office', 'in the kitchen'] },
      { q: 'Which sport uses a racket?', a: 'tennis', d: ['football', 'swimming', 'running'] },
      { q: 'Which sport is played on a court with a net?', a: 'tennis', d: ['cycling', 'running', 'swimming'] },
      { q: 'Which sport do you do with ice skates?', a: 'skating', d: ['football', 'basketball', 'rugby'] },
      { q: 'What do you do with a ball in football?', a: 'kick', d: ['draw', 'sleep', 'sing'] }
    ],
    hobby: [
      { q: 'Which hobby is about taking pictures?', a: 'photography', d: ['swimming', 'dancing', 'drawing'] },
      { q: 'Which hobby is about reading books?', a: 'reading', d: ['dancing', 'singing', 'swimming'] },
      { q: 'Which hobby is about drawing pictures?', a: 'drawing', d: ['cooking', 'running', 'sleeping'] },
      { q: 'Which hobby is about collecting stamps?', a: 'collecting', d: ['reading', 'running', 'cooking'] },
      { q: 'Which hobby uses music and your voice?', a: 'singing', d: ['reading', 'drawing', 'cycling'] },
      { q: 'Complete: \'I like ___ books.\'', a: 'reading', d: ['eating', 'driving', 'flying'] }
    ],
    domande: [
      { q: 'Which question asks about a name?', a: 'What’s your name?', d: ['How old are you?', 'Where are you?', 'Do you like cats?'] },
      { q: 'Which question asks about well-being?', a: 'How are you?', d: ['What’s your name?', 'Where do you live?', 'How old are you?'] },
      { q: 'Which question asks the time?', a: 'What time is it?', d: ['Where are you?', 'Who is he?', 'What colour is it?'] },
      { q: 'Which answer matches “What’s your favourite sport?”', a: 'Basketball', d: ['In Turin', 'Ten years old', 'At five o’clock'] },
      { q: 'Which answer matches “Where do you live?”', a: 'In Turin', d: ['Blue', 'Football', 'Nine years old'] },
      { q: 'Which question asks about age?', a: 'How old are you?', d: ['What’s your favourite colour?', 'Where do you live?', 'What time is it?'] }
    ]
  }

};
