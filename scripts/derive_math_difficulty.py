#!/usr/bin/env python3
"""Re-derive matematica `difficulty` (1/2/3) from INTRINSIC question features.

Problem: `normalize_difficulty.py` inferred null difficulty from class, collapsing
matematica onto class (c2/c3 -> 1, c4/c5 -> 2). That makes the app's adaptive-
difficulty feature (A2 in subject-quiz-core.js), which biases selection toward a
per-class EMA difficulty target, a no-op for matematica.

Fix: compute a deterministic intrinsic-complexity raw score per question from
operand magnitude, operation type, decimals/fractions/percent, exponents,
parentheses and multi-step indicators. Then, WITHIN EACH CLASS, bin questions
into terciles (1/2/3) by that score. Within-class tercile binning guarantees a
real spread in every class, so the per-class adaptive target meaningfully shifts
selection — while the ordering still reflects genuine intrinsic difficulty.

Only the `difficulty` field is modified. Deterministic (id is the tiebreaker).
"""
import json
import re
from pathlib import Path

JSON_FILE = Path(__file__).parent.parent / 'json' / 'matematica.json'

# Operation weights (mult/div harder than add/sub).
OP_SYMBOL_WEIGHTS = [
    (re.compile(r'[÷:]|\bdiviso\b|\bripartisc|\bmet[àa]\b'), 2.0),   # division
    (re.compile(r'[×·]|\bx\b|\bper\b|\bciascun|\bogni\b|\bvolte\b'), 1.5),  # multiplication
    (re.compile(r'(?<=\d)\s*-\s*(?=\d)|\bmeno\b|\btoglie|\brimang|\bperde\b|\brest'), 0.6),  # subtraction
    (re.compile(r'(?<=\d)\s*\+\s*(?=\d)|\bpi[uù]\b|\baggiung|\bricev|\barriv|\bin tutto\b|\bsomma'), 0.3),  # addition
]

RE_DECIMAL = re.compile(r'\d+,\d+')          # Italian decimal: 3,5
RE_FRACTION = re.compile(r'\b\d+\s*/\s*\d+\b')  # 1/10
RE_PERCENT = re.compile(r'%|\bpercent')
RE_EXPONENT = re.compile(r'[²³]|\bal quadrato\b|\bal cubo\b|\bquadrato di\b|\bcubo di\b')
RE_PAREN = re.compile(r'[()]')
RE_MULTISTEP = re.compile(r'\bpoi\b|\bquindi\b|\binfine\b|\bin totale.*\bognun')
RE_NUMBER = re.compile(r'\d+(?:[.,]\d+)?')


def magnitude_score(text):
    """Score driven by the largest number's digit count and operand count."""
    nums = RE_NUMBER.findall(text)
    if not nums:
        return 0.0, 0
    def digits(tok):
        return len(re.sub(r'\D', '', tok)) or 1
    max_digits = max(digits(n) for n in nums)
    # 1-digit->0, 2->1.2, 3->2.4, 4->3.6, 5+->4.5 (saturating)
    mag = min((max_digits - 1) * 1.2, 4.5)
    operand_bonus = min(len(nums), 5) * 0.15  # more numbers to track
    return mag + operand_bonus, max_digits


def operation_score(text):
    for pattern, weight in OP_SYMBOL_WEIGHTS:
        if pattern.search(text):
            return weight
    return 0.0


def special_score(text):
    s = 0.0
    if RE_DECIMAL.search(text):
        s += 1.6
    if RE_FRACTION.search(text):
        s += 1.6
    if RE_PERCENT.search(text):
        s += 1.5
    if RE_EXPONENT.search(text):
        s += 1.2
    if RE_PAREN.search(text):
        s += 1.0
    if RE_MULTISTEP.search(text):
        s += 1.4
    return s


def raw_score(q):
    text = (q.get('question') or '') + ' ' + (q.get('answer') or '')
    low = text.lower()
    mag, _ = magnitude_score(text)
    op = operation_score(low)
    sp = special_score(low)
    # Length as a mild reading-load proxy (word problems vs bare facts).
    length = min(len(text) / 120.0, 1.0)
    return mag + op + sp + length * 0.8


def get_questions(data):
    if isinstance(data, dict) and isinstance(data.get('questions'), list):
        return data['questions']
    for v in data.values():
        if isinstance(v, list):
            return v
    return []


def dist_by_class(questions):
    g = {}
    for q in questions:
        if q.get('active') is False:
            continue
        c = q.get('class')
        d = q.get('difficulty')
        g.setdefault(c, {1: 0, 2: 0, 3: 0})
        if d in (1, 2, 3):
            g[c][d] += 1
    return g


def main():
    data = json.loads(JSON_FILE.read_text(encoding='utf-8'))
    questions = get_questions(data)
    active = [q for q in questions if q.get('active') is not False]

    before = dist_by_class(questions)

    # Group active questions by class, rank by (raw_score, id) -> tercile bins.
    by_class = {}
    for q in active:
        by_class.setdefault(q.get('class'), []).append(q)

    changed = 0
    for cls, qs in by_class.items():
        scored = sorted(qs, key=lambda q: (raw_score(q), str(q.get('id'))))
        n = len(scored)
        c1 = n // 3
        c2 = (2 * n) // 3
        for i, q in enumerate(scored):
            new_d = 1 if i < c1 else (2 if i < c2 else 3)
            if q.get('difficulty') != new_d:
                q['difficulty'] = new_d
                changed += 1

    after = dist_by_class(questions)

    JSON_FILE.write_text(
        json.dumps(data, ensure_ascii=False, indent=1) + '\n', encoding='utf-8'
    )

    print(f"matematica: {len(active)} active questions, {changed} difficulty changed\n")
    print(f"{'class':<6}{'before 1/2/3':<20}{'after 1/2/3':<20}")
    print('-' * 46)
    for c in sorted(before):
        b = before[c]
        a = after[c]
        print(f"{c:<6}{f'{b[1]}/{b[2]}/{b[3]}':<20}{f'{a[1]}/{a[2]}/{a[3]}':<20}")


if __name__ == '__main__':
    main()
