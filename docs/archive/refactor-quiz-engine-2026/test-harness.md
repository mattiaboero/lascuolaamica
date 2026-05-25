# Test harness refactor

## Scopo
Spec operativa del bot Playwright usato nei test runtime delle materie migrate al core.

File di riferimento:
- [scripts/subject_quiz_test_harness.js](../../scripts/subject_quiz_test_harness.js)
- Snapshot storage per i test T1: [docs/archive/refactor-quiz-engine-2026/snapshots/](./snapshots/)

## Test bot — modalità
- `mode=perfect`: risponde sempre giusto. Smoke test e validazione UI base.
- `mode=mixed`: risponde circa 70% giusto e 30% sbagliato con scelta deterministica basata sul contenuto della domanda. Valida flow score parziale, leaderboard con punteggi intermedi e feedback KO.
- `mode=worst`: risponde sempre sbagliato scegliendo il primo distrattore disponibile. Valida feedback KO, punteggio minimo e rendering UI in scenario negativo.

## Politica per T4 regressione
Per ogni materia eseguire run minimi:
- 1 run `perfect` (`N=10`)
- 1 o 2 run `mixed`
  - `N=10` per materie semplici (`matematica`, `geografia`, `italiano`, `scienze`, `storia`, `civica`, `problemi`)
  - `N=20` per materie complesse (es. `inglese` a livelli multipli) o quando serve ridurre rumore statistico
- 1 run `worst` (`N=10`)

Bonus:
- alternare `easy`, `medium`, `hard`, `skip` in modo ciclico tra i run della stessa materia

Obiettivo:
- non limitarsi a confermare che la pagina si avvia
- coprire anche score parziale, score nullo, feedback KO e ramificazioni bonus/skip

### Razionale `N=20`

Con `mode=mixed` (`p=0.7` corretto), la deviazione standard binomiale
per `N=10` e` circa `0.14`, quindi il range osservato realistico puo`
muoversi tra `50-90%` corrette.

Con `N=20` la deviazione scende a circa `0.10`, restringendo il range
tipico verso `60-80%`. Questo aiuta a identificare regressioni
inferiori a `15` punti percentuali su materie con piu` estensioni
config-driven.

## CLI minima

Esempio:

```bash
NODE_PATH=/path/to/node_modules node scripts/subject_quiz_test_harness.js \
  --base-url http://127.0.0.1:4173 \
  --page civica \
  --mode mixed \
  --bonus skip \
  --class 3 \
  --area mixed
```

Output:
- JSON con risultato finale, domande viste, risposta scelta per ogni step, esito bonus, `pageErrors` e `consoleErrors`

## Note implementative
- Il harness attiva il play window via storage locale per non bloccare i test sul modal dei 30 minuti.
- Le route locali vengono aperte come `*.html`, perché `python3 -m http.server` non replica i rewrite production-style.
- `mode=mixed` è deterministico: evita test flakey e mantiene ripetibile il rapporto corrette/sbagliate a parità di dataset.
- Prima di ogni nuova fase di migrazione creare o aggiornare uno snapshot storage della materia target in `docs/archive/refactor-quiz-engine-2026/snapshots/`.
- Rigenerare lo snapshot quando cambia lo schema storage della materia o quando una release modifica la migrazione da engine dedicato a core condiviso.
