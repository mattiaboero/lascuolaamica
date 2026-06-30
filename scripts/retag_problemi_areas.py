#!/usr/bin/env python3
import json
import re
from pathlib import Path

JSON_DIR = Path(__file__).parent.parent / 'json'

def infer_subarea(question_text):
    """Infer subarea from question text using keyword heuristics."""
    text_lower = question_text.lower()

    # Frazioni: "metà", "terzo", "quarto", "frazione", "diviso"
    if any(word in text_lower for word in ['metà', 'terzo', 'quarto', 'quinta', 'frazione', 'parte di']):
        return 'frazioni'

    # Euro/denaro: "€", "euro", "soldi", "costo", "prezzo", "spende"
    if any(word in text_lower for word in ['€', 'euro', 'soldi', 'costo', 'prezzo', 'spende', 'compra', 'acquista', 'resto']):
        return 'euro_denaro'

    # Misure: "cm", "m", "kg", "l", "litro", "grammo", "metro", "lungo", "peso", "distanza"
    if any(word in text_lower for word in ['cm', ' m ', 'kg', 'l', 'litro', 'grammo', 'metro', 'chilometro', 'lungo', 'peso', 'distanza', 'altezza', 'larghezza', 'temperatura', 'gradi']):
        return 'misure'

    # Tempo: "ore", "minuti", "giorni", "settimane", "mesi", "anni", "quanto tempo", "che ora"
    if any(word in text_lower for word in ['ore', 'minuti', 'giorni', 'settimane', 'mesi', 'anni', 'mattina', 'pomeriggio', 'sera', 'notte', 'che ora', 'quanto tempo']):
        return 'tempo'

    # Moltiplicazione: "×", "*", "volte", "doppio", "triplo", "riga", "file"
    if any(word in text_lower for word in ['×', 'volte', 'doppio', 'triplo', 'moltiplicato', 'per']):
        return 'moltiplicazione'

    # Divisione: "diviso", "÷", "/", "distribuisci", "divide", "parte"
    if any(word in text_lower for word in ['diviso', '÷', 'distribuisci', 'divide']) or re.search(r'\d+\s*÷\s*\d+', text_lower):
        return 'divisione'

    # Sottrazione: "meno", "-", "rimane", "resta", "toglie", "sparisce", "perde"
    if any(word in text_lower for word in ['meno', 'rimane', 'resta', 'toglie', 'sparisce', 'perde', 'via', 'se ne vanno', 'scappa']):
        return 'sottrazione'

    # Addizione: "più", "+", "insieme", "in più", "aggiunge", "arrivano", "nascono"
    if any(word in text_lower for word in ['più', 'insieme', 'aggiunge', 'arrivano', 'nascono', 'compra altri', 'ha ancora', 'riceve']):
        return 'addizione'

    # Default: two_operations or ambiguous
    return 'due_operazioni'

def process_problemi():
    """Re-tag problemi.json with subarea."""
    json_file = JSON_DIR / 'problemi.json'

    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    questions = []
    for v in data.values():
        if isinstance(v, list):
            questions = v
            break

    if not questions:
        print("No questions found in problemi.json")
        return

    print(f"Processing {len(questions)} problems...\n")

    subarea_counts = {}
    changed = 0

    for q in questions:
        old_subarea = q.get('subarea', '')
        question_text = q.get('question', '')

        new_subarea = infer_subarea(question_text)

        if new_subarea != old_subarea:
            q['subarea'] = new_subarea
            changed += 1
        else:
            q['subarea'] = new_subarea

        if new_subarea not in subarea_counts:
            subarea_counts[new_subarea] = {}

        class_num = q.get('class')
        if class_num not in subarea_counts[new_subarea]:
            subarea_counts[new_subarea][class_num] = 0
        subarea_counts[new_subarea][class_num] += 1

    # Write back
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=1, ensure_ascii=False)

    print("=== Final distribution (subarea × class) ===\n")
    print(f"{'Subarea':<20} {'c2':>6} {'c3':>6} {'c4':>6} {'c5':>6} {'Total':>6}")
    print("=" * 60)

    grand_total = 0
    for subarea in sorted(subarea_counts.keys()):
        counts = subarea_counts[subarea]
        total = sum(counts.values())
        grand_total += total
        print(f"{subarea:<20} {counts.get(2,0):>6} {counts.get(3,0):>6} {counts.get(4,0):>6} {counts.get(5,0):>6} {total:>6}")

    print("=" * 60)
    print(f"{'TOTAL':<20} {' ':>6} {' ':>6} {' ':>6} {' ':>6} {grand_total:>6}\n")

def update_index_json():
    """Update json/index.json with new problemi areas."""
    index_file = JSON_DIR / 'index.json'

    with open(index_file, 'r', encoding='utf-8') as f:
        index = json.load(f)

    # Regenerate problemi stats
    problemi_file = JSON_DIR / 'problemi.json'
    with open(problemi_file, 'r', encoding='utf-8') as f:
        problemi_data = json.load(f)

    questions = []
    for v in problemi_data.values():
        if isinstance(v, list):
            questions = v
            break

    areas = {}
    classes = {}

    for q in questions:
        if not q.get('active', True):
            continue

        subarea = q.get('subarea', 'problemi')
        class_num = q.get('class')

        if subarea not in areas:
            areas[subarea] = 0
        areas[subarea] += 1

        if class_num not in classes:
            classes[class_num] = 0
        classes[class_num] += 1

    # Update index
    if 'subjects' in index and 'problemi' in index['subjects']:
        if 'stats' not in index['subjects']['problemi']:
            index['subjects']['problemi']['stats'] = {}

        index['subjects']['problemi']['stats']['areas'] = areas
        index['subjects']['problemi']['stats']['classes'] = classes

    with open(index_file, 'w', encoding='utf-8') as f:
        json.dump(index, f, indent=1, ensure_ascii=False)

    print("Updated json/index.json with new problemi areas.\n")

if __name__ == '__main__':
    print("\n=== Re-tagging problemi.json with subareas ===\n")
    process_problemi()
    update_index_json()
