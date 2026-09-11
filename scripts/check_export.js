#!/usr/bin/env node
// Verifica la cartella che Cloudflare pubblica (export/ di default).
//
// Due modi di sbagliare un export, entrambi gia' capitati a questo progetto:
// dimenticare un file che il sito usa (pagina rotta, service worker che non si
// installa) oppure pubblicare qualcosa di interno — nella v4.10.0 finirono
// online le cartelle di un vault di appunti, e fino al 10/09/2026 erano online
// scripts/, reports/, package.json e l'audit SEO con i dati di Search Console.
// Qui si controllano entrambe le direzioni, e i dataset.
//
// Uso: node scripts/check_export.js [cartella]

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DST = path.resolve(ROOT, process.argv[2] || 'export');

const errori = [];
const esiste = (rel) => fs.existsSync(path.join(DST, rel)) && fs.statSync(path.join(DST, rel)).isFile();

// Un percorso come lo chiede il browser -> il file che Cloudflare servira'.
// Cloudflare Pages serve /bosco da bosco.html e / da index.html.
function risolve(url) {
  let p = decodeURIComponent(url.split(/[?#]/)[0]);
  if (!p.startsWith('/')) return true; // relativi e assoluti esterni: gestiti altrove
  p = p.slice(1);
  if (p === '' || p.endsWith('/')) p += 'index.html';
  return esiste(p) || esiste(p + '.html');
}

// ------------------------------------------------------------ 1. obbligatori
['_headers', '_redirects', 'index.html', '404.html', 'sw.js', 'app-version.js',
  'manifest.json', 'robots.txt', 'sitemap.xml', 'llms.txt'].forEach((f) => {
  if (!esiste(f)) errori.push(`manca ${f}: senza, il sito ${f.startsWith('_') ? 'perde header di sicurezza o redirect' : 'e\' rotto'}`);
});

// ------------------------------------------------------------ 2. niente interni
const VIETATI = [
  /(^|\/)node_modules\//, /^scripts\//, /^reports\//, /^docs\//, /^\.github\//,
  /^lascuolaamica\.it-audit\//, /^\.claude\//, /^\.git\//,
  /\.(md|sh|py|pyc|mjs)$/, /(^|\/)package(-lock)?\.json$/,
  /^(eslint\.config\.mjs|lighthouserc\.json|\.stylelintrc\.json|\.gitignore|LICENSE)$/,
  /(^|\/)\._/, /(^|\/)\.DS_Store$/ // residui del Mac: tar e Finder
];
(function scandisci(dir) {
  fs.readdirSync(path.join(DST, dir), { withFileTypes: true }).forEach((d) => {
    const rel = dir ? `${dir}/${d.name}` : d.name;
    if (d.isDirectory()) return scandisci(rel);
    if (VIETATI.some((re) => re.test(rel))) errori.push(`file interno pubblicato: ${rel}`);
  });
})('');

// ------------------------------------------------------------ 3. service worker
// La lista si legge dal sorgente: nell'export sw.js e' minificato e i nomi
// delle costanti non esistono piu'. Gli URL sono stringhe e restano identici.
const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
const precache = [];
['CORE_PRECACHE_URLS', 'OPTIONAL_PRECACHE_URLS'].forEach((nome) => {
  const blocco = sw.match(new RegExp(`const ${nome} = \\[([\\s\\S]*?)\\];`));
  if (!blocco) return errori.push(`sw.js: lista ${nome} non trovata`);
  for (const m of blocco[1].matchAll(/'([^']+)'/g)) precache.push(m[1]);
});
precache.forEach((u) => {
  if (!risolve(u)) errori.push(`sw.js mette in precache ${u}, ma nell'export non c'e': l'installazione offline fallirebbe`);
});

// ------------------------------------------------------------ 4. sitemap
const sitemap = fs.readFileSync(path.join(DST, 'sitemap.xml'), 'utf8');
for (const m of sitemap.matchAll(/<loc>https:\/\/lascuolaamica\.it([^<]*)<\/loc>/g)) {
  if (!risolve(m[1] || '/')) errori.push(`sitemap: ${m[1] || '/'} non corrisponde a nessuna pagina`);
}

// ------------------------------------------------------------ 4b. llms.txt
// Ogni URL della sitemap deve comparire anche in llms.txt (G1 dell'audit SEO
// dell'11/09/2026: 8 pagine su 22 mancavano e i crawler AI le ignoravano).
const llms = fs.readFileSync(path.join(DST, 'llms.txt'), 'utf8');
for (const m of sitemap.matchAll(/<loc>https:\/\/lascuolaamica\.it([^<]*)<\/loc>/g)) {
  const url = 'https://lascuolaamica.it' + (m[1] || '/').replace(/\/$/, '');
  // match il link intero tra parentesi markdown, non solo come prefisso
  // (la root e' prefisso di ogni altra URL: un .includes() semplice passa sempre)
  if (!llms.includes(`(${url})`) && !llms.includes(`(${url}/)`)) errori.push(`llms.txt: manca ${url}, presente in sitemap.xml`);
}

// ------------------------------------------------------------ 5. riferimenti nelle pagine
let riferimenti = 0;
fs.readdirSync(DST).filter((f) => f.endsWith('.html')).forEach((pagina) => {
  const html = fs.readFileSync(path.join(DST, pagina), 'utf8');
  for (const m of html.matchAll(/\s(?:src|href)="([^"]+)"/g)) {
    const u = m[1];
    // Gli URL con schema "script" non si saltano: nelle pagine non possono
    // esserci (li vieta check_security_patterns), e se ci fossero verrebbero
    // segnalati qui come riferimenti irrisolti, che e' comunque giusto.
    if (/^(https?:|mailto:|tel:|data:|#)/.test(u)) continue;
    riferimenti++;
    const assoluto = u.startsWith('/') ? u : '/' + u;
    if (!risolve(assoluto)) errori.push(`${pagina} punta a ${u}, che nell'export non c'e'`);
  }
});

// ------------------------------------------------------------ 6. sintassi
// Dopo la minificazione ogni JS deve ancora essere un programma valido. Si
// compila senza eseguire: vm.Script fa solo il parsing.
const vm = require('vm');
let script = 0;
(function sintassi(dir) {
  fs.readdirSync(path.join(DST, dir), { withFileTypes: true }).forEach((d) => {
    const rel = dir ? `${dir}/${d.name}` : d.name;
    if (d.isDirectory()) return sintassi(rel);
    if (!rel.endsWith('.js')) return;
    script++;
    try {
      new vm.Script(fs.readFileSync(path.join(DST, rel), 'utf8'), { filename: rel });
    } catch (e) {
      errori.push(`${rel} non e' JavaScript valido dopo la minificazione: ${e.message}`);
    }
  });
})('');

// ------------------------------------------------------------ 7. dataset
let domande = 0;
fs.readdirSync(path.join(DST, 'json')).filter((f) => f.endsWith('.json')).forEach((f) => {
  const pubblicato = JSON.parse(fs.readFileSync(path.join(DST, 'json', f), 'utf8'));
  if (!Array.isArray(pubblicato.questions)) return;
  const sorgente = JSON.parse(fs.readFileSync(path.join(ROOT, 'json', f), 'utf8'));
  const attiveNelRepo = sorgente.questions.filter((q) => q.active !== false).length;
  const spente = pubblicato.questions.filter((q) => q.active === false).length;
  if (spente) errori.push(`json/${f}: ${spente} domande disattivate spedite comunque`);
  if (pubblicato.questions.length !== attiveNelRepo) {
    errori.push(`json/${f}: pubblicate ${pubblicato.questions.length} domande, nel repo le attive sono ${attiveNelRepo}`);
  }
  domande += pubblicato.questions.length;
});

if (errori.length) {
  console.error(`[ERROR] export non pubblicabile (${errori.length} problemi):`);
  errori.slice(0, 30).forEach((e) => console.error('  ' + e));
  if (errori.length > 30) console.error(`  ... e altri ${errori.length - 30}`);
  process.exit(1);
}

console.error(`export verificato: ${precache.length} URL del service worker, ${riferimenti} riferimenti nelle pagine, ` +
  `${script} script sintatticamente validi, sitemap e ${domande} domande attive; nessun file interno.`);
