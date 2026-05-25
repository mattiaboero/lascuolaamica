# Test harness refactor

## Scopo
Spec operativa del bot Playwright usato nei test runtime delle materie migrate al core.

File di riferimento:
- [scripts/subject_quiz_test_harness.js](../../scripts/subject_quiz_test_harness.js)

## Test bot — modalità
- `mode=perfect`: risponde sempre giusto. Smoke test e validazione UI base.
- `mode=mixed`: risponde circa 70% giusto e 30% sbagliato con scelta deterministica basata sul contenuto della domanda. Valida flow score parziale, leaderboard con punteggi intermedi e feedback KO.
- `mode=worst`: risponde sempre sbagliato scegliendo il primo distrattore disponibile. Valida feedback KO, punteggio minimo e rendering UI in scenario negativo.

## Politica per T4 regressione
Per ogni materia migrata eseguire almeno 3 run:
- 1 run `perfect`
- 1 run `mixed`
- 1 run `worst`

Bonus:
- alternare `easy`, `medium`, `hard`, `skip` in modo ciclico tra i run della stessa materia

Obiettivo:
- non limitarsi a confermare che la pagina si avvia
- coprire anche score parziale, score nullo, feedback KO e ramificazioni bonus/skip

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
