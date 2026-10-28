#!/usr/bin/env node
'use strict';

// Contrasto WCAG 2.2 AA di ogni testo visibile: 4,5:1, oppure 3:1 per testo
// da 24 px, o da 18,66 px con peso 700 o piu'. Pagine: /, /premi, le otto
// materie con la prima domanda a video e le altre pagine del sito (ALTRE) al
// caricamento, ognuna con la palette standard e con ?palette=okabe-ito (solo
// standard per /link e /404), a 1280x800 e a 375x667, ogni giro in un
// contesto nuovo. Esclusi i controlli disattivati (WCAG 1.4.3).
//
// Per ogni elemento con testo proprio (nodi di testo figli diretti), anche
// sotto aria-hidden="true" se si vede, esclusi: testo senza lettere ne' cifre,
// elementi nascosti visivamente (clip o clip-path sotto 2x2 px, .sr-only,
// .visually-hidden) e opacita' effettiva sotto 0,1. Colore del testo con l'opacita' di tutti gli
// antenati; sfondo = primo antenato con sfondo opaco (gli strati
// semitrasparenti sopra si fondono), e se e' un gradiente ogni suo colore.
// Vale il contrasto peggiore. I colori passano da un canvas 1x1, cosi'
// rgb(), color(srgb ...) e oklch() arrivano tutti in sRGB a 8 bit.
//
// Su /premi controlla anche che l'hero abbia la stessa struttura nelle due
// palette: pannello con gradiente, stessi padding, raggio e larghezza, titolo
// bianco.
//
// Uso: node scripts/check_contrasti.js

const http = require('http');
const fs = require('fs');
const path = require('path');
const { fileServito } = require('./lib/percorso_sicuro.js');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };
const MATERIE = ['matematica', 'italiano', 'inglese', 'storia', 'geografia', 'scienze', 'civica', 'problemi'];
const ALTRE = ['/faq', '/per-genitori', '/per-insegnanti', '/privacy', '/cookie', '/accessibilita', '/supporta', '/chi-siamo',
  '/ai-info', '/guida-compiti', '/tabelline', '/tabellina-del-27', '/bosco', '/breakout', '/sistema-solare', '/link', '/404'];
const PAGINE = ['/', '/premi', ...MATERIE.map((m) => `/${m}`), ...ALTRE];
// /link e /404 non caricano palette-okabe.css: solo palette standard.
const SOLO_STANDARD = ['/link', '/404'];
const PALETTE = ['standard', 'okabe-ito'];
const LARGHEZZE = [{ width: 1280, height: 800 }, { width: 375, height: 667 }];

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

// Gira nella pagina: un elemento per testo, con il rapporto peggiore.
function misuraTesti() {
  const cv = document.createElement('canvas');
  cv.width = 1;
  cv.height = 1;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  const rgba = (s) => {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillStyle = s;
    ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2], d[3] / 255];
  };
  const COLORE = /(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\([^()]*\)|transparent|#[0-9a-f]{3,8}\b/gi;
  const LETTERE = /[\p{L}\p{N}]/u;
  // clip: rect(...) o clip-path: inset(...) che lasciano meno di 2x2 px.
  const lato = (v, tot) => (v.endsWith('%') ? (parseFloat(v) / 100) * tot : parseFloat(v) || 0);
  const ritagliato = (n) => {
    const cs = window.getComputedStyle(n);
    const r = n.getBoundingClientRect();
    const rect = cs.clip.match(/^rect\((.*)\)$/);
    if (rect) {
      const [t, de, b, s] = rect[1].split(/[\s,]+/).map((v) => (v === 'auto' ? null : parseFloat(v)));
      const w = (de === null ? r.width : de) - (s || 0);
      const h = (b === null ? r.height : b) - (t || 0);
      if (w < 2 || h < 2) return true;
    }
    const inset = cs.clipPath.match(/^inset\(([^)]*?)(?:\s+round\s.*)?\)$/);
    if (inset) {
      const v = inset[1].trim().split(/\s+/);
      const [t, de, b, s] = [v[0], v[1] || v[0], v[2] || v[0], v[3] || v[1] || v[0]];
      if (r.width - lato(de, r.width) - lato(s, r.width) < 2 || r.height - lato(t, r.height) - lato(b, r.height) < 2) return true;
    }
    return false;
  };
  const nascosto = (el) => {
    if (el.closest('.sr-only, .visually-hidden')) return true;
    for (let n = el; n; n = n.parentElement) if (ritagliato(n)) return true;
    return false;
  };
  const fondi = (fg, bg) => [0, 1, 2].map((i) => fg[i] * fg[3] + bg[i] * (1 - fg[3])).concat(1);
  const lum = (c) => {
    const [r, g, b] = c.slice(0, 3).map((v) => {
      const s = v / 255;
      return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const rapporto = (a, b) => {
    const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (l1 + 0.05) / (l2 + 0.05);
  };

  // Divide alle virgole fuori dalle parentesi: strati di background-image o
  // argomenti di un gradiente.
  const dividi = (s) => {
    const parti = [];
    let livello = 0;
    let inizio = 0;
    [...s].forEach((ch, i) => {
      if (ch === '(') livello += 1;
      else if (ch === ')') livello -= 1;
      else if (ch === ',' && livello === 0) {
        parti.push(s.slice(inizio, i).trim());
        inizio = i + 1;
      }
    });
    parti.push(s.slice(inizio).trim());
    return parti;
  };
  // Colori dei gradienti di uno sfondo. In un radial-gradient gli stop che
  // finiscono entro 3 px dall'inizio sono puntini decorativi (le stelle della
  // scheda Sistema Solare): non stanno dietro il testo e non contano.
  const coloriGradienti = (img) => dividi(img).filter((s) => /gradient\(/.test(s)).flatMap((s) => {
    if (!/^(?:repeating-)?radial-gradient\(/.test(s)) return s.match(COLORE) || [];
    return dividi(s.slice(s.indexOf('(') + 1, s.lastIndexOf(')'))).flatMap((stop) => {
      const colore = stop.match(COLORE);
      if (!colore) return [];
      const fine = stop.replace(COLORE, '').trim().split(/\s+/).pop();
      return /^[\d.]+px$/.test(fine || '') && parseFloat(fine) <= 3 ? [] : [colore[0]];
    });
  });

  // Colori dello sfondo sotto il nodo, gia' opachi.
  const sfondo = (n) => {
    if (!n) return [[255, 255, 255, 1]];
    const cs = window.getComputedStyle(n);
    const c = rgba(cs.backgroundColor);
    const grad = coloriGradienti(cs.backgroundImage).map(rgba);
    if (!grad.length && c[3] === 0) return sfondo(n.parentElement);
    let sotto = null;
    if (c[3] === 1) sotto = [c];
    else if (c[3] > 0) sotto = sfondo(n.parentElement).map((b) => fondi(c, b));
    if (!grad.length) return sotto;
    if (grad.every((g) => g[3] === 1)) return grad;
    const base = sotto || sfondo(n.parentElement);
    return grad.flatMap((g) => base.map((b) => fondi(g, b)));
  };

  const passo = (n) => {
    if (n.id) return `${n.tagName.toLowerCase()}#${n.id}`;
    return n.tagName.toLowerCase() + [...n.classList].slice(0, 2).map((c) => `.${c}`).join('');
  };
  const selettore = (el) => {
    const parti = [];
    for (let n = el, i = 0; n && n.nodeType === 1 && i < 3; n = n.parentElement, i += 1) {
      parti.unshift(passo(n));
      if (n.id) break;
    }
    return parti.join(' > ');
  };

  const testi = [];
  document.querySelectorAll('body *').forEach((el) => {
    const proprio = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').replace(/\s+/g, ' ').trim();
    // ℹ e simili sono lettere per Unicode ma qui emoji: via i pittogrammi.
    if (!LETTERE.test(proprio.replace(/\p{Extended_Pictographic}/gu, ''))) return;
    if (!el.checkVisibility({ checkVisibilityCSS: true }) || nascosto(el)) return;
    // WCAG 1.4.3: i controlli disattivati sono esclusi (Bosco prima di iniziare).
    if (el.closest(':disabled, [aria-disabled="true"]')) return;
    let opacita = 1;
    for (let n = el; n; n = n.parentElement) opacita *= parseFloat(window.getComputedStyle(n).opacity);
    if (opacita < 0.1) return;
    const cs = window.getComputedStyle(el);
    const colore = rgba(el instanceof window.SVGElement && cs.fill.startsWith('rgb') ? cs.fill : cs.color);
    colore[3] *= opacita;
    const fs = parseFloat(cs.fontSize);
    const grande = fs >= 24 || (fs >= 18.66 && parseInt(cs.fontWeight, 10) >= 700);
    const peggiore = Math.min(...sfondo(el).map((bg) => rapporto(fondi(colore, bg), bg)));
    testi.push({ selettore: selettore(el), testo: proprio.slice(0, 30), rapporto: peggiore, soglia: grande ? 3 : 4.5 });
  });
  return testi;
}

async function giro(browser, base, pagina, palette, viewport) {
  const context = await browser.newContext({ viewport, serviceWorkers: 'block' });
  // Voce italiana locale finta: il pulsante Ascolta compare su ogni macchina.
  await context.addInitScript(() => {
    if (!window.speechSynthesis) return;
    const vere = window.speechSynthesis.getVoices.bind(window.speechSynthesis);
    const finta = { name: 'Test it', lang: 'it-IT', localService: true, default: true, voiceURI: 'test-it' };
    window.speechSynthesis.getVoices = () => [...vere(), finta];
  });
  const page = await context.newPage();
  try {
    await page.goto(`${base}${pagina}${palette === 'okabe-ito' ? '?palette=okabe-ito' : ''}`, { waitUntil: 'networkidle', timeout: 60000 });
    if (palette === 'okabe-ito') {
      await page.waitForFunction(() => document.documentElement.dataset.palette === 'okabe-ito'
        && [...document.styleSheets].some((s) => s.href && s.href.includes('palette-okabe.css')), null, { timeout: 10000 });
    }
    if (MATERIE.includes(pagina.slice(1))) {
      await page.locator('#screenStart [data-action="start-game"]').click({ timeout: 30000 });
      if (await page.locator('#screenLevels.active').count()) {
        await page.locator('#levelsRoot button:not([disabled])').first().click({ timeout: 30000 });
      }
      await page.waitForFunction(() => {
        const q = document.getElementById('qText');
        return !!(q && q.textContent.trim() && q.checkVisibility());
      }, null, { timeout: 30000 });
    }
    // Transizioni finite (le animazioni infinite restano).
    await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running'
      || a.effect.getComputedTiming().iterations === Infinity), null, { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(300);
    const misure = await page.evaluate(misuraTesti);
    const struttura = pagina === '/premi' ? await page.evaluate(() => {
      const hero = window.getComputedStyle(document.querySelector('header.rewards-hero'));
      return {
        'background-image': hero.backgroundImage,
        'padding-top': hero.paddingTop,
        'border-top-left-radius': hero.borderTopLeftRadius,
        'max-width': hero.maxWidth,
        'h1#mainTitle color': window.getComputedStyle(document.getElementById('mainTitle')).color,
      };
    }) : null;
    return { misure, struttura };
  } finally {
    await context.close();
  }
}

async function main() {
  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();
  const errori = [];
  let testi = 0;
  let giri = 0;
  const strutture = {};
  try {
    for (const pagina of PAGINE) {
      for (const palette of SOLO_STANDARD.includes(pagina) ? ['standard'] : PALETTE) {
        for (const viewport of LARGHEZZE) {
          giri += 1;
          try {
            const { misure, struttura } = await giro(browser, base, pagina, palette, viewport);
            if (struttura) strutture[`${viewport.width} ${palette}`] = struttura;
            testi += misure.length;
            // Una riga per selettore: il caso peggiore e quante volte si ripete.
            const casi = new Map();
            misure.filter((m) => m.rapporto < m.soglia).forEach((m) => {
              const caso = casi.get(m.selettore);
              if (!caso) casi.set(m.selettore, { ...m, volte: 1 });
              else casi.set(m.selettore, { ...(m.rapporto < caso.rapporto ? m : caso), volte: caso.volte + 1 });
            });
            casi.forEach((m) => {
              errori.push(`ERRORE contrasto: ${pagina} ${palette} ${viewport.width} ${m.selettore} "${m.testo}" ${m.rapporto.toFixed(2)}:1 (minimo ${m.soglia})${m.volte > 1 ? ` (x${m.volte})` : ''}`);
            });
          } catch (err) {
            errori.push(`ERRORE giro: ${pagina} ${palette} ${viewport.width} ${err.message.split('\n')[0]}`);
          }
        }
      }
    }
  } finally {
    await browser.close();
    server.close();
  }
  // /premi: hero uguale nelle due palette, a ogni larghezza.
  for (const { width } of LARGHEZZE) {
    const std = strutture[`${width} standard`];
    const oka = strutture[`${width} okabe-ito`];
    if (!std || !oka) continue;
    for (const prop of Object.keys(std)) {
      const ok = prop === 'background-image' ? std[prop] !== 'none' && oka[prop] !== 'none'
        : prop === 'h1#mainTitle color' ? std[prop] === 'rgb(255, 255, 255)' && oka[prop] === 'rgb(255, 255, 255)'
          : std[prop] === oka[prop];
      if (!ok) {
        process.stdout.write(`ERRORE struttura: /premi ${prop}: standard ${std[prop]}, okabe-ito ${oka[prop]}\n`);
        process.exit(1);
      }
    }
  }
  if (errori.length) {
    errori.forEach((e) => process.stdout.write(`${e}\n`));
    process.exit(1);
  }
  process.stdout.write(`OK contrasti: ${testi} testi in ${giri} giri\n`);
}

main().catch((err) => {
  process.stderr.write(`${err.stack || err}\n`);
  process.exit(1);
});
