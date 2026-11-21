#!/usr/bin/env node
'use strict';

// Autotest di scripts/lib/qa_regole.js: una pagina finta con un difetto per
// regola e una parte pulita. Ogni regola deve scattare sul suo difetto e
// tacere sulla parte pulita. Se una regola diventa cieca (selettore rotto,
// soglia sbagliata) qa_pagine.js passerebbe in silenzio: questo lo impedisce.
//
// Uso: node scripts/qa_regole_autotest.js

// QA_BROWSER=webkit fa girare gli stessi controlli nel motore di Safari.
const playwright = require('playwright');
const MOTORE = process.env.QA_BROWSER || 'chromium';
if (!['chromium', 'webkit'].includes(MOTORE)) throw new Error(`QA_BROWSER sconosciuto: ${MOTORE}`);
const { controlla } = require('./lib/qa_regole.js');

const BASE = `
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Nunito', sans-serif; width: 360px; }
  h2 { font-size: 20px; }
  button { font-family: inherit; }
  .box { border: 1px solid #000; }
  .pulita th, .pulita td { padding: 4px; }
  .pulita h2 + p { margin-top: 6px; }
  .pulita p + p, .pulita p + table { margin-top: 10px; }
</style>`;

// [regola attesa, frammento HTML con il difetto]
const DIFETTI = [
  ['scroll-orizzontale', '<div style="width:600px">largo</div>'],
  ['riquadro-vuoto', '<div class="box" style="height:40px"></div>'],
  ['testo-attaccato', '<p>Primo paragrafo.</p><h2>Titolo attaccato</h2>'],
  ['senza-stile', '<section class="seo"><h3>Titolo senza stile</h3></section>'],
  ['senza-stile', '<table><tr><td>12</td><td>24</td></tr></table>'],
  ['sovrapposizione', '<div><p style="height:30px">Uno</p><p style="margin-top:-20px">Due</p></div>'],
  ['coperto', '<div style="position:relative"><p>Testo sotto</p><div style="position:absolute;inset:0;background:#fff">copre</div></div>'],
  ['coperto', '<p>Coperto in fondo</p><div style="position:fixed;bottom:0;left:0;right:0;height:100vh;background:#fff">barra</div>'],
  ['testo-tagliato', '<div style="width:60px;overflow:hidden;white-space:nowrap">testo molto lungo che esce</div>'],
  ['bersaglio-piccolo', '<div><button style="width:16px;height:16px">a</button><button style="width:16px;height:16px">b</button></div>'],
  ['font-estraneo', '<p style="font-family:Georgia">Font sbagliato</p>'],
  ['a-capo-orfano', '<h2 style="width:300px"><span style="display:inline-block;width:290px">Titolo lungo</span> 🔤</h2>']
];

const PULITA = `
<div class="pulita">
  <h2>Titolo</h2>
  <p>Un paragrafo normale.</p>
  <p>Un secondo paragrafo staccato.</p>
  <table><tr><th>A</th><td>1</td></tr></table>
  <div class="box"><p>Riquadro con testo</p></div>
  <button style="width:44px;height:44px">ok</button>
  <span class="sr-only" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">solo lettori di schermo</span>
</div>`;

async function main() {
  const browser = await playwright[MOTORE].launch();
  const page = await browser.newPage({ viewport: { width: 400, height: 700 } });
  const errori = [];
  try {
    await page.setContent(`<!doctype html><html lang="it"><head>${BASE}</head><body>${PULITA}</body></html>`);
    const pulita = await page.evaluate(controlla, {});
    for (const p of pulita) errori.push(`falso allarme sulla parte pulita: ${p.regola} ${p.dove} ${p.dettaglio}`);

    for (const [regola, html] of DIFETTI) {
      await page.setContent(`<!doctype html><html lang="it"><head>${BASE}</head><body>${html}</body></html>`);
      for (const inFondo of [false, true]) {
        if (inFondo) await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
        const trovati = await page.evaluate(controlla, { inFondo });
        if (trovati.some((t) => t.regola === regola)) break;
        if (inFondo) errori.push(`regola cieca: ${regola} non scatta su ${html.slice(0, 70)}`);
      }
    }
  } finally {
    await browser.close();
  }
  if (errori.length) {
    errori.forEach((e) => process.stdout.write(`ERRORE qa-autotest: ${e}\n`));
    process.exit(1);
  }
  process.stdout.write(`OK qa-autotest: ${DIFETTI.length} difetti trovati, parte pulita senza allarmi\n`);
}

main().catch((err) => {
  process.stderr.write(`${err.stack || err}\n`);
  process.exit(1);
});
