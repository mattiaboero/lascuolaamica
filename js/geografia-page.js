// Auto-estratto da geografia.html per CSP hardening (no inline script).
window.SUBJECT_CONFIG = {
  totalQ: 10,
  pointsPerQ: 10,
  lbKey: 'geografia_lb_v3',
  cursorKey: 'geografia_cursor_v3',
  defaultArea: 'mixed',
  questionsSource: {
    subject: 'geografia',
    path: 'json/index.json',
    areaMap: {
      orient: ['orientamento', 'orientamento_mappe', 'strumenti_orientamento', 'geo_graficita'],
      maps: ['orientamento_carte', 'sistema_territoriale', 'territorio_sicurezza'],
      land: ['paesaggio', 'paesaggi_terra', 'paesaggi_acqua', 'antropico_ambiente', 'regioni_antropica'],
      it: ['italia_europa', 'territorio_italiano', 'geografia_fisica_italia', 'idrografia_clima_italia']
    }
  },
  bgIcons: ['🗺️', '🧭', '🌍', '🏞️', '🏔️', '🌊'],
  feedbackOk: ['Esatto!', 'Ottimo!', 'Benissimo!', 'Continua così!'],
  feedbackKo: ['Riprova!', 'Quasi!', 'Ci siamo quasi!', 'Un altro tentativo!'],
  areas: [
    { key: 'mixed', label: 'Sessione mista', icon: '🎯', title: 'Sessione Mista', subtitle: 'Domande da tutti gli ambiti' },
    { key: 'orient', label: 'Orientamento', icon: '🧭', title: 'Orientamento', subtitle: 'Punti cardinali e percorsi' },
    { key: 'maps', label: 'Carte e mappe', icon: '🗺️', title: 'Carte e Mappe', subtitle: 'Legende, simboli e scale' },
    { key: 'land', label: 'Paesaggi', icon: '🏞️', title: 'Paesaggi', subtitle: 'Elementi fisici e antropici' },
    { key: 'it', label: 'Italia e Europa', icon: '🇮🇹', title: 'Italia e Europa', subtitle: 'Territorio e relazioni' }
  ],
  banks: {
    orient: [
      { q: 'Il sole tramonta normalmente verso...', a: 'ovest', d: ['nord', 'est', 'sud'] },
      { q: 'Con la bussola, la lettera N indica...', a: 'nord', d: ['nord-est', 'nord-ovest', 'sud'] },
      { q: 'Se vai a destra e poi avanti, stai seguendo un...', a: 'percorso', d: ['continente', 'fiume', 'clima'] },
      { q: 'Il punto opposto a nord è...', a: 'sud', d: ['ovest', 'est', 'nord-est'] },
      { q: 'La posizione di un oggetto si descrive con un...', a: 'punto di riferimento', d: ['colore', 'rumore', 'materiale'] },
      { q: 'Su un reticolato, per trovare un punto servono...', a: 'due coordinate', d: ['una sola lettera', 'solo il colore', 'un numero casuale'] },
      { q: 'Per orientarsi nel quartiere è utile...', a: 'osservare punti di riferimento', d: ['chiudere gli occhi', 'correre a caso', 'contare fino a 100'] },
      { q: 'Se guardi a est, alla tua destra hai...', a: 'sud', d: ['nord', 'ovest', 'est'] },
      { q: 'Il movimento da casa a scuola è uno...', a: 'spostamento', d: ['continente', 'confine', 'parallelo'] },
      { q: 'Per descrivere un tragitto usi parole come...', a: 'davanti, dietro, vicino', d: ['caldo, freddo, dolce', 'alto, basso, acido', 'pari, dispari, primo'] },
      { q: 'La mappa della classe serve a...', a: "rappresentare lo spazio dall'alto", d: ['misurare la temperatura', 'contare i pianeti', 'calcolare la media'] },
      { q: 'Un percorso breve tra due punti è spesso il...', a: 'più diretto', d: ['più lungo', 'più confuso', 'più rumoroso'] }
    ],
    maps: [
      { q: 'Nella carta geografica, la legenda spiega...', a: 'il significato dei simboli', d: ['le regole del gioco', 'le stagioni', 'i voti scolastici'] },
      { q: 'La scala della carta indica...', a: 'il rapporto tra realtà e disegno', d: ['la temperatura', 'la direzione del vento', 'la profondità del mare'] },
      { q: 'Una carta con molti dettagli di una città e di solito...', a: 'a grande scala', d: ['a piccolissima scala', 'senza scala', 'solo politica'] },
      { q: 'Per trovare un fiume sulla carta conviene leggere...', a: 'legenda e nomi geografici', d: ['solo il titolo', 'solo il bordo', 'solo la data'] },
      { q: 'Il simbolo di una montagna in legenda rappresenta...', a: 'rilievi montuosi', d: ['strade ferroviarie', 'linee telefoniche', 'temperature'] },
      { q: 'Un planisfero rappresenta...', a: 'tutta la Terra', d: ["solo l'Italia", "solo l'Europa", 'solo il mare'] },
      { q: 'Le carte tematiche mostrano soprattutto...', a: 'un argomento specifico', d: ['solo le capitali', 'solo i confini regionali', 'solo i fiumi'] },
      { q: 'Per leggere una carta servono anche...', a: 'orientamento e punti cardinali', d: ['solo colori preferiti', 'solo numeri pari', 'solo nomi di persona'] },
      { q: 'Una pianta della scuola è utile per...', a: 'trovare aule e spazi', d: ['misurare la pioggia', 'calcolare la massa', 'prevedere terremoti'] },
      { q: 'Il nord in una carta è spesso indicato...', a: 'in alto', d: ['in basso', 'a destra', 'al centro'] },
      { q: 'Una carta fisica evidenzia soprattutto...', a: 'monti, pianure, fiumi', d: ['ministeri e comuni', 'squadre sportive', 'giorni della settimana'] },
      { q: 'Per confrontare due carte devi controllare anche...', a: 'la scala usata', d: ['la marca della penna', 'il giorno di stampa', 'il numero di pagine'] }
    ],
    land: [
      { q: 'Un elemento fisico del paesaggio è...', a: 'un fiume', d: ['una fabbrica', 'una strada', 'una scuola'] },
      { q: 'Un elemento antropico è...', a: 'un ponte', d: ['una cascata', 'una collina', 'un bosco'] },
      { q: 'Le pianure sono aree...', a: 'prevalentemente piatte', d: ['molto ripide', 'sempre ghiacciate', 'sempre desertiche'] },
      { q: 'In montagna trovi spesso...', a: 'pendii e vallate', d: ['solo spiagge basse', 'solo grattacieli', 'solo lagune'] },
      { q: 'Le coste mettono in contatto...', a: 'terra e mare', d: ['fiume e deserto', 'montagna e cielo', 'strada e ferrovia'] },
      { q: 'Un paesaggio agricolo mostra spesso...', a: 'campi coltivati', d: ['solo industrie pesanti', 'solo aeroporti', 'solo porti turistici'] },
      { q: 'Quando l\'uomo costruisce strade e case il paesaggio...', a: 'si trasforma', d: ['resta sempre uguale', 'sparisce', 'diventa un pianeta'] },
      { q: 'La raccolta differenziata aiuta a...', a: "ridurre l'inquinamento", d: ['aumentare i rifiuti', 'sprecare acqua', 'inquinare i fiumi'] },
      { q: 'Un parco naturale serve a...', a: 'proteggere ambienti e specie', d: ['costruire autostrade', 'aumentare traffico', 'chiudere scuole'] },
      { q: 'Le attività economiche dipendono anche da...', a: 'risorse del territorio', d: ['nomi dei giorni', 'forme geometriche', 'favole lette'] },
      { q: 'Il clima influenza soprattutto...', a: 'vegetazione e coltivazioni', d: ['alfabeto', 'voti in matematica', 'ore di musica'] },
      { q: 'Città e campagna sono collegate da...', a: 'scambi di persone e prodotti', d: ['nessun rapporto', 'solo internet', 'solo voli spaziali'] }
    ],
    it: [
      { q: "L'Italia è bagnata dal...", a: 'Mar Mediterraneo', d: ['Mar Baltico', 'Mar Glaciale Artico', 'Mar Caspio'] },
      { q: 'Le Alpi si trovano soprattutto...', a: "a nord dell'Italia", d: ['a sud della Sicilia', 'al centro del Mediterraneo', 'in Sardegna sud'] },
      { q: 'La Pianura Padana è una grande...', a: 'pianura del nord', d: ['catena montuosa', 'isola', 'laguna artificiale'] },
      { q: 'Roma è la capitale di...', a: 'Italia', d: ['Spagna', 'Portogallo', 'Grecia'] },
      { q: "L'Italia fa parte dell'...", a: 'Europa', d: ['Asia', 'Africa', 'Oceania'] },
      { q: 'Il fiume Po scorre principalmente...', a: 'nel nord Italia', d: ['in Sicilia', 'in Sardegna', 'nelle Alpi francesi soltanto'] },
      { q: 'Una regione italiana con molte coste è...', a: 'Puglia', d: ['Valle d\'Aosta', 'Trentino Alto Adige', 'Umbria'] },
      { q: 'Le isole maggiori italiane sono...', a: 'Sicilia e Sardegna', d: ['Elba e Capri', 'Procida e Ischia', 'Lampedusa e Linosa'] },
      { q: 'Il confronto tra nord e sud riguarda anche...', a: 'attività economiche e servizi', d: ['solo colori delle case', 'solo nomi delle strade', 'solo orari scolastici'] },
      { q: 'I paesi del Mediterraneo hanno spesso...', a: 'scambi culturali e commerciali', d: ['nessun contatto', 'solo clima polare', 'solo foreste tropicali'] },
      { q: 'Una carta politica mostra soprattutto...', a: 'confini e stati', d: ['solo rilievi montuosi', 'solo clima', 'solo fiumi sotterranei'] },
      { q: 'Le vie di comunicazione servono a...', a: 'collegare luoghi e persone', d: ['fermare i trasporti', 'isolare città', 'bloccare i commerci'] }
    ]
  },
  bonusQuestions: {
    easy: [
      { q: 'Bonus facile: quali sono i quattro punti cardinali principali?', a: 'Nord, Sud, Est, Ovest', d: ['Nord, Ovest, Alto, Basso', 'Nord, Sud, Destra, Sinistra', 'Est, Ovest, Caldo, Freddo'] },
      { q: 'Bonus facile: la legenda si trova su...', a: 'mappa o carta geografica', d: ['calcolatrice', 'quaderno di musica', 'orologio'] },
      { q: 'Bonus facile: una montagna è un elemento...', a: 'fisico', d: ['antropico', 'digitale', 'stradale'] },
      { q: 'Bonus facile: Italia è in...', a: 'Europa', d: ['Africa', 'America', 'Asia'] }
    ],
    medium: [
      { q: 'Bonus medio: in una carta, 1 cm rappresenta 1 km reali. Questa informazione è...', a: 'la scala', d: ['la legenda sonora', 'la latitudine media', 'la quota termica'] },
      { q: 'Bonus medio: un territorio con fiumi e suolo fertile favorisce...', a: 'agricoltura', d: ['assenza totale di vita', 'solo traffico aereo', 'nessuna attività economica'] },
      { q: 'Bonus medio: quale coppia contiene solo elementi antropici?', a: 'strada e ponte', d: ['fiume e ponte', 'bosco e collina', 'mare e lago'] },
      { q: 'Bonus medio: se guardi il sole a mezzogiorno in Italia, in genere è verso...', a: 'sud', d: ['nord', 'ovest', 'est'] }
    ],
    hard: [
      { q: 'Bonus difficile: per studiare le differenze di popolazione tra regioni quale carta scegli?', a: 'Carta tematica demografica', d: ['Carta fisica dei rilievi', "Pianta dell'aula", 'Carta nautica senza dati'] },
      { q: 'Bonus difficile: un territorio costiero con porto e rete stradale favorisce soprattutto...', a: 'scambi commerciali', d: ['isolamento totale', 'scomparsa dei trasporti', 'assenza di attività umane'] },
      { q: 'Bonus difficile: qual è la sequenza corretta da piccolo a grande?', a: 'quartiere, città, regione, stato, continente', d: ['città, quartiere, continente, regione, stato', 'regione, strada, quartiere, pianeta, città', 'stato, quartiere, continente, casa, regione'] },
      { q: 'Bonus difficile: due carte della stessa zona con scale diverse mostrano che...', a: 'più grande scala = più dettagli', d: ['più grande scala = meno dettagli', 'la scala non cambia nulla', 'scala e legenda sono uguali sempre'] }
    ]
  }
};
