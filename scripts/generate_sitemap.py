#!/usr/bin/env python3
"""Genera sitemap.xml con lastmod derivato dalla storia git dei file.

Il lastmod di una pagina e' la data piu' recente fra il suo HTML e le sue
dipendenze proprie: i JS e i CSS che solo quella pagina carica, le sue domande
(json/<pagina>.json e json/<pagina>/) e i suoi dati (js/<pagina>-*.json). I file
condivisi da piu' pagine (shared.js, tokens.css...) non contano: altrimenti ogni
release darebbe a tutte le pagine la data di oggi. Una pagina non toccata
mantiene la sua data. scripts/indexnow.js segnala solo le pagine con lastmod
dalla data indicata in poi.

Niente <changefreq> e <priority>: Google li ignora dichiaratamente e Bing li
usa al piu' come suggerimento debole. Erano peso morto (voce 19 dell'audit
dell'11/09/2026).
"""

from __future__ import annotations

from datetime import datetime
from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
SITEMAP_PATH = ROOT / "sitemap.xml"

sys.path.insert(0, str(Path(__file__).resolve().parent))
# Le pagine /tabellina-del-<N>: l'elenco sta in un solo punto.
from build_tabelline import PAGINE_SINGOLE  # noqa: E402

PAGES = [
    ("/", "index.html"),
    ("/matematica", "matematica.html"),
    ("/tabelline", "tabelline.html"),
    *[(f"/tabellina-del-{n}", f"tabellina-del-{n}.html") for n in PAGINE_SINGOLE],
    ("/inglese", "inglese.html"),
    ("/problemi", "problemi.html"),
    ("/civica", "civica.html"),
    ("/geografia", "geografia.html"),
    ("/storia", "storia.html"),
    ("/scienze", "scienze.html"),
    ("/italiano", "italiano.html"),
    ("/breakout", "breakout.html"),
    ("/bosco", "bosco.html"),
    ("/sistema-solare", "sistema-solare.html"),
    ("/chi-siamo", "chi-siamo.html"),
    ("/per-insegnanti", "per-insegnanti.html"),
    ("/per-genitori", "per-genitori.html"),
    ("/guida-compiti", "guida-compiti.html"),
    ("/ai-info", "ai-info.html"),
    ("/faq", "faq.html"),
    ("/premi", "premi.html"),
    ("/accessibilita", "accessibilita.html"),
    ("/supporta", "supporta.html"),
    ("/privacy", "privacy.html"),
    ("/cookie", "cookie.html"),
]


sys.path.insert(0, str(Path(__file__).resolve().parent))
from git_dates import dirty_files, last_modified_date  # noqa: E402


RIFERIMENTO_RE = re.compile(r'(?:src|href)="/?([^"#?:]+\.(?:js|css))"')


def riferimenti(source_file: str) -> set[str]:
    """JS e CSS locali che l'HTML carica."""
    html = (ROOT / source_file).read_text(encoding="utf-8")
    return {m.group(1) for m in RIFERIMENTO_RE.finditer(html) if (ROOT / m.group(1)).is_file()}


def dipendenze_proprie(source_file: str, usi: dict[str, int]) -> list[str]:
    """File che contano per la data della pagina, HTML compreso."""
    stem = Path(source_file).stem
    propri = sorted(f for f in riferimenti(source_file) if usi[f] == 1)
    domande = [f"json/{stem}.json"] if (ROOT / "json" / f"{stem}.json").is_file() else []
    if (ROOT / "json" / stem).is_dir():
        domande += sorted(f"json/{stem}/{f.name}" for f in (ROOT / "json" / stem).glob("*.json"))
    dati = sorted(f"js/{f.name}" for f in (ROOT / "js").glob(f"{stem}-*.json"))
    return [source_file] + propri + domande + dati


def main() -> int:
    lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    dirty = dirty_files(ROOT)
    usi: dict[str, int] = {}
    for _, source_file in PAGES:
        for f in riferimenti(source_file):
            usi[f] = usi.get(f, 0) + 1
    for route, source_file in PAGES:
        loc = "https://lascuolaamica.it/" if route == "/" else f"https://lascuolaamica.it{route}"
        lastmod = max(last_modified_date(f, ROOT, dirty) for f in dipendenze_proprie(source_file, usi))
        lines.extend(
            [
                "  <url>",
                f"    <loc>{loc}</loc>",
                f"    <lastmod>{lastmod}</lastmod>",
                "  </url>",
            ]
        )
    lines.append("</urlset>")
    SITEMAP_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"[OK] sitemap.xml aggiornato ({len(PAGES)} URL)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
