#!/usr/bin/env node
'use strict';

// Quiz su smartphone (375x667 e 390x844), con domande fissate per id: il
// dataset della materia viene intercettato e ridotto a una sola domanda (piu'
// le bonus), cosi' il test non dipende da quale domanda esce.
//
// Senza figura la domanda sta tutta nello schermo: dopo «Inizia!» le quattro
// risposte e poi «Avanti» sono dentro la finestra, e elementFromPoint al
// centro e appena sopra il bordo basso restituisce l'elemento stesso (niente
// di fisso sopra: fino alla 4.23.0 il footer era una barra alta fino a 169px).
//
// Con figura, sui telefoni bassi, la scheda e' piu' alta dello schermo e si
// scorre (decisione della 4.23.1). Dopo «Inizia!» la scheda e' in cima: si
// vedono la parte alta della figura e il testo. Portata in vista, nessuna
// risposta e' coperta, e anche «Avanti» si raggiunge e si tocca.
//
// Uso: node scripts/quiz_viewport_smoke.js   (E2E_BASE_URL come run_e2e.sh)

const { chromium } = require('playwright');

const BASE = (process.env.E2E_BASE_URL || 'http://127.0.0.1:4173').replace(/\/+$/, '');
const VIEWS = [[375, 667], [390, 844]];
const CLASS_PREF = {
  matematica: 'matematica_programma_cursor_v3_class_pref_v1',
  inglese: 'englishAdventure_class_pref_v1'
};
const SENZA_FIGURA = [
  ['matematica', 'mat-3-aritmetica-090', 3],
  ['matematica', 'mat-3-aritmetica-096', 3],
  ['matematica', 'mat-3-proprieta-9697', 3],
  // inglese ha i livelli: ogni domanda deve rientrare nei filtri di un
  // livello (area, sottoarea, difficolta'), altrimenti nessun livello e' attivo.
  ['inglese', 'eng-3-meteo-002', 3],
  ['inglese', 'eng-3-cibo-9024', 3],
  ['inglese', 'eng-3-frasi_semplici-9152', 3]
];
const CON_FIGURA = [
  ['matematica', 'mat-2-orologio-9197', 2],
  ['matematica', 'mat-4-angoli-9764', 4],
  ['matematica', 'mat-2-linee-9206', 2]
];

async function apri(browser, w, h, pagina, id, classe) {
  const context = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
  await context.addInitScript(([key, value]) => localStorage.setItem(key, value), [CLASS_PREF[pagina], String(classe)]);
  let attesa = '';
  // Le domande arrivano per classe (json/<materia>/c<N>.json): in ogni file
  // resta solo la domanda fissata, se c'e'. Le bonus (bonus.json) restano.
  await context.route(new RegExp(`/json/${pagina}/c[1-5]\\.json$`), async (route) => {
    const response = await route.fetch();
    const data = await response.json();
    data.questions = data.questions.filter((q) => q.id === id);
    if (data.questions.length) attesa = data.questions[0].question;
    await route.fulfill({ response, json: data });
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(`${BASE}/${pagina}.html`, { waitUntil: 'networkidle' });
  if (!attesa) throw new Error(`domanda ${id} non trovata`);
  await page.locator('#screenStart [data-action="start-game"]').click();
  if (await page.locator('#screenLevels.active').count()) {
    await page.locator('#screenLevels [data-action="start-level"]:not([disabled])').first().click();
  }
  await page.waitForSelector('#screenGame.active');
  await page.waitForTimeout(1000); // scroll morbido verso la scheda
  // La domanda a schermo deve essere quella fissata (confronto sulle prime
  // parole: il quiz puo' riscrivere i trattini bassi delle frasi da completare).
  const shown = await page.evaluate(() => document.getElementById('qText').textContent);
  const inizio = (t) => t.replace(/\s+/g, ' ').trim().slice(0, 12);
  if (inizio(shown) !== inizio(attesa)) errors.push(`a schermo «${shown.slice(0, 40)}» invece di «${attesa.slice(0, 40)}»`);
  return { context, page, errors };
}

// Per ogni elemento: dentro la finestra e libero al centro e al bordo basso.
function controlla(page, selector) {
  return page.evaluate((sel) => {
    const vh = window.innerHeight;
    return [...document.querySelectorAll(sel)].filter((e) => e.offsetParent !== null).map((e, i) => {
      const r = e.getBoundingClientRect();
      const x = r.left + r.width / 2;
      const punti = [r.top + r.height / 2, r.bottom - 2];
      const sopra = punti.map((y) => (y >= 0 && y <= vh ? document.elementFromPoint(x, y) : null))
        .filter((t) => t && t !== e && !e.contains(t))
        .map((t) => t.className || t.tagName);
      return { i: i + 1, top: Math.round(r.top), bottom: Math.round(r.bottom), vh, dentro: r.top >= 0 && r.bottom <= vh, sopra };
    });
  }, selector);
}

// Porta in vista un elemento (come farebbe chi scorre) e dice se al suo
// centro c'e' lui o qualcos'altro.
function libero(page, selector, index) {
  return page.evaluate(([sel, i]) => {
    const e = document.querySelectorAll(sel)[i];
    e.scrollIntoView({ block: 'center' });
    const r = e.getBoundingClientRect();
    const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return t === e || e.contains(t) ? '' : (t ? t.className || t.tagName : 'niente');
  }, [selector, index]);
}

// Risposta con un evento e non con click(): click() scorrerebbe la pagina da
// solo e nasconderebbe il difetto che si cerca.
async function rispondi(page) {
  await page.locator('#answers .answer-btn').first().dispatchEvent('click');
  await page.waitForSelector('#qNext:not([hidden])');
  await page.waitForTimeout(400);
}

async function senzaFigura(browser, w, h, pagina, id, classe) {
  const { context, page, errors } = await apri(browser, w, h, pagina, id, classe);
  try {
    if (await page.locator('#screenGame .q-figure').count()) errors.push('la domanda ha una figura');
    const risposte = await controlla(page, '#answers .answer-btn');
    if (risposte.length !== 4) errors.push(`${risposte.length} risposte invece di 4`);
    risposte.forEach((r) => {
      if (!r.dentro) errors.push(`risposta ${r.i} fuori dalla finestra (${r.top}-${r.bottom}, finestra ${r.vh})`);
      if (r.sopra.length) errors.push(`risposta ${r.i} coperta da ${r.sopra.join(', ')}`);
    });
    await rispondi(page);
    const [avanti] = await controlla(page, '#qNext');
    if (!avanti) errors.push('«Avanti» non compare');
    else {
      if (!avanti.dentro) errors.push(`«Avanti» fuori dalla finestra (${avanti.top}-${avanti.bottom}, finestra ${avanti.vh})`);
      if (avanti.sopra.length) errors.push(`«Avanti» coperto da ${avanti.sopra.join(', ')}`);
    }
  } finally {
    await context.close();
  }
  return errors;
}

async function conFigura(browser, w, h, pagina, id, classe) {
  const { context, page, errors } = await apri(browser, w, h, pagina, id, classe);
  try {
    const pos = await page.evaluate(() => {
      const r = (s) => document.querySelector(s).getBoundingClientRect();
      return { vh: window.innerHeight, card: Math.round(r('#screenGame .q-card').top), testo: Math.round(r('#qText').top), fig: Math.round(r('#screenGame .q-figure').top) };
    });
    // In cima la scheda, non meta' figura: bordo alto della scheda appena
    // sotto il bordo della finestra, testo e inizio della figura visibili.
    if (pos.card < 0 || pos.card > 24) errors.push(`dopo «Inizia!» la scheda non e' in cima (bordo a ${pos.card}px)`);
    if (pos.testo < 0 || pos.testo > pos.vh - 40) errors.push(`testo della domanda non visibile (a ${pos.testo}px)`);
    if (pos.fig < 0 || pos.fig > pos.vh - 40) errors.push(`parte alta della figura non visibile (a ${pos.fig}px)`);
    const sullaFigura = await libero(page, '#screenGame .q-figure', 0);
    if (sullaFigura) errors.push(`figura coperta da ${sullaFigura}`);
    for (let i = 0; i < 4; i++) {
      const sopra = await libero(page, '#answers .answer-btn', i);
      if (sopra) errors.push(`risposta ${i + 1} coperta da ${sopra}`);
    }
    await rispondi(page);
    const sopraAvanti = await libero(page, '#qNext', 0);
    if (sopraAvanti) errors.push(`«Avanti» coperto da ${sopraAvanti}`);
    // «Avanti» si tocca davvero: la domanda passa oltre.
    await page.locator('#qNext').tap();
    await page.waitForTimeout(400);
    if (await page.locator('#qNext:not([hidden])').count()) errors.push('toccato «Avanti», la partita non va avanti');
  } finally {
    await context.close();
  }
  return errors;
}

async function main() {
  const browser = await chromium.launch();
  let fail = 0;
  const report = (nome, errors) => {
    process.stdout.write(`${errors.length ? '[FAIL]' : '[OK]'} ${nome}\n`);
    errors.forEach((e) => process.stdout.write(`  - ${e}\n`));
    fail += errors.length;
  };
  try {
    for (const [w, h] of VIEWS) {
      for (const [pagina, id, classe] of SENZA_FIGURA) {
        report(`/${pagina} ${w}x${h} ${id}`, await senzaFigura(browser, w, h, pagina, id, classe));
      }
      for (const [pagina, id, classe] of CON_FIGURA) {
        report(`/${pagina} ${w}x${h} ${id} (figura)`, await conFigura(browser, w, h, pagina, id, classe));
      }
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
