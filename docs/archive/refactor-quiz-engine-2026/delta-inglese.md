# Fase 1 Audit Delta — Inglese vs Core

## Scope
- Core baseline: `subject-quiz-core.js`
- Pagina: `js/inglese-page.js`

## Sommario delta
- Inglese è il delta più ampio: runtime a livelli (1/2/3), copy bilingue, rendering testuale EN/IT, confetti/streak dedicati.
- Anche dopo JSON-only, resta totalmente indipendente dal contratto `SA.subjectConfig`.

## Differenze funzionali confermate
## 1) Modello dati per livelli
- Inglese usa `QB` per livelli ([js/inglese-page.js:63](../../js/inglese-page.js#L63)) e mapping subarea->level (`ENGLISH_LEVEL_FROM_SUBAREA`) ([js/inglese-page.js:69](../../js/inglese-page.js#L69)).
- Hydrator dedicato: `hydrateEnglishFromJson()` ([js/inglese-page.js:637](../../js/inglese-page.js#L637)).
- Core non ha concetto first-class di level gating.

Impatto: divergenza funzionale significativa ma attesa.

## 2) Rendering linguistico e UX didattica
- Funzioni dedicate:
  - `appendEnglishText` ([js/inglese-page.js:179](../../js/inglese-page.js#L179))
  - `renderPromptText` ([js/inglese-page.js:192](../../js/inglese-page.js#L192))
  - `answerOptionsUseEnglish` ([js/inglese-page.js:212](../../js/inglese-page.js#L212)).
- Core non contiene un layer equivalente per testo bilingue/quote-aware.

Impatto: feature-specific da preservare con extension point, non da eliminare.

## 3) Flusso livelli e navigazione
- Controllo availability livelli per classe:
  - `refreshLevelButtonsForClass` ([js/inglese-page.js:392](../../js/inglese-page.js#L392))
  - `goLevels` ([js/inglese-page.js:1351](../../js/inglese-page.js#L1351))
  - `replayGame` ([js/inglese-page.js:1365](../../js/inglese-page.js#L1365)).
- Core non prevede schermata “levels” né replay su livello corrente.

Impatto: architettura UI differente rispetto alle materie core.

## 4) Planner e metriche
- Inglese ha planner locale (`buildSessionQuestions(lvl)`) ([js/inglese-page.js:816](../../js/inglese-page.js#L816)).
- Usa softmax/anti-repeat locale, ma non integra le API core `candidateScore/pickQuestion/updateStatsFromSession`.

Impatto: possibile drift progressivo nelle metriche tra inglese e motore shared.

## 5) Feedback avanzati
- Audio con `playStreak` e `playStart` ([js/inglese-page.js:799](../../js/inglese-page.js#L799), [js/inglese-page.js:801](../../js/inglese-page.js#L801)).
- Confetti dedicato (`launchConfetti`) ([js/inglese-page.js:1313](../../js/inglese-page.js#L1313)).
- Core ha solo `playOk/playKo/playPerfect` senza streak/start/confetti nativi.

Impatto: divergenza UX intenzionale.

## 6) Bonus + leaderboard
- Bonus locale con `BONUS_Q` ([js/inglese-page.js:125](../../js/inglese-page.js#L125)).
- Leaderboard custom (`saveLBEntry`, `loadLBData`, `renderLB`) ([js/inglese-page.js:1176](../../js/inglese-page.js#L1176), [js/inglese-page.js:1194](../../js/inglese-page.js#L1194), [js/inglese-page.js:1229](../../js/inglese-page.js#L1229)).

## Classificazione rischio delta
- ALTO: engine inglese separato per data bootstrap + planner + lifecycle.
- MEDIO: duplicazione metriche/anti-repeat con comportamento potenzialmente disallineato dal core.
- MIGLIORAMENTO: conservare feature linguistiche/level come plugin, non come fork completo del runtime.

## Candidati estrazione (Fase 2+)
- Riformulare le estensioni inglese come config e varianti core prima di introdurre hook funzione:
  - `renderMode: "bilingual"` per prompt/risposte.
  - metadata `levels` per filtering + availability.
  - effetti/streak/confetti come variante lifecycle opzionale, non come decision hook del planner.
- Adapter JSON inglese -> shape compatibile core, mantenendo metadati level/subarea.

## Conteggio classificazione
Conteggio per cluster di differenza consolidabile, non per singola funzione.

- A (identico, uso diretto): 2
- B (config field nuovo): 3
- C (variante logic core con flag): 3
- D (hook funzione): 0

Lettura operativa:
- `A`: guard play window e base game loop; bonus/leaderboard/rewards.
- `B`: metadata livelli; `renderMode: "bilingual"`; adapter dataset inglese verso shape core.
- `C`: planner level-aware; schermata livelli/replay; effetti streak/start/confetti come variante lifecycle.
- `D`: nessun hook funzione richiesto nel primo pass se il core assorbe bilingue e livelli come config standard.
