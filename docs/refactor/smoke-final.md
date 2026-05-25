# Smoke finale — Fase 6

## Stato attuale
Questo documento separa chiaramente:
- verifiche **gia` eseguite** in locale sul branch `refactor/quiz-engine-consolidation`
- verifiche **ancora obbligatorie** prima del merge su `main`

Il merge finale richiede comunque:
- soak del branch su staging-like o ambiente equivalente per almeno 1 settimana
  oppure
- un pre-deploy separato con 3-5 giorni reali di osservazione

## Verifiche locali gia` completate

### Regressione runtime
Gia` coperte dai report di fase:
- [test-report-civica.md](./test-report-civica.md)
- [test-report-problemi.md](./test-report-problemi.md)
- [test-report-inglese.md](./test-report-inglese.md)

Copertura confermata:
- `8/8` materie config-driven
- run `perfect`, `mixed`, `worst` sulle materie migrate
- storage migration verificata con snapshot produzione per:
  - civica
  - problemi
  - inglese
- `bash prepublish-check.sh` verde
- `node scripts/audit_questions_json.js` verde

### PWA e cache
Verifiche locali gia` coperte nelle fasi precedenti:
- registrazione SW
- scope root
- `Cache-Control: no-cache` per `sw.js` e `app-version.js`
- fallback offline root e rotte visitate
- flow update `waiting -> skipWaiting -> controllerchange -> reload`

## Smoke multi-device ancora richiesto

### Obbligatorio prima del merge
Da eseguire manualmente su:
- desktop
- tablet
- smartphone

Per ogni device:
- 1 sessione completa per ciascuna delle 8 materie
- nessun errore console
- bonus pickable
- leaderboard aggiornata
- inglese: levels screen + rendering bilingue reale

### Tabella esiti da completare

| Device | Matematica | Geografia | Italiano | Scienze | Storia | Civica | Problemi | Inglese |
|---|---|---|---|---|---|---|---|---|
| Desktop | pending | pending | pending | pending | pending | pending | pending | pending |
| Tablet | pending | pending | pending | pending | pending | pending | pending | pending |
| Smartphone | pending | pending | pending | pending | pending | pending | pending | pending |

## PWA mobile ancora richiesta
- installazione PWA su almeno 1 dispositivo reale
- prova offline completa
- prova update flow con bump dummy in ambiente separato

Stato: `PENDING`

## Rewards e reset dati ancora richiesti
- 1 sessione per tutte le 8 materie
- verifica `lascuolaamica_rewards_v1`
- verifica reset dati locali su:
  - `lbKey`
  - `cursorKey`
  - `historyKey`
  - `metricsKey`
  - `classPrefKey`

Stato: `PENDING`

## Conclusione
Smoke tecnico locale: `PASS`

Smoke multi-device reale, installazione PWA su device e soak pre-merge:
`NON ANCORA COMPLETATI`

Conseguenza operativa:
- il branch e` pronto per la validazione finale
- **non e` ancora autorizzato il merge su `main`**
