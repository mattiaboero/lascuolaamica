#!/usr/bin/env python3
"""
T2.X — Merge JSONL generated/patch files into subject JSONs.

Usage:
  python3 scripts/ingest_generated.py --subject italiano
  python3 scripts/ingest_generated.py --subject inglese
  python3 scripts/ingest_generated.py --subject matematica --mode explanations
  python3 scripts/ingest_generated.py --all

Modes:
  new          (default) — ingest new questions from reports/generated/<subject>-c*.jsonl
  explanations           — apply explanation patches from reports/generated/mat-c*-explanations.jsonl
"""

import argparse
import json
import pathlib
import sys
import re
from collections import defaultdict

ROOT = pathlib.Path(__file__).parent.parent
JSON_DIR = ROOT / 'json'
GENERATED_DIR = ROOT / 'reports' / 'generated'

SUBJECT_FIELDS = {
    'italiano':   {'subject': 'italiano',           'sourceSubject': 'italiano',           'program_tpl': 'italiano_primaria_classe_{cls}'},
    'inglese':    {'subject': 'inglese',             'sourceSubject': 'inglese',             'program_tpl': 'inglese_primaria_classe_{cls}'},
    'scienze':    {'subject': 'scienze',             'sourceSubject': 'scienze',             'program_tpl': 'scienze_primaria_classe_{cls}'},
    'storia':     {'subject': 'storia',              'sourceSubject': 'storia',              'program_tpl': 'storia_primaria_classe_{cls}'},
    'geografia':  {'subject': 'geografia',           'sourceSubject': 'geografia',           'program_tpl': 'geografia_primaria_classe_{cls}'},
    'civica':     {'subject': 'civica',              'sourceSubject': 'educazione civica',   'program_tpl': 'civica_primaria_classe_{cls}'},
    'problemi':   {'subject': 'problemi',            'sourceSubject': 'Matematica',          'program_tpl': 'Matematica Classe {cls} - MIUR'},
    'matematica': {'subject': 'matematica',          'sourceSubject': 'matematica',          'program_tpl': 'matematica_primaria_classe_{cls}'},
}

PREFIX_MAP = {
    'italiano': 'ita', 'inglese': 'eng', 'scienze': 'sci',
    'storia': 'sto', 'geografia': 'geo', 'civica': 'civ',
    'problemi': 'pro', 'matematica': 'mat',
}

def get_questions(data):
    for v in data.values():
        if isinstance(v, list):
            return v
    return []

def next_id(existing_ids, prefix, cls, area):
    """Generate next sequential ID for prefix-class-area."""
    pattern = re.compile(rf'^{re.escape(prefix)}-{cls}-.*-(\d+)$')
    max_n = 0
    for eid in existing_ids:
        m = pattern.match(eid)
        if m:
            max_n = max(max_n, int(m.group(1)))
    return f"{prefix}-{cls}-{area}-{str(max_n + 1).zfill(3)}"

def normalize_area_for_id(area):
    """Slug-ify area string for use in ID."""
    return re.sub(r'[^a-z0-9]+', '_', (area or 'misc').lower()).strip('_')[:20]

def build_tags(subject, area, cls):
    base = [subject, area, f'classe_{cls}', 'primaria']
    return {'tag': ';'.join(base), 'tags': base}

def question_signature(text):
    """Testo della domanda normalizzato, per riconoscere un re-ingest."""
    return re.sub(r'\s+', ' ', str(text or '')).strip().lower()


def ingest_new(subject, dry_run=False):
    """Ingest new questions from JSONL shards into subject JSON."""
    json_file = JSON_DIR / f'{subject}.json'
    if not json_file.exists():
        print(f'ERROR: {json_file} not found'); sys.exit(1)

    with open(json_file, encoding='utf-8') as f:
        data = json.load(f)

    questions = get_questions(data)
    existing_ids = {q.get('id', '') for q in questions}
    # Ogni riga riceve un id nuovo da next_id(), quindi l'id non protegge da
    # niente: rilanciare lo script sullo stesso shard duplicava le domande in
    # silenzio. La difesa e' sul testo della domanda, l'unica cosa che resta
    # uguale fra due ingest dello stesso contenuto.
    existing_texts = {question_signature(q.get('question')) for q in questions}
    meta = SUBJECT_FIELDS[subject]
    prefix = PREFIX_MAP[subject]

    # Collect all JSONL shards for this subject
    shards = sorted(GENERATED_DIR.glob(f'{subject}-c*.jsonl'))
    if not shards:
        print(f'No generated shards found for {subject} in {GENERATED_DIR}')
        return 0

    added = 0
    errors = 0
    duplicates = 0
    ingested_shards = []

    for shard in shards:
        print(f'  Processing {shard.name}...')
        with open(shard, encoding='utf-8') as f:
            for lineno, line in enumerate(f, 1):
                line = line.strip()
                if not line:
                    continue
                try:
                    q = json.loads(line)
                except json.JSONDecodeError as e:
                    print(f'    SKIP line {lineno}: invalid JSON — {e}')
                    errors += 1
                    continue

                # Validate required fields
                required = ['class', 'question', 'options', 'answer']
                missing = [k for k in required if not q.get(k)]
                if missing:
                    print(f'    SKIP line {lineno}: missing fields {missing}')
                    errors += 1
                    continue

                opts = q.get('options', [])
                if len(opts) != 4:
                    print(f'    SKIP line {lineno}: options must be 4, got {len(opts)}')
                    errors += 1
                    continue

                answer = str(q['answer']).strip()
                if answer not in [str(o).strip() for o in opts]:
                    print(f'    SKIP line {lineno}: answer not in options — "{answer}"')
                    errors += 1
                    continue

                signature = question_signature(q['question'])
                if signature in existing_texts:
                    duplicates += 1
                    continue
                existing_texts.add(signature)

                cls = int(q['class'])
                area = str(q.get('area') or f"{subject}_classe{cls}")
                subarea = str(q.get('subarea') or area)
                area_slug = normalize_area_for_id(subarea)

                new_id = next_id(existing_ids, prefix, cls, area_slug)
                existing_ids.add(new_id)

                difficulty = q.get('difficulty')
                if difficulty not in (1, 2, 3):
                    # Infer from class
                    difficulty = 1 if cls <= 3 else 2

                tags = build_tags(subject, area_slug, cls)

                row = {
                    'id': new_id,
                    'subject': meta['subject'],
                    'sourceSubject': meta['sourceSubject'],
                    'class': cls,
                    'area': area,
                    'subarea': subarea,
                    'difficulty': difficulty,
                    'question': str(q['question']).strip(),
                    'options': [str(o).strip() for o in opts],
                    'answerIndex': [str(o).strip() for o in opts].index(answer),
                    'answer': answer,
                    'explanation': str(q.get('explanation') or '').strip(),
                    'active': True,
                    'tag': tags['tag'],
                    'tags': tags['tags'],
                    'language': str(q.get('language') or 'it'),
                    'program': meta['program_tpl'].format(cls=cls),
                    'teacherNote': '',
                    'bonus': False,
                    'bonusRaw': '',
                }

                # Inglese-specific
                if q.get('answerLang'):
                    row['answerLang'] = str(q['answerLang'])

                if not dry_run:
                    questions.append(row)
                added += 1
        ingested_shards.append(shard)

    if not dry_run:
        # Update totalQuestions
        for key in data:
            if isinstance(data[key], int) and key == 'totalQuestions':
                data[key] = len(questions)
            elif key == 'stats' and isinstance(data[key], dict):
                data[key]['rows'] = len(questions)

        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=1, ensure_ascii=False)

    if not dry_run and ingested_shards:
        archive_dir = GENERATED_DIR / 'ingested'
        archive_dir.mkdir(exist_ok=True)
        for shard in ingested_shards:
            shard.rename(archive_dir / shard.name)
        print(f'  archiviati {len(ingested_shards)} shard in {archive_dir.relative_to(ROOT)}/')

    print(f'  {subject}: +{added} questions added, {errors} skipped, {duplicates} duplicati gia presenti')
    return added

def apply_explanations(dry_run=False):
    """Apply math explanation patches to matematica.json."""
    json_file = JSON_DIR / 'matematica.json'
    with open(json_file, encoding='utf-8') as f:
        data = json.load(f)

    questions = get_questions(data)
    id_index = {q['id']: i for i, q in enumerate(questions) if 'id' in q}

    patches = sorted(GENERATED_DIR.glob('mat-c*-explanations.jsonl'))
    if not patches:
        print(f'No explanation patches found in {GENERATED_DIR}')
        return 0

    applied = 0
    not_found = 0
    errors = 0

    for patch_file in patches:
        print(f'  Applying {patch_file.name}...')
        with open(patch_file, encoding='utf-8') as f:
            for lineno, line in enumerate(f, 1):
                line = line.strip()
                if not line:
                    continue
                try:
                    patch = json.loads(line)
                except json.JSONDecodeError as e:
                    print(f'    SKIP line {lineno}: invalid JSON — {e}')
                    errors += 1
                    continue

                qid = patch.get('id', '').strip()
                explanation = str(patch.get('explanation') or '').strip()

                if not qid or not explanation:
                    errors += 1
                    continue

                if qid in id_index:
                    if not dry_run:
                        questions[id_index[qid]]['explanation'] = explanation
                    applied += 1
                else:
                    not_found += 1

    if not dry_run:
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=1, ensure_ascii=False)

    print(f'  matematica explanations: {applied} applied, {not_found} id not found, {errors} errors')
    return applied

def update_index(subjects):
    """Update json/index.json counts after ingest."""
    index_file = JSON_DIR / 'index.json'
    with open(index_file, encoding='utf-8') as f:
        index = json.load(f)

    grand_total = 0
    for subj in ['matematica','problemi','italiano','inglese','civica','geografia','storia','scienze']:
        json_file = JSON_DIR / f'{subj}.json'
        with open(json_file, encoding='utf-8') as f:
            d = json.load(f)
        qs = get_questions(d)
        n = len(qs)
        grand_total += n
        if 'subjects' in index and subj in index['subjects']:
            index['subjects'][subj]['rows'] = n
            if 'stats' in index['subjects'][subj]:
                index['subjects'][subj]['stats']['rows'] = n

    index['totalQuestions'] = grand_total

    with open(index_file, 'w', encoding='utf-8') as f:
        json.dump(index, f, indent=1, ensure_ascii=False)

    print(f'\nindex.json updated. Grand total: {grand_total}')
    return grand_total

def main():
    parser = argparse.ArgumentParser(description='Ingest generated JSONL into subject JSONs')
    parser.add_argument('--subject', help='Subject to ingest (e.g. italiano, inglese, matematica)')
    parser.add_argument('--mode', choices=['new', 'explanations'], default='new')
    parser.add_argument('--all', action='store_true', help='Ingest all subjects')
    parser.add_argument('--dry-run', action='store_true', help='Validate only, no writes')
    args = parser.parse_args()

    if args.dry_run:
        print('DRY RUN — no files will be modified\n')

    total_added = 0

    if args.mode == 'explanations' or (args.subject == 'matematica' and args.mode == 'explanations'):
        total_added += apply_explanations(dry_run=args.dry_run)
    elif args.all:
        for subj in SUBJECT_FIELDS:
            if (GENERATED_DIR / f'{subj}-c2.jsonl').exists():
                total_added += ingest_new(subj, dry_run=args.dry_run)
        total_added += apply_explanations(dry_run=args.dry_run)
    elif args.subject:
        if args.subject == 'matematica' and args.mode == 'explanations':
            total_added += apply_explanations(dry_run=args.dry_run)
        else:
            total_added += ingest_new(args.subject, dry_run=args.dry_run)
    else:
        parser.print_help()
        sys.exit(0)

    if not args.dry_run:
        update_index(SUBJECT_FIELDS.keys())

    print(f'\nTotal rows added/patched: {total_added}')

if __name__ == '__main__':
    main()
