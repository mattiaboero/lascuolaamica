#!/usr/bin/env python3
"""Figure SVG per le domande di matematica di 1ª (docs/classe-prima.md, P3).

L'id della figura contiene tutti i parametri: il generatore costruisce il
disegno leggendo solo l'id. Stesso id, stesso file, byte per byte.

  python3 scripts/figure_classe_prima.py c1-conta-mele-7 c1-confronto-5-8
  python3 scripts/figure_classe_prima.py --shard reports/generated/matematica-c1-xxx.jsonl

Scrive assets/figure/<id>.svg e aggiorna scripts/data/figure-classe-prima.json
(modello, fatti veri della figura, testo alternativo). Con --shard genera ogni
figura c1-* citata nello shard e ne scrive il figureAlt nella riga.

Un file gia' tracciato da git non si riscrive mai: /assets/* e' "immutable"
(docs/figure-nel-quiz.md). Se il disegno di un id pubblicato deve cambiare,
serve un id nuovo. Il controllo indipendente e' verifica_figure_classe_prima.py.

Modelli (id -> disegno):
  c1-conta-<oggetto>-<n>            n oggetti (1-20) in file da 5; oggetto: mele, palline, stelle, cubi
  c1-conta-<oggetto>-<a>-<b>        a oggetti arancioni pieni, sotto b oggetti blu vuoti (a, b 1-10)
  c1-confronto-<a>-<b>              pallini nei riquadri A e B (0-10), in colonne da 5
  c1-retta-<x>-<y>-salto-<da>-<a>   linea dei numeri da x a y (al piu' 10 tacche di distanza), salti di 1
  c1-retta-<x>-<y>-manca-<m>        linea dei numeri con "?" al posto di m
  c1-decine-<d>-<u>                 d bastoncini da 10 (0-5) e u cubetti (0-9)
  c1-forme-<4 lettere>              figure A-D: c cerchio, q quadrato, r rettangolo, t triangolo
  c1-posizione-<tavolo|scatola>-<rel>   palla sopra/sotto/destra/sinistra del tavolo; dentro/destra/sinistra della scatola
  c1-percorso-<C>x<R>-<mosse>[-frecce]  griglia, partenza in basso a sinistra; mosse d3a2 = 3 a destra, 2 in alto (d s a b)
  c1-linee-<4 lettere>              linee A-D: a aperta, c chiusa
  c1-regione-<4 lettere>            punti A-D rispetto a una linea chiusa: i dentro, f fuori, s sulla linea
  c1-ritmo-<motivo>-<n>             n figure (al massimo 7) che ripetono il motivo (c q t), poi "?"
  c1-strisce-<l1>-<l2>[-<l3>]       strisce A, B (C) lunghe l quadretti (1-10), tutte diverse di almeno 2
  c1-bilancia-<a|b>                 bilancia a due piatti: scende il piatto piu' pesante
  c1-ideogramma-<a>-<b>-<c>         righe A, B, C con a cerchi, b quadrati, c triangoli (1-8, diversi)
"""

import itertools
import json
import math
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
FIG_DIR = ROOT / 'assets' / 'figure'
MANIFEST = ROOT / 'scripts' / 'data' / 'figure-classe-prima.json'

DARK = '#2c2a28'
BLUE = '#0072b2'
VERM = '#d55e00'
LIGHT = '#d9d2c5'
TINT = '#eef4f9'
FONT = 'Arial, Helvetica, sans-serif'
NUMERI = ['zero', 'una', 'due', 'tre', 'quattro', 'cinque']


def n(v):
    r = round(v, 1)
    return str(int(r)) if r == int(r) else str(r)


def pts(points):
    return ' '.join(f'{n(x)},{n(y)}' for x, y in points)


def svg(body):
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" width="320" height="240">'
            '<rect x="1" y="1" width="318" height="238" rx="14" fill="#fff" stroke="#d9d2c5" stroke-width="2"/>'
            + ''.join(body) + '</svg>')


def text(x, y, s, size=24, fill=DARK):
    return (f'<text x="{n(x)}" y="{n(y)}" font-family="{FONT}" font-size="{size}" font-weight="700" '
            f'text-anchor="middle" fill="{fill}">{s}</text>')


def circle(cx, cy, r, paint, extra=''):
    return f'<circle{extra} cx="{n(cx)}" cy="{n(cy)}" r="{n(r)}" {paint}/>'


def square(cx, cy, side, paint, extra=''):
    return f'<rect{extra} x="{n(cx - side / 2)}" y="{n(cy - side / 2)}" width="{n(side)}" height="{n(side)}" {paint}/>'


def polygon(points, paint, extra=''):
    return f'<polygon{extra} points="{pts(points)}" {paint}/>'


def star(cx, cy, big, small):
    return [(cx + (big if i % 2 == 0 else small) * math.sin(i * math.pi / 5),
             cy - (big if i % 2 == 0 else small) * math.cos(i * math.pi / 5)) for i in range(10)]


def triangle_up(cx, cy, side):
    h = side * 0.87
    return [(cx, cy - h / 2), (cx + side / 2, cy + h / 2), (cx - side / 2, cy + h / 2)]


def fill(color):
    return f'fill="{color}" stroke="{DARK}" stroke-width="2"'


def ring(color):
    return f'fill="#fff" stroke="{color}" stroke-width="4"'


def plural(k, sing, plur):
    return f'{k} {sing if k == 1 else plur}'


# ---------------------------------------------------------------- T1 conta

OGGETTI = {'mele': ('mela', 'mele'), 'palline': ('pallina', 'palline'),
           'stelle': ('stella', 'stelle'), 'cubi': ('cubo', 'cubi')}


def oggetto(kind, cx, cy, paint):
    if kind == 'stelle':
        return [polygon(star(cx, cy, 18, 8), paint)]
    if kind == 'cubi':
        return [square(cx, cy, 28, paint)]
    out = [circle(cx, cy, 15, paint)]
    if kind == 'mele':  # il picciolo: una mela, non un pallino
        out.append(f'<path d="M{n(cx)} {n(cy - 15)}Q{n(cx + 1)} {n(cy - 22)} {n(cx + 6)} {n(cy - 24)}" '
                   f'fill="none" stroke="{DARK}" stroke-width="3" stroke-linecap="round"/>')
    return out


def file_da_5(k):
    return [5] * (k // 5) + ([k % 5] if k % 5 else [])


def descrivi_file(rows, sing, plur, agg=('', '')):
    """[5, 5, 2] -> 'due file di 5 stelle e sotto una fila di 2 stelle'."""
    parti = []
    i = 0
    while i < len(rows):
        j = i
        while j < len(rows) and rows[j] == rows[i]:
            j += 1
        k, m = j - i, rows[i]
        nome = f'{sing}{agg[0]}' if m == 1 else f'{plur}{agg[1]}'
        parti.append(f'{"una fila" if k == 1 else NUMERI[k] + " file"} di {m} {nome}')
        i = j
    return ' e sotto '.join(parti)


def t_conta(kind, a, b=None):
    assert kind in OGGETTI, kind
    sing, plur = OGGETTI[kind]
    if b is None:
        assert 1 <= a <= 20
        groups = [(file_da_5(a), BLUE if kind != 'mele' else VERM, False)]
        facts = {'totale': a}
    else:
        assert 1 <= a <= 10 and 1 <= b <= 10
        groups = [(file_da_5(a), VERM, False), (file_da_5(b), BLUE, True)]
        facts = {'totale': a + b, 'arancioni': a, 'blu': b}
    rows = []  # (count, color, hollow, gap_before)
    for gi, (rs, color, hollow) in enumerate(groups):
        for ri, cnt in enumerate(rs):
            gap = 0
            if ri == 0 and gi > 0:
                gap = 20
            elif b is None and ri == 2:
                gap = 14  # dopo 10 oggetti, come due cornici del dieci
            rows.append((cnt, color, hollow, gap))
    assert len(rows) <= 4
    height = 46 * (len(rows) - 1) + sum(r[3] for r in rows)
    y = 120 - height / 2 + (4 if kind == 'mele' else 0)
    body = []
    for ri, (cnt, color, hollow, gap) in enumerate(rows):
        if ri:
            y += 46 + gap
        paint = ring(color) if hollow else fill(color)
        for i in range(cnt):
            body += oggetto(kind, 68 + 46 * i, y, paint)
    if b is None:
        alt = descrivi_file(groups[0][0], sing, plur)
    else:
        o = 'o' if kind == 'cubi' else 'a'
        oo = 'i' if kind == 'cubi' else 'e'
        alt = (descrivi_file(groups[0][0], sing, plur, (f' arancione pien{o}', f' arancioni pien{oo}'))
               + ' e sotto ' + descrivi_file(groups[1][0], sing, plur, (f' blu vuot{o}', f' blu vuot{oo}')))
    return body, facts, alt[0].upper() + alt[1:] + '.'


# ------------------------------------------------------------ T2 confronto

def colonna_pallini(c):
    if c == 0:
        return 'nessun pallino'
    if c <= 5:
        return f'{plural(c, "pallino", "pallini")} in colonna'
    if c == 10:
        return 'due colonne di 5 pallini'
    return f'una colonna di 5 pallini e accanto {plural(c - 5, "pallino", "pallini")}'


def t_confronto(a, b):
    assert 0 <= a <= 10 and 0 <= b <= 10
    body = []
    for label, x0, cnt in (('A', 24, a), ('B', 172, b)):
        cx = x0 + 62
        body.append(f'<rect id="riquadro-{label}" x="{x0}" y="46" width="124" height="180" rx="10" '
                    f'fill="{TINT}" stroke="{DARK}" stroke-width="3"/>')
        body.append(text(cx, 36, label))
        for i in range(cnt):
            col, row = divmod(i, 5)
            body.append(circle(cx - 22 + 44 * col, 72 + 32 * row, 13, fill(BLUE)))
    facts = {'A': a, 'B': b, 'maggiore': 'A' if a > b else 'B' if b > a else 'uguali'}
    alt = f'Due riquadri con dei pallini. Riquadro A: {colonna_pallini(a)}. Riquadro B: {colonna_pallini(b)}.'
    return body, facts, alt


# ------------------------------------------------------------ T3 retta

def t_retta(lo, hi, mode, p, q=None):
    assert 0 <= lo < hi <= 20 and hi - lo <= 10
    step = 280 / (hi - lo) if hi - lo > 5 else 52
    x0 = 160 - step * (hi - lo) / 2
    X = {v: x0 + (v - lo) * step for v in range(lo, hi + 1)}
    ticks = ''.join(f'M{n(X[v])} 140V160' for v in X)
    body = [f'<path d="M{n(x0 - 14)} 150H{n(X[hi] + 14)}{ticks}" fill="none" stroke="{DARK}" stroke-width="3"/>']
    for v in X:
        if mode == 'manca' and v == p:
            body.append(f'<rect x="{n(X[v] - 13)}" y="167" width="26" height="28" rx="4" fill="#fff" stroke="{BLUE}" stroke-width="3"/>')
            body.append(text(X[v], 188, '?', 20, BLUE))
        else:
            body.append(text(X[v], 188, v, 18))
    if mode == 'manca':
        assert lo < p < hi
        facts = {'manca': p}
        alt = (f'Una linea dei numeri da {lo} a {hi}. Fra il {p - 1} e il {p + 1}, '
               'al posto del numero, c\'è un riquadro con il punto di domanda.')
        return body, facts, alt
    assert mode == 'salto' and lo <= p <= hi and lo <= q <= hi and p != q
    d = 1 if q > p else -1
    arcs = ''.join(f'M{n(X[v])} 138Q{n((X[v] + X[v + d]) / 2)} 104 {n(X[v + d])} 138' for v in range(p, q, d))
    body.append(f'<path id="salti" d="{arcs}" fill="none" stroke="{VERM}" stroke-width="4" stroke-linecap="round"/>')
    tip = X[q]
    body.append(polygon([(tip, 140), (tip - 9 * d - 2, 127), (tip + 5 * d, 126)], f'fill="{VERM}"'))
    body.append(circle(X[p], 150, 8, fill(BLUE), ' id="partenza"'))
    k = abs(q - p)
    facts = {'da': p, 'a': q, 'salti': k, 'verso': 'avanti' if d > 0 else 'indietro'}
    alt = (f'Una linea dei numeri da {lo} a {hi}. Sul {p} c\'è un pallino blu. Da lì partono '
           f'{plural(k, "salto", "salti")} di un numero {"in avanti, verso destra" if d > 0 else "all’indietro, verso sinistra"}.')
    return body, facts, alt.replace('’', "'")


# ------------------------------------------------------------ T4 decine

def t_decine(d, u):
    assert 0 <= d <= 5 and 0 <= u <= 9 and d + u > 0
    unit = 20
    cols = (u + 4) // 5
    # bastoncini larghi 20 ogni 36, colonne di cubetti larghe 20 ogni 30, 34 fra i due gruppi
    width = (d * 36 - 16 if d else 0) + (34 if d and u else 0) + (cols * 30 - 10 if u else 0)
    x = 160 - width / 2
    body = []
    for i in range(d):
        bx = x + 36 * i
        lines = ''.join(f'M{n(bx)} {20 + unit * k}H{n(bx + unit)}' for k in range(1, 10))
        body.append(f'<rect x="{n(bx)}" y="20" width="{unit}" height="{unit * 10}" fill="{BLUE}" stroke="{DARK}" stroke-width="2"/>')
        body.append(f'<path d="{lines}" stroke="#fff" stroke-width="2"/>')
    cx0 = x + (d * 36 - 16 + 34 if d else 0) + unit / 2
    for i in range(u):
        col, row = divmod(i, 5)
        body.append(square(cx0 + 30 * col, 210 - 26 * row, unit, fill(VERM)))
    facts = {'decine': d, 'unita': u, 'numero': 10 * d + u}
    parti = []
    if d:
        parti.append(f'{plural(d, "bastoncino", "bastoncini")} da 10 quadretti')
    parti.append(f'{plural(u, "cubetto", "cubetti")} sciolti' if u > 1 else '1 cubetto sciolto' if u else 'nessun cubetto sciolto')
    alt = ' e '.join(parti)
    return body, facts, alt[0].upper() + alt[1:] + '.'


# ------------------------------------------------------------ T5 forme

QUADRANTI = [(100, 80), (250, 80), (100, 182), (250, 182)]
ETICHETTE = [(28, 46), (178, 46), (28, 148), (178, 148)]
DIVISORI = f'<path d="M160 18V222M18 120H302" stroke="{LIGHT}" stroke-width="2"/>'
TRIANGOLI = [[(0, -38), (40, 32), (-40, 32)], [(-36, -34), (-36, 34), (40, 34)],
             [(-40, -30), (40, -30), (6, 36)], [(-40, 12), (30, -36), (24, 34)]]
FORME = {'c': 'cerchio', 'q': 'quadrato', 'r': 'rettangolo', 't': 'triangolo'}
DESCR_FORME = {'cerchio': 'una figura rotonda, senza lati', 'quadrato': 'una figura con 4 lati tutti uguali',
               'rettangolo': 'una figura con 4 lati, due lunghi e due corti', 'triangolo': 'una figura con 3 lati'}


def t_forme(seq):
    assert len(seq) == 4 and set(seq) <= set(FORME)
    body = [DIVISORI]
    seen = {}
    facts = {}
    descr = []
    for k, ch in enumerate(seq):
        v = seen.get(ch, 0) + k % 2
        seen[ch] = seen.get(ch, 0) + 1
        cx, cy = QUADRANTI[k]
        paint = fill(BLUE if k in (0, 3) else VERM)
        if ch == 'c':
            body.append(circle(cx, cy, [38, 26, 32][v % 3], paint))
        elif ch == 'q':
            body.append(square(cx, cy, [72, 50, 60][v % 3], paint))
        elif ch == 'r':
            w, h = [(88, 44), (42, 80), (80, 36)][v % 3]
            body.append(f'<rect x="{n(cx - w / 2)}" y="{n(cy - h / 2)}" width="{w}" height="{h}" {paint}/>')
        else:
            body.append(polygon([(cx + x, cy + y) for x, y in TRIANGOLI[(v + k) % 4]], paint))
        label = 'ABCD'[k]
        body.append(text(*ETICHETTE[k], label))
        facts[label] = FORME[ch]
        descr.append(f'{label} {DESCR_FORME[FORME[ch]]}')
    return body, facts, 'Quattro figure con le lettere: ' + '; '.join(descr) + '.'


# ------------------------------------------------------------ T6 posizioni

def t_posizione(rif, rel):
    body = [f'<path d="M24 200H296" stroke="{LIGHT}" stroke-width="3"/>']
    if rif == 'tavolo':
        body.append(f'<path id="tavolo" d="M90 110H230V122H222V200H212V122H108V200H98V122H90Z" fill="{VERM}" stroke="{DARK}" stroke-width="2"/>')
        pos = {'sopra': (160, 91), 'sotto': (160, 181), 'destra': (264, 181), 'sinistra': (56, 181)}
        cosa = 'un tavolo'
        dove = {'sopra': 'appoggiata sul piano del tavolo', 'sotto': 'per terra, fra le gambe del tavolo',
                'destra': 'per terra, accanto al tavolo, dal lato della mano destra', 'sinistra': 'per terra, accanto al tavolo, dal lato della mano sinistra'}
    elif rif == 'scatola':
        body.append(f'<rect x="96" y="110" width="128" height="90" fill="{TINT}"/>')
        body.append(f'<path id="scatola" d="M96 106V200H224V106" fill="none" stroke="{DARK}" stroke-width="6" stroke-linejoin="round"/>')
        pos = {'dentro': (160, 178), 'destra': (264, 181), 'sinistra': (56, 181)}
        cosa = 'una scatola aperta in alto'
        dove = {'dentro': 'sul fondo della scatola', 'destra': 'per terra, accanto alla scatola, dal lato della mano destra',
                'sinistra': 'per terra, accanto alla scatola, dal lato della mano sinistra'}
    else:
        raise AssertionError(rif)
    assert rel in pos, rel
    cx, cy = pos[rel]
    body.append(circle(cx, cy, 18, fill(BLUE), ' id="palla"'))
    body.append(f'<path d="M{cx - 18} {cy}Q{cx} {cy + 12} {cx + 18} {cy}" fill="none" stroke="#fff" stroke-width="3"/>')
    facts = {'posizione': rel}
    return body, facts, f'Disegno con {cosa} e una palla blu. La palla è {dove[rel]}.'


# ------------------------------------------------------------ T7 percorso

MOSSE = {'d': (1, 0, 'destra'), 's': (-1, 0, 'sinistra'), 'a': (0, -1, 'alto'), 'b': (0, 1, 'basso')}


def arrow(p1, p2):
    (x1, y1), (x2, y2) = p1, p2
    ux, uy = (x2 - x1) / 48, (y2 - y1) / 48
    mx, my = (x1 + x2) / 2, (y1 + y2) / 2
    tip = (mx + ux * 13, my + uy * 13)
    base = (mx + ux * 1, my + uy * 1)
    return [f'<line x1="{n(mx - ux * 12)}" y1="{n(my - uy * 12)}" x2="{n(base[0])}" y2="{n(base[1])}" stroke="{DARK}" stroke-width="5"/>',
            polygon([tip, (base[0] - uy * 9, base[1] + ux * 9), (base[0] + uy * 9, base[1] - ux * 9)], f'fill="{DARK}"')]


def t_percorso(cols, rows, moves, frecce):
    assert 2 <= cols <= 6 and 2 <= rows <= 4
    x0, y0 = 160 - cols * 24, 120 - rows * 24
    cells = [(0, rows - 1)]
    names = []
    for ch, k in re.findall(r'([dsab])(\d)', moves):
        dx, dy, name = MOSSE[ch]
        for _ in range(int(k)):
            c, r = cells[-1]
            cells.append((c + dx, r + dy))
            names.append(name)
            assert 0 <= c + dx < cols and 0 <= r + dy < rows, 'fuori dalla griglia'
    assert ''.join(f'{a}{b}' for a, b in re.findall(r'([dsab])(\d)', moves)) == moves and names
    assert len(set(cells)) == len(cells), 'il percorso ripassa da una casella'
    center = lambda c: (x0 + 24 + 48 * c[0], y0 + 24 + 48 * c[1])
    grid = ''.join(f'M{x0 + 48 * c} {y0}V{y0 + 48 * rows}' for c in range(1, cols)) + \
        ''.join(f'M{x0} {y0 + 48 * r}H{x0 + 48 * cols}' for r in range(1, rows))
    body = [f'<rect id="griglia" x="{x0}" y="{y0}" width="{48 * cols}" height="{48 * rows}" fill="#fff" stroke="{DARK}" stroke-width="3"/>',
            f'<path d="{grid}" stroke="{LIGHT}" stroke-width="2"/>']
    if frecce:
        for a, b in zip(cells, cells[1:]):
            body += arrow(center(a), center(b))
    body.append(circle(*center(cells[0]), 11, fill(BLUE), ' id="partenza"'))
    body.append(polygon(star(*center(cells[-1]), 16, 7), fill(VERM), ' id="arrivo"'))
    dx, dy = cells[-1][0] - cells[0][0], cells[-1][1] - cells[0][1]
    facts = {'partenza': list(cells[0]), 'arrivo': list(cells[-1]), 'passi_minimi': abs(dx) + abs(dy),
             'frecce': names if frecce else []}
    where = []
    if dx:
        where.append(f'{plural(abs(dx), "casella", "caselle")} più a {"destra" if dx > 0 else "sinistra"}')
    if dy:
        where.append(f'{plural(abs(dy), "casella", "caselle")} più in {"alto" if dy < 0 else "basso"}')
    alt = (f'Una griglia di {cols} colonne e {rows} righe. Il pallino blu è nella casella in basso a sinistra, '
           f'la stella è {" e ".join(where)}.')
    if frecce:
        alt += ' Dal pallino alla stella c\'è una freccia per ogni casella, verso: ' + ', '.join(names) + '.'
    return body, facts, alt


# ------------------------------------------------------------ T8 linee e regioni

APERTE = ['M0 40C20 0 30 0 50 35C70 70 80 70 100 30', 'M90 12C40 -4 0 20 12 50C22 74 72 72 98 58',
          'M0 60L25 10L50 60L75 10L100 60', 'M0 62C40 62 66 50 62 24C58 0 26 4 30 28C34 56 72 66 100 44']
CHIUSE = ['M50 2C92 2 102 32 90 52C78 72 22 72 8 50C-4 28 12 2 50 2Z', 'M8 12L92 4L78 66L20 58Z',
          'M50 35C74 4 100 8 100 35C100 62 74 66 50 35C26 4 0 8 0 35C0 62 26 66 50 35Z',
          'M50 0C70 30 100 50 80 66C66 76 34 76 20 66C0 50 30 30 50 0Z']
ORIGINI = [(46, 40), (196, 40), (46, 146), (196, 146)]


def shift(d, dx, dy):
    """Trasla un tracciato fatto solo di coppie x y (comandi M L C Z)."""
    k = itertools.count()
    return re.sub(r'-?\d+(?:\.\d+)?', lambda m: n(float(m[0]) + (dx if next(k) % 2 == 0 else dy)), d)


def t_linee(seq):
    assert len(seq) == 4 and set(seq) <= {'a', 'c'}
    body = [DIVISORI]
    used = {'a': 0, 'c': 0}
    facts, descr = {}, []
    for k, ch in enumerate(seq):
        d = (APERTE if ch == 'a' else CHIUSE)[used[ch] % 4]
        used[ch] += 1
        label = 'ABCD'[k]
        body.append(f'<path id="linea-{label}" d="{shift(d, *ORIGINI[k])}" fill="none" stroke="{DARK}" '
                    'stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>')
        body.append(text(*ETICHETTE[k], label))
        facts[label] = 'aperta' if ch == 'a' else 'chiusa'
        descr.append(f'{label} {"ha due estremità libere" if ch == "a" else "gira e torna al punto di partenza"}')
    return body, facts, 'Quattro linee con le lettere: ' + '; '.join(descr) + '.'


def confine(theta):
    r = 1 + 0.1 * math.sin(3 * theta)
    return 160 + 92 * r * math.cos(theta), 124 + 64 * r * math.sin(theta)


PUNTI = {'i': [(122, 104), (196, 104), (128, 150), (192, 150)],
         'f': [(34, 40), (286, 40), (34, 206), (286, 206)],
         's': [225, 315, 135, 45]}  # gradi: vertici del confine


def t_regione(seq):
    assert len(seq) == 4 and set(seq) <= set(PUNTI)
    border = [confine(math.radians(a)) for a in range(0, 360, 5)]
    body = [polygon(border, f'fill="{TINT}" stroke="{DARK}" stroke-width="4" stroke-linejoin="round"', ' id="confine"')]
    facts, descr = {}, []
    nomi = {'i': 'dentro', 'f': 'fuori', 's': 'sulla linea'}
    frasi = {'i': 'nella parte colorata, lontano dalla linea', 'f': 'nella parte bianca, lontano dalla linea',
             's': 'proprio sopra la linea'}
    for k, ch in enumerate(seq):
        label = 'ABCD'[k]
        if ch == 's':
            x, y = confine(math.radians(PUNTI['s'][k]))
            ox, oy = (x - 160) / 92, (y - 124) / 64
            lx, ly = x + 16 * ox / math.hypot(ox, oy) + (8 if ox > 0 else -8), y + 16 * oy / math.hypot(ox, oy) + 8
        else:
            x, y = PUNTI[ch][k]
            lx, ly = x + 17, y + 8
        body.append(circle(x, y, 7, f'fill="{DARK}"'))
        body.append(text(lx, ly, label, 20))
        facts[label] = nomi[ch]
        descr.append(f'{label} {frasi[ch]}')
    alt = 'Una linea chiusa colorata dentro e quattro punti: ' + '; '.join(descr) + '.'
    return body, facts, alt


# ------------------------------------------------------------ T9 ritmi

def forma_piccola(ch, cx, cy, s=28):
    if ch == 'c':
        return circle(cx, cy, s / 2, fill(BLUE))
    if ch == 'q':
        return square(cx, cy, s, fill(VERM))
    return polygon(triangle_up(cx, cy + 2, s + 4), fill(DARK))


def t_ritmo(motivo, k):
    assert set(motivo) <= set('cqt') and len(set(motivo)) > 1 and 2 * len(motivo) <= k <= 7
    seq = [motivo[i % len(motivo)] for i in range(k)]
    x = 160 - k * 18
    body = [forma_piccola(ch, x + 36 * i, 120) for i, ch in enumerate(seq)]
    qx = x + 36 * k
    body.append(f'<rect x="{qx - 16}" y="104" width="32" height="32" rx="4" fill="#fff" stroke="{DARK}" stroke-width="3" stroke-dasharray="5 4"/>')
    body.append(text(qx, 128, '?', 22))
    nomi = [FORME[ch] for ch in seq]
    facts = {'sequenza': nomi, 'prossimo': FORME[motivo[k % len(motivo)]]}
    return body, facts, 'Una fila di figure: ' + ', '.join(nomi) + '. Alla fine un riquadro con il punto di domanda.'


# ------------------------------------------------------------ T10 misure

def t_strisce(lens):
    assert len(lens) in (2, 3) and all(1 <= v <= 10 for v in lens)
    s = sorted(lens)
    assert all(b - a >= 2 for a, b in zip(s, s[1:])), 'lunghezze troppo vicine'
    ys = [85, 155] if len(lens) == 2 else [65, 120, 175]
    body = [f'<path d="M64 {ys[0] - 26}V{ys[-1] + 26}" stroke="{DARK}" stroke-width="2"/>']
    facts = {}
    for k, (v, y) in enumerate(zip(lens, ys)):
        label = 'ABC'[k]
        body.append(f'<rect x="64" y="{y - 14}" width="{22 * v}" height="28" {fill(BLUE if k % 2 == 0 else VERM)}/>')
        if v > 1:  # i quadretti si contano: una riga bianca fra uno e l'altro
            body.append(f'<path d="{"".join(f"M{64 + 22 * i} {y - 13}V{y + 13}" for i in range(1, v))}" stroke="#fff" stroke-width="2"/>')
        body.append(text(38, y + 9, label))
        facts[label] = v
    labels = 'ABC'[:len(lens)]
    facts['piu_lunga'] = labels[lens.index(max(lens))]
    facts['piu_corta'] = labels[lens.index(min(lens))]
    alt = f'{["Due", "Tre"][len(lens) - 2]} strisce che partono dalla stessa linea: ' + '; '.join(f'{labels[k]} lunga {plural(v, "quadretto", "quadretti")}' for k, v in enumerate(lens)) + '.'
    return body, facts, alt


def t_bilancia(heavy):
    assert heavy in ('a', 'b')
    tilt = 18 if heavy == 'a' else -18
    yl, yr = 100 + tilt, 100 - tilt
    body = [polygon([(160, 100), (138, 204), (182, 204)], fill(LIGHT)),
            f'<path d="M110 206H210" stroke="{DARK}" stroke-width="4"/>',
            f'<line id="giogo" x1="70" y1="{yl}" x2="250" y2="{yr}" stroke="{DARK}" stroke-width="6" stroke-linecap="round"/>',
            circle(160, 100, 6, f'fill="{DARK}"')]
    for x, y, label, obj in ((70, yl, 'A', 'q'), (250, yr, 'B', 'c')):
        py = y + 50
        body.append(f'<path d="M{x} {y}L{x - 30} {py}M{x} {y}L{x + 30} {py}M{x - 36} {py}H{x + 36}" fill="none" stroke="{DARK}" stroke-width="3"/>')
        body.append(square(x, py - 17, 30, fill(VERM)) if obj == 'q' else circle(x, py - 17, 16, fill(BLUE)))
        body.append(text(x, py + 30, label))
    facts = {'piu_pesante': heavy.upper()}
    alt = ('Una bilancia a due piatti. Sul piatto A c\'è un cubo, sul piatto B una palla. '
           f'Il piatto {heavy.upper()} è più in basso dell\'altro.')
    return body, facts, alt


# ------------------------------------------------------------ T11 ideogramma

def t_ideogramma(counts):
    assert len(counts) == 3 and all(1 <= v <= 8 for v in counts) and len(set(counts)) == 3
    body = [f'<path d="M20 93H300M20 151H300" stroke="{LIGHT}" stroke-width="2"/>']
    facts = {}
    for k, (v, y) in enumerate(zip(counts, (64, 122, 180))):
        label = 'ABC'[k]
        body.append(text(34, y + 9, label))
        body += [forma_piccola('cqt'[k], 76 + 30 * i, y, 22) for i in range(v)]
        facts[label] = v
    facts['piu'] = 'ABC'[counts.index(max(counts))]
    facts['meno'] = 'ABC'[counts.index(min(counts))]
    nomi = [('cerchio', 'cerchi'), ('quadrato', 'quadrati'), ('triangolo', 'triangoli')]
    alt = 'Tre righe di disegni: ' + '; '.join(f'riga {"ABC"[k]} {plural(v, *nomi[k])}' for k, v in enumerate(counts)) + '.'
    return body, facts, alt


# ------------------------------------------------------------ id -> figura

PATTERNS = [
    (r'c1-conta-(mele|palline|stelle|cubi)-(\d+)(?:-(\d+))?', lambda m: t_conta(m[1], int(m[2]), int(m[3]) if m[3] else None)),
    (r'c1-confronto-(\d+)-(\d+)', lambda m: t_confronto(int(m[1]), int(m[2]))),
    (r'c1-retta-(\d+)-(\d+)-salto-(\d+)-(\d+)', lambda m: t_retta(int(m[1]), int(m[2]), 'salto', int(m[3]), int(m[4]))),
    (r'c1-retta-(\d+)-(\d+)-manca-(\d+)', lambda m: t_retta(int(m[1]), int(m[2]), 'manca', int(m[3]))),
    (r'c1-decine-(\d)-(\d)', lambda m: t_decine(int(m[1]), int(m[2]))),
    (r'c1-forme-([cqrt]{4})', lambda m: t_forme(m[1])),
    (r'c1-posizione-(tavolo|scatola)-(sopra|sotto|dentro|destra|sinistra)', lambda m: t_posizione(m[1], m[2])),
    (r'c1-percorso-(\d)x(\d)-((?:[dsab]\d)+)(-frecce)?', lambda m: t_percorso(int(m[1]), int(m[2]), m[3], bool(m[4]))),
    (r'c1-linee-([ac]{4})', lambda m: t_linee(m[1])),
    (r'c1-regione-([ifs]{4})', lambda m: t_regione(m[1])),
    (r'c1-ritmo-([cqt]{2,3})-(\d)', lambda m: t_ritmo(m[1], int(m[2]))),
    (r'c1-strisce-(\d+)-(\d+)(?:-(\d+))?', lambda m: t_strisce([int(v) for v in m.groups() if v])),
    (r'c1-bilancia-(a|b)', lambda m: t_bilancia(m[1])),
    (r'c1-ideogramma-(\d)-(\d)-(\d)', lambda m: t_ideogramma([int(m[1]), int(m[2]), int(m[3])])),
]


def build(fid):
    """id -> (svg, modello, fatti, alt). AssertionError se l'id non e' valido."""
    for pattern, fn in PATTERNS:
        m = re.fullmatch(pattern, fid)
        if m:
            body, facts, alt = fn(m)
            assert 20 <= len(alt) <= 300 and alt.endswith('.'), f'{fid}: figureAlt {len(alt)} caratteri'
            return svg(body), fid.split('-')[1], facts, alt
    raise AssertionError(f'{fid}: nessun modello riconosce questo id')


def tracked(path):
    return subprocess.run(['git', 'ls-files', '--error-unmatch', str(path)], cwd=ROOT,
                          capture_output=True).returncode == 0


def write_figures(ids):
    manifest = json.loads(MANIFEST.read_text(encoding='utf-8')) if MANIFEST.exists() else {}
    for fid in ids:
        content, model, facts, alt = build(fid)
        path = FIG_DIR / f'{fid}.svg'
        if path.exists() and path.read_text(encoding='utf-8') != content:
            if tracked(path):
                raise SystemExit(f'{path.name} è già pubblicato e il disegno cambierebbe: usa un id nuovo')
        path.write_text(content, encoding='utf-8')
        manifest[fid] = {'modello': model, 'fatti': facts, 'alt': alt}
        print(f'{fid}.svg  {len(content.encode())} byte')
    MANIFEST.write_text(json.dumps(dict(sorted(manifest.items())), ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    return manifest


def main(argv):
    if argv[:1] == ['--shard']:
        shard = pathlib.Path(argv[1])
        rows = [json.loads(line) for line in shard.read_text(encoding='utf-8').splitlines() if line.strip()]
        ids = sorted({r['figure'] for r in rows if str(r.get('figure', '')).startswith('c1-')})
        manifest = write_figures(ids)
        for r in rows:
            if r.get('figure') in manifest:
                r['figureAlt'] = manifest[r['figure']]['alt']
        shard.write_text(''.join(json.dumps(r, ensure_ascii=False) + '\n' for r in rows), encoding='utf-8')
        print(f'{shard.name}: figureAlt aggiornati')
    elif argv and not argv[0].startswith('-'):
        write_figures(argv)
    else:
        print(__doc__)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
