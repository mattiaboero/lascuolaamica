#!/usr/bin/env python3
import json
import sys
from pathlib import Path

SUBJECTS = ['matematica', 'problemi', 'italiano', 'inglese', 'civica', 'geografia', 'storia', 'scienze']
JSON_DIR = Path(__file__).parent.parent / 'json'

def normalize_difficulty(value, class_num):
    """Normalize difficulty to 1, 2, or 3."""
    if value in (1, 2, 3):
        return value
    if value == 4:
        return 3
    if value is None or value == '':
        # Infer from class
        if class_num in (2, 3):
            return 1
        elif class_num in (4, 5):
            return 2
        else:
            return 1
    return int(value) if isinstance(value, (int, float)) else 1

def get_questions_list(data):
    """Extract question list from data structure."""
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        if 'rows' in data and isinstance(data['rows'], list):
            return data['rows']
        if 'questions' in data and isinstance(data['questions'], list):
            return data['questions']
        # Try finding any list
        for v in data.values():
            if isinstance(v, list):
                return v
    return []

def count_by_difficulty(questions):
    """Count questions by difficulty level."""
    counts = {1: 0, 2: 0, 3: 0, None: 0, 'other': 0}
    for q in questions:
        d = q.get('difficulty')
        if d in counts:
            counts[d] += 1
        else:
            counts['other'] += 1
    return counts

def process_subject(subject):
    """Normalize difficulty for one subject."""
    json_file = JSON_DIR / f'{subject}.json'
    if not json_file.exists():
        print(f"  ⚠ {subject}: file not found")
        return None

    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    questions = get_questions_list(data)
    if not questions:
        print(f"  ⚠ {subject}: no questions list found")
        return None

    before = count_by_difficulty(questions)

    # Normalize each question
    changed = 0
    for q in questions:
        old_val = q.get('difficulty')
        class_num = q.get('class')
        new_val = normalize_difficulty(old_val, class_num)
        if new_val != old_val:
            q['difficulty'] = new_val
            changed += 1
        elif old_val is None or old_val == '':
            q['difficulty'] = new_val
            changed += 1

    after = count_by_difficulty(questions)

    # Write back
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=1, ensure_ascii=False)

    return {
        'subject': subject,
        'total': len(questions),
        'changed': changed,
        'before': before,
        'after': after
    }

def main():
    print("\n=== Normalizing difficulty field ===\n")

    results = []
    for subject in SUBJECTS:
        print(f"Processing {subject}...")
        result = process_subject(subject)
        if result:
            results.append(result)

    print("\n=== BEFORE/AFTER REPORT ===\n")
    print(f"{'Subject':<15} {'Total':<8} {'Changed':<8} {'Before (1/2/3/null/other)':<30} {'After (1/2/3/null/other)':<30}")
    print("=" * 100)

    for r in results:
        before_str = f"{r['before'].get(1,0)}/{r['before'].get(2,0)}/{r['before'].get(3,0)}/{r['before'].get(None,0)}/{r['before'].get('other',0)}"
        after_str = f"{r['after'].get(1,0)}/{r['after'].get(2,0)}/{r['after'].get(3,0)}/{r['after'].get(None,0)}/{r['after'].get('other',0)}"
        print(f"{r['subject']:<15} {r['total']:<8} {r['changed']:<8} {before_str:<30} {after_str:<30}")

    total_changed = sum(r['changed'] for r in results)
    total_questions = sum(r['total'] for r in results)
    print("=" * 100)
    print(f"{'TOTAL':<15} {total_questions:<8} {total_changed:<8}\n")

    return results

if __name__ == '__main__':
    main()
