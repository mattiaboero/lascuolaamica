#!/usr/bin/env python3
"""Sincronizza gli hash CSP degli script e degli stili inline.

Copre tre fonti di contenuto inline soggette a CSP:
  - script inline negli HTML pubblici  -> script-src
  - <style> inline negli HTML pubblici -> style-src / style-src-elem
  - <style> iniettati a runtime dai JS  -> style-src / style-src-elem
    (es. shared.js: createElement('style') + style.textContent = `...`)

Senza questa sincronizzazione, modificare un blocco <style> inline o uno
stile iniettato rompe la CSP in modo silenzioso (il browser blocca lo
stile, non c'e' errore di build).
"""

from __future__ import annotations

import argparse
import base64
import hashlib
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HEADERS = ROOT / "_headers"

SCRIPT_RE = re.compile(r"<script(?P<attrs>[^>]*)>(?P<body>.*?)</script>", re.S | re.I)
STYLE_TAG_RE = re.compile(r"<style(?P<attrs>[^>]*)>(?P<body>.*?)</style>", re.S | re.I)
# <style> iniettato via JS: createElement('style') ... .textContent = `...`;
INJECTED_STYLE_RE = re.compile(
    r"createElement\(\s*['\"]style['\"]\s*\).*?\.textContent\s*=\s*`(?P<body>.*?)`",
    re.S,
)

SCRIPT_SRC_RE = re.compile(
    r"(script-src 'self')(?P<hashes>(?:\s+'sha256-[^']+')*)(?P<rest>\s*; style-src 'self')",
)
STYLE_SRC_RE = re.compile(
    r"(; style-src 'self')(?P<hashes>(?:\s+'sha256-[^']+')*)(?P<rest>\s*; style-src-elem 'self')",
)
STYLE_SRC_ELEM_RE = re.compile(
    r"(; style-src-elem 'self')(?P<hashes>(?:\s+'sha256-[^']+')*)(?P<rest>\s*; style-src-attr)",
)


def _hash(body: str) -> str:
    digest = hashlib.sha256(body.encode("utf-8")).digest()
    return "'sha256-" + base64.b64encode(digest).decode("ascii") + "'"


# Type di <script> effettivamente ESEGUITI dal browser e quindi soggetti a
# CSP script-src. Tutto il resto (es. application/ld+json, application/json,
# speculationrules) e' un "data block" inerte: il browser non lo esegue, CSP
# non lo blocca e NON serve alcun hash. Hasharli creava fragilita' inutile:
# ogni modifica a date/conteggi/FAQ nei blocchi JSON-LD rompeva la CSP.
JS_EXECUTABLE_TYPES = {
    "",  # nessun type => classic script eseguibile
    "text/javascript",
    "application/javascript",
    "module",
    "importmap",
}


def _script_type(attrs: str) -> str:
    match = re.search(r"type\s*=\s*[\"']([^\"']+)[\"']", attrs, re.I)
    return match.group(1).strip().lower() if match else ""


def _inline_script_hashes() -> list[str]:
    hashes: set[str] = set()
    for path in sorted(ROOT.glob("*.html")):
        html = path.read_text(encoding="utf-8")
        for match in SCRIPT_RE.finditer(html):
            attrs = match.group("attrs")
            if re.search(r"\bsrc\s*=", attrs, re.I):
                continue
            # Solo gli script eseguibili sono soggetti a script-src.
            if _script_type(attrs) not in JS_EXECUTABLE_TYPES:
                continue
            body = match.group("body")
            if not body.strip():
                continue
            hashes.add(_hash(body))
    return sorted(hashes)


def _style_hashes() -> list[str]:
    hashes: set[str] = set()
    # <style> inline negli HTML
    for path in sorted(ROOT.glob("*.html")):
        html = path.read_text(encoding="utf-8")
        for match in STYLE_TAG_RE.finditer(html):
            body = match.group("body")
            if not body.strip():
                continue
            hashes.add(_hash(body))
    # <style> iniettati dai JS (root + js/)
    js_files = sorted(ROOT.glob("*.js")) + sorted((ROOT / "js").glob("*.js"))
    for path in js_files:
        src = path.read_text(encoding="utf-8")
        for match in INJECTED_STYLE_RE.finditer(src):
            body = match.group("body")
            if not body.strip():
                continue
            hashes.add(_hash(body))
    return sorted(hashes)


def _replace(regex: re.Pattern[str], text: str, hashes: list[str], label: str) -> str:
    hashes_str = (" " + " ".join(hashes)) if hashes else ""

    def repl(match: re.Match[str]) -> str:
        return f"{match.group(1)}{hashes_str}{match.group('rest')}"

    new_text, count = regex.subn(repl, text, count=1)
    if count != 1:
        raise RuntimeError(f"Impossibile trovare la direttiva {label} in _headers")
    return new_text


def _build_headers(current: str) -> str:
    script_hashes = _inline_script_hashes()
    style_hashes = _style_hashes()
    text = _replace(SCRIPT_SRC_RE, current, script_hashes, "script-src")
    text = _replace(STYLE_SRC_RE, text, style_hashes, "style-src")
    text = _replace(STYLE_SRC_ELEM_RE, text, style_hashes, "style-src-elem")
    return text


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="verifica senza scrivere")
    args = parser.parse_args()

    current = HEADERS.read_text(encoding="utf-8")
    updated = _build_headers(current)

    if args.check:
        if current != updated:
            print("[ERROR] CSP hashes (script/style) non allineati. Esegui scripts/sync_csp_hashes.py.")
            return 1
        print("[OK] CSP script+style hashes allineati")
        return 0

    if current != updated:
        HEADERS.write_text(updated, encoding="utf-8")
        print("[OK] _headers aggiornato (script + style hashes)")
    else:
        print("[OK] _headers gia allineato")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
