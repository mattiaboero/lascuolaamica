#!/usr/bin/env python3
"""Verifica indipendente delle figure di 1ª (docs/classe-prima.md, P3).

Non importa il generatore e non legge i parametri dall'id: rilegge ogni
assets/figure/c1-*.svg, ricava i fatti solo dalla geometria (quante forme e di
che tipo, dove cadono i salti sulla linea dei numeri, punto dentro/fuori da un
poligono, linea chiusa o aperta, ...) e li confronta con quelli dichiarati in
scripts/data/figure-classe-prima.json. Dell'id usa solo il nome del modello
(c1-<modello>-...) per scegliere quale lettura fare.

Controlla anche le regole di docs/figure-nel-quiz.md (peso, radice, niente
style/script/link, cartoncino, colori della palette, testo >= 16 unita', tutto
dentro il viewBox, etichette che non si sovrappongono) e che ogni domanda di
json/matematica.json con una figura c1-* abbia il figureAlt del manifest.

  python3 scripts/verifica_figure_classe_prima.py      # esce con 1 se qualcosa non torna
"""

import json
import math
import pathlib
import re
import sys
import xml.etree.ElementTree as ET

ROOT = pathlib.Path(__file__).resolve().parent.parent
FIG_DIR = ROOT / 'assets' / 'figure'
MANIFEST = ROOT / 'scripts' / 'data' / 'figure-classe-prima.json'
NS = '{http://www.w3.org/2000/svg}'
CARD = {'x': '1', 'y': '1', 'width': '318', 'height': '238', 'rx': '14', 'fill': '#fff', 'stroke': '#d9d2c5', 'stroke-width': '2'}
PALETTE = {'#fff', '#d9d2c5', '#2c2a28', '#0072b2', '#d55e00', '#eef4f9', 'none'}
TEXT_FILLS = {'#2c2a28', '#0072b2'}  # il vermiglio e' 3,9:1 su bianco: mai testo
FORBIDDEN = re.compile(r'<style|\sstyle\s*=|<script|<foreignObject|<image\b|href\s*=|\son[a-z]+\s*=|url\(', re.I)
DARK, BLUE, VERM, LIGHT = '#2c2a28', '#0072b2', '#d55e00', '#d9d2c5'


class Bad(Exception):
    pass


def check(cond, msg):
    if not cond:
        raise Bad(msg)


def f(el, name, default=0.0):
    return float(el.get(name, default))


# ------------------------------------------------------------ geometria

def path_parts(d):
    """Sottotracciati di un path con comandi assoluti M L H V C Q Z.
    Ritorna [(punti_estremi, tutti_i_punti_compresi_i_controlli, chiuso)]."""
    toks = re.findall(r'[MLHVCQZ]|-?\d+(?:\.\d+)?', d)
    check(not re.search(r'[a-y]', d.replace('e', '')), f'comando relativo o non previsto in {d[:40]}')
    parts, cmd, i, cur = [], None, 0, (0.0, 0.0)
    while i < len(toks):
        t = toks[i]
        if t.isalpha():
            cmd = t
            i += 1
            if cmd == 'Z':
                parts[-1][2] = True
                cur = parts[-1][0][0]
            continue
        nums = {'M': 2, 'L': 2, 'H': 1, 'V': 1, 'C': 6, 'Q': 4}[cmd]
        v = [float(x) for x in toks[i:i + nums]]
        i += nums
        if cmd == 'M':
            cur = (v[0], v[1])
            parts.append([[cur], [cur], False])
            cmd = 'L'
            continue
        if cmd == 'H':
            cur = (v[0], cur[1])
            ctrl = []
        elif cmd == 'V':
            cur = (cur[0], v[0])
            ctrl = []
        else:
            ctrl = [(v[k], v[k + 1]) for k in range(0, nums - 2, 2)]
            cur = (v[-2], v[-1])
        parts[-1][0].append(cur)
        parts[-1][1].extend(ctrl + [cur])
    return [tuple(p) for p in parts]


def poly_points(el):
    nums = [float(x) for x in re.split(r'[\s,]+', el.get('points').strip())]
    return list(zip(nums[::2], nums[1::2]))


def text_box(el):
    fs = f(el, 'font-size')
    w = len(el.text or '') * 0.62 * fs
    x, y = f(el, 'x'), f(el, 'y')
    return (x - w / 2, y - 0.74 * fs, x + w / 2, y + 0.04 * fs)


def bbox(el):
    tag = el.tag.replace(NS, '')
    if tag == 'rect':
        return (f(el, 'x'), f(el, 'y'), f(el, 'x') + f(el, 'width'), f(el, 'y') + f(el, 'height'))
    if tag == 'circle':
        cx, cy, r = f(el, 'cx'), f(el, 'cy'), f(el, 'r')
        return (cx - r, cy - r, cx + r, cy + r)
    if tag == 'line':
        xs, ys = (f(el, 'x1'), f(el, 'x2')), (f(el, 'y1'), f(el, 'y2'))
        return (min(xs), min(ys), max(xs), max(ys))
    if tag == 'text':
        return text_box(el)
    if tag == 'polygon':
        pts = poly_points(el)
    elif tag == 'path':
        pts = [p for part in path_parts(el.get('d')) for p in part[1]]
    else:
        raise Bad(f'elemento non previsto: <{tag}>')
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    return (min(xs), min(ys), max(xs), max(ys))


def overlap(a, b):
    return a[0] < b[2] and b[0] < a[2] and a[1] < b[3] and b[1] < a[3]


def seg_dist(p, a, b):
    (px, py), (ax, ay), (bx, by) = p, a, b
    dx, dy = bx - ax, by - ay
    t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy or 1)))
    return math.hypot(px - ax - t * dx, py - ay - t * dy)


def inside(p, poly):
    x, y = p
    res = False
    for (x1, y1), (x2, y2) in zip(poly, poly[1:] + poly[:1]):
        if (y1 > y) != (y2 > y) and x < x1 + (y - y1) * (x2 - x1) / (y2 - y1):
            res = not res
    return res


def center(el):
    b = bbox(el)
    if el.tag == NS + 'polygon':
        pts = poly_points(el)
        return (sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts))
    return ((b[0] + b[2]) / 2, (b[1] + b[3]) / 2)


def tag(el):
    return el.tag.replace(NS, '')


def forma(el):
    """Tipo di una forma dalla sola geometria."""
    t = tag(el)
    if t == 'circle':
        return 'cerchio'
    if t == 'polygon':
        pts = poly_points(el)
        if len(pts) == 10:
            return 'stella'
        if len(pts) == 3:
            angles = []
            for i in range(3):
                a, b, c = pts[i - 1], pts[i], pts[(i + 1) % 3]
                v1, v2 = (a[0] - b[0], a[1] - b[1]), (c[0] - b[0], c[1] - b[1])
                angles.append(math.degrees(math.acos((v1[0] * v2[0] + v1[1] * v2[1]) / math.hypot(*v1) / math.hypot(*v2))))
            check(min(angles) >= 25, f'triangolo troppo schiacciato ({min(angles):.0f} gradi)')
            return 'triangolo'
    if t == 'rect':
        w, h = f(el, 'width'), f(el, 'height')
        ratio = max(w, h) / min(w, h)
        if ratio <= 1.02:
            return 'quadrato'
        check(ratio >= 1.6, f'rettangolo {w}x{h} troppo simile a un quadrato')
        return 'rettangolo'
    raise Bad(f'forma non riconosciuta: <{t}>')


def colore(el):
    return el.get('fill') if el.get('fill') not in ('#fff', None) else el.get('stroke')


# ------------------------------------------------------------ letture per modello

def labels(els, pattern=r'[A-D]'):
    return {e.text: e for e in els if tag(e) == 'text' and re.fullmatch(pattern, e.text or '')}


def quadrante(p):
    return (p[0] > 160) + 2 * (p[1] > 120)


def r_conta(els, _):
    objs = [e for e in els if tag(e) in ('circle', 'polygon') or (tag(e) == 'rect' and f(e, 'width') == f(e, 'height'))]
    check(len({forma(e) for e in objs}) == 1, 'oggetti di tipo diverso')
    rows = {}
    for e in objs:
        rows.setdefault(round(center(e)[1]), []).append(e)
    check(all(len(r) <= 5 for r in rows.values()), 'una fila ha piu\' di 5 oggetti')
    cols = {}
    for e in objs:
        cols.setdefault(colore(e), []).append(e)
    facts = {'totale': len(objs)}
    if len(cols) > 1:
        check(set(cols) == {VERM, BLUE}, f'colori {set(cols)}')
        piene = {c: {e.get('fill') != '#fff' for e in v} for c, v in cols.items()}
        check(piene[VERM] == {True} and piene[BLUE] == {False}, 'i due gruppi devono differire anche per riempimento')
        check(max(center(e)[1] for e in cols[VERM]) < min(center(e)[1] for e in cols[BLUE]), 'gruppi mescolati')
        facts.update(arancioni=len(cols[VERM]), blu=len(cols[BLUE]))
    return facts


def r_confronto(els, _):
    boxes = [e for e in els if tag(e) == 'rect' and f(e, 'width') > 100]
    lab = labels(els, r'[AB]')
    check(len(boxes) == 2 and set(lab) == {'A', 'B'}, 'servono due riquadri A e B')
    facts = {}
    for name, t in lab.items():
        box = min(boxes, key=lambda b: abs(center(b)[0] - f(t, 'x')))
        bx = bbox(box)
        check(f(t, 'y') < bx[1], f'etichetta {name} non sopra il suo riquadro')
        facts[name] = sum(1 for e in els if tag(e) == 'circle' and bx[0] < f(e, 'cx') < bx[2] and bx[1] < f(e, 'cy') < bx[3])
    a, b = facts['A'], facts['B']
    facts['maggiore'] = 'A' if a > b else 'B' if b > a else 'uguali'
    return facts


def r_retta(els, _):
    nums = sorted((f(e, 'x'), int(e.text)) for e in els if tag(e) == 'text' and (e.text or '').isdigit())
    check(len(nums) >= 3, 'troppo pochi numeri sulla linea')
    (x0, v0), (x1, v1) = nums[0], nums[1]
    step = (x1 - x0) / (v1 - v0)
    value = lambda x: v0 + (x - x0) / step
    for x, v in nums:
        check(abs(value(x) - v) < 0.02, f'il numero {v} non e\' sulla sua tacca')
    quest = [e for e in els if tag(e) == 'text' and e.text == '?']
    if quest:
        m = value(f(quest[0], 'x'))
        check(abs(m - round(m)) < 0.02, '"?" non e\' su una tacca')
        return {'manca': round(m)}
    arcs = path_parts(next(e for e in els if e.get('id') == 'salti').get('d'))
    ends = [(value(a[0][0][0]), value(a[0][-1][0])) for a in arcs]
    for (s, e) in ends:
        check(abs(abs(e - s) - 1) < 0.02, 'un salto non e\' lungo 1')
    for (_, e), (s, _) in zip(ends, ends[1:]):
        check(abs(e - s) < 0.02, 'salti non consecutivi')
    da, a = round(ends[0][0]), round(ends[-1][1])
    start = next(e for e in els if e.get('id') == 'partenza')
    check(abs(value(f(start, 'cx')) - da) < 0.02, 'il pallino di partenza non e\' dove comincia il primo salto')
    head = [e for e in els if tag(e) == 'polygon']
    tip = max(poly_points(head[0]), key=lambda p: p[1]) if len(head) == 1 else (0, 0)
    check(abs(value(tip[0]) - a) < 0.02, 'la punta della freccia non e\' sull\'ultimo numero')
    return {'da': da, 'a': a, 'salti': len(arcs), 'verso': 'avanti' if a > da else 'indietro'}


def r_decine(els, _):
    rects = [e for e in els if tag(e) == 'rect']
    unit = min(f(e, 'width') for e in rects)
    bars = [e for e in rects if f(e, 'width') == unit and f(e, 'height') == 10 * unit]
    cubes = [e for e in rects if f(e, 'width') == unit and f(e, 'height') == unit]
    check(len(bars) + len(cubes) == len(rects), 'rettangoli che non sono ne\' bastoncini ne\' cubetti')
    for b in bars:  # 9 righe dentro ogni bastoncino: 10 quadretti
        bx = bbox(b)
        segs = [p for e in els if tag(e) == 'path' for p in path_parts(e.get('d'))
                if bx[0] <= p[0][0][0] <= bx[2] and bx[1] < p[0][0][1] < bx[3]]
        check(len(segs) == 9, f'un bastoncino ha {len(segs) + 1} quadretti')
    if bars and cubes:
        check(max(bbox(b)[2] for b in bars) < min(bbox(c)[0] for c in cubes), 'cubetti mescolati ai bastoncini')
    return {'decine': len(bars), 'unita': len(cubes), 'numero': 10 * len(bars) + len(cubes)}


def shapes_by_label(els, kinds):
    lab = labels(els)
    check(len(lab) == 4, 'servono le etichette A-D')
    out = {}
    for name, t in lab.items():
        q = quadrante((f(t, 'x'), f(t, 'y')))
        found = [e for e in kinds if quadrante(center(e)) == q]
        check(len(found) == 1, f'quadrante {name}: {len(found)} figure')
        out[name] = found[0]
    return out


def r_forme(els, _):
    shapes = [e for e in els if tag(e) in ('circle', 'polygon', 'rect')]
    return {k: forma(e) for k, e in sorted(shapes_by_label(els, shapes).items())}


def r_posizione(els, _):
    ball = next(e for e in els if e.get('id') == 'palla')
    ref = next(e for e in els if e.get('id') in ('tavolo', 'scatola'))
    rb, bb = bbox(ref), bbox(ball)
    cx = f(ball, 'cx')
    if bb[2] < rb[0]:
        return {'posizione': 'sinistra'}
    if bb[0] > rb[2]:
        return {'posizione': 'destra'}
    if ref.get('id') == 'scatola':
        check(rb[0] < bb[0] and bb[2] < rb[2] and rb[1] < bb[1] and bb[3] <= rb[3], 'palla a cavallo della scatola')
        return {'posizione': 'dentro'}
    pts = path_parts(ref.get('d'))[0][0]
    legs = sorted({x for x, y in pts if y == rb[3]})
    top_bottom = sorted({y for x, y in pts})[1]  # il sotto del piano
    if bb[3] <= rb[1] + 1:
        check(rb[0] < cx < rb[2] and bb[3] >= rb[1] - 3, 'la palla non e\' appoggiata sul tavolo')
        return {'posizione': 'sopra'}
    check(bb[1] > top_bottom and legs[1] < bb[0] and bb[2] < legs[2], 'palla ne\' sopra ne\' sotto il tavolo')
    return {'posizione': 'sotto'}


def r_percorso(els, _):
    grid = next(e for e in els if e.get('id') == 'griglia')
    gx, gy, gw, gh = f(grid, 'x'), f(grid, 'y'), f(grid, 'width'), f(grid, 'height')
    lines = path_parts(next(e for e in els if tag(e) == 'path').get('d'))
    cols = 1 + sum(1 for p in lines if p[0][0][0] == p[0][1][0])
    rows = 1 + sum(1 for p in lines if p[0][0][1] == p[0][1][1])
    cw, ch = gw / cols, gh / rows
    check(abs(cw - ch) < 0.01, 'caselle non quadrate')
    cell = lambda p: (int((p[0] - gx) // cw), int((p[1] - gy) // ch))
    start = cell(center(next(e for e in els if e.get('id') == 'partenza')))
    end = cell(center(next(e for e in els if e.get('id') == 'arrivo')))
    heads = [e for e in els if tag(e) == 'polygon' and len(poly_points(e)) == 3]
    arrows = {}
    names = {(1, 0): 'destra', (-1, 0): 'sinistra', (0, -1): 'alto', (0, 1): 'basso'}
    for ln in (e for e in els if tag(e) == 'line'):
        p1, p2 = (f(ln, 'x1'), f(ln, 'y1')), (f(ln, 'x2'), f(ln, 'y2'))
        head = min(heads, key=lambda h: min(math.dist(center(h), p1), math.dist(center(h), p2)))
        tail, tip = (p1, p2) if math.dist(center(head), p2) < math.dist(center(head), p1) else (p2, p1)
        d = (round((tip[0] - tail[0]) / math.dist(tip, tail)), round((tip[1] - tail[1]) / math.dist(tip, tail)))
        mid = ((tail[0] + tip[0]) / 2, (tail[1] + tip[1]) / 2)
        a = cell((mid[0] - d[0] * cw / 2, mid[1] - d[1] * ch / 2))
        arrows[a] = (d, names[d])
    frecce, cur = [], start
    while cur in arrows:
        d, name = arrows.pop(cur)
        frecce.append(name)
        cur = (cur[0] + d[0], cur[1] + d[1])
    check(not arrows, 'frecce che non si seguono dalla partenza')
    if frecce:
        check(cur == end, 'le frecce non arrivano alla stella')
    return {'partenza': list(start), 'arrivo': list(end), 'passi_minimi': abs(end[0] - start[0]) + abs(end[1] - start[1]),
            'frecce': frecce}


def r_linee(els, _):
    paths = [e for e in els if tag(e) == 'path' and e.get('stroke') != LIGHT]
    out = {}
    for name, e in sorted(shapes_by_label(els, paths).items()):
        parts = path_parts(e.get('d'))
        check(len(parts) == 1, 'una linea deve essere un tratto solo')
        ends, _, closed = parts[0]
        if not closed:
            check(math.dist(ends[0], ends[-1]) >= 40, f'linea {name}: estremita\' troppo vicine, sembra chiusa')
        out[name] = 'chiusa' if closed else 'aperta'
    return out


def r_regione(els, _):
    border = poly_points(next(e for e in els if e.get('id') == 'confine'))
    edges = list(zip(border, border[1:] + border[:1]))
    dots = [e for e in els if tag(e) == 'circle' and f(e, 'r') <= 8]
    lab = labels(els)
    check(len(dots) == 4 and len(lab) == 4, 'servono 4 punti con le lettere A-D')
    out = {}
    for name, t in sorted(lab.items()):
        tb = text_box(t)
        dot = min(dots, key=lambda d: math.dist((f(d, 'cx'), f(d, 'cy')), ((tb[0] + tb[2]) / 2, (tb[1] + tb[3]) / 2)))
        p = (f(dot, 'cx'), f(dot, 'cy'))
        dist = min(seg_dist(p, a, b) for a, b in edges)
        corners = [(tb[0], tb[1]), (tb[2], tb[1]), (tb[0], tb[3]), (tb[2], tb[3])]
        check(len({inside(c, border) for c in corners}) == 1, f'la lettera {name} attraversa la linea')
        if dist <= 1.5:
            out[name] = 'sulla linea'
        else:
            check(dist >= 12, f'punto {name} troppo vicino alla linea ({dist:.1f})')
            out[name] = 'dentro' if inside(p, border) else 'fuori'
    return out


def r_ritmo(els, _):
    q = next(e for e in els if tag(e) == 'text' and e.text == '?')
    shapes = sorted((e for e in els if tag(e) in ('circle', 'polygon') or (tag(e) == 'rect' and not e.get('stroke-dasharray'))),
                    key=lambda e: center(e)[0])
    check(all(center(e)[0] < f(q, 'x') for e in shapes), 'il "?" non e\' in fondo')
    seq = [forma(e) for e in shapes]
    for p in range(1, len(seq) // 2 + 1):
        if all(seq[i] == seq[i % p] for i in range(len(seq))):
            check(p > 1, 'nessun ritmo: tutte uguali')
            return {'sequenza': seq, 'prossimo': seq[len(seq) % p]}
    raise Bad('la fila non ripete un motivo almeno due volte')


def r_strisce(els, _):
    bars = [e for e in els if tag(e) == 'rect']
    lab = labels(els, r'[ABC]')
    check(len(bars) == len(lab), 'una striscia per lettera')
    x0 = {f(b, 'x') for b in bars}
    check(len(x0) == 1, 'le strisce non partono dallo stesso punto')
    out, units = {}, set()
    for name, t in sorted(lab.items()):
        b = min(bars, key=lambda b: abs(center(b)[1] - f(t, 'y')))
        bx = bbox(b)
        divs = [p for e in els if tag(e) == 'path' for p in path_parts(e.get('d'))
                if bx[0] < p[0][0][0] < bx[2] and bx[1] < p[0][0][1] < bx[3]]
        k = len(divs) + 1
        units.add(round(f(b, 'width') / k, 2))
        out[name] = k
    check(len(units) == 1, 'quadretti di misure diverse')
    vals = sorted(out.values())
    check(all(b - a >= 2 for a, b in zip(vals, vals[1:])), 'strisce troppo simili')
    out['piu_lunga'] = max((v, k) for k, v in out.items() if len(k) == 1)[1]
    out['piu_corta'] = min((v, k) for k, v in out.items() if len(k) == 1)[1]
    return out


def r_bilancia(els, _):
    beam = next(e for e in els if e.get('id') == 'giogo')
    ends = sorted([(f(beam, 'x1'), f(beam, 'y1')), (f(beam, 'x2'), f(beam, 'y2'))])
    check(abs(ends[0][1] - ends[1][1]) >= 20, 'la bilancia e\' quasi in pari')
    low = max(ends, key=lambda p: p[1])
    lab = labels(els, r'[AB]')
    name = min(lab, key=lambda k: abs(f(lab[k], 'x') - low[0]))
    objs = [e for e in els if (tag(e) == 'circle' and f(e, 'r') > 8) or (tag(e) == 'rect')]
    check(any(abs(center(o)[0] - low[0]) < 5 for o in objs), 'nessun oggetto sul piatto basso')
    return {'piu_pesante': name}


def r_ideogramma(els, _):
    lab = labels(els, r'[ABC]')
    shapes = [e for e in els if tag(e) in ('circle', 'polygon', 'rect')]
    out = {}
    for name, t in sorted(lab.items()):
        row = [e for e in shapes if abs(center(e)[1] - (f(t, 'y') - 9)) < 16]
        check(len({forma(e) for e in row}) == 1, f'riga {name}: figure diverse')
        out[name] = len(row)
    check(sum(out.values()) == len(shapes), 'figure fuori dalle righe')
    check(len(set(out.values())) == 3, 'righe con lo stesso numero')
    out['piu'] = max(out, key=out.get)
    out['meno'] = min((k for k in out if k != 'piu'), key=out.get)
    return out


READERS = {'conta': r_conta, 'confronto': r_confronto, 'retta': r_retta, 'decine': r_decine, 'forme': r_forme,
           'posizione': r_posizione, 'percorso': r_percorso, 'linee': r_linee, 'regione': r_regione,
           'ritmo': r_ritmo, 'strisce': r_strisce, 'bilancia': r_bilancia, 'ideogramma': r_ideogramma}


# ------------------------------------------------------------ regole comuni

def common(raw):
    check(len(raw.encode()) <= 6144, f'{len(raw.encode())} byte, massimo 6144')
    check(raw.startswith('<svg'), 'deve cominciare con <svg')
    check(not FORBIDDEN.search(raw), 'style/script/link/immagini non ammessi')
    root = ET.fromstring(raw)
    check(root.get('viewBox') == '0 0 320 240' and root.get('width') == '320' and root.get('height') == '240', 'radice')
    els = list(root)
    check(tag(els[0]) == 'rect' and {k: els[0].get(k) for k in CARD} == CARD, 'il primo elemento deve essere il cartoncino')
    els = els[1:]
    boxes = []
    for e in els:
        check(len(e) == 0, 'niente gruppi annidati')
        for attr in ('fill', 'stroke'):
            check(e.get(attr) is None or e.get(attr) in PALETTE, f'colore {e.get(attr)} fuori palette')
        b = bbox(e)
        pad = f(e, 'stroke-width', 0) / 2
        check(b[0] - pad >= 3 and b[1] - pad >= 3 and b[2] + pad <= 317 and b[3] + pad <= 237,
              f'<{tag(e)}> esce dal cartoncino: {[round(v) for v in b]}')
        if tag(e) == 'text':
            check(f(e, 'font-size') >= 16, 'testo sotto 16 unita\'')
            check((e.get('font-family') or '').startswith('Arial') and e.get('font-weight') == '700', 'font')
            check(e.get('fill') in TEXT_FILLS, f'testo in {e.get("fill")}')
            for other in boxes:
                check(not overlap(b, other), f'etichette sovrapposte: "{e.text}"')
            boxes.append(b)
    return els


def main():
    manifest = json.loads(MANIFEST.read_text(encoding='utf-8')) if MANIFEST.exists() else {}
    files = {p.stem: p for p in FIG_DIR.glob('c1-*.svg')}
    errors = []
    for fid in sorted(set(files) | set(manifest)):
        try:
            check(fid in files, 'nel manifest ma senza file')
            check(fid in manifest, 'file senza voce nel manifest')
            els = common(files[fid].read_text(encoding='utf-8'))
            model = fid.split('-')[1]
            got = READERS[model](els, fid)
            want = manifest[fid]['fatti']
            check(got == want, f'fatti diversi:\n    figura   {got}\n    manifest {want}')
            alt = manifest[fid]['alt']
            check(20 <= len(alt) <= 300 and alt.endswith('.'), 'alt: 20-300 caratteri, chiuso dal punto')
        except (Bad, StopIteration, KeyError, ValueError, ET.ParseError) as e:
            errors.append(f'{fid}: {type(e).__name__ if not isinstance(e, Bad) else ""}{e}')
    data = json.loads((ROOT / 'json' / 'matematica.json').read_text(encoding='utf-8'))
    used = 0
    for q in data['questions']:
        fid = q.get('figure', '')
        if fid.startswith('c1-'):
            used += 1
            if fid not in manifest:
                errors.append(f'{q["id"]}: figura {fid} non generata')
            elif q.get('figureAlt') != manifest[fid]['alt']:
                errors.append(f'{q["id"]}: figureAlt diverso da quello del generatore per {fid}')
            if q.get('class') != 1:
                errors.append(f'{q["id"]}: figura di 1ª su una domanda di classe {q.get("class")}')
    for e in errors:
        print('ERRORE', e)
    print(f'{len(files)} figure c1 verificate, {used} domande che le usano, {len(errors)} errori')
    return 1 if errors else 0


if __name__ == '__main__':
    sys.exit(main())
