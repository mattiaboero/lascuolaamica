# Archive — Quiz engine consolidation refactor (2026)

Refactor completato in v4.9.0.

## Cronologia
- Fase 1: audit core + delta — commit a95041c
- Fase 2: extension contract + guard rail — commit 6af61bc
- Fase 3: migrazione civica (v4.6.9) — commit 9e8aa57
- Fase 4: migrazione problemi (v4.7.0) — commit a48a3d6
- v4.7.1: policy cursorKey unica — commit acaa685
- Fase 5: migrazione inglese (v4.8.0) — commit 7fd998b
- Fase 6: cleanup + gate finale — commit 28be144

## Tag
v4.9.0 — quiz engine consolidation complete.

## Documenti chiave
- core-capabilities.md: inventario subject-quiz-core.js
- extension-contract.md: contratto pubblico extension
- delta-{civica,problemi,inglese}.md: audit pre-migrazione
- migration-map-{civica,problemi,inglese}.md: mappe migrazione
- test-report-{civica,problemi,inglese}.md: esiti T1-T5
- audit-deadcode.md: cleanup Fase 6
- smoke-final.md: gate finale multi-device + soak
- test-harness.md: harness Playwright
- snapshots/: snapshot prod localStorage per migration testing
