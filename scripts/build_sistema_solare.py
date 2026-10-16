#!/usr/bin/env python3
"""Genera js/sistema-solare-dati.js per la pagina /sistema-solare e, nella
pagina, le parti di testo statico che leggono i motori di ricerca e chi non ha
JavaScript (schede, domande frequenti, crediti: vedi scrivi_pagina).

Fonti (in docs/sistema-solare/, ognuna con gli URL consultati):
- dati.json     dati fisici e testi per i bambini (NASA NSSDC, JPL SSD, IAU...)
- orbite.json   elementi orbitali (Standish, JPL SBDB, JPL Horizons) e poli IAU
- texture.json  mappe di superficie scaricate in assets/sistema-solare/
- faq.json      domande frequenti della pagina, con le fonti

Questo script non aggiunge numeri: copia, sceglie quale fonte usare per ogni
corpo e fa solo due calcoli dichiarati qui sotto (raggio di Schwarzschild e
anomalia media di partenza delle lune). Uso:

    python3 scripts/build_sistema_solare.py          # scrive i file
    python3 scripts/build_sistema_solare.py --check  # esce 1 se non sono aggiornati
"""
import html
import json
import pathlib
import re
import sys

RADICE = pathlib.Path(__file__).resolve().parent.parent
DOCS = RADICE / 'docs' / 'sistema-solare'
USCITA = RADICE / 'js' / 'sistema-solare-dati.js'
PAGINA = RADICE / 'sistema-solare.html'

G = 6.67430e-11        # CODATA 2018
C = 299792458.0        # m/s, esatto

GIGANTI = {'giove', 'saturno', 'urano', 'nettuno'}
FILE_TRAIETTORIE = 'voyager-traiettorie-v1.json'

# Opacita' con cui si disegna ogni anello. E' una scelta di disegno, non un
# dato: segue solo l'ordine vero di densita' (profondita' ottica) degli anelli,
# dal B di Saturno, quasi opaco, fino a quelli di Giove e all'anello E, che a
# occhio sarebbero invisibili. Gli anelli stretti (raggio interno = esterno)
# sono disegnati come una linea sottile, senza una larghezza inventata.
ALFA_ANELLI = {
    ('saturno', 'Anello B'): 0.85, ('saturno', 'Anello A'): 0.7, ('saturno', 'Anello C'): 0.35,
    ('saturno', 'Divisione di Cassini'): 0.08, ('saturno', 'Anello D'): 0.06,
    ('saturno', 'Anello F'): 0.5, ('saturno', 'Anello G'): 0.05, ('saturno', 'Anello E'): 0.03,
    ('giove', 'Anello principale'): 0.12,
    ('nettuno', 'Galle'): 0.05, ('nettuno', 'Lassell'): 0.05,
    ('haumea', 'Anello'): 0.3,
}
ALFA_ANELLI_DEFAULT = {'giove': 0.03, 'urano': 0.5, 'nettuno': 0.4}
ALFA_ANELLI.update({('urano', 'Nu'): 0.12, ('urano', 'Mu'): 0.08})


def carica(nome):
    p = DOCS / nome
    return json.loads(p.read_text(encoding='utf-8')) if p.exists() else {}


def orbita_pianeta(o):
    def coppia(k):
        return [o[k]['valore'], o[k]['tasso_per_secolo']]
    return {
        'tipo': 'standish',
        'a': coppia('a'), 'e': coppia('e'), 'I': coppia('I'), 'L': coppia('L'),
        'wbar': coppia('long_peri'), 'node': coppia('long_node'),
    }


def orbita_minore(o):
    n = o.get('n_deg_giorno') or 360.0 / o['periodo_giorni']
    # Per le comete il tempo del perielio e' il riferimento piu' stabile:
    # all'istante tp l'anomalia media e' zero.
    if o.get('tipo') == 'cometa' and o.get('tp_jd_tdb'):
        epoca, M = o['tp_jd_tdb'], 0.0
    else:
        epoca, M = o['epoca_jd_tdb'], o['ma_deg']
    return {'tipo': 'kepler', 'epoca': epoca, 'a': o['a_au'], 'e': o['e'], 'i': o['i_deg'],
            'node': o['om_deg'], 'w': o['w_deg'], 'M': M, 'n': n}


def orbita_luna(o):
    """Elementi osculanti JPL Horizons in eclittica J2000 attorno al pianeta,
    all'epoca piu' vicina a oggi. Il moto medio viene dal periodo medio JPL
    (piu' stabile dell'osculante per propagare nel tempo); se manca, da Horizons."""
    h = o.get('horizons_osculanti_eclittica_j2000') or {}
    el = h.get('epoca_2461000.5') or h.get('epoca_j2000')
    # Lune dei corpi minori (Disnomia): gli osculanti Horizons in eclittica
    # stanno direttamente nella voce.
    if not el and o.get('piano_riferimento') == 'ecliptic':
        el = o.get('epoca_2461000.5') or o.get('dopo_impatto')
    if not el:
        return None
    # Dimorphos: dopo l'impatto di DART conta il periodo misurato, non quello
    # osculante (Didymos non e' sferico e l'osculante sbaglia di ~20 minuti).
    if o.get('periodo_dopo_giorni_osservato'):
        return {'tipo': 'luna', 'piano': 'eclittica', 'epoca': el['epoca_jd_tdb'],
                'a': el['a_km'], 'e': el['e'], 'i': el['i_deg'], 'node': el['node_deg'],
                'w': el['w_deg'], 'M': el['M_deg'], 'n': 360.0 / o['periodo_dopo_giorni_osservato']}
    if not el:
        return None
    periodo = o.get('periodo_giorni') or el.get('periodo_giorni')
    return {'tipo': 'luna', 'piano': 'eclittica', 'epoca': el['epoca_jd_tdb'],
            'a': el['a_km'], 'e': el['e'], 'i': el['i_deg'], 'node': el['node_deg'],
            'w': el['w_deg'], 'M': el['M_deg'], 'n': 360.0 / periodo}


def orbita_iss(iss):
    """Orbita della ISS dal TLE (CelesTrak) consultato in docs/sistema-solare/iss.json.

    Gli elementi del TLE sono riferiti all'equatore terrestre, con il nodo
    misurato dall'equinozio: nel motore e' il piano con polo RA -90°, Dec 90°
    (asse x sull'equinozio). Lo schiacciamento della Terra (J2) fa ruotare il
    piano dell'orbita di circa 5° al giorno verso ovest:
        dOmega/dt = -3/2 * n * J2 * (Re / p)^2 * cos i,   p = a (1 - e^2)
    con J2 = 1,08263e-3, Re = 6378,137 km e mu = 398600,4418 km^3/s^2
    (costanti WGS-84 / EGM). La posizione resta comunque indicativa: il TLE
    vale bene pochi giorni (resistenza dell'aria, rialzi di quota).
    """
    import math
    t = iss['posizione_e_tle']['tle_di_riferimento']
    el = t['elementi']
    riga1 = t['righe'][1]
    anno = 2000 + int(riga1[18:20])
    giorno = float(riga1[20:32])
    # Giorno giuliano del 1° gennaio alle 0h UT (formula di Vallado per M = 1,
    # D = 1), poi il giorno dell'anno del TLE (che parte da 1,0).
    jd_1gen = 367 * anno - (7 * anno) // 4 + (275 * 1) // 9 + 1 + 1721013.5
    epoca = jd_1gen + giorno - 1
    n_giro = el['moto_medio_giri_giorno']
    n_rad_s = n_giro * 2 * math.pi / 86400
    mu, re, j2 = 398600.4418, 6378.137, 1.08263e-3
    a = (mu / n_rad_s ** 2) ** (1 / 3)
    e = el['eccentricita']
    p = a * (1 - e * e)
    i = math.radians(el['inclinazione_gradi'])
    nodo_rate = -1.5 * n_rad_s * j2 * (re / p) ** 2 * math.cos(i)
    return {'tipo': 'luna', 'piano': {'ra': -90, 'dec': 90}, 'epoca': epoca, 'a': a, 'e': e,
            'i': el['inclinazione_gradi'], 'node': el['RAAN_gradi'], 'w': el['argomento_perigeo_gradi'],
            'M': el['anomalia_media_gradi'], 'n': n_giro * 360, 'nodoRate': math.degrees(nodo_rate) * 86400,
            'scalaVera': True}


def polo(p):
    if not p or p.get('alpha0') is None or p.get('Wdot') is None:
        return None
    return {'ra0': p['alpha0'], 'ra1': p.get('alpha1') or 0, 'dec0': p['delta0'],
            'dec1': p.get('delta1') or 0, 'W0': p['W0'], 'Wd': p['Wdot']}


def main():
    dati = carica('dati.json')
    orb = carica('orbite.json')
    tex = carica('texture.json')
    if not dati or not orb:
        sys.exit('[ERROR] mancano docs/sistema-solare/dati.json o orbite.json')

    corpi = []
    for d in dati['corpi']:
        cid = d['id']
        c = {'id': cid, 'nome': d['nome'], 'tipo': d['tipo'], 'genitore': d.get('genitore'),
             'raggio_km': d['raggio_medio_km']}
        if d.get('assi_km'):
            c['assi_km'] = d['assi_km'] if d.get('assi_tipo', 'diametri') == 'diametri' else [x * 2 for x in d['assi_km']]
        if cid == 'iss':
            iss = carica('iss.json')
            c['orbita'] = orbita_iss(iss)
            # Prima del primo modulo la ISS non c'era (serve al film delle Voyager).
            c['dal'] = iss['primo_modulo']['valore']
            mod = carica('iss-modello.json')
            if mod:
                c['modello'] = {'file': mod['file'], 'vertici': mod['vertici'], 'tavolozza': mod['tavolozza']}
                c['tex_credito'] = mod['credito']
        elif cid in orb.get('pianeti', {}):
            c['orbita'] = orbita_pianeta(orb['pianeti'][cid])
        elif cid in orb.get('minori', {}):
            c['orbita'] = orbita_minore(orb['minori'][cid])
        elif cid in orb.get('lune', {}):
            o = orbita_luna(orb['lune'][cid])
            if o:
                c['orbita'] = o
        if c.get('orbita') and c['orbita']['tipo'] in ('standish', 'kepler'):
            a = c['orbita']['a']
            c['distanza_ua'] = a[0] if isinstance(a, list) else a
        p = polo(orb.get('poli', {}).get(cid))
        if p and not d.get('rotazione_sincrona'):
            c['polo'] = p
        if d.get('rotazione_sincrona'):
            c['sincrona'] = True
        if d.get('anelli_km'):
            c['anelli'] = []
            for r in d['anelli_km']:
                voce = {'nome': r['nome'], 'interno_km': r['interno_km'], 'esterno_km': r['esterno_km'],
                        'alfa': ALFA_ANELLI.get((cid, r['nome']), ALFA_ANELLI_DEFAULT.get(cid, 0.3))}
                c['anelli'].append(voce)
        t = tex.get(cid)
        if t and t.get('file'):
            c['tex'] = t['file']
            c['tex_lon_centro'] = t.get('lon_centro', 0)
        if t and t.get('colore'):
            c['colore'] = t['colore']
        if t:
            c['tex_credito'] = t['credito']
            c['tex_tipo'] = t.get('tipo')
        # Il Sole si disegna giallo-arancione (scelta di Mattia, 16/10/2026: come
        # la miniatura del menu). La scheda dice che la sua luce e' bianca e che
        # il giallo e' un effetto dell'aria (NASA Space Place, "What color is the
        # Sun?"). Il colore qui serve solo alle miniature senza mappa.
        if d['tipo'] == 'stella':
            c['colore'] = [1.0, 0.72, 0.28]
        scheda = dict(d)
        scheda['superficie_solida'] = not (cid in GIGANTI or d['tipo'] == 'stella')
        c['scheda'] = scheda
        corpi.append(c)

    # Buco nero per il confronto: raggio dell'orizzonte (Schwarzschild,
    # r = 2GM/c^2) calcolato dalla massa di Sagittarius A* citata nella scheda.
    bn = next((s for s in dati.get('schede', []) if s['id'] == 'buco-nero'), None)
    sole = next(c for c in dati['corpi'] if c['id'] == 'sole')
    sgr = (bn or {}).get('dati', {}).get('sagittarius_a_star', {})
    if sgr.get('massa_masse_solari_valore'):
        massa = sgr['massa_masse_solari_valore'] * sole['massa_kg']
        r_km = 2 * G * massa / C ** 2 / 1000
        corpi.append({'id': 'sgr-a', 'nome': 'Sagittarius A*', 'tipo': 'buco-nero', 'genitore': None,
                      'raggio_km': r_km, 'solo_confronto': True,
                      'scheda': {'id': 'sgr-a', 'nome': 'Sagittarius A*', 'raggio_medio_km': r_km,
                                 'descrizione': bn['testo'], 'fonti': bn.get('fonti', [])}})

    # Sonde Voyager (docs/sistema-solare/voyager.json, rivisto in
    # revisione-voyager.json): corpi senza orbita, con la traiettoria vera che
    # la pagina scarica a parte. Scia bianca per Voyager 1, azzurra per Voyager 2.
    voy = carica('voyager.json')
    film = None
    if voy:
        mod = carica('voyager-modello.json')
        colori = {'voyager-1': [1.0, 1.0, 1.0], 'voyager-2': [0.55, 0.85, 1.0]}
        for v in voy['sonde']:
            c = {'id': v['id'], 'nome': v['nome'], 'tipo': 'sonda', 'genitore': 'sole',
                 # Raggio: meta' dell'antenna (3,66 m). Serve solo alle proporzioni.
                 'raggio_km': v['antenna_parabolica_diametro_m'] / 2000,
                 'colore_scia': colori[v['id']], 'traiettoria': FILE_TRAIETTORIE}
            if mod:
                c['modello'] = {'file': mod['file'], 'vertici': mod['vertici'], 'tavolozza': mod['tavolozza']}
                c['tex_credito'] = mod['credito']
            scheda = dict(v)
            scheda['descrizione'] = v['descrizione_bambini']
            scheda['raggio_medio_km'] = c['raggio_km']
            c['scheda'] = scheda
            corpi.append(c)
        traiettoria = carica('voyager-traiettoria.json')
        eventi = (traiettoria or {}).get('eventi', {})
        film = {'capitoli': voy['capitoli'], 'disco_d_oro': voy['meta'].get('disco_d_oro'),
                'pale_blue_dot': voy['meta'].get('pale_blue_dot'), 'eventi': eventi,
                'foto': carica('voyager-foto.json')}

    fasce = []
    for f in dati.get('fasce', []):
        fasce.append({'id': f['id'], 'da': f['da_ua'], 'a': f['a_ua'], 'spessoreGradi': f.get('spessore_gradi', 10),
                      'punti': f.get('punti', 1500)})

    # Audio registrati (ElevenLabs): solo se il file esiste e il testo non e'
    # cambiato da quando e' stato scritto audio-testi.json.
    import hashlib
    audio = {}
    elenco_audio = carica('audio-testi.json')
    cartella_audio = RADICE / 'assets' / 'sistema-solare' / 'audio'
    testi_ora = {c['id']: ' '.join([c['nome'] + '.', c['descrizione']] + list(c.get('curiosita') or [])) for c in dati['corpi']}
    testi_ora.update({s['id']: s['nome'] + '. ' + s['descrizione'] for s in dati.get('sciami', [])})
    testi_ora.update({k['id']: k['titolo'] + '. ' + k['testo'] for k in dati.get('schede', [])})
    if voy:
        testi_ora.update({'film-' + ch['id']: ch['titolo'] + '. ' + ch['testo'] for ch in voy['capitoli']})
    for vid, voce in elenco_audio.items():
        attuale = testi_ora.get(vid)
        if attuale is None or not (cartella_audio / voce['file']).exists():
            continue
        if hashlib.sha1(attuale.encode('utf-8')).hexdigest() == voce['sha1']:
            audio[vid] = voce['file']

    uscita = {
        'aggiornato': dati.get('meta', {}).get('aggiornato'),
        'audio': audio,
        'corpi': corpi,
        'sciami': dati.get('sciami', []),
        'schede': dati.get('schede', []),
        'fasce': fasce,
        'film': film,
    }
    testo = ('// GENERATO da scripts/build_sistema_solare.py: non modificare a mano.\n'
             '// Fonti e note per ogni valore: docs/sistema-solare/*.json\n'
             'window.SA = window.SA || {};\n'
             'window.SA.sistemaSolareDati = ' + json.dumps(uscita, ensure_ascii=False, separators=(',', ':')) + ';\n')
    scrivi_traiettorie('--check' in sys.argv)
    scrivi_pagina(uscita, carica('faq.json'), '--check' in sys.argv)
    if '--check' in sys.argv:
        if not USCITA.exists() or USCITA.read_text(encoding='utf-8') != testo:
            sys.exit('[ERROR] js/sistema-solare-dati.js non e\' aggiornato: python3 scripts/build_sistema_solare.py')
        print('[OK] js/sistema-solare-dati.js aggiornato')
        return
    USCITA.write_text(testo, encoding='utf-8')
    print(f'[OK] {USCITA.relative_to(RADICE)}: {len(corpi)} corpi, {len(uscita["sciami"])} sciami, {len(uscita["schede"])} schede')


def scrivi_traiettorie(controlla):
    """assets/sistema-solare/voyager-traiettorie-v1.json: le traiettorie di
    Voyager 1 e 2 da JPL Horizons (docs/sistema-solare/voyager-traiettoria.json),
    fino al 2050 come il resto del modello (gli elementi dei pianeti valgono fra
    il 1800 e il 2050). Liste piatte [jd, x, y, z, ...]: UA attorno al Sole, km
    nei sorvoli. La pagina lo scarica solo quando servono le sonde.
    /assets/ e' in cache per sempre: se i dati cambiano, cambia il nome (v2)."""
    t = carica('voyager-traiettoria.json')
    if not t:
        return
    fine = 2469807.5  # 1 gennaio 2050
    uscita = {}
    for chiave, sid in (('voyager1', 'voyager-1'), ('voyager2', 'voyager-2')):
        v = t[chiave]
        punti = []
        for jd, x, y, z in v['punti']:
            if jd > fine:
                break
            punti += [round(jd, 4), round(x, 6), round(y, 6), round(z, 6)]
        sorvoli = []
        for genitore, sv in v['sorvoli'].items():
            pp = []
            for jd, x, y, z in sv['punti']:
                pp += [round(jd, 5), round(x, 0), round(y, 0), round(z, 0)]
            sorvoli.append({'genitore': genitore, 'punti': pp})
        uscita[sid] = {'punti': punti, 'sorvoli': sorvoli}
    testo = json.dumps(uscita, separators=(',', ':'))
    dest = RADICE / 'assets' / 'sistema-solare' / FILE_TRAIETTORIE
    if controlla:
        if not dest.exists() or dest.read_text(encoding='utf-8') != testo:
            sys.exit('[ERROR] ' + FILE_TRAIETTORIE + ' non e\' aggiornato: python3 scripts/build_sistema_solare.py')
        return
    dest.write_text(testo, encoding='utf-8')
    print(f'[OK] {dest.relative_to(RADICE)}: {len(testo) // 1024} KB')


# ---------------------------------------------------------------- pagina
#
# La scena 3D mostra una scheda alla volta, e i crawler delle AI di solito non
# eseguono JavaScript: senza queste parti, per loro, i dati non esisterebbero.
# Qui si scrivono in sistema-solare.html, fra due coppie di marcatori, le
# schede di tutti i corpi, le domande frequenti (testo visibile e FAQPage
# identici) e i crediti delle immagini. Nessun numero nuovo: tutto viene da
# `uscita` (lo stesso contenuto di js/sistema-solare-dati.js) e da faq.json.

MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio',
        'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre']
G_TERRA = 9.80665  # m/s^2, come la bilancia di js/sistema-solare.js



def num(x, dec=0):
    """Numero all'italiana: 12.104 e 0,72."""
    t = f'{x:,.{dec}f}'.replace(',', ' ').replace('.', ',').replace(' ', '.')
    return t.rstrip('0').rstrip(',') if dec else t


def data_it(iso):
    a, m, *g = iso.split('-')
    return (f'{int(g[0])} ' if g else '') + f'{MESI[int(m) - 1]} {a}'


def e(t):
    return html.escape(str(t), quote=False)


def ea(t):
    """Per gli attributi."""
    return html.escape(str(t), quote=True)


def fonti_html(fonti, rientro):
    viste = []
    for u in fonti or []:
        if u not in viste:
            viste.append(u)
    if not viste:
        return ''
    # Come nella scheda della scena: il testo del link e' l'indirizzo stesso.
    voci = ''.join(f'{rientro}  <li><a href="{ea(u)}" rel="noopener noreferrer">{e(re.sub(r"^https?://", "", u))}</a></li>\n' for u in viste)
    return f'{rientro}<p class="ss-fonti-titolo">Fonti:</p>\n{rientro}<ul class="ss-fonti-statiche">\n{voci}{rientro}</ul>\n'


def durata(ore):
    if ore < 48:
        return f'{num(ore, 1)} ore'
    giorni = ore / 24
    return f'{num(giorni, 1)} giorni terrestri' if giorni < 730 else f'{num(giorni / 365.25, 1)} anni terrestri'


def righe_scheda(c, nomi):
    s = c['scheda']
    r = []
    if s.get('raggio_medio_km'):
        r.append(('Diametro', f'{num(2 * s["raggio_medio_km"])} km'))
    d = s.get('distanza_media') or {}
    if d.get('unita') == 'UA':
        r.append(('Distanza media dal Sole', f'{num(d["valore"], 2)} UA, circa {num(d["valore"] * 149.6)} milioni di km'))
    elif d.get('unita') == 'km':
        r.append((f'Distanza media da {nomi.get(c.get("genitore"), "")}'.strip(), f'{num(d["valore"])} km'))
    if s.get('giorno_solare_ore'):
        r.append(("Un giorno, da un'alba all'altra", durata(abs(s['giorno_solare_ore']))))
    elif s.get('rotazione_siderale_ore'):
        r.append(('Un giro su se stesso', durata(abs(s['rotazione_siderale_ore']))))
    if s.get('periodo_orbitale_giorni'):
        attorno = 'al Sole' if c.get('genitore') in (None, 'sole') else 'a ' + nomi.get(c['genitore'], '')
        g = s['periodo_orbitale_giorni']
        r.append((f'Un giro attorno {attorno}', f'{num(g, 2)} giorni terrestri' if g < 730 else f'{num(g / 365.25, 1)} anni terrestri'))
    t = s.get('temperatura_c') or {}
    if t.get('media') is not None:
        r.append(('Temperatura media', f'{num(t["media"])} °C'))
    elif t.get('min') is not None and t.get('max') is not None:
        r.append(('Temperatura', f'da {num(t["min"])} a {num(t["max"])} °C'))
    if s.get('gravita_superficie_ms2'):
        g = s['gravita_superficie_ms2']
        # Sul Sole non si sta in piedi, e sulla Terra il confronto non serve: solo il valore.
        bilancia = f': una bilancia segnerebbe il {num(100 * g / G_TERRA)}% di quanto segna sulla Terra' if c['id'] not in ('sole', 'terra') else ''
        r.append(('Gravità', f'{num(g, 2)} m/s²{bilancia}'))
    if s.get('lune_conosciute') is not None:
        quando = f' (conteggio di {data_it(s["lune_conteggio_data"])})' if s.get('lune_conteggio_data') else ''
        r.append(('Lune conosciute', f'{s["lune_conosciute"]}{quando}'))
    return r


def articolo(c, nomi, rientro='    '):
    s = c['scheda']
    i = rientro + '  '
    out = [f'{rientro}<article class="ss-atlante-corpo" id="{ea(c["id"])}" aria-labelledby="atl-{ea(c["id"])}">\n',
           f'{i}<h3 id="atl-{ea(c["id"])}">{e(c["nome"])}</h3>\n',
           f'{i}<p>{e(s.get("descrizione") or s.get("descrizione_bambini") or "")}</p>\n']
    righe = righe_scheda(c, nomi)
    if righe:
        out.append(f'{i}<dl>\n')
        out += [f'{i}  <dt>{e(k)}</dt><dd>{e(v)}</dd>\n' for k, v in righe]
        out.append(f'{i}</dl>\n')
    if s.get('curiosita'):
        out.append(f'{i}<ul>\n')
        out += [f'{i}  <li>{e(x)}</li>\n' for x in s['curiosita']]
        out.append(f'{i}</ul>\n')
    out.append(fonti_html(s.get('fonti'), i))
    out.append(f'{rientro}</article>\n')
    return ''.join(out)


def voce(c, nomi):
    s = c['scheda']
    dove = {'luna': 'luna di ' + nomi.get(c.get('genitore'), ''), 'asteroide': 'asteroide', 'cometa': 'cometa',
            'oggetto-kuiper': 'oggetto della fascia di Kuiper', 'stazione': 'stazione spaziale', 'sonda': 'sonda spaziale'}.get(c['tipo'], '')
    misura = f', diametro {num(2 * s["raggio_medio_km"])} km' if s.get('raggio_medio_km') and c['tipo'] not in ('stazione', 'sonda') else ''
    testo = s.get('descrizione_bambini') or s.get('descrizione') or ''
    return f'      <li id="{ea(c["id"])}"><strong>{e(c["nome"])}</strong> ({e(dove)}{misura}). {e(testo)}</li>\n'


def scrivi_pagina(uscita, faq, controlla):
    corpi = [c for c in uscita['corpi'] if c.get('scheda') and not c.get('solo_confronto')]
    nomi = {c['id']: c['nome'] for c in uscita['corpi']}
    principali = ([c for c in corpi if c['tipo'] in ('stella', 'pianeta')] + [c for c in corpi if c['id'] == 'luna']
                  + [c for c in corpi if c['tipo'] == 'pianeta-nano'])
    gruppi = [
        ('Le lune', [c for c in corpi if c['tipo'] == 'luna' and c['id'] != 'luna']),
        ('Asteroidi, comete e oggetti oltre Nettuno', [c for c in corpi if c['tipo'] in ('asteroide', 'cometa', 'oggetto-kuiper')]),
        ('Stazione Spaziale Internazionale e sonde Voyager', [c for c in corpi if c['tipo'] in ('stazione', 'sonda')]),
    ]
    agg = uscita.get('aggiornato')
    b = ['  <section class="seo-static ss-atlante" aria-labelledby="ssAtlanteTitolo">\n',
         '    <h2 id="ssAtlanteTitolo">Le schede del Sistema Solare</h2>\n',
         f'    <p>Le stesse schede che si aprono nella scena 3D, con i dati e le fonti di ogni corpo. Dati aggiornati al {data_it(agg)}.</p>\n' if agg else '']
    b += [articolo(c, nomi) for c in principali]
    for titolo, elenco in gruppi:
        if elenco:
            b.append(f'    <h3>{e(titolo)}</h3>\n    <ul class="ss-atlante-elenco">\n')
            b += [voce(c, nomi) for c in elenco]
            b.append('    </ul>\n')
    if uscita.get('sciami'):
        b.append('    <h3>Le stelle cadenti</h3>\n    <ul class="ss-atlante-elenco">\n')
        for sc in uscita['sciami']:
            da = f', dalla {sc["progenitore_nome"]}' if (sc.get('progenitore_nome') or '').startswith('cometa') else (f', da {sc["progenitore_nome"]}' if sc.get('progenitore_nome') else '')
            b.append(f'      <li id="{ea(sc["id"])}"><strong>{e(sc["nome"])}</strong> (picco il {e(sc["picco"])}{e(da)}). {e(sc["descrizione"])}</li>\n')
        b.append('    </ul>\n')
    for k in uscita.get('schede', []):
        b.append(f'    <h3 id="{ea(k["id"])}">{e(k["titolo"])}</h3>\n    <p>{e(k["testo"])}</p>\n')
    b.append('  </section>\n')

    domande = (faq or {}).get('domande', [])
    if domande:
        b += ['\n  <section class="seo-static seo-faq" aria-labelledby="ssFaqTitolo">\n',
              '    <h2 id="ssFaqTitolo">Domande frequenti sul Sistema Solare</h2>\n']
        for q in domande:
            b += ['    <details class="seo-faq-item">\n', f'      <summary>{e(q["domanda"])}</summary>\n',
                  f'      <p>{e(q["risposta"])}</p>\n', fonti_html(q.get('fonti'), '      '), '    </details>\n']
        b.append('  </section>\n')

    crediti = [(nomi[c['id']], c['tex_credito']) for c in uscita['corpi'] if c.get('tex_credito')]
    foto = list(((uscita.get('film') or {}).get('foto') or {}).values())
    b += ['\n  <section class="seo-static ss-crediti" aria-labelledby="ssCreditiTitolo">\n',
          '    <h2 id="ssCreditiTitolo">Crediti delle immagini e dei modelli 3D</h2>\n',
          '    <p>Le superfici sono mappe costruite con le fotografie delle sonde; dove nessuna sonda è arrivata il corpo resta di un colore uniforme.</p>\n',
          '    <ul class="ss-atlante-elenco">\n']
    b += [f'      <li><strong>{e(n)}</strong>: {e(cr)}</li>\n' for n, cr in crediti]
    b += [f'      <li><strong>{e(f["titolo"])}</strong>: <a href="{ea(f["fonte"])}" rel="noopener noreferrer">{e(f["credito"])}</a></li>\n' for f in foto]
    b.append('    </ul>\n  </section>\n')
    corpo_html = ''.join(b)

    ld = {'@context': 'https://schema.org', '@type': 'FAQPage', 'mainEntity': [
        {'@type': 'Question', 'name': q['domanda'], 'acceptedAnswer': {'@type': 'Answer', 'text': q['risposta']}} for q in domande]}
    testa_html = '<script type="application/ld+json">\n' + json.dumps(ld, ensure_ascii=False, indent=2) + '\n</script>\n'

    pagina = PAGINA.read_text(encoding='utf-8')
    nuova = pagina
    for nome, contenuto in (('FAQ-JSONLD', testa_html), ('SCHEDE', corpo_html)):
        schema = re.compile(r'(<!-- ' + nome + r':INIZIO[^>]*-->\n)(.*?)(\s*<!-- ' + nome + r':FINE -->)', re.S)
        if not schema.search(nuova):
            sys.exit(f'[ERROR] sistema-solare.html: mancano i marcatori <!-- {nome}:INIZIO --> e <!-- {nome}:FINE -->')
        nuova = schema.sub(lambda m: m.group(1) + contenuto.rstrip('\n') + m.group(3), nuova)
    if controlla:
        if nuova != pagina:
            sys.exit("[ERROR] sistema-solare.html: schede, FAQ o crediti non aggiornati: python3 scripts/build_sistema_solare.py")
        print('[OK] sistema-solare.html: schede, FAQ e crediti aggiornati')
        return
    if nuova != pagina:
        PAGINA.write_text(nuova, encoding='utf-8')
    print(f'[OK] sistema-solare.html: {len(principali)} schede complete, {len(domande)} domande, {len(crediti) + len(foto)} crediti')


if __name__ == '__main__':
    main()
