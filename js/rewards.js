(function () {
  'use strict';

  const SA = window.SA = window.SA || {};
  const STORAGE_KEY = 'lascuolaamica_rewards_v1';
  const ASSET_BASE = 'assets/reward/';
  const SUBJECTS = ['matematica', 'inglese', 'problemi', 'civica', 'geografia', 'storia', 'scienze', 'italiano'];
  const CLASSES = ['2', '3', '4', '5'];
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

  const REWARDS = [
    ['primo-passo', 'Primo Passo', 'reward-primo-passo.png', 'Completa la prima partita.'],
    ['buon-inizio', 'Buon Inizio', 'reward-buon-inizio.png', 'Completa 5 partite.'],
    ['5-partite', '5 Partite', 'reward-5-partite.png', 'Raggiungi 5 partite completate.'],
    ['10-partite', '10 Partite', 'reward-10-partite.png', 'Raggiungi 10 partite completate.'],
    ['25-partite', '25 Partite', 'reward-25-partite.png', 'Raggiungi 25 partite completate.'],
    ['50-partite', '50 Partite', 'reward-50-partite.png', 'Raggiungi 50 partite completate.'],
    ['100-partite', '100 Partite', 'reward-100-partite.png', 'Raggiungi 100 partite completate.'],
    ['partita-completata', 'Partita Completata', 'reward-partita-completata.png', 'Termina una partita fino al riepilogo.'],
    ['tutte-corrette', 'Tutte Corrette', 'reward-tutte-corrette.png', 'Rispondi correttamente a tutte le domande.'],
    ['zero-errori', 'Zero Errori', 'reward-zero-errori.png', 'Chiudi una partita senza errori.'],
    ['super-precisione', 'Super Precisione', 'reward-super-precisione.png', 'Ottieni almeno 8 risposte corrette su 10.'],
    ['attenzione-oro', 'Attenzione d\'Oro', 'reward-attenzione-oro.png', 'Ottieni almeno 9 risposte corrette.'],
    ['mano-sicura', 'Mano Sicura', 'reward-mano-sicura.png', 'Ottieni almeno 7 risposte corrette.'],
    ['non-mi-arrendo', 'Non Mi Arrendo', 'reward-non-mi-arrendo.png', 'Completa una partita anche quando è difficile.'],
    ['rimonta', 'Rimonta', 'reward-rimonta.png', 'Migliora il tuo miglior punteggio precedente.'],
    ['grande-miglioramento', 'Grande Miglioramento', 'reward-grande-miglioramento.png', 'Supera il tuo miglior punteggio precedente di almeno 50 punti.'],
    ['bonus-coraggioso', 'Bonus Coraggioso', 'reward-bonus-coraggioso.png', 'Prova una domanda bonus.'],
    ['bonus-stellare', 'Bonus Stellare', 'reward-bonus-stellare.png', 'Rispondi correttamente a una domanda bonus.'],
    ['velocita-serena', 'Velocità Serena', 'reward-velocita-serena.png', 'Completa una partita con buon ritmo e almeno 8 corrette.'],
    ['costanza-gentile', 'Costanza Gentile', 'reward-costanza-gentile.png', 'Gioca in tre giorni diversi sullo stesso dispositivo.'],
    ['cuore-gentile', 'Cuore Gentile', 'reward-cuore-gentile.png', 'Completa una partita di educazione civica.'],
    ['esploratore-curioso', 'Esploratore Curioso', 'reward-esploratore-curioso.png', 'Gioca almeno quattro materie diverse.'],
    ['mente-allenata', 'Mente Allenata', 'reward-mente-allenata.png', 'Raggiungi almeno 500 punti finali in una partita.'],
    ['coppa-arcobaleno', 'Coppa Arcobaleno', 'reward-coppa-arcobaleno.png', 'Gioca almeno una partita in ogni materia.'],
    ['trofeo-leggendario', 'Trofeo Leggendario', 'reward-trofeo-leggendario.png', 'Raggiungi almeno 750 punti finali in una partita.'],
    ['corona-conoscenza', 'Corona della Conoscenza', 'reward-corona-conoscenza.png', 'Completa tutte le materie almeno una volta.'],
    ['super-studente', 'Super Studente', 'reward-super-studente.png', 'Completa 50 partite e gioca tutte le materie.'],
    ['classe-seconda', 'Classe Seconda', 'reward-classe-seconda.png', 'Completa attività di classe seconda in tutte le materie.'],
    ['classe-terza', 'Classe Terza', 'reward-classe-terza.png', 'Completa attività di classe terza in tutte le materie.'],
    ['classe-quarta', 'Classe Quarta', 'reward-classe-quarta.png', 'Completa attività di classe quarta in tutte le materie.'],
    ['classe-quinta', 'Classe Quinta', 'reward-classe-quinta.png', 'Completa attività di classe quinta in tutte le materie.'],
    ['materia-matematica', 'Maestro di Matematica', 'reward-materia-matematica.png', 'Completa tutte le classi di matematica.'],
    ['materia-inglese', 'Maestro di Inglese', 'reward-materia-inglese.png', 'Completa tutte le classi di inglese.'],
    ['materia-problemi', 'Maestro dei Problemi', 'reward-materia-problemi.png', 'Completa tutte le classi di problemi.'],
    ['materia-civica', 'Maestro di Civica', 'reward-materia-civica.png', 'Completa tutte le classi di educazione civica.'],
    ['materia-geografia', 'Maestro di Geografia', 'reward-materia-geografia.png', 'Completa tutte le classi di geografia.'],
    ['materia-storia', 'Maestro di Storia', 'reward-materia-storia.png', 'Completa tutte le classi di storia.'],
    ['materia-scienze', 'Maestro di Scienze', 'reward-materia-scienze.png', 'Completa tutte le classi di scienze.'],
    ['materia-italiano', 'Maestro di Italiano', 'reward-materia-italiano.png', 'Completa tutte le classi di italiano.'],
    ['tutti-ambiti', 'Tutti gli Ambiti', 'reward-tutti-ambiti.png', 'Gioca tanti ambiti diversi nelle materie.'],
    ['giro-completo', 'Giro Completo', 'reward-giro-completo.png', 'Fai almeno una partita in ciascuna materia.'],
    ['tutto-completato', 'Tutto Completato', 'reward-tutto-completato.png', 'Completa tutte le classi di tutte le materie.'],
    ['breakout-primo-mattone', 'Primo Mattone', 'reward-breakout-primo-mattone.png', 'Completa la tua prima partita a Cervellino Spacca‑Muri.'],
    ['breakout-muro-abbattuto', 'Muro Abbattuto', 'reward-breakout-muro-abbattuto.png', 'Distruggi un intero muro di mattoni.'],
    ['breakout-demolitore-100', 'Demolitore', 'reward-breakout-demolitore-100.png', 'Distruggi 100 mattoni in totale a Cervellino Spacca‑Muri.'],
    ['breakout-demolitore-500', 'Gran Demolitore', 'reward-breakout-demolitore-500.png', 'Distruggi 500 mattoni in totale a Cervellino Spacca‑Muri.'],
    ['breakout-cecchino-terracotta', 'Cecchino di Precisione', 'reward-breakout-cecchino-terracotta.png', 'Distruggi un\'intera fila di mattoni rossi, quelli in cima al muro.'],
    ['breakout-salvataggio-extremis', 'Salvataggio in Extremis', 'reward-breakout-salvataggio-extremis.png', 'Salva la pallina rispondendo bene a una domanda.'],
    ['breakout-poker-bonus', 'Poker di Bonus', 'reward-breakout-poker-bonus.png', 'Attiva tutti e 4 i tipi di bonus di Cervellino Spacca‑Muri.'],
    ['breakout-barra-acciaio', 'Barra d\'Acciaio', 'reward-breakout-barra-acciaio.png', 'Completa un muro senza perdere vite.'],
    ['breakout-punteggio-oro', 'Punteggio d\'Oro', 'reward-breakout-punteggio-oro.png', 'Raggiungi 300 punti in una partita a Cervellino Spacca‑Muri.'],
    ['breakout-campione', 'Campione di Cervellino Spacca‑Muri', 'reward-breakout-campione.png', 'Raggiungi 1000 punti in una partita a Cervellino Spacca‑Muri.'],
    ['bacheca-piena', 'Bacheca Piena', 'reward-bacheca-piena.png', 'Sblocca tutti gli altri premi.']
  ].map((row) => ({ id: row[0], name: row[1], file: row[2], description: row[3] }));

  const rewardById = new Map(REWARDS.map((reward) => [reward.id, reward]));

  function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function safeInt(value, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback || 0;
    return Math.max(0, Math.floor(n));
  }

  function normalizeSubject(value) {
    const key = String(value || '').toLowerCase().replace(/[^a-z]/g, '');
    if (key === 'educazionecivica') return 'civica';
    return SUBJECTS.includes(key) ? key : 'generale';
  }

  function normalizeClass(value) {
    const key = String(value || '').replace(/[^0-9]/g, '');
    return CLASSES.includes(key) ? key : '';
  }

  function uniq(list) {
    return Array.from(new Set((Array.isArray(list) ? list : []).filter(Boolean)));
  }

  function createDefaultState() {
    return {
      version: 1,
      unlocked: {},
      games: 0,
      bestFinal: 0,
      bestCorrect: 0,
      subjects: {},
      classes: {},
      areas: {},
      days: {},
      breakout: {},
      lastUpdated: ''
    };
  }

  function loadState() {
    try {
      const parsed = JSON.parse(storageGet(STORAGE_KEY));
      if (!parsed || typeof parsed !== 'object') return createDefaultState();
      return Object.assign(createDefaultState(), parsed, {
        unlocked: parsed.unlocked && typeof parsed.unlocked === 'object' ? parsed.unlocked : {},
        subjects: parsed.subjects && typeof parsed.subjects === 'object' ? parsed.subjects : {},
        classes: parsed.classes && typeof parsed.classes === 'object' ? parsed.classes : {},
        areas: parsed.areas && typeof parsed.areas === 'object' ? parsed.areas : {},
        days: parsed.days && typeof parsed.days === 'object' ? parsed.days : {},
        breakout: parsed.breakout && typeof parsed.breakout === 'object' ? parsed.breakout : {}
      });
    } catch (e) {
      debugWarn('loadState', e);
      return createDefaultState();
    }
  }

  // Sotto-stato dedicato a Cervellino Spacca‑Muri, dentro lo stesso blob STORAGE_KEY: i suoi
  // premi vivono nella stessa bacheca ma non toccano i contatori delle materie
  // (partite totali, materie giocate, ecc.) che restano per i quiz.
  function breakoutState(state) {
    if (!state.breakout || typeof state.breakout !== 'object') state.breakout = {};
    const b = state.breakout;
    if (typeof b.games !== 'number') b.games = 0;
    if (typeof b.bricksTotal !== 'number') b.bricksTotal = 0;
    if (typeof b.wallsCleared !== 'number') b.wallsCleared = 0;
    if (typeof b.wallsClearedNoLifeLost !== 'number') b.wallsClearedNoLifeLost = 0;
    if (typeof b.ballSaves !== 'number') b.ballSaves = 0;
    if (typeof b.bestFinal !== 'number') b.bestFinal = 0;
    if (!b.bonusTypesUsed || typeof b.bonusTypesUsed !== 'object') b.bonusTypesUsed = {};
    if (typeof b.terracottaRowCleared !== 'boolean') b.terracottaRowCleared = false;
    return b;
  }

  function saveState(state) {
    try {
      state.lastUpdated = new Date().toISOString();
      storageSet(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      debugWarn('saveState', e);
    }
  }

  function unlock(state, id, unlockedNow) {
    if (!rewardById.has(id) || state.unlocked[id]) return;
    state.unlocked[id] = new Date().toISOString();
    unlockedNow.push(id);
  }

  function subjectState(state, subject) {
    if (!state.subjects[subject]) {
      state.subjects[subject] = { games: 0, classes: {}, areas: {}, bestFinal: 0, bestCorrect: 0 };
    }
    return state.subjects[subject];
  }

  function countKeys(obj) {
    return Object.keys(obj || {}).length;
  }

  function hasAllSubjects(state) {
    return SUBJECTS.every((subject) => state.subjects[subject] && state.subjects[subject].games > 0);
  }

  function hasClassEverywhere(state, cls) {
    return SUBJECTS.every((subject) => state.subjects[subject] && state.subjects[subject].classes && state.subjects[subject].classes[cls]);
  }

  // La regola "sbloccata la bacheca quando tutto il resto e' sbloccato" era
  // copiata in recordGame() e recordBreakout(): cambiando l'elenco delle
  // esclusioni bisognava ricordarsi di entrambi i punti.
  function maybeUnlockBachecaPiena(state, unlockedNow) {
    const others = REWARDS.filter((reward) => reward.id !== 'bacheca-piena');
    if (others.every((reward) => state.unlocked[reward.id])) {
      unlock(state, 'bacheca-piena', unlockedNow);
    }
  }

  function hasSubjectAllClasses(state, subject) {
    const row = state.subjects[subject];
    return !!row && CLASSES.every((cls) => row.classes && row.classes[cls]);
  }

  function recordGame(input) {
    const event = input || {};
    const state = loadState();
    const unlockedNow = [];
    const subject = normalizeSubject(event.subject);
    const cls = normalizeClass(event.classKey || event.cls || event.className);
    const correct = safeInt(event.correct, 0);
    const wrong = safeInt(event.wrong, 0);
    const total = Math.max(1, safeInt(event.total, 10));
    const finalScore = safeInt(event.finalScore ?? event.final, 0);
    const bonusAttempted = !!event.bonusAttempted;
    const bonusApplied = !!event.bonusApplied;
    const durationMs = safeInt(event.durationMs, 0);
    const areas = uniq(event.areas || event.sessionAreas || [event.areaKey || event.area]);
    const day = todayKey();
    const previousBest = safeInt(state.bestFinal, 0);

    state.games += 1;
    state.bestFinal = Math.max(previousBest, finalScore);
    state.bestCorrect = Math.max(safeInt(state.bestCorrect, 0), correct);
    state.days[day] = true;

    if (cls) state.classes[cls] = true;

    if (subject !== 'generale') {
      const row = subjectState(state, subject);
      row.games += 1;
      row.bestFinal = Math.max(safeInt(row.bestFinal, 0), finalScore);
      row.bestCorrect = Math.max(safeInt(row.bestCorrect, 0), correct);
      if (cls) row.classes[cls] = true;
      areas.forEach((area) => {
        const areaKey = String(area || '').replace(/[^a-z0-9_-]/gi, '').slice(0, 36);
        if (areaKey && areaKey !== 'mixed') {
          row.areas[areaKey] = true;
          state.areas[`${subject}:${areaKey}`] = true;
        }
      });
    }

    unlock(state, 'primo-passo', unlockedNow);
    unlock(state, 'partita-completata', unlockedNow);
    if (state.games >= 5) unlock(state, 'buon-inizio', unlockedNow);
    [5, 10, 25, 50, 100].forEach((n) => {
      if (state.games >= n) unlock(state, `${n}-partite`, unlockedNow);
    });

    if (correct >= total) {
      unlock(state, 'tutte-corrette', unlockedNow);
      unlock(state, 'zero-errori', unlockedNow);
    }
    if (wrong === 0 && correct > 0) unlock(state, 'zero-errori', unlockedNow);
    if (correct >= 7) unlock(state, 'mano-sicura', unlockedNow);
    if (correct >= 8) unlock(state, 'super-precisione', unlockedNow);
    if (correct >= 9) unlock(state, 'attenzione-oro', unlockedNow);
    if (correct <= Math.floor(total * 0.45)) unlock(state, 'non-mi-arrendo', unlockedNow);
    if (finalScore >= 500) unlock(state, 'mente-allenata', unlockedNow);
    if (finalScore >= 750) unlock(state, 'trofeo-leggendario', unlockedNow);
    if (previousBest > 0 && finalScore > previousBest) unlock(state, 'rimonta', unlockedNow);
    if (previousBest > 0 && finalScore >= previousBest + 50) unlock(state, 'grande-miglioramento', unlockedNow);
    if (bonusAttempted) unlock(state, 'bonus-coraggioso', unlockedNow);
    if (bonusApplied) unlock(state, 'bonus-stellare', unlockedNow);
    if (durationMs > 0 && durationMs <= 8 * 60 * 1000 && correct >= 8) unlock(state, 'velocita-serena', unlockedNow);
    if (countKeys(state.days) >= 3) unlock(state, 'costanza-gentile', unlockedNow);
    if (subject === 'civica') unlock(state, 'cuore-gentile', unlockedNow);
    if (countKeys(state.subjects) >= 4) unlock(state, 'esploratore-curioso', unlockedNow);
    if (hasAllSubjects(state)) {
      unlock(state, 'coppa-arcobaleno', unlockedNow);
      unlock(state, 'corona-conoscenza', unlockedNow);
      unlock(state, 'giro-completo', unlockedNow);
    }
    if (state.games >= 50 && hasAllSubjects(state)) unlock(state, 'super-studente', unlockedNow);
    if (countKeys(state.areas) >= 24) unlock(state, 'tutti-ambiti', unlockedNow);

    CLASSES.forEach((classKey) => {
      if (hasClassEverywhere(state, classKey)) unlock(state, `classe-${classKeyToName(classKey)}`, unlockedNow);
    });
    SUBJECTS.forEach((subjectKey) => {
      if (hasSubjectAllClasses(state, subjectKey)) unlock(state, `materia-${subjectKey}`, unlockedNow);
    });
    if (SUBJECTS.every((subjectKey) => hasSubjectAllClasses(state, subjectKey))) {
      unlock(state, 'tutto-completato', unlockedNow);
    }
    maybeUnlockBachecaPiena(state, unlockedNow);

    saveState(state);
    if (unlockedNow.length) showRewardToast(unlockedNow[0], unlockedNow.length);
    document.dispatchEvent(new CustomEvent('sa:rewards-updated', { detail: { unlocked: unlockedNow, state } }));
    return { unlocked: unlockedNow, state };
  }

  const BONUS_TYPES = ['wide', 'sticky', 'extraLife', 'destroyColor'];

  // Trofei dedicati al gioco Cervellino Spacca‑Muri: stessa bacheca (STORAGE_KEY) dei quiz materia,
  // ma sotto-stato e sblocchi separati (vedi breakoutState) per non alterare i
  // contatori delle materie.
  function recordBreakout(input) {
    const event = input || {};
    const state = loadState();
    const b = breakoutState(state);
    const unlockedNow = [];

    const bricksDestroyed = safeInt(event.bricksDestroyed, 0);
    const wallsCleared = safeInt(event.wallsCleared, 0);
    const wallsClearedNoLifeLost = safeInt(event.wallsClearedNoLifeLost, 0);
    const ballSaves = safeInt(event.ballSaves, 0);
    const finalScore = safeInt(event.score, 0);
    const bonusTypesUsed = Array.isArray(event.bonusTypesUsed) ? event.bonusTypesUsed : [];
    const isFinal = !!event.final;

    // breakout.js chiama questa funzione piu' volte per partita (muro abbattuto,
    // salvataggio, bonus, fine partita): ogni volta invia solo la differenza rispetto
    // all'ultimo invio, quindi sommare qui e' corretto e non conta niente due volte.
    // "games" pero' deve crescere di 1 per partita, non a ogni chiamata: solo isFinal lo tocca.
    if (isFinal) b.games += 1;
    b.bricksTotal += bricksDestroyed;
    b.wallsCleared += wallsCleared;
    b.wallsClearedNoLifeLost += wallsClearedNoLifeLost;
    b.ballSaves += ballSaves;
    b.bestFinal = Math.max(b.bestFinal, finalScore);
    if (event.terracottaRowCleared) b.terracottaRowCleared = true;
    bonusTypesUsed.forEach((type) => {
      if (BONUS_TYPES.includes(type)) b.bonusTypesUsed[type] = true;
    });

    // "Completa la tua prima partita": si sblocca solo a partita conclusa (final),
    // non al primo salvataggio intermedio in corso di partita.
    if (isFinal) unlock(state, 'breakout-primo-mattone', unlockedNow);
    if (b.wallsCleared >= 1) unlock(state, 'breakout-muro-abbattuto', unlockedNow);
    if (b.bricksTotal >= 100) unlock(state, 'breakout-demolitore-100', unlockedNow);
    if (b.bricksTotal >= 500) unlock(state, 'breakout-demolitore-500', unlockedNow);
    if (b.terracottaRowCleared) unlock(state, 'breakout-cecchino-terracotta', unlockedNow);
    if (b.ballSaves >= 1) unlock(state, 'breakout-salvataggio-extremis', unlockedNow);
    if (BONUS_TYPES.every((type) => b.bonusTypesUsed[type])) unlock(state, 'breakout-poker-bonus', unlockedNow);
    if (b.wallsClearedNoLifeLost >= 1) unlock(state, 'breakout-barra-acciaio', unlockedNow);
    if (finalScore >= 300) unlock(state, 'breakout-punteggio-oro', unlockedNow);
    if (finalScore >= 1000) unlock(state, 'breakout-campione', unlockedNow);
    maybeUnlockBachecaPiena(state, unlockedNow);

    saveState(state);
    if (unlockedNow.length) showRewardToast(unlockedNow[0], unlockedNow.length);
    document.dispatchEvent(new CustomEvent('sa:rewards-updated', { detail: { unlocked: unlockedNow, state } }));
    return { unlocked: unlockedNow, state };
  }

  function classKeyToName(cls) {
    return { 2: 'seconda', 3: 'terza', 4: 'quarta', 5: 'quinta' }[String(cls)] || '';
  }

  function getImageSrc(id, locked) {
    if (locked) return ASSET_BASE + 'bacheca-premio-bloccato.png';
    const reward = rewardById.get(id);
    return ASSET_BASE + (reward ? reward.file : 'bacheca-slot-vuoto.png');
  }

  function getProgress() {
    const state = loadState();
    const unlockedCount = REWARDS.filter((reward) => state.unlocked[reward.id]).length;
    return { state, rewards: REWARDS.slice(), unlockedCount, total: REWARDS.length };
  }

  function renderBoard(root) {
    if (!root) return;
    const { state, rewards, unlockedCount, total } = getProgress();
    const frag = document.createDocumentFragment();
    rewards.forEach((reward) => {
      const unlocked = !!state.unlocked[reward.id];
      const card = document.createElement('article');
      card.className = `reward-card${unlocked ? '' : ' is-locked'}`;
      card.tabIndex = 0;
      card.setAttribute('aria-label', `${reward.name}. ${unlocked ? 'Sbloccato' : 'Bloccato'}. ${reward.description}`);

      const imgWrap = document.createElement('div');
      imgWrap.className = 'reward-img-wrap';
      const img = document.createElement('img');
      img.className = 'reward-img';
      img.src = getImageSrc(reward.id, !unlocked);
      img.alt = '';
      img.setAttribute('aria-hidden', 'true');
      img.width = 512;
      img.height = 512;
      img.loading = 'lazy';
      img.decoding = 'async';
      imgWrap.appendChild(img);

      const name = document.createElement('h2');
      name.className = 'reward-name';
      name.textContent = reward.name;
      const desc = document.createElement('p');
      desc.className = 'reward-desc';
      desc.textContent = reward.description;
      const status = document.createElement('span');
      status.className = 'reward-status';
      status.textContent = unlocked ? 'Sbloccato' : 'Da sbloccare';

      card.append(imgWrap, name, desc, status);
      frag.appendChild(card);
    });
    root.textContent = '';
    root.appendChild(frag);

    const countEl = document.querySelector('[data-reward-count]');
    if (countEl) countEl.textContent = String(unlockedCount);
    const totalEl = document.querySelector('[data-reward-total]');
    if (totalEl) totalEl.textContent = String(total);
    const gamesEl = document.querySelector('[data-reward-games]');
    if (gamesEl) gamesEl.textContent = String(safeInt(state.games, 0));
  }

  function showRewardToast(id, extraCount) {
    const reward = rewardById.get(id);
    if (!reward || document.hidden) return;
    let toast = document.querySelector('[data-reward-toast]');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'reward-toast';
      toast.setAttribute('data-reward-toast', '1');
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }
    toast.textContent = '';
    const img = document.createElement('img');
    img.src = ASSET_BASE + reward.file;
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    img.width = 72;
    img.height = 72;
    img.loading = 'lazy';
    img.decoding = 'async';
    const text = document.createElement('div');
    const strong = document.createElement('strong');
    strong.textContent = `Nuovo premio: ${reward.name}`;
    const span = document.createElement('span');
    span.textContent = extraCount > 1 ? `Hai sbloccato ${extraCount} premi. Li trovi nella bacheca.` : reward.description;
    text.append(strong, span);
    toast.append(img, text);
    toast.classList.add('is-visible');
    window.setTimeout(() => toast.classList.remove('is-visible'), 5200);
  }

  function injectRewardsLink() {
    if (document.querySelector('[data-rewards-link]')) return;
    const link = document.createElement('a');
    const host = window.location && window.location.hostname ? window.location.hostname : '';
    link.href = host === 'localhost' || host === '127.0.0.1' ? '/premi.html' : '/premi';
    link.className = 'reward-link-pill';
    link.setAttribute('data-rewards-link', '1');
    link.textContent = 'Premi';

    const badgeRow = document.querySelector('.badge-row');
    if (badgeRow) {
      badgeRow.appendChild(link);
      return;
    }

    const navIcons = document.querySelector('.nav-icons');
    if (navIcons) {
      navIcons.appendChild(link);
    }
  }

  async function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  function roundRect(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  async function exportBoard(type) {
    const mime = type === 'jpeg' ? 'image/jpeg' : 'image/png';
    const ext = type === 'jpeg' ? 'jpg' : 'png';
    const { state, rewards } = getProgress();
    const cols = 8;
    const rows = Math.ceil(rewards.length / cols);
    const cell = 162;
    const startX = 152;
    const startY = 220;
    const gapX = 12;
    const gapY = 12;
    const bottomPad = 96;
    const exportHeight = Math.max(1000, startY + rows * cell + Math.max(0, rows - 1) * gapY + bottomPad);
    const canvas = document.createElement('canvas');
    canvas.width = 1600;
    canvas.height = exportHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#fff3d6');
    grad.addColorStop(.5, '#fff8e9');
    grad.addColorStop(1, '#f9edcf');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(255, 209, 102, .18)';
    ctx.beginPath();
    ctx.arc(210, 140, 220, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(85, 239, 196, .12)';
    ctx.beginPath();
    ctx.arc(1410, 160, 240, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,.78)';
    roundRect(ctx, 70, 56, 1460, 120, 44);
    ctx.fill();
    ctx.fillStyle = '#20344d';
    ctx.font = '700 58px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('La mia bacheca premi', 800, 122);
    ctx.font = '700 26px sans-serif';
    ctx.fillStyle = '#496074';
    const unlockedCount = rewards.filter((reward) => state.unlocked[reward.id]).length;
    ctx.fillText(`${unlockedCount} premi sbloccati su ${rewards.length} · La Scuola Amica`, 800, 158);

    const images = await Promise.all(rewards.map((reward) => {
      const unlocked = !!state.unlocked[reward.id];
      return loadImage(getImageSrc(reward.id, !unlocked)).catch(() => null);
    }));

    rewards.forEach((reward, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = startX + col * (cell + gapX);
      const y = startY + row * (cell + gapY);
      const unlocked = !!state.unlocked[reward.id];
      ctx.fillStyle = unlocked ? 'rgba(255,255,255,.9)' : 'rgba(239,244,249,.9)';
      roundRect(ctx, x, y, cell, cell, 28);
      ctx.fill();
      ctx.strokeStyle = unlocked ? 'rgba(40,120,216,.22)' : 'rgba(104,117,134,.18)';
      ctx.lineWidth = 4;
      ctx.stroke();
      const img = images[index];
      if (img) ctx.drawImage(img, x + 24, y + 14, cell - 48, cell - 48);
      ctx.fillStyle = unlocked ? '#20344d' : '#687586';
      ctx.font = '700 15px sans-serif';
      ctx.textAlign = 'center';
      wrapCanvasText(ctx, reward.name, x + cell / 2, y + cell - 24, cell - 24, 17, 2);
    });

    const a = document.createElement('a');
    a.download = `bacheca-premi-la-scuola-amica.${ext}`;
    a.href = canvas.toDataURL(mime, .92);
    a.click();
  }

  function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
    const words = String(text).split(' ');
    let line = '';
    let lines = [];
    words.forEach((word) => {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    });
    if (line) lines.push(line);
    lines = lines.slice(0, maxLines || 2);
    lines.forEach((row, idx) => ctx.fillText(row, x, y + idx * lineHeight));
  }

  function bindRewardsPage() {
    const board = document.querySelector('[data-rewards-board]');
    if (!board) return;
    renderBoard(board);
    document.addEventListener('sa:rewards-updated', () => renderBoard(board));
    document.querySelector('[data-export-rewards="png"]')?.addEventListener('click', () => exportBoard('png'));
    document.querySelector('[data-export-rewards="jpeg"]')?.addEventListener('click', () => exportBoard('jpeg'));
    document.querySelector('[data-reset-rewards]')?.addEventListener('click', async () => {
      const ok = window.confirm('Vuoi cancellare tutti i premi salvati su questo dispositivo?');
      if (!ok) return;
      storageRemove(STORAGE_KEY);
      renderBoard(board);
    });
  }

  SA.rewards = {
    definitions: REWARDS,
    recordGame,
    recordBreakout,
    loadState,
    getProgress,
    renderBoard,
    exportBoard
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      injectRewardsLink();
      bindRewardsPage();
    }, { once: true });
  } else {
    injectRewardsLink();
    bindRewardsPage();
  }
})();
