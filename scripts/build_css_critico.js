#!/usr/bin/env node
'use strict';

// CSS critico delle pagine materia. I fogli della pagina (tokens.css,
// subject-quiz-theme.css, utilities.css, fonts.css, inglese.css) erano
// quattro-cinque richieste bloccanti prima del primo disegno. Ora:
// - in un <style> fra i marcatori CSS-CRITICO ci sono le regole che toccano
//   gli elementi della pagina come la lascia il motore all'avvio, in ogni
//   classe (selettori senza :hover, ::before e simili; @media e @font-face
//   compresi). Una per pagina: l'hash va in _headers con npm run freshness;
// - i fogli completi restano linkati con media="print" e data-css-completo:
//   js/lazy-css.js li accende appena parte, e arrivano dopo il <style>, quindi
//   la cascata finale e' identica a prima (il <style> ne e' un sottoinsieme).
//
// Uso: node scripts/build_css_critico.js          (riscrive, serve Playwright)
//      node scripts/build_css_critico.js --check  (senza browser: i CSS
//      sorgenti non sono cambiati dall'ultima generazione)
// Dopo ogni modifica a uno di quei fogli: npm run css:critico, poi npm run freshness.

const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const path = require('path');
const { fileServito } = require('./lib/percorso_sicuro.js');

const ROOT = path.join(__dirname, '..');
const PAGINE = ['matematica', 'problemi', 'italiano', 'inglese', 'civica', 'storia', 'geografia', 'scienze'];
const FOGLI = ['tokens.css', 'subject-quiz-theme.css', 'inglese.css', 'utilities.css', 'fonts.css'];
const BLOCCO = /<!-- CSS-CRITICO:INIZIO sorgenti=([0-9a-f]+) -->\n<style>[\s\S]*?<\/style>\n<!-- CSS-CRITICO:FINE -->\n/;
const COMPLETO = (f) => `<link rel="stylesheet" href="${f}" media="print" data-css-completo>`;

const leggi = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const fogliDi = (html) => FOGLI.filter((f) => html.includes(`<link rel="stylesheet" href="${f}"`));
const impronta = (fogli) => crypto.createHash('sha256').update(fogli.map((f) => f + '\n' + leggi(f)).join('\n')).digest('hex').slice(0, 16);

// Prima volta: i link bloccanti diventano non bloccanti, con il blocco vuoto
// davanti e i fogli completi anche in <noscript>.
function preparaPagina(html, fogli) {
  if (BLOCCO.test(html)) return html;
  let out = html;
  fogli.forEach((f, i) => {
    const link = `<link rel="stylesheet" href="${f}">\n`;
    if (!out.includes(link)) throw new Error(`manca ${link.trim()}`);
    const prima = i === 0 ? '<!-- CSS-CRITICO:INIZIO sorgenti=0 -->\n<style></style>\n<!-- CSS-CRITICO:FINE -->\n' : '';
    out = out.replace(link, prima + COMPLETO(f) + '\n');
  });
  const ultimo = COMPLETO(fogli[fogli.length - 1]) + '\n';
  const noscript = '<noscript>' + fogli.map((f) => `<link rel="stylesheet" href="${f}">`).join('') + '</noscript>\n';
  return out.replace(ultimo, ultimo + noscript);
}

function check() {
  const vecchi = [];
  PAGINE.forEach((p) => {
    const html = leggi(`${p}.html`);
    const m = html.match(BLOCCO);
    if (!m) vecchi.push(`${p}.html: manca il blocco CSS-CRITICO`);
    else if (m[1] !== impronta(fogliDi(html))) vecchi.push(`${p}.html: CSS cambiati dopo l'ultima generazione`);
  });
  if (vecchi.length) {
    console.error('[ERROR] CSS critico non aggiornato: npm run css:critico, poi npm run freshness');
    vecchi.forEach((v) => console.error('  ' + v));
    process.exit(1);
  }
  console.log(`[OK] CSS critico aggiornato in ${PAGINE.length} pagine`);
}

const TIPI = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2' };

function serve() {
  const server = http.createServer((req, res) => {
    const trovato = fileServito(ROOT, req.url);
    if (!trovato) {
      res.writeHead(404);
      res.end();
      return;
    }
    const { file } = trovato;
    let corpo = fs.readFileSync(file);
    // Per misurare, la pagina com'era: niente blocco, fogli completi accesi.
    if (path.extname(file) === '.html') corpo = String(corpo).replace(BLOCCO, '').replace(/ media="print" data-css-completo>/g, '>');
    res.writeHead(200, { 'Content-Type': TIPI[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(corpo);
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

// Nel browser: le chiavi delle regole usate (foglio/indice/indice...).
function regoleUsate(fogli) {
  const PSEUDO = /::?(?:hover|focus-visible|focus-within|focus|active|visited|link|checked|disabled|enabled|placeholder-shown|placeholder|before|after|marker|selection|first-letter|first-line|backdrop|-webkit-[a-z-]+|-moz-[a-z-]+)(?:\([^)]*\))?/g;
  const usata = (sel) => {
    const base = sel.replace(PSEUDO, '').replace(/(^|,)\s*(?=,|$)/g, '$1*');
    try { return !!document.querySelector(base || '*'); } catch (_) { return true; }
  };
  const chiavi = [];
  const visita = (regole, prefisso) => {
    Array.from(regole).forEach((r, i) => {
      const k = `${prefisso}/${i}`;
      if (r.type === window.CSSRule.STYLE_RULE) { if (usata(r.selectorText)) chiavi.push(k); return; }
      if (r.cssRules) { visita(r.cssRules, k); return; }
      chiavi.push(k); // @font-face, @keyframes, @property...
    });
  };
  fogli.forEach((f, n) => {
    const s = Array.from(document.styleSheets).find((x) => x.href && new URL(x.href).pathname === '/' + f);
    if (s) visita(s.cssRules, String(n));
  });
  return chiavi;
}

// Nel browser: il testo delle regole scelte, @media e simili compresi.
function testoRegole([fogli, scelte]) {
  const set = new Set(scelte);
  const scrivi = (regole, prefisso) => Array.from(regole).map((r, i) => {
    const k = `${prefisso}/${i}`;
    if (r.cssRules && r.type !== window.CSSRule.STYLE_RULE) {
      const dentro = scrivi(r.cssRules, k).filter(Boolean).join('\n');
      if (!dentro) return '';
      const testa = r.cssText.slice(0, r.cssText.indexOf('{')).trim();
      return `${testa} {\n${dentro}\n}`;
    }
    return set.has(k) ? r.cssText : '';
  }).filter(Boolean);
  return fogli.map((f, n) => {
    const s = Array.from(document.styleSheets).find((x) => x.href && new URL(x.href).pathname === '/' + f);
    return s ? scrivi(s.cssRules, String(n)).join('\n') : '';
  }).filter(Boolean).join('\n');
}

async function genera() {
  const { chromium } = require('playwright');
  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();
  try {
    for (const p of PAGINE) {
      const file = `${p}.html`;
      let html = preparaPagina(leggi(file), fogliDi(leggi(file)));
      fs.writeFileSync(path.join(ROOT, file), html);
      const fogli = fogliDi(html.replace(/ media="print" data-css-completo>/g, '>'));
      const usate = new Set();
      let testo = '';
      for (const viewport of [{ width: 375, height: 667 }, { width: 1280, height: 800 }]) {
        const context = await browser.newContext({ viewport, serviceWorkers: 'block' });
        const page = await context.newPage();
        await page.goto(`${base}/${file}`, { waitUntil: 'networkidle' });
        const classi = await page.locator('.class-btn').evaluateAll((b) => b.map((x) => x.dataset.class));
        (await page.evaluate(regoleUsate, fogli)).forEach((k) => usate.add(k));
        for (const c of classi) {
          await page.locator(`.class-btn[data-class="${c}"]`).click();
          await page.waitForLoadState('networkidle');
          (await page.evaluate(regoleUsate, fogli)).forEach((k) => usate.add(k));
        }
        testo = await page.evaluate(testoRegole, [fogli, Array.from(usate)]);
        await context.close();
      }
      const blocco = `<!-- CSS-CRITICO:INIZIO sorgenti=${impronta(fogli)} -->\n<style>${testo}</style>\n<!-- CSS-CRITICO:FINE -->\n`;
      html = html.replace(BLOCCO, () => blocco);
      fs.writeFileSync(path.join(ROOT, file), html);
      console.log(`[OK] ${file}: CSS critico ${Math.round(testo.length / 1024)} KB (${fogli.join(', ')})`);
    }
  } finally {
    await browser.close();
    server.close();
  }
}

if (process.argv.includes('--check')) check();
else genera().catch((e) => { console.error('[ERROR]', e.message); process.exit(1); });
