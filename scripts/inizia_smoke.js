#!/usr/bin/env node
'use strict';

// «Inizia!» sempre in vista sulle pagine materia: otto materie piu'
// /matematica?area=tables, a 375x667, 390x844, 768x1024 e 1440x900, ogni giro
// in un contesto nuovo (localStorage vuoto). Controlli:
//   visibile-al-caricamento  il pulsante e' tutto nella finestra con scrollY 0
//   non-coperto              elementFromPoint al suo centro e' lui (o dentro)
//   prima-classe-libera      sotto i 1440: il primo .class-btn finisce sopra
//                            «Inizia!», con scrollY 0
//   dopo-clic-classe         dopo il clic sulla seconda classe valgono ancora
//                            i primi due
//   fondo-griglia            l'ultimo pulsante della griglia, portato in vista
//                            con scrollIntoView({block: 'end'}), non e' coperto
//   focus                    da body, Tab fino a uscire da #screenStart (max
//                            60): ogni elemento con il focus non e' coperto
//                            (WCAG 2.2, 2.4.11)
//   area-da-url              ?area=tables preseleziona le Tabelline
//   classe-selezionata-libera  sotto i 768: al primo accesso la classe
//                            selezionata finisce sopra «Inizia!», con scrollY 0
//   classe-salvata-libera    sotto i 768, otto materie: per ogni classe, clic e
//                            ricarica; la classe salvata torna selezionata e
//                            finisce sopra «Inizia!», con scrollY 0
//
// Uso: node scripts/inizia_smoke.js

const http = require('http');
const fs = require('fs');
const path = require('path');
const { fileServito } = require('./lib/percorso_sicuro.js');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };
const MATERIE = ['matematica', 'italiano', 'inglese', 'storia', 'geografia', 'scienze', 'civica', 'problemi'];
const PAGINE = [...MATERIE.map((m) => `/${m}`), '/matematica?area=tables'];
const LARGHEZZE = [{ width: 375, height: 667 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1440, height: 900 }];
const START = '#screenStart [data-action="start-game"]';

// Gira nella pagina: data-class della classe selezionata e se finisce sopra
// «Inizia!», con scrollY 0.
function classeSelezionata(sel) {
  window.scrollTo(0, 0);
  const btn = document.querySelector('#screenStart .class-btn.selected');
  if (!btn) return { classe: null, libera: false };
  return { classe: btn.dataset.class, libera: btn.getBoundingClientRect().bottom <= document.querySelector(sel).getBoundingClientRect().top };
}

// URL puliti come su Cloudflare: /premi -> premi.html.
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

// Gira nella pagina: elementFromPoint al centro di el e' el o un discendente.
function definisciLibero() {
  window.__libero = (el) => {
    const r = el.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return !!hit && el.contains(hit);
  };
}

async function visibile(page) {
  return page.evaluate((sel) => {
    window.scrollTo(0, 0);
    const r = document.querySelector(sel).getBoundingClientRect();
    return window.scrollY === 0 && r.top >= 0 && r.bottom <= window.innerHeight;
  }, START);
}

async function nonCoperto(page) {
  return page.evaluate((sel) => window.__libero(document.querySelector(sel)), START);
}

async function giro(browser, base, pagina, viewport, esito) {
  const context = await browser.newContext({ viewport, serviceWorkers: 'block' });
  await context.addInitScript(definisciLibero);
  const page = await context.newPage();
  try {
    await page.goto(`${base}${pagina}`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.evaluate(() => document.fonts.ready);

    esito('visibile-al-caricamento', await visibile(page));
    esito('non-coperto', await nonCoperto(page));
    if (viewport.width < 1440) {
      esito('prima-classe-libera', await page.evaluate((sel) => {
        window.scrollTo(0, 0);
        return document.querySelector('#screenStart .class-btn').getBoundingClientRect().bottom
          <= document.querySelector(sel).getBoundingClientRect().top;
      }, START));
    }
    if (viewport.width < 768) {
      const { classe, libera } = await page.evaluate(classeSelezionata, START);
      esito(`classe-selezionata-libera ${classe}`, libera);
    }
    if (pagina === '/matematica?area=tables') {
      esito('area-da-url', await page.evaluate(() => document.querySelector('[data-area="tables"]')?.getAttribute('aria-pressed') === 'true'));
    }

    esito('fondo-griglia', await page.evaluate(() => {
      const visibili = (sel) => [...document.querySelectorAll(sel)].filter((b) => b.checkVisibility());
      const area = document.getElementById('areaGrid');
      const bottoni = area ? visibili('#areaGrid button') : visibili('#screenStart .class-btn');
      const ultimo = bottoni[bottoni.length - 1];
      if (!ultimo) return false;
      ultimo.scrollIntoView({ block: 'end' });
      return window.__libero(ultimo);
    }));

    await page.evaluate(() => {
      window.scrollTo(0, 0);
      if (document.activeElement) document.activeElement.blur();
    });
    let dentro = false;
    let focusOk = true;
    for (let i = 0; i < 60; i += 1) {
      await page.keyboard.press('Tab');
      const stato = await page.evaluate(() => {
        const el = document.activeElement;
        const screen = document.getElementById('screenStart');
        if (!el || !screen.contains(el)) return { dentro: false };
        // Un link su due righe ha il centro del rettangolo intero sul testo
        // intorno: basta un suo rettangolo libero.
        const ok = [...el.getClientRects()].filter((r) => r.width > 0 && r.height > 0).some((r) => {
          const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
          return !!hit && el.contains(hit);
        });
        return { dentro: true, ok };
      });
      if (!stato.dentro) {
        if (dentro) break;
        continue;
      }
      dentro = true;
      if (!stato.ok) focusOk = false;
    }
    esito('focus', dentro && focusOk);

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.locator('#screenStart .class-btn').nth(1).click();
    await page.waitForLoadState('networkidle');
    esito('dopo-clic-classe', (await visibile(page)) && (await nonCoperto(page)));

    if (viewport.width < 768 && !pagina.includes('?')) {
      const classi = await page.locator('#screenStart .class-btn').evaluateAll((bs) => bs.map((b) => b.dataset.class));
      for (const dc of classi) {
        await page.locator(`#screenStart .class-btn[data-class="${dc}"]`).click();
        await page.reload({ waitUntil: 'networkidle', timeout: 60000 });
        await page.evaluate(() => document.fonts.ready);
        const { classe, libera } = await page.evaluate(classeSelezionata, START);
        if (classe !== dc) esito(`classe-salvata-non-ripristinata ${dc}`, false);
        else esito(`classe-salvata-libera ${dc}`, libera);
      }
    }
  } finally {
    await context.close();
  }
}

async function main() {
  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();
  const errori = [];
  let controlli = 0;
  let giri = 0;
  try {
    for (const pagina of PAGINE) {
      for (const viewport of LARGHEZZE) {
        giri += 1;
        const dove = `${pagina} ${viewport.width}x${viewport.height}`;
        const esito = (nome, ok) => {
          controlli += 1;
          if (!ok) errori.push(`ERRORE inizia: ${dove} ${nome}`);
        };
        try {
          await giro(browser, base, pagina, viewport, esito);
        } catch (err) {
          errori.push(`ERRORE inizia: ${dove} giro ${err.message.split('\n')[0]}`);
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
  process.stdout.write(`OK inizia: ${controlli} controlli in ${giri} giri\n`);
}

main().catch((err) => {
  process.stderr.write(`${err.stack || err}\n`);
  process.exit(1);
});
