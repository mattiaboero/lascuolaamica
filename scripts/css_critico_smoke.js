#!/usr/bin/env node
'use strict';

// CSS critico delle pagine materia (scripts/build_css_critico.js): la pagina
// avviata col solo <style> inline deve essere identica, pixel per pixel, a
// quella coi fogli completi accesi. Se differisce, al caricamento qualcosa
// cambierebbe aspetto o si sposterebbe: npm run css:critico.
// Otto pagine, telefono e computer, tema chiaro e scuro, pagina intera.
//
// La pagina intera si fotografa una schermata alla volta, scorrendo: lo scatto
// unico `fullPage` disegna fuori dal viewport e non e' ripetibile (due scatti
// di fila della stessa pagina, senza toccare il CSS, possono uscire diversi).
// Se il confronto fallisce, lo script dice in quale schermata, quanti pixel,
// di quanto e sopra quale elemento.
//
// Uso: node scripts/css_critico_smoke.js   (E2E_BASE_URL come run_e2e.sh)

const { chromium } = require('playwright');

const BASE = (process.env.E2E_BASE_URL || 'http://127.0.0.1:4173').replace(/\/+$/, '');
const PAGINE = ['matematica', 'problemi', 'italiano', 'inglese', 'civica', 'storia', 'geografia', 'scienze'];

async function apri(b, p, vp, scheme) {
  const ctx = await b.newContext({ viewport: vp, colorScheme: scheme, serviceWorkers: 'block', reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  // lazy-css.js senza l'accensione dei fogli completi
  await page.route('**/js/lazy-css.js', (r) => r.fulfill({ body: '', contentType: 'text/javascript' }));
  await page.goto(`${BASE}/${p}.html?x=${Date.now()}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  return { ctx, page };
}

async function accendiFogli(page) {
  await page.evaluate(() => document.querySelectorAll('link[data-css-completo]').forEach((l) => { l.media = 'all'; }));
  await page.waitForTimeout(500);
}

// Una fotografia per schermata, dall'alto in fondo.
async function fotografa(page) {
  const alto = await page.evaluate(() => document.documentElement.scrollHeight);
  const passo = page.viewportSize().height;
  const foto = [];
  for (let y = 0; y < alto; y += passo) {
    await page.evaluate((v) => window.scrollTo({ top: v, behavior: 'instant' }), y);
    foto.push(await page.screenshot());
  }
  return foto;
}

// Dove e quanto differiscono due fotografie: pixel diversi, scarto massimo per
// canale, riquadro. Il conto si fa in una pagina vuota, senza dipendenze.
async function differenze(ctx, a, b) {
  const page = await ctx.newPage();
  const esito = await page.evaluate(async (png) => {
    const [A, B] = await Promise.all(png.map(async (s) => {
      const bmp = await window.createImageBitmap(await (await fetch(`data:image/png;base64,${s}`)).blob());
      const tela = document.createElement('canvas');
      tela.width = bmp.width; tela.height = bmp.height;
      const g = tela.getContext('2d');
      g.drawImage(bmp, 0, 0);
      return g.getImageData(0, 0, bmp.width, bmp.height);
    }));
    if (A.width !== B.width || A.height !== B.height) return { misure: `${A.width}x${A.height} contro ${B.width}x${B.height}` };
    let n = 0; let max = 0; let x0 = Infinity; let y0 = Infinity; let x1 = -1; let y1 = -1;
    for (let i = 0; i < A.data.length; i += 4) {
      const d = Math.max(Math.abs(A.data[i] - B.data[i]), Math.abs(A.data[i + 1] - B.data[i + 1]), Math.abs(A.data[i + 2] - B.data[i + 2]));
      if (!d) continue;
      n += 1; max = Math.max(max, d);
      const x = (i / 4) % A.width; const y = Math.floor(i / 4 / A.width);
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    }
    return { n, max, x0, y0, x1, y1 };
  }, [a.toString('base64'), b.toString('base64')]);
  await page.close();
  return esito;
}

function descrivi(d) {
  if (d.misure) return `misure ${d.misure}`;
  return d.n ? `${d.n} pixel, scarto massimo ${d.max}/255, riquadro ${d.x0},${d.y0}-${d.x1},${d.y1}` : 'nessun pixel diverso';
}

// Gli elementi sotto il centro del riquadro. Il riquadro e' in coordinate della
// schermata fotografata a `scrollY`, o dell'intera pagina se `inPagina`.
function sotto(page, d, scrollY, inPagina) {
  return page.evaluate(([x, y, sy, pagina]) => {
    window.scrollTo({ top: sy, behavior: 'instant' });
    return document.elementsFromPoint(x, pagina ? y - window.scrollY : y).slice(0, 3)
      .map((e) => e.tagName.toLowerCase() + (e.id ? `#${e.id}` : '') + [...e.classList].map((c) => `.${c}`).join('')).join(' < ');
  }, [(d.x0 + d.x1) / 2, (d.y0 + d.y1) / 2, scrollY, Boolean(inPagina)]);
}

// DIAGNOSI TEMPORANEA: il vecchio confronto con lo scatto unico fullPage, solo
// per leggere in CI che cosa cambia. Non decide l'esito.
async function vecchioConfronto(b, p, vp, scheme) {
  const { ctx, page } = await apri(b, p, vp, scheme);
  const prima = await page.screenshot({ fullPage: true });
  const prima2 = await page.screenshot({ fullPage: true });
  await accendiFogli(page);
  const dopo = await page.screenshot({ fullPage: true });
  const dopo2 = await page.screenshot({ fullPage: true });
  const d = await differenze(ctx, prima, dopo);
  console.log(`       [fullPage] prima/dopo: ${descrivi(d)}${d.n ? ` (${await sotto(page, d, Math.max(0, d.y0 - 100), true)})` : ''}`);
  console.log(`       [fullPage] prima/prima: ${descrivi(await differenze(ctx, prima, prima2))}; dopo/dopo: ${descrivi(await differenze(ctx, dopo, dopo2))}`);
  await ctx.close();
}

(async () => {
  const b = await chromium.launch();
  console.log(`Chromium ${b.version()}`);
  let ko = 0;
  for (const p of PAGINE) {
    for (const vp of [{ width: 375, height: 667 }, { width: 1280, height: 800 }]) {
      for (const scheme of ['light', 'dark']) {
        const { ctx, page } = await apri(b, p, vp, scheme);
        await fotografa(page); // giro a vuoto: il primo scatto di una schermata puo' differire dai successivi
        const prima = await fotografa(page);
        await accendiFogli(page);
        const dopo = await fotografa(page);
        const diverse = prima.length === dopo.length ? prima.flatMap((f, i) => (f.equals(dopo[i]) ? [] : [i])) : null;
        const uguale = diverse !== null && !diverse.length;
        if (!uguale) ko += 1;
        console.log(`${uguale ? '[OK]' : '[FAIL]'} ${p} ${vp.width} ${scheme}${uguale ? '' : ': col solo CSS critico la pagina e\' diversa'}`);
        if (diverse === null) console.log(`       schermate: ${prima.length} col CSS critico, ${dopo.length} coi fogli completi`);
        if (diverse && diverse.length) {
          const ancora = await fotografa(page);
          for (const i of diverse) {
            const d = await differenze(ctx, prima[i], dopo[i]);
            console.log(`       schermata ${i + 1} di ${prima.length}: ${descrivi(d)}`);
            if (d.n) console.log(`         sotto il centro del riquadro: ${await sotto(page, d, i * vp.height)}`);
            // La stessa schermata fotografata di nuovo, senza toccare niente:
            // se differisce anche lei, e' lo scatto a non essere ripetibile.
            console.log(`         stessa schermata, scatto ripetuto: ${descrivi(await differenze(ctx, dopo[i], ancora[i]))}`);
          }
        }
        await ctx.close();
        if (vp.width === 375) await vecchioConfronto(b, p, vp, scheme);
      }
    }
  }
  await b.close();
  process.exit(ko ? 1 : 0);
})();
