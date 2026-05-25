# Fase 1 Audit Delta — Civica vs Core

## Scope
- Core baseline: `subject-quiz-core.js`
- Pagina: `js/civica-page.js`

## Sommario delta
- Civica implementa un engine quasi-core, ma non usa `SA.subjectConfig` né `applySubjectConfig`.
- La migrazione JSON-only è realizzata via hydrator locale che popola strutture legacy (`BANK`, `BONUS_QUESTIONS`) invece di usare direttamente `cfg.banks/cfg.bonusQuestions`.

## Differenze funzionali confermate
## 1) Bootstrap dati
- Core: config-driven (`SA.subjectConfig`, `questionsLoader.applySubjectConfig`) ([subject-quiz-core.js:5](../../subject-quiz-core.js#L5), [subject-quiz-core.js:74](../../subject-quiz-core.js#L74)).
- Civica: costanti locali + hydrator dedicato:
  - `BANK` ([js/civica-page.js:111](../../js/civica-page.js#L111))
  - `BONUS_QUESTIONS` ([js/civica-page.js:118](../../js/civica-page.js#L118))
  - `hydrateCivicaBankFromJson()` ([js/civica-page.js:548](../../js/civica-page.js#L548)).

Impatto: doppio modello dati (core-config vs legacy arrays) ancora presente.

## 2) Mapping aree specifico civica
- Mapping raw area -> area runtime con tabella dedicata `CIVICA_SOURCE_AREA_MAP` ([js/civica-page.js:95](../../js/civica-page.js#L95)).
- Core non ha un layer di mapping domain-specific equivalente (si aspetta bank già normalizzato).

Impatto: logica business hardcoded nel file pagina.

## 3) Planner e anti-repeat
- Core usa pipeline completa (`buildNormalizedBanks`, `candidateScore`, `pickQuestion`, stats update) ([subject-quiz-core.js:337](../../subject-quiz-core.js#L337), [subject-quiz-core.js:919](../../subject-quiz-core.js#L919), [subject-quiz-core.js:1007](../../subject-quiz-core.js#L1007)).
- Civica usa planner locale semplificato con `pickOne` dentro `buildSessionQuestions` ([js/civica-page.js:698](../../js/civica-page.js#L698), [js/civica-page.js:727](../../js/civica-page.js#L727)).
- Mancano in civica funzioni core: `candidateScore`, `pickQuestion`, `updateStatsFromSession`.

Impatto: rischio drift su qualità sessione e comportamento mixed rispetto alle materie core-driven.

## 4) Init e wiring UI
- Core: init idempotente (`initSubjectPage`) con wiring unificato ([subject-quiz-core.js:1676](../../subject-quiz-core.js#L1676)).
- Civica: bootstrap direttamente in `DOMContentLoaded` async ([js/civica-page.js:601](../../js/civica-page.js#L601)).

Impatto: pattern diverso di lifecycle da armonizzare in consolidamento.

## 5) Bonus flow
- Concettualmente equivalente al core (`openBonusQuestion` + `finishGame`), ma su storage locale `BONUS_QUESTIONS` ([js/civica-page.js:948](../../js/civica-page.js#L948), [js/civica-page.js:997](../../js/civica-page.js#L997)).

Impatto: comportamento allineato, integrazione non allineata.

## Classificazione rischio delta
- ALTO: doppio modello dati (`BANK`/`BONUS_QUESTIONS` + hydrator) vs contratto core config-driven.
- MEDIO: planner locale divergente (assenza `candidateScore/pickQuestion/updateStatsFromSession`).
- BASSO: differenze di bootstrap (`DOMContentLoaded` diretto vs `initSubjectPage`).

## Candidati estrazione (Fase 2+)
- Adapter JSON->cfg per civica (aree + bonus) per usare `subject-quiz-core`.
- Rimozione `BANK` e `BONUS_QUESTIONS` locali.
- Adozione pipeline core per build session questions.

## Conteggio classificazione
Conteggio per cluster di differenza consolidabile, non per singola funzione.

- A (identico, uso diretto): 2
- B (config field nuovo): 3
- C (variante logic core con flag): 2
- D (hook funzione): 0

Lettura operativa:
- `A`: bonus flow; output finale/leaderboard/rewards.
- `B`: adapter `questionsSource`; mapping area source->runtime; metadati area/subject spostabili in config.
- `C`: planner anti-repeat; bootstrap/init lifecycle.
- `D`: nessun hook funzione richiesto dal delta civica.
