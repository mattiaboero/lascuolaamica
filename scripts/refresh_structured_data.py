#!/usr/bin/env python3
"""Aggiorna i blocchi JSON-LD con metadati AEO/GEO base.

- datePublished/dateModified sulle pagine principali
- Organization -> EducationalOrganization (home)
- publisher/isPartOf coerenti sui LearningResource
"""

from __future__ import annotations

import json
import re
from datetime import datetime
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]

HTML_FILES = [
    "index.html",
    "matematica.html",
    "inglese.html",
    "problemi.html",
    "civica.html",
    "geografia.html",
    "storia.html",
    "scienze.html",
    "italiano.html",
    "chi-siamo.html",
    "per-insegnanti.html",
    "per-genitori.html",
    "ai-info.html",
    "faq.html",
    "premi.html",
    "supporta.html",
    "accessibilita.html",
    "supporto-satispay.html",
]

ORG_ID = "https://lascuolaamica.it/#organization"
WEBSITE_ID = "https://lascuolaamica.it/#website"
ORG_URL = "https://lascuolaamica.it/"
ORG_LOGO = "https://lascuolaamica.it/icons/icon-512.png"
ORG_SAME_AS = [
    "https://github.com/mattiaboero/lascuolaamica",
    "https://www.youtube.com/@ceciliaeilpapamattone",
]

DATE_TYPES = {
    "WebSite",
    "WebPage",
    "AboutPage",
    "CollectionPage",
    "FAQPage",
    "EducationalApplication",
    "LearningResource",
}

SCRIPT_RE = re.compile(
    r'(<script type="application/ld\+json">\s*)(\{.*?\})(\s*</script>)',
    re.S,
)


def _as_types(value: Any) -> list[str]:
    if isinstance(value, list):
        return [x for x in value if isinstance(x, str)]
    if isinstance(value, str):
        return [value]
    return []


def _ensure_dates(node: dict[str, Any], date_iso: str) -> None:
    types = set(_as_types(node.get("@type")))
    if types & DATE_TYPES:
        node.setdefault("datePublished", date_iso)
        node["dateModified"] = date_iso


def _is_home_organization(node: dict[str, Any]) -> bool:
    types = set(_as_types(node.get("@type")))
    if node.get("@id") == ORG_ID:
        return True
    return ("Organization" in types or "EducationalOrganization" in types) and node.get("url") == ORG_URL


def _upgrade_organization(node: dict[str, Any]) -> None:
    node["@type"] = "EducationalOrganization"
    node.setdefault("name", "La Scuola Amica")
    node.setdefault("url", ORG_URL)
    node["logo"] = {
        "@type": "ImageObject",
        "url": ORG_LOGO,
        "width": 512,
        "height": 512,
    }
    node.setdefault("sameAs", ORG_SAME_AS)
    node.setdefault("email", "mailto:supporto@lascuolaamica.it")
    node.setdefault(
        "contactPoint",
        {
            "@type": "ContactPoint",
            "contactType": "customer support",
            "email": "supporto@lascuolaamica.it",
            "availableLanguage": ["it"],
        },
    )


def _upgrade_learning_node(node: dict[str, Any]) -> None:
    types = set(_as_types(node.get("@type")))
    if "EducationalApplication" in types or "LearningResource" in types:
        node.setdefault("publisher", {"@id": ORG_ID})
        node.setdefault(
            "isPartOf",
            {
                "@type": "WebSite",
                "@id": WEBSITE_ID,
                "name": "La Scuola Amica",
                "url": ORG_URL,
            },
        )


def _upgrade_node(node: dict[str, Any], date_iso: str) -> None:
    _ensure_dates(node, date_iso)
    if _is_home_organization(node):
        _upgrade_organization(node)
    _upgrade_learning_node(node)


def _upgrade_payload(payload: dict[str, Any], date_iso: str) -> dict[str, Any]:
    graph = payload.get("@graph")
    if isinstance(graph, list):
        for item in graph:
            if isinstance(item, dict):
                _upgrade_node(item, date_iso)
    else:
        _upgrade_node(payload, date_iso)
    return payload


def _replace_ldjson_blocks(html: str, date_iso: str) -> tuple[str, int]:
    changed = 0

    def repl(match: re.Match[str]) -> str:
        nonlocal changed
        start, raw_json, end = match.group(1), match.group(2), match.group(3)
        try:
            payload = json.loads(raw_json)
        except Exception:
            return match.group(0)
        if not isinstance(payload, dict):
            return match.group(0)
        upgraded = _upgrade_payload(payload, date_iso)
        changed += 1
        pretty = json.dumps(upgraded, ensure_ascii=False, indent=2)
        return f"{start}{pretty}{end}"

    new_html = SCRIPT_RE.sub(repl, html)
    return new_html, changed


def main() -> int:
    for rel in HTML_FILES:
        path = ROOT / rel
        if not path.exists():
            continue
        date_value = datetime.fromtimestamp(path.stat().st_mtime).date().isoformat()
        html = path.read_text(encoding="utf-8")
        new_html, touched = _replace_ldjson_blocks(html, date_value)
        if touched and new_html != html:
            path.write_text(new_html, encoding="utf-8")
            print(f"[OK] {rel}: aggiornati {touched} blocchi JSON-LD")
        else:
            print(f"[OK] {rel}: nessun aggiornamento necessario")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
