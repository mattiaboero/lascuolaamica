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
| `js/rewards.js` | Bacheca premi: badge/coppe/trofei, salvataggio locale |

---

## Coupling `subject-quiz-core.js` ↔ `js/rewards.js`

`js/rewards.js` è incluso con `defer` in **tutte** le pagine HTML (non solo `premi.html`), non solo dove serve. Nessun `import`/chiamata diretta tra i due file: sono disaccoppiati a compile-time e comunicano solo a runtime tramite `window.SA` + eventi DOM. Scelta deliberata, non un gap — un grafo di dipendenze statico (AST) non troverà mai un edge tra questi due file.

**Flusso:**

1. `rewards.js` si registra su `window.SA.rewards = { recordGame, ... }` al caricamento.
2. A fine partita, `subject-quiz-core.js` chiama con guard difensivo:
   ```js
   if (!window.SA || !window.SA.rewards || typeof window.SA.rewards.recordGame !== 'function') return;
   window.SA.rewards.recordGame({ ... });
   ```
   Se `rewards.js` non è caricato per qualche motivo, la chiamata viene saltata senza crash.
3. Quando `recordGame()` sblocca un badge, `rewards.js` dispatcha `document.dispatchEvent(new CustomEvent('sa:rewards-updated', { detail: { unlocked, state } }))`.
4. `rewards.js` stesso riascolta `sa:rewards-updated` per ridisegnare la bacheca (`renderBoard()`), utile se `premi.html` è aperta in un'altra tab o dopo un aggiornamento asincrono.

**Perché non un import diretto**: ogni pagina materia carica `rewards.js` indipendentemente da `subject-quiz-core.js`; il contratto è sul namespace globale `window.SA`, non sul grafo di file. Aggiungere un nuovo consumer di eventi rewards (es. una nuova bacheca) richiede solo ascoltare `sa:rewards-updated`, zero modifiche a `subject-quiz-core.js`.

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

## Funzioni quiz (A1-A4, B1, C1)

Aggiunte in `subject-quiz-core.js`, condivise da tutte le 8 materie senza branch per subject:

| Funzione | Comportamento | Chiave storage / opt-out |
|---|---|---|
| A1 — Spiegazione risposta | Dopo ogni risposta appare `#qExplanation` con il campo `explanation` della domanda JSON, colorata in base a corretto/sbagliato | nessuna |
| A2 — Difficoltà adattiva | A fine partita calcola una media mobile esponenziale (EMA) per classe e la usa per pesare la selezione delle domande successive | `${CURSOR_KEY}_adapt_v1`; opt-out con `cfg.adaptiveDifficulty: false` |
| A3 — Ripassa i tuoi errori | Le domande sbagliate (max 30) restano disponibili per una sessione dedicata dalla schermata iniziale | `${CURSOR_KEY}_wrong_q_v1` |
| A4 — Filtro sotto-ambito | Dopo la selezione dell'area, una griglia di sotto-ambiti derivata dinamicamente dal dataset (nessuna config per materia necessaria) | nessuna |
| B1 — Streak feedback | Risposte corrette consecutive: alle soglie configurate (default 3/5/8) messaggio dedicato + mascotte `celebrate` invece di `happy` | `cfg.streakMilestones` per personalizzare le soglie |
| C1 — Overlay progressi | Pulsante "Progressi" nella schermata risultati apre statistiche per classe/area e le ultime partite | legge `loadStats()`/`loadLB()` esistenti |

Riferimento storico: `CHANGELOG.md` release 4.11.0 e 4.12.0.

---

## Gioco arcade: Cervellino Spacca-Muri

`/breakout` (`breakout.html` + `breakout.css` + `js/breakout.js`) è un rompi-mattoni ispirato a Breakout/Arkanoid, motore Canvas 2D vanilla **indipendente da `subject-quiz-core.js`**: non fa parte del quiz engine unificato, non usa `window.SA.subjectConfig`, non consuma `onBuildSession`/`onPickBonus`/`onScore`.

**Punti di contatto con il resto del sito:**

- **Domande**: usa `questions-loader.js` (`SA.questionsLoader.getSubjectRows`) per pescare dagli stessi `json/<materia>.json` delle 8 materie, filtrati per classe a inizio partita. Nessun dataset dedicato al gioco.
- **Premi**: `js/rewards.js` espone `recordBreakout()` accanto a `recordGame()` — stesso `STORAGE_KEY`/stessa bacheca (`premi.html`), ma sotto-stato (`state.breakout`) e contatori separati da quelli quiz, così giocare non altera "partite totali" o "materie giocate". Registrazione **progressiva** durante la partita (muro abbattuto, salvataggio, nuovo bonus scoperto), non solo a fine partita, per non perdere il progresso se si esce con "Ricomincia"/"Cambia classe"/timer scaduto/cambio scheda — vedi `flushBreakoutProgress()` in `js/breakout.js`, invio a delta e idempotente sul conteggio partite.
- **Service Worker**: `/breakout`, `breakout.css`, `js/breakout.js` sono in `OPTIONAL_PRECACHE_URLS` di `sw.js`, stesso trattamento delle pagine materia.
- **Grafica**: mattoni/pallina/barra disegnati su canvas con gradienti pre-renderizzati (sprite offscreen riusati via `drawImage`, non ridisegnati ogni frame). Palette mattoni più vivace dei token testo del sito (lecito: sono grafica di gioco, soglia WCAG 1.4.11 non-text 3:1, non 4.5:1), con token separati (`--breakout-feedback-ok`/`-ko`) per gli usi testuali (overlay risposta, punteggio volante, simbolo capsula) che restano a 4.5:1. Effetti decorativi (particelle, squash/stretch, wobble capsula) rispettano il toggle "riduci animazioni" e `prefers-reduced-motion`; la fisica di gioco non ne è mai influenzata. Modalità Okabe-Ito: stessi 4 colori mattone certificati, nessuna differenza.
- **Accessibilità**: overlay domanda con focus trap dedicato (Tab/Shift+Tab intrappolati nel dialog, focus iniziale sulla prima opzione, ripristino del focus precedente alla chiusura) — `aria-modal` da solo non impedisce a Tab di uscire dal dialog nei browser.

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

- **Precache** degli asset statici principali all'install
- **Precache lazy per i dataset materia** — `json/index.json` è precached all'install (serve alla home per il conteggio totale); i `json/<materia>.json` (~1MB ciascuno) NON sono precached: vengono salvati offline al primo fetch reale di quella materia, per non forzare il download di tutte le 8 materie a chi ne gioca una sola
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
