// Auto-estratto da civica.html per CSP hardening (no inline script).
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
const LB_KEY = 'educazioneCivica_lb_v1';
const CURSOR_KEY = 'educazioneCivica_cursor_v1';
const HISTORY_KEY = 'educazioneCivica_history_v2';
const CLASS_PREF_KEY = 'educazioneCivica_class_pref_v1';
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

const AREA_LABELS = {
  mixed: '🎯 Sessione Mista',
  rules: '📜 Costituzione e Regole',
  env: '🌍 Ambiente',
  digital: '💻 Cittadinanza Digitale',
  road: '🚸 Strada e Gentilezza'
};
const CIVICA_SOURCE_AREA_MAP = {
  costituzione_regole_comunita: 'rules',
  ambiente_rispetto_terra: 'env',
  cittadinanza_digitale_online: 'digital',
  strada_gentilezza_sicurezza: 'road'
};

const FEEDBACK_OK = ['Esatto! 🎉','Ottimo! ⭐','Wow! 🌟','Giusto! ✅','Continua così! 🚀'];
const FEEDBACK_KO = ['Riprova! 💪','Quasi! ✨','Non mollare! 🌈'];

const BANK = {
  rules: [
    { q: 'Perché sono importanti le regole a scuola e a casa?', a: 'Per vivere bene insieme e rispettarsi', d: ['Per perdere tempo', 'Per fare confusione', 'Perché lo decide internet'] },
    { q: 'Chi è il Capo dello Stato in Italia?', a: 'Il Presidente della Repubblica', d: ['Il Sindaco del paese', 'Il Preside della scuola', 'Il Presidente della classe'] },
    { q: 'Quali sono i colori della bandiera italiana?', a: 'Verde, bianco e rosso', d: ['Blu, bianco e rosso', 'Verde, giallo e rosso', 'Rosso, nero e bianco'] },
    { q: 'Cosa significa “diritto”?', a: 'Una possibilità importante da rispettare per tutti', d: ['Una punizione', 'Un gioco di squadra', 'Una regola solo per adulti'] },
    { q: 'Cosa significa “dovere”?', a: 'Un impegno da rispettare verso gli altri', d: ['Una scelta sempre facoltativa', 'Una gara sportiva', 'Un premio a sorpresa'] },
    { q: 'Qual è un diritto fondamentale dei bambini?', a: 'Andare a scuola', d: ['Saltare sempre i compiti', 'Guidare l’auto', 'Comprare qualsiasi cosa'] },
    { q: 'Dove sono raccolte le regole più importanti dell’Italia?', a: 'Nella Costituzione', d: ['Nel diario scolastico', 'Nel menù della mensa', 'In un cartone animato'] },
    { q: 'Chi deve rispettare le regole comuni?', a: 'Tutte le persone', d: ['Solo i bambini', 'Solo gli insegnanti', 'Solo chi vuole'] },
    { q: 'Cosa significa rispettare il turno di parola?', a: 'Ascoltare e aspettare il proprio momento', d: ['Parlare sopra gli altri', 'Gridare più forte', 'Non ascoltare nessuno'] },
    { q: 'Perché è utile decidere regole di classe insieme?', a: 'Per collaborare meglio e stare bene tutti', d: ['Per litigare di più', 'Per non fare mai attività', 'Per scegliere solo per un gruppo'] }
  ],
  env: [
    { q: 'Dove si buttano le bottiglie di plastica?', a: 'Nel cassonetto della plastica', d: ['Nel vetro', 'Nell’indifferenziata sempre', 'Per strada'] },
    { q: 'Come possiamo evitare lo spreco di acqua?', a: 'Chiudendo il rubinetto quando ci laviamo i denti', d: ['Lasciandolo sempre aperto', 'Usando due rubinetti insieme', 'Aspettando che qualcuno lo chiuda'] },
    { q: 'Cosa significa riciclare un oggetto?', a: 'Dare una seconda vita ai materiali', d: ['Buttarlo subito', 'Nasconderlo', 'Colorarlo e basta'] },
    { q: 'Perché è importante non gettare rifiuti per strada?', a: 'Per rispettare ambiente e animali', d: ['Perché i rifiuti spariscono da soli', 'Per fare prima', 'Perché non ci sono cestini'] },
    { q: 'Cosa fai quando esci da una stanza illuminata?', a: 'Spengo la luce se non serve', d: ['Lascio tutto acceso', 'Accendo altre luci', 'Apro solo il frigorifero'] },
    { q: 'Quale scelta riduce la plastica monouso?', a: 'Usare una borraccia riutilizzabile', d: ['Comprare più bottigliette', 'Usare sempre bicchieri usa e getta', 'Buttare la borraccia'] },
    { q: 'Dove si conferiscono quaderni e fogli di carta?', a: 'Nel contenitore carta e cartone', d: ['Nel contenitore organico', 'Nel vetro', 'Nel contenitore della plastica'] },
    { q: 'Cos’è la raccolta differenziata?', a: 'Separare i rifiuti per materiale', d: ['Mescolare tutti i rifiuti', 'Lavare il cestino', 'Buttare solo la domenica'] },
    { q: 'In un parco naturale, quale comportamento è corretto?', a: 'Non lasciare rifiuti e rispettare gli animali', d: ['Dare da mangiare a caso a tutti gli animali', 'Strappare piante', 'Gridare vicino ai nidi'] },
    { q: 'Per un tragitto breve, quale scelta è più sostenibile?', a: 'Andare a piedi o in bicicletta', d: ['Prendere sempre l’auto', 'Accendere il motore in sosta', 'Usare due mezzi insieme senza motivo'] }
  ],
  digital: [
    { q: 'È giusto condividere le foto dei compagni senza permesso?', a: 'No, bisogna rispettare la privacy', d: ['Sì, sempre', 'Solo se la foto è divertente', 'Sì, se lo chiede un amico online'] },
    { q: 'Come ci si comporta online secondo la netiquette?', a: 'Con gentilezza e rispetto', d: ['Con offese e prese in giro', 'Scrivendo sempre in maiuscolo', 'Rispondendo in modo aggressivo'] },
    { q: 'Cosa devi fare se vedi qualcosa che ti spaventa su internet?', a: 'Dirlo subito a un adulto', d: ['Tenere tutto segreto', 'Condividerlo con tutti', 'Continuare a guardare'] },
    { q: "Cos'è importante fare con la password?", a: 'Tenerla segreta e difficile da indovinare', d: ['Scriverla ovunque', 'Dirla a chiunque', 'Usare sempre 1234'] },
    { q: 'Se ricevi richiesta di amicizia da uno sconosciuto?', a: 'Non accetto e avviso un adulto', d: ['Accetto subito', 'Invio foto personali', 'Do il mio indirizzo'] },
    { q: 'Prima di cliccare un link strano, cosa fai?', a: 'Chiedo a un adulto o insegnante', d: ['Clicco senza leggere', 'Lo inoltro a tutti', 'Disattivo il dispositivo'] },
    { q: 'Se ricevi un messaggio offensivo online?', a: 'Non rispondo e lo segnalo a un adulto', d: ['Rispondo con un insulto', 'Lo pubblico ovunque', 'Cancello tutto e non dico niente'] },
    { q: 'Cosa aiuta a usare bene il tempo davanti allo schermo?', a: 'Fare pause e alternare attività', d: ['Restare online senza fermarsi', 'Saltare il sonno', 'Usare dispositivi mentre si mangia sempre'] },
    { q: 'È corretto pubblicare nome, indirizzo e telefono online?', a: 'No, i dati personali vanno protetti', d: ['Sì, così tutti ti trovano', 'Solo nei commenti pubblici', 'Sì, se lo fanno gli altri'] },
    { q: 'Cosa significa “privacy”?', a: 'Proteggere le proprie informazioni personali', d: ['Nascondere i compiti', 'Avere sempre il telefono acceso', 'Usare solo emoji'] }
  ],
  road: [
    { q: 'Cosa significa il semaforo pedonale rosso?', a: 'Bisogna fermarsi e aspettare', d: ['Si attraversa correndo', 'Si può passare se non ci sono auto', 'Si attraversa in gruppo senza guardare'] },
    { q: 'Quali sono le tre parole magiche della gentilezza?', a: 'Grazie, per favore, scusa', d: ['Ciao, pronto, ok', 'Vai, corri, salta', 'Sì, no, forse'] },
    { q: 'Dove è più sicuro attraversare la strada?', a: 'Sulle strisce pedonali', d: ['In mezzo alla strada', 'Dietro un autobus fermo', 'Dove capita'] },
    { q: 'In bicicletta, quale protezione è importante?', a: 'Il casco', d: ['Gli occhiali da sole soltanto', 'Nessuna protezione', 'Solo uno zaino'] },
    { q: 'Prima di attraversare la strada cosa fai?', a: 'Guardo a sinistra, a destra e ancora a sinistra', d: ['Corro subito', 'Guardo solo il cellulare', 'Ascolto musica ad alto volume'] },
    { q: 'In auto, per i bambini qual è il comportamento corretto?', a: 'Usare seggiolino e cintura', d: ['Stare in piedi', 'Sedersi davanti senza cintura', 'Cambiare posto durante il viaggio'] },
    { q: 'Se senti un’ambulanza con sirena, cosa si deve fare?', a: 'Lasciare il passaggio ai mezzi di soccorso', d: ['Ignorarla', 'Andare più veloce', 'Fermarsi in mezzo alla strada'] },
    { q: 'Un compagno è in difficoltà: come ti comporti?', a: 'Lo aiuto con gentilezza', d: ['Lo prendo in giro', 'Faccio finta di niente', 'Lo allontano'] },
    { q: 'Su autobus o tram, con persone anziane o fragili?', a: 'Cedo il posto se serve', d: ['Resto seduto senza guardare', 'Spingo per passare', 'Metto lo zaino sul sedile libero'] },
    { q: 'Quando usi monopattino o bici vicino ai pedoni?', a: 'Rallento e rispetto le regole', d: ['Corro al massimo', 'Zigzago tra le persone', 'Uso il telefono mentre guido'] }
  ]
};

const BONUS_QUESTIONS = {
  easy: [
    { q: 'Bonus facile: quali sono i colori della bandiera italiana?', a: 'Verde, bianco e rosso', d: ['Blu, bianco e rosso', 'Verde, giallo e rosso', 'Rosso, nero e bianco'] },
    { q: 'Bonus facile: semaforo pedonale rosso?', a: 'Mi fermo e aspetto', d: ['Corro', 'Passo se ho fretta', 'Guardo il telefono e passo'] },
    { q: 'Bonus facile: dove butto una bottiglia di plastica?', a: 'Nel contenitore della plastica', d: ['Nel vetro', 'Nell’organico', 'Per strada'] }
  ],
  medium: [
    { q: 'Bonus medio: se online qualcuno ti chiede una foto privata?', a: 'Non la invio e avviso un adulto', d: ['La invio subito', 'La pubblico per tutti', 'La mando a uno sconosciuto'] },
    { q: 'Bonus medio: quale scelta evita spreco d’acqua?', a: 'Chiudo il rubinetto mentre mi lavo i denti', d: ['Lascio scorrere sempre', 'Apro due rubinetti', 'Uso più acqua possibile'] },
    { q: 'Bonus medio: cosa significa diritto allo studio?', a: 'Tutti i bambini possono andare a scuola', d: ['Solo alcuni bambini', 'Solo quando piove', 'Solo se lo decide un amico'] }
  ],
  hard: [
    { q: 'Bonus difficile: trovi un commento offensivo in chat di classe. Cosa fai?', a: 'Resto gentile, non rispondo male e avviso un adulto', d: ['Insulto di più', 'Condivido il messaggio ovunque', 'Fingo di essere un altro utente'] },
    { q: 'Bonus difficile: al parco vedi rifiuti vicino a un cestino pieno. Cosa fai?', a: 'Li raccolgo se posso in sicurezza o avviso un adulto', d: ['Li lascio lì', 'Li sposto in mezzo al prato', 'Li nascondo sotto una panchina'] },
    { q: 'Bonus difficile: in uscita da scuola gruppo attraversa sulle strisce con il semaforo pedonale rosso. Cosa scegli?', a: 'Aspetto il verde e attraverso con attenzione', d: ['Seguo il gruppo senza guardare', 'Attraverso correndo col telefono in mano', 'Passo in diagonale dove non ci sono strisce'] }
  ]
};

let selectedArea = 'mixed';
let selectedClass = '3';
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

function prefersReducedMotion() {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) {
    return false;
  }
}

function loadCursor() {
  try {
    const raw = JSON.parse(localStorage.getItem(CURSOR_KEY));
    return {
      mixed: safeInt(raw?.mixed ?? 0, 0),
      rules: safeInt(raw?.rules ?? 0, 0),
      env: safeInt(raw?.env ?? 0, 0),
      digital: safeInt(raw?.digital ?? 0, 0),
      road: safeInt(raw?.road ?? 0, 0)
    };
  } catch (e) {
    return { mixed: 0, rules: 0, env: 0, digital: 0, road: 0 };
  }
}

function saveCursor(c) {
  try { localStorage.setItem(CURSOR_KEY, JSON.stringify(c)); } catch (e) { debugWarn('runtime', e); }
}

async function hydrateCivicaBankFromJson() {
  if (!window.QuestionsLoader || typeof window.QuestionsLoader.getSubjectRows !== 'function') return;
  try {
    const rows = await window.QuestionsLoader.getSubjectRows('civica', { path: 'json/index.json' });
    if (!Array.isArray(rows) || !rows.length) return;

    const next = { rules: [], env: [], digital: [], road: [] };
    rows.forEach((row) => {
      const targetArea = CIVICA_SOURCE_AREA_MAP[String(row.area || '').trim().toLowerCase()];
      if (!targetArea || !Array.isArray(row.options) || row.options.length < 4) return;
      const answer = String(row.answer || '').trim();
      if (!answer) return;
      const distractors = row.options
        .map((opt) => String(opt || '').trim())
        .filter((opt) => opt && opt !== answer)
        .slice(0, 3);
      if (distractors.length < 3) return;
      next[targetArea].push({
        q: String(row.question || '').trim(),
        a: answer,
        d: distractors,
        g: Number(row.class) || null
      });
    });

    Object.keys(next).forEach((area) => {
      if (next[area].length) BANK[area] = next[area];
    });
  } catch (e) { debugWarn('runtime', e); }
}

document.addEventListener('DOMContentLoaded', async () => {
  selectedClass = loadClassPref();
  syncClassButtons();
  await hydrateCivicaBankFromJson();
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
        case 'select-area': selectArea(btn.dataset.area, btn); break;
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

function selectArea(area, btn) {
  if (!AREA_LABELS[area]) return;
  selectedArea = area;
  document.querySelectorAll('.area-btn').forEach(b => {
    b.classList.remove('selected');
    b.setAttribute('aria-pressed', 'false');
  });
  btn.classList.add('selected');
  btn.setAttribute('aria-pressed', 'true');
}

function spawnShapes() {
  const icons = ['🏛️','📜','🌍','♻️','💻','🤝','🚸','🇮🇹','💡'];
  const bg = $('bgShapes');
  if (!bg) return;
  if (prefersReducedMotion()) return;
  const frag = document.createDocumentFragment();
  for (let i = 0; i < 20; i++) {
    const d = document.createElement('div');
    d.className = 'shape';
    d.textContent = icons[Math.floor(Math.random() * icons.length)];
    d.style.left = Math.random() * 100 + 'vw';
    d.style.fontSize = (0.9 + Math.random() * 1.3) + 'rem';
    d.style.animationDuration = (10 + Math.random() * 14) + 's';
    d.style.animationDelay = (Math.random() * 20) + 's';
    frag.appendChild(d);
  }
  bg.appendChild(frag);
}

function buildSessionQuestions() {
  const cursor = loadCursor();
  const historyStore = loadHistory();
  const classPlan = buildGradePlan(TOTAL_Q, selectedClass);
  const clsNum = Number(normalizeClassKey(selectedClass)) || 3;
  const out = [];
  const usedInSession = new Set();
  const areasOrder = ['rules', 'env', 'digital', 'road'];

  const normalizedPools = {};
  areasOrder.forEach(area => {
    const source = BANK[area] || [];
    normalizedPools[area] = source.map((q, idx) => ({
      ...q,
      area,
      _id: `${area}:${idx}`,
      _grade: resolveQuestionGrade(q, idx, source.length)
    }));
  });

  const classPools = {};
  areasOrder.forEach((area) => {
    const pool = normalizedPools[area] || [];
    const strict = pool.filter((q) => Math.abs(Number(q._grade || clsNum) - clsNum) <= MAX_GRADE_DISTANCE);
    classPools[area] = strict.length
      ? strict
      : pool.slice().sort((a, b) => Math.abs(a._grade - clsNum) - Math.abs(b._grade - clsNum));
  });

  function pickOne(area, targetGrade) {
    const pool = classPools[area] || [];
    if (!pool.length) return null;
    const bucket = `${selectedClass}|${area}`;
    if (!Array.isArray(historyStore[bucket])) historyStore[bucket] = [];
    let seen = new Set(historyStore[bucket]);

    let candidates = pool.filter(q => !usedInSession.has(q._id) && !seen.has(q._id));
    if (!candidates.length) {
      historyStore[bucket] = [];
      seen = new Set();
      candidates = pool.filter(q => !usedInSession.has(q._id));
    }
    if (!candidates.length) candidates = pool.slice();

    candidates.sort((a, b) => {
      const sa = Math.abs(a._grade - targetGrade) + Math.abs(a._grade - clsNum) * 1.1 + Math.random() * 0.35;
      const sb = Math.abs(b._grade - targetGrade) + Math.abs(b._grade - clsNum) * 1.1 + Math.random() * 0.35;
      return sa - sb;
    });

    const chosen = candidates[0];
    usedInSession.add(chosen._id);
    historyStore[bucket].push(chosen._id);
    if (historyStore[bucket].length > Math.max(30, pool.length * 3)) {
      historyStore[bucket] = historyStore[bucket].slice(-Math.max(30, pool.length * 3));
    }
    return chosen;
  }

  if (selectedArea === 'mixed') {
    const start = cursor.mixed % areasOrder.length;
    for (let i = 0; i < TOTAL_Q; i++) {
      const area = areasOrder[(start + i) % areasOrder.length];
      const q = pickOne(area, classPlan[i % classPlan.length]);
      if (q) out.push({ ...q });
    }
    cursor.mixed = (cursor.mixed + 1) % areasOrder.length;
  } else {
    const areaPool = classPools[selectedArea] || [];
    if (!areaPool.length) return [];
    for (let i = 0; i < TOTAL_Q; i++) {
      const q = pickOne(selectedArea, classPlan[i % classPlan.length]);
      if (q) out.push({ ...q });
    }
    cursor[selectedArea] = (cursor[selectedArea] + 1) % Math.max(1, areaPool.length);
  }

  if (out.length < TOTAL_Q) {
    const fallback = [];
    areasOrder.forEach((area) => {
      (classPools[area] || []).forEach((q) => {
        if (!usedInSession.has(q._id)) fallback.push(q);
      });
    });
    fallback.sort((a, b) => {
      const da = Math.abs(a._grade - clsNum) + Math.random() * 0.25;
      const db = Math.abs(b._grade - clsNum) + Math.random() * 0.25;
      return da - db;
    });
    for (let i = 0; i < fallback.length && out.length < TOTAL_Q; i++) {
      const q = fallback[i];
      usedInSession.add(q._id);
      out.push({ ...q });
    }
    if (out.length < TOTAL_Q && fallback.length) {
      while (out.length < TOTAL_Q) {
        out.push({ ...fallback[out.length % fallback.length] });
      }
    }
  }

  saveCursor(cursor);
  saveHistory(historyStore);
  return out.slice(0, TOTAL_Q);
}

function startGame() {
  questions = buildSessionQuestions();
  if (!questions.length) return;
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
  const areaLabel = AREA_LABELS[q.area] || AREA_LABELS.mixed;
  const classLabel = CLASS_LABELS[selectedClass] || `Classe ${selectedClass}ª`;
  $('qMeta').textContent = `Domanda ${curQ + 1} di ${TOTAL_Q} · ${areaLabel} · ${classLabel}`;
  $('qText').textContent = q.q;

  const answers = $('answers');
  answers.textContent = '';
  const frag = document.createDocumentFragment();
  const options = shuffle([q.a, ...q.d.slice(0, 3)]);
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

function checkAnswer(chosen, correctAnswer, btn) {
  if (answered) return;
  answered = true;

  const isOk = chosen === correctAnswer;
  const buttons = [...document.querySelectorAll('#answers .answer-btn')];
  buttons.forEach(b => b.disabled = true);

  if (isOk) {
    btn.classList.add('correct');
    points += POINTS_PER_Q;
    correct++;
    playOk();
    showFeedback(true);
  } else {
    btn.classList.add('wrong');
    wrong++;
    buttons.forEach(b => { if (b.textContent === correctAnswer) b.classList.add('correct'); });
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
  if (!BONUS_QUESTIONS[type]) return;
  bonusType = type;
  bonusFactor = BONUS_FACTORS[type];
  const q = shuffle([...BONUS_QUESTIONS[type]])[0];

  $('bonusMeta').textContent = `Bonus ${BONUS_LABELS[type]} · Moltiplicatore x${bonusFactor}`;
  $('bonusText').textContent = q.q;

  const area = $('bonusAnswers');
  area.textContent = '';
  const frag = document.createDocumentFragment();
  shuffle([q.a, ...q.d.slice(0, 3)]).forEach(opt => {
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
  const buttons = [...document.querySelectorAll('#bonusAnswers .answer-btn')];
  if (!buttons.length || buttons[0].disabled) return;
  buttons.forEach(b => b.disabled = true);

  const ok = chosen === correctAnswer;
  if (ok) {
    btn.classList.add('correct');
    playPerfect();
    showFeedback(true, 'Bonus corretto!');
    finishGame('bonus-ok');
  } else {
    btn.classList.add('wrong');
    buttons.forEach(b => { if (b.textContent === correctAnswer) b.classList.add('correct'); });
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
  let msg = 'Hai fatto un ottimo lavoro civico.';

  if (finalScore >= 750) { emoji = '🏆'; title = 'Fantastico!'; msg = 'Conoscenza civica super: punteggio altissimo!'; }
  else if (finalScore >= 350) { emoji = '🌟'; title = 'Complimenti!'; msg = 'Ottimo risultato, continua così!'; }
  else if (finalScore >= 150) { emoji = '😊'; title = 'Benissimo!'; msg = 'Buona base di educazione civica.'; }

  if (!creditsAwarded && window.ScuolaEconomy) {
    const reward = window.ScuolaEconomy.calcSessionCredits({
      correct,
      bonusType,
      bonusApplied
    });
    if (reward.total > 0) {
      window.ScuolaEconomy.addCredits(reward.total, {
        source: 'quiz-civica',
        note: `${selectedArea} · classe ${selectedClass}`
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
  $('rCorrect').textContent = correct;
  $('rWrong').textContent = wrong;
  const areaText = selectedArea === 'mixed' ? 'Mista' : AREA_LABELS[selectedArea];
  $('rArea').textContent = `${areaText} · ${CLASS_LABELS[selectedClass] || `Classe ${selectedClass}ª`}`;

  saveScore();
  showScreen('screenResult');
  $('scoreBar').style.display = 'none';
}

function saveScore() {
  const entry = {
    area: AREA_LABELS[selectedArea],
    cls: CLASS_LABELS[selectedClass] || `Classe ${selectedClass}ª`,
    base: baseScore,
    bonus: bonusType ? `${BONUS_LABELS[bonusType]} ${bonusApplied ? `x${bonusFactor}` : 'x1'}` : 'Nessuno',
    final: finalScore,
    correct,
    wrong,
    date: new Date().toLocaleDateString('it-IT')
  };

  const lb = loadLB();
  lb.push(entry);
  lb.sort((a, b) => Number(b.final) - Number(a.final));
  const top = lb.slice(0, 15);
  try { localStorage.setItem(LB_KEY, JSON.stringify(top)); } catch (e) { debugWarn('runtime', e); }
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
  ['#', 'Finale', 'Base', 'Bonus', 'Classe', 'Ambito', 'Data'].forEach(label => {
    const th = document.createElement('th');
    th.scope = 'col';
    th.textContent = label;
    hr.appendChild(th);
  });
  thead.appendChild(hr);

  const tbody = document.createElement('tbody');
  lb.forEach((e, i) => {
    const tr = document.createElement('tr');
    [i + 1, e.final, e.base, e.bonus, e.cls || '-', e.area, e.date].forEach(v => {
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
