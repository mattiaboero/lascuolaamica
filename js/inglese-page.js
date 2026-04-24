// Auto-estratto da inglese.html per CSP hardening (no inline script).
// ============================================================
// QUESTION BANK
// Structure: { emoji, prompt (Italian), answer (English), distractors: [3 wrong options] }
// ============================================================
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

function getQuestionsLoader() {
  const sa = window.SA;
  if (sa && sa.questionsLoader) return sa.questionsLoader;
  return window.QuestionsLoader || null;
}

function getEconomy() {
  const sa = window.SA;
  if (sa && sa.economy) return sa.economy;
  return window.ScuolaEconomy || null;
}

let QB = {
  1: [
    // Colors
    {e:'🔴',p:'Come si dice "rosso" in inglese?',a:'red',d:['blue','green','yellow']},
    {e:'🔵',p:'Come si dice "blu" in inglese?',a:'blue',d:['red','green','purple']},
    {e:'🟢',p:'Come si dice "verde" in inglese?',a:'green',d:['blue','yellow','red']},
    {e:'🟡',p:'Come si dice "giallo" in inglese?',a:'yellow',d:['orange','green','blue']},
    {e:'🟠',p:'Come si dice "arancione" in inglese?',a:'orange',d:['yellow','red','pink']},
    {e:'🟣',p:'Come si dice "viola" in inglese?',a:'purple',d:['pink','blue','orange']},
    {e:'🩷',p:'Come si dice "rosa" in inglese?',a:'pink',d:['red','purple','orange']},
    {e:'⚫',p:'Come si dice "nero" in inglese?',a:'black',d:['white','grey','brown']},
    {e:'⚪',p:'Come si dice "bianco" in inglese?',a:'white',d:['black','grey','yellow']},
    // Animals
    {e:'🐱',p:'Come si dice "gatto" in inglese?',a:'cat',d:['dog','bird','fish']},
    {e:'🐶',p:'Come si dice "cane" in inglese?',a:'dog',d:['cat','pig','cow']},
    {e:'🐦',p:'Come si dice "uccello" in inglese?',a:'bird',d:['fish','frog','cat']},
    {e:'🐟',p:'Come si dice "pesce" in inglese?',a:'fish',d:['bird','frog','duck']},
    {e:'🐰',p:'Come si dice "coniglio" in inglese?',a:'rabbit',d:['mouse','cat','hamster']},
    {e:'🐄',p:'Come si dice "mucca" in inglese?',a:'cow',d:['pig','horse','sheep']},
    {e:'🐷',p:'Come si dice "maiale" in inglese?',a:'pig',d:['cow','duck','rabbit']},
    {e:'🦆',p:'Come si dice "papera" in inglese?',a:'duck',d:['bird','frog','fish']},
    {e:'🐴',p:'Come si dice "cavallo" in inglese?',a:'horse',d:['cow','pig','rabbit']},
    // Body parts
    {e:'👁️',p:'Come si dice "occhio" in inglese?',a:'eye',d:['ear','nose','mouth']},
    {e:'👃',p:'Come si dice "naso" in inglese?',a:'nose',d:['eye','ear','mouth']},
    {e:'👄',p:'Come si dice "bocca" in inglese?',a:'mouth',d:['nose','eye','ear']},
    {e:'👂',p:'Come si dice "orecchio" in inglese?',a:'ear',d:['eye','nose','mouth']},
    {e:'✋',p:'Come si dice "mano" in inglese?',a:'hand',d:['foot','arm','leg']},
    {e:'🦶',p:'Come si dice "piede" in inglese?',a:'foot',d:['hand','arm','leg']},
    {e:'💪',p:'Come si dice "braccio" in inglese?',a:'arm',d:['leg','foot','hand']},
    // Family
    {e:'👩',p:'Come si dice "mamma" in inglese?',a:'mum',d:['dad','sister','aunt']},
    {e:'👨',p:'Come si dice "papà" in inglese?',a:'dad',d:['mum','uncle','grandpa']},
    {e:'👧',p:'Come si dice "sorella" in inglese?',a:'sister',d:['brother','cousin','friend']},
    {e:'👦',p:'Come si dice "fratello" in inglese?',a:'brother',d:['sister','cousin','friend']},
    // Greetings & numbers
    {e:'👋',p:'Come si dice "ciao" in inglese?',a:'hello',d:['goodbye','thanks','please']},
    {e:'🙏',p:'Come si dice "grazie" in inglese?',a:'thank you',d:['please','sorry','hello']},
    {e:'1️⃣',p:'Come si dice "uno" in inglese?',a:'one',d:['two','three','four']},
    {e:'2️⃣',p:'Come si dice "due" in inglese?',a:'two',d:['one','three','five']},
    {e:'5️⃣',p:'Come si dice "cinque" in inglese?',a:'five',d:['four','six','three']},
    {e:'🔟',p:'Come si dice "dieci" in inglese?',a:'ten',d:['eight','nine','seven']}
  ],
  2: [
    // Days
    {e:'📅',p:'Come si dice "lunedì" in inglese?',a:'Monday',d:['Tuesday','Wednesday','Sunday']},
    {e:'📅',p:'Come si dice "martedì" in inglese?',a:'Tuesday',d:['Monday','Wednesday','Thursday']},
    {e:'📅',p:'Come si dice "mercoledì" in inglese?',a:'Wednesday',d:['Tuesday','Thursday','Friday']},
    {e:'📅',p:'Come si dice "giovedì" in inglese?',a:'Thursday',d:['Wednesday','Friday','Monday']},
    {e:'📅',p:'Come si dice "venerdì" in inglese?',a:'Friday',d:['Thursday','Saturday','Monday']},
    {e:'📅',p:'Come si dice "sabato" in inglese?',a:'Saturday',d:['Friday','Sunday','Monday']},
    {e:'📅',p:'Come si dice "domenica" in inglese?',a:'Sunday',d:['Saturday','Monday','Friday']},
    // Weather
    {e:'☀️',p:'Che tempo fa? Scegli la risposta: "It is..."',a:'sunny',d:['rainy','cloudy','snowy']},
    {e:'🌧️',p:'Che tempo fa? Scegli la risposta: "It is..."',a:'rainy',d:['sunny','cloudy','windy']},
    {e:'❄️',p:'Che tempo fa? Scegli la risposta: "It is..."',a:'snowy',d:['rainy','cloudy','foggy']},
    {e:'☁️',p:'Che tempo fa? Scegli la risposta: "It is..."',a:'cloudy',d:['sunny','windy','snowy']},
    {e:'💨',p:'Che tempo fa? Scegli la risposta: "It is..."',a:'windy',d:['cloudy','sunny','rainy']},
    // Food
    {e:'🍎',p:'Come si dice "mela" in inglese?',a:'apple',d:['banana','orange','pear']},
    {e:'🍌',p:'Come si dice "banana" in inglese?',a:'banana',d:['apple','orange','pear']},
    {e:'🍕',p:'Come si dice "pizza" in inglese?',a:'pizza',d:['pasta','sandwich','cake']},
    {e:'🥛',p:'Come si dice "latte" in inglese?',a:'milk',d:['water','juice','tea']},
    {e:'🍞',p:'Come si dice "pane" in inglese?',a:'bread',d:['pasta','rice','cake']},
    {e:'💧',p:'Come si dice "acqua" in inglese?',a:'water',d:['milk','juice','tea']},
    {e:'🎂',p:'Come si dice "torta" in inglese?',a:'cake',d:['bread','pie','cookie']},
    {e:'🥚',p:'Come si dice "uovo" in inglese?',a:'egg',d:['cheese','butter','milk']},
    // Months
    {e:'🗓️',p:'Come si dice "gennaio" in inglese?',a:'January',d:['February','March','June']},
    {e:'🗓️',p:'Come si dice "giugno" in inglese?',a:'June',d:['July','January','March']},
    {e:'🗓️',p:'Come si dice "settembre" in inglese?',a:'September',d:['October','August','November']},
    {e:'🗓️',p:'Come si dice "dicembre" in inglese?',a:'December',d:['November','January','October']},
    // Grammar
    {e:'👤',p:'Completa: "I ___ eight years old."',a:'am',d:['is','are','be']},
    {e:'👤👤',p:'Completa: "You ___ my best friend."',a:'are',d:['am','is','be']},
    {e:'👦',p:'Completa: "He ___ very tall."',a:'is',d:['am','are','be']},
    {e:'👧',p:'Completa: "She ___ a little sister."',a:'has got',d:['have got','is got','are got']},
    {e:'🌡️',p:'Come si dice "caldo" in inglese?',a:'hot',d:['cold','warm','cool']},
    {e:'🌡️',p:'Come si dice "freddo" in inglese?',a:'cold',d:['hot','warm','cool']}
  ],
  3: [
    // Daily routine
    {e:'🌅',p:'Come si traduce "mi sveglio"?',a:'I wake up',d:['I go to bed','I have breakfast','I go to school']},
    {e:'🥣',p:'Come si traduce "faccio colazione"?',a:'I have breakfast',d:['I have lunch','I have dinner','I wake up']},
    {e:'🏫',p:'Come si traduce "vado a scuola"?',a:'I go to school',d:['I go to bed','I go home','I stay home']},
    {e:'📚',p:'Come si traduce "faccio i compiti"?',a:'I do my homework',d:['I read a book','I play games','I do sport']},
    {e:'🍽️',p:'Come si traduce "ceno"?',a:'I have dinner',d:['I have lunch','I have breakfast','I cook']},
    {e:'🌙',p:'Come si traduce "vado a letto"?',a:'I go to bed',d:['I wake up','I go to school','I have dinner']},
    // Sports
    {e:'⚽',p:'Come si traduce "gioco a calcio"?',a:'I play football',d:['I play basketball','I play tennis','I swim']},
    {e:'🏊',p:'Come si traduce "nuoto"?',a:'I swim',d:['I run','I cycle','I jump']},
    {e:'🏀',p:'Come si traduce "gioco a basket"?',a:'I play basketball',d:['I play football','I play tennis','I run']},
    {e:'🚴',p:'Come si traduce "vado in bicicletta"?',a:'I cycle',d:['I run','I swim','I skate']},
    {e:'🎾',p:'Come si traduce "gioco a tennis"?',a:'I play tennis',d:['I play football','I play golf','I swim']},
    {e:'🏃',p:'Come si traduce "corro"?',a:'I run',d:['I swim','I jump','I cycle']},
    // Home
    {e:'🍳',p:'Come si traduce "la cucina"?',a:'kitchen',d:['bedroom','bathroom','living room']},
    {e:'🛏️',p:'Come si traduce "la camera da letto"?',a:'bedroom',d:['kitchen','bathroom','living room']},
    {e:'🚿',p:'Come si traduce "il bagno"?',a:'bathroom',d:['kitchen','bedroom','garden']},
    {e:'🌿',p:'Come si traduce "il giardino"?',a:'garden',d:['kitchen','living room','bedroom']},
    {e:'🛋️',p:'Come si traduce "il salotto"?',a:'living room',d:['bedroom','kitchen','bathroom']},
    // Hobbies
    {e:'📖',p:'Come si traduce "mi piace leggere"?',a:'I like reading',d:['I like drawing','I like dancing','I like cooking']},
    {e:'✏️',p:'Come si traduce "mi piace disegnare"?',a:'I like drawing',d:['I like reading','I like dancing','I like singing']},
    {e:'🍳',p:'Come si traduce "mi piace cucinare"?',a:'I like cooking',d:['I like eating','I like baking','I like cleaning']},
    // Questions & phrases
    {e:'❓',p:'Cosa significa "What\'s your name?"',a:'Come ti chiami?',d:['Quanti anni hai?','Come stai?','Dove abiti?']},
    {e:'🎂',p:'Cosa significa "How old are you?"',a:'Quanti anni hai?',d:['Come ti chiami?','Come stai?','Dove vivi?']},
    {e:'🏠',p:'Cosa significa "Where do you live?"',a:'Dove abiti?',d:['Come ti chiami?','Quanti anni hai?','Cosa ti piace?']},
    {e:'🍕',p:'Cosa significa "Do you like pizza?"',a:'Ti piace la pizza?',d:['Mangi la pizza?','Hai la pizza?','Vuoi la pizza?']},
    {e:'⏰',p:'Cosa significa "What time is it?"',a:'Che ore sono?',d:['Che giorno è?','Che tempo fa?','Dove sei?']},
    {e:'⚽',p:'Cosa significa "She plays football"?',a:'Lei gioca a calcio',d:['Lei nuota','Lei corre','Lei balla']},
    {e:'🌅',p:'Cosa significa "I wake up at seven"?',a:'Mi sveglio alle sette',d:['Vado a letto alle sette','Faccio colazione alle sette','Vado a scuola alle sette']},
    {e:'📅',p:'Cosa significa "Every day"?',a:'Ogni giorno',d:['Ieri','Domani','Oggi']},
    {e:'🏫',p:'Cosa significa "I go to school by bus"?',a:'Vado a scuola in autobus',d:['Vado a casa in autobus','Torno da scuola','Aspetto l\'autobus']},
    {e:'💪',p:'Cosa significa "I can swim"?',a:'So nuotare',d:['Mi piace nuotare','Voglio nuotare','Ho nuotato']}
  ]
};

const ENGLISH_LEVEL_FROM_SUBAREA = {
  lessico_base: 1,
  frasi_semplici: 2,
  uso_guidato: 3,
  comprensione_in_contesto: 3
};

const ENGLISH_AREA_ICON = {
  animali: '🐾',
  casa: '🏠',
  cibo: '🍎',
  colori: '🎨',
  corpo_umano: '🧍',
  domande: '❓',
  famiglia: '👨‍👩‍👧',
  giorni: '📅',
  have_got: '🧩',
  hobby: '🎯',
  mesi: '🗓️',
  meteo: '🌦️',
  numeri: '🔢',
  routine_quotidiana: '⏰',
  saluti: '👋',
  sport: '⚽',
  to_be: '🔤'
};

// ============================================================
// MASCOTS PER LEVEL
// ============================================================
const MASCOTS = { 1:['🐠','🐡','🦀','🐙'], 2:['🐬','🦈','🐳','🐟'], 3:['🦑','🦞','🦐','🐚'] };
const OK_MSGS  = ['Esatto! 🎉','Complimenti! ⭐','Wow! 🌟','Yes! 🎊','Super! 💪','Continua così! 🚀','Top! 🔥'];
const KO_MSGS  = ['Quasi! 😅','Try again! 💪','Non mollare! 🌈','Keep going! ✨'];
const BONUS_FACTORS = { easy: 5, medium: 10, hard: 25 };
const BONUS_LABELS = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
const CLASS_PREF_KEY = 'englishAdventure_class_pref_v1';
const HISTORY_KEY = 'englishAdventure_history_v2';
const CLASS_LABELS = { 2: 'Classe 2ª', 3: 'Classe 3ª', 4: 'Classe 4ª', 5: 'Classe 5ª' };
const CLASS_PROFILES = {
  2: { 2: 1 },
  3: { 2: 0.35, 3: 0.65 },
  4: { 3: 0.4, 4: 0.6 },
  5: { 4: 0.35, 5: 0.65 }
};
const MAX_CLASS_DISTANCE = 1;
const RECENT_ID_SESSIONS = 6;
const SOFTMAX_TOP_K = 6;
const SOFTMAX_TEMPERATURE = 1.2;
const METRICS_KEY = 'englishAdventure_quality_v1';
const METRICS_MAX_SESSIONS = 180;
const METRICS_ROLLING_WINDOW = 30;
const BONUS_Q = {
  easy: [
    { q: 'Bonus easy: "gatto" in inglese?', a: 'cat', d: ['dog', 'fish', 'bird'] },
    { q: 'Bonus easy: "rosso" in inglese?', a: 'red', d: ['blue', 'green', 'yellow'] },
    { q: 'Bonus easy: "ciao" in inglese?', a: 'hello', d: ['goodbye', 'thanks', 'please'] }
  ],
  medium: [
    { q: 'Bonus medium: completa "She ___ happy."', a: 'is', d: ['am', 'are', 'be'] },
    { q: 'Bonus medium: "venerdì" in inglese?', a: 'Friday', d: ['Thursday', 'Saturday', 'Monday'] },
    { q: 'Bonus medium: "acqua" in inglese?', a: 'water', d: ['milk', 'juice', 'tea'] }
  ],
  hard: [
    { q: 'Bonus hard: traduci "I wake up at seven".', a: 'Mi sveglio alle sette', d: ['Vado a letto alle sette', 'Faccio colazione alle sette', 'Vado a scuola alle sette'] },
    { q: 'Bonus hard: traduci "Where do you live?"', a: 'Dove abiti?', d: ['Come ti chiami?', 'Quanti anni hai?', 'Come stai?'] },
    { q: 'Bonus hard: traduci "I can swim".', a: 'So nuotare', d: ['Voglio nuotare', 'Mi piace nuotare', 'Ho nuotato'] }
  ]
};

// ============================================================
// STATE
// ============================================================
let level=1, qs=[], curQ=0, ok=0, ko=0, streak=0, bestStreak=0;
let hist=[], answered=false, timerIv=null, timerStart=null;
let muted=false, audioCtx=null, curMascot='🐠';
let baseScore=0, finalScore=0, bonusFactor=1, bonusType=null, bonusApplied=false, creditsAwarded=false;
let selectedClass='3';

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

function loadHistoryStore() {
  try {
    const parsed = JSON.parse(localStorage.getItem(HISTORY_KEY));
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed;
  } catch (e) {
    return {};
  }
}

function saveHistoryStore(store) {
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
    level: safeInt(quality.level || level, 1),
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

function parseGradeValue(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const g = Math.round(n);
  if (g < 2 || g > 5) return null;
  return g;
}

function inferEnglishGrade(lvl, idx, total) {
  const ratio = idx / Math.max(1, total);
  if (lvl === 1) return ratio < 0.6 ? 2 : 3;
  if (lvl === 2) return ratio < 0.5 ? 3 : 4;
  return ratio < 0.45 ? 4 : 5;
}

function resolveEnglishGrade(q, lvl, idx, total) {
  const direct = parseGradeValue(q && (q.g ?? q.grade ?? q.classLevel));
  if (direct) return direct;
  return inferEnglishGrade(lvl, idx, total);
}

function classNumber() {
  return Number(normalizeClassKey(selectedClass)) || 3;
}

function levelMinDistance(lvl, classKey) {
  const source = Array.isArray(QB[lvl]) ? QB[lvl] : [];
  if (!source.length) return 99;
  const cls = Number(normalizeClassKey(classKey)) || 3;
  let min = 99;
  for (let i = 0; i < source.length; i++) {
    const grade = resolveEnglishGrade(source[i], lvl, i, source.length);
    min = Math.min(min, Math.abs(grade - cls));
  }
  return min;
}

function isLevelAvailableForClass(lvl, classKey) {
  return levelMinDistance(lvl, classKey) <= MAX_CLASS_DISTANCE;
}

function refreshLevelButtonsForClass() {
  const cls = normalizeClassKey(selectedClass);
  document.querySelectorAll('.level-card[data-action=\"start-level\"]').forEach((btn) => {
    const lvl = Number(btn.dataset.level || 0);
    const ok = isLevelAvailableForClass(lvl, cls);
    btn.disabled = !ok;
    btn.classList.toggle('locked', !ok);
    btn.setAttribute('aria-disabled', ok ? 'false' : 'true');
    if (!ok) {
      btn.setAttribute('title', `Livello non disponibile per ${CLASS_LABELS[cls] || `Classe ${cls}ª`}`);
    } else {
      btn.removeAttribute('title');
    }
  });
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

  const areaKeys = Array.from(new Set(pool.map((q) => String(q._area || 'base'))));
  const poolAreaSizes = {};
  areaKeys.forEach((area) => {
    poolAreaSizes[area] = pool.filter((q) => String(q._area || 'base') === area).length;
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
        weight *= gradeRun >= 2 ? 0.18 : 0.55;
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
      const supply = poolAreaSizes[area] || 1;
      let weight = (1 + supply * 0.08 + Math.random() * 0.06) / (1 + used * 0.9);
      if (lastArea && area === lastArea) {
        weight *= areaRun >= 2 ? 0.2 : 0.6;
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
    const fallbackArea = areaKeys[slots.length % areaKeys.length] || 'base';
    slots.push({ targetGrade: fallbackGrade, preferredArea: fallbackArea });
  }
  return slots.slice(0, total);
}

function prefersReducedMotion() {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) {
    return false;
  }
}

async function hydrateEnglishFromJson() {
  const questionsLoader = getQuestionsLoader();
  if (!questionsLoader || typeof questionsLoader.getSubjectRows !== 'function') return;
  try {
    const rows = await questionsLoader.getSubjectRows('inglese', { path: 'json/index.json' });
    if (!Array.isArray(rows) || !rows.length) return;

    const next = { 1: [], 2: [], 3: [] };
    rows.forEach((row) => {
      const question = String(row.question || '').trim();
      const answer = String(row.answer || '').trim();
      const opts = Array.isArray(row.options) ? row.options.map((opt) => String(opt || '').trim()) : [];
      if (!question || !answer || opts.length < 4) return;

      const sub = String(row.subarea || '').trim().toLowerCase();
      let lvl = ENGLISH_LEVEL_FROM_SUBAREA[sub];
      if (!lvl) {
        const diff = Number(row.difficulty) || 1;
        lvl = diff >= 3 ? 3 : (diff === 2 ? 2 : 1);
      }

      const distractors = opts.filter((opt) => opt && opt !== answer).slice(0, 3);
      if (distractors.length < 3) return;

      const areaKey = String(row.area || '').trim().toLowerCase();
      const emoji = ENGLISH_AREA_ICON[areaKey] || '🔤';
      next[lvl].push({
        e: emoji,
        p: question,
        a: answer,
        d: distractors,
        g: Number(row.class) || null,
        area: areaKey || 'base'
      });
    });

    if (next[1].length || next[2].length || next[3].length) {
      QB = {
        1: next[1].length ? next[1] : QB[1],
        2: next[2].length ? next[2] : QB[2],
        3: next[3].length ? next[3] : QB[3]
      };
    }
  } catch (e) { debugWarn('runtime', e); }
}

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  selectedClass = loadClassPref();
  syncClassButtons();
  await hydrateEnglishFromJson();
  refreshLevelButtonsForClass();
  bindStaticActions();
  spawnBg();
});

function bindStaticActions() {
  document.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      switch (btn.dataset.action) {
        case 'toggle-mute': toggleMute(); break;
        case 'show-lb': showLB(); break;
        case 'replay-game': replayGame(); break;
        case 'go-levels': goLevels(); break;
        case 'clear-lb': clearLB(); break;
        case 'start-level': startGame(parseInt(btn.dataset.level, 10)); break;
        case 'select-class': selectClass(btn.dataset.class, btn); break;
        case 'bonus-pick': openBonusQuestion(btn.dataset.bonus); break;
        case 'skip-bonus': finishGame('skip'); break;
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
  refreshLevelButtonsForClass();
}

function spawnBg() {
  const bg = document.getElementById('bgShapes');
  if (!bg) return;
  if (prefersReducedMotion()) return;
  const icons = ['🔤', '📚', '✏️', '📝', '🌍', '🗣️', '🎯'];
  const frag = document.createDocumentFragment();
  for (let i = 0; i < 26; i++) {
    const s = document.createElement('div');
    s.className = 'shape';
    s.setAttribute('aria-hidden', 'true');
    s.textContent = icons[Math.floor(Math.random() * icons.length)];
    s.style.left = Math.random() * 100 + 'vw';
    s.style.fontSize = (22 + Math.random() * 24) + 'px';
    s.style.animationDuration = (12 + Math.random() * 18) + 's';
    s.style.animationDelay = (Math.random() * 12) + 's';
    frag.appendChild(s);
  }
  bg.appendChild(frag);
}

// ============================================================
// AUDIO
// ============================================================
function getCtx() { if(!audioCtx) audioCtx=new (window.AudioContext||window.webkitAudioContext)(); return audioCtx; }
function note(freq,t,dur,vol=.25,type='sine') {
  if(muted) return;
  try{
    const ctx=getCtx(), osc=ctx.createOscillator(), g=ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.frequency.value=freq; osc.type=type;
    g.gain.setValueAtTime(vol,ctx.currentTime+t);
    g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+t+dur);
    osc.start(ctx.currentTime+t); osc.stop(ctx.currentTime+t+dur+.05);
  } catch (e) {
    debugWarn('note', e);
  }
}
function playOk()      { note(523,.0,.1); note(659,.1,.1); note(784,.2,.25); }
function playKo()      { note(330,.0,.15,.2); note(262,.16,.25,.2); }
function playStreak()  { note(523,.0,.08); note(659,.08,.08); note(784,.16,.08); note(1047,.24,.3); }
function playPerfect() { [523,587,659,784,880,1047].forEach((f,i)=>note(f,i*.07,.18)); }
function playStart()   { note(392,.0,.1); note(523,.1,.1); note(659,.2,.15); }

function toggleMute() {
  muted=!muted;
  const btn = document.getElementById('muteBtn');
  const icon = document.createElement('span');
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = muted ? '🔇' : '🔊';
  btn.replaceChildren(icon, document.createTextNode(' Audio'));
  btn.setAttribute('aria-label', muted ? 'Riattiva audio' : 'Disattiva audio');
}

// ============================================================
// GAME
// ============================================================
function buildSessionQuestions(lvl) {
  const source = Array.isArray(QB[lvl]) ? QB[lvl] : [];
  const normalized = source.map((q, idx) => ({
    ...q,
    _id: `${lvl}:${idx}`,
    _grade: resolveEnglishGrade(q, lvl, idx, source.length),
    _area: String(q.area || q.subarea || 'base').toLowerCase()
  }));
  if (!normalized.length) return [];
  const cls = classNumber();
  const strictPool = normalized.filter(q => Math.abs(Number(q._grade || cls) - cls) <= MAX_CLASS_DISTANCE);
  const pool = strictPool.length ? strictPool : normalized.slice();
  const classPlan = buildGradePlan(10, selectedClass);
  const slots = buildSessionSlots(10, classPlan, pool);
  const historyStore = loadHistoryStore();
  const bucket = `${selectedClass}|lvl-${lvl}`;
  if (!Array.isArray(historyStore[bucket])) historyStore[bucket] = [];
  const usedInSession = new Set();
  const out = [];
  const availableAreasCount = Math.max(1, new Set(pool.map((q) => q._area || 'base')).size);
  const quality = {
    class: selectedClass,
    level: lvl,
    total: 0,
    repeatedId: 0,
    areaCounts: {},
    gradeCounts: {}
  };
  const trackQuality = (area, grade, wasRecentId) => {
    quality.total += 1;
    if (wasRecentId) quality.repeatedId += 1;
    const areaKey = String(area || 'base');
    const gradeKey = String(safeInt(grade, cls));
    quality.areaCounts[areaKey] = (quality.areaCounts[areaKey] || 0) + 1;
    quality.gradeCounts[gradeKey] = (quality.gradeCounts[gradeKey] || 0) + 1;
  };

  for (let i = 0; i < 10; i++) {
    const slot = slots[i] || {};
    const targetGrade = safeInt(slot.targetGrade, classPlan[i % classPlan.length]);
    const preferredArea = String(slot.preferredArea || 'base');
    const recentIdCount = Math.max(10 * RECENT_ID_SESSIONS, Math.min(pool.length, 20));
    const recentSet = buildRecentSet(historyStore[bucket], recentIdCount);
    let candidates = pool.filter(q => !usedInSession.has(q._id) && !recentSet.has(q._id));
    const areaCandidates = candidates.filter((q) => q._area === preferredArea);
    if (areaCandidates.length >= 2) candidates = areaCandidates;
    if (!candidates.length) candidates = pool.filter(q => !usedInSession.has(q._id));
    if (!candidates.length) candidates = pool.slice();

    const chosen = pickWithSoftmax(
      candidates,
      (q) => {
        const base = Math.abs(q._grade - targetGrade) + Math.abs(q._grade - cls) * 1.1;
        const idx = historyStore[bucket].lastIndexOf(q._id);
        const recencyPenalty = idx >= 0 ? Math.max(0, 8 - (historyStore[bucket].length - idx)) * 2 : 0;
        const areaPenalty = q._area === preferredArea ? 0 : 0.6;
        return base + recencyPenalty + areaPenalty + Math.random() * 0.12;
      }
    ) || candidates[0];
    const wasRecentId = recentSet.has(chosen._id);
    usedInSession.add(chosen._id);
    historyStore[bucket].push(chosen._id);
    if (historyStore[bucket].length > Math.max(10 * RECENT_ID_SESSIONS * 3, pool.length * 4, 70)) {
      historyStore[bucket] = historyStore[bucket].slice(-Math.max(10 * RECENT_ID_SESSIONS * 3, pool.length * 4, 70));
    }
    out.push(chosen);
    trackQuality(chosen._area, targetGrade, wasRecentId);
  }

  saveHistoryStore(historyStore);
  recordSessionQuality(quality, availableAreasCount);
  return out.slice(0, 10);
}

function startGame(lvl) {
  if (!isLevelAvailableForClass(lvl, selectedClass)) {
    const clsLabel = CLASS_LABELS[selectedClass] || `Classe ${selectedClass}ª`;
    alert(`Per ${clsLabel} scegli un livello compatibile.`);
    return;
  }
  level = lvl;
  qs = buildSessionQuestions(lvl);
  if (!qs.length) return;
  curQ = ok = ko = streak = bestStreak = 0;
  hist = [];
  baseScore = 0;
  finalScore = 0;
  bonusFactor = 1;
  bonusType = null;
  bonusApplied = false;
  creditsAwarded = false;
  const ms = MASCOTS[lvl];
  curMascot = ms[Math.floor(Math.random()*ms.length)];
  playStart();
  showScreen('scrGame');
  document.getElementById('scoreBar').style.display='flex';
  buildDots();
  updateBar();
  loadQ();
}

function generateOptions(answer, distractors) {
  // Use provided distractors (already vetted for the category)
  const opts = [answer, ...distractors.slice(0,3)];
  return shuffle(opts);
}

function buildDots() {
  const c = document.getElementById('progDots');
  c.textContent = '';
  const frag = document.createDocumentFragment();
  for(let i=0;i<10;i++){
    const d=document.createElement('div');
    d.className='dot'+(i===0?' cur':'');
    d.id='dot-'+i;
    frag.appendChild(d);
  }
  c.appendChild(frag);
}

function loadQ() {
  answered=false;
  const q=qs[curQ];
  const classLabel = CLASS_LABELS[selectedClass] || `Classe ${selectedClass}ª`;
  document.getElementById('mascot').textContent=curMascot;
  document.getElementById('qEmoji').textContent=q.e;
  document.getElementById('qLabel').textContent = `${classLabel} · Come si dice in inglese?`;
  const qTextEl = document.getElementById('qText');
  qTextEl.textContent=q.p;
  // aria-label repeats the question without the emoji for screen readers
  qTextEl.setAttribute('aria-label', q.p);

  // Re-trigger animations
  ['qEmoji','qText'].forEach(id=>{
    const el=document.getElementById(id);
    el.style.animation='none'; el.offsetHeight; el.style.animation='';
  });

  // Answer buttons
  const area=document.getElementById('ansArea');
  area.textContent = '';
  const frag = document.createDocumentFragment();
  const opts=generateOptions(q.a,q.d);
  opts.forEach(opt=>{
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='ans-btn';
    btn.textContent=opt;
    btn.setAttribute('aria-label', `Risposta: ${opt}`);
    btn.addEventListener('click', () => checkAns(opt, q.a, btn));
    frag.appendChild(btn);
  });
  area.appendChild(frag);

  updateDots();
}

function checkAns(chosen, correct, btn) {
  if(answered) return;
  answered=true;
  stopTimer();
  const isOk = chosen===correct;
  document.querySelectorAll('.ans-btn').forEach(b=>b.disabled=true);
  if(isOk){
    btn.classList.add('correct');
    ok++; streak++;
    if(streak>bestStreak) bestStreak=streak;
    streak>=3 ? playStreak() : playOk();
    showFb(true);
  } else {
    btn.classList.add('wrong');
    ko++; streak=0;
    document.querySelectorAll('.ans-btn').forEach(b=>{if(b.textContent===correct) b.classList.add('correct');});
    playKo();
    showFb(false);
  }
  hist.push(isOk);
  updateBar();
  setTimeout(nextQ, 1300);
}

function nextQ() {
  curQ++;
  if(curQ>=10) openBonusPick();
  else loadQ();
}

function updateDots() {
  for(let i=0;i<10;i++){
    const d=document.getElementById('dot-'+i);
    if(!d) continue;
    d.className='dot';
    if(i<curQ)       d.classList.add(hist[i]?'ok':'ko');
    else if(i===curQ) d.classList.add('cur');
  }
}

function updateBar() {
  document.getElementById('sOk').textContent=ok;
  document.getElementById('sKo').textContent=ko;
  document.getElementById('sStr').textContent=streak;
}

function showFb(isOk) {
  const el=document.getElementById('feedback');
  const pool=isOk?OK_MSGS:KO_MSGS;
  el.textContent=pool[Math.floor(Math.random()*pool.length)];
  el.className='feedback '+(isOk?'ok':'ko');
  el.classList.add('show');
  setTimeout(()=>el.className='feedback',900);
}

// ============================================================
// END GAME
// ============================================================
function openBonusPick() {
  stopTimer();
  document.getElementById('scoreBar').style.display='none';
  baseScore = ok;
  document.getElementById('baseScoreLabel').textContent = baseScore;
  showScreen('scrBonusPick');
}

function openBonusQuestion(type) {
  if (!type || !BONUS_Q[type]) return;
  bonusType = type;
  bonusFactor = BONUS_FACTORS[type];
  const q = BONUS_Q[type][Math.floor(Math.random() * BONUS_Q[type].length)];

  document.getElementById('bonusMeta').textContent = `Bonus ${BONUS_LABELS[type]} · x${bonusFactor}`;
  document.getElementById('bonusText').textContent = q.q;

  const area = document.getElementById('bonusAnsArea');
  area.textContent = '';
  const frag = document.createDocumentFragment();
  shuffle([q.a, ...q.d]).forEach(opt => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ans-btn';
    btn.textContent = opt;
    btn.setAttribute('aria-label', `Risposta bonus: ${opt}`);
    btn.addEventListener('click', () => checkBonusAns(opt, q.a, btn));
    frag.appendChild(btn);
  });
  area.appendChild(frag);

  showScreen('scrBonusQ');
}

function checkBonusAns(chosen, correctAnswer, btn) {
  const buttons = [...document.querySelectorAll('#bonusAnsArea .ans-btn')];
  if (!buttons.length || buttons[0].disabled) return;
  buttons.forEach(b => { b.disabled = true; });

  const okBonus = chosen === correctAnswer;
  if (okBonus) {
    btn.classList.add('correct');
    playPerfect();
    showFb(true);
    finishGame('bonus-ok');
  } else {
    btn.classList.add('wrong');
    buttons.forEach(b => { if (b.textContent === correctAnswer) b.classList.add('correct'); });
    playKo();
    showFb(false);
    finishGame('bonus-ko');
  }
}

function finishGame(mode) {
  stopTimer();
  document.getElementById('scoreBar').style.display='none';
  if (mode === 'skip') {
    bonusType = null;
    bonusFactor = 1;
    bonusApplied = false;
    baseScore = ok;
    finalScore = baseScore;
  } else if (mode === 'bonus-ok') {
    bonusApplied = true;
    baseScore = ok;
    finalScore = baseScore * bonusFactor;
  } else {
    bonusApplied = false;
    baseScore = ok;
    finalScore = baseScore;
  }
  const pct=ok/10;
  let emoji,title,msg,stars;
  if(pct===1)      {emoji='🏆';title='COMPLIMENTI!';msg='Risposte tutte corrette! Wow!';stars=3;playPerfect();}
  else if(pct>=.8) {emoji='🌟';title='WOW!';msg='Quasi tutte corrette. Continua così!';stars=3;}
  else if(pct>=.6) {emoji='😊';title='CONTINUA COSÌ!';msg='Stai migliorando a ogni partita!';stars=2;}
  else if(pct>=.4) {emoji='💪';title='BENE!';msg='Ancora pratica e vai alla grande!';stars=1;}
  else             {emoji='🌈';title='Try again!';msg='La prossima andrà meglio, promesso!';stars=1;}

  const economy = getEconomy();
  if (!creditsAwarded && economy) {
    const reward = economy.calcSessionCredits({
      correct: ok,
      bonusType,
      bonusApplied
    });
    if (reward.total > 0) {
      economy.addCredits(reward.total, {
        source: 'quiz-inglese',
        note: `classe ${selectedClass} · livello ${level}`
      });
      msg += ` Hai guadagnato ${reward.total} crediti.`;
    }
    creditsAwarded = true;
  }
  document.getElementById('rEmoji').textContent=emoji;
  document.getElementById('rTitle').textContent=title;
  document.getElementById('rMsg').textContent=msg;
  document.getElementById('rBase').textContent=baseScore;
  document.getElementById('rBonus').textContent=bonusApplied ? `x${bonusFactor}` : 'x1';
  document.getElementById('rFinal').textContent=finalScore;
  document.getElementById('rOk').textContent=ok;
  document.getElementById('rKo').textContent=ko;
  document.getElementById('rSt').textContent=bestStreak;
  const sr=document.getElementById('starsRow');
  sr.textContent = '';
  sr.setAttribute('aria-label', `Valutazione: ${stars} stelle su 3`);
  const frag = document.createDocumentFragment();
  for(let i=0;i<3;i++){
    const s=document.createElement('span');
    s.className='star-a';
    s.textContent=i<stars?'⭐':'☆';
    s.setAttribute('aria-hidden','true');
    frag.appendChild(s);
  }
  sr.appendChild(frag);
  saveLBEntry();
  showScreen('scrResult');
  if(pct>=.8 || bonusApplied) launchConfetti();
}

// ============================================================
// LEADERBOARD
// ============================================================
const LB_KEY='englishAdventure_lb_v2';
const LEVEL_NAMES={1:'🌊 Principiante',2:'🤿 Esploratore',3:'🦈 Campione'};

function saveLBEntry() {
  const bonusText = bonusType ? `${BONUS_LABELS[bonusType]} ${bonusApplied ? `x${bonusFactor}` : 'x1'}` : 'Nessuno';
  const e={
    score:finalScore,
    base:baseScore,
    bonus:bonusText,
    final:finalScore,
    total:10,
    cls: CLASS_LABELS[selectedClass] || `Classe ${selectedClass}ª`,
    level:LEVEL_NAMES[level],
    date:new Date().toLocaleDateString('it-IT')
  };
  let lb=loadLBData();
  lb.push(e);
  lb.sort((a,b)=>Number(b.final ?? b.score ?? 0)-Number(a.final ?? a.score ?? 0));
  lb=lb.slice(0,15);
  try { localStorage.setItem(LB_KEY, JSON.stringify(lb)); } catch (err) { debugWarn('saveLB', err); }
}
function loadLBData() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LB_KEY));
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, 50).map((entry) => ({
      score: safeInt(entry && entry.score, 0),
      base: safeInt(entry && entry.base, 0),
      bonus: safeText(entry && entry.bonus, 48),
      final: safeInt(entry && entry.final, 0),
      total: safeInt(entry && entry.total, 10),
      cls: safeText(entry && entry.cls, 24),
      level: safeText(entry && entry.level, 48),
      date: safeText(entry && entry.date, 20)
    }));
  } catch (e) {
    return [];
  }
}
function clearLB() {
  if(confirm('Cancellare tutta la classifica?')){
    try { localStorage.removeItem(LB_KEY); } catch (e) { debugWarn('clearLB', e); }
    renderLB();
  }
}
function showLB() {
  renderLB();
  document.getElementById('scoreBar').style.display='none';
  stopTimer();
  showScreen('scrLB');
}
function renderLB() {
  const lb = loadLBData();
  const cont = document.getElementById('lbContent');
  const medals = ['🥇', '🥈', '🥉'];

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
  const htr = document.createElement('tr');
  ['#', 'Punteggio', 'Bonus', 'Classe', 'Livello', 'Data'].forEach(label => {
    const th = document.createElement('th');
    th.scope = 'col';
    th.textContent = label;
    htr.appendChild(th);
  });
  thead.appendChild(htr);

  const tbody = document.createElement('tbody');
  lb.forEach((entry, i) => {
    const tr = document.createElement('tr');

    const posTd = document.createElement('td');
    if (i < 3) {
      const medal = document.createElement('span');
      medal.setAttribute('aria-hidden', 'true');
      medal.textContent = medals[i];
      const sr = document.createElement('span');
      sr.className = 'sr-only';
      sr.textContent = `${i + 1}°`;
      posTd.appendChild(medal);
      posTd.appendChild(sr);
    } else {
      posTd.textContent = String(i + 1);
    }
    tr.appendChild(posTd);

    const finalValue = Number(entry.final ?? entry.score ?? 0);
    const baseValue = Number(entry.base ?? entry.score ?? 0);
    const scoreTd = document.createElement('td');
    scoreTd.textContent = `${finalValue} (base ${baseValue})`;
    tr.appendChild(scoreTd);

    const bonusTd = document.createElement('td');
    bonusTd.textContent = String(entry.bonus ?? 'Nessuno');
    tr.appendChild(bonusTd);

    const classTd = document.createElement('td');
    classTd.textContent = String(entry.cls ?? '-');
    tr.appendChild(classTd);

    const levelTd = document.createElement('td');
    levelTd.textContent = String(entry.level ?? '');
    tr.appendChild(levelTd);

    const dateTd = document.createElement('td');
    dateTd.textContent = String(entry.date ?? '');
    tr.appendChild(dateTd);

    tbody.appendChild(tr);
  });

  table.appendChild(thead);
  table.appendChild(tbody);
  cont.appendChild(table);
}

// ============================================================
// CONFETTI
// ============================================================
function launchConfetti() {
  const cols=['#ffd166','#06d6a0','#118ab2','#ef476f','#48cae4','#f77f00'];
  for(let i=0;i<60;i++){
    setTimeout(()=>{
      const p=document.createElement('div'); p.className='cp';
      p.style.left=Math.random()*100+'vw';
      p.style.background=cols[Math.floor(Math.random()*cols.length)];
      p.style.width=(8+Math.random()*10)+'px'; p.style.height=(8+Math.random()*10)+'px';
      p.style.borderRadius=Math.random()>.5?'50%':'2px';
      p.style.animationDuration=(1.5+Math.random()*2)+'s';
      document.body.appendChild(p); setTimeout(()=>p.remove(),4000);
    },i*30);
  }
}

// ============================================================
// NAVIGATION
// ============================================================
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  const target = document.getElementById(id);
  if (!target) return;
  target.classList.add('active');
  const heading = target.querySelector('h1,h2');
  if (heading) { heading.setAttribute('tabindex','-1'); heading.focus(); }
  else {
    const first = target.querySelector('button,a,[tabindex]:not([tabindex="-1"])');
    if (first) first.focus();
  }
}

function goLevels() {
  stopTimer();
  document.getElementById('scoreBar').style.display='none';
  baseScore = 0;
  finalScore = 0;
  bonusFactor = 1;
  bonusType = null;
  bonusApplied = false;
  creditsAwarded = false;
  refreshLevelButtonsForClass();
  showScreen('scrLevel');
}

function replayGame() { startGame(level); }

function stopTimer() { clearInterval(timerIv); }

// ============================================================
// UTILS
// ============================================================
function shuffle(arr) {
  for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}
  return arr;
}
