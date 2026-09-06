(function () {
  'use strict';

  const SA = window.SA = window.SA || {};
  const KEY_HIGHSCORE = 'lascuolaamica_breakout_highscore_v1';
  const KEY_CLASS = 'lascuolaamica_breakout_class_v1';
  const KEY_MUTED = 'lascuolaamica_breakout_muted_v1';
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

  const VIEW = { w: 900, h: 600 };
  const WALL = { top: 74, padX: 10, rows: 8, cols: 12, gap: 4, brickH: 22 };
  const PADDLE = { baseW: 132, h: 16, y: 548, keySpeed: 660, tapStep: 22 };
  const BALL = { r: 8, baseSpeed: 300, maxAngle: Math.PI / 3, minVyRatio: 0.30 };

  // Progressione velocita': 4 mattoni, poi altri 12, poi prima fila gialla, poi rossa.
  const SPEED_STEPS = [1, 1.12, 1.24, 1.36, 1.48];
  const SPEEDUP_AT_HITS = [4, 16];
  const LEVEL_SPEEDUP = 1.10;

  // Riga 0 = in alto. Coppie di righe -> fascia colore (0 = 1 punto ... 3 = 7 punti).
  const ROW_TIER = [3, 3, 2, 2, 1, 1, 0, 0];
  const TIER_POINTS = [1, 3, 5, 7];
  const TIER_VARS = ['--breakout-brick-1', '--breakout-brick-2', '--breakout-brick-3', '--breakout-brick-4'];
  const TIER_FALLBACK = ['#009E73', '#0072B2', '#E69F00', '#D55E00'];
  const START_LIVES = 3;

  const BRICK_W = (VIEW.w - 2 * WALL.padX - (WALL.cols - 1) * WALL.gap) / WALL.cols;

  // Materie da cui pescare le domande: stesso pool dei giochi materia (json/*.json).
  const SUBJECTS = ['matematica', 'inglese', 'problemi', 'civica', 'geografia', 'storia', 'scienze', 'italiano'];

  const CAPSULE = { r: 13, vy: 130 };
  const BONUS_DURATION_MS = 15000;
  const BONUS_SPAWN_CHANCE = 0.08;
  // Fascia 0=verde, 1=blu, 2=gialla, 3=rossa. "Barra larga" solo dai rossi,
  // "+1 vita" da blu/gialli/rossi, gli altri due bonus da qualsiasi mattone.
  const BONUS_ALLOWED_BY_TIER = [
    ['sticky', 'destroyColor'],
    ['sticky', 'destroyColor', 'extraLife'],
    ['sticky', 'destroyColor', 'extraLife'],
    ['sticky', 'destroyColor', 'extraLife', 'wide']
  ];
  const BONUS_LABELS = {
    wide: { symbol: '⇔', intro: 'Rispondi bene per allargare la barra per 15 secondi.', label: 'Barra larga' },
    extraLife: { symbol: '❤', intro: 'Rispondi bene per guadagnare una vita in più.', label: 'Vita extra' },
    destroyColor: { symbol: '✳', intro: 'Rispondi bene per distruggere tutti i mattoni di un colore.', label: 'Colore distrutto' },
    sticky: { symbol: '●', intro: 'Rispondi bene per rendere la pallina appiccicosa per 15 secondi.', label: 'Palla appiccicosa' }
  };
  // Colora ogni capsula come la fascia di mattoni da cui puo' cadere: stesso hue di
  // tierColors, quindi resta corretta anche in modalita' Okabe senza calcoli in piu'.
  const BONUS_TIER_COLOR = { wide: 3, extraLife: 1, destroyColor: 2, sticky: 0 };
  const SQUASH_MS = 130;

  /* ----------------------------------------------------------------- stato */

  const state = {
    running: false,
    paused: false,
    waiting: false,
    locked: false,
    now: 0,
    schoolClass: storageGet(KEY_CLASS) || '',
    score: 0,
    lives: START_LIVES,
    level: 1,
    highScore: Number(storageGet(KEY_HIGHSCORE)) || 0,
    bricksDestroyed: 0,
    bricks: [],
    bricksLeft: 0,
    brickHits: 0,
    speedStep: 0,
    tierBumped: [false, false, false, false],
    paddleHalved: false,
    paddle: { x: (VIEW.w - PADDLE.baseW) / 2, w: PADDLE.baseW, bounceUntil: 0 },
    ball: { x: VIEW.w / 2, y: PADDLE.y - BALL.r, vx: 0, vy: 0, stuck: true, squashUntil: 0, squashAxis: 'y' },
    keys: { left: false, right: false },
    capsule: null,
    bonuses: {
      wide: { active: false, until: 0 },
      sticky: { active: false, until: 0 }
    },
    questionPool: [],
    rawPool: [],
    poolClass: '',
    // Dati per i trofei (azzerati a ogni beginGame). wallsClearedTotal e i campi
    // recordedX tracciano quanto e' gia' stato inviato a rewards.js: flushBreakoutProgress
    // invia solo la differenza, cosi' salvare piu' volte per partita non conta doppio.
    ballSaves: 0,
    lifeLostThisLevel: false,
    wallsClearedTotal: 0,
    wallsClearedNoLifeLost: 0,
    terracottaRowCleared: false,
    bonusTypesUsedThisGame: null,
    sessionSettled: false,
    recordedBricks: 0,
    recordedWalls: 0,
    recordedWallsNoLifeLost: 0,
    recordedSaves: 0,
    last: 0
  };

  // Ganci per le fasi successive (trofei).
  const handlers = {
    onBrickDestroyed: null,
    onBallLost: null,
    onLevelCleared: null,
    onGameOver: null,
    onBonusActivated: null
  };

  let canvas = null;
  let ctx = null;
  let rafId = 0;
  let muted = storageGet(KEY_MUTED) === '1';
  let tierColors = TIER_FALLBACK.slice();
  let overlayReturnFocus = null;
  const paint = { field: '#fffdf7', ink: '#1f2d3d', paddle: '#2f8e86' };

  // Sprite pre-renderizzati (ricostruiti a ogni cambio palette, vedi readPalette):
  // disegnare un mattone/pallina "candy" con drawImage costa meno che ridisegnare
  // gradiente + bordo + riflesso per ognuno dei ~96 mattoni a ogni frame.
  let brickSprites = TIER_FALLBACK.map(function () { return null; });
  let ballSprite = null;

  // Effetti decorativi (particelle, punteggio volante): azzerati a ogni beginGame,
  // spenti del tutto se l'utente preferisce meno animazioni.
  let particles = [];
  let floatTexts = [];

  /* ----------------------------------------------------------------- audio */

  let audioCtx = null;

  function beep(freq, duration, type, volume) {
    if (muted) return;
    try {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return;
      if (!audioCtx) audioCtx = new Ctor();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type || 'square';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(volume || 0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      // audio non disponibile: il gioco resta giocabile
    }
  }

  /* -------------------------------------------------------------- utilita' */

  function clamp(value, min, max) {
    return value < min ? min : (value > max ? max : value);
  }

  // true se l'utente ha chiesto meno animazioni (toggle del sito o preferenza di
  // sistema): spegne solo gli effetti decorativi (particelle, wobble, squash), mai
  // il movimento di gioco vero e proprio.
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

  function hexToRgb(hex) {
    const raw = String(hex || '').replace('#', '');
    const v = raw.length === 3 ? raw.split('').map(function (c) { return c + c; }).join('') : raw;
    const num = parseInt(v, 16) || 0;
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  }

  // Schiarisce (amt>0) o scurisce (amt<0) un colore esadecimale, amt in [-1, 1].
  // Usato per i gradienti "candy" dei mattoni/pallina/barra: parte sempre dal colore
  // token attuale (Wada o Okabe), mai da un valore fisso, cosi' resta corretto in
  // entrambe le palette senza calcoli dedicati.
  function shade(hex, amt) {
    const rgb = hexToRgb(hex);
    const mixed = amt >= 0
      ? rgb.map(function (c) { return c + (255 - c) * amt; })
      : rgb.map(function (c) { return c * (1 + amt); });
    return 'rgb(' + mixed.map(function (c) { return Math.round(clamp(c, 0, 255)); }).join(',') + ')';
  }

  function announce(message) {
    const node = document.getElementById('gameStatus');
    if (node) node.textContent = message;
  }

  function pop(text, kind) {
    const node = document.getElementById('feedback');
    if (!node) return;
    node.className = 'feedback';
    node.textContent = text;
    void node.offsetWidth;
    node.className = 'feedback show ' + (kind || 'ok');
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

  // Letti una volta per partita e a ogni cambio palette: getComputedStyle e' troppo
  // costoso per chiamarlo a ogni frame.
  function readPalette() {
    const styles = window.getComputedStyle(document.body);
    const pick = function (name, fallback) {
      return styles.getPropertyValue(name).trim() || fallback;
    };
    tierColors = TIER_VARS.map(function (name, i) {
      return pick(name, TIER_FALLBACK[i]);
    });
    paint.field = pick('--breakout-field', '#fffdf7');
    paint.ink = pick('--breakout-ink', '#1f2d3d');
    paint.paddle = pick('--accent-1', '#2f8e86');
    buildBrickSprites();
    buildBallSprite();
  }

  /* -------------------------------------------------------------- domande */

  // Carica il pool di domande delle 8 materie per la classe scelta, filtrando su
  // json/index.json (stesso dataset dei giochi materia). Messo in cache per classe:
  // partite successive con la stessa classe riusano il pool gia' pescato.
  async function loadQuestionPool(schoolClass) {
    if (!SA.questionsLoader) return;
    if (state.poolClass === schoolClass && state.rawPool.length) return;

    const grade = Number(schoolClass);
    const lists = await Promise.all(SUBJECTS.map(function (subject) {
      return SA.questionsLoader.getSubjectRows(subject, { path: 'json/index.json' }).catch(function () {
        return [];
      });
    }));

    const pool = [];
    lists.forEach(function (rows, i) {
      rows.forEach(function (row) {
        if (Number(row.class) !== grade) return;
        if (row.active === false) return;
        const options = Array.isArray(row.options) ? row.options.slice(0, 4) : [];
        if (options.length < 2) return;
        const answerIndex = Number.isInteger(row.answerIndex) ? row.answerIndex : options.indexOf(row.answer);
        if (answerIndex < 0 || answerIndex >= options.length) return;
        pool.push({
          question: String(row.question || '').trim(),
          options: options,
          answerIndex: answerIndex,
          explanation: String(row.explanation || '').trim(),
          subject: SUBJECTS[i]
        });
      });
    });

    state.rawPool = pool;
    state.poolClass = schoolClass;
    state.questionPool = shuffle(pool.slice());
  }

  // Pesca senza ripetizioni finche' il mazzo (migliaia di domande per classe) non si
  // esaurisce; in quel caso rimescola da capo. In una partita normale non si esaurisce mai.
  function getNextQuestion() {
    if (!state.questionPool.length) {
      if (!state.rawPool.length) return null;
      state.questionPool = shuffle(state.rawPool.slice());
    }
    return state.questionPool.pop();
  }

  // Mostra la domanda nell'overlay e risolve con true/false in base alla risposta.
  function showQuestion(question, opts) {
    return new Promise(function (resolve) {
      const overlay = document.getElementById('screenQuestionOverlay');
      const titleNode = document.getElementById('questionTitle');
      const textNode = document.getElementById('questionText');
      const optionsNode = document.getElementById('questionOptions');
      const explanationNode = document.getElementById('questionExplanation');
      const continueBtn = document.getElementById('questionContinue');
      if (!overlay || !optionsNode) {
        resolve(false);
        return;
      }

      // Focus trap: il gioco resta sotto (aria-modal da solo non basta, il browser
      // non impedisce a Tab di uscire dal dialog) e alla chiusura torna a chi aveva
      // il focus prima, cosi' chi naviga solo da tastiera non lo perde nel canvas.
      overlayReturnFocus = document.activeElement;

      titleNode.textContent = opts.title || 'Domanda';
      textNode.textContent = (opts.intro ? opts.intro + ' ' : '') + question.question;
      explanationNode.hidden = true;
      explanationNode.textContent = '';
      optionsNode.replaceChildren();
      if (continueBtn) continueBtn.hidden = true;

      const order = shuffle(question.options.map(function (_, i) { return i; }));
      let answered = false;

      order.forEach(function (optIndex) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'question-option';
        btn.textContent = question.options[optIndex];
        btn.addEventListener('click', function () {
          if (answered) return;
          answered = true;
          const correct = optIndex === question.answerIndex;
          Array.prototype.forEach.call(optionsNode.children, function (node, idx) {
            node.disabled = true;
            if (order[idx] === question.answerIndex) node.classList.add('correct');
            else if (node === btn) node.classList.add('wrong');
          });
          if (question.explanation) {
            explanationNode.textContent = question.explanation;
            explanationNode.hidden = false;
          }
          beep(correct ? 720 : 220, correct ? 0.18 : 0.25, correct ? 'triangle' : 'sawtooth', 0.05);
          finish(correct);
        });
        optionsNode.appendChild(btn);
      });

      function closeOverlay(correct) {
        overlay.classList.remove('active');
        restoreOverlayFocus();
        resolve(correct);
      }

      function finish(correct) {
        if (!continueBtn) {
          closeOverlay(correct);
          return;
        }
        continueBtn.hidden = false;
        continueBtn.focus();
        const onContinue = function () {
          continueBtn.removeEventListener('click', onContinue);
          continueBtn.hidden = true;
          closeOverlay(correct);
        };
        continueBtn.addEventListener('click', onContinue);
      }

      overlay.classList.add('active');
      const firstOption = optionsNode.querySelector('button');
      if (firstOption) firstOption.focus();
    });
  }

  function restoreOverlayFocus() {
    const target = overlayReturnFocus;
    overlayReturnFocus = null;
    if (target && document.contains(target) && typeof target.focus === 'function') target.focus();
  }

  // Tutti gli elementi con cui si puo' interagire nell'overlay attivo, nell'ordine
  // in cui compaiono: serve per far girare Tab/Shift+Tab solo dentro al dialog.
  function getOverlayFocusables() {
    const overlay = document.getElementById('screenQuestionOverlay');
    if (!overlay) return [];
    return Array.prototype.filter.call(
      overlay.querySelectorAll('button'),
      function (node) { return !node.disabled && !node.hidden; }
    );
  }

  function trapOverlayFocus(event) {
    if (event.key !== 'Tab') return;
    const overlay = document.getElementById('screenQuestionOverlay');
    if (!overlay || !overlay.classList.contains('active')) return;
    const focusables = getOverlayFocusables();
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  async function handleBallLostQuestion() {
    const question = getNextQuestion();
    if (!question) return false;
    return showQuestion(question, {
      title: 'Salva la palla!',
      intro: 'Rispondi bene per riattaccare la pallina alla barra.'
    });
  }

  async function handleBonusCaught(type) {
    state.locked = true;
    const meta = BONUS_LABELS[type];
    const question = getNextQuestion();
    if (!question) {
      state.locked = false;
      return;
    }
    const correct = await showQuestion(question, { title: 'Bonus!', intro: meta.intro });
    state.locked = false;
    if (correct) {
      activateBonus(type);
    } else {
      pop('Bonus perso', 'ko');
      announce('Risposta sbagliata: bonus non attivato.');
    }
  }

  /* ------------------------------------------------------------ costruzione */

  function buildWall() {
    state.bricks = [];
    for (let row = 0; row < WALL.rows; row++) {
      for (let col = 0; col < WALL.cols; col++) {
        state.bricks.push({
          x: WALL.padX + col * (BRICK_W + WALL.gap),
          y: WALL.top + row * (WALL.brickH + WALL.gap),
          w: BRICK_W,
          h: WALL.brickH,
          row: row,
          col: col,
          tier: ROW_TIER[row],
          points: TIER_POINTS[ROW_TIER[row]],
          alive: true
        });
      }
    }
    state.bricksLeft = state.bricks.length;
  }

  function paddleWidth() {
    const bonus = SA.breakout && SA.breakout.paddleBonusFactor ? SA.breakout.paddleBonusFactor : 1;
    return PADDLE.baseW * (state.paddleHalved ? 0.5 : 1) * bonus;
  }

  function applyPaddleWidth() {
    const center = state.paddle.x + state.paddle.w / 2;
    state.paddle.w = paddleWidth();
    setPaddleX(center - state.paddle.w / 2);
  }

  function setPaddleX(x) {
    state.paddle.x = clamp(x, 0, VIEW.w - state.paddle.w);
  }

  function currentSpeed() {
    return BALL.baseSpeed * SPEED_STEPS[state.speedStep] * Math.pow(LEVEL_SPEEDUP, state.level - 1);
  }

  function bumpSpeed() {
    if (state.speedStep >= SPEED_STEPS.length - 1) return;
    state.speedStep += 1;
    normalizeVelocity();
    beep(880, 0.09, 'triangle', 0.04);
  }

  function normalizeVelocity() {
    const ball = state.ball;
    if (ball.stuck) return;
    const target = currentSpeed();
    const magnitude = Math.hypot(ball.vx, ball.vy) || target;
    let vx = ball.vx / magnitude * target;
    let vy = ball.vy / magnitude * target;
    const minVy = target * BALL.minVyRatio;
    if (Math.abs(vy) < minVy) {
      vy = (vy < 0 ? -1 : 1) * minVy;
      const vxMagnitude = Math.sqrt(Math.max(target * target - vy * vy, 0));
      vx = (vx < 0 ? -1 : 1) * vxMagnitude;
    }
    ball.vx = vx;
    ball.vy = vy;
  }

  function stickBall() {
    state.ball.x = state.paddle.x + state.paddle.w / 2;
    state.ball.y = PADDLE.y - BALL.r - 1;
    state.ball.vx = 0;
    state.ball.vy = 0;
  }

  function resetBall() {
    state.ball.stuck = true;
    stickBall();
  }

  function launchBall() {
    if (!state.ball.stuck || state.locked) return;
    const speed = currentSpeed();
    const angle = (Math.random() < 0.5 ? -1 : 1) * (0.25 + Math.random() * 0.25);
    state.ball.stuck = false;
    state.ball.vx = speed * Math.sin(angle);
    state.ball.vy = -speed * Math.cos(angle);
    beep(560, 0.08, 'square', 0.04);
  }

  /* --------------------------------------------------------------- bonus */

  function maybeSpawnBonus(brick) {
    if (state.capsule) return;
    if (Math.random() > BONUS_SPAWN_CHANCE) return;
    const allowed = BONUS_ALLOWED_BY_TIER[brick.tier];
    const type = allowed[Math.floor(Math.random() * allowed.length)];
    state.capsule = {
      type: type,
      x: brick.x + brick.w / 2,
      y: brick.y + brick.h / 2,
      vy: CAPSULE.vy
    };
  }

  function updateCapsule(dt) {
    const capsule = state.capsule;
    if (!capsule) return;
    capsule.y += capsule.vy * dt;

    const paddle = state.paddle;
    const caught = capsule.y + CAPSULE.r >= PADDLE.y && capsule.y - CAPSULE.r <= PADDLE.y + PADDLE.h &&
      capsule.x >= paddle.x - CAPSULE.r && capsule.x <= paddle.x + paddle.w + CAPSULE.r;

    if (caught) {
      const type = capsule.type;
      state.capsule = null;
      beep(600, 0.08, 'triangle', 0.05);
      handleBonusCaught(type);
      return;
    }
    if (capsule.y - CAPSULE.r > VIEW.h) state.capsule = null;
  }

  function activateBonus(type) {
    const isNewBonusType = !!(state.bonusTypesUsedThisGame && !state.bonusTypesUsedThisGame.has(type));
    if (state.bonusTypesUsedThisGame) state.bonusTypesUsedThisGame.add(type);
    const until = state.now + BONUS_DURATION_MS;
    if (type === 'wide') {
      state.bonuses.wide.active = true;
      state.bonuses.wide.until = until;
      SA.breakout.paddleBonusFactor = 1.5;
      applyPaddleWidth();
      pop('Barra larga!', 'ok');
      announce('Bonus attivato: barra larga per 15 secondi.');
    } else if (type === 'sticky') {
      state.bonuses.sticky.active = true;
      state.bonuses.sticky.until = until;
      SA.breakout.stickyActive = true;
      pop('Palla appiccicosa!', 'ok');
      announce('Bonus attivato: la pallina si attacca alla barra per 15 secondi.');
    } else if (type === 'extraLife') {
      state.lives += 1;
      updateHUD();
      pop('+1 vita!', 'ok');
      announce('Bonus attivato: hai guadagnato una vita.');
    } else if (type === 'destroyColor') {
      destroyRandomColor();
    }
    beep(880, 0.15, 'triangle', 0.06);
    if (handlers.onBonusActivated) handlers.onBonusActivated(type);
    // Nuovo tipo di bonus: salva subito, cosi' il trofeo "poker di bonus" non si
    // perde se la partita finisce prima del prossimo salvataggio.
    if (isNewBonusType) flushBreakoutProgress(false);
  }

  // Invia a rewards.js solo cio' che non e' ancora stato salvato per questa partita
  // (differenza rispetto all'ultimo flush), cosi' chiamarla piu' volte non conta doppio.
  // final=true segna la partita come conclusa (incrementa il contatore partite) ed e'
  // idempotente: una volta sessionSettled, ulteriori chiamate final non ripetono il conteggio.
  function flushBreakoutProgress(final) {
    if (final && state.sessionSettled) return;
    if (!handlers.onGameOver) return;

    handlers.onGameOver({
      score: state.score,
      schoolClass: state.schoolClass,
      bricksDestroyed: state.bricksDestroyed - state.recordedBricks,
      wallsCleared: state.wallsClearedTotal - state.recordedWalls,
      wallsClearedNoLifeLost: state.wallsClearedNoLifeLost - state.recordedWallsNoLifeLost,
      ballSaves: state.ballSaves - state.recordedSaves,
      terracottaRowCleared: state.terracottaRowCleared,
      bonusTypesUsed: state.bonusTypesUsedThisGame ? Array.from(state.bonusTypesUsedThisGame) : [],
      final: !!final
    });

    state.recordedBricks = state.bricksDestroyed;
    state.recordedWalls = state.wallsClearedTotal;
    state.recordedWallsNoLifeLost = state.wallsClearedNoLifeLost;
    state.recordedSaves = state.ballSaves;
    if (final) state.sessionSettled = true;
  }

  function destroyRandomColor() {
    const tiersAlive = [];
    for (let tier = 0; tier < 4; tier++) {
      if (state.bricks.some(function (b) { return b.alive && b.tier === tier; })) tiersAlive.push(tier);
    }
    if (!tiersAlive.length) return;
    const tier = tiersAlive[Math.floor(Math.random() * tiersAlive.length)];
    state.bricks.forEach(function (brick) {
      if (brick.alive && brick.tier === tier) destroyBrickSilent(brick);
    });
    pop('Colore distrutto!', 'ok');
    announce('Bonus: tutti i mattoni di un colore sono stati distrutti.');
    if (state.bricksLeft === 0) nextLevel();
  }

  // Distruzione "silenziosa" usata dal bonus: assegna punti/hook come un colpo normale,
  // ma senza far avanzare la progressione di velocita' (altrimenti un solo bonus potrebbe
  // far scattare piu' aumenti di colpo).
  function destroyBrickSilent(brick) {
    brick.alive = false;
    state.bricksLeft -= 1;
    state.bricksDestroyed += 1;
    state.score += brick.points;
    updateHUD();
    checkRowCleared(brick);
    spawnBrickEffects(brick);
    if (handlers.onBrickDestroyed) handlers.onBrickDestroyed(brick);
  }

  // Scintille + punteggio volante alla distruzione di un mattone. Le particelle si
  // spengono con "riduci animazioni"; il punteggio resta comunque leggibile nell'HUD,
  // quindi disabilitare il volo del testo non toglie informazione, solo movimento.
  function spawnBrickEffects(brick) {
    if (motionReduced()) return;
    const color = tierColors[brick.tier];
    const cx = brick.x + brick.w / 2;
    const cy = brick.y + brick.h / 2;
    for (let i = 0; i < 7; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 90;
      particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 40,
        color: color,
        size: 2 + Math.random() * 2.5,
        bornAt: state.now,
        life: 420 + Math.random() * 180
      });
    }
    floatTexts.push({
      x: cx,
      y: brick.y,
      text: '+' + brick.points,
      // Variante scurita dello stesso hue: i colori mattone pieni sono troppo
      // chiari per fare da testo sul campo crema (il giallo scende sotto 2:1).
      color: shade(color, -0.45),
      bornAt: state.now,
      life: 650
    });
  }

  function updateEffects(dt) {
    if (particles.length) {
      particles = particles.filter(function (p) {
        if (state.now - p.bornAt > p.life) return false;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 260 * dt;
        return true;
      });
    }
    if (floatTexts.length) {
      floatTexts = floatTexts.filter(function (t) { return state.now - t.bornAt <= t.life; });
    }
  }

  function expireBonuses(now) {
    const wide = state.bonuses.wide;
    if (wide.active && now >= wide.until) {
      wide.active = false;
      SA.breakout.paddleBonusFactor = 1;
      applyPaddleWidth();
      announce('Il bonus barra larga e\' terminato.');
    }
    const sticky = state.bonuses.sticky;
    if (sticky.active && now >= sticky.until) {
      sticky.active = false;
      SA.breakout.stickyActive = false;
      announce('Il bonus palla appiccicosa e\' terminato.');
    }
  }

  /* ------------------------------------------------------------- simulazione */

  function update(dt) {
    expireBonuses(state.now);
    updateEffects(dt);
    updateCapsule(dt);
    movePaddle(dt);
    if (state.ball.stuck) {
      stickBall();
      return;
    }
    // Sotto-passi non piu' lunghi del raggio: evita il tunneling nei mattoni.
    const distance = Math.hypot(state.ball.vx, state.ball.vy) * dt;
    const steps = Math.max(1, Math.ceil(distance / BALL.r));
    const stepDt = dt / steps;
    for (let i = 0; i < steps; i++) {
      if (!state.running || state.waiting || state.locked || state.ball.stuck) break;
      stepBall(stepDt);
    }
  }

  // Un tocco breve puo' durare meno di un frame: senza questo scatto non muoverebbe nulla.
  function nudgePaddle(direction) {
    if (!state.running || state.paused || state.locked) return;
    setPaddleX(state.paddle.x + direction * PADDLE.tapStep);
    launchBall();
  }

  function movePaddle(dt) {
    if (state.locked) return;
    let direction = 0;
    if (state.keys.left) direction -= 1;
    if (state.keys.right) direction += 1;
    if (!direction) return;
    setPaddleX(state.paddle.x + direction * PADDLE.keySpeed * dt);
    launchBall();
  }

  function stepBall(dt) {
    const ball = state.ball;
    const prevX = ball.x;
    const prevY = ball.y;

    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    if (ball.x - BALL.r < 0) {
      ball.x = BALL.r;
      ball.vx = Math.abs(ball.vx);
      beep(320, 0.04, 'square', 0.03);
    } else if (ball.x + BALL.r > VIEW.w) {
      ball.x = VIEW.w - BALL.r;
      ball.vx = -Math.abs(ball.vx);
      beep(320, 0.04, 'square', 0.03);
    }

    if (ball.y - BALL.r < 0) {
      ball.y = BALL.r;
      ball.vy = Math.abs(ball.vy);
      beep(320, 0.04, 'square', 0.03);
      hitTopWall();
    }

    hitBricks(prevX, prevY);
    hitPaddle();

    if (ball.y - BALL.r > VIEW.h) ballOut();
  }

  function hitTopWall() {
    if (state.paddleHalved) return;
    state.paddleHalved = true;
    applyPaddleWidth();
    pop('Barra dimezzata!', 'ko');
    announce('Hai sfondato il muro: la barra si e\' dimezzata.');
    beep(200, 0.2, 'sawtooth', 0.05);
  }

  function hitBricks(prevX, prevY) {
    const ball = state.ball;
    for (let i = 0; i < state.bricks.length; i++) {
      const brick = state.bricks[i];
      if (!brick.alive) continue;
      if (ball.x + BALL.r <= brick.x || ball.x - BALL.r >= brick.x + brick.w) continue;
      if (ball.y + BALL.r <= brick.y || ball.y - BALL.r >= brick.y + brick.h) continue;

      const wasAbove = prevY + BALL.r <= brick.y;
      const wasBelow = prevY - BALL.r >= brick.y + brick.h;
      const wasLeft = prevX + BALL.r <= brick.x;
      const wasRight = prevX - BALL.r >= brick.x + brick.w;

      if (wasAbove || wasBelow) {
        ball.vy = -ball.vy;
        ball.y = wasAbove ? brick.y - BALL.r : brick.y + brick.h + BALL.r;
        ball.squashAxis = 'y';
      } else if (wasLeft || wasRight) {
        ball.vx = -ball.vx;
        ball.x = wasLeft ? brick.x - BALL.r : brick.x + brick.w + BALL.r;
        ball.squashAxis = 'x';
      } else {
        ball.vy = -ball.vy;
        ball.squashAxis = 'y';
      }
      if (!motionReduced()) ball.squashUntil = state.now + SQUASH_MS;

      destroyBrick(brick);
      normalizeVelocity();
      return;
    }
  }

  function destroyBrick(brick) {
    brick.alive = false;
    state.bricksLeft -= 1;
    state.bricksDestroyed += 1;
    state.score += brick.points;
    state.brickHits += 1;
    updateHUD();
    beep(420 + brick.tier * 120, 0.05, 'square', 0.045);

    if (SPEEDUP_AT_HITS.indexOf(state.brickHits) !== -1) bumpSpeed();
    if (brick.tier >= 2 && !state.tierBumped[brick.tier]) {
      state.tierBumped[brick.tier] = true;
      bumpSpeed();
    }

    checkRowCleared(brick);
    spawnBrickEffects(brick);
    maybeSpawnBonus(brick);
    if (handlers.onBrickDestroyed) handlers.onBrickDestroyed(brick);
    if (state.bricksLeft === 0) nextLevel();
  }

  // Trofeo "cecchino di precisione": un'intera fila rossa (tier 3) svuotata.
  function checkRowCleared(brick) {
    if (brick.tier !== 3 || state.terracottaRowCleared) return;
    const rowEmpty = state.bricks.every(function (b) { return b.row !== brick.row || !b.alive; });
    if (rowEmpty) state.terracottaRowCleared = true;
  }

  function hitPaddle() {
    const ball = state.ball;
    const paddle = state.paddle;
    if (ball.vy <= 0) return;
    if (ball.y + BALL.r < PADDLE.y || ball.y - BALL.r > PADDLE.y + PADDLE.h) return;
    if (ball.x < paddle.x - BALL.r || ball.x > paddle.x + paddle.w + BALL.r) return;

    if (SA.breakout && SA.breakout.stickyActive) {
      ball.stuck = true;
      stickBall();
      beep(660, 0.06, 'triangle', 0.04);
      return;
    }

    ball.y = PADDLE.y - BALL.r;
    const offset = clamp((ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2), -1, 1);
    const angle = offset * BALL.maxAngle;
    const speed = currentSpeed();
    ball.vx = speed * Math.sin(angle);
    ball.vy = -speed * Math.cos(angle);
    normalizeVelocity();
    if (!motionReduced()) {
      ball.squashAxis = 'y';
      ball.squashUntil = state.now + SQUASH_MS;
      paddle.bounceUntil = state.now + SQUASH_MS;
    }
    beep(480, 0.05, 'square', 0.045);
  }

  function nextLevel() {
    state.wallsClearedTotal += 1;
    if (!state.lifeLostThisLevel) state.wallsClearedNoLifeLost += 1;
    state.lifeLostThisLevel = false;
    state.level += 1;
    state.paddleHalved = false;
    state.speedStep = 0;
    state.brickHits = 0;
    state.tierBumped = [false, false, false, false];
    state.capsule = null;
    buildWall();
    applyPaddleWidth();
    resetBall();
    updateHUD();
    pop('Livello ' + state.level + '!', 'ok');
    announce('Muro abbattuto. Inizia il livello ' + state.level + '.');
    beep(720, 0.18, 'triangle', 0.05);
    if (handlers.onLevelCleared) handlers.onLevelCleared(state.level - 1);
    // Muro abbattuto: salva subito, non solo a fine partita.
    flushBreakoutProgress(false);
  }

  function ballOut() {
    if (state.waiting) return;
    state.waiting = true;
    state.locked = true;
    beep(140, 0.3, 'sawtooth', 0.05);
    Promise.resolve(handlers.onBallLost ? handlers.onBallLost() : false)
      .catch(function () { return false; })
      .then(function (saved) {
        state.waiting = false;
        state.locked = false;
        if (!state.running) return;
        if (saved) {
          state.ballSaves += 1;
          resetBall();
          // Salvataggio riuscito: salva subito, non solo a fine partita.
          flushBreakoutProgress(false);
          return;
        }
        state.lifeLostThisLevel = true;
        state.lives -= 1;
        updateHUD();
        if (state.lives <= 0) {
          gameOver();
          return;
        }
        pop('💔', 'ko');
        announce('Pallina persa. Ti restano ' + state.lives + ' palline.');
        resetBall();
      });
  }

  /* -------------------------------------------------------------- rendering */

  function fitCanvas() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(VIEW.w * ratio);
    canvas.height = Math.round(VIEW.h * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function roundRectPath(c, x, y, w, h, r) {
    if (c.roundRect) {
      c.beginPath();
      c.roundRect(x, y, w, h, r);
      return;
    }
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  function roundRect(x, y, w, h, r) {
    roundRectPath(ctx, x, y, w, h, r);
  }

  // Mattone "candy": gradiente chiaro->scuro nello stesso hue del token, bordo e
  // riflesso. Disegnato una volta per fascia colore su un canvas fuori schermo
  // (vedi buildBrickSprites) cosi' a ogni frame basta un drawImage per mattone
  // invece di ricalcolare gradiente + 2 path + 2 fill.
  function drawCandyBrick(c, x, y, w, h, hex) {
    const r = 6;
    roundRectPath(c, x, y, w, h, r);
    const grad = c.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, shade(hex, 0.38));
    grad.addColorStop(0.55, hex);
    grad.addColorStop(1, shade(hex, -0.22));
    c.fillStyle = grad;
    c.fill();
    c.lineWidth = 1.5;
    c.strokeStyle = shade(hex, -0.4);
    c.stroke();
    c.fillStyle = 'rgba(255, 255, 255, 0.4)';
    roundRectPath(c, x + w * 0.08, y + h * 0.14, w * 0.55, h * 0.3, 3);
    c.fill();
  }

  function buildBrickSprites() {
    brickSprites = tierColors.map(function (hex) {
      const off = document.createElement('canvas');
      off.width = Math.max(1, Math.ceil(BRICK_W));
      off.height = WALL.brickH;
      drawCandyBrick(off.getContext('2d'), 0, 0, BRICK_W, WALL.brickH, hex);
      return off;
    });
  }

  // Pallina "biglia": gradiente radiale con punto luce, ricostruita col colore
  // ink attuale (cambia con la palette) cosi' lo squash in drawBall resta un
  // semplice drawImage con scale(), non un ridisegno.
  function buildBallSprite() {
    const off = document.createElement('canvas');
    const d = BALL.r * 2;
    off.width = d;
    off.height = d;
    const c = off.getContext('2d');
    const grad = c.createRadialGradient(d * 0.34, d * 0.32, 0.5, d / 2, d / 2, BALL.r);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.4, shade(paint.ink, 0.2));
    grad.addColorStop(1, paint.ink);
    c.beginPath();
    c.arc(d / 2, d / 2, BALL.r, 0, Math.PI * 2);
    c.fillStyle = grad;
    c.fill();
    ballSprite = off;
  }

  function drawBall() {
    const ball = state.ball;
    if (!ballSprite) return;
    const remain = Math.max(0, ball.squashUntil - state.now);
    const amt = (remain / SQUASH_MS) * 0.3;
    const sx = ball.squashAxis === 'x' ? 1 - amt : 1 + amt * 0.7;
    const sy = ball.squashAxis === 'x' ? 1 + amt * 0.7 : 1 - amt;
    ctx.save();
    ctx.translate(ball.x, ball.y);
    ctx.scale(sx, sy);
    ctx.drawImage(ballSprite, -BALL.r, -BALL.r);
    ctx.restore();
  }

  function drawPaddle() {
    const paddle = state.paddle;
    const remain = Math.max(0, (paddle.bounceUntil || 0) - state.now);
    const dip = (remain / SQUASH_MS) * 4;
    const y = PADDLE.y + dip;
    const h = PADDLE.h - dip;
    const grad = ctx.createLinearGradient(0, y, 0, y + h);
    grad.addColorStop(0, shade(paint.paddle, 0.3));
    grad.addColorStop(1, shade(paint.paddle, -0.15));
    ctx.fillStyle = grad;
    roundRect(paddle.x, y, paddle.w, h, 8);
    ctx.fill();
    drawPaddleEyes(paddle, y, h);
  }

  // Due occhietti che seguono la pallina: dettaglio a costo quasi zero che rende
  // la barra un personaggio invece di un rettangolo. Nascosti se la barra e'
  // troppo stretta (dimezzata) per contenerli senza sovrapporsi.
  function drawPaddleEyes(paddle, y, h) {
    if (paddle.w < 46) return;
    const cy = y + h / 2;
    const look = clamp((state.ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2), -1, 1) * 1.6;
    [-0.26, 0.26].forEach(function (frac) {
      const ex = paddle.x + paddle.w / 2 + frac * paddle.w;
      ctx.beginPath();
      ctx.arc(ex, cy, 3.4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ex + look, cy + 0.6, 1.6, 0, Math.PI * 2);
      ctx.fillStyle = paint.ink;
      ctx.fill();
    });
  }

  // Capsula colorata come la fascia di mattoni da cui puo' cadere (vedi
  // BONUS_TIER_COLOR), con un piccolo ondeggiamento per farla notare mentre cade.
  function drawCapsule() {
    const capsule = state.capsule;
    if (!capsule) return;
    const wobble = motionReduced() ? 0 : Math.sin(state.now / 150) * 4;
    const cx = capsule.x + wobble;
    const color = tierColors[BONUS_TIER_COLOR[capsule.type]];
    ctx.beginPath();
    ctx.arc(cx, capsule.y, CAPSULE.r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = shade(color, -0.3);
    ctx.stroke();
    // Badge bianco al centro col simbolo scuro: il simbolo resta leggibile su
    // qualunque colore di capsula (il bianco diretto sul giallo non lo sarebbe).
    ctx.beginPath();
    ctx.arc(cx, capsule.y, CAPSULE.r * 0.62, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.fillStyle = shade(color, -0.45);
    ctx.font = '700 13px "Nunito", "Nunito Fallback", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(BONUS_LABELS[capsule.type].symbol, cx, capsule.y + 1);
  }

  function drawParticles() {
    if (!particles.length) return;
    particles.forEach(function (p) {
      const alpha = Math.max(0, 1 - (state.now - p.bornAt) / p.life);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    });
    ctx.globalAlpha = 1;
  }

  function drawFloatTexts() {
    if (!floatTexts.length) return;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '800 15px "Nunito", "Nunito Fallback", sans-serif';
    floatTexts.forEach(function (t) {
      const p = (state.now - t.bornAt) / t.life;
      ctx.globalAlpha = Math.max(0, 1 - p);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y - p * 26);
    });
    ctx.globalAlpha = 1;
  }

  function render() {
    ctx.clearRect(0, 0, VIEW.w, VIEW.h);
    ctx.fillStyle = paint.field;
    ctx.fillRect(0, 0, VIEW.w, VIEW.h);

    for (let i = 0; i < state.bricks.length; i++) {
      const brick = state.bricks[i];
      if (!brick.alive) continue;
      const sprite = brickSprites[brick.tier];
      if (sprite) ctx.drawImage(sprite, brick.x, brick.y, brick.w, brick.h);
    }

    drawPaddle();
    drawBall();
    drawParticles();
    drawFloatTexts();
    drawCapsule();
    drawBonusTimers();

    if (state.ball.stuck && !state.paused) {
      drawBanner('Premi spazio o tocca lo schermo per lanciare', paint.ink, 20);
    }
    if (state.paused) {
      ctx.fillStyle = 'rgba(31, 45, 61, 0.55)';
      ctx.fillRect(0, 0, VIEW.w, VIEW.h);
      drawBanner('Pausa', '#ffffff', 46, 0);
      drawBanner('Premi spazio per riprendere', '#ffffff', 20, 48);
    }
  }

  function drawBonusTimers() {
    const active = [];
    if (state.bonuses.wide.active) active.push({ label: BONUS_LABELS.wide.label, until: state.bonuses.wide.until });
    if (state.bonuses.sticky.active) active.push({ label: BONUS_LABELS.sticky.label, until: state.bonuses.sticky.until });
    if (!active.length) return;

    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.font = '700 14px "Nunito", "Nunito Fallback", sans-serif';
    active.forEach(function (item, i) {
      const remaining = Math.max(0, Math.ceil((item.until - state.now) / 1000));
      const text = item.label + ' ' + remaining + 's';
      const y = 10 + i * 24;
      const width = ctx.measureText(text).width + 16;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      roundRect(VIEW.w - 10 - width, y - 4, width, 22, 10);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillText(text, VIEW.w - 18, y);
    });
  }

  function drawBanner(text, color, size, offsetY) {
    ctx.fillStyle = color;
    ctx.font = '800 ' + size + 'px "Nunito", "Nunito Fallback", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, VIEW.w / 2, VIEW.h / 2 + (typeof offsetY === 'number' ? offsetY : 120));
  }

  function frame(timestamp) {
    rafId = requestAnimationFrame(frame);
    const dt = Math.min((timestamp - state.last) / 1000, 1 / 30);
    state.last = timestamp;
    state.now = timestamp;
    if (state.running && !state.paused && !state.waiting && !state.locked) update(dt);
    render();
  }

  function startLoop() {
    if (rafId) return;
    state.last = performance.now();
    rafId = requestAnimationFrame(frame);
  }

  function stopLoop() {
    if (!rafId) return;
    cancelAnimationFrame(rafId);
    rafId = 0;
  }

  /* ------------------------------------------------------------------- HUD */

  function updateHUD() {
    setText('scorePoints', state.score);
    setText('scoreLives', state.lives);
    setText('scoreLevel', state.level);
    setText('scoreHighscore', Math.max(state.highScore, state.score));
  }

  function setText(id, value) {
    const node = document.getElementById(id);
    if (node) node.textContent = String(value);
  }

  function showScreen(id) {
    const screens = document.querySelectorAll('.screen');
    for (let i = 0; i < screens.length; i++) screens[i].classList.remove('active');
    const target = document.getElementById(id);
    if (target) target.classList.add('active');
    document.body.classList.toggle('is-playing', id === 'screenGame');
  }

  /* --------------------------------------------------------------- partita */

  // Stesso cancello dei quiz materia: senza finestra di gioco attiva non si parte.
  function ensurePlayWindow() {
    const api = SA.playWindow;
    if (!api || typeof api.ensureActive !== 'function') return Promise.resolve(true);
    return api.ensureActive({
      title: 'Attiva 30 minuti di gioco',
      message: 'Per iniziare questa partita devi attivare 30 minuti di gioco su questo dispositivo. Quando i 30 minuti finiscono, bisogna aspettare 60 minuti prima di poter tornare a giocare. Nessun dato lascia il browser e il timer funziona anche offline.',
      confirmLabel: 'Attiva 30 minuti',
      cancelLabel: 'Non ora'
    });
  }

  function onPlayWindowExpired() {
    if (!state.running) return;
    goStart();
    announce('I 30 minuti di gioco sono terminati.');
    if (SA.ui && typeof SA.ui.alert === 'function') {
      SA.ui.alert('I 30 minuti di gioco sono terminati. Adesso bisogna aspettare 60 minuti prima di poter tornare a giocare.', {
        title: 'Tempo di gioco terminato',
        okLabel: 'Va bene'
      });
    }
  }

  async function startGame() {
    if (!state.schoolClass) {
      pop('Scegli la classe', 'ko');
      announce('Scegli prima la classe.');
      return;
    }
    try {
      const allowed = await ensurePlayWindow();
      if (!allowed) return;
      await loadQuestionPool(state.schoolClass);
      beginGame();
    } catch (e) {
      // Se il caricamento delle domande fallisce si gioca comunque: bonus e
      // salvataggio restano semplicemente non disponibili (getNextQuestion torna null).
      beginGame();
    }
  }

  function beginGame() {
    // "Ricomincia" durante la partita salta goStart() e riparte diretto da qui:
    // salda la partita abbandonata prima di azzerare lo stato, altrimenti si perde.
    if (state.running) flushBreakoutProgress(true);
    particles = [];
    floatTexts = [];
    state.running = true;
    state.paused = false;
    state.waiting = false;
    state.locked = false;
    state.score = 0;
    state.lives = START_LIVES;
    state.level = 1;
    state.bricksDestroyed = 0;
    state.brickHits = 0;
    state.speedStep = 0;
    state.tierBumped = [false, false, false, false];
    state.paddleHalved = false;
    state.capsule = null;
    state.bonuses.wide.active = false;
    state.bonuses.wide.until = 0;
    state.bonuses.sticky.active = false;
    state.bonuses.sticky.until = 0;
    SA.breakout.paddleBonusFactor = 1;
    SA.breakout.stickyActive = false;
    state.ballSaves = 0;
    state.lifeLostThisLevel = false;
    state.wallsClearedTotal = 0;
    state.wallsClearedNoLifeLost = 0;
    state.terracottaRowCleared = false;
    state.bonusTypesUsedThisGame = new Set();
    state.sessionSettled = false;
    state.recordedBricks = 0;
    state.recordedWalls = 0;
    state.recordedWallsNoLifeLost = 0;
    state.recordedSaves = 0;
    state.paddle.w = paddleWidth();
    setPaddleX((VIEW.w - state.paddle.w) / 2);
    buildWall();
    resetBall();
    readPalette();
    updateHUD();
    setPauseLabel();
    showScreen('screenGame');
    startLoop();
    announce('Partita iniziata. Muovi la barra per lanciare la pallina.');
  }

  function gameOver() {
    state.running = false;
    state.paused = false;
    stopLoop();
    if (state.score > state.highScore) {
      state.highScore = state.score;
      storageSet(KEY_HIGHSCORE, state.highScore);
    }
    setText('rFinal', state.score);
    setText('rHighscore', state.highScore);
    setText('rBricks', state.bricksDestroyed);
    setText('resultTitle', state.score >= state.highScore ? 'Nuovo record!' : 'Partita finita!');
    setText('resultMsg', 'Hai raggiunto il livello ' + state.level + ' con ' + state.score + ' punti.');
    const emoji = document.getElementById('resultEmoji');
    if (emoji) emoji.textContent = state.score >= state.highScore ? '🏆' : '🏁';
    showScreen('screenGameOver');
    announce('Partita finita con ' + state.score + ' punti.');
    flushBreakoutProgress(true);
  }

  function goStart() {
    // Si esce da "Cambia classe", da tastiera o perche' sono finiti i 30 minuti:
    // il progresso fatto finora non deve andare perso solo perche' non e' Game Over.
    if (state.running) flushBreakoutProgress(true);
    state.running = false;
    state.paused = false;
    stopLoop();
    showScreen('screenStart');
  }

  function togglePause(force) {
    if (!state.running || state.locked) return;
    state.paused = typeof force === 'boolean' ? force : !state.paused;
    setPauseLabel();
    if (state.paused) announce('Gioco in pausa.');
  }

  function setPauseLabel() {
    const button = document.getElementById('pauseBtn');
    if (button) button.textContent = state.paused ? '▶ Riprendi' : '⏸ Pausa';
  }

  function toggleMute() {
    muted = !muted;
    storageSet(KEY_MUTED, muted ? '1' : '0');
    const button = document.getElementById('muteBtn');
    if (button) {
      button.textContent = muted ? '🔇 Audio' : '🔊 Audio';
      button.setAttribute('aria-pressed', muted ? 'true' : 'false');
    }
  }

  /* ----------------------------------------------------------------- input */

  function renderClassGrid() {
    const grid = document.getElementById('classGrid');
    if (!grid) return;
    grid.replaceChildren();
    ['2', '3', '4', '5'].forEach(function (value) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'class-btn' + (state.schoolClass === value ? ' selected' : '');
      button.textContent = 'Classe ' + value + 'ª';
      button.setAttribute('aria-pressed', state.schoolClass === value ? 'true' : 'false');
      button.addEventListener('click', function () {
        state.schoolClass = value;
        storageSet(KEY_CLASS, value);
        renderClassGrid();
      });
      grid.appendChild(button);
    });
  }

  function pointerToPaddle(event) {
    if (state.locked || state.paused) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width) return;
    const x = (event.clientX - rect.left) * (VIEW.w / rect.width);
    setPaddleX(x - state.paddle.w / 2);
    launchBall();
  }

  function bindInput() {
    window.addEventListener('keydown', function (event) {
      // Tab deve restare intrappolato nel dialog anche a gioco bloccato: e' l'unico
      // tasto che deve funzionare mentre state.locked e' true.
      trapOverlayFocus(event);

      // Con una domanda aperta i tasti di gioco non devono interferire: lo spazio
      // deve restare libero di attivare il pulsante di risposta che ha il focus.
      if (state.locked) return;

      if (event.key === 'ArrowLeft') {
        state.keys.left = true;
        if (!event.repeat) nudgePaddle(-1);
      }
      if (event.key === 'ArrowRight') {
        state.keys.right = true;
        if (!event.repeat) nudgePaddle(1);
      }
      if (!state.running) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') event.preventDefault();

      if (event.key === ' ') {
        // Se il focus e' su un pulsante lascia fare al browser, altrimenti lo spazio
        // farebbe sia il click nativo sia la pausa, annullandosi.
        if (event.target && typeof event.target.closest === 'function' && event.target.closest('button, a')) return;
        event.preventDefault();
        if (state.paused) togglePause(false);
        else if (state.ball.stuck) launchBall();
        else togglePause(true);
      }

      if (event.key === 'p' || event.key === 'P' || event.key === 'Escape') togglePause();
    });

    window.addEventListener('keyup', function (event) {
      if (event.key === 'ArrowLeft') state.keys.left = false;
      if (event.key === 'ArrowRight') state.keys.right = false;
    });

    canvas.addEventListener('pointerdown', function (event) {
      canvas.setPointerCapture(event.pointerId);
      pointerToPaddle(event);
    });

    canvas.addEventListener('pointermove', function (event) {
      if (event.pointerType === 'mouse' && event.buttons === 0 && state.ball.stuck) return;
      pointerToPaddle(event);
    });

    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) return;
      togglePause(true);
      // Scheda nascosta o chiusa senza passare da un pulsante: salva quello che c'e'
      // (non final, non conta come partita completata, ma i progressi restano).
      if (state.running) flushBreakoutProgress(false);
    });

    const playWindowEvent = (SA.playWindow && SA.playWindow.eventName) || 'sa:play-window-change';
    document.addEventListener(playWindowEvent, function (event) {
      if (event && event.detail && event.detail.active) return;
      onPlayWindowExpired();
    });

    window.addEventListener('resize', fitCanvas);

    new MutationObserver(readPalette).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-palette']
    });
  }

  function bindActions() {
    document.querySelectorAll('[data-action]').forEach(function (node) {
      node.addEventListener('click', function () {
        const action = node.getAttribute('data-action');
        if (action === 'start-game' || action === 'play-again') startGame();
        else if (action === 'go-start') goStart();
        else if (action === 'toggle-pause') togglePause();
        else if (action === 'toggle-mute') toggleMute();
      });
    });
  }

  /* ------------------------------------------------------------------- init */

  function init() {
    canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    fitCanvas();
    readPalette();
    renderClassGrid();
    bindInput();
    bindActions();
    buildWall();
    resetBall();
    updateHUD();
    handlers.onBallLost = handleBallLostQuestion;
    handlers.onGameOver = function (payload) {
      if (SA.rewards && typeof SA.rewards.recordBreakout === 'function') SA.rewards.recordBreakout(payload);
    };
    if (muted) {
      const button = document.getElementById('muteBtn');
      if (button) {
        button.textContent = '🔇 Audio';
        button.setAttribute('aria-pressed', 'true');
      }
    }
  }

  SA.breakout = {
    state: state,
    handlers: handlers,
    config: { VIEW: VIEW, WALL: WALL, PADDLE: PADDLE, BALL: BALL, TIER_POINTS: TIER_POINTS },
    paddleBonusFactor: 1,
    stickyActive: false,
    applyPaddleWidth: applyPaddleWidth,
    togglePause: togglePause,
    resetBall: resetBall,
    updateHUD: updateHUD,
    announce: announce,
    pop: pop
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
