#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const JSON_DIR = path.join(ROOT, 'json');
const files = fs.readdirSync(JSON_DIR)
  .filter((file) => file.endsWith('.json') && file !== 'index.json' && file !== 'changelog.json')
  .sort();

const TECHNICAL_TEXT = /\(\s*ambito\b|\bvariante\s+\d+\b|\b(TODO|FIXME|placeholder|undefined|null|NaN|lorem ipsum)\b|\$\{[^}]+\}|\{[^}]+\}|\b(di la|di il|di lo|a il|a la)\b|depenendo/i;
const PROBLEMI_BAD_PATTERNS = [
  // "lamponi" e' maschile: stava per errore fra i nomi femminili e faceva
  // fallire l'audit sulla forma corretta "Quanti lamponi" (lotto 78).
  /\bQuanti\s+(api|arance|banane|capre|caramelle|carote|ciliegie|ciliegine|coccinelle|farfalle|figurine|fragole|galline|gomme|lumache|matite|mele|merendine|nocciole|palline|pesche|squadre|uva)\b/i,
  /\bQuante\s+(\w+)\s+sono rimasti\?/i,
  /\bQuante\s+(figurine|matite|gomme|squadre)\s+restano inutilizzati\?/i,
  /\b(caramelle|figurine)\b[^.?!]*\bdistribuirli\b/i,
  /\bcaramelle\b[^.?!]*\bse li divide\b/i,
  /\b(caramelle|figurine) vengono divisi\b/i,
  /\bQuante figurine in ogni\b/i,
  /\bQuanti (biscotti|pennarelli) in ogni\b/i,
  /\bquanti più figurine\b/i,
  /\bfigurine possibile a \d+ euro l'uno\b/i,
  /\bricevesse 1\b/i,
  /\b1 (biscott|grissin|cioccolatin|fragole|ciliegine|caramelle)\b/i,
  /\bquanti (fragole|ciliegine|caramelle)\b/i
];
const SCIENZE_BAD_PATTERNS = [
  /A cosa servono soprattutto le (fusto|fiore|seme)\?/i,
  /serve soprattutto a assorbire\b/i
];

const issues = [];

// F6 — figure nelle domande (docs/figure-nel-quiz.md). Il dataset porta solo un
// id; qui si controlla che il file esista e che l'SVG resti un disegno statico
// nel formato unico 320x240. Niente <style> o style="": Cloudflare manda la CSP
// anche sulla risposta .svg e li bloccherebbe (in locale non si vedrebbe).
const FIGURE_DIR = path.join(ROOT, 'assets', 'figure');
const FIGURE_ID_RE = /^[a-z0-9-]{1,60}$/;
const FIGURE_MAX_BYTES = 6144;
const FIGURE_ROOT_RE = /^<svg\b[^>]*\bviewBox="0 0 320 240"[^>]*>/;
const FIGURE_SIZE_RE = /^<svg\b(?=[^>]*\bwidth="320")(?=[^>]*\bheight="240")[^>]*>/;
const FIGURE_FORBIDDEN_RE = /<style|\sstyle\s*=|<script|<foreignObject|<image\b|href\s*=|\son[a-z]+\s*=|url\(/i;
const figureFileIssues = new Map();

function figureFileProblem(id) {
  if (figureFileIssues.has(id)) return figureFileIssues.get(id);
  const file = path.join(FIGURE_DIR, `${id}.svg`);
  let problem = '';
  if (!fs.existsSync(file)) {
    problem = `manca assets/figure/${id}.svg`;
  } else {
    const svg = fs.readFileSync(file, 'utf8').trim();
    if (Buffer.byteLength(svg) > FIGURE_MAX_BYTES) problem = `${id}.svg supera ${FIGURE_MAX_BYTES} byte`;
    else if (!FIGURE_ROOT_RE.test(svg) || !FIGURE_SIZE_RE.test(svg)) problem = `${id}.svg: la radice deve essere <svg viewBox="0 0 320 240" width="320" height="240">`;
    else if (FIGURE_FORBIDDEN_RE.test(svg)) problem = `${id}.svg contiene style/script/link/immagini esterne: solo attributi di presentazione`;
  }
  figureFileIssues.set(id, problem);
  return problem;
}

function checkFigure(file, q) {
  if (q.figure === undefined && q.figureAlt === undefined) return;
  if (typeof q.figure !== 'string' || !FIGURE_ID_RE.test(q.figure)) {
    add(file, q, 'bad_figure_id', String(q.figure));
    return;
  }
  const problem = figureFileProblem(q.figure);
  if (problem) add(file, q, 'bad_figure_file', problem);
  const alt = typeof q.figureAlt === 'string' ? q.figureAlt.trim() : '';
  if (alt.length < 20 || alt.length > 300 || !alt.endsWith('.')) {
    add(file, q, 'bad_figureAlt', 'obbligatorio con figure: 20-300 caratteri, chiuso dal punto');
  }
  if (q.bonus === true) add(file, q, 'figure_on_bonus', 'le domande bonus non mostrano figure');
}

function add(file, q, type, detail) {
  issues.push({ file, id: q && q.id, type, detail, question: q && q.question });
}

// Normalized question text for semantic-duplicate detection.
function normText(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\wàèéìòù ]/g, '')
    .trim();
}

for (const file of files) {
  const fullPath = path.join(JSON_DIR, file);
  let data;
  try {
    data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  } catch (error) {
    issues.push({ file, type: 'invalid_json', detail: error.message });
    continue;
  }

  const questions = data.questions;
  if (!Array.isArray(questions)) {
    issues.push({ file, type: 'missing_questions_array' });
    continue;
  }
  if (data.totalQuestions !== questions.length) {
    issues.push({ file, type: 'totalQuestions_mismatch', detail: `${data.totalQuestions} != ${questions.length}` });
  }

  const ids = new Set();
  // Bucket by normalized question text to flag true redundant duplicates.
  const byText = new Map();
  for (const q of questions) {
    if (!q || typeof q !== 'object') {
      issues.push({ file, type: 'invalid_question_object' });
      continue;
    }
    if (!q.id || typeof q.id !== 'string') add(file, q, 'missing_id');
    else if (ids.has(q.id)) add(file, q, 'duplicate_id');
    else ids.add(q.id);

    if (typeof q.question !== 'string' || !q.question.trim()) add(file, q, 'empty_question');
    if (typeof q.answer !== 'string' || !q.answer.trim()) add(file, q, 'empty_answer');

    // D2 schema guardrails: content fields must be populated and well-formed.
    if (typeof q.subarea !== 'string' || !q.subarea.trim()) add(file, q, 'empty_subarea');
    if (![1, 2, 3].includes(q.difficulty)) add(file, q, 'bad_difficulty', String(q.difficulty));
    // Classe: intero 2-5; la 1ª esiste solo in matematica (il motore la tiene
    // separata dalle altre classi, vedi fitsClassOneRule in subject-quiz-core.js).
    const minClass = file === 'matematica.json' ? 1 : 2;
    if (!Number.isInteger(q.class) || q.class < minClass || q.class > 5) add(file, q, 'bad_class', String(q.class));
    if (typeof q.explanation !== 'string' || !q.explanation.trim()) add(file, q, 'empty_explanation');
    checkFigure(file, q);

    const textKey = normText(q.question);
    if (textKey) {
      // Le domande disattivate non arrivano a nessuno, quindi non possono essere
      // un doppione per il bambino: restano fuori dal confronto. Il linter
      // continua invece a controllarle, perche' una domani potrebbe tornare
      // attiva e deve essere gia' a posto.
      if (q.active !== false) {
        if (!byText.has(textKey)) byText.set(textKey, []);
        byText.get(textKey).push(q);
      }
    }

    const options = Array.isArray(q.options) ? q.options.map(String) : [];
    if (options.length !== 4) add(file, q, 'options_count', String(options.length));
    const normalized = options.map((option) => option.trim().toLocaleLowerCase('it-IT'));
    if (new Set(normalized).size !== normalized.length) add(file, q, 'duplicate_options', JSON.stringify(options));
    if (!Number.isInteger(q.answerIndex) || q.answerIndex < 0 || q.answerIndex >= options.length) {
      add(file, q, 'bad_answerIndex', String(q.answerIndex));
    } else if (String(options[q.answerIndex]) !== String(q.answer)) {
      add(file, q, 'answer_mismatch', `${q.answer} != ${options[q.answerIndex]}`);
    }
    if (!normalized.includes(String(q.answer || '').trim().toLocaleLowerCase('it-IT'))) {
      add(file, q, 'answer_not_in_options', JSON.stringify(options));
    }

    for (const field of ['question', 'answer', 'explanation']) {
      const value = String(q[field] || '');
      if (TECHNICAL_TEXT.test(value)) add(file, q, `technical_text_${field}`, value);
    }

    if (file === 'problemi.json') {
      for (const field of ['question', 'explanation', 'bonusRaw']) {
        const value = String(q[field] || '');
        if (PROBLEMI_BAD_PATTERNS.some((pattern) => pattern.test(value))) {
          add(file, q, `problemi_gender_or_template_text_${field}`, value);
        }
      }
    }
    if (file === 'scienze.json' && SCIENZE_BAD_PATTERNS.some((pattern) => pattern.test(String(q.question || '')))) {
      add(file, q, 'scienze_generated_grammar', q.question);
    }
  }

  // True redundant duplicates: same normalized question AND same answer AND same option set.
  // (Same question text with different answer/options is a legitimate variant and is allowed.)
  for (const group of byText.values()) {
    if (group.length < 2) continue;
    const answers = new Set(group.map((q) => normText(q.answer)));
    const optSets = new Set(
      group.map((q) => JSON.stringify((Array.isArray(q.options) ? q.options : []).map(normText).sort()))
    );
    if (answers.size === 1 && optSets.size === 1) {
      for (const q of group.slice(1)) add(file, q, 'redundant_duplicate', `dup of ${group[0].id}`);
    }
  }
}

if (issues.length) {
  console.error(`Question JSON audit failed: ${issues.length} issue(s).`);
  for (const issue of issues.slice(0, 120)) {
    console.error(`${issue.file}${issue.id ? `:${issue.id}` : ''} [${issue.type}] ${issue.detail || ''}`);
    if (issue.question) console.error(`  ${issue.question}`);
  }
  if (issues.length > 120) console.error(`...and ${issues.length - 120} more.`);
  process.exit(1);
}

process.stdout.write(`Question JSON audit passed for ${files.length} subject files.\n`);
