#!/usr/bin/env python3
from __future__ import annotations

import json
import random
import re
import unicodedata
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Tuple

ROOT = Path(__file__).resolve().parents[1]
JSON_DIR = ROOT / "json"
RNG = random.Random(20260419)


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def normalize_text(s: str) -> str:
    s = unicodedata.normalize("NFKD", str(s or ""))
    s = "".join(ch for ch in s if not unicodedata.combining(ch))
    s = s.lower().strip()
    s = re.sub(r"[^a-z0-9]+", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def load_subject(subject: str) -> Dict:
    path = JSON_DIR / f"{subject}.json"
    with path.open("r", encoding="utf-8") as fh:
        return json.load(fh)


def save_subject(subject: str, data: Dict) -> None:
    path = JSON_DIR / f"{subject}.json"
    with path.open("w", encoding="utf-8") as fh:
        json.dump(data, fh, ensure_ascii=False, indent=2)
        fh.write("\n")


def existing_prefix_max(questions: List[Dict], prefix: str) -> int:
    max_n = 0
    for q in questions:
        qid = str(q.get("id", ""))
        if not qid.startswith(prefix):
            continue
        m = re.search(r"(\d+)$", qid)
        if not m:
            continue
        max_n = max(max_n, int(m.group(1)))
    return max_n


def make_numeric_options(answer: int, spread: int = 6) -> List[str]:
    opts = {int(answer)}
    attempts = 0
    span = max(4, spread)
    while len(opts) < 4 and attempts < 200:
        attempts += 1
        delta = RNG.randint(-span, span)
        cand = int(answer + delta)
        if cand > 0:
            opts.add(cand)
    while len(opts) < 4:
        opts.add(int(answer + len(opts) + 1))
    arr = [str(x) for x in opts]
    RNG.shuffle(arr)
    return arr


def ensure_answer_index(entry: Dict) -> Dict:
    options = [str(x) for x in entry["options"]]
    answer = str(entry["answer"])
    if answer not in options:
        options[-1] = answer
    # keep answer once
    seen = False
    fixed = []
    for opt in options:
        if opt == answer:
            if seen:
                continue
            seen = True
        fixed.append(opt)
    while len(fixed) < 4:
        extra = str(int(answer) + len(fixed) + 1) if answer.isdigit() else f"{answer} {len(fixed)+1}"
        if extra != answer and extra not in fixed:
            fixed.append(extra)
    fixed = fixed[:4]
    if answer not in fixed:
        fixed[-1] = answer
    entry["options"] = fixed
    entry["answerIndex"] = fixed.index(answer)
    return entry


def base_entry(
    *,
    qid: str,
    subject: str,
    source_subject: str,
    cls: int,
    area: str,
    subarea: str,
    difficulty,
    question: str,
    answer: str,
    options: List[str],
    explanation: str,
    language: str,
    program: str,
    tags: List[str],
    teacher_note: str,
) -> Dict:
    tag_text = ";".join(tags)
    if subject == "problemi":
        tag_text = ",".join(tags[:2])
    return ensure_answer_index(
        {
            "id": qid,
            "subject": subject,
            "sourceSubject": source_subject,
            "class": cls,
            "area": area,
            "subarea": subarea,
            "difficulty": difficulty,
            "question": question,
            "options": [str(x) for x in options],
            "answerIndex": 0,
            "answer": str(answer),
            "explanation": explanation,
            "active": True,
            "tag": tag_text,
            "tags": tags,
            "language": language,
            "program": program,
            "teacherNote": teacher_note,
            "bonus": False,
            "bonusRaw": "",
        }
    )


def refresh_subject_stats(data: Dict) -> None:
    questions = data.get("questions", [])
    area_counts = Counter(str(q.get("area", "")).strip() for q in questions)
    class_counts = Counter(str(q.get("class", "")).strip() for q in questions)
    data["totalQuestions"] = len(questions)
    stats = data.get("stats") or {}
    stats["rows"] = len(questions)
    stats["areas"] = dict(area_counts)
    stats["classes"] = dict(class_counts)
    data["stats"] = stats
    data["generatedAt"] = now_iso()


def append_matematica(data: Dict) -> int:
    questions = data["questions"]
    existing = {normalize_text(q.get("question", "")) for q in questions}
    added = 0

    # Template 1: numero mancante in addizione
    ranges = {
        2: (8, 35),
        3: (18, 85),
        4: (55, 260),
        5: (120, 850),
    }
    for cls in [2, 3, 4, 5]:
        lo, hi = ranges[cls]
        b = RNG.randint(max(4, lo // 3), max(8, hi // 3))
        answer = RNG.randint(lo, hi)
        c = answer + b
        question = f"Trova il numero mancante: ___ + {b} = {c}."
        key = normalize_text(question)
        if key in existing:
            continue
        prefix = f"mat-{cls}-aritmetica-"
        qid = f"{prefix}{existing_prefix_max(questions, prefix) + 1:03d}"
        options = make_numeric_options(answer, spread=max(6, answer // 8))
        entry = base_entry(
            qid=qid,
            subject="matematica",
            source_subject="matematica",
            cls=cls,
            area="aritmetica",
            subarea="",
            difficulty=None,
            question=question,
            answer=str(answer),
            options=options,
            explanation=f"Il numero mancante è {c} - {b} = {answer}.",
            language="it",
            program=f"matematica_classe_{cls}_aritmetica",
            tags=["matematica", "aritmetica", f"classe_{cls}", "primaria", "pilota_parametrico"],
            teacher_note="parametric_pilot_v1",
        )
        questions.append(entry)
        existing.add(key)
        added += 1

    # Template 2: sequenze con passo costante
    seq_cfg = {
        2: (1, 4, 20),
        3: (2, 6, 40),
        4: (3, 9, 90),
        5: (4, 12, 140),
    }
    for cls in [2, 3, 4, 5]:
        min_step, max_step, max_start = seq_cfg[cls]
        step = RNG.randint(min_step, max_step)
        start = RNG.randint(2, max_start)
        seq = [start + i * step for i in range(5)]
        question = f"Completa la sequenza: {seq[0]}, {seq[1]}, {seq[2]}, {seq[3]}, ___."
        key = normalize_text(question)
        if key in existing:
            continue
        answer = seq[4]
        prefix = f"mat-{cls}-logica_e_dati-"
        qid = f"{prefix}{existing_prefix_max(questions, prefix) + 1:03d}"
        options = make_numeric_options(answer, spread=max(6, step * 3))
        entry = base_entry(
            qid=qid,
            subject="matematica",
            source_subject="matematica",
            cls=cls,
            area="logica_e_dati",
            subarea="",
            difficulty=None,
            question=question,
            answer=str(answer),
            options=options,
            explanation=f"La regola è +{step}. Dopo {seq[3]} viene {answer}.",
            language="it",
            program=f"matematica_classe_{cls}_logica",
            tags=["matematica", "logica_e_dati", f"classe_{cls}", "primaria", "pilota_parametrico"],
            teacher_note="parametric_pilot_v1",
        )
        questions.append(entry)
        existing.add(key)
        added += 1

    refresh_subject_stats(data)
    return added


def append_problemi(data: Dict) -> int:
    questions = data["questions"]
    existing = {normalize_text(q.get("question", "")) for q in questions}
    added = 0
    names = ["Luca", "Sara", "Emma", "Matteo", "Giulia", "Tommaso", "Sofia", "Arianna"]

    diff_by_class = {2: 1, 3: 2, 4: 3, 5: 4}

    for cls in [2, 3, 4, 5]:
        diff = diff_by_class[cls]
        # T1 addizione
        a = RNG.randint(12 + cls * 3, 32 + cls * 10)
        b = RNG.randint(4 + cls, 14 + cls * 2)
        name = RNG.choice(names)
        answer = a + b
        question = f"{name} ha {a} figurine e ne riceve {b}. Quante figurine ha ora?"
        key = normalize_text(question)
        if key not in existing:
            prefix = f"pro-{cls}-problemi-"
            qid = f"{prefix}{existing_prefix_max(questions, prefix) + 1:03d}"
            entry = base_entry(
                qid=qid,
                subject="problemi",
                source_subject="Matematica",
                cls=cls,
                area="problemi",
                subarea="addizione",
                difficulty=diff,
                question=question,
                answer=str(answer),
                options=make_numeric_options(answer, spread=max(8, answer // 7)),
                explanation=f"Sommiamo: {a} + {b} = {answer}.",
                language="it",
                program=f"Matematica Classe {cls} - MIUR",
                tags=["addizione", "figurine", "pilota_parametrico"],
                teacher_note="parametric_pilot_v1",
            )
            questions.append(entry)
            existing.add(key)
            added += 1

        # T2 moltiplicazione per gruppi
        groups = RNG.randint(3 + cls // 2, 6 + cls)
        each = RNG.randint(2 + cls // 2, 7 + cls)
        answer = groups * each
        place = RNG.choice(["biblioteca", "palestra", "aula"]) 
        question = f"Nella {place} ci sono {groups} scaffali con {each} libri ciascuno. Quanti libri ci sono in tutto?"
        key = normalize_text(question)
        if key not in existing:
            prefix = f"pro-{cls}-problemi-"
            qid = f"{prefix}{existing_prefix_max(questions, prefix) + 1:03d}"
            entry = base_entry(
                qid=qid,
                subject="problemi",
                source_subject="Matematica",
                cls=cls,
                area="problemi",
                subarea="moltiplicazione",
                difficulty=diff,
                question=question,
                answer=str(answer),
                options=make_numeric_options(answer, spread=max(8, answer // 6)),
                explanation=f"Moltiplichiamo: {groups} × {each} = {answer}.",
                language="it",
                program=f"Matematica Classe {cls} - MIUR",
                tags=["moltiplicazione", "quantita", "pilota_parametrico"],
                teacher_note="parametric_pilot_v1",
            )
            questions.append(entry)
            existing.add(key)
            added += 1

        # T3 due operazioni
        start = RNG.randint(25 + cls * 8, 60 + cls * 18)
        leave = RNG.randint(4 + cls, 10 + cls * 2)
        arrive = RNG.randint(3 + cls, 12 + cls * 2)
        answer = start - leave + arrive
        question = (
            f"Al parco ci sono {start} bambini. {leave} vanno via e poi arrivano {arrive}. "
            "Quanti bambini ci sono adesso?"
        )
        key = normalize_text(question)
        if key not in existing:
            prefix = f"pro-{cls}-problemi-"
            qid = f"{prefix}{existing_prefix_max(questions, prefix) + 1:03d}"
            entry = base_entry(
                qid=qid,
                subject="problemi",
                source_subject="Matematica",
                cls=cls,
                area="problemi",
                subarea="due operazioni",
                difficulty=diff,
                question=question,
                answer=str(answer),
                options=make_numeric_options(answer, spread=max(8, answer // 7)),
                explanation=f"Prima {start} - {leave} = {start - leave}, poi + {arrive} = {answer}.",
                language="it",
                program=f"Matematica Classe {cls} - MIUR",
                tags=["due operazioni", "parco", "pilota_parametrico"],
                teacher_note="parametric_pilot_v1",
            )
            questions.append(entry)
            existing.add(key)
            added += 1

    refresh_subject_stats(data)
    return added


def append_inglese(data: Dict) -> int:
    questions = data["questions"]
    existing = {normalize_text(q.get("question", "")) for q in questions}
    added = 0

    # Template 1: where do you ...?
    where_sets = [
        (2, "sleep at night", "in the bedroom", ["in the kitchen", "in the bathroom", "in the garden"], "casa", "lessico_base"),
        (3, "cook dinner", "in the kitchen", ["in the bedroom", "in the garage", "in the classroom"], "casa", "frasi_semplici"),
        (4, "take a shower", "in the bathroom", ["in the kitchen", "in the attic", "in the living room"], "casa", "uso_guidato"),
        (5, "do homework", "in the study", ["in the shower", "in the fridge", "on the roof"], "casa", "comprensione_in_contesto"),
    ]
    for cls, action, answer, distractors, area, subarea in where_sets:
        question = f"Where do you usually {action}?"
        key = normalize_text(question)
        if key in existing:
            continue
        prefix = f"eng-{cls}-{area}-"
        qid = f"{prefix}{existing_prefix_max(questions, prefix) + 1:03d}"
        opts = [answer] + distractors[:3]
        RNG.shuffle(opts)
        entry = base_entry(
            qid=qid,
            subject="inglese",
            source_subject="inglese",
            cls=cls,
            area=area,
            subarea=subarea,
            difficulty=max(1, cls - 1),
            question=question,
            answer=answer,
            options=opts,
            explanation=f'The correct place is "{answer}".',
            language="en",
            program=f"inglese_primaria_classe_{cls}_{area}",
            tags=["inglese", f"classe_{cls}", area, "primaria", "pilota_parametrico"],
            teacher_note="parametric_pilot_v1",
        )
        questions.append(entry)
        existing.add(key)
        added += 1

    # Template 2: choose the sentence that matches
    sentence_sets = [
        (2, "She likes apples.", "Lei ama le mele.", ["Lei corre veloce.", "Lei gioca a calcio.", "Lei va a scuola."], "cibo", "frasi_semplici"),
        (3, "We drink water every day.", "Noi beviamo acqua ogni giorno.", ["Noi dormiamo tutto il giorno.", "Noi mangiamo pizza ogni mattina.", "Noi andiamo al mare in inverno."], "cibo", "frasi_semplici"),
        (4, "He is wearing a blue jacket.", "Lui indossa una giacca blu.", ["Lui sta leggendo un libro verde.", "Lui mangia una giacca blu.", "Lui porta una bicicletta blu."], "domande", "uso_guidato"),
        (5, "They are playing basketball after school.", "Loro giocano a basket dopo scuola.", ["Loro studiano matematica a colazione.", "Loro dormono in palestra ogni notte.", "Loro cucinano in classe dopo scuola."], "sport", "comprensione_in_contesto"),
    ]
    for cls, question, answer, distractors, area, subarea in sentence_sets:
        key = normalize_text(question)
        if key in existing:
            continue
        prefix = f"eng-{cls}-{area}-"
        qid = f"{prefix}{existing_prefix_max(questions, prefix) + 1:03d}"
        opts = [answer] + distractors[:3]
        RNG.shuffle(opts)
        entry = base_entry(
            qid=qid,
            subject="inglese",
            source_subject="inglese",
            cls=cls,
            area=area,
            subarea=subarea,
            difficulty=max(1, cls - 1),
            question=question,
            answer=answer,
            options=opts,
            explanation="Choose the Italian sentence with the same meaning.",
            language="en",
            program=f"inglese_primaria_classe_{cls}_{area}",
            tags=["inglese", f"classe_{cls}", area, "primaria", "pilota_parametrico"],
            teacher_note="parametric_pilot_v1",
        )
        questions.append(entry)
        existing.add(key)
        added += 1

    refresh_subject_stats(data)
    return added


def refresh_index(subjects: Dict[str, Dict]) -> None:
    idx_path = JSON_DIR / "index.json"
    idx = json.load(idx_path.open("r", encoding="utf-8"))
    idx["generatedAt"] = now_iso()
    total = 0
    for subject in ["matematica", "problemi", "inglese"]:
        sub = subjects[subject]
        rows = len(sub.get("questions", []))
        idx["subjects"][subject]["rows"] = rows
        idx["subjects"][subject]["stats"] = sub.get("stats", {})
        total += rows
    # keep other subjects already present
    for subject, meta in idx.get("subjects", {}).items():
        if subject in {"matematica", "problemi", "inglese"}:
            continue
        total += int(meta.get("rows", 0) or 0)
    idx["totalQuestions"] = total
    with idx_path.open("w", encoding="utf-8") as fh:
        json.dump(idx, fh, ensure_ascii=False, indent=2)
        fh.write("\n")


def validate_subject(subject: str, data: Dict) -> Tuple[int, int]:
    questions = data.get("questions", [])
    seen_ids = set()
    id_dups = 0
    option_errors = 0
    for q in questions:
        qid = q.get("id")
        if qid in seen_ids:
            id_dups += 1
        seen_ids.add(qid)
        options = [str(x) for x in q.get("options", [])]
        answer = str(q.get("answer", ""))
        if len(options) != 4 or answer not in options:
            option_errors += 1
    return id_dups, option_errors


def main() -> None:
    subjects = {
        "matematica": load_subject("matematica"),
        "problemi": load_subject("problemi"),
        "inglese": load_subject("inglese"),
    }

    added = {
        "matematica": append_matematica(subjects["matematica"]),
        "problemi": append_problemi(subjects["problemi"]),
        "inglese": append_inglese(subjects["inglese"]),
    }

    for subject, data in subjects.items():
        save_subject(subject, data)

    refresh_index(subjects)

    print("Parametric pilot append completed")
    for subject in ["matematica", "problemi", "inglese"]:
        dups, opt_err = validate_subject(subject, subjects[subject])
        print(
            f"- {subject}: +{added[subject]} new | total={len(subjects[subject]['questions'])} | "
            f"id_dups={dups} | option_errors={opt_err}"
        )


if __name__ == "__main__":
    main()
