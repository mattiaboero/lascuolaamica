#!/usr/bin/env python3
"""Scrive in tabelline.html le tabelline dall'11 al 100.

Testo statico, generato qui e non dal browser: si legge senza JavaScript, lo
trovano i motori di ricerca e ogni riga ha un'ancora (#tabellina-27).
Una riga di testo per numero, non una tabella da 900 celle: con lo screen
reader si ascolta una tabellina alla volta.

Scrive fra i marcatori <!-- TABELLINE-11-100:INIZIO --> e
<!-- TABELLINE-11-100:FINE -->. Gira dentro `npm run freshness`.

PAGINE_SINGOLE: le tabelline che hanno anche una pagina propria
(/tabellina-del-27, scritta da build_tabelline_pagine.py). Qui la riga
porta alla pagina; l'elenco lo leggono anche il generatore delle pagine e
generate_sitemap.py. Per aggiungere una pagina basta un numero qui.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

PAGINA = Path(__file__).resolve().parents[1] / 'tabelline.html'
MARCATORI = re.compile(r'(<!-- TABELLINE-11-100:INIZIO[^>]*-->\n)(.*?)( *<!-- TABELLINE-11-100:FINE -->)', re.S)
RIENTRO = '      '

# Prima tornata (28/10/2026): le tabelline con almeno 30 impressioni in Search
# Console dal 29/9 al 26/10. In ordine crescente.
PAGINE_SINGOLE = (14, 16, 17, 20, 22, 23, 24, 26, 27, 28, 29, 32, 34, 35, 36,
                  42, 43, 45, 48, 52, 54, 56, 60, 64, 72)


def vocale(n: int) -> bool:
    """Numeri che si leggono con una vocale iniziale: uno, otto, undici,
    ottanta..., ottocento... Diciotto no: «del 18»."""
    return n in (1, 8, 11) or 80 <= n <= 89 or 800 <= n <= 899


def di(n: int) -> str:
    return f"dell'{n}" if vocale(n) else f'del {n}'


def da(n: int) -> str:
    return f"dall'{n}" if vocale(n) else f'dal {n}'


def a(n: int) -> str:
    return f"all'{n}" if vocale(n) else f'al {n}'


def blocco() -> str:
    righe = []
    decine = [(d, d + 9) for d in range(11, 101, 10)]
    righe.append('<nav class="tab-decine" id="indice-decine" aria-label="Decine delle tabelline dall\'11 al 100">')
    righe.append('  <ul>')
    for inizio, fine in decine:
        righe.append(f'    <li><a href="#tabelline-{inizio}-{fine}">{da(inizio).capitalize()} {a(fine)}</a></li>')
    righe.append('  </ul>')
    righe.append('</nav>')
    for inizio, fine in decine:
        # tabindex="-1": il link dell'indice porta qui anche il focus, non solo
        # lo scorrimento, e il Tab successivo riparte dalla decina.
        righe.append(f'<h3 class="section-title" id="tabelline-{inizio}-{fine}" tabindex="-1">Tabelline {da(inizio)} {a(fine)}</h3>')
        righe.append('<ul class="tab-oltre" role="list">')
        for n in range(inizio, fine + 1):
            multipli = ', '.join(str(n * k) for k in range(1, 11))
            nome = f'Tabellina {di(n)}'
            if n in PAGINE_SINGOLE:
                nome = f'<a href="/tabellina-del-{n}">{nome}</a>'
            righe.append(f'  <li id="tabellina-{n}"><strong>{nome}:</strong> {multipli}</li>')
        righe.append('</ul>')
    return '\n'.join(RIENTRO + r for r in righe)


def main() -> None:
    testo = PAGINA.read_text(encoding='utf-8')
    if not MARCATORI.search(testo):
        sys.exit('[ERROR] tabelline.html: mancano i marcatori <!-- TABELLINE-11-100:INIZIO --> e <!-- TABELLINE-11-100:FINE -->')
    nuovo = MARCATORI.sub(lambda m: m.group(1) + blocco() + '\n' + m.group(3), testo, count=1)
    if nuovo == testo:
        print('[OK] tabelline.html: tabelline 11-100 gia\' allineate')
        return
    PAGINA.write_text(nuovo, encoding='utf-8')
    print('[OK] tabelline.html: tabelline 11-100 riscritte')


if __name__ == '__main__':
    main()
