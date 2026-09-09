#!/usr/bin/env python3
"""Estrae il prossimo lotto per la revisione linguistica manuale.

Le domande con uno scheletro ricorrente sono coperte dalle regole di
lint_content.js: se una e' sbagliata lo sono tutte, e una regex le trova tutte.
Restano quelle con scheletro unico, dove un errore si vede solo leggendo. Questo
script campiona da quelle, escludendo i lotti gia' revisionati e tenendone
traccia in reports/revisione-linguistica.json.

  python3 scripts/sample_review_batch.py            # mostra il prossimo lotto
  python3 scripts/sample_review_batch.py --registra # lo segna come revisionato
  python3 scripts/sample_review_batch.py --inglese  # lotto di inglese, registro separato
  python3 scripts/sample_review_batch.py --famiglie # lotto di famiglie a scheletro ripetuto
  python3 scripts/sample_review_batch.py --istanze  # le singole istanze dentro le famiglie

Il modo --famiglie stampa due istanze per famiglia: bastano a giudicare la
forma, che nella famiglia e' identica. Non bastano per i numeri, che cambiano
da un'istanza all'altra ed e' li' che stavano quasi tutti i difetti trovati
(912 atleti per un allenatore, triangoli impossibili, un libro da 190 euro).
Il modo --istanze legge quelle rimaste: 1.793 domande mai mostrate.

In inglese non si scarta niente per scheletro ricorrente: le regole di
lint_content.js sono scritte per l'italiano e sull'inglese non guardano quasi
nulla, quindi una consegna ripetuta non e' coperta da nessun controllo e va
letta come le altre. Sono 1.094 domande, si leggono tutte.
"""

import json, re, glob, random, sys, collections
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REGISTRO = ROOT / 'reports' / 'revisione-linguistica.json'
REGISTRO_EN = ROOT / 'reports' / 'revisione-inglese.json'
REGISTRO_FAM = ROOT / 'reports' / 'revisione-famiglie.json'
REGISTRO_IST = ROOT / 'reports' / 'revisione-istanze.json'
DIMENSIONE = 60
INGLESE = '--inglese' in sys.argv
FAMIGLIE = '--famiglie' in sys.argv
ISTANZE = '--istanze' in sys.argv

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
            # le domande disattivate non arrivano piu' ai bambini: rileggerle
            # in un lotto sarebbe lavoro sprecato.
            if q.get('active') is False:
                continue
            if (q.get('subject') == 'inglese') == INGLESE:
                tutte.append(q)
    if INGLESE:
        return tutte
    conta = collections.Counter(scheletro(q.get('question')) for q in tutte)
    if FAMIGLIE:
        # Una domanda per famiglia: se il template e' rotto lo sono tutte le sue
        # istanze, e leggerle una per una sarebbe rileggere la stessa frase.
        fam = collections.OrderedDict()
        for q in tutte:
            k = scheletro(q.get('question'))
            if conta[k] > 1:
                fam.setdefault(k, []).append(q)
        return [{'scheletro': k, 'istanze': v} for k, v in fam.items()]
    if ISTANZE:
        # tutte le domande che vivono in una famiglia, non un rappresentante:
        # la forma e' gia' stata giudicata, qui si guardano i numeri.
        return [q for q in tutte if conta[scheletro(q.get('question'))] > 1]
    return [q for q in tutte if conta[scheletro(q.get('question'))] == 1]


def percorso_registro():
    if ISTANZE:
        return REGISTRO_IST
    if FAMIGLIE:
        return REGISTRO_FAM
    return REGISTRO_EN if INGLESE else REGISTRO


def registro():
    p = percorso_registro()
    if p.exists():
        return json.loads(p.read_text(encoding='utf-8'))
    return {'lotti': [], 'revisionate': []}


def main():
    uniche = carica()
    reg = registro()
    viste = set(reg['revisionate'])
    chiave = (lambda f: f['scheletro']) if FAMIGLIE else (lambda q: q['id'])
    da_vedere = [q for q in uniche if chiave(q) not in viste]

    numero = len(reg['lotti']) + 1
    random.seed(20260906 + numero)
    campione = random.sample(da_vedere, min(DIMENSIONE, len(da_vedere)))

    etichetta = 'famiglie' if FAMIGLIE else ('istanze in famiglia' if ISTANZE
                else ('bacino' if INGLESE else 'scheletro unico'))
    print(f"lotto {numero} — {len(campione)} domande")
    print(f"{etichetta}: {len(uniche)} | gia' revisionate: {len(viste)} | rimanenti: {len(da_vedere)}\n")
    for i, q in enumerate(campione, 1):
        if FAMIGLIE:
            ist = q['istanze']
            cls = sorted({x.get('class') for x in ist})
            print(f"--- {i}. famiglia di {len(ist)} ({ist[0]['subject']}, classi {cls})")
            print(f"T: {q['scheletro'][:160]}")
            for x in ist[:2]:
                print(f"  [{x['id']}] D: {x['question']}")
                print(f"       O: {' | '.join(str(o) for o in x.get('options', []))}")
                e = (x.get('explanation') or '').strip()
                if e:
                    print(f"       S: {e[:200]}")
            continue
        print(f"--- {i}. [{q['id']}] ({q['subject']}, classe {q['class']})")
        print(f"D: {q['question']}")
        print(f"O: {' | '.join(str(o) for o in q.get('options', []))}")
        e = (q.get('explanation') or '').strip()
        if e:
            print(f"S: {e[:220]}")

    if '--registra' in sys.argv:
        reg['lotti'].append({'numero': numero, 'domande': [chiave(q) for q in campione]})
        reg['revisionate'] = sorted(viste | {chiave(q) for q in campione})
        p = percorso_registro()
        p.parent.mkdir(exist_ok=True)
        p.write_text(json.dumps(reg, ensure_ascii=False, indent=1), encoding='utf-8')
        print(f"\nregistrato: {len(reg['revisionate'])} domande revisionate in totale")


main()
