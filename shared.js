(function () {
  'use strict';

  let prevFocus = null;
  let promptFinalize = null;
  const FOCUSABLE = 'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';
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
  const PALETTE_STYLESHEET = 'palette-okabe.css';
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
  let playWindowEnsurePromise = null;
  const playWindowSubscribers = new Set();
  const UPDATE_LOG = [
    {
      date: '4 luglio 2026 · Release 4.12.16',
      items: [
        'Corrette diverse piccole imprecisioni segnalate dagli utenti: un distrattore poco chiaro in educazione civica e la spaziatura del messaggio bonus a fine partita.',
        'Migliorata l\'accessibilità per chi usa la modalità a contrasto elevato (Okabe-Ito): ogni materia ora mostra i colori pensati apposta per quella modalità invece del proprio colore abituale.',
        'Rinforzato il contrasto testo/sfondo su più elementi dell\'interfaccia per superare gli standard di accessibilità WCAG su tutte le materie.',
      ]
    },
    {
      date: '4 luglio 2026 · Release 4.12.9 - 4.12.13',
      items: [
        'Il sito ora scarica i dati di ogni materia solo quando serve davvero, invece di scaricarli tutti al primo avvio: molto più leggero su rete mobile.',
        'Aggiunto un contenuto minimo di riserva per inglese, problemi ed educazione civica nel raro caso in cui la connessione manchi al primo avvio.',
        'Sostituita l\'icona del sito con una versione molto più leggera, stessa immagine.',
      ]
    },
    {
      date: '3 luglio 2026 · Release 4.12.6 - 4.12.8',
      items: [
        'Aggiornato ovunque il conteggio reale delle domande disponibili (9.879), prima mostrato con numeri superati.',
        'Rinforzato il contrasto dei pulsanti di risposta (blu/verde/rosso) per una migliore leggibilità del testo.',
      ]
    },
    {
      date: '1 luglio 2026 · Release 4.12.0 - 4.12.5',
      items: [
        'Il gioco ora festeggia le serie di risposte corrette consecutive con un messaggio dedicato e la mascotte che esulta.',
        'Arricchite le pagine per genitori e insegnanti con una mappa di materie/argomenti per classe e consigli d\'uso pratici.',
        'Aggiunte centinaia di nuove domande di scienze per completare la copertura di tutte le classi.',
      ]
    },
    {
      date: '30 giugno 2026 · Release 4.11.0',
      items: [
        'Dopo ogni risposta compare ora una spiegazione del perché è corretta o sbagliata.',
        'Il gioco adatta gradualmente la difficoltà delle domande al livello di ogni bambina/o.',
        'Nuovo pulsante "Ripassa i tuoi errori" per rivedere solo le domande sbagliate in precedenza.',
        'Nuovo filtro per sotto-argomento dopo aver scelto l\'ambito, e un pannello "Progressi" con le statistiche delle ultime partite.',
        'Il dataset ha raggiunto le 9.900 domande totali, con controlli di qualità automatici più rigorosi su ogni nuovo contenuto.',
      ]
    },
    {
      date: '28 maggio 2026 · Release 4.10.2',
      items: [
        'Rimosso CSS legacy residuo dal post-refactor del motore quiz, con pulizia concentrata su inglese e fogli condivisi senza impatti visivi sulle pagine pubbliche.'
      ]
    },
    {
      date: '27 maggio 2026 · Release 4.10.1',
      items: [
        'Pulizia interna: rimossi file di gestione progetto erroneamente pubblicati. Nessun impatto sulle funzionalita del sito.'
      ]
    },
    {
      date: '27 maggio 2026 · Release 4.10.0',
      items: [
        'Aggiunto audit automatico Lighthouse sulle pull request e ogni giorno per controllare performance, accessibilita e SEO del sito.',
        'Soglie minime applicate: nessuna release puo abbassare la qualita misurata sotto i valori attuali.'
      ]
    },
    {
      date: '26 maggio 2026 · Release 4.9.5',
      items: [
        'Migliorata velocita iniziale caricamento aggiungendo hint DNS prefetch e preload dataset.',
        'Effetto piu evidente su mobile con connessione lenta.'
      ]
    },
    {
      date: '26 maggio 2026 · Release 4.9.4',
      items: [
        'ESLint è stato migrato al nuovo formato flat config, compatibile nativamente con ESLint 9 senza workaround legacy.',
        'Rimosso il vecchio file `.eslintrc.json`: il controllo JavaScript usa ora una configurazione unica `eslint.config.mjs`.',
        'I comandi npm di verifica restano invariati, ma senza più warning di deprecazione durante il lint JavaScript.'
      ]
    },
    {
      date: '26 maggio 2026 · Release 4.9.3',
      items: [
        'Aggiunti script npm unificati per lint, audit e verifiche locali del progetto.',
        'Configurati ESLint e Stylelint in assetto minimale per il codebase vanilla JavaScript/CSS, senza dipendenze runtime aggiuntive.',
        'Introdotto package-lock.json per rendere riproducibile il setup degli strumenti di sviluppo.'
      ]
    },
    {
      date: '26 maggio 2026 · Release 4.9.2',
      items: [
        'Ottimizzati gli asset della bacheca premi: 46 immagini PNG compresse mantenendo qualità visiva stabile e riducendo il peso totale di circa 10 MB.',
        'Aggiunto il formato WebP per lo sfondo principale della bacheca trofei con fallback PNG per compatibilità browser.',
        'I file reward restano caricati solo quando servono e disponibili offline dopo la prima visita alla pagina Premi.'
      ]
    },
    {
      date: '25 maggio 2026 · Release 4.9.1',
      items: [
        'Allineato il popup "Ultimi aggiornamenti" alla versione reale dell’applicazione.',
        'Aggiunte nel log info le release mancanti dalla 4.6.8 alla 4.9.0 per mantenere coerenza con footer e changelog.'
      ]
    },
    {
      date: '25 maggio 2026 · Release 4.9.0',
      items: [
        'Completata la riorganizzazione del motore quiz: tutte le 8 materie ora usano lo stesso runtime condiviso, eliminando 3.500 righe di codice duplicato.',
        'Sistema più semplice da mantenere e arricchire: aggiungere una nuova materia richiede ora circa 120 righe di configurazione invece di un motore dedicato.',
        'Verificato funzionamento su desktop, tablet e smartphone con installazione PWA, modalità offline e flusso di aggiornamento.'
      ]
    },
    {
      date: '25 maggio 2026 · Release 4.8.0',
      items: [
        'Inglese migrato al motore condiviso: livelli 1/2/3 con disponibilità basata sulla classe selezionata.',
        'Rendering bilingue dedicato: porzioni inglesi marcate per lettori di schermo e opzioni in italiano o inglese a seconda del tipo di domanda.',
        'Tutti i 463 quesiti inglese ora hanno la lingua delle risposte esplicita nel dataset.'
      ]
    },
    {
      date: '25 maggio 2026 · Release 4.7.1',
      items: [
        'Formalizzata la politica unica delle chiavi di stato runtime: ogni materia dichiara esplicitamente il proprio namespace senza fallback magici.',
        'Aggiunto un controllo di pubblicazione che blocca rilasci con configurazioni incoerenti.'
      ]
    },
    {
      date: '25 maggio 2026 · Release 4.7.0',
      items: [
        'Problemi migrato al motore condiviso con confronto numerico delle risposte (12 equivalente a 12,0 o 12.0).',
        'Corretto un comportamento residuo del caricamento dati: le domande bonus restano nel flow finale dedicato e non entrano più nella sessione standard di 10 domande.',
        'Storage progressi utenti preservato byte per byte durante la migrazione.'
      ]
    },
    {
      date: '24 maggio 2026 · Release 4.6.9',
      items: [
        'Educazione civica migrata al motore condiviso: distribuzione delle aree per classe gestita dichiarativamente con pesi configurabili.',
        'Storage progressi utenti civica preservato senza migrazione dati.',
        'Verifiche di regressione sulle altre materie già migrate: nessun impatto.'
      ]
    },
    {
      date: '24 maggio 2026 · Release 4.6.8',
      items: [
        'Migrazione JSON-only completata per civica, inglese e problemi: rimossi i dataset duplicati inline dalle pagine.',
        'Bonus questions ora idratate direttamente dai dataset JSON con bucket dedicati per facilità/media/difficile.',
        'Dataset totale aggiornato a 7.375 domande con audit automatico.'
      ]
    },
    {
      date: '24 maggio 2026 · Release 4.6.7',
      items: [
        'Aggiunto il contatore totale domande nel footer di home e chi-siamo, calcolato da json/index.json e aggiornato automaticamente a ogni release dati.',
        'Documentato il vincolo cache dei dataset JSON: /json/* deve restare con Cache-Control public, max-age=0, must-revalidate per evitare drift dati lato utente.'
      ]
    },
    {
      date: '24 maggio 2026 · Release 4.6.6',
      items: [
        'Completata la migrazione JSON-only per civica, inglese e problemi, eliminando il doppio binario dati tra runtime e file materia.',
        'Spostate anche le bonus questions nei JSON con bucket dedicati, così entrano nella stessa pipeline di audit dei dataset principali.',
        'Riallineati conteggi progetto e documentazione tecnica al nuovo totale di 7.375 domande.'
      ]
    },
    {
      date: '24 maggio 2026 · Release 4.6.5',
      items: [
        'Rimossi frammenti di codice non più utilizzati nel runtime condiviso e nell’editor interno.',
        'Confermata l’area admin come tool interno: autenticazione client-side non considerata protezione reale.',
        'Aggiornata la documentazione tecnica su export pubblico, source of truth dei dataset quiz e stato pagina supporto secondaria.'
      ]
    },
    {
      date: '24 maggio 2026 · Release 4.6.4',
      items: [
        'Aggiornate anche le icone PWA del manifest con il nuovo branding consegnato per la favicon.',
        'Mantenuti invariati nomi e percorsi pubblici delle icone per evitare cambi strutturali nel manifest.',
        'Allineata la versione cache per distribuire il nuovo set grafico anche alle installazioni già attive.'
      ]
    },
    {
      date: '24 maggio 2026 · Release 4.6.3',
      items: [
        'Aggiornata l’icona del sito con nuova favicon per tab browser e scorciatoie supportate.',
        'Rigenerate le varianti favicon e apple-touch per distribuire il branding in modo coerente.',
        'Allineata la versione cache per far arrivare le nuove icone anche ai client già attivi.'
      ]
    },
    {
      date: '24 maggio 2026 · Release 4.6.2',
      items: [
        'Rafforzato l’aggiornamento della PWA con controllo più stabile della cache applicativa.',
        'Documentato il vincolo di pubblicazione in root del dominio con rewrite compatibili.',
        'Reso più leggero il precache iniziale spostando gli asset più pesanti della bacheca premi al caricamento on-demand.'
      ]
    },
    {
      date: '23 maggio 2026 · Release 4.6.1',
      items: [
        'Migliorata la navigazione offline anche per Privacy, Cookie e Supporto con Satispay dopo il primo caricamento.',
        'Resi più coerenti i footer delle pagine Privacy e Cookie, evidenziando la pagina corrente senza link ridondanti.',
        'Ripuliti cache e stili legacy per distribuire gli aggiornamenti in modo più stabile.'
      ]
    },
    {
      date: '20 maggio 2026 · Release 4.5.31',
      items: [
        'Completata la pagina Premi con anteprima social, dati strutturati e collegamenti Privacy/Cookie.',
        'Aggiornata la FAQ con indicazioni su bacheca premi e download PNG/JPEG.',
        'Riallineati dati strutturati, sitemap e pulizie CSS per mantenere coerente la pubblicazione.'
      ]
    },
    {
      date: '20 maggio 2026 · Release 4.5.30',
      items: [
        'Riallineata la homepage centrando il contenitore principale e la griglia delle materie.',
        'Reso il pulsante Premi della testata coerente con il pulsante FAQ.',
        'Aggiornata la cache applicativa per distribuire subito il ritocco grafico.'
      ]
    },
    {
      date: '20 maggio 2026 · Release 4.5.29',
      items: [
        'Resa pubblica la pagina Premi con link visibile dalla homepage e descrizione di come sbloccare badge, coppe e trofei.',
        'Aggiornata la sitemap per includere la bacheca premi tra le pagine del sito.',
        'Confermato che i premi si conquistano solo completando le partite.'
      ]
    },
    {
      date: '20 maggio 2026 · Release 4.5.28',
      items: [
        'Aggiunta la bacheca premi locale con badge, coppe, coccarde e trofei sbloccabili giocando.',
        'Collegato il sistema premi ai risultati delle partite su tutte le materie, mantenendo salvataggio solo nel browser.',
        'Introdotta l’esportazione della bacheca in PNG o JPEG.'
      ]
    },
    {
      date: '18 maggio 2026 · Release 4.5.27',
      items: [
        'Corrette domande generate con etichette tecniche residue nei dataset di Italiano, Inglese e Matematica.',
        'Rifinite concordanze e formulazioni in Problemi, Scienze e Geografia per rendere più naturale il testo mostrato ai bambini.',
        'Aggiunto un audit automatico sui JSON delle materie per bloccare errori strutturali e pattern testuali non adatti alla pubblicazione.'
      ]
    },
    {
      date: '18 maggio 2026 · Release 4.5.26',
      items: [
        'Rimosse dal runtime pubblico le funzioni sperimentali non più in uso, mantenendo stabile il flusso quiz.',
        'Ripuliti collegamenti interni, cache offline e testi informativi collegati alle funzioni rimosse.',
        'Preparata la base per un futuro sistema di riconoscimenti locali, senza account, cookie o servizi esterni.'
      ]
    },
    {
      date: '17 maggio 2026 · Release 4.5.22',
      items: [
        'Avvicinato il sottotitolo della homepage al titolo principale per rendere la hero più compatta.',
        'Mantenuto il centraggio del nome “La Scuola Amica” rispetto alla pagina.',
        'Aggiornata la cache applicativa per distribuire il ritocco grafico.'
      ]
    },
    {
      date: '17 maggio 2026 · Release 4.5.21',
      items: [
        'Ridotta la mascotte nel titolo della homepage a una dimensione più discreta.',
        'Mantenuta la stessa posizione accanto al nome del sito, senza alterare navigazione o accessibilità.',
        'Aggiornata la cache applicativa per distribuire subito il ritocco grafico.'
      ]
    },
    {
      date: '17 maggio 2026 · Release 4.5.20',
      items: [
        'Spostata la mascotte Cervellino nel titolo della homepage al posto dell’emoji, con dimensione allineata al testo.',
        'Rimossa la mascotte grande sopra la scritta “La Scuola Amica” per rendere la hero più compatta e pulita.',
        'Aggiornata la cache applicativa per distribuire correttamente il ritocco grafico anche in modalità offline.'
      ]
    },
    {
      date: '17 maggio 2026 · Release 4.5.19',
      items: [
        'Migliorato il contrasto di score bar e pulsanti principali nelle pagine quiz, mantenendo colori e icone come supporto visivo.',
        'Verificato il layout su smartphone, tablet, desktop e schermo ampio tipo LIM, senza overflow orizzontale nelle pagine campione.',
        'Aggiornata la cache applicativa per distribuire correttamente i ritocchi visivi anche in modalità offline.'
      ]
    },
    {
      date: '14 maggio 2026 · Release 4.5.18',
      items: [
        'Applicato un pass SEO leggero su scienze e italiano per rendere più chiaro l’intento didattico delle due pagine senza appesantire il copy.',
        'Allineati titoli, descrizioni, card social e dati strutturati a ricerche più naturali su esercizi di scienze e di italiano per la scuola primaria.',
        'Rifiniti anche i blocchi statici visibili per migliorare pertinenza semantica e coerenza tra snippet e contenuto reale.'
      ]
    },
    {
      date: '14 maggio 2026 · Release 4.5.17',
      items: [
        'Ottimizzati snippet e contenuti SEO di geografia, storia e FAQ per rafforzare rilevanza, chiarezza e tasso di clic dalle ricerche informative.',
        'Allineati titoli, descrizioni e dati strutturati delle tre pagine con i bisogni reali emersi in Search Console: esercizi, quiz, privacy e uso offline.',
        'Resi più espliciti nei testi visibili i riferimenti a esercizi di geografia, quiz di storia e domande frequenti su registrazione, timer e funzionamento offline.'
      ]
    },
    {
      date: '14 maggio 2026 · Release 4.5.16',
      items: [
        'Ottimizzati snippet e testi SEO di inglese, educazione civica e matematica per allinearli meglio alle query già emerse in Search Console.',
        'Rafforzati titoli, descrizioni e contenuti statici delle tre pagine più promettenti per migliorare pertinenza e tasso di clic.',
        'Aggiornati anche i metadati strutturati per rendere coerenti contenuto visibile, meta tag e descrizioni semantiche.'
      ]
    },
    {
      date: '14 maggio 2026 · Release 4.5.15',
      items: [
        'Compattate le classifiche dei quiz e di inglese, così su smartphone restano più leggibili senza colonne superflue.',
        'Mantenuti i dettagli utili di punteggio in modo discreto, senza appesantire la lettura principale per bambini e genitori.'
      ]
    },
    {
      date: '14 maggio 2026 · Release 4.5.14',
      items: [
        'Corrette alcune segnalazioni di qualità sul runtime: footer versione coerente, precache del Service Worker ripulita e score-bar più robusta in assenza di elementi DOM.',
        'Ripulito il motore inglese rimuovendo codice timer inattivo, migliorando l’accessibilità dei livelli bloccati e impedendo confetti residui dopo la navigazione.'
      ]
    },
    {
      date: '8 maggio 2026 · Release 4.5.10',
      items: [
        'Rimossi gli ultimi stili runtime applicati via attributo, con refactor verso classi CSS condivise.',
        'Reso più severo il Content Security Policy sul fronte degli style attribute per ridurre ulteriormente la superficie di attacco.',
        'Aggiornata la cache applicativa per distribuire in sicurezza il nuovo runtime compatibile con la CSP più stretta.'
      ]
    },
    {
      date: '7 maggio 2026 · Release 4.5.8',
      items: [
        'Migliorati i segnali per i crawler per separare meglio i contenuti pubblici dalle aree tecniche.',
        'Aggiornata la sitemap con date di modifica più affidabili per riflettere meglio gli ultimi cambiamenti.',
        'Ottimizzati i contenuti dati del sito per ridurre il peso dei caricamenti e migliorare la rapidità d’uso.',
        'Ridotto ulteriormente l’uso di stili inline con una struttura CSS più ordinata e sicura.'
      ]
    },
    {
      date: '7 maggio 2026 · Release 4.5.7',
      items: [
        'Rilasciata la versione 4.5.7 con versione portale riallineata automaticamente nel footer e nel pannello Info.',
        'Esteso il caricamento tipografico ottimizzato anche alle pagine materia, FAQ e pagine informative.',
        'Attivate le funzioni condivise anche nelle pagine informative: pannello Info, palette accessibile e preferenza “Meno animazioni”.',
        'Allineati i segnali per motori di ricerca e sistemi di risposta con una comunicazione pubblica più coerente.',
        'Ottimizzati gli asset di Cervellino per ridurre il peso delle immagini e migliorare la velocità su mobile.'
      ]
    },
    {
      date: '7 maggio 2026',
      items: [
        'Introdotto il timer locale di gioco: per iniziare una partita bisogna attivare 30 minuti validi su tutte le materie.',
        'Aggiunta una pausa automatica di 60 minuti dopo la scadenza del timer prima di poter riattivare un nuovo turno.',
        'Ridisegnato il timer nella home in forma più discreta, lasciando più esplicite le schermate iniziali delle materie.',
        'Aggiornate le FAQ pubbliche con spiegazione del nuovo flusso di gioco, del funzionamento offline e della pausa locale.'
      ]
    },
    {
      date: '1 maggio 2026',
      items: [
        'Rilasciata la versione 4.5.5 con allineamento completo della numerazione applicativa su tutte le pagine.',
        'Migliorata l’ergonomia dei toggle Palette/Animazioni con target touch minimo 44px e testi più leggibili.',
        'Allineati i testi Privacy e FAQ con il nuovo flusso di cancellazione dati locali.',
        'Versione portale aggiornata alla 4.5.5.'
      ]
    },
    {
      date: '30 aprile 2026',
      items: [
        'Completata la sostituzione dei dialog nativi con finestre integrate più coerenti nei flussi principali.',
        'Allineata la preferenza “Meno animazioni” anche lato JavaScript su home e motori quiz dedicati.',
        'Disattivata l’esplosione confetti in inglese quando la riduzione movimento è attiva.',
        'Automatizzati gli aggiornamenti dei contenuti strutturati e della sitemap prima della pubblicazione.',
        'Sincronizzata la documentazione tecnica repository/wiki con gli ultimi fix operativi.'
      ]
    },
    {
      date: '29 aprile 2026',
      items: [
        'Migliorata la stabilità offline delle pagine con URL puliti e continuità d’uso anche senza connessione.',
        'Allineato il meta `mobile-web-app-capable` su tutte le pagine pubbliche.',
        'Completato il caricamento locale dei font principali per rendere più stabile la prima visita.',
        'Aggiornata documentazione tecnica (README + wiki) con gli ultimi fix di runtime e deploy.',
        'Versione portale aggiornata alla 4.5.2.'
      ]
    },
    {
      date: '28 aprile 2026',
      items: [
        'Aggiornato il profilo GEO/SEO: founder e foundingDate nell’Organization JSON-LD.',
        'Aggiunto numberOfQuestions nei JSON-LD delle 8 materie con conteggi reali.',
        'Aggiornate FAQ e llms.txt con dati quantitativi progetto (oltre 7.300 / totale 7.348 domande).',
        'Esteso il supporto “Meno animazioni” a FAQ e pagine informative.',
        'Versione portale aggiornata alla 4.5.1.'
      ]
    },
    {
      date: '27 aprile 2026',
      items: [
        'Audit UX/UI completato: testi piccoli aumentati, contrasti migliorati e touch target principali allineati.',
        'Aggiunta mascotte "Gufo Cervellino" (🦉) nelle pagine quiz con reazioni durante le risposte.',
        'Introdotto toggle “Meno animazioni” nel pannello Info con preferenza salvata nel browser.',
        'Ridotte animazioni decorative per migliorare concentrazione durante il gioco.',
        'Spostate le sezioni SEO descrittive fuori dalla card interattiva principale nelle materie.',
        'Aggiunte le pagine Per insegnanti, Per genitori e Informazioni AI con metadata SEO/JSON-LD dedicati.',
        'Aggiornati sitemap e redirect con le nuove rotte pubbliche.',
        'Migliorata la semantica FAQ usando struttura lista ul/li con details nativi.',
        'Aggiunti skip link anche alle pagine statiche di supporto e accessibilità.',
        'Introdotte Open Graph image dedicate per FAQ, Supporto, Accessibilità e nuove pagine informative.',
        'Aggiunta licenza MIT nel repository.'
      ]
    },
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
        'Allineati metadati e conteggi nei file json per materia e index aggregato.'
      ]
    },
    {
      date: '13 aprile 2026',
      items: [
        'Aggiornate canonical, URL Open Graph e JSON-LD sulle rotte senza estensione .html.',
        'Allineati i link interni e la sitemap ai percorsi canonici (es. /matematica, /faq, /supporta).',
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

  function getPlayWindowState() {
    const record = parsePlayWindowRecord(storageGet(PLAY_WINDOW_KEY));
    if (!record) {
      return {
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
      state && state.active ? '1' : '0',
      state && state.coolingDown ? '1' : '0',
      safeInt(state?.startedAt, 0),
      safeInt(state?.expiresAt, 0),
      safeInt(state?.cooldownUntil, 0)
    ].join('|');
  }

  function formatPlayWindowClock(ms) {
    const totalSeconds = Math.max(0, Math.ceil((Number(ms) || 0) / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  function notifyPlayWindowSubscribers(state) {
    playWindowSubscribers.forEach((renderFn) => {
      try {
        renderFn(state);
      } catch (e) {
        debugWarn('notifyPlayWindowSubscribers', e);
      }
    });
  }

  function dispatchPlayWindowChange(state, force) {
    const snapshot = state || getPlayWindowState();
    syncPlayWindowTicker(snapshot);
    const stateKey = getPlayWindowStateKey(snapshot);
    if (!force && stateKey === lastPlayWindowBroadcastKey) {
      notifyPlayWindowSubscribers(snapshot);
      return snapshot;
    }
    lastPlayWindowBroadcastKey = stateKey;
    notifyPlayWindowSubscribers(snapshot);
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
    return dispatchPlayWindowChange({
      active: true,
      expired: false,
      coolingDown: false,
      startedAt,
      expiresAt,
      cooldownUntil,
      durationMs: PLAY_WINDOW_DURATION_MS,
      cooldownMs: PLAY_WINDOW_COOLDOWN_MS,
      remainingMs: PLAY_WINDOW_DURATION_MS,
      cooldownRemainingMs: PLAY_WINDOW_COOLDOWN_MS
    }, true);
  }

  function clearPlayWindow() {
    storageRemove(PLAY_WINDOW_KEY);
    return dispatchPlayWindowChange({
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
    }, true);
  }

  async function ensurePlayWindowActive(options) {
    const current = getPlayWindowState();
    if (current.active) return true;
    if (current.coolingDown) {
      await promptAlert(
        `I 30 minuti di gioco sono finiti. Prima di tornare a giocare bisogna aspettare 60 minuti. Potrai riattivare il timer tra ${formatPlayWindowClock(current.cooldownRemainingMs)}.`,
        {
          title: 'Pausa tra una sessione e l’altra',
          okLabel: 'Va bene'
        }
      );
      return false;
    }
    if (playWindowEnsurePromise) return playWindowEnsurePromise;

    const config = options || {};
    playWindowEnsurePromise = (async () => {
      const accepted = await promptConfirm(
        config.message || 'Per iniziare devi attivare 30 minuti di gioco su questo dispositivo. Quando i 30 minuti finiscono, bisogna aspettare 60 minuti prima di poter tornare a giocare. Il timer non usa cookie, non richiede login e funziona anche offline.',
        {
          title: config.title || 'Attiva 30 minuti di gioco',
          confirmLabel: config.confirmLabel || 'Attiva 30 minuti',
          cancelLabel: config.cancelLabel || 'Non ora'
        }
      );
      if (!accepted) return false;
      startPlayWindow();
      return true;
    })();

    try {
      return await playWindowEnsurePromise;
    } finally {
      playWindowEnsurePromise = null;
    }
  }

  function isProjectStorageKey(key) {
    const value = String(key || '');
    if (!value) return false;
    return (
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

  function openModal(id) {
    const overlay = document.getElementById(id);
    if (!overlay) return;

    prevFocus = document.activeElement;
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    if (window.SADom && typeof window.SADom.lockScroll === 'function') {
      window.SADom.lockScroll(true);
    } else {
      document.body.classList.add('modal-open');
    }

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
      if (window.SADom && typeof window.SADom.lockScroll === 'function') {
        window.SADom.lockScroll(false);
      } else {
        document.body.classList.remove('modal-open');
      }
    }

    if (prevFocus && typeof prevFocus.focus === 'function') {
      prevFocus.focus();
      prevFocus = null;
    }
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

    box.appendChild(closeBtn);
    box.appendChild(title);
    box.appendChild(body);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
  }

  function showPromptDialog(options) {
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

    if (typeof promptFinalize === 'function') {
      promptFinalize(false);
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
      openModal(PROMPT_MODAL_ID);
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
      confirmLabel: options && options.okLabel
    }).then(() => {});
  }

  function insertNodeAfter(target, node) {
    if (!target || !target.parentNode || !node) return;
    if (target.nextSibling) {
      target.parentNode.insertBefore(node, target.nextSibling);
      return;
    }
    target.parentNode.appendChild(node);
  }

  function ensurePlayWindowPanel(panel, options) {
    const target = panel || document.createElement('section');
    target.classList.add('play-window-panel');
    target.setAttribute('data-play-window-panel', '1');
    if (options?.context) target.dataset.context = options.context;
    target.setAttribute('aria-live', 'polite');
    target.setAttribute('aria-atomic', 'true');

    let kicker = target.querySelector('.play-window-kicker');
    if (!kicker) {
      kicker = document.createElement('div');
      kicker.className = 'play-window-kicker';
      target.appendChild(kicker);
    }
    kicker.textContent = 'Tempo di gioco';

    let status = target.querySelector('.play-window-status');
    if (!status) {
      status = document.createElement('p');
      status.className = 'play-window-status';
      target.appendChild(status);
    }

    let actions = target.querySelector('.play-window-actions');
    if (!actions) {
      actions = document.createElement('div');
      actions.className = 'play-window-actions';
      target.appendChild(actions);
    }

    let timer = actions.querySelector('.play-window-timer');
    if (!timer) {
      timer = document.createElement('strong');
      timer.className = 'play-window-timer';
      actions.appendChild(timer);
    }
    timer.textContent = '30:00';

    let button = actions.querySelector('.play-window-btn');
    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.className = 'play-window-btn';
      actions.appendChild(button);
    }
    if (!button.hasAttribute('type')) button.type = 'button';
    button.textContent = 'Attiva 30 minuti';

    let note = target.querySelector('.play-window-note');
    if (!note) {
      note = document.createElement('p');
      note.className = 'play-window-note';
      target.appendChild(note);
    }
    note.textContent = 'Solo sul dispositivo, nessun login, nessun cookie, funziona anche offline.';

    if (button.dataset.playWindowBound !== '1') {
      button.addEventListener('click', () => {
        const state = getPlayWindowState();
        if (state.active) return;
        startPlayWindow();
      });
      button.dataset.playWindowBound = '1';
    }

    const render = (state) => {
      const snapshot = state || getPlayWindowState();
      target.classList.toggle('is-active', snapshot.active);
      target.classList.toggle('is-expired', !snapshot.active && snapshot.expired);
      target.classList.toggle('is-cooldown', snapshot.coolingDown);

      if (snapshot.active) {
        status.textContent = 'Timer attivo: puoi giocare liberamente su tutte le materie per 30 minuti. Quando il tempo finisce, bisogna aspettare 60 minuti prima di poter tornare a giocare.';
        timer.textContent = formatPlayWindowClock(snapshot.remainingMs);
        button.textContent = 'Timer attivo';
        button.disabled = true;
        button.setAttribute('aria-disabled', 'true');
        return;
      }

      timer.textContent = '30:00';
      button.disabled = false;
      button.setAttribute('aria-disabled', 'false');
      if (snapshot.coolingDown) {
        status.textContent = 'I 30 minuti sono terminati. Adesso bisogna aspettare 60 minuti prima di poter tornare a giocare.';
        timer.textContent = formatPlayWindowClock(snapshot.cooldownRemainingMs);
        button.textContent = 'Disponibile tra';
        button.disabled = true;
        button.setAttribute('aria-disabled', 'true');
        return;
      }
      if (snapshot.expired) {
        status.textContent = 'I 30 minuti sono terminati. Per continuare a giocare bisogna prima aspettare 60 minuti.';
        button.textContent = 'Riattiva 30 minuti';
      } else {
        status.textContent = 'Per iniziare a giocare attiva 30 minuti di gioco su questo dispositivo. Dopo i 30 minuti bisogna aspettare 60 minuti prima di poter tornare a giocare.';
        button.textContent = 'Attiva 30 minuti';
      }
    };

    if (target.dataset.playWindowReady !== '1') {
      playWindowSubscribers.add(render);
      target.dataset.playWindowReady = '1';
    }
    render(getPlayWindowState());
    return target;
  }

  function ensurePlayWindowPanelUi() {
    const homeFacts = document.querySelector('.main-facts');
    let homePanel = document.querySelector('[data-play-window-panel][data-context="home"]');
    if (homeFacts && !homePanel) {
      homePanel = ensurePlayWindowPanel(null, { context: 'home' });
      homePanel.classList.add('play-window-panel-home');
      insertNodeAfter(homeFacts, homePanel);
    } else if (homePanel) {
      homePanel.classList.add('play-window-panel-home');
      ensurePlayWindowPanel(homePanel, { context: 'home' });
    }

    const startBtn = document.querySelector('#screenStart .start-btn');
    let subjectPanel = document.querySelector('[data-play-window-panel][data-context="subject-start"]');
    if (subjectPanel) {
      subjectPanel.classList.add('play-window-panel-start');
      ensurePlayWindowPanel(subjectPanel, { context: 'subject-start' });
    } else if (startBtn) {
      subjectPanel = ensurePlayWindowPanel(null, { context: 'subject-start' });
      subjectPanel.classList.add('play-window-panel-start');
      startBtn.parentNode.insertBefore(subjectPanel, startBtn);
    }

  }

  function ensurePlayWindowScorePill() {
    const scoreBar = document.getElementById('scoreBar');
    if (!scoreBar || scoreBar.querySelector('[data-play-window-pill="1"]')) return;

    const pill = document.createElement('div');
    pill.className = 'score-pill timer play-window-score-pill';
    pill.setAttribute('data-play-window-pill', '1');

    const icon = document.createElement('span');
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = '⏳';

    const value = document.createElement('span');
    value.setAttribute('data-play-window-pill-value', '');
    value.textContent = '30:00';

    const srText = document.createElement('span');
    srText.className = 'sr-only';
    srText.textContent = ' tempo di gioco rimasto';

    pill.appendChild(icon);
    pill.appendChild(document.createTextNode(' '));
    pill.appendChild(value);
    pill.appendChild(srText);
    scoreBar.appendChild(pill);

    const valueEl = pill.querySelector('[data-play-window-pill-value]');
    const render = (state) => {
      const snapshot = state || getPlayWindowState();
      const active = snapshot.active;
      valueEl.textContent = active ? formatPlayWindowClock(snapshot.remainingMs) : '00:00';
      pill.hidden = !active;
      pill.setAttribute('aria-hidden', active ? 'false' : 'true');
    };

    playWindowSubscribers.add(render);
    render(getPlayWindowState());
  }

  function bindPlayWindowStorageSync() {
    if (SA_FLAGS.playWindowStorageSyncBound) return;
    window.addEventListener('storage', (event) => {
      if (event.key && event.key !== PLAY_WINDOW_KEY) return;
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
        document.querySelectorAll('.modal-overlay.open').forEach((modal) => closeModal(modal.id));
      });
      SA_FLAGS.sharedEscHandlerBound = true;
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

        const askToUpdate = async (worker) => {
          if (!worker || !navigator.serviceWorker.controller) return;
          let shouldUpdate = false;
          if (SA.ui && typeof SA.ui.confirm === 'function') {
            shouldUpdate = await SA.ui.confirm('È disponibile una nuova versione. Vuoi aggiornare ora?', {
              title: 'Nuova versione disponibile',
              confirmLabel: 'Aggiorna ora',
              cancelLabel: 'Più tardi'
            });
          } else {
            shouldUpdate = confirm('È disponibile una nuova versione. Aggiornare ora?');
          }
          if (shouldUpdate) {
            shouldRefresh = true;
            worker.postMessage('skipWaiting');
          }
        };

        try {
          const reg = await navigator.serviceWorker.register('/sw.js', {
            updateViaCache: 'none'
          });

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

    box.appendChild(closeBtn);
    box.appendChild(title);
    box.appendChild(body);
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
    if (SA.questionsLoader && typeof SA.questionsLoader.loadIndex === 'function') {
      return SA.questionsLoader.loadIndex();
    }
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
      el.textContent = `${new Intl.NumberFormat('it-IT').format(total)} domande disponibili`;
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

    body.appendChild(intro);
    body.appendChild(actions);
    body.appendChild(paletteRow);
    body.appendChild(motionRow);

    box.appendChild(closeBtn);
    box.appendChild(title);
    box.appendChild(body);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    updatePaletteToggleState(overlay);
    updateMotionToggleState(overlay);
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
    const versionText = APP_VERSION;
    if (version) {
      version.hidden = true;
      version.setAttribute('aria-hidden', 'true');
    }

    ensureInfoHubModal({ privacyId, cookieId, version: versionText });

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
      .play-window-panel{
        width:100%;
        margin:14px 0 0;
        padding:14px 16px;
        border-radius:18px;
        border:2px solid rgba(45,108,223,.18);
        background:linear-gradient(135deg,#ffffff,#f4f8ff);
        box-shadow:0 10px 24px rgba(45,108,223,.10);
      }
      .play-window-panel-home{
        max-width:620px;
        margin:14px auto 0;
        padding:6px 0 6px;
        border:0;
        background:transparent;
        box-shadow:none;
      }
      .play-window-panel-home .play-window-kicker,
      .play-window-panel-home .play-window-status,
      .play-window-panel-home .play-window-note{
        display:none;
      }
      .play-window-panel-home .play-window-actions{
        align-items:center;
        justify-content:center;
        gap:10px;
      }
      .play-window-panel-home .play-window-timer{
        min-width:78px;
        padding:8px 10px;
        font-size:1rem;
      }
      .play-window-panel-home .play-window-btn{
        display:inline-flex;
        align-items:center;
        justify-content:center;
        min-height:44px;
        padding:0 16px;
        line-height:1;
        font-size:.9rem;
      }
      .play-window-panel-home.is-active,
      .play-window-panel-home.is-expired{
        border:0;
        background:transparent;
        box-shadow:none;
      }
      .play-window-kicker{
        margin:0 0 6px;
        font-size:.82rem;
        font-weight:900;
        letter-spacing:.06em;
        text-transform:uppercase;
        color:#2d6cdf;
      }
      .play-window-status{
        margin:0 0 10px;
        color:#42586d;
        font-size:.96rem;
        font-weight:800;
        line-height:1.45;
      }
      .play-window-actions{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:12px;
        flex-wrap:wrap;
      }
      .play-window-timer{
        display:inline-flex;
        align-items:center;
        justify-content:center;
        min-width:88px;
        padding:8px 12px;
        border-radius:999px;
        background:#eef4ff;
        color:#1f3f73;
        font-size:1.2rem;
        line-height:1;
        font-weight:900;
      }
      .play-window-btn{
        border:0;
        border-radius:999px;
        min-height:46px;
        padding:12px 18px;
        background:linear-gradient(135deg,#2d6cdf,#4d8dff);
        color:#fff;
        font-size:.96rem;
        line-height:1.2;
        font-weight:900;
        cursor:pointer;
        box-shadow:0 6px 16px rgba(45,108,223,.24);
      }
      .play-window-btn:hover{
        filter:brightness(1.04);
      }
      .play-window-btn[disabled]{
        cursor:default;
        background:linear-gradient(135deg,#2f9d62,#49bf7c);
        box-shadow:none;
      }
      .play-window-note{
        margin:10px 0 0;
        color:#5d7082;
        font-size:.82rem;
        font-weight:700;
        line-height:1.45;
      }
      .play-window-panel.is-active{
        border-color:rgba(47,157,98,.28);
        background:linear-gradient(135deg,#ffffff,#f2fff7);
        box-shadow:0 10px 24px rgba(47,157,98,.12);
      }
      .play-window-panel.is-active .play-window-kicker{
        color:#2f9d62;
      }
      .play-window-panel.is-expired{
        border-color:rgba(214,40,40,.24);
        background:linear-gradient(135deg,#ffffff,#fff5f5);
        box-shadow:0 10px 24px rgba(214,40,40,.10);
      }
      .play-window-panel.is-expired .play-window-kicker{
        color:#b43a3a;
      }
      .play-window-score-pill{
        margin-left:auto;
      }
      .play-window-score-pill[hidden]{
        display:none !important;
      }
      html[data-palette="okabe-ito"] .play-window-panel{
        border-color:rgba(0,114,178,.22);
        background:linear-gradient(135deg,#ffffff,#eef8ff);
        box-shadow:0 10px 24px rgba(0,114,178,.12);
      }
      html[data-palette="okabe-ito"] .play-window-kicker{
        color:#0072B2;
      }
      html[data-palette="okabe-ito"] .play-window-status{
        color:#1f2d3d;
      }
      html[data-palette="okabe-ito"] .play-window-timer{
        background:#e6f4fc;
        color:#0b3a53;
      }
      html[data-palette="okabe-ito"] .play-window-btn{
        background:linear-gradient(135deg,#0072B2,#009ad6);
        box-shadow:0 6px 16px rgba(0,114,178,.22);
      }
      html[data-palette="okabe-ito"] .play-window-btn[disabled]{
        background:linear-gradient(135deg,#2c7b5b,#3b9d74);
        box-shadow:none;
      }
      html[data-palette="okabe-ito"] .play-window-note{
        color:#405466;
      }
      html[data-palette="okabe-ito"] .play-window-panel-home,
      html[data-palette="okabe-ito"] .play-window-panel-home.is-active,
      html[data-palette="okabe-ito"] .play-window-panel-home.is-expired{
        border:0;
        background:transparent;
        box-shadow:none;
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
        .play-window-actions{
          align-items:stretch;
        }
        .play-window-timer,
        .play-window-btn{
          width:100%;
        }
        .play-window-panel-home .play-window-timer,
        .play-window-panel-home .play-window-btn{
          width:auto;
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
    ensurePlayWindowPanelUi();
    ensurePlayWindowScorePill();
    ensurePlayWindowTicker();
    bindPlayWindowStorageSync();
    bindModalEvents();
  }

  SA.modal = SA.modal || {};
  SA.modal.open = openModal;
  SA.modal.close = closeModal;
  SA.palette = {
    get mode() {
      return document.documentElement.getAttribute('data-palette') || PALETTE_MODE.LEGACY;
    },
    set(mode) {
      return setPaletteMode(mode);
    },
    modes: { ...PALETTE_MODE }
  };
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
  SA.renderQuestionsTotal = renderQuestionsTotal;
  SA.playWindow = {
    key: PLAY_WINDOW_KEY,
    durationMs: PLAY_WINDOW_DURATION_MS,
    getState: getPlayWindowState,
    isActive() {
      return getPlayWindowState().active;
    },
    start: startPlayWindow,
    clear: clearPlayWindow,
    ensureActive: ensurePlayWindowActive,
    eventName: PLAY_WINDOW_EVENT
  };
  SA.version = APP_VERSION;

  initPaletteMode();
  initMotionMode();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSharedUi, { once: true });
  } else {
    initSharedUi();
  }

  dispatchPlayWindowChange(getPlayWindowState(), true);
  registerServiceWorker();
})();
