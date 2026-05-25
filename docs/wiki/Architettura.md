# Architettura

## Principi di base

Il sito è un'applicazione statica: nessun server applicativo, nessun database, nessuna build framework. Il deploy produce file HTML, CSS, JS e JSON serviti direttamente dalla piattaforma di hosting statico.

Questa scelta non è per semplicità: è per controllabilità. Ogni file che arriva al browser è ispezionabile, ogni comportamento è deterministico, ogni dipendenza è esplicita.

---

## Frontend

**HTML statico per pagina.** Ogni materia ha la propria pagina HTML. Nessun routing lato client, nessun SPA.

**CSS condiviso** con tema accessibile e font self-hosted. I font `.woff2` sono in `assets/fonts/` e referenziati da `fonts.css` — nessuna richiesta esterna a Google Fonts o CDN.

**JavaScript vanilla organizzato per responsabilità.** La logica è suddivisa in file condivisi e file pagina dedicati, così il comportamento resta leggibile e controllabile.

---

## Moduli principali

| File | Ruolo |
|---|---|
| `shared.js` | Footer, modali, log aggiornamenti, palette colori |
| `subject-quiz-core.js` | Motore quiz runtime condiviso per tutte le 8 materie |
| `js/<subject>-page.js` | Config materia dichiarativa (`window.SA.subjectConfig`) |
| `questions-loader.js` | Caricamento e parsing dataset JSON |
| `sw.js` | Service Worker: cache PWA, fallback offline, clean URLs |

---

## Area admin (tool interno)

La cartella `admin/` e uno strumento interno, non una boundary di sicurezza.

- L'autenticazione attuale e client-side (`localStorage` + verifica token nel browser).
- L'hash token pubblicato in `admin/editor-config.js` non equivale a protezione reale.
- Se `admin/` deve essere online, serve protezione infrastrutturale (access policy, basic auth, VPN o equivalente).
- L'export pubblico esclude `admin/` per default.

---

## Quiz engine

- Un solo motore runtime: `subject-quiz-core.js`
- Un file config per materia: `js/<subject>-page.js`
- Dataset domande: `json/<subject>.json` + `json/index.json`
- Materie supportate: matematica, geografia, italiano, scienze, storia, civica, problemi, inglese

### Aggiungere una nuova materia

1. Creare `json/<subject>.json` con shape compatibile con `questions-loader.js`
2. Aggiornare `json/index.json` con path e cardinalita`
3. Creare `js/<subject>-page.js` con `window.SA.subjectConfig = { ... }`
   Campi obbligatori:
   - `subject`
   - `totalQ`
   - `lbKey`
   - `cursorKey`
   - `historyKey`
   - `metricsKey`
   - `classPrefKey`
   - `defaultArea`
   - `areas`
   - `questionsSource`
   Campi opzionali:
   - `classProfiles`
   - `levels`
   - `renderMode`
   - `answerMode`
   - `classMeta`
   - `mixedRepeatLimit`
   - `leaderboardAreaFallback`
4. Creare la pagina HTML seguendo lo scaffold di `civica.html` o `inglese.html`
5. Aggiornare `sitemap.xml` e gli eventuali metadati pagina necessari
6. Eseguire `bash prepublish-check.sh`

### Extension contract

- Hook funzione: 3 slot riservati (`onBuildSession`, `onPickBonus`, `onScore`)
- Stato attuale: `0/3` consumati
- Config field passivi: illimitati
- Vietato nel core: `if (cfg.subject === ...)`
- Riferimento: [docs/archive/refactor-quiz-engine-2026/extension-contract.md](../archive/refactor-quiz-engine-2026/extension-contract.md)

## Algoritmo di selezione domande

Il sistema usa un **planner stocastico a slot** per ridurre i pattern ripetitivi tra sessioni. Per ogni partita:

1. Le domande vengono raggruppate per `area` e `difficoltà`
2. I candidati vengono selezionati con selezione `softmax` (non casuale pura)
3. Un sistema di cooldown su ID e firma domanda riduce le ripetizioni multi-sessione
4. Le metriche di qualità sessione (`repeat rate`, `coverage`, `entropy`, `novelty`) vengono salvate nella memoria locale del browser con media rolling

Tutte le 8 materie usano oggi la stessa pipeline di selezione nel core condiviso, con variazioni espresse solo tramite config field e metadata dei dataset.

---

## Dati

```
json/
├── index.json          # Indice con cardinalità per materia e timestamp
├── matematica.json
├── italiano.json
├── inglese.json
├── problemi.json
├── civica.json
├── geografia.json
├── storia.json
└── scienze.json
```

Il riferimento legacy a `questions.json` (file aggregato) non è usato nel runtime pubblico. I controlli pre-pubblicazione bloccano riferimenti diretti non desiderati.

### Source of truth JSON-only

La source of truth runtime e il caricamento JSON tramite `questions-loader.js`.

- `subject-quiz-core.js` legge i dataset materia da `json/index.json`
- `questions-loader.js` costruisce bank e bonus questions a partire dai JSON materia
- le righe bonus sono marcate con `bonus: true` e bucket `bonusRaw`

---

## Stato utente

Tutto nella memoria locale del browser, tutto locale, niente server:

- Punteggi e progressi per materia/classe
- Preferenze UI (palette, riduzione animazioni)
- Metriche qualità sessione quiz

---

## Service Worker

`sw.js` gestisce:

- **Precache** degli asset statici principali
- **Fallback offline** sulle rotte pubbliche principali
- Strategie differenziate per contenuti statici e dati quiz

### Vincolo di deploy

La PWA e progettata per un **deploy in root del dominio**. Questo vincolo e intenzionale oggi:

- `shared.js` registra il Service Worker su `/sw.js`
- `sw.js` importa `/app-version.js`
- il manifest usa `start_url: "/"` e `scope: "/"`
- le clean URL dipendono da rewrite lato hosting compatibili con [`_redirects`](../../_redirects)

Di conseguenza, un deploy in sottocartella o su GitHub Pages non e considerato supportato senza adattamenti infrastrutturali o refactor dedicato.

### Scelta offline attuale

Per le navigazioni HTML la strategia e **Network First con fallback alla home**. Questo significa che offline, se una rotta non e disponibile in cache, il fallback finale torna a `/` invece di mostrare una pagina offline dedicata.

### Header HTTP critici per i dataset

I file in `/json/*` (dataset domande per materia + `index.json`) richiedono
un header specifico in `_headers`:

```
/json/*
  Cache-Control: public, max-age=0, must-revalidate
  X-Robots-Tag: noindex, nofollow
```

Senza `max-age=0, must-revalidate` il browser potrebbe servire una copia
stale dei JSON anche dopo un upgrade della PWA. Sintomi tipici:

- conteggio domande non aggiornato dopo release dati
- bonus mancanti se un nuovo bucket e stato aggiunto al JSON
- materie con cardinalita incoerente tra index.json e UI

Il flusso atteso ad ogni release dati:

1. APP_VERSION viene bumpato in `app-version.js`
2. `sw.js` ricostruisce la cache con nuovo `CACHE_NAME`
3. al primo accesso post-upgrade il browser rivalida i JSON contro
   l'origine grazie a `must-revalidate`
4. la nuova cache contiene i dataset aggiornati

Il check `check_pwa_cache_headers` in `prepublish-check.sh` verifica
la presenza dell'header `/sw.js` e `/app-version.js` ma non gli header
`/json/*`. La presenza degli header `/json/*` e invece controllata da
`prepublish-check.sh` nella sezione `_headers: split json noindex/cache rules`.

**Regola operativa**: non rimuovere o ammorbidire la riga
`Cache-Control: public, max-age=0, must-revalidate` su `/json/*` senza
una revisione architetturale. Una cache piu aggressiva su questi file
causa drift dati invisibile lato utente.

Riferimenti:
- [_headers](../../_headers) sezione `/json/*`
- [prepublish-check.sh](../../prepublish-check.sh) check
  `_headers: split json noindex/cache rules`
- [sw.js](../../sw.js) per la strategia di cache runtime

---

## Sicurezza

- **Policy di sicurezza restrittive** per ridurre l’esecuzione di contenuti non previsti
- **Header di protezione** applicati a livello infrastrutturale
- **Dati tecnici** esclusi dall’indicizzazione diretta
- Dettagli completi: [Sicurezza, privacy e minori](Sicurezza-Privacy-e-Minori)

---

## Pagine non promosse

`supporto-satispay.html` e mantenuta come pagina secondaria non promossa:

- meta robots `noindex,nofollow`;
- esclusa dalla sitemap;
- raggiungibile tramite link discreto da `supporta.html`.
