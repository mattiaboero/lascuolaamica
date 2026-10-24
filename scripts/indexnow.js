#!/usr/bin/env node
// IndexNow: segnala a Bing (e ai motori che condividono il protocollo) gli URL
// cambiati, invece di aspettare il prossimo crawl. Voce 19 dell'audit
// dell'11/09/2026.
//
// Il protocollo chiede di segnalare solo gli URL aggiunti, modificati o tolti:
// mandare ogni volta tutta la sitemap faceva registrare a Bing centinaia di
// URL "cambiati" che non lo erano. La data di ogni pagina e' il <lastmod> della
// sitemap (scripts/generate_sitemap.py: la piu' recente fra l'HTML e le sue
// dipendenze proprie), l'unica fonte.
//
//   npm run indexnow                          pagine con lastmod da oggi (ora italiana)
//   npm run indexnow -- --since 2026-10-23    pagine con lastmod da quella data
//   npm run indexnow -- --all                 tutta la sitemap (casi eccezionali:
//                                             migrazione, cambio di dominio)
//   npm run indexnow -- --dry                 stampa soltanto, non invia
//
// Dopo il deploy: --since con il primo giorno di lavoro della release (il
// lastmod e' la data in cui la pagina e' cambiata nel branch, non quella del
// merge). Se non c'e' niente da segnalare esce con 0 e lo dice.
//
// La chiave e' il nome del file <chiave>.txt nella radice, che deve essere
// pubblicato: il motore lo rilegge per verificare che il sito sia nostro.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const HOST = 'lascuolaamica.it';
const ENDPOINT = 'https://api.indexnow.org/IndexNow';
const DATA_RE = /^\d{4}-\d{2}-\d{2}$/;

function findKey() {
  const file = fs.readdirSync(ROOT).find((f) => /^[0-9a-f]{32}\.txt$/.test(f));
  if (!file) throw new Error('Nessun file <chiave>.txt di IndexNow nella radice.');
  const key = path.basename(file, '.txt');
  const content = fs.readFileSync(path.join(ROOT, file), 'utf8').trim();
  if (content !== key) throw new Error(`${file} deve contenere esattamente la chiave.`);
  return key;
}

// Oggi in Italia, AAAA-MM-GG.
function oggiRoma(adesso = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(adesso);
}

// [{ loc, lastmod }] dalla sitemap.
function voci(xml) {
  return [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => ({
    loc: (m[1].match(/<loc>([^<]+)<\/loc>/) || [])[1],
    lastmod: (m[1].match(/<lastmod>([^<]+)<\/lastmod>/) || [])[1] || ''
  })).filter((v) => v.loc);
}

// Gli URL da segnalare: tutti con all, altrimenti lastmod >= since.
function daSegnalare(xml, { since, all }) {
  const elenco = voci(xml);
  if (elenco.length === 0) throw new Error('la sitemap non contiene URL.');
  if (all) return elenco.map((v) => v.loc);
  if (!DATA_RE.test(since)) throw new Error(`--since vuole una data AAAA-MM-GG, non «${since}».`);
  return elenco.filter((v) => v.lastmod.slice(0, 10) >= since).map((v) => v.loc);
}

function opzioni(argv) {
  const i = argv.indexOf('--since');
  const s = argv.indexOf('--sitemap');
  return {
    dry: argv.includes('--dry'),
    all: argv.includes('--all'),
    since: i >= 0 ? argv[i + 1] || '' : oggiRoma(),
    sitemap: s >= 0 ? argv[s + 1] : path.join(ROOT, 'sitemap.xml')
  };
}

async function main(argv = process.argv.slice(2)) {
  const opz = opzioni(argv);
  const urlList = daSegnalare(fs.readFileSync(opz.sitemap, 'utf8'), opz);
  const criterio = opz.all ? 'tutta la sitemap' : `lastmod dal ${opz.since}`;
  if (urlList.length === 0) {
    console.log(`[OK] Niente da segnalare: nessuna pagina con ${criterio}.`);
    return 0;
  }

  const key = findKey();
  if (opz.dry) {
    console.log(`[DRY] ${urlList.length} URL (${criterio}), chiave ${key}`);
    urlList.forEach((u) => console.log('  ' + u));
    return 0;
  }

  const body = { host: HOST, key, keyLocation: `https://${HOST}/${key}.txt`, urlList };
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body)
  });
  // 200 = accettato, 202 = accettato ma chiave ancora da verificare.
  if (res.status !== 200 && res.status !== 202) {
    console.error(`[KO] IndexNow ha risposto ${res.status} ${res.statusText}`);
    console.error(await res.text());
    return 1;
  }
  console.log(`[OK] IndexNow: ${urlList.length} URL segnalati, ${criterio} (HTTP ${res.status}).`);
  return 0;
}

module.exports = { daSegnalare, oggiRoma, voci, opzioni, main };

if (require.main === module) {
  main().then((code) => process.exit(code)).catch((err) => {
    console.error('[KO]', err.message);
    process.exit(1);
  });
}
