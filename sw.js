// ============================================================
// La Scuola Amica — Service Worker
// Strategia: Cache First per le risorse statiche,
// Network First con fallback per tutto il resto.
// ============================================================

// Stesso vincolo Trusted Types di shared.js (la CSP con require-trusted-types-for
// 'script' si applica anche alla risposta di questo file): importScripts() e' uno
// script URL sink e rifiuta una stringa semplice. URL fisso, nessun input esterno.
(function importAppVersion() {
  let url = '/app-version.js';
  if (self.trustedTypes && typeof self.trustedTypes.createPolicy === 'function') {
    try {
      const policy = self.trustedTypes.createPolicy('sa-sw-import', { createScriptURL: (u) => u });
      url = policy.createScriptURL('/app-version.js');
    } catch (e) {
      // policy non creabile: tenta comunque con la stringa semplice
    }
  }
  importScripts(url);
})();

// Release 4.21.0: riga cambiata solo perche' il browser veda sw.js nuovo e
// rinnovi la cache delle pagine (footer con i link social).
const CACHE_NAME = (self.SA && self.SA.cacheName) || 'lascuolaamica-v1';

// Cache stabili: NON derivano da APP_VERSION, quindi activate non le tocca.
// Font, icone, mascotte, immagini OG e premi non cambiano a ogni release:
// legarle alla versione significava ri-scaricare ~2,8 MB di asset identici a
// ogni patch, e cancellare i 3,9 MB di /premi che il bambino aveva gia'
// sbloccato e visto offline.
//
// CONTRATTO: un file servito da queste cache e' immutabile per nome. Per
// sostituirne uno o si cambia il nome del file, o si alza il suffisso qui
// sotto (prepublish-check.sh lo verifica). Vale anche per gli header:
// _headers marca /assets/*, /icons/* e /screenshots/* come immutable.
//
// I json/*.json restano nella cache versionata: sono contenuto che cambia con
// le release, e servirli stale significherebbe nascondere domande corrette.
const ASSETS_CACHE_NAME = 'lascuolaamica-assets-v1';
const REWARDS_CACHE_NAME = 'lascuolaamica-rewards-v1';
const KEEP_CACHE_NAMES = [CACHE_NAME, ASSETS_CACHE_NAME, REWARDS_CACHE_NAME];

// Shell minima: se queste risorse non sono disponibili
// l'installazione deve fallire (app non consistente).
const CORE_PRECACHE_URLS = [
  '/',
  '/tokens.css',
  '/index.css',
  '/404.css',
  '/fonts.css',
  '/noscript.css',
  '/utilities.css',
  '/rewards.css',
  '/shared.js',
  '/app-version.js',
  '/manifest.json',
  '/questions-loader.js',
  '/subject-quiz-core.js',
  '/subject-quiz-theme.css',
  '/js/dom-utils.js',
  '/js/lazy-css.js',
  '/js/tabelline-calcolatore.js',
  '/js/index-page.js',
  '/js/rewards.js',
  '/json/index.json'
];

// Risorse aggiuntive: se una manca, il SW resta installabile.
// Questo evita failure atomiche di cache.addAll su un singolo 404.
// Nota: le domande (json/<materia>/c<N>.json) NON sono precachate qui (erano
// ~7.9MB totali scaricati all'install per ogni utente, anche per le 7 materie
// mai aperte).
// Restano cacheable via isSameOriginStaticAsset (estensione .json) quindi
// vengono comunque salvati offline al primo fetch reale della materia, e
// refetchOpenedJson li riporta nella cache nuova a ogni cambio di versione.
// Le pagine HTML non ci sono: precachate erano 25 richieste di pagina a ogni
// install e a ogni versione, contate da Cloudflare come visualizzazioni. Una
// pagina entra in cache quando viene aperta (networkFirstWithFallback) e
// carryVisitedHtml la porta nella cache nuova. Restano qui CSS e JS delle
// pagine, perche' una pagina salvata funzioni offline.
const OPTIONAL_PRECACHE_URLS = [
  '/inglese.css',
  '/breakout.css',
  '/bosco.css',
  '/sistema-solare.css',
  '/faq.css',
  '/info-pages.css',
  '/link.css',
  '/js/matematica-page.js',
  '/js/inglese-page.js',
  '/js/problemi-page.js',
  '/js/civica-page.js',
  '/js/geografia-page.js',
  '/js/storia-page.js',
  '/js/scienze-page.js',
  '/js/italiano-page.js',
  '/js/breakout.js',
  '/js/bosco.js',
  '/js/sistema-solare-dati.json',
  '/js/sistema-solare-testi.json',
  '/js/sistema-solare-motore.js',
  '/js/sistema-solare.js',
  '/js/faq-page.js',
  '/palette-okabe.css',
  '/robots.txt',
  '/sitemap.xml',
  '/screenshots/home-390x844.webp',
  '/screenshots/home-1280x720.webp',
  '/screenshots/og-home-1200x630.jpg',
  '/screenshots/og-matematica-1200x630.jpg',
  '/screenshots/og-tabelline-1200x630.jpg',
  '/screenshots/og-inglese-1200x630.jpg',
  '/screenshots/og-problemi-1200x630.jpg',
  '/screenshots/og-civica-1200x630.jpg',
  '/screenshots/og-geografia-1200x630.jpg',
  '/screenshots/og-storia-1200x630.jpg',
  '/screenshots/og-scienze-1200x630.jpg',
  '/screenshots/og-italiano-1200x630.jpg',
  '/screenshots/og-bosco-1200x630.jpg',
  '/screenshots/og-sistema-solare-1200x630.jpg',
  '/screenshots/og-chi-siamo-1200x630.jpg',
  '/screenshots/og-faq-1200x630.jpg',
  '/screenshots/og-supporta-1200x630.jpg',
  '/screenshots/og-accessibilita-1200x630.jpg',
  '/screenshots/og-per-insegnanti-1200x630.jpg',
  '/screenshots/og-per-genitori-1200x630.jpg',
  '/screenshots/og-ai-info-1200x630.jpg',
  '/favicon.svg',
  '/favicon.ico',
  '/icons/favicon-16x16.png',
  '/icons/favicon-32x32.png',
  '/icons/apple-touch-icon.png',
  '/icons/icon-192.png',
  '/icons/icon-192-maskable.png',
  '/icons/icon-512.png',
  '/icons/icon-512-maskable.png',
  '/assets/fonts/fredoka-v17-latin-700.woff2',
  '/assets/fonts/nunito-v32-latin-regular.woff2',
  '/assets/fonts/nunito-v32-latin-700.woff2',
  '/assets/fonts/nunito-v32-latin-800.woff2',
  '/assets/fonts/nunito-v32-latin-900.woff2',
  '/assets/mascotte/cervellino-neutral.avif',
  '/assets/mascotte/cervellino-neutral.webp',
  '/assets/mascotte/cervellino-neutral.png',
  '/assets/mascotte/cervellino-happy.avif',
  '/assets/mascotte/cervellino-happy.webp',
  '/assets/mascotte/cervellino-happy.png',
  '/assets/mascotte/cervellino-sad.avif',
  '/assets/mascotte/cervellino-sad.webp',
  '/assets/mascotte/cervellino-sad.png',
  '/assets/mascotte/cervellino-celebrate.avif',
  '/assets/mascotte/cervellino-celebrate.webp',
  '/assets/mascotte/cervellino-celebrate.png',
  '/assets/mascotte/cervellino-waving-03.avif',
  '/assets/mascotte/cervellino-waving-03.webp',
  '/assets/mascotte/cervellino-waving-03.png'
];

const PRECACHE_URLS = CORE_PRECACHE_URLS.concat(OPTIONAL_PRECACHE_URLS);
const PRECACHE_PATHS = new Set(PRECACHE_URLS);
// bin: i modelli 3D del Sistema Solare (assets/sistema-solare/*.bin), salvati
// offline la prima volta che servono. Mappe e modelli non sono in precache.
const STATIC_ASSET_RE = /\.(css|js|json|svg|png|jpe?g|webp|avif|ico|txt|xml|woff2?|ttf|bin)$/i;
const REWARD_ASSET_RE = /^\/assets\/reward\/.+\.(png|webp)$/i;

// Estensioni immutabili per nome. css/js/json/txt/xml restano fuori: cambiano
// con le release e devono seguire il bump di CACHE_NAME.
const STABLE_ASSET_RE = /\.(woff2?|ttf|svg|png|jpe?g|webp|avif|ico|bin)$/i;

function cacheNameForPath(pathname) {
  if (REWARD_ASSET_RE.test(pathname)) return REWARDS_CACHE_NAME;
  return STABLE_ASSET_RE.test(pathname) ? ASSETS_CACHE_NAME : CACHE_NAME;
}

function groupUrlsByCache(urls) {
  const groups = new Map();
  for (const url of urls) {
    const name = cacheNameForPath(new URL(url, self.location.origin).pathname);
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push(url);
  }
  return Array.from(groups);
}

function isSameOriginStaticAsset(url) {
  if (url.origin !== self.location.origin) return false;
  if (PRECACHE_PATHS.has(url.pathname)) return true;
  return STATIC_ASSET_RE.test(url.pathname);
}

function canCacheResponse(response) {
  if (!response) return false;
  if (response.status === 200) return true;
  return response.type === 'opaque';
}

// Materie gia' aperte. I json/<materia>.json non sono in precache e vivono
// nella cache versionata: al cambio di versione sparivano con la cache vecchia
// e la materia tornava disponibile offline solo dopo averla riaperta con la
// rete. Qui si leggono le chiavi delle cache vecchie e si riscaricano nella
// nuova gli stessi file, solo quelli (chi ha aperto una materia non scarica le
// altre sette).
//
// Si riscarica, non si copia: la risposta vecchia nasconderebbe le domande
// corrette. _headers da' a /json/* max-age=0, must-revalidate, quindi il fetch
// rivalida sempre e un file non cambiato costa un 304. Se un file non arriva
// (rete caduta, materia tolta) non si tiene la copia vecchia: resta fuori
// dall'offline finche' la materia non viene riaperta con la rete, come prima.
//
// Dalla 4.26.0 una materia arriva per classe: json/<materia>/c<N>.json e
// bonus.json, e in cache finiscono solo le classi aperte. Chi aveva in cache
// il file intero di prima (json/<materia>.json, tutte le classi) ritrova
// offline tutte le classi di quella materia, nel formato nuovo.
const OPENED_JSON_RE = /^\/json\/(?:[^/]+\/)?[^/]+\.json$/;
const WHOLE_SUBJECT_JSON_RE = /^\/json\/([a-z]+)\.json$/;
const NOT_A_SUBJECT = new Set(['index', 'changelog']);
const SUBJECT_JSON_PARTS = ['c1', 'c2', 'c3', 'c4', 'c5', 'bonus'];

function openedJsonPaths(pathname) {
  const whole = pathname.match(WHOLE_SUBJECT_JSON_RE);
  if (!whole || NOT_A_SUBJECT.has(whole[1])) return [pathname];
  return SUBJECT_JSON_PARTS.map((part) => `/json/${whole[1]}/${part}.json`);
}

async function refetchOpenedJson() {
  const paths = new Set();
  for (const key of await caches.keys()) {
    if (KEEP_CACHE_NAMES.includes(key)) continue;
    const oldCache = await caches.open(key);
    for (const request of await oldCache.keys()) {
      const { pathname } = new URL(request.url);
      if (OPENED_JSON_RE.test(pathname)) openedJsonPaths(pathname).forEach((p) => paths.add(p));
    }
  }

  const cache = await caches.open(CACHE_NAME);
  await Promise.all(
    Array.from(paths, async (pathname) => {
      try {
        if (!(await cache.match(pathname))) await cache.add(pathname);
      } catch {
        // Vedi sopra: niente copia vecchia.
      }
    })
  );
}

// Pagine gia' visitate. Al cambio di versione si copiano dalle cache vecchie
// (oldKeys) alla nuova, senza rete: con la rete la pagina arriva comunque
// fresca da networkFirstWithFallback, la copia serve solo offline. Le cache
// dalla piu' nuova: se una pagina sta in due, vince la copia recente. Non
// sovrascrive cio' che c'e' gia' (la home appena precachata).
async function carryVisitedHtml(oldKeys) {
  const cache = await caches.open(CACHE_NAME);
  for (const key of oldKeys.slice().reverse()) {
    const oldCache = await caches.open(key);
    for (const request of await oldCache.keys()) {
      if (await cache.match(request)) continue;
      const response = await oldCache.match(request);
      if (response && (response.headers.get('content-type') || '').includes('text/html')) {
        await cache.put(request, response);
      }
    }
  }
}

// La home. Riscaricarla a ogni install era una richiesta di pagina a ogni
// versione: se una cache vecchia ce l'ha gia', l'install la salta e la porta
// carryVisitedHtml. La cache nuova pero' deve sempre averla, perche' e' il
// ripiego offline: se la copia non c'e' stata, ensureHome la chiede alla rete.
const HOME_URL = '/';

async function homeInOlderCache() {
  for (const key of await caches.keys()) {
    if (KEEP_CACHE_NAMES.includes(key)) continue;
    if (await (await caches.open(key)).match(HOME_URL)) return true;
  }
  return false;
}

async function ensureHome() {
  const cache = await caches.open(CACHE_NAME);
  if (!(await cache.match(HOME_URL))) await cache.add(HOME_URL);
}

// ============================================================
// INSTALL — pre-cacha tutte le risorse essenziali
// ============================================================
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const skipHome = await homeInOlderCache().catch(() => false);
    const coreUrls = skipHome ? CORE_PRECACHE_URLS.filter(url => url !== HOME_URL) : CORE_PRECACHE_URLS;
    await Promise.all(
      groupUrlsByCache(coreUrls).map(async ([name, urls]) => {
        const cache = await caches.open(name);
        await cache.addAll(urls);
      })
    );
    await Promise.all(
      OPTIONAL_PRECACHE_URLS.map(async (url) => {
        try {
          const name = cacheNameForPath(new URL(url, self.location.origin).pathname);
          const cache = await caches.open(name);
          await cache.add(url);
        } catch {
          // Non bloccare install per risorse non critiche mancanti.
        }
      })
    );
    // All'install la rete c'e' (sw.js e' appena arrivato) e la versione vecchia
    // continua a servire le pagine: e' il momento di riportare le materie.
    await refetchOpenedJson().catch(() => {});
    await rememberOlderCaches().catch(() => {});
  })());
});

// ============================================================
// ACTIVATE — elimina le vecchie versioni della cache
// ============================================================
const ACTIVATE_REFETCH_LIMIT_MS = 5000;

// Secondo passaggio per le materie aperte tra install e attivazione (chi ha
// risposto «Più tardi»): stanno solo nella cache vecchia. Di norma non fa
// richieste, perche' install ha gia' riportato tutto. Ha un tetto di tempo:
// finche' activate non finisce le pagine restano in attesa.
function carryOpenedJson() {
  return Promise.race([
    refetchOpenedJson().catch(() => {}),
    new Promise(resolve => setTimeout(resolve, ACTIVATE_REFETCH_LIMIT_MS))
  ]);
}

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    await carryOpenedJson();

    const oldKeys = (await caches.keys()).filter(key => !KEEP_CACHE_NAMES.includes(key));
    await carryVisitedHtml(oldKeys).catch(() => {});
    await ensureHome().catch(() => {});
    await Promise.all(oldKeys.map(key => caches.delete(key)));
    // Pulizia fatta: la nota per dropOlderCachesOnce non serve piu'.
    const cache = await caches.open(CACHE_NAME);
    await cache.delete(OLDER_CACHES_KEY);
    await self.clients.claim();
  })());
});

// ============================================================
// PULIZIA FUORI DA ACTIVATE
// ============================================================
// Su Safari (visto l'11/10/2026 su iOS 26.5) se l'app viene chiusa mentre un
// aggiornamento e' in attesa, alla riapertura questo worker e' gia' attivo ma
// la pulizia di activate non c'e' stata: la cache della versione prima resta
// li'. Non basta cancellare «tutto cio' che non e' mio» alla prima richiesta:
// un worker attivo cancellerebbe anche la cache di una versione piu' nuova
// ancora in attesa. Per questo all'install si annota quali cache esistevano
// gia', cioe' quelle sicuramente piu' vecchie, e fuori da activate si
// cancellano solo quelle.
const OLDER_CACHES_KEY = '/__sw/older-caches';

async function rememberOlderCaches() {
  const older = (await caches.keys()).filter(key => !KEEP_CACHE_NAMES.includes(key));
  const cache = await caches.open(CACHE_NAME);
  await cache.put(OLDER_CACHES_KEY, new Response(JSON.stringify(older)));
}

// Una volta per vita del worker. Dopo un activate andato a buon fine la nota
// non c'e' e la funzione costa una lettura di cache.
let olderCachesDropped = null;

function dropOlderCachesOnce() {
  if (!olderCachesDropped) {
    olderCachesDropped = (async () => {
      const cache = await caches.open(CACHE_NAME);
      const note = await cache.match(OLDER_CACHES_KEY);
      if (!note) return;
      const older = await note.json();
      const keys = (await caches.keys()).filter(key => older.includes(key));
      if (keys.length) {
        await carryOpenedJson();
        await carryVisitedHtml(keys).catch(() => {});
        await Promise.all(keys.map(key => caches.delete(key)));
      }
      // Anche se le cache annotate sono gia' sparite: l'install puo' aver
      // saltato la home contando su di loro.
      await ensureHome().catch(() => {});
      await cache.delete(OLDER_CACHES_KEY);
    })().catch(() => {});
  }
  return olderCachesDropped;
}

// ============================================================
// FETCH — strategia per tipo di risorsa
// ============================================================
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;

  // Ignora richieste non GET (es. analytics, form POST)
  if (request.method !== 'GET') return;

  // Ignora richieste a origini sconosciute (es. estensioni browser)
  if (!['http:', 'https:'].includes(url.protocol)) return;

  // Ignora richieste cross-origin non necessarie al funzionamento:
  // riduce il rischio di cache pollution e memorizzazioni indesiderate.
  if (!sameOrigin) return;

  // Solo il worker attivo riceve richieste: e' il momento sicuro per togliere
  // le cache piu' vecchie se activate non l'ha fatto. Non fa aspettare la
  // risposta.
  event.waitUntil(dropOlderCachesOnce());

  // File HTML locali: Network First con fallback alla cache
  // Così l'utente vede sempre la versione più aggiornata se online,
  // ma il sito funziona comunque offline.
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithFallback(request));
    return;
  }

  // Reward assets: niente precache, solo runtime cache on-demand.
  // Dopo la prima visita a /premi restano disponibili offline.
  if (REWARD_ASSET_RE.test(url.pathname)) {
    event.respondWith(cacheFirst(request, REWARDS_CACHE_NAME));
    return;
  }

  // Asset statici della stessa origine: Cache First, nella cache che compete
  // al tipo di file (versionata per css/js/json, stabile per font e immagini).
  if (isSameOriginStaticAsset(url)) {
    event.respondWith(cacheFirst(request, cacheNameForPath(url.pathname)));
  }
});

// ============================================================
// STRATEGIE
// ============================================================

// Cerca solo nelle cache di questa versione. `caches.match(request)` senza
// nome guarda tutte le cache, dalla piu' vecchia: se ne e' rimasta una di una
// versione precedente risponde lei, e il sito resta sui file vecchi (vedi
// «Pulizia fuori da activate»).
async function matchCurrent(request) {
  for (const cacheName of KEEP_CACHE_NAMES) {
    const cached = await caches.match(request, { cacheName });
    if (cached) return cached;
  }
  return undefined;
}

// Cache First: serve dalla cache, se non c'è va in rete e salva
async function cacheFirst(request, cacheName = CACHE_NAME) {
  const cached = await matchCurrent(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (canCacheResponse(response)) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Nessuna risposta disponibile — ritorna undefined (gestito dal browser)
    return new Response('Risorsa non disponibile offline.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

// Network First: prova la rete, se fallisce usa la cache
async function networkFirstWithFallback(request) {
  try {
    const response = await fetch(request);
    if (canCacheResponse(response)) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Prova prima la URL esatta richiesta (es. /storia)
    let cached = await matchCurrent(request);
    // Se non trovata, prova la variante senza .html (es. /storia.html → /storia)
    if (!cached) {
      const reqUrl = new URL(request.url);
      let cleanPath = reqUrl.pathname;
      if (cleanPath === '/index.html') {
        cleanPath = '/';
      } else if (cleanPath.endsWith('.html')) {
        cleanPath = cleanPath.slice(0, -5);
      }
      cached = await matchCurrent(new URL(cleanPath, self.location.origin).href);
    }
    if (cached) return cached;

    // Fallback finale: pagina offline essenziale
    return matchCurrent('/');
  }
}

// ============================================================
// MESSAGGI — permette alle pagine di forzare l'aggiornamento
// ============================================================
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
