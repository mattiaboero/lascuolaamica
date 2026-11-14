#!/usr/bin/env node
'use strict';

// CSS critico delle pagine materia (scripts/build_css_critico.js): la pagina
// avviata col solo <style> inline deve essere identica, pixel per pixel, a
// quella coi fogli completi accesi. Se differisce, al caricamento qualcosa
// cambierebbe aspetto o si sposterebbe: npm run css:critico.
// Otto pagine, telefono e computer, tema chiaro e scuro, pagina intera.
//
// Il confronto e' esatto, senza soglie: uno scarto di un solo livello di
// colore e' gia' un FAIL. Perche' regga, le due fotografie devono avere la
// stessa storia (misurato con Chromium 158, Playwright 1.65):
// - due caricamenti freschi, uno col solo CSS critico e uno coi fogli
//   completi accesi fin dall'HTML. Accendere i fogli su una pagina gia'
//   disegnata la fa ridisegnare, e i pulsanti `.selected` (scale + filter)
//   escono con un pixel diverso anche se il CSS e' lo stesso;
// - una schermata alla volta, scorrendo. Lo scatto unico `fullPage` disegna
//   fuori dal viewport e non e' ripetibile: due scatti di fila della stessa
//   pagina, senza toccare niente, escono diversi;
// - scorrimento solo su posizioni intere. In fondo alla pagina (alta, per
//   esempio, 4330,73 px) lo scorrimento massimo e' frazionario e il testo del
//   footer cade un pixel piu' su o piu' giu'.
// Resta un caso che non dipende dal CSS: su Linux, circa una volta su 60, il
// testo del footer nell'ultima schermata esce un pixel piu' su o piu' giu' fra
// due caricamenti identici. Per questo un confronto diverso si ripete da capo,
// con due caricamenti nuovi, fino a TENTATIVI volte: e' FAIL solo se la
// differenza si ripresenta ogni volta, come fa sempre una differenza di CSS.
// Ogni confronto diverso resta scritto nel log, anche quando poi passa, con
// schermata, pixel, scarto, elemento e se la geometria della pagina coincide.
//
// Uso: node scripts/css_critico_smoke.js   (E2E_BASE_URL come run_e2e.sh)

const { chromium } = require('playwright');

const BASE = (process.env.E2E_BASE_URL || 'http://127.0.0.1:4173').replace(/\/+$/, '');
const PAGINE = ['matematica', 'problemi', 'italiano', 'inglese', 'civica', 'storia', 'geografia', 'scienze'];
const TENTATIVI = 3;

// La pagina col solo CSS critico, oppure coi fogli completi accesi dall'HTML.
async function apri(b, p, vp, scheme, completi) {
  const ctx = await b.newContext({ viewport: vp, colorScheme: scheme, serviceWorkers: 'block', reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  // lazy-css.js senza l'accensione dei fogli completi
  await page.route('**/js/lazy-css.js', (r) => r.fulfill({ body: '', contentType: 'text/javascript' }));
  if (completi) {
    await page.route(`**/${p}.html*`, async (r) => {
      const risposta = await r.fetch();
      const html = (await risposta.text()).replace(/media="print"( data-css-completo)/g, 'media="all"$1');
      await r.fulfill({ response: risposta, body: html });
    });
  }
  await page.goto(`${BASE}/${p}.html?x=${Date.now()}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  // Il confronto vale solo se i fogli sono davvero spenti da una parte e accesi dall'altra.
  const media = await page.evaluate(() => [...document.querySelectorAll('link[data-css-completo]')].map((l) => l.media));
  if (!media.length || media.some((m) => m !== (completi ? 'all' : 'print'))) {
    throw new Error(`${p}: fogli completi con media [${media}] (attesi tutti ${completi ? 'all' : 'print'})`);
  }
  return { ctx, page };
}

// Una fotografia per schermata, dall'alto in fondo, su posizioni intere.
async function fotografa(page) {
  const alto = await page.evaluate(() => document.documentElement.scrollHeight);
  const passo = page.viewportSize().height;
  const fine = Math.max(0, alto - passo - 1);
  const foto = [];
  for (let y = 0; ; y += passo) {
    const top = Math.min(y, fine);
    await page.evaluate((v) => window.scrollTo({ top: v, behavior: 'instant' }), top);
    foto.push({ top, png: await page.screenshot() });
    if (top === fine) break;
  }
  return foto;
}

async function pagina(b, p, vp, scheme, completi) {
  const { ctx, page } = await apri(b, p, vp, scheme, completi);
  await fotografa(page); // giro a vuoto: il primo scatto di una schermata puo' differire dai successivi
  return { ctx, page, foto: await fotografa(page) };
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

// Gli elementi sotto il centro del riquadro, nella schermata fotografata a `scrollY`.
function sotto(page, d, scrollY) {
  return page.evaluate(([x, y, sy]) => {
    window.scrollTo({ top: sy, behavior: 'instant' });
    return document.elementsFromPoint(x, y).slice(0, 3)
      .map((e) => e.tagName.toLowerCase() + (e.id ? `#${e.id}` : '') + [...e.classList].map((c) => `.${c}`).join('')).join(' < ');
  }, [(d.x0 + d.x1) / 2, (d.y0 + d.y1) / 2, scrollY]);
}

// Posizione e misure di ogni elemento e di ogni riga di testo: se coincidono
// fra le due pagine, la differenza e' nel disegno e non nell'impaginazione.
function geometria(page) {
  return page.evaluate(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const misure = (r) => `${r.x},${r.y},${r.width},${r.height}`;
    const out = [...document.querySelectorAll('body *')]
      .map((e) => `${e.tagName.toLowerCase()}${e.id ? `#${e.id}` : ''} ${misure(e.getBoundingClientRect())}`);
    const testi = document.createTreeWalker(document.body, window.NodeFilter.SHOW_TEXT);
    const tratto = document.createRange();
    for (let n = testi.nextNode(); n; n = testi.nextNode()) {
      if (!n.data.trim()) continue;
      tratto.selectNodeContents(n);
      out.push(`testo "${n.data.trim().slice(0, 24)}" ${[...tratto.getClientRects()].map(misure).join(' ')}`);
    }
    return out;
  });
}

// Un confronto completo: due caricamenti freschi. Torna le righe da scrivere
// se le fotografie differiscono, nessuna se sono uguali.
async function confronta(b, p, vp, scheme) {
  const critico = await pagina(b, p, vp, scheme, false);
  const completo = await pagina(b, p, vp, scheme, true);
  const prima = critico.foto; const dopo = completo.foto;
  const righe = [];
  if (prima.length !== dopo.length) {
    righe.push(`schermate: ${prima.length} col CSS critico, ${dopo.length} coi fogli completi`);
  } else {
    for (let i = 0; i < prima.length; i += 1) {
      if (prima[i].png.equals(dopo[i].png)) continue;
      const d = await differenze(critico.ctx, prima[i].png, dopo[i].png);
      righe.push(`schermata ${i + 1} di ${prima.length}: ${descrivi(d)}`);
      if (d.n) righe.push(`  sotto il centro del riquadro: ${await sotto(critico.page, d, prima[i].top)}`);
    }
  }
  if (righe.length) {
    const [ga, gb] = [await geometria(critico.page), await geometria(completo.page)];
    const k = ga.length === gb.length ? ga.findIndex((r, i) => r !== gb[i]) : 0;
    righe.push(k < 0 ? 'geometria di elementi e testi: uguale nelle due pagine'
      : `geometria diversa: «${ga[k]}» col CSS critico, «${gb[k]}» coi fogli completi`);
  }
  await critico.ctx.close();
  await completo.ctx.close();
  return righe;
}

(async () => {
  const b = await chromium.launch();
  let ko = 0;
  for (const p of PAGINE) {
    for (const vp of [{ width: 375, height: 667 }, { width: 1280, height: 800 }]) {
      for (const scheme of ['light', 'dark']) {
        const diversi = [];
        let uguale = false;
        for (let t = 1; t <= TENTATIVI && !uguale; t += 1) {
          const righe = await confronta(b, p, vp, scheme);
          uguale = !righe.length;
          if (!uguale) diversi.push(`confronto ${t} di ${TENTATIVI}, diverso:`, ...righe.map((r) => `  ${r}`));
        }
        if (!uguale) ko += 1;
        const nota = diversi.length ? ` (uguale al confronto ${diversi.filter((r) => r.startsWith('confronto')).length + 1})` : '';
        console.log(uguale ? `[OK] ${p} ${vp.width} ${scheme}${nota}` : `[FAIL] ${p} ${vp.width} ${scheme}: col solo CSS critico la pagina e' diversa, ${TENTATIVI} confronti su ${TENTATIVI}`);
        diversi.forEach((r) => console.log(`       ${r}`));
      }
    }
  }
  await b.close();
  process.exit(ko ? 1 : 0);
})();
