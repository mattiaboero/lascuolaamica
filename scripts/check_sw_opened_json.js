#!/usr/bin/env node
// Verifica refetchOpenedJson (sw.js): al cambio di versione i json/<materia>.json
// che stavano nella cache vecchia devono finire nella nuova riscaricati dalla
// rete, mai copiati, e un file che non arriva deve restare fuori. Verifica
// anche che una cache vecchia rimasta non risponda al posto di quella corrente
// e che venga tolta anche se activate non e' mai girato (Safari). Le pagine
// HTML: alla prima installazione si scarica solo '/'; al cambio di versione
// quelle gia' visitate, home compresa, si copiano dalla cache vecchia senza
// rete, e '/' si chiede alla rete solo se la copia manca. sw.js gira
// qui dentro con Cache Storage e fetch finti; il giro vero si prova
// sull'anteprima Cloudflare della PR.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ORIGIN = 'https://sw.test';
const OLD = 'lascuolaamica-v1';
const NEW = 'lascuolaamica-v2';
const NEWER = 'lascuolaamica-v3';
const NOTE = '/__sw/older-caches';

const abs = (u) => new URL(typeof u === 'string' ? u : u.url, ORIGIN).href;
const stores = new Map();
const fetched = [];
let offline = new Set();

function openCache(name) {
  if (!stores.has(name)) stores.set(name, new Map());
  const store = stores.get(name);
  const cache = {
    keys: async () => Array.from(store.keys(), (url) => ({ url })),
    match: async (u) => store.get(abs(u)),
    put: async (u, res) => { store.set(abs(u), res); },
    delete: async (u) => store.delete(abs(u)),
    add: async (u) => {
      const res = await fakeFetch(u);
      if (!res.ok) throw new TypeError('risposta non ok');
      store.set(abs(u), res);
    },
    addAll: (urls) => Promise.all(urls.map(cache.add))
  };
  return cache;
}

async function fakeFetch(u) {
  const { pathname } = new URL(abs(u));
  fetched.push(pathname);
  if (offline === 'all' || offline.has(pathname)) throw new TypeError('rete assente');
  return { ok: true, status: 200, body: 'rete', clone() { return this; } };
}

// Ogni chiamata e' un avvio del worker: stesso Cache Storage, memoria nuova.
function bootWorker() {
  const handlers = {};
  const self = {
    location: { origin: ORIGIN },
    addEventListener: (type, fn) => { handlers[type] = fn; },
    clients: { claim: async () => {} },
    skipWaiting() {}
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8'), {
    self,
    URL,
    Response,
    setTimeout,
    fetch: fakeFetch,
    importScripts: () => { self.SA = { cacheName: NEW }; },
    caches: {
      keys: async () => Array.from(stores.keys()),
      open: async (name) => openCache(name),
      delete: async (name) => stores.delete(name),
      // Senza cacheName guarda tutte le cache dalla piu' vecchia, come il browser.
      match: async (u, opts) => {
        const names = opts && opts.cacheName ? [opts.cacheName] : Array.from(stores.keys());
        for (const name of names) {
          const hit = (stores.get(name) || new Map()).get(abs(u));
          if (hit) return hit;
        }
        return undefined;
      }
    }
  });
  return {
    async fire(type) {
      let done;
      handlers[type]({ waitUntil: (p) => { done = p; } });
      await done;
    },
    // Una richiesta di pagina: torna la risposta e aspetta i lavori in coda.
    async request(pathname, mode = 'no-cors') {
      const waits = [];
      let response;
      handlers.fetch({
        request: { url: ORIGIN + pathname, method: 'GET', mode },
        respondWith: (p) => { response = p; },
        waitUntil: (p) => { waits.push(p); }
      });
      const res = await response;
      await Promise.all(waits);
      return res;
    }
  };
}

const inNew = (p) => (stores.get(NEW) || new Map()).get(ORIGIN + p);
// Pagina = path senza estensione, come le rotte pulite del sito.
const isPage = (p) => !path.extname(p);
const seed = (name, p) => openCache(name).put(p, {
  ok: true,
  body: name === OLD ? 'vecchia' : 'piu\' nuova',
  headers: new Headers({ 'content-type': isPage(p) ? 'text/html; charset=utf-8' : 'application/octet-stream' })
});
const seedOld = (p) => seed(OLD, p);

(async () => {
  let sw = bootWorker();

  // install: storia e geografia erano aperte, la rete perde geografia.
  await Promise.all(['/json/storia.json', '/json/geografia.json', '/json/index.json', '/shared.js', '/', '/storia'].map(seedOld));
  offline = new Set(['/json/geografia.json']);
  await sw.fire('install');
  assert.deepStrictEqual(fetched.filter(isPage), [], 'bump con la home nella cache vecchia: nessuna pagina scaricata');
  assert.strictEqual(inNew('/json/storia.json').body, 'rete', 'storia va riscaricata, non copiata');
  assert.strictEqual(inNew('/json/geografia.json'), undefined, 'geografia non arrivata: niente copia vecchia');
  assert.strictEqual(fetched.filter((p) => p === '/json/index.json').length, 1, 'index.json e\' gia\' in precache: una sola richiesta');
  assert.ok(!fetched.includes('/json/scienze.json'), 'le materie mai aperte non si scaricano');
  assert.ok(stores.has(OLD), 'install non tocca la cache vecchia');
  assert.deepStrictEqual(await inNew(NOTE).json(), [OLD], 'install annota le cache che c\'erano gia\'');

  // activate: scienze aperta dopo l'install, geografia ritenta e stavolta arriva.
  await seedOld('/json/scienze.json');
  offline = new Set();
  fetched.length = 0;
  await sw.fire('activate');
  assert.strictEqual(inNew('/json/scienze.json').body, 'rete');
  assert.strictEqual(inNew('/json/geografia.json').body, 'rete');
  assert.deepStrictEqual(fetched.sort(), ['/json/geografia.json', '/json/scienze.json'], 'activate chiede solo cio\' che manca, nessuna pagina');
  assert.strictEqual(inNew('/storia').body, 'vecchia', 'la pagina visitata si copia dalla cache vecchia, senza rete');
  assert.strictEqual(inNew('/').body, 'vecchia', 'la home arriva copiata dalla cache vecchia, senza rete');
  assert.strictEqual(inNew('/shared.js').body, 'rete', 'si copiano solo le pagine HTML');
  assert.ok(!stores.has(OLD), 'activate cancella la cache vecchia');
  assert.strictEqual(inNew(NOTE), undefined, 'dopo activate la nota non serve piu\'');

  // activate senza rete: niente copia, e l'attivazione va comunque in fondo.
  await seedOld('/json/civica.json');
  offline = 'all';
  await sw.fire('activate');
  assert.strictEqual(inNew('/json/civica.json'), undefined);
  assert.ok(!stores.has(OLD));

  // Safari: l'app viene chiusa con l'aggiornamento in attesa e alla riapertura
  // il worker nuovo e' attivo senza che activate sia mai girato.
  stores.clear();
  fetched.length = 0;
  offline = new Set();
  await Promise.all(['/json/storia.json', '/shared.js', '/', '/faq'].map(seedOld));
  sw = bootWorker();
  await sw.fire('install');
  await seedOld('/json/scienze.json'); // aperta dopo «Più tardi»
  await seed(NEWER, '/shared.js'); // una versione ancora piu' nuova, in attesa
  await seed(NEWER, '/premi');
  sw = bootWorker(); // riapertura: memoria nuova, niente activate

  const shared = await sw.request('/shared.js');
  assert.strictEqual(shared.body, 'rete', 'cacheFirst non deve servire il file della cache vecchia');
  assert.ok(!stores.has(OLD), 'la prima richiesta toglie la cache vecchia anche senza activate');
  assert.strictEqual(inNew('/json/scienze.json').body, 'rete', 'la materia aperta dopo «Più tardi» va riportata prima di cancellare');
  assert.strictEqual(inNew('/faq').body, 'vecchia', 'anche senza activate le pagine visitate passano nella cache nuova');
  assert.strictEqual(inNew('/premi'), undefined, 'dalla cache di una versione piu\' nuova non si copia niente');
  assert.ok(stores.has(NEWER), 'la cache di una versione piu\' nuova in attesa non si tocca');
  assert.strictEqual(inNew(NOTE), undefined, 'a pulizia fatta la nota sparisce');

  // Offline, pagina non in cache corrente: si ripiega sulla home corrente, mai
  // su una pagina di un'altra versione.
  await seed(NEWER, '/storia');
  offline = 'all';
  const page = await sw.request('/storia', 'navigate');
  assert.strictEqual(page, inNew('/'), 'il ripiego offline e\' la home della cache corrente');
  assert.notStrictEqual(page.body, 'piu\' nuova', 'il ripiego offline legge solo le cache correnti');

  // Richieste di pagina partite da sole, install piu' activate, nei tre casi.
  const autoPages = async (oldPages, between = async () => {}) => {
    stores.clear();
    offline = new Set();
    await Promise.all(oldPages.map(seedOld));
    fetched.length = 0;
    const worker = bootWorker();
    await worker.fire('install');
    await between();
    await worker.fire('activate');
    return fetched.filter(isPage);
  };

  assert.deepStrictEqual(await autoPages([]), ['/'], 'prima installazione: una richiesta, la home');
  assert.strictEqual(inNew('/').body, 'rete');

  assert.deepStrictEqual(await autoPages(['/', '/storia']), [], 'bump con la home nella cache vecchia: nessuna richiesta');
  assert.strictEqual(inNew('/').body, 'vecchia');
  assert.strictEqual(inNew('/storia').body, 'vecchia');

  assert.deepStrictEqual(await autoPages(['/storia']), ['/'], 'bump senza la home nella cache vecchia: una richiesta');
  assert.strictEqual(inNew('/').body, 'rete');

  // La home c'era all'install ma sparisce prima di activate: la copia manca,
  // la cache nuova la chiede comunque alla rete.
  const lost = await autoPages(['/', '/storia'], () => openCache(OLD).delete('/'));
  assert.deepStrictEqual(lost, ['/'], 'copia mancata: la home si chiede alla rete');
  assert.strictEqual(inNew('/').body, 'rete', 'la cache nuova ha sempre la home');
})().catch((err) => {
  console.error(`[ERROR] sw.js materie gia' aperte: ${err.message}`);
  process.exit(1);
});
