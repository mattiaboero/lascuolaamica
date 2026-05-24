# Fase 1 Audit Delta — Problemi vs Core

## Scope
- Core baseline: `subject-quiz-core.js`
- Pagina: `js/problemi-page.js`

## Sommario delta
- Problemi è un engine dedicato con logica autonoma, non config-driven via `SA.subjectConfig`.
- La migrazione JSON-only aggiorna il caricamento dati ma conserva contenitori runtime locali (`PROBLEMS_POOL`, `BONUS_QUESTIONS`).

## Differenze funzionali confermate
## 1) Bootstrap dati e modello runtime
- Core usa `cfg.banks` + `cfg.bonusQuestions` ([subject-quiz-core.js:337](../../subject-quiz-core.js#L337), [subject-quiz-core.js:1328](../../subject-quiz-core.js#L1328)).
- Problemi usa:
  - `PROBLEMS_POOL` ([js/problemi-page.js:95](../../js/problemi-page.js#L95))
  - `BONUS_QUESTIONS` ([js/problemi-page.js:97](../../js/problemi-page.js#L97))
  - `hydrateProblemsFromJson()` ([js/problemi-page.js:521](../../js/problemi-page.js#L521)).

Impatto: persiste duplicazione strutturale rispetto al core.

## 2) Risposte numeriche/normalizzazione
- Problemi aggiunge normalizzazione risposta (`normalizeAnswerValue`) e opzioni generate (`generateOptions`) ([js/problemi-page.js:190](../../js/problemi-page.js#L190), [js/problemi-page.js:807](../../js/problemi-page.js#L807)).
- Core non include una specializzazione numerica equivalente.

Impatto: questa è una divergenza funzionale reale e probabilmente legittima (dominio problemi).

## 3) Planner e anti-repeat
- Core: pipeline avanzata con `candidateScore/pickQuestion/updateStatsFromSession` ([subject-quiz-core.js:919](../../subject-quiz-core.js#L919), [subject-quiz-core.js:1007](../../subject-quiz-core.js#L1007), [subject-quiz-core.js:1417](../../subject-quiz-core.js#L1417)).
- Problemi: planner locale con `buildSessionQuestions` su `PROBLEMS_POOL` ([js/problemi-page.js:653](../../js/problemi-page.js#L653)).
- Funzioni core mancanti: `candidateScore`, `pickQuestion`, `updateStatsFromSession`, `loadStats/saveStats`.

Impatto: possibile comportamento diverso sul lungo periodo (varietà e anti-ripetizione).

## 4) UI e navigazione
- Core gestisce area selection e mixed mode estensiva ([subject-quiz-core.js:650](../../subject-quiz-core.js#L650), [subject-quiz-core.js:946](../../subject-quiz-core.js#L946)).
- Problemi è single-domain senza `selectArea` equivalente.

Impatto: divergenza architetturale intenzionale ma da formalizzare nel piano di consolidamento.

## 5) Bonus flow e leaderboard
- Flusso bonus presente e simile ma su strutture locali ([js/problemi-page.js:874](../../js/problemi-page.js#L874), [js/problemi-page.js:927](../../js/problemi-page.js#L927)).
- Leaderboard custom (`renderLB`) analoga semanticamente al core ([js/problemi-page.js:1037](../../js/problemi-page.js#L1037)).

## Classificazione rischio delta
- ALTO: duplicazione infrastruttura dati/runtime (`PROBLEMS_POOL`, `BONUS_QUESTIONS`, hydrator locale).
- MEDIO: planner/metrics non pienamente allineati al core.
- MIGLIORAMENTO: separare extension points dominio-problemi (normalizzazione numerica) dal motore shared.

## Candidati estrazione (Fase 2+)
- Portare bootstrap dati su adapter verso `SA.subjectConfig`.
- Conservare `normalizeAnswerValue/generateOptions` come specializzazione integrata, preferibilmente via config field e non via hook funzione.
- Delegare scheduling al core riducendo codice pagina.

## Conteggio classificazione
Conteggio per cluster di differenza consolidabile, non per singola funzione.

- A (identico, uso diretto): 2
- B (config field nuovo): 2
- C (variante logic core con flag): 2
- D (hook funzione): 0

Lettura operativa:
- `A`: bonus flow; output finale/leaderboard/rewards.
- `B`: adapter `questionsSource`; modalita risposta numerica integrata (`answerMode: "numeric"` o equivalente).
- `C`: planner/metriche; single-domain UI senza area selection.
- `D`: nessun hook funzione necessario se la normalizzazione numerica resta una capability built-in del core.
