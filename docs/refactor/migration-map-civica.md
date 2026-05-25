# Mappa migrazione civica

Baseline usata:
- [core-capabilities.md](./core-capabilities.md)
- [delta-civica.md](./delta-civica.md)

Scopo: fissare il diff atteso prima di toccare il runtime di `js/civica-page.js`.

| Civica oggi | Core dopo |
|---|---|
| `BANK` ([js/civica-page.js:111](../../js/civica-page.js#L111)) | `cfg.banks` popolato da `questionsLoader.applySubjectConfig()` via `questionsSource` + JSON |
| `BONUS_QUESTIONS` ([js/civica-page.js:118](../../js/civica-page.js#L118)) | `cfg.bonusQuestions` derivato page-side dai bonus rows JSON prima dell'init core |
| `CLASS_PROFILES` ([js/civica-page.js:70](../../js/civica-page.js#L70)) | `cfg.classProfiles` |
| `CIVICA_SOURCE_AREA_MAP` ([js/civica-page.js:95](../../js/civica-page.js#L95)) | `cfg.questionsSource.areaMap` gia supportato da `questions-loader.js` |
| `MIXED_AREA_REPEAT_LIMIT` ([js/civica-page.js:86](../../js/civica-page.js#L86)) | `cfg.mixedAreaRepeatLimit` |
| `SOFTMAX_TEMPERATURE` ([js/civica-page.js:85](../../js/civica-page.js#L85)) | `cfg.softmaxTemperature` |
| `educazioneCivica_lb_v1` ([js/civica-page.js:63](../../js/civica-page.js#L63)) | `cfg.lbKey` |
| `educazioneCivica_cursor_v1` ([js/civica-page.js:64](../../js/civica-page.js#L64)) | `cfg.cursorKey` |
| `educazioneCivica_history_v2` ([js/civica-page.js:65](../../js/civica-page.js#L65)) | `cfg.historyKey` |
| `educazioneCivica_quality_v1` ([js/civica-page.js:66](../../js/civica-page.js#L66)) | `cfg.metricsKey` |
| `educazioneCivica_class_pref_v1` ([js/civica-page.js:69](../../js/civica-page.js#L69)) | `cfg.classPrefKey` |
| `buildSessionQuestions` ([js/civica-page.js:698](../../js/civica-page.js#L698)) | rimosso dalla pagina; delega a pipeline core |
| `openBonusQuestion` ([js/civica-page.js:948](../../js/civica-page.js#L948)) | rimosso dalla pagina; usa bonus flow core con `cfg.bonusQuestions` |

## Note di migrazione
- Nessun hook funzione previsto: target `D = 0`.
- I bonus rows sono gia leggibili dal loader via `getSubjectRows(..., { includeBonusRows: true })`, ma oggi non esiste ancora una costruzione shared di `cfg.bonusQuestions`: per civica la derivazione resta page-side nel primo pass.
- `questions-loader.js` supporta gia `questionsSource.areaMap`, quindi il mapping aree civica non richiede un branch per materia nel core.
- Le chiavi storage restano invariate: la snapshot prod [civica-prod-4.6.8.json](./snapshots/civica-prod-4.6.8.json) e il riferimento per il test T1 di compatibilita storage.
