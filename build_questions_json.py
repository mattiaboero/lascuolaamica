#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import os
from datetime import datetime, timezone
from collections import Counter
from typing import Any, Dict, List, Optional

INPUT_FILES: Dict[str, str] = {
    "matematica": "template_matematica_da_json.csv",
    "problemi": "matematica_problemi.csv",
    "inglese": "template_domande_inglese_300.csv",
    "civica": "template_educazione_civica_800.csv",
    "geografia": "template_geografia_800.csv",
    "storia": "template_storia_800.csv",
    "scienze": "template_scienze_800.csv",
    "italiano": "template_italiano_800.csv",
}

EXPECTED_HEADERS: List[str] = [
    "id", "materia", "classe", "ambito", "sottoambito", "difficolta", "domanda",
    "risposta_1", "risposta_2", "risposta_3", "risposta_4", "corretta", "spiegazione",
    "bonus", "attiva", "tag", "lingua", "programma_riferimento", "note_docente"
]
SPLIT_DIR_NAME = "json"


def to_bool(value: str) -> Optional[bool]:
    v = (value or "").strip().lower()
    if v in {"true", "1", "yes", "y", "si", "sì"}:
        return True
    if v in {"false", "0", "no", "n"}:
        return False
    return None


def safe_int(value: str) -> Optional[int]:
    try:
        return int(str(value).strip())
    except (TypeError, ValueError):
        return None


def parse_tags(raw: str) -> List[str]:
    txt = (raw or "").strip()
    if not txt:
        return []
    if "," in txt:
        parts = [p.strip() for p in txt.split(",")]
    elif ";" in txt:
        parts = [p.strip() for p in txt.split(";")]
    else:
        parts = [txt]
    return [p for p in parts if p]


def normalize_text(value: str) -> str:
    return " ".join((value or "").strip().split())


def write_json(path: str, payload: Dict[str, Any]) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)


def write_split_files(project_dir: str, data: Dict[str, Any]) -> List[str]:
    generated_files: List[str] = []
    split_dir = os.path.join(project_dir, SPLIT_DIR_NAME)
    os.makedirs(split_dir, exist_ok=True)

    index_subjects: Dict[str, Dict[str, Any]] = {}

    for subject_key, rows in data.get("subjects", {}).items():
        subject_payload = {
            "schemaVersion": data.get("schemaVersion", 1),
            "generatedAt": data.get("generatedAt"),
            "subject": subject_key,
            "totalQuestions": len(rows),
            "questions": rows,
            "stats": data.get("stats", {}).get(subject_key, {}),
        }
        rel_path = f"{subject_key}.json"
        abs_path = os.path.join(split_dir, rel_path)
        write_json(abs_path, subject_payload)
        generated_files.append(abs_path)

        index_subjects[subject_key] = {
            "path": rel_path,
            "rows": len(rows),
            "stats": data.get("stats", {}).get(subject_key, {}),
        }

    index_payload = {
        "schemaVersion": data.get("schemaVersion", 1),
        "generatedAt": data.get("generatedAt"),
        "totalQuestions": data.get("totalQuestions", 0),
        "subjects": index_subjects,
    }
    index_path = os.path.join(split_dir, "index.json")
    write_json(index_path, index_payload)
    generated_files.append(index_path)
    return generated_files


def build_questions(input_dir: str) -> Dict[str, Any]:
    errors: List[str] = []
    warnings: List[str] = []
    subjects: Dict[str, List[Dict[str, Any]]] = {}
    stats: Dict[str, Dict[str, Any]] = {}

    for subject_key, filename in INPUT_FILES.items():
        path = os.path.join(input_dir, filename)
        if not os.path.exists(path):
            errors.append(f"Missing file: {filename}")
            continue

        rows = []
        id_seen = set()
        area_counter = Counter()
        class_counter = Counter()

        try:
            with open(path, "r", encoding="utf-8-sig", newline="") as f:
                reader = csv.DictReader(f)
                headers = reader.fieldnames or []
                if headers != EXPECTED_HEADERS:
                    warnings.append(
                        f"Header mismatch in {filename}. Expected canonical template; found: {headers}"
                    )

                line = 1
                for row in reader:
                    line += 1
                    qid = normalize_text(row.get("id", ""))
                    question = normalize_text(row.get("domanda", ""))
                    options = [
                        normalize_text(row.get("risposta_1", "")),
                        normalize_text(row.get("risposta_2", "")),
                        normalize_text(row.get("risposta_3", "")),
                        normalize_text(row.get("risposta_4", "")),
                    ]
                    correct_idx_raw = safe_int(row.get("corretta", ""))
                    class_num = safe_int(row.get("classe", ""))
                    difficulty = safe_int(row.get("difficolta", ""))
                    area = normalize_text(row.get("ambito", "")).lower()
                    subarea = normalize_text(row.get("sottoambito", "")).lower()

                    if not qid:
                        errors.append(f"{filename}:{line} missing id")
                        continue
                    if qid in id_seen:
                        warnings.append(f"{filename}:{line} duplicate id '{qid}'")
                    id_seen.add(qid)

                    if not question:
                        errors.append(f"{filename}:{line} missing domanda")
                        continue

                    if any(not o for o in options):
                        errors.append(f"{filename}:{line} one or more empty options")
                        continue

                    if len(set(options)) < 4:
                        warnings.append(f"{filename}:{line} duplicated options in '{qid}'")

                    if correct_idx_raw is None or correct_idx_raw < 1 or correct_idx_raw > 4:
                        errors.append(f"{filename}:{line} invalid corretta '{row.get('corretta')}'")
                        continue

                    is_active = to_bool(row.get("attiva", ""))
                    if is_active is None:
                        warnings.append(f"{filename}:{line} non-boolean attiva '{row.get('attiva')}', assumed true")
                        is_active = True

                    bonus_raw = normalize_text(row.get("bonus", ""))
                    bonus_bool = to_bool(bonus_raw)

                    rec: Dict[str, Any] = {
                        "id": qid,
                        "subject": subject_key,
                        "sourceSubject": normalize_text(row.get("materia", "")),
                        "class": class_num,
                        "area": area,
                        "subarea": subarea,
                        "difficulty": difficulty,
                        "question": question,
                        "options": options,
                        "answerIndex": correct_idx_raw - 1,
                        "answer": options[correct_idx_raw - 1],
                        "explanation": normalize_text(row.get("spiegazione", "")),
                        "active": is_active,
                        "tag": normalize_text(row.get("tag", "")),
                        "tags": parse_tags(row.get("tag", "")),
                        "language": normalize_text(row.get("lingua", "")) or "it",
                        "program": normalize_text(row.get("programma_riferimento", "")),
                        "teacherNote": normalize_text(row.get("note_docente", "")),
                        "bonus": bonus_bool if bonus_bool is not None else False,
                        "bonusRaw": bonus_raw if bonus_bool is None else "",
                    }

                    rows.append(rec)
                    area_counter[area] += 1
                    class_counter[str(class_num)] += 1
        except OSError as exc:
            errors.append(f"{filename}: read error ({exc})")
            continue
        except csv.Error as exc:
            errors.append(f"{filename}: csv parse error ({exc})")
            continue

        subjects[subject_key] = rows
        stats[subject_key] = {
            "file": filename,
            "rows": len(rows),
            "areas": dict(area_counter),
            "classes": dict(class_counter),
        }

    total = sum(len(v) for v in subjects.values())
    out = {
        "schemaVersion": 1,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "totalQuestions": total,
        "subjects": subjects,
        "stats": stats,
        "issues": {
            "errors": errors,
            "warnings": warnings,
        },
    }
    return out


def main() -> int:
    project_dir = os.path.dirname(os.path.abspath(__file__))
    input_dir = os.environ.get(
        "QUESTIONS_CSV_DIR",
        "/Users/mattiaboero/Library/Mobile Documents/com~apple~CloudDocs/cervellino/JSON",
    )

    data = build_questions(input_dir)

    out_report = os.path.join(project_dir, "questions-build-report.json")
    write_legacy_monolith = os.environ.get("GENERATE_LEGACY_QUESTIONS_JSON", "").strip().lower() in {"1", "true", "yes"}
    out_json = os.path.join(project_dir, "questions.json")
    if write_legacy_monolith:
        write_json(out_json, data)

    report = {
        "generatedAt": data["generatedAt"],
        "totalQuestions": data["totalQuestions"],
        "stats": data["stats"],
        "errors": data["issues"]["errors"],
        "warnings": data["issues"]["warnings"],
    }
    write_json(out_report, report)
    split_files = write_split_files(project_dir, data)

    if write_legacy_monolith:
        print(f"Created (legacy): {out_json}")
    print(f"Created: {out_report}")
    for path in split_files:
        print(f"Created: {path}")
    print(f"Total questions: {data['totalQuestions']}")
    print(f"Errors: {len(data['issues']['errors'])}")
    print(f"Warnings: {len(data['issues']['warnings'])}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
