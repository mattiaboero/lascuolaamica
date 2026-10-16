#!/usr/bin/env node
'use strict';

/*
  Controlli sulla pagina /sistema-solare.

  1. Il calcolo delle posizioni: confrontato con eventi astronomici pubblicati
     (opposizione di Marte del 16 gennaio 2025, perielio della cometa di Halley
     del 9 febbraio 1986). Se si rompe la soluzione di Keplero o la conversione
     fra sistemi di riferimento, questi falliscono.
  2. La coerenza fisica dei dati: un numero ricopiato male (un ordine di
     grandezza, un raggio al posto di un diametro) rompe quasi sempre una di
     queste relazioni. Non sostituisce la revisione con le fonti, la affianca.
     - terza legge di Keplero: periodo e semiasse maggiore delle orbite attorno
       al Sole (P^2 = a^3, P in anni, a in UA);
     - gravita' in superficie = G M / R^2 per i corpi quasi sferici;
     - densita' = M / volume;
     - massa rispetto alla Terra = massa / massa della Terra.
  3. La completezza: ogni corpo ha nome, descrizione, fonti, e un genitore che
     esiste.
*/

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');
const sandbox = { window: {}, console };
sandbox.window.window = sandbox.window;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'sistema-solare-dati.js'), 'utf8'), sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'sistema-solare-motore.js'), 'utf8'), sandbox);

const DATI = sandbox.window.SA.sistemaSolareDati;
const K = sandbox.window.SA.SistemaMotore.calcolo;
const RAD = Math.PI / 180;
const G = 6.67430e-11;

const corpi = new Map(DATI.corpi.map((c) => [c.id, c]));
const errori = [];
function controlla(nome, f) {
  try {
    f();
    console.error(`[OK] sistema-solare: ${nome}`);
  } catch (e) {
    errori.push(nome);
    console.error(`[ERROR] sistema-solare: ${nome} — ${e.message}`);
  }
}

function posizione(id, jd) {
  const o = corpi.get(id).orbita;
  const el = o.tipo === 'standish' ? K.elementiStandish(o, jd) : K.elementiKepler(o, jd);
  return K.posizioneKepler(el.a, el.e, el.i, el.nodo, el.w, el.M);
}
const jd = (a, m, g) => K.jdDaData(new Date(Date.UTC(a, m - 1, g, 0)));
const longitudine = (p) => ((Math.atan2(p[1], p[0]) / RAD) + 360) % 360;
const lung = (p) => Math.hypot(p[0], p[1], p[2]);

controlla('Keplero: e=0 e e=0,97 risolti', () => {
  for (const e of [0, 0.3, 0.97, 0.995]) {
    for (const M of [0.1, 1, 3, 5.5]) {
      const E = K.risolviKepler(M, e);
      const Mw = Math.atan2(Math.sin(M), Math.cos(M));
      assert.ok(Math.abs(E - e * Math.sin(E) - Mw) < 1e-9, `e=${e} M=${M}`);
    }
  }
});

controlla('opposizione di Marte del 16 gennaio 2025', () => {
  const t = jd(2025, 1, 16);
  const d = Math.abs(longitudine(posizione('marte', t)) - longitudine(posizione('terra', t)));
  assert.ok(Math.min(d, 360 - d) < 1, `differenza di longitudine ${d.toFixed(2)}°`);
});

controlla('perielio della cometa di Halley del 9 febbraio 1986', () => {
  if (!corpi.has('halley')) return;
  const q = corpi.get('halley').orbita.a * (1 - corpi.get('halley').orbita.e);
  const r = lung(posizione('halley', jd(1986, 2, 9)));
  assert.ok(Math.abs(r - q) < 0.01, `r=${r.toFixed(3)} UA, q=${q.toFixed(3)} UA`);
});

controlla('la Terra a 1 UA dal Sole, con perielio a inizio gennaio', () => {
  const rGen = lung(posizione('terra', jd(2026, 1, 3)));
  const rLug = lung(posizione('terra', jd(2026, 7, 4)));
  assert.ok(rGen > 0.98 && rGen < 0.99, `3 gennaio: ${rGen}`);
  assert.ok(rLug > 1.01 && rLug < 1.02, `4 luglio: ${rLug}`);
});

controlla('completezza delle schede', () => {
  for (const c of DATI.corpi) {
    const s = c.scheda;
    assert.ok(c.nome && s.descrizione, `${c.id}: nome o descrizione mancanti`);
    assert.ok(Array.isArray(s.fonti) && s.fonti.length, `${c.id}: nessuna fonte`);
    assert.ok(c.raggio_km > 0, `${c.id}: raggio`);
    if (c.genitore && !c.solo_confronto) assert.ok(corpi.has(c.genitore), `${c.id}: genitore ${c.genitore} assente`);
    // Le sonde non hanno un'orbita: hanno la traiettoria vera, in un file a parte.
    if (!c.solo_confronto && c.id !== 'sole' && c.tipo !== 'sonda') assert.ok(c.orbita, `${c.id}: orbita mancante`);
    if (c.tipo === 'sonda') assert.ok(c.traiettoria, `${c.id}: traiettoria mancante`);
  }
  for (const s of DATI.sciami || []) {
    assert.ok(s.nome && s.descrizione && s.fonti && s.fonti.length, `sciame ${s.id} incompleto`);
  }
  for (const k of DATI.schede || []) {
    assert.ok(k.titolo && k.testo && k.fonti && k.fonti.length, `scheda ${k.id} incompleta`);
  }
});

controlla('terza legge di Keplero (periodo e distanza dal Sole)', () => {
  for (const c of DATI.corpi) {
    const s = c.scheda;
    if (c.genitore !== 'sole' || !s.periodo_orbitale_giorni || !s.distanza_media || s.distanza_media.unita !== 'UA') continue;
    const atteso = Math.pow(s.distanza_media.valore, 1.5) * 365.25;
    const scarto = Math.abs(s.periodo_orbitale_giorni / atteso - 1);
    assert.ok(scarto < 0.03, `${c.id}: periodo ${s.periodo_orbitale_giorni} g contro ${atteso.toFixed(1)} g attesi (${(scarto * 100).toFixed(1)}%)`);
  }
});

controlla('gravità, densità e massa coerenti con raggio e massa', () => {
  const mTerra = corpi.get('terra').scheda.massa_kg;
  for (const c of DATI.corpi) {
    const s = c.scheda;
    if (!s.massa_kg || !s.raggio_medio_km) continue;
    const R = s.raggio_medio_km * 1000;
    // Giganti e corpi molto schiacciati: la gravita' citata e' all'equatore,
    // il raggio quello medio. 12% copre Saturno (schiacciamento 0,098).
    if (s.gravita_superficie_ms2 && !s.assi_km) {
      const g = G * s.massa_kg / (R * R);
      const scarto = Math.abs(s.gravita_superficie_ms2 / g - 1);
      assert.ok(scarto < 0.12, `${c.id}: gravità ${s.gravita_superficie_ms2} contro ${g.toFixed(3)} da G·M/R² (${(scarto * 100).toFixed(1)}%)`);
    }
    if (s.densita_gcm3 && !s.assi_km) {
      const rho = s.massa_kg / (4 / 3 * Math.PI * R * R * R) / 1000;
      const scarto = Math.abs(s.densita_gcm3 / rho - 1);
      assert.ok(scarto < 0.05, `${c.id}: densità ${s.densita_gcm3} contro ${rho.toFixed(3)} (${(scarto * 100).toFixed(1)}%)`);
    }
    if (s.massa_rispetto_terra) {
      const scarto = Math.abs(s.massa_rispetto_terra / (s.massa_kg / mTerra) - 1);
      assert.ok(scarto < 0.02, `${c.id}: massa rispetto alla Terra ${s.massa_rispetto_terra} contro ${(s.massa_kg / mTerra).toPrecision(4)}`);
    }
  }
});

controlla('lune: periodo e distanza coerenti con la massa del pianeta', () => {
  for (const c of DATI.corpi) {
    const s = c.scheda;
    const g = corpi.get(c.genitore);
    if (c.tipo !== 'luna' || !g || !g.scheda.massa_kg || !s.periodo_orbitale_giorni || !s.distanza_media) continue;
    if (s.distanza_media.unita !== 'km') continue;
    // Dimorphos gira attorno a Didymos, che non e' una sfera: la legge di
    // Keplero per masse puntiformi sbaglia di qualche percento.
    if (c.id === 'dimorphos') continue;
    const a = s.distanza_media.valore * 1000;
    const mTot = g.scheda.massa_kg + (s.massa_kg || 0);
    const P = 2 * Math.PI * Math.sqrt(a * a * a / (G * mTot)) / 86400;
    const scarto = Math.abs(s.periodo_orbitale_giorni / P - 1);
    assert.ok(scarto < 0.03, `${c.id}: periodo ${s.periodo_orbitale_giorni} g contro ${P.toFixed(3)} g attesi`);
  }
});

if (errori.length) {
  console.error(`[ERROR] sistema-solare: ${errori.length} controlli falliti`);
  process.exit(1);
}
console.error('[OK] sistema-solare: tutti i controlli superati');
