#!/usr/bin/env node
// IndexNow: segnala a Bing (e ai motori che condividono il protocollo) gli URL
// aggiornati, invece di aspettare il prossimo crawl. Voce 19 dell'audit
// dell'11/09/2026.
//
//   npm run indexnow            invia tutti gli URL della sitemap
//   npm run indexnow -- --dry   stampa soltanto cosa invierebbe
//
// La chiave e' il nome del file <chiave>.txt nella radice, che deve essere
// pubblicato: il motore lo rilegge per verificare che il sito sia nostro.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const HOST = 'lascuolaamica.it';
const ENDPOINT = 'https://api.indexnow.org/IndexNow';

function findKey() {
  const file = fs.readdirSync(ROOT).find((f) => /^[0-9a-f]{32}\.txt$/.test(f));
  if (!file) throw new Error('Nessun file <chiave>.txt di IndexNow nella radice.');
  const key = path.basename(file, '.txt');
  const content = fs.readFileSync(path.join(ROOT, file), 'utf8').trim();
  if (content !== key) throw new Error(`${file} deve contenere esattamente la chiave.`);
  return key;
}

function sitemapUrls() {
  const xml = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

async function main() {
  const dry = process.argv.includes('--dry');
  const key = findKey();
  const urlList = sitemapUrls();
  if (urlList.length === 0) throw new Error('sitemap.xml non contiene URL.');

  const body = { host: HOST, key, keyLocation: `https://${HOST}/${key}.txt`, urlList };
  if (dry) {
    console.log(`[DRY] ${urlList.length} URL, chiave ${key}`);
    urlList.forEach((u) => console.log('  ' + u));
    return 0;
  }

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
  console.log(`[OK] IndexNow: ${urlList.length} URL segnalati (HTTP ${res.status}).`);
  return 0;
}

main().then((code) => process.exit(code)).catch((err) => {
  console.error('[KO]', err.message);
  process.exit(1);
});
