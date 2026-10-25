(function () {
  'use strict';

  // Elemento a cui restituire il focus, per modale. Era una variabile sola:
  // aprendo un dialogo da dentro un'altra modale (Info -> "Cancella dati
  // locali") il riferimento al primo veniva sovrascritto e poi azzerato, cosi'
  // alla chiusura dell'esterna il focus restava su un bottone dentro un overlay
  // ormai aria-hidden e il browser lo scaricava su <body>: chi naviga da
  // tastiera o con screen reader tornava in cima al documento.
  const focusReturn = new Map();
  // Modali aperti, dal piu' vecchio al piu' recente: Esc chiude solo l'ultimo.
  const modalStack = [];
  // Modale aperto da dentro un altro (Info -> Versione): chiudendolo si torna
  // nel primo, sul pulsante che l'aveva aperto.
  const nestedParent = new Map();
  let promptFinalize = null;
  const promptQueue = [];
  const FOCUSABLE = 'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';
  // Timer di gioco facoltativo, spento di default: lo accende un adulto dal
  // pannello Info. Acceso, la sessione di 30 minuti parte da sola alla prima
  // partita, poi 60 minuti di pausa. Spento, il record della sessione non
  // conta e viene cancellato (anche quelli rimasti da quando era obbligatorio).
  const PLAY_TIMER_KEY = 'scuolaAmica_play_timer_v1';
  const PLAY_WINDOW_KEY = 'scuolaAmica_play_window_v1';
  const PLAY_WINDOW_DURATION_MS = 30 * 60 * 1000;
  const PLAY_WINDOW_COOLDOWN_MS = 60 * 60 * 1000;
  const PLAY_WINDOW_EVENT = 'sa:play-window-change';
  const UPDATES_MODAL_ID = 'modalUpdates';
  const INFO_HUB_MODAL_ID = 'modalInfoHub';
  const PROJECT_MODAL_ID = 'modalProject';
  const PROMPT_MODAL_ID = 'modalPromptShared';
  const SUPPORT_URL = '/supporta';
  const FAQ_URL = '/faq';
  const ACCESSIBILITY_URL = '/accessibilita';
  const ABOUT_URL = '/chi-siamo';
  const TEACHERS_URL = '/per-insegnanti';
  const PARENTS_URL = '/per-genitori';
  const AI_INFO_URL = '/ai-info';
  const APP_VERSION = (window.SA && window.SA.version) || '';
  const SA = window.SA = window.SA || {};
  const SA_FLAGS = SA.flags = SA.flags || {};
  const PALETTE_KEY = 'scuolaAmica_palette_v2';
  const PALETTE_LINK_ID = 'scuolaAmicaPaletteStyles';
  // Con la ?v= di shared.js (scripts/versiona_asset.js): il foglio e' della
  // stessa versione della pagina.
  const PALETTE_STYLESHEET = 'palette-okabe.css' + (document.currentScript ? new URL(document.currentScript.src).search : '');
  const PALETTE_MODE = {
    LEGACY: 'legacy',
    OKABE: 'okabe-ito'
  };
  const MOTION_KEY = 'scuolaAmica_motion_v1';
  const MOTION_MODE = {
    AUTO: 'auto',
    REDUCE: 'reduce'
  };
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
  let cachedThemeMeta = null;
  let cachedFooter = null;
  let playWindowTicker = null;
  let lastPlayWindowBroadcastKey = '';
  let updateLogCache = null;

  async function loadUpdateLog() {
    if (updateLogCache) return updateLogCache;
    try {
      const res = await fetch('/json/changelog.json');
      updateLogCache = await res.json();
    } catch (e) {
      updateLogCache = [];
    }
    return updateLogCache;
  }


  function safeInt(value, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(0, Math.floor(n));
  }

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

  // Sintesi vocale solo con voci installate sul dispositivo (localService).
  // Una voce di rete, come quelle "Google" di Chrome desktop, manda testo e
  // indirizzo IP a un server esterno: su un sito per bambini non si usa. Senza
  // voce locale per la lingua speak non viene chiamato e chi usa l'helper
  // nasconde il suo pulsante Ascolta. E' l'unico punto del sito che chiama
  // speechSynthesis.speak: lo controlla scripts/check_speech_local.js.
  // Quiz e Bosco partono prima di questo file (defer, in ordine), quindi non
  // aspettano SA.voice: ascoltano VOICE_EVENT, che parte qui sotto e a ogni
  // voiceschanged.
  const VOICE_EVENT = 'sa:voices-change';
  const speech = typeof window.SpeechSynthesisUtterance === 'function' && window.speechSynthesis ? window.speechSynthesis : null;

  function localVoice(lang) {
    if (!speech) return null;
    let voices = [];
    try {
      voices = speech.getVoices();
    } catch (e) {
      debugWarn('getVoices', e);
    }
    const re = new RegExp(`^${lang}([-_]|$)`, 'i');
    const local = voices.filter((v) => v && v.localService === true && re.test(v.lang || ''));
    return local.find((v) => v.default) || local[0] || null;
  }

  // options: lang ('it' o 'en'), rate, onend (anche su errore), queue (accoda
  // invece di interrompere la lettura in corso). Vale true se ha parlato.
  function speakLocal(text, options) {
    const opts = options || {};
    const voice = localVoice(opts.lang || 'it');
    if (!voice || !text) return false;
    try {
      if (!opts.queue) speech.cancel();
      const utterance = new window.SpeechSynthesisUtterance(text);
      utterance.voice = voice;
      utterance.lang = voice.lang;
      utterance.rate = opts.rate || 1;
      if (opts.onend) {
        utterance.onend = opts.onend;
        utterance.onerror = opts.onend;
      }
      speech.speak(utterance);
      return true;
    } catch (e) {
      debugWarn('speech.speak', e);
      return false;
    }
  }

  function dispatchVoiceChange() {
    document.dispatchEvent(new CustomEvent(VOICE_EVENT));
  }

  function parsePlayWindowRecord(rawValue) {
    if (!rawValue) return null;
    try {
      const parsed = JSON.parse(rawValue);
      const startedAt = safeInt(parsed?.startedAt, 0);
      const expiresAt = safeInt(parsed?.expiresAt, 0);
      if (!startedAt || !expiresAt || expiresAt <= startedAt) return null;
      const cooldownUntil = Math.max(expiresAt, safeInt(parsed?.cooldownUntil, expiresAt + PLAY_WINDOW_COOLDOWN_MS));
      return { startedAt, expiresAt, cooldownUntil };
    } catch (e) {
      debugWarn('parsePlayWindowRecord', e);
      return null;
    }
  }

  function isPlayTimerOn() {
    return storageGet(PLAY_TIMER_KEY) === '1';
  }

  // expired vale solo a timer acceso: e' il segnale con cui quiz, Bosco e
  // Spacca-Muri chiudono la partita in corso.
  function getPlayWindowState() {
    const enabled = isPlayTimerOn();
    const record = enabled ? parsePlayWindowRecord(storageGet(PLAY_WINDOW_KEY)) : null;
    if (!record) {
      return {
        enabled,
        active: false,
        expired: false,
        coolingDown: false,
        startedAt: null,
        expiresAt: null,
        cooldownUntil: null,
        durationMs: PLAY_WINDOW_DURATION_MS,
        cooldownMs: PLAY_WINDOW_COOLDOWN_MS,
        remainingMs: 0,
        cooldownRemainingMs: 0
      };
    }

    const remainingMs = Math.max(0, record.expiresAt - Date.now());
    const cooldownRemainingMs = Math.max(0, record.cooldownUntil - Date.now());
    return {
      enabled,
      active: remainingMs > 0,
      expired: remainingMs <= 0,
      coolingDown: remainingMs <= 0 && cooldownRemainingMs > 0,
      startedAt: record.startedAt,
      expiresAt: record.expiresAt,
      cooldownUntil: record.cooldownUntil,
      durationMs: PLAY_WINDOW_DURATION_MS,
      cooldownMs: PLAY_WINDOW_COOLDOWN_MS,
      remainingMs,
      cooldownRemainingMs
    };
  }

  function getPlayWindowStateKey(state) {
    return [
      state && state.enabled ? '1' : '0',
      state && state.active ? '1' : '0',
      state && state.coolingDown ? '1' : '0',
      safeInt(state?.startedAt, 0),
      safeInt(state?.expiresAt, 0),
      safeInt(state?.cooldownUntil, 0)
    ].join('|');
  }

  function formatPlayWindowWait(ms) {
    const minutes = Math.max(1, Math.ceil((Number(ms) || 0) / 60000));
    return minutes === 1 ? '1 minuto' : `${minutes} minuti`;
  }

  function dispatchPlayWindowChange(state, force) {
    const snapshot = state || getPlayWindowState();
    syncPlayWindowTicker(snapshot);
    const stateKey = getPlayWindowStateKey(snapshot);
    if (!force && stateKey === lastPlayWindowBroadcastKey) return snapshot;
    lastPlayWindowBroadcastKey = stateKey;
    document.dispatchEvent(new CustomEvent(PLAY_WINDOW_EVENT, { detail: snapshot }));
    return snapshot;
  }

  function syncPlayWindowTicker(state) {
    const snapshot = state || getPlayWindowState();
    const shouldTick = snapshot.active || snapshot.coolingDown;
    if (shouldTick) {
      if (playWindowTicker) return;
      playWindowTicker = window.setInterval(() => {
        dispatchPlayWindowChange(getPlayWindowState());
      }, 1000);
      return;
    }
    if (playWindowTicker) {
      clearInterval(playWindowTicker);
      playWindowTicker = null;
    }
  }

  function ensurePlayWindowTicker() {
    syncPlayWindowTicker(getPlayWindowState());
  }

  function startPlayWindow() {
    const startedAt = Date.now();
    const expiresAt = startedAt + PLAY_WINDOW_DURATION_MS;
    const cooldownUntil = expiresAt + PLAY_WINDOW_COOLDOWN_MS;
    storageSet(PLAY_WINDOW_KEY, JSON.stringify({ startedAt, expiresAt, cooldownUntil }));
    return dispatchPlayWindowChange(getPlayWindowState(), true);
  }

  function clearPlayWindow() {
    storageRemove(PLAY_WINDOW_KEY);
    return dispatchPlayWindowChange(getPlayWindowState(), true);
  }

  // Accendere o spegnere riparte da zero: spento, una pausa in corso sparisce
  // subito; acceso, la sessione parte alla prossima partita.
  function setPlayTimer(on) {
    storageSet(PLAY_TIMER_KEY, on ? '1' : '0');
    updatePlayTimerSwitch();
    return clearPlayWindow();
  }

  function updatePlayTimerSwitch() {
    const input = document.getElementById('playTimerSwitch');
    if (input) input.checked = isPlayTimerOn();
  }

  // Nessuna conferma: con il timer acceso la prima partita fa partire la
  // sessione. Durante la pausa si dice quanto manca e come spegnerlo.
  async function ensurePlayWindowActive() {
    const current = getPlayWindowState();
    if (!current.enabled || current.active) return true;
    if (current.coolingDown) {
      await promptAlert(
        `I 30 minuti di gioco sono finiti. Si può tornare a giocare tra ${formatPlayWindowWait(current.cooldownRemainingMs)}. Per spegnere il timer, un adulto apre il pannello Info e toglie «Tempo di gioco (per i genitori)».`,
        { title: 'Pausa dal gioco', okLabel: 'Va bene', focusMessage: true }
      );
      return false;
    }
    startPlayWindow();
    return true;
  }


  function isProjectStorageKey(key) {
    const value = String(key || '');
    if (!value) return false;
    return (
      // Prefisso di progetto: copre anche lascuolaamica_rewards_v1 e le tre
      // chiavi di Breakout (highscore, class, muted), che restavano fuori dalla
      // whitelist mentre la modale prometteva di cancellare "progressi,
      // classifiche e preferenze salvate su questo dispositivo".
      value.startsWith('lascuolaamica_') ||
      value.startsWith('scuolaAmica_') ||
      value.startsWith('englishAdventure_') ||
      value.startsWith('educazioneCivica_') ||
      value.startsWith('problemiMatematica_') ||
      value.startsWith('subject_') ||
      value.startsWith('matematica_programma_') ||
      value.startsWith('italiano_') ||
      value.startsWith('storia_') ||
      value.startsWith('scienze_') ||
      value.startsWith('geografia_') ||
      value === 'lascuolaamica_rewards_v1'
    );
  }

  function clearAllProjectStorageData() {
    let removed = 0;
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (isProjectStorageKey(key)) keys.push(String(key));
      }
      keys.forEach((key) => {
        localStorage.removeItem(key);
        removed += 1;
      });
    } catch (e) {
      debugWarn('clearAllProjectStorageData:localStorage', e);
    }

    Object.keys(memoryStorage).forEach((key) => {
      if (!isProjectStorageKey(key)) return;
      delete memoryStorage[key];
      removed += 1;
    });

    return removed;
  }

  function getThemeMeta() {
    if (cachedThemeMeta && cachedThemeMeta.isConnected) return cachedThemeMeta;
    cachedThemeMeta = document.querySelector('meta[name="theme-color"]');
    return cachedThemeMeta;
  }

  function getFooterEl() {
    if (cachedFooter && cachedFooter.isConnected) return cachedFooter;
    cachedFooter = document.querySelector('.site-footer, footer');
    return cachedFooter;
  }

  function normalizePalette(mode) {
    const value = String(mode || '').toLowerCase().trim();
    if (value === 'legacy' || value === 'default' || value === 'classic') return PALETTE_MODE.LEGACY;
    if (value === 'okabe' || value === 'okabe-ito' || value === 'okabeito') return PALETTE_MODE.OKABE;
    return null;
  }

  function normalizeMotion(mode) {
    const value = String(mode || '').toLowerCase().trim();
    if (value === 'reduce' || value === 'reduced' || value === 'less-motion') return MOTION_MODE.REDUCE;
    if (value === 'auto' || value === 'system' || value === 'default') return MOTION_MODE.AUTO;
    return null;
  }

  function getQueryPalette() {
    try {
      const mode = new URLSearchParams(window.location.search).get('palette');
      return normalizePalette(mode);
    } catch (e) {
      debugWarn('getQueryPalette', e);
      return null;
    }
  }

  function loadPalettePreference() {
    return normalizePalette(storageGet(PALETTE_KEY));
  }

  function savePalettePreference(mode) {
    storageSet(PALETTE_KEY, mode);
  }

  function loadMotionPreference() {
    return normalizeMotion(storageGet(MOTION_KEY));
  }

  function saveMotionPreference(mode) {
    storageSet(MOTION_KEY, mode);
  }

  function ensurePaletteStylesheet() {
    if (document.getElementById(PALETTE_LINK_ID)) return;
    const link = document.createElement('link');
    link.id = PALETTE_LINK_ID;
    link.rel = 'stylesheet';
    link.href = PALETTE_STYLESHEET;
    document.head.appendChild(link);
  }

  function syncThemeColor(mode) {
    const meta = getThemeMeta();
    if (!meta) return;
    if (!meta.dataset.baseThemeColor) {
      meta.dataset.baseThemeColor = meta.getAttribute('content') || '';
    }
    if (mode === PALETTE_MODE.OKABE) {
      meta.setAttribute('content', '#0072B2');
      return;
    }
    meta.setAttribute('content', meta.dataset.baseThemeColor || '#0072B2');
  }

  function applyPaletteMode(mode) {
    document.documentElement.setAttribute('data-palette', mode);
    syncThemeColor(mode);
  }

  function updatePaletteToggleState(root) {
    const scope = root || document;
    const mode = document.documentElement.getAttribute('data-palette') || PALETTE_MODE.LEGACY;
    scope.querySelectorAll('.palette-toggle-btn').forEach((btn) => {
      const btnMode = normalizePalette(btn.dataset.paletteMode) || PALETTE_MODE.LEGACY;
      const active = btnMode === mode;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function applyMotionMode(mode) {
    document.documentElement.setAttribute('data-motion', mode);
  }

  function updateMotionToggleState(root) {
    const scope = root || document;
    const mode = document.documentElement.getAttribute('data-motion') || MOTION_MODE.AUTO;
    scope.querySelectorAll('.motion-toggle-btn').forEach((btn) => {
      const btnMode = normalizeMotion(btn.dataset.motionMode) || MOTION_MODE.AUTO;
      const active = btnMode === mode;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function setPaletteMode(mode) {
    const normalized = normalizePalette(mode) || PALETTE_MODE.LEGACY;
    savePalettePreference(normalized);
    applyPaletteMode(normalized);
    updatePaletteToggleState(document);
    return normalized;
  }

  function setMotionMode(mode) {
    const normalized = normalizeMotion(mode) || MOTION_MODE.AUTO;
    saveMotionPreference(normalized);
    applyMotionMode(normalized);
    updateMotionToggleState(document);
    return normalized;
  }

  function isMotionReduced() {
    const mode = document.documentElement.getAttribute('data-motion') || MOTION_MODE.AUTO;
    if (mode === MOTION_MODE.REDUCE) return true;
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) {
      debugWarn('isMotionReduced', e);
      return false;
    }
  }

  function initPaletteMode() {
    ensurePaletteStylesheet();

    const queryMode = getQueryPalette();
    const storedMode = loadPalettePreference();
    const activeMode = queryMode || storedMode || PALETTE_MODE.LEGACY;

    setPaletteMode(activeMode);
  }

  function initMotionMode() {
    const activeMode = loadMotionPreference() || MOTION_MODE.AUTO;
    setMotionMode(activeMode);
  }


  function trapFocus(el) {
    const nodes = Array.from(el.querySelectorAll(FOCUSABLE));
    if (!nodes.length) return;

    const first = nodes[0];
    const last = nodes[nodes.length - 1];

    el._trapHandler = function (e) {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    el.addEventListener('keydown', el._trapHandler);
  }

  function releaseFocus(el) {
    if (el._trapHandler) {
      el.removeEventListener('keydown', el._trapHandler);
      delete el._trapHandler;
    }
  }

  // Scorre solo il contenuto: la X resta ferma in alto anche a fine testo.
  function modalScroll(...children) {
    const scroll = document.createElement('div');
    scroll.className = 'modal-scroll';
    scroll.append(...children);
    return scroll;
  }

  // focusEl: dove portare il focus, se non sulla X (es. il testo di un avviso).
  function openModal(id, focusEl) {
    const overlay = document.getElementById(id);
    if (!overlay) return;

    focusReturn.set(id, document.activeElement);
    const at = modalStack.indexOf(id);
    if (at !== -1) modalStack.splice(at, 1);
    modalStack.push(id);
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    if (window.SADom && typeof window.SADom.lockScroll === 'function') {
      window.SADom.lockScroll(true);
    } else {
      document.body.classList.add('modal-open');
    }

    const target = focusEl || overlay.querySelector('.modal-close');
    if (target) setTimeout(() => target.focus(), 50);

    trapFocus(overlay);
  }

  // Il focus torna all'elemento che aveva aperto il modale. Se non c'e' piu'
  // (o e' nascosto), va al titolo principale della pagina, non a <body>: il
  // Tab successivo ripartirebbe da inizio pagina.
  function restoreFocus(el) {
    const usable = el && el.isConnected && typeof el.focus === 'function'
      && el.getClientRects().length > 0 && !el.closest('[aria-hidden="true"], [hidden], .modal-overlay:not(.open)');
    if (usable) {
      el.focus();
      return;
    }
    const heading = document.querySelector('main h1, h1');
    if (!heading) return;
    if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
    heading.focus();
  }

  function closeModal(id, options) {
    const overlay = document.getElementById(id);
    if (!overlay) return;
    const at = modalStack.indexOf(id);
    if (at !== -1) modalStack.splice(at, 1);

    releaseFocus(overlay);
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');

    if (!document.querySelector('.modal-overlay.open')) {
      if (window.SADom && typeof window.SADom.lockScroll === 'function') {
        window.SADom.lockScroll(false);
      } else {
        document.body.classList.remove('modal-open');
      }
    }

    const back = focusReturn.get(id);
    focusReturn.delete(id);
    const parent = nestedParent.get(id);
    nestedParent.delete(id);
    if (parent) {
      openModal(parent.fromId, parent.opener);
      focusReturn.set(parent.fromId, parent.back);
      return;
    }
    if (options && options.restoreFocus === false) return;
    restoreFocus(back);
  }

  function ensurePromptModal() {
    if (document.getElementById(PROMPT_MODAL_ID)) return;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = PROMPT_MODAL_ID;
    overlay.dataset.sharedModalBound = '1';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'sharedPromptTitle');
    overlay.setAttribute('aria-describedby', 'sharedPromptMessage');
    overlay.setAttribute('aria-hidden', 'true');

    const box = document.createElement('div');
    box.className = 'modal-box';

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'modal-close';
    closeBtn.id = 'sharedPromptClose';
    closeBtn.setAttribute('aria-label', 'Chiudi messaggio');
    closeBtn.textContent = '✕';

    const title = document.createElement('h2');
    title.className = 'modal-title';
    title.id = 'sharedPromptTitle';
    title.textContent = 'Conferma';

    const body = document.createElement('div');
    body.className = 'modal-body';

    const message = document.createElement('p');
    message.id = 'sharedPromptMessage';
    message.tabIndex = -1;
    body.appendChild(message);

    const actions = document.createElement('div');
    actions.className = 'sa-prompt-actions';

    const confirmBtn = document.createElement('button');
    confirmBtn.type = 'button';
    confirmBtn.id = 'sharedPromptConfirm';
    confirmBtn.className = 'sa-prompt-btn primary';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.id = 'sharedPromptCancel';
    cancelBtn.className = 'sa-prompt-btn secondary';

    actions.appendChild(confirmBtn);
    actions.appendChild(cancelBtn);
    body.appendChild(actions);

    box.append(closeBtn, modalScroll(title, body));
    overlay.appendChild(box);
    document.body.appendChild(overlay);
  }

  // Tutti i dialoghi condividono un solo overlay. Se ne arrivava un secondo
  // mentre il primo era aperto, il primo veniva risolto come "rifiutato" e
  // sostituito: un service worker che segnalava un aggiornamento nel momento
  // sbagliato annullava il confirm della finestra di gioco, ensurePlayWindow
  // tornava false e la partita non partiva, senza dire niente. Ora il secondo
  // aspetta il suo turno.
  function showPromptDialog(options) {
    if (typeof promptFinalize === 'function') {
      return new Promise((resolve) => {
        promptQueue.push({ options, resolve });
      });
    }
    return runPromptDialog(options);
  }

  function runPromptDialog(options) {
    ensurePromptModal();
    const overlay = document.getElementById(PROMPT_MODAL_ID);
    const titleEl = document.getElementById('sharedPromptTitle');
    const messageEl = document.getElementById('sharedPromptMessage');
    const confirmBtn = document.getElementById('sharedPromptConfirm');
    const cancelBtn = document.getElementById('sharedPromptCancel');
    const closeBtn = document.getElementById('sharedPromptClose');

    const mode = options && options.mode === 'alert' ? 'alert' : 'confirm';
    const message = String(options && options.message ? options.message : '');
    const title = String(
      options && options.title
        ? options.title
        : (mode === 'alert' ? 'Attenzione' : 'Conferma')
    );
    const confirmLabel = String(
      options && options.confirmLabel
        ? options.confirmLabel
        : (mode === 'alert' ? 'Ho capito' : 'Conferma')
    );
    const cancelLabel = String(
      options && options.cancelLabel
        ? options.cancelLabel
        : 'Annulla'
    );

    if (!overlay || !titleEl || !messageEl || !confirmBtn || !cancelBtn || !closeBtn) {
      if (mode === 'alert') {
        window.alert(message);
        return Promise.resolve(true);
      }
      return Promise.resolve(window.confirm(message));
    }

    titleEl.textContent = title;
    messageEl.textContent = message;
    confirmBtn.textContent = confirmLabel;
    cancelBtn.textContent = cancelLabel;
    cancelBtn.hidden = mode === 'alert';
    cancelBtn.setAttribute('aria-hidden', mode === 'alert' ? 'true' : 'false');

    return new Promise((resolve) => {
      let resolved = false;

      const cleanup = () => {
        confirmBtn.removeEventListener('click', onConfirm);
        cancelBtn.removeEventListener('click', onCancel);
        closeBtn.removeEventListener('click', onCancel);
        overlay.removeEventListener('click', onOverlayClick);
        document.removeEventListener('keydown', onEscCapture, true);
      };

      const finalize = (accepted) => {
        if (resolved) return;
        resolved = true;
        promptFinalize = null;
        cleanup();
        closeModal(PROMPT_MODAL_ID);
        resolve(Boolean(accepted));

        const next = promptQueue.shift();
        if (next) {
          // tick di respiro: closeModal ha appena restituito il focus
          setTimeout(() => {
            runPromptDialog(next.options).then(next.resolve);
          }, 0);
        }
      };

      const onConfirm = () => finalize(true);
      const onCancel = () => finalize(false);
      const onOverlayClick = (event) => {
        if (event.target === overlay) onCancel();
      };
      const onEscCapture = (event) => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        event.stopPropagation();
        onCancel();
      };

      promptFinalize = finalize;
      confirmBtn.addEventListener('click', onConfirm);
      cancelBtn.addEventListener('click', onCancel);
      closeBtn.addEventListener('click', onCancel);
      overlay.addEventListener('click', onOverlayClick);
      document.addEventListener('keydown', onEscCapture, true);
      openModal(PROMPT_MODAL_ID, options && options.focusMessage ? messageEl : null);
    });
  }

  function promptConfirm(message, options) {
    return showPromptDialog({
      mode: 'confirm',
      message,
      title: options && options.title,
      confirmLabel: options && options.confirmLabel,
      cancelLabel: options && options.cancelLabel
    });
  }

  function promptAlert(message, options) {
    return showPromptDialog({
      mode: 'alert',
      message,
      title: options && options.title,
      confirmLabel: options && options.okLabel,
      focusMessage: options && options.focusMessage
    }).then(() => {});
  }

  function bindPlayWindowStorageSync() {
    if (SA_FLAGS.playWindowStorageSyncBound) return;
    window.addEventListener('storage', (event) => {
      if (event.key && event.key !== PLAY_WINDOW_KEY && event.key !== PLAY_TIMER_KEY) return;
      updatePlayTimerSwitch();
      dispatchPlayWindowChange(getPlayWindowState(), true);
    });
    SA_FLAGS.playWindowStorageSyncBound = true;
  }

  function bindModalEvents() {
    document.querySelectorAll('.modal-overlay').forEach((overlay) => {
      if (!overlay.classList.contains('open')) {
        overlay.setAttribute('aria-hidden', 'true');
      }
      if (overlay.dataset.sharedModalBound === '1') return;

      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal(overlay.id);
      });

      overlay.dataset.sharedModalBound = '1';
    });

    document.querySelectorAll('[data-open-modal]').forEach((btn) => {
      if (btn.dataset.sharedOpenBound === '1') return;
      btn.addEventListener('click', () => openModal(btn.dataset.openModal));
      btn.dataset.sharedOpenBound = '1';
    });

    document.querySelectorAll('[data-close-modal]').forEach((btn) => {
      if (btn.dataset.sharedCloseBound === '1') return;
      btn.addEventListener('click', () => closeModal(btn.dataset.closeModal));
      btn.dataset.sharedCloseBound = '1';
    });

    if (!SA_FLAGS.sharedEscHandlerBound) {
      document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        const top = modalStack[modalStack.length - 1];
        if (top) closeModal(top);
        else document.querySelectorAll('.modal-overlay.open').forEach((modal) => closeModal(modal.id));
      });
      SA_FLAGS.sharedEscHandlerBound = true;
    }
  }

  // La CSP ha require-trusted-types-for 'script': service worker registration e'
  // uno "script URL sink", quindi navigator.serviceWorker.register() rifiuta una
  // stringa semplice e richiede un TrustedScriptURL. La policy accetta solo gli
  // URL dell'elenco (gli stessi della policy sa-sw-import di sw.js) e rifiuta
  // tutto il resto: chi riuscisse a chiamarla non registra uno script suo.
  const TRUSTED_SCRIPT_URLS = ['/sw.js', '/app-version.js'];
  function trustedScriptUrl(url) {
    if (!window.trustedTypes || typeof window.trustedTypes.createPolicy !== 'function') return url;
    try {
      if (!SA._swUrlPolicy) {
        SA._swUrlPolicy = window.trustedTypes.createPolicy('sa-sw-url', {
          createScriptURL: (u) => {
            if (TRUSTED_SCRIPT_URLS.includes(u)) return u;
            throw new TypeError(`sa-sw-url: URL non ammesso: ${u}`);
          }
        });
      }
      return SA._swUrlPolicy.createScriptURL(url);
    } catch (e) {
      return url;
    }
  }

  // Una partita in corso: il sito non si ricarica mai mentre si gioca. Quiz
  // (domande, scelta e domanda bonus), Bosco (dentro la radura), Spacca-Muri
  // (pallina in gioco), Sistema Solare (viaggio guidato o film).
  function isPlaying() {
    const screen = document.documentElement.dataset.screen;
    if (['screenGame', 'screenBonusPick', 'screenBonusQuestion'].includes(screen)) return true;
    try {
      if (SA.bosco && SA.bosco.state && SA.bosco.state.inGioco && SA.bosco.state.mode !== 'complete') return true;
      if (SA.breakout && SA.breakout.state && SA.breakout.state.running) return true;
      if (SA.sistemaSolare && typeof SA.sistemaSolare.inCorso === 'function' && SA.sistemaSolare.inCorso()) return true;
    } catch (e) {
      debugWarn('isPlaying', e);
    }
    return false;
  }

  // Aggiornamento silenzioso, senza modale (prima "Nuova versione disponibile"
  // si riapriva a ogni pagina finche' non si accettava, e intercettava i
  // clic). Con un worker in attesa la versione nuova si attiva:
  // - al clic su un link interno: skipWaiting, si aspetta il controllerchange
  //   al massimo 1 s e poi si naviga comunque. Senza rete il clic non si
  //   trattiene: il link funziona come prima;
  // - quando la scheda torna visibile dopo almeno 30 minuti nascosta e non
  //   c'e' una partita in corso: skipWaiting e ricaricamento. Sotto i 30
  //   minuti si aspetta la navigazione successiva. Nel Sistema Solare mai:
  //   si perderebbe il punto dell'esplorazione.
  // Mai un ricaricamento durante una partita.
  const UPDATE_LINK_TIMEOUT_MS = 1000;
  const UPDATE_HIDDEN_MIN_MS = 30 * 60 * 1000;
  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;

    window.addEventListener(
      'load',
      async () => {
        let waiting = null;
        let reloadOnChange = false;
        let changed = false;

        navigator.serviceWorker.addEventListener('controllerchange', () => {
          changed = true;
          waiting = null;
          if (reloadOnChange && !isPlaying()) window.location.reload();
        });

        const activate = () => {
          if (!waiting || !navigator.serviceWorker.controller) return false;
          waiting.postMessage('skipWaiting');
          return true;
        };

        const onWaiting = (worker) => {
          if (!worker || !navigator.serviceWorker.controller) return;
          waiting = worker;
        };

        document.addEventListener('click', (event) => {
          if (!waiting || event.defaultPrevented || event.button !== 0) return;
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          const link = event.target.closest && event.target.closest('a[href]');
          if (!link || (link.target && link.target !== '_self') || link.hasAttribute('download')) return;
          const url = new URL(link.href, window.location.href);
          if (url.origin !== window.location.origin) return;
          if (url.pathname === window.location.pathname && url.search === window.location.search) return;
          if (navigator.onLine === false || !activate()) return;
          event.preventDefault();
          let gone = false;
          const go = () => {
            if (gone) return;
            gone = true;
            window.location.assign(url.href);
          };
          if (changed) {
            go();
            return;
          }
          window.setTimeout(go, UPDATE_LINK_TIMEOUT_MS);
          navigator.serviceWorker.addEventListener('controllerchange', go, { once: true });
        });

        let hiddenSince = document.visibilityState === 'hidden' ? Date.now() : null;
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'hidden') {
            hiddenSince = Date.now();
            return;
          }
          const away = hiddenSince === null ? 0 : Date.now() - hiddenSince;
          hiddenSince = null;
          if (!waiting || away < UPDATE_HIDDEN_MIN_MS || isPlaying() || SA.sistemaSolare) return;
          reloadOnChange = activate();
        });

        try {
          const reg = await navigator.serviceWorker.register(trustedScriptUrl('/sw.js'), {
            updateViaCache: 'none'
          });

          if (reg.waiting) onWaiting(reg.waiting);

          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (!newWorker) return;

            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed') onWaiting(newWorker);
            });
          });
        } catch (err) {
          console.warn('Service Worker non registrato:', err);
        }
      },
      { once: true }
    );
  }

  async function buildUpdatesModalBody(container) {
    if (container.dataset.loaded === 'true') return;
    const log = await loadUpdateLog();
    log.forEach((section) => {
      const heading = document.createElement('h3');
      heading.textContent = section.date;
      container.appendChild(heading);

      const list = document.createElement('ul');
      (section.items || []).forEach((item) => {
        const li = document.createElement('li');
        li.textContent = item;
        list.appendChild(li);
      });
      container.appendChild(list);
    });
    container.dataset.loaded = 'true';
  }

  function ensureUpdatesModal() {
    if (document.getElementById(UPDATES_MODAL_ID)) return;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = UPDATES_MODAL_ID;
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'titleUpdates');
    overlay.setAttribute('aria-hidden', 'true');

    const box = document.createElement('div');
    box.className = 'modal-box';

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'modal-close';
    closeBtn.setAttribute('data-close-modal', UPDATES_MODAL_ID);
    closeBtn.setAttribute('aria-label', 'Chiudi ultimi aggiornamenti');
    closeBtn.textContent = '✕';

    const title = document.createElement('h2');
    title.className = 'modal-title';
    title.id = 'titleUpdates';
    title.textContent = 'Ultimi aggiornamenti';

    const body = document.createElement('div');
    body.className = 'modal-body';
    body.id = 'modalUpdatesBody';

    box.append(closeBtn, modalScroll(title, body));
    overlay.appendChild(box);

    document.body.appendChild(overlay);
  }

  function ensureProjectModal() {
    if (document.getElementById(PROJECT_MODAL_ID)) return;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = PROJECT_MODAL_ID;
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'titleProject');
    overlay.setAttribute('aria-hidden', 'true');

    const box = document.createElement('div');
    box.className = 'modal-box';

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'modal-close';
    closeBtn.setAttribute('data-close-modal', PROJECT_MODAL_ID);
    closeBtn.setAttribute('aria-label', 'Chiudi la pagina Il Progetto');
    closeBtn.textContent = '✕';

    const title = document.createElement('h2');
    title.className = 'modal-title';
    title.id = 'titleProject';
    title.textContent = 'Il Progetto Educativo';

    const body = document.createElement('div');
    body.className = 'modal-body';

    const intro = document.createElement('p');
    intro.textContent = 'La Scuola Amica è un progetto educativo digitale e inclusivo progettato su misura per bambine e bambini della scuola primaria italiana.';

    const methodTitle = document.createElement('h3');
    methodTitle.textContent = 'Programma e Metodo Didattico';

    const methodText1 = document.createElement('p');
    methodText1.textContent = 'Tutti i test, i giochi e i quiz interattivi proposti (Matematica, Italiano, Inglese, Problemi, Geografia, Storia, Scienze, Educazione Civica) sono costruiti sulle Indicazioni Nazionali del 2012 per la scuola primaria. Le nuove Indicazioni (DM 221/2025) valgono dall’a.s. 2026/27: la revisione delle domande è in corso.';

    const methodText2 = document.createElement('p');
    methodText2.textContent = "L'approccio prevede una progressione graduale, feedback positivi e classifiche locali prive di vincoli frustranti, finalizzati a consolidare il sapere senza generare ansia. Il sistema disincentiva la ripetizione cieca introducendo variabilità nelle sessioni (anti-ripetizione guidata dalle AI).";

    const inclusionTitle = document.createElement('h3');
    inclusionTitle.textContent = 'Inclusività e Accessibilità';

    const inclusionText = document.createElement('p');
    inclusionText.append('La piattaforma integra una palette cromatica ');
    const okabeItoLink = document.createElement('a');
    okabeItoLink.href = 'https://siegal.bio.nyu.edu/color-palette/';
    okabeItoLink.target = '_blank';
    okabeItoLink.rel = 'noopener noreferrer';
    okabeItoLink.textContent = 'Okabe-Ito';
    okabeItoLink.setAttribute('aria-label', 'Apri la palette Okabe-Ito (si apre in una nuova scheda)');
    inclusionText.appendChild(okabeItoLink);
    inclusionText.append(" per l'eccellente visibilità anche in caso di daltonismo, adotta un design responsivo testato su smartphone, tablet (LIM comprese) e supporta la navigazione full-keyboard. Supporta pienamente il prefers-reduced-motion (riduzione animazioni) dei sistemi operativi.");

    const privacyTitle = document.createElement('h3');
    privacyTitle.textContent = 'Privacy First by Design';

    const privacyText = document.createElement('p');
    privacyText.textContent = 'Non viene raccolto nessun dato personale. Non occorre registrazione. Non ci sono tracker comportamentali e gli interi punteggi vengono stoccati unicamente in locale allineandosi perfettamente allo spirito protettivo essenziale per i software rivolti ai minori.';

    body.appendChild(intro);
    body.appendChild(methodTitle);
    body.appendChild(methodText1);
    body.appendChild(methodText2);
    body.appendChild(inclusionTitle);
    body.appendChild(inclusionText);
    body.appendChild(privacyTitle);
    body.appendChild(privacyText);

    box.append(closeBtn, modalScroll(title, body));
    overlay.appendChild(box);

    document.body.appendChild(overlay);
    bindModalEvents();
  }

  function syncFooterVersion() {
    if (SA && typeof SA.applyVersionToDom === 'function') {
      SA.applyVersionToDom(document);
      return;
    }
    if (!APP_VERSION) return;
    const versionText = `v${APP_VERSION}`;
    document.querySelectorAll('.footer-version').forEach((node) => {
      node.textContent = versionText;
      node.setAttribute('data-version', APP_VERSION);
      node.setAttribute('aria-label', `Versione applicazione ${APP_VERSION}`);
    });
  }

  async function fetchQuestionsIndex() {
    const response = await fetch('/json/index.json', { credentials: 'same-origin' });
    if (!response.ok) {
      throw new Error(`index fetch failed: ${response.status}`);
    }
    return response.json();
  }

  function getTotalQuestionsCount(indexPayload) {
    if (!indexPayload || typeof indexPayload !== 'object') return 0;
    if (Number.isFinite(indexPayload.totalQuestions)) return indexPayload.totalQuestions;
    const subjects = indexPayload.subjects && typeof indexPayload.subjects === 'object'
      ? Object.values(indexPayload.subjects)
      : [];
    return subjects.reduce((sum, subject) => {
      const count = Number(subject && subject.count);
      const rows = Number(subject && subject.rows);
      const statsRows = Number(subject && subject.stats && subject.stats.rows);
      if (Number.isFinite(count) && count > 0) return sum + count;
      if (Number.isFinite(rows) && rows > 0) return sum + rows;
      if (Number.isFinite(statsRows) && statsRows > 0) return sum + statsRows;
      return sum;
    }, 0);
  }

  async function renderQuestionsTotal(elementId = 'questionsTotalCount') {
    const el = document.getElementById(elementId);
    if (!el) return null;
    try {
      const indexPayload = await fetchQuestionsIndex();
      const total = getTotalQuestionsCount(indexPayload);
      if (!Number.isFinite(total) || total <= 0) {
        el.hidden = true;
        return null;
      }
      // useGrouping esplicito: sui numeri di quattro cifre il default ("auto")
      // omette il punto, e il footer scriveva "9223 domande" mentre la home
      // accanto dice "9.200+ domande".
      el.textContent = `${new Intl.NumberFormat('it-IT', { useGrouping: true }).format(total)} domande disponibili`;
      el.hidden = false;
      return total;
    } catch (err) {
      el.hidden = true;
      return null;
    }
  }

  function ensureSupportFooterLink() {
    const footer = getFooterEl();
    if (!footer) return;
    if (footer.querySelector('[data-support-cta="1"]')) return;

    const modelBtn = footer.querySelector('button[data-open-modal], button, .footer-link');
    const link = document.createElement('a');
    link.href = SUPPORT_URL;
    link.className = `${modelBtn ? modelBtn.className : 'footer-link'} footer-support-cta`;
    link.setAttribute('data-support-cta', '1');
    link.setAttribute('aria-label', 'Apri la pagina Supporta il progetto');
    link.setAttribute('title', 'Supporta il progetto');
    const heart = document.createElement('span');
    heart.className = 'support-heart';
    heart.setAttribute('aria-hidden', 'true');
    heart.textContent = '❤';

    const tag = document.createElement('span');
    tag.className = 'support-tag';
    tag.textContent = 'Supporta il progetto';

    link.appendChild(heart);
    link.appendChild(tag);
    footer.appendChild(link);
  }

  function openNestedModal(fromId, toId) {
    if (!toId) return;
    const opener = document.activeElement;
    const back = focusReturn.get(fromId);
    closeModal(fromId, { restoreFocus: false });
    openModal(toId);
    nestedParent.set(toId, { fromId, opener, back });
  }

  function ensureInfoHubModal(ids) {
    if (document.getElementById(INFO_HUB_MODAL_ID)) return;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = INFO_HUB_MODAL_ID;
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'titleInfoHub');
    overlay.setAttribute('aria-hidden', 'true');

    const box = document.createElement('div');
    box.className = 'modal-box';

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'modal-close';
    closeBtn.setAttribute('data-close-modal', INFO_HUB_MODAL_ID);
    closeBtn.setAttribute('aria-label', 'Chiudi pannello informazioni');
    closeBtn.textContent = '✕';

    const title = document.createElement('h2');
    title.className = 'modal-title';
    title.id = 'titleInfoHub';
    title.textContent = 'Info e impostazioni';

    const body = document.createElement('div');
    body.className = 'modal-body info-hub-body';

    const intro = document.createElement('p');
    intro.className = 'info-hub-intro';
    intro.textContent = 'Raccolta rapida di informazioni legali, aggiornamenti, preferenze colore e tempo di gioco.';

    const actions = document.createElement('div');
    actions.className = 'info-hub-actions';

    if (ids.privacyId) {
      const privacy = document.createElement('button');
      privacy.type = 'button';
      privacy.className = 'info-hub-btn';
      privacy.textContent = 'Privacy Policy';
      privacy.addEventListener('click', () => openNestedModal(INFO_HUB_MODAL_ID, ids.privacyId));
      actions.appendChild(privacy);
    }

    if (ids.cookieId) {
      const cookie = document.createElement('button');
      cookie.type = 'button';
      cookie.className = 'info-hub-btn';
      cookie.textContent = 'Cookie Policy';
      cookie.addEventListener('click', () => openNestedModal(INFO_HUB_MODAL_ID, ids.cookieId));
      actions.appendChild(cookie);
    }

    const faq = document.createElement('a');
    faq.href = FAQ_URL;
    faq.className = 'info-hub-btn';
    faq.textContent = 'FAQ';
    actions.appendChild(faq);

    const accessibility = document.createElement('a');
    accessibility.href = ACCESSIBILITY_URL;
    accessibility.className = 'info-hub-btn';
    accessibility.textContent = 'Accessibilità';
    actions.appendChild(accessibility);

    const about = document.createElement('a');
    about.href = ABOUT_URL;
    about.className = 'info-hub-btn';
    about.textContent = 'Chi siamo';
    actions.appendChild(about);

    const teachers = document.createElement('a');
    teachers.href = TEACHERS_URL;
    teachers.className = 'info-hub-btn';
    teachers.textContent = 'Per insegnanti';
    actions.appendChild(teachers);

    const parents = document.createElement('a');
    parents.href = PARENTS_URL;
    parents.className = 'info-hub-btn';
    parents.textContent = 'Per genitori';
    actions.appendChild(parents);

    const aiInfo = document.createElement('a');
    aiInfo.href = AI_INFO_URL;
    aiInfo.className = 'info-hub-btn';
    aiInfo.textContent = 'Info AI';
    actions.appendChild(aiInfo);

    const clearDataBtn = document.createElement('button');
    clearDataBtn.type = 'button';
    clearDataBtn.className = 'info-hub-btn info-hub-btn-danger';
    clearDataBtn.textContent = 'Cancella dati locali';
    clearDataBtn.setAttribute('aria-label', 'Cancella tutti i dati locali salvati sul dispositivo');
    clearDataBtn.addEventListener('click', async () => {
      const shouldClear = await promptConfirm(
        'Verranno cancellati progressi, classifiche e preferenze salvate su questo dispositivo. Continuare?',
        {
          title: 'Cancella dati locali',
          confirmLabel: 'Sì, cancella tutto',
          cancelLabel: 'Annulla'
        }
      );
      if (!shouldClear) return;

      const removed = clearAllProjectStorageData();
      applyPaletteMode(PALETTE_MODE.LEGACY);
      applyMotionMode(MOTION_MODE.AUTO);
      clearPlayWindow();
      updatePlayTimerSwitch();
      updatePaletteToggleState();
      updateMotionToggleState();
      closeModal(INFO_HUB_MODAL_ID);
      await promptAlert(
        `Operazione completata. Dati rimossi: ${removed}.`,
        { title: 'Dati locali cancellati', okLabel: 'Va bene' }
      );
    });
    actions.appendChild(clearDataBtn);

    const updates = document.createElement('button');
    updates.type = 'button';
    updates.className = 'info-hub-btn';
    updates.textContent = `Versione ${ids.version || APP_VERSION}`;
    updates.setAttribute('aria-label', `Apri ultimi aggiornamenti (Versione ${ids.version || APP_VERSION})`);
    updates.addEventListener('click', () => {
      const updatesBody = document.getElementById('modalUpdatesBody');
      if (updatesBody) buildUpdatesModalBody(updatesBody);
      openNestedModal(INFO_HUB_MODAL_ID, UPDATES_MODAL_ID);
    });
    actions.appendChild(updates);

    const projectBtn = document.createElement('button');
    projectBtn.type = 'button';
    projectBtn.className = 'info-hub-btn';
    projectBtn.textContent = 'Il Progetto';
    projectBtn.setAttribute('aria-label', 'Apri la pagina Il Progetto Educativo');
    projectBtn.addEventListener('click', () => {
      ensureProjectModal();
      openNestedModal(INFO_HUB_MODAL_ID, PROJECT_MODAL_ID);
    });
    actions.appendChild(projectBtn);

    const paletteRow = document.createElement('div');
    paletteRow.className = 'palette-toggle info-hub-palette';
    paletteRow.setAttribute('role', 'group');
    paletteRow.setAttribute('aria-label', 'Selezione palette colori');

    const paletteLabel = document.createElement('span');
    paletteLabel.className = 'palette-toggle-label';
    paletteLabel.textContent = 'Palette:';

    const standardBtn = document.createElement('button');
    standardBtn.type = 'button';
    standardBtn.className = 'palette-toggle-btn';
    standardBtn.dataset.paletteMode = PALETTE_MODE.LEGACY;
    standardBtn.textContent = 'Standard';

    const accessibleBtn = document.createElement('button');
    accessibleBtn.type = 'button';
    accessibleBtn.className = 'palette-toggle-btn';
    accessibleBtn.dataset.paletteMode = PALETTE_MODE.OKABE;
    accessibleBtn.textContent = 'Accessibile';

    [standardBtn, accessibleBtn].forEach((btn) => {
      btn.addEventListener('click', () => setPaletteMode(btn.dataset.paletteMode));
    });

    paletteRow.appendChild(paletteLabel);
    paletteRow.appendChild(standardBtn);
    paletteRow.appendChild(accessibleBtn);

    const motionRow = document.createElement('div');
    motionRow.className = 'motion-toggle info-hub-motion';
    motionRow.setAttribute('role', 'group');
    motionRow.setAttribute('aria-label', 'Preferenza animazioni');

    const motionLabel = document.createElement('span');
    motionLabel.className = 'motion-toggle-label';
    motionLabel.textContent = 'Animazioni:';

    const motionAutoBtn = document.createElement('button');
    motionAutoBtn.type = 'button';
    motionAutoBtn.className = 'motion-toggle-btn';
    motionAutoBtn.dataset.motionMode = MOTION_MODE.AUTO;
    motionAutoBtn.textContent = 'Automatiche';

    const motionReduceBtn = document.createElement('button');
    motionReduceBtn.type = 'button';
    motionReduceBtn.className = 'motion-toggle-btn';
    motionReduceBtn.dataset.motionMode = MOTION_MODE.REDUCE;
    motionReduceBtn.textContent = 'Meno animazioni';

    [motionAutoBtn, motionReduceBtn].forEach((btn) => {
      btn.addEventListener('click', () => setMotionMode(btn.dataset.motionMode));
    });

    motionRow.appendChild(motionLabel);
    motionRow.appendChild(motionAutoBtn);
    motionRow.appendChild(motionReduceBtn);

    // Checkbox nativa con role="switch": lo screen reader dice "attivato" o
    // "disattivato", la barra spaziatrice la cambia.
    const timerRow = document.createElement('div');
    timerRow.className = 'info-hub-timer';

    const timerLabel = document.createElement('label');
    timerLabel.className = 'timer-toggle';

    const timerInput = document.createElement('input');
    timerInput.type = 'checkbox';
    timerInput.id = 'playTimerSwitch';
    timerInput.setAttribute('role', 'switch');
    timerInput.setAttribute('aria-describedby', 'playTimerNote');
    timerInput.checked = isPlayTimerOn();
    timerInput.addEventListener('change', () => setPlayTimer(timerInput.checked));

    const timerText = document.createElement('span');
    timerText.textContent = 'Tempo di gioco (per i genitori)';

    const timerNote = document.createElement('p');
    timerNote.id = 'playTimerNote';
    timerNote.className = 'timer-toggle-note';
    timerNote.textContent = 'Con il timer acceso si gioca al massimo 30 minuti, poi si aspetta un’ora prima di ricominciare. Vale per questo dispositivo.';

    timerLabel.append(timerInput, timerText);
    timerRow.append(timerLabel, timerNote);

    body.appendChild(intro);
    body.appendChild(actions);
    body.appendChild(paletteRow);
    body.appendChild(motionRow);
    body.appendChild(timerRow);

    box.append(closeBtn, modalScroll(title, body));
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    updatePaletteToggleState(overlay);
    updateMotionToggleState(overlay);
  }

  // Il bottone "Info" (e il link "Supporta" di ensureSupportFooterLink) sono
  // gia' scritti nel footer di ogni pagina: shared.js e' l'ultimo script defer,
  // e aggiungerli qui faceva andare a capo il footer su mobile dopo il primo
  // paint (117 -> 169 px, CLS 0.013). Il bottone statico salta solo la
  // creazione: modale, stili e versione nascosta servono comunque.
  function ensureFooterInfoHub() {
    const footer = getFooterEl();
    if (!footer) return;

    ensurePaletteToggleStyles();

    const staticModalBtns = Array.from(footer.querySelectorAll('button[data-open-modal]'))
      .filter((btn) => btn.dataset.openModal !== UPDATES_MODAL_ID && btn.dataset.openModal !== INFO_HUB_MODAL_ID);

    let privacyId = null;
    let cookieId = null;
    staticModalBtns.forEach((btn) => {
      const text = String(btn.textContent || '').toLowerCase();
      if (!privacyId && text.includes('privacy')) privacyId = btn.dataset.openModal;
      if (!cookieId && text.includes('cookie')) cookieId = btn.dataset.openModal;
    });
    if (!privacyId && staticModalBtns[0]) privacyId = staticModalBtns[0].dataset.openModal;
    if (!cookieId && staticModalBtns[1]) cookieId = staticModalBtns[1].dataset.openModal;

    staticModalBtns.forEach((btn) => {
      btn.hidden = true;
      btn.setAttribute('aria-hidden', 'true');
    });

    const version = footer.querySelector('.footer-version');
    const versionText = APP_VERSION;
    if (version) {
      version.hidden = true;
      version.setAttribute('aria-hidden', 'true');
    }

    ensureInfoHubModal({ privacyId, cookieId, version: versionText });
    if (footer.querySelector(`[data-open-modal="${INFO_HUB_MODAL_ID}"]`)) return;

    const modelBtn = footer.querySelector('.footer-link, button');
    const infoBtn = document.createElement('button');
    infoBtn.type = 'button';
    infoBtn.className = modelBtn ? modelBtn.className : 'footer-link';
    infoBtn.setAttribute('data-open-modal', INFO_HUB_MODAL_ID);
    infoBtn.setAttribute('aria-haspopup', 'dialog');
    infoBtn.textContent = 'Info';

    if (version?.parentNode) {
      version.parentNode.insertBefore(infoBtn, version.nextSibling);
      return;
    }
    footer.appendChild(infoBtn);
  }

  function ensurePaletteToggleStyles() {
    if (document.getElementById('paletteToggleStyles')) return;
    const style = document.createElement('style');
    style.id = 'paletteToggleStyles';
    style.textContent = `
      .palette-toggle{
        display:inline-flex;
        align-items:center;
        gap:6px;
      }
      .palette-toggle-label{
        font-size:.84rem;
        font-weight:900;
        color:#5f6b7a;
      }
      .palette-toggle-btn{
        border:1px solid rgba(95,107,122,.36);
        background:#fff;
        color:#5a6877;
        border-radius:999px;
        min-height:44px;
        padding:10px 14px;
        font-size:.85rem;
        line-height:1.2;
        font-weight:900;
        cursor:pointer;
        transition:background-color .15s,color .15s,border-color .15s;
      }
      .palette-toggle-btn:hover{
        border-color:#2d6cdf;
        color:#2d6cdf;
      }
      .palette-toggle-btn.is-active{
        background:#2d6cdf;
        border-color:#2d6cdf;
        color:#fff;
      }
      .motion-toggle{
        display:inline-flex;
        align-items:center;
        gap:6px;
      }
      .motion-toggle-label{
        font-size:.84rem;
        font-weight:900;
        color:#5f6b7a;
      }
      .motion-toggle-btn{
        border:1px solid rgba(95,107,122,.36);
        background:#fff;
        color:#5a6877;
        border-radius:999px;
        min-height:44px;
        padding:10px 14px;
        font-size:.85rem;
        line-height:1.2;
        font-weight:900;
        cursor:pointer;
        transition:background-color .15s,color .15s,border-color .15s;
      }
      .motion-toggle-btn:hover{
        border-color:#2d6cdf;
        color:#2d6cdf;
      }
      .motion-toggle-btn.is-active{
        background:#2d6cdf;
        border-color:#2d6cdf;
        color:#fff;
      }
      /* Il dialogo condiviso viene creato al primo uso, quindi finisce nel DOM
         prima della modale Info (creata dopo): a parita' di z-index vinceva
         l'Info hub, che copriva il dialogo e ne intercettava i click. Con
         "Cancella dati locali" il confirm restava sotto e non era cliccabile. */
      #modalPromptShared{
        z-index:600;
      }
      .sa-prompt-actions{
        display:flex;
        flex-wrap:wrap;
        gap:10px;
        justify-content:center;
        margin-top:16px;
      }
      .sa-prompt-btn{
        border:1px solid rgba(95,107,122,.32);
        border-radius:999px;
        min-height:44px;
        padding:10px 16px;
        font-size:.92rem;
        line-height:1.2;
        font-weight:900;
        cursor:pointer;
      }
      .sa-prompt-btn.primary{
        background:#2d6cdf;
        border-color:#2d6cdf;
        color:#fff;
      }
      .sa-prompt-btn.secondary{
        background:#fff;
        color:#4f6072;
      }
      .sa-prompt-btn.primary:hover{
        filter:brightness(1.05);
      }
      .sa-prompt-btn.secondary:hover{
        border-color:#2d6cdf;
        color:#2d6cdf;
      }
      /* .footer-support-cta vive in utilities.css: il link e' statico nel
         footer, e con gli stili iniettati qui cambiava misura all'arrivo di
         shared.js. */
      html[data-palette="okabe-ito"] .palette-toggle-btn.is-active{
        background:#0072B2;
        border-color:#0072B2;
      }
      html[data-palette="okabe-ito"] .palette-toggle-label{
        color:#4f6174;
      }
      html[data-palette="okabe-ito"] .motion-toggle-btn.is-active{
        background:#0072B2;
        border-color:#0072B2;
      }
      html[data-palette="okabe-ito"] .motion-toggle-label{
        color:#4f6174;
      }
      html[data-motion="reduce"] *,
      html[data-motion="reduce"] *::before,
      html[data-motion="reduce"] *::after{
        animation-duration:0.01ms !important;
        animation-iteration-count:1 !important;
        transition-duration:0.01ms !important;
        scroll-behavior:auto !important;
      }
      .info-hub-body{
        display:grid;
        gap:12px;
      }
      .info-hub-intro{
        margin:0;
        color:#55687a;
        font-weight:800;
      }
      .info-hub-actions{
        display:grid;
        grid-template-columns:repeat(2,minmax(0,1fr));
        gap:8px;
      }
      .info-hub-btn{
        text-decoration:none;
        border:1px solid rgba(95,107,122,.28);
        background:#fff;
        color:#5a6877;
        border-radius:12px;
        padding:9px 10px;
        font-size:.82rem;
        line-height:1.2;
        font-weight:900;
        cursor:pointer;
        text-align:center;
      }
      .info-hub-btn:hover{
        border-color:#2d6cdf;
        color:#2d6cdf;
      }
      .info-hub-btn-danger{
        border-color:rgba(166,30,30,.36);
        color:#a61e1e;
        background:#fff5f5;
      }
      .info-hub-btn-danger:hover{
        border-color:#a61e1e;
        color:#8c1d1d;
      }
      .info-hub-palette{
        justify-content:center;
      }
      .info-hub-motion{
        justify-content:center;
      }
      .info-hub-timer{
        text-align:center;
      }
      .timer-toggle{
        display:inline-flex;
        align-items:center;
        gap:10px;
        min-height:44px;
        font-size:.9rem;
        font-weight:900;
        color:#55687a;
        cursor:pointer;
      }
      .timer-toggle input{
        width:24px;
        height:24px;
        margin:0;
        accent-color:#0072B2;
        cursor:pointer;
      }
      .timer-toggle-note{
        margin:0;
        font-size:.84rem;
        line-height:1.45;
        color:#55687a;
      }
      @media (max-width:620px){
        .palette-toggle{
          width:100%;
          justify-content:center;
        }
        .motion-toggle{
          width:100%;
          justify-content:center;
        }
        .info-hub-actions{
          grid-template-columns:1fr;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function initSharedUi() {
    syncFooterVersion();
    renderQuestionsTotal();
    ensureUpdatesModal();
    ensurePromptModal();
    ensureFooterInfoHub();
    ensureSupportFooterLink();
    ensurePlayWindowTicker();
    bindPlayWindowStorageSync();
    bindModalEvents();
  }

  // SA.modal, SA.palette e SA.renderQuestionsTotal erano esposti senza un solo
  // call site in tutto il repo (23 HTML, js/*.js, i moduli root). Le funzioni
  // restano, usate internamente: qui spariva solo la superficie pubblica.
  SA.motion = {
    get mode() {
      return document.documentElement.getAttribute('data-motion') || MOTION_MODE.AUTO;
    },
    set(mode) {
      return setMotionMode(mode);
    },
    isReduced() {
      return isMotionReduced();
    },
    modes: { ...MOTION_MODE }
  };
  SA.ui = SA.ui || {};
  SA.ui.confirm = promptConfirm;
  SA.ui.alert = promptAlert;
  SA.playWindow = {
    key: PLAY_WINDOW_KEY,
    durationMs: PLAY_WINDOW_DURATION_MS,
    getState: getPlayWindowState,
    isActive() {
      return getPlayWindowState().active;
    },
    timerKey: PLAY_TIMER_KEY,
    isEnabled: isPlayTimerOn,
    setEnabled: setPlayTimer,
    start: startPlayWindow,
    clear: clearPlayWindow,
    ensureActive: ensurePlayWindowActive,
    eventName: PLAY_WINDOW_EVENT
  };
  SA.version = APP_VERSION;
  SA.voice = {
    eventName: VOICE_EVENT,
    available(lang) {
      return !!localVoice(lang || 'it');
    },
    speak: speakLocal
  };
  if (speech) {
    try {
      speech.addEventListener('voiceschanged', dispatchVoiceChange);
    } catch (e) {
      debugWarn('voiceschanged', e);
    }
  }
  dispatchVoiceChange();

  initPaletteMode();
  initMotionMode();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSharedUi, { once: true });
  } else {
    initSharedUi();
  }

  if (!isPlayTimerOn()) storageRemove(PLAY_WINDOW_KEY);
  dispatchPlayWindowChange(getPlayWindowState(), true);
  registerServiceWorker();
})();
