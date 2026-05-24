# Fase 3 — Test report civica

Data esecuzione: 2026-05-24  
Branch: `refactor/quiz-engine-consolidation`

Ambiente usato:
- server locale statico con `python3 -m http.server 4173`
- test browser automation con Playwright headless
- entry locali usate: `*.html` (il server statico non replica i rewrite production-style su route extensionless)

## T1 — Storage migration

Snapshot usato:
- [civica-prod-4.6.8.json](./snapshots/civica-prod-4.6.8.json)

Esito: `PASS`

Verifiche confermate:
- classe preferita ripristinata: `5`
- classifica caricata correttamente: `3` righe
- storage preservato byte-for-byte per tutte le 5 chiavi civica
- nessun `pageerror`
- nessun `console.error`

## T2 — Funzionale

Esito: `PASS`

Sessioni verificate:
- civica classe 3, area `mixed`, bonus `easy`
- civica classe 4, area `mixed`, bonus `medium`
- civica classe 5, area `mixed`, bonus `hard`
- 5 sessioni aggiuntive civica classe 3, area `mixed`, bonus `skip`

Risultati confermati:
- ogni sessione completa produce 10 domande + schermata bonus finale
- bonus `easy`, `medium`, `hard` tutti pickabili e risolti correttamente
- run massimo consecutivo stessa area in mixed: `2`
- distribuzione classe 3 su `60` domande: `24` domande grado 2, `36` domande grado 3, `0` altre
- rapporto grado 2 osservato: `0.40`
- nessun `pageerror`
- nessun `console.error`

Nota:
- il primo run dopo la migrazione mostrava un drift verso il solo grado 3; corretto introducendo pesi config-driven `targetGradeWeight` e `classDistanceWeight` in `subject-quiz-core.js`, applicati a civica senza branch per materia.

## T3 — Edge cases

Esito: `PASS`

Verifiche confermate:
- fallback in-memory con `localStorage` che lancia eccezioni: sessione completabile, punteggio finale `100`
- `educazioneCivica_history_v2` malformato (`{bad json`): nessun crash, sessione completabile, punteggio finale `100`
- cambio classe in sessione: coerente con pre-migrazione, nessun controllo classe presente in `screenGame` (`0` pulsanti classe)
- nessun `pageerror`
- nessun `console.error`

## T4 — Regressione 5 materie A

Esito: `PASS`

Materie verificate:
- matematica
- geografia
- italiano
- scienze
- storia

Per ciascuna materia:
- 1 sessione completa classe 3, area `mixed`
- bonus `easy` aperto e risolto correttamente
- punteggio finale osservato: `500`
- risposte corrette: `10`
- run massimo consecutivo stessa area: `2`
- nessun `pageerror`
- nessun `console.error`

## T5 — Prepublish + audit

Esito: `PASS`

Check eseguiti:
- `python3 scripts/sync_csp_hashes.py` → `[OK] _headers già allineato`
- `bash prepublish-check.sh` → `PASS`, incluso `[OK] subject-quiz-core.js: no subject-specific branches`
- `node scripts/audit_questions_json.js` → `Question JSON audit passed for 8 subject files.`
- `grep -n "Extension Contract" subject-quiz-core.js` → `1` match
- `grep "educazioneCivica" subject-quiz-core.js` → `0` match
