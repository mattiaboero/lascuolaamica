(function () {
  'use strict';

  var SUBJECTS = [
    { value: 'matematica', label: 'Matematica', sourceSubject: 'matematica', prefix: 'mat', defaultLanguage: 'it' },
    { value: 'inglese', label: 'Inglese', sourceSubject: 'inglese', prefix: 'eng', defaultLanguage: 'en' },
    { value: 'problemi', label: 'Problemi', sourceSubject: 'problemi', prefix: 'pro', defaultLanguage: 'it' },
    { value: 'civica', label: 'Educazione civica', sourceSubject: 'educazione civica', prefix: 'civ', defaultLanguage: 'it' },
    { value: 'geografia', label: 'Geografia', sourceSubject: 'geografia', prefix: 'geo', defaultLanguage: 'it' },
    { value: 'storia', label: 'Storia', sourceSubject: 'storia', prefix: 'sto', defaultLanguage: 'it' },
    { value: 'scienze', label: 'Scienze', sourceSubject: 'scienze', prefix: 'sci', defaultLanguage: 'it' },
    { value: 'italiano', label: 'Italiano', sourceSubject: 'italiano', prefix: 'ita', defaultLanguage: 'it' }
  ];

  var SUBJECT_MAP = SUBJECTS.reduce(function (acc, item) {
    acc[item.value] = item;
    return acc;
  }, {});

  var STORAGE_DRAFT_KEY = 'scuolaamica_editor_draft_v1';

  var authPanel = document.getElementById('authPanel');
  var editorPanel = document.getElementById('editorPanel');
  var draftPanel = document.getElementById('draftPanel');
  var exportPanel = document.getElementById('exportPanel');

  var configWarning = document.getElementById('configWarning');
  var authForm = document.getElementById('authForm');
  var tokenInput = document.getElementById('tokenInput');
  var authMessage = document.getElementById('authMessage');

  var questionForm = document.getElementById('questionForm');
  var formMessage = document.getElementById('formMessage');
  var saveBtn = document.getElementById('saveBtn');
  var resetBtn = document.getElementById('resetBtn');
  var clearAllBtn = document.getElementById('clearAllBtn');
  var logoutBtn = document.getElementById('logoutBtn');

  var draftTbody = document.getElementById('draftTbody');
  var emptyDraftMessage = document.getElementById('emptyDraftMessage');
  var draftCount = document.getElementById('draftCount');

  var exportBtn = document.getElementById('exportBtn');
  var exportMessage = document.getElementById('exportMessage');
  var jsonPreview = document.getElementById('jsonPreview');
  var importInput = document.getElementById('importInput');

  var formFields = {
    subject: document.getElementById('subject'),
    classLevel: document.getElementById('classLevel'),
    area: document.getElementById('area'),
    subarea: document.getElementById('subarea'),
    difficulty: document.getElementById('difficulty'),
    language: document.getElementById('language'),
    sourceSubject: document.getElementById('sourceSubject'),
    program: document.getElementById('program'),
    question: document.getElementById('question'),
    opt0: document.getElementById('opt0'),
    opt1: document.getElementById('opt1'),
    opt2: document.getElementById('opt2'),
    opt3: document.getElementById('opt3'),
    answerIndex: document.getElementById('answerIndex'),
    tag: document.getElementById('tag'),
    tags: document.getElementById('tags'),
    teacherNote: document.getElementById('teacherNote'),
    explanation: document.getElementById('explanation'),
    active: document.getElementById('active'),
    bonus: document.getElementById('bonus'),
    bonusRaw: document.getElementById('bonusRaw')
  };

  var drafts = [];
  var editingIndex = -1;

  function safeSetStorage(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      // ignore storage errors (private mode/full storage)
    }
  }

  function safeGetStorage(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function getTokenHashFromConfig() {
    var cfg = window.EDITOR_ACCESS_CONFIG || {};
    var hash = String(cfg.tokenHash || '').trim().toLowerCase();
    return /^[a-f0-9]{64}$/.test(hash) ? hash : '';
  }

  function hasValidTokenConfig() {
    return getTokenHashFromConfig().length === 64;
  }

  function setStatus(el, message, isError) {
    el.textContent = message || '';
    if (isError) {
      el.style.color = '#fecaca';
    } else {
      el.style.color = '#c7d2fe';
    }
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function slugify(value) {
    return String(value || '')
      .toLowerCase()
      .trim()
      .replace(/[àáâãäå]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/ç/g, 'c')
      .replace(/ñ/g, 'n')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 32);
  }

  function getTokenFromUrl() {
    var rawHash = String(window.location.hash || '').replace(/^#/, '');
    if (!rawHash) return '';

    if (rawHash.indexOf('=') === -1) {
      return decodeURIComponent(rawHash);
    }

    var params = new URLSearchParams(rawHash);
    return params.get('token') || '';
  }

  function removeTokenFromUrl() {
    var url = new URL(window.location.href);
    var changed = false;

    if (url.searchParams.has('token')) {
      url.searchParams.delete('token');
      changed = true;
    }

    var rawHash = String(url.hash || '').replace(/^#/, '');
    if (rawHash) {
      var params = new URLSearchParams(rawHash);
      if (params.has('token')) {
        params.delete('token');
        url.hash = params.toString() ? ('#' + params.toString()) : '';
        changed = true;
      } else if (rawHash.indexOf('=') === -1) {
        url.hash = '';
        changed = true;
      }
    }

    if (changed) {
      history.replaceState({}, document.title, url.pathname + url.search + url.hash);
    }
  }

  function toHex(buffer) {
    return Array.prototype.map.call(new Uint8Array(buffer), function (b) {
      return b.toString(16).padStart(2, '0');
    }).join('');
  }

  function hashToken(token) {
    var text = String(token || '').trim();
    var enc = new TextEncoder();
    return crypto.subtle.digest('SHA-256', enc.encode(text)).then(toHex);
  }

  function showEditor() {
    authPanel.hidden = true;
    editorPanel.hidden = false;
    draftPanel.hidden = false;
    exportPanel.hidden = false;
  }

  function showAuthPanel() {
    authPanel.hidden = false;
    editorPanel.hidden = true;
    draftPanel.hidden = true;
    exportPanel.hidden = true;
  }

  function populateSubjectSelect() {
    SUBJECTS.forEach(function (subject) {
      var opt = document.createElement('option');
      opt.value = subject.value;
      opt.textContent = subject.label;
      formFields.subject.appendChild(opt);
    });
  }

  function updateSubjectDefaults() {
    var cfg = SUBJECT_MAP[formFields.subject.value];
    if (!cfg) return;

    if (!formFields.sourceSubject.dataset.locked) {
      formFields.sourceSubject.value = cfg.sourceSubject;
    }

    if (!formFields.language.dataset.locked) {
      formFields.language.value = cfg.defaultLanguage;
    }
  }

  function setDefaultMessages() {
    setStatus(formMessage, '', false);
    setStatus(exportMessage, '', false);
  }

  function saveDrafts() {
    safeSetStorage(STORAGE_DRAFT_KEY, JSON.stringify(drafts));
  }

  function loadDrafts() {
    var raw = safeGetStorage(STORAGE_DRAFT_KEY);
    if (!raw) {
      drafts = [];
      return;
    }

    try {
      var parsed = JSON.parse(raw);
      drafts = Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      drafts = [];
    }
  }

  function shortText(value, max) {
    var text = String(value || '');
    if (text.length <= max) return text;
    return text.slice(0, max - 1) + '…';
  }

  function updateDraftCount() {
    draftCount.textContent = drafts.length + (drafts.length === 1 ? ' esercizio' : ' esercizi');
    emptyDraftMessage.hidden = drafts.length > 0;
  }

  function renderDraftTable() {
    updateDraftCount();

    if (!drafts.length) {
      draftTbody.innerHTML = '';
      return;
    }

    var html = drafts.map(function (item, idx) {
      return (
        '<tr>' +
          '<td>' + (idx + 1) + '</td>' +
          '<td><code>' + escapeHtml(item.id) + '</code></td>' +
          '<td>' + escapeHtml(item.subject) + '</td>' +
          '<td>' + escapeHtml(item.class) + '</td>' +
          '<td>' + escapeHtml(item.area || '') + '</td>' +
          '<td>' + escapeHtml(shortText(item.question, 80)) + '</td>' +
          '<td><span class="mini-actions">' +
            '<button type="button" data-action="edit" data-index="' + idx + '">Modifica</button>' +
            '<button type="button" data-action="clone" data-index="' + idx + '">Duplica</button>' +
            '<button type="button" data-action="remove" data-index="' + idx + '">Elimina</button>' +
          '</span></td>' +
        '</tr>'
      );
    }).join('');

    draftTbody.innerHTML = html;
  }

  function resetForm(keepSubject) {
    questionForm.reset();
    formFields.active.checked = true;

    if (keepSubject) {
      var subject = formFields.subject.value;
      if (subject) {
        formFields.subject.value = subject;
        updateSubjectDefaults();
      }
    }

    editingIndex = -1;
    saveBtn.textContent = 'Aggiungi esercizio';
    setStatus(formMessage, '', false);
  }

  function nextIdForQuestion(data) {
    var cfg = SUBJECT_MAP[data.subject] || { prefix: 'q' };
    var areaSlug = slugify(data.area || 'generale') || 'generale';
    var prefix = cfg.prefix + '-' + String(data.class || 'x') + '-' + areaSlug + '-';
    var max = 0;

    drafts.forEach(function (q) {
      if (!q || typeof q.id !== 'string' || q.id.indexOf(prefix) !== 0) return;
      var serial = Number(q.id.slice(prefix.length));
      if (Number.isFinite(serial) && serial > max) {
        max = serial;
      }
    });

    return prefix + String(max + 1).padStart(3, '0');
  }

  function parseTags(value) {
    if (!value) return [];
    return String(value)
      .split(/[;,]/)
      .map(function (item) { return item.trim(); })
      .filter(Boolean);
  }

  function uniqueList(items) {
    var seen = Object.create(null);
    var out = [];

    items.forEach(function (item) {
      var key = String(item || '').trim();
      if (!key || seen[key]) return;
      seen[key] = true;
      out.push(key);
    });

    return out;
  }

  function collectQuestionFromForm() {
    var subject = formFields.subject.value.trim();
    var classLevel = Number(formFields.classLevel.value);
    var question = formFields.question.value.trim();
    var area = formFields.area.value.trim();
    var subarea = formFields.subarea.value.trim();
    var difficultyRaw = formFields.difficulty.value;
    var language = formFields.language.value.trim() || 'it';
    var sourceSubject = formFields.sourceSubject.value.trim() || (SUBJECT_MAP[subject] ? SUBJECT_MAP[subject].sourceSubject : subject);
    var program = formFields.program.value.trim();

    var options = [
      formFields.opt0.value.trim(),
      formFields.opt1.value.trim(),
      formFields.opt2.value.trim(),
      formFields.opt3.value.trim()
    ];

    var answerIndex = Number(formFields.answerIndex.value);
    var explanation = formFields.explanation.value.trim();
    var teacherNote = formFields.teacherNote.value.trim();
    var bonusRaw = formFields.bonusRaw.value.trim();
    var isActive = !!formFields.active.checked;
    var isBonus = !!formFields.bonus.checked;

    var errors = [];
    if (!subject) errors.push('Seleziona una materia.');
    if (!Number.isInteger(classLevel) || classLevel < 2 || classLevel > 5) errors.push('Seleziona una classe valida (2-5).');
    if (!area) errors.push('Compila il campo Area.');
    if (!question || question.length < 8) errors.push('La domanda deve contenere almeno 8 caratteri.');

    options.forEach(function (option, idx) {
      if (!option) errors.push('Compila l\'opzione ' + String.fromCharCode(65 + idx) + '.');
    });

    if (!Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex > 3) {
      errors.push('Seleziona la risposta corretta.');
    }

    if (errors.length) {
      return { ok: false, errors: errors };
    }

    var areaSlug = slugify(area || 'generale') || 'generale';
    var autoTags = [subject, areaSlug, 'classe_' + classLevel, 'primaria'];
    var customTags = parseTags(formFields.tags.value);
    var tags = uniqueList(autoTags.concat(customTags));

    var primaryTag = formFields.tag.value.trim();
    if (!primaryTag) {
      primaryTag = tags.join(';');
    }

    var normalizedProgram = program;
    if (!normalizedProgram) {
      normalizedProgram = subject + '_primaria_classe_' + classLevel + '_' + areaSlug;
    }

    var difficulty = null;
    if (difficultyRaw !== '') {
      difficulty = Number(difficultyRaw);
      if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 3) {
        difficulty = null;
      }
    }

    return {
      ok: true,
      data: {
        id: '',
        subject: subject,
        sourceSubject: sourceSubject,
        class: classLevel,
        area: area,
        subarea: subarea,
        difficulty: difficulty,
        question: question,
        options: options,
        answerIndex: answerIndex,
        answer: options[answerIndex],
        explanation: explanation,
        active: isActive,
        tag: primaryTag,
        tags: tags,
        language: language,
        program: normalizedProgram,
        teacherNote: teacherNote,
        bonus: isBonus,
        bonusRaw: bonusRaw
      }
    };
  }

  function fillFormWithQuestion(question) {
    formFields.subject.value = question.subject || '';
    formFields.classLevel.value = String(question.class || '');
    formFields.area.value = question.area || '';
    formFields.subarea.value = question.subarea || '';
    formFields.difficulty.value = (question.difficulty === null || question.difficulty === undefined) ? '' : String(question.difficulty);
    formFields.language.value = question.language || 'it';
    formFields.sourceSubject.value = question.sourceSubject || '';
    formFields.program.value = question.program || '';
    formFields.question.value = question.question || '';
    formFields.opt0.value = (question.options && question.options[0]) || '';
    formFields.opt1.value = (question.options && question.options[1]) || '';
    formFields.opt2.value = (question.options && question.options[2]) || '';
    formFields.opt3.value = (question.options && question.options[3]) || '';
    formFields.answerIndex.value = String(question.answerIndex);
    formFields.explanation.value = question.explanation || '';
    formFields.tag.value = question.tag || '';
    formFields.tags.value = Array.isArray(question.tags) ? question.tags.join(', ') : '';
    formFields.teacherNote.value = question.teacherNote || '';
    formFields.active.checked = question.active !== false;
    formFields.bonus.checked = !!question.bonus;
    formFields.bonusRaw.value = question.bonusRaw || '';
  }

  function onSubmitQuestion(event) {
    event.preventDefault();
    var result = collectQuestionFromForm();

    if (!result.ok) {
      setStatus(formMessage, result.errors.join(' '), true);
      return;
    }

    if (editingIndex >= 0) {
      result.data.id = drafts[editingIndex].id;
      drafts[editingIndex] = result.data;
      setStatus(formMessage, 'Esercizio aggiornato.', false);
      editingIndex = -1;
      saveBtn.textContent = 'Aggiungi esercizio';
    } else {
      result.data.id = nextIdForQuestion(result.data);
      drafts.push(result.data);
      setStatus(formMessage, 'Esercizio aggiunto alla bozza.', false);
    }

    saveDrafts();
    renderDraftTable();
    resetForm(true);
  }

  function onTableClick(event) {
    var btn = event.target.closest('button[data-action]');
    if (!btn) return;

    var action = btn.getAttribute('data-action');
    var index = Number(btn.getAttribute('data-index'));
    if (!Number.isInteger(index) || index < 0 || index >= drafts.length) return;

    if (action === 'edit') {
      editingIndex = index;
      fillFormWithQuestion(drafts[index]);
      saveBtn.textContent = 'Salva modifica';
      setStatus(formMessage, 'Modifica in corso sull\'esercizio #' + (index + 1) + '.', false);
      return;
    }

    if (action === 'clone') {
      var clone = JSON.parse(JSON.stringify(drafts[index]));
      clone.id = nextIdForQuestion(clone);
      drafts.push(clone);
      saveDrafts();
      renderDraftTable();
      setStatus(formMessage, 'Esercizio duplicato.', false);
      return;
    }

    if (action === 'remove') {
      if (!confirm('Eliminare questo esercizio?')) return;
      drafts.splice(index, 1);
      saveDrafts();
      renderDraftTable();
      setStatus(formMessage, 'Esercizio eliminato.', false);
      if (editingIndex === index) {
        resetForm(false);
      }
    }
  }

  function buildExportPayload() {
    var bySubject = drafts.reduce(function (acc, item) {
      acc[item.subject] = (acc[item.subject] || 0) + 1;
      return acc;
    }, {});

    return {
      schemaVersion: 'draft-v1',
      exportedAt: new Date().toISOString(),
      source: 'lascuolaamica-editor',
      totalQuestions: drafts.length,
      bySubject: bySubject,
      questions: drafts
    };
  }

  function createFilename() {
    var now = new Date();
    var pad = function (n) { return String(n).padStart(2, '0'); };
    return [
      'esercizi-draft-',
      now.getFullYear(),
      pad(now.getMonth() + 1),
      pad(now.getDate()),
      '-',
      pad(now.getHours()),
      pad(now.getMinutes()),
      pad(now.getSeconds()),
      '.json'
    ].join('');
  }

  function exportDrafts() {
    if (!drafts.length) {
      setStatus(exportMessage, 'Nessun esercizio da esportare.', true);
      return;
    }

    var payload = buildExportPayload();
    var json = JSON.stringify(payload, null, 2);
    jsonPreview.value = json;

    var blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = createFilename();
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    setStatus(exportMessage, 'JSON generato e scaricato. Ora puoi inviarlo via email.', false);
  }

  function validateImportedQuestions(items) {
    if (!Array.isArray(items)) return [];

    return items.filter(function (item) {
      if (!item || typeof item !== 'object') return false;
      if (!item.subject || !item.question) return false;
      if (!Array.isArray(item.options) || item.options.length !== 4) return false;
      if (!Number.isInteger(item.answerIndex) || item.answerIndex < 0 || item.answerIndex > 3) return false;
      return true;
    }).map(function (item) {
      var copy = JSON.parse(JSON.stringify(item));
      if (!copy.id) copy.id = nextIdForQuestion(copy);
      return copy;
    });
  }

  function importDraftFile(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var parsed = JSON.parse(String(reader.result || '{}'));
        var imported = [];

        if (Array.isArray(parsed)) {
          imported = validateImportedQuestions(parsed);
        } else if (Array.isArray(parsed.questions)) {
          imported = validateImportedQuestions(parsed.questions);
        }

        if (!imported.length) {
          setStatus(exportMessage, 'File non valido o senza esercizi compatibili.', true);
          return;
        }

        var replace = confirm('Sostituire le bozze correnti? Premi Annulla per aggiungere in coda.');
        if (replace) {
          drafts = imported;
        } else {
          drafts = drafts.concat(imported);
        }

        saveDrafts();
        renderDraftTable();
        setStatus(exportMessage, 'Import completato: ' + imported.length + ' esercizi caricati.', false);
      } catch (error) {
        setStatus(exportMessage, 'Errore nel parsing JSON: ' + error.message, true);
      }
    };

    reader.readAsText(file, 'utf-8');
  }

  function clearAllDrafts() {
    if (!drafts.length) return;
    if (!confirm('Cancellare tutti gli esercizi in bozza?')) return;

    drafts = [];
    saveDrafts();
    renderDraftTable();
    resetForm(false);
    jsonPreview.value = '';
    setStatus(exportMessage, 'Bozze cancellate.', false);
  }

  function bindEvents() {
    authForm.addEventListener('submit', function (event) {
      event.preventDefault();

      if (!hasValidTokenConfig()) {
        setStatus(authMessage, 'Configurazione token non valida: contatta l\'amministratore.', true);
        return;
      }

      var token = tokenInput.value.trim();
      if (!token) {
        setStatus(authMessage, 'Inserisci un token.', true);
        return;
      }

      hashToken(token).then(function (hash) {
        if (hash !== getTokenHashFromConfig()) {
          setStatus(authMessage, 'Token non valido.', true);
          return;
        }

        showEditor();
        removeTokenFromUrl();
        tokenInput.value = '';
        setStatus(authMessage, 'Accesso riuscito.', false);
      }).catch(function () {
        setStatus(authMessage, 'Errore di validazione token.', true);
      });
    });

    formFields.subject.addEventListener('change', updateSubjectDefaults);

    formFields.sourceSubject.addEventListener('input', function () {
      formFields.sourceSubject.dataset.locked = formFields.sourceSubject.value.trim() ? '1' : '';
    });

    formFields.language.addEventListener('change', function () {
      formFields.language.dataset.locked = formFields.language.value ? '1' : '';
    });

    questionForm.addEventListener('submit', onSubmitQuestion);

    resetBtn.addEventListener('click', function () {
      resetForm(false);
    });

    clearAllBtn.addEventListener('click', clearAllDrafts);

    logoutBtn.addEventListener('click', function () {
      showAuthPanel();
      tokenInput.value = '';
      setStatus(authMessage, 'Editor bloccato.', false);
    });

    draftTbody.addEventListener('click', onTableClick);

    exportBtn.addEventListener('click', exportDrafts);

    importInput.addEventListener('change', function () {
      var file = importInput.files && importInput.files[0];
      if (!file) return;
      importDraftFile(file);
      importInput.value = '';
    });
  }

  function tryTokenFromUrl() {
    if (!hasValidTokenConfig()) return;
    var token = getTokenFromUrl();
    if (!token) return;

    hashToken(token).then(function (hash) {
      if (hash !== getTokenHashFromConfig()) {
        setStatus(authMessage, 'Token URL non valido.', true);
        return;
      }
      showEditor();
      removeTokenFromUrl();
      setStatus(authMessage, 'Accesso con token URL riuscito.', false);
    }).catch(function () {
      setStatus(authMessage, 'Errore durante la verifica token URL.', true);
    });
  }

  function init() {
    populateSubjectSelect();
    bindEvents();
    loadDrafts();
    renderDraftTable();
    setDefaultMessages();

    if (!hasValidTokenConfig()) {
      configWarning.hidden = false;
      showAuthPanel();
      setStatus(authMessage, 'Configura prima editor-config.js con un hash token valido.', true);
      return;
    }

    showAuthPanel();
    setStatus(authMessage, 'Inserisci il token oppure apri l\'URL con #token=...', false);
    tryTokenFromUrl();
  }

  init();
})();
