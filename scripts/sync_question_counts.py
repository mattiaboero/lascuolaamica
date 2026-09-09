#!/usr/bin/env python3
"""Allinea ogni conteggio pubblico di domande alle sole domande attive.

Le domande con `active: false` non vengono mai servite: il loader le scarta
(`questions-loader.js`) e cosi' fa Spacca-Muri. Dopo la deduplicazione di
civica erano 656 su 9.879, e il sito continuava ad annunciarle.

I conteggi vivono sparsi — footer (via json/index.json), JSON-LD delle pagine
materia, home, FAQ, per-insegnanti, llms.txt, README, wiki — e sono gia' andati
fuori sincrono tre volte (4.12.6, 4.12.64, e adesso). Questo script e' l'unica
fonte: `--check` lo verifica in prepublish, senza argomenti riscrive.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
JSON_DIR = ROOT / 'json'
ESCLUSI = {'index.json', 'changelog.json'}


def _righe(payload):
    if isinstance(payload, list):
        return payload
    for chiave in ('questions', 'domande', 'items', 'data'):
        if isinstance(payload.get(chiave), list):
            return payload[chiave]
    return []


def conta_attive() -> dict[str, int]:
    attive = {}
    for path in sorted(JSON_DIR.glob('*.json')):
        if path.name in ESCLUSI:
            continue
        righe = _righe(json.loads(path.read_text(encoding='utf-8')))
        attive[path.stem] = sum(
            1 for q in righe
            if isinstance(q, dict) and 'id' in q and q.get('active') is not False
        )
    return attive


def _it(n: int) -> str:
    return f'{n:,}'.replace(',', '.')


def _arrotonda(n: int) -> str:
    """9.223 -> "9.200+": un arrotondamento per difetto, mai una promessa in eccesso."""
    return _it(n // 100 * 100) + '+'


def sostituzioni(attive: dict[str, int]) -> list[tuple[Path, str, str]]:
    totale = sum(attive.values())
    lavori: list[tuple[Path, str, str]] = []

    # JSON-LD delle pagine materia: numberOfQuestions della materia.
    for materia, n in attive.items():
        pagina = ROOT / f'{materia}.html'
        if pagina.exists():
            lavori.append((pagina, r'"numberOfQuestions":\s*\d+', f'"numberOfQuestions": {n}'))

    # Conteggi scritti a mano nelle pagine.
    lavori.append((ROOT / 'index.html', r'✓ [\d.]+\+ domande', f'✓ {_arrotonda(totale)} domande'))
    lavori.append((ROOT / 'faq.html', r'oltre [\d.]+ domande', f'oltre {_arrotonda(totale)[:-1]} domande'))
    for materia, etichetta in (('inglese', 'Inglese'), ('civica', 'Educazione civica'),
                               ('scienze', 'Scienze')):
        lavori.append((ROOT / 'per-insegnanti.html',
                       rf'(<strong>{etichetta}</strong> \()[\d.]+( domande\))',
                       rf'\g<1>{_it(attive[materia])}\g<2>'))

    # Documentazione e schede per gli assistenti AI.
    lavori.append((ROOT / 'llms.txt', r'Domande totali: [\d.]+ \([^)]*verificate[^)]*\)',
                   f'Domande totali: {_it(totale)} (solo quelle attive, verificate a settembre 2026)'))
    lavori.append((ROOT / 'README.md', r'badge/domande-[\d.]+-orange', f'badge/domande-{_it(totale)}-orange'))
    lavori.append((ROOT / 'README.md', r'[\d.]+ domande, più due giochi', f'{_it(totale)} domande, più due giochi'))
    lavori.append((ROOT / 'README.md', r'\*\*[\d.]+ domande\*\* su 8 materie', f'**{_it(totale)} domande** su 8 materie'))
    lavori.append((ROOT / 'CONTRIBUTING.md', r'conta oggi [\d.]+ domande', f'conta oggi {_it(totale)} domande'))
    lavori.append((ROOT / 'docs/wiki/Home.md', r'\*\*[\d.]+ domande\*\* validate', f'**{_it(totale)} domande** validate'))
    lavori.append((ROOT / 'docs/wiki/Contenuti-e-Domande.md',
                   r'conta \*\*[\d.]+ domande\*\*', f'conta **{_it(totale)} domande**'))
    return lavori


def main() -> int:
    solo_controllo = '--check' in sys.argv
    attive = conta_attive()
    totale = sum(attive.values())
    disallineati: list[str] = []

    indice_path = JSON_DIR / 'index.json'
    indice = json.loads(indice_path.read_text(encoding='utf-8'))
    atteso = dict(indice)
    atteso['totalQuestions'] = totale
    for materia, dati in atteso.get('subjects', {}).items():
        if materia in attive:
            dati['activeRows'] = attive[materia]
    if atteso != indice:
        if solo_controllo:
            disallineati.append(f'json/index.json: totalQuestions {indice.get("totalQuestions")} invece di {totale}')
        else:
            indice_path.write_text(json.dumps(atteso, ensure_ascii=False, indent=1), encoding='utf-8')
            print(f'[OK] json/index.json: totalQuestions -> {totale}')

    for path, pattern, sostituto in sostituzioni(attive):
        if not path.exists():
            continue
        testo = path.read_text(encoding='utf-8')
        nuovo, n = re.subn(pattern, sostituto, testo)
        if n == 0:
            disallineati.append(f'{path.relative_to(ROOT)}: nessuna corrispondenza per /{pattern}/')
        elif nuovo != testo:
            if solo_controllo:
                disallineati.append(f'{path.relative_to(ROOT)}: conteggio non allineato ({pattern})')
            else:
                path.write_text(nuovo, encoding='utf-8')
                print(f'[OK] {path.relative_to(ROOT)}: {n} conteggio/i allineati')

    if disallineati:
        for riga in disallineati:
            print(f'[ERRORE] {riga}')
        return 1
    print(f'conteggi allineati alle {_it(totale)} domande attive.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
