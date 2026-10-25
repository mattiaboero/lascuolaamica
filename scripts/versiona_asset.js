#!/usr/bin/env node
// Aggiunge ?v=<APP_VERSION> ai CSS e ai JS locali che le pagine caricano dai
// tag <script src> e <link href>. Gira solo su export/: i sorgenti restano
// come sono.
//
// Perche': sw.js serve CSS e JS con Cache First dalla cache della versione
// installata, l'HTML invece arriva dalla rete. Il 25/10/2026 /matematica
// caricava HTML 4.27.1 con subject-quiz-core.js 4.26.1. Con la versione
// nell'URL il worker vecchio non trova la voce (cerca l'URL intero, query
// compresa) e va in rete: la pagina esegue solo CSS e JS della sua versione.
// Il worker nuovo mette in precache gli stessi URL (sw.js, precacheUrl).
//
// Font e immagini restano senza versione: vivono nelle cache stabili e il
// preload dei font deve combaciare con l'url() di fonts.css.
//
// La versione si legge dal sorgente: in export/ app-version.js e' minificato.
//
// Uso: node scripts/versiona_asset.js [cartella]   (default: export/)

const fs = require('fs');
const path = require('path');

const TAG_RE = /<(script|link)\b[^>]*>/gi;
const URL_RE = /(\s(?:src|href)=")([^"?#]+\.(?:css|js))(")/i;

function leggiVersione(dir) {
  const m = fs.readFileSync(path.join(dir, 'app-version.js'), 'utf8').match(/APP_VERSION = '([^']+)'/);
  if (!m) throw new Error(`APP_VERSION non trovata in ${dir}/app-version.js`);
  return m[1];
}

function versiona(html, versione) {
  const v = encodeURIComponent(versione);
  return html.replace(TAG_RE, (tag) => tag.replace(URL_RE, (all, prima, url, dopo) =>
    /^([a-z]+:|\/\/)/i.test(url) ? all : `${prima}${url}?v=${v}${dopo}`));
}

module.exports = { versiona, leggiVersione };

if (require.main === module) {
  const dir = path.resolve(process.argv[2] || path.join(__dirname, '..', 'export'));
  const versione = leggiVersione(path.join(__dirname, '..'));
  const pagine = fs.readdirSync(dir).filter((f) => f.endsWith('.html'));
  pagine.forEach((f) => {
    const p = path.join(dir, f);
    fs.writeFileSync(p, versiona(fs.readFileSync(p, 'utf8'), versione));
  });
  console.log(`[INFO] ?v=${versione} su CSS e JS di ${pagine.length} pagine`);
}
