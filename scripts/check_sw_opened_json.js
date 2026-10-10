#!/usr/bin/env node
// Verifica refetchOpenedJson (sw.js): al cambio di versione i json/<materia>.json
// che stavano nella cache vecchia devono finire nella nuova riscaricati dalla
// rete, mai copiati, e un file che non arriva deve restare fuori. sw.js gira
// qui dentro con Cache Storage e fetch finti; il giro vero si prova
// sull'anteprima Cloudflare della PR.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ORIGIN = 'https://sw.test';
const OLD = 'lascuolaamica-v1';
const NEW = 'lascuolaamica-v2';

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
  setTimeout,
  fetch: fakeFetch,
  importScripts: () => { self.SA = { cacheName: NEW }; },
  caches: {
    keys: async () => Array.from(stores.keys()),
    open: async (name) => openCache(name),
    delete: async (name) => stores.delete(name)
  }
});

async function fire(type) {
  let done;
  handlers[type]({ waitUntil: (p) => { done = p; } });
  await done;
}

const inNew = (p) => (stores.get(NEW) || new Map()).get(ORIGIN + p);
const seedOld = (p) => openCache(OLD).put(p, { ok: true, body: 'vecchia' });

(async () => {
  // install: storia e geografia erano aperte, la rete perde geografia.
  await Promise.all(['/json/storia.json', '/json/geografia.json', '/json/index.json', '/shared.js'].map(seedOld));
  offline = new Set(['/json/geografia.json']);
  await fire('install');
  assert.strictEqual(inNew('/json/storia.json').body, 'rete', 'storia va riscaricata, non copiata');
  assert.strictEqual(inNew('/json/geografia.json'), undefined, 'geografia non arrivata: niente copia vecchia');
  assert.strictEqual(fetched.filter((p) => p === '/json/index.json').length, 1, 'index.json e\' gia\' in precache: una sola richiesta');
  assert.ok(!fetched.includes('/json/scienze.json'), 'le materie mai aperte non si scaricano');
  assert.ok(stores.has(OLD), 'install non tocca la cache vecchia');

  // activate: scienze aperta dopo l'install, geografia ritenta e stavolta arriva.
  await seedOld('/json/scienze.json');
  offline = new Set();
  fetched.length = 0;
  await fire('activate');
  assert.strictEqual(inNew('/json/scienze.json').body, 'rete');
  assert.strictEqual(inNew('/json/geografia.json').body, 'rete');
  assert.deepStrictEqual(fetched.sort(), ['/json/geografia.json', '/json/scienze.json'], 'activate chiede solo cio\' che manca');
  assert.ok(!stores.has(OLD), 'activate cancella la cache vecchia');

  // activate senza rete: niente copia, e l'attivazione va comunque in fondo.
  await seedOld('/json/civica.json');
  offline = 'all';
  await fire('activate');
  assert.strictEqual(inNew('/json/civica.json'), undefined);
  assert.ok(!stores.has(OLD));
})().catch((err) => {
  console.error(`[ERROR] sw.js materie gia' aperte: ${err.message}`);
  process.exit(1);
});
