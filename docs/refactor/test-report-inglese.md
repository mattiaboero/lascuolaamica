# Test report Fase 5 — inglese

## Scope
- Branch testato: `refactor/quiz-engine-consolidation`
- Server locale: `python3 -m http.server 4173`
- Harness: [scripts/subject_quiz_test_harness.js](../../scripts/subject_quiz_test_harness.js)
- Snapshot storage: [inglese-prod-4.6.8.json](./snapshots/inglese-prod-4.6.8.json)

## T1 — Storage migration
- Snapshot importato su browser pulito prima di aprire `inglese.html`.
- Chiavi storiche verificate in bootstrap:
  - `englishAdventure_lb_v2`
  - `englishAdventure_history_v2`
  - `englishAdventure_quality_v1`
  - `englishAdventure_class_pref_v1`
- Stato iniziale confermato:
  - leaderboard storica visibile con `3` entry
  - `classPref = 5`
  - `englishAdventure_cursor_v1 = null` prima della prima sessione
  - history buckets preservati: `3|lvl-1`, `4|lvl-2`, `5|lvl-3`
  - quality sessions preservate: `3`
- Dopo una sessione locale:
  - leaderboard estesa a `4` entry
  - quality sessions estese a `4`
  - `classPref` rimasta `5`
  - `englishAdventure_cursor_v1` creata correttamente con `__level = "3"`
- Nessun `pageerror`
- Nessun `console.error`

Esito: `PASS`

## T2 — Funzionale per livelli

### Livello 1 — Principiante
- run `perfect` classe `2`, bonus `easy`
  - finale `500`, corrette `10`, sbagliate `0`
- run `mixed` classe `2`, bonus `medium`, sessione A
  - finale `600`, corrette `6`, sbagliate `4`
- run `mixed` classe `2`, bonus `medium`, sessione B
  - finale `600`, corrette `6`, sbagliate `4`
- run `worst` classe `2`, bonus `hard`
  - finale `0`, corrette `0`, sbagliate `10`
- aggregato livello:
  - `40` domande normali verificate
  - subarea osservata: solo `lessico_base`
  - grade osservato: solo `2`
  - `answerLang`: solo `en`
  - run massimo consecutivo stessa area: `2`
  - `mixed` aggregato `12/20 = 60%`

### Livello 2 — Esploratore
- run `perfect` classe `3`, bonus `easy`
  - finale `500`, corrette `10`, sbagliate `0`
- run `mixed` classe `3`, bonus `medium`, sessione A
  - finale `800`, corrette `8`, sbagliate `2`
- run `mixed` classe `3`, bonus `medium`, sessione B
  - finale `800`, corrette `8`, sbagliate `2`
- run `worst` classe `3`, bonus `hard`
  - finale `0`, corrette `0`, sbagliate `10`
- aggregato livello:
  - `40` domande normali verificate
  - subarea osservata: solo `frasi_semplici`
  - grade osservato: solo `3`
  - `answerLang` osservato:
    - `39` domande `en`
    - `1` domanda `it` nel run `mixed-b`
  - esempio risposta in italiano osservata:
    - prompt: `It is sunny today.`
    - `promptHtml`: `<span lang="en">It is sunny today.</span>`
    - `optionLangs`: `["", "", "", ""]`
  - run massimo consecutivo stessa area: `2`
  - `mixed` aggregato `16/20 = 80%`

### Livello 3 — Campione
- run `perfect` classe `5`, bonus `easy`
  - finale `500`, corrette `10`, sbagliate `0`
- run `mixed` classe `5`, bonus `medium`, sessione A
  - finale `600`, corrette `6`, sbagliate `4`
- run `mixed` classe `5`, bonus `medium`, sessione B
  - finale `800`, corrette `8`, sbagliate `2`
- run `worst` classe `5`, bonus `hard`
  - finale `0`, corrette `0`, sbagliate `10`
- aggregato livello:
  - `40` domande normali verificate
  - grade osservato: solo `5`
  - subaree osservate:
    - `comprensione_in_contesto`: `37`
    - `uso_guidato`: `3`
  - `answerLang` osservato:
    - `39` domande `en`
    - `1` domanda `it` nel run `worst`
  - esempio bonus bilingue verificato:
    - bonus hard: `Bonus hard: traduci "I wake up at seven".`
    - `promptHtml`: `Bonus hard: traduci <span lang="en">"I wake up at seven".</span>`
    - `optionLangs`: `["", "", "", ""]`
  - run massimo consecutivo stessa area: `2`
  - `mixed` aggregato `14/20 = 70%`

Verifiche trasversali confermate:
- `renderMode='bilingual'` attivo:
  - prompt inglesi wrappati in `<span lang="en">`
  - opzioni EN con `lang="en"`
  - opzioni IT senza attributo `lang`
- `bonus easy`, `medium`, `hard` tutti pickabili e risolti
- nessun `pageerror`
- nessun `console.error`

Esito: `PASS`

## T3 — Availability livelli e edge UI
- Classe `2`:
  - livello `3` disabilitato
  - tooltip: `Livello non disponibile per Classe 2ª`
  - click sul bottone disabilitato: screen resta `screenLevels`, nessun crash
- Classe `5`:
  - livello `1` disabilitato
  - tooltip: `Livello non disponibile per Classe 5ª`
  - click sul bottone disabilitato: screen resta `screenLevels`, nessun crash
- Empty state:
  - con dataset reale `2ª-5ª` non si arriva a `0` livelli disponibili
  - ramo verificato con override di test sui filtri levels:
    - `3` card renderizzate
    - tutte `disabled`
    - `levelsEmptyState` visibile con testo `Nessun livello disponibile per Classe 3ª.`

Esito: `PASS`

## T4 — Regressione 7 materie già migrate
- `matematica`
  - `perfect/easy` -> `500`, `10/0`
  - `mixed/easy` -> `70`, `7/3`
  - `worst/easy` -> `0`, `0/10`
- `geografia`
  - `perfect/medium` -> `1000`, `10/0`
  - `mixed/medium` -> `300`, `3/7`
  - `worst/medium` -> `0`, `0/10`
- `italiano`
  - `perfect/hard` -> `2500`, `10/0`
  - `mixed/hard` -> `1750`, `7/3`
  - `worst/hard` -> `0`, `0/10`
- `scienze`
  - `perfect/skip` -> `100`, `10/0`
  - `mixed/skip` -> `80`, `8/2`
  - `worst/skip` -> `0`, `0/10`
- `storia`
  - `perfect/easy` -> `500`, `10/0`
  - `mixed/easy` -> `350`, `7/3`
  - `worst/easy` -> `0`, `0/10`
- `civica`
  - `perfect/medium` -> `1000`, `10/0`
  - `mixed/medium` -> `700`, `7/3`
  - `worst/medium` -> `0`, `0/10`
- `problemi`
  - `perfect/hard` -> `2500`, `10/0`
  - `mixed/hard` -> `70`, `7/3`
  - `worst/hard` -> `0`, `0/10`

Tutti i `21` run hanno chiuso con:
- `pageErrors = 0`
- `consoleErrors = 0`
- nessuna comparsa di levels UI sulle materie che non dichiarano `cfg.levels`
- nessuna regressione visibile da `questions-loader` esteso con `subarea + answerLang`

Esito: `PASS`

## T5 — Check automatici
- `node --check questions-loader.js` -> ok
- `node --check subject-quiz-core.js` -> ok
- `node --check js/inglese-page.js` -> ok
- `node --check scripts/subject_quiz_test_harness.js` -> ok
- `python3 -m py_compile build_questions_json.py` -> ok
- `python3 scripts/sync_csp_hashes.py` -> `[OK] _headers aggiornato con 40 hash script`
- `node scripts/audit_questions_json.js` -> ok
- `bash prepublish-check.sh` -> verde dopo bump `4.8.0`
- `check_core_no_subject_branch` -> verde
- `check_cursor_key_explicit` -> verde su tutte le 8 page
- `json/inglese.json`
  - rows totali: `463`
  - `answerLang` valorizzato su tutte le rows
  - distribuzione: `448` `en`, `15` `it`

Esito: `PASS`

## Note
- Per l’inglese il filtro livelli e` stato reso metadata-driven usando la combinazione dei metadata disponibili (`subarea`, `area`, `difficulty`) senza introdurre hook funzione.
- Il ramo `empty state` dei livelli e` stato validato con override di test controllato, perche` con il dataset reale e le classi utente `2ª-5ª` esiste sempre almeno un livello disponibile.
- La produzione storica inglese salva leaderboard in scala `10`; il core config-driven usa il punteggio shared del ramo refactor (`10` punti per risposta + moltiplicatore bonus). Lo snapshot storico resta leggibile e non viene corrotto.
