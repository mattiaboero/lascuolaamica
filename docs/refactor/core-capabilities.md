# Fase 1 Audit Core — `subject-quiz-core.js`

## Scope
- File analizzato: `subject-quiz-core.js`
- Dimensione: 1706 righe
- Tipo: runtime shared per materie configurate via `window.SA.subjectConfig`

## Entry-point e contratto
- Boot condizionato da config: il file parte solo se esiste `SA.subjectConfig` ([subject-quiz-core.js:5](../../subject-quiz-core.js#L5)).
- Caricamento dataset via loader centralizzato:
  - recupero `SA.questionsLoader` ([subject-quiz-core.js:57](../../subject-quiz-core.js#L57))
  - applicazione config (`applySubjectConfig`) se presente `questionsSource` ([subject-quiz-core.js:74](../../subject-quiz-core.js#L74)).
- Init UI idempotente: `initSubjectPage()` con guard `_initDone` ([subject-quiz-core.js:1676](../../subject-quiz-core.js#L1676)).

## Capability inventory
## 1) Stato e persistenza locale
- Wrapper robusti storage con fallback in-memory (`storageGet/Set/Remove`) ([subject-quiz-core.js:27](../../subject-quiz-core.js#L27)).
- Cursor, storico, stats e quality metrics:
  - cursor ([subject-quiz-core.js:395](../../subject-quiz-core.js#L395))
  - history store ([subject-quiz-core.js:421](../../subject-quiz-core.js#L421))
  - stats aggregate ([subject-quiz-core.js:445](../../subject-quiz-core.js#L445))
  - metrics rolling ([subject-quiz-core.js:467](../../subject-quiz-core.js#L467)).

## 2) Normalizzazione dati quiz
- Normalizzazione bank per area con `_id`, `_sig`, `_grade` ([subject-quiz-core.js:337](../../subject-quiz-core.js#L337)).
- Signature hashing domanda-risposta per anti-ripetizione cross-sessione ([subject-quiz-core.js:288](../../subject-quiz-core.js#L288)).
- Inferenza grado fallback quando metadata incompleti ([subject-quiz-core.js:320](../../subject-quiz-core.js#L320)).

## 3) Class awareness e disponibilità aree
- Pool class-aware strict/loose per area (`getClassAwarePool`) ([subject-quiz-core.js:363](../../subject-quiz-core.js#L363)).
- Availability aree per classe selezionata ([subject-quiz-core.js:382](../../subject-quiz-core.js#L382)).
- Autonormalizzazione area selezionata in caso di area non disponibile ([subject-quiz-core.js:386](../../subject-quiz-core.js#L386)).

## 4) Session planner
- Piano classi (`buildGradePlan`) ([subject-quiz-core.js:829](../../subject-quiz-core.js#L829)).
- Ordinamento aree per weakness storica (`sortAreasByNeed`) ([subject-quiz-core.js:820](../../subject-quiz-core.js#L820)).
- Slot builder mixed/single area con rotazione cursor ([subject-quiz-core.js:946](../../subject-quiz-core.js#L946)).
- Selezione probabilistica anti-pattern con softmax (`pickWithSoftmax`) ([subject-quiz-core.js:883](../../subject-quiz-core.js#L883)).
- Scoring candidato con penalità repeat ID/SIG (`candidateScore`) ([subject-quiz-core.js:919](../../subject-quiz-core.js#L919)).
- Costruzione sessione finale (`buildSessionQuestions`) ([subject-quiz-core.js:1069](../../subject-quiz-core.js#L1069)).

## 5) Runtime partita
- Start + guard play window 30/60 min ([subject-quiz-core.js:227](../../subject-quiz-core.js#L227), [subject-quiz-core.js:1189](../../subject-quiz-core.js#L1189)).
- UI cycle domanda-risposte-score:
  - loadQuestion ([subject-quiz-core.js:1256](../../subject-quiz-core.js#L1256))
  - checkAnswer ([subject-quiz-core.js:1283](../../subject-quiz-core.js#L1283))
  - score bar ([subject-quiz-core.js:1249](../../subject-quiz-core.js#L1249)).

## 6) Bonus flow
- Pick bonus screen ([subject-quiz-core.js:1321](../../subject-quiz-core.js#L1321)).
- Domanda bonus da `cfg.bonusQuestions[type]` ([subject-quiz-core.js:1328](../../subject-quiz-core.js#L1328)).
- Esito bonus e moltiplicatore in `finishGame` ([subject-quiz-core.js:1382](../../subject-quiz-core.js#L1382)).

## 7) Output partita
- Salvataggio leaderboard localStorage (`saveScore`) ([subject-quiz-core.js:1464](../../subject-quiz-core.js#L1464)).
- Render leaderboard con tooltip base/bonus/classe (`renderLB`) ([subject-quiz-core.js:1529](../../subject-quiz-core.js#L1529)).
- Hook reward (`SA.rewards.recordGame`) ([subject-quiz-core.js:1441](../../subject-quiz-core.js#L1441)).

## 8) Accessibilità, feedback, audio
- `aria-live` su metadati bonus ([subject-quiz-core.js:1691](../../subject-quiz-core.js#L1691)).
- Compatibilità reduce-motion + `SA.motion` ([subject-quiz-core.js:197](../../subject-quiz-core.js#L197)).
- Feedback UI + effetti audio sintetizzati via WebAudio ([subject-quiz-core.js:1609](../../subject-quiz-core.js#L1609), [subject-quiz-core.js:1631](../../subject-quiz-core.js#L1631)).

## Gap emersi (core-centric)
- Il core richiede struttura `cfg` completa (aree/banks/bonusQuestions) e non integra automaticamente mapping da raw JSON eterogenei: questa trasformazione oggi è duplicata nelle pagine dedicate.
- I dedicated engine mantengono logiche parallele per planner/metriche/play window invece di delegare al core: rischio drift funzionale nel tempo.

## Decisione preliminare sul cap hook
- Vincolo operativo per Fase 2: mantenere `D <= 3`, preferibilmente `D = 0` nel primo pass di consolidamento.
- Reframing preliminare delle estensioni emerse:
  - problemi `normalizeAnswerValue/generateOptions` -> non hook funzione; preferenza per config field integrato tipo `answerMode: "numeric"`.
  - inglese `questionRenderer` -> non hook funzione; preferenza per config field integrato tipo `renderMode: "bilingual"`.
  - inglese `levelStrategy` -> non hook funzione; preferenza per metadata/config `levels` con logica standard nel core.
  - inglese `effects` -> trattare come variante lifecycle opzionale o fase successiva; non necessaria per consolidare il motore decisionale.
- Conseguenza pratica: i delta di Fase 1 ricadono soprattutto in categorie `B` e `C`; non serve pianificare nuovi hook funzione `D` per avviare la Fase 2.
