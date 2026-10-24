#!/usr/bin/env node
'use strict';

// Policy Trusted Types del sito: sa-sw-url (shared.js, registrazione del
// service worker) e sa-sw-import (sw.js, importScripts di app-version.js).
// Accettano solo '/sw.js' e '/app-version.js': qualsiasi altra stringa deve
// essere rifiutata con un errore, anche una quasi uguale.
//
// Uso: node scripts/trusted_types_smoke.js   (E2E_BASE_URL come run_e2e.sh)

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { chromium } = require('playwright');

const BASE = (process.env.E2E_BASE_URL || 'http://127.0.0.1:4173').replace(/\/+$/, '');
const AMMESSI = ['/sw.js', '/app-version.js'];
const RIFIUTATI = ['/evil.js', 'https://example.com/sw.js', '/sw.js?x=1', '/js/../sw.js', 'sw.js', ''];

// sa-sw-import: sw.js gira in un contesto finto che tiene la policy creata.
function policySw() {
  let creata = null;
  const self = {
    location: { origin: 'https://sw.test' },
    addEventListener() {},
    trustedTypes: { createPolicy: (nome, regole) => { creata = { nome, ...regole }; return { createScriptURL: regole.createScriptURL }; } }
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8'), {
    self, URL, Response, setTimeout, caches: {}, fetch() {}, importScripts() { self.SA = { cacheName: 'x' }; }
  });
  return creata;
}

function controlla(nome, crea, errori) {
  AMMESSI.forEach((u) => {
    try { if (crea(u) !== u) errori.push(`${nome}: ${u} cambiato`); } catch (e) { errori.push(`${nome}: ${u} rifiutato (${e.message})`); }
  });
  RIFIUTATI.forEach((u) => {
    let rifiutato = false;
    try { crea(u); } catch (_) { rifiutato = true; }
    if (!rifiutato) errori.push(`${nome}: «${u}» accettato`);
  });
}

async function main() {
  const errori = [];

  const sw = policySw();
  assert.ok(sw, 'sw.js non ha creato la policy');
  assert.strictEqual(sw.nome, 'sa-sw-import');
  controlla('sa-sw-import', sw.createScriptURL, errori);

  // sa-sw-url: nel browser, dopo la registrazione del service worker.
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`${BASE}/index.html`, { waitUntil: 'load' });
    await page.waitForFunction(() => window.SA && window.SA._swUrlPolicy, null, { timeout: 10000 });
    const esiti = await page.evaluate(([ammessi, rifiutati]) => {
      const p = window.SA._swUrlPolicy;
      const prova = (u) => { try { return String(p.createScriptURL(u)); } catch (e) { return 'RIFIUTATO'; } };
      return { nome: p.name, ammessi: ammessi.map(prova), rifiutati: rifiutati.map(prova) };
    }, [AMMESSI, RIFIUTATI]);
    if (esiti.nome !== 'sa-sw-url') errori.push(`policy di shared.js: nome ${esiti.nome}`);
    esiti.ammessi.forEach((r, i) => { if (r !== AMMESSI[i]) errori.push(`sa-sw-url: ${AMMESSI[i]} → ${r}`); });
    esiti.rifiutati.forEach((r, i) => { if (r !== 'RIFIUTATO') errori.push(`sa-sw-url: «${RIFIUTATI[i]}» accettato`); });
    await context.close();
  } finally {
    await browser.close();
  }

  process.stdout.write(`${errori.length ? '[FAIL]' : '[OK]'} Trusted Types: sa-sw-url e sa-sw-import accettano solo ${AMMESSI.join(' e ')}\n`);
  errori.forEach((e) => process.stdout.write(`  - ${e}\n`));
  return errori.length ? 1 : 0;
}

main().then((code) => process.exit(code)).catch((err) => {
  console.error('[KO]', err.message);
  process.exit(1);
});
