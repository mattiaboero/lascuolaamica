(function () {
  'use strict';

  const DEFAULT_INDEX_PATH = 'json/index.json';
  const dataPromiseByPath = new Map();
  const normalizeCache = new Map();
  const normalizedAreaMapCache = new WeakMap();
  const MAX_NORMALIZE_CACHE = 2500;

  function rememberNormalized(raw, normalized) {
    if (normalizeCache.size >= MAX_NORMALIZE_CACHE) {
      normalizeCache.clear();
    }
    normalizeCache.set(raw, normalized);
  }

  function normalizeKey(value) {
    const raw = String(value || '');
    if (normalizeCache.has(raw)) return normalizeCache.get(raw);

    const normalized = raw
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[àáâä]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/[^a-z0-9_\-]/g, '');
    rememberNormalized(raw, normalized);
    return normalized;
  }

  function toBool(value, fallback) {
    if (typeof value === 'boolean') return value;
    const v = String(value || '').trim().toLowerCase();
    if (v === 'true' || v === '1' || v === 'yes') return true;
    if (v === 'false' || v === '0' || v === 'no') return false;
    return fallback;
  }

  async function load(path) {
    const sourcePath = String(path || DEFAULT_INDEX_PATH).trim() || DEFAULT_INDEX_PATH;
    const existing = dataPromiseByPath.get(sourcePath);
    if (existing) {
      return existing;
    }

    const nextPromise = fetch(sourcePath)
      .then((res) => {
        if (!res.ok) throw new Error(`Impossibile caricare ${sourcePath}`);
        return res.json();
      })
      .catch((err) => {
        dataPromiseByPath.delete(sourcePath);
        throw err;
      });

    dataPromiseByPath.set(sourcePath, nextPromise);
    return nextPromise;
  }

  function isMonolithicSubjects(subjects) {
    if (!subjects || typeof subjects !== 'object') return false;
    return Object.values(subjects).some((value) => Array.isArray(value));
  }

  function resolveRelativePath(basePath, refPath) {
    const ref = String(refPath || '').trim();
    if (!ref) return '';
    if (/^[a-z]+:\/\//i.test(ref) || ref.startsWith('/')) return ref;

    const base = String(basePath || '').split('#')[0].split('?')[0];
    const slash = base.lastIndexOf('/');
    const baseDir = slash >= 0 ? base.slice(0, slash + 1) : '';
    return `${baseDir}${ref}`;
  }

  function extractRowsFromSubjectData(data) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.questions)) return data.questions;
    if (data && Array.isArray(data.rows)) return data.rows;
    return [];
  }

  function resolveSubjectKey(allSubjects, subject) {
    const wanted = normalizeKey(subject);
    if (!wanted) return '';

    if (allSubjects[wanted]) return wanted;

    const aliases = {
      'educazione_civica': 'civica',
      'civic_a': 'civica',
      'matematica_problemi': 'problemi',
      'problem': 'problemi',
      'english': 'inglese'
    };
    if (aliases[wanted] && allSubjects[aliases[wanted]]) return aliases[wanted];

    const direct = Object.keys(allSubjects).find((k) => normalizeKey(k) === wanted);
    return direct || '';
  }

  function getNormalizedAreaMap(areaMap) {
    if (!areaMap || typeof areaMap !== 'object') return null;
    const cached = normalizedAreaMapCache.get(areaMap);
    if (cached) return cached;

    const normalized = {};
    Object.entries(areaMap).forEach(([target, defs]) => {
      const set = new Set();
      if (Array.isArray(defs)) {
        defs.forEach((entry) => {
          const key = normalizeKey(entry);
          if (key) set.add(key);
        });
      } else if (typeof defs === 'string') {
        const key = normalizeKey(defs);
        if (key) set.add(key);
      }
      if (set.size) {
        normalized[String(target)] = set;
      }
    });

    normalizedAreaMapCache.set(areaMap, normalized);
    return normalized;
  }

  function mapArea(areaRaw, normalizedAreaMap) {
    const sourceArea = normalizeKey(areaRaw);
    if (!normalizedAreaMap || typeof normalizedAreaMap !== 'object') return sourceArea;

    for (const [target, defs] of Object.entries(normalizedAreaMap)) {
      if (defs.has(sourceArea)) return String(target);
    }
    return '';
  }

  function getRowAreaValue(row, areaField) {
    const field = normalizeKey(areaField || 'area');
    if (field === 'subarea' || field === 'sottoambito') {
      return row && row.subarea ? row.subarea : '';
    }
    return row && row.area ? row.area : '';
  }

  function rowToQuestion(row) {
    const options = Array.isArray(row.options)
      ? row.options.slice(0, 4).map((opt) => String(opt ?? '').trim())
      : [];
    const answer = String(row.answer ?? options[row.answerIndex] ?? '').trim();
    const distractors = [];
    for (let i = 0; i < options.length; i++) {
      const opt = options[i];
      if (!opt || opt === answer) continue;
      distractors.push(opt);
      if (distractors.length >= 3) break;
    }

    return {
      q: String(row.question || '').trim(),
      a: answer,
      d: distractors,
      grade: Number(row.class) || null,
      sourceId: String(row.id || '').trim(),
      sourceArea: String(row.area || '').trim(),
      subarea: row && row.subarea ? String(row.subarea).trim() : null,
      answerLang: row && row.answerLang ? String(row.answerLang).trim().toLowerCase() : null,
      language: row && row.language ? String(row.language).trim().toLowerCase() : null,
      difficulty: Number(row.difficulty) || null,
      explanation: String(row.explanation || '').trim(),
      // F6: id di assets/figure/<id>.svg; il core lo rivalida prima di usarlo.
      figure: row && row.figure ? String(row.figure).trim() : null,
      figureAlt: row && row.figureAlt ? String(row.figureAlt).trim() : ''
    };
  }

  // json/<materia>.json resta la fonte, ma il sito scarica i file scritti da
  // scripts/build_json_classi.py: json/<materia>/c<N>.json (domande attive
  // di una classe, senza bonus) e json/<materia>/bonus.json (tutte le bonus).
  // Matematica intera pesava ~2 MB: una partita ne usa al massimo tre classi.
  const ALL_CLASSES = [1, 2, 3, 4, 5];

  function splitPath(subjectPath, name) {
    return subjectPath.replace(/\.json$/, `/${name}.json`);
  }

  // opts.classes: le classi da scaricare (senza, tutte e cinque).
  // opts.bonusOnly: solo bonus.json.
  async function getSubjectRows(subject, opts) {
    const options = opts || {};
    const includeInactive = toBool(options.includeInactive, false);
    const bonusOnly = toBool(options.bonusOnly, false);
    const includeBonusRows = bonusOnly || toBool(options.includeBonusRows, false);
    const sourcePath = options.path || DEFAULT_INDEX_PATH;
    const classes = Array.isArray(options.classes) && options.classes.length ? options.classes : ALL_CLASSES;
    const names = bonusOnly ? [] : classes.map((c) => `c${Number(c)}`);
    if (includeBonusRows) names.push('bonus');
    // I file per classe hanno il nome della materia: si chiedono subito, in
    // parallelo a index.json, invece di aspettarlo (un giro di rete in meno,
    // ~300 ms con il 4G lento). Se l'indice dice un altro percorso, valgono
    // quelli dell'indice; un tentativo andato male non lascia tracce (load).
    const guessed = resolveRelativePath(sourcePath, `${normalizeKey(subject)}.json`);
    names.forEach((name) => { load(splitPath(guessed, name)).catch(() => {}); });
    const data = await load(sourcePath);

    let rows = [];
    const subjects = data && data.subjects ? data.subjects : {};
    const key = resolveSubjectKey(subjects, subject);
    if (!key) return [];

    if (isMonolithicSubjects(subjects)) {
      throw new Error('Formato monolitico non supportato: usa json/index.json con file separati per materia.');
    }

    const subjectRef = subjects[key];
    const relPath = typeof subjectRef === 'string'
      ? subjectRef
      : (subjectRef && typeof subjectRef.path === 'string' ? subjectRef.path : '');
    const subjectPath = resolveRelativePath(sourcePath, relPath);
    if (!subjectPath) return [];
    const parts = await Promise.all(names.map((name) => load(splitPath(subjectPath, name))));
    rows = parts.flatMap(extractRowsFromSubjectData);

    return rows.filter((row) => {
      if (!includeInactive && row.active === false) return false;
      if (!includeBonusRows && row.bonus === true) return false;
      return true;
    });
  }

  async function buildBanks(subject, opts) {
    const options = opts || {};
    const areaMap = options.areaMap || null;
    const normalizedAreaMap = getNormalizedAreaMap(areaMap);
    const areaField = options.areaField || 'area';
    const rows = await getSubjectRows(subject, options);
    const banks = {};

    rows.forEach((row) => {
      if (row && row.bonus === true) return;
      const sourceArea = getRowAreaValue(row, areaField);
      const areaKey = mapArea(sourceArea, normalizedAreaMap);
      if (!areaKey) return;
      if (!banks[areaKey]) banks[areaKey] = [];
      const q = rowToQuestion(row);
      if (!q.q || !q.a || q.d.length < 3) return;
      banks[areaKey].push(q);
    });

    return banks;
  }

  function humanizeAreaKey(key) {
    return String(key || '')
      .replace(/[_\-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, (m) => m.toUpperCase());
  }

  function buildAreasFromBanks(banks) {
    const out = [{
      key: 'mixed',
      label: 'Sessione mista',
      icon: '🎯',
      title: 'Sessione Mista',
      subtitle: 'Domande da tutti gli ambiti'
    }];

    Object.keys(banks).sort().forEach((key) => {
      out.push({
        key,
        label: humanizeAreaKey(key),
        icon: '📘',
        title: humanizeAreaKey(key),
        subtitle: 'Domande selezionate'
      });
    });

    return out;
  }

  // opts.classes: vedi getSubjectRows. Con le classi le banche contengono solo
  // quelle classi, quindi gli ambiti di cfg.areas non si filtrano qui: un
  // ambito vuoto in queste classi puo' avere domande in un'altra. Lo filtra il
  // motore classe per classe (getAvailableAreaKeysForClass).
  async function applySubjectConfig(cfg, opts) {
    if (!cfg || !cfg.questionsSource) return cfg;
    const classes = opts && Array.isArray(opts.classes) && opts.classes.length ? opts.classes : null;

    const source = typeof cfg.questionsSource === 'string'
      ? { subject: cfg.questionsSource }
      : cfg.questionsSource;

    const banks = await buildBanks(source.subject, {
      path: source.path || DEFAULT_INDEX_PATH,
      areaMap: source.areaMap || null,
      areaField: source.areaField || 'area',
      includeInactive: source.includeInactive,
      classes
    });

    if (classes) {
      cfg.banks = banks;
      return cfg;
    }

    const hasAny = Object.values(banks).some((arr) => Array.isArray(arr) && arr.length > 0);
    if (!hasAny) return cfg;

    cfg.banks = banks;

    if (toBool(source.dynamicAreas, false) || !Array.isArray(cfg.areas) || !cfg.areas.length) {
      cfg.areas = buildAreasFromBanks(banks);
    } else {
      cfg.areas = cfg.areas.filter((a) => a.key === 'mixed' || (banks[a.key] && banks[a.key].length));
      if (!cfg.areas.some((a) => a.key === 'mixed')) {
        cfg.areas.unshift({
          key: 'mixed',
          label: 'Sessione mista',
          icon: '🎯',
          title: 'Sessione Mista',
          subtitle: 'Domande da tutti gli ambiti'
        });
      }
    }

    return cfg;
  }

  const QuestionsLoaderApi = {
    load,
    getSubjectRows,
    buildBanks,
    applySubjectConfig
  };

  const SA = window.SA = window.SA || {};
  SA.questionsLoader = QuestionsLoaderApi;
})();
