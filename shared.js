(function () {
  'use strict';

  let prevFocus = null;
  const FOCUSABLE = 'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';
  const WALLET_KEY = 'scuolaAmica_wallet_v1';
  const WALLET_LOG_KEY = 'scuolaAmica_wallet_log_v1';
  const SESSION_CREDIT_PER_CORRECT = 4;
  const BONUS_CREDITS = { easy: 10, medium: 22, hard: 45 };
  const UPDATES_MODAL_ID = 'modalUpdates';
  const INFO_HUB_MODAL_ID = 'modalInfoHub';
  const PROJECT_MODAL_ID = 'modalProject';
  const SUPPORT_URL = 'supporta';
  const FAQ_URL = 'faq';
  const ACCESSIBILITY_URL = 'accessibilita';
  const APP_VERSION = (window.SCUOLA_AMICA_VERSION && window.SCUOLA_AMICA_VERSION.app) || '4.3';
  const SA = window.SA = window.SA || {};
  const SA_FLAGS = SA.flags = SA.flags || {};
  const PALETTE_KEY = 'scuolaAmica_palette_v2';
  const PALETTE_LINK_ID = 'scuolaAmicaPaletteStyles';
  const PALETTE_STYLESHEET = 'palette-okabe.css';
  const PALETTE_MODE = {
    LEGACY: 'legacy',
    OKABE: 'okabe-ito'
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
  const memoryStorage = Object.create(null);
  const queryCache = {};
  let cachedThemeMeta = null;
  let cachedFooter = null;
  const UPDATE_LOG = [
    {
      date: '23 aprile 2026',
      items: [
        'Integrati nuovi pacchetti domande validati per tutte le 8 materie.',
        'Aggiornato index aggregato con conteggi sincronizzati per materia e totale domande.',
        'Eseguita validazione post-merge con esito PASS su struttura, coerenza e risposte.',
        'Corretto un duplicato opzioni nel dataset di Italiano (voce ortografia).',
        'Versione portale aggiornata alla 4.3.'
      ]
    },
    {
      date: '20 aprile 2026',
      items: [
        'Potenziato l’algoritmo di selezione domande con planner stocastico area+difficoltà.',
        'Migliorata la logica anti-ripetizione multi-sessione con cooldown e softmax sui candidati.',
        'Aggiunte metriche locali di qualità sessione (repeat rate, copertura, entropia, novità).',
        'Esteso il generatore parametrico e introdotti report CSV automatici di copertura.'
      ]
    },
    {
      date: '18 aprile 2026',
      items: [
        'Eseguito audit WCAG 2.1 AA automatico su tutte le pagine principali (tag wcag2a/wcag2aa).',
        'Corrette tre criticità di contrasto nel tema standard: badge crediti home, score-pill FAQ e wallet-pill Villaggio.',
        'Completata la validazione manuale: tastiera, modali, zoom/reflow, VoiceOver e riduzione movimento.',
        'Corretto il layout della home a zoom 200% per evitare tagli di testo nelle card.',
        'Aggiunta la pagina pubblica Accessibilità con dichiarazione WCAG, metodologia di test e contatto diretto.',
        'Versione portale aggiornata alla 4.2.1.'
      ]
    },
    {
      date: '16 aprile 2026',
      items: [
        'Impostata la palette standard come tema predefinito del sito.',
        'Aggiornata la persistenza preferenze palette con nuova chiave di storage.',
        'Rigenerati gli screenshot social della home (390x844, 1280x720, 1200x630) senza footer.'
      ]
    },
    {
      date: '14 aprile 2026',
      items: [
        'Deduplicati i dataset domande per tutte le materie con rinumerazione ID coerente.',
        'Ridotto il rischio di ripetizione tra sessioni con filtro anti-repeat testuale nel motore quiz.',
        'Allineati metadati e conteggi nei file json per materia, index aggregato e questions.json legacy.'
      ]
    },
    {
      date: '13 aprile 2026',
      items: [
        'Aggiornate canonical, URL Open Graph e JSON-LD sulle rotte senza estensione .html.',
        'Allineati i link interni e la sitemap ai percorsi canonici (es. /matematica, /faq, /supporta).',
        'Rimosso il Villaggio dalla sitemap e impostato noindex,nofollow per villaggio e supporto-satispay.',
        'Aggiornato il copy della pagina Supporta con contatto diretto supporto@lascuolaamica.it.',
        'Versione portale aggiornata alla 4.1.1.'
      ]
    },
    {
      date: '12 aprile 2026',
      items: [
        'Revisione linguistica completa dei testi in italiano su quiz, FAQ, informazioni e pagina supporto.',
        'Corretti accenti e apostrofi nelle domande e nei testi (es. è, qual è, cos’è, l’Italia, l’ambiente, probabilità).',
        'Risolti errori di sintassi JavaScript causati da stringhe con apostrofi non escapati in alcune domande.',
        'Aggiornati i dataset JSON per coerenza ortografica, inclusa la correzione delle forme interrogative.',
        'Versione portale confermata alla 4.1 e contenuti sincronizzati nella cartella export.'
      ]
    },
    {
      date: '11 aprile 2026',
      items: [
        'Introdotta palette accessibile Okabe-Ito con fallback rapido alla palette standard.',
        'Aggiunta gestione persistente della palette (Standard/Accessibile) con preferenza salvata nel browser.',
        'Migliorata la visibilità dei pallini di avanzamento non ancora completati.',
        'Inserito toggle visibile nel footer: “Palette: Standard / Accessibile”.',
        'Reso più compatto il collegamento supporto nel footer con cuore rosso e tag dedicato.',
        'Footer ottimizzato: elementi aggregati in un unico pulsante “Info” con privacy, cookie, FAQ, aggiornamenti e palette.',
        'Versione portale spostata nel pannello Info come prima voce (es. Versione 4.1).'
      ]
    },
    {
      date: '10 aprile 2026',
      items: [
        'Creata la nuova pagina FAQ con accordion e markup FAQPage per AEO/SEO.',
        'Aggiunto il link FAQ vicino al badge “Piattaforma Educativa” nella home.',
        'Migliorato il linking interno SEO con collegamento FAQ anche nel footer delle pagine.',
        'Implementati gli step 1-4 su tutte le materie: classi 2ª-5ª, progressione, anti-ripetizione e maggiore varietà.',
        'Aggiornato il motore condiviso delle materie con selezione classe e classifica estesa con la classe.',
        'Allineate anche le pagine dedicate (inglese, problemi, civica) alla logica per classe.',
        'Disattivato l’accesso al Villaggio dalla home con messaggio “Funzionalità in fase di sviluppo”.',
        'Rimossa la dicitura “Aggiornata: …” da Privacy Policy e Cookie Policy in tutte le pagine.',
        'Aggiunta CTA footer “Supporta il progetto” con pagina dedicata e placeholder QR Satispay.'
      ]
    },
    {
      date: '9 aprile 2026',
      items: [
        'Aggiunta e rifinita la materia Educazione Civica con 4 ambiti e 10 domande variabili.',
        'Aggiornata la domanda bonus difficile di civica sulla sicurezza stradale (semaforo rosso).',
        'Uniformata la grafica della home: card allineate, testi su più righe e bottoni coerenti.',
        'Rimosse le emoji dai bottoni principali mantenendo i colori differenziati.',
        'Miglioramenti SEO/accessibilità e controlli tecnici su performance e struttura.'
      ]
    },
    {
      date: '8 aprile 2026',
      items: [
        'Introdotto il sistema crediti condiviso tra giochi e preparata l’integrazione con il Villaggio.',
        'Creata la pagina Villaggio con mappa 8x8, negozio edifici e asset grafici dedicati.',
        'Aggiunto il collegamento rapido al Villaggio vicino al badge crediti in home.',
        'Corretti problemi grafici del Villaggio (overflow mappa, pulsanti e layout).',
        'Aggiornati dati e nomi nei problemi (es. Luciana, Emma).'
      ]
    },
    {
      date: '7 aprile 2026',
      items: [
        'Matematica: migliorata selezione tabelline con stato visivo evidente.',
        'Matematica: riorganizzata la scelta modalità (prima tabellina/tutte, poi classico o tempo).',
        'Uniformati i messaggi di risposta corretta con formule neutre (senza genere).',
        'Introdotta la domanda bonus finale con moltiplicatore x5/x10/x25 nelle materie principali.',
        'Aggiunte nuove pagine disciplinari e consolidata la struttura comune dei quiz.'
      ]
    }
  ];

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

  function getCachedNodes(key, selector) {
    const cached = queryCache[key];
    if (Array.isArray(cached) && cached.length && cached.every((node) => node.isConnected)) {
      return cached;
    }
    const nodes = Array.from(document.querySelectorAll(selector));
    if (nodes.length) queryCache[key] = nodes;
    return nodes;
  }

  function normalizePalette(mode) {
    const value = String(mode || '').toLowerCase().trim();
    if (value === 'legacy' || value === 'default' || value === 'classic') return PALETTE_MODE.LEGACY;
    if (value === 'okabe' || value === 'okabe-ito' || value === 'okabeito') return PALETTE_MODE.OKABE;
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

  function setPaletteMode(mode) {
    const normalized = normalizePalette(mode) || PALETTE_MODE.LEGACY;
    savePalettePreference(normalized);
    applyPaletteMode(normalized);
    updatePaletteToggleState(document);
    return normalized;
  }

  function initPaletteMode() {
    ensurePaletteStylesheet();

    const queryMode = getQueryPalette();
    const storedMode = loadPalettePreference();
    const activeMode = queryMode || storedMode || PALETTE_MODE.LEGACY;

    setPaletteMode(activeMode);
  }

  function loadWallet() {
    try {
      const raw = JSON.parse(storageGet(WALLET_KEY));
      return {
        balance: safeInt(raw && raw.balance, 0),
        lifetimeEarned: safeInt(raw && raw.lifetimeEarned, 0),
        lifetimeSpent: safeInt(raw && raw.lifetimeSpent, 0),
        updatedAt: typeof raw?.updatedAt === 'string' ? raw.updatedAt : null
      };
    } catch (e) {
      debugWarn('loadWallet', e);
      return { balance: 0, lifetimeEarned: 0, lifetimeSpent: 0, updatedAt: null };
    }
  }

  function saveWallet(wallet) {
    storageSet(WALLET_KEY, JSON.stringify(wallet));
  }

  function appendWalletLog(entry) {
    try {
      const parsed = JSON.parse(storageGet(WALLET_LOG_KEY));
      const list = Array.isArray(parsed) ? parsed : [];
      list.push({
        ts: new Date().toISOString(),
        type: entry.type,
        amount: safeInt(entry.amount, 0),
        source: String(entry.source || 'app').slice(0, 64),
        note: String(entry.note || '').slice(0, 140)
      });
      storageSet(WALLET_LOG_KEY, JSON.stringify(list.slice(-200)));
    } catch (e) {
      debugWarn('appendWalletLog', e);
    }
  }

  function dispatchWalletUpdated(wallet) {
    getCachedNodes('wallet-balance', '[data-wallet-balance]').forEach((el) => {
      el.textContent = String(wallet.balance);
    });
    getCachedNodes('wallet-earned', '[data-wallet-earned]').forEach((el) => {
      el.textContent = String(wallet.lifetimeEarned);
    });
    getCachedNodes('wallet-spent', '[data-wallet-spent]').forEach((el) => {
      el.textContent = String(wallet.lifetimeSpent);
    });
    window.dispatchEvent(new CustomEvent('wallet-updated', { detail: { ...wallet } }));
  }

  function getWallet() {
    const wallet = loadWallet();
    return { ...wallet };
  }

  function addCredits(amount, meta) {
    const qty = safeInt(amount, 0);
    if (!qty) return getWallet();
    const wallet = loadWallet();
    wallet.balance += qty;
    wallet.lifetimeEarned += qty;
    wallet.updatedAt = new Date().toISOString();
    saveWallet(wallet);
    appendWalletLog({ type: 'credit', amount: qty, source: meta?.source, note: meta?.note });
    dispatchWalletUpdated(wallet);
    return { ...wallet };
  }

  function spendCredits(amount, meta) {
    const qty = safeInt(amount, 0);
    if (!qty) return true;
    const wallet = loadWallet();
    if (wallet.balance < qty) return false;
    wallet.balance -= qty;
    wallet.lifetimeSpent += qty;
    wallet.updatedAt = new Date().toISOString();
    saveWallet(wallet);
    appendWalletLog({ type: 'debit', amount: qty, source: meta?.source, note: meta?.note });
    dispatchWalletUpdated(wallet);
    return true;
  }

  function calcSessionCredits(params) {
    const correct = safeInt(params?.correct, 0);
    const bonusType = typeof params?.bonusType === 'string' ? params.bonusType : null;
    const bonusApplied = Boolean(params?.bonusApplied);
    const base = correct * SESSION_CREDIT_PER_CORRECT;
    const bonus = bonusApplied && bonusType && BONUS_CREDITS[bonusType] ? BONUS_CREDITS[bonusType] : 0;
    return { base, bonus, total: base + bonus };
  }

  const ScuolaEconomy = {
    getWallet,
    addCredits,
    spendCredits,
    calcSessionCredits,
    constants: {
      perCorrect: SESSION_CREDIT_PER_CORRECT,
      bonusCredits: { ...BONUS_CREDITS }
    }
  };

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

  function openModal(id) {
    const overlay = document.getElementById(id);
    if (!overlay) return;

    prevFocus = document.activeElement;
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    const closeBtn = overlay.querySelector('.modal-close');
    if (closeBtn) setTimeout(() => closeBtn.focus(), 50);

    trapFocus(overlay);
  }

  function closeModal(id) {
    const overlay = document.getElementById(id);
    if (!overlay) return;

    releaseFocus(overlay);
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');

    if (!document.querySelector('.modal-overlay.open')) {
      document.body.style.overflow = '';
    }

    if (prevFocus && typeof prevFocus.focus === 'function') {
      prevFocus.focus();
      prevFocus = null;
    }
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
        document.querySelectorAll('.modal-overlay.open').forEach((modal) => closeModal(modal.id));
      });
      SA_FLAGS.sharedEscHandlerBound = true;
      window.__sharedEscHandlerBound = true;
    }
  }

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;

    window.addEventListener(
      'load',
      async () => {
        let refreshing = false;
        let shouldRefresh = false;

        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (!shouldRefresh || refreshing) return;
          refreshing = true;
          window.location.reload();
        });

        const askToUpdate = (worker) => {
          if (!worker || !navigator.serviceWorker.controller) return;
          const shouldUpdate = confirm('È disponibile una nuova versione. Aggiornare ora?');
          if (shouldUpdate) {
            shouldRefresh = true;
            worker.postMessage('skipWaiting');
          }
        };

        try {
          const reg = await navigator.serviceWorker.register('/sw.js');

          if (reg.waiting) askToUpdate(reg.waiting);

          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (!newWorker) return;

            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed') askToUpdate(newWorker);
            });
          });
        } catch (err) {
          console.warn('Service Worker non registrato:', err);
        }
      },
      { once: true }
    );
  }

  function buildUpdatesModalBody(container) {
    UPDATE_LOG.forEach((section) => {
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
    buildUpdatesModalBody(body);

    box.appendChild(closeBtn);
    box.appendChild(title);
    box.appendChild(body);
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
    methodText1.textContent = 'Tutti i test, i giochi e i quiz interattivi proposti (Matematica, Italiano, Inglese, Problemi, Geografia, Storia, Scienze, Educazione Civica) sono allineati al programma ministeriale (Indicazioni Nazionali per il curricolo della scuola primaria).';

    const methodText2 = document.createElement('p');
    methodText2.textContent = "L'approccio prevede una progressione graduale, meccaniche di gamification positiva (crediti ed elementi sbloccabili nel Villaggio) prive di vincoli frustranti, finalizzate a consolidare il sapere senza generare ansia. Il sistema disincentiva la ripetizione cieca introducendo variabilità nelle sessioni (anti-ripetizione guidata dalle AI).";

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

    box.appendChild(closeBtn);
    box.appendChild(title);
    box.appendChild(body);
    overlay.appendChild(box);

    document.body.appendChild(overlay);
    bindModalEvents();
  }

  function ensureUpdatesFooterLink() {
    const footer = getFooterEl();
    if (!footer) return;
    if (footer.querySelector(`[data-open-modal="${UPDATES_MODAL_ID}"]`)) return;

    const version = footer.querySelector('.footer-version');
    const modelBtn = footer.querySelector('button[data-open-modal], button');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = modelBtn ? modelBtn.className : 'footer-link';
    btn.setAttribute('data-open-modal', UPDATES_MODAL_ID);
    btn.setAttribute('aria-haspopup', 'dialog');
    btn.textContent = 'Ultimi aggiornamenti';

    if (version && version.parentNode) {
      version.parentNode.insertBefore(btn, version);
    } else {
      footer.appendChild(btn);
    }
  }

  function ensureFaqFooterLink() {
    const footer = getFooterEl();
    if (!footer) return;
    if (footer.querySelector('[data-faq-link="1"]')) return;

    const modelBtn = footer.querySelector('button[data-open-modal], button, .footer-link, .flink');
    const version = footer.querySelector('.footer-version');
    const link = document.createElement('a');
    link.href = FAQ_URL;
    link.className = modelBtn ? modelBtn.className : 'footer-link';
    link.setAttribute('data-faq-link', '1');
    link.textContent = 'FAQ';

    if (version && version.parentNode) {
      version.parentNode.insertBefore(link, version);
    } else {
      footer.appendChild(link);
    }
  }

  function ensureSupportFooterLink() {
    const footer = getFooterEl();
    if (!footer) return;
    if (footer.querySelector('[data-support-cta="1"]')) return;

    const modelBtn = footer.querySelector('button[data-open-modal], button, .footer-link, .flink');
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
    closeModal(fromId);
    openModal(toId);
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
    intro.textContent = 'Raccolta rapida di informazioni legali, aggiornamenti e preferenze colore.';

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

    const updates = document.createElement('button');
    updates.type = 'button';
    updates.className = 'info-hub-btn';
    updates.textContent = `Versione ${ids.version || APP_VERSION}`;
    updates.setAttribute('aria-label', `Apri ultimi aggiornamenti (Versione ${ids.version || APP_VERSION})`);
    updates.addEventListener('click', () => openNestedModal(INFO_HUB_MODAL_ID, UPDATES_MODAL_ID));
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

    body.appendChild(intro);
    body.appendChild(actions);
    body.appendChild(paletteRow);

    box.appendChild(closeBtn);
    box.appendChild(title);
    box.appendChild(body);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    updatePaletteToggleState(overlay);
  }

  function ensureFooterInfoHub() {
    const footer = getFooterEl();
    if (!footer) return;
    if (footer.querySelector(`[data-open-modal="${INFO_HUB_MODAL_ID}"]`)) return;

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
    const versionText = String(version?.textContent || '')
      .replace(/^[vV]\s*/, '')
      .trim() || APP_VERSION;
    if (version) {
      version.hidden = true;
      version.setAttribute('aria-hidden', 'true');
    }

    ensureInfoHubModal({ privacyId, cookieId, version: versionText });

    const modelBtn = footer.querySelector('.footer-link, .flink, button');
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
        font-size:.78rem;
        font-weight:900;
        color:#5f6b7a;
      }
      .palette-toggle-btn{
        border:1px solid rgba(95,107,122,.36);
        background:#fff;
        color:#5a6877;
        border-radius:999px;
        padding:4px 10px;
        font-size:.76rem;
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
      .footer-support-cta{
        width:auto;
        max-width:calc(100% - 8px);
        border-radius:999px;
        padding:6px 10px;
        gap:6px;
        display:inline-flex;
        align-items:center;
        justify-content:center;
        background:#fff !important;
        color:#5f6b7a !important;
        border:1px solid rgba(95,107,122,.26);
        box-shadow:0 3px 10px rgba(0,0,0,.12);
      }
      .footer-support-cta .support-heart{
        color:#d62828;
        font-size:1rem;
        line-height:1;
      }
      .footer-support-cta .support-tag{
        display:inline-flex;
        align-items:center;
        border-radius:999px;
        padding:2px 8px;
        background:#ffe9e9;
        border:1px solid #ffc9c9;
        color:#a61e1e;
        font-size:.72rem;
        font-weight:900;
        line-height:1.2;
      }
      html[data-palette="okabe-ito"] .palette-toggle-btn.is-active{
        background:#0072B2;
        border-color:#0072B2;
      }
      html[data-palette="okabe-ito"] .footer-support-cta .support-tag{
        background:#ffe6e6;
        border-color:#ffbdbd;
        color:#8c1d1d;
      }
      html[data-palette="okabe-ito"] .palette-toggle-label{
        color:#4f6174;
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
      .info-hub-palette{
        justify-content:center;
      }
      @media (max-width:620px){
        .palette-toggle{
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

  function ensurePaletteFooterToggle() {
    const footer = getFooterEl();
    if (!footer) return;
    if (footer.querySelector('[data-palette-toggle="1"]')) return;

    ensurePaletteToggleStyles();

    const wrap = document.createElement('div');
    wrap.className = 'palette-toggle';
    wrap.setAttribute('data-palette-toggle', '1');
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('aria-label', 'Selezione palette colori');

    const label = document.createElement('span');
    label.className = 'palette-toggle-label';
    label.textContent = 'Palette:';

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
      btn.addEventListener('click', () => {
        setPaletteMode(btn.dataset.paletteMode);
      });
    });

    wrap.appendChild(label);
    wrap.appendChild(standardBtn);
    wrap.appendChild(accessibleBtn);

    const version = footer.querySelector('.footer-version');
    if (version && version.parentNode) {
      version.parentNode.insertBefore(wrap, version);
    } else {
      footer.appendChild(wrap);
    }

    updatePaletteToggleState(wrap);
  }

  function initSharedUi() {
    ensureUpdatesModal();
    ensureFooterInfoHub();
    ensureSupportFooterLink();
    bindModalEvents();
  }

  SA.modal = SA.modal || {};
  SA.modal.open = openModal;
  SA.modal.close = closeModal;
  SA.economy = ScuolaEconomy;
  SA.palette = {
    get mode() {
      return document.documentElement.getAttribute('data-palette') || PALETTE_MODE.LEGACY;
    },
    set(mode) {
      return setPaletteMode(mode);
    },
    modes: { ...PALETTE_MODE }
  };
  SA.version = APP_VERSION;

  // Alias legacy mantenuti per compatibilità con pagine esistenti.
  window.openModal = openModal;
  window.closeModal = closeModal;
  window.ScuolaEconomy = SA.economy;
  window.ScuolaPalette = SA.palette;

  initPaletteMode();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSharedUi, { once: true });
  } else {
    initSharedUi();
  }

  dispatchWalletUpdated(loadWallet());
  registerServiceWorker();
})();
