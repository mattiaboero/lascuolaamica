#!/usr/bin/env python3
import json
from pathlib import Path
from collections import defaultdict

JSON_DIR = Path(__file__).parent.parent / 'json'
SUBJECTS = ['matematica', 'problemi', 'italiano', 'inglese', 'civica', 'geografia', 'storia', 'scienze']

def normalize_question_text(text):
    """Normalize question text for comparison."""
    return (text or '').strip().lower()

def process_subject(subject):
    """Remove duplicate questions from a subject, keeping first with explanation."""
    json_file = JSON_DIR / f'{subject}.json'

    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Find question list
    questions = None
    questions_key = None
    for key, value in data.items():
        if isinstance(value, list) and len(value) > 0 and isinstance(value[0], dict):
            if 'question' in value[0]:
                questions = value
                questions_key = key
                break

    if questions is None:
        print(f"  ⚠ {subject}: no questions list found")
        return 0

    # Group by normalized question text
    seen = {}  # normalized_text -> index of first occurrence
    duplicates = []

    for idx, q in enumerate(questions):
        question_text = normalize_question_text(q.get('question', ''))
        if not question_text:
            continue

        if question_text in seen:
            # Duplicate found
            first_idx = seen[question_text]
            first_q = questions[first_idx]
            first_explanation = (first_q.get('explanation') or '').strip()

            # Prefer to keep the one with explanation
            if not first_explanation and (q.get('explanation') or '').strip():
                # Swap: move first occurrence to be the one with explanation
                questions[first_idx], questions[idx] = questions[idx], questions[first_idx]
                # Update the index for future comparisons
                seen[question_text] = idx

            duplicates.append(idx)
        else:
            seen[question_text] = idx

    # Remove duplicates in reverse order to maintain indices
    for idx in sorted(duplicates, reverse=True):
        del questions[idx]

    # Write back
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=1, ensure_ascii=False)

    return len(duplicates)

def update_counts():
    """Update json/index.json with new counts after dedup."""
    index_file = JSON_DIR / 'index.json'

    with open(index_file, 'r', encoding='utf-8') as f:
        index = json.load(f)

    total_questions = 0

    for subject in SUBJECTS:
        json_file = JSON_DIR / f'{subject}.json'
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)

        questions = None
        for v in data.values():
            if isinstance(v, list):
                questions = v
                break

        if questions:
            if 'subjects' in index and subject in index['subjects']:
                index['subjects'][subject]['rows'] = len(questions)
                total_questions += len(questions)

    index['totalQuestions'] = total_questions
    index['generatedAt'] = index.get('generatedAt', '')  # Keep existing timestamp

    with open(index_file, 'w', encoding='utf-8') as f:
        json.dump(index, f, indent=1, ensure_ascii=False)

    return total_questions

def main():
    print("\n=== Deduplicating questions ===\n")

    results = {}
    for subject in SUBJECTS:
        print(f"Processing {subject}...")
        removed = process_subject(subject)
        results[subject] = removed

    print("\n=== Dedup Report ===\n")
    print(f"{'Subject':<15} {'Removed':<8}")
    print("=" * 23)

    total_removed = 0
    for subject in SUBJECTS:
        removed = results[subject]
        total_removed += removed
        if removed > 0:
            print(f"{subject:<15} {removed:<8}")

    print("=" * 23)
    print(f"{'TOTAL':<15} {total_removed:<8}\n")

    # Update counts
    total = update_counts()
    print(f"Updated index.json. Total questions now: {total}\n")

if __name__ == '__main__':
    main()
