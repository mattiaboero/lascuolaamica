const __sa = window.SA = window.SA || {};
__sa.subjectConfig = {
  totalQ: 10,
  pointsPerQ: 10,
  lbKey: 'storia_lb_v3',
  cursorKey: 'storia_cursor_v3',
  defaultArea: 'mixed',
  questionsSource: {
    subject: 'storia',
    path: 'json/index.json',
    areaMap: {
      chrono: ['linea_del_tempo', 'tempo_strumenti'],
      sources: ['fonti_storiche', 'metodo_storico_fonti', 'fonti_linea_antiche_civilta'],
      periods: [
        'origine_terra_vita',
        'preistoria_paleolitico',
        'preistoria_neolitico_metalli',
        'egizi',
        'mesopotamia',
        'civilta_greca',
        'civilta_mediterranee',
        'altre_civilta_ebrei',
        'italia_antica_etruschi',
        'roma_monarchia',
        'roma_repubblica',
        'roma_impero_cristianesimo_fine'
      ],
      links: ['storia_personale_familiare', 'successione_contemporaneita', 'tempo_periodizzazione']
    }
  },
  bgIcons: ['📜', '🏺', '⏳', '🕰️', '📚', '🏛️'],
  feedbackOk: ['Esatto!', 'Ottimo!', 'Ben fatto!', 'Continua così!'],
  feedbackKo: ['Riprova!', 'Quasi!', 'Ci sei quasi!', 'Ritenta!'],
  areas: [
    { key: 'mixed', label: 'Sessione mista', icon: '🎯', title: 'Sessione Mista', subtitle: 'Domande da tutti gli ambiti' },
    { key: 'chrono', label: 'Cronologia', icon: '⏳', title: 'Cronologia', subtitle: 'Prima, dopo, linee del tempo' },
    { key: 'sources', label: 'Fonti storiche', icon: '📜', title: 'Fonti Storiche', subtitle: 'Documenti, tracce e testimonianze' },
    { key: 'periods', label: 'Periodizzazione', icon: '🕰️', title: 'Periodizzazione', subtitle: 'Epoche e civiltà' },
    { key: 'links', label: 'Passato e presente', icon: '🔎', title: 'Passato e Presente', subtitle: 'Cambiamenti nel tempo' }
  ],
  banks: {
    chrono: [
      { q: 'Nella linea del tempo, un evento del 2010 viene prima o dopo il 2005?', a: 'Dopo', d: ['Prima', 'Nello stesso anno', 'Impossibile dirlo'] },
      { q: 'La parola "prima" indica...', a: 'un evento precedente', d: ['un evento futuro', 'un luogo', 'una fonte'] },
      { q: 'La parola "dopo" indica...', a: 'un evento successivo', d: ['un evento precedente', 'un continente', 'una misura'] },
      { q: 'Ordinare gli eventi nel tempo significa fare...', a: 'cronologia', d: ['geometria', 'cartografia', 'musica'] },
      { q: 'Se il nonno nasce prima del papà, appartiene a una generazione...', a: 'precedente', d: ['successiva', 'uguale', 'futura'] },
      { q: 'In una giornata: mattina, pomeriggio, sera. Cosa viene dopo il pomeriggio?', a: 'sera', d: ['notte precedente', 'mattina', 'alba'] },
      { q: 'Un calendario aiuta a capire...', a: 'la successione dei giorni', d: ['solo il meteo', 'solo i colori', 'solo i voti'] },
      { q: "L'ordine corretto è...", a: 'ieri, oggi, domani', d: ['domani, oggi, ieri', 'oggi, ieri, domani', 'ieri, domani, oggi'] },
      { q: 'Per confrontare due fatti nel tempo usi...', a: 'date e periodi', d: ['solo immagini', 'solo colori', 'solo suoni'] },
      { q: 'Una linea del tempo serve a...', a: 'visualizzare eventi in ordine', d: ['calcolare aree', 'misurare peso', 'trovare coordinate'] },
      { q: 'Se un evento è del secolo scorso, è rispetto a oggi...', a: 'nel passato', d: ['nel futuro', 'nel presente assoluto', 'fuori dal tempo'] },
      { q: 'Un decennio corrisponde a...', a: '10 anni', d: ['100 anni', '5 anni', '50 anni'] }
    ],
    sources: [
      { q: 'Una fotografia antica è una...', a: 'fonte storica', d: ['formula matematica', 'figura geometrica', 'tabella meteo'] },
      { q: 'Un diario scritto anni fa è una fonte...', a: 'scritta', d: ['orale', 'naturale', 'astratta'] },
      { q: 'Un racconto dei nonni sul passato è una fonte...', a: 'orale', d: ['chimica', 'cartografica', 'musicale'] },
      { q: 'Un vecchio utensile trovato in casa è una fonte...', a: 'materiale', d: ['futura', 'immaginaria', 'matematica'] },
      { q: 'Per sapere se una fonte è affidabile conviene...', a: 'confrontarla con altre fonti', d: ['crederci sempre senza verifiche', 'ignorare la data', 'leggerne solo il titolo'] },
      { q: 'Le fonti servono a...', a: 'ricostruire il passato', d: ['prevedere lotterie', 'misurare lunghezze', 'disegnare mappe'] },
      { q: "Una lettera d'epoca è soprattutto una fonte...", a: 'scritta', d: ['orale', 'digitale moderna', 'naturale'] },
      { q: 'Un monumento antico è una fonte...', a: 'materiale', d: ['solo geografica', 'solo sonora', 'solo meteorologica'] },
      { q: 'Ascoltare testimonianze diverse aiuta a...', a: 'capire punti di vista differenti', d: ['evitare domande', 'scegliere a caso', 'saltare la ricerca'] },
      { q: 'La storia richiede...', a: 'domande, fonti e verifica', d: ['solo memoria', 'solo fantasia', 'solo velocità'] },
      { q: 'Una mappa antica può essere una fonte utile per...', a: 'studiare territori del passato', d: ['misurare febbre', 'contare calorie', 'calcolare perimetri'] },
      { q: 'Quando due fonti dicono cose diverse, lo storico deve...', a: 'analizzare e confrontare', d: ['scegliere a caso', 'eliminarle entrambe', 'ignorare il problema'] }
    ],
    periods: [
      { q: "La preistoria viene prima o dopo l'età antica?", a: 'Prima', d: ['Dopo', 'Nello stesso momento', 'Mai'] },
      { q: 'Dividere la storia in periodi si chiama...', a: 'periodizzazione', d: ['navigazione', 'filtrazione', 'combinazione'] },
      { q: 'Le epoche aiutano a...', a: 'organizzare eventi complessi', d: ['confondere le date', 'annullare il passato', 'saltare la cronologia'] },
      { q: "L'età moderna viene dopo...", a: 'medioevo', d: ['preistoria', 'età contemporanea', 'futuro'] },
      { q: 'Un quadro di civiltà comprende...', a: 'vita quotidiana, lavoro, regole', d: ['solo nomi propri', 'solo colori', 'solo sport'] },
      { q: 'Nello stesso periodo possono esistere società...', a: 'diverse tra loro', d: ['tutte identiche', 'senza differenze', 'senza storia'] },
      { q: 'Studiare civiltà antiche serve a...', a: 'capire radici del presente', d: ['dimenticare il presente', 'evitare confronto', 'escludere le fonti'] },
      { q: 'La storia d\'Italia include fatti legati a...', a: 'unità nazionale e democrazia', d: ['solo previsioni meteo', 'solo sport invernali', 'solo mappe stellari'] },
      { q: 'Un secolo corrisponde a...', a: '100 anni', d: ['10 anni', '1000 anni', '12 mesi'] },
      { q: 'La periodizzazione è utile per...', a: 'interpretare cambiamenti', d: ['misurare superfici', 'calcolare frazioni', 'fare esperimenti chimici'] },
      { q: 'Le trasformazioni storiche riguardano anche...', a: 'mestieri e tecnologie', d: ['solo pianeti', 'solo animali marini', 'solo montagne'] },
      { q: 'Quando confronti epoche diverse, osservi...', a: 'somiglianze e differenze', d: ['solo nomi casuali', 'solo date senza contesto', 'solo simboli'] }
    ],
    links: [
      { q: 'Confrontare passato e presente aiuta a...', a: 'capire cosa è cambiato', d: ['bloccare le domande', 'cancellare la memoria', 'evitare fonti'] },
      { q: 'Un vecchio telefono a disco rispetto allo smartphone mostra...', a: 'evoluzione tecnologica', d: ['assenza di cambiamenti', 'solo differenze di colore', 'solo differenze di peso'] },
      { q: 'Le regole della convivenza nel tempo possono...', a: 'modificarsi', d: ['restare sempre identiche', 'sparire del tutto', 'non essere mai scritte'] },
      { q: 'La storia locale (quartiere, paese) serve a...', a: 'ricostruire identità del territorio', d: ['studiare solo oceani', 'misurare temperatura', 'fare calcoli geometrici'] },
      { q: 'Un mestiere antico oggi può...', a: 'essere cambiato o scomparso', d: ['essere identico ovunque', 'essere obbligatorio', 'non avere storia'] },
      { q: 'Le fonti del presente diventeranno in futuro...', a: 'fonti storiche', d: ['solo rifiuti', 'solo favole', 'solo leggende'] },
      { q: 'Capire il passato aiuta a diventare...', a: 'più consapevoli nel presente', d: ['meno curiosi', 'meno attenti', 'più confusi sempre'] },
      { q: 'Un edificio storico restaurato permette di...', a: 'conservare memoria e uso', d: ['eliminare ogni traccia', 'chiudere la città', 'spostare il tempo'] },
      { q: 'Le tradizioni familiari raccontano...', a: 'memoria collettiva e personale', d: ['solo numeri casuali', 'solo previsioni future', 'solo regole scientifiche'] },
      { q: 'Quando osservi foto della stessa piazza in epoche diverse noti...', a: 'trasformazioni del paesaggio urbano', d: ['assenza totale di differenze', 'solo la stagione', 'solo i colori dei vestiti'] },
      { q: 'Il metodo storico richiede anche...', a: 'spirito critico', d: ['risposte senza prove', 'scelte casuali', 'solo memoria mnemonica'] },
      { q: 'Il presente diventa passato grazie al...', a: 'passare del tempo', d: ['cambio di colore', 'cambio di nome', 'cambio di aula'] }
    ]
  },
  bonusQuestions: {
    easy: [
      { q: 'Bonus facile: cosa viene prima, ieri o oggi?', a: 'Ieri', d: ['Oggi', 'Domani', 'Dipende dal mese'] },
      { q: 'Bonus facile: un racconto dei nonni è una fonte...', a: 'orale', d: ['scritta', 'chimica', 'numerica'] },
      { q: 'Bonus facile: un secolo quanti anni dura?', a: '100', d: ['10', '50', '1000'] },
      { q: 'Bonus facile: una foto antica serve per conoscere...', a: 'il passato', d: ['il futuro certo', 'solo la geografia', 'solo la matematica'] }
    ],
    medium: [
      { q: 'Bonus medio: quale azione è più corretta quando due fonti non coincidono?', a: 'Confrontarle con altre prove', d: ['Sceglierne una a caso', 'Ignorarle entrambe', 'Usare solo la memoria'] },
      { q: 'Bonus medio: la periodizzazione serve soprattutto a...', a: 'organizzare e interpretare la storia', d: ['eliminare le date', 'sostituire le fonti', 'saltare gli eventi'] },
      { q: 'Bonus medio: qual è una fonte materiale?', a: 'Un vaso antico', d: ['Una formula', 'Una nuvola', 'Un pronostico'] },
      { q: 'Bonus medio: confrontare passato e presente aiuta a capire...', a: 'cambiamenti e permanenze', d: ['solo la cronologia futura', 'solo i nomi propri', 'solo i voti scolastici'] }
    ],
    hard: [
      { q: 'Bonus difficile: quale sequenza è cronologicamente corretta?', a: 'preistoria, età antica, medioevo, età moderna, età contemporanea', d: ['medioevo, preistoria, età antica, età moderna, contemporanea', 'età moderna, medioevo, preistoria, antica, contemporanea', 'preistoria, medioevo, antica, moderna, contemporanea'] },
      { q: 'Bonus difficile: se una testimonianza orale è in contrasto con un documento scritto, lo storico dovrebbe...', a: 'valutare attendibilità e contesto di entrambe', d: ['accettare solo la più recente', 'scartare tutte le fonti', 'scegliere quella più breve'] },
      { q: 'Bonus difficile: per ricostruire la storia del quartiere quale insieme di fonti è più adatto?', a: 'foto, mappe, testimonianze, documenti comunali', d: ['solo racconti inventati', 'solo risultati sportivi', 'solo previsioni meteo'] },
      { q: 'Bonus difficile: la storia come disciplina richiede soprattutto...', a: 'metodo di ricerca e interpretazione critica', d: ['memoria senza verifica', 'risposte immediate senza domande', 'solo elenco di date'] }
    ]
  }
};
