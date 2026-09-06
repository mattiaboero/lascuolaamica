#!/usr/bin/env python3
"""Genera sitemap.xml con lastmod derivato dal timestamp reale dei file."""

from __future__ import annotations

from datetime import datetime
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
SITEMAP_PATH = ROOT / "sitemap.xml"

PAGES = [
    ("/", "index.html", "weekly", "1.0"),
    ("/matematica", "matematica.html", "weekly", "0.9"),
    ("/tabelline", "tabelline.html", "weekly", "0.88"),
    ("/inglese", "inglese.html", "weekly", "0.9"),
    ("/problemi", "problemi.html", "weekly", "0.9"),
    ("/civica", "civica.html", "weekly", "0.9"),
    ("/geografia", "geografia.html", "weekly", "0.85"),
    ("/storia", "storia.html", "weekly", "0.85"),
    ("/scienze", "scienze.html", "weekly", "0.85"),
    ("/italiano", "italiano.html", "weekly", "0.85"),
    ("/breakout", "breakout.html", "weekly", "0.85"),
    ("/chi-siamo", "chi-siamo.html", "monthly", "0.75"),
    ("/per-insegnanti", "per-insegnanti.html", "monthly", "0.72"),
    ("/per-genitori", "per-genitori.html", "monthly", "0.72"),
    ("/ai-info", "ai-info.html", "monthly", "0.68"),
    ("/faq", "faq.html", "weekly", "0.8"),
    ("/premi", "premi.html", "weekly", "0.76"),
    ("/accessibilita", "accessibilita.html", "monthly", "0.7"),
    ("/supporta", "supporta.html", "monthly", "0.6"),
    ("/privacy", "privacy.html", "monthly", "0.5"),
    ("/cookie", "cookie.html", "monthly", "0.5"),
]


sys.path.insert(0, str(Path(__file__).resolve().parent))
from git_dates import dirty_files, last_modified_date  # noqa: E402


def main() -> int:
    lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    dirty = dirty_files(ROOT)
    for route, source_file, changefreq, priority in PAGES:
        loc = "https://lascuolaamica.it/" if route == "/" else f"https://lascuolaamica.it{route}"
        lastmod = last_modified_date(source_file, ROOT, dirty)
        lines.extend(
            [
                "  <url>",
                f"    <loc>{loc}</loc>",
                f"    <lastmod>{lastmod}</lastmod>",
                f"    <changefreq>{changefreq}</changefreq>",
                f"    <priority>{priority}</priority>",
                "  </url>",
            ]
        )
    lines.append("</urlset>")
    SITEMAP_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"[OK] sitemap.xml aggiornato ({len(PAGES)} URL)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
