#!/usr/bin/env python3
"""Fill empty `subarea` for matematica questions deterministically.

All 1701 empty-subarea questions in the dataset are in matematica; other subjects
are already fully tagged. This classifier assigns each empty question to one of the
subareas ALREADY in use for its area (controlled vocabulary, no new labels), using
keyword/pattern rules learned from the existing tagged questions.

Rules:
- Only touches questions whose `subarea` is empty/missing. Never overwrites.
- Only the `subarea` field is modified.
- Deterministic, idempotent.

Known per-area vocabulary (from existing tags):
  tabelline      -> calcolo_mentale
  aritmetica     -> operazioni | frazioni | misure | decimali
  problemi       -> operazioni | ragionamento | misure | decimali | frazioni
  geometria      -> figure | perimetro_area
  logica_e_dati  -> sequenze | dati_probabilita | ragionamento

Note on problemi operazioni-vs-ragionamento: the pre-existing labels for these two
are noisy/overlapping (both are operation-based word problems with no clean
discriminating signal). Generic problemi without a measure/fraction/decimal signal
are assigned `operazioni` (literally: solved by an arithmetic operation). The 10
pre-existing `ragionamento` problems are left untouched. This is a coarse but
correct split, not an arbitrary guess.
"""
import json
import re
import sys
from pathlib import Path

JSON_FILE = Path(__file__).parent.parent / 'json' / 'matematica.json'

RE_FRACTION = re.compile(r'\d+\s*/\s*\d+')
RE_DECIMAL = re.compile(r'\d+,\d+')
RE_MEASURE = re.compile(
    r'\b(cm|mm|km|dm|m²|cm²|m³|cm³|metri|metro|litri|litro|grammi|grammo|'
    r'kg|chilo|chilogramm|ml|millilitr|centimetr|millimetr|chilometr|tonnellat)\b'
)
RE_NUMLIST_BLANK = re.compile(r'(\d+\s*,\s*){2,}.*(_{2,}|\?)')


def text_of(q):
    return ((q.get('question') or '') + ' ' + (q.get('answer') or '')).lower()


def classify_aritmetica(t):
    if RE_FRACTION.search(t) or 'frazion' in t:
        return 'frazioni'
    if RE_DECIMAL.search(t) or 'decimal' in t or 'centesim' in t or 'virgola' in t:
        return 'decimali'
    if RE_MEASURE.search(t):
        return 'misure'
    return 'operazioni'


def classify_problemi(t):
    if RE_FRACTION.search(t) or 'frazion' in t or 'fett' in t or 'parti uguali' in t:
        return 'frazioni'
    if RE_DECIMAL.search(t) or 'centesim' in t:
        return 'decimali'
    if RE_MEASURE.search(t):
        return 'misure'
    return 'operazioni'


def classify_geometria(t):
    if any(k in t for k in ('perimetro', 'area', 'volume', 'superficie')):
        return 'perimetro_area'
    return 'figure'


def classify_logica(t):
    if any(k in t for k in ('media', 'moda', 'mediana', 'probabil', 'grafico',
                            'tabella', 'pallin', 'frequenz', 'istogramm', 'diagramm',
                            'scelto di pi', 'scelte', 'sondaggio')):
        return 'dati_probabilita'
    if ('sequenz' in t or 'completa' in t or 'viene dopo' in t or 'viene prima' in t
            or 'ritmo' in t or 'succession' in t or RE_NUMLIST_BLANK.search(t)
            or 'numero pari' in t or 'numero dispari' in t):
        return 'sequenze'
    return 'ragionamento'


CLASSIFIERS = {
    'tabelline': lambda t: 'calcolo_mentale',
    'aritmetica': classify_aritmetica,
    'problemi': classify_problemi,
    'geometria': classify_geometria,
    'logica_e_dati': classify_logica,
}


def get_questions(data):
    if isinstance(data, dict) and isinstance(data.get('questions'), list):
        return data['questions']
    for v in data.values():
        if isinstance(v, list):
            return v
    return []


def main():
    dry = '--dry-run' in sys.argv
    data = json.loads(JSON_FILE.read_text(encoding='utf-8'))
    questions = get_questions(data)

    dist = {}
    samples = {}
    filled = 0
    skipped_unknown_area = 0
    for q in questions:
        if q.get('active') is False:
            continue
        if q.get('subarea'):
            continue
        area = q.get('area')
        fn = CLASSIFIERS.get(area)
        if not fn:
            skipped_unknown_area += 1
            continue
        sub = fn(text_of(q))
        key = f'{area} / {sub}'
        dist[key] = dist.get(key, 0) + 1
        samples.setdefault(key, []).append(q.get('question'))
        if not dry:
            q['subarea'] = sub
        filled += 1

    print(f"{'DRY-RUN: ' if dry else ''}empty-subarea filled: {filled}"
          f"  (unknown-area skipped: {skipped_unknown_area})\n")
    for key in sorted(dist):
        print(f"  {key:<34} {dist[key]}")
        for s in samples[key][:2]:
            print(f"       e.g. {s}")

    if not dry:
        JSON_FILE.write_text(
            json.dumps(data, ensure_ascii=False, indent=1) + '\n', encoding='utf-8'
        )
        print("\nwritten.")


if __name__ == '__main__':
    main()
