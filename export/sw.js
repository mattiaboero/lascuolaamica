// ============================================================
// La Scuola Amica — Service Worker
// Strategia: Cache First per le risorse statiche,
// Network First con fallback per tutto il resto.
// ============================================================

importScripts('/app-version.js');

const CACHE_NAME = (self.SCUOLA_AMICA_VERSION && self.SCUOLA_AMICA_VERSION.cacheName) || 'lascuolaamica-v40';

// Tutte le risorse da pre-cachare all'installazione.
// L'app funziona completamente offline una volta che
// questi file sono stati scaricati almeno una volta.
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/matematica.html',
  '/inglese.html',
  '/problemi.html',
  '/civica.html',
  '/geografia.html',
  '/storia.html',
  '/scienze.html',
  '/italiano.html',
  '/villaggio.html',
  '/supporta.html',
  '/faq.html',
  '/index.css',
  '/inglese.css',
  '/faq.css',
  '/villaggio.css',
  '/villaggio.js',
  '/shared.js',
  '/questions-loader.js',
  '/questions.json',
  '/subject-quiz-core.js',
  '/subject-quiz-theme.css',
  '/palette-okabe.css',
  '/app-version.js',
  '/manifest.json',
  '/robots.txt',
  '/sitemap.xml',
  '/json/index.json',
  '/json/matematica.json',
  '/json/problemi.json',
  '/json/inglese.json',
  '/json/civica.json',
  '/json/geografia.json',
  '/json/storia.json',
  '/json/scienze.json',
  '/json/italiano.json',
  '/screenshots/home-390x844.webp',
  '/screenshots/home-1280x720.webp',
  '/screenshots/og-home-1200x630.jpg',
  '/assets/village/alberi.svg',
  '/assets/village/biblioteca.svg',
  '/assets/village/campo-basket.svg',
  '/assets/village/campo-tennis.svg',
  '/assets/village/casa.svg',
  '/assets/village/cinema.svg',
  '/assets/village/liceo.svg',
  '/assets/village/parco-giochi.svg',
  '/assets/village/ristorante.svg',
  '/assets/village/scuola-elementare.svg',
  '/assets/village/scuola-media.svg',
  '/assets/village/supermercato.svg',
  '/assets/village/uffici.svg',
  '/assets/village/universita.svg',
  '/assets/donazione/qrcode-donazione.jpeg'
];

const PRECACHE_PATHS = new Set(PRECACHE_URLS);
const STATIC_ASSET_RE = /\.(css|js|json|svg|png|jpe?g|webp|ico|txt|xml|woff2?|ttf)$/i;

function isGoogleFontRequest(url) {
  return url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com');
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
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
});

// ============================================================
// ACTIVATE — elimina le vecchie versioni della cache
// ============================================================
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
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
  const fontRequest = isGoogleFontRequest(url);
  const sameOrigin = url.origin === self.location.origin;

  // Ignora richieste non GET (es. analytics, form POST)
  if (request.method !== 'GET') return;

  // Ignora richieste a origini sconosciute (es. estensioni browser)
  if (!['http:', 'https:'].includes(url.protocol)) return;

  // Ignora richieste cross-origin non necessarie al funzionamento:
  // riduce il rischio di cache pollution e memorizzazioni indesiderate.
  if (!sameOrigin && !fontRequest) return;

  // Google Fonts: Cache First (cambiano raramente)
  if (fontRequest) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // File HTML locali: Network First con fallback alla cache
  // Così l'utente vede sempre la versione più aggiornata se online,
  // ma il sito funziona comunque offline.
  if (sameOrigin && (url.pathname.endsWith('.html') || url.pathname === '/')) {
    event.respondWith(networkFirstWithFallback(request));
    return;
  }

  // Asset statici della stessa origine: Cache First.
  if (isSameOriginStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
  }
});

// ============================================================
// STRATEGIE
// ============================================================

// Cache First: serve dalla cache, se non c'è va in rete e salva
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (canCacheResponse(response)) {
      const cache = await caches.open(CACHE_NAME);
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
    const cached = await caches.match(request);
    if (cached) return cached;

    // Fallback finale: pagina offline essenziale
    return caches.match('/index.html');
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
