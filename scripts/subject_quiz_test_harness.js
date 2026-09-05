#!/usr/bin/env node
'use strict';

const { createRequire } = require('module');

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  let playwright;
  try {
    const requireFromCwd = createRequire(`${process.cwd()}/`);
    playwright = requireFromCwd('playwright');
  } catch (error) {
    console.error('Playwright non disponibile. Esegui lo script con NODE_PATH che punti a un node_modules contenente "playwright".');
    console.error(String(error));
    process.exit(1);
  }

  const { chromium } = playwright;
  const browser = await chromium.launch({ headless: options.headless });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    const trackers = { pageErrors: [], consoleErrors: [] };

    page.on('pageerror', (error) => trackers.pageErrors.push(String(error)));
    page.on('console', (msg) => {
      if (msg.type() === 'error') trackers.consoleErrors.push(msg.text());
    });

    await page.addInitScript(({ playWindowKey, playWindowValue }) => {
      window.SA = window.SA || {};
      window.SA.memoryStorage = window.SA.memoryStorage || Object.create(null);
      window.SA.memoryStorage[playWindowKey] = playWindowValue;
      try {
        window.localStorage.setItem(playWindowKey, playWindowValue);
      } catch (_) {}
    }, {
      playWindowKey: 'scuolaAmica_play_window_v1',
      playWindowValue: buildPlayWindowValue()
    });

    await page.goto(buildPageUrl(options.baseUrl, options.page), { waitUntil: 'networkidle' });
    await waitForCfg(page);
    const maps = await getConfigMaps(page);

    if (options.classKey) {
      const classButton = page.locator(`[data-action="select-class"][data-class="${options.classKey}"]`).first();
      if (await classButton.count()) {
        await classButton.click();
      }
    }

    if (options.area) {
      const areaButton = page.locator(`[data-action="select-area"][data-area="${options.area}"]`).first();
      if (await areaButton.count()) {
        await areaButton.click();
      }
    }

    await page.locator('[data-action="start-game"]').click();
    try {
      await page.waitForSelector('#screenLevels.active', { timeout: 3000 });
      let levelKey = options.level;
      if (!levelKey) {
        levelKey = await page.locator('#screenLevels [data-action="start-level"]:not([disabled])').first().getAttribute('data-level') || '';
      }
      if (!levelKey) {
        throw new Error('No available level found for current class');
      }
      await page.locator(`#screenLevels [data-action="start-level"][data-level="${levelKey}"]`).click();
    } catch (_) {
      // Non-level subject or levels screen skipped by current flow.
    }
    await page.waitForSelector('#screenGame.active', { timeout: 15000 });

    if (options.interrupt) {
      const interrupted = await checkPendingTimerCleared(page);
      process.stdout.write(`${JSON.stringify({
        page: options.page,
        check: 'interrupt',
        interrupted,
        pageErrors: trackers.pageErrors,
        consoleErrors: trackers.consoleErrors
      }, null, 2)}\n`);
      await context.close();
      return;
    }

    const questions = [];
    for (let index = 0; index < 10; index++) {
      const questionText = normalize(await page.locator('#qText').textContent());
      const promptMeta = await readPromptMeta(page, '#qText');
      const domOptions = await readDomOptions(page, '#answers');
      const domOptionMeta = await readDomOptionMeta(page, '#answers');
      const meta = resolveQuestionMeta(maps.questions[questionText], domOptions);
      if (!meta) {
        throw new Error(`Question not found in config map: ${questionText}`);
      }

      const answerPlan = await clickPlannedAnswer(page, '#answers', meta, options.mode, domOptions);
      questions.push({
        question: questionText,
        promptHtml: promptMeta.html,
        promptLang: promptMeta.lang,
        expected: meta.correct,
        chosen: answerPlan.chosen,
        correct: answerPlan.correct,
        area: meta.area,
        grade: meta.grade,
        subarea: meta.subarea,
        answerLang: meta.answerLang,
        optionLangs: domOptionMeta.map((item) => item.lang || '')
      });
    }

    await page.waitForSelector('#screenBonusPick.active');
    let bonus = { mode: options.bonus, attempted: false };
    if (options.bonus === 'skip') {
      await page.locator('[data-action="skip-bonus"]').click();
    } else {
      await page.locator(`[data-action="bonus-pick"][data-bonus="${options.bonus}"]`).click();
      await page.waitForSelector('#screenBonusQuestion.active');
      const bonusText = normalize(await page.locator('#bonusText').textContent());
      const promptMeta = await readPromptMeta(page, '#bonusText');
      const domOptions = await readDomOptions(page, '#bonusAnswers');
      const domOptionMeta = await readDomOptionMeta(page, '#bonusAnswers');
      const meta = resolveQuestionMeta(maps.bonus[bonusText], domOptions);
      if (!meta) {
        throw new Error(`Bonus question not found in config map: ${bonusText}`);
      }
      const answerPlan = await clickPlannedAnswer(page, '#bonusAnswers', meta, options.mode, domOptions);
      bonus = {
        mode: options.bonus,
        attempted: true,
        type: meta.type,
        question: bonusText,
        promptHtml: promptMeta.html,
        promptLang: promptMeta.lang,
        expected: meta.correct,
        chosen: answerPlan.chosen,
        correct: answerPlan.correct,
        optionLangs: domOptionMeta.map((item) => item.lang || '')
      };
    }

    await page.waitForSelector('#screenResult.active');
    const result = await page.evaluate(() => {
      const normalizeValue = (value) => String(value || '').replace(/\s+/g, ' ').trim();
      return {
        final: normalizeValue(document.getElementById('rFinal')?.textContent),
        correct: normalizeValue(document.getElementById('rCorrect')?.textContent),
        wrong: normalizeValue(document.getElementById('rWrong')?.textContent),
        area: normalizeValue(document.getElementById('rArea')?.textContent)
      };
    });

    let ripassa = null;
    if (options.ripassa) {
      ripassa = await playRipassaSession(page);
    }

    const payload = {
      page: options.page,
      mode: options.mode,
      bonusMode: options.bonus,
      classKey: options.classKey,
      areaKey: options.area,
      result,
      questions,
      bonus,
      ripassa,
      pageErrors: trackers.pageErrors,
      consoleErrors: trackers.consoleErrors
    };
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    await context.close();
  } finally {
    await browser.close();
  }
}

// Regressione A2: l'avanzamento differito di checkAnswer resta pendente per
// 2200 ms. Chi esce dal gioco in quella finestra (qui: apre la classifica; in
// produzione anche la scadenza della play window) veniva riportato dentro la
// partita dal timer, fino a giocare il bonus e salvare il punteggio a limite di
// tempo gia' scaduto.
async function checkPendingTimerCleared(page) {
  const totalQ = await page.evaluate(() => Number((window.SA && window.SA.subjectConfig || {}).totalQ) || 10);
  // il timer riporta dentro la partita solo all'ultima domanda, quando chiama
  // openBonusPick() (prima chiama loadQuestion(), che non cambia schermata)
  for (let i = 0; i < totalQ - 1; i++) {
    await page.locator('#answers .answer-btn:not([disabled])').first().click();
    await page.waitForTimeout(2500);
  }
  await page.locator('#answers .answer-btn:not([disabled])').first().click();
  await page.locator('[data-action="show-leaderboard"]').first().click();
  await page.waitForSelector('#screenLeaderboard.active', { timeout: 5000 });
  await page.waitForTimeout(3000);
  const active = await page.evaluate(() => document.querySelector('.screen.active')?.id || '');
  if (active !== 'screenLeaderboard') {
    throw new Error(`Timer di avanzamento non annullato: schermata attiva "${active}" 3 s dopo l'uscita dal gioco`);
  }
  return { active };
}

// Regressione A1: la sessione di ripasso e' piu' corta di TOTAL_Q, quindi la fine
// partita va riconosciuta su questions.length. Se torna la guardia sbagliata il
// gioco resta congelato sull'ultima domanda e questa attesa scade.
async function playRipassaSession(page) {
  // piu' schermate hanno un go-start: prendere quello della schermata risultato
  await page.locator('#screenResult [data-action="go-start"]').first().click();
  const ripassaBtn = page.locator('#ripassaBtn');
  await ripassaBtn.waitFor({ timeout: 5000 });
  const label = String(await ripassaBtn.textContent() || '');
  const count = Number((label.match(/\((\d+)\)/) || [])[1] || 0);
  if (!count) {
    throw new Error(`Bottone ripasso senza conteggio leggibile: "${label}"`);
  }
  await ripassaBtn.click();
  await page.waitForSelector('#screenGame.active', { timeout: 15000 });

  for (let i = 0; i < count; i++) {
    await page.locator('#answers .answer-btn:not([disabled])').first().click();
    // il core avanza con un setTimeout da 2200 ms
    await page.waitForTimeout(2500);
  }

  if (await page.locator('#screenBonusPick.active').count()) {
    await page.locator('[data-action="skip-bonus"]').click();
  }
  await page.waitForSelector('#screenResult.active', { timeout: 10000 });

  const scored = await page.evaluate(() => ({
    correct: String(document.getElementById('rCorrect')?.textContent || '').trim(),
    wrong: String(document.getElementById('rWrong')?.textContent || '').trim()
  }));
  const answered = Number(scored.correct) + Number(scored.wrong);
  if (answered !== count) {
    throw new Error(`Ripasso: attese ${count} domande, il risultato ne conta ${answered}`);
  }
  return { count, ...scored };
}

function parseArgs(argv) {
  const options = {
    baseUrl: 'http://127.0.0.1:4173',
    page: 'civica',
    mode: 'perfect',
    bonus: 'skip',
    classKey: '3',
    area: 'mixed',
    level: '',
    ripassa: false,
    interrupt: false,
    headless: true,
    help: false
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case '--base-url':
        options.baseUrl = String(argv[++i] || options.baseUrl);
        break;
      case '--page':
        options.page = String(argv[++i] || options.page);
        break;
      case '--mode':
        options.mode = String(argv[++i] || options.mode);
        break;
      case '--bonus':
        options.bonus = String(argv[++i] || options.bonus);
        break;
      case '--class':
        options.classKey = String(argv[++i] || options.classKey);
        break;
      case '--area':
        options.area = String(argv[++i] || options.area);
        break;
      case '--level':
        options.level = String(argv[++i] || options.level);
        break;
      case '--ripassa':
        options.ripassa = true;
        break;
      case '--interrupt':
        options.interrupt = true;
        break;
      case '--headed':
        options.headless = false;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      default:
        throw new Error(`Argomento non riconosciuto: ${arg}`);
    }
  }

  if (!['perfect', 'mixed', 'worst'].includes(options.mode)) {
    throw new Error(`mode non supportato: ${options.mode}`);
  }
  if (!['easy', 'medium', 'hard', 'skip'].includes(options.bonus)) {
    throw new Error(`bonus non supportato: ${options.bonus}`);
  }
  if (options.ripassa && options.interrupt) {
    throw new Error('--ripassa e --interrupt sono alternativi: --interrupt esce dalla partita prima del risultato');
  }
  if (options.ripassa && options.mode === 'perfect') {
    throw new Error('--ripassa richiede --mode mixed o worst: senza errori il bottone di ripasso non compare');
  }
  return options;
}

function printHelp() {
  process.stdout.write([
    'Uso:',
    '  NODE_PATH=/path/to/node_modules node scripts/subject_quiz_test_harness.js \\',
    '    --base-url http://127.0.0.1:4173 --page civica --mode mixed --bonus skip',
    '',
    'Opzioni:',
    '  --page <slug>        materia/page html senza estensione (default: civica)',
    '  --mode <mode>        perfect | mixed | worst',
    '  --bonus <mode>       easy | medium | hard | skip',
    '  --class <n>          classe iniziale (default: 3)',
    '  --area <key>         area iniziale (default: mixed)',
    '  --level <key>        livello da selezionare se la materia usa screenLevels',
    '  --ripassa            dopo il risultato gioca la sessione "Ripassa i tuoi errori" (richiede mode mixed/worst)',
    '  --interrupt          risponde a una domanda, esce subito dal gioco e verifica che il timer di avanzamento sia annullato',
    '  --base-url <url>     host locale del test server',
    '  --headed             avvia il browser non-headless',
    '  --help               mostra questo messaggio'
  ].join('\n') + '\n');
}

function buildPageUrl(baseUrl, page) {
  return `${String(baseUrl).replace(/\/+$/, '')}/${String(page).replace(/^\//, '')}.html`;
}

function buildPlayWindowValue() {
  const startedAt = Date.now();
  const expiresAt = startedAt + (30 * 60 * 1000);
  const cooldownUntil = expiresAt + (60 * 60 * 1000);
  return JSON.stringify({ startedAt, expiresAt, cooldownUntil });
}

async function waitForCfg(page) {
  await page.waitForFunction(() => {
    const cfg = window.SA && window.SA.subjectConfig;
    return !!(cfg && cfg.banks && Object.keys(cfg.banks).length);
  }, { timeout: 15000 });
}

async function getConfigMaps(page) {
  return page.evaluate(() => {
    const normalizeValue = (value) => String(value || '').replace(/\s+/g, ' ').trim();
    const cfg = window.SA && window.SA.subjectConfig;
    const questions = {};
    const bonus = {};

    Object.entries((cfg && cfg.banks) || {}).forEach(([area, rows]) => {
      (rows || []).forEach((row) => {
        const key = normalizeValue(row.q);
        const entry = {
          correct: normalizeValue(row.a),
          distractors: (row.d || []).map((item) => normalizeValue(item)).filter(Boolean),
          area,
          grade: row.grade ?? row.g ?? null,
          subarea: row.subarea || null,
          answerLang: row.answerLang || null
        };
        if (!questions[key]) questions[key] = [];
        questions[key].push(entry);
      });
    });

    Object.entries((cfg && cfg.bonusQuestions) || {}).forEach(([type, rows]) => {
      (rows || []).forEach((row) => {
        const key = normalizeValue(row.q);
        const entry = {
          correct: normalizeValue(row.a),
          distractors: (row.d || []).map((item) => normalizeValue(item)).filter(Boolean),
          type,
          answerLang: row.answerLang || null
        };
        if (!bonus[key]) bonus[key] = [];
        bonus[key].push(entry);
      });
    });

    return { questions, bonus };
  });
}

function pickAnswer(question, mode, domOptions) {
  const correct = normalize(question.correct);
  const distractors = Array.isArray(question.distractors) ? question.distractors.map(normalize).filter(Boolean) : [];
  const visible = Array.isArray(domOptions) ? domOptions.map(normalize).filter(Boolean) : [];
  const wrongVisible = visible.find((value) => value !== correct);
  const wrong = wrongVisible || distractors.find((value) => value !== correct) || correct;

  if (mode === 'perfect') {
    return { chosen: correct, correct: true };
  }
  if (mode === 'worst') {
    return { chosen: wrong, correct: wrong === correct };
  }

  const hashBase = `${question.area || ''}|${question.grade || ''}|${question.correct || ''}|${distractors.join('|')}`;
  const shouldBeCorrect = hashString(hashBase) % 10 < 7;
  return {
    chosen: shouldBeCorrect ? correct : wrong,
    correct: shouldBeCorrect || wrong === correct
  };
}

function hashString(text) {
  let value = 0;
  const source = String(text || '');
  for (let index = 0; index < source.length; index++) {
    value = ((value * 31) + source.charCodeAt(index)) >>> 0;
  }
  return value;
}

async function clickPlannedAnswer(page, rootSelector, question, mode, domOptions) {
  const buttons = page.locator(`${rootSelector} .answer-btn`);
  const answerPlan = pickAnswer(question, mode, domOptions);
  const targetIndex = domOptions.findIndex((value) => value === normalize(answerPlan.chosen));
  if (targetIndex === -1) {
    throw new Error(`Risposta non trovata nel DOM: ${normalize(answerPlan.chosen)}`);
  }

  await buttons.nth(targetIndex).click();
  await page.waitForTimeout(1100);
  return answerPlan;
}

async function readDomOptions(page, rootSelector) {
  const buttons = page.locator(`${rootSelector} .answer-btn`);
  const count = await buttons.count();
  const out = [];
  for (let index = 0; index < count; index++) {
    out.push(normalize(await buttons.nth(index).textContent()));
  }
  return out;
}

async function readDomOptionMeta(page, rootSelector) {
  const buttons = page.locator(`${rootSelector} .answer-btn`);
  const count = await buttons.count();
  const out = [];
  for (let index = 0; index < count; index++) {
    const button = buttons.nth(index);
    out.push({
      text: normalize(await button.textContent()),
      lang: normalize(await button.getAttribute('lang'))
    });
  }
  return out;
}

async function readPromptMeta(page, selector) {
  const target = page.locator(selector).first();
  return {
    text: normalize(await target.textContent()),
    html: normalize(await target.evaluate((node) => node.innerHTML)),
    lang: normalize(await target.getAttribute('lang'))
  };
}

function resolveQuestionMeta(candidates, domOptions) {
  if (!Array.isArray(candidates) || !candidates.length) return null;
  if (candidates.length === 1) return candidates[0];

  const visible = Array.isArray(domOptions) ? domOptions.map(normalize).filter(Boolean) : [];
  let best = candidates[0];
  let bestScore = -1;

  for (const candidate of candidates) {
    const optionSet = new Set([normalize(candidate.correct), ...(candidate.distractors || []).map(normalize)]);
    let score = 0;
    visible.forEach((value) => {
      if (optionSet.has(value)) score += 1;
    });
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }

  return best;
}

function normalize(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

main().catch((error) => {
  console.error(String(error));
  process.exit(1);
});
