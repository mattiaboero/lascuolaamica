#!/usr/bin/env node
'use strict';

// Annunci per i lettori di schermo nelle pagine materia (subject-quiz-core.js,
// annuncia): al massimo due regioni live, #quizStato e #quizFeedback.
// - In tutte e 8 le pagine, all'avvio e in partita, non piu' di 2 regioni live.
// - Ogni annuncio svuota la regione e la riscrive: due risposte giuste di fila
//   danno due annunci in #quizFeedback, ciascuno preceduto dal vuoto.
// - La domanda nuova si annuncia in #quizStato, l'esito con la spiegazione in
//   #quizFeedback, mai nello stesso istante.
// - La classifica non annuncia niente.
// - Il trofeo di fine partita si annuncia in #quizStato almeno 1,5 s dopo
//   l'ultimo esito.
//
// Uso: node scripts/annunci_smoke.js   (E2E_BASE_URL come run_e2e.sh)

const { chromium } = require('playwright');

const BASE = (process.env.E2E_BASE_URL || 'http://127.0.0.1:4173').replace(/\/+$/, '');
const PAGINE = ['matematica', 'problemi', 'italiano', 'inglese', 'civica', 'storia', 'geografia', 'scienze'];

const contaLive = (page) => page.evaluate(() => Array.from(document.querySelectorAll(
  '[aria-live]:not([aria-live="off"]), [role="status"], [role="alert"], [role="log"], output'
)).map((e) => e.id || e.className || e.tagName));

// Registro di ogni scrittura nelle due regioni: [regione, testo, istante].
function registro() {
  window.__annunci = [];
  const osserva = () => ['quizStato', 'quizFeedback'].forEach((id) => {
    const el = document.getElementById(id);
    if (!el || el.__osservata) return;
    el.__osservata = true;
    new MutationObserver(() => window.__annunci.push([id, el.textContent, performance.now()]))
      .observe(el, { childList: true, characterData: true, subtree: true });
  });
  document.addEventListener('DOMContentLoaded', osserva);
}

async function rispostaGiusta(page) {
  return page.evaluate(() => {
    const norm = (t) => String(t || '').replace(/\s+/g, ' ').trim();
    const testo = norm(document.getElementById('qText').textContent);
    const banche = (window.SA.subjectConfig && window.SA.subjectConfig.banks) || {};
    for (const righe of Object.values(banche)) {
      const r = (righe || []).find((q) => norm(q.q) === testo);
      if (r) return norm(r.a);
    }
    return null;
  });
}

async function controllaPagina(browser, pagina, errors) {
  const context = await browser.newContext({ viewport: { width: 412, height: 823 }, serviceWorkers: 'block', reducedMotion: 'reduce' });
  const page = await context.newPage();
  try {
    await page.goto(`${BASE}/${pagina}.html`, { waitUntil: 'networkidle' });
    const avvio = await contaLive(page);
    if (avvio.length > 2) errors.push(`${pagina}, avvio: ${avvio.length} regioni live (${avvio.join(', ')})`);
    await page.locator('#screenStart [data-action="start-game"]').click();
    if (await page.locator('#screenLevels.active').count()) {
      await page.locator('#screenLevels [data-action="start-level"]:not([disabled])').first().click();
    }
    await page.waitForSelector('#screenGame.active');
    await page.locator('#answers .answer-btn').first().click();
    const partita = await contaLive(page);
    if (partita.length > 2) errors.push(`${pagina}, partita: ${partita.length} regioni live (${partita.join(', ')})`);
  } finally {
    await context.close();
  }
}

async function partitaMatematica(browser, errors) {
  const context = await browser.newContext({ viewport: { width: 412, height: 823 }, serviceWorkers: 'block', reducedMotion: 'reduce' });
  await context.addInitScript(registro);
  const page = await context.newPage();
  try {
    await page.goto(`${BASE}/matematica.html`, { waitUntil: 'networkidle' });
    await page.locator('#screenStart [data-action="start-game"]').click();
    await page.waitForSelector('#screenGame.active');

    let giusteDiFila = 0;
    let feedbackPrima = 0;
    for (let i = 0; i < 10 && !(await page.locator('#screenBonusPick.active').count()); i++) {
      const a = await rispostaGiusta(page);
      const bottoni = page.locator('#answers .answer-btn');
      const testi = (await bottoni.allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').trim());
      const k = a === null ? -1 : testi.indexOf(a);
      await bottoni.nth(k >= 0 ? k : 0).click();
      await page.waitForTimeout(250);
      if (k >= 0) {
        giusteDiFila += 1;
        if (giusteDiFila === 2) {
          const esiti = await page.evaluate(() => window.__annunci.filter(([id]) => id === 'quizFeedback'));
          const nuovi = esiti.slice(feedbackPrima);
          const pieni = nuovi.filter(([, t]) => t);
          if (pieni.length < 1) errors.push('seconda risposta giusta: nessun annuncio in #quizFeedback');
          const tutti = esiti.filter(([, t]) => t);
          if (tutti.length < 2) errors.push(`due risposte giuste di fila: ${tutti.length} annunci in #quizFeedback`);
          if (!nuovi.length || nuovi[0][1] !== '') errors.push('la regione non viene svuotata prima del nuovo annuncio');
        }
      } else {
        giusteDiFila = 0;
        feedbackPrima = (await page.evaluate(() => window.__annunci.filter(([id]) => id === 'quizFeedback').length));
      }
      if (giusteDiFila === 1) feedbackPrima = (await page.evaluate(() => window.__annunci.filter(([id]) => id === 'quizFeedback').length));
      const next = page.locator('#qNext');
      if (await next.isVisible()) await next.click();
    }

    const annunci = await page.evaluate(() => window.__annunci);
    const stati = annunci.filter(([id, t]) => id === 'quizStato' && /^Domanda \d+ di \d+/.test(t));
    if (stati.length < 2) errors.push(`domande nuove annunciate in #quizStato: ${stati.length}`);
    const esitiConSpiegazione = annunci.filter(([id, t]) => id === 'quizFeedback' && t && t.split(' ').length > 3);
    if (!esitiConSpiegazione.length) errors.push('l\'esito non porta la spiegazione');
    // Mai due regioni scritte nello stesso istante (entro 30 ms).
    const pieni = annunci.filter(([, t]) => t);
    for (let i = 1; i < pieni.length; i++) {
      if (pieni[i][0] !== pieni[i - 1][0] && pieni[i][2] - pieni[i - 1][2] < 30) {
        errors.push(`annunci sovrapposti: «${pieni[i - 1][1]}» e «${pieni[i][1]}»`);
        break;
      }
    }

    // Fine partita: si salta il bonus, arriva il trofeo della prima partita.
    await page.locator('[data-action="skip-bonus"]').click();
    await page.waitForTimeout(2500);
    const dopo = await page.evaluate(() => window.__annunci);
    const ultimoEsito = Math.max(...dopo.filter(([id, t]) => id === 'quizFeedback' && t).map(([, , t]) => t));
    const trofeo = dopo.find(([id, t]) => id === 'quizStato' && /premi/i.test(t));
    if (!trofeo) errors.push('il trofeo non viene annunciato');
    else if (trofeo[2] - ultimoEsito < 1500) errors.push(`trofeo annunciato ${Math.round(trofeo[2] - ultimoEsito)} ms dopo l'esito`);

    // La classifica non annuncia niente.
    const prima = dopo.length;
    await page.locator('[data-action="show-leaderboard"]').first().click();
    await page.waitForSelector('#screenLeaderboard.active');
    await page.waitForTimeout(600);
    const classifica = (await page.evaluate(() => window.__annunci)).slice(prima).filter(([, t]) => t);
    if (classifica.length) errors.push(`la classifica annuncia: «${classifica.map(([, t]) => t).join(' | ')}»`);
  } finally {
    await context.close();
  }
}

async function main() {
  const browser = await chromium.launch();
  const errors = [];
  try {
    for (const p of PAGINE) await controllaPagina(browser, p, errors);
    await partitaMatematica(browser, errors);
  } catch (err) {
    errors.push(err.message.split('\n')[0]);
  } finally {
    await browser.close();
  }
  process.stdout.write(`${errors.length ? '[FAIL]' : '[OK]'} annunci: 2 regioni live, esito + spiegazione, ripetuti, trofeo dopo, classifica muta\n`);
  errors.forEach((e) => process.stdout.write(`  - ${e}\n`));
  return errors.length ? 1 : 0;
}

main().then((code) => process.exit(code)).catch((err) => {
  console.error('[KO]', err.message);
  process.exit(1);
});
