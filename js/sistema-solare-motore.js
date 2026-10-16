(function () {
  'use strict';

  /*
    Sistema Solare 3D — motore di disegno (WebGL 1, nessuna libreria).

    Questo file non sa niente dell'interfaccia: riceve i dati di
    js/sistema-solare-dati.js, calcola dove si trova ogni corpo in una data e lo
    disegna. L'interfaccia (js/sistema-solare.js) lo comanda tramite l'oggetto
    restituito da SA.SistemaMotore.crea().

    COSA E' VERO E COSA E' ADATTATO
    - Le posizioni dei pianeti vengono dagli elementi orbitali di Standish (JPL,
      "Approximate Positions of the Planets", validi 1800-2050), quelle di
      pianeti nani, asteroidi e comete dagli elementi osculanti del JPL
      Small-Body Database, quelle delle lune dagli elementi medi JPL. Le
      direzioni sono vere; le distanze, no.
    - Le DISTANZE sono accorciate (scalaDistanza) e le GRANDEZZE ingrandite
      (scalaRaggio): in scala vera il Sole sarebbe un puntino e Nettuno
      invisibile. Entrambe le funzioni sono monotone, quindi l'ordine resta
      giusto: chi e' piu' lontano resta piu' lontano, chi e' piu' grande resta
      piu' grande. La pagina lo dice al bambino.
    - In modalita' "confronto" le grandezze sono invece in scala vera fra loro.
    - L'asse di rotazione e il giorno di ogni pianeta seguono i parametri IAU
      (polo e primo meridiano). Le lune in rotazione sincrona mostrano sempre
      la stessa faccia al pianeta, come succede davvero.

    Sistema di riferimento: eclittica J2000 (x verso il punto vernale, z verso
    il polo nord dell'eclittica). In WebGL l'asse verticale e' y, quindi la
    conversione e' (x, y, z)_ecl -> (x, z, -y)_gl, fatta in un posto solo (glDa).
  */

  const SA = window.SA = window.SA || {};

  const RAD = Math.PI / 180;
  const OBLIQUITA = 23.4392911 * RAD; // obliquita' dell'eclittica a J2000 (IAU)
  const J2000 = 2451545.0;

  /* --------------------------------------------------------------- tempo */

  function jdDaData(date) {
    return date.getTime() / 86400000 + 2440587.5;
  }

  function dataDaJd(jd) {
    return new Date((jd - 2440587.5) * 86400000);
  }

  /* ------------------------------------------------------------ vettori */

  function somma(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
  function diff(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function per(a, k) { return [a[0] * k, a[1] * k, a[2] * k]; }
  function punto(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function vett(a, b) {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }
  function lung(a) { return Math.hypot(a[0], a[1], a[2]); }
  function norm(a) {
    const l = lung(a) || 1;
    return [a[0] / l, a[1] / l, a[2] / l];
  }
  function mescola(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }

  // Equatoriale J2000 -> eclittica J2000.
  function eclDaEq(v) {
    const c = Math.cos(OBLIQUITA);
    const s = Math.sin(OBLIQUITA);
    return [v[0], v[1] * c + v[2] * s, -v[1] * s + v[2] * c];
  }

  // Eclittica -> spazio WebGL (y in alto).
  function glDa(v) { return [v[0], v[2], -v[1]]; }

  /* ------------------------------------------------------------ matrici */

  function mat4Identita() {
    return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  }

  function mat4Mul(a, b) {
    const o = new Float32Array(16);
    for (let c = 0; c < 4; c++) {
      for (let r = 0; r < 4; r++) {
        o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
      }
    }
    return o;
  }

  function mat4Prospettiva(fovy, aspect, near, far) {
    const f = 1 / Math.tan(fovy / 2);
    const nf = 1 / (near - far);
    return new Float32Array([
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) * nf, -1,
      0, 0, 2 * far * near * nf, 0
    ]);
  }

  function mat4Guarda(occhio, centro, su) {
    const z = norm(diff(occhio, centro));
    const x = norm(vett(su, z));
    const y = vett(z, x);
    return new Float32Array([
      x[0], y[0], z[0], 0,
      x[1], y[1], z[1], 0,
      x[2], y[2], z[2], 0,
      -punto(x, occhio), -punto(y, occhio), -punto(z, occhio), 1
    ]);
  }

  // Matrice modello da tre assi (colonne), una scala per asse e una posizione.
  function mat4Assi(ax, ay, az, sx, sy, sz, pos) {
    return new Float32Array([
      ax[0] * sx, ax[1] * sx, ax[2] * sx, 0,
      ay[0] * sy, ay[1] * sy, ay[2] * sy, 0,
      az[0] * sz, az[1] * sz, az[2] * sz, 0,
      pos[0], pos[1], pos[2], 1
    ]);
  }

  /* ------------------------------------------------------------ orbite */

  function risolviKepler(M, e) {
    M = Math.atan2(Math.sin(M), Math.cos(M));
    let E = e < 0.8 ? M : (M < 0 ? -Math.PI : Math.PI);
    for (let k = 0; k < 50; k++) {
      const d = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
      E -= d;
      if (Math.abs(d) < 1e-12) break;
    }
    return E;
  }

  // Posizione nel piano dell'orbita ruotata con (nodo, inclinazione, argomento
  // del pericentro) nel piano di riferimento. Unita' quelle di a.
  function posizioneKepler(a, e, i, nodo, w, M) {
    const E = risolviKepler(M, e);
    const xp = a * (Math.cos(E) - e);
    const yp = a * Math.sqrt(1 - e * e) * Math.sin(E);
    const cw = Math.cos(w); const sw = Math.sin(w);
    const cn = Math.cos(nodo); const sn = Math.sin(nodo);
    const ci = Math.cos(i); const si = Math.sin(i);
    return [
      (cw * cn - sw * sn * ci) * xp + (-sw * cn - cw * sn * ci) * yp,
      (cw * sn + sw * cn * ci) * xp + (-sw * sn + cw * cn * ci) * yp,
      (sw * si) * xp + (cw * si) * yp
    ];
  }

  function elementiStandish(o, jd) {
    const T = (jd - J2000) / 36525;
    const v = (k) => o[k][0] + o[k][1] * T;
    const a = v('a');
    const e = v('e');
    const I = v('I') * RAD;
    const L = v('L');
    const wbar = v('wbar');
    const node = v('node');
    return { a, e, i: I, nodo: node * RAD, w: (wbar - node) * RAD, M: (L - wbar) * RAD };
  }

  function elementiKepler(o, jd) {
    return {
      a: o.a,
      e: o.e,
      i: o.i * RAD,
      // nodoRate: rotazione del piano dell'orbita (gradi al giorno), per la ISS.
      nodo: (o.node + (o.nodoRate || 0) * (jd - o.epoca)) * RAD,
      w: o.w * RAD,
      M: (o.M + o.n * (jd - o.epoca)) * RAD
    };
  }

  // Base di un piano di riferimento dato dal suo polo (RA, Dec equatoriali
  // J2000, gradi): asse x sul nodo ascendente del piano sull'equatore ICRF,
  // come nella convenzione IAU/JPL. Restituisce i tre assi in eclittica.
  function baseDaPolo(raDeg, decDeg) {
    const ra = raDeg * RAD;
    const dec = decDeg * RAD;
    const P = [Math.cos(dec) * Math.cos(ra), Math.cos(dec) * Math.sin(ra), Math.sin(dec)];
    const N = [-Math.sin(ra), Math.cos(ra), 0];
    const Y = vett(P, N);
    return [eclDaEq(N), eclDaEq(Y), eclDaEq(P)];
  }

  function nelPiano(base, v) {
    return [
      base[0][0] * v[0] + base[1][0] * v[1] + base[2][0] * v[2],
      base[0][1] * v[0] + base[1][1] * v[1] + base[2][1] * v[2],
      base[0][2] * v[0] + base[1][2] * v[1] + base[2][2] * v[2]
    ];
  }

  /* ------------------------------------------------- traiettorie (sonde) */

  // Le sonde non hanno un'orbita: hanno una tabella di posizioni vere (JPL
  // Horizons) [jd, x, y, z, jd, x, y, z, ...]. Fra due righe si interpola in
  // linea retta: le righe sono fitte (6 ore) vicino ai pianeti.
  function cercaRiga(punti, jd) {
    let lo = 0;
    let hi = punti.length / 4 - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (punti[mid * 4] <= jd) lo = mid; else hi = mid;
    }
    return lo;
  }

  function interpola(punti, jd) {
    const n = punti.length / 4;
    if (jd <= punti[0]) return [punti[1], punti[2], punti[3]];
    if (jd >= punti[(n - 1) * 4]) return [punti[(n - 1) * 4 + 1], punti[(n - 1) * 4 + 2], punti[(n - 1) * 4 + 3]];
    const i = cercaRiga(punti, jd);
    const a = i * 4;
    const b = a + 4;
    const t = (jd - punti[a]) / (punti[b] - punti[a]);
    return [punti[a + 1] + (punti[b + 1] - punti[a + 1]) * t, punti[a + 2] + (punti[b + 2] - punti[a + 2]) * t, punti[a + 3] + (punti[b + 3] - punti[a + 3]) * t];
  }

  function liscio(a, b, x) {
    const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  }

  /* ------------------------------------------------------ scale visive */

  // Distanze dal Sole accorciate: 1 UA -> 18 unita', Nettuno (30 UA) -> ~83.
  function scalaDistanza(ua) {
    return ua <= 0 ? 0 : 18 * Math.pow(ua, 0.45);
  }

  // Raggi ingranditi: Terra -> ~0,47, Giove -> ~1,3, Sole -> ~3,4.
  function scalaRaggio(km) {
    return Math.max(0.03, 0.012 * Math.pow(km, 0.42));
  }

  // Distanza di una luna dal suo pianeta, in raggi visivi del pianeta.
  function scalaLuna(km, raggioPianetaKm, raggioPianetaVis) {
    const rapporto = Math.max(1, km / raggioPianetaKm);
    return raggioPianetaVis * (1 + 0.9 * Math.pow(rapporto, 0.4));
  }

  /* -------------------------------------------------- movimento estetico */

  // In modalita' estetica (quella di partenza) i corpi partono dalla posizione
  // vera del giorno scelto, ma poi si muovono a velocita' "da guardare": la
  // velocita' vera viene compressa con una potenza 0,35 e limitata, cosi' chi e'
  // piu' veloce resta piu' veloce ma tutto sta in un intervallo comodo.
  //   orbita:   gradi al secondo = 6 x n^0,35   (n in gradi al giorno), fra 0,6 e 9
  //             -> la Terra fa un giro attorno al Sole in un minuto, Nettuno in 6,
  //                la Luna, la ISS e Io in 40 secondi;
  //   rotazione: gradi al secondo = 0,75 x |W'|^0,35, fra 0,6 e 10
  //             -> la Terra fa un giro su se stessa in circa un minuto, Giove in 45
  //                secondi, Venere (al contrario) in 10 minuti.
  // Ogni corpo ha il suo "tempo": al giorno vero si aggiungono due scarti che
  // crescono con queste velocita' (vedi aggiornaPosizioni).
  function velocitaEstetica(gradiAlGiorno, k, min, max) {
    const n = Math.abs(gradiAlGiorno);
    if (!n) return 0;
    const gradiAlSecondo = Math.max(min, Math.min(max, k * Math.pow(n, 0.35)));
    return gradiAlSecondo / n; // giorni simulati per secondo, per questo corpo
  }

  function motoMedio(o) {
    if (!o) return 0;
    if (o.tipo === 'standish') return o.L[1] / 36525;
    return o.n || 0;
  }

  /* ------------------------------------------------------------ shader */

  const VS_CORPO = `
attribute vec3 aPos;
attribute vec2 aUv;
uniform mat4 uMvp;
uniform mat4 uModello;
uniform vec3 uScalaInv2;
varying vec2 vUv;
varying vec3 vNorm;
varying vec3 vMondo;
void main() {
  vUv = aUv;
  vec4 m = uModello * vec4(aPos, 1.0);
  vMondo = m.xyz;
  vNorm = normalize((uModello * vec4(aPos * uScalaInv2, 0.0)).xyz);
  gl_Position = uMvp * vec4(aPos, 1.0);
}`;

  const FS_CORPO = `
precision mediump float;
uniform sampler2D uTex;
uniform float uHaTex;
uniform float uLonU;
uniform vec3 uColore;
uniform vec3 uSole;
uniform float uEmissivo;
uniform float uAmbiente;
uniform vec3 uOcchio;
varying vec2 vUv;
varying vec3 vNorm;
varying vec3 vMondo;
void main() {
  vec3 base = uHaTex > 0.5 ? texture2D(uTex, vec2(vUv.x + uLonU, vUv.y)).rgb : uColore;
  if (uEmissivo > 1.5) {
    // Sole disegnato: chiaro al centro, arancione verso il bordo (come la
    // miniatura nel menu). E' una scelta di disegno: la scheda lo dice.
    float t = max(dot(normalize(vNorm), normalize(uOcchio - vMondo)), 0.0);
    vec3 c = mix(vec3(1.0, 0.5, 0.08), vec3(1.0, 0.72, 0.28), smoothstep(0.0, 0.45, t));
    c = mix(c, vec3(1.0, 0.93, 0.66), smoothstep(0.45, 1.0, t));
    gl_FragColor = vec4(c, 1.0);
    return;
  }
  if (uEmissivo > 0.5) {
    gl_FragColor = vec4(base, 1.0);
    return;
  }
  vec3 L = normalize(uSole - vMondo);
  float luce = max(dot(normalize(vNorm), L), 0.0);
  gl_FragColor = vec4(base * (uAmbiente + (1.0 - uAmbiente) * luce), 1.0);
}`;

  const VS_ANELLO = `
attribute vec3 aPos;
uniform mat4 uMvp;
void main() {
  gl_Position = uMvp * vec4(aPos, 1.0);
}`;

  // Anelli: fasce uniformi fra il raggio interno e quello esterno dei dati, con
  // un'opacita' che segue la densita' vera (vedi scripts/build_sistema_solare.py).
  const FS_ANELLO = `
precision mediump float;
uniform vec3 uColore;
uniform float uAlfa;
void main() {
  gl_FragColor = vec4(uColore, uAlfa);
}`;

  const VS_LINEA = `
attribute vec3 aPos;
uniform mat4 uMvp;
uniform float uPunto;
void main() {
  gl_Position = uMvp * vec4(aPos, 1.0);
  gl_PointSize = uPunto;
}`;

  const FS_LINEA = `
precision mediump float;
uniform vec4 uColore;
void main() {
  gl_FragColor = uColore;
}`;

  // Alone del Sole: un quadrato rivolto alla camera con una sfumatura radiale.
  const VS_ALONE = `
attribute vec2 aAngolo;
uniform mat4 uVp;
uniform vec3 uCentro;
uniform vec3 uDestra;
uniform vec3 uSu;
uniform float uRaggio;
varying vec2 vAngolo;
void main() {
  vAngolo = aAngolo;
  vec3 p = uCentro + (uDestra * aAngolo.x + uSu * aAngolo.y) * uRaggio;
  gl_Position = uVp * vec4(p, 1.0);
}`;

  const FS_ALONE = `
precision mediump float;
uniform vec3 uColore;
uniform float uForza;
varying vec2 vAngolo;
void main() {
  float d = length(vAngolo);
  float a = clamp(1.0 - d, 0.0, 1.0);
  gl_FragColor = vec4(uColore, a * a * uForza);
}`;

  // Modelli 3D (la ISS): vertici con normale e indice di colore nella
  // tavolozza dei materiali del modello originale.
  const VS_MODELLO = `
attribute vec3 aPos;
attribute vec3 aNor;
attribute float aCol;
uniform mat4 uMvp;
uniform mat4 uModello;
uniform vec3 uTav[16];
varying vec3 vCol;
varying vec3 vNorm;
varying vec3 vMondo;
void main() {
  vCol = uTav[int(aCol + 0.5)];
  vMondo = (uModello * vec4(aPos, 1.0)).xyz;
  vNorm = normalize((uModello * vec4(aNor, 0.0)).xyz);
  gl_Position = uMvp * vec4(aPos, 1.0);
}`;

  const FS_MODELLO = `
precision mediump float;
uniform vec3 uSole;
varying vec3 vCol;
varying vec3 vNorm;
varying vec3 vMondo;
void main() {
  vec3 L = normalize(uSole - vMondo);
  float luce = abs(dot(normalize(vNorm), L));
  gl_FragColor = vec4(vCol * (0.2 + 0.8 * luce), 1.0);
}`;

  function compila(gl, vs, fs) {
    function shader(tipo, src) {
      const s = gl.createShader(tipo);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    }
    const p = gl.createProgram();
    gl.attachShader(p, shader(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, shader(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {};
    const nU = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let k = 0; k < nU; k++) {
      const info = gl.getActiveUniform(p, k);
      u[info.name] = gl.getUniformLocation(p, info.name);
    }
    const a = {};
    const nA = gl.getProgramParameter(p, gl.ACTIVE_ATTRIBUTES);
    for (let k = 0; k < nA; k++) {
      const info = gl.getActiveAttrib(p, k);
      a[info.name] = gl.getAttribLocation(p, info.name);
    }
    return { p, u, a };
  }

  /* ------------------------------------------------------------- mesh */

  function meshSfera(gl, nLat, nLon) {
    const pos = [];
    const uv = [];
    for (let i = 0; i <= nLat; i++) {
      const lat = Math.PI / 2 - (i / nLat) * Math.PI;
      for (let j = 0; j <= nLon; j++) {
        const lon = -Math.PI + (j / nLon) * 2 * Math.PI;
        // Asse z = polo nord del corpo, asse x = longitudine 0.
        pos.push(Math.cos(lat) * Math.cos(lon), Math.cos(lat) * Math.sin(lon), Math.sin(lat));
        // Mappe equirettangolari con la longitudine 0 al centro e l'est a destra.
        uv.push(j / nLon, i / nLat);
      }
    }
    const idx = [];
    for (let i = 0; i < nLat; i++) {
      for (let j = 0; j < nLon; j++) {
        const a = i * (nLon + 1) + j;
        const b = a + nLon + 1;
        idx.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
    return meshDa(gl, pos, uv, idx);
  }

  function meshDa(gl, pos, uv, idx) {
    const bPos = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bPos);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pos), gl.STATIC_DRAW);
    const bUv = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bUv);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uv), gl.STATIC_DRAW);
    const bIdx = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bIdx);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW);
    return { bPos, bUv, bIdx, n: idx.length };
  }

  function bufferLinea(gl, punti) {
    const b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(punti), gl.STATIC_DRAW);
    return { b, n: punti.length / 3 };
  }

  // Generatore pseudo-casuale deterministico per le fasce di asteroidi: la
  // forma della nuvola di punti resta uguale a ogni caricamento.
  function casuale(seme) {
    let s = seme >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ------------------------------------------------------------- motore */

  function crea(canvas, dati, opzioni) {
    const opz = opzioni || {};
    const gl = canvas.getContext('webgl', { antialias: true, alpha: false, preserveDrawingBuffer: false })
      || canvas.getContext('experimental-webgl');
    if (!gl) return null;

    const progCorpo = compila(gl, VS_CORPO, FS_CORPO);
    const progAnello = compila(gl, VS_ANELLO, FS_ANELLO);
    const progLinea = compila(gl, VS_LINEA, FS_LINEA);
    const progAlone = compila(gl, VS_ALONE, FS_ALONE);
    const progModello = compila(gl, VS_MODELLO, FS_MODELLO);
    const sfera = meshSfera(gl, 48, 96);
    const quadAlone = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadAlone);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const traiettorie = opz.traiettorie || {};
    const corpi = new Map();
    dati.corpi.forEach((c) => corpi.set(c.id, {
      dati: c,
      raggioVis: scalaRaggio(c.raggio_km),
      pos: [0, 0, 0],       // posizione visiva, spazio GL
      posVera: [0, 0, 0],   // posizione vera, eclittica (UA o km dal genitore)
      assi: null,           // assi del corpo in spazio GL
      tex: null,
      texStato: 'no',       // 'pronta' quando c.tex ha una mappa, bassa o grande
      texBassa: 'no',
      texGrande: 'no',
      texLivello: null,     // 'bassa' o 'grande': quella in c.tex
      orbita: null
    }));

    // La ISS e' lunga 109 m: in proporzione alla Terra sarebbe invisibile. La si
    // disegna lunga il 4% del raggio terrestre visivo e la scheda lo dice.
    corpi.forEach((c) => {
      if (c.dati.tipo === 'stazione' && corpi.get(c.dati.genitore)) c.raggioVis = corpi.get(c.dati.genitore).raggioVis * 0.04;
      // Una sonda e' grande pochi metri: la si disegna come un puntino, e da
      // vicino con il modello, molto ingrandita (la scheda lo dice).
      if (c.dati.tipo === 'sonda') c.raggioVis = 0.03;
      c.velOrbita = velocitaEstetica(motoMedio(c.dati.orbita), 6, 0.6, 9);
      c.velRotazione = c.dati.polo ? velocitaEstetica(c.dati.polo.Wd, 0.75, 0.6, 10) : 0;
      c.scartoOrbita = 0;
      c.scartoRotazione = 0;
      c.dal = c.dati.dal ? jdDaData(new Date(c.dati.dal + 'T00:00:00Z')) : 0;
    });

    const stato = {
      estetico: true,
      fattoreEstetico: 1,    // 0 = fermo
      jd: jdDaData(new Date()),
      velocita: 1,           // giorni simulati per secondo
      bersaglio: 'sole',
      camDist: 80,
      camYaw: -0.6,
      camPitch: 0.45,
      transizione: null,
      filtri: { orbite: true, nani: true, lune: true, asteroidi: true, comete: true, fasce: true, sonde: true },
      evidenzia: null,       // id di un'orbita da evidenziare (sciami meteorici)
      confronto: null,       // elenco di id in modalita' confronto
      film: null,            // { base: jd } durante il film delle Voyager
      sporco: true,
      disegnato: false,      // dopo il primo disegno si caricano le mappe
      ultimo: 0,
      vp: mat4Identita(),
      occhio: [0, 0, 0],
      w: 1,
      h: 1
    };

    /* ---------------------------------------------------- texture */

    // Mappe in due livelli: prima la bassa (512x256, pochi KB, in basse/),
    // la grande solo quando il corpo e' grande sullo schermo o e' il
    // bersaglio. Le immagini si decodificano fuori dal ciclo; texImage2D e
    // generateMipmap sono sincroni, quindi una sola mappa per fotogramma.
    const SOGLIA_GRANDE = 130;   // raggio in pixel CSS oltre cui serve la grande
    const codaTexture = [];

    function caricaTexture(c, grande) {
      const k = grande ? 'texGrande' : 'texBassa';
      if (c[k] !== 'no' || !c.dati.tex) return;
      c[k] = 'carico';
      const img = new Image();
      img.decoding = 'async';
      img.src = (opz.cartellaTexture || '') + (grande ? '' : 'basse/') + c.dati.tex;
      (img.decode ? img.decode() : new Promise((ok, no) => { img.onload = ok; img.onerror = no; }))
        .then(() => { codaTexture.push({ c, img, grande }); })
        .catch(() => {
          c[k] = 'errore';
          // Senza la bassa si ripiega sulla grande.
          if (!grande) caricaTexture(c, true);
        });
    }

    function caricaSullaGpu() {
      const { c, img, grande } = codaTexture.shift();
      c[grande ? 'texGrande' : 'texBassa'] = 'pronta';
      // Una bassa arrivata dopo la grande non serve piu'.
      if (!grande && c.texLivello === 'grande') return;
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      const pot = (n) => (n & (n - 1)) === 0;
      if (pot(img.width) && pot(img.height)) {
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      } else {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      }
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      // REPEAT in orizzontale: le mappe con 180° al centro si spostano di
      // mezzo giro (uLonU) e devono richiudersi sul bordo.
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, pot(img.width) ? gl.REPEAT : gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      // La bassa resta in uso finche' la grande non e' pronta: niente buchi.
      if (c.tex) gl.deleteTexture(c.tex);
      c.tex = t;
      c.texStato = 'pronta';
      c.texLivello = grande ? 'grande' : 'bassa';
      stato.sporco = true;
    }

    /* ---------------------------------------------- posizioni vere */

    const basiPiano = new Map();
    function basePiano(piano) {
      if (piano === 'eclittica') return null;
      const k = piano.ra + ',' + piano.dec;
      if (!basiPiano.has(k)) basiPiano.set(k, baseDaPolo(piano.ra, piano.dec));
      return basiPiano.get(k);
    }

    // Posizione vera: UA dal Sole per le orbite eliocentriche, km dal
    // genitore per le lune. Sempre in eclittica J2000.
    function posizioneVera(c, jd) {
      if (c.dati.tipo === 'sonda') {
        const T = traiettorie[c.dati.id];
        if (!T) return [0, 0, 0];
        // Prima del lancio la sonda e' sulla Terra.
        if (jd < T.punti[0] && corpi.get('terra')) return posizioneVera(corpi.get('terra'), jd);
        return interpola(T.punti, jd);
      }
      const o = c.dati.orbita;
      if (!o) return [0, 0, 0];
      if (o.tipo === 'standish') {
        const el = elementiStandish(o, jd);
        return posizioneKepler(el.a, el.e, el.i, el.nodo, el.w, el.M);
      }
      const el = elementiKepler(o, jd);
      const p = posizioneKepler(el.a, el.e, el.i, el.nodo, el.w, el.M);
      if (o.tipo === 'luna') {
        const b = basePiano(o.piano);
        return b ? nelPiano(b, p) : p;
      }
      return p;
    }

    // Posizione disegnata di una sonda. Lontano dai pianeti: come gli altri
    // corpi, distanza dal Sole accorciata. Durante un sorvolo il pianeta e'
    // ingrandito, e la traiettoria vera gli passerebbe dentro: per quei giorni
    // si usa la posizione vera rispetto al pianeta, accorciata come per le
    // lune, e si sfuma fra le due nell'arco di un giorno.
    function visivaSonda(c, jd, vera, posPianeta) {
      const r = lung(vera);
      let p = glDa(per(vera, scalaDistanza(r) / (r || 1)));
      const T = traiettorie[c.dati.id];
      for (const s of (T && T.sorvoli) || []) {
        const n = s.punti.length / 4;
        const t0 = s.punti[0];
        const t1 = s.punti[(n - 1) * 4];
        if (jd <= t0 || jd >= t1) continue;
        const g = corpi.get(s.genitore);
        if (!g) continue;
        const rel = interpola(s.punti, jd);
        const rr = lung(rel);
        const gp = posPianeta ? posPianeta(g, jd) : g.pos;
        const locale = somma(gp, glDa(per(rel, scalaLuna(rr, g.dati.raggio_km, g.raggioVis) / (rr || 1))));
        // Il peso cresce piano fino al massimo avvicinamento (a meta' della
        // finestra) e poi cala: la scia gira attorno al pianeta senza spigoli.
        const tc = (t0 + t1) / 2;
        const w = Math.min(1, 4 * liscio(t0, tc, jd) * (1 - liscio(tc, t1, jd)));
        p = mescola(p, locale, w);
      }
      return p;
    }

    function posizioneVisiva(c, vera) {
      const d = c.dati;
      if (d.tipo === 'sonda') return visivaSonda(c, stato.jd, vera);
      if (!d.orbita) return [0, 0, 0];
      if (d.orbita.tipo === 'luna') {
        const g = corpi.get(d.genitore);
        const r = lung(vera);
        // La ISS sta a 420 km dal suolo: si usa la proporzione vera con la Terra.
        const dv = d.orbita.scalaVera ? r * g.raggioVis / g.dati.raggio_km : scalaLuna(r, g.dati.raggio_km, g.raggioVis);
        return somma(g.pos, glDa(per(vera, dv / (r || 1))));
      }
      const r = lung(vera);
      return glDa(per(vera, scalaDistanza(r) / (r || 1)));
    }

    // Orientamento: polo e primo meridiano IAU, oppure faccia rivolta al
    // genitore per le lune in rotazione sincrona.
    function orienta(c, jd, jdRotazione) {
      const d = c.dati;
      if (d.polo) {
        const T = (jd - J2000) / 36525;
        const ra = (d.polo.ra0 + (d.polo.ra1 || 0) * T) * RAD;
        const dec = (d.polo.dec0 + (d.polo.dec1 || 0) * T) * RAD;
        const W = (d.polo.W0 + d.polo.Wd * ((jdRotazione === undefined ? jd : jdRotazione) - J2000)) * RAD;
        const P = [Math.cos(dec) * Math.cos(ra), Math.cos(dec) * Math.sin(ra), Math.sin(dec)];
        const N = [-Math.sin(ra), Math.cos(ra), 0];
        const Q = vett(P, N);
        const X = somma(per(N, Math.cos(W)), per(Q, Math.sin(W)));
        const Z = P;
        const Y = vett(Z, X);
        c.assi = [glDa(eclDaEq(X)), glDa(eclDaEq(Y)), glDa(eclDaEq(Z))];
        return;
      }
      if (d.tipo === 'sonda') {
        // L'antenna di Voyager punta sempre verso la Terra.
        const terra = corpi.get('terra');
        const verso = norm(diff(terra ? terra.posVera : [0, 0, 0], c.posVera));
        const laterale = norm(vett([0, 0, 1], verso));
        c.assi = [glDa(verso), glDa(laterale), glDa(vett(verso, laterale))];
        return;
      }
      if (d.tipo === 'stazione' && d.orbita) {
        // La ISS vola con lo stesso lato verso la Terra: asse lungo (traliccio)
        // perpendicolare all'orbita, secondo asse lungo la direzione di volo.
        const ora = c.posVera;
        const vel = norm(diff(posizioneVera(c, jd + 1e-4), ora));
        const normale = norm(vett(ora, vel));
        c.assi = [glDa(normale), glDa(vel), glDa(vett(normale, vel))];
        return;
      }
      if (d.sincrona && d.orbita && d.orbita.tipo === 'luna') {
        // Longitudine 0 verso il pianeta, polo lungo il moto orbitale.
        const ora = c.posVera;
        const dopo = posizioneVera(c, jd + 0.01);
        const verso = norm(per(ora, -1));
        const polo = norm(vett(ora, diff(dopo, ora)));
        const Y = vett(polo, verso);
        c.assi = [glDa(verso), glDa(Y), glDa(polo)];
        return;
      }
      c.assi = [[1, 0, 0], [0, 0, -1], [0, 1, 0]];
    }

    // Nel film delle Voyager la data corre di anni in pochi secondi. I corpi non
    // la seguono: partono dalla posizione vera del primo giorno e poi girano con
    // il movimento estetico. Solo attorno ai sorvoli scivolano lungo l'orbita
    // fino alla posizione vera, cosi' le sonde li incontrano dove li hanno
    // incontrati davvero:
    //  - la Terra (lanci) e i corpi sorvolati (pianeti, Titano) seguono la data
    //    vera dal primo all'ultimo sorvolo: si muovono di pochi gradi;
    //  - le altre lune di un pianeta sorvolato si fermano nella posizione vera
    //    del primo sorvolo, quella che le sonde hanno visto (girano solo su se
    //    stesse). Seguire la data le farebbe girare come trottole.
    // Le sonde seguono sempre la data del film.
    const RAMPA_ANCORA = 200; // giorni di film per scivolare verso il vero
    const ancore = new Map(); // id -> { t0, t1, fisso: JD o null }
    function preparaAncore() {
      ancore.clear();
      const allarga = (id, t0, t1) => {
        const a = ancore.get(id);
        ancore.set(id, a ? { t0: Math.min(a.t0, t0), t1: Math.max(a.t1, t1), fisso: null } : { t0, t1, fisso: null });
      };
      const primi = new Map(); // pianeta -> primo sorvolo
      Object.values(traiettorie).forEach((T) => {
        // Prima del lancio la sonda sta sulla Terra vera: la Terra deve esserci.
        allarga('terra', T.punti[0] - 5, T.punti[0]);
        (T.sorvoli || []).forEach((s) => {
          const t0 = s.punti[0];
          const t1 = s.punti[s.punti.length - 4];
          allarga(s.genitore, t0, t1);
          const g = corpi.get(s.genitore);
          const pianeta = g && g.dati.genitore && g.dati.genitore !== 'sole' ? g.dati.genitore : s.genitore;
          if (pianeta !== s.genitore) allarga(pianeta, t0, t1);
          if (!primi.has(pianeta) || primi.get(pianeta)[0] > t0) primi.set(pianeta, [t0, t1]);
        });
      });
      corpi.forEach((c) => {
        const f = primi.get(c.dati.genitore);
        if (f && !ancore.has(c.dati.id)) ancore.set(c.dati.id, { t0: f[0], t1: f[1], fisso: (f[0] + f[1]) / 2 });
      });
    }

    // Tempo dell'orbita e della rotazione con cui si disegna un corpo.
    function tempiDisegno(c) {
      const jd = stato.jd;
      c.pesoAncora = 0;
      if (stato.film && c.dati.tipo !== 'sonda') {
        const tA = stato.film.base + c.scartoOrbita;
        const tR = stato.film.base + c.scartoRotazione;
        const a = ancore.get(c.dati.id);
        const n = Math.abs(motoMedio(c.dati.orbita));
        if (!a || !n) return [tA, tR];
        const fuori = jd < a.t0 ? a.t0 - jd : (jd > a.t1 ? jd - a.t1 : 0);
        const w = 1 - liscio(0, RAMPA_ANCORA, fuori);
        if (!w) {
          c.giriAncora = null;
          return [tA, tR];
        }
        c.pesoAncora = w;
        const meta = a.fisso !== null ? a.fisso : Math.max(a.t0, Math.min(a.t1, jd));
        // Stessa posizione del giorno vero, a meno di giri interi: il numero di
        // giri si fissa all'inizio della rampa, cosi' il corpo non salta.
        const P = 360 / n;
        if (c.giriAncora === null || c.giriAncora === undefined) c.giriAncora = Math.round((meta - tA) / P);
        return [tA + w * (meta - tA - c.giriAncora * P), tR];
      }
      if (stato.estetico) return [jd + c.scartoOrbita, jd + c.scartoRotazione];
      return [jd, jd];
    }

    function aggiornaPosizioni() {
      // Prima i corpi in orbita attorno al Sole, poi le lune (servono i genitori).
      const ordine = [];
      corpi.forEach((c) => { if (!c.dati.orbita || c.dati.orbita.tipo !== 'luna') ordine.push(c); });
      corpi.forEach((c) => { if (c.dati.orbita && c.dati.orbita.tipo === 'luna') ordine.push(c); });
      // Le sonde per ultime: durante i sorvoli servono le posizioni dei pianeti.
      const sonde = ordine.filter((c) => c.dati.tipo === 'sonda');
      sonde.forEach((c) => ordine.splice(ordine.indexOf(c), 1));
      ordine.push(...sonde);
      for (const c of ordine) {
        const [t, tRot] = tempiDisegno(c);
        c.posVera = posizioneVera(c, t);
        c.pos = posizioneVisiva(c, c.posVera);
        orienta(c, t, tRot);
        // Il piano dell'orbita della ISS ruota: la sua linea si ricalcola.
        if (c.orbita && c.dati.orbita.nodoRate && Math.abs(t - (c.orbitaJd || 0)) > 0.02) {
          c.orbita = costruisciOrbita(c, t);
          c.orbitaJd = t;
        }
      }
      if (stato.confronto) dispostiConfronto();
    }

    /* ------------------------------------------------- linee d'orbita */

    function costruisciOrbita(c, jdOrbita) {
      const jdO = jdOrbita === undefined ? stato.jd : jdOrbita;
      const d = c.dati;
      const o = d.orbita;
      if (!o) return null;
      const punti = [];
      const N = 360;
      if (o.tipo === 'standish' || o.tipo === 'kepler') {
        const el = o.tipo === 'standish' ? elementiStandish(o, stato.jd) : elementiKepler(o, stato.jd);
        for (let k = 0; k <= N; k++) {
          const E = (k / N) * 2 * Math.PI;
          // Passo uniforme in anomalia eccentrica: le comete molto allungate
          // restano lisce anche vicino al perielio.
          const M = E - el.e * Math.sin(E);
          const p = posizioneKepler(el.a, el.e, el.i, el.nodo, el.w, M);
          const r = lung(p);
          const g = glDa(per(p, scalaDistanza(r) / (r || 1)));
          punti.push(g[0], g[1], g[2]);
        }
        return { buf: bufferLinea(gl, punti), relativa: false };
      }
      // Luna: punti relativi al genitore (la matrice li sposta ogni fotogramma).
      const g = corpi.get(d.genitore);
      const b = basePiano(o.piano);
      const el = elementiKepler(o, jdO);
      for (let k = 0; k <= N; k++) {
        const E = (k / N) * 2 * Math.PI;
        const M = E - o.e * Math.sin(E);
        let p = posizioneKepler(o.a, o.e, el.i, el.nodo, el.w, M);
        if (b) p = nelPiano(b, p);
        const r = lung(p);
        const dv = o.scalaVera ? r * g.raggioVis / g.dati.raggio_km : scalaLuna(r, g.dati.raggio_km, g.raggioVis);
        const q = glDa(per(p, dv / (r || 1)));
        punti.push(q[0], q[1], q[2]);
      }
      return { buf: bufferLinea(gl, punti), relativa: true };
    }

    // Fasce: nuvole di punti fra i raggi citati nei dati. Rappresentano dove
    // stanno gli oggetti, non quanti sono ne' dove si trova ciascuno.
    function costruisciFascia(fascia, seme, quanti) {
      const rnd = casuale(seme);
      const punti = [];
      for (let k = 0; k < quanti; k++) {
        const r = fascia.da + (fascia.a - fascia.da) * rnd();
        const t = rnd() * 2 * Math.PI;
        const z = (rnd() - 0.5) * 2 * Math.tan((fascia.spessoreGradi || 10) * RAD) * r * 0.5;
        const p = [r * Math.cos(t), r * Math.sin(t), z];
        const rr = lung(p);
        const g = glDa(per(p, scalaDistanza(rr) / rr));
        punti.push(g[0], g[1], g[2]);
      }
      return bufferLinea(gl, punti);
    }

    let fasce = [];
    function preparaGeometria() {
      aggiornaPosizioni();
      corpi.forEach((c) => { c.orbita = costruisciOrbita(c); });
      fasce = (dati.fasce || []).map((f, k) => ({ f, buf: costruisciFascia(f, 7 + k, f.punti || 1500) }));
    }

    /* ---------------------------------------------------- camera */

    function visibile(c) {
      const t = c.dati.tipo;
      if (t === 'sonda') return !stato.confronto && stato.filtri.sonde && !!traiettorie[c.dati.id];
      // La ISS non si mostra prima del suo primo modulo (nel film delle Voyager).
      if (c.dal && stato.jd < c.dal) return false;
      if (stato.confronto) return stato.confronto.includes(c.dati.id);
      if (c.dati.solo_confronto) return false;
      if (t === 'pianeta-nano' && !stato.filtri.nani) return false;
      if (t === 'luna' && !stato.filtri.lune) return false;
      if ((t === 'asteroide' || t === 'oggetto-kuiper') && !stato.filtri.asteroidi) return false;
      if (t === 'cometa' && !stato.filtri.comete) return false;
      if (t === 'luna' || t === 'stazione') {
        const g = corpi.get(c.dati.genitore);
        if (g && !visibile(g)) return false;
      }
      return true;
    }

    // Raggio visivo: in confronto quello in scala vera, altrimenti quello ingrandito.
    function rv(c) {
      return stato.confronto && c.raggioVisConfronto ? c.raggioVisConfronto : c.raggioVis;
    }

    function puntoBersaglio() {
      if (stato.bersaglio === '__confronto') return stato.centroConfronto;
      const c = corpi.get(stato.bersaglio);
      return c ? c.pos : [0, 0, 0];
    }

    function aggiornaCamera() {
      let centro = puntoBersaglio();
      let dist = stato.camDist;
      let yaw = stato.camYaw;
      let pitch = stato.camPitch;
      const tr = stato.transizione;
      if (tr) {
        const t = Math.min(1, (performance.now() - tr.inizio) / tr.durata);
        const s = t * t * (3 - 2 * t);
        centro = mescola(tr.daCentro, centro, s);
        dist = Math.exp(Math.log(tr.daDist) + (Math.log(stato.camDist) - Math.log(tr.daDist)) * s);
        if (tr.daYaw !== undefined) {
          // Giro piu' corto fra i due angoli.
          const dy = Math.atan2(Math.sin(stato.camYaw - tr.daYaw), Math.cos(stato.camYaw - tr.daYaw));
          yaw = tr.daYaw + dy * s;
          pitch = tr.daPitch + (stato.camPitch - tr.daPitch) * s;
        }
        if (t >= 1) stato.transizione = null;
        stato.sporco = true;
      }
      const cp = Math.cos(pitch);
      const occhio = somma(centro, [
        dist * cp * Math.sin(yaw),
        dist * Math.sin(pitch),
        dist * cp * Math.cos(yaw)
      ]);
      // La camera non entra mai dentro un corpo: se ci finisce (ruotando vicino
      // alla ISS, o zoomando sulla superficie) la si riporta appena fuori.
      corpi.forEach((c) => {
        if (!visibile(c) || c.dati.modello || nascostoDalPrimoPiano(c)) return;
        const r = rv(c) * 1.06;
        const v = diff(occhio, c.pos);
        const l = lung(v);
        if (l < r && l > 0) {
          const fuori = somma(c.pos, per(v, r / l));
          occhio[0] = fuori[0];
          occhio[1] = fuori[1];
          occhio[2] = fuori[2];
        }
      });
      stato.occhio = occhio;
      stato.centro = centro;
      const near = Math.max(0.0005, dist * 0.02);
      const far = dist + 900;
      const proj = mat4Prospettiva(45 * RAD, stato.w / stato.h, near, far);
      // Schermo verticale (telefono): il cartellino copre la meta' bassa, quindi
      // il corpo scelto si mostra nella meta' alta. Si sposta l'immagine, non la
      // camera: proiezioni, etichette e tocchi restano coerenti.
      if (stato.h > stato.w * 1.1 && stato.bersaglio !== 'sole' && !stato.confronto) {
        for (let k = 0; k < 4; k++) proj[k * 4 + 1] += 0.32 * proj[k * 4 + 3];
      }
      const vista = mat4Guarda(occhio, centro, [0, 1, 0]);
      stato.vp = mat4Mul(proj, vista);
      stato.vista = vista;
    }

    function proietta(p) {
      const m = stato.vp;
      const x = m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12];
      const y = m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13];
      const w = m[3] * p[0] + m[7] * p[1] + m[11] * p[2] + m[15];
      if (w <= 0) return null;
      return { x: (x / w * 0.5 + 0.5) * stato.w, y: (1 - (y / w * 0.5 + 0.5)) * stato.h, w };
    }

    // Raggio apparente in pixel di una sfera di raggio r a distanza w.
    function pixelRaggio(r, w) {
      return (r / w) * (stato.h / 2) / Math.tan(22.5 * RAD);
    }

    /* ---------------------------------------------------- disegno */

    function attiva(prog, mesh) {
      gl.useProgram(prog.p);
      gl.bindBuffer(gl.ARRAY_BUFFER, mesh.bPos);
      gl.enableVertexAttribArray(prog.a.aPos);
      gl.vertexAttribPointer(prog.a.aPos, 3, gl.FLOAT, false, 0, 0);
      if (prog.a.aUv !== undefined) {
        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.bUv);
        gl.enableVertexAttribArray(prog.a.aUv);
        gl.vertexAttribPointer(prog.a.aUv, 2, gl.FLOAT, false, 0, 0);
      }
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.bIdx);
    }

    function scalaCorpo(c) {
      // Corpi non sferici: ellissoide con i tre diametri veri, scalato perche'
      // il raggio medio coincida con quello visivo.
      const a = c.dati.assi_km;
      const r = rv(c);
      if (!a) return [r, r, r];
      const media = Math.cbrt(a[0] * a[1] * a[2]) / 2;
      const k = r / media;
      return [a[0] / 2 * k, a[1] / 2 * k, a[2] / 2 * k];
    }

    function caricaModello(c) {
      if (c.modelloStato) return;
      c.modelloStato = 'carico';
      fetch((opz.cartellaTexture || '') + c.dati.modello.file)
        .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(r.status))))
        .then((buf) => {
          const b = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, b);
          gl.bufferData(gl.ARRAY_BUFFER, buf, gl.STATIC_DRAW);
          c.modelloBuf = { b, n: buf.byteLength / 10 };
          c.modelloStato = 'pronto';
          stato.sporco = true;
        })
        .catch(() => { c.modelloStato = 'errore'; });
    }

    function disegnaModelli() {
      corpi.forEach((c) => {
        if (!c.dati.modello || !visibile(c)) return;
        const pr = proietta(c.pos);
        if (!pr) return;
        if (pixelRaggio(rv(c), pr.w) > 1 || c.dati.id === stato.bersaglio) caricaModello(c);
        if (c.modelloStato !== 'pronto') return;
        const r = rv(c);
        const modello = mat4Assi(c.assi[0], c.assi[1], c.assi[2], r, r, r, c.pos);
        gl.useProgram(progModello.p);
        gl.bindBuffer(gl.ARRAY_BUFFER, c.modelloBuf.b);
        gl.enableVertexAttribArray(progModello.a.aPos);
        gl.vertexAttribPointer(progModello.a.aPos, 3, gl.SHORT, true, 10, 0);
        gl.enableVertexAttribArray(progModello.a.aNor);
        gl.vertexAttribPointer(progModello.a.aNor, 3, gl.BYTE, true, 10, 6);
        gl.enableVertexAttribArray(progModello.a.aCol);
        gl.vertexAttribPointer(progModello.a.aCol, 1, gl.UNSIGNED_BYTE, false, 10, 9);
        gl.uniformMatrix4fv(progModello.u.uModello, false, modello);
        gl.uniformMatrix4fv(progModello.u.uMvp, false, mat4Mul(stato.vp, modello));
        gl.uniform3fv(progModello.u.uSole, corpi.get('sole') ? corpi.get('sole').pos : [0, 0, 0]);
        const tav = new Float32Array(48);
        c.dati.modello.tavolozza.slice(0, 16).forEach((col, k) => tav.set(col, k * 3));
        gl.uniform3fv(progModello.u['uTav[0]'], tav);
        gl.drawArrays(gl.TRIANGLES, 0, c.modelloBuf.n);
        gl.disableVertexAttribArray(progModello.a.aNor);
        gl.disableVertexAttribArray(progModello.a.aCol);
      });
    }

    // Nel primo piano della ISS la Terra non si disegna: la camera e' a pochi
    // raggi della stazione e il pianeta riempirebbe o taglierebbe la scena.
    // Il segmento dalla camera al punto passa dentro la sfera del corpo g?
    function copertoDa(g, p) {
      const d = diff(p, stato.occhio);
      const L = lung(d);
      if (!L) return false;
      const u = per(d, 1 / L);
      const oc = diff(g.pos, stato.occhio);
      const t = punto(oc, u);
      if (t <= 0 || t >= L) return false;
      const r = rv(g);
      return lung(diff(oc, per(u, t))) < r && t < L - r * 0.05;
    }

    function nascostoDalPrimoPiano(c) {
      const b = corpi.get(stato.bersaglio);
      return !!(b && b.dati.tipo === 'stazione' && b.dati.genitore === c.dati.id && !stato.transizione);
    }

    function disegnaCorpi() {
      attiva(progCorpo, sfera);
      gl.uniform3fv(progCorpo.u.uSole, corpi.get('sole') ? corpi.get('sole').pos : [0, 0, 0]);
      gl.uniform1i(progCorpo.u.uTex, 0);
      corpi.forEach((c) => {
        if (!visibile(c) || c.dati.modello || nascostoDalPrimoPiano(c)) return;
        const pr = proietta(c.pos);
        if (!pr) return;
        const px = pixelRaggio(rv(c), pr.w);
        // Nessuna mappa prima del primo disegno: la scena compare subito.
        if (stato.disegnato && (px > 3 || c.dati.id === stato.bersaglio)) {
          caricaTexture(c, false);
          // La grande solo se il disco tocca lo schermo: un corpo vicino alla
          // camera ma fuori inquadratura ha un raggio enorme e non si vede.
          const inQuadro = pr.x > -px && pr.x < stato.w + px && pr.y > -px && pr.y < stato.h + px;
          if ((px > SOGLIA_GRANDE && inQuadro) || c.dati.id === stato.bersaglio) caricaTexture(c, true);
        }
        const s = scalaCorpo(c);
        const modello = mat4Assi(c.assi[0], c.assi[1], c.assi[2], s[0], s[1], s[2], c.pos);
        gl.uniformMatrix4fv(progCorpo.u.uModello, false, modello);
        gl.uniformMatrix4fv(progCorpo.u.uMvp, false, mat4Mul(stato.vp, modello));
        gl.uniform3fv(progCorpo.u.uScalaInv2, [1 / (s[0] * s[0]), 1 / (s[1] * s[1]), 1 / (s[2] * s[2])]);
        const haTex = c.texStato === 'pronta';
        gl.uniform1f(progCorpo.u.uHaTex, haTex ? 1 : 0);
        if (haTex) {
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, c.tex);
        }
        // La mesh ha la longitudine -180° sul bordo sinistro: una mappa con L
        // gradi al centro va spostata di L/360.
        gl.uniform1f(progCorpo.u.uLonU, -(c.dati.tex_lon_centro || 0) / 360);
        // Senza una mappa vera il corpo resta grigio neutro, a meno che i dati
        // diano un colore misurato (Urano, Nettuno): non si inventa un colore
        // che nessuno ha visto.
        gl.uniform3fv(progCorpo.u.uColore, c.dati.tipo === 'buco-nero' ? [0, 0, 0] : (c.dati.colore || [0.55, 0.55, 0.55]));
        gl.uniform1f(progCorpo.u.uEmissivo, c.dati.tipo === 'stella' ? 2 : (c.dati.tipo === 'buco-nero' ? 1 : 0));
        gl.uniform3fv(progCorpo.u.uOcchio, stato.occhio);
        gl.uniform1f(progCorpo.u.uAmbiente, stato.confronto ? 0.55 : 0.08);
        gl.drawElements(gl.TRIANGLES, sfera.n, gl.UNSIGNED_SHORT, 0);
      });
      // Gli altri programmi usano solo aPos: l'attributo delle coordinate di
      // texture non deve restare acceso su un buffer che non e' il loro.
      gl.disableVertexAttribArray(progCorpo.a.aUv);
    }

    // Anelli: una corona per anello, costruita una volta nello spazio del
    // corpo (piano equatoriale) con i raggi visivi.
    const corone = new Map();
    function corona(c, r) {
      const k = c.dati.id + ':' + r.nome;
      if (corone.has(k)) return corone.get(k);
      const kR = c.raggioVis / c.dati.raggio_km;
      const ri = r.interno_km * kR;
      const re = r.esterno_km * kR;
      const n = 160;
      if (ri === re) {
        // Anello stretto: una linea al raggio vero, senza larghezza inventata.
        const punti = [];
        for (let j = 0; j <= n; j++) {
          const t = (j / n) * 2 * Math.PI;
          punti.push(ri * Math.cos(t), ri * Math.sin(t), 0);
        }
        const linea = bufferLinea(gl, punti);
        corone.set(k, linea);
        return linea;
      }
      const pos = [];
      const uv = [];
      for (let j = 0; j <= n; j++) {
        const t = (j / n) * 2 * Math.PI;
        pos.push(ri * Math.cos(t), ri * Math.sin(t), 0, re * Math.cos(t), re * Math.sin(t), 0);
        uv.push(0, j / n, 1, j / n);
      }
      const idx = [];
      for (let j = 0; j < n; j++) {
        const a = j * 2;
        idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
      const mesh = meshDa(gl, pos, uv, idx);
      corone.set(k, mesh);
      return mesh;
    }

    function disegnaCorone() {
      gl.useProgram(progAnello.p);
      corpi.forEach((c) => {
        const an = c.dati.anelli;
        if (!an || !an.length || !visibile(c)) return;
        const a = c.assi;
        const k = rv(c) / c.raggioVis;
        const modello = mat4Assi(a[0], a[1], a[2], k, k, k, c.pos);
        gl.uniformMatrix4fv(progAnello.u.uMvp, false, mat4Mul(stato.vp, modello));
        for (const r of an) {
          const mesh = corona(c, r);
          if (mesh.b) {
            gl.useProgram(progLinea.p);
            gl.uniformMatrix4fv(progLinea.u.uMvp, false, mat4Mul(stato.vp, modello));
            gl.uniform4fv(progLinea.u.uColore, [0.8, 0.78, 0.72, r.alfa]);
            gl.bindBuffer(gl.ARRAY_BUFFER, mesh.b);
            gl.enableVertexAttribArray(progLinea.a.aPos);
            gl.vertexAttribPointer(progLinea.a.aPos, 3, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.LINE_STRIP, 0, mesh.n);
            gl.useProgram(progAnello.p);
            gl.uniformMatrix4fv(progAnello.u.uMvp, false, mat4Mul(stato.vp, modello));
            continue;
          }
          gl.bindBuffer(gl.ARRAY_BUFFER, mesh.bPos);
          gl.enableVertexAttribArray(progAnello.a.aPos);
          gl.vertexAttribPointer(progAnello.a.aPos, 3, gl.FLOAT, false, 0, 0);
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.bIdx);
          gl.uniform3fv(progAnello.u.uColore, [0.75, 0.72, 0.66]);
          gl.uniform1f(progAnello.u.uAlfa, r.alfa);
          gl.drawElements(gl.TRIANGLES, mesh.n, gl.UNSIGNED_SHORT, 0);
        }
      });
    }

    const ROSA = [1.0, 0.42, 0.76];

    // La ISS e' minuscola: dietro di lei una scia rosa (l'ultimo quarto di
    // giro), e un punto rosa quando e' troppo piccola per vedere il modello.
    function disegnaScia() {
      corpi.forEach((c) => {
        if (c.dati.tipo !== 'stazione' || !c.orbita || !visibile(c)) return;
        const g = corpi.get(c.dati.genitore);
        if (lung(diff(stato.occhio, g.pos)) > g.raggioVis * 120) return;
        const o = c.dati.orbita;
        const el = elementiKepler(o, stato.jd + (stato.estetico ? c.scartoOrbita : 0));
        const b = basePiano(o.piano);
        const punti = [];
        const PASSI = 48;
        for (let k = 0; k <= PASSI; k++) {
          const M = el.M - (1 - k / PASSI) * (Math.PI / 2);
          let p = posizioneKepler(el.a, el.e, el.i, el.nodo, el.w, M);
          if (b) p = nelPiano(b, p);
          const q = somma(g.pos, glDa(per(p, g.raggioVis / g.dati.raggio_km)));
          punti.push(q[0], q[1], q[2]);
        }
        if (!c.sciaBuf) c.sciaBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, c.sciaBuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(punti), gl.DYNAMIC_DRAW);
        gl.useProgram(progLinea.p);
        gl.enableVertexAttribArray(progLinea.a.aPos);
        gl.vertexAttribPointer(progLinea.a.aPos, 3, gl.FLOAT, false, 0, 0);
        gl.uniformMatrix4fv(progLinea.u.uMvp, false, stato.vp);
        // Tre passate sempre piu' corte: la scia sfuma verso la coda.
        [[0, 0.35], [16, 0.6], [32, 1.0]].forEach(([da, alfa]) => {
          gl.uniform4fv(progLinea.u.uColore, [ROSA[0], ROSA[1], ROSA[2], alfa]);
          gl.drawArrays(gl.LINE_STRIP, da, PASSI + 1 - da);
        });
        const pr = proietta(c.pos);
        if (pr && pixelRaggio(rv(c), pr.w) < 16 && stato.bersaglio !== c.dati.id) {
          gl.uniform1f(progLinea.u.uPunto, Math.min(2, window.devicePixelRatio || 1) * 10);
          gl.uniform4fv(progLinea.u.uColore, [ROSA[0], ROSA[1], ROSA[2], 1]);
          gl.drawArrays(gl.POINTS, PASSI, 1);
        }
      });
    }

    // Scia delle sonde: tutti i punti della traiettoria (piu' quelli fitti dei
    // sorvoli) gia' nella posizione disegnata, calcolati una volta. Si disegna
    // la parte fino al giorno mostrato, piu' l'ultimo tratto fino alla sonda.
    function preparaScia(c) {
      const T = traiettorie[c.dati.id];
      const tempi = [];
      for (let i = 0; i < T.punti.length; i += 4) tempi.push(T.punti[i]);
      for (const sv of T.sorvoli || []) for (let i = 0; i < sv.punti.length; i += 4) tempi.push(sv.punti[i]);
      tempi.sort((a, b) => a - b);
      const unici = tempi.filter((t, k) => k === 0 || t - tempi[k - 1] > 1e-6);
      // Posizione disegnata di un pianeta, o di una luna attorno al suo
      // pianeta (Titano), in un giorno qualsiasi (tempo vero).
      const pianetaIl = (g, jd) => {
        const v = posizioneVera(g, jd);
        const r = lung(v);
        if (g.dati.orbita && g.dati.orbita.tipo === 'luna') {
          const gg = corpi.get(g.dati.genitore);
          return somma(pianetaIl(gg, jd), glDa(per(v, scalaLuna(r, gg.dati.raggio_km, gg.raggioVis) / (r || 1))));
        }
        return glDa(per(v, scalaDistanza(r) / (r || 1)));
      };
      const punti = [];
      for (const t of unici) {
        const q = visivaSonda(c, t, interpola(T.punti, t), pianetaIl);
        punti.push(q[0], q[1], q[2]);
      }
      c.scia = { tempi: unici, punti: new Float32Array(punti), buf: bufferLinea(gl, punti), coda: gl.createBuffer() };
    }

    // Eliopausa, il confine della bolla del Sole: una sfera di puntini alla
    // distanza dove l'ha attraversata Voyager 1. E' un disegno: la bolla vera
    // non e' una sfera ma e' schiacciata davanti e allungata dietro.
    function disegnaEliopausa() {
      if (!stato.eliopausa) return;
      if (!stato.eliopausa.buf) {
        const rnd = casuale(42);
        const R = scalaDistanza(stato.eliopausa.ua);
        const punti = [];
        for (let k = 0; k < 2600; k++) {
          const z = rnd() * 2 - 1;
          const t = rnd() * 2 * Math.PI;
          const q = Math.sqrt(1 - z * z);
          punti.push(R * q * Math.cos(t), R * z, R * q * Math.sin(t));
        }
        stato.eliopausa.buf = bufferLinea(gl, punti);
      }
      gl.useProgram(progLinea.p);
      gl.enableVertexAttribArray(progLinea.a.aPos);
      gl.uniformMatrix4fv(progLinea.u.uMvp, false, stato.vp);
      gl.uniform1f(progLinea.u.uPunto, Math.min(2, window.devicePixelRatio || 1) * 1.6);
      gl.uniform4fv(progLinea.u.uColore, [0.45, 0.7, 1.0, 0.55]);
      gl.bindBuffer(gl.ARRAY_BUFFER, stato.eliopausa.buf.b);
      gl.vertexAttribPointer(progLinea.a.aPos, 3, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.POINTS, 0, stato.eliopausa.buf.n);
    }

    function disegnaSonde() {
      corpi.forEach((c) => {
        if (c.dati.tipo !== 'sonda' || !visibile(c)) return;
        if (!c.scia) preparaScia(c);
        const tempi = c.scia.tempi;
        if (stato.jd <= tempi[0]) return;
        let k = 0;
        let hi = tempi.length - 1;
        while (k < hi) {
          const mid = (k + hi + 1) >> 1;
          if (tempi[mid] <= stato.jd) k = mid; else hi = mid - 1;
        }
        const col = c.dati.colore_scia || [1, 1, 1];
        gl.useProgram(progLinea.p);
        gl.enableVertexAttribArray(progLinea.a.aPos);
        gl.uniformMatrix4fv(progLinea.u.uMvp, false, stato.vp);
        gl.uniform4fv(progLinea.u.uColore, [col[0], col[1], col[2], 0.9]);
        gl.bindBuffer(gl.ARRAY_BUFFER, c.scia.buf.b);
        gl.vertexAttribPointer(progLinea.a.aPos, 3, gl.FLOAT, false, 0, 0);
        if (k > 0) gl.drawArrays(gl.LINE_STRIP, 0, k + 1);
        // Ultimo tratto: dall'ultimo punto della tabella alla sonda.
        const P = c.scia.punti;
        gl.bindBuffer(gl.ARRAY_BUFFER, c.scia.coda);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([P[k * 3], P[k * 3 + 1], P[k * 3 + 2], c.pos[0], c.pos[1], c.pos[2]]), gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(progLinea.a.aPos, 3, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.LINE_STRIP, 0, 2);
        // Puntino luminoso quando il modello e' troppo piccolo per vedersi.
        const pr = proietta(c.pos);
        if (pr && pixelRaggio(rv(c), pr.w) < 10) {
          gl.uniform1f(progLinea.u.uPunto, Math.min(2, window.devicePixelRatio || 1) * 9);
          gl.uniform4fv(progLinea.u.uColore, [col[0], col[1], col[2], 1]);
          gl.drawArrays(gl.POINTS, 1, 1);
        }
      });
    }

    const COLORI_ORBITA = {
      pianeta: [0.55, 0.75, 1.0, 0.45],
      'pianeta-nano': [0.95, 0.75, 0.45, 0.4],
      luna: [0.8, 0.8, 0.8, 0.3],
      asteroide: [0.7, 0.65, 0.6, 0.35],
      'oggetto-kuiper': [0.7, 0.65, 0.6, 0.35],
      cometa: [0.5, 0.95, 0.9, 0.4]
    };

    function disegnaOrbite() {
      if (!stato.filtri.orbite || stato.confronto) return;
      gl.useProgram(progLinea.p);
      gl.enableVertexAttribArray(progLinea.a.aPos);
      corpi.forEach((c) => {
        if (!c.orbita || !visibile(c)) return;
        const evid = stato.evidenzia === c.dati.id;
        // Le orbite delle lune solo quando la camera e' vicina al pianeta.
        if (c.orbita.relativa) {
          const g = corpi.get(c.dati.genitore);
          if (!evid && lung(diff(stato.occhio, g.pos)) > g.raggioVis * 60) return;
        }
        const modello = c.orbita.relativa
          ? mat4Assi([1, 0, 0], [0, 1, 0], [0, 0, 1], 1, 1, 1, corpi.get(c.dati.genitore).pos)
          : mat4Identita();
        gl.uniformMatrix4fv(progLinea.u.uMvp, false, mat4Mul(stato.vp, modello));
        const col = evid ? [1.0, 0.85, 0.2, 1.0] : (COLORI_ORBITA[c.dati.tipo] || [0.7, 0.7, 0.7, 0.3]);
        if (c.dati.tipo === 'stazione') { col[0] = ROSA[0]; col[1] = ROSA[1]; col[2] = ROSA[2]; col[3] = 0.55; }
        gl.uniform4fv(progLinea.u.uColore, col);
        gl.bindBuffer(gl.ARRAY_BUFFER, c.orbita.buf.b);
        gl.vertexAttribPointer(progLinea.a.aPos, 3, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.LINE_STRIP, 0, c.orbita.buf.n);
      });
    }

    function disegnaFasce() {
      if (!stato.filtri.fasce || stato.confronto) return;
      gl.useProgram(progLinea.p);
      gl.enableVertexAttribArray(progLinea.a.aPos);
      gl.uniformMatrix4fv(progLinea.u.uMvp, false, stato.vp);
      gl.uniform1f(progLinea.u.uPunto, Math.min(2, window.devicePixelRatio || 1) * 1.2);
      for (const { buf } of fasce) {
        gl.uniform4fv(progLinea.u.uColore, [0.75, 0.7, 0.62, 0.55]);
        gl.bindBuffer(gl.ARRAY_BUFFER, buf.b);
        gl.vertexAttribPointer(progLinea.a.aPos, 3, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.POINTS, 0, buf.n);
      }
    }

    // Alone del Sole e, in confronto, del buco nero (gas caldo attorno
    // all'orizzonte: e' un disegno e la scheda lo dice).
    function disegnaAlone() {
      corpi.forEach((c) => {
        if (c.dati.tipo === 'stella') alone(c, 2.6, [1.0, 0.62, 0.2], 0.6);
        else if (c.dati.tipo === 'buco-nero') alone(c, 3.2, [1.0, 0.55, 0.15], 0.9);
      });
    }

    function alone(sole, raggio, colore, forza) {
      if (!visibile(sole)) return;
      gl.useProgram(progAlone.p);
      gl.bindBuffer(gl.ARRAY_BUFFER, quadAlone);
      gl.enableVertexAttribArray(progAlone.a.aAngolo);
      gl.vertexAttribPointer(progAlone.a.aAngolo, 2, gl.FLOAT, false, 0, 0);
      const v = stato.vista;
      gl.uniformMatrix4fv(progAlone.u.uVp, false, stato.vp);
      gl.uniform3fv(progAlone.u.uCentro, sole.pos);
      gl.uniform3fv(progAlone.u.uDestra, [v[0], v[4], v[8]]);
      gl.uniform3fv(progAlone.u.uSu, [v[1], v[5], v[9]]);
      gl.uniform1f(progAlone.u.uRaggio, rv(sole) * raggio);
      gl.uniform3fv(progAlone.u.uColore, colore);
      gl.uniform1f(progAlone.u.uForza, forza);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    function disegna() {
      gl.viewport(0, 0, canvas.width, canvas.height);
      // In confronto lo sfondo e' piu' chiaro: il buco nero deve vedersi.
      if (stato.confronto) gl.clearColor(0.11, 0.13, 0.2, 1);
      else gl.clearColor(0.01, 0.015, 0.035, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      gl.disable(gl.BLEND);
      gl.enable(gl.CULL_FACE);
      gl.cullFace(gl.BACK);
      gl.frontFace(gl.CCW);
      disegnaCorpi();
      gl.disable(gl.CULL_FACE);
      disegnaModelli();
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      disegnaCorone();
      disegnaOrbite();
      disegnaScia();
      disegnaSonde();
      disegnaEliopausa();
      disegnaFasce();
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      disegnaAlone();
      gl.depthMask(true);
    }

    // Da dove guardare un corpo appena scelto: dal lato illuminato, un po' di
    // fianco e un po' dall'alto. Per i pianeti con anelli, a 55° dal polo,
    // altrimenti gli anelli possono capitare di taglio e sparire.
    function puntaCamera(c, conAnelli) {
      const sole = corpi.get('sole');
      const versoSole = norm(diff(sole ? sole.pos : [0, 0, 0], c.pos));
      let d;
      if (c.dati.tipo === 'sonda') {
        // Da dietro la sonda, rivolti verso il Sole: la stessa vista da cui
        // Voyager 1 ha fotografato il «pallido puntino azzurro».
        d = norm(somma(per(versoSole, -1), [0, 0.3, 0]));
      } else if (c.dati.tipo === 'stazione') {
        // Da sopra la stazione, dal lato dello spazio e un po' verso il Sole:
        // la Terra resta sotto, lontana dalla camera.
        const g = corpi.get(c.dati.genitore);
        const su = norm(diff(c.pos, g.pos));
        const laterale = norm(diff(versoSole, per(su, punto(versoSole, su))));
        d = norm(somma(per(su, 0.7), per(laterale, 0.7)));
      } else if (conAnelli && c.assi) {
        const P = c.assi[2];
        const perp = norm(diff(versoSole, per(P, punto(versoSole, P))));
        const lato = punto(P, [0, 1, 0]) >= 0 ? 1 : -1;
        d = norm(somma(per(P, lato * Math.cos(55 * RAD)), per(perp, Math.sin(55 * RAD))));
      } else {
        const fianco = norm(vett([0, 1, 0], versoSole));
        d = norm(somma(somma(per(versoSole, 0.85), per(fianco, 0.45)), [0, 0.3, 0]));
      }
      stato.camPitch = Math.max(-1.45, Math.min(1.45, Math.asin(d[1])));
      stato.camYaw = Math.atan2(d[0], d[2]);
    }

    /* ---------------------------------------------- confronto grandezze */

    // Corpi in fila sull'asse x, con i raggi in scala vera fra loro.
    function dispostiConfronto() {
      const ids = stato.confronto;
      const maxR = Math.max(...ids.map((id) => corpi.get(id).dati.raggio_km));
      let x = 0;
      const gap = 0.15;
      ids.forEach((id, k) => {
        const c = corpi.get(id);
        const r = (c.dati.raggio_km / maxR) * 10;
        c.raggioVisConfronto = r;
        if (k > 0) x += r + gap;
        c.pos = [x, 0, 0];
        x += r;
      });
    }

    /* ------------------------------------------------------- ciclo */

    function ridimensiona() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        stato.sporco = true;
      }
      stato.w = canvas.clientWidth || 1;
      stato.h = canvas.clientHeight || 1;
    }

    let fermo = false;
    let rafId = 0;
    function fotogramma(t) {
      rafId = 0;
      if (fermo) return;
      const dt = stato.ultimo ? Math.min(0.1, (t - stato.ultimo) / 1000) : 0;
      stato.ultimo = t;
      ridimensiona();
      // Autopilota del viaggio guidato: la camera gira piano attorno al corpo.
      if (stato.giroLento && dt > 0) {
        stato.camYaw += 0.12 * dt;
        stato.sporco = true;
      }
      if ((stato.estetico || stato.film) && stato.fattoreEstetico && dt > 0) {
        const f = stato.fattoreEstetico * dt;
        corpi.forEach((c) => {
          // Un corpo agganciato alla sua posizione vera (film) non accumula
          // giri: quando si sgancia riparte da dove si trova.
          c.scartoOrbita += c.velOrbita * f * (1 - (c.pesoAncora || 0));
          c.scartoRotazione += c.velRotazione * f;
        });
        stato.sporco = true;
      } else if (!stato.estetico && stato.velocita !== 0 && dt > 0 && !stato.confronto) {
        stato.jd = Math.min(LIMITE_JD[1], Math.max(LIMITE_JD[0], stato.jd + stato.velocita * dt));
        stato.sporco = true;
      }
      if (codaTexture.length) caricaSullaGpu();
      if (stato.sporco || stato.transizione) {
        stato.sporco = false;
        aggiornaPosizioni();
        aggiornaCamera();
        disegna();
        // Il primo disegno e' senza mappe: il prossimo le chiede.
        if (!stato.disegnato) {
          stato.disegnato = true;
          stato.sporco = true;
        }
        if (opz.dopoDisegno) opz.dopoDisegno();
      }
      rafId = requestAnimationFrame(fotogramma);
    }

    // Gli elementi di Standish valgono fra il 1800 e il 2050.
    const LIMITE_JD = [jdDaData(new Date(Date.UTC(1800, 0, 1))), jdDaData(new Date(Date.UTC(2050, 11, 31)))];

    preparaGeometria();
    ridimensiona();
    aggiornaCamera();

    function avvia() {
      fermo = false;
      stato.ultimo = 0;
      if (!rafId) rafId = requestAnimationFrame(fotogramma);
    }

    /* -------------------------------------------------------- API */

    return {
      jdDaData,
      dataDaJd,
      limiti: LIMITE_JD,
      avvia,
      ferma() {
        fermo = true;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = 0;
      },
      get jd() { return stato.jd; },
      setJd(jd) {
        stato.jd = Math.min(LIMITE_JD[1], Math.max(LIMITE_JD[0], jd));
        corpi.forEach((c) => { if (c.dati.orbita && c.dati.orbita.tipo === 'standish') c.orbita = costruisciOrbita(c); });
        stato.sporco = true;
      },
      get velocita() { return stato.velocita; },
      setVelocita(v) { stato.velocita = v; stato.sporco = true; },
      get bersaglio() { return stato.bersaglio; },
      get larghezza() { return stato.w; },
      get altezza() { return stato.h; },
      // Vola verso un corpo.
      // distanzaVoluta: per il film di Voyager, che sceglie da quanto lontano guardare.
      seleziona(id, istantaneo, distanzaVoluta) {
        const c = corpi.get(id);
        if (!c) return;
        const daYaw = stato.camYaw;
        const daPitch = stato.camPitch;
        const r = rv(c);
        let dist;
        if (id === 'sole' && !stato.confronto) dist = stato.distSistema || 80;
        else if (c.dati.tipo === 'pianeta' || c.dati.tipo === 'pianeta-nano') dist = r * 5;
        else dist = Math.max(r * 5, 0.05);
        // Gli anelli ben visibili devono stare tutti nell'inquadratura; quelli
        // quasi trasparenti (l'anello E di Saturno, gli aloni di Giove) no.
        const visibili = (c.dati.anelli || []).filter((a) => a.alfa >= 0.3);
        if (visibili.length) {
          const kR = r / c.dati.raggio_km;
          dist = Math.max(dist, Math.max(...visibili.map((a) => a.esterno_km)) * kR * 3.2);
        }
        if (stato.confronto) dist = Math.max(r * 4, 3);
        // Schermo verticale (telefono): il campo orizzontale e' piu' stretto,
        // ci si allontana perche' il corpo e i suoi anelli entrino in larghezza.
        if (stato.h > stato.w) dist *= Math.min(2.2, stato.h / stato.w);
        if (distanzaVoluta) dist = distanzaVoluta;
        if (!stato.confronto && id !== 'sole') puntaCamera(c, visibili.length > 0);
        if (!istantaneo) {
          stato.transizione = { inizio: performance.now(), durata: 1400, daCentro: stato.centro || puntoBersaglio(), daDist: stato.camDist, daYaw, daPitch };
        }
        stato.bersaglio = id;
        stato.camDist = dist;
        stato.sporco = true;
      },
      vistaSistema(istantaneo, distanza) {
        if (!istantaneo) {
          stato.transizione = { inizio: performance.now(), durata: 1400, daCentro: stato.centro || puntoBersaglio(), daDist: stato.camDist };
        }
        stato.bersaglio = 'sole';
        stato.camDist = distanza || stato.distSistema || 80;
        stato.camPitch = 0.55;
        stato.sporco = true;
      },
      ruota(dYaw, dPitch) {
        stato.camYaw += dYaw;
        stato.camPitch = Math.max(-1.45, Math.min(1.45, stato.camPitch + dPitch));
        stato.sporco = true;
      },
      zoom(fattore) {
        const c = corpi.get(stato.bersaglio);
        const min = c ? rv(c) * 1.6 : 1;
        stato.camDist = Math.max(min, Math.min(stato.confronto ? 200 : 600, stato.camDist * fattore));
        stato.sporco = true;
      },
      setDistanzaSistema(d) { stato.distSistema = d; },
      setFiltri(f) { Object.assign(stato.filtri, f); stato.sporco = true; },
      get filtri() { return Object.assign({}, stato.filtri); },
      evidenziaOrbita(id) { stato.evidenzia = id; stato.sporco = true; },
      confronta(ids) {
        stato.confronto = ids && ids.length ? ids.slice() : null;
        if (stato.confronto) {
          dispostiConfronto();
          // Inquadra tutta la fila: dal bordo sinistro del primo al bordo
          // destro dell'ultimo, con un margine.
          const primo = corpi.get(ids[0]);
          const ultimo = corpi.get(ids[ids.length - 1]);
          const sx = -primo.raggioVisConfronto;
          const dx = ultimo.pos[0] + ultimo.raggioVisConfronto;
          const tanMezzo = Math.tan(22.5 * RAD);
          stato.bersaglio = '__confronto';
          stato.centroConfronto = [(sx + dx) / 2, 0, 0];
          stato.camDist = Math.max((dx - sx) / 2 / (tanMezzo * (stato.w / stato.h)) * 1.15, 10 / tanMezzo * 1.2);
          stato.camYaw = 0;
          stato.camPitch = 0.15;
        } else {
          corpi.forEach((c) => { delete c.raggioVisConfronto; });
          stato.bersaglio = 'sole';
          stato.camDist = stato.distSistema || 80;
          stato.camPitch = 0.55;
        }
        stato.transizione = null;
        stato.sporco = true;
      },
      // Per le etichette: posizione sullo schermo (px CSS) e raggio apparente.
      schermo(id) {
        const c = corpi.get(id);
        if (!c || !visibile(c) || nascostoDalPrimoPiano(c)) return null;
        // Una luna o la ISS dietro il suo pianeta non ha etichetta.
        const g = c.dati.genitore && c.dati.genitore !== 'sole' ? corpi.get(c.dati.genitore) : null;
        if (g && !nascostoDalPrimoPiano(g) && copertoDa(g, c.pos)) return null;
        // ...e cosi' un corpo dietro il Sole o dietro il corpo che si sta guardando.
        const sole = corpi.get('sole');
        if (c !== sole && sole && visibile(sole) && copertoDa(sole, c.pos)) return null;
        const b = corpi.get(stato.bersaglio);
        if (b && b !== c && b !== g && visibile(b) && !nascostoDalPrimoPiano(b) && copertoDa(b, c.pos)) return null;
        const pr = proietta(c.pos);
        if (!pr) return null;
        const r = rv(c);
        return { x: pr.x, y: pr.y, r: pixelRaggio(r, pr.w), dist: lung(diff(stato.occhio, c.pos)) };
      },
      // Il corpo piu' vicino a un punto dello schermo (tocco o clic).
      scegli(x, y) {
        let migliore = null;
        let dMin = Infinity;
        corpi.forEach((c, id) => {
          if (!visibile(c)) return;
          const s = this.schermo(id);
          if (!s) return;
          const d = Math.hypot(s.x - x, s.y - y);
          const soglia = Math.max(18, s.r + 6);
          if (d <= soglia && (d - s.r) < dMin) {
            dMin = d - s.r;
            migliore = id;
          }
        });
        return migliore;
      },
      distanzaCamera() {
        return lung(diff(stato.occhio, stato.centro || [0, 0, 0]));
      },
      // Posizione vera nel giorno mostrato, senza il movimento estetico: serve
      // per le distanze vere scritte nelle schede.
      posizioneVeraUA(id) {
        const c = corpi.get(id);
        return c ? posizioneVera(c, stato.jd) : null;
      },
      get estetico() { return stato.estetico; },
      setEstetico(si) {
        stato.estetico = !!si;
        corpi.forEach((c) => { c.scartoOrbita = 0; c.scartoRotazione = 0; });
        stato.sporco = true;
      },
      // Film delle Voyager: i corpi girano col movimento estetico a partire dal
      // giorno base, la data del film muove le sonde (null per uscire).
      setFilm(base) {
        stato.film = base === null || base === undefined ? null : { base };
        corpi.forEach((c) => { c.scartoOrbita = 0; c.scartoRotazione = 0; c.giriAncora = null; });
        stato.sporco = true;
      },
      setFattoreEstetico(f) { stato.fattoreEstetico = f; stato.sporco = true; },
      // Riporta tutti i corpi alla posizione vera del giorno mostrato.
      azzeraEstetico() {
        corpi.forEach((c) => { c.scartoOrbita = 0; c.scartoRotazione = 0; });
        stato.sporco = true;
      },
      ridisegna() { stato.sporco = true; },
      giroLento(si) { stato.giroLento = !!si; stato.sporco = true; },
      // Le traiettorie delle sonde arrivano dopo, solo quando servono.
      aggiungiTraiettorie(t) {
        Object.assign(traiettorie, t);
        preparaAncore();
        corpi.forEach((c) => { if (c.dati.tipo === 'sonda') c.scia = null; });
        stato.sporco = true;
      },
      haTraiettoria(id) { return !!traiettorie[id]; },
      // ua: distanza dal Sole del confine (null per toglierlo).
      setEliopausa(ua) { stato.eliopausa = ua ? { ua } : null; stato.sporco = true; },
      // Primo e ultimo giorno della traiettoria di una sonda.
      intervallo(id) {
        const T = traiettorie[id];
        if (!T) return null;
        return [T.punti[0], T.punti[T.punti.length - 4]];
      },
      perdita(cb) {
        canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); cb(); });
      }
    };
  }

  SA.SistemaMotore = {
    crea,
    // Esposti per i controlli automatici (scripts/check_sistema_solare.js).
    calcolo: { risolviKepler, posizioneKepler, elementiStandish, elementiKepler, jdDaData, scalaDistanza, scalaRaggio, scalaLuna, baseDaPolo, eclDaEq }
  };
})();
