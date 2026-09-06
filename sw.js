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
  '/js/index-page.js',
  '/js/rewards.js',
  '/json/index.json'
];

// Risorse aggiuntive: se una manca, il SW resta installabile.
// Questo evita failure atomiche di cache.addAll su un singolo 404.
// Nota: i json/<materia>.json NON sono precachati qui (erano ~7.9MB totali
// scaricati all'install per ogni utente, anche per le 7 materie mai aperte).
// Restano cacheable via isSameOriginStaticAsset (estensione .json) quindi
// vengono comunque salvati offline al primo fetch reale della materia.
const OPTIONAL_PRECACHE_URLS = [
  '/matematica',
  '/inglese',
  '/problemi',
  '/civica',
  '/geografia',
  '/storia',
  '/scienze',
  '/italiano',
  '/tabelline',
  '/breakout',
  '/accessibilita',
  '/chi-siamo',
  '/per-insegnanti',
  '/per-genitori',
  '/ai-info',
  '/supporta',
  '/supporto-satispay',
  '/faq',
  '/premi',
  '/privacy',
  '/cookie',
  '/inglese.css',
  '/breakout.css',
  '/faq.css',
  '/info-pages.css',
  '/js/matematica-page.js',
  '/js/inglese-page.js',
  '/js/problemi-page.js',
  '/js/civica-page.js',
  '/js/geografia-page.js',
  '/js/storia-page.js',
  '/js/scienze-page.js',
  '/js/italiano-page.js',
  '/js/breakout.js',
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
  '/assets/mascotte/cervellino-waving-03.png',
  '/assets/donazione/qrcode-donazione.jpeg'
];

const PRECACHE_URLS = CORE_PRECACHE_URLS.concat(OPTIONAL_PRECACHE_URLS);
const PRECACHE_PATHS = new Set(PRECACHE_URLS);
const STATIC_ASSET_RE = /\.(css|js|json|svg|png|jpe?g|webp|avif|ico|txt|xml|woff2?|ttf)$/i;
const REWARD_ASSET_RE = /^\/assets\/reward\/.+\.(png|webp)$/i;

// Estensioni immutabili per nome. css/js/json/txt/xml restano fuori: cambiano
// con le release e devono seguire il bump di CACHE_NAME.
const STABLE_ASSET_RE = /\.(woff2?|ttf|svg|png|jpe?g|webp|avif|ico)$/i;

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

// ============================================================
// INSTALL — pre-cacha tutte le risorse essenziali
// ============================================================
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    await Promise.all(
      groupUrlsByCache(CORE_PRECACHE_URLS).map(async ([name, urls]) => {
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
  })());
});

// ============================================================
// ACTIVATE — elimina le vecchie versioni della cache
// ============================================================
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => !KEEP_CACHE_NAMES.includes(key))
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

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

// Cache First: serve dalla cache, se non c'è va in rete e salva
async function cacheFirst(request, cacheName = CACHE_NAME) {
  const cached = await caches.match(request);
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
    let cached = await caches.match(request);
    // Se non trovata, prova la variante senza .html (es. /storia.html → /storia)
    if (!cached) {
      const reqUrl = new URL(request.url);
      let cleanPath = reqUrl.pathname;
      if (cleanPath === '/index.html') {
        cleanPath = '/';
      } else if (cleanPath.endsWith('.html')) {
        cleanPath = cleanPath.slice(0, -5);
      }
      cached = await caches.match(new URL(cleanPath, self.location.origin).href);
    }
    if (cached) return cached;

    // Fallback finale: pagina offline essenziale
    return caches.match('/');
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
