(async function () {
  'use strict';

  // =========================================================================
  // Subject Quiz Core — Extension Contract
  // =========================================================================
  // Hook funzione: max 3 totali, riusabili da più materie.
  //   Hook autorizzati (slot riservati, non implementati finché D > 0):
  //     - onBuildSession(ctx) → Question[]
  //     - onPickBonus(ctx)    → Question
  //     - onScore(ctx, answer)→ number
  //   Aggiungere un 4° hook richiede ADR scritto in docs/archive/refactor-quiz-engine-2026/.
  //
  // Config field passivi: illimitati, shape condivisa fra materie.
  //   Materie che non usano un campo lo lasciano undefined → core
  //   interpreta come feature disabilitata.
  //
  // Vietato in questo file:
  //   - if (config.subject === 'X') o equivalenti per-materia.
  //   - Branch hardcoded su lbKey/cursorKey/path materia.
  //
  // Decision tree per ogni nuova esigenza:
  //   1. Esprimibile come dato? → config field. Stop.
  //   2. Variante di logic core? → flag config + branch esistente.
  //   3. Flow completamente diverso? → uno dei 3 hook autorizzati.
  //   4. Nessuna di sopra? → resta in page-side (pre/post processing).
  //
  // Riferimento completo: docs/archive/refactor-quiz-engine-2026/extension-contract.md
  // =========================================================================

  const SA = window.SA = window.SA || {};
  const cfg = SA.subjectConfig;
  if (!cfg) return;

  const DEBUG_MODE = (() => {
    try {
      const host = window.location.hostname;
      if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local')) return true;
      return new URLSearchParams(window.location.search).has('debug');
    } catch (e) {
      return false;
    }
  })();

  function debugWarn(context, error) {
    if (!DEBUG_MODE) return;
    try {
      console.warn(`[La Scuola Amica][${context}]`, error);
    } catch (_) {}
  }

  const memoryStorage = SA.memoryStorage = SA.memoryStorage || Object.create(null);

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

  function storageRemove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      debugWarn(`storageRemove:${key}`, e);
    }
    if (Object.prototype.hasOwnProperty.call(memoryStorage, key)) {
      delete memoryStorage[key];
    }
  }

  function getQuestionsLoader() {
    const sa = window.SA;
    if (sa && sa.questionsLoader) return sa.questionsLoader;
    return null;
  }

  function hasConfiguredBonusQuestions() {
    if (!cfg || !cfg.bonusQuestions || typeof cfg.bonusQuestions !== 'object') return false;
    return Object.values(cfg.bonusQuestions).some((rows) => Array.isArray(rows) && rows.length > 0);
  }

  function resolveBonusType(row) {
    const raw = String(row && row.bonusRaw ? row.bonusRaw : '').trim().toLowerCase();
    if (raw === 'easy' || raw === 'medium' || raw === 'hard') return raw;
    const diff = Number(row && row.difficulty);
    if (Number.isFinite(diff) && diff >= 3) return 'hard';
    if (Number.isFinite(diff) && diff === 2) return 'medium';
    return 'easy';
  }

  function toBonusQuestion(row) {
    const question = String(row && row.question ? row.question : '').trim();
    const answer = String(row && row.answer ? row.answer : '').trim();
    const options = Array.isArray(row && row.options) ? row.options : [];
    const distractors = options
      .map((opt) => String(opt ?? '').trim())
      .filter((opt) => opt && opt !== answer)
      .slice(0, 3);
    if (!question || !answer || distractors.length < 3) return null;
    return {
      q: question,
      a: answer,
      d: distractors,
      answerLang: row && row.answerLang ? String(row.answerLang).trim().toLowerCase() : null
    };
  }

  async function hydrateBonusQuestionsFromSource(loader, source) {
    if (!loader || typeof loader.getSubjectRows !== 'function' || !source || !source.subject) return;
    if (hasConfiguredBonusQuestions()) return;

    const rows = await loader.getSubjectRows(source.subject, {
      path: source.path || 'json/index.json',
      includeInactive: source.includeInactive,
      includeBonusRows: true
    });
    if (!Array.isArray(rows) || !rows.length) return;

    const bonusQuestions = { easy: [], medium: [], hard: [] };
    rows.forEach((row) => {
      if (!row || row.bonus !== true) return;
      const question = toBonusQuestion(row);
      if (!question) return;
      bonusQuestions[resolveBonusType(row)].push(question);
    });

    if (Object.values(bonusQuestions).some((items) => items.length > 0)) {
      cfg.bonusQuestions = bonusQuestions;
    }
  }


  function notifyLoadError() {
    const message = 'Non riesco a caricare le domande. Controlla la connessione e riprova.';
    try {
      // showFeedback e' l'overlay gigante da 3.5rem: il keyframe fbPop finisce
      // a opacity 0 dopo 1.2 s (holdMs non ha alcun effetto) e la frase, con
      // white-space: nowrap, occupa ~1500 px, quindi su un telefono deborda da
      // entrambi i lati. Per un errore che l'utente deve poter leggere serve il
      // dialogo condiviso, che resta finche' non lo chiude. shared.js e'
      // caricato dopo questo file: finche' non c'e', si ripiega sul feedback.
      if (window.SA && window.SA.ui && typeof window.SA.ui.alert === 'function') {
        window.SA.ui.alert(message, { title: 'Domande non disponibili' });
        return;
      }
      showFeedback(false, message, 4200);
    } catch (e) {
      debugWarn('notifyLoadError', e);
    }
  }

  const questionsLoader = getQuestionsLoader();
  if (cfg.questionsSource && questionsLoader && typeof questionsLoader.applySubjectConfig === 'function') {
    try {
      await questionsLoader.applySubjectConfig(cfg);
      const source = typeof cfg.questionsSource === 'string'
        ? { subject: cfg.questionsSource }
        : cfg.questionsSource;
      await hydrateBonusQuestionsFromSource(questionsLoader, source);
    } catch (e) {
      debugWarn('QuestionsLoader.applySubjectConfig', e);
    }
  }

  const TOTAL_Q = Number(cfg.totalQ || 10);
  const POINTS_PER_Q = Number(cfg.pointsPerQ || 10);
  const BONUS_FACTORS = cfg.bonusFactors || { easy: 5, medium: 10, hard: 25 };
  const BONUS_LABELS = cfg.bonusLabels || { easy: 'Facile', medium: 'Media', hard: 'Difficile' };
  const FEEDBACK_OK = cfg.feedbackOk || ['Esatto!', 'Ottimo!', 'Complimenti!', 'Continua così!'];
  const FEEDBACK_KO = cfg.feedbackKo || ['Riprova!', 'Quasi!', 'Non mollare!'];
  // B1: streak-aware feedback — milestone thresholds show a special message + celebrate mascot
  // instead of the plain random one. Ordered from highest to lowest so the first match wins.
  const STREAK_MILESTONES = cfg.streakMilestones || [
    { min: 8, label: (n) => `${n} di fila! Sei inarrestabile! 🚀` },
    { min: 5, label: (n) => `${n} di fila! Serie perfetta! ⭐` },
    { min: 3, label: (n) => `${n} di fila! 🔥` },
  ];
  function getStreakBonus(n) {
    return STREAK_MILESTONES.find((m) => n >= m.min) || null;
  }
  const MASCOT_STATES = {
    neutral: true,
    happy: true,
    sad: true,
    celebrate: true
  };
  const LB_KEY = cfg.lbKey || 'subject_lb_v1';
  const CURSOR_KEY = cfg.cursorKey || 'subject_cursor_v1';
  const WRONG_Q_KEY = `${CURSOR_KEY}_wrong_q_v1`;
  const ADAPT_KEY = `${CURSOR_KEY}_adapt_v1`;
  const HISTORY_KEY = cfg.historyKey || `${CURSOR_KEY}_history_v2`;
  const HISTORY_SIG_KEY = cfg.historySigKey || `${CURSOR_KEY}_history_sig_v1`;
  const STATS_KEY = cfg.statsKey || `${CURSOR_KEY}_stats_v1`;
  const METRICS_KEY = cfg.metricsKey || `${CURSOR_KEY}_quality_v1`;
  const METRICS_MAX_SESSIONS = Math.max(40, Number(cfg.metricsMaxSessions || 180));
  const METRICS_ROLLING_WINDOW = Math.max(10, Number(cfg.metricsRollingWindow || 30));
  const CLASS_PREF_KEY = cfg.classPrefKey || `${CURSOR_KEY}_class_pref_v1`;
  const LEADERBOARD_AREA_FALLBACK = safeText(cfg.leaderboardAreaFallback || '', 64);
  // Tetto per bucket dello storico anti-ripetizione. Deve valere sia in
  // scrittura (pickQuestion) sia in lettura (loadHistoryStore): erano due
  // numeri diversi, si scriveva fino a pool.length * 4 id e al reload
  // successivo se ne rileggevano solo 300, quindi alzare cfg.recentIdSessions
  // oltre 30 non allargava piu' la finestra, la tappava in silenzio.
  const HISTORY_BUCKET_MAX = 2000;
  const RECENT_ID_SESSIONS = Math.max(3, Number(cfg.recentIdSessions || 6));
  const RECENT_SIG_SESSIONS = Math.max(4, Number(cfg.recentSigSessions || 8));
  const ANSWER_MODE = cfg.answerMode === 'numeric' ? 'numeric' : 'mcq';
  const RENDER_MODE = cfg.renderMode === 'bilingual' ? 'bilingual' : 'mcq';
  const OPTIONS_GENERATOR = typeof cfg.optionsGenerator === 'string' ? cfg.optionsGenerator : '';
  const SOFTMAX_TOP_K = Math.max(3, Number(cfg.softmaxTopK || 6));
  const SOFTMAX_TEMPERATURE = Math.max(0.35, Number(cfg.softmaxTemperature || 1.25));
  const TARGET_GRADE_WEIGHT = Math.max(1, Number(cfg.targetGradeWeight || 7));
  const CLASS_DISTANCE_WEIGHT = Math.max(0, Number(cfg.classDistanceWeight || 10));
  // A2 — adaptive difficulty (cross-session EMA, opt-out via cfg.adaptiveDifficulty:false)
  const ADAPTIVE_ENABLED = cfg.adaptiveDifficulty !== false;
  const DIFFICULTY_WEIGHT = Math.max(0, Number.isFinite(Number(cfg.difficultyWeight)) ? Number(cfg.difficultyWeight) : 2.6);
  const ADAPT_ALPHA = Math.min(0.8, Math.max(0.1, Number(cfg.adaptAlpha) || 0.4));
  const ADAPT_MIN = 1;
  const ADAPT_MAX = 3;
  const MIXED_AREA_REPEAT_LIMIT = Math.max(1, Number(cfg.mixedRepeatLimit || cfg.mixedAreaRepeatLimit || 2));
  const AREA_VISIBLE_LIMIT = Math.max(6, Number(cfg.areaVisibleLimit || 8));
  const MAX_LEVEL_DISTANCE = Math.max(0, Number.isFinite(Number(cfg.maxLevelDistance)) ? Number(cfg.maxLevelDistance) : 2);

  const CLASS_DEFAULTS = {
    2: { label: 'Classe 2ª', icon: '2️⃣', subtitle: 'Consolidiamo le basi' },
    3: { label: 'Classe 3ª', icon: '3️⃣', subtitle: 'Basi + primi passaggi' },
    4: { label: 'Classe 4ª', icon: '4️⃣', subtitle: 'Competenze intermedie' },
    5: { label: 'Classe 5ª', icon: '5️⃣', subtitle: 'Verso la secondaria' }
  };
  const CLASS_PROFILES = cfg.classProfiles || {
    2: { 2: 1 },
    3: { 2: 0.35, 3: 0.65 },
    4: { 2: 0.15, 3: 0.35, 4: 0.5 },
    5: { 3: 0.15, 4: 0.35, 5: 0.5 }
  };
  const MAX_GRADE_DISTANCE = Math.max(0, Number.isFinite(Number(cfg.maxGradeDistance)) ? Number(cfg.maxGradeDistance) : 1);

  function normalizeLevelKey(value) {
    const raw = String(value ?? '').trim();
    return raw || '';
  }

  function normalizeLevelFilters(filters) {
    if (!filters || typeof filters !== 'object') return null;
    const next = {};
    if (Array.isArray(filters.subareas)) {
      next.subareas = filters.subareas.map((item) => safeText(item, 48).toLowerCase()).filter(Boolean);
    }
    if (Array.isArray(filters.areas)) {
      next.areas = filters.areas.map((item) => safeText(item, 48)).filter(Boolean);
    }
    if (Array.isArray(filters.fallbackDifficulty)) {
      next.fallbackDifficulty = filters.fallbackDifficulty
        .map((item) => Number(item))
        .filter((item) => Number.isFinite(item))
        .map((item) => Math.round(item));
    }
    if ((!next.subareas || !next.subareas.length)
      && (!next.areas || !next.areas.length)
      && (!next.fallbackDifficulty || !next.fallbackDifficulty.length)) {
      return null;
    }
    return next;
  }

  function normalizeLevelsConfig(levels) {
    if (levels === undefined) return [];
    if (!Array.isArray(levels) || !levels.length) {
      throw new Error('cfg.levels deve essere un array non vuoto quando presente');
    }

    const seen = new Set();
    return levels.map((level, index) => {
      if (!level || typeof level !== 'object') {
        throw new Error(`cfg.levels[${index}] non valido`);
      }
      const key = normalizeLevelKey(level.key);
      if (!key) {
        throw new Error(`cfg.levels[${index}] richiede key`);
      }
      if (seen.has(key)) {
        throw new Error(`cfg.levels contiene key duplicata: ${key}`);
      }
      seen.add(key);

      const filters = normalizeLevelFilters(level.filters);
      if (!filters) {
        throw new Error(`cfg.levels[${index}] richiede filters non vuoto`);
      }

      return {
        key,
        label: safeText(level.label || `Livello ${key}`, 48),
        icon: safeText(level.icon || '🎯', 8),
        subtitle: safeText(level.subtitle || '', 80),
        topics: safeText(level.topics || '', 160),
        filters
      };
    });
  }

  const LEVELS = normalizeLevelsConfig(cfg.levels);
  const HAS_LEVELS = LEVELS.length > 0;

  const AREA_LABELS = {};
  (cfg.areas || []).forEach((a) => {
    AREA_LABELS[a.key] = a.label;
  });

  const CLASS_MAP = buildClassMap();
  const CLASS_LABELS = {};
  Object.keys(CLASS_MAP).forEach((k) => {
    CLASS_LABELS[k] = CLASS_MAP[k].label;
  });

  const AREA_KEYS = getAreaKeys();
  const BANKS = buildNormalizedBanks();

  // Deep link ?area=<key>: apre la pagina con l'ambito gia selezionato.
  // Chiave sconosciuta o non disponibile per la classe: buildAreaGrid()
  // ricade su 'mixed' via normalizeSelectedAreaForClass().
  function areaFromQuery() {
    try {
      const raw = new URLSearchParams(window.location.search).get('area');
      if (!raw) return null;
      const key = safeText(raw, 32);
      return (cfg.areas || []).some((a) => a.key === key) ? key : null;
    } catch (_) {
      return null;
    }
  }

  let selectedArea = areaFromQuery() || cfg.defaultArea || 'mixed';
  let selectedClass = normalizeClassKey(loadClassPref() || cfg.defaultClass || 3);
  let questions = [];
  let curQ = 0;
  let nextStepTimer = null;
  let points = 0;
  let correct = 0;
  let wrong = 0;
  let streak = 0;
  let history = [];
  let answered = false;
  let muted = false;
  let audioCtx = null;
  let baseScore = 0;
  let finalScore = 0;
  let bonusFactor = 1;
  let bonusType = null;
  let bonusApplied = false;
  let showAllAreas = false;
  let playWindowExpiryLock = false;
  let gameStartedAt = 0;
  let selectedLevel = null;
  let selectedSubarea = null;
  let isRipassaSession = false;
  let adaptiveTarget = 2;

  function $(id) {
    return document.getElementById(id);
  }

  function setMascot(state) {
    const el = $('mascot');
    if (!el) return;
    const key = Object.prototype.hasOwnProperty.call(MASCOT_STATES, state) ? state : 'neutral';
    el.textContent = '';
    el.setAttribute('data-state', key);
  }

  function setMascotResult(state) {
    const el = $('mascotResult');
    if (!el) return;
    const key = Object.prototype.hasOwnProperty.call(MASCOT_STATES, state) ? state : 'neutral';
    el.setAttribute('data-state', key);
  }

  function safeInt(value, fallback = 0) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(0, Math.floor(n));
  }

  function safeText(value, maxLen) {
    const txt = String(value ?? '').replace(/\s+/g, ' ').trim();
    return txt.slice(0, maxLen);
  }

  function parseNumericAnswer(value) {
    const raw = String(value ?? '')
      .replace(/\u00a0/g, ' ')
      .replace(/\s+/g, '')
      .trim();
    if (!raw) return null;

    const fractionMatch = raw.match(/^([+-]?\d+(?:[.,]\d+)?)\/([+-]?\d+(?:[.,]\d+)?)$/);
    if (fractionMatch) {
      const numerator = Number(fractionMatch[1].replace(',', '.'));
      const denominator = Number(fractionMatch[2].replace(',', '.'));
      if (Number.isFinite(numerator) && Number.isFinite(denominator) && denominator !== 0) {
        return numerator / denominator;
      }
      return null;
    }

    if (!/^[+-]?\d+(?:[.,]\d+)?$/.test(raw)) return null;
    const parsed = Number(raw.replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : null;
  }

  function normalizeComparableAnswer(value) {
    if (ANSWER_MODE === 'numeric') {
      const parsed = parseNumericAnswer(value);
      if (parsed !== null) {
        const stable = Math.abs(parsed) < 1e-12 ? 0 : parsed;
        return `n:${String(Number(stable.toFixed(12)))}`;
      }
    }
    return `t:${safeText(value, 160).toLowerCase()}`;
  }

  function answersMatch(left, right) {
    return normalizeComparableAnswer(left) === normalizeComparableAnswer(right);
  }

  function inferNumericStep(rawAnswer, baseValue) {
    const raw = String(rawAnswer ?? '').trim();
    if (raw.includes('/')) return 0.5;
    const decimalMatch = raw.match(/[.,](\d+)$/);
    if (decimalMatch) {
      return Math.pow(10, -decimalMatch[1].length);
    }
    const abs = Math.abs(baseValue);
    if (abs >= 1000) return 100;
    if (abs >= 100) return 10;
    if (abs >= 20) return 5;
    return 1;
  }

  function formatNumericLike(value, rawAnswer) {
    const raw = String(rawAnswer ?? '').trim();
    const decimalMatch = raw.match(/[.,](\d+)$/);
    if (decimalMatch) {
      const decimals = decimalMatch[1].length;
      const fixed = Number(value).toFixed(decimals);
      return raw.includes(',') ? fixed.replace('.', ',') : fixed;
    }
    if (raw.includes('/')) {
      return String(Number(value.toFixed(3)));
    }
    return String(Math.round(Number(value)));
  }

  function fillGeneratedOptions(correctAnswer, options) {
    if (OPTIONS_GENERATOR !== 'numeric-close') return options;
    const parsed = parseNumericAnswer(correctAnswer);
    if (parsed === null) return options;

    const next = options.slice();
    const step = inferNumericStep(correctAnswer, parsed);
    const offsets = [step, -step, step * 2, -(step * 2), step * 10, -(step * 10), step * 3, -(step * 3)];
    for (let i = 0; i < offsets.length && next.length < 4; i++) {
      const candidate = formatNumericLike(parsed + offsets[i], correctAnswer);
      if (!next.some((opt) => answersMatch(opt, candidate))) {
        next.push(candidate);
      }
    }
    return next;
  }

  function buildAnswerOptions(question) {
    const rawOptions = [question && question.a, ...((question && question.d) || []).slice(0, 6)]
      .map((opt) => String(opt ?? '').trim())
      .filter(Boolean);
    const deduped = [];
    rawOptions.forEach((opt) => {
      if (!deduped.some((seen) => answersMatch(seen, opt))) {
        deduped.push(opt);
      }
    });
    const filled = fillGeneratedOptions(question && question.a, deduped);
    return shuffle(filled.slice(0, 4));
  }

  function renderPromptBilingual(target, text) {
    if (!target) return;
    const value = String(text || '').trim();
    target.textContent = '';
    target.removeAttribute('lang');
    if (!value) return;

    const quotedParts = value.split(/("[^"]+"|“[^”]+”)/g).filter(Boolean);
    const wrapWhole = quotedParts.length <= 1;

    if (wrapWhole) {
      const span = document.createElement('span');
      span.lang = 'en';
      span.textContent = value;
      target.appendChild(span);
      return;
    }

    quotedParts.forEach((part) => {
      const isAsciiQuote = part.length >= 2 && part.startsWith('"') && part.endsWith('"');
      const isCurlyQuote = part.length >= 2 && part.startsWith('“') && part.endsWith('”');
      if (isAsciiQuote || isCurlyQuote) {
        const span = document.createElement('span');
        span.lang = 'en';
        span.textContent = part;
        target.appendChild(span);
      } else {
        target.appendChild(document.createTextNode(part));
      }
    });
  }

  function renderPrompt(target, question) {
    if (!target) return;
    const text = question && question.q ? question.q : '';
    if (RENDER_MODE === 'bilingual') {
      renderPromptBilingual(target, text);
      return;
    }
    target.textContent = text;
    target.removeAttribute('lang');
  }

  function renderAnswerButtonText(button, text, answerLang) {
    if (!button) return;
    const value = String(text || '').trim();
    button.textContent = '';
    button.removeAttribute('lang');
    button.removeAttribute('aria-label');

    if (RENDER_MODE === 'bilingual' && answerLang === 'en') {
      const span = document.createElement('span');
      span.lang = 'en';
      span.textContent = value;
      button.appendChild(span);
      button.lang = 'en';
      button.setAttribute('aria-label', `Risposta in inglese: ${value}`);
      return;
    }

    button.textContent = value;
    if (RENDER_MODE === 'bilingual' && answerLang === 'it') {
      button.setAttribute('aria-label', `Risposta in italiano: ${value}`);
    } else {
      button.setAttribute('aria-label', `Risposta: ${value}`);
    }
  }

  function prefersReducedMotion() {
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) {
      debugWarn('prefersReducedMotion', e);
      return false;
    }
  }

  function isMotionReduced() {
    try {
      if (window.SA && window.SA.motion && typeof window.SA.motion.isReduced === 'function') {
        return window.SA.motion.isReduced();
      }
    } catch (e) {
      debugWarn('isMotionReduced', e);
    }
    return prefersReducedMotion();
  }

  function askConfirm(message, options) {
    if (window.SA && window.SA.ui && typeof window.SA.ui.confirm === 'function') {
      return window.SA.ui.confirm(message, options || {});
    }
    return Promise.resolve(window.confirm(message));
  }

  function askAlert(message, options) {
    if (window.SA && window.SA.ui && typeof window.SA.ui.alert === 'function') {
      return window.SA.ui.alert(message, options || {});
    }
    window.alert(message);
    return Promise.resolve();
  }

  function getPlayWindowApi() {
    return window.SA && window.SA.playWindow ? window.SA.playWindow : null;
  }

  async function ensurePlayWindowForGame() {
    const api = getPlayWindowApi();
    if (!api || typeof api.ensureActive !== 'function') return true;
    return api.ensureActive({
      title: 'Attiva 30 minuti di gioco',
      message: 'Per iniziare questa partita devi attivare 30 minuti di gioco su questo dispositivo. Quando i 30 minuti finiscono, bisogna aspettare 60 minuti prima di poter tornare a giocare. Nessun dato lascia il browser e il timer funziona anche offline.',
      confirmLabel: 'Attiva 30 minuti',
      cancelLabel: 'Non ora'
    });
  }

  async function handlePlayWindowExpired() {
    if (playWindowExpiryLock) return;
    const activeScreen = document.querySelector('.screen.active');
    if (!activeScreen) return;
    if (!['screenGame', 'screenBonusPick', 'screenBonusQuestion'].includes(activeScreen.id)) return;
    playWindowExpiryLock = true;
    if (HAS_LEVELS) showLevelsScreen();
    else goStart();
    await askAlert('I 30 minuti di gioco sono terminati. Adesso bisogna aspettare 60 minuti prima di poter tornare a giocare.', {
      title: 'Tempo di gioco terminato',
      okLabel: 'Va bene'
    });
    playWindowExpiryLock = false;
  }

  function normalizeClassKey(value) {
    const parsed = String(value ?? '').replace(/[^0-9]/g, '');
    return CLASS_MAP[parsed] ? parsed : '3';
  }

  function loadClassPref() {
    try {
      return normalizeClassKey(storageGet(CLASS_PREF_KEY));
    } catch (e) {
      debugWarn('loadClassPref', e);
      return '3';
    }
  }

  function saveClassPref(cls) {
    try {
      storageSet(CLASS_PREF_KEY, normalizeClassKey(cls));
    } catch (e) {
      debugWarn('saveClassPref', e);
    }
  }

  function buildClassMap() {
    const out = {};
    [2, 3, 4, 5].forEach((c) => {
      const cfgClass = cfg.classMeta && cfg.classMeta[String(c)] ? cfg.classMeta[String(c)] : {};
      const base = CLASS_DEFAULTS[c];
      out[String(c)] = {
        label: safeText(cfgClass.label || base.label, 24),
        icon: safeText(cfgClass.icon || base.icon, 8),
        subtitle: safeText(cfgClass.subtitle || base.subtitle, 40)
      };
    });
    return out;
  }

  function hashText(text) {
    let h = 0;
    for (let i = 0; i < text.length; i++) {
      h = (h * 31 + text.charCodeAt(i)) >>> 0;
    }
    return h.toString(36);
  }

  function normalizeSignatureText(value) {
    return String(value ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '')
      .trim();
  }

  function buildQuestionSignature(q) {
    const qq = normalizeSignatureText(q && q.q);
    const aa = normalizeSignatureText(q && q.a);
    return hashText(`${qq}|${aa}`);
  }

  function normalizeGrade(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return null;
    const g = Math.round(n);
    if (g < 2 || g > 5) return null;
    return g;
  }

  function inferGrade(q, idx, total) {
    const direct = normalizeGrade(q.grade ?? q.g ?? q.classLevel ?? q.level);
    if (direct) return direct;

    if (Array.isArray(q.grades) && q.grades.length) {
      const first = normalizeGrade(q.grades[0]);
      if (first) return first;
    }

    const safeTotal = Math.max(1, total);
    const ratio = idx / safeTotal;
    if (ratio < 0.25) return 2;
    if (ratio < 0.5) return 3;
    if (ratio < 0.75) return 4;
    return 5;
  }

  function buildNormalizedBanks() {
    const out = {};
    AREA_KEYS.forEach((area) => {
      const raw = cfg.banks && Array.isArray(cfg.banks[area]) ? cfg.banks[area] : [];
      out[area] = raw.map((q, idx) => ({
        ...q,
        area,
        _id: `${area}:${idx}:${hashText(String(q.q || '') + '|' + String(q.a || ''))}`,
        _sig: buildQuestionSignature(q),
        _grade: inferGrade(q, idx, raw.length)
      }));
    });
    return out;
  }

  function getLevelMeta(levelKey) {
    const wanted = normalizeLevelKey(levelKey);
    return LEVELS.find((level) => level.key === wanted) || null;
  }

  function questionMatchesLevel(question, levelMeta) {
    if (!levelMeta) return true;
    const filters = levelMeta.filters || {};
    const questionSubarea = safeText(question && question.subarea, 48).toLowerCase();
    const questionArea = safeText(question && question.area, 48);
    const questionDifficulty = Number(question && question.difficulty);

    const hasSubareas = Array.isArray(filters.subareas) && filters.subareas.length;
    const hasAreas = Array.isArray(filters.areas) && filters.areas.length;
    const hasDifficulty = Array.isArray(filters.fallbackDifficulty) && filters.fallbackDifficulty.length;

    if (!hasSubareas && !hasAreas && !hasDifficulty) return false;
    if (hasSubareas && (!questionSubarea || !filters.subareas.includes(questionSubarea))) return false;
    if (hasAreas && (!questionArea || !filters.areas.includes(questionArea))) return false;
    if (hasDifficulty && (!Number.isFinite(questionDifficulty) || !filters.fallbackDifficulty.includes(Math.round(questionDifficulty)))) {
      return false;
    }
    return true;
  }

  function getLevelScopedPool(area, levelKey) {
    const base = BANKS[area] || [];
    const levelMeta = getLevelMeta(levelKey);
    if (!levelMeta) return base;
    return base.filter((question) => questionMatchesLevel(question, levelMeta));
  }

  function getAvailableLevelsForClass(classKey) {
    const classNum = classToNum(classKey);
    return LEVELS.map((level) => {
      const pool = AREA_KEYS.flatMap((area) => getLevelScopedPool(area, level.key));
      if (!pool.length) {
        return { ...level, available: false, minDistance: 99, poolSize: 0 };
      }
      const minDistance = pool.reduce((best, question) => Math.min(best, questionClassDistance(question, classNum)), 99);
      return {
        ...level,
        available: minDistance <= MAX_LEVEL_DISTANCE,
        minDistance,
        poolSize: pool.length
      };
    });
  }

  function getCurrentLevelMeta() {
    return HAS_LEVELS ? getLevelMeta(selectedLevel) : null;
  }

  function getFirstAvailableLevelKey(classKey) {
    const firstAvailable = getAvailableLevelsForClass(classKey).find((level) => level.available);
    if (firstAvailable) return firstAvailable.key;
    return LEVELS[0] ? LEVELS[0].key : '';
  }

  function classToNum(classKey) {
    const n = Number(normalizeClassKey(classKey));
    return Number.isFinite(n) ? n : 3;
  }

  function questionClassDistance(q, classNum) {
    const grade = normalizeGrade(q && q._grade);
    if (!grade) return 99;
    return Math.abs(grade - classNum);
  }

  function getClassAwarePool(area, classKey, allowLoose, levelKey = null) {
    const pool = getLevelScopedPool(area, levelKey);
    const classNum = classToNum(classKey);
    if (!pool.length) return { pool: [], mode: 'none', minDistance: 99 };

    const strict = pool.filter((q) => questionClassDistance(q, classNum) <= MAX_GRADE_DISTANCE);
    if (strict.length) {
      return { pool: strict, mode: 'strict', minDistance: 0 };
    }

    const minDistance = pool.reduce((best, q) => Math.min(best, questionClassDistance(q, classNum)), 99);
    if (!allowLoose) {
      return { pool: [], mode: 'none', minDistance };
    }

    const loose = pool.slice().sort((a, b) => questionClassDistance(a, classNum) - questionClassDistance(b, classNum));
    return { pool: loose, mode: 'loose', minDistance };
  }

  function getAvailableAreaKeysForClass(classKey, levelKey = null) {
    return AREA_KEYS.filter((area) => getClassAwarePool(area, classKey, false, levelKey).pool.length > 0);
  }

  function normalizeSelectedAreaForClass() {
    const available = getAvailableAreaKeysForClass(selectedClass, selectedLevel);
    if (selectedArea === 'mixed') return available;
    if (!available.includes(selectedArea)) {
      selectedArea = 'mixed';
    }
    return available;
  }

  function loadCursor() {
    const base = { mixed: 0, __level: HAS_LEVELS ? getFirstAvailableLevelKey(selectedClass) : '' };
    AREA_KEYS.forEach((k) => {
      base[k] = 0;
    });
    try {
      const raw = JSON.parse(storageGet(CURSOR_KEY));
      const out = { ...base };
      Object.keys(out).forEach((k) => {
        if (k === '__level') {
          out[k] = normalizeLevelKey(raw && raw[k] !== undefined ? raw[k] : base.__level);
          return;
        }
        out[k] = safeInt(raw && raw[k] !== undefined ? raw[k] : 0, 0);
      });
      return out;
    } catch (e) {
      debugWarn('loadCursor', e);
      return base;
    }
  }

  function saveCursor(c) {
    try {
      storageSet(CURSOR_KEY, JSON.stringify(c));
    } catch (e) {
      debugWarn('saveCursor', e);
    }
  }

  function persistSelectedLevel(levelKey) {
    if (!HAS_LEVELS) return;
    const normalized = normalizeLevelKey(levelKey);
    if (!normalized) return;
    const cursor = loadCursor();
    cursor.__level = normalized;
    saveCursor(cursor);
  }

  function loadHistoryStore(storageKey = HISTORY_KEY) {
    try {
      const raw = JSON.parse(storageGet(storageKey));
      if (!raw || typeof raw !== 'object') return {};
      const out = {};
      Object.keys(raw).forEach((k) => {
        if (!Array.isArray(raw[k])) return;
        out[k] = raw[k].map((v) => safeText(v, 80)).filter(Boolean).slice(-HISTORY_BUCKET_MAX);
      });
      return out;
    } catch (e) {
      debugWarn(`loadHistoryStore:${storageKey}`, e);
      return {};
    }
  }

  function saveHistoryStore(store, storageKey = HISTORY_KEY) {
    try {
      storageSet(storageKey, JSON.stringify(store));
    } catch (e) {
      debugWarn(`saveHistoryStore:${storageKey}`, e);
    }
  }

  function loadStats() {
    try {
      const parsed = JSON.parse(storageGet(STATS_KEY));
      if (!parsed || typeof parsed !== 'object') return { area: {}, class: {} };
      return {
        area: parsed.area && typeof parsed.area === 'object' ? parsed.area : {},
        class: parsed.class && typeof parsed.class === 'object' ? parsed.class : {}
      };
    } catch (e) {
      debugWarn('loadStats', e);
      return { area: {}, class: {} };
    }
  }

  function saveStats(stats) {
    try {
      storageSet(STATS_KEY, JSON.stringify(stats));
    } catch (e) {
      debugWarn('saveStats', e);
    }
  }

  // ---- A2: adaptive difficulty target (per class, persisted EMA) ----

  function loadAdaptStore() {
    try {
      const parsed = JSON.parse(storageGet(ADAPT_KEY));
      if (!parsed || typeof parsed !== 'object') return {};
      return parsed;
    } catch (e) {
      return {};
    }
  }

  function saveAdaptStore(store) {
    try {
      storageSet(ADAPT_KEY, JSON.stringify(store));
    } catch (e) {
      debugWarn('saveAdaptStore', e);
    }
  }

  function getAdaptTarget(classKey) {
    const store = loadAdaptStore();
    const row = store[classKey];
    const t = row && Number(row.target);
    if (Number.isFinite(t)) return Math.min(ADAPT_MAX, Math.max(ADAPT_MIN, t));
    return 2;
  }

  function updateAdaptTarget(classKey, accuracy) {
    if (!ADAPTIVE_ENABLED) return;
    const acc = Math.min(1, Math.max(0, Number(accuracy) || 0));
    // Map accuracy → desired difficulty: 0%→1, 50%→2, 100%→3.
    const desired = 1 + 2 * acc;
    const store = loadAdaptStore();
    const prev = getAdaptTarget(classKey);
    const next = Math.min(ADAPT_MAX, Math.max(ADAPT_MIN, prev * (1 - ADAPT_ALPHA) + desired * ADAPT_ALPHA));
    const n = store[classKey] && Number(store[classKey].n) ? Number(store[classKey].n) : 0;
    store[classKey] = { target: Math.round(next * 1000) / 1000, n: n + 1 };
    saveAdaptStore(store);
  }

  function loadMetricsStore() {
    try {
      const parsed = JSON.parse(storageGet(METRICS_KEY));
      if (!parsed || typeof parsed !== 'object') return { sessions: [] };
      const sessions = Array.isArray(parsed.sessions) ? parsed.sessions : [];
      return { sessions: sessions.slice(-METRICS_MAX_SESSIONS) };
    } catch (e) {
      debugWarn('loadMetricsStore', e);
      return { sessions: [] };
    }
  }

  function saveMetricsStore(store) {
    try {
      storageSet(METRICS_KEY, JSON.stringify(store));
    } catch (e) {
      debugWarn('saveMetricsStore', e);
    }
  }

  function clamp01(value) {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(1, value));
  }

  function round3(value) {
    return Math.round((Number(value) || 0) * 1000) / 1000;
  }

  function normalizedEntropyFromCounts(countsObj) {
    if (!countsObj || typeof countsObj !== 'object') return 0;
    const values = Object.values(countsObj).map(Number).filter((n) => Number.isFinite(n) && n > 0);
    if (values.length <= 1) return 0;
    const total = values.reduce((acc, n) => acc + n, 0);
    if (!total) return 0;
    let entropy = 0;
    for (let i = 0; i < values.length; i++) {
      const p = values[i] / total;
      entropy -= p * Math.log2(p);
    }
    const maxEntropy = Math.log2(values.length);
    if (!Number.isFinite(maxEntropy) || maxEntropy <= 0) return 0;
    return clamp01(entropy / maxEntropy);
  }

  function average(entries, key) {
    if (!Array.isArray(entries) || !entries.length) return 0;
    const nums = entries.map((row) => Number(row && row[key])).filter((n) => Number.isFinite(n));
    if (!nums.length) return 0;
    return nums.reduce((acc, n) => acc + n, 0) / nums.length;
  }

  function recordSessionQuality(quality, availableAreasCount) {
    if (!quality || !quality.total) return;
    const total = Math.max(1, safeInt(quality.total, 1));
    const uniqueAreas = Object.keys(quality.areaCounts || {}).length;
    const coverageDen = Math.max(1, safeInt(availableAreasCount, 1));
    const repeatRateId = clamp01((quality.repeatedId || 0) / total);
    const repeatRateSig = clamp01((quality.repeatedSig || 0) / total);
    const areaCoverage = clamp01(uniqueAreas / coverageDen);
    const areaEntropy = normalizedEntropyFromCounts(quality.areaCounts);
    const gradeEntropy = normalizedEntropyFromCounts(quality.gradeCounts);
    const novelty = clamp01(1 - Math.max(repeatRateId, repeatRateSig));

    const entry = {
      ts: Date.now(),
      subject: safeText(cfg.subject || cfg.cursorKey || 'subject', 48),
      class: normalizeClassKey(quality.class || selectedClass),
      mode: safeText(quality.mode || selectedArea, 24),
      total,
      uniqueAreas,
      repeatRateId: round3(repeatRateId),
      repeatRateSig: round3(repeatRateSig),
      areaCoverage: round3(areaCoverage),
      areaEntropy: round3(areaEntropy),
      gradeEntropy: round3(gradeEntropy),
      novelty: round3(novelty)
    };
    if (quality.level !== undefined && quality.level !== null) {
      entry.level = safeInt(quality.level, 0);
    }

    const store = loadMetricsStore();
    const nextSessions = (store.sessions || []).concat(entry).slice(-METRICS_MAX_SESSIONS);
    const rolling = nextSessions.slice(-METRICS_ROLLING_WINDOW);
    store.sessions = nextSessions;
    store.latest = entry;
    store.rolling = {
      window: Math.min(METRICS_ROLLING_WINDOW, rolling.length),
      repeatRateId: round3(average(rolling, 'repeatRateId')),
      repeatRateSig: round3(average(rolling, 'repeatRateSig')),
      areaCoverage: round3(average(rolling, 'areaCoverage')),
      areaEntropy: round3(average(rolling, 'areaEntropy')),
      gradeEntropy: round3(average(rolling, 'gradeEntropy')),
      novelty: round3(average(rolling, 'novelty'))
    };
    saveMetricsStore(store);
  }

  function updateStatsFromSession() {
    if (!questions.length || !history.length) return;
    const stats = loadStats();
    const classKey = selectedClass;

    if (!stats.class[classKey]) stats.class[classKey] = { asked: 0, correct: 0 };

    for (let i = 0; i < Math.min(questions.length, history.length); i++) {
      const q = questions[i];
      const ok = !!history[i];
      const area = q.area || 'mixed';

      if (!stats.area[area]) stats.area[area] = { asked: 0, correct: 0 };
      stats.area[area].asked += 1;
      stats.area[area].correct += ok ? 1 : 0;

      stats.class[classKey].asked += 1;
      stats.class[classKey].correct += ok ? 1 : 0;
    }

    saveStats(stats);
  }

  function ensureClassSelector() {
    const card = document.querySelector('#screenStart .card');
    if (!card) return;

    const areaGrid = $('areaGrid');
    let grid = $('classGrid');
    if (!areaGrid && !grid) return;

    let label = $('classSectionLabel');
    if (!label && areaGrid) {
      label = document.createElement('div');
      label.id = 'classSectionLabel';
      label.className = 'section-label class-selector-label';
      label.textContent = 'Scegli la classe';
      card.insertBefore(label, areaGrid);
    }

    if (!grid) {
      grid = document.createElement('div');
      grid.id = 'classGrid';
      grid.className = 'class-grid';
      grid.setAttribute('aria-label', 'Selezione classe');
      if (areaGrid) card.insertBefore(grid, areaGrid);
      else card.appendChild(grid);
    }

    buildClassGrid();
  }

  function buildClassGrid() {
    const grid = $('classGrid');
    if (!grid) return;

    grid.textContent = '';
    const frag = document.createDocumentFragment();

    Object.keys(CLASS_MAP).forEach((key) => {
      const meta = CLASS_MAP[key];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'class-btn' + (key === selectedClass ? ' selected' : '');
      btn.dataset.action = 'select-class';
      btn.dataset.class = key;
      btn.setAttribute('aria-pressed', key === selectedClass ? 'true' : 'false');

      const icon = document.createElement('span');
      icon.className = 'a-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = meta.icon;

      const title = document.createElement('span');
      title.className = 'a-title';
      title.textContent = meta.label;

      const sub = document.createElement('span');
      sub.className = 'a-sub';
      sub.textContent = meta.subtitle;

      btn.appendChild(icon);
      btn.appendChild(title);
      btn.appendChild(sub);
      frag.appendChild(btn);
    });

    grid.appendChild(frag);
  }

  function buildLevelsGrid() {
    const root = $('levelsRoot');
    if (!root || !HAS_LEVELS) return;

    const classLabel = $('levelsClassLabel');
    if (classLabel) {
      classLabel.textContent = CLASS_LABELS[selectedClass] || `Classe ${selectedClass}ª`;
    }

    root.textContent = '';
    const frag = document.createDocumentFragment();
    const availability = getAvailableLevelsForClass(selectedClass);
    availability.forEach((level) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'level-card' + (level.key === selectedLevel ? ' selected' : '') + (level.available ? '' : ' locked');
      btn.dataset.action = 'start-level';
      btn.dataset.level = level.key;
      btn.disabled = !level.available;
      btn.setAttribute('aria-disabled', level.available ? 'false' : 'true');

      const icon = document.createElement('span');
      icon.className = 'level-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = level.icon || '🎯';

      const info = document.createElement('div');
      info.className = 'level-info';

      const name = document.createElement('div');
      name.className = 'level-name';
      name.textContent = level.label;

      const subtitle = document.createElement('div');
      subtitle.className = 'level-classes';
      subtitle.textContent = level.subtitle || `Livello ${level.key}`;

      const topics = document.createElement('div');
      topics.className = 'level-topics';
      topics.textContent = level.topics || 'Domande selezionate per livello';

      info.appendChild(name);
      info.appendChild(subtitle);
      info.appendChild(topics);

      const badge = document.createElement('span');
      badge.className = 'level-badge';
      badge.setAttribute('aria-hidden', 'true');
      badge.textContent = `Livello ${level.key}`;

      btn.appendChild(icon);
      btn.appendChild(info);
      btn.appendChild(badge);

      const classLabelText = CLASS_LABELS[selectedClass] || `Classe ${selectedClass}ª`;
      if (!level.available) {
        const reason = `Livello non disponibile per ${classLabelText}`;
        btn.title = reason;
        btn.setAttribute('aria-label', `${level.label}, bloccato. ${reason}`);
      } else {
        btn.setAttribute('aria-label', `${level.label}, disponibile per ${classLabelText}`);
      }

      frag.appendChild(btn);
    });

    root.appendChild(frag);

    const empty = $('levelsEmptyState');
    if (empty) {
      const availableCount = availability.filter((level) => level.available).length;
      empty.hidden = availableCount > 0;
      if (!empty.hidden) {
        empty.textContent = `Nessun livello disponibile per ${CLASS_LABELS[selectedClass] || `Classe ${selectedClass}ª`}.`;
      }
    }
  }

  function showLevelsScreen() {
    if (!HAS_LEVELS) {
      startGame();
      return;
    }
    if (!selectedLevel) {
      selectedLevel = getFirstAvailableLevelKey(selectedClass);
    }
    buildLevelsGrid();
    $('scoreBar')?.classList.remove('is-visible');
    showScreen('screenLevels');
    setMascot('neutral');
    setMascotResult('neutral');
  }

  function buildAreaGrid() {
    const grid = $('areaGrid');
    if (!grid) return;
    const availableKeys = normalizeSelectedAreaForClass();
    grid.textContent = '';
    const frag = document.createDocumentFragment();
    const availableAreas = (cfg.areas || []).filter((a) => a.key === 'mixed' || availableKeys.includes(a.key));
    const hasOverflow = availableAreas.length > AREA_VISIBLE_LIMIT;
    const areasToRender = hasOverflow && !showAllAreas
      ? availableAreas.slice(0, AREA_VISIBLE_LIMIT)
      : availableAreas;

    areasToRender.forEach((a) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'area-btn' + (a.key === selectedArea ? ' selected' : '');
      btn.dataset.action = 'select-area';
      btn.dataset.area = a.key;
      btn.setAttribute('aria-pressed', a.key === selectedArea ? 'true' : 'false');

      const icon = document.createElement('span');
      icon.className = 'a-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = String(a.icon || '📘');

      const title = document.createElement('span');
      title.className = 'a-title';
      title.textContent = safeText(a.title, 64);

      const sub = document.createElement('span');
      sub.className = 'a-sub';
      sub.textContent = safeText(a.subtitle || '', 96);

      btn.appendChild(icon);
      btn.appendChild(title);
      btn.appendChild(sub);
      frag.appendChild(btn);
    });

    grid.appendChild(frag);

    const existingToggle = $('areaMoreBtn');
    if (existingToggle) existingToggle.remove();
    if (hasOverflow) {
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.id = 'areaMoreBtn';
      toggle.className = 'area-more-btn';
      toggle.dataset.action = 'toggle-areas';
      toggle.textContent = showAllAreas
        ? 'Mostra meno ambiti'
        : `Mostra altri ${availableAreas.length - AREA_VISIBLE_LIMIT} ambiti`;
      grid.insertAdjacentElement('afterend', toggle);
    }
  }

  function bindActions() {
    document.addEventListener('click', (e) => {
      const target = e.target.closest('[data-action]');
      if (!target) return;
      const action = target.dataset.action;

      switch (action) {
        case 'toggle-mute':
          toggleMute();
          break;
        case 'start-game':
          if (HAS_LEVELS) showLevelsScreen();
          else startGame();
          break;
        case 'start-level':
          startGame(target.dataset.level);
          break;
        case 'show-leaderboard':
          showLeaderboard();
          break;
        case 'clear-leaderboard':
          clearLeaderboard();
          break;
        case 'restart-game':
          if (HAS_LEVELS) startGame(selectedLevel || getFirstAvailableLevelKey(selectedClass));
          else startGame();
          break;
        case 'go-levels':
          showLevelsScreen();
          break;
        case 'go-start':
          goStart();
          break;
        case 'skip-bonus':
          finishGame('skip');
          break;
        case 'bonus-pick':
          openBonusQuestion(target.dataset.bonus);
          break;
        case 'select-area':
          selectArea(target.dataset.area, target);
          break;
        case 'select-class':
          selectClass(target.dataset.class, target);
          break;
        case 'toggle-areas':
          showAllAreas = !showAllAreas;
          buildAreaGrid();
          buildSubareaGrid();
          break;
        case 'select-subarea':
          selectSubarea(target.dataset.subarea || '');
          break;
        case 'start-ripassa':
          startRipassa();
          break;
        case 'show-progress':
          showProgressSummary();
          break;
        default:
          break;
      }
    });
  }

  function selectClass(cls, btn) {
    const key = normalizeClassKey(cls);
    selectedClass = key;
    saveClassPref(key);

    document.querySelectorAll('.class-btn').forEach((b) => {
      b.classList.remove('selected');
      b.setAttribute('aria-pressed', 'false');
    });

    if (btn) {
      btn.classList.add('selected');
      btn.setAttribute('aria-pressed', 'true');
    }

    showAllAreas = false;
    selectedSubarea = null;
    buildAreaGrid();
    buildSubareaGrid();
    if (HAS_LEVELS) {
      const availability = getAvailableLevelsForClass(selectedClass);
      if (!availability.some((level) => level.key === selectedLevel && level.available)) {
        selectedLevel = getFirstAvailableLevelKey(selectedClass);
      }
      buildLevelsGrid();
    }
  }

  function selectArea(area, btn) {
    if (!AREA_LABELS[area]) return;
    if (area !== 'mixed') {
      const available = getAvailableAreaKeysForClass(selectedClass, selectedLevel);
      if (!available.includes(area)) return;
    }
    selectedArea = area;
    selectedSubarea = null;
    document.querySelectorAll('.area-btn').forEach((b) => {
      b.classList.remove('selected');
      b.setAttribute('aria-pressed', 'false');
    });
    if (btn) {
      btn.classList.add('selected');
      btn.setAttribute('aria-pressed', 'true');
    }
    buildSubareaGrid();
  }

  function spawnShapes() {
    const bg = $('bgShapes');
    if (!bg) return;
    if (isMotionReduced()) return;
    const icons = cfg.bgIcons || ['📘', '🧠', '⭐', '✏️'];
    const frag = document.createDocumentFragment();
    for (let i = 0; i < 4; i++) {
      const d = document.createElement('div');
      const variant = window.SADom && typeof window.SADom.randomVariant === 'function'
        ? window.SADom.randomVariant('float-v', 20)
        : 'float-v1';
      d.className = `shape ${variant}`;
      d.textContent = icons[Math.floor(Math.random() * icons.length)];
      frag.appendChild(d);
    }
    bg.appendChild(frag);
  }

  function getAreaKeys() {
    return (cfg.areas || [])
      .map((a) => a.key)
      .filter((k) => k !== 'mixed' && cfg.banks && Array.isArray(cfg.banks[k]) && cfg.banks[k].length > 0);
  }

  function getAreaWeakness(stats, area) {
    const row = stats && stats.area && stats.area[area] ? stats.area[area] : null;
    if (!row || !row.asked || row.asked < 5) return 0;
    const acc = row.correct / row.asked;
    return Math.max(0, 0.9 - acc);
  }

  function sortAreasByNeed(keys, stats) {
    return keys.slice().sort((a, b) => {
      const wa = getAreaWeakness(stats, a);
      const wb = getAreaWeakness(stats, b);
      if (wb !== wa) return wb - wa;
      return a.localeCompare(b);
    });
  }

  function buildGradePlan(total, classKey) {
    const cls = normalizeClassKey(classKey);
    const profile = CLASS_PROFILES[cls] || CLASS_PROFILES[5];
    const grades = Object.keys(profile).map(Number).sort((a, b) => a - b);
    if (!grades.length) return Array(total).fill(3);

    const counts = {};
    let assigned = 0;
    grades.forEach((g, idx) => {
      const weight = Math.max(0, Number(profile[g]) || 0);
      let n = Math.round(weight * total);
      if (idx === grades.length - 1) n = Math.max(0, total - assigned);
      counts[g] = n;
      assigned += n;
    });

    while (assigned < total) {
      const g = grades[assigned % grades.length];
      counts[g] += 1;
      assigned += 1;
    }

    while (assigned > total) {
      for (let i = grades.length - 1; i >= 0 && assigned > total; i--) {
        const g = grades[i];
        if (counts[g] > 0) {
          counts[g] -= 1;
          assigned -= 1;
        }
      }
    }

    const seq = [];
    grades.forEach((g) => {
      for (let i = 0; i < counts[g]; i++) seq.push(g);
    });

    return shuffle(seq).slice(0, total);
  }

  function rankWithScoredMap(items, scoreFn) {
    return items
      .map((item, idx) => ({
        item,
        idx,
        score: Number(scoreFn(item)) || 0
      }))
      .sort((a, b) => {
        if (a.score !== b.score) return a.score - b.score;
        return a.idx - b.idx;
      })
      .map((row) => row.item);
  }

  function pickWithSoftmax(candidates, scoreFn, topK = SOFTMAX_TOP_K, temperature = SOFTMAX_TEMPERATURE) {
    if (!candidates.length) return null;
    const scored = candidates
      .map((item, idx) => ({
        item,
        idx,
        score: Number(scoreFn(item)) || 0
      }))
      .sort((a, b) => {
        if (a.score !== b.score) return a.score - b.score;
        return a.idx - b.idx;
      });

    const narrowed = scored.slice(0, Math.min(topK, scored.length));
    if (!narrowed.length) return scored[0].item;
    const best = narrowed[0].score;
    const tau = Math.max(0.25, temperature);
    const weighted = narrowed.map((row) => ({
      row,
      w: Math.exp(-((row.score - best) / tau))
    }));
    const total = weighted.reduce((acc, x) => acc + x.w, 0);
    if (!Number.isFinite(total) || total <= 0) return narrowed[0].item;
    let r = Math.random() * total;
    for (let i = 0; i < weighted.length; i++) {
      r -= weighted[i].w;
      if (r <= 0) return weighted[i].row.item;
    }
    return weighted[weighted.length - 1].row.item;
  }

  function buildRecentSet(list, count) {
    if (!Array.isArray(list) || !list.length) return new Set();
    return new Set(list.slice(-Math.max(0, count)));
  }

  function candidateScore(q, targetGrade, areaWeakness, classNum) {
    const toPlan = Math.abs(Number(q._grade || targetGrade) - targetGrade);
    const toClass = questionClassDistance(q, classNum);
    const base = toPlan * TARGET_GRADE_WEIGHT + toClass * CLASS_DISTANCE_WEIGHT;
    const weaknessBoost = areaWeakness > 0 ? -Math.min(2.5, areaWeakness * 3) : 0;
    let difficultyCost = 0;
    if (ADAPTIVE_ENABLED) {
      const qDiff = Number(q.difficulty);
      if (Number.isFinite(qDiff)) {
        difficultyCost = Math.abs(qDiff - adaptiveTarget) * DIFFICULTY_WEIGHT;
      }
    }
    return base + weaknessBoost + difficultyCost;
  }

  function pickWeighted(rows, fallbackValue) {
    if (!Array.isArray(rows) || !rows.length) return fallbackValue || null;
    const normalized = rows
      .map((row) => ({
        value: row && row.value !== undefined ? row.value : null,
        weight: Math.max(0, Number(row && row.weight))
      }))
      .filter((row) => row.value !== null && Number.isFinite(row.weight) && row.weight > 0);
    if (!normalized.length) return fallbackValue || rows[0].value || null;
    const total = normalized.reduce((acc, row) => acc + row.weight, 0);
    if (!Number.isFinite(total) || total <= 0) return fallbackValue || normalized[0].value;
    let r = Math.random() * total;
    for (let i = 0; i < normalized.length; i++) {
      r -= normalized[i].weight;
      if (r <= 0) return normalized[i].value;
    }
    return normalized[normalized.length - 1].value;
  }

  function buildSessionSlots(total, classPlan, areaMode, availableAreas, stats, cursor) {
    const slots = [];
    if (!availableAreas.length || !total) return slots;

    if (areaMode !== 'mixed') {
      for (let i = 0; i < total; i++) {
        slots.push({
          area: areaMode,
          targetGrade: classPlan[i % classPlan.length]
        });
      }
      return slots;
    }

    const orderedByNeed = sortAreasByNeed(availableAreas, stats);
    const start = safeInt(cursor.mixed, 0) % orderedByNeed.length;
    const rotated = orderedByNeed.slice(start).concat(orderedByNeed.slice(0, start));
    const areaCounts = {};
    rotated.forEach((area) => {
      areaCounts[area] = 0;
    });
    const areaRun = [];

    for (let i = 0; i < total; i++) {
      const last = areaRun.length ? areaRun[areaRun.length - 1] : null;
      let sameRun = 0;
      if (last) {
        for (let j = areaRun.length - 1; j >= 0; j--) {
          if (areaRun[j] !== last) break;
          sameRun += 1;
        }
      }
      const blocked = last && sameRun >= MIXED_AREA_REPEAT_LIMIT ? last : null;
      const candidateAreas = blocked ? rotated.filter((area) => area !== blocked) : rotated.slice();
      const source = candidateAreas.length ? candidateAreas : rotated;

      const weightedRows = source.map((area, idx) => {
        const weakness = getAreaWeakness(stats, area);
        const seenCount = areaCounts[area] || 0;
        const fairSharePenalty = seenCount * 0.85;
        const recencyPenalty = last && area === last ? 1.15 : 0;
        const orderBias = (rotated.length - idx) * 0.03;
        const base = 1 + weakness * 1.9 + orderBias + Math.random() * 0.09;
        const weight = base / (1 + fairSharePenalty + recencyPenalty);
        return { value: area, weight: Math.max(0.06, weight) };
      });

      const area = pickWeighted(weightedRows, source[0]);
      if (!area) continue;
      areaCounts[area] = (areaCounts[area] || 0) + 1;
      areaRun.push(area);
      slots.push({
        area,
        targetGrade: classPlan[i % classPlan.length]
      });
    }

    cursor.mixed = (safeInt(cursor.mixed, 0) + 1) % Math.max(1, orderedByNeed.length);
    return slots;
  }

  function pickQuestion(area, pool, targetGrade, sessionUsed, historyStore, historySigStore, stats, classNum, historyBucketKey = '') {
    if (!pool.length) return null;

    const bucket = historyBucketKey || `${selectedClass}|${area}`;
    const rawSeen = Array.isArray(historyStore[bucket]) ? historyStore[bucket] : [];
    const rawSeenSig = Array.isArray(historySigStore[bucket]) ? historySigStore[bucket] : [];
    const recentIdCount = Math.max(TOTAL_Q * RECENT_ID_SESSIONS, Math.min(pool.length, TOTAL_Q * 2));
    const recentSigCount = Math.max(TOTAL_Q * RECENT_SIG_SESSIONS, Math.min(pool.length, TOTAL_Q * 3));
    const recentIdSet = buildRecentSet(rawSeen, recentIdCount);
    const recentSigSet = buildRecentSet(rawSeenSig, recentSigCount);

    let available = pool.filter((q) => !sessionUsed.has(q._id) && !recentIdSet.has(q._id) && !recentSigSet.has(q._sig));
    if (!available.length) {
      available = pool.filter((q) => !sessionUsed.has(q._id) && !recentSigSet.has(q._sig));
    }
    if (!available.length) {
      available = pool.filter((q) => !sessionUsed.has(q._id) && !recentIdSet.has(q._id));
    }
    if (!available.length) {
      available = pool.filter((q) => !sessionUsed.has(q._id));
    }
    if (!available.length) {
      available = pool.slice();
    }

    const areaWeakness = getAreaWeakness(stats, area);
    const chosen = pickWithSoftmax(
      available,
      (q) => {
        const base = candidateScore(q, targetGrade, areaWeakness, classNum);
        const idx = rawSeen.lastIndexOf(q._id);
        const sigIdx = rawSeenSig.lastIndexOf(q._sig);
        const idPenalty = idx >= 0 ? Math.max(0, 8 - (rawSeen.length - idx)) * 2.2 : 0;
        const sigPenalty = sigIdx >= 0 ? Math.max(0, 10 - (rawSeenSig.length - sigIdx)) * 2.5 : 0;
        return base + idPenalty + sigPenalty + Math.random() * 0.15;
      }
    ) || available[0];
    const wasRecentId = recentIdSet.has(chosen._id);
    const wasRecentSig = recentSigSet.has(chosen._sig);
    sessionUsed.add(chosen._id);

    if (!Array.isArray(historyStore[bucket])) historyStore[bucket] = [];
    historyStore[bucket].push(chosen._id);
    const maxSeen = Math.min(HISTORY_BUCKET_MAX, Math.max(TOTAL_Q * RECENT_ID_SESSIONS * 3, pool.length * 4, 60));
    if (historyStore[bucket].length > maxSeen) {
      historyStore[bucket] = historyStore[bucket].slice(-maxSeen);
    }

    if (!Array.isArray(historySigStore[bucket])) historySigStore[bucket] = [];
    historySigStore[bucket].push(chosen._sig);
    const maxSeenSig = Math.min(HISTORY_BUCKET_MAX, Math.max(TOTAL_Q * RECENT_SIG_SESSIONS * 3, pool.length * 4, 90));
    if (historySigStore[bucket].length > maxSeenSig) {
      historySigStore[bucket] = historySigStore[bucket].slice(-maxSeenSig);
    }

    return {
      question: chosen,
      wasRecentId,
      wasRecentSig
    };
  }

  function buildSessionQuestions() {
    const cursor = loadCursor();
    const historyStore = loadHistoryStore();
    const historySigStore = loadHistoryStore(HISTORY_SIG_KEY);
    const stats = loadStats();
    const sessionUsed = new Set();
    const plan = buildGradePlan(TOTAL_Q, selectedClass);
    const out = [];
    const currentLevel = getCurrentLevelMeta();

    if (!AREA_KEYS.length) return out;
    const classNum = classToNum(selectedClass);

    let availableAreas = getAvailableAreaKeysForClass(selectedClass, currentLevel && currentLevel.key);
    if (!availableAreas.length) {
      availableAreas = AREA_KEYS.filter((area) => getLevelScopedPool(area, currentLevel && currentLevel.key).length);
    }
    if (!availableAreas.length) {
      availableAreas = AREA_KEYS.slice();
    }

    const classPools = {};
    availableAreas.forEach((area) => {
      const strictPool = getClassAwarePool(area, selectedClass, false, currentLevel && currentLevel.key).pool;
      classPools[area] = strictPool.length
        ? strictPool
        : getClassAwarePool(area, selectedClass, true, currentLevel && currentLevel.key).pool;
    });

    if (selectedSubarea) {
      const sub = selectedSubarea.toLowerCase();
      availableAreas.forEach((area) => {
        if (classPools[area]) {
          classPools[area] = classPools[area].filter(
            (q) => q.subarea && q.subarea.toLowerCase() === sub
          );
        }
      });
    }

    if (selectedArea !== 'mixed' && !availableAreas.includes(selectedArea)) {
      selectedArea = 'mixed';
    }

    const quality = {
      class: selectedClass,
      mode: currentLevel ? `level-${currentLevel.key}` : selectedArea,
      level: currentLevel ? currentLevel.key : null,
      total: 0,
      repeatedId: 0,
      repeatedSig: 0,
      areaCounts: {},
      gradeCounts: {}
    };
    const trackQuality = (area, grade, wasRecentId, wasRecentSig) => {
      quality.total += 1;
      if (wasRecentId) quality.repeatedId += 1;
      if (wasRecentSig) quality.repeatedSig += 1;
      const areaKey = safeText(area || 'mixed', 32) || 'mixed';
      const gradeKey = String(safeInt(grade, classNum));
      quality.areaCounts[areaKey] = (quality.areaCounts[areaKey] || 0) + 1;
      quality.gradeCounts[gradeKey] = (quality.gradeCounts[gradeKey] || 0) + 1;
    };

    const areaMode = selectedArea === 'mixed' ? 'mixed' : selectedArea;
    const historyBucketKey = currentLevel ? `${selectedClass}|lvl-${currentLevel.key}` : '';
    const slots = buildSessionSlots(TOTAL_Q, plan, areaMode, availableAreas, stats, cursor);
    for (let i = 0; i < slots.length && out.length < TOTAL_Q; i++) {
      const slot = slots[i];
      if (!slot || !slot.area) continue;
      const pick = pickQuestion(
        slot.area,
        classPools[slot.area] || [],
        slot.targetGrade,
        sessionUsed,
        historyStore,
        historySigStore,
        stats,
        classNum,
        historyBucketKey
      );
      if (!pick || !pick.question) continue;
      out.push({ ...pick.question });
      trackQuality(slot.area, slot.targetGrade, pick.wasRecentId, pick.wasRecentSig);
    }

    if (selectedArea !== 'mixed') {
      const areaPool = classPools[selectedArea] || [];
      if (!areaPool.length) return [];
      cursor[selectedArea] = (safeInt(cursor[selectedArea], 0) + 1) % Math.max(1, areaPool.length);
    }

    if (out.length < TOTAL_Q) {
      const strictFallback = [];
      availableAreas.forEach((area) => {
        (classPools[area] || []).forEach((q) => {
          if (!sessionUsed.has(q._id)) strictFallback.push(q);
        });
      });
      shuffle(strictFallback);
      for (let i = 0; i < strictFallback.length && out.length < TOTAL_Q; i++) {
        const q = strictFallback[i];
        sessionUsed.add(q._id);
        out.push({ ...q });
        trackQuality(q.area, q._grade || classNum, false, false);
      }
    }

    if (out.length < TOTAL_Q) {
      const loose = [];
      AREA_KEYS.forEach((area) => {
        const pool = getClassAwarePool(area, selectedClass, true, currentLevel && currentLevel.key).pool;
        pool.forEach((q) => {
          if (!sessionUsed.has(q._id)) loose.push(q);
        });
      });
      const rankedLoose = rankWithScoredMap(loose, (q) => questionClassDistance(q, classNum) + Math.random() * 0.3);
      for (let i = 0; i < rankedLoose.length && out.length < TOTAL_Q; i++) {
        const q = rankedLoose[i];
        sessionUsed.add(q._id);
        out.push({ ...q });
        trackQuality(q.area, q._grade || classNum, false, false);
      }

      if (out.length < TOTAL_Q && rankedLoose.length) {
        while (out.length < TOTAL_Q) {
          const q = rankedLoose[out.length % rankedLoose.length];
          out.push({ ...q });
          trackQuality(q.area, q._grade || classNum, false, false);
        }
      }
    }

    saveCursor(cursor);
    saveHistoryStore(historyStore);
    saveHistoryStore(historySigStore, HISTORY_SIG_KEY);
    recordSessionQuality(quality, selectedArea === 'mixed' ? availableAreas.length : 1);
    return out.slice(0, TOTAL_Q);
  }

  function getSessionAreaLabel() {
    const currentLevel = getCurrentLevelMeta();
    if (currentLevel) return currentLevel.label;
    const areaLabel = selectedArea === 'mixed' ? 'Mista' : AREA_LABELS[selectedArea] || selectedArea;
    return selectedSubarea ? `${areaLabel} · ${selectedSubarea.replace(/_/g, ' ')}` : areaLabel;
  }

  function getSessionAreaKey() {
    const currentLevel = getCurrentLevelMeta();
    if (currentLevel) return `level-${currentLevel.key}`;
    return selectedArea;
  }

  async function startGame(levelKey) {
    if (!(await ensurePlayWindowForGame())) return;

    if (HAS_LEVELS) {
      const nextLevel = normalizeLevelKey(levelKey ?? selectedLevel ?? '');
      if (!nextLevel) {
        showLevelsScreen();
        return;
      }
      const available = getAvailableLevelsForClass(selectedClass).find((level) => level.key === nextLevel);
      if (!available || !available.available) {
        await askAlert(`Per ${CLASS_LABELS[selectedClass] || `Classe ${selectedClass}ª`} scegli un livello disponibile.`, {
          title: 'Livello non disponibile',
          okLabel: 'Ho capito'
        });
        showLevelsScreen();
        return;
      }
      selectedLevel = nextLevel;
      persistSelectedLevel(nextLevel);
    }

    isRipassaSession = false;
    adaptiveTarget = ADAPTIVE_ENABLED ? getAdaptTarget(selectedClass) : 2;
    try {
      questions = buildSessionQuestions();
    } catch (e) {
      debugWarn('buildSessionQuestions', e);
      notifyLoadError();
      return;
    }
    if (!questions.length) {
      notifyLoadError();
      return;
    }

    curQ = 0;
    points = 0;
    correct = 0;
    wrong = 0;
    streak = 0;
    history = [];
    answered = false;
    baseScore = 0;
    finalScore = 0;
    bonusFactor = 1;
    bonusType = null;
    bonusApplied = false;
    gameStartedAt = Date.now();

    buildDots();
    updateScoreBar();
    $('scoreBar')?.classList.add('is-visible');
    showScreen('screenGame');
    setMascot('neutral');
    setMascotResult('neutral');
    loadQuestion();
  }

  // Lunghezza reale della sessione in corso. Il ripasso costruisce `questions`
  // dagli errori accumulati (1-9 domande) e anche una sessione normale può
  // restare sotto TOTAL_Q se il pool filtrato e' magro: usare la costante come
  // soglia di fine partita manda `questions[curQ]` a undefined.
  function sessionLen() {
    return questions.length ? Math.min(TOTAL_Q, questions.length) : TOTAL_Q;
  }

  function buildDots() {
    const c = $('progressDots');
    if (!c) return;
    c.textContent = '';
    const frag = document.createDocumentFragment();
    for (let i = 0; i < sessionLen(); i++) {
      const d = document.createElement('div');
      d.className = 'dot' + (i === 0 ? ' current' : '');
      d.id = 'dot-' + i;
      frag.appendChild(d);
    }
    c.appendChild(frag);
  }

  function updateDots() {
    for (let i = 0; i < sessionLen(); i++) {
      const d = $('dot-' + i);
      if (!d) continue;
      d.className = 'dot';
      if (i < curQ) d.classList.add(history[i] ? 'ok' : 'ko');
      else if (i === curQ) d.classList.add('current');
    }
  }

  function updateScoreBar() {
    const pointsEl = $('scorePoints');
    const qnEl = $('scoreQn');
    if (pointsEl) pointsEl.textContent = points;
    if (qnEl) qnEl.textContent = Math.min(curQ, sessionLen());
    const qnTotalEl = $('scoreQnTotal');
    if (qnTotalEl) qnTotalEl.textContent = sessionLen();
  }

  function loadQuestion() {
    answered = false;
    clearExplanation();
    setMascot('neutral');
    const q = questions[curQ];
    const areaLabel = AREA_LABELS[q.area] || AREA_LABELS.mixed || 'Sessione';
    const classLabel = CLASS_LABELS[selectedClass] || `Classe ${selectedClass}ª`;
    const levelMeta = getCurrentLevelMeta();
    $('qMeta').textContent = levelMeta
      ? `Domanda ${curQ + 1} di ${sessionLen()} · ${levelMeta.label} · ${areaLabel} · ${classLabel}`
      : `Domanda ${curQ + 1} di ${sessionLen()} · ${areaLabel} · ${classLabel}`;
    renderPrompt($('qText'), q);

    const answers = $('answers');
    answers.textContent = '';
    const frag = document.createDocumentFragment();
    const options = buildAnswerOptions(q);
    options.forEach((opt) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'answer-btn';
      renderAnswerButtonText(btn, opt, q.answerLang || null);
      btn.addEventListener('click', () => checkAnswer(opt, q.a, btn));
      frag.appendChild(btn);
    });
    answers.appendChild(frag);

    updateDots();
  }

  function markAnswerState(btn, isCorrect) {
    btn.classList.add(isCorrect ? 'correct' : 'wrong');
    // aria-label (impostato da renderAnswerButtonText per ogni bottone, incluso il
    // caso bilingue) sovrascrive sempre il nome accessibile: il checkmark/croce
    // CSS (::after) resta invisibile agli screen reader se non lo rispecchiamo qui.
    const label = btn.getAttribute('aria-label') || btn.textContent;
    btn.setAttribute('aria-label', `${label}${isCorrect ? ' (risposta corretta)' : ' (risposta sbagliata)'}`);
  }

  function checkAnswer(chosen, correctAnswer, btn) {
    if (answered) return;
    answered = true;

    const q = questions[curQ];
    const isOk = answersMatch(chosen, correctAnswer);
    const buttons = Array.from(document.querySelectorAll('#answers .answer-btn'));
    buttons.forEach((b) => {
      b.disabled = true;
    });

    if (isOk) {
      markAnswerState(btn, true);
      points += POINTS_PER_Q;
      correct += 1;
      streak += 1;
      playOk();
      const bonus = getStreakBonus(streak);
      if (bonus) {
        setMascot('celebrate');
        showFeedback(true, bonus.label(streak));
      } else {
        setMascot('happy');
        showFeedback(true);
      }
    } else {
      markAnswerState(btn, false);
      wrong += 1;
      streak = 0;
      buttons.forEach((b) => {
        if (answersMatch(b.textContent, correctAnswer)) markAnswerState(b, true);
      });
      playKo();
      setMascot('sad');
      showFeedback(false);
      pushWrongQ(q);
    }

    showExplanation(q && q.explanation || '', isOk);
    history.push(isOk);
    curQ += 1;
    updateScoreBar();

    nextStepTimer = setTimeout(() => {
      nextStepTimer = null;
      if (curQ >= sessionLen()) openBonusPick();
      else loadQuestion();
    }, 2200);
  }

  function openBonusPick() {
    baseScore = points;
    $('baseScoreLabel').textContent = baseScore;
    showScreen('screenBonusPick');
  }

  function openBonusQuestion(type) {
    const pool = cfg.bonusQuestions && cfg.bonusQuestions[type];
    if (!pool || !pool.length) return;

    bonusType = type;
    bonusFactor = BONUS_FACTORS[type] || 1;
    const q = shuffle(pool.slice())[0];

    $('bonusMeta').textContent = `Bonus ${BONUS_LABELS[type] || type} · Moltiplicatore x${bonusFactor}`;
    renderPrompt($('bonusText'), q);
    setMascot('neutral');

    const area = $('bonusAnswers');
    area.textContent = '';
    const frag = document.createDocumentFragment();
    buildAnswerOptions(q).forEach((opt) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'answer-btn';
      renderAnswerButtonText(btn, opt, q.answerLang || null);
      btn.addEventListener('click', () => checkBonusAnswer(opt, q.a, btn));
      frag.appendChild(btn);
    });
    area.appendChild(frag);

    showScreen('screenBonusQuestion');
  }

  function checkBonusAnswer(chosen, correctAnswer, btn) {
    const buttons = Array.from(document.querySelectorAll('#bonusAnswers .answer-btn'));
    if (!buttons.length || buttons[0].disabled) return;
    buttons.forEach((b) => {
      b.disabled = true;
    });

    const ok = answersMatch(chosen, correctAnswer);
    if (ok) {
      markAnswerState(btn, true);
      playPerfect();
      setMascot('celebrate');
      showFeedback(true, 'Bonus corretto!');
      finishGame('bonus-ok');
    } else {
      markAnswerState(btn, false);
      buttons.forEach((b) => {
        if (answersMatch(b.textContent, correctAnswer)) markAnswerState(b, true);
      });
      playKo();
      setMascot('sad');
      showFeedback(false, 'Bonus non riuscito');
      finishGame('bonus-ko');
    }
  }

  function finishGame(mode) {
    if (mode === 'skip') {
      bonusType = null;
      bonusFactor = 1;
      bonusApplied = false;
      finalScore = baseScore;
    } else if (mode === 'bonus-ok') {
      bonusApplied = true;
      finalScore = baseScore * bonusFactor;
    } else {
      bonusApplied = false;
      finalScore = baseScore;
    }

    let emoji = '🏁';
    let title = 'Sessione completata!';
    let msg = 'Ottimo lavoro.';
    if (finalScore >= 750) {
      emoji = '🏆';
      title = 'Fantastico!';
      msg = 'Punteggio altissimo!';
    } else if (finalScore >= 350) {
      emoji = '🌟';
      title = 'Complimenti!';
      msg = 'Risultato eccellente, continua così!';
    } else if (finalScore >= 150) {
      emoji = '😊';
      title = 'Benissimo!';
      msg = 'Buona padronanza degli argomenti.';
    }
    const mascotState = finalScore >= 350 ? 'celebrate' : finalScore >= 150 ? 'happy' : 'neutral';
    setMascot(mascotState);
    setMascotResult(mascotState);


    const wasRipassa = isRipassaSession;
    updateStatsFromSession();
    updateWrongQAfterSession();
    ensureRipassaBtn();
    if (ADAPTIVE_ENABLED && !wasRipassa && history.length) {
      updateAdaptTarget(selectedClass, correct / Math.max(1, history.length));
    }

    const setText = (id, value) => {
      const el = $(id);
      if (el) el.textContent = value;
    };

    setText('resultEmoji', emoji);
    setText('resultTitle', title);
    setText('resultMsg', msg);
    setText('rBase', baseScore);
    setText('rBonus', bonusApplied ? `x${bonusFactor}` : 'x1');
    setText('rFinal', finalScore);
    setText('rCorrect', correct);
    setText('rWrong', wrong);
    const areaText = getSessionAreaLabel();
    setText('rArea', `${areaText} · ${CLASS_LABELS[selectedClass] || `Classe ${selectedClass}ª`}`);

    recordRewards();
    saveScore();
    ensureProgressBtn();
    showScreen('screenResult');
    $('scoreBar')?.classList.remove('is-visible');
  }

  function recordRewards() {
    try {
      if (!window.SA || !window.SA.rewards || typeof window.SA.rewards.recordGame !== 'function') return;
      window.SA.rewards.recordGame({
        subject: cfg.questionsSource && cfg.questionsSource.subject ? cfg.questionsSource.subject : cfg.subject || 'generale',
        classKey: selectedClass,
        areaKey: getSessionAreaKey(),
        areas: Array.from(new Set(questions.map((q) => q && q.area).filter(Boolean))),
        grades: Array.from(new Set(questions.map((q) => q && q._grade).filter(Boolean))),
        correct,
        wrong,
        total: sessionLen(),
        baseScore,
        finalScore,
        bonusAttempted: !!bonusType,
        bonusApplied,
        durationMs: gameStartedAt ? Date.now() - gameStartedAt : 0
      });
    } catch (e) {
      debugWarn('recordRewards', e);
    }
  }

  function saveScore() {
    const levelMeta = getCurrentLevelMeta();
    const entry = {
      area: getSessionAreaLabel(),
      level: levelMeta ? levelMeta.label : '',
      score: finalScore,
      cls: CLASS_LABELS[selectedClass] || `Classe ${selectedClass}ª`,
      base: baseScore,
      bonus: bonusType ? `${BONUS_LABELS[bonusType] || bonusType} ${bonusApplied ? `x${bonusFactor}` : 'x1'}` : 'Nessuno',
      final: finalScore,
      total: sessionLen(),
      correct: correct,
      wrong: wrong,
      date: new Date().toLocaleDateString('it-IT')
    };

    const lb = loadLB();
    lb.push(entry);
    lb.sort((a, b) => Number(b.final) - Number(a.final));
    const top = lb.slice(0, 15);
    try {
      storageSet(LB_KEY, JSON.stringify(top));
    } catch (e) {
      debugWarn('saveScore', e);
    }
  }

  function loadLB() {
    try {
      const parsed = JSON.parse(storageGet(LB_KEY));
      if (!Array.isArray(parsed)) return [];
      return parsed.slice(0, 50).map((entry) => ({
        area: safeText(entry && entry.area, 64) || safeText(entry && entry.level, 64) || LEADERBOARD_AREA_FALLBACK || AREA_LABELS[selectedArea] || selectedArea,
        cls: safeText(entry && entry.cls, 24),
        base: safeInt(entry && entry.base, 0),
        bonus: safeText(entry && entry.bonus, 48),
        final: safeInt(entry && entry.final, 0),
        correct: safeInt(entry && entry.correct, 0),
        wrong: safeInt(entry && entry.wrong, 0),
        date: safeText(entry && entry.date, 20)
      }));
    } catch (e) {
      debugWarn('loadLB', e);
      return [];
    }
  }

  async function clearLeaderboard() {
    const shouldClear = await askConfirm('Cancellare tutta la classifica?', {
      title: 'Classifica',
      confirmLabel: 'Cancella',
      cancelLabel: 'Annulla'
    });
    if (!shouldClear) return;

    try {
      storageRemove(LB_KEY);
    } catch (e) {
      debugWarn('clearLeaderboard', e);
    }
    renderLB();
  }

  function showLeaderboard() {
    renderLB();
    $('scoreBar')?.classList.remove('is-visible');
    showScreen('screenLeaderboard');
  }

  function renderLB() {
    const lb = loadLB();
    const cont = $('lbContent');
    cont.textContent = '';

    if (!lb.length) {
      const empty = document.createElement('div');
      empty.className = 'lb-empty';
      empty.append('Nessuna sessione ancora.');
      empty.appendChild(document.createElement('br'));
      empty.append('Gioca la prima!');
      cont.appendChild(empty);
      return;
    }

    const table = document.createElement('table');
    table.className = 'lb-table';

    const thead = document.createElement('thead');
    const hr = document.createElement('tr');
    ['#', 'Punteggio', 'Ambito', 'Data'].forEach((label) => {
      const th = document.createElement('th');
      th.scope = 'col';
      th.textContent = label;
      hr.appendChild(th);
    });
    thead.appendChild(hr);

    const tbody = document.createElement('tbody');
    lb.forEach((e, i) => {
      const tr = document.createElement('tr');
      const cells = [
        i + 1,
        e.final,
        e.area,
        e.date
      ];
      cells.forEach((v, idx) => {
        const td = document.createElement('td');
        td.textContent = String(v);
        if (idx === 1) {
          td.title = `Base ${e.base} · Bonus ${e.bonus} · ${e.cls || '-'}`;
        }
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    const wrap = document.createElement('div');
    wrap.className = 'lb-table-wrap';
    wrap.appendChild(table);
    cont.appendChild(wrap);
  }

  function goStart() {
    showAllAreas = false;
    buildAreaGrid();
    buildSubareaGrid();
    ensureRipassaBtn();
    if (HAS_LEVELS) buildLevelsGrid();
    showScreen('screenStart');
    $('scoreBar')?.classList.remove('is-visible');
    setMascot('neutral');
    setMascotResult('neutral');
  }

  function showScreen(id) {
    // L'avanzamento differito appartiene alla partita in corso: qualunque
    // cambio di schermata lo invalida. Senza questo, uscire dal gioco entro
    // 2200 ms da una risposta (scadenza della play window, click su
    // "Classifica") lascia il timer pendente, che poi apre openBonusPick() e
    // riporta l'utente dentro una partita che aveva gia' lasciato.
    if (nextStepTimer) {
      clearTimeout(nextStepTimer);
      nextStepTimer = null;
    }
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
    const target = $(id);
    if (!target) return;
    target.classList.add('active');
    const heading = target.querySelector('h1,h2');
    if (heading) {
      heading.setAttribute('tabindex', '-1');
      heading.focus();
    } else {
      const first = target.querySelector('button,a,[tabindex]:not([tabindex="-1"])');
      if (first) first.focus();
    }
  }

  function showFeedback(ok, custom, holdMs) {
    const el = $('feedback');
    if (!el) return;
    el.textContent = custom || (ok ? FEEDBACK_OK[Math.floor(Math.random() * FEEDBACK_OK.length)] : FEEDBACK_KO[Math.floor(Math.random() * FEEDBACK_KO.length)]);
    el.className = 'feedback ' + (ok ? 'ok' : 'ko');
    el.classList.add('show');
    const timeoutMs = Number.isFinite(Number(holdMs)) ? Math.max(900, Number(holdMs)) : 850;
    setTimeout(() => {
      el.className = 'feedback';
    }, timeoutMs);
  }

  // ---- A1: Explanation display ----

  function ensureExplanationEl() {
    if ($('qExplanation')) return;
    const answersEl = $('answers');
    if (!answersEl) return;
    const el = document.createElement('div');
    el.id = 'qExplanation';
    el.className = 'q-explanation';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('aria-atomic', 'true');
    answersEl.insertAdjacentElement('afterend', el);
  }

  function clearExplanation() {
    const el = $('qExplanation');
    if (!el) return;
    el.textContent = '';
    el.className = 'q-explanation';
  }

  function showExplanation(text, isOk) {
    ensureExplanationEl();
    const el = $('qExplanation');
    if (!el || !text) return;
    el.textContent = text;
    el.className = `q-explanation show ${isOk ? 'ok' : 'ko'}`;
  }

  // ---- A3: Wrong-answer queue (Ripassa errori) ----

  function loadWrongQ() {
    try {
      const parsed = JSON.parse(storageGet(WRONG_Q_KEY));
      if (!Array.isArray(parsed)) return [];
      return parsed.slice(0, 50);
    } catch (e) {
      return [];
    }
  }

  function saveWrongQ(arr) {
    try {
      storageSet(WRONG_Q_KEY, JSON.stringify(arr));
    } catch (e) {
      debugWarn('saveWrongQ', e);
    }
  }

  function pushWrongQ(q) {
    if (!q || !q.sourceId) return;
    const arr = loadWrongQ();
    if (arr.some((w) => w.sid === q.sourceId)) return;
    arr.push({
      sid: q.sourceId,
      q: q.q,
      a: q.a,
      d: Array.isArray(q.d) ? q.d : [],
      expl: q.explanation || '',
      area: q.sourceArea || q.area || '',
      sub: q.subarea || '',
      cls: q.grade || selectedClass
    });
    saveWrongQ(arr.slice(-30));
  }

  function updateWrongQAfterSession() {
    if (!isRipassaSession && !history.length) return;
    const arr = loadWrongQ();
    const correctedIds = new Set();
    for (let i = 0; i < Math.min(questions.length, history.length); i++) {
      if (history[i] && questions[i] && questions[i].sourceId) {
        correctedIds.add(questions[i].sourceId);
      }
    }
    if (!correctedIds.size) {
      isRipassaSession = false;
      return;
    }
    saveWrongQ(arr.filter((w) => !correctedIds.has(w.sid)));
    isRipassaSession = false;
  }

  function ensureRipassaBtn() {
    const count = loadWrongQ().length;
    const existing = $('ripassaBtn');
    if (existing) {
      if (count === 0) { existing.remove(); return; }
      existing.textContent = `Ripassa i tuoi errori (${count})`;
      return;
    }
    if (count === 0) return;
    const startBtn = document.querySelector('[data-action="start-game"]');
    if (!startBtn) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'ripassaBtn';
    btn.className = 'ripassa-btn';
    btn.dataset.action = 'start-ripassa';
    btn.textContent = `Ripassa i tuoi errori (${count})`;
    startBtn.insertAdjacentElement('afterend', btn);
  }

  async function startRipassa() {
    if (!(await ensurePlayWindowForGame())) return;
    const wrongQ = loadWrongQ();
    if (!wrongQ.length) return;
    questions = shuffle(wrongQ.map((w) => ({
      q: w.q,
      a: w.a,
      d: w.d,
      grade: w.cls,
      sourceId: w.sid,
      sourceArea: w.area,
      area: w.area || selectedArea,
      subarea: w.sub || null,
      answerLang: null,
      language: 'it',
      difficulty: 2,
      explanation: w.expl || ''
    }))).slice(0, TOTAL_Q);

    if (!questions.length) { notifyLoadError(); return; }

    isRipassaSession = true;
    curQ = 0;
    points = 0;
    correct = 0;
    wrong = 0;
    streak = 0;
    history = [];
    answered = false;
    baseScore = 0;
    finalScore = 0;
    bonusFactor = 1;
    bonusType = null;
    bonusApplied = false;
    gameStartedAt = Date.now();

    buildDots();
    updateScoreBar();
    $('scoreBar')?.classList.add('is-visible');
    showScreen('screenGame');
    setMascot('neutral');
    setMascotResult('neutral');
    loadQuestion();
  }

  // ---- A4: Subarea selector ----

  function getAvailableSubareasForArea(area, cls) {
    const classNum = classToNum(cls);
    const pool = BANKS[area] || [];
    const subs = new Set();
    pool.forEach((q) => {
      if (!q.subarea) return;
      if (Math.abs((q._grade || classNum) - classNum) <= MAX_GRADE_DISTANCE + 1) {
        subs.add(q.subarea);
      }
    });
    return Array.from(subs).sort();
  }

  function buildSubareaGrid() {
    const existing = $('subareaGrid');
    if (existing) existing.remove();

    if (selectedArea === 'mixed' || !selectedArea) {
      selectedSubarea = null;
      return;
    }

    const subs = getAvailableSubareasForArea(selectedArea, selectedClass);
    if (subs.length < 2) {
      selectedSubarea = null;
      return;
    }

    const areaGrid = $('areaGrid');
    if (!areaGrid) return;

    const grid = document.createElement('div');
    grid.id = 'subareaGrid';
    grid.className = 'subarea-grid';
    grid.setAttribute('aria-label', 'Selezione sotto-ambito');

    const allBtn = document.createElement('button');
    allBtn.type = 'button';
    allBtn.className = 'subarea-btn' + (!selectedSubarea ? ' selected' : '');
    allBtn.setAttribute('aria-pressed', !selectedSubarea ? 'true' : 'false');
    allBtn.dataset.action = 'select-subarea';
    allBtn.dataset.subarea = '';
    allBtn.textContent = 'Tutti';
    grid.appendChild(allBtn);

    subs.forEach((sub) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'subarea-btn' + (sub === selectedSubarea ? ' selected' : '');
      btn.setAttribute('aria-pressed', sub === selectedSubarea ? 'true' : 'false');
      btn.dataset.action = 'select-subarea';
      btn.dataset.subarea = sub;
      btn.textContent = sub.replace(/_/g, ' ');
      grid.appendChild(btn);
    });

    areaGrid.insertAdjacentElement('afterend', grid);
  }

  function selectSubarea(sub) {
    selectedSubarea = sub || null;
    document.querySelectorAll('.subarea-btn').forEach((b) => {
      const isSelected = (b.dataset.subarea || '') === (sub || '');
      b.classList.toggle('selected', isSelected);
      b.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
    });
  }

  // ---- C1: Progress summary ----

  function showProgressSummary() {
    const stats = loadStats();
    const lb = loadLB();
    const subjectLabel = cfg.subject
      || (cfg.questionsSource && (typeof cfg.questionsSource === 'string' ? cfg.questionsSource : cfg.questionsSource.subject))
      || 'Materia';

    const overlay = document.createElement('div');
    overlay.id = 'progressOverlay';
    overlay.className = 'progress-overlay';

    const inner = document.createElement('div');
    inner.className = 'progress-modal-inner';

    const h2 = document.createElement('h2');
    h2.textContent = `Riepilogo progressi — ${safeText(subjectLabel, 32)}`;
    inner.appendChild(h2);

    const dateP = document.createElement('p');
    dateP.className = 'progress-date';
    dateP.textContent = `Generato il ${new Date().toLocaleDateString('it-IT')}`;
    inner.appendChild(dateP);

    const classKeys = Object.keys(stats.class || {}).sort();
    if (classKeys.length) {
      const h3c = document.createElement('h3');
      h3c.textContent = 'Per classe';
      inner.appendChild(h3c);
      const ul = document.createElement('ul');
      classKeys.forEach((cls) => {
        const s = stats.class[cls];
        const pct = s.asked ? Math.round(100 * s.correct / s.asked) : 0;
        const li = document.createElement('li');
        li.textContent = `Classe ${cls}ª — ${s.correct}/${s.asked} corrette (${pct}%)`;
        ul.appendChild(li);
      });
      inner.appendChild(ul);
    }

    const areaEntries = Object.entries(stats.area || {}).sort(([, a], [, b]) => b.asked - a.asked);
    if (areaEntries.length) {
      const h3a = document.createElement('h3');
      h3a.textContent = 'Per ambito';
      inner.appendChild(h3a);
      const ul = document.createElement('ul');
      areaEntries.forEach(([area, s]) => {
        const label = AREA_LABELS[area] || area;
        const pct = s.asked ? Math.round(100 * s.correct / s.asked) : 0;
        const li = document.createElement('li');
        li.textContent = `${safeText(label, 48)} — ${s.correct}/${s.asked} corrette (${pct}%)`;
        ul.appendChild(li);
      });
      inner.appendChild(ul);
    }

    if (lb.length) {
      const h3g = document.createElement('h3');
      h3g.textContent = 'Ultime partite';
      inner.appendChild(h3g);
      const table = document.createElement('table');
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      ['Data', 'Ambito', 'Classe', 'Punti', 'Esatte', 'Errate'].forEach((col) => {
        const th = document.createElement('th');
        th.textContent = col;
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
      table.appendChild(thead);
      const tbody = document.createElement('tbody');
      lb.slice(0, 10).forEach((e) => {
        const tr = document.createElement('tr');
        [safeText(e.date, 16), safeText(e.area, 32), safeText(e.cls, 12), e.final, e.correct, e.wrong].forEach((val) => {
          const td = document.createElement('td');
          td.textContent = val;
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      inner.appendChild(table);
    }

    if (!classKeys.length && !areaEntries.length && !lb.length) {
      const p = document.createElement('p');
      p.textContent = 'Nessun dato registrato ancora. Gioca qualche partita!';
      inner.appendChild(p);
    }

    const actions = document.createElement('div');
    actions.className = 'progress-actions';
    const printBtn = document.createElement('button');
    printBtn.type = 'button';
    printBtn.className = 'progress-print-btn';
    printBtn.textContent = 'Stampa';
    printBtn.addEventListener('click', () => window.print());
    actions.appendChild(printBtn);
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'progress-close-btn';
    closeBtn.id = 'progressCloseBtn';
    closeBtn.textContent = 'Chiudi';
    actions.appendChild(closeBtn);
    inner.appendChild(actions);

    overlay.appendChild(inner);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target.id === 'progressCloseBtn') overlay.remove();
    });
    document.body.appendChild(overlay);
  }

  function ensureProgressBtn() {
    if ($('progressBtn')) return;
    const btns = document.querySelector('#screenResult .result-btns');
    if (!btns) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'progressBtn';
    btn.className = 'btn-progress';
    btn.dataset.action = 'show-progress';
    btn.textContent = 'Progressi';
    btns.appendChild(btn);
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = arr[i];
      arr[i] = arr[j];
      arr[j] = t;
    }
    return arr;
  }

  function getCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
  }

  function note(freq, t, dur, vol) {
    if (muted) return;
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.connect(g);
      g.connect(ctx.destination);
      osc.frequency.value = freq;
      g.gain.setValueAtTime(vol, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + dur);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + dur + 0.05);
    } catch (e) {
      debugWarn('note', e);
    }
  }

  function playOk() {
    note(523, 0, 0.1, 0.24);
    note(659, 0.1, 0.1, 0.24);
    note(784, 0.2, 0.2, 0.24);
  }
  function playKo() {
    note(330, 0, 0.15, 0.2);
    note(262, 0.16, 0.25, 0.2);
  }
  function playPerfect() {
    [523, 587, 659, 784, 880, 1047].forEach((f, i) => note(f, i * 0.07, 0.18, 0.24));
  }

  function toggleMute() {
    muted = !muted;
    const btn = $('muteBtn');
    if (!btn) return;
    btn.textContent = muted ? '🔇 Audio' : '🔊 Audio';
    btn.setAttribute('aria-label', muted ? 'Riattiva audio' : 'Disattiva audio');
  }

  let _initDone = false;
  function initSubjectPage() {
    if (_initDone) return;
    _initDone = true;
    if (HAS_LEVELS) {
      const storedLevel = normalizeLevelKey(loadCursor().__level);
      selectedLevel = getLevelMeta(storedLevel) ? storedLevel : getFirstAvailableLevelKey(selectedClass);
    }
    ensureClassSelector();
    buildAreaGrid();
    buildSubareaGrid();
    ensureRipassaBtn();
    if (HAS_LEVELS) buildLevelsGrid();
    bindActions();
    spawnShapes();
    updateScoreBar();
    buildDots();
    const qMeta = $('qMeta');
    if (qMeta) {
      qMeta.setAttribute('aria-live', 'polite');
      qMeta.setAttribute('aria-atomic', 'true');
    }
    const bonusMeta = $('bonusMeta');
    if (bonusMeta) {
      bonusMeta.setAttribute('aria-live', 'polite');
      bonusMeta.setAttribute('aria-atomic', 'true');
    }
    document.addEventListener((window.SA && window.SA.playWindow && window.SA.playWindow.eventName) || 'sa:play-window-change', (event) => {
      if (event && event.detail && event.detail.active) return;
      handlePlayWindowExpired();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSubjectPage, { once: true });
  } else {
    initSubjectPage();
  }
})();
