#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import json
import random
import re
import unicodedata
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable, Dict, List, Tuple

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
    while len(opts) < 4 and attempts < 300:
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

    seen = False
    fixed: List[str] = []
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


def append_with_attempts(
    *,
    target: int,
    make_entry: Callable[[], Dict],
    get_question: Callable[[Dict], str],
    existing_questions: set,
    questions_out: List[Dict],
    max_attempts_multiplier: int = 50,
) -> int:
    added = 0
    attempts = 0
    max_attempts = max(40, target * max_attempts_multiplier)
    while added < target and attempts < max_attempts:
        attempts += 1
        entry = make_entry()
        key = normalize_text(get_question(entry))
        if key in existing_questions:
            continue
        questions_out.append(entry)
        existing_questions.add(key)
        added += 1
    return added


def math_profile_targets(profile: str) -> Dict[str, int]:
    if profile == "extended":
        return {
            "missing_add": 4,
            "missing_sub": 4,
            "sequence": 3,
            "missing_factor": 3,
            "perimeter": 2,
        }
    return {
        "missing_add": 1,
        "missing_sub": 0,
        "sequence": 1,
        "missing_factor": 0,
        "perimeter": 0,
    }


def append_matematica(data: Dict, profile: str) -> int:
    questions = data["questions"]
    existing = {normalize_text(q.get("question", "")) for q in questions}
    added = 0
    targets = math_profile_targets(profile)

    grade_ranges = {
        2: (9, 45),
        3: (18, 110),
        4: (60, 320),
        5: (130, 980),
    }

    for cls in [2, 3, 4, 5]:
        lo, hi = grade_ranges[cls]

        def add_missing() -> Dict:
            b = RNG.randint(max(4, lo // 4), max(9, hi // 4))
            answer = RNG.randint(lo, hi)
            c = answer + b
            prefix = f"mat-{cls}-aritmetica-"
            qid = f"{prefix}{existing_prefix_max(questions, prefix) + 1:03d}"
            return base_entry(
                qid=qid,
                subject="matematica",
                source_subject="matematica",
                cls=cls,
                area="aritmetica",
                subarea="",
                difficulty=None,
                question=f"Trova il numero mancante: ___ + {b} = {c}.",
                answer=str(answer),
                options=make_numeric_options(answer, spread=max(8, answer // 7)),
                explanation=f"Il numero mancante è {c} - {b} = {answer}.",
                language="it",
                program=f"matematica_classe_{cls}_aritmetica",
                tags=["matematica", "aritmetica", f"classe_{cls}", "primaria", "pilota_parametrico"],
                teacher_note=f"parametric_pilot_{profile}_v1",
            )

        added += append_with_attempts(
            target=targets["missing_add"],
            make_entry=add_missing,
            get_question=lambda e: e["question"],
            existing_questions=existing,
            questions_out=questions,
        )

        def sub_missing() -> Dict:
            b = RNG.randint(max(3, lo // 5), max(8, hi // 5))
            c = RNG.randint(lo, hi)
            answer = c + b
            prefix = f"mat-{cls}-aritmetica-"
            qid = f"{prefix}{existing_prefix_max(questions, prefix) + 1:03d}"
            return base_entry(
                qid=qid,
                subject="matematica",
                source_subject="matematica",
                cls=cls,
                area="aritmetica",
                subarea="",
                difficulty=None,
                question=f"Trova il numero mancante: ___ - {b} = {c}.",
                answer=str(answer),
                options=make_numeric_options(answer, spread=max(8, answer // 8)),
                explanation=f"Sommiamo {c} + {b}: il numero è {answer}.",
                language="it",
                program=f"matematica_classe_{cls}_aritmetica",
                tags=["matematica", "aritmetica", f"classe_{cls}", "primaria", "pilota_parametrico"],
                teacher_note=f"parametric_pilot_{profile}_v1",
            )

        added += append_with_attempts(
            target=targets["missing_sub"],
            make_entry=sub_missing,
            get_question=lambda e: e["question"],
            existing_questions=existing,
            questions_out=questions,
        )

        def sequence() -> Dict:
            step = RNG.randint(1 + cls // 2, 4 + cls * 2)
            start = RNG.randint(3, 30 + cls * 40)
            seq = [start + i * step for i in range(5)]
            prefix = f"mat-{cls}-logica_e_dati-"
            qid = f"{prefix}{existing_prefix_max(questions, prefix) + 1:03d}"
            return base_entry(
                qid=qid,
                subject="matematica",
                source_subject="matematica",
                cls=cls,
                area="logica_e_dati",
                subarea="",
                difficulty=None,
                question=f"Completa la sequenza: {seq[0]}, {seq[1]}, {seq[2]}, {seq[3]}, ___.",
                answer=str(seq[4]),
                options=make_numeric_options(seq[4], spread=max(6, step * 3)),
                explanation=f"La regola è +{step}. Dopo {seq[3]} viene {seq[4]}.",
                language="it",
                program=f"matematica_classe_{cls}_logica",
                tags=["matematica", "logica_e_dati", f"classe_{cls}", "primaria", "pilota_parametrico"],
                teacher_note=f"parametric_pilot_{profile}_v1",
            )

        added += append_with_attempts(
            target=targets["sequence"],
            make_entry=sequence,
            get_question=lambda e: e["question"],
            existing_questions=existing,
            questions_out=questions,
        )

        def missing_factor() -> Dict:
            a = RNG.randint(3, 7 + cls)
            b = RNG.randint(2, 6 + cls)
            prod = a * b
            prefix = f"mat-{cls}-aritmetica-"
            qid = f"{prefix}{existing_prefix_max(questions, prefix) + 1:03d}"
            return base_entry(
                qid=qid,
                subject="matematica",
                source_subject="matematica",
                cls=cls,
                area="aritmetica",
                subarea="",
                difficulty=None,
                question=f"Completa: {a} × ___ = {prod}.",
                answer=str(b),
                options=make_numeric_options(b, spread=max(5, cls + 3)),
                explanation=f"{prod} diviso {a} fa {b}.",
                language="it",
                program=f"matematica_classe_{cls}_aritmetica",
                tags=["matematica", "aritmetica", f"classe_{cls}", "primaria", "pilota_parametrico"],
                teacher_note=f"parametric_pilot_{profile}_v1",
            )

        added += append_with_attempts(
            target=targets["missing_factor"],
            make_entry=missing_factor,
            get_question=lambda e: e["question"],
            existing_questions=existing,
            questions_out=questions,
        )

        def perimeter_rect() -> Dict:
            l1 = RNG.randint(3 + cls, 8 + cls * 2)
            l2 = RNG.randint(2 + cls, 7 + cls * 2)
            per = 2 * (l1 + l2)
            prefix = f"mat-{cls}-geometria-"
            qid = f"{prefix}{existing_prefix_max(questions, prefix) + 1:03d}"
            return base_entry(
                qid=qid,
                subject="matematica",
                source_subject="matematica",
                cls=cls,
                area="geometria",
                subarea="",
                difficulty=None,
                question=f"Perimetro di un rettangolo con lati {l1} cm e {l2} cm?",
                answer=str(per),
                options=make_numeric_options(per, spread=max(6, per // 5)),
                explanation=f"Perimetro = 2 × ({l1} + {l2}) = {per}.",
                language="it",
                program=f"matematica_classe_{cls}_geometria",
                tags=["matematica", "geometria", f"classe_{cls}", "primaria", "pilota_parametrico"],
                teacher_note=f"parametric_pilot_{profile}_v1",
            )

        added += append_with_attempts(
            target=targets["perimeter"],
            make_entry=perimeter_rect,
            get_question=lambda e: e["question"],
            existing_questions=existing,
            questions_out=questions,
        )

    refresh_subject_stats(data)
    return added


def problemi_profile_targets(profile: str) -> Dict[str, int]:
    if profile == "extended":
        return {
            "add": 3,
            "mul": 3,
            "two_ops": 3,
            "sub": 2,
            "div": 2,
            "money": 2,
        }
    return {
        "add": 1,
        "mul": 1,
        "two_ops": 1,
        "sub": 0,
        "div": 0,
        "money": 0,
    }


def append_problemi(data: Dict, profile: str) -> int:
    questions = data["questions"]
    existing = {normalize_text(q.get("question", "")) for q in questions}
    added = 0
    names = ["Luca", "Sara", "Emma", "Matteo", "Giulia", "Tommaso", "Sofia", "Arianna", "Elena", "Davide"]
    places = ["biblioteca", "palestra", "aula", "laboratorio"]

    diff_by_class = {2: 1, 3: 2, 4: 3, 5: 4}
    targets = problemi_profile_targets(profile)

    for cls in [2, 3, 4, 5]:
        diff = diff_by_class[cls]

        def t_add() -> Dict:
            a = RNG.randint(12 + cls * 4, 45 + cls * 11)
            b = RNG.randint(4 + cls, 14 + cls * 2)
            name = RNG.choice(names)
            answer = a + b
            prefix = f"pro-{cls}-problemi-"
            qid = f"{prefix}{existing_prefix_max(questions, prefix) + 1:03d}"
            return base_entry(
                qid=qid,
                subject="problemi",
                source_subject="Matematica",
                cls=cls,
                area="problemi",
                subarea="addizione",
                difficulty=diff,
                question=f"{name} ha {a} figurine e ne riceve {b}. Quante figurine ha ora?",
                answer=str(answer),
                options=make_numeric_options(answer, spread=max(8, answer // 7)),
                explanation=f"Sommiamo: {a} + {b} = {answer}.",
                language="it",
                program=f"Matematica Classe {cls} - MIUR",
                tags=["addizione", "figurine", "pilota_parametrico"],
                teacher_note=f"parametric_pilot_{profile}_v1",
            )

        added += append_with_attempts(
            target=targets["add"],
            make_entry=t_add,
            get_question=lambda e: e["question"],
            existing_questions=existing,
            questions_out=questions,
        )

        def t_mul() -> Dict:
            groups = RNG.randint(3 + cls // 2, 6 + cls)
            each = RNG.randint(2 + cls // 2, 8 + cls)
            answer = groups * each
            place = RNG.choice(places)
            prefix = f"pro-{cls}-problemi-"
            qid = f"{prefix}{existing_prefix_max(questions, prefix) + 1:03d}"
            return base_entry(
                qid=qid,
                subject="problemi",
                source_subject="Matematica",
                cls=cls,
                area="problemi",
                subarea="moltiplicazione",
                difficulty=diff,
                question=f"Nella {place} ci sono {groups} scaffali con {each} libri ciascuno. Quanti libri ci sono in tutto?",
                answer=str(answer),
                options=make_numeric_options(answer, spread=max(8, answer // 6)),
                explanation=f"Moltiplichiamo: {groups} × {each} = {answer}.",
                language="it",
                program=f"Matematica Classe {cls} - MIUR",
                tags=["moltiplicazione", "quantita", "pilota_parametrico"],
                teacher_note=f"parametric_pilot_{profile}_v1",
            )

        added += append_with_attempts(
            target=targets["mul"],
            make_entry=t_mul,
            get_question=lambda e: e["question"],
            existing_questions=existing,
            questions_out=questions,
        )

        def t_two_ops() -> Dict:
            start = RNG.randint(25 + cls * 8, 70 + cls * 20)
            leave = RNG.randint(4 + cls, 10 + cls * 2)
            arrive = RNG.randint(3 + cls, 12 + cls * 2)
            answer = start - leave + arrive
            prefix = f"pro-{cls}-problemi-"
            qid = f"{prefix}{existing_prefix_max(questions, prefix) + 1:03d}"
            return base_entry(
                qid=qid,
                subject="problemi",
                source_subject="Matematica",
                cls=cls,
                area="problemi",
                subarea="due operazioni",
                difficulty=diff,
                question=(
                    f"Al parco ci sono {start} bambini. {leave} vanno via e poi arrivano {arrive}. "
                    "Quanti bambini ci sono adesso?"
                ),
                answer=str(answer),
                options=make_numeric_options(answer, spread=max(8, answer // 7)),
                explanation=f"Prima {start} - {leave} = {start - leave}, poi + {arrive} = {answer}.",
                language="it",
                program=f"Matematica Classe {cls} - MIUR",
                tags=["due operazioni", "parco", "pilota_parametrico"],
                teacher_note=f"parametric_pilot_{profile}_v1",
            )

        added += append_with_attempts(
            target=targets["two_ops"],
            make_entry=t_two_ops,
            get_question=lambda e: e["question"],
            existing_questions=existing,
            questions_out=questions,
        )

        def t_sub() -> Dict:
            total = RNG.randint(35 + cls * 8, 80 + cls * 20)
            consumed = RNG.randint(6 + cls, 16 + cls * 2)
            answer = total - consumed
            item = RNG.choice(["matite", "quaderni", "figurine", "merendine"])
            prefix = f"pro-{cls}-problemi-"
            qid = f"{prefix}{existing_prefix_max(questions, prefix) + 1:03d}"
            return base_entry(
                qid=qid,
                subject="problemi",
                source_subject="Matematica",
                cls=cls,
                area="problemi",
                subarea="sottrazione",
                difficulty=diff,
                question=f"In scatola ci sono {total} {item}. Ne usi {consumed}. Quanti {item} restano?",
                answer=str(answer),
                options=make_numeric_options(answer, spread=max(8, answer // 8)),
                explanation=f"Calcolo: {total} - {consumed} = {answer}.",
                language="it",
                program=f"Matematica Classe {cls} - MIUR",
                tags=["sottrazione", "quantita", "pilota_parametrico"],
                teacher_note=f"parametric_pilot_{profile}_v1",
            )

        added += append_with_attempts(
            target=targets["sub"],
            make_entry=t_sub,
            get_question=lambda e: e["question"],
            existing_questions=existing,
            questions_out=questions,
        )

        def t_div() -> Dict:
            divisor = RNG.randint(2 + cls // 2, 5 + cls // 2)
            quotient = RNG.randint(3 + cls, 8 + cls)
            total = divisor * quotient
            item = RNG.choice(["caramelle", "figurine", "biscotti", "pennarelli"])
            prefix = f"pro-{cls}-problemi-"
            qid = f"{prefix}{existing_prefix_max(questions, prefix) + 1:03d}"
            return base_entry(
                qid=qid,
                subject="problemi",
                source_subject="Matematica",
                cls=cls,
                area="problemi",
                subarea="divisione",
                difficulty=diff,
                question=f"{total} {item} vengono divisi in {divisor} sacchetti uguali. Quanti {item} in ogni sacchetto?",
                answer=str(quotient),
                options=make_numeric_options(quotient, spread=max(5, quotient + 2)),
                explanation=f"Divisione: {total} : {divisor} = {quotient}.",
                language="it",
                program=f"Matematica Classe {cls} - MIUR",
                tags=["divisione", "raggruppamento", "pilota_parametrico"],
                teacher_note=f"parametric_pilot_{profile}_v1",
            )

        added += append_with_attempts(
            target=targets["div"],
            make_entry=t_div,
            get_question=lambda e: e["question"],
            existing_questions=existing,
            questions_out=questions,
        )

        def t_money() -> Dict:
            wallet = RNG.randint(25 + cls * 6, 60 + cls * 18)
            p1 = RNG.randint(4 + cls, 12 + cls * 2)
            p2 = RNG.randint(3 + cls, 10 + cls * 2)
            answer = wallet - p1 - p2
            name = RNG.choice(names)
            prefix = f"pro-{cls}-problemi-"
            qid = f"{prefix}{existing_prefix_max(questions, prefix) + 1:03d}"
            return base_entry(
                qid=qid,
                subject="problemi",
                source_subject="Matematica",
                cls=cls,
                area="problemi",
                subarea="multi-step",
                difficulty=diff,
                question=(
                    f"{name} ha {wallet} euro. Compra un libro da {p1} euro e un quaderno da {p2} euro. "
                    "Quanti euro restano?"
                ),
                answer=str(answer),
                options=make_numeric_options(answer, spread=max(8, answer // 8)),
                explanation=f"Prima {wallet} - {p1} = {wallet - p1}, poi - {p2} = {answer}.",
                language="it",
                program=f"Matematica Classe {cls} - MIUR",
                tags=["multi-step", "denaro", "pilota_parametrico"],
                teacher_note=f"parametric_pilot_{profile}_v1",
            )

        added += append_with_attempts(
            target=targets["money"],
            make_entry=t_money,
            get_question=lambda e: e["question"],
            existing_questions=existing,
            questions_out=questions,
        )

    refresh_subject_stats(data)
    return added


def english_profile_targets(profile: str) -> Dict[str, int]:
    if profile == "extended":
        return {
            "where": 2,
            "match": 2,
            "to_be": 2,
            "have_got": 2,
            "routine": 2,
        }
    return {
        "where": 1,
        "match": 1,
        "to_be": 0,
        "have_got": 0,
        "routine": 0,
    }


def english_subarea_and_diff(cls: int) -> Tuple[str, int]:
    if cls == 2:
        return "lessico_base", 1
    if cls == 3:
        return "frasi_semplici", 2
    if cls == 4:
        return "uso_guidato", 3
    return "comprensione_in_contesto", 4


def append_inglese(data: Dict, profile: str) -> int:
    questions = data["questions"]
    existing = {normalize_text(q.get("question", "")) for q in questions}
    added = 0
    targets = english_profile_targets(profile)
    where_actions = [
        ("read books", "in the library", "casa"),
        ("eat lunch", "in the kitchen", "cibo"),
        ("play basketball", "in the gym", "sport"),
        ("sleep", "in the bedroom", "casa"),
        ("do homework", "in the study", "routine_quotidiana"),
        ("have dinner", "in the kitchen", "cibo"),
        ("play football", "in the playground", "sport"),
        ("watch TV", "in the living room", "casa"),
    ]
    place_pool = [
        "in the bathroom",
        "in the garage",
        "in the garden",
        "on the roof",
        "in the classroom",
        "in the office",
        "in the attic",
        "in the basement",
    ]
    where_starters = ["Where do you usually", "Where do you often", "Where do you"]
    where_times = ["", "in the morning", "after school", "every day", "at home"]

    en_it_pairs = [
        ("She likes apples.", "Lei ama le mele.", "cibo"),
        ("We drink water every day.", "Noi beviamo acqua ogni giorno.", "cibo"),
        ("He is wearing a blue jacket.", "Lui indossa una giacca blu.", "domande"),
        ("They are playing basketball after school.", "Loro giocano a basket dopo scuola.", "sport"),
        ("I have breakfast at seven.", "Faccio colazione alle sette.", "routine_quotidiana"),
        ("My brother has a red bike.", "Mio fratello ha una bici rossa.", "casa"),
        ("Our teacher opens the classroom door.", "La nostra insegnante apre la porta della classe.", "domande"),
        ("The cat is under the table.", "Il gatto è sotto il tavolo.", "animali"),
        ("We study English on Monday.", "Studiamo inglese il lunedì.", "giorni"),
        ("It is sunny today.", "Oggi c'è il sole.", "meteo"),
        ("I can swim very well.", "So nuotare molto bene.", "sport"),
        ("They have got two dogs.", "Loro hanno due cani.", "have_got"),
    ]

    be_subjects = [("I", "am"), ("You", "are"), ("He", "is"), ("She", "is"), ("It", "is"), ("We", "are"), ("They", "are")]
    be_adjectives = ["happy", "ready", "late", "hungry", "quiet", "tired", "excited", "careful", "kind", "brave"]

    animal_legs = [
        ("spider", "eight"),
        ("cat", "four"),
        ("dog", "four"),
        ("bird", "two"),
        ("ant", "six"),
        ("horse", "four"),
        ("duck", "two"),
        ("frog", "four"),
    ]

    routine_actions = [
        ("wake up", "7:00"),
        ("have breakfast", "7:30"),
        ("go to school", "8:00"),
        ("have lunch", "13:00"),
        ("do homework", "16:00"),
        ("play outside", "17:00"),
        ("have dinner", "19:30"),
        ("go to bed", "21:00"),
    ]

    for cls in [2, 3, 4, 5]:
        subarea, difficulty = english_subarea_and_diff(cls)

        def t_where() -> Dict:
            action, answer, area = RNG.choice(where_actions)
            starter = RNG.choice(where_starters)
            time_hint = RNG.choice(where_times)
            q_text = f"{starter} {action}{(' ' + time_hint) if time_hint else ''}?"
            distractors = [p for p in place_pool if p != answer]
            RNG.shuffle(distractors)
            prefix = f"eng-{cls}-{area}-"
            qid = f"{prefix}{existing_prefix_max(questions, prefix) + 1:03d}"
            opts = [answer] + distractors[:3]
            RNG.shuffle(opts)
            return base_entry(
                qid=qid,
                subject="inglese",
                source_subject="inglese",
                cls=cls,
                area=area,
                subarea=subarea,
                difficulty=difficulty,
                question=q_text,
                answer=answer,
                options=opts,
                explanation=f'The correct place is "{answer}".',
                language="en",
                program=f"inglese_primaria_classe_{cls}_{area}",
                tags=["inglese", f"classe_{cls}", area, "primaria", "pilota_parametrico"],
                teacher_note=f"parametric_pilot_{profile}_v1",
            )

        added += append_with_attempts(
            target=targets["where"],
            make_entry=t_where,
            get_question=lambda e: e["question"],
            existing_questions=existing,
            questions_out=questions,
        )

        def t_match() -> Dict:
            q_en, answer, area = RNG.choice(en_it_pairs)
            prefix = f"eng-{cls}-{area}-"
            qid = f"{prefix}{existing_prefix_max(questions, prefix) + 1:03d}"
            distractors = [it for en, it, ar in en_it_pairs if it != answer and ar != area]
            RNG.shuffle(distractors)
            opts = [answer] + distractors[:3]
            RNG.shuffle(opts)
            return base_entry(
                qid=qid,
                subject="inglese",
                source_subject="inglese",
                cls=cls,
                area=area,
                subarea=subarea,
                difficulty=difficulty,
                question=q_en,
                answer=answer,
                options=opts,
                explanation="Choose the Italian sentence with the same meaning.",
                language="en",
                program=f"inglese_primaria_classe_{cls}_{area}",
                tags=["inglese", f"classe_{cls}", area, "primaria", "pilota_parametrico"],
                teacher_note=f"parametric_pilot_{profile}_v1",
            )

        added += append_with_attempts(
            target=targets["match"],
            make_entry=t_match,
            get_question=lambda e: e["question"],
            existing_questions=existing,
            questions_out=questions,
        )

        def t_to_be() -> Dict:
            subj, answer = RNG.choice(be_subjects)
            adjective = RNG.choice(be_adjectives)
            question = f"Complete: {subj} ___ {adjective}."
            distractors = [x for x in ["am", "is", "are", "be"] if x != answer]
            area = "to_be"
            prefix = f"eng-{cls}-{area}-"
            qid = f"{prefix}{existing_prefix_max(questions, prefix) + 1:03d}"
            opts = [answer] + distractors[:3]
            RNG.shuffle(opts)
            return base_entry(
                qid=qid,
                subject="inglese",
                source_subject="inglese",
                cls=cls,
                area=area,
                subarea=subarea,
                difficulty=difficulty,
                question=question,
                answer=answer,
                options=opts,
                explanation="Use the correct form of the verb to be.",
                language="en",
                program=f"inglese_primaria_classe_{cls}_{area}",
                tags=["inglese", f"classe_{cls}", area, "primaria", "pilota_parametrico"],
                teacher_note=f"parametric_pilot_{profile}_v1",
            )

        added += append_with_attempts(
            target=targets["to_be"],
            make_entry=t_to_be,
            get_question=lambda e: e["question"],
            existing_questions=existing,
            questions_out=questions,
        )

        def t_have_got() -> Dict:
            animal, answer = RNG.choice(animal_legs)
            question = f"How many legs has a {animal} got?"
            distractors = [x for x in ["two", "four", "six", "eight", "ten"] if x != answer]
            RNG.shuffle(distractors)
            area = "have_got"
            prefix = f"eng-{cls}-{area}-"
            qid = f"{prefix}{existing_prefix_max(questions, prefix) + 1:03d}"
            opts = [answer] + distractors[:3]
            RNG.shuffle(opts)
            return base_entry(
                qid=qid,
                subject="inglese",
                source_subject="inglese",
                cls=cls,
                area=area,
                subarea=subarea,
                difficulty=difficulty,
                question=question,
                answer=answer,
                options=opts,
                explanation="Choose the correct number word.",
                language="en",
                program=f"inglese_primaria_classe_{cls}_{area}",
                tags=["inglese", f"classe_{cls}", area, "primaria", "pilota_parametrico"],
                teacher_note=f"parametric_pilot_{profile}_v1",
            )

        added += append_with_attempts(
            target=targets["have_got"],
            make_entry=t_have_got,
            get_question=lambda e: e["question"],
            existing_questions=existing,
            questions_out=questions,
        )

        def t_routine() -> Dict:
            action, hour = RNG.choice(routine_actions)
            question = f"I {action} at {hour}. What do I do at {hour}?"
            answer = f"I {action}."
            distractors = [f"I {a}." for a, h in routine_actions if a != action]
            RNG.shuffle(distractors)
            area = "routine_quotidiana"
            prefix = f"eng-{cls}-{area}-"
            qid = f"{prefix}{existing_prefix_max(questions, prefix) + 1:03d}"
            opts = [answer] + distractors[:3]
            RNG.shuffle(opts)
            return base_entry(
                qid=qid,
                subject="inglese",
                source_subject="inglese",
                cls=cls,
                area=area,
                subarea=subarea,
                difficulty=difficulty,
                question=question,
                answer=answer,
                options=opts,
                explanation="Pick the sentence that matches the time clue.",
                language="en",
                program=f"inglese_primaria_classe_{cls}_{area}",
                tags=["inglese", f"classe_{cls}", area, "primaria", "pilota_parametrico"],
                teacher_note=f"parametric_pilot_{profile}_v1",
            )

        added += append_with_attempts(
            target=targets["routine"],
            make_entry=t_routine,
            get_question=lambda e: e["question"],
            existing_questions=existing,
            questions_out=questions,
        )

    refresh_subject_stats(data)
    return added


def refresh_index(subjects: Dict[str, Dict]) -> None:
    idx_path = JSON_DIR / "index.json"
    with idx_path.open("r", encoding="utf-8") as fh:
        idx = json.load(fh)

    idx["generatedAt"] = now_iso()
    total = 0
    for subject in ["matematica", "problemi", "inglese"]:
        sub = subjects[subject]
        rows = len(sub.get("questions", []))
        idx["subjects"][subject]["rows"] = rows
        idx["subjects"][subject]["stats"] = sub.get("stats", {})
        total += rows

    for subject, meta in idx.get("subjects", {}).items():
        if subject in {"matematica", "problemi", "inglese"}:
            continue
        total += int(meta.get("rows", 0) or 0)

    idx["totalQuestions"] = total
    with idx_path.open("w", encoding="utf-8") as fh:
        json.dump(idx, fh, ensure_ascii=False, indent=2)
        fh.write("\n")


def normalize_csv_cell(value) -> str:
    if value is None:
        return ""
    return str(value).strip()


def build_coverage_rows(subject: str, data: Dict, generated_at: str) -> List[Dict[str, str]]:
    questions = data.get("questions", [])
    total_subject = len(questions)
    active_subject = sum(1 for q in questions if bool(q.get("active", True)))
    by_key = Counter()
    for q in questions:
        key = (
            normalize_csv_cell(q.get("class")),
            normalize_csv_cell(q.get("area")),
            normalize_csv_cell(q.get("subarea")),
            normalize_csv_cell(q.get("difficulty")),
            normalize_csv_cell(q.get("language")),
            "1" if bool(q.get("active", True)) else "0",
        )
        by_key[key] += 1

    rows: List[Dict[str, str]] = []
    rows.append(
        {
            "row_type": "subject_summary",
            "generated_at": generated_at,
            "subject": subject,
            "subject_total_questions": str(total_subject),
            "subject_active_questions": str(active_subject),
            "subject_active_ratio_pct": f"{(active_subject / total_subject * 100):.2f}" if total_subject else "0.00",
            "class": "",
            "area": "",
            "subarea": "",
            "difficulty": "",
            "language": "",
            "active": "",
            "count": "",
            "share_subject_pct": "",
        }
    )

    for (cls, area, subarea, difficulty, language, active), count in sorted(
        by_key.items(),
        key=lambda kv: (
            kv[0][0],
            kv[0][1],
            kv[0][2],
            kv[0][3],
            kv[0][4],
            kv[0][5],
        ),
    ):
        rows.append(
            {
                "row_type": "detail",
                "generated_at": generated_at,
                "subject": subject,
                "subject_total_questions": str(total_subject),
                "subject_active_questions": str(active_subject),
                "subject_active_ratio_pct": f"{(active_subject / total_subject * 100):.2f}" if total_subject else "0.00",
                "class": cls,
                "area": area,
                "subarea": subarea,
                "difficulty": difficulty,
                "language": language,
                "active": active,
                "count": str(count),
                "share_subject_pct": f"{(count / total_subject * 100):.2f}" if total_subject else "0.00",
            }
        )
    return rows


def write_coverage_csv_report() -> Tuple[Path, Path, int]:
    idx_path = JSON_DIR / "index.json"
    with idx_path.open("r", encoding="utf-8") as fh:
        idx = json.load(fh)

    generated_at = now_iso()
    rows: List[Dict[str, str]] = []
    subjects_map = idx.get("subjects", {})
    for subject in sorted(subjects_map.keys()):
        rel = subjects_map.get(subject, {}).get("path")
        if not rel:
            continue
        sub_path = JSON_DIR / rel
        if not sub_path.exists():
            continue
        with sub_path.open("r", encoding="utf-8") as fh:
            data = json.load(fh)
        rows.extend(build_coverage_rows(subject, data, generated_at))

    reports_dir = ROOT / "reports"
    reports_dir.mkdir(parents=True, exist_ok=True)
    latest_path = reports_dir / "questions_coverage_latest.csv"
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    archive_path = reports_dir / f"questions_coverage_{timestamp}.csv"

    fieldnames = [
        "row_type",
        "generated_at",
        "subject",
        "subject_total_questions",
        "subject_active_questions",
        "subject_active_ratio_pct",
        "class",
        "area",
        "subarea",
        "difficulty",
        "language",
        "active",
        "count",
        "share_subject_pct",
    ]

    for out_path in [latest_path, archive_path]:
        with out_path.open("w", encoding="utf-8", newline="") as fh:
            writer = csv.DictWriter(fh, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)

    return latest_path, archive_path, len(rows)


def validate_subject(data: Dict) -> Tuple[int, int]:
    questions = data.get("questions", [])
    seen_ids = set()
    id_dups = 0
    option_errors = 0
    for q in questions:
        qid = str(q.get("id", ""))
        if qid in seen_ids:
            id_dups += 1
        seen_ids.add(qid)

        options = [str(x) for x in q.get("options", [])]
        answer = str(q.get("answer", ""))
        if len(options) != 4 or answer not in options:
            option_errors += 1
            continue
        if int(q.get("answerIndex", -1)) != options.index(answer):
            option_errors += 1

    return id_dups, option_errors


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Append parametric pilot questions to subject JSON files.")
    parser.add_argument("--profile", choices=["small", "extended"], default="small", help="Generation profile")
    parser.add_argument("--seed", type=int, default=20260419, help="Random seed")
    parser.add_argument(
        "--report-only",
        action="store_true",
        help="Generate coverage CSV report only, without appending new questions",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    RNG.seed(args.seed)

    if args.report_only:
        latest_path, archive_path, row_count = write_coverage_csv_report()
        print(f"Coverage CSV generated: {latest_path}")
        print(f"Coverage CSV archive: {archive_path}")
        print(f"Rows written: {row_count}")
        return

    subjects = {
        "matematica": load_subject("matematica"),
        "problemi": load_subject("problemi"),
        "inglese": load_subject("inglese"),
    }

    added = {
        "matematica": append_matematica(subjects["matematica"], args.profile),
        "problemi": append_problemi(subjects["problemi"], args.profile),
        "inglese": append_inglese(subjects["inglese"], args.profile),
    }

    for subject, data in subjects.items():
        save_subject(subject, data)

    refresh_index(subjects)
    latest_path, archive_path, row_count = write_coverage_csv_report()

    print(f"Parametric pilot append completed (profile={args.profile}, seed={args.seed})")
    for subject in ["matematica", "problemi", "inglese"]:
        dups, opt_err = validate_subject(subjects[subject])
        print(
            f"- {subject}: +{added[subject]} new | total={len(subjects[subject]['questions'])} | "
            f"id_dups={dups} | option_errors={opt_err}"
        )
    print(f"Coverage CSV generated: {latest_path}")
    print(f"Coverage CSV archive: {archive_path}")
    print(f"Rows written: {row_count}")


if __name__ == "__main__":
    main()
