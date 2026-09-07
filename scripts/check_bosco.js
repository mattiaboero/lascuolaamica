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
  // Una sola risposta giusta per parola: due lettere corrette renderebbero
  // impossibile spiegare l'errore al bambino.
  game.rounds.forEach(function (round) {
    const correct = round.choices.filter(function (letter) {
      return game.isCorrect(round, letter);
    });
    assert.equal(correct.length, 1, `${round.word}: deve avere una sola scelta corretta`);
    assert.equal(round.word.length, 4, `${round.word}: le parole sono di quattro lettere`);
    assert.equal(new Set(round.choices).size, 3, `${round.word}: le tre scelte devono essere diverse`);
    assert.ok(round.missing >= 0 && round.missing < round.word.length, `${round.word}: indice della lettera mancante fuori dalla parola`);
    assert.ok(round.clue.trim().length > 0, `${round.word}: manca l'indizio letto da "Ascolta"`);
  });
}

// Ogni lettera disegnata sul tabellone e sulle tessere passa dal font 5x7
// interno: una lettera senza glifo verrebbe disegnata come "?" senza errori.
function checkGlyphs(game) {
  const source = fs.readFileSync(SOURCE, 'utf8');
  const block = source.slice(source.indexOf('const LETTERS = {'), source.indexOf('const PUDDLE_W'));
  const needed = new Set();
  game.rounds.forEach(function (round) {
    round.word.split('').forEach(function (l) { needed.add(l); });
    round.choices.forEach(function (l) { needed.add(l); });
  });
  needed.add('?');
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
    ['parole e scelte', checkRounds],
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
