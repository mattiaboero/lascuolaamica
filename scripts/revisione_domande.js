#!/usr/bin/env node
// Revisione di qualita' delle domande (docs/PIANO-REVISIONE-DOMANDE.md).
//
// Il 07/10/2026 Mattia ha trovato in produzione «Non ho ___ soldi» con risposta
// «nessun» e due domande sugli angoli che non capiva nemmeno un adulto. Le
// revisioni fatte fin li' guardavano refusi e numeri, a campione, e chi
// scriveva approvava. Qui ogni domanda attiva passa da due lettori diversi:
// uno risponde senza conoscere la soluzione, l'altro applica la rubrica. Il
// confronto lo fa questo script, non un modello.
//
// Il registro lega il verdetto all'impronta del testo: se la domanda cambia
// anche di una virgola il verdetto decade.
//
//   node scripts/revisione_domande.js check [--materia m]
//   node scripts/revisione_domande.js leggibilita [--materia m] [--tutte]
//   node scripts/revisione_domande.js lotto [--materia m] [--classe n] [--n 40] [--lotti k] [--nome x]
//   node scripts/revisione_domande.js lotto --ids a,b,c --nome x
//   node scripts/revisione_domande.js lotto --per-materia 15 [--includi a,b] [--seme 1] --nome x
//   node scripts/revisione_domande.js lotto --in-revisione [--materia m] --nome x
//   node scripts/revisione_domande.js verdetti <lotto> [<lotto> ...]
//   node scripts/revisione_domande.js riscritture <lotto> [<lotto> ...] [--prova]
//   node scripts/revisione_domande.js raccogli <lotto-nuovo> <lotto> [<lotto> ...]
//   node scripts/revisione_domande.js rapporto <file.md> --lotti a,b,c | --materia m [--titolo t]

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'json');
const REGISTRO = path.join(ROOT, 'reports', 'revisione-qualita.json');
const LOTTI = path.join(ROOT, 'reports', 'revisione-lotti');

const MAX_ENUNCIATO = { 1: 20, 2: 20, 3: 25, 4: 30, 5: 30 };
const MAX_BRANO = 45;
const BRANO = /\b(Leggi|Read)\b[^:]{0,40}:/i;
// Due tentativi di riscrittura falliti dopo la prima lettura: alla terza
// bocciatura la domanda si spegne.
const MAX_GIRI = 3;
// Opzioni in serie: sotto SERIE_MIN domande per materia e classe non si giudica.
const SERIE_MIN = 20;
const SERIE_QUOTA = 0.4;

const [comando, ...resto] = process.argv.slice(2);
const opz = {};
const pos = [];
for (let i = 0; i < resto.length; i += 1) {
  if (resto[i].startsWith('--')) {
    const valore = resto[i + 1] !== undefined && !resto[i + 1].startsWith('--');
    opz[resto[i].slice(2)] = valore ? resto[i += 1] : true;
  } else {
    pos.push(resto[i]);
  }
}

const leggi = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
// 1 spazio, nessun a capo finale: e' il formato di json/*.json.
const scrivi = (file, dati) => fs.writeFileSync(file, JSON.stringify(dati, null, 1));
const lista = (v) => String(v || '').split(',').map((s) => s.trim()).filter(Boolean);
const parole = (s) => String(s || '').trim().split(/\s+/).filter(Boolean).length;

function caricaDomande() {
  const dati = {};
  for (const f of fs.readdirSync(DIR).filter((n) => n.endsWith('.json')).sort()) {
    if (f === 'index.json' || f === 'changelog.json') continue;
    dati[f] = leggi(path.join(DIR, f));
  }
  return dati;
}

const tutte = (dati) => Object.values(dati).flatMap((d) => d.questions);
const salvaDomande = (dati) => Object.entries(dati).forEach(([f, d]) => scrivi(path.join(DIR, f), d));
const leggiRegistro = () => (fs.existsSync(REGISTRO) ? leggi(REGISTRO) : {});

function impronta(q) {
  const testo = JSON.stringify([q.class, q.question, q.options, q.answerIndex, q.explanation]);
  return crypto.createHash('sha1').update(testo).digest('hex').slice(0, 12);
}

function promossa(reg, q) {
  const r = reg[q.id];
  return Boolean(r && r.hash === impronta(q) && (r.esito === 'ok' || r.esito === 'riscritta'));
}

function sforamenti(q) {
  const fuori = [];
  const maxEnunciato = BRANO.test(q.question) ? MAX_BRANO : MAX_ENUNCIATO[q.class];
  const n = parole(q.question);
  if (n > maxEnunciato) fuori.push(`enunciato di ${n} parole (massimo ${maxEnunciato} in ${q.class}ª)`);
  const maxOpzione = q.class <= 3 ? 8 : 12;
  q.options.forEach((o) => {
    if (parole(o) > maxOpzione) fuori.push(`opzione di ${parole(o)} parole (massimo ${maxOpzione}): «${o}»`);
  });
  // Sotto le 4 parole il confronto non dice niente: «100» contro «5» non e'
  // un indizio.
  const giusta = parole(q.options[q.answerIndex]);
  const altre = q.options.filter((_, i) => i !== q.answerIndex).map(parole);
  const media = altre.reduce((a, b) => a + b, 0) / altre.length;
  if (giusta >= 4 && giusta > 2 * media) {
    fuori.push(`la risposta giusta ha ${giusta} parole, i distrattori in media ${media.toFixed(1)}`);
  }
  return fuori;
}

function casuale(seme) {
  let s = seme >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function mescola(arr, rnd) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function fine(messaggio) {
  console.error(`[ERROR] ${messaggio}`);
  process.exit(1);
}

function cmdCheck() {
  const reg = leggiRegistro();
  const conti = {};
  for (const q of tutte(caricaDomande())) {
    if (opz.materia && q.subject !== opz.materia) continue;
    const c = conti[q.subject] = conti[q.subject] || { promosse: 0, spente: 0, sospese: 0 };
    if (q.active === false) {
      if (reg[q.id] && reg[q.id].esito === 'spenta') c.spente += 1;
    } else if (promossa(reg, q)) {
      c.promosse += 1;
    } else {
      c.sospese += 1;
    }
  }
  const tot = { promosse: 0, spente: 0, sospese: 0 };
  for (const [materia, c] of Object.entries(conti)) {
    console.log(`REVISIONE ${materia}: promosse ${c.promosse}, spente ${c.spente}, in sospeso ${c.sospese}`);
    Object.keys(tot).forEach((k) => { tot[k] += c[k]; });
  }
  if (!opz.materia) console.log(`REVISIONE TOTALE: promosse ${tot.promosse}, spente ${tot.spente}, in sospeso ${tot.sospese}`);
  const errori = [];
  if (tot.sospese > 0) errori.push(`${tot.sospese} domande attive senza un verdetto valido sul testo corrente.`);
  const serie = opzioniInSerie(tutte(caricaDomande()).filter((q) => q.active !== false && (!opz.materia || q.subject === opz.materia)));
  if (serie.length) errori.push(`opzioni in serie, si indovina senza fare il conto:\n  ${serie.join('\n  ')}`);
  if (errori.length) fine(errori.join('\n'));
}

// Il difetto trovato in matematica nell'ottobre 2026: quattro numeri
// consecutivi come opzioni, con la giusta quasi sempre sul piu' grande. Una
// domanda sola puo' essere legittima («Quanti lati ha un quadrato?»): conta la
// quota per materia e classe.
function opzioniInSerie(domande) {
  const numero = (s) => {
    const m = String(s).trim().match(/^(\d{1,3}(?:\.\d{3})+|\d+)(?:\s?[^\d\s,.][^\d]*)?$/);
    return m ? Number(m[1].replace(/\./g, '')) : null;
  };
  const gruppi = {};
  for (const q of domande) {
    const n = q.options.map(numero);
    if (n.some((x) => x === null)) continue;
    const s = [...n].sort((a, b) => a - b);
    if (s[1] - s[0] !== 1 || s[2] - s[1] !== 1 || s[3] - s[2] !== 1) continue;
    const g = gruppi[`${q.subject} ${q.class}ª`] = gruppi[`${q.subject} ${q.class}ª`] || { tot: 0, max: 0, min: 0 };
    g.tot += 1;
    if (n[q.answerIndex] === s[3]) g.max += 1;
    if (n[q.answerIndex] === s[0]) g.min += 1;
  }
  const fuori = [];
  for (const [nome, g] of Object.entries(gruppi)) {
    if (g.tot < SERIE_MIN) continue;
    if (g.max / g.tot > SERIE_QUOTA) fuori.push(`${nome}: in ${g.max} domande su ${g.tot} con opzioni consecutive la giusta e' il numero piu' grande`);
    if (g.min / g.tot > SERIE_QUOTA) fuori.push(`${nome}: in ${g.min} domande su ${g.tot} con opzioni consecutive la giusta e' il numero piu' piccolo`);
  }
  return fuori;
}

function cmdLeggibilita() {
  const perMateria = {};
  for (const q of tutte(caricaDomande())) {
    if (q.active === false || (opz.materia && q.subject !== opz.materia)) continue;
    const fuori = sforamenti(q);
    if (fuori.length) (perMateria[q.subject] = perMateria[q.subject] || []).push({ q, fuori });
  }
  let totale = 0;
  for (const [materia, righe] of Object.entries(perMateria)) {
    totale += righe.length;
    console.log(`LEGGIBILITA ${materia}: ${righe.length} domande fuori misura`);
    righe.slice(0, opz.tutte ? righe.length : 3).forEach(({ q, fuori }) => console.log(`  [${q.id}] ${fuori.join('; ')}`));
  }
  if (totale > 0) fine(`${totale} domande fuori misura${opz.tutte ? '' : ' (--tutte le elenca)'}.`);
  console.log('leggibilita: nessuna domanda fuori misura.');
}

function scegliPerMateria(sospese, k) {
  const rnd = casuale(Number(opz.seme) || 1);
  const forzate = new Set(lista(opz.includi));
  const scelte = [];
  for (const materia of [...new Set(sospese.map((q) => q.subject))].sort()) {
    const gruppo = sospese.filter((q) => q.subject === materia);
    const prese = gruppo.filter((q) => forzate.has(q.id));
    const perClasse = {};
    mescola(gruppo.filter((q) => !forzate.has(q.id)), rnd).forEach((q) => (perClasse[q.class] = perClasse[q.class] || []).push(q));
    const classi = Object.keys(perClasse).sort();
    for (let i = 0; prese.length < k && classi.some((c) => perClasse[c].length); i += 1) {
      const q = perClasse[classi[i % classi.length]].shift();
      if (q) prese.push(q);
    }
    scelte.push(...prese);
  }
  return scelte;
}

function cmdLotto() {
  const reg = leggiRegistro();
  let sospese = tutte(caricaDomande()).filter((q) => q.active !== false && !promossa(reg, q));
  if (opz.materia) sospese = sospese.filter((q) => q.subject === opz.materia);
  if (opz.classe) sospese = sospese.filter((q) => q.class === Number(opz.classe));
  // Le bocciate aspettano lo scrittore e le riscritte aspettano la rilettura:
  // non devono rientrare in un lotto nuovo come se nessuno le avesse lette.
  const inLavorazione = (q) => ['bocciata', 'in revisione'].includes((reg[q.id] || {}).esito);
  let scelte = sospese.filter((q) => !inLavorazione(q));
  let quanti = Number(opz.lotti) || 1;
  if (opz['in-revisione']) {
    scelte = sospese.filter((q) => (reg[q.id] || {}).esito === 'in revisione');
    quanti = Infinity;
  } else if (opz.ids) {
    const ids = new Set(lista(opz.ids));
    scelte = sospese.filter((q) => ids.has(q.id));
    quanti = Infinity;
  } else if (opz['per-materia']) {
    scelte = scegliPerMateria(sospese, Number(opz['per-materia']));
    quanti = Infinity;
  }
  const n = Number(opz.n) || 40;
  const base = opz.nome || `${opz.materia || 'misto'}-${opz.classe || 'x'}`;
  let progressivo = 1;
  for (let i = 0; i < scelte.length && i / n < quanti; i += n) {
    while (fs.existsSync(path.join(LOTTI, `${base}-${progressivo}`))) progressivo += 1;
    const dir = path.join(LOTTI, `${base}-${progressivo}`);
    fs.mkdirSync(dir, { recursive: true });
    const fetta = scelte.slice(i, i + n);
    const cieca = (q) => ({
      id: q.id, subject: q.subject, class: q.class, question: q.question, options: q.options,
      ...(q.figureAlt ? { figureAlt: q.figureAlt } : {})
    });
    scrivi(path.join(dir, 'bambino.json'), fetta.map(cieca));
    scrivi(path.join(dir, 'maestra.json'), fetta.map((q) => ({
      ...cieca(q), subarea: q.subarea, answerIndex: q.answerIndex, explanation: q.explanation,
      ...(q.answerLang ? { answerLang: q.answerLang } : {}), hash: impronta(q)
    })));
    console.log(`lotto ${base}-${progressivo}: ${fetta.length} domande in ${path.relative(ROOT, dir)}`);
  }
  if (!scelte.length) console.log('nessuna domanda in sospeso con questi filtri.');
}

function cartellaLotto(nome) {
  if (!nome) fine('manca il nome del lotto.');
  const dir = path.join(LOTTI, nome);
  if (!fs.existsSync(dir)) fine(`lotto non trovato: ${nome}`);
  return dir;
}

function cmdVerdetti(nome) {
  const dir = cartellaLotto(nome);
  const lotto = leggi(path.join(dir, 'maestra.json'));
  const indice = (file) => Object.fromEntries(leggi(path.join(dir, file)).map((v) => [v.id, v]));
  const bambino = indice('bambino-out.json');
  const maestra = indice('maestra-out.json');
  const mancanti = lotto.filter((x) => !bambino[x.id] || !maestra[x.id]).map((x) => x.id);
  if (mancanti.length) fine(`verdetti mancanti per: ${mancanti.join(', ')}`);
  // Un risolutore che sbaglia a contare gli indici boccia domande buone: il
  // testo dell'opzione scelta deve coincidere con l'indice dichiarato.
  const incoerenti = lotto.filter((x) => bambino[x.id].risposta >= 0 && bambino[x.id].scelta !== x.options[bambino[x.id].risposta]);
  if (incoerenti.length) {
    console.error(`[ERROR] verdetti ${nome}: ${incoerenti.length} risposte alla cieca con indice e testo che non coincidono. Lotto non registrato: va riletto da un altro risolutore.`);
    process.exitCode = 1;
    return;
  }

  const dati = caricaDomande();
  const perId = new Map(tutte(dati).map((q) => [q.id, q]));
  const reg = leggiRegistro();
  const daRiscrivere = [];
  const conti = { promosse: 0, bocciate: 0, spente: 0, saltate: 0, dubbie: 0 };
  for (const x of lotto) {
    const q = perId.get(x.id);
    if (!q || impronta(q) !== x.hash) { conti.saltate += 1; continue; }
    const b = bambino[x.id];
    const m = maestra[x.id];
    const motivi = [];
    if (b.risposta !== q.answerIndex) {
      motivi.push(`alla cieca: ${b.risposta >= 0 ? `scelta «${q.options[b.risposta]}»` : 'nessuna opzione giusta'}`);
    }
    if (b.capita === false) motivi.push('alla cieca: richiesta non capita');
    if ((b.parole_difficili || []).length) motivi.push(`parole difficili: ${b.parole_difficili.join(', ')}`);
    if ((b.altre_giuste || []).length) {
      motivi.push(`difendibili anche: ${b.altre_giuste.map((i) => `«${q.options[i]}»`).join(', ')}`);
    }
    if (motivi.length && b.nota) motivi.push(`nota alla cieca: ${b.nota}`);
    if (m.esito !== 'ok') motivi.push(`maestra: ${m.esito} ${(m.criteri || []).join(', ')}. ${m.nota || ''}`.trim());
    motivi.push(...sforamenti(q));

    const prec = reg[q.id] || {};
    // Se l'unico motivo e' la risposta alla cieca diversa dalla chiave, con la
    // maestra d'accordo sulla chiave, puo' aver sbagliato il risolutore (in due
    // lotti aveva disallineato le risposte). La domanda torna in rilettura una
    // volta sola, da lettori nuovi, senza passare dallo scrittore.
    const soloCieca = motivi.length > 0 && m.esito === 'ok' && motivi.every((t) => /^(alla cieca: scelta|nota alla cieca)/.test(t));
    if (soloCieca && !prec.dubbi) {
      reg[q.id] = { ...prec, hash: x.hash, esito: 'in revisione', dubbi: 1, giri: prec.giri || 0 };
      conti.dubbie += 1;
      continue;
    }
    const voce = { hash: x.hash, bambino: { risposta: b.risposta }, maestra: { esito: m.esito }, giri: (prec.giri || 0) + 1 };
    if (prec.prima) voce.prima = prec.prima;
    if (prec.storia) voce.storia = prec.storia;
    if (!motivi.length) {
      voce.esito = prec.prima ? 'riscritta' : 'ok';
      conti.promosse += 1;
    } else {
      voce.storia = [...(voce.storia || []), motivi];
      if (voce.giri >= MAX_GIRI) {
        voce.esito = 'spenta';
        q.active = false;
        conti.spente += 1;
      } else {
        voce.esito = 'bocciata';
        conti.bocciate += 1;
        daRiscrivere.push({ ...x, motivi, suggerimento_maestra: m.esito });
      }
    }
    reg[q.id] = voce;
  }
  scrivi(REGISTRO, reg);
  if (conti.spente) salvaDomande(dati);
  scrivi(path.join(dir, 'da-riscrivere.json'), daRiscrivere);
  console.log(`verdetti ${nome}: promosse ${conti.promosse}, da riscrivere ${conti.bocciate}, spente ${conti.spente}, da rileggere ${conti.dubbie}, saltate ${conti.saltate}`);
}

function cmdRiscritture(nome) {
  const dir = cartellaLotto(nome);
  const proposte = leggi(path.join(dir, 'scrittore-out.json'));
  const attese = new Set(leggi(path.join(dir, 'da-riscrivere.json')).map((x) => x.id));
  const dati = caricaDomande();
  const perId = new Map(tutte(dati).map((q) => [q.id, q]));
  const reg = leggiRegistro();
  const errori = [];
  for (const p of proposte) {
    const q = perId.get(p.id);
    if (!q || !attese.has(p.id)) { errori.push(`${p.id}: non e' tra le domande da riscrivere`); continue; }
    if (p.spegni) continue;
    const o = p.options;
    if (!Array.isArray(o) || o.length !== 4 || new Set(o.map((s) => String(s).trim().toLowerCase())).size !== 4) {
      errori.push(`${p.id}: servono 4 opzioni diverse`);
      continue;
    }
    if (p.answerIndex !== q.answerIndex) errori.push(`${p.id}: la risposta giusta deve restare in posizione ${q.answerIndex}`);
    if (!p.question || !p.explanation) errori.push(`${p.id}: mancano enunciato o spiegazione`);
    sforamenti({ ...q, ...p }).forEach((s) => errori.push(`${p.id}: ${s}`));
  }
  const fatte = new Set(proposte.map((p) => p.id));
  [...attese].filter((id) => !fatte.has(id)).forEach((id) => errori.push(`${id}: manca la riscrittura`));
  if (errori.length) fine(`riscritture rifiutate, nessun file toccato:\n  ${errori.join('\n  ')}`);
  // --prova serve agli scrittori che lavorano in parallelo: json/ e registro
  // li scrive una mano sola, dopo.
  if (opz.prova) { console.log(`riscritture ${nome}: ${proposte.length} valide, niente applicato (--prova)`); return; }

  let riscritte = 0;
  let spente = 0;
  for (const p of proposte) {
    const q = perId.get(p.id);
    const voce = reg[p.id];
    if (!voce.prima) {
      voce.prima = { question: q.question, options: q.options, answerIndex: q.answerIndex, explanation: q.explanation };
    }
    if (p.spegni) {
      q.active = false;
      voce.esito = 'spenta';
      voce.storia.push([`scrittore: ${p.motivo || 'non recuperabile'}`]);
      spente += 1;
    } else {
      q.question = p.question;
      q.options = p.options;
      q.answer = p.options[p.answerIndex];
      q.explanation = p.explanation;
      voce.esito = 'in revisione';
      riscritte += 1;
    }
  }
  salvaDomande(dati);
  scrivi(REGISTRO, reg);
  console.log(`riscritture ${nome}: riscritte ${riscritte}, spente ${spente}`);
}

// Le bocciate al secondo giro sono poche per lotto: raccolte in un lotto solo
// le riscrive un unico scrittore, e rientrano nel giro di rilettura seguente.
function cmdRaccogli() {
  const [dest, ...lotti] = pos;
  const tutteLe = lotti.flatMap((nome) => leggi(path.join(cartellaLotto(nome), 'da-riscrivere.json')));
  if (!tutteLe.length) { console.log('raccogli: niente da riscrivere.'); return; }
  fs.mkdirSync(path.join(LOTTI, dest), { recursive: true });
  scrivi(path.join(LOTTI, dest, 'da-riscrivere.json'), tutteLe);
  console.log(`raccogli ${dest}: ${tutteLe.length} domande da riscrivere`);
}

function cmdRapporto() {
  if (!pos[0]) fine('manca il file di destinazione.');
  const perId = new Map(tutte(caricaDomande()).map((q) => [q.id, q]));
  const reg = leggiRegistro();
  const ids = opz.materia
    ? Object.keys(reg).filter((id) => perId.get(id).subject === opz.materia)
    : lista(opz.lotti).flatMap((nome) => leggi(path.join(LOTTI, nome, 'maestra.json')).map((x) => x.id));
  const blocco = (q) => [
    q.question,
    '',
    ...q.options.map((o, i) => `- ${i === q.answerIndex ? '**' + o + '** ✓' : o}`),
    '',
    `*Spiegazione:* ${q.explanation}`
  ].join('\n');
  const gruppi = { ok: [], riscritta: [], spenta: [], altro: [] };
  for (const id of [...new Set(ids)]) {
    const esito = (reg[id] || {}).esito;
    (gruppi[esito] || gruppi.altro).push(id);
  }
  const campione = mescola(gruppi.ok, casuale(Number(opz.seme) || 1)).slice(0, 40);
  const titolo = (id) => `### ${id} · ${perId.get(id).subject} ${perId.get(id).class}ª`;
  const motivi = (id) => (reg[id].storia || []).map((giro, i) => `- giro ${i + 1}: ${giro.join(' · ')}`).join('\n');
  const out = [
    `# ${opz.titolo || 'Revisione delle domande'}`,
    '',
    `Domande lette: ${new Set(ids).size}. Promosse senza modifiche: ${gruppi.ok.length}. Riscritte e ripromosse: ${gruppi.riscritta.length}. Spente: ${gruppi.spenta.length}. Ancora aperte: ${gruppi.altro.length}.`,
    '',
    `## Promosse senza modifiche (${campione.length} a caso su ${gruppi.ok.length})`,
    '',
    ...campione.map((id) => `${titolo(id)}\n\n${blocco(perId.get(id))}\n`),
    `## Riscritte (${gruppi.riscritta.length})`,
    '',
    ...gruppi.riscritta.map((id) => `${titolo(id)}\n\n**Prima**\n\n${blocco(reg[id].prima)}\n\n**Perché è stata bocciata**\n\n${motivi(id)}\n\n**Ora**\n\n${blocco(perId.get(id))}\n`),
    `## Spente (${gruppi.spenta.length})`,
    '',
    ...gruppi.spenta.map((id) => `${titolo(id)}\n\n${blocco(reg[id].prima || perId.get(id))}\n\n**Perché**\n\n${motivi(id)}\n`),
    `## Ancora aperte (${gruppi.altro.length})`,
    '',
    ...gruppi.altro.map((id) => `- ${id}: ${(reg[id] || {}).esito || 'mai letta'}`)
  ];
  fs.writeFileSync(path.resolve(pos[0]), out.join('\n') + '\n');
  console.log(`rapporto scritto in ${pos[0]}`);
}

const comandi = {
  check: cmdCheck,
  leggibilita: cmdLeggibilita,
  lotto: cmdLotto,
  verdetti: () => pos.forEach(cmdVerdetti),
  riscritture: () => pos.forEach(cmdRiscritture),
  raccogli: cmdRaccogli,
  rapporto: cmdRapporto
};
if (!comandi[comando]) fine(`comando sconosciuto: ${comando || '(nessuno)'}. Disponibili: ${Object.keys(comandi).join(', ')}`);
comandi[comando]();
