#!/usr/bin/env python3
"""Estrae il prossimo lotto per la revisione linguistica manuale.

Le domande con uno scheletro ricorrente sono coperte dalle regole di
lint_content.js: se una e' sbagliata lo sono tutte, e una regex le trova tutte.
Restano quelle con scheletro unico, dove un errore si vede solo leggendo. Questo
script campiona da quelle, escludendo i lotti gia' revisionati e tenendone
traccia in reports/revisione-linguistica.json.

  python3 scripts/sample_review_batch.py            # mostra il prossimo lotto
  python3 scripts/sample_review_batch.py --registra # lo segna come revisionato
"""

import json, re, glob, random, sys, collections
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REGISTRO = ROOT / 'reports' / 'revisione-linguistica.json'
DIMENSIONE = 60

NOMI = re.compile(r'\b(Marco|Luca|Anna|Sara|Giulia|Matteo|Sofia|Priya|Ahmed|Chen|Elena|Paolo|Maria|Giovanni|Laura|Marta|Davide|Chiara|Simone|Alice|Serena|Stefano|Martina|Tommaso|Arianna|Pietro|Gianni|Claudia|Mario|Nicola|Giacomo|Daniele|Amir)\b')


def scheletro(t):
    return NOMI.sub('NOME', re.sub(r'\d+([.,]\d+)?', '#', t or '')).replace('’', "'").strip()


def carica():
    tutte = []
    for f in sorted(glob.glob(str(ROOT / 'json' / '*.json'))):
        if 'index' in f or 'changelog' in f:
            continue
        d = json.loads(Path(f).read_text(encoding='utf-8'))
        qs = d.get('questions') if isinstance(d, dict) else d
        if not isinstance(qs, list):
            continue
        for q in qs:
            if q.get('subject') != 'inglese':
                tutte.append(q)
    conta = collections.Counter(scheletro(q.get('question')) for q in tutte)
    return [q for q in tutte if conta[scheletro(q.get('question'))] == 1]


def registro():
    if REGISTRO.exists():
        return json.loads(REGISTRO.read_text(encoding='utf-8'))
    return {'lotti': [], 'revisionate': []}


def main():
    uniche = carica()
    reg = registro()
    viste = set(reg['revisionate'])
    da_vedere = [q for q in uniche if q['id'] not in viste]

    numero = len(reg['lotti']) + 1
    random.seed(20260906 + numero)
    campione = random.sample(da_vedere, min(DIMENSIONE, len(da_vedere)))

    print(f"lotto {numero} — {len(campione)} domande")
    print(f"scheletro unico: {len(uniche)} | gia' revisionate: {len(viste)} | rimanenti: {len(da_vedere)}\n")
    for i, q in enumerate(campione, 1):
        print(f"--- {i}. [{q['id']}] ({q['subject']}, classe {q['class']})")
        print(f"D: {q['question']}")
        print(f"O: {' | '.join(str(o) for o in q.get('options', []))}")
        e = (q.get('explanation') or '').strip()
        if e:
            print(f"S: {e[:220]}")

    if '--registra' in sys.argv:
        reg['lotti'].append({'numero': numero, 'domande': [q['id'] for q in campione]})
        reg['revisionate'] = sorted(viste | {q['id'] for q in campione})
        REGISTRO.parent.mkdir(exist_ok=True)
        REGISTRO.write_text(json.dumps(reg, ensure_ascii=False, indent=1), encoding='utf-8')
        print(f"\nregistrato: {len(reg['revisionate'])} domande revisionate in totale")


main()
