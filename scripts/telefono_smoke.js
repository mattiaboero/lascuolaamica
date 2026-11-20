#!/usr/bin/env node
'use strict';

// Tutte le pagine del sito su telefono (360x740 e 390x844, isMobile), ogni
// giro in un contesto nuovo. Controlli:
//   scroll-orizzontale  la pagina non e' piu' larga della finestra
//   riquadro-vuoto      nessun elemento visibile con bordo o sfondo e senza
//                       contenuto (in /civica e /inglese sotto i 600px il
//                       riquadro delle regole restava una cornice vuota)
//   testo-attaccato     un titolo dista almeno 12px dal blocco di testo sopra,
//                       un paragrafo o un elenco almeno 6px (fino alla
//                       4.27.25 in /privacy, /cookie, /per-genitori, /guida-
//                       compiti e nelle pagine delle tabelline erano a 0px)
//
// Uso: node scripts/telefono_smoke.js

const http = require('http');
const fs = require('fs');
const path = require('path');
const { fileServito } = require('./lib/percorso_sicuro.js');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.bin': 'application/octet-stream' };
const PAGINE = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html')).sort();
const VISTE = [{ width: 360, height: 740 }, { width: 390, height: 844 }];

function serve() {
  const server = http.createServer((req, res) => {
    const trovato = fileServito(ROOT, req.url) || fileServito(ROOT, `${req.url.split(/[?#]/)[0]}.html`);
    if (!trovato) {
      res.writeHead(404);
      res.end();
      return;
    }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(trovato.file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    fs.createReadStream(trovato.file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

// Gira nella pagina: elenco dei problemi trovati.
function controlla() {
  const errori = [];
  const vis = (e) => e.checkVisibility({ opacityProperty: true, visibilityProperty: true }) && e.getBoundingClientRect().height > 0;
  const nome = (e) => e.tagName.toLowerCase() + (e.id ? `#${e.id}` : '') + (typeof e.className === 'string' && e.className ? `.${e.className.trim().split(/\s+/)[0]}` : '');

  const extra = document.documentElement.scrollWidth - window.innerWidth;
  if (extra > 0) errori.push(`scroll-orizzontale ${extra}px`);

  for (const el of document.body.querySelectorAll('*')) {
    if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'BR', 'IMG', 'SVG', 'CANVAS', 'INPUT', 'TEXTAREA', 'SELECT', 'VIDEO', 'HR', 'PROGRESS', 'IFRAME', 'PICTURE'].includes(el.tagName.toUpperCase())) continue;
    if (el.closest('[aria-hidden="true"]') || !vis(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.height <= 10 || r.width <= 40) continue;
    const cs = window.getComputedStyle(el);
    const bordo = parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth) > 0;
    const sfondo = cs.backgroundImage !== 'none' || !['rgba(0, 0, 0, 0)', 'transparent'].includes(cs.backgroundColor);
    if (!bordo && !sfondo) continue;
    if ((el.innerText || '').trim() || el.querySelector('img,svg,canvas,input,video,picture,iframe,textarea,select')) continue;
    if (window.getComputedStyle(el, '::before').content !== 'none' || window.getComputedStyle(el, '::after').content !== 'none') continue;
    errori.push(`riquadro-vuoto ${nome(el)} ${Math.round(r.width)}x${Math.round(r.height)}`);
  }

  // Esclusi per scelta: domande frequenti a fisarmonica (separate da una
  // linea), sottotitolo sotto il titolo, nome e descrizione dei premi,
  // occhiello della home, pannelli compatti del Sistema Solare, schermata di
  // caricamento del gioco di Nina (in verticale e' sotto «gira il telefono»).
  const BLOCCHI = 'p,h1,h2,h3,h4,ul,ol,table,dl,blockquote,.seo-table-wrap';
  for (const el of document.querySelectorAll(BLOCCHI)) {
    if (!vis(el) || el.closest('[aria-hidden="true"],nav,footer,.site-footer,li,td,th,summary,details,.ss-app,.reward-card,#loading')) continue;
    if (el.matches('.subtitle')) continue;
    let prima = el.previousElementSibling;
    while (prima && (!vis(prima) || ['absolute', 'fixed'].includes(window.getComputedStyle(prima).position))) prima = prima.previousElementSibling;
    if (!prima || !prima.matches(BLOCCHI) || prima.matches('.home-reward-kicker')) continue;
    if (!(prima.innerText || '').trim() || !(el.innerText || '').trim()) continue;
    const titolo = /^H[1-4]$/.test(el.tagName);
    if (titolo && /^H[1-4]$/.test(prima.tagName)) continue;
    const spazio = el.getBoundingClientRect().top - prima.getBoundingClientRect().bottom;
    if (spazio < (titolo ? 12 : 6)) errori.push(`testo-attaccato ${nome(prima)} -> ${nome(el)} ${Math.round(spazio)}px "${el.innerText.trim().slice(0, 30)}"`);
  }
  return errori;
}

async function main() {
  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();
  const errori = [];
  let giri = 0;
  try {
    for (const pagina of PAGINE) {
      for (const viewport of VISTE) {
        giri += 1;
        const context = await browser.newContext({ viewport, isMobile: true, hasTouch: true, serviceWorkers: 'block', reducedMotion: 'reduce' });
        const page = await context.newPage();
        try {
          await page.goto(`${base}/${pagina}`, { waitUntil: 'networkidle', timeout: 60000 });
          await page.evaluate(() => document.fonts.ready);
          for (const e of await page.evaluate(controlla)) errori.push(`ERRORE telefono: /${pagina} ${viewport.width}x${viewport.height} ${e}`);
        } catch (err) {
          errori.push(`ERRORE telefono: /${pagina} ${viewport.width}x${viewport.height} giro ${err.message.split('\n')[0]}`);
        } finally {
          await context.close();
        }
      }
    }
  } finally {
    await browser.close();
    server.close();
  }
  if (errori.length) {
    errori.forEach((e) => process.stdout.write(`${e}\n`));
    process.exit(1);
  }
  process.stdout.write(`OK telefono: ${PAGINE.length} pagine in ${giri} giri\n`);
}

main().catch((err) => {
  process.stderr.write(`${err.stack || err}\n`);
  process.exit(1);
});
