#!/usr/bin/env node
// Dopo il deploy: la produzione serve la versione di app-version.js?
// Controlla in ordine app-version.js, i ?v= di CSS e JS in tre pagine, gli
// header di sicurezza di / e la sitemap. Alla prima differenza stampa
// "ERRORE: <controllo>: atteso <x>, trovato <y>" ed esce con 1.
//
// Uso: npm run verifica:produzione

const fs = require('fs');
const path = require('path');

const BASE = 'https://lascuolaamica.it';
const PAGINE = ['/', '/matematica', '/sistema-solare'];
const HEADER = ['content-security-policy', 'strict-transport-security', 'x-frame-options'];
const TAG_RE = /<(script|link)\b[^>]*>/gi;

class Differenza extends Error {}

function errore(controllo, atteso, trovato) {
  throw new Differenza(`ERRORE: ${controllo}: atteso ${atteso}, trovato ${trovato}`);
}

// Il ?nc= scavalca le cache intermedie.
async function scarica(pagina) {
  const sep = pagina.includes('?') ? '&' : '?';
  return fetch(`${BASE}${pagina}${sep}nc=${Date.now()}`, { cache: 'no-store', redirect: 'follow' });
}

// Gli URL locali di <script src> e <link rel="stylesheet">.
function assetLocali(html) {
  const out = [];
  for (const [tag, nome] of html.matchAll(TAG_RE)) {
    const attr = nome.toLowerCase() === 'script' ? 'src' : 'href';
    if (nome.toLowerCase() === 'link' && !/\brel="?stylesheet"?/i.test(tag)) continue;
    const m = tag.match(new RegExp(`\\s${attr}="?([^"\\s>]+)`, 'i'));
    if (!m || /^(https?:)?\/\//i.test(m[1]) || m[1].startsWith('data:')) continue;
    out.push(m[1]);
  }
  return out;
}

async function main() {
  const v = fs.readFileSync(path.join(__dirname, '..', 'app-version.js'), 'utf8').match(/APP_VERSION = '([^']+)'/);
  if (!v) errore('app-version.js locale', 'APP_VERSION', 'niente');
  const V = v[1];

  const av = await (await scarica('/app-version.js')).text();
  if (!av.includes(V)) errore('app-version.js', V, (av.match(/\d+\.\d+\.\d+/) || ['niente'])[0]);

  for (const pagina of PAGINE) {
    const html = await (await scarica(pagina)).text();
    const asset = assetLocali(html);
    if (asset.length === 0) errore(`asset di ${pagina}`, `?v=${V}`, 'nessun asset');
    const sbagliato = asset.find((u) => !u.endsWith(`?v=${V}`));
    if (sbagliato) errore(`asset di ${pagina}`, `?v=${V}`, sbagliato);
  }

  const home = await scarica('/');
  for (const h of HEADER) {
    if (!home.headers.has(h)) errore(`header di /`, h, 'header assente');
  }

  const sitemap = await scarica('/sitemap.xml');
  if (sitemap.status !== 200) errore('/sitemap.xml', 'HTTP 200', `HTTP ${sitemap.status}`);
  const loc = ((await sitemap.text()).match(/<loc>/g) || []).length;
  if (loc < 24) errore('/sitemap.xml', 'almeno 24 <loc>', `${loc} <loc>`);

  console.log(`OK produzione ${V}`);
  return 0;
}

module.exports = { assetLocali };

if (require.main === module) {
  main().then((code) => process.exit(code)).catch((err) => {
    console.log(err instanceof Differenza ? err.message : `ERRORE: rete: atteso risposta, trovato ${err.message}`);
    process.exit(1);
  });
}
