// ============================================================
// La Scuola Amica — Service Worker
// Strategia: Cache First per le risorse statiche,
// Network First con fallback per tutto il resto.
// ============================================================

importScripts('/app-version.js');

const CACHE_NAME = (self.SA && self.SA.cacheName) || 'lascuolaamica-v451';

// Shell minima: se queste risorse non sono disponibili
// l'installazione deve fallire (app non consistente).
const CORE_PRECACHE_URLS = [
  '/',
  '/index.html',
  '/index.css',
  '/shared.js',
  '/app-version.js',
  '/manifest.json',
  '/questions-loader.js',
  '/subject-quiz-core.js',
  '/subject-quiz-theme.css',
  '/js/index-page.js',
  '/json/index.json'
];

// Risorse aggiuntive: se una manca, il SW resta installabile.
// Questo evita failure atomiche di cache.addAll su un singolo 404.
const OPTIONAL_PRECACHE_URLS = [
  '/matematica.html',
  '/inglese.html',
  '/problemi.html',
  '/civica.html',
  '/geografia.html',
  '/storia.html',
  '/scienze.html',
  '/italiano.html',
  '/villaggio.html',
  '/accessibilita.html',
  '/chi-siamo.html',
  '/per-insegnanti.html',
  '/per-genitori.html',
  '/ai-info.html',
  '/supporta.html',
  '/faq.html',
  '/inglese.css',
  '/faq.css',
  '/info-pages.css',
  '/villaggio.css',
  '/villaggio.js',
  '/js/matematica-page.js',
  '/js/inglese-page.js',
  '/js/problemi-page.js',
  '/js/civica-page.js',
  '/js/geografia-page.js',
  '/js/storia-page.js',
  '/js/scienze-page.js',
  '/js/italiano-page.js',
  '/js/faq-page.js',
  '/questions-loader.js',
  '/palette-okabe.css',
  '/robots.txt',
  '/sitemap.xml',
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
  '/screenshots/og-matematica-1200x630.jpg',
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
  '/assets/mascotte/cervellino-neutral.png',
  '/assets/mascotte/cervellino-happy.png',
  '/assets/mascotte/cervellino-sad.png',
  '/assets/mascotte/cervellino-celebrate.png',
  '/assets/donazione/qrcode-donazione.jpeg'
];

const PRECACHE_URLS = CORE_PRECACHE_URLS.concat(OPTIONAL_PRECACHE_URLS);
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
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(CORE_PRECACHE_URLS);
    await Promise.all(
      OPTIONAL_PRECACHE_URLS.map(async (url) => {
        try {
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
