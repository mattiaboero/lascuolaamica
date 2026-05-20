#!/usr/bin/env python3
"""Genera sitemap.xml con lastmod derivato dal timestamp reale dei file."""

from __future__ import annotations

from datetime import datetime
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
SITEMAP_PATH = ROOT / "sitemap.xml"

PAGES = [
    ("/", "index.html", "weekly", "1.0"),
    ("/matematica", "matematica.html", "weekly", "0.9"),
    ("/inglese", "inglese.html", "weekly", "0.9"),
    ("/problemi", "problemi.html", "weekly", "0.9"),
    ("/civica", "civica.html", "weekly", "0.9"),
    ("/geografia", "geografia.html", "weekly", "0.85"),
    ("/storia", "storia.html", "weekly", "0.85"),
    ("/scienze", "scienze.html", "weekly", "0.85"),
    ("/italiano", "italiano.html", "weekly", "0.85"),
    ("/chi-siamo", "chi-siamo.html", "monthly", "0.75"),
    ("/per-insegnanti", "per-insegnanti.html", "monthly", "0.72"),
    ("/per-genitori", "per-genitori.html", "monthly", "0.72"),
    ("/ai-info", "ai-info.html", "monthly", "0.68"),
    ("/faq", "faq.html", "weekly", "0.8"),
    ("/premi", "premi.html", "weekly", "0.76"),
    ("/accessibilita", "accessibilita.html", "monthly", "0.7"),
    ("/supporta", "supporta.html", "monthly", "0.6"),
]


def _lastmod_for(filename: str) -> str:
    path = ROOT / filename
    if not path.exists():
        return datetime.now().date().isoformat()
    try:
        result = subprocess.run(
            ["git", "log", "-1", "--format=%cI", "--", str(path)],
            cwd=ROOT,
            capture_output=True,
            text=True,
            check=False,
        )
        stamp = (result.stdout or "").strip()
        if result.returncode == 0 and stamp:
            return datetime.fromisoformat(stamp.replace("Z", "+00:00")).date().isoformat()
    except Exception:
        pass
    return datetime.fromtimestamp(path.stat().st_mtime).date().isoformat()


def main() -> int:
    lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for route, source_file, changefreq, priority in PAGES:
        loc = "https://lascuolaamica.it/" if route == "/" else f"https://lascuolaamica.it{route}"
        lastmod = _lastmod_for(source_file)
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
