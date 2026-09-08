(function () {
  'use strict';

  /*
    Il Bosco delle Lettere — mini-gioco didattico a canvas.

    Tutta la scena e' disegnata via codice: nessuno sfondo raster, nessuno sprite
    caricato da file. I colori non sono costanti nel sorgente ma token CSS letti
    da bosco.css (vedi readPalette), cosi' la modalita' accessibile Okabe-Ito
    ridipinge il bosco senza toccare questo file. Stesso meccanismo di
    js/breakout.js.
  */

  const SA = window.SA = window.SA || {};
  const KEY_MUTED = 'lascuolaamica_bosco_muted_v1';
  const KEY_CLASSE = 'lascuolaamica_bosco_classe_v1';
  const KEY_ABILITA = 'lascuolaamica_bosco_abilita_v1';
  const DEBUG_MODE = (() => {
    try {
      const host = window.location.hostname;
      if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local')) return true;
      return new URLSearchParams(window.location.search).has('debug');
    } catch (e) {
      return false;
    }
  })();
  const memoryStorage = SA.memoryStorage = SA.memoryStorage || Object.create(null);

  function debugWarn(context, error) {
    if (!DEBUG_MODE) return;
    try {
      console.warn(`[La Scuola Amica][${context}]`, error);
    } catch (_) {}
  }

  function storageGet(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      debugWarn(`storageGet:${key}`, e);
      return Object.prototype.hasOwnProperty.call(memoryStorage, key) ? memoryStorage[key] : null;
    }
  }

  function storageSet(key, value) {
    const normalized = String(value);
    try {
      localStorage.setItem(key, normalized);
    } catch (e) {
      debugWarn(`storageSet:${key}`, e);
      memoryStorage[key] = normalized;
    }
  }

  /* ---------------------------------------------------------------- config */

  const W = 800;
  const H = 500;

  /*
    Banco parole. Ogni voce ha un buco `[inizio, lunghezza]` che copre un
    GRUPPO, non per forza una lettera sola: e' li' che l'ortografia italiana e'
    difficile davvero (GN, GLI, SCE, CHI, GHE, QU, CQU, doppie), mentre le
    vocali si sbagliano di rado.

    `errate` sono due errori che un bambino fa davvero, non due lettere a caso:
    RANIO e RAGNIO per ragno, FAMILIA per famiglia, AQUA per acqua, PALA per
    palla. Scegliere fra alternative confondibili e' un esercizio di
    discriminazione; scegliere fra A/E/O e' un indovinello.

    Le parole vengono dal vocabolario dei quiz di italiano del sito
    (json/italiano.json, subaree ortografia e alfabeto), cosi' il registro e'
    lo stesso delle altre pagine. Diversi distrattori qui sotto sono errori
    reali gia' presenti in quelle domande.
  */
  const PAROLE = [
    // Riscaldamento: le tre parole storiche, con il loro disegno sul tabellone.
    { word: 'SOLE', hole: [3, 1], errate: ['A', 'O'], skill: 'vocali', picture: 'sun', cls: 2, diff: 1, clue: 'Scalda il bosco e illumina il cielo.' },
    { word: 'MELA', hole: [1, 1], errate: ['I', 'O'], skill: 'vocali', picture: 'apple', cls: 2, diff: 1, clue: 'E’ un frutto, croccante e dolce.' },
    { word: 'LUNA', hole: [1, 1], errate: ['A', 'I'], skill: 'vocali', picture: 'moon', cls: 2, diff: 1, clue: 'Brilla nel cielo quando arriva la notte.' },

    { word: 'RAGNO', hole: [2, 2], errate: ['NI', 'GNI'], skill: 'gn', cls: 2, diff: 1, clue: 'Ha otto zampe e tesse la tela.' },
    { word: 'GNOMO', hole: [0, 2], errate: ['NI', 'GNI'], skill: 'gn', cls: 2, diff: 2, clue: 'Piccolo folletto del bosco col cappello a punta.' },
    { word: 'MONTAGNA', hole: [5, 2], errate: ['NI', 'GNI'], skill: 'gn', cls: 2, diff: 2, clue: 'E’ altissima e in cima ha la neve.' },
    { word: 'CIGNO', hole: [2, 2], errate: ['NI', 'GNI'], skill: 'gn', cls: 3, diff: 2, clue: 'Uccello bianco dal collo lungo, vive sul lago.' },

    { word: 'FOGLIA', hole: [2, 3], errate: ['LI', 'GHI'], skill: 'gli', cls: 2, diff: 1, clue: 'Cade dagli alberi in autunno.' },
    { word: 'AGLIO', hole: [1, 3], errate: ['LI', 'GHI'], skill: 'gli', cls: 2, diff: 2, clue: 'Ha un odore forte e si usa in cucina.' },
    { word: 'FAMIGLIA', hole: [4, 3], errate: ['LI', 'GHI'], skill: 'gli', cls: 2, diff: 2, clue: 'Mamma, papa’ e figli, tutti insieme.' },
    { word: 'CONIGLIO', hole: [4, 3], errate: ['LI', 'GHI'], skill: 'gli', cls: 3, diff: 3, clue: 'Ha le orecchie lunghe e salta.' },

    { word: 'PESCE', hole: [2, 3], errate: ['SCIE', 'SE'], skill: 'sc', cls: 2, diff: 2, clue: 'Nuota nell’acqua e ha le pinne.' },
    { word: 'SCIMMIA', hole: [0, 3], errate: ['SCE', 'SI'], skill: 'sc', cls: 3, diff: 2, clue: 'Si arrampica sugli alberi e ama le banane.' },
    { word: 'SCENA', hole: [0, 3], errate: ['SCIE', 'SE'], skill: 'sc', cls: 3, diff: 3, clue: 'La parte di una storia che si recita a teatro.' },
    { word: 'LISCIO', hole: [2, 3], errate: ['SCE', 'SI'], skill: 'sc', cls: 3, diff: 3, clue: 'Il contrario di ruvido.' },

    { word: 'CHIAVE', hole: [0, 3], errate: ['CI', 'CHE'], skill: 'ch', cls: 2, diff: 1, clue: 'Serve per aprire la porta.' },
    { word: 'AMICHE', hole: [3, 3], errate: ['CE', 'CHI'], skill: 'ch', cls: 2, diff: 2, clue: 'Bambine che giocano sempre insieme.' },
    { word: 'VECCHIO', hole: [3, 3], errate: ['CI', 'CHE'], skill: 'ch', cls: 2, diff: 2, clue: 'Il contrario di giovane.' },
    { word: 'FISCHIO', hole: [3, 3], errate: ['CI', 'CHE'], skill: 'ch', cls: 2, diff: 3, clue: 'Il suono acuto che fa l’arbitro.' },
    { word: 'TACCHINO', hole: [3, 3], errate: ['CI', 'CHE'], skill: 'ch', cls: 3, diff: 3, clue: 'Uccello grande da cortile con la cresta rossa.' },

    { word: 'GHIRO', hole: [0, 3], errate: ['GI', 'CHI'], skill: 'gh', cls: 2, diff: 2, clue: 'Piccolo animale che dorme tutto l’inverno.' },
    { word: 'GHIACCIO', hole: [0, 3], errate: ['GI', 'CHI'], skill: 'gh', cls: 2, diff: 2, clue: 'Acqua diventata dura per il freddo.' },
    { word: 'RIGHELLO', hole: [2, 3], errate: ['GE', 'CHE'], skill: 'gh', cls: 2, diff: 3, clue: 'Serve per tracciare righe dritte.' },

    { word: 'QUADERNO', hole: [0, 2], errate: ['CU', 'Q'], skill: 'qu', cls: 2, diff: 1, clue: 'Ci scrivi i compiti a scuola.' },
    { word: 'CINQUE', hole: [3, 3], errate: ['CUE', 'CHE'], skill: 'qu', cls: 2, diff: 1, clue: 'Il numero che viene dopo il quattro.' },
    { word: 'QUATTRO', hole: [0, 2], errate: ['CU', 'Q'], skill: 'qu', cls: 2, diff: 2, clue: 'Il numero delle zampe del gatto.' },
    { word: 'ACQUA', hole: [1, 3], errate: ['QU', 'CU'], skill: 'cqu', cls: 2, diff: 2, clue: 'Si beve e riempie il mare.' },
    { word: 'ACQUARIO', hole: [1, 3], errate: ['QU', 'CU'], skill: 'cqu', cls: 3, diff: 3, clue: 'La vasca di vetro dove nuotano i pesci.' },

    { word: 'PALLA', hole: [2, 2], errate: ['L', 'RR'], skill: 'doppie', cls: 2, diff: 1, clue: 'E’ rotonda, rimbalza e si calcia.' },
    { word: 'GATTO', hole: [2, 2], errate: ['T', 'DD'], skill: 'doppie', cls: 2, diff: 1, clue: 'Fa le fusa e miagola.' },
    { word: 'STELLA', hole: [3, 2], errate: ['L', 'RR'], skill: 'doppie', cls: 2, diff: 1, clue: 'Brilla in cielo di notte.' },
    { word: 'NONNO', hole: [2, 2], errate: ['N', 'MM'], skill: 'doppie', cls: 2, diff: 2, clue: 'E’ il papa’ del tuo papa’.' },
    { word: 'PENNA', hole: [2, 2], errate: ['N', 'MM'], skill: 'doppie', cls: 2, diff: 2, clue: 'Serve per scrivere e ha l’inchiostro.' },
    { word: 'FARFALLA', hole: [5, 2], errate: ['L', 'RR'], skill: 'doppie', cls: 2, diff: 2, clue: 'Ha le ali colorate e nasce dal bruco.' },
    { word: 'CAVALLO', hole: [4, 2], errate: ['L', 'RR'], skill: 'doppie', cls: 2, diff: 3, clue: 'Corre veloce e si puo’ cavalcare.' },
    { word: 'MARTELLO', hole: [5, 2], errate: ['L', 'RR'], skill: 'doppie', cls: 3, diff: 3, clue: 'Serve per piantare i chiodi.' }
  ];

  /*
    Cosa dice il gufo quando la scelta e' sbagliata. «Riprova» non insegna
    niente: il bambino ritenta a caso finche' non azzecca. Qui arriva la regola,
    sul caso concreto, subito.

    La voce pronuncia SEMPRE la parola intera e mai il gruppo isolato: la
    sintesi vocale legge "GN" come «gi enne», cioe' il nome delle lettere, che
    per la fonetica e' esattamente il contrario di quello che serve.
  */
  // Come si chiama un gruppo quando lo si scrive all'adulto che guarda.
  const ETICHETTE = {
    vocali: 'vocali',
    gn: 'GN',
    gli: 'GLI',
    sc: 'SCE e SCI',
    ch: 'CHE e CHI',
    gh: 'GHE e GHI',
    qu: 'QU',
    cqu: 'CQU',
    doppie: 'doppie'
  };

  const REGOLE = {
    vocali: 'Ascolta la parola e senti quale vocale manca in mezzo.',
    gn: 'Il gruppo GN si scrive con la G davanti alla N, mai con la I in mezzo.',
    gli: 'Il gruppo GLI si scrive con la G davanti a LI.',
    sc: 'Davanti a E e a I il gruppo SC si scrive senza aggiungere altre lettere.',
    ch: 'Per il suono duro della C davanti a E e a I ci vuole la H.',
    gh: 'Per il suono duro della G davanti a E e a I ci vuole la H.',
    qu: 'Il gruppo QU si scrive con la Q seguita dalla U, mai con CU.',
    cqu: 'Poche parole hanno CQU, e quasi tutte sono parenti di acqua.',
    doppie: 'Qui la consonante si sente lunga: va scritta doppia.'
  };

  // Famiglie di confusione, una per abilita': servono a scripts/check_bosco.js
  // per verificare che i distrattori del banco restino confondibili, invece di
  // scivolare verso lettere prese a caso quando si aggiungono parole.
  const CONFUSIONI = {
    vocali: ['A', 'E', 'I', 'O', 'U'],
    gn: ['GN', 'NI', 'GNI', 'NGI'],
    gli: ['GLI', 'LI', 'GHI', 'GLLI'],
    sc: ['SCE', 'SCI', 'SCIE', 'SE', 'SI', 'SCHE', 'SCHI'],
    ch: ['CHE', 'CHI', 'CE', 'CI', 'CCE', 'CCI'],
    gh: ['GHE', 'GHI', 'GE', 'GI', 'CHE', 'CHI'],
    qu: ['QU', 'CU', 'Q', 'QUE', 'CUE', 'CHE'],
    cqu: ['CQU', 'QU', 'CU', 'CCU'],
    doppie: null // coppia scempia/doppia: verificata a parte, dipende dalla consonante
  };


  const TILE_POSITIONS = [
    { x: 265, y: 290 },
    { x: 411, y: 254 },
    { x: 552, y: 302 }
  ];

  // Pozze piccole e sparse: il centro della radura resta asciutto, cosi' il
  // personaggio, il tabellone e i tre supporti delle lettere non ci finiscono sopra.
  const PUDDLES = [
    { x: 131, y: 255, rx: 30, ry: 17 },
    { x: 315, y: 213, rx: 31, ry: 16 },
    { x: 620, y: 246, rx: 34, ry: 19 },
    { x: 258, y: 367, rx: 40, ry: 23 },
    { x: 524, y: 399, rx: 44, ry: 25 },
    { x: 662, y: 424, rx: 35, ry: 19 }
  ];

  // Font 5x7 a bit-mask: una riga per pixel, un bit per colonna (16 = colonna
  // di sinistra). Serve l'alfabeto intero, non solo le lettere di tre parole:
  // le caselle del tabellone ora ospitano gruppi come GN, GLI, CQU.
  const LETTERS = {
    A: [14, 17, 17, 31, 17, 17, 17],
    B: [30, 17, 17, 30, 17, 17, 30],
    C: [14, 17, 16, 16, 16, 17, 14],
    D: [30, 17, 17, 17, 17, 17, 30],
    E: [31, 16, 16, 30, 16, 16, 31],
    F: [31, 16, 16, 30, 16, 16, 16],
    G: [14, 17, 16, 23, 17, 17, 15],
    H: [17, 17, 17, 31, 17, 17, 17],
    I: [31, 4, 4, 4, 4, 4, 31],
    L: [16, 16, 16, 16, 16, 16, 31],
    M: [17, 27, 21, 21, 17, 17, 17],
    N: [17, 25, 25, 21, 19, 19, 17],
    O: [14, 17, 17, 17, 17, 17, 14],
    P: [30, 17, 17, 30, 16, 16, 16],
    Q: [14, 17, 17, 17, 21, 18, 13],
    R: [30, 17, 17, 30, 20, 18, 17],
    S: [15, 16, 16, 14, 1, 1, 30],
    T: [31, 4, 4, 4, 4, 4, 4],
    U: [17, 17, 17, 17, 17, 17, 14],
    V: [17, 17, 17, 17, 17, 10, 4],
    Z: [31, 1, 2, 4, 8, 16, 31],
    '?': [14, 17, 1, 2, 4, 0, 4],
    '!': [4, 4, 4, 4, 4, 0, 4],
    '+': [0, 4, 4, 31, 4, 4, 0]
  };

  /* ------------------------------------------------------- memoria e classe */

  /*
    Cosa il bambino ha gia' fatto, per gruppo: {skills: {gn: {visti, ok}}, ripassa}.
    Serve a decidere COSA chiedere, mai quanto essere severi: niente timer, niente
    punteggio, niente vite. L'adattamento cambia il contenuto della partita, non
    la pressione.
  */
  function leggiAbilita() {
    try {
      const raw = storageGet(KEY_ABILITA);
      const dati = raw ? JSON.parse(raw) : null;
      if (!dati || typeof dati !== 'object' || typeof dati.skills !== 'object' || !dati.skills) {
        return { skills: {}, ripassa: null };
      }
      return { skills: dati.skills, ripassa: dati.ripassa || null };
    } catch (e) {
      debugWarn('leggiAbilita', e);
      return { skills: {}, ripassa: null };
    }
  }

  function scriviAbilita(dati) {
    storageSet(KEY_ABILITA, JSON.stringify(dati));
  }

  // Una risposta sbagliata segna il gruppo da ripassare; indovinarlo lo libera.
  function registraRisposta(skill, giusta) {
    const dati = leggiAbilita();
    const voce = dati.skills[skill] || { visti: 0, ok: 0 };
    voce.visti++;
    if (giusta) voce.ok++;
    dati.skills[skill] = voce;
    if (giusta) {
      if (dati.ripassa === skill) dati.ripassa = null;
    } else {
      dati.ripassa = skill;
    }
    scriviAbilita(dati);
    return dati;
  }

  function precisione(skill, dati) {
    const voce = dati.skills[skill];
    if (!voce || !voce.visti) return null;
    return voce.ok / voce.visti;
  }

  // Quanto spesso un gruppo deve ricomparire. Mai visto: va proposto. Sbagliato
  // spesso: torna piu' spesso. Consolidato: si fa da parte per lasciare posto
  // agli altri, senza sparire del tutto.
  function peso(skill, dati) {
    const acc = precisione(skill, dati);
    if (acc === null) return 3;
    if (acc < 0.5) return 5;
    if (acc < 0.7) return 4;
    if (acc < 0.9) return 2;
    return 1;
  }

  function pescaPesata(lista, dati) {
    if (!lista.length) return null;
    const pesi = lista.map(function (w) { return peso(w.skill, dati); });
    const totale = pesi.reduce(function (a, b) { return a + b; }, 0);
    let soglia = Math.random() * totale;
    for (let i = 0; i < lista.length; i++) {
      soglia -= pesi[i];
      if (soglia <= 0) return lista[i];
    }
    return lista[lista.length - 1];
  }

  function classeScelta() {
    return Number(storageGet(KEY_CLASSE)) === 3 ? 3 : 2;
  }

  // I gruppi su cui il bambino e' sotto il 70%, dopo almeno due tentativi: due
  // tentativi sono pochi per una statistica, ma abbastanza per non dire a un
  // adulto che il figlio "deve ripassare GN" dopo un solo errore.
  function daRipassare(dati) {
    return Object.keys(dati.skills)
      .filter(function (skill) {
        const voce = dati.skills[skill];
        return skill !== 'vocali' && voce.visti >= 2 && voce.ok / voce.visti < 0.7;
      })
      .sort(function (a, b) { return precisione(a, dati) - precisione(b, dati); });
  }

  const PUDDLE_W = 48;
  const PUDDLE_H = 32;
  const SPEED = 94;

  /* ------------------------------------------------------------------ tinte */

  function clamp(value, min, max) {
    return value < min ? min : (value > max ? max : value);
  }

  function hexToRgb(hex) {
    const raw = String(hex || '').replace('#', '').trim();
    const v = raw.length === 3 ? raw.split('').map(function (c) { return c + c; }).join('') : raw;
    const num = parseInt(v, 16) || 0;
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  }

  function toCss(rgb) {
    return 'rgb(' + rgb.map(function (c) { return Math.round(clamp(c, 0, 255)); }).join(',') + ')';
  }

  // Schiarisce (amt>0) o scurisce (amt<0) un token, amt in [-1, 1]. Parte sempre
  // dal valore CSS attuale (Wada o Okabe): nessun colore derivato e' cablato qui.
  function shade(hex, amt) {
    const rgb = hexToRgb(hex);
    return toCss(amt >= 0
      ? rgb.map(function (c) { return c + (255 - c) * amt; })
      : rgb.map(function (c) { return c * (1 + amt); }));
  }

  function mix(a, b, t) {
    const ra = hexToRgb(a);
    const rb = hexToRgb(b);
    return toCss(ra.map(function (c, i) { return c + (rb[i] - c) * t; }));
  }

  const PALETTE_VARS = {
    ground: ['--bosco-ground', '#dda96b'],
    clearing: ['--bosco-clearing', '#f0be83'],
    leafDark: ['--bosco-leaf-dark', '#164c45'],
    leafLight: ['--bosco-leaf-light', '#94b24c'],
    trunk: ['--bosco-trunk', '#614d2d'],
    water: ['--bosco-water', '#ae99c0'],
    waterEdge: ['--bosco-water-edge', '#deb6c2'],
    wood: ['--bosco-wood', '#ad773c'],
    tile: ['--bosco-tile', '#ffe8ac'],
    ink: ['--bosco-ink', '#49331e'],
    glow: ['--bosco-glow', '#ffc76c'],
    accent: ['--bosco-accent', '#dd6347'],
    hood: ['--bosco-hero-hood', '#edb33e'],
    body: ['--bosco-hero-body', '#29887a'],
    skin: ['--bosco-hero-skin', '#f4c58a']
  };

  // Token grezzi (hex) + tinte derivate, ricalcolati a ogni cambio palette.
  // getComputedStyle e' troppo costoso per chiamarlo a ogni frame.
  const raw = {};
  const paint = {};

  function readPalette() {
    const styles = window.getComputedStyle(document.body);
    Object.keys(PALETTE_VARS).forEach(function (key) {
      const entry = PALETTE_VARS[key];
      raw[key] = styles.getPropertyValue(entry[0]).trim() || entry[1];
    });

    // Rampa a 7 stop per le chiome: dal verde in ombra a quello in piena luce.
    paint.canopy = [];
    for (let i = 0; i < 7; i++) paint.canopy.push(mix(raw.leafDark, raw.leafLight, i / 6));

    paint.ground = raw.ground;
    paint.groundMid = shade(raw.ground, 0.12);
    paint.clearing = raw.clearing;
    paint.specks = [-0.06, 0, 0.06, -0.12, 0.12].map(function (a) { return shade(raw.clearing, a); });
    paint.moss = [0, -0.2, 0.16, -0.32, 0.3].map(function (a) { return shade(raw.leafLight, a); });
    paint.blooms = [raw.glow, raw.accent, raw.tile, raw.water];
    paint.trunk = raw.trunk;
    paint.trunkLight = shade(raw.trunk, 0.22);
    paint.trunkShadow = shade(raw.trunk, -0.25);
    paint.stone = shade(raw.ground, 0.18);
    paint.stoneLight = shade(raw.ground, 0.42);
    paint.stoneShadow = shade(raw.ground, -0.18);
    paint.stoneLit = shade(raw.glow, -0.12);
    paint.stoneLitTop = shade(raw.glow, 0.35);
    paint.wood = raw.wood;
    paint.woodDark = shade(raw.wood, -0.3);
    paint.woodLight = shade(raw.wood, 0.24);
    paint.tile = raw.tile;
    paint.tileLight = shade(raw.tile, 0.4);
    paint.ink = raw.ink;
    paint.glow = raw.glow;
    paint.glowSoft = shade(raw.glow, 0.4);
    paint.accent = raw.accent;
    paint.hood = raw.hood;
    paint.hoodDark = shade(raw.hood, -0.28);
    paint.body = raw.body;
    paint.bodyDark = shade(raw.body, -0.32);
    paint.skin = raw.skin;
    paint.waterRgb = hexToRgb(raw.water);
    paint.waterEdgeRgb = hexToRgb(raw.waterEdge);
    paint.confetti = [raw.glow, raw.accent, paint.tileLight, paint.canopy[6], paint.canopy[3]];

    scene.background = null;
    scene.foreground = null;
  }

  /* ----------------------------------------------------------------- utilita' */

  // true se l'utente ha chiesto meno animazioni (toggle del sito o preferenza di
  // sistema): spegne solo gli effetti decorativi, mai il movimento di gioco.
  function motionReduced() {
    const mode = document.documentElement.getAttribute('data-motion');
    if (mode === 'reduce') return true;
    if (mode === 'full') return false;
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) {
      return false;
    }
  }

  function random(seed) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function nearPuddle(puddle, x, y) {
    return ((x - puddle.x) / (puddle.rx + 12)) ** 2 + ((y - puddle.y) / (puddle.ry + 12)) ** 2 < 1;
  }

  function isCorrect(round, group) {
    return group === round.answer;
  }

  // Le celle del tabellone: una per lettera, tranne il buco che ne occupa una
  // sola largha quanto il gruppo che ci va dentro.
  function cellsOf(round) {
    const cells = [];
    const word = round.word;
    for (let i = 0; i < word.length;) {
      if (i === round.hole[0]) {
        cells.push({ text: word.substr(i, round.hole[1]), hole: true, units: round.hole[1] });
        i += round.hole[1];
      } else {
        cells.push({ text: word[i], hole: false, units: 1 });
        i++;
      }
    }
    return cells;
  }

  function shuffle(list) {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = list[i];
      list[i] = list[j];
      list[j] = tmp;
    }
    return list;
  }

  function buildRound(entry) {
    const answer = entry.word.substr(entry.hole[0], entry.hole[1]);
    return Object.assign({}, entry, {
      answer: answer,
      choices: shuffle([answer].concat(entry.errate))
    });
  }

  /*
    Una partita: riscaldamento con il disegno, poi due gruppi ortografici di
    abilita' diverse e difficolta' crescente.

    Cosa esce non e' piu' casuale uniforme. La classe filtra le parole; i gruppi
    piu' deboli pesano di piu'; e il gruppo sbagliato l'ultima volta torna nella
    partita SUCCESSIVA, non subito dopo l'errore: ripetere una cosa appena
    sbagliata allena la memoria a breve, ripeterla dopo una pausa la fissa.
  */
  function buildSession(opts) {
    const o = opts || {};
    const classe = o.classe || classeScelta();
    const dati = o.stats || leggiAbilita();

    const eleggibili = PAROLE.filter(function (w) { return w.cls <= classe; });
    const warmups = eleggibili.filter(function (w) { return w.skill === 'vocali'; });
    const rest = eleggibili.filter(function (w) { return w.skill !== 'vocali'; });
    const session = [warmups[Math.floor(Math.random() * warmups.length)]];

    let primo = null;
    if (dati.ripassa) {
      const stessoGruppo = rest.filter(function (w) { return w.skill === dati.ripassa; });
      const facili = stessoGruppo.filter(function (w) { return w.diff <= 2; });
      const scelta = facili.length ? facili : stessoGruppo;
      if (scelta.length) primo = scelta[Math.floor(Math.random() * scelta.length)];
    }
    if (!primo) {
      primo = pescaPesata(shuffle(rest.filter(function (w) { return w.diff <= 2; })), dati);
    }
    session.push(primo);

    const diversi = rest.filter(function (w) { return w.skill !== primo.skill; });
    const difficili = diversi.filter(function (w) { return w.diff >= 2; });
    session.push(pescaPesata(shuffle(difficili.length ? difficili : diversi), dati));

    return session.map(buildRound);
  }

  function clampPosition(x, y) {
    return {
      x: Math.max(122, Math.min(682, x)),
      y: Math.max(202, Math.min(433, y))
    };
  }

  /* ------------------------------------------------------------------ acqua */

  // Equazione d'onda alle differenze finite. Ogni perturbazione si propaga ai
  // vicini, rimbalza sulla riva e perde energia con lo smorzamento.
  function Water(width, height) {
    this.width = width;
    this.height = height;
    this.front = new Float32Array(width * height);
    this.back = new Float32Array(width * height);
    this.mask = new Uint8Array(width * height);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const nx = (x - width / 2) / (width / 2 - 4);
        const ny = (y - height / 2) / (height / 2 - 5);
        const angle = Math.atan2(ny, nx);
        this.mask[y * width + x] =
          nx * nx + ny * ny < 1 + 0.065 * Math.sin(angle * 7) + 0.035 * Math.cos(angle * 11) ? 1 : 0;
      }
    }
  }

  Water.prototype.disturb = function (x, y, force, radius) {
    const f = force === undefined ? 4 : force;
    const r = radius === undefined ? 3 : radius;
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const px = Math.round(x + dx);
        const py = Math.round(y + dy);
        if (px < 1 || py < 1 || px >= this.width - 1 || py >= this.height - 1) continue;
        const i = py * this.width + px;
        const distance = Math.hypot(dx, dy);
        if (this.mask[i] && distance <= r) this.front[i] += f * (1 - distance / (r + 1));
      }
    }
  };

  Water.prototype.step = function () {
    const w = this.width;
    const a = this.front;
    const b = this.back;
    for (let i = w + 1; i < a.length - w - 1; i++) {
      b[i] = this.mask[i]
        ? Math.max(-18, Math.min(18, ((a[i - 1] + a[i + 1] + a[i - w] + a[i + w]) * 0.5 - b[i]) * 0.972))
        : 0;
    }
    this.front = b;
    this.back = a;
  };

  /* --------------------------------------------------------------- primitive */

  function rect(c, x, y, w, h, color) {
    c.fillStyle = color;
    c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  function oval(c, x, y, rx, ry, color, step) {
    const s = step === undefined ? 3 : step;
    c.fillStyle = color;
    for (let yy = -ry; yy < ry; yy += s) {
      const xx = Math.sqrt(Math.max(0, 1 - ((yy + s / 2) / ry) ** 2)) * rx;
      c.fillRect(
        Math.round((x - xx) / s) * s,
        Math.round((y + yy) / s) * s,
        Math.round((xx * 2) / s) * s,
        s
      );
    }
  }

  function glyph(c, letter, x, y, size, color) {
    const s = size === undefined ? 4 : size;
    (LETTERS[letter] || LETTERS['?']).forEach(function (row, iy) {
      for (let ix = 0; ix < 5; ix++) {
        if (row & (1 << (4 - ix))) rect(c, x + ix * s, y + iy * s, s, s, color || paint.ink);
      }
    });
  }

  function star(c, x, y, r, color) {
    rect(c, x - 1, y - r, 2, r * 2, color);
    rect(c, x - r, y - 1, r * 2, 2, color);
  }

  function glow(c, x, y, r, color, strength) {
    c.save();
    c.globalAlpha = strength === undefined ? 1 : strength;
    c.globalCompositeOperation = 'screen';
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, 'transparent');
    c.fillStyle = g;
    c.fillRect(x - r, y - r, r * 2, r * 2);
    c.restore();
  }

  function flower(c, x, y, color, s) {
    const u = s === undefined ? 2 : s;
    rect(c, x, y + u, u, u * 3, paint.canopy[4]);
    rect(c, x - u * 2, y, u * 2, u, color);
    rect(c, x + u, y, u * 2, u, color);
    rect(c, x, y - u * 2, u, u * 2, color);
    rect(c, x, y + u, u, u, color);
    rect(c, x, y, u, u, paint.tileLight);
  }

  function tree(c, x, y, size, seed) {
    const r = random(seed);
    const palette = paint.canopy;
    oval(c, x + 10, y + 12, size * 0.9, size * 0.26, paint.trunkShadow);
    rect(c, x - 9, y - size * 0.7, 20, size * 0.8, paint.trunk);
    rect(c, x - 4, y - size * 0.7, 6, size * 0.75, paint.trunkLight);
    rect(c, x - 15, y, 31, 5, shade(raw.trunk, 0.1));
    oval(c, x, y - size * 0.63, size, size * 0.76, palette[0]);
    for (let i = 0; i < 24; i++) {
      const angle = r() * Math.PI * 2;
      const d = Math.sqrt(r()) * size * 0.7;
      const px = x + Math.cos(angle) * d;
      const py = y - size * 0.74 + Math.sin(angle) * d * 0.8;
      const light = Math.max(1, Math.min(5, Math.floor(3 - (px - x) / size - ((py - (y - size * 0.74)) / size) * 2)));
      oval(c, px, py, size * (0.2 + r() * 0.22), size * (0.15 + r() * 0.22), palette[light]);
    }
    for (let i = 0; i < size * 5; i++) {
      const px = (r() * 2 - 1) * size;
      const py = (r() * 2 - 1) * size * 0.66;
      if ((px * px) / (size * size) + (py * py) / (size * 0.66) ** 2 > 0.82) continue;
      const light = Math.max(1, Math.min(6, Math.floor(3 - px / size - (py / size) * 2 + r() * 2)));
      rect(
        c,
        x + px,
        y - size * 0.72 + py,
        2 + Math.floor(r() * 3) * 2,
        2 + Math.floor(r() * 2) * 2,
        palette[light]
      );
    }
  }

  function lantern(c, x, y) {
    rect(c, x - 3, y - 42, 6, 45, paint.trunk);
    rect(c, x - 5, y + 1, 10, 5, paint.trunkLight);
    rect(c, x - 7, y - 45, 26, 5, shade(raw.wood, -0.2));
    rect(c, x + 12, y - 40, 2, 9, paint.trunkShadow);
    rect(c, x + 4, y - 32, 18, 25, paint.trunk);
    rect(c, x + 7, y - 29, 12, 19, shade(raw.glow, -0.15));
    rect(c, x + 10, y - 28, 6, 17, paint.glowSoft);
    rect(c, x + 2, y - 35, 22, 5, paint.trunkShadow);
    rect(c, x + 4, y - 10, 18, 4, paint.wood);
  }

  function mushroom(c, x, y, scale) {
    const s = scale === undefined ? 1 : scale;
    rect(c, x - 2 * s, y - 8 * s, 5 * s, 10 * s, paint.tileLight);
    oval(c, x, y - 10 * s, 9 * s, 6 * s, paint.accent);
    rect(c, x - 4 * s, y - 14 * s, 4 * s, 3 * s, shade(raw.tile, 0.25));
    rect(c, x + 3 * s, y - 11 * s, 3 * s, 2 * s, paint.tileLight);
  }

  function stone(c, x, y, r, lit) {
    const rr = r === undefined ? 17 : r;
    oval(c, x + 2, y + 4, rr + 3, rr * 0.55, paint.stoneShadow);
    oval(c, x, y, rr, rr * 0.55, lit ? paint.stoneLit : paint.stone);
    oval(c, x - 2, y - 2, rr - 3, rr * 0.45, lit ? paint.stoneLitTop : paint.stoneLight);
    rect(c, x - rr + 7, y - 5, rr * 0.7, 2, lit ? shade(raw.glow, 0.55) : shade(raw.ground, 0.5));
  }

  function picture(c, kind, x, y) {
    if (kind === 'sun') {
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        rect(c, x + Math.cos(a) * 29 - 2, y + Math.sin(a) * 29 - 2, 5, 7, shade(raw.glow, -0.2));
        rect(c, x + Math.cos(a) * 29 - 2, y + Math.sin(a) * 29 - 3, 4, 6, paint.glowSoft);
      }
      oval(c, x, y, 21, 21, shade(raw.glow, -0.25));
      oval(c, x, y - 2, 19, 19, paint.glow);
      rect(c, x - 12, y - 14, 10, 3, paint.glowSoft);
      rect(c, x - 8, y - 4, 3, 4, paint.ink);
      rect(c, x + 6, y - 4, 3, 4, paint.ink);
      rect(c, x - 3, y + 7, 7, 2, paint.ink);
      rect(c, x - 5, y + 5, 2, 2, paint.ink);
    } else if (kind === 'apple') {
      rect(c, x, y - 26, 4, 11, paint.trunkLight);
      oval(c, x + 10, y - 23, 9, 4, paint.canopy[4]);
      oval(c, x - 8, y, 16, 20, shade(raw.accent, -0.2));
      oval(c, x + 8, y, 16, 20, paint.accent);
      oval(c, x - 8, y - 7, 9, 10, shade(raw.accent, 0.25));
      rect(c, x - 13, y - 13, 5, 7, paint.tileLight);
    } else {
      oval(c, x, y, 24, 24, shade(raw.tile, -0.15));
      oval(c, x, y - 2, 22, 23, paint.tileLight);
      oval(c, x + 11, y - 10, 19, 21, paint.trunkLight);
      rect(c, x - 10, y + 2, 3, 4, paint.ink);
      rect(c, x - 3, y + 10, 6, 2, paint.ink);
      star(c, x + 30, y - 12, 5, paint.glow);
    }
  }

  // Rasterizza sulla griglia locale dello sprite, poi lo sposta come un blocco
  // rigido: snappare in coordinate mondo faceva scivolare gli ovali da 3px contro
  // i dettagli del viso da 1px.
  function hero(c, x, y, phase, dir, carry) {
    c.save();
    c.translate(Math.round(x), Math.round(y));
    const shift = dir === 'left' ? -3 : (dir === 'right' ? 3 : 0);
    oval(c, 0, 2, 14, 5, 'rgba(70,60,80,0.45)');
    const frame = Math.floor(phase / (Math.PI / 2)) % 4;
    c.translate(0, frame % 2 ? -1 : 0);
    const step = [0, 2, 0, -2][frame];
    rect(c, -8, -7 + step, 6, 9, paint.trunkShadow);
    rect(c, 3, -7 - step, 6, 9, paint.trunkShadow);
    rect(c, -10, -23, 20, 19, paint.bodyDark);
    rect(c, -7, -23, 14, 18, paint.body);
    rect(c, -10, -8, 20, 4, shade(raw.body, -0.15));
    rect(c, -15, -25, 6, 15, shade(raw.skin, -0.12));
    rect(c, 10, -25, 6, 14, paint.skin);
    oval(c, 0, -36, 19, 19, paint.hoodDark);
    oval(c, 0, -38, 18, 18, paint.hood);
    oval(c, -4, -41, 13, 13, shade(raw.hood, 0.18));
    rect(c, -12, -50, 11, 3, shade(raw.hood, 0.45));
    if (dir !== 'up') {
      oval(c, shift, -33, 12, 12, paint.trunkLight);
      oval(c, shift, -31, 11, 10, paint.skin);
      rect(c, -6 + shift, -36, 4, 6, paint.ink);
      rect(c, 4 + shift, -36, 4, 6, paint.ink);
      rect(c, -3, -26, 6, 2, shade(raw.accent, -0.1));
      rect(c, -8, -23, 3, 12, paint.hood);
      rect(c, 5, -23, 3, 12, paint.hood);
      rect(c, -7, -16, 2, 2, shade(raw.hood, 0.45));
      rect(c, 6, -16, 2, 2, shade(raw.hood, 0.45));
      rect(c, -15, -21, 6, 12, paint.accent);
    } else {
      rect(c, -10, -24, 20, 16, shade(raw.accent, -0.2));
      rect(c, -8, -24, 16, 12, paint.accent);
      rect(c, -5, -17, 10, 7, shade(raw.accent, 0.2));
      rect(c, -2, -16, 4, 2, paint.tileLight);
    }
    if (carry) {
      const size = carry.length > 1 ? 3 : 4;
      const half = Math.round(Math.max(32, groupWidth(carry, size) + 14) / 2);
      rect(c, -half, -88, half * 2, 34, paint.woodDark);
      rect(c, -half + 1, -88, half * 2 - 2, 30, paint.tile);
      drawGroup(c, carry, -groupWidth(carry, size) / 2, -83, size, paint.ink);
      glow(c, 0, -74, 40, paint.glow, 0.4);
    }
    c.restore();
  }

  function owl(c, x, y, t) {
    oval(c, x, y + 4, 23, 10, paint.trunkShadow);
    rect(c, x - 18, y - 5, 36, 15, paint.trunkLight);
    oval(c, x, y - 5, 20, 8, shade(raw.trunk, 0.45));
    oval(c, x, y - 25, 17, 23, paint.trunkLight);
    oval(c, x, y - 21, 12, 16, shade(raw.trunk, 0.5));
    rect(c, x - 15, y - 46, 6, 10, paint.trunkLight);
    rect(c, x + 9, y - 46, 6, 10, paint.trunkLight);
    oval(c, x - 8, y - 33, 9, 11, paint.tileLight);
    oval(c, x + 8, y - 33, 9, 11, paint.tileLight);
    const blink = Math.sin(t * 0.7) > 0.997;
    rect(c, x - 10, y - 36, 4, blink ? 1 : 6, paint.ink);
    rect(c, x + 6, y - 36, 4, blink ? 1 : 6, paint.ink);
    rect(c, x - 2, y - 28, 4, 5, paint.glow);
    rect(c, x - 10, y - 5, 5, 4, paint.glow);
    rect(c, x + 5, y - 5, 5, 4, paint.glow);
  }

  function snail(c, x, y) {
    oval(c, x, y + 2, 19, 5, paint.stoneShadow);
    oval(c, x, y - 3, 17, 7, paint.stoneLight);
    oval(c, x - 13, y - 9, 6, 10, paint.tileLight);
    rect(c, x - 18, y - 24, 2, 11, paint.stone);
    rect(c, x - 10, y - 23, 2, 10, paint.stone);
    rect(c, x - 19, y - 25, 4, 4, paint.tileLight);
    rect(c, x - 11, y - 24, 4, 4, paint.tileLight);
    rect(c, x - 16, y - 13, 2, 3, paint.ink);
    oval(c, x + 4, y - 12, 13, 14, shade(raw.water, -0.35));
    oval(c, x + 3, y - 14, 11, 12, raw.water);
    oval(c, x + 4, y - 14, 7, 8, shade(raw.water, -0.3));
    oval(c, x + 4, y - 14, 4, 5, shade(raw.water, 0.3));
    rect(c, x + 2, y - 15, 4, 3, shade(raw.water, -0.2));
  }

  /* ------------------------------------------------------------------ scena */

  const scene = {
    background: null,
    foreground: null,
    waterCanvas: null,
    waterCtx: null,
    waterImage: null
  };

  function paintBackground() {
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const c = canvas.getContext('2d');
    const r = random(927);

    rect(c, 0, 0, W, H, paint.ground);
    oval(c, 400, 270, 325, 258, paint.groundMid);
    oval(c, 415, 297, 295, 188, paint.clearing);

    for (let i = 0; i < 13000; i++) {
      rect(c, r() * W, r() * H, 2 + r() * 5, 1 + r() * 3, paint.specks[Math.floor(r() * 5)]);
    }

    // Muschio, erbe e fiori solo ai margini: tengono leggibile lo spazio di gioco.
    for (let i = 0; i < 2400; i++) {
      const x = r() * W;
      const y = r() * H;
      const edge = Math.min(x, W - x, y * 0.95, (H - y) * 1.5);
      if (edge > 78 + r() * 30) continue;
      rect(c, x, y, 3 + r() * 9, 2 + r() * 5, paint.moss[Math.floor(r() * 5)]);
    }
    for (let i = 0; i < 190; i++) {
      const x = r() * W;
      const y = r() * H;
      if (x > 170 && x < 631 && y > 160 && y < 400) continue;
      flower(c, x, y, paint.blooms[Math.floor(r() * 4)], 1 + r() * 1.3);
    }
    for (let i = 0; i < 80; i++) {
      const x = r() * W;
      const y = r() * H;
      if (x > 190 && x < 620 && y > 60 && y < 413) continue;
      oval(c, x, y, 2 + r() * 3, 2, paint.stone);
      rect(c, x - 2, y - 2, 4, 2, paint.stoneLight);
    }

    // I sentieri di pietre incorniciano la radura aperta.
    for (let i = 0; i < 9; i++) {
      stone(c, 131 + i * 8 + Math.sin(i * 0.35) * 23, 443 - i * 26, 14 + i * 0.3, true);
    }
    for (let i = 0; i < 6; i++) stone(c, 601 + i * 7, 364 - i * 24, 12);

    for (let i = 0; i < 12; i++) tree(c, i * 72 - 15, 68 + Math.sin(i) * 17, 53 + r() * 15, 300 + i);
    for (let i = 0; i < 6; i++) {
      tree(c, 20 + Math.sin(i) * 20, 130 + i * 69, 49 + r() * 16, 450 + i);
      tree(c, 789 + Math.sin(i) * 20, 138 + i * 68, 61 + r() * 12, 470 + i);
    }
    tree(c, 118, 100, 43, 772);
    tree(c, 674, 104, 50, 993);
    tree(c, 712, 207, 35, 194);
    mushroom(c, 96, 333, 1.4);
    mushroom(c, 706, 382, 1.8);
    mushroom(c, 125, 145, 1);
    mushroom(c, 92, 435, 1.2);
    lantern(c, 159, 181);
    lantern(c, 617, 177);
    lantern(c, 682, 390);

    return canvas;
  }

  function paintForeground() {
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const f = canvas.getContext('2d');
    [
      [15, 532, 83, 123],
      [91, 546, 68, 124],
      [204, 558, 71, 125],
      [291, 571, 70, 126],
      [561, 574, 82, 127],
      [682, 552, 79, 128],
      [780, 527, 77, 129]
    ].forEach(function (t) {
      tree(f, t[0], t[1], t[2], t[3]);
    });
    [[105, 483], [191, 490], [609, 488], [724, 476]].forEach(function (p) {
      flower(f, p[0], p[1], paint.glowSoft, 3);
    });
    return canvas;
  }

  /* ------------------------------------------------------------------ stato */

  const state = {
    session: [],
    roundIndex: 0,
    solved: 0,
    mode: 'playing',
    carry: null,
    target: null,
    arrivedAt: -1,
    wrong: -1,
    wrongUntil: 0,
    hover: -1,
    time: 0,
    last: 0,
    acc: 0,
    lastStep: 0,
    winTime: 0,
    paused: false,
    helpOpen: false,
    player: { x: 410, y: 378, phase: 0, dir: 'up' },
    keys: new Set(),
    particles: [],
    rings: [],
    puddles: []
  };

  let canvas = null;
  let ctx = null;
  let raf = 0;
  let muted = storageGet(KEY_MUTED) === '1';

  function round() {
    return state.session[state.roundIndex];
  }

  /* ------------------------------------------------------------------ audio */

  let audioCtx = null;

  function tone(hz, duration, delay, type) {
    if (muted) return;
    try {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return;
      if (!audioCtx) audioCtx = new Ctor();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const at = audioCtx.currentTime + (delay || 0);
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type || 'sine';
      osc.frequency.value = hz;
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(0.065, at + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, at + (duration || 0.14));
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(at);
      osc.stop(at + (duration || 0.14));
    } catch (e) {
      // audio non disponibile: il gioco resta giocabile
    }
  }

  function plip() {
    if (muted || !audioCtx) return;
    try {
      const at = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(420 + Math.random() * 130, at);
      osc.frequency.exponentialRampToValueAtTime(180, at + 0.1);
      gain.gain.setValueAtTime(0.012, at);
      gain.gain.exponentialRampToValueAtTime(0.001, at + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(at);
      osc.stop(at + 0.13);
    } catch (e) {
      // audio non disponibile
    }
  }

  // Sentire la parola intera e' lo scaffolding del gioco, non un aiuto di
  // troppo: il compito non e' indovinare quale parola sia, ma scegliere come si
  // scrive il gruppo che si sente.
  function say(text, rate) {
    const synth = window.speechSynthesis;
    const Utterance = window.SpeechSynthesisUtterance;
    if (!synth || !Utterance) return;
    synth.cancel();
    const u = new Utterance(text);
    u.lang = 'it-IT';
    u.rate = rate || 0.8;
    synth.speak(u);
  }

  function speak() {
    say(round().word.toLowerCase() + '. ' + round().clue, 0.8);
  }

  /* -------------------------------------------------------------------- DOM */

  const dom = {};

  function announce(message) {
    if (dom.status) dom.status.textContent = message;
  }

  /*
    Il gufo spiega. La regola compare scritta (puo' contenere i gruppi: GN, CQU)
    mentre la voce pronuncia soltanto la parola intera, rallentata: la sintesi
    vocale legge "GN" come «gi enne», cioe' il nome delle lettere, che per la
    fonetica e' il contrario di quello che serve al bambino.
  */
  function owlTeach(round) {
    if (!dom.owl) return;
    const regola = REGOLE[round.skill];
    if (!regola) return;
    dom.owlText.textContent = regola + ' Ascolta: ' + round.word.toLowerCase() + '.';
    dom.owl.hidden = false;
    announce(regola);
    say(round.word.toLowerCase(), 0.65);
  }

  function owlHush() {
    if (dom.owl) dom.owl.hidden = true;
  }

  // Riga per l'adulto che guarda: quali gruppi il bambino sta sbagliando.
  // Non e' un punteggio e non compare al bambino come giudizio.
  function aggiornaRipasso() {
    if (!dom.ripasso) return;
    const gruppi = daRipassare(leggiAbilita()).slice(0, 3).map(function (s) { return ETICHETTE[s] || s; });
    dom.ripasso.hidden = gruppi.length === 0;
    dom.ripasso.textContent = gruppi.length ? 'Da ripassare: ' + gruppi.join(', ') + '.' : '';
  }

  function scegliClasse(classe) {
    storageSet(KEY_CLASSE, String(classe));
    aggiornaBottoniClasse();
    restart();
  }

  function aggiornaBottoniClasse() {
    const attuale = classeScelta();
    dom.classe.forEach(function (btn) {
      btn.setAttribute('aria-pressed', Number(btn.getAttribute('data-classe')) === attuale ? 'true' : 'false');
    });
  }

  function setMessage(text) {
    if (dom.message) dom.message.textContent = text;
    announce(text);
  }

  function renderWord() {
    const r = round();
    const done = state.mode === 'solved' || state.mode === 'complete';
    if (!dom.word) return;
    dom.word.textContent = '';
    const spoken = [];
    cellsOf(r).forEach(function (cell) {
      const span = document.createElement('span');
      const hidden = cell.hole && !done;
      span.textContent = hidden ? '_'.repeat(cell.units) : cell.text;
      if (cell.hole) span.className = 'missing';
      dom.word.appendChild(span);
      spoken.push(hidden ? 'spazio vuoto' : cell.text);
    });
    dom.word.setAttribute('aria-label', spoken.join(' '));
  }

  function renderChoices() {
    if (!dom.choices) return;
    dom.choices.textContent = '';
    if (state.mode !== 'playing') return;
    round().choices.forEach(function (letter, index) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = letter;
      button.setAttribute('aria-label', 'Scegli la lettera ' + letter);
      button.disabled = state.paused;
      button.addEventListener('click', function () {
        choose(index);
      });
      dom.choices.appendChild(button);
    });
  }

  function render() {
    const r = round();
    const won = state.mode === 'solved';
    const done = state.mode === 'complete';

    renderWord();
    renderChoices();

    if (dom.label) {
      dom.label.textContent = done
        ? 'Avventura completata'
        : (won ? 'Che bella scoperta!' : (state.carry ? 'Portalo al tabellone' : 'Quale gruppo manca?'));
    }
    if (dom.note) {
      dom.note.textContent = done
        ? 'Tre parole, tante scoperte.'
        : (won
          ? 'La radura brilla grazie a te.'
          : (state.carry
            ? 'Segui la luce dorata.'
            : (r.picture ? 'Guarda il disegno, ascolta ed esplora.' : 'Premi «Ascolta» e senti come suona.')));
    }
    if (dom.listen) dom.listen.hidden = won || done;
    if (dom.deliver) dom.deliver.hidden = !state.carry;
    if (dom.next) dom.next.hidden = !won;
    if (dom.pause) dom.pause.disabled = done || state.paused;

    dom.steps.forEach(function (node, i) {
      node.className = 'bosco-step' + (i < state.solved ? ' finished' : (i === state.solved ? ' current' : ''));
      node.textContent = i < state.solved ? '✓' : String(i + 1);
      node.setAttribute('aria-label', 'Parola ' + (i + 1) + (i < state.solved ? ': completata' : ''));
    });

    if (dom.wordAria) {
      dom.wordAria.textContent = state.solved + (state.solved === 1 ? ' parola completata' : ' parole completate') + ' su 3';
    }
    if (canvas) {
      canvas.dataset.playerX = state.player.x.toFixed(1);
      canvas.dataset.playerY = state.player.y.toFixed(1);
      canvas.dataset.state = state.mode;
    }
  }

  /* --------------------------------------------------------------- overlay */

  function openOverlay(title, lines, buttonLabel) {
    if (!dom.overlay) return;
    dom.overlayTitle.textContent = title;
    dom.overlayBody.textContent = '';
    lines.forEach(function (line) {
      const p = document.createElement('p');
      p.textContent = line;
      dom.overlayBody.appendChild(p);
    });
    dom.overlayBtn.textContent = buttonLabel;
    dom.overlay.classList.add('open');
    dom.overlayBtn.focus();
  }

  function closeOverlay() {
    if (dom.overlay) dom.overlay.classList.remove('open');
  }

  const HELP_LINES = [
    '1. Muoviti con le frecce o WASD. Puoi anche toccare un punto nella radura.',
    '2. Guarda il disegno e scegli la lettera che completa la parola.',
    '3. Porta la lettera al tabellone. E guarda le pozze incresparsi vicino a te!'
  ];

  function showPauseOverlay() {
    if (state.helpOpen) openOverlay('Un passo, una scoperta', HELP_LINES, 'Torniamo a esplorare');
    else openOverlay('Il bosco ti aspetta', ['Riparti quando vuoi. Qui non c’e’ fretta.'], 'Torniamo a esplorare');
  }

  function showVictoryOverlay() {
    openOverlay('Hai illuminato il bosco!', [
      'SOLE, MELA e LUNA: ogni lettera ha trovato il suo posto.',
      'Tre parole scoperte in una sola passeggiata.'
    ], 'Giochiamo ancora');
  }

  /* ------------------------------------------------------------------ gioco */

  function setPaused(value) {
    if (state.mode === 'complete') return;
    state.paused = value;
    state.keys.clear();
    state.target = null;
    if (value) {
      showPauseOverlay();
      setMessage('Il bosco ti aspetta.');
    } else {
      state.helpOpen = false;
      closeOverlay();
      setMessage(state.mode === 'carrying'
        ? 'Eccola! Portala al tabellone luminoso.'
        : (state.mode === 'solved'
          ? 'Hai scritto ' + round().word + '!'
          : 'Esplora la radura e scegli il gruppo mancante.'));
    }
    render();
  }

  function toggleHelp() {
    state.helpOpen = !state.helpOpen;
    if (state.helpOpen) setPaused(true);
    else setPaused(false);
  }

  function toggleMute() {
    muted = !muted;
    storageSet(KEY_MUTED, muted ? '1' : '0');
    if (dom.mute) {
      dom.mute.textContent = muted ? '🔇 Audio' : '🔊 Audio';
      dom.mute.setAttribute('aria-pressed', muted ? 'true' : 'false');
    }
    if (!muted) tone(523, 0.12);
  }

  function ripplePuddle(index, x, y, force, golden) {
    const p = state.puddles[index];
    const water = p.water;
    // Proietta i passi vicini appena dentro la riva: nulla viene disegnato
    // sul terreno asciutto.
    const nx = (x - p.x) / p.rx;
    const ny = (y - p.y) / p.ry;
    const distance = Math.hypot(nx, ny);
    const scale = distance > 0.65 ? 0.65 / distance : 1;
    const wx = water.width * (0.5 + nx * scale * 0.5);
    const wy = water.height * (0.5 + ny * scale * 0.5);
    water.disturb(wx, wy, force, 2);
    state.rings.push({ puddle: index, x: wx, y: wy, age: 0, golden: !!golden });
  }

  function splash(x, y, force) {
    let touched = false;
    state.puddles.forEach(function (p, index) {
      if (nearPuddle(p, x, y)) {
        ripplePuddle(index, x, y, force === undefined ? 0.65 : force, false);
        touched = true;
      }
    });
    if (touched) plip();
  }

  function celebratePuddles() {
    state.puddles.forEach(function (p, index) {
      ripplePuddle(index, p.x, p.y, 0.85, true);
    });
  }

  function burst(x, y, count) {
    let n = count;
    if (motionReduced()) n = Math.ceil(count * 0.3);
    for (let i = 0; i < n; i++) {
      state.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 150,
        vy: -25 - Math.random() * 100,
        age: 0,
        life: 1.2 + Math.random() * 1.6,
        color: paint.confetti[i % paint.confetti.length],
        size: 2 + Math.random() * 3
      });
    }
  }

  function choose(index) {
    if (state.mode !== 'playing' || state.paused) return;
    state.arrivedAt = -1;
    state.target = { x: TILE_POSITIONS[index].x, y: TILE_POSITIONS[index].y, tile: index };
  }

  function tap(x, y) {
    if (state.paused || state.mode === 'complete' || state.mode === 'solved') return;
    splash(x, y, 0.7);
    const index = TILE_POSITIONS.findIndex(function (p, i) {
      return onTile(i, x, y) || Math.hypot(p.x - x, p.y - y) < 33;
    });
    if (index >= 0 && state.mode === 'playing') {
      choose(index);
      return;
    }
    if (state.mode === 'carrying' && x > 250 && x < 550 && y < 194) {
      state.target = { x: 400, y: 208 };
      return;
    }
    state.target = clampPosition(x, y);
    state.arrivedAt = -1;
  }

  function collect(index) {
    if (state.mode !== 'playing' || state.arrivedAt === index) return;
    state.arrivedAt = index;
    const letter = round().choices[index];
    if (isCorrect(round(), letter)) {
      state.carry = letter;
      state.mode = 'carrying';
      state.target = null;
      tone(659);
      tone(880, 0.25, 0.12);
      burst(state.player.x, state.player.y - 32, 22);
      celebratePuddles();
      owlHush();
      registraRisposta(round().skill, true);
      aggiornaRipasso();
      setMessage('Eccola! Portala al tabellone luminoso.');
    } else {
      state.wrong = index;
      state.wrongUntil = state.time + 1.5;
      state.target = null;
      tone(392, 0.18);
      registraRisposta(round().skill, false);
      aggiornaRipasso();
      setMessage('Non e’ questo. Senti cosa dice il gufo.');
      owlTeach(round());
    }
    render();
  }

  function complete() {
    state.solved++;
    state.carry = null;
    state.mode = state.solved === state.session.length ? 'complete' : 'solved';
    state.target = null;
    state.winTime = state.time;
    burst(400, 126, 75);
    celebratePuddles();
    [523, 659, 784, 1047].forEach(function (note, i) {
      tone(note, 0.4, i * 0.12);
    });
    setMessage(state.mode === 'complete'
      ? 'Hai illuminato tutto il bosco!'
      : 'Hai scritto ' + round().word + '!');
    render();
    if (state.mode === 'complete') showVictoryOverlay();
  }

  function next() {
    if (state.mode !== 'solved') return;
    state.roundIndex++;
    state.mode = 'playing';
    state.carry = null;
    state.target = null;
    state.arrivedAt = -1;
    state.wrong = -1;
    owlHush();
    setMessage('Esplora la radura e scegli il gruppo mancante.');
    render();
  }

  function restart() {
    state.session = buildSession();
    state.roundIndex = 0;
    state.solved = 0;
    state.mode = 'playing';
    state.carry = null;
    state.target = null;
    state.arrivedAt = -1;
    state.wrong = -1;
    state.paused = false;
    state.helpOpen = false;
    state.particles = [];
    state.rings = [];
    state.player = { x: 410, y: 378, phase: 0, dir: 'up' };
    state.puddles.forEach(function (p) {
      p.water.front.fill(0);
      p.water.back.fill(0);
    });
    closeOverlay();
    owlHush();
    aggiornaRipasso();
    setMessage('Esplora la radura e scegli il gruppo mancante.');
    render();
  }

  /* --------------------------------------------------------------- update */

  function update(dt) {
    state.time += dt;
    state.acc += dt;
    let steps = 0;
    while (state.acc >= 1 / 60 && steps++ < 4) {
      state.puddles.forEach(function (p) {
        p.water.step();
      });
      state.acc -= 1 / 60;
    }

    if (state.mode !== 'solved' && state.mode !== 'complete') {
      const keys = state.keys;
      let dx = (keys.has('ArrowRight') || keys.has('d') ? 1 : 0) - (keys.has('ArrowLeft') || keys.has('a') ? 1 : 0);
      let dy = (keys.has('ArrowDown') || keys.has('s') ? 1 : 0) - (keys.has('ArrowUp') || keys.has('w') ? 1 : 0);
      if (dx || dy) state.target = null;
      if (state.target && !dx && !dy) {
        dx = state.target.x - state.player.x;
        dy = state.target.y - state.player.y;
        if (Math.hypot(dx, dy) < 3) {
          state.target = null;
          dx = 0;
          dy = 0;
        }
      }
      const length = Math.hypot(dx, dy);
      if (length) {
        const travel = state.target ? Math.min(SPEED * dt, length) : SPEED * dt;
        const moved = clampPosition(
          state.player.x + (dx / length) * travel,
          state.player.y + (dy / length) * travel
        );
        state.player.x = moved.x;
        state.player.y = moved.y;
        state.player.phase += dt * 12;
        state.player.dir = Math.abs(dx) > Math.abs(dy)
          ? (dx > 0 ? 'right' : 'left')
          : (dy > 0 ? 'down' : 'up');
        if (state.time - state.lastStep > 0.35) {
          splash(state.player.x, state.player.y, 0.55);
          state.lastStep = state.time;
        }
      }

      if (state.arrivedAt >= 0 && !onTile(state.arrivedAt, state.player.x, state.player.y)) {
        state.arrivedAt = -1;
      }

      if (state.mode === 'playing') {
        TILE_POSITIONS.forEach(function (p, i) {
          const targeted = !state.target || state.target.tile === undefined || state.target.tile === i;
          if (targeted && onTile(i, state.player.x, state.player.y)) collect(i);
        });
      }

      if (state.mode === 'carrying' && state.player.y < 220 && Math.abs(state.player.x - 400) < 123) {
        complete();
      }
    }

    state.rings = state.rings.filter(function (r) {
      r.age += dt;
      return r.age < 1.4;
    });
    state.particles = state.particles.filter(function (p) {
      p.age += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 42 * dt;
      return p.age < p.life;
    });

    if (state.mode === 'complete' && state.time - state.winTime < 4 && Math.random() < dt * 7) {
      burst(200 + Math.random() * 400, 100 + Math.random() * 100, 10);
    }
  }

  /* ---------------------------------------------------------------- disegno */

  function drawWater(t) {
    const image = scene.waterImage;
    const wc = scene.waterCtx;
    const base = paint.waterRgb;
    const edge = paint.waterEdgeRgb;

    state.puddles.forEach(function (puddle, index) {
      const water = puddle.water;
      const w = water.width;
      const h = water.height;
      const d = image.data;
      const a = water.front;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = y * w + x;
          const pixel = i * 4;
          if (!water.mask[i]) {
            d[pixel + 3] = 0;
            continue;
          }
          const slope = (a[i + 1] || 0) - (a[i - 1] || 0) + ((a[i + w] || 0) - (a[i - w] || 0)) * 0.65;
          const depth = 1 - ((x - w / 2) / (w / 2)) ** 2 - ((y - h / 2) / (h / 2)) ** 2;
          const shimmer = Math.sin(x * 0.16 + y * 0.25 + t * 0.35 + index) * 2;
          const light = Math.max(-9, Math.min(18, slope * 12));
          d[pixel] = base[0] + depth * 9 + shimmer + light;
          d[pixel + 1] = base[1] + depth * 10 + shimmer + light;
          d[pixel + 2] = base[2] + depth * 14 + shimmer + light * 0.6;
          d[pixel + 3] = 255;
          if (!water.mask[i - 1] || !water.mask[i + 1] || !water.mask[i - w] || !water.mask[i + w]) {
            d[pixel] = edge[0];
            d[pixel + 1] = edge[1];
            d[pixel + 2] = edge[2];
          }
        }
      }

      wc.putImageData(image, 0, 0);
      // source-atop tiene anelli e riflessi dentro la maschera di questa pozza.
      wc.save();
      wc.globalCompositeOperation = 'source-atop';
      state.rings.forEach(function (ring) {
        if (ring.puddle !== index) return;
        wc.globalAlpha = Math.max(0, (1 - ring.age / 1.4) * 0.45);
        wc.strokeStyle = ring.golden ? paint.glowSoft : shade(raw.waterEdge, 0.3);
        wc.lineWidth = 0.8;
        wc.beginPath();
        wc.ellipse(ring.x, ring.y, 2 + ring.age * 10, 1 + ring.age * 6, 0, 0, Math.PI * 2);
        wc.stroke();
      });
      wc.globalAlpha = 0.4;
      rect(wc, 11, 12, 7, 1, shade(raw.waterEdge, 0.45));
      rect(wc, 16, 10, 4, 1, shade(raw.waterEdge, 0.45));
      wc.restore();

      ctx.drawImage(
        scene.waterCanvas,
        puddle.x - puddle.rx,
        puddle.y - puddle.ry,
        puddle.rx * 2,
        puddle.ry * 2
      );
    });
  }

  // Larghezza del glifo scelta in base allo spazio della cella: le parole vanno
  // da 4 a 8 lettere e il buco puo' occupare fino a 3 caratteri, quindi il
  // passo fisso da 68 pixel del vecchio tabellone a quattro caselle non basta.
  const BOARD_X = 258;
  const BOARD_W = 284;

  function glyphSize(unit) {
    return Math.max(2, Math.min(5, Math.floor((unit - 12) / 5)));
  }

  function drawGroup(c, text, x, y, size, color) {
    for (let i = 0; i < text.length; i++) {
      glyph(c, text[i], x + i * size * 6, y, size, color);
    }
  }

  function groupWidth(text, size) {
    return text.length * size * 6 - size;
  }

  function groupSize(group) {
    return group.length > 1 ? 3 : 4;
  }

  // Mezza larghezza del cartello. La usano sia il disegno sia la raccolta: con
  // due formule separate il cartello di SCIE diventava largo 86 pixel mentre
  // l'area di raccolta restava un cerchio da 19, e ci si passava attraverso.
  function tileHalf(group) {
    return Math.round(Math.max(40, groupWidth(group, groupSize(group)) + 16) / 2);
  }

  // Il cartello e' un rettangolo, non un punto: si raccoglie dove lo si vede.
  // La banda verticale copre l'insegna sospesa e la pietra sotto.
  function onTile(index, x, y) {
    const p = TILE_POSITIONS[index];
    const group = round().choices[index];
    if (!group) return false;
    const dy = y - p.y;
    return Math.abs(x - p.x) <= tileHalf(group) && dy >= -46 && dy <= 30;
  }

  function drawBoard(t) {
    const c = ctx;
    const r = round();
    const won = state.mode === 'solved' || state.mode === 'complete';
    const cells = cellsOf(r);
    const unit = BOARD_W / r.word.length;
    const size = glyphSize(unit);

    oval(c, 401, 173, 151, 17, paint.stoneShadow);
    rect(c, 265, 109, 13, 73, paint.woodDark);
    rect(c, 522, 109, 13, 73, paint.woodDark);
    oval(c, 400, 70, 62, 40, shade(raw.wood, -0.35));
    oval(c, 400, 66, 59, 38, paint.wood);
    oval(c, 400, 67, 54, 34, paint.woodLight);
    rect(c, 250, 90, 300, 79, shade(raw.wood, -0.4));
    rect(c, 254, 87, 292, 76, paint.wood);
    rect(c, 258, 91, 284, 67, shade(raw.wood, -0.22));
    rect(c, 253, 88, 295, 4, shade(raw.wood, 0.3));
    rect(c, 254, 160, 292, 6, paint.woodLight);

    let cursor = BOARD_X;
    cells.forEach(function (cell) {
      const w = unit * cell.units;
      const x = cursor;
      cursor += w;
      const isMissing = cell.hole && !won;

      rect(c, x + 1, 98, w - 2, 59, shade(raw.wood, -0.5));
      rect(c, x + 3, 98, w - 6, 55, isMissing ? shade(raw.wood, -0.28) : shade(raw.tile, -0.18));
      if (!isMissing) {
        rect(c, x + 5, 100, w - 10, 49, paint.tile);
        rect(c, x + 6, 101, w - 12, 3, paint.tileLight);
        drawGroup(c, cell.text, x + (w - groupWidth(cell.text, size)) / 2, 111, size, paint.ink);
      } else {
        rect(c, x + 5, 102, w - 10, 47, shade(raw.wood, -0.45));
        c.save();
        c.globalAlpha = 0.6 + Math.sin(t * 2) * 0.2;
        glyph(c, '?', x + w / 2 - size * 2.5, 115, size, shade(raw.glow, -0.2));
        c.restore();
        if (state.mode === 'carrying') glow(c, x + w / 2, 128, 58, paint.glow, 0.65);
      }
    });

    // Il disegno c'e' solo per le parole di riscaldamento: le altre si
    // riconoscono dall'indizio, letto ad alta voce da «Ascolta».
    if (r.picture) picture(c, r.picture, 400, 57);
    else {
      // Senza disegno l'arco tiene una lanterna accesa. Un secondo "?" sopra il
      // tabellone duplicherebbe quello gia' presente nella casella vuota.
      oval(c, 400, 60, 15, 15, shade(raw.wood, -0.3));
      oval(c, 400, 58, 12, 12, paint.glowSoft);
      glow(c, 400, 58, 34, paint.glow, 0.45);
    }

    if (won) {
      glow(c, 400, 125, 150, paint.glow, 0.38);
      for (let i = 0; i < 6; i++) {
        star(c, 270 + i * 47, 88 + Math.sin(t * 2 + i) * 5, 3, paint.glowSoft);
      }
    }
    if (state.mode === 'carrying') {
      const y = 193 + Math.sin(t * 4) * 3;
      rect(c, 396, y, 8, 8, paint.glow);
      rect(c, 393, y + 3, 14, 3, paint.glow);
      glow(c, 400, 205, 25, paint.glow, 0.5);
    }
  }

  function drawTile(index, t) {
    if (state.mode === 'solved' || state.mode === 'complete') return;
    const c = ctx;
    const p = TILE_POSITIONS[index];
    const collected = state.carry === round().choices[index];

    stone(c, p.x, p.y + 7, 26, collected);
    if (collected) return;

    const group = round().choices[index];
    const size = groupSize(group);
    const half = tileHalf(group);
    const lift = Math.sin(t * 1.7 + index * 2) * 2;
    const y = p.y - 38 + lift;
    const highlight = state.hover === index || (state.target && state.target.tile === index);
    if (highlight) glow(c, p.x, p.y - 15, 40, paint.glowSoft, 0.45);
    rect(c, p.x - half, y + 3, half * 2, 43, paint.woodDark);
    rect(c, p.x - half, y, half * 2, 39, shade(raw.tile, -0.22));
    rect(c, p.x - half + 3, y + 2, half * 2 - 6, 33, paint.tile);
    rect(c, p.x - half + 4, y + 3, half * 2 - 8, 3, paint.tileLight);
    drawGroup(c, group, p.x - groupWidth(group, size) / 2, y + 9, size, paint.ink);
    if (index === state.wrong && state.time < state.wrongUntil) {
      c.strokeStyle = paint.glowSoft;
      c.lineWidth = 2;
      c.strokeRect(p.x - half - 3, y - 3, half * 2 + 6, 46);
    }
    star(c, p.x + 14, p.y - 49 + Math.sin(t * 2 + index) * 3, 2, paint.glowSoft);
  }

  function draw() {
    const c = ctx;
    const t = state.time;
    const calm = motionReduced();

    if (!scene.background) scene.background = paintBackground();
    if (!scene.foreground) scene.foreground = paintForeground();

    c.imageSmoothingEnabled = false;
    c.drawImage(scene.background, 0, 0);
    drawWater(t);
    drawBoard(t);
    owl(c, 161, 230, t);
    snail(c, 643, 312);

    const actors = TILE_POSITIONS.map(function (p, i) {
      return { y: p.y, draw: function () { drawTile(i, t); } };
    });
    actors.push({
      y: state.player.y,
      draw: function () {
        glow(c, state.player.x, state.player.y - 12, 63, paint.glow, 0.12);
        hero(c, state.player.x, state.player.y, state.player.phase, state.player.dir, state.carry);
      }
    });
    actors.sort(function (a, b) { return a.y - b.y; }).forEach(function (a) { a.draw(); });

    if (state.target && state.target.tile === undefined) {
      c.save();
      c.globalAlpha = 0.6;
      c.strokeStyle = paint.tileLight;
      c.lineWidth = 2;
      c.beginPath();
      c.ellipse(state.target.x, state.target.y, 7, 3, 0, 0, Math.PI * 2);
      c.stroke();
      c.restore();
    }

    state.particles.forEach(function (p) {
      c.save();
      c.globalAlpha = Math.min(1, (p.life - p.age) * 2);
      rect(c, p.x, p.y, p.size, p.size * 0.7, p.color);
      c.restore();
    });

    [[172, 159], [630, 155], [695, 368]].forEach(function (p) {
      glow(c, p[0], p[1], 86, paint.glow, 0.46 + Math.sin(t * 2 + p[0]) * 0.04);
      star(c, p[0], p[1], 3, paint.glowSoft);
    });

    // Polline caldo e pozze di luce incorniciano il mondo.
    for (let i = 0; i < 20; i++) {
      const x = 120 + ((i * 67) % 562) + Math.sin(t * 0.35 + i) * 12;
      const y = 98 + ((i * 43) % 320) + Math.sin(t * 0.5 + i) * 8;
      c.save();
      c.globalAlpha = 0.3 + (Math.sin(t + i) + 1) * 0.23;
      star(c, x, y, i % 4 === 0 ? 3 : 1, paint.glowSoft);
      c.restore();
    }
    for (let i = 0; i < 6; i++) {
      glow(c, 140 + i * 13, 434 - i * 25, 27, paint.glow, 0.31);
    }

    c.drawImage(scene.foreground, 0, 0);
    if (!calm) {
      glow(c, 285, 42, 245, paint.glowSoft, 0.09);
      glow(c, 481, 310, 170, shade(raw.accent, 0.5), 0.075);
    }
  }

  function frame(now) {
    const dt = Math.min(0.04, (now - (state.last || now)) / 1000);
    state.last = now;
    if (!state.paused) update(dt);
    draw();
    raf = requestAnimationFrame(frame);
  }

  /* ------------------------------------------------------------------ input */

  function pointFromEvent(event) {
    const r = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - r.left) / r.width) * W,
      y: ((event.clientY - r.top) / r.height) * H
    };
  }

  function bindInput() {
    canvas.addEventListener('pointerdown', function (event) {
      canvas.focus({ preventScroll: true });
      const p = pointFromEvent(event);
      tap(p.x, p.y);
    });

    canvas.addEventListener('pointermove', function (event) {
      const p = pointFromEvent(event);
      state.hover = TILE_POSITIONS.findIndex(function (q, i) {
        return onTile(i, p.x, p.y) || Math.hypot(q.x - p.x, q.y - p.y) < 39;
      });
    });

    canvas.addEventListener('pointerleave', function () {
      state.hover = -1;
    });

    window.addEventListener('keydown', function (event) {
      const target = event.target;
      const tag = target && target.tagName ? target.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;

      if (key === 'Escape') {
        event.preventDefault();
        if (state.mode === 'complete') return;
        state.helpOpen = false;
        setPaused(!state.paused);
        return;
      }
      if (state.paused) return;

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(key)) {
        // Un primo passo immediato: una pressione molto breve cadrebbe altrimenti
        // fra due frame senza spostare nulla.
        event.preventDefault();
        state.keys.add(key);
        if (!event.repeat) update(1 / 60);
      }
      if (['1', '2', '3'].includes(key) && !event.repeat) choose(Number(key) - 1);
    });

    window.addEventListener('keyup', function (event) {
      state.keys.delete(event.key.length === 1 ? event.key.toLowerCase() : event.key);
    });

    window.addEventListener('blur', function () {
      state.keys.clear();
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden && state.mode !== 'complete' && !state.paused) setPaused(true);
    });

    new MutationObserver(readPalette).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-palette']
    });
  }

  function bindActions() {
    document.querySelectorAll('[data-action]').forEach(function (node) {
      node.addEventListener('click', function () {
        const action = node.getAttribute('data-action');
        if (action === 'toggle-mute') toggleMute();
        else if (action === 'toggle-pause') setPaused(!state.paused);
        else if (action === 'toggle-help') toggleHelp();
        else if (action === 'resume') {
          if (state.mode === 'complete') restart();
          else setPaused(false);
        } else if (action === 'play-again') restart();
        else if (action === 'listen') speak();
        else if (action === 'deliver') tap(400, 170);
        else if (action === 'next-word') next();
      });
    });
  }

  /* ------------------------------------------------------------------- init */

  function init() {
    canvas = document.getElementById('boscoCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d', { alpha: false });
    canvas.width = W;
    canvas.height = H;

    dom.status = document.getElementById('gameStatus');
    dom.message = document.getElementById('boscoMessage');
    dom.label = document.getElementById('boscoLabel');
    dom.word = document.getElementById('boscoWord');
    dom.note = document.getElementById('boscoNote');
    dom.choices = document.getElementById('boscoChoices');
    dom.listen = document.getElementById('boscoListen');
    dom.deliver = document.getElementById('boscoDeliver');
    dom.next = document.getElementById('boscoNext');
    dom.pause = document.getElementById('boscoPause');
    dom.mute = document.getElementById('boscoMute');
    dom.ripasso = document.getElementById('boscoRipasso');
    dom.classe = Array.prototype.slice.call(document.querySelectorAll('[data-classe]'));
    dom.owl = document.getElementById('boscoOwl');
    dom.owlText = document.getElementById('boscoOwlText');
    dom.overlay = document.getElementById('boscoOverlay');
    dom.overlayTitle = document.getElementById('boscoOverlayTitle');
    dom.overlayBody = document.getElementById('boscoOverlayBody');
    dom.overlayBtn = document.getElementById('boscoOverlayBtn');
    dom.wordAria = document.getElementById('boscoJourneyLabel');
    dom.steps = Array.prototype.slice.call(document.querySelectorAll('.bosco-step'));

    state.session = buildSession();

    state.puddles = PUDDLES.map(function (p) {
      return { x: p.x, y: p.y, rx: p.rx, ry: p.ry, water: new Water(PUDDLE_W, PUDDLE_H) };
    });

    scene.waterCanvas = document.createElement('canvas');
    scene.waterCanvas.width = PUDDLE_W;
    scene.waterCanvas.height = PUDDLE_H;
    scene.waterCtx = scene.waterCanvas.getContext('2d');
    scene.waterImage = scene.waterCtx.createImageData(PUDDLE_W, PUDDLE_H);

    readPalette();
    bindInput();
    bindActions();
    aggiornaBottoniClasse();
    aggiornaRipasso();
    dom.classe.forEach(function (btn) {
      btn.addEventListener('click', function () {
        scegliClasse(Number(btn.getAttribute('data-classe')));
      });
    });

    if (muted && dom.mute) {
      dom.mute.textContent = '🔇 Audio';
      dom.mute.setAttribute('aria-pressed', 'true');
    }

    setMessage('Esplora la radura e scegli il gruppo mancante.');
    render();
    raf = requestAnimationFrame(frame);
  }

  SA.bosco = {
    state: state,
    parole: PAROLE,
    confusioni: CONFUSIONI,
    regole: REGOLE,
    buildRound: buildRound,
    buildSession: buildSession,
    leggiAbilita: leggiAbilita,
    registraRisposta: registraRisposta,
    daRipassare: daRipassare,
    peso: peso,
    cellsOf: cellsOf,
    tileHalf: tileHalf,
    groupWidth: groupWidth,
    groupSize: groupSize,
    puddles: PUDDLES,
    tiles: TILE_POSITIONS,
    Water: Water,
    isCorrect: isCorrect,
    nearPuddle: nearPuddle,
    clampPosition: clampPosition,
    choose: choose,
    tap: tap,
    restart: restart,
    stop: function () {
      cancelAnimationFrame(raf);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
