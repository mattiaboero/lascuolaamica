#!/usr/bin/env python3
"""Scrive una pagina per ogni tabellina di PAGINE_SINGOLE (build_tabelline.py).

Le query di Search Console sono quasi tutte «tabellina del N», e /tabelline,
che si chiama «Tabelline da 1 a 100», non prende clic (CTR 0,2% a ottobre
2026). Ogni pagina risponde a una sola domanda: tabella da × 1 a × 20 e tre o
quattro trucchi per farla a mente, con gli esempi calcolati qui.

Scrive tabellina-del-<N>.html nella radice e, in llms.txt, la riga che
comincia con RIGA_LLMS. Riscrive un file solo se cambia: le date dei JSON-LD
restano quelle che il file ha gia' (le aggiorna refresh_structured_data.py,
che in npm run freshness gira dopo questo script). Una pagina nuova parte con
la data di oggi.

Uso: python3 scripts/build_tabelline_pagine.py          (dentro npm run freshness)
     python3 scripts/build_tabelline_pagine.py --check  (dentro npm run verify)
"""

from __future__ import annotations

import json
import re
import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_tabelline import PAGINE_SINGOLE, a, da, di  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
ORIGINE = 'https://lascuolaamica.it'
RIGA_LLMS = '- Tabelline con una pagina propria'
DATA_RE = re.compile(r'"(datePublished|dateModified)": "(\d{4}-\d{2}-\d{2})"')


def nome_file(n: int) -> str:
    return f'tabellina-del-{n}.html'


def url(n: int) -> str:
    return f'{ORIGINE}/tabellina-del-{n}'


def elenco(n: int, da_k: int, a_k: int) -> str:
    return ', '.join(str(n * k) for k in range(da_k, a_k + 1))


def titolo(n: int) -> str:
    return f'Tabellina {di(n)}: tabella fino a {n * 10} e trucchi'


def descrizione(n: int) -> str:
    return (f'La tabellina {di(n)} {da(n)} {a(n * 10)} e poi fino a {n * 20}, '
            f'con la tabella e i trucchi per farla a mente. Gratis, per la scuola primaria.')


def fattore(n: int) -> tuple[int, int] | None:
    """Doppio, triplo o quadruplo di un numero fino al 10."""
    for volte in (2, 3, 4):
        if n % volte == 0 and 2 <= n // volte <= 10:
            return volte, n // volte
    return None


NOMI_VOLTE = {2: 'il doppio', 3: 'il triplo', 4: 'il quadruplo'}
PER_VOLTE = {2: 'raddoppia', 3: 'moltiplica per 3', 4: 'moltiplica per 4'}


def trucchi(n: int) -> list[tuple[str, list[str]]]:
    """Titolo e frasi di ogni trucco. Gli esempi cambiano con il numero."""
    decine, unita = (n // 10) * 10, n % 10
    coppia = fattore(n)
    # Moltiplicatori degli esempi: cambiano da pagina a pagina. Si scartano
    # quelli che in un passo danno il numero stesso (6 × 6 = 36 nella pagina
    # del 36, 9 × 3 = 27 in quella del 27), che confondono.
    k = next(x for x in (6, 7, 8, 9, 6, 7, 8)[n % 4:] if unita * x != n)
    m = next(x for x in (4, 6, 7, 3, 4, 6)[n % 3:] if x != k and not (coppia and x == coppia[0]))
    out: list[tuple[str, list[str]]] = []
    if unita == 0:
        out.append(('Conta le decine', [
            f'{n} è fatto di {n // 10} decine. Fai {n // 10} × {k} e aggiungi uno zero.',
            f'Per {n} × {k}: {n // 10} × {k} = {(n // 10) * k}, con lo zero {n * k}.',
        ]))
    else:
        out.append(('Dividi in decine e unità', [
            f'Dividi {n} in {decine} e {unita}. Moltiplica le due parti e somma i risultati.',
            f'Per {n} × {k}: {decine} × {k} = {decine * k}, {unita} × {k} = {unita * k}, '
            f'{decine * k} + {unita * k} = {n * k}.',
        ]))
    out.append(('Raddoppia', [
        'Per fare × 4 raddoppia due volte. Per fare × 8 raddoppia tre volte.',
        f'{n} × 2 = {n * 2}, {n * 2} × 2 = {n * 4}, {n * 4} × 2 = {n * 8}. '
        f'Quindi {n} × 4 = {n * 4} e {n} × 8 = {n * 8}.',
    ]))
    out.append(('Il × 5 è metà del × 10', [
        f'{n} × 10 = {n * 10}. La metà di {n * 10} è {n * 5}: quindi {n} × 5 = {n * 5}.',
    ]))
    if coppia:
        volte, base = coppia
        out.append(('Parti da una tabellina che conosci', [
            f'{n} è {NOMI_VOLTE[volte]} di {base}. Fai la tabellina {di(base)}, poi {PER_VOLTE[volte]}.',
            f'Per {n} × {m}: {base} × {m} = {base * m}, {base * m} × {volte} = {n * m}.',
        ]))
    elif unita in (8, 9):
        tonda, meno = decine + 10, 10 - unita
        volte_meno = 'una volta' if meno == 1 else f'{meno} volte'
        out.append(('Parti dalla decina dopo', [
            f'{n} è {tonda} meno {meno}. Fai il conto con {tonda}, poi togli {volte_meno} il numero per cui moltiplichi.',
            f'Per {n} × {m}: {tonda} × {m} = {tonda * m}, {meno} × {m} = {meno * m}, '
            f'{tonda * m} − {meno * m} = {n * m}.',
        ]))
    return out


def json_ld(dati: dict) -> str:
    return '<script type="application/ld+json">\n' + json.dumps(dati, ensure_ascii=False, indent=2) + '\n</script>'


def tabella(n: int, da_k: int, a_k: int, id_titolo: str) -> list[str]:
    righe = [
        f'      <div class="tab-table-wrap" tabindex="0" role="region" aria-labelledby="{id_titolo}">',
        '        <table class="tab-table">',
        f'          <caption>La tabellina {di(n)} {da(n * da_k)} {a(n * a_k)}.</caption>',
        '          <thead>',
        '            <tr><th scope="col">Moltiplicazione</th><th scope="col">Risultato</th></tr>',
        '          </thead>',
        '          <tbody>',
    ]
    righe += [f'          <tr><th scope="row">{n} × {k}</th><td>{n * k}</td></tr>' for k in range(da_k, a_k + 1)]
    righe += ['          </tbody>', '        </table>', '      </div>']
    return righe


def pagina(n: int, pubblicata: str, modificata: str) -> str:
    i = PAGINE_SINGOLE.index(n)
    prima = PAGINE_SINGOLE[i - 1] if i > 0 else None
    dopo = PAGINE_SINGOLE[i + 1] if i + 1 < len(PAGINE_SINGOLE) else None
    t, d = titolo(n), descrizione(n)
    web_page = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        'name': f'Tabellina {di(n)}',
        'description': d,
        'url': url(n),
        'inLanguage': 'it-IT',
        'isPartOf': {'@type': 'WebSite', 'name': 'La Scuola Amica', 'url': f'{ORIGINE}/'},
        'datePublished': pubblicata,
        'dateModified': modificata,
    }
    briciole = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': f'{ORIGINE}/'},
            {'@type': 'ListItem', 'position': 2, 'name': 'Matematica', 'item': f'{ORIGINE}/matematica'},
            {'@type': 'ListItem', 'position': 3, 'name': 'Tabelline', 'item': f'{ORIGINE}/tabelline'},
            {'@type': 'ListItem', 'position': 4, 'name': f'Tabellina {di(n)}', 'item': url(n)},
        ],
    }
    vicine = []
    if prima:
        vicine.append(f'        <li><a href="/tabellina-del-{prima}">Tabellina {di(prima)}</a></li>')
    if dopo:
        vicine.append(f'        <li><a href="/tabellina-del-{dopo}">Tabellina {di(dopo)}</a></li>')
    blocchi_trucchi = []
    for j, (nome, frasi) in enumerate(trucchi(n), start=1):
        blocchi_trucchi.append(f'      <h3 class="section-title">{j}. {nome}</h3>')
        blocchi_trucchi += [f'      <p class="text">{f}</p>' for f in frasi]
    righe = [
        '<!DOCTYPE html>',
        '<html lang="it-IT">',
        '<head>',
        '<meta charset="UTF-8">',
        '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
        '<link rel="dns-prefetch" href="https://lascuolaamica.it">',
        '<link rel="preconnect" href="https://lascuolaamica.it" crossorigin>',
        '<meta name="referrer" content="strict-origin-when-cross-origin">',
        f'<title>{t}</title>',
        f'<meta name="description" content="{d}">',
        '<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">',
        f'<link rel="canonical" href="{url(n)}">',
        f'<meta property="og:url" content="{url(n)}">',
        '<meta property="og:image" content="https://lascuolaamica.it/screenshots/og-tabelline-1200x630.jpg">',
        '<meta property="og:image:width" content="1200">',
        '<meta property="og:image:height" content="630">',
        '<meta property="og:image:alt" content="Le copertine dei video sulle tabelline dal 2 al 10 con CalcOlettore">',
        '<meta name="twitter:image" content="https://lascuolaamica.it/screenshots/og-tabelline-1200x630.jpg">',
        '<meta property="og:type" content="website">',
        '<meta property="og:locale" content="it_IT">',
        '<meta property="og:site_name" content="La Scuola Amica">',
        f'<meta property="og:title" content="{t}">',
        f'<meta property="og:description" content="{d}">',
        '<meta name="twitter:card" content="summary_large_image">',
        f'<meta name="twitter:title" content="{t}">',
        f'<meta name="twitter:description" content="{d}">',
        '<link rel="manifest" href="manifest.json">',
        '<meta name="theme-color" content="#9B5DE5">',
        '<link rel="icon" type="image/svg+xml" href="/favicon.svg">',
        '<link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png">',
        '<link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png">',
        '<link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png">',
        '<meta name="mobile-web-app-capable" content="yes">',
        '<meta name="apple-mobile-web-app-status-bar-style" content="default">',
        '<meta name="apple-mobile-web-app-title" content="Scuola Amica">',
        '<link rel="stylesheet" href="tokens.css">',
        '<link rel="stylesheet" href="info-pages.css">',
        '<link rel="preload" href="assets/fonts/fredoka-v17-latin-700.woff2" as="font" type="font/woff2" crossorigin>',
        '<link rel="preload" href="assets/fonts/nunito-v32-latin-regular.woff2" as="font" type="font/woff2" crossorigin>',
        '<link rel="stylesheet" href="fonts.css">',
        '<link rel="stylesheet" href="utilities.css">',
        json_ld(web_page),
        json_ld(briciole),
        '<script defer src="js/lazy-css.js"></script>',
        '<script defer src="js/dom-utils.js"></script>',
        '</head>',
        '<body class="info-page page-tabelline page-tabellina">',
        '<!-- Generato da scripts/build_tabelline_pagine.py: non modificare a mano. -->',
        '<a class="skip-link" href="#contenuto-principale">Vai al contenuto principale</a>',
        '',
        '<div class="wrapper">',
        '  <div class="top-links">',
        '    <a class="back-btn" href="/" aria-label="Torna al menu principale">← Torna al menu</a>',
        '    <a class="link-btn" href="/tabelline" aria-label="Apri tutte le tabelline">Tabelline</a>',
        '    <a class="link-btn" href="/matematica" aria-label="Apri i quiz di matematica">Matematica</a>',
        '  </div>',
        '',
        '  <nav class="breadcrumbs" aria-label="Percorso di navigazione">',
        '    <a href="/">Home</a>',
        '    <span aria-hidden="true">›</span>',
        '    <a href="/matematica">Matematica</a>',
        '    <span aria-hidden="true">›</span>',
        '    <a href="/tabelline">Tabelline</a>',
        '    <span aria-hidden="true">›</span>',
        f'    <span aria-current="page">Tabellina {di(n)}</span>',
        '  </nav>',
        '',
        '  <main class="card" id="contenuto-principale" aria-labelledby="tabellinaTitle">',
        f'    <h1 class="title" id="tabellinaTitle">Tabellina {di(n)}</h1>',
        '',
        f'    <p class="text"><strong>La tabellina {di(n)} è: {elenco(n, 1, 10)}.</strong></p>',
        '    <p class="text">',
        f'      Ogni risultato è il precedente più {n}.',
        f'      Qui sotto trovi la tabella fino a {n} × 20 e i trucchi per farla a mente.',
        '    </p>',
        '',
        '    <section class="section" aria-labelledby="tabellaTitle">',
        f'      <h2 id="tabellaTitle">Tabellina {di(n)} da × 1 a × 10</h2>',
        *tabella(n, 1, 10, 'tabellaTitle'),
        '    </section>',
        '',
        '    <section class="section" aria-labelledby="tabella20Title">',
        f'      <h2 id="tabella20Title">Tabellina {di(n)} da × 11 a × 20</h2>',
        f'      <p class="text">Si continua allo stesso modo: {elenco(n, 11, 20)}.</p>',
        *tabella(n, 11, 20, 'tabella20Title'),
        '    </section>',
        '',
        '    <section class="section" aria-labelledby="trucchiTitle">',
        f'      <h2 id="trucchiTitle">Come fare la tabellina {di(n)} a mente</h2>',
        '      <p class="text">Oltre il 10 le tabelline non si imparano a memoria: si calcolano. Questi trucchi aiutano.</p>',
        *blocchi_trucchi,
        '    </section>',
        '',
        '    <section class="section" aria-labelledby="altreTitle">',
        '      <h2 id="altreTitle">Altre tabelline</h2>',
        '      <ul class="list">',
        *vicine,
        f'        <li><a href="/tabelline#tabellina-{n}">Tutte le tabelline dall\'11 al 100</a></li>',
        '        <li><a href="/tabelline">Tabelline dal 2 al 10 con i video</a></li>',
        '        <li><a href="/matematica?area=tables">Quiz sulle tabelline dal 2 al 10</a></li>',
        '      </ul>',
        '    </section>',
        '  </main>',
        '</div>',
        '',
        FOOTER,
        '',
        '<script defer src="app-version.js"></script>',
        '<script defer src="shared.js"></script>',
        '</body>',
        '</html>',
        '',
    ]
    return '\n'.join(righe)


def footer_da_tabelline() -> str:
    """Il footer e' quello di tabelline.html, copiato: una sola fonte."""
    html = (ROOT / 'tabelline.html').read_text(encoding='utf-8')
    m = re.search(r'<footer class="site-footer".*?</footer>', html, re.S)
    if not m:
        sys.exit('[ERROR] tabelline.html: footer non trovato')
    return m.group(0)


FOOTER = footer_da_tabelline()


def riga_llms() -> str:
    link = ', '.join(f'[{di(n)}]({url(n)})' for n in PAGINE_SINGOLE)
    return f'{RIGA_LLMS} (tabella fino a × 20 e trucchi per farla a mente): {link}'


def attesi() -> dict[Path, str]:
    oggi = date.today().isoformat()
    out: dict[Path, str] = {}
    for n in PAGINE_SINGOLE:
        path = ROOT / nome_file(n)
        date_esistenti = dict(DATA_RE.findall(path.read_text(encoding='utf-8'))) if path.exists() else {}
        out[path] = pagina(n, date_esistenti.get('datePublished', oggi), date_esistenti.get('dateModified', oggi))
    llms = ROOT / 'llms.txt'
    righe = llms.read_text(encoding='utf-8').split('\n')
    pos = [i for i, r in enumerate(righe) if r.startswith(RIGA_LLMS)]
    if pos:
        righe[pos[0]] = riga_llms()
    else:
        dopo = [i for i, r in enumerate(righe) if r.startswith('- [Tabelline (')]
        if not dopo:
            sys.exit('[ERROR] llms.txt: manca la riga di /tabelline')
        righe.insert(dopo[0] + 1, riga_llms())
    out[llms] = '\n'.join(righe)
    return out


def main() -> int:
    check = '--check' in sys.argv[1:]
    errori = []
    attese = {nome_file(n) for n in PAGINE_SINGOLE}
    for extra in sorted(p.name for p in ROOT.glob('tabellina-del-*.html') if p.name not in attese):
        errori.append(f'{extra}: non e\' in PAGINE_SINGOLE (build_tabelline.py)')
    diversi = []
    for path, testo in attesi().items():
        if not path.exists() or path.read_text(encoding='utf-8') != testo:
            diversi.append(path.name)
            if not check:
                path.write_text(testo, encoding='utf-8')
    if check:
        errori += [f'{nome}: diverso dall\'uscita del generatore (npm run freshness)' for nome in diversi]
        if errori:
            for e in errori:
                print(f'[ERROR] {e}')
            return 1
        print(f'[OK] tabelline: {len(PAGINE_SINGOLE)} pagine singole e llms.txt allineati')
        return 0
    for e in errori:
        print(f'[ERROR] {e}')
    if diversi:
        print(f'[OK] tabelline: riscritti {len(diversi)} file')
    else:
        print(f'[OK] tabelline: {len(PAGINE_SINGOLE)} pagine singole e llms.txt gia\' allineati')
    return 1 if errori else 0


if __name__ == '__main__':
    raise SystemExit(main())
