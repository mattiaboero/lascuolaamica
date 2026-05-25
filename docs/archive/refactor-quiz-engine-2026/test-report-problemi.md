# Test report Fase 4 — problemi

## Scope
- Branch testato: `refactor/quiz-engine-consolidation`
- Server locale: `python3 -m http.server 4173`
- Harness: [scripts/subject_quiz_test_harness.js](../../scripts/subject_quiz_test_harness.js)
- Snapshot storage: [problemi-prod-4.6.9.json](./snapshots/problemi-prod-4.6.9.json)

## T1 — Storage migration
- Snapshot importato su browser pulito prima di aprire `problemi.html`.
- Chiavi storiche verificate byte-per-byte dopo il bootstrap pagina:
  - `problemiMatematica_lb_v1`
  - `problemiMatematica_history_v2`
  - `problemiMatematica_quality_v1`
  - `problemiMatematica_class_pref_v1`
- Classe preferita letta correttamente dalla UI: `Classe 5ª`.
- Leaderboard storica renderizzata correttamente con 3 entry e fallback area `Problemi`.
- Nota: `cursorKey` non esiste nello snapshot produzione 4.6.9 (`hasCursorKey: false`), quindi per `problemi` il controllo cursor e` `N/A`.

## T2 — Funzionale problemi
- Run 1 `perfect`, classe 3, bonus `easy`:
  - finale `500`, corrette `10`, sbagliate `0`, zero `pageerror`/`console.error`
- Run 2 `mixed`, classe 4, bonus `medium`:
  - finale `700`, corrette `7`, sbagliate `3`, zero `pageerror`/`console.error`
- Run 3 `worst`, classe 5, bonus `hard`:
  - finale `0`, corrette `0`, sbagliate `10`, zero `pageerror`/`console.error`
- Verifica aggiuntiva: dopo fix loader nessuna bonus row entra nelle 10 domande normali; il bonus resta confinato al flow finale dedicato.

## T3 — Edge cases answerMode numeric
- Verifiche sulla logica reale del core:
  - `12` = `12.0` -> vero
  - `12` = `12,0` -> vero
  - ` 12 ` = `12` -> vero
  - `12` != `12abc` -> vero
  - `1/2` = `0,5` -> vero
  - `-0` = `0` -> vero
- Dedup opzioni:
  - input `12`, `12.0`, `12,0`, `13` -> output senza duplicati visibili (`12`, `13`, `11`, `14` con strategy fallback attiva nel test di edge)
- Nessun crash osservato su valori grandi, negativi, zero, decimali e frazioni.
- Risposta vuota: `parseNumericAnswer('')` ritorna `null`, quindi il confronto cade sul ramo testuale e non genera eccezioni.

## T4 — Regressione materie gia` migrate
- `matematica`
  - `perfect/easy` -> `500`, `10/0`
  - `mixed/medium` -> `80`, `8/2`
  - `worst/hard` -> `0`, `0/10`
- `geografia`
  - `perfect/medium` -> `1000`, `10/0`
  - `mixed/hard` -> `1250`, `5/5`
  - `worst/skip` -> `0`, `0/10`
- `italiano`
  - `perfect/hard` -> `2500`, `10/0`
  - `mixed/skip` -> `90`, `9/1`
  - `worst/easy` -> `0`, `0/10`
- `scienze`
  - `perfect/skip` -> `100`, `10/0`
  - `mixed/easy` -> `400`, `8/2`
  - `worst/medium` -> `0`, `0/10`
- `storia`
  - `perfect/easy` -> `500`, `10/0`
  - `mixed/medium` -> `600`, `6/4`
  - `worst/hard` -> `0`, `0/10`
- `civica`
  - `perfect/medium` -> `1000`, `10/0`
  - `mixed/hard` -> `1250`, `5/5`
  - `worst/skip` -> `0`, `0/10`
- Tutti i 18 run hanno chiuso con `pageErrors=0` e `consoleErrors=0`.

## T5 — Check automatici
- `node --check subject-quiz-core.js` -> ok
- `node --check js/problemi-page.js` -> ok
- `node --check scripts/subject_quiz_test_harness.js` -> ok
- `node scripts/audit_questions_json.js` -> ok
- `bash prepublish-check.sh` -> verde dopo bump `4.7.0`

## Note
- Il harness e` stato rafforzato in Fase 4:
  - usa le opzioni realmente visibili nel DOM per i run `mixed/worst`
  - risolve collisioni di testi domanda uguali scegliendo la meta che combacia con le opzioni renderizzate
- Il loader JSON e` stato corretto per escludere le bonus rows dalla banca principale pur continuando a idratarle per il bonus flow.
