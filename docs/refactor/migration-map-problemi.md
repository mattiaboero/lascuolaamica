## Mappa migrazione problemi

### Audit dataset JSON

- `json/problemi.json` usa shape `{ questions: [...] }` ed e` compatibile con `questions-loader`.
- Le righe non bonus hanno tutte `options` con 4 risposte; non serve generazione runtime per la migrazione.
- Le bonus rows sono 9 totali (`easy`/`medium`/`hard`) e hanno gia` `options` valide.
- Tutte le domande mappano sull'unica area reale `problemi`.
- I metadati `class` sono presenti e coprono le classi 2-5.

### Scenario scelto

- Scenario A confermato.
- `answerMode: 'numeric'` richiesto per il confronto risposte.
- `optionsGenerator` non e` richiesto da `problemi`; resta una strategy passiva disponibile nel core ma non consumata da questa materia.

| Problemi oggi | Core dopo |
|---|---|
| `LB_KEY` (`problemiMatematica_lb_v1`) | `cfg.lbKey` |
| `HISTORY_KEY` (`problemiMatematica_history_v2`) | `cfg.historyKey` |
| `METRICS_KEY` (`problemiMatematica_quality_v1`) | `cfg.metricsKey` |
| `CLASS_PREF_KEY` (`problemiMatematica_class_pref_v1`) | `cfg.classPrefKey` |
| nessun `cursorKey` storico | `cfg.cursorKey` namespaced per stato core non storico |
| `CLASS_PROFILES` | default core condiviso |
| `SOFTMAX_TOP_K = 6` | default core storico |
| `SOFTMAX_TEMPERATURE = 1.2` | `cfg.softmaxTemperature = 1.2` |
| `PROBLEMS_POOL` da `hydrateProblemsFromJson()` | `cfg.questionsSource` -> `questions-loader.applySubjectConfig()` |
| `BONUS_QUESTIONS` da JSON | `cfg.questionsSource` + hydration bonus del core |
| `normalizeAnswerValue()` locale | `cfg.answerMode = 'numeric'` |
| `generateOptions()` locale | non usato in migrazione (`options` gia` presenti nel JSON) |
| `buildSessionQuestions()` locale | pipeline core |
| `openBonusQuestion()` locale | flow bonus core |
| `recordRewards()` hardcoded `subject='problemi'` | `cfg.subject` / `cfg.questionsSource.subject` |

### Note compatibilita`

- L'unica area reale e` `problemi`, quindi `defaultArea` puo` essere fissata a `problemi` senza UI area selector.
- La pagina mantiene il `classGrid` statico presente in `problemi.html`.
- La leaderboard storica non contiene il campo `area`; il core deve leggere quelle entry senza romperne il rendering.
