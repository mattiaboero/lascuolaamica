#!/usr/bin/env node
// Controlli sul modello del gioco /bosco (js/bosco.js): parole, confini della
// radura e simulazione dell'acqua. Sono le sole parti con logica non banale, e
// nessuna di esse ha bisogno di un canvas: il file espone il modello su
// SA.bosco e init() esce subito se non trova #boscoCanvas, quindi basta un
// window/document finti per caricarlo qui.

const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SOURCE = path.join(ROOT, 'js', 'bosco.js');

function loadGame() {
  const noop = function () {};
  const documentStub = {
    readyState: 'complete',
    documentElement: { getAttribute: function () { return null; } },
    body: {},
    getElementById: function () { return null; },
    querySelectorAll: function () { return []; },
    createElement: function () { return { getContext: function () { return null; } }; },
    addEventListener: noop
  };
  global.window = {
    SA: {},
    location: { hostname: 'check.invalid', search: '' }, // niente DEBUG_MODE: i wrapper storage devono restare silenziosi qui
    document: documentStub,
    addEventListener: noop,
    getComputedStyle: function () { return { getPropertyValue: function () { return ''; } }; },
    matchMedia: function () { return { matches: false }; }
  };
  global.document = documentStub;
  global.MutationObserver = function () { return { observe: noop }; };
  global.requestAnimationFrame = function () { return 0; };
  global.cancelAnimationFrame = noop;

  require(SOURCE);
  const api = global.window.SA.bosco;
  assert.ok(api, 'js/bosco.js deve esporre SA.bosco');
  return api;
}

function checkRounds(game) {
  const words = new Set(game.parole.map(function (w) { return w.word; }));

  game.parole.forEach(function (entry) {
    const where = entry.word;
    assert.match(entry.word, /^[A-ZÀÁÈÉÌÍÒÓ]{4,8}$/, `${where}: parola in maiuscolo, da 4 a 8 lettere`);

    const start = entry.hole[0];
    const len = entry.hole[1];
    assert.ok(start >= 0 && len >= 1 && start + len <= entry.word.length, `${where}: buco fuori dalla parola`);

    const answer = entry.word.substr(start, len);
    assert.equal(entry.errate.length, 2, `${where}: servono esattamente due distrattori (i supporti nella radura sono tre)`);
    assert.equal(new Set(entry.errate).size, entry.errate.length, `${where}: distrattori ripetuti`);

    entry.errate.forEach(function (wrong) {
      assert.notEqual(wrong, answer, `${where}: un distrattore coincide con la risposta`);
      assert.match(wrong, /^[A-ZÀÁÈÉÌÍÒÓ]{1,4}$/, `${where}: distrattore "${wrong}" non valido`);

      // Un distrattore non deve produrre un'altra parola del banco: la scelta
      // avrebbe due risposte difendibili.
      const other = entry.word.slice(0, start) + wrong + entry.word.slice(start + len);
      assert.ok(!words.has(other), `${where}: il distrattore "${wrong}" produce ${other}, che e' un'altra parola del banco`);
    });

    assert.ok(entry.clue.trim().length > 0, `${where}: manca l'indizio letto da "Ascolta"`);
    assert.ok(game.regole[entry.skill], `${where}: l'abilita' "${entry.skill}" non ha una regola che il gufo possa dire`);
    assert.ok(entry.diff >= 1 && entry.diff <= 3, `${where}: difficolta' fuori scala`);
  });
}

/*
  Il cuore didattico: i distrattori devono restare CONFONDIBILI. Fra RAGNO e
  RANIO si discrimina; fra RAGNO e RATNO si tira a indovinare. Senza questo
  controllo il banco scivola verso lettere a caso appena qualcuno aggiunge
  parole, e il gioco torna a essere un indovinello senza che nulla si rompa.
*/
function checkConfusability(game) {
  game.parole.forEach(function (entry) {
    const answer = entry.word.substr(entry.hole[0], entry.hole[1]);
    const famiglia = game.confusioni[entry.skill];

    if (famiglia) {
      assert.ok(famiglia.includes(answer), `${entry.word}: la risposta "${answer}" non e' nella famiglia "${entry.skill}"`);
      entry.errate.forEach(function (wrong) {
        assert.ok(famiglia.includes(wrong), `${entry.word}: "${wrong}" non e' un errore plausibile per "${entry.skill}"`);
      });
      return;
    }

    // doppie: la risposta e' una consonante raddoppiata; ogni distrattore e' o
    // la scempia corrispondente, o un'altra doppia (confusione sorda/sonora o
    // di luogo, entrambe reali nei primi anni di scuola).
    assert.match(answer, /^([B-DF-HJ-NP-TV-Z])\1$/, `${entry.word}: "${answer}" non e' una doppia`);
    entry.errate.forEach(function (wrong) {
      const plausibile = wrong === answer[0] || /^([B-DF-HJ-NP-TV-Z])\1$/.test(wrong);
      assert.ok(plausibile, `${entry.word}: "${wrong}" non e' ne' la scempia ne' un'altra doppia`);
    });
  });
}

// Le celle del tabellone devono ricomporre esattamente la parola, con il buco
// in un'unica cella larga quanto il gruppo che ci va dentro.
function checkCells(game) {
  game.parole.forEach(function (entry) {
    const round = game.buildRound(entry);
    const cells = game.cellsOf(round);
    assert.equal(cells.map(function (c) { return c.text; }).join(''), entry.word,
      `${entry.word}: le celle non ricompongono la parola`);
    const holes = cells.filter(function (c) { return c.hole; });
    assert.equal(holes.length, 1, `${entry.word}: deve esserci un buco solo`);
    assert.equal(holes[0].text, round.answer, `${entry.word}: il buco non contiene la risposta`);
    assert.equal(cells.reduce(function (n, c) { return n + c.units; }, 0), entry.word.length,
      `${entry.word}: la larghezza delle celle non torna`);
  });
}

/*
  Il cartello si raccoglie dove lo si vede. Il buco copre fino a quattro
  caratteri, quindi il cartello di SCIE e' largo piu' del doppio di quello di
  una lettera sola: quando la larghezza disegnata e quella di raccolta erano
  calcolate da due formule diverse, si camminava attraverso il cartello senza
  che il gioco reagisse. Qui si verifica che l'area di raccolta contenga sempre
  l'insegna disegnata, e che due cartelli non possano sovrapporsi.
*/
function checkTileHitArea(game) {
  const gruppi = new Set();
  game.parole.forEach(function (entry) {
    gruppi.add(entry.word.substr(entry.hole[0], entry.hole[1]));
    entry.errate.forEach(function (wrong) { gruppi.add(wrong); });
    // Nella caccia al suono sul cartello va la parola intera, non il gruppo.
    gruppi.add(entry.word);
  });

  let widest = 0;
  gruppi.forEach(function (group) {
    const disegnato = game.groupWidth(group, game.groupSize(group));
    const raccolta = game.tileHalf(group) * 2;
    assert.ok(raccolta >= disegnato + 12,
      `"${group}": l'area di raccolta (${raccolta}px) non contiene l'insegna disegnata (${disegnato}px)`);
    widest = Math.max(widest, raccolta);
  });

  const xs = game.tiles.map(function (t) { return t.x; }).sort(function (a, b) { return a - b; });
  for (let i = 1; i < xs.length; i++) {
    assert.ok(xs[i] - xs[i - 1] > widest,
      `due supporti distano ${xs[i] - xs[i - 1]}px ma un cartello puo' essere largo ${widest}px: si sovrapporrebbero`);
  }
}

// Una partita: riscaldamento con disegno, poi due gruppi ortografici di
// abilita' diverse. Il pescaggio e' casuale, quindi va provato molte volte.
function checkSession(game) {
  for (let run = 0; run < 300; run++) {
    const session = game.buildSession();
    assert.equal(session.length, 3, "la partita e' di tre parole");
    assert.equal(session[0].skill, 'vocali', "la prima parola e' un riscaldamento");
    assert.ok(session[0].picture, 'la parola di riscaldamento ha il disegno sul tabellone');
    assert.notEqual(session[1].skill, session[2].skill, "le due parole ortografiche allenano abilita' diverse");
    assert.ok(session[2].diff >= 2, "l'ultima parola non e' la piu' facile");

    session.forEach(function (r) {
      assert.equal(r.choices.length, 3, `${r.word}: tre scelte, una per supporto nella radura`);
      assert.equal(new Set(r.choices).size, 3, `${r.word}: scelte ripetute`);
      assert.equal(r.choices.filter(function (c) { return game.isCorrect(r, c); }).length, 1,
        `${r.word}: deve esserci una sola scelta corretta`);
    });
  }
}

/*
  Adattamento (fase 6). L'unica cosa che cambia e' COSA viene chiesto: la classe
  filtra le parole, i gruppi piu' deboli tornano piu' spesso, e quello sbagliato
  torna nella partita successiva. Niente di tutto questo tocca timer, punteggi o
  penalita', che nel gioco non esistono.
*/
function checkAdattamento(game) {
  const vuote = { skills: {}, ripassa: null };

  // La classe filtra: la 2a non deve mai proporre parole di terza.
  for (let i = 0; i < 200; i++) {
    game.buildSession({ classe: 2, stats: vuote }).forEach(function (r) {
      assert.ok(r.cls <= 2, `classe 2: e' uscita ${r.word}, che e' di classe ${r.cls}`);
    });
  }
  const terze = new Set();
  for (let i = 0; i < 300; i++) {
    game.buildSession({ classe: 3, stats: vuote }).forEach(function (r) { terze.add(r.cls); });
  }
  assert.ok(terze.has(3), 'classe 3: le parole di terza non escono mai');

  // Il peso segue la precisione, non il caso.
  const forte = { skills: { gn: { visti: 10, ok: 10 } }, ripassa: null };
  const debole = { skills: { gn: { visti: 10, ok: 2 } }, ripassa: null };
  assert.ok(game.peso('gn', debole) > game.peso('gn', forte),
    'un gruppo sbagliato spesso deve pesare piu\' di uno consolidato');
  assert.ok(game.peso('mai_visto', vuote) > game.peso('gn', forte),
    'un gruppo mai visto deve pesare piu\' di uno consolidato');

  // Con un gruppo debole e uno consolidato, il debole deve uscire di piu'.
  const misto = { skills: { gn: { visti: 8, ok: 1 }, doppie: { visti: 8, ok: 8 } }, ripassa: null };
  let deboli = 0;
  let consolidati = 0;
  for (let i = 0; i < 800; i++) {
    game.buildSession({ classe: 3, stats: misto }).forEach(function (r) {
      if (r.skill === 'gn') deboli++;
      if (r.skill === 'doppie') consolidati++;
    });
  }
  assert.ok(deboli > consolidati,
    `il gruppo debole deve ricomparire piu' spesso (gn ${deboli}, doppie ${consolidati})`);

  // Recupero spaziato: il gruppo sbagliato l'ultima volta torna nella partita dopo.
  const daRipassare = { skills: { gli: { visti: 3, ok: 1 } }, ripassa: 'gli' };
  for (let i = 0; i < 200; i++) {
    const session = game.buildSession({ classe: 3, stats: daRipassare });
    assert.ok(session.some(function (r) { return r.skill === 'gli'; }),
      'il gruppo segnato da ripassare deve tornare nella partita successiva');
  }
}

// La memoria per gruppo si aggiorna sulle risposte e si azzera quando il gruppo
// viene indovinato. Gira sul fallback in memoria dei wrapper storage.
function checkMemoria(game) {
  game.registraRisposta('gn', false);
  let dati = game.leggiAbilita();
  assert.equal(dati.skills.gn.visti, 1);
  assert.equal(dati.skills.gn.ok, 0);
  assert.equal(dati.ripassa, 'gn', 'una risposta sbagliata segna il gruppo da ripassare');

  game.registraRisposta('gn', true);
  dati = game.leggiAbilita();
  assert.equal(dati.skills.gn.visti, 2);
  assert.equal(dati.skills.gn.ok, 1);
  assert.equal(dati.ripassa, null, 'indovinare il gruppo lo libera dal ripasso');

  // "Da ripassare" chiede almeno due tentativi: un errore solo non basta per
  // dire a un adulto che il bambino deve ripassare un gruppo.
  const unSolo = { skills: { sc: { visti: 1, ok: 0 } }, ripassa: 'sc' };
  assert.deepEqual(game.daRipassare(unSolo), [], 'un tentativo solo non fa scattare il ripasso');

  const due = { skills: { sc: { visti: 4, ok: 1 }, vocali: { visti: 6, ok: 0 } }, ripassa: null };
  assert.deepEqual(game.daRipassare(due), ['sc'], 'le vocali non entrano nel ripasso');
}

/*
  Caccia al suono: sul tabellone il gruppo, nella radura tre parole intere. La
  cosa da difendere e' che i due distrattori quel gruppo non ce l'abbiano
  davvero, altrimenti la domanda avrebbe due risposte giuste.
*/
/*
  PAROLE_VICINE elenca le parole italiane vere che nascono da un gruppo
  sbagliato (CASA da CASSA, PALA da PALLA). Il gufo le riconosce invece di
  liquidarle come errori di ortografia. Due modi di sbagliare l'elenco: metterci
  una parola che nessuna scelta del banco produce — resta li' per sempre senza
  che nessuno se ne accorga — oppure, molto peggio, una parola che coincide con
  una risposta giusta, e allora il gufo darebbe della "quasi giusta" alla parola
  esatta.
*/
/*
  Il ciclo raccogli -> consegna. Regressione da cui nasce questo controllo: si
  poteva prendere solo il cartello giusto, quindi bastava camminare sui tre
  supporti per trovare la risposta senza leggere la parola, e la consegna non
  decideva niente. Qui si verifica che in mano finisca qualunque cartello e che
  a giudicare sia la consegna.
*/
function checkCicloRaccoltaConsegna(game) {
  const s = game.state;
  // I coriandoli leggono la tavolozza, che init() qui non ha mai riempito:
  // senza canvas il gioco non disegna, ma burst() gira lo stesso.
  game.readPalette();

  s.session = [game.buildRound(game.parole.find(function (p) { return p.word === 'CASSA'; }))];
  s.roundIndex = 0;
  s.solved = 0;
  s.mode = 'playing';
  s.carry = null;
  s.carryFrom = -1;
  s.arrivedAt = -1;

  const round = s.session[0];
  const sbagliato = round.choices.findIndex(function (g) { return !game.isCorrect(round, g); });
  const giusto = round.choices.findIndex(function (g) { return game.isCorrect(round, g); });

  game.collect(sbagliato);
  assert.equal(s.mode, 'carrying', 'il cartello sbagliato deve poter finire in mano');
  assert.equal(s.carry, round.choices[sbagliato]);
  assert.equal(s.solved, 0, 'raccogliere non e\' rispondere');

  game.consegna();
  assert.equal(s.mode, 'playing', 'consegnato quello sbagliato si torna a esplorare');
  assert.equal(s.carry, null, 'il cartello sbagliato torna a terra');
  assert.equal(s.solved, 0, 'la parola non e\' risolta');
  assert.equal(s.wrong, sbagliato, 'il cartello sbagliato resta segnato');

  s.arrivedAt = -1;
  game.collect(giusto);
  assert.equal(s.carry, round.choices[giusto]);
  game.consegna();
  assert.equal(s.solved, 1, 'consegnando quello giusto la parola si chiude');

  // CASSA/CASA: il gufo deve riconoscere la parola vera prima di correggere.
  const casa = game.messaggioErrore(round, round.choices[sbagliato] === 'S' ? 'S' : round.choices[sbagliato]);
  assert.ok(typeof casa === 'string' && casa.length > 0);
  assert.ok(/^CASA e/.test(game.messaggioErrore(round, 'S')),
    'CASA deve essere riconosciuta come parola vera, non liquidata come errore');
  assert.ok(/^Non e/.test(game.messaggioErrore(round, 'ZZ')),
    'una non-parola resta un errore normale');
}

/*
  Il finale nominava tre parole fisse nel sorgente mentre la partita le estrae a
  caso: quasi ogni bambino chiudeva sentendosi elencare parole mai viste.
*/
function checkFinale(game) {
  assert.equal(game.elencoParole(['SOLE', 'MELA', 'LUNA']), 'SOLE, MELA e LUNA');
  assert.equal(game.elencoParole(['SOLE', 'MELA']), 'SOLE e MELA');
  assert.equal(game.elencoParole(['SOLE']), 'SOLE');
  assert.equal(game.elencoParole([]), '');

  // Nessuna parola del banco deve restare scritta a mano nel testo del finale.
  const sorgente = fs.readFileSync(SOURCE, 'utf8');
  const finale = sorgente.match(/function showVictoryOverlay\(\)[\s\S]*?\n  }/)[0];
  game.parole.forEach(function (entry) {
    assert.equal(finale.indexOf(entry.word), -1,
      `showVictoryOverlay nomina ${entry.word} nel sorgente: il finale deve dire le parole della partita giocata`);
  });
}

/*
  I fiori della crescita stanno a terra: uno sotto un cartello sarebbe coperto,
  uno dentro una pozza sarebbe un fiore in acqua. Sono coordinate scelte a mano
  e a occhio le distanze si sbagliano, quindi le misura il controllo.
*/
function checkCrescita(game) {
  const fiori = game.FIORI_CRESCITA;
  const lucciole = game.LUCCIOLE;
  assert.ok(fiori.length >= 4, 'servono abbastanza fiori perche\' la crescita si veda');
  assert.ok(lucciole.length >= 4, 'servono abbastanza lucciole');

  fiori.forEach(function (f) {
    const dove = `fiore (${f.x}, ${f.y})`;
    const dentro = game.clampPosition(f.x, f.y);
    assert.equal(dentro.x, f.x, `${dove}: fuori dalla radura in orizzontale`);
    assert.equal(dentro.y, f.y, `${dove}: fuori dalla radura in verticale`);

    game.puddles.forEach(function (p) {
      const dx = (f.x - p.x) / (p.rx + 12);
      const dy = (f.y - p.y) / (p.ry + 12);
      assert.ok(dx * dx + dy * dy > 1, `${dove}: finisce dentro la pozza (${p.x}, ${p.y})`);
    });

    game.tiles.forEach(function (t) {
      assert.ok(Math.abs(f.x - t.x) > 46 || Math.abs(f.y - t.y) > 56,
        `${dove}: finisce sotto il cartello (${t.x}, ${t.y})`);
    });

    // Il tabellone occupa la fascia alta al centro: e' anche l'area in cui si
    // consegna, dove il personaggio passa sempre.
    assert.ok(!(f.y < 232 && Math.abs(f.x - 400) < 140), `${dove}: finisce sotto il tabellone`);
  });

  const chiavi = new Set(fiori.concat(lucciole).map(function (p) { return p.x + ':' + p.y; }));
  assert.equal(chiavi.size, fiori.length + lucciole.length, 'due decorazioni sullo stesso punto');
}

function checkParoleVicine(game) {
  const vicine = game.PAROLE_VICINE;
  assert.ok(vicine && vicine.size > 0, 'PAROLE_VICINE e\' vuoto');

  const producibili = new Set();
  const risposte = new Set();
  game.parole.forEach(function (entry) {
    const round = { word: entry.word, hole: entry.hole };
    risposte.add(entry.word);
    entry.errate.forEach(function (gruppo) {
      producibili.add(game.parolaCon(round, gruppo));
    });
  });

  vicine.forEach(function (w) {
    assert.ok(producibili.has(w),
      `${w} e' in PAROLE_VICINE ma nessun distrattore del banco la produce`);
    assert.ok(!risposte.has(w),
      `${w} e' in PAROLE_VICINE ed e' anche una parola del banco: il gufo la tratterebbe da errore`);
  });

  // Nella caccia al suono i cartelli portano parole intere: infilare il gruppo
  // nel buco non ha senso e la premessa del gufo non deve scattare.
  assert.equal(game.parolaCon({ tipo: 'suono', word: 'CASSA', hole: [2, 2] }, 'S'), null,
    'parolaCon deve tacere nella caccia al suono');
}

function checkCacciaAlSuono(game) {
  for (let run = 0; run < 300; run++) {
    const session = game.buildSession({ modalita: 'suono', classe: 3, stats: { skills: {}, ripassa: null } });
    assert.equal(session.length, 3, 'anche la caccia al suono e\' di tre giri');

    const skills = session.map(function (r) { return r.skill; });
    assert.equal(new Set(skills).size, 3, 'i tre giri allenano gruppi diversi');

    session.forEach(function (r) {
      assert.equal(r.tipo, 'suono');
      assert.equal(r.choices.length, 3, `${r.target}: tre parole nella radura`);
      assert.equal(new Set(r.choices).size, 3, `${r.target}: parole ripetute`);
      assert.ok(r.choices.indexOf(r.answer) >= 0, `${r.target}: la risposta non e' fra le scelte`);
      assert.ok(r.answer.indexOf(r.target) >= 0, `${r.answer} non contiene ${r.target}`);

      const sbagliate = r.choices.filter(function (w) { return w !== r.answer; });
      sbagliate.forEach(function (w) {
        assert.equal(w.indexOf(r.target), -1,
          `${r.target}: anche il distrattore ${w} contiene il gruppo, la domanda avrebbe due risposte`);
      });

      const cells = game.cellsOf(r);
      assert.equal(cells.map(function (c) { return c.text; }).join(''), r.target,
        'il tabellone deve mostrare il gruppo da cercare');
      assert.equal(cells.filter(function (c) { return c.hole; }).length, 0,
        'nella caccia al suono il tabellone non ha buchi');
    });
  }

  // La classe filtra anche qui.
  for (let run = 0; run < 100; run++) {
    game.buildSession({ modalita: 'suono', classe: 2, stats: { skills: {}, ripassa: null } })
      .forEach(function (r) {
        assert.ok(r.cls <= 2, `classe 2: e' uscita ${r.word} di classe ${r.cls}`);
      });
  }
}

// Ogni lettera disegnata sul tabellone e sulle tessere passa dal font 5x7
// interno: una lettera senza glifo verrebbe disegnata come "?" senza errori.
function checkGlyphs(game) {
  const source = fs.readFileSync(SOURCE, 'utf8');
  const block = source.slice(source.indexOf('const LETTERS = {'), source.indexOf('const PUDDLE_W'));
  const needed = new Set(['?']);
  game.parole.forEach(function (entry) {
    entry.word.split('').forEach(function (l) { needed.add(l); });
    entry.errate.forEach(function (wrong) {
      wrong.split('').forEach(function (l) { needed.add(l); });
    });
  });
  needed.forEach(function (letter) {
    const key = /[A-Z]/.test(letter) ? letter : `'${letter}'`;
    assert.ok(block.includes(`${key}: [`), `manca il glifo per "${letter}" in LETTERS`);
  });
}

function checkBounds(game) {
  assert.deepEqual(game.clampPosition(-100, -100), { x: 122, y: 202 });
  assert.deepEqual(game.clampPosition(900, 900), { x: 682, y: 433 });
}

// Il centro della radura resta asciutto: personaggio, tabellone e i tre supporti
// delle lettere non devono mai finire dentro una pozza.
function checkDryCenter(game) {
  const dry = [{ x: 410, y: 378 }, { x: 400, y: 208 }].concat(game.tiles);
  dry.forEach(function (spot) {
    game.puddles.forEach(function (puddle) {
      assert.equal(
        game.nearPuddle(puddle, spot.x, spot.y),
        false,
        `il punto ${spot.x},${spot.y} finisce dentro la pozza ${puddle.x},${puddle.y}`
      );
    });
  });
}

function checkWater(game) {
  const water = new game.Water(48, 32);
  const center = 16 * water.width + 24;

  water.disturb(24, 16, 5, 2);
  assert.ok(water.front[center] > 0, 'il tocco deve alzare la superficie');
  assert.equal(water.front[center + 10], 0, 'la perturbazione non deve essere istantanea');

  for (let i = 0; i < 20; i++) water.step();
  assert.notEqual(water.front[center + 10], 0, "l'onda deve propagarsi ai vicini");

  const peak = Math.max.apply(null, Array.from(water.front, Math.abs));
  for (let i = 0; i < 900; i++) water.step();
  const rest = Math.max.apply(null, Array.from(water.front, Math.abs));
  assert.ok(rest < peak * 0.01, `lo smorzamento deve calmare l'acqua (picco ${peak}, residuo ${rest})`);
  assert.ok(Array.from(water.front).every(Number.isFinite), 'il buffer non deve divergere');

  for (let i = 0; i < water.mask.length; i++) {
    if (!water.mask[i]) assert.equal(water.front[i], 0, 'nulla si muove fuori dalla maschera della pozza');
  }

  // Un tocco fuori dalla pozza non deve poter scrivere nel buffer.
  const dry = new game.Water(48, 32);
  dry.disturb(-50, 30, 20, 3);
  dry.disturb(999, 999, 20, 3);
  for (let i = 0; i < 4; i++) dry.step();
  assert.equal(Array.from(dry.front).some(function (v) { return v !== 0; }), false);
}

function main() {
  const game = loadGame();
  const checks = [
    ['banco parole', checkRounds],
    ['distrattori confondibili', checkConfusability],
    ['celle del tabellone', checkCells],
    ['area di raccolta dei cartelli', checkTileHitArea],
    ['composizione della partita', checkSession],
    ['adattamento e classe', checkAdattamento],
    ['caccia al suono', checkCacciaAlSuono],
    ['finale della partita', checkFinale],
    ['crescita della radura', checkCrescita],
    ['parole vicine', checkParoleVicine],
    ['ciclo raccolta e consegna', checkCicloRaccoltaConsegna],
    ['memoria delle abilita', checkMemoria],
    ['glifi disponibili', checkGlyphs],
    ['confini della radura', checkBounds],
    ['centro asciutto', checkDryCenter],
    ['simulazione dell acqua', checkWater]
  ];

  let failed = false;
  checks.forEach(function (entry) {
    try {
      entry[1](game);
      console.error(`[OK] bosco: ${entry[0]}`);
    } catch (error) {
      failed = true;
      console.error(`[ERROR] bosco: ${entry[0]} — ${error.message}`);
      if (process.env.BOSCO_TRACE) console.error(error.stack);
    }
  });

  if (failed) process.exit(1);
  console.error('[OK] js/bosco.js: tutti i controlli superati');
}

main();
