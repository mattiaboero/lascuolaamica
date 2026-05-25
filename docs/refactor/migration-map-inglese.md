## Mappa migrazione inglese

### Audit dataset JSON

- `json/inglese.json` usa shape `{ questions: [...] }` compatibile con `questions-loader`.
- Le righe non bonus hanno gia` `options` con 4 risposte; non serve `optionsGenerator`.
- Le bonus rows sono 9 totali (`easy`/`medium`/`hard`) e hanno `options` valide.
- Sono presenti metadati utili:
  - `class`
  - `area`
  - `subarea`
  - `difficulty`
- Le aree non sono separate per livello: le stesse `17` aree compaiono nei livelli 1, 2 e 3.
- Il vero discriminante dei livelli e` soprattutto `subarea`:
  - `lessico_base` -> livello 1
  - `frasi_semplici` -> livello 2
  - `uso_guidato` -> livello 3
  - `comprensione_in_contesto` -> livello 3

### Scenario scelto

- `renderMode: 'bilingual'` per portare nel core:
  - rendering prompt con porzioni inglesi marcate `lang="en"`
  - answer button in inglese o italiano a seconda del tipo domanda
- `levels` come config field strutturato, non come hook:
  - il livello non va modellato come semplice lista di aree
  - va modellato come filtro metadata-driven su domande (`subarea` e fallback `difficulty`)
- `questionsSource` dovra` quindi conservare metadati sufficienti per filtrare per livello senza callback page-side.

### Decisioni levels/renderMode

#### Levels

Shape proposta:

```js
levels: [
  {
    key: 1,
    label: 'Principiante',
    icon: '🌊',
    subtitle: 'Percorso base',
    topics: 'Colori · Numeri · Animali · Corpo umano · Famiglia · Saluti',
    filters: {
      subareas: ['lessico_base'],
      fallbackDifficulty: [1]
    }
  },
  {
    key: 2,
    label: 'Esploratore',
    icon: '🤿',
    subtitle: 'Percorso intermedio',
    topics: 'Giorni · Meteo · Cibo · Mesi · Verbo to be e have got',
    filters: {
      subareas: ['frasi_semplici'],
      fallbackDifficulty: [2]
    }
  },
  {
    key: 3,
    label: 'Campione',
    icon: '🦈',
    subtitle: 'Percorso avanzato',
    topics: 'Routine quotidiana · Sport · Casa · Domande · Hobby',
    filters: {
      subareas: ['uso_guidato', 'comprensione_in_contesto'],
      fallbackDifficulty: [3]
    }
  }
]
```

Nota:
- la disponibilita` livello per classe oggi non e` hardcoded via `classMin/classMax`
- e` calcolata sulla distanza minima tra i gradi reali presenti nel livello e la classe selezionata
- la Fase 5 dovra` mantenere questa semantica nel core

#### Render mode

`renderMode: 'bilingual'` deve coprire:
- prompt con parti in italiano e quote inglesi
- option buttons in inglese quando la domanda chiede “Come si dice in inglese?”
- option buttons in italiano quando la domanda chiede “Cosa significa ...?”

Questa e` una variante di rendering condivisibile e quindi resta categoria `B/C`, non hook.

#### Fuori scope Fase 5

- confetti
- streak FX/audio dedicati
- `playStart` / polish animazioni

Restano page-polish o fase successiva, non necessari per consolidare il motore decisionale.

### Storage keys prod

Chiavi confermate in produzione live (`https://lascuolaamica.it/inglese`, versione `4.6.8` verificata il `2026-05-25`):

- `englishAdventure_lb_v2`
- `englishAdventure_history_v2`
- `englishAdventure_quality_v1`
- `englishAdventure_class_pref_v1`

Nessun `cursorKey` storico presente in produzione.

### Tabella mapping

| Inglese oggi | Core dopo |
|---|---|
| `QB` | `cfg.banks` / dataset JSON con metadata livello |
| `BONUS_Q` | `cfg.bonusQuestions` da JSON |
| `ENGLISH_LEVEL_FROM_SUBAREA` | `cfg.levels[*].filters.subareas` |
| `hydrateEnglishFromJson()` | rimosso, hydration nel core/loader |
| `appendEnglishText()` | helper core attivato da `renderMode: 'bilingual'` |
| `renderPromptText()` | helper core attivato da `renderMode: 'bilingual'` |
| `answerOptionsUseEnglish()` | regola core legata a `renderMode: 'bilingual'` |
| `refreshLevelButtonsForClass()` | core gestisce availability livelli |
| `goLevels()` | core navigation livelli |
| `buildSessionQuestions(lvl)` | core pipeline con filtro per livello |
| `englishAdventure_lb_v2` | `cfg.lbKey` |
| nessun cursor storico | `cfg.cursorKey` esplicito nuovo namespace runtime |
| `englishAdventure_history_v2` | `cfg.historyKey` |
| `englishAdventure_quality_v1` | `cfg.metricsKey` |
| `englishAdventure_class_pref_v1` | `cfg.classPrefKey` |

### Delta critici da tenere d'occhio in Fase 5

- il core oggi non ha concetto di `levels`
- `questions-loader.rowToQuestion()` non conserva `subarea`, quindi la Fase 5 dovra` decidere dove tenere il metadata livello senza ricadere in adapter locale monouso
- il rendering bilingue non e` solo “testo inglese”: dipende anche dal tipo di prompt e dalla lingua delle risposte
