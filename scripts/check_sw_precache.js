#!/usr/bin/env node
// C3 — verifica che ogni path elencato in CORE/OPTIONAL_PRECACHE_URLS (sw.js)
// corrisponda a un file reale su disco. Un path morto qui produce un 404
// silenzioso durante l'install del service worker (per OPTIONAL_PRECACHE_URLS,
// l'errore viene ingoiato dal try/catch e non è mai visibile in produzione).

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SW_PATH = path.join(ROOT, 'sw.js');

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

  console.error(`sw.js precache: ${core.length + optional.length} path verificati, tutti presenti su disco.`);
}

main();
