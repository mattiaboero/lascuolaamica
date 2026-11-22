'use strict';

// Regole di layout che valgono su ogni pagina e in ogni stato. La funzione
// controlla() gira DENTRO la pagina (page.evaluate) e restituisce un elenco di
// problemi, ognuno { regola, dove, dettaglio }. La usano scripts/qa_pagine.js
// (tutte le pagine, tutte le larghezze) e scripts/qa_stati.js (stati del quiz).
//
// Regole:
//   scroll-orizzontale  la pagina non e' piu' larga della finestra
//   riquadro-vuoto      elemento visibile con bordo o sfondo e senza contenuto
//   testo-attaccato     titolo a meno di 12px dal blocco sopra, paragrafo,
//                       elenco o tabella a meno di 6px
//   senza-stile         h2-h4 senza una regola che ne fissi la dimensione,
//                       celle di tabella senza padding (il 28/06/2026 titoli e
//                       tabelle SEO di /matematica e /storia sono usciti cosi')
//   sovrapposizione     due fratelli nel flusso che si sovrappongono
//   coperto             testo o controllo coperto da un altro elemento
//                       (pulsante sticky sopra le regole, 4.27.6-4.27.24)
//   testo-tagliato      contenuto tagliato da overflow hidden/clip
//   bersaglio-piccolo   controllo sotto 24x24px (WCAG 2.2, 2.5.8), esclusi i
//                       link dentro una frase
//   font-estraneo       testo in una famiglia che il sito non carica
//   a-capo-orfano       titolo che va a capo lasciando sola l'ultima emoji o
//                       una parola corta (/bosco a 390px, «🔤» da solo)

function controlla(opzioni) {
  const ESCLUSI = (opzioni && opzioni.escludi) || [];
  // inFondo: pagina scorsa fino in fondo. Solo li' conta chi e' coperto da un
  // elemento sticky o fixed: altrove il contenuto scorre via da sotto.
  const IN_FONDO = Boolean(opzioni && opzioni.inFondo);
  const problemi = [];
  const SALTA_TAG = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'BR', 'WBR', 'IMG', 'SVG', 'CANVAS', 'INPUT', 'TEXTAREA', 'SELECT', 'VIDEO', 'HR', 'PROGRESS', 'METER', 'IFRAME', 'PICTURE', 'SOURCE', 'OPTION']);
  const FONT_DEL_SITO = new Set(['fredoka one', 'fredoka one fallback', 'nunito', 'nunito fallback', 'ninapixel', 'ui-monospace']);
  const W = window.innerWidth;
  const H = window.innerHeight;
  const cs = (e) => window.getComputedStyle(e);
  const vis = (e) => e.checkVisibility({ opacityProperty: true, visibilityProperty: true }) && e.getBoundingClientRect().height > 0 && e.getBoundingClientRect().width > 0;
  const nome = (e) => {
    let s = e.tagName.toLowerCase();
    if (e.id) s += `#${e.id}`;
    else if (typeof e.className === 'string' && e.className.trim()) s += `.${e.className.trim().split(/\s+/).slice(0, 2).join('.')}`;
    const p = e.parentElement;
    if (p && p !== document.body && !e.id) {
      const pn = p.id ? `#${p.id}` : (typeof p.className === 'string' && p.className.trim() ? `.${p.className.trim().split(/\s+/)[0]}` : p.tagName.toLowerCase());
      s = `${pn} > ${s}`;
    }
    return s;
  };
  const escluso = (e) => ESCLUSI.some((sel) => e.closest(sel));
  const testo = (e) => (e.innerText || '').replace(/\s+/g, ' ').trim();
  const aggiungi = (regola, e, dettaglio) => problemi.push({ regola, dove: e ? nome(e) : 'pagina', dettaglio: dettaglio || '' });

  // scroll-orizzontale
  const extra = document.documentElement.scrollWidth - W;
  if (extra > 0) {
    let colpevole = null;
    for (const e of document.body.querySelectorAll('*')) {
      if (!vis(e) || escluso(e)) continue;
      const r = e.getBoundingClientRect();
      if (r.right > W + 1 && !e.closest('[class*="table-wrap"], .seo-table-wrap')) {
        let dentro = false;
        for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) {
          const o = cs(a).overflowX;
          if (o !== 'visible') { dentro = true; break; }
        }
        if (!dentro) { colpevole = e; break; }
      }
    }
    aggiungi('scroll-orizzontale', colpevole, `${extra}px`);
  }

  // Regole d'autore che corrispondono a un elemento (per senza-stile).
  const regole = [];
  const raccogli = (lista) => {
    for (const r of lista) {
      if (r.type === window.CSSRule.STYLE_RULE) regole.push(r);
      else if (r.type === window.CSSRule.MEDIA_RULE) { if (window.matchMedia(r.conditionText || r.media.mediaText).matches) raccogli(r.cssRules); }
      else if (r.cssRules) raccogli(r.cssRules);
    }
  };
  for (const s of document.styleSheets) {
    try { raccogli(s.cssRules); } catch (_) { /* foglio non leggibile */ }
  }
  const haRegola = (e, proprieta) => regole.some((r) => {
    if (!proprieta.some((p) => r.style.getPropertyValue(p) !== '')) return false;
    const sel = r.selectorText.split(',').map((x) => x.trim()).filter((x) => !/^(\*|html|body|:root|:where\([^)]*\))$/.test(x) && !/^\*::?/.test(x));
    return sel.some((x) => { try { return e.matches(x); } catch (_) { return false; } });
  });

  const tutti = [...document.body.querySelectorAll('*')].filter((e) => !SALTA_TAG.has(e.tagName.toUpperCase()) && !e.closest('[aria-hidden="true"], [inert]') && !escluso(e) && vis(e));

  for (const el of tutti) {
    const r = el.getBoundingClientRect();
    const st = cs(el);

    // riquadro-vuoto
    if (r.height > 10 && r.width > 40) {
      const bordo = parseFloat(st.borderTopWidth) + parseFloat(st.borderBottomWidth) > 0;
      const sfondo = st.backgroundImage !== 'none' || !['rgba(0, 0, 0, 0)', 'transparent'].includes(st.backgroundColor);
      if ((bordo || sfondo) && !testo(el) && !el.querySelector('img,svg,canvas,input,video,picture,iframe,textarea,select,progress,meter')
        && window.getComputedStyle(el, '::before').content === 'none' && window.getComputedStyle(el, '::after').content === 'none') {
        aggiungi('riquadro-vuoto', el, `${Math.round(r.width)}x${Math.round(r.height)}`);
      }
    }

    // font-estraneo: solo elementi con testo proprio
    const testoProprio = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (testoProprio) {
      const prima = st.fontFamily.split(',')[0].replace(/["']/g, '').trim().toLowerCase();
      if (!FONT_DEL_SITO.has(prima) && !/^(monospace|emoji|apple color emoji|noto color emoji)$/.test(prima)) aggiungi('font-estraneo', el, st.fontFamily.slice(0, 60));
    }

    // testo-tagliato
    const nascostoPerLettori = el.clientWidth <= 1 && el.clientHeight <= 1; // .sr-only
    if (!nascostoPerLettori && (['hidden', 'clip'].includes(st.overflowX) || ['hidden', 'clip'].includes(st.overflowY))) {
      const taglioX = st.overflowX !== 'visible' && st.textOverflow !== 'ellipsis' && el.scrollWidth > el.clientWidth + 2;
      const taglioY = st.overflowY !== 'visible' && el.scrollHeight > el.clientHeight + 2 && st.webkitLineClamp === 'none';
      if ((taglioX || taglioY) && testo(el) && el.clientHeight > 0) {
        // conta solo se il pezzo tagliato contiene testo
        const box = el.getBoundingClientRect();
        let fuori = false;
        const walker = document.createTreeWalker(el, window.NodeFilter.SHOW_TEXT);
        for (let n = walker.nextNode(); n && !fuori; n = walker.nextNode()) {
          if (!n.textContent.trim() || !vis(n.parentElement)) continue;
          const range = document.createRange();
          range.selectNodeContents(n);
          for (const q of range.getClientRects()) {
            if (q.width && (q.right > box.right + 1 || q.bottom > box.bottom + 1 || q.left < box.left - 1 || q.top < box.top - 1)) { fuori = true; break; }
          }
        }
        if (fuori) aggiungi('testo-tagliato', el, `${el.scrollWidth}x${el.scrollHeight} in ${el.clientWidth}x${el.clientHeight}`);
      }
    }

    // bersaglio-piccolo
    if (el.matches('a[href], button, [role="button"], summary, label[for]') && !el.closest('p, li, td, dd, figcaption, .text, small')) {
      if ((r.width < 24 || r.height < 24) && st.display !== 'inline') {
        // eccezione di spaziatura: un cerchio di 24px centrato sul bersaglio
        // non tocca altri bersagli
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const vicino = [...document.querySelectorAll('a[href], button, [role="button"], summary, input, select, textarea')].some((o) => {
          if (o === el || el.contains(o) || o.contains(el) || !vis(o)) return false;
          const q = o.getBoundingClientRect();
          const dx = Math.max(q.left - cx, 0, cx - q.right);
          const dy = Math.max(q.top - cy, 0, cy - q.bottom);
          return Math.hypot(dx, dy) < 12;
        });
        if (vicino) aggiungi('bersaglio-piccolo', el, `${Math.round(r.width)}x${Math.round(r.height)}`);
      }
    }

    // senza-stile
    if (/^H[2-4]$/.test(el.tagName) && !haRegola(el, ['font-size', 'font'])) aggiungi('senza-stile', el, 'nessuna regola fissa font-size');
    if (/^T[HD]$/.test(el.tagName) && !haRegola(el, ['padding', 'padding-left', 'padding-inline', 'padding-right'])) aggiungi('senza-stile', el, 'cella senza padding');

    // sovrapposizione fra fratelli nel flusso
    const kids = [...el.children].filter((k) => !SALTA_TAG.has(k.tagName.toUpperCase()) || k.tagName === 'IMG' || k.tagName === 'CANVAS' || k.tagName === 'SVG')
      .filter((k) => vis(k) && !['absolute', 'fixed'].includes(cs(k).position) && cs(k).float === 'none' && !escluso(k) && !k.closest('[aria-hidden="true"]') && cs(k).display !== 'inline');
    for (let i = 1; i < kids.length; i += 1) {
      const a = kids[i - 1].getBoundingClientRect();
      const b = kids[i].getBoundingClientRect();
      const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (ox > 2 && oy > 2 && cs(kids[i]).position !== 'sticky' && cs(kids[i - 1]).position !== 'sticky') aggiungi('sovrapposizione', kids[i], `su ${nome(kids[i - 1])} di ${Math.round(oy)}px`);
    }
  }

  // testo-attaccato
  const BLOCCHI = 'p,h1,h2,h3,h4,ul,ol,table,dl,blockquote,.seo-table-wrap';
  for (const el of document.querySelectorAll(BLOCCHI)) {
    if (!vis(el) || escluso(el) || el.closest('[aria-hidden="true"],nav,footer,.site-footer,li,td,th,summary')) continue;
    if (el.matches('.subtitle')) continue;
    let prima = el.previousElementSibling;
    while (prima && (!vis(prima) || ['absolute', 'fixed'].includes(cs(prima).position))) prima = prima.previousElementSibling;
    if (!prima || !prima.matches(BLOCCHI) || !testo(prima) || !testo(el)) continue;
    if (prima.matches('.home-reward-kicker')) continue; // occhiello sopra il titolo, per scelta
    const titolo = /^H[1-4]$/.test(el.tagName);
    const dopoTitolo = /^H[1-4]$/.test(prima.tagName);
    if (titolo && dopoTitolo) continue;
    const spazio = el.getBoundingClientRect().top - prima.getBoundingClientRect().bottom;
    // un titolo si stacca dal blocco sopra; un testo resta vicino al suo titolo
    if (spazio < (titolo ? 12 : (dopoTitolo ? 4 : 6))) aggiungi('testo-attaccato', el, `${Math.round(spazio)}px dopo ${nome(prima)} "${testo(el).slice(0, 30)}"`);
  }

  // a-capo-orfano: titolo su piu' righe con l'ultima quasi vuota (una emoji o
  // una parola corta da sola)
  for (const el of document.querySelectorAll('h1, h2')) {
    if (!vis(el) || escluso(el) || el.closest('[aria-hidden="true"]')) continue;
    const range = document.createRange();
    range.selectNodeContents(el);
    const righe = new Map();
    for (const q of range.getClientRects()) {
      if (q.width < 1 || q.height < 1) continue;
      const k = Math.round(q.bottom / 4);
      const riga = righe.get(k) || { left: Infinity, right: -Infinity };
      riga.left = Math.min(riga.left, q.left);
      riga.right = Math.max(riga.right, q.right);
      righe.set(k, riga);
    }
    if (righe.size < 2) continue;
    const chiavi = [...righe.keys()].sort((a, b) => a - b);
    const ultima = righe.get(chiavi[chiavi.length - 1]);
    const larghezze = chiavi.slice(0, -1).map((k) => righe.get(k).right - righe.get(k).left);
    const larga = Math.max(...larghezze);
    if (ultima.right - ultima.left < Math.min(56, larga * 0.2)) aggiungi('a-capo-orfano', el, `ultima riga ${Math.round(ultima.right - ultima.left)}px su ${Math.round(larga)}px "${testo(el).slice(-20)}"`);
  }

  // coperto: testi e controlli interamente nella finestra
  const candidati = tutti.filter((e) => e.matches('a[href], button, input, select, textarea, summary, label, h1, h2, h3, h4, p, li, td, th, dt, dd, figcaption, legend')
    || [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()));
  // con una finestra modale aperta la pagina dietro e' coperta per scelta
  // (velo compreso, che sta fuori dall'elemento con aria-modal)
  const modali = [...document.querySelectorAll('[aria-modal="true"], dialog[open]')]
    .filter((m) => m.getClientRects().length && cs(m).visibility !== 'hidden');
  for (const el of candidati) {
    if (modali.length && !modali.some((m) => m.contains(el))) continue;
    // un elemento in linea su due righe ha un rettangolo che abbraccia anche
    // il testo vicino: si guarda solo la sua prima riga
    const r = cs(el).display === 'inline' ? (el.getClientRects()[0] || el.getBoundingClientRect()) : el.getBoundingClientRect();
    if (r.top < 0 || r.left < 0 || r.bottom > H || r.right > W || r.width < 4 || r.height < 4) continue;
    if (cs(el).pointerEvents === 'none') continue;
    const punti = [[0.5, 0.5], [0.15, 0.5], [0.85, 0.5]];
    for (const [fx, fy] of punti) {
      const x = r.left + r.width * fx;
      const y = r.top + r.height * fy;
      const sopra = document.elementFromPoint(x, y);
      if (!sopra || sopra === el || el.contains(sopra) || sopra.contains(el)) continue;
      if (sopra.closest('[aria-hidden="true"]') && cs(sopra).pointerEvents === 'none') continue;
      // un elemento trasparente senza contenuto proprio non copre davvero
      const so = cs(sopra);
      const trasparente = so.backgroundImage === 'none' && ['rgba(0, 0, 0, 0)', 'transparent'].includes(so.backgroundColor) && !testo(sopra) && !sopra.matches('img,svg,canvas,video,picture');
      if (trasparente) continue;
      if (escluso(sopra)) continue;
      // una finestra modale copre la pagina per scelta
      if (sopra.closest('[aria-modal="true"], dialog[open]') && !el.closest('[aria-modal="true"], dialog[open]')) continue;
      let sopraFisso = false;
      for (let a = sopra; a && a !== document.body; a = a.parentElement) {
        if (['fixed', 'sticky'].includes(cs(a).position)) { sopraFisso = true; break; }
      }
      if (sopraFisso && !IN_FONDO) continue;
      if (!sopraFisso && IN_FONDO) continue; // gia' visto nel primo giro
      aggiungi('coperto', el, `da ${nome(sopra)} "${testo(el).slice(0, 30)}"`);
      break;
    }
  }

  // un problema solo per elemento e regola
  const visti = new Set();
  return problemi.filter((p) => {
    const k = `${p.regola}|${p.dove}`;
    if (visti.has(k)) return false;
    visti.add(k);
    return true;
  });
}

// Prima di misurare: animazioni finite e due fotogrammi disegnati. Nel job
// webkit della CI (runner macOS, 4.27.31) la misura arrivava prima del primo
// fotogramma: l'header di /civica era ancora al primo keyframe di popIn
// (scale(0.72) rotate(-6deg), titolo «a capo» e sottotitolo coperto) e
// #interface del gioco di Nina non era ancora scalato dal ResizeObserver
// (960x540 in 327x183). Tetto di 3 s: oltre, si misura comunque.
async function attendiRender(page) {
  await page.evaluate(() => Promise.race([
    Promise.all(document.getAnimations()
      .filter((a) => a.effect && a.effect.getComputedTiming().endTime !== Infinity)
      .map((a) => a.finished.catch(() => {})))
      .then(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))),
    new Promise((r) => setTimeout(r, 3000))
  ]));
}

module.exports = { controlla, attendiRender };
