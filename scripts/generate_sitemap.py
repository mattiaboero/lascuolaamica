#!/usr/bin/env python3
"""Genera sitemap.xml con lastmod derivato dalla storia git dei file.

Niente <changefreq> e <priority>: Google li ignora dichiaratamente e Bing li
usa al piu' come suggerimento debole. Erano peso morto (voce 19 dell'audit
dell'11/09/2026).
"""

from __future__ import annotations

from datetime import datetime
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
SITEMAP_PATH = ROOT / "sitemap.xml"

PAGES = [
    ("/", "index.html"),
    ("/matematica", "matematica.html"),
    ("/tabelline", "tabelline.html"),
    ("/inglese", "inglese.html"),
    ("/problemi", "problemi.html"),
    ("/civica", "civica.html"),
    ("/geografia", "geografia.html"),
    ("/storia", "storia.html"),
    ("/scienze", "scienze.html"),
    ("/italiano", "italiano.html"),
    ("/breakout", "breakout.html"),
    ("/bosco", "bosco.html"),
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
    ("/link", "link.html"),
]


sys.path.insert(0, str(Path(__file__).resolve().parent))
from git_dates import dirty_files, last_modified_date  # noqa: E402


def main() -> int:
    lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    dirty = dirty_files(ROOT)
    for route, source_file in PAGES:
        loc = "https://lascuolaamica.it/" if route == "/" else f"https://lascuolaamica.it{route}"
        lastmod = last_modified_date(source_file, ROOT, dirty)
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
