#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const SUBJECTS = ['matematica', 'problemi', 'italiano', 'inglese', 'civica', 'geografia', 'storia', 'scienze'];
const JSON_DIR = path.join(__dirname, '..', 'json');
const THRESHOLD = 15; // Minimum per subarea-class combination

function getQuestionsFromData(data) {
  for (const v of Object.values(data)) {
    if (Array.isArray(v)) {
      return v;
    }
  }
  return [];
}

function generateCoverageReport() {
  const report = [];
  report.push('# Rapporto copertura curricolare\n');
  report.push(`Data generazione: ${new Date().toLocaleString('it-IT')}\n`);
  report.push(`Soglia minima: ${THRESHOLD} domande per (subarea × classe)\n`);
  report.push('---\n\n');

  const underThreshold = [];

  SUBJECTS.forEach(subject => {
    const jsonFile = path.join(JSON_DIR, `${subject}.json`);

    if (!fs.existsSync(jsonFile)) {
      return;
    }

    const data = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));
    const questions = getQuestionsFromData(data);

    if (!questions.length) {
      return;
    }

    // Build matrix
    const matrix = {};
    questions.forEach(q => {
      const subarea = q.subarea || q.area || 'default';
      const classNum = q.class;
      const key = `${subarea}|${classNum}`;

      if (!matrix[key]) {
        matrix[key] = 0;
      }
      matrix[key]++;
    });

    // Organize by subarea
    const subareas = new Set();
    Object.keys(matrix).forEach(k => {
      subareas.add(k.split('|')[0]);
    });

    report.push(`## ${subject.toUpperCase()}\n`);
    report.push(`${'Subarea'.padEnd(25)} | ${'c2'.padEnd(6)} | ${'c3'.padEnd(6)} | ${'c4'.padEnd(6)} | ${'c5'.padEnd(6)} | Total\n`);
    report.push('|' + '-'.repeat(23) + '|' + '-'.repeat(7) + '|' + '-'.repeat(7) + '|' + '-'.repeat(7) + '|' + '-'.repeat(7) + '|' + '-'.repeat(8) + '|\n');

    let subjectTotal = 0;
    Array.from(subareas).sort().forEach(subarea => {
      const row = [subarea.padEnd(23)];
      let rowTotal = 0;

      for (const classNum of [2, 3, 4, 5]) {
        const key = `${subarea}|${classNum}`;
        const count = matrix[key] || 0;
        rowTotal += count;

        // Mark with ⚠️  if under threshold
        const marker = count > 0 && count < THRESHOLD ? ' ⚠️ ' : '   ';
        row.push(` ${String(count).padEnd(2)}${marker} `);

        if (count > 0 && count < THRESHOLD) {
          underThreshold.push({
            subject,
            subarea,
            classNum,
            count,
          });
        }
      }

      subjectTotal += rowTotal;
      row.push(` ${String(rowTotal).padEnd(5)}`);
      report.push('| ' + row.join('|') + '\n');
    });

    report.push(`| ${'TOTAL'.padEnd(23)} | ${' '.padEnd(6)} | ${' '.padEnd(6)} | ${' '.padEnd(6)} | ${' '.padEnd(6)} | ${String(subjectTotal).padEnd(6)}\n`);
    report.push('\n');
  });

  // Summary of under-threshold
  if (underThreshold.length > 0) {
    report.push('## ⚠️  Celle sotto soglia (< ' + THRESHOLD + ' domande)\n\n');

    underThreshold.sort((a, b) => a.count - b.count);

    report.push(`${'Subject'.padEnd(15)} | ${'Subarea'.padEnd(25)} | ${'Classe'.padEnd(6)} | Domande\n`);
    report.push('-'.repeat(70) + '\n');

    underThreshold.forEach(cell => {
      report.push(`${cell.subject.padEnd(15)} | ${cell.subarea.padEnd(25)} | c${cell.classNum}    | ${cell.count}\n`);
    });

    report.push(`\nTotale celle sotto soglia: ${underThreshold.length}\n`);
  } else {
    report.push('## ✅ Nessuna cella sotto soglia\n');
  }

  const reportPath = path.join(__dirname, '..', 'reports', 'coverage.md');
  const reportDir = path.dirname(reportPath);

  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  fs.writeFileSync(reportPath, report.join(''));

  console.log('\n✅ Rapporto salvato in reports/coverage.md\n');
  console.log(`Celle sotto soglia: ${underThreshold.length}`);
}

generateCoverageReport();
