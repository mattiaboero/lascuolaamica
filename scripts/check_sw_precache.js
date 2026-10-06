#!/usr/bin/env node
// C3 — verifica che ogni path elencato in CORE/OPTIONAL_PRECACHE_URLS (sw.js)
// corrisponda a un file reale su disco. Un path morto qui produce un 404
// silenzioso durante l'install del service worker (per OPTIONAL_PRECACHE_URLS,
// l'errore viene ingoiato dal try/catch e non è mai visibile in produzione).
//
// Verso opposto: ogni rotta di sitemap.xml deve stare nel precache, insieme ai
// CSS e ai JS che la sua pagina carica dall'HTML. Senza, una pagina pubblica
// aggiunta alla sitemap ma dimenticata qui resta fuori dall'offline in silenzio
// (successo con /link e link.css).

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SW_PATH = path.join(ROOT, 'sw.js');
const SITEMAP_PATH = path.join(ROOT, 'sitemap.xml');

function extractArray(source, constName) {
  const marker = `const ${constName} = [`;
  const start = source.indexOf(marker);
  if (start === -1) {
    throw new Error(`Impossibile trovare ${constName} in sw.js`);
  }
  const bodyStart = start + marker.length;
  const end = source.indexOf('\n];', bodyStart);
  if (end === -1) {
    throw new Error(`Impossibile trovare la chiusura di ${constName} in sw.js`);
  }
  const body = source.slice(bodyStart, end);
  const matches = body.match(/'([^']+)'/g) || [];
  return matches.map((m) => m.slice(1, -1));
}

// Rotte servite da Cloudflare Pages come <slug>.html senza estensione.
// La homepage '/' e i file con estensione reale si risolvono direttamente.
function resolveToFile(urlPath) {
  if (urlPath === '/') return 'index.html';
  const withoutLeadingSlash = urlPath.replace(/^\//, '');
  if (path.extname(withoutLeadingSlash)) return withoutLeadingSlash;
  return `${withoutLeadingSlash}.html`;
}

function sitemapRoutes() {
  const xml = fs.readFileSync(SITEMAP_PATH, 'utf8');
  const routes = [...xml.matchAll(/<loc>https?:\/\/[^/<]+([^<]*)<\/loc>/g)].map((m) => m[1] || '/');
  if (routes.length === 0) {
    throw new Error('Nessuna rotta trovata in sitemap.xml');
  }
  return routes;
}

// CSS e JS locali dichiarati nell'HTML. Quelli caricati a runtime (lazy-css.js)
// non si vedono da qui.
function pageResources(htmlFile) {
  const html = fs.readFileSync(path.join(ROOT, htmlFile), 'utf8');
  const tags = html.match(/<link\b[^>]*rel="stylesheet"[^>]*>|<script\b[^>]*\bsrc=[^>]*>/g) || [];
  return tags
    .map((tag) => (tag.match(/\b(?:href|src)="([^"]+)"/) || [])[1])
    .filter((ref) => ref && !/^[a-z]+:|^\/\//i.test(ref))
    .map((ref) => `/${ref.replace(/^\//, '').split(/[?#]/)[0]}`);
}

function main() {
  const source = fs.readFileSync(SW_PATH, 'utf8');
  const core = extractArray(source, 'CORE_PRECACHE_URLS');
  const optional = extractArray(source, 'OPTIONAL_PRECACHE_URLS');

  const missing = [];
  for (const [listName, urls] of [['CORE_PRECACHE_URLS', core], ['OPTIONAL_PRECACHE_URLS', optional]]) {
    for (const urlPath of urls) {
      const filePath = resolveToFile(urlPath);
      if (!fs.existsSync(path.join(ROOT, filePath))) {
        missing.push({ listName, urlPath, filePath });
      }
    }
  }

  if (missing.length > 0) {
    console.error('[ERROR] sw.js precache: path senza file corrispondente su disco:');
    for (const m of missing) {
      console.error(`  - ${m.listName}: '${m.urlPath}' -> atteso ${m.filePath}`);
    }
    process.exitCode = 1;
    return;
  }

  const precached = new Set(core.concat(optional));
  const notPrecached = [];
  const routes = sitemapRoutes();
  for (const route of routes) {
    if (!precached.has(route)) notPrecached.push(`rotta '${route}'`);
    for (const resource of pageResources(resolveToFile(route))) {
      if (!precached.has(resource)) notPrecached.push(`'${resource}' (caricato da '${route}')`);
    }
  }

  if (notPrecached.length > 0) {
    console.error('[ERROR] sw.js precache: pagine di sitemap.xml non disponibili offline, mancano:');
    for (const entry of notPrecached) {
      console.error(`  - ${entry}`);
    }
    process.exitCode = 1;
    return;
  }

  console.error(`sw.js precache: ${core.length + optional.length} path verificati, tutti presenti su disco; ${routes.length} rotte di sitemap.xml coperte con i loro CSS e JS.`);
}

main();
