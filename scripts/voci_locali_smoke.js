#!/usr/bin/env node
'use strict';

// Sintesi vocale solo con voci installate sul dispositivo (SA.voice in
// shared.js). Con sole voci di rete speechSynthesis.speak non deve partire
// mai e i pulsanti Ascolta che dipendono dalla sintesi restano nascosti; con
// una voce locale si parla. Tre pagine: un quiz, /bosco, /sistema-solare.
//
// Le voci sono finte: getVoices e speak vengono sostituiti prima che la
// pagina parta, e speak si limita a contare.
//
// Uso: node scripts/voci_locali_smoke.js   (E2E_BASE_URL come run_e2e.sh)

const { chromium } = require('playwright');

const BASE = (process.env.E2E_BASE_URL || 'http://127.0.0.1:4173').replace(/\/+$/, '');

const VOCI = {
  remote: [
    { name: 'Google italiano', lang: 'it-IT', localService: false },
    { name: 'Google US English', lang: 'en-US', localService: false }
  ],
  locale: [
    { name: 'Google italiano', lang: 'it-IT', localService: false },
    { name: 'Alice', lang: 'it-IT', localService: true }
  ]
};

async function nuovaPagina(browser, voci, storage) {
  const context = await browser.newContext();
  await context.addInitScript(({ voci: list, storage: items }) => {
    Object.entries(items).forEach(([k, v]) => {
      try { window.localStorage.setItem(k, v); } catch (_) {}
    });
    window.__parlato = [];
    // Il setter di utterance.voice vuole una SpeechSynthesisVoice vera: con
    // voci finte serve anche un'Utterance finta.
    window.SpeechSynthesisUtterance = class {
      constructor(text) { this.text = text; }
    };
    const synth = window.speechSynthesis;
    synth.getVoices = () => list.map((v) => ({ ...v, voiceURI: v.name, default: false }));
    synth.speak = (u) => {
      window.__parlato.push(u.text);
      setTimeout(() => { if (u.onend) u.onend(); }, 20);
    };
  }, { voci, storage });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  return { context, page, errors };
}

const parlato = (page) => page.evaluate(() => window.__parlato.length);

async function quiz(browser, tipo) {
  const { context, page, errors } = await nuovaPagina(browser, VOCI[tipo], {});
  try {
    await page.goto(`${BASE}/matematica.html`, { waitUntil: 'networkidle' });
    await page.locator('[data-action="start-game"]').click();
    await page.waitForSelector('#screenGame.active', { timeout: 15000 });
    const btn = page.locator('#screenGame .speak-btn');
    if (tipo === 'remote') {
      if (await btn.isVisible()) errors.push('Ascolta visibile con sole voci di rete');
    } else {
      await btn.click();
      await page.waitForTimeout(100);
    }
    const n = await parlato(page);
    if (tipo === 'remote' && n) errors.push(`speak chiamato ${n} volte`);
    if (tipo === 'locale' && !n) errors.push('speak mai chiamato con una voce locale');
  } finally {
    await context.close();
  }
  return errors;
}

// Errore al tabellone: il gufo legge la parola da solo, se c'e' una voce
// locale e l'audio non e' disattivato.
async function bosco(browser, tipo, muto) {
  const storage = {};
  if (muto) storage.lascuolaamica_bosco_muted_v1 = '1';
  const { context, page, errors } = await nuovaPagina(browser, VOCI[tipo], storage);
  try {
    await page.goto(`${BASE}/bosco.html`, { waitUntil: 'networkidle' });
    await page.evaluate(async () => {
      const b = window.SA.bosco;
      await b.entra();
      const s = b.state;
      const r = s.session[s.roundIndex];
      b.collect(r.choices.findIndex((c) => !b.isCorrect(r, c)));
      b.consegna();
    });
    await page.waitForTimeout(100);
    const automatico = await parlato(page);
    const atteso = tipo === 'locale' && !muto ? 1 : 0;
    if (automatico !== atteso) errors.push(`lettura dopo l'errore: ${automatico} invece di ${atteso}`);
    const listen = page.locator('#boscoListen');
    if (tipo === 'remote') {
      if (await listen.isVisible()) errors.push('Ascolta visibile con sole voci di rete');
    } else {
      await listen.click();
      await page.waitForTimeout(100);
      if ((await parlato(page)) !== automatico + 1) errors.push('Ascolta non legge con una voce locale');
    }
  } finally {
    await context.close();
  }
  return errors;
}

// Cerere non ha un audio registrato: dipende solo dalla sintesi. La Terra
// ce l'ha, e il suo Ascolta resta anche senza voci locali.
async function sistemaSolare(browser, tipo) {
  const { context, page, errors } = await nuovaPagina(browser, VOCI[tipo], {});
  try {
    for (const id of ['cerere', 'terra']) {
      await page.goto(`${BASE}/sistema-solare.html#${id}`, { waitUntil: 'load' });
      const btn = page.locator(`[data-ascolta="c:${id}"]`).first();
      await btn.waitFor({ state: 'attached', timeout: 20000 });
      await page.waitForTimeout(200);
      const visibile = await btn.isVisible();
      if (id === 'terra' && !visibile) errors.push('Ascolta della Terra (audio registrato) nascosto');
      if (id === 'cerere' && visibile !== (tipo === 'locale')) errors.push(`Ascolta di Cerere ${visibile ? 'visibile' : 'nascosto'} con voci ${tipo}`);
      if (id === 'cerere' && visibile) {
        await btn.click();
        await page.waitForTimeout(100);
        if (!(await parlato(page))) errors.push('Ascolta di Cerere non legge con una voce locale');
      }
    }
    if (tipo === 'remote' && (await parlato(page))) errors.push('speak chiamato con sole voci di rete');
  } finally {
    await context.close();
  }
  return errors;
}

async function main() {
  const browser = await chromium.launch();
  let fail = 0;
  const casi = [
    ['quiz voci di rete', (b) => quiz(b, 'remote')],
    ['quiz voce locale', (b) => quiz(b, 'locale')],
    ['bosco voci di rete', (b) => bosco(b, 'remote', false)],
    ['bosco voce locale', (b) => bosco(b, 'locale', false)],
    ['bosco voce locale, audio spento', (b) => bosco(b, 'locale', true)],
    ['sistema solare voci di rete', (b) => sistemaSolare(b, 'remote')],
    ['sistema solare voce locale', (b) => sistemaSolare(b, 'locale')]
  ];
  try {
    for (const [nome, fn] of casi) {
      const errors = await fn(browser);
      process.stdout.write(`${errors.length ? '[FAIL]' : '[OK]'} ${nome}\n`);
      errors.forEach((e) => process.stdout.write(`  - ${e}\n`));
      fail += errors.length;
    }
  } finally {
    await browser.close();
  }
  return fail ? 1 : 0;
}

main().then((code) => process.exit(code)).catch((err) => {
  console.error('[KO]', err.message);
  process.exit(1);
});
