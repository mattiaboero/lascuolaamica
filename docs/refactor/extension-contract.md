## Scopo
Contratto pubblico di `subject-quiz-core.js`. Vincolante per
Fasi 3-5 (migrazione civica/problemi/inglese) e oltre.

## 3 tipi di estensione
| Tipo | Esempio | Cap |
|----------------------------|----------------------|-------|
| Config field passivo | lbKey, totalQ | none |
| Config dato strutturato | classProfiles, areas | none |
| Hook funzione (callback) | onBuildSession | 3 max |

## Hook autorizzati (slot riservati)
1. `onBuildSession(ctx) -> Question[]`
   `ctx: { areas, banks, classKey, history, totalQ }`
   Sostituisce builder default.
2. `onPickBonus(ctx) -> Question`
   `ctx: { type: 'easy'|'medium'|'hard', bonusQuestions }`
3. `onScore(ctx, answer) -> number`
   `ctx: { question, expected, given }`

Stato attuale: `D=0`, nessun hook implementato. Slot riservati
come ABI futuro, non attivati. Implementare solo quando
migrazione concreta lo richiede.

## 5 regole vincolanti
R1. Max 3 hook funzione totali.

R2. Hook = astrazione, non escape hatch. Test: ha senso per
le 5+ materie esistenti? No -> rifiutare.

R3. Default sempre presente. Pattern strategy:
`const build = config.onBuildSession || coreDefaults.build;`
`const qs = build(ctx);`

R4. Config field illimitati, shape condivisa, `undefined =`
feature off.

R5. Vietato in core: `if (config.subject === 'X')`.

## Decision tree (canonico)
1. Esprimibile come dato? -> config field. Stop.
2. Variante logic? -> flag config + branch esistente.
3. Flow diverso? -> hook autorizzato.
4. Niente di sopra? -> page-side pre/post processing.

## Cosa NON conta nel cap
- Campi nuovi a `bonusQuestions`/`banks` schema (`weight`, `tags`).
- Lifecycle event (`onSessionStart`, `onSessionEnd`) per telemetry.
  Cap separato: max 2 lifecycle event.
- Utility esportate (`shuffle`, `pickWeighted`, `softmaxPick`).

## Esempi di reframing applicato (Fase 1)
| Proposta iniziale | Categoria iniziale | Reframing | Categoria finale |
|------------------------------|--------------------|-----------------|------------------|
| normalizeAnswerValue | D (hook) | answerMode | B (config) |
| questionRenderer bilingue | D (hook) | renderMode | B (config) |
| levelStrategy inglese | D (hook) | levels metadata | B (config) + C |
| effects confetti/streak | D (hook) | rinviato | fuori scope F2-5 |

## Bilancio atteso post-migrazione
- Civica: 0 hook. Solo config.
- Problemi: 0 hook. `answerMode` config.
- Inglese: 0 hook. `levels + renderMode` config.
- Totale D usato: 0/3. Margine 3.

## Enforcement
- Code review: PR che aggiunge hook -> richiede ADR scritto.
- Lint pre-publish: grep su `"config.subject ==="` in core -> fail.
- Test guard: aggiungere step in `prepublish-check.sh`.
