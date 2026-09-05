# Audit C — cuore JS

Slice: `shared.js` (1994 righe), `subject-quiz-core.js` (2761), `sw.js` (298),
`questions-loader.js` (315), `app-version.js` (38).
Letti per intero. Flussi tracciati: avvio quiz, caricamento domande, salvataggio
progressi, service worker + cache, versionamento.
Audit read-only: **nessun file modificato**.

Regola applicata: nel report entra solo ciò per cui esiste uno scenario di rottura
riproducibile. Le ipotesi non verificate sono state scartate (vedi § *Verificato,
non è un bug*).

Conteggio: **3 alte · 5 medie · 6 basse**.

---

## ALTA

### A1 — La sessione "Ripassa i tuoi errori" si pianta sull'ultima domanda
`subject-quiz-core.js:2005` (guardia) · `subject-quiz-core.js:1926-1927` (crash) ·
`subject-quiz-core.js:2431-2444` (origine)

`startRipassa()` costruisce `questions` da `loadWrongQ()` e fa `.slice(0, TOTAL_Q)`:
la lunghezza reale è il numero di errori accumulati, quasi sempre **< 10**.
`checkAnswer()` però avanza confrontando `curQ >= TOTAL_Q` (costante 10), non
`questions.length`.

Scenario: prima partita su /matematica, 3 risposte sbagliate → compare
"Ripassa i tuoi errori (3)" → l'utente lo preme e risponde a tutte e 3.
Dopo la terza, `curQ` vale 3, `3 >= 10` è falso, il timer da 2.2 s chiama
`loadQuestion()` → `const q = questions[3]` è `undefined` → `AREA_LABELS[q.area]`
lancia `TypeError` dentro il callback del `setTimeout`.
Risultato: schermata di gioco congelata sull'ultima domanda con tutti i bottoni
`disabled`, nessuna schermata risultato, nessun punteggio salvato, nessun modo di
uscire se non il back del browser. Con `ensureRipassaBtn()` che mostra il bottone
già a partire da 1 errore, il crash colpisce di fatto ogni utente al primo ripasso.

Fix: in `checkAnswer` usare `const last = Math.min(TOTAL_Q, questions.length)` come
soglia (e `buildDots()` su `questions.length`).

### A2 — Il timer da 2.2 s non viene mai cancellato: si può giocare il bonus a tempo scaduto
`subject-quiz-core.js:2004-2007` · `subject-quiz-core.js:599-612` ·
`subject-quiz-core.js:2222-2226`

`checkAnswer()` accoda `setTimeout(..., 2200)` senza salvarne l'id; nessun percorso
di uscita dal gioco lo annulla.

Scenario 1 (bypass del limite di 30 minuti, il più grave): il bambino risponde alla
decima domanda; entro 2.2 s la play window scade → `handlePlayWindowExpired()`
alza `playWindowExpiryLock`, chiama `goStart()` e apre l'alert "Tempo di gioco
terminato". Il timeout pendente scatta comunque e chiama `openBonusPick()` →
`showScreen('screenBonusPick')`. Chiuso l'alert l'utente si ritrova sulla schermata
bonus, gioca il bonus, `finishGame()` salva il punteggio: il limite parentale è
aggirato.

Scenario 2: durante la partita si preme "🏆 Classifica" (`.header-row`,
`matematica.html:213-214`, fuori dai `.screen` quindi sempre cliccabile) entro
2.2 s da una risposta → 2.2 s dopo `openBonusPick()` strappa l'utente dalla
classifica.

Fix: `let nextStepTimer` a livello di modulo, `clearTimeout(nextStepTimer)` in
`goStart()`, `showLeaderboard()`, `showLevelsScreen()` e in cima a `showScreen()`.

### A3 — Il livello inglese "Campione" è bloccato per tutte le classi
`subject-quiz-core.js:730-736` (semantica AND dei filtri) ·
`js/inglese-page.js:78-81` (`fallbackDifficulty: [4]`)

`questionMatchesLevel()` combina `subareas`, `areas` e `fallbackDifficulty` in **AND**:
una domanda deve soddisfare tutti e tre i filtri presenti.

Verificato sui dati (`json/inglese.json`, 1094 righe): i valori di `difficulty`
presenti sono solo `{1: 211, 2: 436, 3: 438}`. Il livello 3 chiede
`fallbackDifficulty: [4]` → **0 domande corrispondenti** →
`getAvailableLevelsForClass()` restituisce `poolSize: 0, available: false` →
`buildLevelsGrid()` (`:1146-1150`) rende la card `disabled` + `.locked` con
title "Livello non disponibile" per classe 2, 3, 4 e 5. Il percorso avanzato di
inglese è irraggiungibile in produzione.

Effetto collaterale misurato: livello 1 = 49 domande, livello 2 = 64 su 1094 —
i livelli espongono ~10% del bank, e dopo il filtro classe il ramo di padding di
`buildSessionQuestions` (`:1803-1809`) può ripetere la stessa domanda nella stessa
sessione.

Fix: `fallbackDifficulty: [3]` per il livello 3 in `js/inglese-page.js:80`.

---

## MEDIA

### M1 — `prevFocus` è una sola variabile globale: con modali annidate il focus si perde
`shared.js:4` · `shared.js:516` · `shared.js:547-550`

Scenario riproducibile su ogni pagina (footer → "Info"):
1. click su "Info" → `openModal(modalInfoHub)` → `prevFocus = InfoBtn`.
2. click su "Cancella dati locali" → `promptConfirm` → `openModal(modalPromptShared)`
   → `prevFocus = clearDataBtn`, **il riferimento a InfoBtn è perso**.
3. si conferma → `closeModal(PROMPT)` rimette il focus su `clearDataBtn` e azzera
   `prevFocus`.
4. `shared.js:1375` chiama `closeModal(INFO_HUB_MODAL_ID)`: `prevFocus` è `null`,
   nessun ripristino → il focus resta su un bottone dentro un overlay ora
   `aria-hidden="true"` e non renderizzato → il browser lo scarica su `<body>`.

Per un utente da tastiera o screen reader il focus torna in cima al documento dopo
ogni cancellazione dati, e l'alert successivo (`shared.js:1376`) parte da lì.

Fix: sostituire `prevFocus` con uno stack (`const focusStack = []`, push in
`openModal`, pop in `closeModal`).

### M2 — Un secondo prompt annulla silenziosamente il primo
`shared.js:646-648` · `shared.js:993-1009`

`showPromptDialog()` riusa un unico overlay e, se un dialogo è già aperto, esegue
`promptFinalize(false)` risolvendo il precedente come **rifiutato**.

Scenario: il bambino preme "Inizia!" → si apre il confirm "Attiva 30 minuti di gioco".
Nel frattempo è stato pubblicato un deploy: il service worker emette `updatefound` →
`statechange` → `askToUpdate()` chiama `SA.ui.confirm('È disponibile una nuova
versione…')`. Il confirm della play window viene risolto `false`,
`ensurePlayWindowActive()` restituisce `false`, `startGame()` esce senza dire nulla:
la partita non parte e al suo posto compare un dialogo di aggiornamento che il
bambino non ha chiesto.

Fix: accodare i prompt (coda FIFO) invece di risolvere forzatamente il precedente,
oppure ignorare `askToUpdate` mentre `promptFinalize !== null`.

### M3 — I 3.9 MB di immagini premio vengono cancellati a ogni deploy
`sw.js:24` · `sw.js:190` · `sw.js:223-227`

`REWARDS_CACHE_NAME = \`${CACHE_NAME}-rewards\`` eredita la versione
(`app-version.js:5`). In `activate` la regola
`key !== CACHE_NAME && key !== REWARDS_CACHE_NAME` cancella tutto il resto: al bump
`4.12.34 → 4.12.35` la cache `lascuolaamica-v41234-rewards` non corrisponde più al
nuovo nome e viene eliminata.

Scenario: il bambino sblocca dei trofei, apre /premi (57 file in `assets/reward/`,
3.9 MB, cache-first a runtime), poi va offline. Esce una patch, l'utente riapre la
pagina online una volta, il SW si attiva e svuota la cache premi; alla successiva
apertura offline di /premi tutte le immagini sono rotte. Il commento in `sw.js:223-224`
promette esattamente il contrario ("Dopo la prima visita a /premi restano
disponibili offline").

Fix: `const REWARDS_CACHE_NAME = 'lascuolaamica-rewards-v1';` (indipendente dalla
versione app) e aggiungerlo alla whitelist di `activate`.

### M4 — Ogni bump di versione ri-scarica 2.8 MB di precache + i JSON materia
`app-version.js:4-5` · `sw.js:23` · `sw.js:166-195`

`CACHE_NAME` è derivato da `APP_VERSION`, quindi **ogni** release (siamo a 4.12.35)
crea una cache nuova e `activate` cancella la precedente per intero.

Misurato: `CORE_PRECACHE_URLS` + `OPTIONAL_PRECACHE_URLS` = 106 URL, tutti esistenti,
**2.82 MB** (font woff2, mascotte avif/webp/png, 17 OG jpg da ~100 KB, screenshot).
In più spariscono i `json/<materia>.json` salvati a runtime: da 848 KB (scienze) a
1.49 MB (matematica), fino a ~8 MB se il bambino ha aperto tutte le materie.

Scenario: fix di sola copy → bump patch → alla prima apertura online il tablet di
classe ri-scarica 2.8 MB di asset immutati, e la materia che il bambino usava
offline non è più disponibile finché non la riapre in rete.

Fix: separare le cache — una versionata solo per HTML/CSS/JS, una stabile
(non toccata da `activate`) per font, immagini e `json/*.json`.

### M5 — Rescan completo del bank con regex a ogni tap sulla classe
`subject-quiz-core.js:739-744` · `:746-761` · `:719-737` · `:784-801`

`getLevelScopedPool()` non è memoizzata e rifiltra `BANKS[area]` a ogni chiamata;
`questionMatchesLevel()` esegue due `safeText()` per domanda (ognuna una
`String.replace(/\s+/g,' ')` + `trim` + `toLowerCase` + `slice`).

Scenario misurabile su /inglese (1094 domande, 22 aree, 3 livelli): un tap su un
bottone classe esegue `selectClass()` → `getAvailableLevelsForClass()` (1 passata
completa × 3 livelli) → `getFirstAvailableLevelKey()` (**altra** passata completa) →
`buildLevelsGrid()` (**terza**). ≈ 10 000 chiamate a `questionMatchesLevel`, ≈ 20 000
regex, più le allocazioni di `flatMap` su tutto il bank, per un singolo tocco.
`startGame()` ne aggiunge altre 5-7 passate complete via
`getAvailableAreaKeysForClass` + il loop `classPools`. Su tablet scolastici vecchi
il tap sulla classe è percepibilmente in ritardo.

Fix: `const levelPoolCache = new Map()` con chiave `` `${area}|${levelKey}` `` —
i bank sono immutabili dopo `buildNormalizedBanks()`.

---

## BASSA

### B1 — Il messaggio di errore caricamento domande è illeggibile e dura 1.2 s invece di 4.2
`subject-quiz-core.js:2311-2321` · `subject-quiz-core.js:146-153` ·
`subject-quiz-theme.css:1455-1497`

`notifyLoadError()` chiama `showFeedback(false, msg, 4200)`, ma `.feedback.show` usa
`animation: fbPop 1.2s … forwards` e il keyframe `100%` è `opacity: 0`: il testo
sparisce dopo 1.2 s, il parametro `holdMs` è di fatto morto. In più `.feedback` è
`position:fixed; font-size:3.5rem; white-space:nowrap`: la frase di 55 caratteri
"Non riesco a caricare le domande. Controlla la connessione e riprova." occupa
~1500 px centrati su `left:50%`, quindi su un telefono da 390 px deborda da entrambi
i lati e non è leggibile.

Scenario: rete assente al primo caricamento di /storia → `applySubjectConfig` fallisce
→ si preme "Inizia!" → lampeggia per 1.2 s un frammento gigante di testo tagliato.

Fix: mostrare gli errori di caricamento in un `<p>` dentro `#screenStart`, non
attraverso `showFeedback`.

### B2 — "Cancella dati locali" non cancella i dati di Breakout
`shared.js:291-307` · `js/breakout.js:5-7`

`isProjectStorageKey()` whitelista i prefissi `scuolaAmica_`, `englishAdventure_`,
`educazioneCivica_`, `problemiMatematica_`, `matematica_programma_`, `italiano_`,
`storia_`, `scienze_`, `geografia_`, `subject_` e la chiave esatta
`lascuolaamica_rewards_v1`. Restano fuori `lascuolaamica_breakout_highscore_v1`,
`lascuolaamica_breakout_class_v1`, `lascuolaamica_breakout_muted_v1`.

Scenario: il genitore apre Info → "Cancella dati locali", il modale promette
"progressi, classifiche e preferenze salvate su questo dispositivo",
l'alert conferma "Dati rimossi: N" — ma il record di Breakout è ancora lì al
reload. Promessa di cancellazione non mantenuta.

Fix: aggiungere `value.startsWith('lascuolaamica_')` alla whitelist (copre anche
`lascuolaamica_rewards_v1`, rendendo superfluo il confronto esatto).

### B3 — Storico anti-ripetizione scritto in un formato, riletto in un altro
`subject-quiz-core.js:862` (lettura) vs `:1660-1669` (scrittura)

`pickQuestion()` lascia crescere ogni bucket fino a
`max(TOTAL_Q * RECENT_ID_SESSIONS * 3, pool.length * 4, 60)` — per matematica
(pool di area ≈ 400) sono 1600 id per bucket — mentre `loadHistoryStore()` tronca
con `.slice(-300)` al caricamento successivo.

Scenario: si porta `cfg.recentIdSessions` a 40 per irrobustire l'anti-ripetizione →
`recentIdCount = TOTAL_Q * 40 = 400`, ma dopo un reload della pagina ne sopravvivono
300: la finestra anti-ripetizione si tappa silenziosamente a 300 e ogni sessione
scrive in localStorage fino a 1300 id che il caricamento successivo butta via.

Fix: una sola costante `HISTORY_BUCKET_MAX` usata sia in `pickQuestion` sia nello
`slice` di `loadHistoryStore`.

### B4 — Ramo irraggiungibile: `SA.questionsLoader.loadIndex`
`shared.js:1185-1187`

`questions-loader.js:304-311` esporta `load, getSubjectRows, buildBanks,
applySubjectConfig, normalizeKey, clone`. `loadIndex` non esiste: la condizione è
sempre falsa e `fetchQuestionsIndex()` cade sempre sul `fetch('/json/index.json')`
raw. Non produce un doppio download (le uniche pagine con `#questionsTotalCount`
sono `index.html` e `chi-siamo.html`, e nessuna delle due carica
`questions-loader.js`), quindi è puro codice morto.

Fix: eliminare le righe 1185-1187.

### B5 — Codice morto verificato su tutto il repo (23 HTML + js/*.js)
- `questions-loader.js:309-310` — `normalizeKey` e `clone` non hanno alcun call site
  esterno. Le uniche chiamate all'API sono `applySubjectConfig`
  (`subject-quiz-core.js:158`) e `getSubjectRows` (`js/breakout.js:267`); `load` e
  `buildBanks` sono usati solo internamente.
- `shared.js:1941-1943` (`SA.modal.open` / `SA.modal.close`), `:1944-1952`
  (`SA.palette` intero) e `:1968` (`SA.renderQuestionsTotal`) — zero call site.
  `SA.motion` e `SA.ui` invece sono usati (`subject-quiz-core.js:560`, `:570`, `:577`).
- `subject-quiz-core.js:1768` — `cursor[selectedArea] = …` viene scritto e salvato ma
  nessuno lo rilegge: `loadCursor()` produce le chiavi, ma solo `cursor.mixed`
  (`:1571`) e `cursor.__level` (`:826`, `:2728`) vengono letti.
- `js/dom-utils.js:6-16, 24-32` — `show`, `hide`, `toggleClass`, `restartAnimation`:
  zero call site nell'intero repo (vedi § dom-utils qui sotto).

### B6 — Duplicazione residua fra `shared.js` e `subject-quiz-core.js`
Oltre al blocco già segnalato altrove, sono duplicati:
`DEBUG_MODE` (`shared.js:37-45` / `subject-quiz-core.js:35-43`),
`safeInt` (`shared.js:67-71` / `subject-quiz-core.js:374-378`),
il fallback `prefersReducedMotion` (`shared.js:455-464` /
`subject-quiz-core.js:549-556` — qui `isMotionReduced` già delega a
`SA.motion.isReduced()`, resta duplicato solo il fallback).
Nessuno di questi produce un comportamento divergente: sono manutenzione, non bug.

---

## Risposta alle due domande poste

### Divergenza fra le 4 copie di DEBUG_MODE/debugWarn/storageGet/storageSet
**Non causa bug reali.** Confrontate le quattro copie
(`shared.js:37-108`, `subject-quiz-core.js:35-82`, `js/rewards.js:9-55`,
`js/breakout.js:4-25`):

- `shared.js`, `subject-quiz-core.js` e `js/rewards.js` sono identiche riga per riga
  (`DEBUG_MODE`, `debugWarn`, `storageGet`, `storageSet`, `storageRemove`).
- `js/breakout.js` è l'unica divergente: omette `DEBUG_MODE`/`debugWarn` (i `catch`
  sono muti) e non definisce `storageRemove`. Breakout non cancella mai chiavi, quindi
  la funzione mancante non serve, e i suoi `catch` silenziosi in produzione si
  comportano come gli altri (`DEBUG_MODE` è falso fuori da localhost/`?debug`).
- Punto decisivo: tutte e quattro fanno
  `SA.memoryStorage = SA.memoryStorage || Object.create(null)`, quindi condividono
  **lo stesso oggetto**. Con localStorage bloccato (Safari privato, storage pieno) il
  fallback in memoria resta coerente fra i file: `shared.js` scrive
  `scuolaAmica_play_window_v1` e `subject-quiz-core.js` lo rilegge correttamente.

L'unico effetto misurabile è ~101 righe ripetute e il fatto che `js/breakout.js`
non abbia tracce di debug su localhost. Consolidare resta desiderabile, ma non
risolve nessun bug.

### `js/dom-utils.js` vs `premi.html` — riconciliazione con evidenza

Le due letture precedenti sono **entrambe parzialmente sbagliate**. I fatti:

**Chi carica `js/dom-utils.js`** (grep su tutti i 23 HTML): 22 pagine lo caricano —
`index`, `matematica`, `inglese`, `problemi`, `civica`, `geografia`, `storia`,
`scienze`, `italiano`, `tabelline`, `breakout`, `faq`, `accessibilita`, `chi-siamo`,
`per-insegnanti`, `per-genitori`, `ai-info`, `supporta`, `supporto-satispay`,
`privacy`, `cookie`. **Non lo caricano `premi.html` e `404.html`.**
`premi.html:142-144` carica solo `app-version.js`, `js/rewards.js`, `shared.js`.

**Quali funzioni sono davvero usate** (grep `SADom` su tutto il repo, 6 occorrenze):
| funzione | call site | verdetto |
|---|---|---|
| `lockScroll` | `shared.js:519-520`, `shared.js:540-541` | **usata** |
| `randomVariant` | `subject-quiz-core.js:1400-1401`, `js/index-page.js:24-25`, `js/faq-page.js:17-18` | **usata** |
| `show` | — | morta |
| `hide` | — | morta |
| `toggleClass` | — | morta |
| `restartAnimation` | — | morta |

**Cosa si rompe su `premi.html`: niente.** Entrambi i call site di `lockScroll` sono
già difesi da un fallback inline:

```js
// shared.js:519-523
if (window.SADom && typeof window.SADom.lockScroll === 'function') {
  window.SADom.lockScroll(true);
} else {
  document.body.classList.add('modal-open');            // ← ramo che scatta su premi.html
}
```

Su `premi.html` `window.SADom` è `undefined`, quindi parte il ramo `else`, che fa
esattamente la stessa cosa di `dom-utils.lockScroll` (`js/dom-utils.js:20`:
`document.body.classList.toggle('modal-open', !!lock)`). Il CSS che serve è
`body.modal-open { overflow: hidden }` in `utilities.css:13`, e `premi.html:39`
carica `utilities.css`. Le modali su `premi.html` esistono davvero (il footer "Info"
generato da `ensureFooterInfoHub()` e il prompt di `ensurePromptModal()`), e per
entrambe **lo scroll lock scatta correttamente**. Verificato anche `randomVariant`:
su `premi.html` non gira né `spawnShapes()` né `index-page.js`/`faq-page.js`, quindi
non serve.

**Conclusione:** l'audit che dava `show/hide/toggleClass/restartAnimation` per morte
ha ragione (4 funzioni su 6, zero call site). L'audit che temeva una rottura dello
scroll lock su `premi.html` ha torto: il fallback in `shared.js` copre il caso, e
`dom-utils.lockScroll` è di fatto ridondante con quel fallback su **tutte** le pagine.
Il file oggi giustifica la propria esistenza solo per `randomVariant` — anch'essa
con fallback (`'float-v1'` in `subject-quiz-core.js:1402`), quindi degradabile.
Azione minima: cancellare le 4 funzioni morte; azione lazy massima: spostare
`randomVariant` in `shared.js`, eliminare `js/dom-utils.js`, i suoi 22 tag `<script>`
e la voce `/js/dom-utils.js` in `sw.js:43`.

---

## Verificato, non è un bug (per non farlo rifare)

- **Race service worker ↔ fetch delle domande: non esiste.**
  `questions-loader.js:47-66` deduplica per path con `dataPromiseByPath`, quindi
  `applySubjectConfig` e `hydrateBonusQuestionsFromSource` condividono un'unica
  `fetch` di `json/<materia>.json`. Lato SW `cacheFirst` (`sw.js:241-259`) è
  idempotente: due richieste concorrenti fanno due `cache.put` sulla stessa chiave,
  senza corruzione. L'unica doppia richiesta possibile (`shared.js:1188`
  `fetch('/json/index.json')` + loader su `json/index.json`) non si materializza:
  `#questionsTotalCount` esiste solo in `index.html` e `chi-siamo.html`, che non
  caricano `questions-loader.js`, e `renderQuestionsTotal()` esce subito
  (`shared.js:1213-1214`) sulle pagine materia.
- **Ordine di caricamento `app-version.js` / `shared.js`: corretto ovunque.**
  In tutte le pagine `app-version.js` precede `shared.js` (es. `matematica.html:442-443`),
  quindi `shared.js:22` legge la versione reale e la riassegnazione a `shared.js:1981`
  è ridondante ma innocua.
- **Precache che elenca file inesistenti: nessuno.** Verificati tutti i 106 URL di
  `CORE_PRECACHE_URLS` + `OPTIONAL_PRECACHE_URLS` contro il filesystem (con il
  mapping di `_redirects` per le URL senza estensione): 0 mancanti. Quindi
  `cache.addAll(CORE_PRECACHE_URLS)` (`sw.js:169`), che farebbe fallire l'install
  atomicamente su un solo 404, oggi è al sicuro.
- **Listener non passivi su scroll/touch: nessuno** nei 5 file della slice
  (grep `addEventListener('touch|scroll|wheel|resize` → 0 risultati).
- **Listener mai rimossi:** `bindActions()` (`:1280`) è protetto da `_initDone`,
  `bindModalEvents` da `dataset.sharedModalBound/sharedOpenBound/sharedCloseBound`,
  `bindPlayWindowStorageSync` da `SA_FLAGS.playWindowStorageSyncBound`,
  `showPromptDialog` ha `cleanup()` completo. Il `Set` `playWindowSubscribers`
  cresce solo una volta per pannello (`dataset.playWindowReady`).
- **Timer che restano attivi:** `playWindowTicker` (`shared.js:199-213`) viene
  fermato correttamente quando lo stato non è né `active` né `coolingDown`.
- **`area` grezza vs chiave bank in ripassa:** sospettata contaminazione delle
  statistiche via `pushWrongQ` (`:2383`, `area: q.sourceArea || q.area`). Verificato
  su tutti gli 8 dataset: nessun valore di `row.area` differisce dalla propria
  `normalizeKey()`, quindi `sourceArea === area` sempre. Non è un bug.
- **`Escape` con prompt aperto:** l'handler in capture (`shared.js:694`) con
  `stopPropagation()` impedisce correttamente all'handler globale
  (`shared.js:952-955`) di chiudere anche le modali sottostanti.
