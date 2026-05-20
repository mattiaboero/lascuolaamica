#!/usr/bin/env python3
"""Sincronizza gli hash CSP degli script inline presenti negli HTML pubblici."""

from __future__ import annotations

import argparse
import base64
import hashlib
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HEADERS = ROOT / "_headers"
SCRIPT_RE = re.compile(r"<script(?P<attrs>[^>]*)>(?P<body>.*?)</script>", re.S | re.I)
CSP_RE = re.compile(
    r"(Content-Security-Policy:[^\n]*?script-src 'self')(?P<hashes>(?:\s+'sha256-[^']+')*)(?P<rest>\s*; style-src)",
)


def _inline_script_hashes() -> list[str]:
    hashes: set[str] = set()
    for path in sorted(ROOT.glob("*.html")):
        html = path.read_text(encoding="utf-8")
        for match in SCRIPT_RE.finditer(html):
            attrs = match.group("attrs")
            if re.search(r"\bsrc\s*=", attrs, re.I):
                continue
            body = match.group("body")
            if not body.strip():
                continue
            digest = hashlib.sha256(body.encode("utf-8")).digest()
            hashes.add("'sha256-" + base64.b64encode(digest).decode("ascii") + "'")
    return sorted(hashes)


def _updated_headers() -> str:
    text = HEADERS.read_text(encoding="utf-8")
    hashes = " " + " ".join(_inline_script_hashes())

    def repl(match: re.Match[str]) -> str:
        return f"{match.group(1)}{hashes}{match.group('rest')}"

    new_text, count = CSP_RE.subn(repl, text, count=1)
    if count != 1:
        raise RuntimeError("Impossibile trovare la direttiva script-src CSP in _headers")
    return new_text


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="verifica senza scrivere")
    args = parser.parse_args()

    current = HEADERS.read_text(encoding="utf-8")
    updated = _updated_headers()
    if args.check:
        if current != updated:
            print("[ERROR] CSP script hashes non allineati. Esegui scripts/sync_csp_hashes.py.")
            return 1
        print("[OK] CSP script hashes allineati")
        return 0

    if current != updated:
        HEADERS.write_text(updated, encoding="utf-8")
        print(f"[OK] _headers aggiornato con {len(_inline_script_hashes())} hash script")
    else:
        print("[OK] _headers già allineato")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
