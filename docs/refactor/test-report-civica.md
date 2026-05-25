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
- nota statistica: distribuzione osservata `0.40` vs attesa `0.35` entro tolleranza per `N=60`. Per validazione stretta con deviazione `< 0.02` servirebbe `N >= 200`, non eseguito in questa fase perché non rappresentativo di una sessione utente reale da 10 domande.

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

Debito noto chiuso per le fasi successive:
- da Fase 4 in poi T4 non deve limitarsi al solo bot `perfect`; il harness condiviso in [test-harness.md](./test-harness.md) introduce anche `mode=mixed` e `mode=worst`

## T5 — Prepublish + audit

Esito: `PASS`

Check eseguiti:
- `python3 scripts/sync_csp_hashes.py` → `[OK] _headers già allineato`
- `bash prepublish-check.sh` → `PASS`, incluso `[OK] subject-quiz-core.js: no subject-specific branches`
- `node scripts/audit_questions_json.js` → `Question JSON audit passed for 8 subject files.`
- `grep -n "Extension Contract" subject-quiz-core.js` → `1` match
- `grep "educazioneCivica" subject-quiz-core.js` → `0` match

## Verifica retroattiva post fix loader (v4.7.0)

Eseguita in pre-Fase 5 per validare che il fix `questions-loader.js`
(bonus rows escluse dalla banca principale, introdotto in v4.7.0) non
abbia rotto in retroattivo il comportamento civica.

### Run harness
- 6 sessioni civica classe 3 area `mixed` mode=`mixed` bonus=`easy`
- Totale `60` domande
- `0` bonus rows tra le domande normali (atteso)

### Distribuzione gradi osservata post-fix
- grado 2: `24` domande (`40%`)
- grado 3: `36` domande (`60%`)
- altri: `0`

### Confronto pre/post fix
- pre-fix (Fase 3 T2): `24g2 + 36g3` (`40%/60%`)
- post-fix: `24g2 + 36g3` (`40%/60%`)
- `0` bonus rows confermato tra le domande standard
- distribuzione invariata rispetto a Fase 3 e compatibile con `classProfiles[3] = {2: 0.35, 3: 0.65}` entro il margine statistico gia` accettato su `N=60`
- run massimo consecutivo stessa area in mixed: `2`

### Leaderboard byte-per-byte
- snapshot [civica-prod-4.6.8.json](./snapshots/civica-prod-4.6.8.json) ricaricato
- `3` entry leaderboard intatte
- class pref `5` ripristinata
- `0` `pageerror`
- `0` `console.error`

### Esito
`PASS`. Nessuna regressione introdotta dal fix loader su civica.
