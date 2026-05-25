# Audit dead code — Fase 6

## Scope
- Branch analizzato: `refactor/quiz-engine-consolidation`
- Commit di partenza audit: `27f4d01`
- Obiettivo: verificare che dopo la consolidazione a core unificato non restino helper duplicati, costanti legacy o file JS inattesi nelle page materia.

## Comandi eseguiti

### 1. Helper duplicati nelle page
```bash
grep -nE "function (shuffle|pickWeighted|softmaxPick|normalizeKey|normalizeAnswerValue|generateOptions|buildSessionQuestions|openBonusQuestion|hydrate.*FromJson)" js/*.js subject-quiz-core.js questions-loader.js
```

Esito:
- match presenti solo nei file shared:
  - `subject-quiz-core.js` -> `pickWeighted`, `buildSessionQuestions`, `openBonusQuestion`, `shuffle`
  - `questions-loader.js` -> `normalizeKey`
- `0` definizioni residue nelle 8 `js/<subject>-page.js`

### 2. Costanti legacy residue
```bash
grep -nE "^const (BANK|BONUS|POOL|ENGLISH|CIVICA|PROBLEMS)_" js/*.js subject-quiz-core.js
```

Esito:
- `0` match

### 3. Commenti obsoleti
```bash
grep -rn "TODO migrazione\|LEGACY\|DEPRECATED\|FIXME refactor\|XXX" js/ subject-quiz-core.js questions-loader.js
```

Esito:
- `0` match

### 4. File JS inattesi
```bash
ls js/ | grep -vE "^(matematica|geografia|italiano|scienze|storia|civica|problemi|inglese|index|dom-utils|faq)-page\.js$|^rewards\.js$|^quiz-utils\.js$"
```

Esito:
- output: `dom-utils.js`
- classificazione: atteso, file shared usato dalle pagine pubbliche
- `0` file page orfani o inattesi

## Verifica size pages
Conteggio righe finale:

| File | Righe |
|---|---:|
| `js/matematica-page.js` | 122 |
| `js/geografia-page.js` | 106 |
| `js/italiano-page.js` | 107 |
| `js/scienze-page.js` | 113 |
| `js/storia-page.js` | 119 |
| `js/civica-page.js` | 81 |
| `js/problemi-page.js` | 39 |
| `js/inglese-page.js` | 104 |

Tutte sotto la soglia Fase 6 di `250` righe.

## Quick win utils consolidation
Verifica eseguita:

```bash
grep -nE "window\.SA\.(shuffle|pickWeighted|softmaxPick|normalizeKey)|SA\.utils" *.js js/*.js subject-quiz-core.js questions-loader.js
```

Esito:
- `0` match
- nessuna utility shared pubblica gia` esposta come `window.SA.utils`
- nessuna necessità immediata di estrarre `js/quiz-utils.js` in Fase 6

Decisione:
- **Scenario A effettivo**: nessuna estrazione utility necessaria
- motivazione: le utility private del core non sono duplicate nelle page e non esiste un consumer esterno che richieda una API shared separata

## Conclusione
- dead code residuo nelle 8 page: `0`
- costanti legacy residue: `0`
- commenti obsoleti di migrazione: `0`
- file JS orfani inattesi: `0`
- estrazione utils dedicata: **non necessaria**

Esito complessivo: `PASS`
