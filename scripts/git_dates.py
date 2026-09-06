#!/usr/bin/env python3
"""Data di ultima modifica di un file, presa dalla storia git.

L'mtime del filesystem non dice quando un file e' cambiato davvero: un clone, un
checkout di branch o un merge lo riportano all'istante corrente. Derivare da li'
il dateModified dei JSON-LD e il lastmod della sitemap significava dichiarare
come modificate oggi tutte le pagine a ogni cambio di branch, e produrre diff di
rumore che qualcuno doveva scartare a mano prima di ogni commit.

I file con modifiche non committate restano invece sull'mtime: sono in lavorazione
adesso, e la data giusta e' oggi.
"""

from __future__ import annotations

import subprocess
import sys
from datetime import datetime
from pathlib import Path


def dirty_files(root: Path) -> frozenset[str]:
    """Percorsi (relativi a root) con modifiche non committate."""
    result = subprocess.run(
        ["git", "status", "--porcelain", "-z"],
        cwd=root,
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        return frozenset()
    dirty: set[str] = set()
    tokens = result.stdout.split("\0")
    i = 0
    while i < len(tokens):
        token = tokens[i]
        if not token:
            i += 1
            continue
        status = token[:2]
        dirty.add(token[3:])
        # Rename e copie emettono due percorsi separati da NUL: prima il nuovo, poi il vecchio.
        i += 2 if any(code in status for code in ("R", "C")) else 1
    return frozenset(dirty)


def last_modified_date(filename: str, root: Path, dirty: frozenset[str]) -> str:
    """Data ISO dell'ultimo commit che ha toccato il file, o mtime se non committato."""
    path = root / filename
    if not path.exists():
        return datetime.now().date().isoformat()
    try:
        if filename in dirty:
            return datetime.fromtimestamp(path.stat().st_mtime).date().isoformat()

        result = subprocess.run(
            ["git", "log", "-1", "--format=%cI", "--", str(path)],
            cwd=root,
            capture_output=True,
            text=True,
            check=False,
        )
        stamp = (result.stdout or "").strip()
        if result.returncode == 0 and stamp:
            return datetime.fromisoformat(stamp.replace("Z", "+00:00")).date().isoformat()
    except Exception as exc:  # git non disponibile o repo senza storia
        print(f"[warn] git log non utilizzabile per {path.name}, uso mtime: {exc}", file=sys.stderr)
    return datetime.fromtimestamp(path.stat().st_mtime).date().isoformat()
