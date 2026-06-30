#!/usr/bin/env python3
import json
from pathlib import Path

JSON_DIR = Path(__file__).parent.parent / 'json'
SUBJECTS = ['matematica', 'problemi', 'italiano', 'inglese', 'civica', 'geografia', 'storia', 'scienze']

def update_subject(subject):
    """Update totalQuestions field in subject JSON."""
    json_file = JSON_DIR / f'{subject}.json'

    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Find question list
    questions = None
    for v in data.values():
        if isinstance(v, list):
            questions = v
            break

    if questions is None:
        return 0

    old_total = data.get('totalQuestions', 0)
    new_total = len(questions)

    data['totalQuestions'] = new_total

    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=1, ensure_ascii=False)

    return (old_total, new_total)

def main():
    print("\n=== Updating totalQuestions fields ===\n")
    print(f"{'Subject':<15} {'Old':<8} {'New':<8} {'Change':<8}")
    print("=" * 40)

    for subject in SUBJECTS:
        old, new = update_subject(subject)
        change = new - old
        print(f"{subject:<15} {old:<8} {new:<8} {change:<8}")

    print("=" * 40 + "\n")

if __name__ == '__main__':
    main()
