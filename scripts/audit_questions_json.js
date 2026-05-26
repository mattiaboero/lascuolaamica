#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const JSON_DIR = path.join(ROOT, 'json');
const files = fs.readdirSync(JSON_DIR)
  .filter((file) => file.endsWith('.json') && file !== 'index.json')
  .sort();

const TECHNICAL_TEXT = /\(\s*ambito\b|\bvariante\s+\d+\b|\b(TODO|FIXME|placeholder|undefined|null|NaN|lorem ipsum)\b|\$\{[^}]+\}|\{[^}]+\}|\b(di la|di il|di lo|a il|a la)\b|depenendo/i;
const PROBLEMI_BAD_PATTERNS = [
  /\bQuanti\s+(api|arance|banane|capre|caramelle|carote|ciliegie|ciliegine|coccinelle|farfalle|figurine|fragole|galline|gomme|lamponi|lumache|matite|mele|merendine|nocciole|palline|pesche|squadre|uva)\b/i,
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

function add(file, q, type, detail) {
  issues.push({ file, id: q && q.id, type, detail, question: q && q.question });
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
