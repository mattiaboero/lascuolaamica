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
    assert.match(entry.word, /^[A-Z]{4,8}$/, `${where}: parola in maiuscolo, da 4 a 8 lettere`);

    const start = entry.hole[0];
    const len = entry.hole[1];
    assert.ok(start >= 0 && len >= 1 && start + len <= entry.word.length, `${where}: buco fuori dalla parola`);

    const answer = entry.word.substr(start, len);
    assert.equal(entry.errate.length, 2, `${where}: servono esattamente due distrattori (i supporti nella radura sono tre)`);
    assert.equal(new Set(entry.errate).size, entry.errate.length, `${where}: distrattori ripetuti`);

    entry.errate.forEach(function (wrong) {
      assert.notEqual(wrong, answer, `${where}: un distrattore coincide con la risposta`);
      assert.match(wrong, /^[A-Z]{1,4}$/, `${where}: distrattore "${wrong}" non valido`);

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
    ['composizione della partita', checkSession],
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
    }
  });

  if (failed) process.exit(1);
  console.error('[OK] js/bosco.js: tutti i controlli superati');
}

main();
