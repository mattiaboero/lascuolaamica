(async function () {
  'use strict';

  const cfg = window.SUBJECT_CONFIG;
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

  function notifyLoadError() {
    const message = 'Non riesco a caricare le domande. Controlla la connessione e riprova.';
    try {
      window.alert(message);
    } catch (e) {
      debugWarn('notifyLoadError', e);
    }
  }

  if (cfg.questionsSource && window.QuestionsLoader && typeof window.QuestionsLoader.applySubjectConfig === 'function') {
    try {
      await window.QuestionsLoader.applySubjectConfig(cfg);
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
  const LB_KEY = cfg.lbKey || 'subject_lb_v1';
  const CURSOR_KEY = cfg.cursorKey || 'subject_cursor_v1';
  const HISTORY_KEY = cfg.historyKey || `${CURSOR_KEY}_history_v2`;
  const HISTORY_SIG_KEY = cfg.historySigKey || `${CURSOR_KEY}_history_sig_v1`;
  const STATS_KEY = cfg.statsKey || `${CURSOR_KEY}_stats_v1`;
  const CLASS_PREF_KEY = cfg.classPrefKey || `${CURSOR_KEY}_class_pref_v1`;

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

  let selectedArea = cfg.defaultArea || 'mixed';
  let selectedClass = normalizeClassKey(loadClassPref() || cfg.defaultClass || 3);
  let questions = [];
  let curQ = 0;
  let points = 0;
  let correct = 0;
  let wrong = 0;
  let history = [];
  let answered = false;
  let muted = false;
  let audioCtx = null;
  let baseScore = 0;
  let finalScore = 0;
  let bonusFactor = 1;
  let bonusType = null;
  let bonusApplied = false;
  let creditsAwarded = false;

  function $(id) {
    return document.getElementById(id);
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

  function prefersReducedMotion() {
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) {
      debugWarn('prefersReducedMotion', e);
      return false;
    }
  }

  function normalizeClassKey(value) {
    const parsed = String(value ?? '').replace(/[^0-9]/g, '');
    return CLASS_MAP[parsed] ? parsed : '3';
  }

  function loadClassPref() {
    try {
      return normalizeClassKey(localStorage.getItem(CLASS_PREF_KEY));
    } catch (e) {
      debugWarn('loadClassPref', e);
      return '3';
    }
  }

  function saveClassPref(cls) {
    try {
      localStorage.setItem(CLASS_PREF_KEY, normalizeClassKey(cls));
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

  function classToNum(classKey) {
    const n = Number(normalizeClassKey(classKey));
    return Number.isFinite(n) ? n : 3;
  }

  function questionClassDistance(q, classNum) {
    const grade = normalizeGrade(q && q._grade);
    if (!grade) return 99;
    return Math.abs(grade - classNum);
  }

  function getClassAwarePool(area, classKey, allowLoose) {
    const pool = BANKS[area] || [];
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

  function getAvailableAreaKeysForClass(classKey) {
    return AREA_KEYS.filter((area) => getClassAwarePool(area, classKey, false).pool.length > 0);
  }

  function normalizeSelectedAreaForClass() {
    const available = getAvailableAreaKeysForClass(selectedClass);
    if (selectedArea === 'mixed') return available;
    if (!available.includes(selectedArea)) {
      selectedArea = 'mixed';
    }
    return available;
  }

  function loadCursor() {
    const base = { mixed: 0 };
    AREA_KEYS.forEach((k) => {
      base[k] = 0;
    });
    try {
      const raw = JSON.parse(localStorage.getItem(CURSOR_KEY));
      const out = { ...base };
      Object.keys(out).forEach((k) => {
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
      localStorage.setItem(CURSOR_KEY, JSON.stringify(c));
    } catch (e) {
      debugWarn('saveCursor', e);
    }
  }

  function loadHistoryStore(storageKey = HISTORY_KEY) {
    try {
      const raw = JSON.parse(localStorage.getItem(storageKey));
      if (!raw || typeof raw !== 'object') return {};
      const out = {};
      Object.keys(raw).forEach((k) => {
        if (!Array.isArray(raw[k])) return;
        out[k] = raw[k].map((v) => safeText(v, 80)).filter(Boolean).slice(-300);
      });
      return out;
    } catch (e) {
      debugWarn(`loadHistoryStore:${storageKey}`, e);
      return {};
    }
  }

  function saveHistoryStore(store, storageKey = HISTORY_KEY) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(store));
    } catch (e) {
      debugWarn(`saveHistoryStore:${storageKey}`, e);
    }
  }

  function loadStats() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STATS_KEY));
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
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch (e) {
      debugWarn('saveStats', e);
    }
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
    const areaGrid = $('areaGrid');
    if (!card || !areaGrid) return;

    let label = $('classSectionLabel');
    if (!label) {
      label = document.createElement('div');
      label.id = 'classSectionLabel';
      label.className = 'section-label class-selector-label';
      label.textContent = 'Scegli la classe';
      card.insertBefore(label, areaGrid);
    }

    let grid = $('classGrid');
    if (!grid) {
      grid = document.createElement('div');
      grid.id = 'classGrid';
      grid.className = 'class-grid';
      grid.setAttribute('aria-label', 'Selezione classe');
      card.insertBefore(grid, areaGrid);
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

  function buildAreaGrid() {
    const grid = $('areaGrid');
    if (!grid) return;
    const availableKeys = normalizeSelectedAreaForClass();
    grid.textContent = '';
    const frag = document.createDocumentFragment();

    (cfg.areas || []).forEach((a) => {
      if (a.key !== 'mixed' && !availableKeys.includes(a.key)) return;
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
          startGame();
          break;
        case 'show-leaderboard':
          showLeaderboard();
          break;
        case 'clear-leaderboard':
          clearLeaderboard();
          break;
        case 'restart-game':
          startGame();
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

    buildAreaGrid();
  }

  function selectArea(area, btn) {
    if (!AREA_LABELS[area]) return;
    if (area !== 'mixed') {
      const available = getAvailableAreaKeysForClass(selectedClass);
      if (!available.includes(area)) return;
    }
    selectedArea = area;
    document.querySelectorAll('.area-btn').forEach((b) => {
      b.classList.remove('selected');
      b.setAttribute('aria-pressed', 'false');
    });
    if (btn) {
      btn.classList.add('selected');
      btn.setAttribute('aria-pressed', 'true');
    }
  }

  function spawnShapes() {
    const bg = $('bgShapes');
    if (!bg) return;
    if (prefersReducedMotion()) return;
    const icons = cfg.bgIcons || ['📘', '🧠', '⭐', '✏️'];
    const frag = document.createDocumentFragment();
    for (let i = 0; i < 20; i++) {
      const d = document.createElement('div');
      d.className = 'shape';
      d.textContent = icons[Math.floor(Math.random() * icons.length)];
      d.style.left = Math.random() * 100 + 'vw';
      d.style.fontSize = 0.9 + Math.random() * 1.3 + 'rem';
      d.style.animationDuration = 10 + Math.random() * 14 + 's';
      d.style.animationDelay = Math.random() * 20 + 's';
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

  function candidateScore(q, targetGrade, areaWeakness, classNum) {
    const toPlan = Math.abs(Number(q._grade || targetGrade) - targetGrade);
    const toClass = questionClassDistance(q, classNum);
    const base = toPlan * 7 + toClass * 10;
    const weaknessBoost = areaWeakness > 0 ? -Math.min(2.5, areaWeakness * 3) : 0;
    return base + weaknessBoost;
  }

  function pickQuestion(area, pool, targetGrade, sessionUsed, historyStore, historySigStore, stats, classNum) {
    if (!pool.length) return null;

    const bucket = `${selectedClass}|${area}`;
    const rawSeen = Array.isArray(historyStore[bucket]) ? historyStore[bucket] : [];
    const rawSeenSig = Array.isArray(historySigStore[bucket]) ? historySigStore[bucket] : [];
    let seenSet = new Set(rawSeen);
    let seenSigSet = new Set(rawSeenSig);

    let available = pool.filter((q) => !sessionUsed.has(q._id) && !seenSet.has(q._id) && !seenSigSet.has(q._sig));

    if (!available.length) {
      historyStore[bucket] = [];
      seenSet = new Set();
      available = pool.filter((q) => !sessionUsed.has(q._id) && !seenSigSet.has(q._sig));
    }

    if (!available.length) {
      historySigStore[bucket] = [];
      seenSigSet = new Set();
      available = pool.filter((q) => !sessionUsed.has(q._id));
    }

    if (!available.length) available = pool.slice();

    const areaWeakness = getAreaWeakness(stats, area);
    const ranked = rankWithScoredMap(available, (q) => candidateScore(q, targetGrade, areaWeakness, classNum) + Math.random() * 0.5);

    const chosen = ranked[0];
    sessionUsed.add(chosen._id);

    if (!Array.isArray(historyStore[bucket])) historyStore[bucket] = [];
    historyStore[bucket].push(chosen._id);
    const maxSeen = Math.max(24, pool.length * 3);
    if (historyStore[bucket].length > maxSeen) {
      historyStore[bucket] = historyStore[bucket].slice(-maxSeen);
    }

    if (!Array.isArray(historySigStore[bucket])) historySigStore[bucket] = [];
    historySigStore[bucket].push(chosen._sig);
    const maxSeenSig = Math.max(40, pool.length * 2);
    if (historySigStore[bucket].length > maxSeenSig) {
      historySigStore[bucket] = historySigStore[bucket].slice(-maxSeenSig);
    }

    return chosen;
  }

  function buildSessionQuestions() {
    const cursor = loadCursor();
    const historyStore = loadHistoryStore();
    const historySigStore = loadHistoryStore(HISTORY_SIG_KEY);
    const stats = loadStats();
    const sessionUsed = new Set();
    const plan = buildGradePlan(TOTAL_Q, selectedClass);
    const out = [];

    if (!AREA_KEYS.length) return out;
    const classNum = classToNum(selectedClass);

    let availableAreas = getAvailableAreaKeysForClass(selectedClass);
    if (!availableAreas.length) {
      availableAreas = AREA_KEYS.slice();
    }

    const classPools = {};
    availableAreas.forEach((area) => {
      const strictPool = getClassAwarePool(area, selectedClass, false).pool;
      classPools[area] = strictPool.length ? strictPool : getClassAwarePool(area, selectedClass, true).pool;
    });

    if (selectedArea !== 'mixed' && !availableAreas.includes(selectedArea)) {
      selectedArea = 'mixed';
    }

    if (selectedArea === 'mixed') {
      const orderedByNeed = sortAreasByNeed(availableAreas, stats);
      const start = safeInt(cursor.mixed, 0) % orderedByNeed.length;
      for (let i = 0; i < TOTAL_Q; i++) {
        const area = orderedByNeed[(start + i) % orderedByNeed.length];
        const q = pickQuestion(area, classPools[area] || [], plan[i % plan.length], sessionUsed, historyStore, historySigStore, stats, classNum);
        if (q) out.push({ ...q });
      }
      cursor.mixed = (safeInt(cursor.mixed, 0) + 1) % Math.max(1, orderedByNeed.length);
    } else {
      const areaPool = classPools[selectedArea] || [];
      if (!areaPool.length) return [];
      for (let i = 0; i < TOTAL_Q; i++) {
        const q = pickQuestion(selectedArea, areaPool, plan[i % plan.length], sessionUsed, historyStore, historySigStore, stats, classNum);
        if (q) out.push({ ...q });
      }
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
      }
    }

    if (out.length < TOTAL_Q) {
      const loose = [];
      AREA_KEYS.forEach((area) => {
        const pool = getClassAwarePool(area, selectedClass, true).pool;
        pool.forEach((q) => {
          if (!sessionUsed.has(q._id)) loose.push(q);
        });
      });
      const rankedLoose = rankWithScoredMap(loose, (q) => questionClassDistance(q, classNum) + Math.random() * 0.3);
      for (let i = 0; i < rankedLoose.length && out.length < TOTAL_Q; i++) {
        const q = rankedLoose[i];
        sessionUsed.add(q._id);
        out.push({ ...q });
      }

      if (out.length < TOTAL_Q && rankedLoose.length) {
        while (out.length < TOTAL_Q) {
          out.push({ ...rankedLoose[out.length % rankedLoose.length] });
        }
      }
    }

    saveCursor(cursor);
    saveHistoryStore(historyStore);
    saveHistoryStore(historySigStore, HISTORY_SIG_KEY);
    return out.slice(0, TOTAL_Q);
  }

  function startGame() {
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
    history = [];
    answered = false;
    baseScore = 0;
    finalScore = 0;
    bonusFactor = 1;
    bonusType = null;
    bonusApplied = false;
    creditsAwarded = false;

    buildDots();
    updateScoreBar();
    $('scoreBar').style.display = 'flex';
    showScreen('screenGame');
    loadQuestion();
  }

  function buildDots() {
    const c = $('progressDots');
    if (!c) return;
    c.textContent = '';
    const frag = document.createDocumentFragment();
    for (let i = 0; i < TOTAL_Q; i++) {
      const d = document.createElement('div');
      d.className = 'dot' + (i === 0 ? ' current' : '');
      d.id = 'dot-' + i;
      frag.appendChild(d);
    }
    c.appendChild(frag);
  }

  function updateDots() {
    for (let i = 0; i < TOTAL_Q; i++) {
      const d = $('dot-' + i);
      if (!d) continue;
      d.className = 'dot';
      if (i < curQ) d.classList.add(history[i] ? 'ok' : 'ko');
      else if (i === curQ) d.classList.add('current');
    }
  }

  function updateScoreBar() {
    $('scorePoints').textContent = points;
    $('scoreQn').textContent = Math.min(curQ, TOTAL_Q);
  }

  function loadQuestion() {
    answered = false;
    const q = questions[curQ];
    const areaLabel = AREA_LABELS[q.area] || AREA_LABELS.mixed || 'Sessione';
    const classLabel = CLASS_LABELS[selectedClass] || `Classe ${selectedClass}ª`;
    $('qMeta').textContent = `Domanda ${curQ + 1} di ${TOTAL_Q} · ${areaLabel} · ${classLabel}`;
    $('qText').textContent = q.q;

    const answers = $('answers');
    answers.textContent = '';
    const frag = document.createDocumentFragment();
    const options = shuffle([q.a, ...(q.d || []).slice(0, 3)]);
    options.forEach((opt) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'answer-btn';
      btn.textContent = opt;
      btn.setAttribute('aria-label', `Risposta: ${opt}`);
      btn.addEventListener('click', () => checkAnswer(opt, q.a, btn));
      frag.appendChild(btn);
    });
    answers.appendChild(frag);

    updateDots();
  }

  function checkAnswer(chosen, correctAnswer, btn) {
    if (answered) return;
    answered = true;

    const isOk = chosen === correctAnswer;
    const buttons = Array.from(document.querySelectorAll('#answers .answer-btn'));
    buttons.forEach((b) => {
      b.disabled = true;
    });

    if (isOk) {
      btn.classList.add('correct');
      points += POINTS_PER_Q;
      correct += 1;
      playOk();
      showFeedback(true);
    } else {
      btn.classList.add('wrong');
      wrong += 1;
      buttons.forEach((b) => {
        if (b.textContent === correctAnswer) b.classList.add('correct');
      });
      playKo();
      showFeedback(false);
    }

    history.push(isOk);
    curQ += 1;
    updateScoreBar();

    setTimeout(() => {
      if (curQ >= TOTAL_Q) openBonusPick();
      else loadQuestion();
    }, 1000);
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
    $('bonusText').textContent = q.q;

    const area = $('bonusAnswers');
    area.textContent = '';
    const frag = document.createDocumentFragment();
    shuffle([q.a, ...(q.d || []).slice(0, 3)]).forEach((opt) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'answer-btn';
      btn.textContent = opt;
      btn.setAttribute('aria-label', `Risposta bonus: ${opt}`);
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

    const ok = chosen === correctAnswer;
    if (ok) {
      btn.classList.add('correct');
      playPerfect();
      showFeedback(true, 'Bonus corretto!');
      finishGame('bonus-ok');
    } else {
      btn.classList.add('wrong');
      buttons.forEach((b) => {
        if (b.textContent === correctAnswer) b.classList.add('correct');
      });
      playKo();
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

    if (!creditsAwarded && window.ScuolaEconomy) {
      const reward = window.ScuolaEconomy.calcSessionCredits({
        correct,
        bonusType,
        bonusApplied
      });
      if (reward.total > 0) {
        window.ScuolaEconomy.addCredits(reward.total, {
          source: 'quiz-materia',
          note: `${selectedArea === 'mixed' ? 'mista' : selectedArea} · classe ${selectedClass}`
        });
        msg += ` Hai guadagnato ${reward.total} crediti.`;
      }
      creditsAwarded = true;
    }

    updateStatsFromSession();

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
    const areaText = selectedArea === 'mixed' ? 'Mista' : AREA_LABELS[selectedArea] || selectedArea;
    setText('rArea', `${areaText} · ${CLASS_LABELS[selectedClass] || `Classe ${selectedClass}ª`}`);

    saveScore();
    showScreen('screenResult');
    $('scoreBar').style.display = 'none';
  }

  function saveScore() {
    const entry = {
      area: AREA_LABELS[selectedArea] || selectedArea,
      cls: CLASS_LABELS[selectedClass] || `Classe ${selectedClass}ª`,
      base: baseScore,
      bonus: bonusType ? `${BONUS_LABELS[bonusType] || bonusType} ${bonusApplied ? `x${bonusFactor}` : 'x1'}` : 'Nessuno',
      final: finalScore,
      correct: correct,
      wrong: wrong,
      date: new Date().toLocaleDateString('it-IT')
    };

    const lb = loadLB();
    lb.push(entry);
    lb.sort((a, b) => Number(b.final) - Number(a.final));
    const top = lb.slice(0, 15);
    try {
      localStorage.setItem(LB_KEY, JSON.stringify(top));
    } catch (e) {
      debugWarn('saveScore', e);
    }
  }

  function loadLB() {
    try {
      const parsed = JSON.parse(localStorage.getItem(LB_KEY));
      if (!Array.isArray(parsed)) return [];
      return parsed.slice(0, 50).map((entry) => ({
        area: safeText(entry && entry.area, 64),
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

  function clearLeaderboard() {
    if (confirm('Cancellare tutta la classifica?')) {
      try {
        localStorage.removeItem(LB_KEY);
      } catch (e) {
        debugWarn('clearLeaderboard', e);
      }
      renderLB();
    }
  }

  function showLeaderboard() {
    renderLB();
    $('scoreBar').style.display = 'none';
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
    ['#', 'Finale', 'Base', 'Bonus', 'Classe', 'Ambito', 'Data'].forEach((label) => {
      const th = document.createElement('th');
      th.scope = 'col';
      th.textContent = label;
      hr.appendChild(th);
    });
    thead.appendChild(hr);

    const tbody = document.createElement('tbody');
    lb.forEach((e, i) => {
      const tr = document.createElement('tr');
      [i + 1, e.final, e.base, e.bonus, e.cls || '-', e.area, e.date].forEach((v) => {
        const td = document.createElement('td');
        td.textContent = String(v);
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    cont.appendChild(table);
  }

  function goStart() {
    buildAreaGrid();
    showScreen('screenStart');
    $('scoreBar').style.display = 'none';
  }

  function showScreen(id) {
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

  function showFeedback(ok, custom) {
    const el = $('feedback');
    el.textContent = custom || (ok ? FEEDBACK_OK[Math.floor(Math.random() * FEEDBACK_OK.length)] : FEEDBACK_KO[Math.floor(Math.random() * FEEDBACK_KO.length)]);
    el.className = 'feedback ' + (ok ? 'ok' : 'ko');
    el.classList.add('show');
    setTimeout(() => {
      el.className = 'feedback';
    }, 850);
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
    ensureClassSelector();
    buildAreaGrid();
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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSubjectPage, { once: true });
  } else {
    initSubjectPage();
  }
})();
