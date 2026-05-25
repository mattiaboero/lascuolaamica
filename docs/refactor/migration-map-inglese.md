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

### Contratto cfg.levels (formale)

```js
levels: [
  {
    key: number,
    label: string,
    icon?: string,
    subtitle?: string,
    topics?: string,
    filters: {
      subareas?: string[],
      areas?: string[],
      fallbackDifficulty?: number[]
    }
  }
]
```

Comportamento core atteso:
- `cfg.levels` `undefined` -> il core skippa la levels UI e mantiene il flow standard della materia
- `cfg.levels` valorizzato -> il core abilita levels screen e filtra le domande usando `filters.subareas` come trigger primario
- se `subareas` non basta o il metadata manca in alcune domande, il fallback usa `filters.fallbackDifficulty`

Vincoli:
- almeno 1 livello richiesto se `cfg.levels` e` presente
- ogni livello deve avere `key` univoco
- ogni livello deve avere `filters` non vuoto
- validazione shape al boot: se il contratto e` invalido il core deve fallire in modo esplicito

Decisione implementativa:
- il loader dovra` preservare `subarea` nel runtime Question
- questa estensione resta passiva e verra` implementata in Fase 5 step 1, non in questo pre-step

#### Render mode

### Contratto cfg.renderMode (formale)

Valori validi:
- `'mcq'` (default) -> rendering standard testuale
- `'bilingual'` -> rendering EN/IT con helper dedicati

#### Comportamenti renderMode='bilingual'

1. **Prompt con quote `lang="en"`**
   - trigger: presenza di porzioni inglesi nel testo prompt
   - rendering core: helper `renderPromptBilingual(text)` che wrappa i segmenti EN in `<span lang="en">...</span>`

2. **Options in EN per domande “Come si dice in inglese?”**
   - trigger atteso: metadata domanda `answerLang: 'en'`
   - rendering core: buttons con `lang="en"` e testo EN

3. **Options in IT per domande “Cosa significa...?”**
   - trigger atteso: metadata domanda `answerLang: 'it'`
   - rendering core: buttons standard senza `lang`

Fallback:
- se `renderMode='bilingual'` ma `answerLang` manca, il core usa un fallback safe basato sul tipo domanda o sul contenuto testuale, senza crash
- se `renderMode='mcq'`, il metadata `answerLang` viene ignorato

Decisione:
- nel dataset `json/inglese.json` oggi non esiste un campo `answerLang`
- per Fase 5 si adotta come target il campo esplicito `answerLang` nel JSON, preferito rispetto a euristiche runtime fragili
- il build dei dataset dovra` essere aggiornato in Fase 5 se serve popolare questo campo in modo sistematico

Questa resta una variante `B/C`, non hook.

### Availability livelli per classe — algoritmo

Input:
- `cfg.levels[*]`
- classe selezionata
- bank runtime con metadata `grade` / `class` e `subarea`

Algoritmo target:

```text
for each level in cfg.levels:
  pool = filter(bank, level.filters)
  if pool empty: level.available = false; continue
  minDistance = min(|grade(q) - selectedClass| for q in pool)
  level.available = minDistance <= MAX_LEVEL_DISTANCE
```

Default:
- `MAX_LEVEL_DISTANCE = 2`
- config opzionale: `cfg.maxLevelDistance`

Output UI:
- livello disponibile -> bottone abilitato
- livello non disponibile -> bottone disabilitato + messaggio "non disponibile per questa classe"
- `0` livelli disponibili -> empty state esplicito, nessun crash

Questa logic vive nel core solo quando `cfg.levels` e` presente. Le materie senza levels non eseguono questo ramo.

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

### Decisione cursorKey inglese

Storage prod `4.6.8` non ha `cursorKey` storica.

Decisione per Fase 5:
- **non** lasciare `cfg.cursorKey` implicito
- dichiarare esplicitamente `cfg.cursorKey = 'englishAdventure_cursor_v1'`

Razionale:
- il core oggi non costruisce un fallback subject-prefixed; se omesso usa il namespace statico `subject_cursor_v1`
- documentare un fallback "magico" derivato da subject sarebbe falso rispetto al codice attuale
- esplicitare la chiave evita collisioni future e mantiene leggibile la config inglese

Conseguenze:
- nessuna migrazione storage storica richiesta, perche` `cursorKey` non esisteva in prod
- nuova chiave runtime isolata e coerente con il naming della materia
- T1 Fase 5 dovra` verificare che lo snapshot prod `4.6.8` continui a ripristinare leaderboard, history, metrics e class preference senza dipendere dal cursor

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
| nessun cursor storico | `cfg.cursorKey = 'englishAdventure_cursor_v1'` |
| `englishAdventure_history_v2` | `cfg.historyKey` |
| `englishAdventure_quality_v1` | `cfg.metricsKey` |
| `englishAdventure_class_pref_v1` | `cfg.classPrefKey` |

### Delta critici da tenere d'occhio in Fase 5

- il core oggi non ha concetto di `levels`
- `questions-loader.rowToQuestion()` non conserva `subarea`, quindi la Fase 5 dovra` decidere dove tenere il metadata livello senza ricadere in adapter locale monouso
- il rendering bilingue non e` solo “testo inglese”: dipende anche dal tipo di prompt e dalla lingua delle risposte
- `answerLang` oggi non e` presente nel JSON: decisione presa, target esplicito di metadata in Fase 5
