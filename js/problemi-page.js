// Auto-estratto da problemi.html per CSP hardening (no inline script).
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

const TOTAL_Q = 10;
const POINTS_PER_Q = 10;
const BONUS_FACTORS = { easy: 5, medium: 10, hard: 25 };
const BONUS_LABELS = { easy: 'Facile', medium: 'Media', hard: 'Difficile' };
const LB_KEY = 'problemiMatematica_lb_v1';
const HISTORY_KEY = 'problemiMatematica_history_v2';
const METRICS_KEY = 'problemiMatematica_quality_v1';
const METRICS_MAX_SESSIONS = 180;
const METRICS_ROLLING_WINDOW = 30;
const CLASS_PREF_KEY = 'problemiMatematica_class_pref_v1';
const CLASS_PROFILES = {
  2: { 2: 1 },
  3: { 2: 0.35, 3: 0.65 },
  4: { 2: 0.15, 3: 0.35, 4: 0.5 },
  5: { 3: 0.15, 4: 0.35, 5: 0.5 }
};
const CLASS_LABELS = {
  2: 'Classe 2ª',
  3: 'Classe 3ª',
  4: 'Classe 4ª',
  5: 'Classe 5ª'
};
const MAX_GRADE_DISTANCE = 1;
const RECENT_ID_SESSIONS = 6;
const SOFTMAX_TOP_K = 6;
const SOFTMAX_TEMPERATURE = 1.2;

const FEEDBACK_OK = ['Esatto! 🎉','Ottimo! ⭐','Wow! 🌟','Giusto! ✅','Continua così! 🚀'];
const FEEDBACK_KO = ['Riprova! 💪','Quasi! ✨','Non mollare! 🌈'];

let PROBLEMS_POOL = [
  { t: 'Fabio entra a scuola alle 8 ed esce alle 13. Quante ore resta a scuola?', a: 5 },
  { t: 'Aurora ha 12 conchiglie rosa e 11 bianche. Quante conchiglie ha in tutto?', a: 23 },
  { t: 'Un grappolo ha 22 acini. Lorenzo ne mangia 10. Quanti acini restano?', a: 12 },
  { t: 'Italo ha vinto 8 medaglie quest\'anno e 13 negli anni precedenti. Quante medaglie ha in tutto?', a: 21 },
  { t: 'Nel mazzo di Angelica ci sono 12 fiori gialli, 3 rossi e 2 arancioni. Quanti fiori ci sono in tutto?', a: 17 },
  { t: 'Sofia perde 12 figurine e gliene restano 42. Quante figurine aveva all\'inizio?', a: 54 },
  { t: 'Carla ha 13 rose e 3 appassiscono. Quante rose restano?', a: 10 },
  { t: 'Greta ha il numero 27 al supermercato. Quale numero viene subito dopo?', a: 28 },
  { t: 'Ginevra ha 31 anni e Christian 22. Quanti anni di differenza ci sono?', a: 9 },
  { t: 'Nel reparto giocattoli ci sono 22 macchinine e 15 bambole. Quanti giocattoli in tutto?', a: 37 },
  { t: 'Beppe ha 22 palline e ne regala 8. Quante palline ha ora?', a: 14 },
  { t: 'Alessia aveva 13 euro, ne spende 7 e poi riceve 11 euro. Quanti euro ha ora?', a: 17 },
  { t: 'Diego ha 36 figurine e ne regala la metà a Gaia. Quante figurine regala?', a: 18 },
  { t: 'Paolo ha 24 euro, Elena ne ha la metà. Quanti euro ha in più Paolo?', a: 12 },
  { t: 'Greta invita 19 bambini, ma 4 non possono venire. Quanti bambini andranno?', a: 15 },
  { t: 'Davide ha 6 libri di fiabe, 2 di fantascienza e 7 di fumetti. Poi riceve 3 fumetti e 2 fiabe. Quanti libri ha in tutto?', a: 20 },
  { t: 'Sara usa due confezioni da 6 uova ciascuna. Quante uova usa?', a: 12 },
  { t: 'Luciano compra 12 mele, 4 pere e 6 arance. Quanta frutta compra in tutto?', a: 22 },
  { t: 'A scuola ci sono 16 maestre e 7 vanno in pensione. Quante maestre restano?', a: 9 },
  { t: 'Luciana ha una merendina per 6 amiche e 1 compagno. 2 si schiacciano. Quante merendine può usare?', a: 5 },
  { t: 'Il casco costa 37 euro e Martina ha 25 euro. Quanti euro le mancano?', a: 12 },
  { t: 'Emma ha 15 peluche e Giada 26. Quanti peluche di differenza ci sono?', a: 11 },
  { t: 'Al corso di nuoto ci sono 32 bambini, 9 si sono già tuffati. Quanti si devono ancora tuffare?', a: 23 },
  { t: 'Il libro di Elisa ha 184 pagine. È arrivata a pagina 112. Quante pagine restano?', a: 72 },
  { t: 'Aldo ha 16 macchinine e Beppe 7. Quante macchinine hanno in tutto?', a: 23 }
];

const BONUS_QUESTIONS = {
  easy: [
    { t: 'Bonus facile: 7 + 5 = ?', a: 12 },
    { t: 'Bonus facile: 18 - 9 = ?', a: 9 },
    { t: 'Bonus facile: 4 + 8 = ?', a: 12 }
  ],
  medium: [
    { t: 'Bonus medio: 36 ÷ 6 = ?', a: 6 },
    { t: 'Bonus medio: 9 × 7 = ?', a: 63 },
    { t: 'Bonus medio: 45 - 17 = ?', a: 28 }
  ],
  hard: [
    { t: 'Bonus difficile: (18 × 3) - 17 = ?', a: 37 },
    { t: 'Bonus difficile: 144 ÷ 12 + 19 = ?', a: 31 },
    { t: 'Bonus difficile: (25 + 35) ÷ 2 = ?', a: 30 }
  ]
};

let questions = [];
let curQ = 0;
let points = 0;
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
let selectedClass = '3';

function $(id){ return document.getElementById(id); }

function safeInt(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.floor(n));
}

function safeText(value, maxLen) {
  const txt = String(value ?? '').replace(/\s+/g, ' ').trim();
  return txt.slice(0, maxLen);
}

function normalizeClassKey(value) {
  const parsed = String(value ?? '').replace(/[^0-9]/g, '');
  return CLASS_LABELS[parsed] ? parsed : '3';
}

function loadClassPref() {
  try {
    return normalizeClassKey(localStorage.getItem(CLASS_PREF_KEY));
  } catch (e) {
    return '3';
  }
}

function saveClassPref(classKey) {
  try { localStorage.setItem(CLASS_PREF_KEY, normalizeClassKey(classKey)); } catch (e) { debugWarn('runtime', e); }
}

function inferGrade(index, total) {
  const ratio = index / Math.max(1, total);
  if (ratio < 0.25) return 2;
  if (ratio < 0.5) return 3;
  if (ratio < 0.75) return 4;
  return 5;
}

function parseGradeValue(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const g = Math.round(n);
  if (g < 2 || g > 5) return null;
  return g;
}

function resolveQuestionGrade(q, index, total) {
  const direct = parseGradeValue(q && (q.g ?? q.grade ?? q.classLevel));
  if (direct) return direct;
  return inferGrade(index, total);
}

function normalizeAnswerValue(value) {
  return String(value ?? '').trim().toLowerCase();
}

function buildRecentSet(list, count) {
  if (!Array.isArray(list) || !list.length) return new Set();
  return new Set(list.slice(-Math.max(0, count)));
}

function pickWithSoftmax(candidates, scoreFn) {
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
  const narrowed = scored.slice(0, Math.min(SOFTMAX_TOP_K, scored.length));
  if (!narrowed.length) return scored[0].item;
  const best = narrowed[0].score;
  const tau = Math.max(0.25, SOFTMAX_TEMPERATURE);
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

function buildGradePlan(total, classKey) {
  const cls = normalizeClassKey(classKey);
  const profile = CLASS_PROFILES[cls] || CLASS_PROFILES[5];
  const grades = Object.keys(profile).map(Number).sort((a, b) => a - b);
  const counts = {};
  let assigned = 0;

  grades.forEach((g, idx) => {
    let n = Math.round((Number(profile[g]) || 0) * total);
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

  const out = [];
  grades.forEach((g) => {
    for (let i = 0; i < counts[g]; i++) out.push(g);
  });
  return shuffle(out).slice(0, total);
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

function buildSessionSlots(total, classPlan, pool) {
  const slots = [];
  if (!total || !Array.isArray(pool) || !pool.length) return slots;

  const areaKeys = Array.from(new Set(pool.map((q) => String(q._area || 'problem'))));
  const areaSupply = {};
  areaKeys.forEach((area) => {
    areaSupply[area] = pool.filter((q) => String(q._area || 'problem') === area).length;
  });

  const remainingGrades = {};
  classPlan.forEach((g) => {
    const key = safeInt(g, 3);
    remainingGrades[key] = (remainingGrades[key] || 0) + 1;
  });

  const areaCounts = {};
  let lastGrade = null;
  let lastArea = null;
  let gradeRun = 0;
  let areaRun = 0;

  for (let i = 0; i < total; i++) {
    const gradeKeys = Object.keys(remainingGrades)
      .map(Number)
      .filter((g) => remainingGrades[g] > 0);
    if (!gradeKeys.length) break;
    const gradeRows = gradeKeys.map((g) => {
      const remaining = remainingGrades[g] || 0;
      let weight = 1 + remaining * 0.12 + Math.random() * 0.07;
      if (lastGrade !== null && g === lastGrade) {
        weight *= gradeRun >= 2 ? 0.2 : 0.58;
      }
      return { value: g, weight: Math.max(0.05, weight) };
    });
    const targetGrade = pickWeighted(gradeRows, gradeKeys[0]);
    remainingGrades[targetGrade] = Math.max(0, (remainingGrades[targetGrade] || 0) - 1);
    if (targetGrade === lastGrade) gradeRun += 1;
    else {
      lastGrade = targetGrade;
      gradeRun = 1;
    }

    const areaRows = areaKeys.map((area) => {
      const used = areaCounts[area] || 0;
      const supply = areaSupply[area] || 1;
      let weight = (1 + supply * 0.08 + Math.random() * 0.05) / (1 + used * 0.9);
      if (lastArea && area === lastArea) {
        weight *= areaRun >= 2 ? 0.22 : 0.62;
      }
      return { value: area, weight: Math.max(0.05, weight) };
    });
    const preferredArea = pickWeighted(areaRows, areaKeys[0]);
    areaCounts[preferredArea] = (areaCounts[preferredArea] || 0) + 1;
    if (preferredArea === lastArea) areaRun += 1;
    else {
      lastArea = preferredArea;
      areaRun = 1;
    }

    slots.push({ targetGrade, preferredArea });
  }

  while (slots.length < total) {
    const fallbackGrade = safeInt(classPlan[slots.length % classPlan.length], 3);
    const fallbackArea = areaKeys[slots.length % areaKeys.length] || 'problem';
    slots.push({ targetGrade: fallbackGrade, preferredArea: fallbackArea });
  }

  return slots.slice(0, total);
}

function loadHistory() {
  try {
    const parsed = JSON.parse(localStorage.getItem(HISTORY_KEY));
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed;
  } catch (e) {
    return {};
  }
}

function saveHistory(store) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(store)); } catch (e) { debugWarn('runtime', e); }
}

function loadMetricsStore() {
  try {
    const parsed = JSON.parse(localStorage.getItem(METRICS_KEY));
    if (!parsed || typeof parsed !== 'object') return { sessions: [] };
    const sessions = Array.isArray(parsed.sessions) ? parsed.sessions : [];
    return { sessions: sessions.slice(-METRICS_MAX_SESSIONS) };
  } catch (e) {
    debugWarn('runtime', e);
    return { sessions: [] };
  }
}

function saveMetricsStore(store) {
  try { localStorage.setItem(METRICS_KEY, JSON.stringify(store)); } catch (e) { debugWarn('runtime', e); }
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
  const repeatRateId = clamp01((quality.repeatedId || 0) / total);
  const areaCoverage = clamp01(uniqueAreas / Math.max(1, safeInt(availableAreasCount, 1)));
  const areaEntropy = normalizedEntropyFromCounts(quality.areaCounts);
  const gradeEntropy = normalizedEntropyFromCounts(quality.gradeCounts);
  const novelty = clamp01(1 - repeatRateId);

  const entry = {
    ts: Date.now(),
    class: normalizeClassKey(quality.class || selectedClass),
    total,
    uniqueAreas,
    repeatRateId: round3(repeatRateId),
    areaCoverage: round3(areaCoverage),
    areaEntropy: round3(areaEntropy),
    gradeEntropy: round3(gradeEntropy),
    novelty: round3(novelty)
  };

  const store = loadMetricsStore();
  const nextSessions = (store.sessions || []).concat(entry).slice(-METRICS_MAX_SESSIONS);
  const rolling = nextSessions.slice(-METRICS_ROLLING_WINDOW);
  store.sessions = nextSessions;
  store.latest = entry;
  store.rolling = {
    window: Math.min(METRICS_ROLLING_WINDOW, rolling.length),
    repeatRateId: round3(average(rolling, 'repeatRateId')),
    areaCoverage: round3(average(rolling, 'areaCoverage')),
    areaEntropy: round3(average(rolling, 'areaEntropy')),
    gradeEntropy: round3(average(rolling, 'gradeEntropy')),
    novelty: round3(average(rolling, 'novelty'))
  };
  saveMetricsStore(store);
}

function prefersReducedMotion() {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) {
    return false;
  }
}

async function hydrateProblemsFromJson() {
  if (!window.QuestionsLoader || typeof window.QuestionsLoader.getSubjectRows !== 'function') return;
  try {
    const rows = await window.QuestionsLoader.getSubjectRows('problemi', { path: 'json/index.json' });
    if (!Array.isArray(rows) || !rows.length) return;
    const next = rows
      .map((row) => {
        const qText = String(row.question || '').trim();
        const answer = String(row.answer || '').trim();
        const opts = Array.isArray(row.options)
          ? row.options.map((opt) => String(opt || '').trim()).filter(Boolean)
          : [];
        if (!qText || !answer) return null;
        const finalOpts = opts.length >= 4 ? opts.slice(0, 4) : [];
        return {
          t: qText,
          a: answer,
          opts: finalOpts,
          g: Number(row.class) || null,
          area: String(row.area || '').trim().toLowerCase() || 'problem'
        };
      })
      .filter(Boolean);
    if (next.length) PROBLEMS_POOL = next;
  } catch (e) { debugWarn('runtime', e); }
}

document.addEventListener('DOMContentLoaded', async () => {
  selectedClass = loadClassPref();
  syncClassButtons();
  await hydrateProblemsFromJson();
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
});

function bindActions() {
  document.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      switch (action) {
        case 'toggle-mute': toggleMute(); break;
        case 'start-game': startGame(); break;
        case 'show-leaderboard': showLeaderboard(); break;
        case 'clear-leaderboard': clearLeaderboard(); break;
        case 'restart-game': startGame(); break;
        case 'go-start': goStart(); break;
        case 'skip-bonus': finishGame('skip'); break;
        case 'bonus-pick': openBonusQuestion(btn.dataset.bonus); break;
        case 'select-class': selectClass(btn.dataset.class, btn); break;
        default: break;
      }
    });
  });
}

function syncClassButtons() {
  document.querySelectorAll('.class-btn').forEach(btn => {
    const active = normalizeClassKey(btn.dataset.class) === selectedClass;
    btn.classList.toggle('selected', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
}

function selectClass(classKey, btn) {
  selectedClass = normalizeClassKey(classKey);
  saveClassPref(selectedClass);
  document.querySelectorAll('.class-btn').forEach(b => {
    b.classList.remove('selected');
    b.setAttribute('aria-pressed', 'false');
  });
  if (btn) {
    btn.classList.add('selected');
    btn.setAttribute('aria-pressed', 'true');
  } else {
    syncClassButtons();
  }
}

function spawnShapes() {
  const icons = ['🧠','📘','📐','🧩','✏️','🔢','📏','💡'];
  const bg = $('bgShapes');
  if (!bg) return;
  if (prefersReducedMotion()) return;
  const frag = document.createDocumentFragment();
  for (let i = 0; i < 20; i++) {
    const d = document.createElement('div');
    d.className = 'shape';
    d.textContent = icons[Math.floor(Math.random() * icons.length)];
    d.style.left = Math.random() * 100 + 'vw';
    d.style.fontSize = (.9 + Math.random() * 1.3) + 'rem';
    d.style.animationDuration = (10 + Math.random() * 14) + 's';
    d.style.animationDelay = (Math.random() * 20) + 's';
    frag.appendChild(d);
  }
  bg.appendChild(frag);
}

function buildSessionQuestions() {
  const classPlan = buildGradePlan(TOTAL_Q, selectedClass);
  const clsNum = Number(normalizeClassKey(selectedClass)) || 3;
  const historyStore = loadHistory();
  const bucket = `class-${selectedClass}`;
  if (!Array.isArray(historyStore[bucket])) historyStore[bucket] = [];
  const usedInSession = new Set();

  const pool = PROBLEMS_POOL.map((q, idx) => ({
    ...q,
    _id: `p-${idx}`,
    _grade: resolveQuestionGrade(q, idx, PROBLEMS_POOL.length),
    _area: String(q.area || 'problem').toLowerCase()
  }));
  const strictPool = pool.filter((q) => Math.abs(Number(q._grade || clsNum) - clsNum) <= MAX_GRADE_DISTANCE);
  const activePool = strictPool.length
    ? strictPool
    : pool.slice().sort((a, b) => Math.abs(a._grade - clsNum) - Math.abs(b._grade - clsNum));
  if (!activePool.length) return [];

  const slots = buildSessionSlots(TOTAL_Q, classPlan, activePool);
  const availableAreasCount = Math.max(1, new Set(activePool.map((q) => q._area || 'problem')).size);
  const quality = {
    class: selectedClass,
    total: 0,
    repeatedId: 0,
    areaCounts: {},
    gradeCounts: {}
  };
  const trackQuality = (area, grade, wasRecentId) => {
    quality.total += 1;
    if (wasRecentId) quality.repeatedId += 1;
    const areaKey = String(area || 'problem');
    const gradeKey = String(safeInt(grade, clsNum));
    quality.areaCounts[areaKey] = (quality.areaCounts[areaKey] || 0) + 1;
    quality.gradeCounts[gradeKey] = (quality.gradeCounts[gradeKey] || 0) + 1;
  };

  const out = [];
  for (let i = 0; i < TOTAL_Q; i++) {
    const slot = slots[i] || {};
    const targetGrade = safeInt(slot.targetGrade, classPlan[i % classPlan.length]);
    const preferredArea = String(slot.preferredArea || 'problem');
    const recentIdCount = Math.max(TOTAL_Q * RECENT_ID_SESSIONS, Math.min(activePool.length, TOTAL_Q * 2));
    const recentSet = buildRecentSet(historyStore[bucket], recentIdCount);
    let candidates = activePool.filter(q => !usedInSession.has(q._id) && !recentSet.has(q._id));
    const areaCandidates = candidates.filter((q) => q._area === preferredArea);
    if (areaCandidates.length >= 2) candidates = areaCandidates;
    if (!candidates.length) candidates = activePool.filter(q => !usedInSession.has(q._id));
    if (!candidates.length) candidates = activePool.slice();

    const chosen = pickWithSoftmax(
      candidates,
      (q) => {
        const base = Math.abs(q._grade - targetGrade) + Math.abs(q._grade - clsNum) * 1.1;
        const idx = historyStore[bucket].lastIndexOf(q._id);
        const recencyPenalty = idx >= 0 ? Math.max(0, 8 - (historyStore[bucket].length - idx)) * 2 : 0;
        const areaPenalty = q._area === preferredArea ? 0 : 0.55;
        return base + recencyPenalty + areaPenalty + Math.random() * 0.12;
      }
    ) || candidates[0];
    const wasRecentId = recentSet.has(chosen._id);
    usedInSession.add(chosen._id);
    historyStore[bucket].push(chosen._id);
    if (historyStore[bucket].length > Math.max(TOTAL_Q * RECENT_ID_SESSIONS * 3, activePool.length * 4, 60)) {
      historyStore[bucket] = historyStore[bucket].slice(-Math.max(TOTAL_Q * RECENT_ID_SESSIONS * 3, activePool.length * 4, 60));
    }
    out.push(chosen);
    trackQuality(chosen._area, targetGrade, wasRecentId);
  }

  saveHistory(historyStore);
  recordSessionQuality(quality, availableAreasCount);
  return out.slice(0, TOTAL_Q);
}

function startGame() {
  questions = buildSessionQuestions();
  if (!questions.length) return;
  curQ = 0;
  points = 0;
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
  const classLabel = CLASS_LABELS[selectedClass] || `Classe ${selectedClass}ª`;
  $('qMeta').textContent = `Problema ${curQ + 1} di ${TOTAL_Q} · ${classLabel}`;
  $('qText').textContent = q.t;

  const answers = $('answers');
  answers.textContent = '';
  const frag = document.createDocumentFragment();
  const options = (Array.isArray(q.opts) && q.opts.length >= 4)
    ? shuffle(q.opts.slice(0, 4).map((opt) => String(opt)))
    : generateOptions(q.a).map((opt) => String(opt));
  options.forEach(opt => {
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

function generateOptions(correct) {
  const correctNum = Number(correct);
  if (!Number.isFinite(correctNum)) {
    const base = String(correct ?? '').trim();
    const opts = new Set([base]);
    let i = 1;
    while (opts.size < 4) {
      opts.add(`${base} (${i})`);
      i += 1;
    }
    return shuffle([...opts]);
  }

  const opts = new Set([correctNum]);
  let tries = 0;
  while (opts.size < 4 && tries < 120) {
    tries++;
    const span = Math.max(6, Math.round(correctNum * 0.25));
    const delta = Math.floor(Math.random() * (span * 2 + 1)) - span;
    const val = correctNum + delta;
    if (val > 0 && val !== correctNum) opts.add(val);
  }
  while (opts.size < 4) opts.add(correctNum + opts.size + 1);
  return shuffle([...opts]);
}

function checkAnswer(chosen, correct, btn) {
  if (answered) return;
  answered = true;

  const wanted = normalizeAnswerValue(correct);
  const isOk = normalizeAnswerValue(chosen) === wanted;
  const buttons = [...document.querySelectorAll('#answers .answer-btn')];
  buttons.forEach(b => b.disabled = true);

  if (isOk) {
    btn.classList.add('correct');
    points += POINTS_PER_Q;
    playOk();
    showFeedback(true);
  } else {
    btn.classList.add('wrong');
    buttons.forEach(b => {
      if (normalizeAnswerValue(b.textContent) === wanted) b.classList.add('correct');
    });
    playKo();
    showFeedback(false);
  }

  history.push(isOk);
  curQ++;
  updateScoreBar();

  setTimeout(() => {
    if (curQ >= TOTAL_Q) openBonusPick();
    else loadQuestion();
  }, 1100);
}

function openBonusPick() {
  baseScore = points;
  $('baseScoreLabel').textContent = baseScore;
  showScreen('screenBonusPick');
}

function openBonusQuestion(type) {
  bonusType = type;
  const factor = BONUS_FACTORS[type];
  bonusFactor = factor;
  const q = shuffle([...BONUS_QUESTIONS[type]])[0];

  $('bonusMeta').textContent = `Bonus ${BONUS_LABELS[type]} · Moltiplicatore x${factor}`;
  $('bonusText').textContent = q.t;

  const area = $('bonusAnswers');
  area.textContent = '';
  const frag = document.createDocumentFragment();
  generateOptions(q.a).forEach(opt => {
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

function checkBonusAnswer(chosen, correct, btn) {
  const buttons = [...document.querySelectorAll('#bonusAnswers .answer-btn')];
  if (!buttons.length || buttons[0].disabled) return;
  buttons.forEach(b => b.disabled = true);

  const wanted = normalizeAnswerValue(correct);
  const ok = normalizeAnswerValue(chosen) === wanted;
  if (ok) {
    btn.classList.add('correct');
    playPerfect();
    showFeedback(true, 'Bonus corretto!');
    finishGame('bonus-ok');
  } else {
    btn.classList.add('wrong');
    buttons.forEach(b => {
      if (normalizeAnswerValue(b.textContent) === wanted) b.classList.add('correct');
    });
    playKo();
    showFeedback(false, 'Bonus non riuscito');
    finishGame('bonus-ko');
  }
}

function finishGame(mode) {
  if (mode === 'bonus-ok') {
    bonusApplied = true;
    finalScore = baseScore * bonusFactor;
  } else {
    bonusApplied = false;
    finalScore = baseScore;
  }

  if (mode === 'skip') {
    bonusFactor = 1;
    bonusType = null;
    bonusApplied = false;
  }

  let emoji = '🏁';
  let title = 'Partita completata!';
  let msg = 'Hai fatto un ottimo lavoro.';

  if (finalScore >= 750) { emoji = '🏆'; title = 'Fantastico!'; msg = 'Moltiplicatore centrato al massimo!'; }
  else if (finalScore >= 300) { emoji = '🌟'; title = 'Complimenti!'; msg = 'Punteggio super, continua così!'; }
  else if (finalScore >= 100) { emoji = '😊'; title = 'Benissimo!'; msg = 'Ottima base sui problemi.'; }

  if (!creditsAwarded && window.ScuolaEconomy) {
    const correctCount = history.filter(Boolean).length;
    const reward = window.ScuolaEconomy.calcSessionCredits({
      correct: correctCount,
      bonusType,
      bonusApplied
    });
    if (reward.total > 0) {
      window.ScuolaEconomy.addCredits(reward.total, {
        source: 'quiz-problemi',
        note: `classe ${selectedClass} · corrette ${correctCount}/10`
      });
      msg += ` Hai guadagnato ${reward.total} crediti.`;
    }
    creditsAwarded = true;
  }

  $('resultEmoji').textContent = emoji;
  $('resultTitle').textContent = title;
  $('resultMsg').textContent = msg;
  $('rBase').textContent = baseScore;
  $('rBonus').textContent = bonusApplied ? `x${bonusFactor}` : 'x1';
  $('rFinal').textContent = finalScore;

  saveScore();
  showScreen('screenResult');
  $('scoreBar').style.display = 'none';
}

function saveScore() {
  const entry = {
    cls: CLASS_LABELS[selectedClass] || `Classe ${selectedClass}ª`,
    base: baseScore,
    bonus: bonusType ? `${BONUS_LABELS[bonusType]} ${bonusApplied ? `x${bonusFactor}` : 'x1'}` : 'Nessuno',
    final: finalScore,
    date: new Date().toLocaleDateString('it-IT')
  };
  const lb = loadLB();
  lb.push(entry);
  lb.sort((a, b) => b.final - a.final);
  const top = lb.slice(0, 15);
  try { localStorage.setItem(LB_KEY, JSON.stringify(top)); } catch (e) { debugWarn('runtime', e); }
}

function loadLB() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LB_KEY));
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, 50).map((entry) => ({
      cls: safeText(entry && entry.cls, 24),
      base: safeInt(entry && entry.base, 0),
      bonus: safeText(entry && entry.bonus, 48),
      final: safeInt(entry && entry.final, 0),
      date: safeText(entry && entry.date, 20)
    }));
  }
  catch (e) { return []; }
}

function clearLeaderboard() {
  if (confirm('Cancellare tutta la classifica?')) {
    try { localStorage.removeItem(LB_KEY); } catch (e) { debugWarn('runtime', e); }
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
    empty.append('Nessuna partita ancora.');
    empty.appendChild(document.createElement('br'));
    empty.append('Gioca la prima!');
    cont.appendChild(empty);
    return;
  }

  const table = document.createElement('table');
  table.className = 'lb-table';

  const thead = document.createElement('thead');
  const hr = document.createElement('tr');
  ['#', 'Classe', 'Base', 'Bonus', 'Finale', 'Data'].forEach(label => {
    const th = document.createElement('th');
    th.scope = 'col';
    th.textContent = label;
    hr.appendChild(th);
  });
  thead.appendChild(hr);

  const tbody = document.createElement('tbody');
  lb.forEach((e, i) => {
    const tr = document.createElement('tr');
    const vals = [i + 1, e.cls || '-', e.base, e.bonus, e.final, e.date];
    vals.forEach(v => {
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
  showScreen('screenStart');
  $('scoreBar').style.display = 'none';
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
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
  setTimeout(() => { el.className = 'feedback'; }, 850);
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}
function note(freq, t, dur, vol = 0.24) {
  if (muted) return;
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.frequency.value = freq;
    g.gain.setValueAtTime(vol, ctx.currentTime + t);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + dur);
    osc.start(ctx.currentTime + t);
    osc.stop(ctx.currentTime + t + dur + 0.05);
  } catch (e) { debugWarn('runtime', e); }
}
function playOk(){ note(523,0,.1); note(659,.1,.1); note(784,.2,.2); }
function playKo(){ note(330,0,.15,.2); note(262,.16,.25,.2); }
function playPerfect(){ [523,587,659,784,880,1047].forEach((f,i)=>note(f,i*.07,.18)); }

function toggleMute() {
  muted = !muted;
  const btn = $('muteBtn');
  btn.textContent = muted ? '🔇 Audio' : '🔊 Audio';
  btn.setAttribute('aria-label', muted ? 'Riattiva audio' : 'Disattiva audio');
}
