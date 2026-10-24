#!/usr/bin/env python3
"""Scrive le domande di ogni materia divise per classe: json/<materia>/c<N>.json,
piu' le domande bonus di tutte le classi in json/<materia>/bonus.json.

json/<materia>.json resta l'unica fonte. Il sito pero' non lo scarica piu':
la pagina di una materia chiede solo le classi che la partita puo' usare
(quella scelta e le vicine, vedi questions-loader.js), Spacca-Muri solo la
classe scelta. Qui finiscono solo le domande attive e solo i campi che il
sito legge: niente tag, programma, note per gli insegnanti.

Le bonus stanno a parte perche' il bonus pesca anche lontano dalla classe
(getBonusPool: le piu' vicine, a qualsiasi distanza): sono poche righe e si
scaricano tutte, cosi' la regola non cambia.

Una domanda per riga, cosi' il diff di git resta leggibile.

Uso: python3 scripts/build_json_classi.py          (riscrive)
     python3 scripts/build_json_classi.py --check  (esce con 1 se non allineati)
Gira dentro `npm run freshness`; il --check dentro `npm run verify`.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

JSON_DIR = Path(__file__).resolve().parents[1] / 'json'
ESCLUSI = {'index.json', 'changelog.json'}
CLASSI = range(1, 6)
# I campi che questions-loader.js, subject-quiz-core.js e js/breakout.js
# leggono da una riga. Un campo nuovo letto dal sito va aggiunto qui.
CAMPI = ('id', 'class', 'area', 'subarea', 'difficulty', 'question', 'options', 'answerIndex',
         'answer', 'explanation', 'language', 'answerLang', 'bonus', 'bonusRaw', 'figure', 'figureAlt')


def file_divisi(sorgente: Path) -> dict[str, list[dict]]:
    dati = json.loads(sorgente.read_text(encoding='utf-8'))
    out: dict[str, list[dict]] = {f'c{c}': [] for c in CLASSI}
    out['bonus'] = []
    for riga in dati['questions']:
        if riga.get('active') is False:
            continue
        nome = 'bonus' if riga.get('bonus') is True else f'c{riga["class"]}'
        if nome not in out:
            sys.exit(f'[ERROR] {sorgente.name}: {riga.get("id")} ha class {riga["class"]}')
        out[nome].append({k: riga[k] for k in CAMPI if k in riga})
    return out


def testo(righe: list[dict]) -> str:
    corpo = ',\n'.join(json.dumps(r, ensure_ascii=False, separators=(',', ':')) for r in righe)
    return '{"questions":[\n' + corpo + '\n]}\n' if righe else '{"questions":[]}\n'


def main() -> None:
    controllo = '--check' in sys.argv[1:]
    diversi = []
    for sorgente in sorted(JSON_DIR.glob('*.json')):
        if sorgente.name in ESCLUSI:
            continue
        cartella = JSON_DIR / sorgente.stem
        for nome, righe in file_divisi(sorgente).items():
            dest = cartella / f'{nome}.json'
            nuovo = testo(righe)
            vecchio = dest.read_text(encoding='utf-8') if dest.exists() else None
            if nuovo == vecchio:
                continue
            if controllo:
                diversi.append(str(dest.relative_to(JSON_DIR.parent)))
                continue
            cartella.mkdir(exist_ok=True)
            dest.write_text(nuovo, encoding='utf-8')
            print(f'[OK] {dest.relative_to(JSON_DIR.parent)}: {len(righe)} domande')
    if diversi:
        print('[ERROR] json per classe non allineati, lancia npm run freshness:')
        for d in diversi:
            print(f'  {d}')
        sys.exit(1)
    if controllo:
        print('[OK] json per classe allineati')


if __name__ == '__main__':
    main()
