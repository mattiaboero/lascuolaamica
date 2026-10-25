#!/usr/bin/env node
// Prova scripts/lib/percorso_sicuro.js, l'helper dei server statici dei test,
// con richieste HTTP vere: una cartella temporanea «sito» con accanto
// «sito-backup», lo stesso prefisso che faceva passare il vecchio
// `file.startsWith(ROOT)` (avviso CodeQL #4).
//
// Uso: node scripts/check_percorso_sicuro.js   (gira in npm run verify)

const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const { fileServito } = require('./lib/percorso_sicuro.js');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'percorso-sicuro-'));
const ROOT = path.join(tmp, 'sito');
fs.mkdirSync(ROOT);
fs.mkdirSync(path.join(tmp, 'sito-backup'));
fs.writeFileSync(path.join(ROOT, 'index.html'), 'home');
fs.writeFileSync(path.join(ROOT, 'a.txt'), 'dentro');
fs.writeFileSync(path.join(tmp, 'sito-backup', 'x'), 'fuori');

const CASI = [
  ['/', 200],
  ['/a.txt', 200],
  ['/a.txt?v=1', 200],
  ['/../sito-backup/x', 404],
  ['/%2e%2e/sito-backup/x', 404],
  ['/..%2fsito-backup%2fx', 404],
  ['/%2e%2e%2fsito-backup%2fx', 404],
  ['/a.txt%00', 404],
  ['/%00', 404],
  ['/%E0%A4%A', 404]
];

const server = http.createServer((req, res) => {
  const trovato = fileServito(ROOT, req.url);
  res.writeHead(trovato ? 200 : 404);
  res.end(trovato ? fs.readFileSync(trovato.file) : '');
});

// http.request manda il percorso cosi' com'e', senza normalizzare i '..'.
const chiedi = (port, url) => new Promise((resolve, reject) => {
  http.get({ host: '127.0.0.1', port, path: url }, (res) => {
    res.resume();
    res.on('end', () => resolve(res.statusCode));
  }).on('error', reject);
});

server.listen(0, '127.0.0.1', async () => {
  const errori = [];
  try {
    for (const [url, atteso] of CASI) {
      const stato = await chiedi(server.address().port, url);
      if (stato !== atteso) errori.push(`${url}: ${stato}, atteso ${atteso}`);
    }
    // Il caso deve davvero ingannare il controllo di prima: se no non prova niente.
    const vecchio = path.join(ROOT, '../sito-backup/x');
    if (!vecchio.startsWith(ROOT)) errori.push('il caso «sito-backup» non inganna piu\' startsWith: il controllo non prova niente');
  } catch (e) {
    errori.push(String(e));
  } finally {
    server.close();
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  if (errori.length) {
    console.error('[ERROR] percorso_sicuro.js:');
    errori.forEach((e) => console.error('  ' + e));
    process.exit(1);
  }
  console.log(`[OK] percorso_sicuro.js: ${CASI.length} richieste, nessun file fuori dalla cartella servito`);
});
