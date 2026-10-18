(function () {
  'use strict';

  /*
    Il Sistema Solare in 3D — interfaccia.

    Il disegno sta in js/sistema-solare-motore.js, i dati in
    js/sistema-solare-dati.js (generato da scripts/build_sistema_solare.py a
    partire da docs/sistema-solare/*.json, dove ogni numero ha la sua fonte).

    Regole di questo file:
    - Nessun numero scritto qui: ogni valore mostrato viene dai dati o e' un
      calcolo esplicito su di essi (rapporti con la Terra, peso sulla bilancia,
      tempo della luce, Sole grande come un pallone).
    - La scena e' un di piu': tutto quello che si impara sta anche nelle schede,
      raggiungibili da tastiera e lette dallo screen reader. Le etichette sulla
      scena sono solo per il puntatore (aria-hidden), il percorso accessibile e'
      la barra di navigazione.
    - Il DOM si costruisce con createElement/textContent: la CSP del sito impone
      Trusted Types, e assegnare HTML come stringa verrebbe rifiutato.
  */

  const SA = window.SA = window.SA || {};
  const DATI = SA.sistemaSolareDati;
  if (!DATI) return;

  const UA_KM = 149597870.7;           // unita' astronomica, valore esatto IAU 2012
  const LUCE_KMS = 299792.458;         // velocita' della luce, valore esatto
  const G_TERRA = 9.80665;             // gravita' standard (CGPM 1901)
  const PALLONE_M = 0.22;              // diametro di un pallone da calcio taglia 5, circa

  const corpi = new Map(DATI.corpi.map((c) => [c.id, c]));
  const sciami = new Map((DATI.sciami || []).map((s) => [s.id, s]));
  const schede = new Map((DATI.schede || []).map((s) => [s.id, s]));
  const TERRA = corpi.get('terra');
  const SOLE = corpi.get('sole');

  const $ = (id) => document.getElementById(id);
  const fmt = (n, cifre) => new Intl.NumberFormat('it-IT', { maximumFractionDigits: cifre === undefined ? 0 : cifre }).format(n);
  const fmtSig = (n, sig) => new Intl.NumberFormat('it-IT', { maximumSignificantDigits: sig || 3 }).format(n);
  const fmtData = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

  function el(tag, attr, figli) {
    const e = document.createElement(tag);
    if (attr) {
      for (const k of Object.keys(attr)) {
        const v = attr[k];
        if (v === undefined || v === null || v === false) continue;
        if (k === 'testo') e.textContent = v;
        else if (k === 'classe') e.className = v;
        else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
        else e.setAttribute(k, v === true ? '' : v);
      }
    }
    (figli || []).forEach((f) => { if (f) e.append(f); });
    return e;
  }

  function annuncia(testo) {
    const s = $('ssStato');
    s.textContent = '';
    window.setTimeout(() => { s.textContent = testo; }, 30);
  }

  function movimentoRidotto() {
    return !!(SA.motion && SA.motion.isReduced());
  }

  /* ------------------------------------------------------- etichette */

  const NOMI_TIPO = {
    stella: 'Stella',
    pianeta: 'Pianeta',
    'pianeta-nano': 'Pianeta nano',
    luna: 'Luna',
    asteroide: 'Asteroide',
    cometa: 'Cometa',
    'oggetto-kuiper': 'Oggetto della fascia di Kuiper',
    'buco-nero': 'Buco nero',
    stazione: 'Stazione spaziale',
    sonda: 'Sonda spaziale'
  };

  // In che ordine si viaggia con Precedente / Successivo: dal Sole verso
  // l'esterno, con i pianeti nani al loro posto.
  const ORDINE_VIAGGIO = DATI.corpi
    .filter((c) => c.tipo === 'stella' || c.tipo === 'pianeta' || c.tipo === 'pianeta-nano')
    .sort((a, b) => (a.distanza_ua || 0) - (b.distanza_ua || 0))
    .map((c) => c.id);

  /* ----------------------------------------------------- navigazione */

  // Miniatura tonda di un corpo, ritagliata dalla sua mappa vera
  // (assets/sistema-solare/mini/). Senza mappa: il colore misurato, o grigio.
  function mini(c, grande) {
    const m = el('span', { classe: 'ss-mini' + (grande ? ' ss-mini-grande' : ''), 'aria-hidden': 'true' });
    impostaMini(m, c);
    return m;
  }

  function impostaMini(m, c) {
    m.className = m.className.replace(/ ?ss-mini-(sole|buco|grigio)/g, '');
    m.style.backgroundImage = '';
    m.style.backgroundColor = '';
    if (!c) return;
    if (c.tipo === 'stella') m.classList.add('ss-mini-sole');
    else if (c.tex) m.style.backgroundImage = 'url("/assets/sistema-solare/mini/' + c.tex + '")';
    else if (c.colore) m.style.backgroundColor = 'rgb(' + c.colore.map((x) => Math.round(x * 255)).join(',') + ')';
    else m.classList.add('ss-mini-grigio');
  }

  function bottoneVoce(chiave, testo, extra) {
    const [tipo, id] = chiave.split(':');
    const b = el('button', Object.assign({ type: 'button', classe: 'ss-btn ss-voce', 'data-voce': chiave, 'aria-pressed': 'false' }, extra || {}));
    if (tipo === 'c' && corpi.get(id)) b.append(mini(corpi.get(id)));
    else b.append(el('span', { classe: 'ss-mini-icona', 'aria-hidden': 'true', testo: tipo === 's' ? '🌠' : (id === 'buco-nero' ? '🕳️' : '✨') }));
    b.append(el('span', { testo }));
    return b;
  }

  function costruisciNavigazione() {
    // La riga dei pianeti e' un piccolo «poster»: dal Sole al piu' lontano, ognuno
    // grande come la radice del suo raggio vero (Giove 56 px, Mercurio 20). Non e'
    // in scala vera, e lo dice; l'ordine delle grandezze invece si'. Il Sole e'
    // uno spicchio che entra dal bordo: troppo grande per starci intero.
    const riga = $('ssNavPianeti');
    const rMax = Math.max(...DATI.corpi.filter((c) => c.tipo === 'pianeta').map((c) => c.raggio_km));
    DATI.corpi.filter((c) => c.tipo === 'stella' || c.tipo === 'pianeta').forEach((c) => {
      const b = el('button', { type: 'button', classe: 'ss-pianetino' + (c.tipo === 'stella' ? ' ss-pianetino-sole' : ''), 'data-voce': 'c:' + c.id, 'aria-pressed': 'false' });
      const m = mini(c);
      if (c.tipo !== 'stella') {
        const px = Math.round(12 + 44 * Math.sqrt(c.raggio_km / rMax));
        m.style.width = px + 'px';
        m.style.height = px + 'px';
      }
      b.append(el('span', { classe: 'ss-pianetino-posto' }, [m]), el('span', { classe: 'ss-pianetino-nome', testo: c.nome }));
      riga.append(b);
    });

    const gruppi = $('ssNavGruppi');
    function gruppo(titolo, contenuto) {
      if (!contenuto.length) return;
      gruppi.append(el('details', { classe: 'ss-gruppo' }, [
        el('summary', { testo: titolo }),
        el('div', { classe: 'ss-gruppo-corpo' }, contenuto)
      ]));
    }
    const perTipo = (t) => DATI.corpi.filter((c) => c.tipo === t && !c.solo_confronto);

    gruppo('Pianeti nani', perTipo('pianeta-nano').map((c) => bottoneVoce('c:' + c.id, c.nome)));

    // Lune raggruppate per pianeta, nell'ordine dei pianeti.
    const lune = [];
    DATI.corpi.filter((g) => DATI.corpi.some((c) => c.tipo === 'luna' && c.genitore === g.id)).forEach((g) => {
      const sue = DATI.corpi.filter((c) => c.tipo === 'luna' && c.genitore === g.id);
      lune.push(el('div', { classe: 'ss-sottogruppo', role: 'group', 'aria-label': 'Lune ' + di(g) }, [
        el('span', { classe: 'ss-sottotitolo', testo: g.nome, 'aria-hidden': 'true' })
      ].concat(sue.map((c) => bottoneVoce('c:' + c.id, c.nome)))));
    });
    gruppo('Lune', lune);

    gruppo('Stazioni spaziali', perTipo('stazione').map((c) => bottoneVoce('c:' + c.id, c.nome)));
    const sonde = perTipo('sonda').map((c) => bottoneVoce('c:' + c.id, c.nome));
    if (sonde.length && DATI.film) sonde.unshift(el('button', { type: 'button', classe: 'ss-btn ss-c-verde ss-film-btn', 'data-ss': 'film', testo: '🎬 Guarda il viaggio delle Voyager' }));
    gruppo('Sonde Voyager', sonde);
    gruppo('Asteroidi', perTipo('asteroide').map((c) => bottoneVoce('c:' + c.id, c.nome)));
    gruppo('Comete', perTipo('cometa').map((c) => bottoneVoce('c:' + c.id, c.nome)));

    const lontani = perTipo('oggetto-kuiper').map((c) => bottoneVoce('c:' + c.id, c.nome));
    ['fascia-asteroidi', 'fascia-kuiper', 'nube-oort'].forEach((id) => {
      if (schede.has(id)) lontani.push(bottoneVoce('k:' + id, schede.get(id).titolo));
    });
    gruppo('Fasce e oggetti lontani', lontani);

    const stelle = [];
    if (schede.has('meteora-meteoroide-meteorite')) stelle.push(bottoneVoce('k:meteora-meteoroide-meteorite', schede.get('meteora-meteoroide-meteorite').titolo));
    sciami.forEach((s) => stelle.push(bottoneVoce('s:' + s.id, s.nome)));
    gruppo('Stelle cadenti', stelle);

    const buchi = [];
    if (schede.has('buco-nero')) buchi.push(bottoneVoce('k:buco-nero', schede.get('buco-nero').titolo));
    gruppo('Buchi neri', buchi);

    // Pianeti nella barra in basso e gruppi nel pannello Esplora.
    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-voce]');
      if (!b) return;
      apri(b.dataset.voce, { daNav: true });
      if (b.closest('.ss-cassetto')) chiudiCassetto();
    });
  }

  function segnaVoce(chiave) {
    document.querySelectorAll('[data-voce]').forEach((b) => {
      b.setAttribute('aria-pressed', b.dataset.voce === chiave ? 'true' : 'false');
    });
  }

  /* ------------------------------------------------------- calcoli */

  function distanzaKm(km) {
    if (km >= 1e9) return fmt(km / 1e9, 2) + ' miliardi di km';
    if (km >= 1e6) return fmt(km / 1e6, 1) + ' milioni di km';
    return fmt(km) + ' km';
  }

  /* ------------------------------------------------------- scheda */

  let motore = null;
  let corrente = null;
  let pesoTerra = 30;

  function riquadro(titolo, valore, nota) {
    return el('div', { classe: 'ss-dato' }, [
      el('dt', { testo: titolo }),
      el('dd', {}, [
        el('span', { classe: 'ss-dato-valore', testo: valore }),
        nota ? el('span', { classe: 'ss-dato-nota', testo: nota }) : null
      ])
    ]);
  }

  function listaFonti(fonti) {
    if (!fonti || !fonti.length) return null;
    return el('details', { classe: 'ss-fonti' }, [
      el('summary', { testo: 'Da dove vengono questi dati' }),
      el('ul', {}, fonti.map((u) => el('li', {}, [el('a', { href: u, rel: 'noopener noreferrer', target: '_blank', testo: u.replace(/^https?:\/\//, '') })])))
    ]);
  }

  // Audio: se esiste il file registrato (assets/sistema-solare/audio/<id>.mp3,
  // elencato in DATI.audio solo se il testo non e' cambiato da quando e' stato
  // registrato) si usa quello; altrimenti la voce del browser.
  //
  // Un solo ascolto alla volta, con tre stati che tutti i pulsanti «Ascolta»
  // mostrano (data-ascolta="tipo:id"): fermo -> «🔈 Ascolta», in corso ->
  // «⏸ Pausa», in pausa -> «▶ Riprendi».
  const ascolto = { chiave: null, stato: 'fermo', audio: null, fine: null };

  function aggiornaPulsantiAscolto() {
    document.querySelectorAll('[data-ascolta]').forEach((b) => {
      const mio = b.dataset.ascolta === ascolto.chiave;
      const st = mio ? ascolto.stato : 'fermo';
      const [icona, parola] = (st === 'in-corso' ? '⏸ Pausa' : (st === 'pausa' ? '▶ Riprendi' : '🔈 Ascolta')).split(' ');
      b.replaceChildren(document.createTextNode(icona + ' '), el('span', { classe: 'ss-btn-testo', testo: parola }));
      b.setAttribute('aria-pressed', st === 'in-corso' ? 'true' : 'false');
      b.setAttribute('aria-label', st === 'in-corso' ? 'Metti in pausa la lettura' : (st === 'pausa' ? 'Riprendi la lettura' : 'Ascolta la scheda'));
    });
  }

  function finito() {
    const cb = ascolto.fine;
    ascolto.chiave = null;
    ascolto.stato = 'fermo';
    ascolto.audio = null;
    ascolto.fine = null;
    aggiornaPulsantiAscolto();
    if (cb) cb();
  }

  function fermaAudio() {
    ascolto.fine = null;
    if (ascolto.audio) ascolto.audio.pause();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    ascolto.chiave = null;
    ascolto.stato = 'fermo';
    ascolto.audio = null;
    aggiornaPulsantiAscolto();
  }

  // Legge tipo:id dall'inizio. fine() viene chiamata quando la lettura finisce
  // da sola (serve al viaggio guidato), non quando la si ferma.
  function parla(id, testo, fine, tipo) {
    fermaAudio();
    ascolto.chiave = (tipo || 'c') + ':' + id;
    ascolto.stato = 'in-corso';
    ascolto.fine = fine || null;
    aggiornaPulsantiAscolto();
    const file = DATI.audio && DATI.audio[id];
    if (file) {
      const au = new window.Audio('/assets/sistema-solare/audio/' + file);
      ascolto.audio = au;
      au.onended = () => { if (ascolto.audio === au) finito(); };
      au.onerror = () => { if (ascolto.audio === au) { ascolto.audio = null; parlaBrowser(testo); } };
      au.play().catch(() => { if (ascolto.audio === au) { ascolto.audio = null; parlaBrowser(testo); } });
      return;
    }
    parlaBrowser(testo);
  }

  function parlaBrowser(testo) {
    if (!('speechSynthesis' in window) || !window.SpeechSynthesisUtterance) {
      finito();
      return;
    }
    window.speechSynthesis.cancel();
    const u = new window.SpeechSynthesisUtterance(testo);
    u.lang = 'it-IT';
    u.rate = 0.95;
    const chiave = ascolto.chiave;
    u.onend = () => { if (ascolto.chiave === chiave && ascolto.stato !== 'fermo') finito(); };
    u.onerror = u.onend;
    window.speechSynthesis.speak(u);
  }

  function pausaAscolto() {
    if (ascolto.stato !== 'in-corso') return;
    if (ascolto.audio) ascolto.audio.pause();
    else if ('speechSynthesis' in window) window.speechSynthesis.pause();
    ascolto.stato = 'pausa';
    aggiornaPulsantiAscolto();
  }

  function riprendiAscolto() {
    if (ascolto.stato !== 'pausa') return;
    if (ascolto.audio) ascolto.audio.play().catch(() => {});
    else if ('speechSynthesis' in window) window.speechSynthesis.resume();
    ascolto.stato = 'in-corso';
    aggiornaPulsantiAscolto();
  }

  // Un clic su «Ascolta»: parte, mette in pausa o riprende.
  function premiAscolta(tipo, id) {
    const chiave = tipo + ':' + id;
    if (ascolto.chiave === chiave && ascolto.stato === 'in-corso') pausaAscolto();
    else if (ascolto.chiave === chiave && ascolto.stato === 'pausa') riprendiAscolto();
    else parla(id, testoParlato(tipo, id), null, tipo);
  }

  // Il testo letto per un corpo, uno sciame o una scheda. Lo stesso testo va
  // nel file per ElevenLabs (scripts/testi_audio_sistema_solare.py).
  function testoParlato(tipo, id) {
    if (tipo === 'f') {
      const ch = DATI.film && DATI.film.capitoli.find((x) => 'film-' + x.id === id);
      return ch ? ch.titolo + '. ' + ch.testo : '';
    }
    if (tipo === 'c') {
      const c = corpi.get(id);
      return [c.nome + '.', c.scheda.descrizione].concat(c.scheda.curiosita || []).join(' ');
    }
    if (tipo === 's') {
      const x = sciami.get(id);
      return x.nome + '. ' + x.descrizione;
    }
    const k = schede.get(id);
    return k.titolo + '. ' + k.testo;
  }

  function bottoneAscolta(tipo, id) {
    if (!('speechSynthesis' in window) && !(DATI.audio && DATI.audio[id])) return null;
    const b = el('button', {
      type: 'button',
      classe: 'ss-btn ss-ascolta',
      'data-ascolta': tipo + ':' + id,
      testo: '🔈 Ascolta',
      onclick: () => premiAscolta(tipo, id)
    });
    // La scheda si ricostruisce: il pulsante nuovo nasce gia' nello stato giusto.
    window.setTimeout(aggiornaPulsantiAscolto, 0);
    return b;
  }


  // "del Sole", "della Terra", "di Giove": i tre nomi che vogliono l'articolo.
  const DEL = { sole: 'del Sole', terra: 'della Terra', luna: 'della Luna' };
  const AL = { sole: 'al Sole', terra: 'alla Terra', luna: 'alla Luna' };
  const di = (c) => DEL[c.id] || 'di ' + c.nome;
  const a = (c) => AL[c.id] || 'a ' + c.nome;

  // Durate dette come le direbbe un bambino: "24 ore e 37 minuti",
  // "6 giorni e 9 ore", "1 anno e 11 mesi", "circa 165 anni".
  function durataUmana(ore) {
    const h = Math.abs(ore);
    if (h < 1) return fmt(h * 60) + ' minuti';
    if (h < 48) {
      const intere = Math.floor(h);
      const min = Math.round((h - intere) * 60);
      if (min === 60) return (intere + 1) + ' ore';
      return intere + (intere === 1 ? ' ora' : ' ore') + (min ? ' e ' + min + ' minuti' : '');
    }
    const giorni = h / 24;
    if (giorni < 400) {
      const g = Math.floor(giorni);
      const resto = Math.round((giorni - g) * 24);
      if (g >= 30 || !resto) return fmt(Math.round(giorni)) + ' giorni';
      return g + (g === 1 ? ' giorno' : ' giorni') + ' e ' + resto + (resto === 1 ? ' ora' : ' ore');
    }
    const anni = giorni / 365.25;
    if (anni >= 10) return 'circa ' + fmt(Math.round(anni)) + ' anni';
    let a1 = Math.floor(anni);
    let mesi = Math.round((giorni - a1 * 365.25) / 30.4375);
    if (mesi === 12) { a1 += 1; mesi = 0; }
    return 'circa ' + a1 + (a1 === 1 ? ' anno' : ' anni') + (mesi ? ' e ' + mesi + (mesi === 1 ? ' mese' : ' mesi') : '');
  }

  // Il tempo che la luce impiega a fare una distanza, detto per bambini.
  function tempoLuce(km) {
    const s = km / LUCE_KMS;
    if (s < 90) return fmt(s) + ' secondi';
    const min = s / 60;
    if (min < 120) {
      const m = Math.floor(min);
      const sec = Math.round((min - m) * 60);
      return m + ' minuti' + (sec ? ' e ' + sec + ' secondi' : '');
    }
    const ore = min / 60;
    return 'circa ' + fmt(ore, 1) + ' ore';
  }

  function temperaturaLeggibile(t) {
    if (!t) return null;
    const media = t.media !== null && t.media !== undefined ? t.media : null;
    const min = t.min !== null && t.min !== undefined ? t.min : null;
    const max = t.max !== null && t.max !== undefined ? t.max : null;
    if (media === null && min === null && max === null) return null;
    const riferimento = media !== null ? media : (max !== null ? max : min);
    let commento = '';
    // Solo confronti con l'acqua, che ogni bambino conosce: 0 °C ghiaccia,
    // 100 °C bolle (al livello del mare).
    if (riferimento >= 100) commento = 'Più caldo dell\'acqua che bolle!';
    else if (riferimento < 0) commento = riferimento <= -100 ? 'Freddissimo: molto sotto zero.' : 'Sotto zero.';
    let valore;
    if (min !== null && max !== null) valore = 'Da ' + fmt(min) + ' °C a ' + fmt(max) + ' °C';
    else valore = 'Circa ' + fmt(riferimento) + ' °C';
    return { valore, commento: (media !== null && min !== null && max !== null ? 'In media circa ' + fmt(media) + ' °C. ' : '') + commento };
  }

  // "Tu su Marte": quanto segnerebbe la bilancia e quanti anni avresti.
  let etaTerra = 10;

  function tuSu(c) {
    const s = c.scheda;
    const g = s.gravita_superficie_ms2;
    const anno = c.genitore === 'sole' ? s.periodo_orbitale_giorni : null;
    if ((!g || c.id === 'terra') && !anno) return null;
    const ris = el('ul', { classe: 'ss-tu-risultati', 'aria-live': 'polite' });
    const peso = el('input', { type: 'number', min: '1', max: '200', step: '1', value: String(pesoTerra), inputmode: 'numeric', id: 'ssPeso' });
    const eta = el('input', { type: 'number', min: '1', max: '120', step: '1', value: String(etaTerra), inputmode: 'numeric', id: 'ssEta' });
    function calcola() {
      pesoTerra = Math.max(1, Math.min(200, Number(peso.value) || 1));
      etaTerra = Math.max(1, Math.min(120, Number(eta.value) || 1));
      const righe = [];
      if (g && c.id !== 'terra') {
        const kg = pesoTerra * g / G_TERRA;
        righe.push('⚖️ La bilancia segnerebbe ' + fmt(kg, kg < 10 ? 1 : 0) + ' kg');
      }
      if (anno && c.id !== 'terra') {
        const anni = etaTerra * 365.25 / anno;
        righe.push('🎂 Avresti ' + (anni < 1 ? 'meno di 1 anno (' + fmt(anni, 2) + ')' : fmt(anni, anni < 10 ? 1 : 0) + ' anni'));
      }
      ris.replaceChildren(...righe.map((t) => el('li', { testo: t })));
      if (!$('ssCartellino').hidden) mostraFatti(c);
    }
    peso.addEventListener('input', calcola);
    eta.addEventListener('input', calcola);
    calcola();
    const nota = [];
    if (g && c.id !== 'terra') {
      nota.push(c.tipo === 'stella'
        ? 'Il Sole è una palla di gas caldissimo, senza un suolo: il conto usa la gravità della sua superficie visibile.'
        : (c.scheda.superficie_solida === false
          ? c.nome + ' non ha un suolo dove stare in piedi: il conto usa la gravità all\'altezza delle nuvole.'
          : 'Tu resti uguale: cambia quanto ' + c.nome + ' ti tira verso il basso.'));
    }
    if (anno && c.id !== 'terra') nota.push('Un compleanno ogni anno ' + di(c) + ', cioè ogni ' + durataUmana(anno * 24) + ' della Terra.');
    return el('div', { classe: 'ss-tu' }, [
      el('h3', { testo: '🧑‍🚀 Tu ' + (c.tipo === 'stella' ? 'sul Sole' : 'su ' + c.nome) }),
      el('div', { classe: 'ss-tu-campi' }, [
        g && c.id !== 'terra' ? el('label', { for: 'ssPeso' }, [document.createTextNode('Sulla Terra peso'), peso, document.createTextNode('kg')]) : null,
        anno && c.id !== 'terra' ? el('label', { for: 'ssEta' }, [document.createTextNode('e ho'), eta, document.createTextNode('anni')]) : null
      ]),
      ris,
      el('p', { classe: 'ss-nota', testo: nota.join(' ') })
    ]);
  }

  function inclinazioneLeggibile(gradi) {
    if (gradi === null || gradi === undefined || gradi < 60) return null;
    if (gradi <= 120) return { valore: 'Gira sdraiato su un fianco', nota: 'Il suo asse è inclinato di ' + fmt(gradi) + '°: quello della Terra di ' + fmt(TERRA.scheda.inclinazione_asse_gradi) + '°.' };
    return { valore: 'È quasi capovolto', nota: 'Il suo asse è inclinato di ' + fmt(gradi) + '°, e per questo gira al contrario della Terra.' };
  }

  // Tutti i numeri tecnici, per insegnanti e curiosi: nella scheda per i
  // bambini restano solo quelli che si capiscono.
  function datiPerGrandi(c) {
    const s = c.scheda;
    const righe = [];
    const r = (k, v) => { if (v !== null && v !== undefined && v !== '') righe.push([k, v]); };
    r('Diametro medio', s.raggio_medio_km ? fmt(s.raggio_medio_km * 2, s.raggio_medio_km < 5 ? 3 : 0) + ' km' : null);
    r('Misure (tre assi)', s.assi_km ? s.assi_km.map((v) => fmt(v, v < 10 ? 3 : 0)).join(' × ') + ' km' : null);
    r('Massa', s.massa_kg ? s.massa_kg.toExponential(3).replace('e+', ' × 10^').replace('.', ',') + ' kg' + (s.massa_rispetto_terra && s.massa_rispetto_terra !== 1 ? ' (' + fmtSig(s.massa_rispetto_terra, 3) + ' volte la Terra)' : '') : null);
    r('Densità media', s.densita_gcm3 ? fmt(s.densita_gcm3, 3) + ' g/cm³' : null);
    r('Gravità in superficie', s.gravita_superficie_ms2 ? fmt(s.gravita_superficie_ms2, 2) + ' m/s²' : null);
    r('Velocità di fuga', s.velocita_fuga_kms ? fmt(s.velocita_fuga_kms, 2) + ' km/s' : null);
    r('Rotazione siderale', s.rotazione_siderale_ore ? fmt(s.rotazione_siderale_ore, 3) + ' ore' + (s.rotazione_siderale_ore < 0 ? ' (retrograda)' : '') : null);
    r('Giorno solare', s.giorno_solare_ore ? fmt(s.giorno_solare_ore, 2) + ' ore' : null);
    r('Inclinazione dell\'asse', s.inclinazione_asse_gradi !== null && s.inclinazione_asse_gradi !== undefined ? fmt(s.inclinazione_asse_gradi, 2) + '°' : null);
    r('Periodo orbitale', s.periodo_orbitale_giorni ? fmt(s.periodo_orbitale_giorni, 3) + ' giorni' : null);
    if (s.distanza_media) r('Semiasse maggiore', s.distanza_media.unita === 'UA' ? fmt(s.distanza_media.valore, 4) + ' UA (' + distanzaKm(s.distanza_media.valore * UA_KM) + ')' : fmt(s.distanza_media.valore) + ' km');
    r('Eccentricità', s.eccentricita !== null && s.eccentricita !== undefined ? fmt(s.eccentricita, 4) : null);
    r('Inclinazione dell\'orbita', s.inclinazione_orbita_gradi !== null && s.inclinazione_orbita_gradi !== undefined ? fmt(s.inclinazione_orbita_gradi, 2) + '°' : null);
    if (s.temperatura_c && s.temperatura_c.nota) r('Temperatura (note)', s.temperatura_c.nota);
    if (s.lune_conteggio_data) r('Lune: conteggio aggiornato a', meseAnno(s.lune_conteggio_data));
    if (s.note) r('Note', s.note);
    if (!righe.length) return null;
    return el('details', { classe: 'ss-grandi' }, [
      el('summary', { testo: '📊 Dati per i grandi' }),
      el('table', {}, [el('tbody', {}, righe.map(([k, v]) => el('tr', {}, [el('th', { scope: 'row', testo: k }), el('td', { testo: v })])))])
    ]);
  }

  function schedaCorpo(c) {
    const s = c.scheda;
    const g = corpi.get(c.genitore);
    const parti = [];
    parti.push(el('p', { classe: 'ss-descrizione', testo: s.descrizione }));
    parti.push(bottoneAscolta('c', c.id));
    parti.push(tuSu(c));

    const dl = el('dl', { classe: 'ss-dati' });

    if (c.tipo === 'sonda') {
      const quando = new Date(s.lancio.data_ora_utc);
      dl.append(riquadro('🚀 Quando è partita?', fmtData.format(quando), s.lancio.luogo + ', con un razzo ' + s.lancio.razzo + '.'));
      dl.append(riquadro('⚖️ Quanto pesa?', fmt(s.massa_kg) + ' kg'));
      dl.append(riquadro('📡 L\'antenna', 'Larga ' + fmt(s.antenna_parabolica_diametro_m, 2) + ' m', 'Punta sempre verso la Terra.'));
      if (s.energia) dl.append(riquadro('🔋 Da dove prende l\'energia?', s.energia.numero_rtg + ' generatori nucleari (RTG)',
        'Al lancio davano circa ' + fmt(s.energia.potenza_lancio_w) + ' watt; ogni anno ne danno un po\' meno.'));
      if (s.trasmettitore_w) dl.append(riquadro('📶 Con quanta forza trasmette?', fmt(s.trasmettitore_w) + ' watt', 'Eppure le grandi antenne sulla Terra la sentono da miliardi di chilometri.'));
      if (s.strumenti_accesi_ottobre_2026) {
        const nomi = s.strumenti_accesi_ottobre_2026.map((sig) => ((s.strumenti || []).find((x) => x.sigla === sig) || { nome: sig }).nome.replace(/ \(.*\)$/, ''));
        dl.append(riquadro('🔬 Strumenti ancora accesi', nomi.length + ' su ' + (s.strumenti || []).length, nomi.join(', ') + ' (dati NASA di ottobre 2026). Gli altri sono stati spenti per risparmiare energia.'));
      }
      (s.pianeti || []).forEach((pv) => {
        const g = corpi.get(pv.corpo);
        if (!g) return;
        dl.append(riquadro('🪐 ' + g.nome, fmtData.format(new Date(pv.data_ora_utc)), (pv.scoperte || [])[0] || null));
      });
    } else if (c.tipo === 'stazione') {
      dl.append(riquadro('📏 Quanto è grande?', s.assi_km.map((v) => fmt(v * 1000) + ' m').join(' × '), 'Più o meno quanto un campo da calcio.'));
      if (s.quota_km) dl.append(riquadro('⬆️ Quanto è in alto?', 'Circa ' + fmt(s.quota_km.tipica) + ' km', 'Fra ' + s.quota_km.intervallo.map((v) => fmt(v)).join(' e ') + ' km: scende piano piano e ogni tanto la rialzano con i motori.'));
      if (s.velocita_kmh) dl.append(riquadro('💨 Quanto va veloce?', 'Circa ' + fmt(s.velocita_kmh) + ' km all\'ora'));
      if (s.equipaggio) dl.append(riquadro('🧑‍🚀 Chi ci vive?', s.equipaggio[0].toUpperCase() + s.equipaggio.slice(1), s.abitata_dal ? 'C\'è sempre stato qualcuno dal ' + fmtData.format(new Date(s.abitata_dal + 'T12:00:00Z')) + '.' : null));
      if (s.partner) dl.append(riquadro('🤝 Chi l\'ha costruita?', s.partner.join(', ')));
      if (s.ritiro) dl.append(riquadro('🔚 Fino a quando?', s.ritiro));
    } else if (s.assi_km) {
      dl.append(riquadro('📏 Quanto è grande?', s.assi_km.map((v) => (v < 10 ? fmt(v * 1000) + ' m' : fmt(v) + ' km')).join(' × '),
        'Non è una palla: sono le sue misure nelle tre direzioni.'));
    } else if (s.raggio_medio_km && c.id !== 'terra') {
      const r = s.raggio_medio_km / TERRA.scheda.raggio_medio_km;
      dl.append(riquadro('📏 Quanto è grande?', 'Largo ' + fmt(s.raggio_medio_km * 2) + ' km',
        r >= 1.5 ? 'Ci vogliono circa ' + fmt(r) + ' Terre in fila per fare la sua larghezza.'
          : (r > 0.95 ? 'Grande quasi come la Terra.' : 'La Terra è circa ' + fmtSig(1 / r, 2) + ' volte più larga.')));
    } else if (c.id === 'terra') {
      dl.append(riquadro('📏 Quanto è grande?', 'Larga ' + fmt(s.raggio_medio_km * 2) + ' km'));
    }

    if (s.distanza_media && s.distanza_media.unita === 'UA') {
      const km = s.distanza_media.valore * UA_KM;
      dl.append(riquadro('☀️ Quanto è lontano dal Sole?', distanzaKm(km), 'La luce del Sole ci mette ' + tempoLuce(km) + ' ad arrivare fin qui.'));
    } else if (s.distanza_media && g) {
      dl.append(riquadro('🪐 Quanto è lontana ' + (g.id === 'terra' ? 'dalla Terra' : 'da ' + g.nome) + '?', distanzaKm(s.distanza_media.valore)));
    }

    if (s.periodo_orbitale_giorni) {
      if (c.genitore === 'sole') {
        dl.append(riquadro('🗓️ Quanto dura un anno?', durataUmana(s.periodo_orbitale_giorni * 24), 'Il tempo di un giro completo attorno al Sole.'));
      } else if (g) {
        dl.append(riquadro('🔄 Quanto ci mette a girare ' + (g.id === 'terra' ? 'attorno alla Terra' : 'attorno a ' + g.nome) + '?', durataUmana(s.periodo_orbitale_giorni * 24)));
      }
    }

    if (s.rotazione_sincrona && g) {
      dl.append(riquadro('🌓 Come gira?', 'Mostra sempre la stessa faccia ' + a(g), 'Come la Luna con noi: dall\'altra parte non la si vede mai.'));
    } else if (s.giorno_solare_ore) {
      dl.append(riquadro('🌗 Quanto dura un giorno?', durataUmana(s.giorno_solare_ore), 'Da un\'alba alla successiva.'
        + (s.rotazione_siderale_ore < 0 ? ' E gira al contrario della Terra.' : '')));
    } else if (s.rotazione_siderale_ore) {
      dl.append(riquadro('🌗 Quanto ci mette a girare su se stesso?', durataUmana(s.rotazione_siderale_ore),
        s.rotazione_siderale_ore < 0 ? 'E gira al contrario della Terra.' : null));
    }

    const asse = inclinazioneLeggibile(s.inclinazione_asse_gradi);
    if (asse && c.tipo !== 'luna') dl.append(riquadro('🧭 Come sta il suo asse?', asse.valore, asse.nota));

    const t = temperaturaLeggibile(s.temperatura_c);
    if (t) dl.append(riquadro('🌡️ Che temperatura c\'è?', t.valore, t.commento || null));

    if (s.lune_conosciute) {
      dl.append(riquadro('🌙 Quante lune ha?', fmt(s.lune_conosciute), s.lune_conosciute > 20 ? 'E gli astronomi ne scoprono ancora.' : null));
    }
    if (c.tipo === 'pianeta') dl.append(riquadro('💍 Ha gli anelli?', s.anelli ? 'Sì' : 'No'));
    if (s.atmosfera) dl.append(riquadro('💨 Che aria c\'è?', s.atmosfera));
    if (s.scoperta && (s.scoperta.anno || s.scoperta.da)) {
      dl.append(riquadro('🔭 Chi l\'ha scoperto?', [s.scoperta.da, s.scoperta.anno].filter(Boolean).join(', nel ')));
    }
    parti.push(dl);

    parti.push(el('div', { classe: 'ss-oggi', id: 'ssOggi', 'aria-live': 'off' }));
    const pallone = scalaPallone(c);
    if (pallone) parti.push(pallone);

    if (s.curiosita && s.curiosita.length) {
      parti.push(el('h3', { testo: '💡 Lo sapevi?' }));
      parti.push(el('ul', { classe: 'ss-curiosita' }, s.curiosita.map((f) => el('li', { testo: f }))));
    }

    if (s.missioni && s.missioni.length) {
      parti.push(el('h3', { testo: '🛰️ Le sonde che ci sono andate' }));
      parti.push(el('ul', { classe: 'ss-missioni' }, s.missioni.map((m) => el('li', { testo: m.nome + ' (' + m.anno + '): ' + (TIPO_MISSIONE[m.tipo] || m.tipo) }))));
    }

    parti.push(notaImmagine(c));
    parti.push(datiPerGrandi(c));
    parti.push(listaFonti(s.fonti));
    return parti;
  }

  const TIPO_MISSIONE = {
    sorvolo: 'è passata vicino',
    orbita: 'gli ha girato attorno',
    atterraggio: 'ci è atterrata',
    impatto: 'lo ha colpito apposta',
    campione: 'ha riportato un campione sulla Terra'
  };

  function meseAnno(s) {
    const [a, m] = String(s).split('-').map(Number);
    if (!m) return String(a);
    return new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(a, m - 1, 1)));
  }

  // Se il Sole fosse un pallone da calcio: grandezza e distanza nella stessa scala.
  function scalaPallone(c) {
    if (!SOLE || c.id === 'sole' || c.genitore !== 'sole' || !c.scheda.distanza_media || c.scheda.distanza_media.unita !== 'UA') return null;
    const k = PALLONE_M / (SOLE.scheda.raggio_medio_km * 2);
    const diametroMm = c.scheda.raggio_medio_km * 2 * k * 1000;
    const distanzaM = c.scheda.distanza_media.valore * UA_KM * k;
    const grande = diametroMm >= 1 ? 'grande circa ' + fmtSig(diametroMm, 2) + ' mm' : 'più piccolo di un granello di polvere (' + fmtSig(diametroMm * 1000, 2) + ' millesimi di millimetro)';
    const dove = distanzaM >= 1000 ? fmt(distanzaM / 1000, 1) + ' km' : fmt(distanzaM) + ' metri';
    return el('div', { classe: 'ss-pallone' }, [
      el('h3', { testo: '⚽ In scala vera' }),
      el('p', { testo: 'Se il Sole fosse un pallone da calcio largo 22 cm, ' + c.nome + ' sarebbe ' + grande + ' e starebbe a circa ' + dove + ' dal pallone.' })
    ]);
  }

  const TIPO_IMMAGINE = {
    grigi: 'in bianco e nero',
    'colori naturali': 'con i colori che vedrebbero i nostri occhi',
    'colori quasi naturali': 'con colori vicini a quelli veri',
    'colore migliorato': 'con i colori resi più forti per vedere meglio le differenze fra le zone',
    'falsi colori': 'a falsi colori: gli scienziati hanno scelto i colori per mostrare cose che l\'occhio non vede',
    radar: 'fatta con il radar, che vede attraverso le nuvole: i colori li hanno scelti gli scienziati'
  };

  function notaImmagine(c) {
    const s = c.scheda;
    let testo;
    if (c.tex) {
      testo = 'La superficie è una mappa vera, costruita con le fotografie delle sonde o dei telescopi' + (TIPO_IMMAGINE[c.tex_tipo] ? ', ' + TIPO_IMMAGINE[c.tex_tipo] : '') + '. Crediti: ' + c.tex_credito + '.';
      if (s.superficie_nota === 'parziale') testo += ' Le sonde hanno fotografato solo una parte della superficie: le zone mancanti nella mappa sono state completate da chi l\'ha costruita, o restano scure.';
    } else if (c.tipo === 'sonda') {
      testo = 'Il modello 3D è della NASA (' + c.tex_credito + '). Nella scena la sonda è disegnata moltissime volte più grande di com\'è: lunga davvero, sarebbe invisibile. '
        + 'La sua strada (la scia) è quella vera, calcolata dal JPL della NASA; vicino ai pianeti, che nella scena sono ingranditi, la scia gira attorno al pianeta disegnato.';
    } else if (c.tipo === 'stazione') {
      const g = corpi.get(c.genitore);
      const volte = 0.04 * g.scheda.raggio_medio_km / s.raggio_medio_km;
      testo = 'Il modello 3D è della NASA (' + c.tex_credito + '). Nella scena la stazione è disegnata circa ' + fmtSig(volte, 2)
        + ' volte più grande di com\'è: lunga davvero, sarebbe invisibile. La sua distanza dalla Terra invece è in proporzione vera. '
        + 'La posizione lungo l\'orbita è indicativa: è calcolata dai dati del 15 ottobre 2026, e dopo qualche giorno la stazione è già altrove. '
        + 'Quando la guardi da vicino la Terra sparisce, per vedere bene la stazione; la scia rosa mostra la strada che ha appena fatto.';
    } else if (c.tipo === 'stella') {
      testo = 'Qui il Sole è disegnato giallo e arancione, come nei libri. La sua luce in realtà è bianca: dalla Terra lo vediamo giallo per via dell\'aria. La sua superficie cambia di continuo, con macchie che compaiono e spariscono, quindi una mappa fissa non esiste.';
    } else if (c.colore) {
      testo = 'Colore: la media dei colori misurati nelle immagini del telescopio spaziale Hubble (' + c.tex_tipo + '; ' + c.tex_credito + '). Visto da lontano ' + c.nome + ' ha pochissimi dettagli, e Hubble ne vede solo la metà rivolta verso di noi: per questo è disegnato di un colore uniforme.';
    } else if (c.tipo === 'buco-nero') {
      testo = 'Questa è una rappresentazione: nessuno può fotografare un buco nero da vicino.';
    } else {
      testo = 'Di ' + c.nome + ' non esiste una mappa completa fatta con le fotografie delle sonde: per questo nel modello è grigio. Non abbiamo voluto inventare colori che nessuno ha visto.';
    }
    if (s.assi_km && c.tipo !== 'stazione') testo += ' La forma è approssimata con un ellissoide che ha le sue misure vere.';
    return el('p', { classe: 'ss-nota ss-immagine', testo });
  }

  function aggiornaOggi() {
    const box = $('ssOggi');
    if (!box || !motore || !corrente || corrente.tipo !== 'c') return;
    const c = corpi.get(corrente.id);
    if (!c || c.id === 'terra' || c.tipo === 'buco-nero' || (c.tipo === 'sonda' && !motore.haTraiettoria(c.id))) { box.textContent = ''; return; }
    // Distanza dalla Terra calcolata dalle posizioni del modello (UA). Per le
    // lune si usa il loro pianeta: la differenza e' piccola rispetto al viaggio.
    let rif = c;
    while (rif && rif.genitore && rif.genitore !== 'sole' && corpi.get(rif.genitore)) rif = corpi.get(rif.genitore);
    const pc = rif.id === 'sole' ? [0, 0, 0] : motore.posizioneVeraUA(rif.id);
    const pt = motore.posizioneVeraUA('terra');
    if (!pc || !pt) return;
    const d = Math.hypot(pc[0] - pt[0], pc[1] - pt[1], pc[2] - pt[2]) * UA_KM;
    const minuti = d / LUCE_KMS / 60;
    const quando = fmtData.format(motore.dataDaJd(motore.jd));
    const luce = minuti < 1 ? fmt(minuti * 60) + ' secondi' : (minuti < 120 ? fmt(minuti) + ' minuti' : fmt(minuti / 60, 1) + ' ore');
    box.replaceChildren(
      el('h3', { testo: '📡 Il ' + quando }),
      el('p', { testo: (c.genitore !== 'sole' && c.id !== 'sole' ? c.nome + ' e ' + rif.nome + ' sono' : c.nome + ' è') + ' a circa ' + distanzaKm(d) + ' dalla Terra. La luce, la cosa più veloce che esista, impiega circa ' + luce + ' per fare questo viaggio.' })
    );
  }

  function mostraScheda(tipoTesto, nome, parti) {
    $('ssTipo').textContent = tipoTesto;
    $('ssNome').textContent = nome;
    $('ssSchedaCorpo').replaceChildren(...parti.filter(Boolean));
  }

  function schedaSciame(s) {
    const prog = corpi.get(s.progenitore_id);
    const dl = el('dl', { classe: 'ss-dati' }, [
      riquadro('Quando si vedono di più', s.picco, s.periodo_attivita ? 'Attive ' + s.periodo_attivita + '.' : null),
      s.zhr ? riquadro('Quante meteore', 'fino a circa ' + fmt(s.zhr) + ' all\'ora', 'Con il cielo buio e senza Luna: in città se ne vedono molte meno.') : null,
      s.velocita_kms ? riquadro('Velocità', fmt(s.velocita_kms) + ' km al secondo', 'Entrano nell\'aria così veloci che si scaldano e bruciano.') : null,
      s.radiante_costellazione ? riquadro('Sembrano venire da', 'la costellazione ' + s.radiante_costellazione) : null,
      riquadro('Nascono da', s.progenitore_nome)
    ]);
    return [
      el('p', { classe: 'ss-descrizione', testo: s.descrizione }),
      bottoneAscolta('s', s.id),
      dl,
      prog ? el('p', { classe: 'ss-nota', testo: 'Nella scena è evidenziata in giallo l\'orbita da cui arriva la polvere (' + prog.nome + '): la Terra ne attraversa la scia ogni anno, sempre negli stessi giorni.' }) : null,
      prog ? el('button', { type: 'button', classe: 'ss-btn', testo: 'Vai a ' + prog.nome, onclick: () => apri('c:' + prog.id) }) : null,
      listaFonti(s.fonti)
    ];
  }

  // Etichette leggibili per le chiavi dei dati delle schede. Le chiavi tecniche
  // (note per il revisore, valori usati solo nei calcoli) non si mostrano.
  const ETICHETTE_DATI = {
    distanza_interna_UA: 'Comincia a', distanza_esterna_UA: 'Finisce a',
    bordo_interno_UA: 'Comincia a', fine_regione_principale_UA: 'La parte principale finisce a',
    bordo_esterno_UA: 'Finisce a', massa_totale: 'Massa di tutti insieme',
    quota_massa_cerere: 'Quanto pesa Cerere sul totale', quota_massa_vesta: 'Quanto pesa Vesta sul totale',
    eta_miliardi_anni: 'Età (miliardi di anni)', oggetti_catalogati: 'Oggetti conosciuti',
    oggetti_piu_grandi_di_100_km_stimati: 'Oggetti più grandi di 100 km (stima)', sonde: 'Sonde',
    proposta_da: 'Proposta da', voyager_1: 'La sonda Voyager 1',
    meteoroide: 'Meteoroide', meteora: 'Meteora', meteorite: 'Meteorite', micrometeorite: 'Micrometeorite',
    nota_limiti: 'Attenzione', definizioni: 'Definizioni ufficiali',
    buchi_neri_nel_sistema_solare: 'Buchi neri nel Sistema Solare',
    sagittarius_a_star: 'Sagittarius A*, al centro della Via Lattea', gaia_bh1: 'Gaia BH1, il più vicino conosciuto',
    massa_masse_solari: 'Massa (in Soli)', distanza_anni_luce: 'Distanza (anni luce)', prima_immagine: 'Prima immagine',
    costellazione: 'Costellazione', annuncio: 'Annunciato', ancora_il_piu_vicino: 'È ancora il più vicino?',
    perche_il_sole_no: 'Perché il Sole non diventerà un buco nero'
  };
  const DATI_NASCOSTI = /^(definizione_distanze|ipotizzata|osservata_direttamente|massa_masse_solari_valore|nota_valore)$/;

  function valoreLeggibile(chiave, v) {
    if (typeof v === 'number') return fmt(v, 2) + (/_UA$/.test(chiave) ? ' UA dal Sole' : '');
    if (typeof v === 'boolean') return v ? 'sì' : 'no';
    return String(v);
  }

  function righeDati(dati) {
    return Object.keys(dati).filter((k) => !DATI_NASCOSTI.test(k) && ETICHETTE_DATI[k]).map((k) => {
      const v = dati[k];
      if (v && typeof v === 'object') {
        return el('div', { classe: 'ss-dato ss-dato-largo' }, [
          el('dt', { testo: ETICHETTE_DATI[k] }),
          el('dd', {}, [el('ul', {}, righeDatiLista(v))])
        ]);
      }
      return riquadro(ETICHETTE_DATI[k], valoreLeggibile(k, v));
    });
  }

  function righeDatiLista(obj) {
    return Object.keys(obj).filter((k) => !DATI_NASCOSTI.test(k) && ETICHETTE_DATI[k])
      .map((k) => el('li', { testo: ETICHETTE_DATI[k] + ': ' + valoreLeggibile(k, obj[k]) }));
  }

  function schedaConcetto(k) {
    const dati = k.dati ? righeDati(k.dati) : [];
    return [
      el('p', { classe: 'ss-descrizione', testo: k.testo }),
      bottoneAscolta('k', k.id),
      dati.length ? el('dl', { classe: 'ss-dati' }, dati) : null,
      k.id === 'buco-nero' && corpi.has('sgr-a') ? el('button', { type: 'button', classe: 'ss-btn', testo: '⚖️ Confronta il Sole con Sagittarius A*', onclick: () => confronta('buco-nero') }) : null,
      listaFonti(k.fonti)
    ];
  }

  /* ------------------------------------------------------- apertura */

  function mostraCorpo(c) {
    mostraScheda(NOMI_TIPO[c.tipo] + (c.tipo === 'luna' ? ' ' + di(corpi.get(c.genitore)) : ''), c.nome, schedaCorpo(c));
    aggiornaOggi();
    mostraCartellino(c);
  }

  function apri(chiave, opz) {
    const o = opz || {};
    const [tipo, id] = chiave.split(':');
    if (motore && confrontoAttivo) chiudiConfronto(true);
    corrente = { tipo, id };
    segnaVoce(chiave);
    // Una scelta fatta dal bambino interrompe il viaggio guidato e la lettura
    // della scheda di prima.
    if (!o.viaggio) {
      fineViaggio();
      fineFilm();
      fermaAudio();
    }
    const asc = document.querySelector('[data-ss="ascolta-cartellino"]');
    if (asc) asc.dataset.ascolta = tipo + ':' + id;
    aggiornaPulsantiAscolto();
    if (motore) motore.evidenziaOrbita(null);
    const istantaneo = movimentoRidotto() || o.istantaneo;

    if (tipo === 'c') {
      const c = corpi.get(id);
      if (!c) return;
      if (motore && c.tipo === 'sonda' && !motore.haTraiettoria(id)) {
        caricaTraiettorie().then((ok) => { if (ok && corrente && corrente.id === id) motore.seleziona(id, istantaneo); });
      } else if (motore) {
        assicuraVisibile(c);
        motore.seleziona(id, istantaneo);
      }
      mostraCorpo(c);
      // Aperta prima dei testi (un tocco nei primi istanti): la si rifa'
      // quando arrivano, se e' ancora lei.
      if (!testiPronti) {
        caricaTesti().then((ok) => { if (ok && corrente && corrente.tipo === 'c' && corrente.id === id) mostraCorpo(c); });
      }
      registraVisita(id);
      // Il viaggio guidato e l'apertura da un link non valgono come risposta.
      if (!o.viaggio && !o.daHash) controllaMissione(c);
      annuncia('Stai guardando ' + c.nome + '.' + (immersivo() ? ' Premi Scopri per saperne di più.' : ''));
    } else if (tipo === 's') {
      const s = sciami.get(id);
      if (!s) return;
      if (motore) {
        motore.vistaSistema(istantaneo);
        if (corpi.has(s.progenitore_id)) {
          assicuraVisibile(corpi.get(s.progenitore_id));
          motore.evidenziaOrbita(s.progenitore_id);
        }
      }
      mostraScheda('Sciame di stelle cadenti', s.nome, schedaSciame(s));
      mostraCartellinoTesto(s.nome, ['🌠 Il massimo: ' + s.picco, s.zhr ? '✨ Fino a circa ' + fmt(s.zhr) + ' meteore all\'ora' : null, '☄️ Nascono da: ' + s.progenitore_nome], s.descrizione);
      annuncia(s.nome + '.' + (immersivo() ? ' Premi Scopri per saperne di più.' : ''));
    } else if (tipo === 'k') {
      const k = schede.get(id);
      if (!k) return;
      if (motore && (id === 'fascia-asteroidi' || id === 'fascia-kuiper')) {
        motore.setFiltri({ fasce: true });
        sincronizzaFiltri();
        motore.vistaSistema(istantaneo);
      }
      mostraScheda('Scheda', k.titolo, schedaConcetto(k));
      mostraCartellinoTesto(k.titolo, [], k.testo);
      annuncia(k.titolo + '.' + (immersivo() ? ' Premi Scopri per saperne di più.' : ''));
    }
    if (!o.daHash) {
      try { history.replaceState(null, '', '#' + id); } catch (_) { /* file:// o sandbox */ }
    }
  }

  // Se il bambino ha spento le lune e sceglie una luna, la riaccendiamo.
  function assicuraVisibile(c) {
    const f = motore.filtri;
    const mappa = { luna: 'lune', 'pianeta-nano': 'nani', asteroide: 'asteroidi', 'oggetto-kuiper': 'asteroidi', cometa: 'comete' };
    const chiave = mappa[c.tipo];
    if (chiave && !f[chiave]) {
      motore.setFiltri({ [chiave]: true });
      sincronizzaFiltri();
    }
    if (c.tipo === 'luna' && corpi.get(c.genitore)) assicuraVisibile(corpi.get(c.genitore));
  }

  function viaggia(passo) {
    const attuale = corrente && corrente.tipo === 'c' ? ORDINE_VIAGGIO.indexOf(corrente.id) : -1;
    let k = attuale + passo;
    if (attuale < 0) k = passo > 0 ? 0 : ORDINE_VIAGGIO.length - 1;
    k = (k + ORDINE_VIAGGIO.length) % ORDINE_VIAGGIO.length;
    apri('c:' + ORDINE_VIAGGIO[k]);
  }

  /* ------------------------------------------------------- memoria */

  // Passaporto e missioni restano solo nel browser, come i progressi dei quiz.
  // Stesse funzioni di js/bosco.js (con il ripiego in memoria se localStorage
  // non e' disponibile, per esempio in navigazione privata su Safari).
  const KEY_PASSAPORTO = 'lascuolaamica_sistema_solare_passaporto_v1';
  const KEY_MISSIONI = 'lascuolaamica_sistema_solare_missioni_v1';
  const KEY_MISSIONE_CHIUSA = 'lascuolaamica_sistema_solare_missione_chiusa_v1';
  const KEY_CARTELLINO_RIDOTTO = 'lascuolaamica_sistema_solare_cartellino_ridotto_v1';
  const memoryStorage = SA.memoryStorage = SA.memoryStorage || Object.create(null);

  function storageGet(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return Object.prototype.hasOwnProperty.call(memoryStorage, key) ? memoryStorage[key] : null;
    }
  }

  function storageSet(key, value) {
    const normalized = String(value);
    try {
      localStorage.setItem(key, normalized);
    } catch (e) {
      memoryStorage[key] = normalized;
    }
  }

  function leggiElenco(key) {
    try {
      const v = JSON.parse(storageGet(key) || '[]');
      return new Set(Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []);
    } catch (_) {
      return new Set();
    }
  }

  /* ------------------------------------------------------- cartellino */

  // Il cartellino sulla scena: nome, tre numeri facili e una curiosita' alla
  // volta. Tutto viene dalla scheda del corpo: qui si sceglie solo cosa
  // mostrare e come dirlo in breve.
  const CURIOSITA_MS = 8000;
  let curiosita = { elenco: [], i: 0, ferma: false, timer: 0 };

  function fattiRapidi(c) {
    const s = c.scheda;
    const g = corpi.get(c.genitore);
    const f = {};
    if (s.raggio_medio_km && c.id !== 'terra') {
      const r = s.raggio_medio_km / TERRA.scheda.raggio_medio_km;
      f.grandezza = '📏 ' + (r >= 1.05 ? 'Largo circa ' + fmtSig(r, 2) + ' volte la Terra'
        : (s.raggio_medio_km * 2 >= 10 ? 'Largo ' + fmt(s.raggio_medio_km * 2) + ' km' : 'Largo ' + fmt(s.raggio_medio_km * 2, 2) + ' km'));
    }
    if (c.genitore === 'sole' && s.periodo_orbitale_giorni) f.anno = '🗓️ Un anno dura ' + durataUmana(s.periodo_orbitale_giorni * 24);
    if (c.tipo === 'luna' && s.periodo_orbitale_giorni && g) f.anno = '🔄 Fa il giro ' + di(g) + ' in ' + durataUmana(s.periodo_orbitale_giorni * 24);
    if (s.rotazione_sincrona && g) f.giorno = '🌓 Mostra sempre la stessa faccia ' + a(g);
    else if (s.giorno_solare_ore) f.giorno = '🌗 Un giorno, dall\'alba all\'alba, dura ' + durataUmana(s.giorno_solare_ore);
    else if (s.rotazione_siderale_ore) f.giorno = '🌗 Fa un giro su se stesso in ' + durataUmana(s.rotazione_siderale_ore) + (s.rotazione_siderale_ore < 0 ? ', al contrario' : '');
    if (s.gravita_superficie_ms2 && c.id !== 'terra') {
      const kg = pesoTerra * s.gravita_superficie_ms2 / G_TERRA;
      f.peso = '⚖️ Qui la bilancia segnerebbe ' + fmt(kg, kg < 10 ? 1 : 0) + ' kg invece di ' + fmt(pesoTerra);
    }
    if (s.lune_conosciute) f.lune = '🌙 Lune conosciute: ' + fmt(s.lune_conosciute);
    const t = s.temperatura_c;
    if (t && t.media !== null && t.media !== undefined) f.caldo = '🌡️ Circa ' + fmt(t.media) + ' °C';
    if (c.tipo === 'sonda') {
      f.partita = '🚀 Partita il ' + fmtData.format(new Date(s.lancio.data_ora_utc));
      f.pianeti = '🪐 Ha visitato ' + (s.pianeti || []).map((pv) => (corpi.get(pv.corpo) || { nome: pv.corpo }).nome).join(', ');
      if (s.posizione) f.lontano = '📏 Il ' + fmtData.format(new Date(s.posizione.data_utc)) + ' era a ' + fmt(s.posizione.distanza_sole_ua) + ' UA dal Sole';
    }
    if (c.tipo === 'stazione') {
      if (s.quota_km) f.quota = '⬆️ Vola a circa ' + fmt(s.quota_km.tipica) + ' km di altezza';
      if (s.velocita_kmh) f.veloce = '💨 Va a circa ' + fmt(s.velocita_kmh) + ' km all\'ora';
      if (s.equipaggio) f.chi = '🧑‍🚀 A bordo: ' + s.equipaggio;
    }
    const ordine = {
      stazione: ['anno', 'quota', 'veloce', 'chi'],
      sonda: ['partita', 'pianeti', 'lontano'],
      stella: ['grandezza', 'peso', 'caldo'],
      pianeta: c.id === 'terra' ? ['giorno', 'anno', 'lune'] : ['giorno', 'anno', 'peso', 'lune'],
      'pianeta-nano': ['giorno', 'anno', 'peso', 'grandezza'],
      luna: ['anno', 'giorno', 'grandezza', 'peso']
    }[c.tipo] || ['grandezza', 'anno', 'giorno'];
    return ordine.filter((k) => f[k]).slice(0, 3).map((k) => f[k]);
  }

  function mostraCartellino(c) {
    const box = $('ssCartellino');
    if (!c || !motore) {
      box.hidden = true;
      fermaCuriosita();
      return;
    }
    $('ssCartNome').textContent = c.nome;
    $('ssCartTipo').textContent = NOMI_TIPO[c.tipo] + (c.tipo === 'luna' || c.tipo === 'stazione' ? ' ' + di(corpi.get(c.genitore)) : '');
    impostaMini($('ssCartMini'), c);
    $('ssCartMini').hidden = false;
    mostraFatti(c);
    curiosita.elenco = (c.scheda.curiosita || []).slice();
    curiosita.i = 0;
    $('ssCartCuriosita').hidden = !curiosita.elenco.length;
    box.hidden = false;
    mostraCuriosita();
    programmaCuriosita();
  }

  // Cartellino per sciami e schede: righe date e il testo spezzato in frasi,
  // che scorrono come le curiosita'.
  function mostraCartellinoTesto(nome, righe, testo) {
    if (!motore) return;
    $('ssCartNome').textContent = nome;
    $('ssCartTipo').textContent = righe.length ? 'Stelle cadenti' : 'Da sapere';
    $('ssCartMini').hidden = true;
    $('ssCartDati').replaceChildren(...righe.filter(Boolean).map((t) => {
      const [icona, ...resto] = t.split(' ');
      return el('li', {}, [el('span', { 'aria-hidden': 'true', testo: icona + ' ' }), document.createTextNode(resto.join(' '))]);
    }));
    curiosita.elenco = (testo.match(/[^.!?]+[.!?]+/g) || [testo]).map((x) => x.trim()).filter(Boolean);
    curiosita.i = 0;
    $('ssCartCuriosita').hidden = !curiosita.elenco.length;
    $('ssCartellino').hidden = false;
    mostraCuriosita();
    programmaCuriosita();
  }

  function mostraFatti(c) {
    $('ssCartDati').replaceChildren(...fattiRapidi(c).map((t) => {
      // L'emoji e' decorativa: allo screen reader arriva solo la frase.
      const [icona, ...resto] = t.split(' ');
      return el('li', {}, [el('span', { 'aria-hidden': 'true', testo: icona + ' ' }), document.createTextNode(resto.join(' '))]);
    }));
  }

  function mostraCuriosita() {
    if (!curiosita.elenco.length) return;
    $('ssCartTesto').textContent = curiosita.elenco[curiosita.i % curiosita.elenco.length];
  }

  // Sul telefono il cartellino copre la scena: con ✕ o con Esc resta solo il
  // nome, anche alle scelte dopo e nel viaggio, finche' non lo si riapre.
  function riduciCartellino(ridotto) {
    const b = document.querySelector('[data-ss="riduci-cartellino"]');
    $('ssCartellino').classList.toggle('ss-cart-ridotto', ridotto);
    b.textContent = ridotto ? '▴' : '✕';
    b.setAttribute('aria-label', ridotto ? 'Apri il cartellino' : 'Riduci il cartellino');
    b.setAttribute('aria-expanded', ridotto ? 'false' : 'true');
    programmaCuriosita();
  }

  function fermaCuriosita() {
    window.clearInterval(curiosita.timer);
    curiosita.timer = 0;
  }

  // Cambiano da sole ogni 8 secondi; il pulsante ⏸ le ferma (WCAG 2.2.2).
  function programmaCuriosita() {
    fermaCuriosita();
    if (curiosita.ferma || curiosita.elenco.length < 2 || $('ssCartellino').classList.contains('ss-cart-ridotto')) return;
    curiosita.timer = window.setInterval(() => {
      curiosita.i += 1;
      mostraCuriosita();
    }, CURIOSITA_MS);
  }

  /* ------------------------------------------------------- viaggio */

  // Il viaggio guidato e' un autopilota: vola da solo dal Sole alla fascia di
  // Kuiper, si ferma su ogni tappa il tempo di leggere (o di ascoltare, con la
  // voce) e intanto gira piano attorno al corpo. «Avanti» salta alla tappa
  // dopo. Con il movimento ridotto la camera non gira e non si avanza da soli.
  const TAPPE = ['c:sole', 'c:mercurio', 'c:venere', 'c:terra', 'c:iss', 'c:luna', 'c:marte', 'k:fascia-asteroidi', 'c:cerere',
    'c:giove', 'c:io', 'c:saturno', 'c:titano', 'c:urano', 'c:nettuno', 'c:plutone', 'k:fascia-kuiper']
    .filter((k) => {
      const [t, id] = k.split(':');
      return t === 'c' ? corpi.has(id) : schede.has(id);
    });
  const TAPPA_MS = 10000;
  const viaggio = { attivo: false, i: 0, pausa: false, timer: 0 };

  function impostaPulsanteViaggio(attivo) {
    const b = document.querySelector('[data-ss="viaggio"]');
    b.setAttribute('aria-pressed', attivo ? 'true' : 'false');
    b.replaceChildren(document.createTextNode(attivo ? '✋ ' : '🚀 '), el('span', { classe: 'ss-lungo', testo: attivo ? 'Ferma il viaggio' : 'Parti per il viaggio' }),
      el('span', { classe: 'ss-corto', 'aria-hidden': 'true', testo: 'Viaggio' }));
  }

  function nomeTappa(k) {
    const [t, id] = k.split(':');
    return t === 'c' ? corpi.get(id).nome : schede.get(id).titolo;
  }

  function avviaViaggio() {
    if (!motore) return;
    if (confrontoAttivo) chiudiConfronto(true);
    chiudiCassetto();
    viaggio.attivo = true;
    document.body.classList.add('ss-in-viaggio');
    viaggio.i = 0;
    viaggio.pausa = false;
    $('ssViaggioBarra').hidden = false;
    impostaPulsanteViaggio(true);
    tappa();
    annuncia('Si parte! ' + TAPPE.length + ' tappe. Vado avanti da solo; premi Vai avanti per saltare una tappa.');
  }

  function tappa() {
    const k = TAPPE[viaggio.i];
    apri(k, { viaggio: true });
    $('ssViaggioTappa').textContent = (viaggio.i + 1) + ' di ' + TAPPE.length + ': ' + nomeTappa(k);
    motore.giroLento(!movimentoRidotto());
    programmaTappa();
  }

  function barraProgresso(ms) {
    const b = $('ssViaggioProgresso');
    b.classList.remove('ss-in-corso');
    b.style.width = '0';
    if (!ms) return;
    void b.offsetWidth; // fa ripartire l'animazione
    b.style.animationDuration = ms + 'ms';
    b.style.width = '';
    b.classList.add('ss-in-corso');
  }

  function programmaTappa() {
    window.clearTimeout(viaggio.timer);
    if (!viaggio.attivo || viaggio.pausa) { barraProgresso(0); return; }
    const k = TAPPE[viaggio.i];
    const automatico = !movimentoRidotto();
    if ($('ssViaggioVoce').checked) {
      // Con la voce la tappa finisce quando finisce la lettura, ma non prima
      // di 6 secondi: c'e' anche da guardare.
      const inizio = Date.now();
      barraProgresso(0);
      const [t, id] = k.split(':');
      parla(id, testoParlato(t, id), () => {
        if (!automatico || !viaggio.attivo || viaggio.pausa || TAPPE[viaggio.i] !== k) return;
        const resto = Math.max(1500, 6000 - (Date.now() - inizio));
        barraProgresso(resto);
        viaggio.timer = window.setTimeout(prossimaTappa, resto);
      }, t);
    } else if (automatico) {
      barraProgresso(TAPPA_MS);
      viaggio.timer = window.setTimeout(prossimaTappa, TAPPA_MS);
    }
  }

  function prossimaTappa() {
    if (!viaggio.attivo) return;
    if (viaggio.i >= TAPPE.length - 1) {
      fineViaggio();
      // Finiti i pianeti, si va oltre: il viaggio delle Voyager.
      if (FILM && FILM.capitoli && FILM.capitoli.length) {
        mostraToast('🚀 E ora seguiamo le sonde Voyager, oltre i pianeti!');
        avviaFilm();
        return;
      }
      annuncia('Viaggio finito: ' + TAPPE.length + ' tappe!');
      $('ssMissioneEsito').textContent = '🏁 Viaggio finito: ' + TAPPE.length + ' tappe, dal Sole alla fascia di Kuiper!';
      return;
    }
    viaggio.i += 1;
    tappa();
  }

  function pausaViaggio() {
    viaggio.pausa = !viaggio.pausa;
    const b = document.querySelector('[data-ss="viaggio-pausa"]');
    b.setAttribute('aria-pressed', viaggio.pausa ? 'true' : 'false');
    b.textContent = viaggio.pausa ? '▶ Continua' : '⏸ Aspetta';
    motore.giroLento(!viaggio.pausa && !movimentoRidotto());
    if (viaggio.pausa) {
      window.clearTimeout(viaggio.timer);
      fermaAudio();
    }
    programmaTappa();
  }

  function fineViaggio() {
    if (!viaggio.attivo) return;
    viaggio.attivo = false;
    document.body.classList.remove('ss-in-viaggio');
    window.clearTimeout(viaggio.timer);
    fermaAudio();
    barraProgresso(0);
    if (motore) motore.giroLento(false);
    $('ssViaggioBarra').hidden = true;
    impostaPulsanteViaggio(false);
  }

  /* ------------------------------------------------------- film Voyager */

  // Il viaggio delle Voyager: un film a capitoli di circa due minuti e mezzo,
  // dal lancio del 1977 al 2050. Il tempo e' quello vero (le date dei pianeti e
  // delle sonde coincidono con quelle dei sorvoli): fra un capitolo e l'altro la
  // data corre, e la camera segue la sonda; in ogni capitolo si ferma e mostra
  // il testo, una foto vera quando c'e', e volendo lo legge.
  const FILM = DATI.film;
  const FILM_FINE = 2469807.0; // 31 dicembre 2049: gli elementi dei pianeti valgono fino al 2050
  // Per ogni capitolo: secondi di viaggio per arrivarci, secondi di sosta,
  // sonda da seguire durante il viaggio. Totale circa 150 secondi.
  const REGIA = {
    lancio: { viaggio: 0, sosta: 10, segui: 'voyager-1' },
    giove: { viaggio: 7, sosta: 11, segui: 'voyager-1' },
    saturno: { viaggio: 5, sosta: 11, segui: 'voyager-1' },
    urano: { viaggio: 7, sosta: 11, segui: 'voyager-2' },
    nettuno: { viaggio: 6, sosta: 11, segui: 'voyager-2' },
    // La foto fu scattata da Voyager 1 voltata verso il Sole: la camera guarda
    // da dietro la sonda.
    'pale-blue-dot': { viaggio: 3, sosta: 12, segui: 'voyager-1', foto: 'pale-blue-dot', guarda: 'voyager-1', distanza: 6 },
    'bolla-del-sole': { viaggio: 8, sosta: 11, segui: 'voyager-1', eliopausa: true },
    oggi: { viaggio: 7, sosta: 11, segui: 'voyager-1', eliopausa: true },
    futuro: { viaggio: 8, sosta: 12, segui: 'voyager-1', eliopausa: true, foto: 'futuro' }
  };
  const film = { attivo: false, i: 0, pausa: false, timer: 0, raf: 0, inViaggio: null };
  // Descrizioni, curiosita', fonti, missioni dei corpi arrivano a parte (vedi
  // scripts/build_sistema_solare.py): servono alle schede, non alla scena, e
  // il benvenuto non li aspetta. Una richiesta sola, che parte appena finiti
  // gli script. Ogni campo testuale e' facoltativo: se il file non arriva le
  // schede escono piu' corte, e si riprova alla prossima scheda aperta.
  let testiCaricati = null;
  let testiPronti = false;
  function caricaTesti() {
    if (!testiCaricati) {
      testiCaricati = fetch('/js/sistema-solare-testi.json')
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status))))
        .then((t) => {
          Object.keys(t.corpi || {}).forEach((id) => {
            const c = corpi.get(id);
            if (c && c.scheda) Object.assign(c.scheda, t.corpi[id]);
          });
          testiPronti = true;
          return true;
        })
        .catch(() => { testiCaricati = null; return false; });
    }
    return testiCaricati;
  }

  let traiettorieCaricate = null;

  function caricaTraiettorie() {
    if (traiettorieCaricate) return traiettorieCaricate;
    const file = (DATI.corpi.find((c) => c.tipo === 'sonda') || {}).traiettoria;
    traiettorieCaricate = !file || !motore ? Promise.resolve(false) : fetch('/assets/sistema-solare/' + file)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status))))
      .then((t) => { motore.aggiungiTraiettorie(t); return true; })
      .catch(() => { traiettorieCaricate = null; return false; });
    return traiettorieCaricate;
  }

  const jdDi = (data) => motore.jdDaData(new Date(data + 'T12:00:00Z'));
  const fmtMeseAnno = new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric', timeZone: 'UTC' });

  function avviaFilm() {
    if (!motore || !FILM || !FILM.capitoli || !FILM.capitoli.length) return;
    fineViaggio();
    fermaAudio();
    chiudiCassetto();
    if (confrontoAttivo) chiudiConfronto(true);
    caricaTraiettorie().then((ok) => {
      if (!ok) { mostraToast('Non riesco a caricare il viaggio delle Voyager: riprova fra poco.'); return; }
      film.attivo = true;
      film.pausa = false;
      film.i = 0;
      document.body.classList.add('ss-in-film');
      motore.setEstetico(false);
      motore.setVelocita(0);
      motore.setFiltri({ sonde: true });
      // I pianeti girano piano dal giorno di partenza; la data del film muove
      // solo le sonde (vedi tempiDisegno in js/sistema-solare-motore.js).
      motore.setFilm(jdDi(FILM.capitoli[0].data) - 1);
      $('ssFilmFine').hidden = true;
      $('ssViaggioBarra').hidden = false;
      const b = document.querySelector('[data-ss="viaggio-pausa"]');
      b.textContent = '⏸ Aspetta';
      b.setAttribute('aria-pressed', 'false');
      // Si parte dalla Terra il giorno prima del primo lancio.
      motore.setJd(jdDi(FILM.capitoli[0].data) - 1);
      annuncia('Il viaggio delle Voyager: ' + FILM.capitoli.length + ' capitoli. Vado avanti da solo.');
      capitoloFilm();
    });
  }

  function capitoloFilm() {
    const ch = FILM.capitoli[film.i];
    const r = REGIA[ch.id] || { viaggio: 5, sosta: 11, segui: 'voyager-1' };
    const da = motore.jd;
    const a = ch.id === 'futuro' ? Math.min(FILM_FINE, motore.intervallo('voyager-1')[1]) : jdDi(ch.data);
    $('ssViaggioTappa').textContent = '🎬 ' + (film.i + 1) + ' di ' + FILM.capitoli.length + ': ' + ch.titolo;
    $('ssFilm').hidden = false;
    $('ssFilmTitolo').textContent = ch.titolo;
    $('ssFilmTesto').textContent = '';
    $('ssFilmFoto').hidden = true;
    $('ssFilmSonda').textContent = ch.sonda === 'entrambe' ? 'Voyager 1 e Voyager 2' : (corpi.get(ch.sonda) || {}).nome || '';
    // Il confine della bolla alla distanza in cui l'ha attraversato Voyager 1.
    const ev = (FILM.eventi || []).find((x) => x.sonda === 'Voyager 1' && x.evento === 'eliopausa');
    motore.setEliopausa(r.eliopausa && ev ? ev.distanza_dal_sole_ua : null);
    // In viaggio: la camera segue la sonda, da lontano quando la sonda e' lontana.
    const durata = movimentoRidotto() ? 0 : r.viaggio * 1000;
    if (durata > 0 && a > da) {
      motore.seleziona(r.segui, false, distanzaSeguito(a));
      const inizio = performance.now();
      film.inViaggio = { da, a, inizio, durata };
      const passo = (t) => {
        if (!film.attivo || !film.inViaggio) return;
        if (film.pausa) { film.inViaggio.inizio += 16; film.raf = requestAnimationFrame(passo); return; }
        const x = Math.min(1, (t - film.inViaggio.inizio) / durata);
        const e = x * x * (3 - 2 * x);
        motore.setJd(da + (a - da) * e);
        aggiornaDataFilm(ch);
        if (x < 1) film.raf = requestAnimationFrame(passo);
        else { film.inViaggio = null; sostaFilm(ch, r); }
      };
      film.raf = requestAnimationFrame(passo);
    } else {
      motore.setJd(a);
      aggiornaDataFilm(ch);
      sostaFilm(ch, r);
    }
  }

  // Da quanto lontano seguire la sonda: piu' e' lontana dal Sole, piu' si
  // allarga l'inquadratura, cosi' si vedono la scia e i pianeti.
  function distanzaSeguito(jdArrivo) {
    const anni = (jdArrivo - jdDi('1977-09-05')) / 365.25;
    return anni < 4 ? 14 : (anni < 13 ? 40 : 120);
  }

  function aggiornaDataFilm(ch) {
    $('ssFilmData').textContent = ch.id === 'futuro' && motore.jd > jdDi('2027-01-01')
      ? '🔭 Il futuro: ' + fmtMeseAnno.format(motore.dataDaJd(motore.jd))
      : '📅 ' + fmtData.format(motore.dataDaJd(motore.jd));
  }

  function sostaFilm(ch, r) {
    $('ssFilmTesto').textContent = ch.testo;
    const f = FILM.foto && FILM.foto[r.foto || ch.id];
    if (f) {
      $('ssFilmImg').src = '/assets/sistema-solare/' + f.file;
      $('ssFilmImg').alt = f.titolo;
      $('ssFilmDidascalia').textContent = f.titolo + '. ' + f.credito + '.';
      $('ssFilmFoto').hidden = false;
    }
    // Dove guardare durante la sosta.
    if (r.guarda) motore.seleziona(r.guarda, movimentoRidotto(), r.distanza);
    else if (ch.corpo && corpi.has(ch.corpo) && ch.corpo !== 'sole') motore.seleziona(ch.corpo, movimentoRidotto());
    else if (r.eliopausa) motore.vistaSistema(movimentoRidotto(), 330);
    annuncia(ch.titolo + '. ' + ch.testo);
    programmaSostaFilm(ch, r);
  }

  function programmaSostaFilm(ch, r) {
    window.clearTimeout(film.timer);
    if (!film.attivo || film.pausa) return;
    const avanti = () => { if (film.attivo && !film.pausa) prossimoCapitolo(); };
    if ($('ssViaggioVoce').checked) {
      const inizio = Date.now();
      parla('film-' + ch.id, ch.titolo + '. ' + ch.testo, () => {
        if (!film.attivo || film.pausa || movimentoRidotto()) return;
        film.timer = window.setTimeout(avanti, Math.max(1500, 6000 - (Date.now() - inizio)));
      }, 'f');
      barraProgresso(0);
    } else if (!movimentoRidotto()) {
      barraProgresso(r.sosta * 1000);
      film.timer = window.setTimeout(avanti, r.sosta * 1000);
    }
  }

  function prossimoCapitolo() {
    window.clearTimeout(film.timer);
    cancelAnimationFrame(film.raf);
    fermaAudio();
    if (film.inViaggio) {
      // «Vai avanti» durante il viaggio: si arriva subito al capitolo.
      const ch = FILM.capitoli[film.i];
      motore.setJd(film.inViaggio.a);
      film.inViaggio = null;
      aggiornaDataFilm(ch);
      sostaFilm(ch, REGIA[ch.id] || { sosta: 11 });
      return;
    }
    if (film.i >= FILM.capitoli.length - 1) { finaleFilm(); return; }
    film.i += 1;
    capitoloFilm();
  }

  function pausaFilm() {
    film.pausa = !film.pausa;
    const b = document.querySelector('[data-ss="viaggio-pausa"]');
    b.setAttribute('aria-pressed', film.pausa ? 'true' : 'false');
    b.textContent = film.pausa ? '▶ Continua' : '⏸ Aspetta';
    if (film.pausa) {
      window.clearTimeout(film.timer);
      fermaAudio();
      barraProgresso(0);
    } else if (!film.inViaggio) {
      const ch = FILM.capitoli[film.i];
      programmaSostaFilm(ch, REGIA[ch.id] || { sosta: 11 });
    }
  }

  function finaleFilm() {
    window.clearTimeout(film.timer);
    barraProgresso(0);
    $('ssFilmFine').hidden = false;
    // La scheda ha i suoi pulsanti per finire: la barra non serve piu'. Chi la
    // usava da tastiera non perde il punto: passa al primo pulsante della scheda.
    const daBarra = $('ssViaggioBarra').contains(document.activeElement);
    $('ssViaggioBarra').hidden = true;
    if (daBarra) document.querySelector('[data-ss="film-ancora"]').focus();
    mostraToast('🏁 Hai seguito le Voyager fino al 2050!');
  }

  // Esce dal film: torna al giorno di oggi e al movimento rallentato.
  function fineFilm() {
    if (!film.attivo) return;
    film.attivo = false;
    film.inViaggio = null;
    window.clearTimeout(film.timer);
    cancelAnimationFrame(film.raf);
    fermaAudio();
    barraProgresso(0);
    document.body.classList.remove('ss-in-film');
    $('ssFilm').hidden = true;
    $('ssViaggioBarra').hidden = true;
    motore.setEliopausa(null);
    motore.setFilm(null);
    motore.setJd(motore.jdDaData(new Date()));
    impostaModo('estetico');
    ultimaData = '';
  }

  /* ------------------------------------------------------- missioni */

  // Ogni missione ha la risposta CALCOLATA dai dati delle schede, non scritta a
  // mano: se un numero cambia dopo una revisione, la risposta lo segue. Una
  // missione senza un'unica risposta valida non viene proposta.
  const perTipo = (t) => DATI.corpi.filter((c) => c.tipo === t && !c.solo_confronto);
  const larghezza = (c) => 'largo ' + fmt(c.scheda.raggio_medio_km * 2) + ' km';
  const distanzaSole = (c) => 'in media a ' + fmt(c.scheda.distanza_media.valore, 2) + ' UA dal Sole';
  const MISSIONI_DEF = [
    { id: 'grande', testo: 'Trova il pianeta più grande del Sistema Solare.', tipo: 'pianeta',
      valore: (c) => c.scheda.raggio_medio_km, verso: 'max', mostra: larghezza },
    { id: 'vicino', testo: 'Trova il pianeta più vicino al Sole.', tipo: 'pianeta',
      valore: (c) => c.scheda.distanza_media && c.scheda.distanza_media.valore, verso: 'min', mostra: distanzaSole },
    { id: 'caldo', testo: 'Trova il pianeta più caldo, in media.', tipo: 'pianeta',
      valore: (c) => c.scheda.temperatura_c && c.scheda.temperatura_c.media, verso: 'max',
      mostra: (c) => 'in media circa ' + fmt(c.scheda.temperatura_c.media) + ' °C' },
    { id: 'giorno', testo: 'Trova il pianeta dove un giro su se stesso dura più di un anno intero.', tipo: 'pianeta',
      condizione: (c) => c.scheda.rotazione_siderale_ore && c.scheda.periodo_orbitale_giorni
        && Math.abs(c.scheda.rotazione_siderale_ore) / 24 > c.scheda.periodo_orbitale_giorni,
      mostra: (c) => 'un giro su se stesso dura ' + durataUmana(c.scheda.rotazione_siderale_ore) + ', un anno ' + durataUmana(c.scheda.periodo_orbitale_giorni * 24) },
    { id: 'lune', testo: 'Trova il pianeta con più lune conosciute.', tipo: 'pianeta',
      valore: (c) => c.scheda.lune_conosciute, verso: 'max', mostra: (c) => fmt(c.scheda.lune_conosciute || 0) + ' lune conosciute' },
    { id: 'luna-grande', testo: 'Trova la luna più grande del Sistema Solare. Cercala fra le lune!', tipo: 'luna',
      valore: (c) => c.scheda.raggio_medio_km, verso: 'max', mostra: larghezza },
    { id: 'sdraiato', testo: 'Trova il pianeta che gira come una palla che rotola, con l\'asse quasi sdraiato.', tipo: 'pianeta',
      valore: (c) => (c.scheda.inclinazione_asse_gradi === null || c.scheda.inclinazione_asse_gradi === undefined) ? null : -Math.abs(c.scheda.inclinazione_asse_gradi - 90),
      verso: 'max', mostra: (c) => 'asse inclinato di ' + fmt(c.scheda.inclinazione_asse_gradi, 1) + '°' },
    { id: 'leggero', testo: 'Trova il pianeta meno denso dell\'acqua.', tipo: 'pianeta',
      condizione: (c) => c.scheda.densita_gcm3 && c.scheda.densita_gcm3 < 1,
      mostra: (c) => 'densità ' + fmt(c.scheda.densita_gcm3, 2) + ' g/cm³ (l\'acqua: 1)' },
    { id: 'bilancia', testo: 'Trova il pianeta dove la bilancia segnerebbe di più.', tipo: 'pianeta',
      valore: (c) => c.scheda.gravita_superficie_ms2, verso: 'max',
      mostra: (c) => 'la bilancia segnerebbe ' + fmt(pesoTerra * c.scheda.gravita_superficie_ms2 / G_TERRA, 1) + ' kg invece di ' + fmt(pesoTerra) },
    { id: 'nano-lontano', testo: 'Trova il pianeta nano più lontano dal Sole.', tipo: 'pianeta-nano',
      valore: (c) => c.scheda.distanza_media && c.scheda.distanza_media.unita === 'UA' ? c.scheda.distanza_media.valore : null,
      verso: 'max', mostra: distanzaSole }
  ];
  const NOME_GRUPPO = { pianeta: 'i pianeti', luna: 'le lune', 'pianeta-nano': 'i pianeti nani' };

  function soluzione(m) {
    const candidati = perTipo(m.tipo);
    if (m.condizione) {
      const ok = candidati.filter(m.condizione);
      return ok.length === 1 ? ok[0].id : null;
    }
    const validi = candidati.filter((c) => typeof m.valore(c) === 'number');
    if (validi.length < 2) return null;
    validi.sort((x, y) => (m.verso === 'max' ? m.valore(y) - m.valore(x) : m.valore(x) - m.valore(y)));
    return m.valore(validi[0]) === m.valore(validi[1]) ? null : validi[0].id;
  }

  const MISSIONI = MISSIONI_DEF.map((m) => Object.assign({ risposta: soluzione(m) }, m)).filter((m) => m.risposta);
  const missioni = { fatte: leggiElenco(KEY_MISSIONI), corrente: null, risolta: false };

  function prossimaMissione(dopo) {
    const restanti = MISSIONI.filter((m) => !missioni.fatte.has(m.id));
    if (!restanti.length) {
      missioni.corrente = null;
      $('ssMissioneTesto').textContent = '🏆 Hai completato tutte le ' + MISSIONI.length + ' missioni! Puoi ricominciarle da capo.';
      document.querySelector('[data-ss="missione-salta"]').textContent = '🔄 Ricomincia le missioni';
      document.querySelector('[data-ss="missione-prossima"]').hidden = true;
      aggiornaContoMissioni();
      return;
    }
    const k = dopo ? (restanti.findIndex((m) => m.id === dopo) + 1) % restanti.length : 0;
    missioni.corrente = restanti[Math.max(0, k)];
    missioni.risolta = false;
    $('ssMissioneTesto').textContent = missioni.corrente.testo;
    $('ssMissioneEsito').textContent = '';
    document.querySelector('[data-ss="missione-prossima"]').hidden = true;
    document.querySelector('[data-ss="missione-salta"]').textContent = '🔄 Cambiala';
    aggiornaContoMissioni();
  }

  // Chiusa, la missione e' il suo testo in due righe, senza pulsanti: sul
  // telefono in verticale aperta occupava mezzo cielo. La scelta resta per la
  // visita dopo; senza scelta e' chiusa solo sul telefono in verticale.
  const telefonoVerticale = () => window.matchMedia('(max-width: 700px) and (min-height: 541px)').matches;

  function apriMissione(aperta) {
    $('ssMissione').classList.toggle('ss-missione-chiusa', !aperta);
    document.querySelector('[data-ss="missione-apri"]').setAttribute('aria-expanded', aperta ? 'true' : 'false');
  }

  function alternaMissione() {
    const aperta = $('ssMissione').classList.contains('ss-missione-chiusa');
    apriMissione(aperta);
    storageSet(KEY_MISSIONE_CHIUSA, aperta ? '0' : '1');
  }

  function aggiornaContoMissioni() {
    $('ssMissioneConto').textContent = 'Completate: ' + MISSIONI.filter((m) => missioni.fatte.has(m.id)).length + ' di ' + MISSIONI.length;
  }

  function controllaMissione(c) {
    const m = missioni.corrente;
    if (!m || missioni.risolta) return;
    const esito = $('ssMissioneEsito');
    if (c.id === m.risposta) {
      missioni.risolta = true;
      missioni.fatte.add(m.id);
      storageSet(KEY_MISSIONI, JSON.stringify([...missioni.fatte]));
      esito.textContent = '🎉 Esatto! ' + c.nome + ': ' + m.mostra(c) + '.';
      mostraToast('🎉 Missione compiuta!');
      document.querySelector('[data-ss="missione-prossima"]').hidden = false;
      apriMissione(true);
      $('ssMissione').classList.add('ss-missione-ok');
      window.setTimeout(() => $('ssMissione').classList.remove('ss-missione-ok'), 1200);
      aggiornaContoMissioni();
    } else if (c.tipo !== m.tipo) {
      esito.textContent = c.nome + ' non è fra ' + NOME_GRUPPO[m.tipo] + ': cerca lì!';
    } else {
      esito.textContent = 'Non è ' + c.nome + ' (' + m.mostra(c) + '). Prova ancora!';
    }
  }

  /* ------------------------------------------------------- passaporto */

  const GRUPPI_PASSAPORTO = [
    ['stella', 'Il Sole'], ['pianeta', 'Pianeti'], ['pianeta-nano', 'Pianeti nani'], ['luna', 'Lune'],
    ['stazione', 'Stazioni spaziali'], ['sonda', 'Sonde'], ['asteroide', 'Asteroidi'], ['cometa', 'Comete'], ['oggetto-kuiper', 'Oggetti di Kuiper']
  ];
  const visitati = leggiElenco(KEY_PASSAPORTO);

  function registraVisita(id) {
    if (visitati.has(id)) return;
    visitati.add(id);
    storageSet(KEY_PASSAPORTO, JSON.stringify([...visitati]));
    aggiornaPassaporto(id);
    mostraToast('🛂 Nuovo timbro sul passaporto: ' + corpi.get(id).nome + '!');
  }

  // Un avviso breve in alto: timbri e missioni compiute.
  let toastTimer = 0;
  let avviato = false; // all'apertura della pagina niente avvisi
  function mostraToast(testo, durata) {
    const t = $('ssToast');
    if (!t || !avviato) return;
    t.textContent = testo;
    t.hidden = false;
    t.classList.remove('ss-toast-via');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => { t.hidden = true; }, durata || 3200);
  }

  function aggiornaPassaporto(nuovo) {
    const badge = $('ssBadgeTimbri');
    if (badge) badge.textContent = visitati.size ? String(visitati.size) : '';
    const conti = $('ssPassaportoConti');
    conti.replaceChildren(...GRUPPI_PASSAPORTO.map(([tipo, nome]) => {
      const tutti = perTipo(tipo);
      if (!tutti.length) return null;
      const fatti = tutti.filter((c) => visitati.has(c.id)).length;
      return el('li', { classe: fatti === tutti.length ? 'ss-completo' : null }, [
        el('span', { testo: nome + ': ' }),
        el('strong', { testo: fatti + ' di ' + tutti.length }),
        fatti === tutti.length ? el('span', { 'aria-hidden': 'true', testo: ' ⭐' }) : null
      ]);
    }).filter(Boolean));
    const timbri = $('ssTimbri');
    timbri.replaceChildren(...DATI.corpi.filter((c) => !c.solo_confronto).map((c) => el('button', {
      type: 'button',
      classe: 'ss-timbro' + (visitati.has(c.id) ? ' ss-timbro-si' : '') + (c.id === nuovo ? ' ss-timbro-nuovo' : ''),
      'aria-label': c.nome + (visitati.has(c.id) ? ', visitato' : ', da visitare'),
      onclick: () => { apri('c:' + c.id); chiudiCassetto(); }
    }, [mini(c), el('span', { testo: c.nome })])));
    document.querySelectorAll('[data-voce^="c:"]').forEach((b) => {
      const id = b.dataset.voce.slice(2);
      const si = visitati.has(id);
      b.classList.toggle('ss-visitato', si);
      let sr = b.querySelector('.sr-only');
      if (si && !sr) b.append(el('span', { classe: 'sr-only', testo: ' (visitato)' }));
      if (!si && sr) sr.remove();
    });
  }

  function azzeraPassaporto() {
    const fai = () => {
      visitati.clear();
      missioni.fatte.clear();
      storageSet(KEY_PASSAPORTO, '[]');
      storageSet(KEY_MISSIONI, '[]');
      aggiornaPassaporto();
      prossimaMissione();
    };
    if (SA.ui && SA.ui.confirm) {
      SA.ui.confirm('Vuoi cancellare tutti i timbri del passaporto e le missioni completate?', { confirmLabel: 'Sì, ricomincia', cancelLabel: 'No' })
        .then((ok) => { if (ok) fai(); });
    } else {
      fai();
    }
  }

  /* ------------------------------------------------------- confronto */

  const CONFRONTI = [
    { id: 'pianeti', testo: 'I pianeti', ids: ['mercurio', 'venere', 'terra', 'marte', 'giove', 'saturno', 'urano', 'nettuno'] },
    { id: 'sole', testo: 'Il Sole e i pianeti', ids: ['sole', 'giove', 'saturno', 'urano', 'nettuno', 'terra', 'venere', 'marte', 'mercurio'] },
    { id: 'lune', testo: 'Le lune più grandi', ids: ['ganimede', 'titano', 'callisto', 'io', 'luna', 'europa', 'tritone', 'mercurio'] },
    { id: 'nani', testo: 'I pianeti nani', ids: ['plutone', 'eris', 'haumea', 'makemake', 'cerere', 'luna'] },
    { id: 'piccoli', testo: 'Asteroidi e comete', ids: ['vesta', 'pallade', 'igea', 'eros', 'halley', '67p', 'ryugu', 'bennu', 'itokawa'] },
    { id: 'buco-nero', testo: 'Il Sole e un buco nero', ids: ['sole', 'sgr-a'] }
  ];

  let confrontoAttivo = null;

  function costruisciConfronti() {
    const box = $('ssConfronti');
    CONFRONTI.forEach((p) => {
      p.ids = p.ids.filter((id) => corpi.has(id));
      if (p.ids.length < 2) return;
      box.append(el('button', { type: 'button', classe: 'ss-btn ss-chip', 'data-confronto': p.id, 'aria-pressed': 'false', testo: p.testo }));
    });
    box.append(el('button', { type: 'button', classe: 'ss-btn', 'data-ss': 'fine-confronto', hidden: true, testo: '✕ Torna al Sistema Solare' }));
    box.addEventListener('click', (e) => {
      const b = e.target.closest('[data-confronto]');
      if (b) confronta(b.dataset.confronto);
    });
  }

  function confronta(idPreset) {
    const p = CONFRONTI.find((x) => x.id === idPreset);
    if (!p || !motore) return;
    confrontoAttivo = p;
    motore.confronta(p.ids);
    document.querySelectorAll('[data-confronto]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.confronto === idPreset ? 'true' : 'false'));
    document.querySelector('[data-ss="fine-confronto"]').hidden = false;
    $('ssAvvisoScala').textContent = 'Grandezze in scala vera fra loro. Le distanze qui non contano: sono messi in fila.';
    const nomi = p.ids.map((id) => corpi.get(id).nome);
    const rif = corpi.get(p.ids[0]);
    const righe = p.ids.map((id) => {
      const c = corpi.get(id);
      const d = c.scheda.raggio_medio_km * 2;
      // Il raggio del buco nero viene da una massa "circa 4 milioni di Soli":
      // due cifre bastano e non promettono una precisione che non c'e'.
      const diametro = c.tipo === 'buco-nero' ? 'circa ' + fmtSig(d / 1e6, 2) + ' milioni di km' : (d < 10 ? fmt(d, 2) : fmt(d)) + ' km';
      const confronto = id === rif.id ? '' : ' (' + (rif.scheda.raggio_medio_km > c.scheda.raggio_medio_km
        ? 'circa ' + fmtSig(rif.scheda.raggio_medio_km / c.scheda.raggio_medio_km, 3) + ' volte più piccolo ' + di(rif)
        : 'circa ' + fmtSig(c.scheda.raggio_medio_km / rif.scheda.raggio_medio_km, 2) + ' volte più grande ' + di(rif)) + ')';
      return el('li', { testo: c.nome + ': ' + diametro + confronto });
    });
    mostraScheda('Confronto delle grandezze', p.testo, [
      el('p', { classe: 'ss-descrizione', testo: 'In fila da sinistra: ' + nomi.join(', ') + '. Qui le grandezze sono vere, una rispetto all\'altra. Gira e avvicina la scena per guardarli meglio.' }),
      el('h3', { testo: 'Diametri' }),
      el('ul', { classe: 'ss-curiosita' }, righe),
      p.id === 'buco-nero' ? el('p', { classe: 'ss-nota', testo: 'Il buco nero è disegnato come una sfera nera grande quanto il suo orizzonte degli eventi, il confine da cui nemmeno la luce può uscire. L\'alone arancione è un disegno: rappresenta il gas caldo che gli gira attorno, che non ha questa forma precisa.' }) : null,
      p.ids.some((id) => corpi.get(id).scheda.raggio_medio_km < 2) ? el('p', { classe: 'ss-nota', testo: 'I più piccoli sono così piccoli che vanno cercati avvicinandosi molto con il pulsante ＋.' }) : null
    ]);
    corrente = null;
    segnaVoce(null);
    annuncia('Confronto delle grandezze vere: ' + nomi.join(', ') + '.');
  }

  function chiudiConfronto(silenzioso) {
    confrontoAttivo = null;
    motore.confronta(null);
    document.querySelectorAll('[data-confronto]').forEach((b) => b.setAttribute('aria-pressed', 'false'));
    document.querySelector('[data-ss="fine-confronto"]').hidden = true;
    $('ssAvvisoScala').textContent = 'Distanze accorciate e corpi ingranditi: non è in scala';
    if (!silenzioso) {
      apri('c:sole');
      motore.vistaSistema(movimentoRidotto());
    }
  }

  /* ------------------------------------------------------- etichette */

  const etichette = new Map();
  const posaEtichetta = new WeakMap();   // ultimo transform scritto
  let nomiAccesi = true;

  function costruisciEtichette() {
    const box = $('ssEtichette');
    DATI.corpi.forEach((c) => {
      const e = el('button', { type: 'button', classe: 'ss-etichetta ss-et-' + c.tipo, tabindex: '-1', testo: c.nome });
      e.addEventListener('click', () => apri('c:' + c.id));
      e.hidden = true;
      box.append(e);
      etichette.set(c.id, e);
    });
  }

  function priorita(c) {
    if (c.tipo === 'stella') return 0;
    if (c.tipo === 'pianeta') return 1;
    if (c.tipo === 'pianeta-nano') return 2;
    return 3;
  }

  const ordineEtichette = DATI.corpi.slice().sort((a, b) => priorita(a) - priorita(b));

  function aggiornaEtichette() {
    const posate = [];
    const bersaglio = motore.bersaglio;
    const bersaglioDati = corpi.get(bersaglio);
    ordineEtichette.forEach((c) => {
      const e = etichette.get(c.id);
      let mostra = nomiAccesi;
      let s = null;
      if (mostra) s = motore.schermo(c.id);
      if (!s || s.x < 0 || s.y < 0 || s.x > motore.larghezza || s.y > motore.altezza) mostra = false;
      // Nel primo piano della ISS conta solo lei.
      if (mostra && bersaglioDati && bersaglioDati.tipo === 'stazione' && c.id !== bersaglio) mostra = false;
      if (mostra && !confrontoAttivo) {
        // Lune, asteroidi e comete: solo quando ci si e' vicini, per non
        // coprire la scena di nomi.
        const famiglia = c.id === bersaglio || c.genitore === bersaglio || (bersaglioDati && c.id === bersaglioDati.genitore)
          || (bersaglioDati && c.genitore && c.genitore === bersaglioDati.genitore);
        if ((c.tipo === 'luna' || c.tipo === 'stazione') && !famiglia) mostra = false;
        if ((c.tipo === 'asteroide' || c.tipo === 'cometa' || c.tipo === 'oggetto-kuiper') && c.id !== bersaglio && s.r < 4) mostra = false;
      }
      if (mostra) {
        // Rettangolo stimato dell'etichetta: circa 7 px per lettera, 18 di altezza.
        // Il modello di Voyager e' lungo quanto il braccio del magnetometro ma
        // basso: sotto la sonda il nome va molto piu' vicino del raggio.
        const y = s.y + Math.max(c.tipo === 'sonda' ? s.r * 0.4 : s.r, 3) + 4;
        const mezza = c.nome.length * 3.6 + 8;
        if (posate.some((p) => Math.abs(p.x - s.x) < p.mezza + mezza && Math.abs(p.y - y) < 18)) mostra = false;
        else posate.push({ x: s.x, y, mezza });
        if (mostra) {
          // Si riscrive solo se l'etichetta si e' spostata: aggiornaEtichette
          // gira dopo ogni disegno, e ogni scrittura costa un ricalcolo di stile.
          const t = 'translate(' + Math.round(s.x) + 'px,' + Math.round(y) + 'px) translateX(-50%)';
          if (posaEtichetta.get(e) !== t) {
            posaEtichetta.set(e, t);
            e.style.transform = t;
          }
        }
      }
      if (e.hidden !== !mostra) e.hidden = !mostra;
    });
  }

  /* ------------------------------------------------------- tempo */

  let ultimaData = '';
  // Velocita' automatica: 1 mese al secondo quando si guarda tutto il sistema
  // (si vedono i pianeti girare attorno al Sole), 1 ora al secondo vicino a un
  // corpo (si vede girare su se stesso: la Terra fa un giro in 24 secondi).
  // Sono velocita' vere tutte e due: cambia solo quale si sceglie.
  const VEL_SISTEMA = 30.436875;
  const VEL_VICINO = 1 / 24;
  let velocitaScelta = 'auto';
  let velocitaAttuale = null;
  let inPausa = false;

  function nomeVelocita(v) {
    if (Math.abs(v - VEL_SISTEMA) < 1e-4) return '1 mese al secondo';
    if (Math.abs(v - VEL_VICINO) < 1e-4) return '1 ora al secondo';
    if (Math.abs(v - 1) < 1e-4) return '1 giorno al secondo';
    if (Math.abs(v - 365.25) < 1e-4) return '1 anno al secondo';
    return '';
  }

  function velocitaVoluta() {
    if (velocitaScelta !== 'auto') return velocitaScelta;
    return !motore || motore.bersaglio === 'sole' || motore.distanzaCamera() > 40 ? VEL_SISTEMA : VEL_VICINO;
  }

  // Chiamata a ogni disegno: in automatico la velocita' segue la camera.
  function applicaVelocita() {
    if (!motore) return;
    // Durante il film la data la decide il film; i pianeti girano piano.
    if (film.attivo) {
      motore.setVelocita(0);
      motore.setFattoreEstetico(inPausa ? 0 : 1);
      return;
    }
    if (motore.estetico) {
      motore.setVelocita(0);
      motore.setFattoreEstetico(inPausa ? 0 : 1);
      velocitaAttuale = null;
      scriviNota(inPausa ? 'Il movimento è fermo.' : '');
      return;
    }
    motore.setFattoreEstetico(0);
    const v = inPausa ? 0 : velocitaVoluta();
    if (v === velocitaAttuale) return;
    velocitaAttuale = v;
    motore.setVelocita(v);
    scriviNota(inPausa ? 'Il tempo è fermo.'
      : (velocitaScelta === 'auto' ? 'Adesso: ' + nomeVelocita(v) + '. Più veloce quando guardi tutto il sistema, più lenta vicino a un pianeta.' : ''));
  }

  // applicaVelocita gira dopo ogni disegno: lo stesso testo riscritto
  // rimpiazzerebbe il nodo e invaliderebbe lo stile a ogni fotogramma.
  function scriviNota(testo) {
    const nota = $('ssVelocitaNota');
    if (nota.textContent !== testo) nota.textContent = testo;
  }

  function aggiornaData() {
    if (!motore) return;
    const d = motore.dataDaJd(motore.jd);
    const testo = fmtData.format(d) + (motore.estetico ? ' · movimento rallentato' : '');
    if (testo !== ultimaData) {
      ultimaData = testo;
      $('ssData').textContent = testo;
    }
  }

  function impostaVelocita(v) {
    velocitaScelta = v;
    document.querySelectorAll('#ssVelocita [data-vel]').forEach((b) => {
      const sua = b.dataset.vel === 'auto' ? 'auto' : Number(b.dataset.vel);
      b.setAttribute('aria-pressed', (sua === 'auto' ? v === 'auto' : v !== 'auto' && Math.abs(sua - v) < 1e-4) ? 'true' : 'false');
    });
    if (inPausa) impostaPausa(false);
    velocitaAttuale = null;
    applicaVelocita();
  }

  // Rallentato per guardare (di partenza) o tempo vero, con le sue velocita'.
  function impostaModo(modo) {
    const estetico = modo === 'estetico';
    motore.setEstetico(estetico);
    document.querySelectorAll('[data-modo]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.modo === modo ? 'true' : 'false'));
    $('ssVelocita').hidden = estetico;
    $('ssModoNota').textContent = estetico
      ? 'I pianeti partono dalla posizione vera di oggi, poi si muovono più piano o più in fretta del vero, per guardarli meglio: chi è più veloce resta più veloce.'
      : 'Tempo vero: ogni corpo si muove alla sua velocità vera, accelerata quanto scegli. Le date sono quelle vere.';
    ultimaData = '';
    velocitaAttuale = null;
    if (!estetico) impostaVelocita(velocitaScelta);
    applicaVelocita();
    aggiornaData();
    annuncia(estetico ? 'Movimento rallentato per guardare.' : 'Tempo vero.');
  }

  function impostaPausa(p) {
    inPausa = p;
    const b = document.querySelector('[data-ss="pausa"]');
    b.setAttribute('aria-pressed', p ? 'true' : 'false');
    b.setAttribute('aria-label', p ? 'Fai ripartire il movimento dei pianeti' : 'Ferma il movimento dei pianeti');
    velocitaAttuale = null;
    applicaVelocita();
  }

  /* ------------------------------------------------------- vista */

  const immersivo = () => document.body.classList.contains('ss-immersivo');

  function impostaImmersivo(si) {
    document.body.classList.toggle('ss-immersivo', si);
    if (!si && document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
    if (si) chiudiCassetto(); else document.querySelectorAll('.ss-pannello').forEach((x) => x.classList.add('ss-attivo'));
    misuraBasso();
    if (motore) motore.ridisegna();
    annuncia(si ? 'Vista a tutto schermo.' : 'Vista normale: le schede sono accanto alla scena.');
  }

  function apriCassetto(nome) {
    if (!immersivo()) {
      const sez = document.querySelector('[data-pannello-corpo="' + nome + '"]');
      if (sez) sez.scrollIntoView({ behavior: movimentoRidotto() ? 'auto' : 'smooth', block: 'start' });
      return;
    }
    const c = $('ssCassetto');
    c.classList.add('ss-aperto');
    document.querySelectorAll('.ss-pannello').forEach((x) => x.classList.toggle('ss-attivo', x.dataset.pannelloCorpo === nome));
    document.querySelectorAll('[data-pannello]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.pannello === nome ? 'true' : 'false'));
    const sez = document.querySelector('[data-pannello-corpo="' + nome + '"]');
    c.scrollTop = 0;
    const primo = sez && sez.querySelector('h2');
    if (primo) { primo.setAttribute('tabindex', '-1'); primo.focus({ preventScroll: true }); }
  }

  function chiudiCassetto() {
    const c = $('ssCassetto');
    if (!c.classList.contains('ss-aperto')) return;
    c.classList.remove('ss-aperto');
    const ritorno = document.querySelector('[data-ss="scopri"]');
    if (ritorno && !$('ssCartellino').hidden) ritorno.focus({ preventScroll: true });
  }

  // Quanto e' alta la barra in basso: cartellino e avvisi si mettono sopra.
  // E dove finisce la riga in alto: la missione cambia altezza con il testo e
  // con la larghezza, il cartellino non deve salirle sopra. Durante il viaggio
  // la barra del viaggio prende il posto della missione e puo' scendere piu' giu'.
  function misuraBasso() {
    const h = document.querySelector('.ss-hud-basso').offsetHeight;
    const alto = document.querySelector('.ss-hud-alto');
    const barra = $('ssViaggioBarra');
    const fondo = Math.max(alto.offsetTop + alto.offsetHeight, barra.hidden ? 0 : barra.offsetTop + barra.offsetHeight);
    const scena = $('ssScena');
    scena.style.setProperty('--ss-basso', h + 'px');
    scena.style.setProperty('--ss-alto', fondo + 'px');
    scena.style.setProperty('--ss-destra', document.querySelector('.ss-hud-destra').offsetWidth + 'px');
    if (!motore) return;
    // Il corpo scelto va al centro del cielo che resta libero. Il cartellino
    // largo (telefono in verticale) toglie spazio sotto, quello stretto (a
    // colonna, finestre basse) a sinistra.
    const cart = $('ssCartellino');
    const W = scena.clientWidth;
    let sotto = scena.clientHeight - h;
    let sinistra = 0;
    if (cart.offsetHeight) {
      if (cart.offsetWidth > W * 0.6) sotto = Math.min(sotto, cart.offsetTop);
      else sinistra = cart.offsetLeft + cart.offsetWidth;
    }
    motore.inquadra((sinistra + W) / 2, (fondo + sotto) / 2);
  }

  function schermoIntero() {
    const root = document.documentElement;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else if (root.requestFullscreen) {
      if (!immersivo()) impostaImmersivo(true);
      root.requestFullscreen().catch(() => {});
    }
  }

  /* ------------------------------------------------------- filtri */

  function sincronizzaFiltri() {
    const f = motore.filtri;
    document.querySelectorAll('[data-filtro]').forEach((i) => {
      if (i.dataset.filtro === 'nomi') i.checked = nomiAccesi;
      else i.checked = !!f[i.dataset.filtro];
    });
  }

  /* ------------------------------------------------------- input */

  function collegaInput(canvas) {
    const punti = new Map();
    let trascinato = 0;
    let pinch = 0;

    canvas.addEventListener('pointerdown', (e) => {
      canvas.setPointerCapture(e.pointerId);
      punti.set(e.pointerId, { x: e.clientX, y: e.clientY });
      trascinato = 0;
      if (punti.size === 2) {
        const [a, b] = [...punti.values()];
        pinch = Math.hypot(a.x - b.x, a.y - b.y);
      }
    });
    canvas.addEventListener('pointermove', (e) => {
      const p = punti.get(e.pointerId);
      if (!p) return;
      const dx = e.clientX - p.x;
      const dy = e.clientY - p.y;
      p.x = e.clientX;
      p.y = e.clientY;
      if (punti.size === 1) {
        trascinato += Math.abs(dx) + Math.abs(dy);
        motore.ruota(-dx * 0.006, dy * 0.006);
      } else if (punti.size === 2) {
        const [a, b] = [...punti.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch > 0) motore.zoom(pinch / d);
        pinch = d;
        trascinato = 99;
      }
    });
    function fine(e) {
      if (!punti.has(e.pointerId)) return;
      punti.delete(e.pointerId);
      if (punti.size < 2) pinch = 0;
      if (e.type === 'pointerup' && trascinato < 6 && punti.size === 0) {
        const r = canvas.getBoundingClientRect();
        const id = motore.scegli(e.clientX - r.left, e.clientY - r.top);
        if (id) apri('c:' + id);
      }
    }
    canvas.addEventListener('pointerup', fine);
    canvas.addEventListener('pointercancel', fine);
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      motore.zoom(Math.exp(e.deltaY * 0.0015));
    }, { passive: false });
    canvas.addEventListener('keydown', (e) => {
      const passo = 0.12;
      const azioni = {
        ArrowLeft: () => motore.ruota(passo, 0),
        ArrowRight: () => motore.ruota(-passo, 0),
        ArrowUp: () => motore.ruota(0, passo),
        ArrowDown: () => motore.ruota(0, -passo),
        '+': () => motore.zoom(0.8),
        '=': () => motore.zoom(0.8),
        '-': () => motore.zoom(1.25),
        Home: () => apri('c:sole'),
        PageDown: () => viaggia(1),
        PageUp: () => viaggia(-1)
      };
      const f = azioni[e.key];
      if (f) {
        e.preventDefault();
        f();
      }
    });
  }

  function collegaBottoni() {
    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-ss]');
      if (b) {
        const a = b.dataset.ss;
        const senzaScena = ['prec', 'succ', 'missione-prossima', 'missione-salta', 'passaporto-azzera', 'curiosita-pausa', 'curiosita-avanti',
          'scopri', 'chiudi-cassetto', 'riduci-cartellino', 'missione-apri', 'esci', 'entra', 'ascolta-cartellino', 'benvenuto-chiudi', 'benvenuto-apri'];
        if (!motore && !senzaScena.includes(a)) return;
        const azioni = {
          prec: () => viaggia(-1),
          succ: () => viaggia(1),
          sistema: () => { if (confrontoAttivo) chiudiConfronto(true); apri('c:sole'); motore.vistaSistema(movimentoRidotto()); },
          sx: () => motore.ruota(0.3, 0),
          dx: () => motore.ruota(-0.3, 0),
          su: () => motore.ruota(0, 0.25),
          giu: () => motore.ruota(0, -0.25),
          vicino: () => motore.zoom(0.7),
          lontano: () => motore.zoom(1.4),
          pausa: () => impostaPausa(!inPausa),
          oggi: () => { motore.setJd(motore.jdDaData(new Date())); motore.azzeraEstetico(); ultimaData = ''; aggiornaData(); aggiornaOggi(); },
          'fine-confronto': () => chiudiConfronto(false),
          viaggio: () => (viaggio.attivo ? fineViaggio() : avviaViaggio()),
          'viaggio-pausa': () => (film.attivo ? pausaFilm() : pausaViaggio()),
          'viaggio-avanti': () => {
            if (film.attivo) { prossimoCapitolo(); return; }
            window.clearTimeout(viaggio.timer); fermaAudio(); prossimaTappa();
          },
          'viaggio-fine': () => (film.attivo ? fineFilm() : fineViaggio()),
          film: avviaFilm,
          'film-ancora': () => { fineFilm(); avviaFilm(); },
          'film-esci': fineFilm,
          'curiosita-pausa': () => {
            curiosita.ferma = !curiosita.ferma;
            // Il nome accessibile comincia con la parola scritta sul pulsante (WCAG 2.5.3).
            b.textContent = curiosita.ferma ? 'Falle scorrere' : 'Fermale';
            b.setAttribute('aria-label', curiosita.ferma ? 'Falle scorrere: le curiosità tornano a cambiare da sole' : 'Fermale: le curiosità smettono di cambiare da sole');
            programmaCuriosita();
          },
          'curiosita-avanti': () => { curiosita.i += 1; mostraCuriosita(); programmaCuriosita(); },
          'missione-prossima': () => prossimaMissione(missioni.corrente && missioni.corrente.id),
          'missione-salta': () => {
            if (!missioni.corrente) { missioni.fatte.clear(); storageSet(KEY_MISSIONI, '[]'); prossimaMissione(); return; }
            prossimaMissione(missioni.corrente.id);
          },
          'passaporto-azzera': azzeraPassaporto,
          scopri: () => apriCassetto('scheda'),
          'chiudi-cassetto': chiudiCassetto,
          'riduci-cartellino': () => {
            const ridotto = !$('ssCartellino').classList.contains('ss-cart-ridotto');
            riduciCartellino(ridotto);
            storageSet(KEY_CARTELLINO_RIDOTTO, ridotto ? '1' : '0');
          },
          'missione-apri': alternaMissione,
          esci: () => impostaImmersivo(false),
          entra: () => impostaImmersivo(true),
          'schermo-intero': schermoIntero,
          'benvenuto-viaggio': () => { chiudiBenvenuto(); avviaViaggio(); },
          'benvenuto-chiudi': chiudiBenvenuto,
          'benvenuto-apri': mostraBenvenuto,
          'ascolta-cartellino': () => { if (corrente) premiAscolta(corrente.tipo, corrente.id); }
        };
        if (azioni[a]) azioni[a]();
        return;
      }
      const modo = e.target.closest('[data-modo]');
      if (modo && motore) { impostaModo(modo.dataset.modo); return; }
      const v = e.target.closest('#ssVelocita [data-vel]');
      if (v && motore) { impostaVelocita(v.dataset.vel === 'auto' ? 'auto' : Number(v.dataset.vel)); return; }
      const tab = e.target.closest('[data-pannello]');
      if (tab) { apriCassetto(tab.dataset.pannello); return; }
      const apre = e.target.closest('[data-pannello-apri]');
      if (apre) {
        const giaAperto = $('ssCassetto').classList.contains('ss-aperto')
          && document.querySelector('[data-pannello-corpo="' + apre.dataset.pannelloApri + '"]').classList.contains('ss-attivo');
        if (giaAperto) chiudiCassetto(); else apriCassetto(apre.dataset.pannelloApri);
      }
    });

    // Un tocco sulla missione (non sui suoi pulsanti) la apre o la chiude: sul
    // telefono il pulsante e' piccolo per un dito di bambino. Da tastiera c'e'
    // il pulsante nel titolo.
    $('ssMissione').addEventListener('click', (e) => {
      if (!e.target.closest('button')) alternaMissione();
    });

    // Esc: prima chiude il benvenuto, il pannello o il cartellino, poi esce dalla vista a tutto schermo.
    // Con un modale di shared.js aperto (.modal-overlay.open: chiuso resta nel
    // DOM, senza hidden) quell'Esc chiude solo il modale, e lo fa shared.js.
    // In cattura perche' shared.js registra il suo Esc prima di noi: in bolla
    // troveremmo il modale gia' chiuso e usciremmo anche dalla vista.
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || document.fullscreenElement) return;
      if (document.querySelector('.modal-overlay.open')) return;
      if (!$('ssBenvenuto').hidden) { chiudiBenvenuto(); return; }
      if ($('ssCassetto').classList.contains('ss-aperto')) { chiudiCassetto(); return; }
      if (immersivo() && !$('ssCartellino').hidden && !$('ssCartellino').classList.contains('ss-cart-ridotto')) {
        riduciCartellino(true);
        storageSet(KEY_CARTELLINO_RIDOTTO, '1');
        return;
      }
      if (immersivo()) impostaImmersivo(false);
    }, true);
    document.addEventListener('fullscreenchange', () => {
      const b = document.querySelector('[data-ss="schermo-intero"]');
      b.setAttribute('aria-pressed', document.fullscreenElement ? 'true' : 'false');
      misuraBasso();
    });
    window.addEventListener('resize', misuraBasso);
    // Missione e dock cambiano altezza anche senza resize (testo nuovo, il
    // contatore del passaporto che manda a capo un pulsante, la barra del
    // viaggio che compare).
    if (window.ResizeObserver) {
      const ro = new window.ResizeObserver(misuraBasso);
      document.querySelectorAll('.ss-hud-alto, .ss-hud-basso, .ss-viaggio-barra, .ss-cartellino').forEach((n) => ro.observe(n));
    }

    document.querySelectorAll('[data-filtro]').forEach((i) => {
      i.addEventListener('change', () => {
        if (!motore) return;
        if (i.dataset.filtro === 'nomi') {
          nomiAccesi = i.checked;
          motore.ridisegna();
        } else {
          motore.setFiltri({ [i.dataset.filtro]: i.checked });
        }
      });
    });

    $('ssDataInput').addEventListener('change', (e) => {
      if (!motore || !e.target.value) return;
      const [a, m, g] = e.target.value.split('-').map(Number);
      motore.setJd(motore.jdDaData(new Date(Date.UTC(a, m - 1, g, 12))));
      motore.azzeraEstetico();
      ultimaData = '';
      aggiornaData();
      aggiornaOggi();
      annuncia('Data cambiata: ' + fmtData.format(new Date(Date.UTC(a, m - 1, g, 12))) + '.');
    });
  }

  /* ------------------------------------------------------- benvenuto */

  const KEY_BENVENUTO = 'lascuolaamica_sistema_solare_benvenuto_v1';

  function mostraBenvenuto() {
    chiudiCassetto();
    const b = $('ssBenvenuto');
    b.hidden = false;
    const primo = b.querySelector('button');
    if (primo) primo.focus({ preventScroll: true });
  }

  function chiudiBenvenuto() {
    $('ssBenvenuto').hidden = true;
    storageSet(KEY_BENVENUTO, '1');
    $('ssCanvas').focus({ preventScroll: true });
  }

  /* ------------------------------------------------------- avvio */

  // Due tempi. Prima la parte di pagina che si legge (navigazione, missione,
  // benvenuto), poi, dopo un fotogramma, la scena: crearla costa il grosso
  // dell'avvio (contesto, shader, orbite), e il benvenuto non deve aspettarla.
  // fatto() arriva quando c'e' anche la scena.
  function avvia(fatto) {
    caricaTesti();
    costruisciNavigazione();
    costruisciConfronti();
    collegaBottoni();
    aggiornaPassaporto();
    prossimaMissione();
    const missioneChiusa = storageGet(KEY_MISSIONE_CHIUSA);
    const cartRidotto = storageGet(KEY_CARTELLINO_RIDOTTO);
    apriMissione(missioneChiusa ? missioneChiusa !== '1' : !telefonoVerticale());
    riduciCartellino(cartRidotto ? cartRidotto === '1' : telefonoVerticale());
    // Prima visita: due righe di benvenuto e due scelte. Poi non torna piu',
    // si puo' rivedere da Opzioni. Senza WebGL lo si richiude (avviaScena).
    const benvenuto = immersivo() && !storageGet(KEY_BENVENUTO) && 'WebGLRenderingContext' in window;
    if (benvenuto) mostraBenvenuto();
    requestAnimationFrame(() => window.setTimeout(() => {
      try {
        avviaScena(benvenuto, fatto);
      } catch (err) {
        fatto();
        throw err;
      }
    }, 0));
  }

  function avviaScena(benvenuto, fatto) {
    const canvas = $('ssCanvas');
    try {
      motore = SA.SistemaMotore.crea(canvas, DATI, {
        cartellaTexture: '/assets/sistema-solare/',
        dopoDisegno() {
          aggiornaEtichette();
          aggiornaData();
          applicaVelocita();
        }
      });
    } catch (err) {
      motore = null;
    }

    if (!motore) {
      if (benvenuto) $('ssBenvenuto').hidden = true;
      canvas.hidden = true;
      $('ssNoWebgl').hidden = false;
      $('ssAvvisoScala').hidden = true;
      document.querySelectorAll('.ss-dock, .ss-tempo, .ss-filtri, .ss-confronto').forEach((n) => { n.hidden = true; });
      // Senza scena la vista a tutto schermo non serve: si mostrano le schede.
      impostaImmersivo(false);
    } else {
      costruisciEtichette();
      collegaInput(canvas);
      motore.perdita(() => {
        canvas.hidden = true;
        $('ssNoWebgl').hidden = false;
      });
      if (document.documentElement.requestFullscreen) document.querySelector('[data-ss="schermo-intero"]').hidden = false;
      misuraBasso();
      velocitaScelta = 'auto';
      impostaModo('estetico');
      // Senza GPU la scena parte ferma: girando, ogni fotogramma terrebbe
      // occupato il processore (e la ventola) per niente.
      if (movimentoRidotto() || motore.leggero) impostaPausa(true);
      // La scena si ferma quando non si vede: niente batteria sprecata.
      if ('IntersectionObserver' in window) {
        new IntersectionObserver((voci) => {
          voci.forEach((v) => { if (v.isIntersecting) motore.avvia(); else motore.ferma(); });
        }).observe(canvas);
      } else {
        motore.avvia();
      }
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) motore.ferma(); else motore.avvia();
      });
      window.setInterval(aggiornaOggi, 1000);
    }

    const chiave = chiaveDaHash() || 'c:sole';
    if (motore && chiave === 'c:sole') motore.vistaSistema(true);
    // Il primo cartellino aspetta i testi: aperto senza, cambierebbe misura
    // quando arrivano. Se non arrivano si apre lo stesso, piu' corto.
    caricaTesti().then(() => {
      apri(chiave, { istantaneo: true, daHash: true });
      if (motore && chiave === 'c:sole') motore.vistaSistema(true);
      avviato = true;
      if (motore && motore.leggero && !movimentoRidotto()) {
        mostraToast('Questo computer disegna senza scheda grafica: i pianeti partono fermi. Premi «Muovi» per farli girare.', 9000);
      }
      // Un link interno o il tasto Indietro cambiano solo l'ancora, senza ricaricare.
      window.addEventListener('hashchange', () => {
        const k = chiaveDaHash();
        if (k && (!corrente || k !== corrente.tipo + ':' + corrente.id)) apri(k, { daHash: true });
      });
    }).finally(fatto);
  }

  function chiaveDaHash() {
    let hash = '';
    try { hash = decodeURIComponent((location.hash || '').slice(1)); } catch (_) { return null; }
    if (corpi.has(hash) && !corpi.get(hash).solo_confronto) return 'c:' + hash;
    if (sciami.has(hash)) return 's:' + hash;
    if (schede.has(hash)) return 'k:' + hash;
    return null;
  }

  // avvia() chiede a SA.motion se fermare la scena. SA.motion nasce in
  // shared.js, che come in ogni pagina arriva dopo questo file (defer, in
  // ordine): partire subito vorrebbe dire ignorare il movimento ridotto. A
  // DOMContentLoaded tutti gli script defer sono gia' stati eseguiti.
  // ss-pronta mostra l'HUD in alto (vedi sistema-solare.css), anche se l'avvio
  // si interrompe a meta': meglio un HUD fuori posto che nessun pulsante.
  // Prima si rimisura: data e missione appena scritte cambiano l'altezza della
  // riga in alto, e il cartellino gia' aperto deve stare sotto dal primo paint.
  function parti() {
    const pronta = () => {
      misuraBasso();
      $('ssScena').classList.add('ss-pronta');
    };
    try {
      avvia(pronta);
    } catch (err) {
      pronta();
      throw err;
    }
  }

  if (SA.motion || document.readyState === 'complete') parti();
  else document.addEventListener('DOMContentLoaded', parti, { once: true });
})();
