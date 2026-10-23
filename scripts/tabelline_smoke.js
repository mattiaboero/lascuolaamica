#!/usr/bin/env node
'use strict';

// Smoke di /tabelline con e senza JavaScript: regressione della 4.21.1.
// La pagina e' statica e deve funzionare identica nei due casi: niente avviso
// noscript, tabella prima dei video, «dell'8» e non «del 8».
// Dalla 4.25.0: le tabelline dall'11 al 100 (#tabellina-11 ... #tabellina-100,
// dieci multipli giusti, «dell'» solo per 11 e 80-89) e il calcolatore, usato
// solo da tastiera: 27, 1 e 1000 giusti, 0 e testo rifiutati con un messaggio.
//
// Uso: node scripts/tabelline_smoke.js   (E2E_BASE_URL come run_e2e.sh)

const { chromium } = require('playwright');

const BASE = (process.env.E2E_BASE_URL || 'http://127.0.0.1:4173').replace(/\/+$/, '');

async function check(browser, javaScriptEnabled) {
  const context = await browser.newContext({ javaScriptEnabled });
  const page = await context.newPage();
  const errors = [];
  try {
    const res = await page.goto(`${BASE}/tabelline.html`, { waitUntil: 'load' });
    if (!res || !res.ok()) errors.push(`HTTP ${res ? res.status() : 'nessuna risposta'}`);

    const main = page.locator('main#contenuto-principale');
    if (!(await main.locator('h1').isVisible())) errors.push('h1 del contenuto principale non visibile');
    if ((await main.locator('.tab-table tbody tr').count()) !== 9) errors.push('la tabella non ha 9 righe');
    if (!(await main.locator('#tabellaTitle').isVisible())) errors.push('#tabellaTitle non visibile');

    const html = await page.content();
    if (/<noscript/i.test(html)) errors.push('<noscript> presente');
    if (!html.includes("Tabellina dell'8")) errors.push("manca «Tabellina dell'8»");
    if (/\bdel 8\b/i.test(html)) errors.push('grafia «del 8» presente');

    // Tabelline dall'11 al 100: testo statico, uguale con e senza JS.
    const righe = await main.locator('li[id^="tabellina-"]').evaluateAll((li) => li.map((e) => [e.id, e.textContent]));
    if (righe.length !== 90) errors.push(`righe 11-100: ${righe.length} invece di 90`);
    for (let n = 11; n <= 100; n += 1) {
      const riga = righe.find(([id]) => id === `tabellina-${n}`);
      const art = n === 11 || (n >= 80 && n <= 89) ? "dell'" : 'del ';
      const attesa = `Tabellina ${art}${n}: ${Array.from({ length: 10 }, (_, k) => n * (k + 1)).join(', ')}`;
      if (!riga) errors.push(`manca #tabellina-${n}`);
      else if (riga[1].trim() !== attesa) errors.push(`#tabellina-${n}: «${riga[1].trim()}»`);
    }
    const decine = await main.locator('.tab-decine a').evaluateAll((a) => a.map((e) => e.getAttribute('href')));
    for (const href of decine) {
      if (!(await page.locator(href).count())) errors.push(`indice: ${href} non porta a niente`);
    }
    if (decine.length !== 9) errors.push(`indice delle decine: ${decine.length} link invece di 9`);
    const calcolatore = await page.locator('#calcolatore').isVisible();
    if (calcolatore !== javaScriptEnabled) errors.push(`calcolatore ${calcolatore ? 'visibile' : 'nascosto'} con JS=${javaScriptEnabled ? 'on' : 'off'}`);

    const tabella = html.indexOf('id="tabellaTitle"');
    const video = html.indexOf('id="videoTitle"');
    if (tabella < 0 || video < 0 || tabella > video) errors.push('la tabella non precede i video');
  } finally {
    await context.close();
  }
  return errors;
}

// Calcolatore solo da tastiera: Tab dall'inizio della pagina fino al campo,
// numero, Invio (o Tab su «Calcola» e barra spaziatrice).
async function calcolatore(browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  const esito = () => page.locator('#tabCalcEsito').innerText();
  const voci = () => page.locator('#tabCalcEsito li').allInnerTexts();
  const attese = (n) => Array.from({ length: 10 }, (_, k) => `${n} × ${k + 1} = ${(n * (k + 1)).toLocaleString('it-IT')}`);
  try {
    await page.goto(`${BASE}/tabelline.html`, { waitUntil: 'load' });
    if ((await page.locator('#tabCalcEsito').getAttribute('aria-live')) !== 'polite') errors.push('esito senza aria-live="polite"');
    let passi = 0;
    while (!(await page.evaluate(() => document.activeElement && document.activeElement.id === 'tabCalcNumero'))) {
      await page.keyboard.press('Tab');
      passi += 1;
      if (passi > 120) throw new Error('il campo del calcolatore non si raggiunge con Tab');
    }

    const prova = async (testo, modo) => {
      await page.keyboard.press('ControlOrMeta+a');
      await page.keyboard.press('Backspace');
      if (testo) await page.keyboard.type(testo);
      if (modo === 'pulsante') {
        await page.keyboard.press('Tab');
        await page.keyboard.press('Space');
        await page.keyboard.press('Shift+Tab');
      } else {
        await page.keyboard.press('Enter');
      }
    };

    for (const [n, titolo, modo] of [[27, 'Tabellina del 27', 'invio'], [1, "Tabellina dell'1", 'pulsante'], [1000, 'Tabellina del 1000', 'invio']]) {
      await prova(String(n), modo);
      const testo = await esito();
      if (!testo.startsWith(titolo)) errors.push(`${n}: titolo «${testo.split('\n')[0]}»`);
      const lista = await voci();
      if (JSON.stringify(lista) !== JSON.stringify(attese(n))) errors.push(`${n}: risultati ${JSON.stringify(lista)}`);
      if (await page.locator('#tabCalcNumero[aria-invalid="true"]').count()) errors.push(`${n}: campo segnato come errato`);
    }

    for (const sbagliato of ['0', 'abc', '2,5', '1001', '']) {
      await prova(sbagliato, 'invio');
      const testo = await esito();
      if (!/Scrivi un numero intero da 1 a 1000/.test(testo)) errors.push(`«${sbagliato}»: nessun messaggio chiaro («${testo}»)`);
      if (await page.locator('#tabCalcEsito li').count()) errors.push(`«${sbagliato}»: compaiono risultati`);
      if (!(await page.locator('#tabCalcNumero[aria-invalid="true"][aria-describedby="tabCalcErrore"]').count())) errors.push(`«${sbagliato}»: campo non segnato come errato`);
    }
    const focus = await page.evaluate(() => document.activeElement && document.activeElement.id);
    if (focus !== 'tabCalcNumero') errors.push(`dopo l'errore il focus e' su «${focus}»`);
  } catch (err) {
    errors.push(err.message.split('\n')[0]);
  } finally {
    await context.close();
  }
  return errors;
}

async function main() {
  const browser = await chromium.launch();
  let fail = 0;
  try {
    for (const js of [true, false]) {
      const errors = await check(browser, js);
      process.stdout.write(`${errors.length ? '[FAIL]' : '[OK]'} tabelline JS=${js ? 'on' : 'off'}\n`);
      errors.forEach((e) => process.stdout.write(`  - ${e}\n`));
      fail += errors.length;
    }
    const errors = await calcolatore(browser);
    process.stdout.write(`${errors.length ? '[FAIL]' : '[OK]'} calcolatore solo da tastiera (27, 1, 1000; 0 e testo rifiutati)\n`);
    errors.forEach((e) => process.stdout.write(`  - ${e}\n`));
    fail += errors.length;
  } finally {
    await browser.close();
  }
  return fail ? 1 : 0;
}

main().then((code) => process.exit(code)).catch((err) => {
  console.error('[KO]', err.message);
  process.exit(1);
});
