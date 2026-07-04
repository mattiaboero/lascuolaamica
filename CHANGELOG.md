# Changelog Repo

## 4.12.20 - 2026-07-04

### Fixed
- fix(a11y-audit): audit manuale oltre Lighthouse (R6) — trovato un bug reale non rilevabile da tool automatici. Il pannello "Tempo di gioco" (`shared.js`, `ensurePlayWindowPanel`) aveva `aria-live="polite"` + `aria-atomic="true"` sull'intera `<section>`, e il countdown al suo interno si aggiorna ogni secondo per tutta la sessione di 30 minuti: uno screen reader avrebbe riletto l'intero paragrafo ("Timer attivo: puoi giocare liberamente...") una volta al secondo, non stop, mentre si gioca. Rimosso `aria-live` dalla sezione; aggiunta una regione `sr-only` dedicata che annuncia solo ai cambi di fase reali (idle → attivo → cooldown → scaduto), non ai tick del countdown. Verificato con simulazione isolata: 4 annunci su 7 render (3 tick nella stessa fase correttamente silenziosi).
- fix(a11y-audit): i pulsanti risposta corretta/sbagliata comunicavano lo stato solo via icona CSS `::after` (`✓`/`✕`, content generato via CSS — non affidabilmente esposto agli screen reader) e classe colore. Aggiunto helper `markAnswerState()` in `subject-quiz-core.js` che aggiorna anche `aria-label` del bottone (" (risposta corretta)"/" (risposta sbagliata)") per entrambi i flussi domanda standard e bonus. Nota: un primo tentativo aggiungeva uno `span.sr-only` come figlio, ma i bottoni risposta hanno sempre `aria-label` esplicito impostato da `renderAnswerButtonText` (anche in modalità bilingue) che sovrascrive qualsiasi contenuto figlio nel nome accessibile — corretto per aggiornare `aria-label` direttamente. Verificato con simulazione isolata su caso standard e bilingue.
- fix(a11y-audit): aggiunto `role="status"` mancante su `#qExplanation` (creato dinamicamente da A1) per coerenza con `#feedback`, che lo ha già nel markup statico.
- chore: bump versione `4.12.19` → `4.12.20` (JS precachato modificato).

## 4.12.19 - 2026-07-04

### Fixed
- fix(a11y-contrasto): `#questionsTotalCount` (contatore domande nel footer di `index.html`/`chi-siamo.html`) falliva WCAG AA — `.footer-meta` (`utilities.css`) applicava `opacity: 0.78` sopra il colore già conforme di `.footer-link`, portando il contrasto reale da 5.43:1 a 3.62:1 (rilevato da Lighthouse su `chi-siamo`, unica pagina delle 5 monitorate sotto 1.0 in accessibilità). Rimossa l'opacity: l'opacità su testo si mescola col colore di sfondo sottostante e ne abbassa il contrasto in modo dipendente dalla superficie, un pattern fragile per elementi mostrati su più pagine/contesti. Verificato in preview: colore reso `rgb(110,99,87)`, contrasto 5.86:1.
- chore(css): rimossi da `tokens.css` i token dichiarati nella Fase 0 del restyle Wada Sanzo e mai consumati da nessuna regola: `--radius-sm`, `--radius-pill`, `--space-1..5`, `--fs-h1/h2/body/q/small`, `--lh-tight/body`, `--fw-body/strong/btn`, `--shadow-btn`, `--t-fast/base`, `--ws-shadow-warm` (14 dichiarazioni). Verificato con grep su tutti i CSS/JS/HTML prima della rimozione; i token realmente usati (`--radius-md/lg`, `--shadow-card`, tutti i `--ws-*` rimanenti, `--subj-*`, `--info-blue*`) restano invariati.
- chore: bump versione `4.12.18` → `4.12.19` (CSS precachato modificato).

## Non rilasciato

### Fixed
- docs: `docs/wiki/Home.md` riportava ancora "7.375 domande" (reale 9.879) e `CONTRIBUTING.md` la stessa cifra stale più un elenco "aree meno coperte" (inglese/civica/problemi) non più accurato — verificato via `json/index.json` che oggi le aree più scoperte sono scienze (1.024) e inglese (1.094), non civica (1.121) né problemi (1.361, seconda materia più coperta). Corretti entrambi; `CONTRIBUTING.md` ora rimanda a `reports/coverage.md` invece di elencare cifre che si stanno per sfasare di nuovo.
- docs: `docs/wiki/Architettura.md` non documentava nessuna delle funzioni quiz A1-A4/B1/C1 (spiegazione risposta, difficoltà adattiva, ripassa errori, filtro sotto-ambito, streak feedback, overlay progressi) né la strategia di precache lazy dei JSON materia introdotta in 4.12.12. Aggiunta tabella funzioni con chiavi storage/opt-out e nota sw.js aggiornata.
- docs: `README.md` sezione "Come funziona" non menzionava le stesse funzioni quiz A1-A4/B1/C1. Aggiunto paragrafo riassuntivo.
- fix(gate): `relevant_paths` in `check_pwa_version_bump_for_precache_changes` (`prepublish-check.sh`) usava il pattern bare `*.js`, che secondo la semantica pathspec di git matcha anche file in sottocartelle come `scripts/*.js` — non precachati, mai pensati per triggerare il check. Scoperto perché il commit C3 (aggiunta di `scripts/check_sw_precache.js`) ha fatto fallire retroattivamente il gate al giro successivo. Aggiunto pathspec negativo `:!scripts/*.js` per escluderli esplicitamente.

### Added
- test(pwa): nuovo gate bloccante `scripts/check_sw_precache.js` (`npm run check:sw-precache`) — verifica che ogni path in `CORE_PRECACHE_URLS`/`OPTIONAL_PRECACHE_URLS` (`sw.js`) corrisponda a un file reale su disco. Prima un path morto in `OPTIONAL_PRECACHE_URLS` falliva silenziosamente (try/catch ingoia l'errore per non bloccare l'install), producendo 404 invisibili in produzione. Verificato che rilevi e blocchi un path rotto iniettato di proposito, sia a livello di script standalone sia dentro `npm run verify` completo. Agganciato in `prepublish-check.sh` subito dopo gli altri controlli PWA. Nessun bump versione (`scripts/`/`prepublish-check.sh` non precachati).

## 4.12.18 - 2026-07-04

### Fixed
- fix(contenuto): la voce più recente di `UPDATE_LOG` (`shared.js`) descriveva sempre la release *precedente* a `APP_VERSION` — segnalato da utente (versione 4.12.17, changelog fermo a "Release 4.12.16"). Causa: la voce viene scritta per riassumere il fix appena fatto, poi la STESSA commit bumpa la versione per invalidare la cache di `shared.js`, disallineando l'etichetta di un passo ogni volta. D'ora in poi l'etichetta della voce più recente deve coincidere con `APP_VERSION` finale del commit, non con la release del fix che la genera. Verificato in browser: `app-version.js` e prima voce di `shared.js` ora entrambi `4.12.18`.
- chore: bump versione `4.12.17` → `4.12.18` (`shared.js` precachato).

## 4.12.17 - 2026-07-04

### Fixed
- fix(contenuto): il log "Ultimi aggiornamenti" mostrato in Info (`UPDATE_LOG` in `shared.js`) era fermo alla release 4.10.2 (28 maggio 2026) — segnalato da utente, ~40 release senza voce nel log da allora. Aggiunte 6 voci narrative per gli utenti (parenti/insegnanti) che riassumono i punti salienti reali di 4.11.0→4.12.16: le 5 nuove funzioni quiz (spiegazione risposta, difficoltà adattiva, ripassa errori, filtro sotto-ambito, progressi), l'espansione del dataset a 9.879 domande, lo streak feedback, le pagine per genitori/insegnanti arricchite, e il lavoro di oggi (fallback offline, PWA più leggera, contrasto WCAG, fix Okabe-Ito). Non un'entry per patch (sarebbe ~40 voci illeggibili): consolidate per rilascio realmente user-facing, come già fatto in passato per il gap 4.6.8→4.9.0 (vedi entry 4.9.1 esistente).
- chore: bump versione `4.12.16` → `4.12.17` (`shared.js` precachato).

## 4.12.16 - 2026-07-04

### Fixed
- fix(a11y-okabe): risolto leak del colore di marca per-materia nella modalità accessibile Okabe-Ito. Gli 8 blocchi `body.subject-X` in `subject-quiz-theme.css` dichiaravano `--accent-1/2/3` senza guardia (intenzionalmente, per lasciare ereditare `--bg-1/2/3`/`--card-bg`/`--text-main` a Okabe-Ito), ma nello stesso blocco `--accent-1/2/3` finiva per sovrascrivere il palette Okabe reale (`#0072B2`/`#009E73`) col colore di marca della materia (es. matematica mostrava viola `#7b43ff` invece del blu Okabe). Rimossi `--accent-1/2/3` dagli 8 blocchi non guardati — restano solo bg/card-bg/text-main come da intento originale, invariato. In standard mode nessun impatto: `--accent-1/2/3` arriva già dal blocco guardato Wada esistente. Verificato in browser su 4 materie (matematica, inglese, problemi, civica): Okabe-Ito ora mostra `#0072B2`/`#009E73` uniformemente; standard mode identico a prima.
- fix(a11y-okabe): l'accent-2 ufficiale Okabe-Ito (`#009E73`) non raggiunge 4.5:1 su sfondo chiaro — senza alterare il valore canonico (citazione scientifica), aggiunto override scoped solo Okabe-Ito per i selettori dove accent-2 è colore di testo (`.icon-btn`, `.seo-static h2`, `.seo-faq-item summary`, `.related-subjects h2/a`, `.class-selector-label`/`.levels-title`) verso `--text-main` (per-materia, verificato 12.16–15.99:1 su tutte le 8). `.btn-replay` (accent-2 come sfondo con testo bianco) scurito solo in Okabe-Ito con lo stesso pattern `color-mix` già usato da `.start-btn`.
- fix(css): `body.subject-inglese` aveva `--accent-1`/`--accent-2` invertiti rispetto alla convenzione delle altre 7 materie, costringendo `inglese.css` a 6 regole di compenso (`.back-btn`, `.icon-btn`, `.class-btn.selected`, `.btn-replay`, `.btn-home`, `.modal-body h3`) che referenziavano la variabile "sbagliata" apposta. Rimosse tutte e 6 (ora ridondanti, il tema condiviso copre identicamente): `inglese.css` eredita gli stessi default delle altre materie. Mantenute le personalizzazioni genuinamente uniche di inglese (rainbow class-btn, level-card CEFR, levels-wrap, score-pill.ok/ko, level-badge) non toccate dal problema.
- chore: bump versione `4.12.15` → `4.12.16` (CSS precachato modificato).

## 4.12.15 - 2026-07-04

### Fixed
- fix(contenuto/civica): riformulato distrattore innaturale "Ridire in giro il problema di salute" (domanda diritto alla salute, classe 3) in "Raccontare in giro il problema di salute" — segnalato da utente come confuso in gioco, letto erroneamente come refuso di "ridere".
- fix(ui): aggiunto `margin-top: 10px` a `.bonus-note` (`subject-quiz-theme.css`) — il testo "Se sbagli il bonus, il punteggio resta invariato." era attaccato al pulsante "Tieni il punteggio e salta bonus" sopra (nessun margine per via del reset globale `* { margin: 0 }`). Verificato in preview su civica, stesso markup condiviso da tutte e 8 le materie.
- chore: bump versione `4.12.14` → `4.12.15` (CSS precachato modificato).

## 4.12.14 - 2026-07-04

### Fixed
- fix(a11y-contrasto): `accent-2` falliva WCAG AA 4.5:1 su tutte le 8 materie in modalità standard (testo reale su `.icon-btn`, `.seo-static h2`, `.seo-faq-item summary`, `.related-subjects h2/a` — misurato con font-size/weight reali in browser, non dedotti). `accent-1` falliva anche su geografia (4.02), scienze (4.04) e problemi (3.22, il peggiore). Scuriti gli 11 token in `tokens.css` (`--subj-*-a`/`--subj-*-b`) mantenendo la stessa tonalità fino a raggiungere ≥4.5:1 su bianco; gli altri 5 valori già conformi restano invariati. Verificato in browser su tutte le 8 materie (back-btn e icon-btn, i due selettori più a rischio): tutti ora tra 4.53 e 5.33. Nessun impatto su modalità Okabe-Ito (i token toccati sono `--subj-*-a/b`, consumati solo dal blocco standard-mode guardato; scoperto peraltro — separatamente, non toccato qui — che i blocchi `body.subject-X` non guardati fanno leak del colore di marca anche in Okabe-Ito: task di follow-up aperto).
- chore: bump versione `4.12.13` → `4.12.14` (CSS precachato modificato).

## 4.12.13 - 2026-07-04

### Fixed
- fix(fallback): `civica`, `inglese` e `problemi` non avevano NESSUNA banca di domande statica di riserva (`js/*-page.js`) — se il fetch di `json/index.json`/`json/<materia>.json` falliva (offline al primissimo avvio, rete assente), il quiz restava con zero domande invece di degradare a un contenuto minimo. Ora hanno reale contenuto di fallback generato campionando `json/civica.json` (60 domande, 4 aree), `json/problemi.json` (20 domande) e `json/inglese.json` (102 domande, 17 aree) — solo domande a bassa difficoltà, già passate dal pipeline di qualità corrente (dedup, difficoltà, lint), non testo scritto a mano. Formato identico alle banche già funzionanti (matematica/storia/scienze/italiano/geografia): `{ q, a, d }`. Verificato: sintassi JS valida, `eslint` pulito, `npm run verify` passa, tutte le pagine materia sotto il limite di 250 righe.
- chore: bump versione `4.12.12` → `4.12.13` (JS pagine materia precachati modificati).

## 4.12.12 - 2026-07-04

### Changed
- perf(pwa): rimossi i 8 `json/<materia>.json` (~7.9MB totali) da `OPTIONAL_PRECACHE_URLS` in `sw.js`. Prima venivano scaricati TUTTI all'install del service worker, anche le materie che l'utente non avrebbe mai aperto. Restano cacheable via `isSameOriginStaticAsset` (estensione `.json` già coperta dalla regex statica): ogni materia viene ora salvata offline al primo fetch reale della pagina, non prima. `json/index.json` resta in `CORE_PRECACHE_URLS` (piccolo, necessario alla home per il conteggio totale domande). Verificato in preview: dopo install solo `index.json` è in cache; dopo la visita a `/matematica` anche `matematica.json` viene cachato, gli altri 7 restano assenti finché non si visita quella materia.
- chore: bump versione `4.12.11` → `4.12.12` (strategia di precache del service worker modificata).

## 4.12.11 - 2026-07-04

### Changed
- perf(css): introdotto token condiviso `--info-blue`/`--info-blue-rgb` (`tokens.css`, #2d6cdf / `45 108 223`) per il blu informativo ricorrente (box "per genitori e insegnanti", `.play-window-*`, `.area-more-btn`, link/pill FAQ e premi) finora hardcoded in ~20 punti distinti tra `subject-quiz-theme.css`, `utilities.css`, `index.css`, `faq.css`, `rewards.css`. Sostituiti tutti gli usi letterali (`#2d6cdf`, `rgba(45, 108, 223, alpha)`) con `var(--info-blue)`/`rgba(var(--info-blue-rgb) / alpha)`; non toccate le dichiarazioni `--accent-2`/`--civ-b`/`--sci-b` che condividono lo stesso hex per altra semantica (colore per-subject, non "info box" generico). Zero cambio visivo: verificato in preview su index/faq/inglese, incluso il valore renderizzato in modalità Okabe-Ito (identico, il token non è palette-scoped).
- chore: bump versione `4.12.10` → `4.12.11` (CSS precachato modificato).

## 4.12.10 - 2026-07-04

### Changed
- perf(css): rimosse da `inglese.css` 83 regole duplicate/morte (1198 → 611 righe). 76 erano byte-identiche a `subject-quiz-theme.css` (waste puro, rischio drift su future modifiche condivise); 5 (`.seo-static`/`::before`/`h2`, `.seo-faq-item`, `.seo-faq-item summary`) erano già inerti perché shadowate da regole più specifiche `html:not([data-palette="okabe-ito"]) body.subject-inglese ...` aggiunte dal restyle Wada Sanzo (Fase 4) più avanti nello stesso file; 2 (`.si .n`/`.si .l`) erano dead code senza alcun markup corrispondente. Mantenute intatte tutte le personalizzazioni deliberate della pagina inglese (rainbow class-btn per classe, level-card CEFR con stati locked/hover, levels-wrap decorativo, seo-100-domande, differenze di colore legate ai token `--accent-1`/`--accent-2` invertiti per questo subject). Verificato in preview: nessuna differenza visiva, nessun errore console, stati locked/hover/seo confermati via inspect.
- chore: bump versione `4.12.9` → `4.12.10` (CSS precachato modificato).

## Non rilasciato

## 4.12.9 - 2026-07-04

### Changed
- perf(favicon): sostituito `favicon.svg` — era un export raster (PNG 1254×1254 imbustato in base64 dentro tag `<svg><image>`, 1.1MB) con un vero SVG vettoriale (path disegnati, Adobe Illustrator export, 6.5KB). Stesso path pubblico `/favicon.svg`, nessun link da aggiornare. Riduzione ~99% del peso scaricato da ogni visitatore nuovo.
- chore: bump versione `4.12.8` → `4.12.9` (asset statico modificato, cache browser/CDN da invalidare).

## 4.12.8 - 2026-07-03

### Changed
- a11y(contrasto): scuriti gli stop chiari dei gradienti dei pulsanti risposta blu/verde/rosso (palette standard Wada Sanzo, `subject-quiz-theme.css` blocco `html:not([data-palette="okabe-ito"])`) così che il testo bianco superi WCAG AA 4.5:1 su tutto il pulsante, non solo sulla metà scura. Prima il testo bianco falliva sullo stop chiaro (2.94–3.52); ora passa su entrambi gli stop (blu 5.33/4.77, verde 6.17/4.73, rosso 5.77/4.93). Il pulsante ambra (testo scuro) era già conforme e resta invariato. Modalità **Okabe-Ito non toccata**. Cambio visivo minimo: pulsanti leggermente più profondi.
- a11y(contrasto): sottotitolo home `.main-sub` da `rgba(255,255,255,.85)` a `#fff` (margine di contrasto in più sul gradiente cielo, nessun impatto visivo percepibile).
- chore: bump versione `4.12.7` → `4.12.8` (HTML/CSS precachati modificati); hash CSP degli stili risincronizzati per lo `<style>` inline di `index.html`.

### Note
- Audit UX/accessibilità completo in `reports/ux-audit-2026.md`. Il conteggio domande nel footer usa già `Intl.NumberFormat('it-IT')` (separatore migliaia corretto in produzione): nessuna modifica necessaria.

## 4.12.7 - 2026-07-03

### Changed
- perf(font): ridotto il preload dei font sulle 8 pagine materia (matematica, inglese, problemi, civica, geografia, storia, scienze, italiano) da 5 a 3 pesi critici (Fredoka-700, Nunito-800, Nunito-900). Rimossi i preload di Nunito-regular (peso mai usato in `subject-quiz-theme.css`) e Nunito-700 (usato solo per `.result-msg` post-risposta, non above-the-fold). Le dichiarazioni `@font-face` restano invariate: i pesi non più precaricati continuano a caricare on-demand se richiesti, con priorità di rete più bassa. Verificato su preview: nessun FOUT visibile sul titolo, nessun errore console. Bump versione `4.12.6` → `4.12.7` (HTML precachato modificato).

## Non rilasciato

### Changed
- fix(csp): `sync_csp_hashes.py` ora hasha solo gli script **eseguibili** (`type` assente/`text/javascript`/`module`/`importmap`), non più i blocchi `application/ld+json`. Tutti i 48 `<script>` inline del sito sono data block JSON-LD (dati strutturati SEO), che il browser non esegue e che CSP `script-src` non governa: i loro hash erano inutili e creavano fragilità: ogni modifica a date/conteggi/FAQ nei JSON-LD rompeva la CSP e imponeva un resync (vedi A1/A2). `_headers` `script-src` passa da 46 hash a solo `'self'` (hash `style-src` invariati). Nessun impatto su produzione: i data block non erano comunque soggetti a enforcement. Nessun bump versione (`_headers`/`scripts/` non precachati).
- chore(build): aggiunto script npm `freshness` (`refresh_structured_data.py` → `generate_sitemap.py` → `sync_csp_hashes.py`) e agganciato a `prepublish-check.sh` prima della validazione di `sitemap.xml`, cosicché il gate di rilascio rigeneri sempre `lastmod`/`dateModified` dai timestamp reali dei file invece di lasciarli stale. Rigenerati `sitemap.xml` e i `dateModified` JSON-LD delle pagine con contenuti allineati alle modifiche reali (fino al 2026-07-03).

## 4.12.6 - 2026-07-03

### Fixed
- content: allineato il conteggio domande stale ("7.000+" in `index.html`, "7.300" in `faq.html`, "843" per scienze in `per-insegnanti.html") al totale reale di `json/index.json` (9.879). `index.html` e `faq.html` ora mostrano "9.800+" (arrotondamento onesto); `per-insegnanti.html` mostra "1.024 domande" per scienze. Verificato che `llms.txt` e `README.md` fossero già corretti (9.879) e che `#questionsTotalCount` resti popolato dinamicamente da JS senza duplicazioni manuali. Bump versione `4.12.5` → `4.12.6` (contenuto precachato modificato).

## 4.12.5 - 2026-07-01

### Changed
- content(scienze): unificato slug subarea duplicato — `stati_e_proprieta_materia` (area `materia_materiali_trasformazioni`, 25 domande) rinominato in `stati_proprieta_materia`, coerente con lo stesso slug già usato in altre 3 aree. Nessuna domanda modificata nel testo. Nessun impatto UI (A4 raggruppa già i sotto-ambiti per etichetta visualizzata).
- chore: bump versione `4.12.4` → `4.12.5` (`json/scienze.json` precachato). Aggiornati `json/index.json`, `llms.txt`, `reports/coverage.md`.

## 4.12.4 - 2026-07-01

### Added
- content(scienze): **G8 fase 2 batch 2+3 — top-up classi 5 e 3.** +52 domande classe 5 (198 → **250**) e +39 classe 3 (211 → **250**), completando il target di 250 domande/classe per tutte le classi di scienze (c2=274, c3/c4/c5=250). Classe 5: organi di senso e sistema nervoso, ecosistemi e catene alimentari, biodiversità, sostenibilità energetica, atomi e molecole. Classe 3: salute e igiene di base, ciclo dell'acqua, viventi/non viventi, parti della pianta. Mix di difficoltà adeguato all'età, distrattori plausibili, spiegazioni formative, nessun duplicato semantico. Totale domande **9.788 → 9.879**.

### Changed
- chore: bump versione `4.12.3` → `4.12.4` (`json/scienze.json` precachato dal service worker). Aggiornati `json/index.json`, `README.md`, `llms.txt`, `reports/coverage.md`.

## 4.12.3 - 2026-07-01

### Added
- content(scienze): **G8 fase 2 batch 1 — top-up classe 4.** +90 domande vettate su 11 subaree sotto quota, portando scienze c4 da 160 a **250 domande** (target di piano). Mix di difficoltà 1/2/3 (30/40/20). Aree coperte: passaggi di stato e ciclo dell'acqua, stati e proprietà della materia, trasformazioni reversibili/irreversibili, salute e igiene, movimenti della Terra, forze e movimento, luce e suono, energia e fonti rinnovabili, classificazione dei viventi, adattamenti, tutela ambientale. Ogni domanda con distrattori plausibili e spiegazione formativa; nessun duplicato semantico. Totale domande **9.698 → 9.788**.

### Changed
- chore: bump versione `4.12.2` → `4.12.3` (`json/scienze.json` precachato dal service worker). Aggiornati `json/index.json`, `README.md`, `llms.txt`, `reports/coverage.md`.

## 4.12.2 - 2026-07-01

### Changed
- content(scienze): **G8 fase 1 — consolidamento subaree.** Rimappate 707/843 domande da 120 combinazioni area/subarea frammentate (retaggio ingest) a ~38 macro-subaree (2-4 per area, stesso pattern del consolidamento civica G3). Nessuna domanda aggiunta/rimossa/modificata nel testo, solo il campo `subarea`. Celle sotto soglia coverage: 315 → 273. Prepara il terreno per il top-up G8 fase 2 (scienze c3/c4/c5 sotto quota 250/classe).
- chore: bump versione `4.12.1` → `4.12.2` (`json/scienze.json` precachato dal service worker).

## 4.12.1 - 2026-07-01

### Added
- content(pagine-adulti): **G6 — pagine per-genitori/per-insegnanti arricchite.** Aggiunta mappa curricolare (materie × aree tematiche × classi 2ª-5ª, con conteggio domande) e sezione consigli d'uso pratici, separate per target: consigli casa in `/per-genitori`, suggerimenti didattici per materia in `/per-insegnanti`. Nessuna nuova classe CSS (riuso di `.section`/`.list` esistenti), zero impatto CSP.

### Changed
- chore: bump versione `4.12.0` → `4.12.1` (HTML precachato dal service worker); `dateModified` aggiornato in entrambe le pagine.

## 4.12.0 - 2026-07-01

### Added
- feat(quiz): **B1 — streak-aware feedback.** Tracciato lo streak di risposte corrette consecutive nella sessione (reset a 0 su risposta errata). Alle soglie 3/5/8 il messaggio di feedback casuale è sostituito da un messaggio dedicato col conteggio ("3 di fila! 🔥", "5 di fila! Serie perfetta! ⭐", "8 di fila! Sei inarrestabile! 🚀") e la mascotte passa a `celebrate` invece di `happy`. Sotto soglia 3, comportamento invariato (messaggio random + `happy`). Le domande bonus di fine partita restano un flusso separato, non toccano lo streak.
- Scope B3 (mascotte contestuale) tenuto lean: nessuna nuova UI/DOM — riuso degli elementi `#feedback`/`#mascot` esistenti, zero impatto CSP/accessibilità.

### Changed
- chore: bump versione `4.11.5` → `4.12.0` (cambio comportamentale in `subject-quiz-core.js`, precachato).

## 4.11.5 - 2026-07-01

### Added
- content(matematica): +74 domande vettate per colmare i veri gap curricolari core, portando ogni cella a 15: `decimali` cl.4 (+12) e cl.5 (+14), `frazioni` cl.3 (+13), `ragionamento` cl.3/4/5 (+11/+12/+12). Ogni cella ha un mix di difficoltà 1/2/3 (mantiene la varianza intra-classe richiesta da A2). Tutte le domande aritmetiche verificate automaticamente (742/742 corrette).
- test(content): nuovo guardrail bloccante **D3** in `scripts/lint_content.js` — rileva riferimenti penzolanti nel testo della domanda ("domanda n.X", "domanda precedente", "vedi/figura sopra"). Controllato solo sul campo `question` per non colpire l'uso legittimo di "nella domanda" nelle spiegazioni.

### Changed
- content: totale domande **9.624 → 9.698**. Aggiornati `llms.txt`, `README.md`, `json/index.json`.
- chore: bump versione `4.11.4` → `4.11.5`; rigenerato `reports/coverage.md`.

## 4.11.4 - 2026-06-30

### Fixed
- content(QA pedagogico): rimosso il riferimento penzolante "nella domanda n.X" da 287 domande di scienze (artefatto di numerazione CSV, privo di senso nel quiz mescolato). Gli stem ripuliti collassavano in soli 11 quesiti unici: **rimossi 276 duplicati ridondanti** (stesso testo+risposta+opzioni), tenuti gli 11 originali. Le domande gonfiate erano live e servite.
- content(geografia): corretta `geo-4-regioni_italiane-9097` — "la Lombardia confina con Svizzera e Austria" era errato (l'unico Stato estero confinante è la Svizzera). Domanda riformulata e spiegazione corretta.

### Changed
- content: totale domande **9.900 → 9.624** (cull duplicati scienze). Aggiornati `llms.txt`, `README.md`, `json/index.json` (`totalQuestions` + stats scienze).
- test(content): verifica automatica aritmetica su matematica+problemi — 736 quesiti computabili controllati, 0 errori. Confermata l'integrità meccanica (l'audit già copre answerIndex↔answer, risposta∈opzioni, duplicati).
- chore: bump versione `4.11.3` → `4.11.4` in `app-version.js`, `package.json`, `llms.txt`; rigenerato `reports/coverage.md`.

## 4.11.3 - 2026-06-30

### Fixed
- content(reachability): riattivate **706 domande "morte"** che il loader scartava perché il loro `area` (o `subarea` per italiano) non era nella `areaMap` di pagina e veniva mappato a stringa vuota (`mapArea` → `''` → riga droppata). Recuperate: civica 82 (area legacy `educazione_civica`), storia 178 (area legacy `storia`), scienze 212 (area legacy `scienze`), geografia 165 (area legacy `geografia`), italiano 69 (`alfabeto` + `riflessione_sulla_lingua` mai inserite nella areaMap). Ora tutte le domande del dataset sono effettivamente servibili in gioco.
- content(italiano): aggiunte `alfabeto` (in `write`) e `riflessione_sulla_lingua` (in `gram`) alla `areaMap` di `js/italiano-page.js`.

### Changed
- chore(taxonomy): civica — dissolte ~60 micro-subaree da 5 domande in 16 macro-subaree coerenti (4 per area), e ridistribuite le 82 domande dell'area legacy `educazione_civica` nelle 4 aree reali (rules/env/digital/road). Celle civica sotto soglia 154 → 19; i 9 `bonus_*` instradati a subaree reali.
- chore(taxonomy): storia/scienze/geografia — domande delle aree legacy ricollocate nelle aree "vive" mappate dalla pagina, fondendole nelle subaree esistenti dove naturale (0 duplicati ridondanti introdotti; verificate le varianti testo-uguale/risposta-diversa).
- chore(coverage): rigenerato `reports/coverage.md` (celle sotto soglia 481 → 312; il residuo è costituito in prevalenza da unità curricolari coerenti da ~10 domande, non da lacune reali).
- chore: bump versione `4.11.2` → `4.11.3` in `app-version.js`, `package.json`, `llms.txt`.

## 4.11.2 - 2026-06-30

### Changed
- chore(taxonomy): eliminata la subarea `vari` da italiano (66 domande cl.3-5) e inglese (26 domande cl.2-5), ciascuna riclassificata nella subarea curricolare corretta (morfologia, grammatica, lessico, sintassi, ortografia, lettura, lingua, uso_guidato, ecc.).
- chore(taxonomy): rinominata `riflessione_linguistica` → `riflessione_sulla_lingua` in italiano cl.4 (15 domande) per uniformità con cl.5.
- chore: bump versione `4.11.1` → `4.11.2` in `app-version.js`, `package.json`, `llms.txt`.

## 4.11.1 - 2026-06-30

### Fixed
- content: corrette 6 domande duplicate vere (testo + risposta + opzioni identici) sostituendole con domande distinte e curricolarmente coerenti (italiano 3, inglese 3), mantenendo il totale a 9.900. Una di queste (`ita-2-morfologia-9133`, articolo per "amica") era anche pedagogicamente errata ed è stata riscritta.

### Added
- test(content): nuovi guardrail bloccanti in `scripts/audit_questions_json.js` — `subarea` non vuota, `difficulty ∈ {1,2,3}`, `explanation` non vuota, e rilevamento duplicati ridondanti (stesso testo normalizzato + stessa risposta + stesse opzioni). Varianti con stesso testo ma risposta/opzioni diverse restano consentite.
- chore(qa): `scripts/lint_content.js` ora è cablato come gate bloccante in `prepublish-check.sh`.

### Changed
- chore(lint): `lint_content.js` — rimossa euristica apostrofo errata (`un'` segnalato anche per maschili corretti come "un albero"), applicati realmente i gruppi di regole prima inerti, reset `lastIndex` per regex globali, aggiunto check accenti troncati (`citta`→`città`, ecc.) con soppressione del contrasto didattico in ortografia.
- chore(ci): `.lighthouseci/` aggiunto a `.gitignore` ed escluso dallo scan pattern pericolosi in `prepublish-check.sh` (i report generati contengono `innerHTML`/`javascript:` nei dati inline).
- chore: bump versione `4.11.0` → `4.11.1` in `app-version.js`, `package.json`, `llms.txt`.

## 4.11.0 - 2026-06-30

### Added
- feat(quiz): A1 — spiegazione risposta. Dopo ogni risposta compare una card `#qExplanation` con il testo `explanation` dalla domanda JSON, colorata verde/rossa. Si azzera al caricamento della domanda successiva. Nessuna modifica HTML: il div è iniettato dinamicamente dal core.
- feat(quiz): A2 — difficoltà adattiva. Al termine di ogni partita il core calcola un target EMA per classe (`${CURSOR_KEY}_adapt_v1`) e aggiunge un termine `|q.difficulty − target| × 2.6` in `candidateScore`. Converge in 3–5 sessioni. Opt-out via `cfg.adaptiveDifficulty: false`. No-op su matematica (varianza intra-classe assente nei dati attuali).
- feat(quiz): A3 — ripassa errori. Le domande sbagliate vengono salvate in `${CURSOR_KEY}_wrong_q_v1` (max 30). Appare il pulsante "Ripassa i tuoi errori (N)" nella schermata iniziale; avvia una sessione speciale che, al completamento, rimuove dalla lista le domande risposte correttamente.
- feat(quiz): A4 — filtro sotto-ambito. Dopo la selezione dell'area appare una griglia di sotto-ambiti derivata dinamicamente da `BANKS` per area+classe corrente. Nessuna config per materia necessaria.
- feat(quiz): C1 — overlay progressi. Pulsante "Progressi" nella schermata risultati apre un modale con statistiche per classe/area e tabella delle ultime partite, costruita da `loadStats()` / `loadLB()`.

### Changed
- content: 9.366 domande totali (+1.991 rispetto a 7.375). Aggiornati badge README, llms.txt, index.json.
- content(matematica): `difficulty` ri-derivata da feature intrinseche (grandezza operandi, tipo operazione, decimali/frazioni, esponenti, parentesi, multi-step) con binning per terzili intra-classe, sostituendo il collasso sulla classe. Sblocca la difficoltà adattiva (A2) per matematica. Vedi `scripts/derive_math_difficulty.py`.
- content(matematica): riempite 1.701 `subarea` vuote tramite classificatore deterministico su vocabolario controllato (`scripts/fill_math_subarea.py`). Nessuna materia ha più domande con `subarea` vuota.
- content: +153 domande nuove autorali (inglese +111, italiano +32, geografia +10) per portare ogni coppia materia-classe ad almeno 250 domande attive. Nessuna classe sotto soglia.
- content: +534 domande nuove autorali di arricchimento (italiano +88, inglese +88, scienze +80, storia +72, civica +72, geografia +72, problemi +62), tutte deduplicate per testo e curricolarmente coerenti, raggiungendo 9.900 domande totali. Nessuna classe sotto 250.
- chore: bump versione `4.10.13` → `4.11.0` in `app-version.js`, `package.json`, `llms.txt`.

## 4.10.2 - 2026-05-28

### Changed
- refactor(css): rimossi 389 righe di CSS morto post-refactor quiz engine, con pulizia concentrata su `inglese.css` e su selettori legacy non più referenziati nei fogli condivisi e informativi.
- css(audit): confermato il mantenimento dei soli selettori runtime/dinamici ancora necessari (`float-v*`, `:focus-visible`, classi `sa-/is-/has-/js-`), evitando regressioni visive e di accessibilità.

## 4.10.1 - 2026-05-27

### Fixed
- repo: rimossi 4 file vault Obsidian erroneamente committati in v4.10.0 (`00-Dashboard.md`, `01-Progetto/Stato attuale.md`, `02-Release/4.10.0.md`, `03-Task/Completati.md`). Erano accessibili pubblicamente via `https://lascuolaamica.it/<file>.md`. Nessuna PII sensibile esposta. Aggiunto `.gitignore` per prevenire ricorrenze.

## 4.10.0 - 2026-05-27

### Changed
- ci: aggiunto workflow Lighthouse CI con audit su 5 URL chiave (home, 2 materie, premi, chi-siamo). Trigger su PR + daily schedule. Soglie minime pragmatiche baseline-aware: perf 0.64, a11y 0.95, best-practices 0.78, SEO 0.95, PWA warn 0.85.
- dx: aggiunto npm script `lighthouse` (`lhci autorun`).
- ci: report salvati 7 giorni in temporary-public-storage Lighthouse CI.

## 4.9.5 - 2026-05-26

### Changed
- perf(html): aggiunti `dns-prefetch` + `preconnect` self-origin e `preload` per `/json/index.json` su pagine materia. Riduce latency iniziale primo paint su mobile.

## 4.9.4 - 2026-05-26

### Changed
- chore(dx): migrato ESLint da legacy `.eslintrc.json` a flat config `eslint.config.mjs`, compatibile con ESLint 9 senza workaround `ESLINT_USE_FLAT_CONFIG=false`.
- chore(dx): rimosso `.eslintrc.json` obsoleto e semplificato lo script `lint:js` in `package.json`.

## 4.9.3 - 2026-05-26

### Changed
- chore(dx): aggiunti `package.json` e `package-lock.json` con script unificati per `lint`, `audit:json`, `prepublish`, `verify`, `sync:wiki` e harness test.
- tooling: configurati `ESLint` e `Stylelint` in assetto minimale compatibile con il codebase vanilla JS/CSS esistente, senza dipendenze runtime.

### Fixed
- prepublish-check.sh: esclusi `.git` e `node_modules` dai controlli di sicurezza e igiene CSS, evitando falsi positivi durante `npm install`.

## 4.9.2 - 2026-05-26

### Changed
- perf(rewards): ottimizzati in batch i 46 PNG in `assets/reward/` mantenendo i path originali e riducendo il peso totale della cartella da ~15MB a ~3.5MB.
- perf(rewards): aggiunto `assets/reward/bacheca-trofei-bg.webp` con fallback PNG tramite `<picture>` in `premi.html`.

### Fixed
- pwa(rewards): `sw.js` ora gestisce esplicitamente `assets/reward/*` in runtime cache dedicata (`cache-first` on-demand), evitando precaricamenti non necessari e mantenendo offline dopo la prima visita a `/premi`.
- ui(rewards): immagini reward non critiche renderizzate con `decoding=\"async\"` e lazy loading.

## 4.9.1 - 2026-05-25

### Fixed
- shared.js: aggiornato `UPDATE_LOG` con le 6 release mancanti (`4.6.8` -> `4.9.0`). Il popup info mostrava ancora `4.6.7` come ultima voce mentre il footer riportava `4.9.0`.

## 4.9.0 - 2026-05-25

### Changed
- refactor(quiz-engine): chiusura consolidation. 8/8 materie ora config-driven via `subject-quiz-core.js`. Codebase ridotta di ~3.500 righe nette di duplicazione (civica, problemi, inglese migrate definitivamente al pattern config).
- core: Extension Contract attivo con 0/3 hook funzione consumati (margine 100% per future estensioni). 4 guard rail in `prepublish-check.sh` (no-subject-branch, cursorKey-explicit, pages-size, extension-contract-present).
- docs/wiki/Architettura.md: aggiornata sezione Quiz engine con guida "aggiungere nuova materia" (~120 righe vs ~1500 pre-refactor).

### Validation
- 8/8 materie verificate smoke multi-device (desktop + tablet + smartphone).
- PWA install + offline + update flow verificati su device reale.
- Rewards + reset dati locali verificati.
- Soak branch refactor 7 giorni, 0 regressioni.
- Audit dead code: 0 helper duplicati, 0 const legacy, 0 commenti obsoleti residui.

## 4.8.0 - 2026-05-25

### Changed
- refactor(inglese): migrato `js/inglese-page.js` a configurazione dichiarativa via `subject-quiz-core`, riducendo il file runtime a 104 righe di sola config.
- core quiz: aggiunti `cfg.levels`, `cfg.renderMode='bilingual'` e `cfg.maxLevelDistance` come config field passivi. Nessun hook funzione consumato (`D=0` invariato).
- questions-loader: aggiunti `subarea` e `answerLang` come metadata opzionali in `rowToQuestion`, usati solo dalle materie che li dichiarano.
- json inglese: arricchito `json/inglese.json` con `answerLang` su tutte le domande, con builder dataset aggiornato.
- 8/8 materie quiz ora sono config-driven.

### Fixed
- prepublish-check.sh: `check_cursor_key_explicit` ora copre tutte le 8 page subject, incluso inglese post-migrazione.

## 4.7.1 - 2026-05-25
### Changed
- refactor(problemi): confermata e formalizzata `cfg.cursorKey = 'problemiMatematica_cursor_v1'` esplicita in config per allinearsi alla politica unica "cursorKey sempre esplicita". Nessuna migrazione dati richiesta.
- core quiz: politica unica documentata in `docs/archive/refactor-quiz-engine-2026/core-capabilities.md`. Nessun fallback derivato implementato nel core: ogni materia migrata deve dichiarare esplicitamente la propria `cursorKey`.

### Fixed
- prepublish-check.sh: aggiunto il guard `check_cursor_key_explicit` per prevenire omissioni future nelle materie gia` migrate/config-driven.

## 4.7.0 - 2026-05-25
### Changed
- refactor(problemi): migrato `js/problemi-page.js` a configurazione dichiarativa via `subject-quiz-core`, riducendo il file runtime a 39 righe di sola config.
- core quiz: aggiunti `cfg.answerMode` (default `mcq`, nuovo `numeric`) e `cfg.leaderboardAreaFallback`; `cfg.optionsGenerator` e` disponibile come strategy passiva di fallback senza hook funzione.
- Storage keys utenti problemi preservate (`problemiMatematica_lb_v1`, `problemiMatematica_history_v2`, `problemiMatematica_quality_v1`, `problemiMatematica_class_pref_v1`).

### Fixed
- questions-loader: bonus rows non piu` incluse nella banca principale delle 10 domande standard. Regressione pregressa introdotta in `v4.6.6` con la migrazione JSON-only (`civica`, `inglese`, `problemi`): alcune sessioni potevano contenere bonus rows tra le domande normali. Verifica retroattiva civica post-fix documentata in `docs/archive/refactor-quiz-engine-2026/test-report-civica.md`.

## 4.6.9 - 2026-05-24
### Changed
- refactor(civica): migrato `js/civica-page.js` a configurazione dichiarativa via `subject-quiz-core`, riducendo il file runtime a 81 righe di sola config.
- core quiz: aggiunta idratazione generica delle bonus questions dai bonus rows JSON e supporto al config field `mixedRepeatLimit`.
- core quiz: introdotti i pesi config-driven `targetGradeWeight` e `classDistanceWeight` per rispettare il profilo classe di civica senza branch per materia.
- Storage keys utenti preservate (`educazioneCivica_lb_v1`, `educazioneCivica_cursor_v1`, `educazioneCivica_history_v2`, `educazioneCivica_quality_v1`, `educazioneCivica_class_pref_v1`).

## 4.6.8 - 2026-05-24
### Changed
- refactor: migrazione civica/inglese/problemi a JSON-only con bonus rows da dataset
- dataset totale: 7.348 -> 7.375 domande

## 4.6.7 - 2026-05-24

- docs: aggiunta sezione header HTTP critici per i dataset
- Runtime home/info: aggiunto contatore totale domande nel footer di `index` e `chi-siamo`, alimentato da `json/index.json` con formato locale `it-IT`.
- Hardening dati PWA: documentato il vincolo operativo su `/json/*` con `Cache-Control: public, max-age=0, must-revalidate` per evitare JSON stale dopo upgrade.

## 4.6.6 - 2026-05-24

- Dataset quiz: completata la migrazione JSON-only per `civica`, `inglese` e `problemi`, rimuovendo il doppio binario tra dataset inline e dati caricati a runtime.
- Bonus questions: spostate nei rispettivi `json/*.json` con metadati `bonus: true` e `bonusRaw`, così entrano nella stessa pipeline di audit dei dataset principali.
- Runtime dedicati: aggiornati i tre motori pagina per idratare da JSON anche i bucket bonus e non dipendere più da `BANK`/`BONUS_QUESTIONS` hardcoded.
- Conteggi e documentazione: riallineato il totale progetto a `7.375` domande e aggiornata la documentazione tecnica sulla source of truth dei contenuti.

## 4.6.5 - 2026-05-24

- Pulizia conservativa: rimosse funzioni morte confermate in `shared.js` (`getCachedNodes`, `ensureUpdatesFooterLink`, `ensureFaqFooterLink`, `ensurePaletteFooterToggle`) e in `admin/esercizi.js` (`escapeHtml`) senza impatti sul runtime.
- Hardening operativo: rimossi artefatti obsoleti (`.DS_Store`, `__pycache__`, `*.pyc`) dal repository.
- Documentazione: aggiunte note esplicite su area `admin/` non come boundary di sicurezza, esclusione dall'export pubblico, source of truth quiz su JSON e stato di `supporto-satispay.html` come pagina non promossa.
- Aggiornata la versione applicativa per distribuire i ritocchi di runtime e documentazione ai client con cache.

## 4.6.4 - 2026-05-24

- PWA branding: aggiornate anche le icone del manifest (`icons/icon-192.png`, `icons/icon-192-maskable.png`, `icons/icon-512.png`, `icons/icon-512-maskable.png`) usando la nuova sorgente favicon consegnata nel progetto.
- Mantenuta la stessa mappa file del manifest, senza cambiare nomi o percorsi pubblici.
- Aggiornata la versione applicativa per distribuire il nuovo set di icone anche ai client con cache e installazioni già esistenti.

## 4.6.3 - 2026-05-24

- Branding: aggiornata la favicon del sito partendo dalla nuova sorgente SVG fornita nel progetto.
- Rigenerate le varianti browser `favicon.ico`, `icons/favicon-16x16.png`, `icons/favicon-32x32.png` e `icons/apple-touch-icon.png`.
- Aggiornata la versione applicativa per invalidare correttamente la cache dei client che avevano già le vecchie icone.

## 4.6.2 - 2026-05-24

- PWA: registrazione del Service Worker aggiornata con `updateViaCache: "none"` per evitare update incompleti quando cambia `app-version.js`.
- PWA: aggiunto `scope: "/"` al manifest e documentato esplicitamente il vincolo di deploy root-only con rewrite compatibili.
- PWA: aggiunto `Cache-Control: no-cache` anche per `app-version.js` e rafforzati i controlli prepublish su contratto root-only, header cache e bump `APP_VERSION`.
- Service Worker: rimossi dal precache iniziale gli asset reward più pesanti della bacheca, che restano caricati on-demand dalla pagina Premi.
- Premi: allineati i meta Apple/A2HS di `premi.html` alla baseline delle altre pagine pubbliche.

## 4.6.1 - 2026-05-23

- Service Worker: aggiunte al precache opzionale le route `/privacy`, `/cookie` e `/supporto-satispay` per supportare la navigazione offline dai link footer.
- Service Worker: confermata la versione cache derivata da `app-version.js` via `importScripts('/app-version.js')` e aggiornato `APP_VERSION` a `4.6.1`.
- Service Worker: rimosso dal precache core il loader CSS legacy non più parte del runtime caricato dalle pagine.
- Cleanup tecnico: eliminato il file orfano del loader CSS legacy e azzerati i riferimenti residui nel repository.
- CSS inglese: rimossi i duplicati base (`:root`, `body`, `.bg-shapes`, `.shape`, `@keyframes drift`) già coperti da `subject-quiz-theme.css`.
- CTA supporta: applicata l'opzione conservativa di rimozione del marker `cta-supporta` non standardizzato.
- Footer privacy/cookie: introdotto `aria-current=\"page\"` sulle pagine omonime per evitare self-link ridondanti.

## 4.6.0 - 2026-05-23

- Migrazione footer completata su tutte le pagine pubbliche: Privacy e Cookie ora sono link diretti a `/privacy` e `/cookie` senza dipendere da JavaScript.
- Corretto `inglese.html` allineando la classe versione footer da `flink` a `footer-link`.
- Mantenuti temporaneamente i modali Privacy/Cookie nel markup come fallback non attivo per una release conservativa.
- Aggiornata la versione applicativa a `4.6.0` per propagare il cambio strutturale del footer anche ai client con cache offline.

## 4.5.34 - 2026-05-23

- Aggiunte le pagine standalone `privacy` e `cookie` con URL indicizzabili e raggiungibili anche senza JavaScript.
- Aggiornata la pagina 404: link footer Privacy/Cookie puntano ora a `/privacy` e `/cookie`.
- Aggiornati routing Cloudflare (`_redirects`) e sitemap con le nuove URL pubbliche.
- Aggiornata la versione applicativa a `4.5.34` per allineare cache e release metadata.

## 4.5.33 - 2026-05-23

- Corretto il layout responsive della bacheca premi: 7 colonne su desktop/LIM, 4 su tablet e 2 su smartphone.
- Ripristinata la coerenza del footer: Privacy, Cookie e versione restano nel pannello Info senza duplicazioni visive.
- Migliorata l'ergonomia mobile con target touch più affidabili per footer, breadcrumb, FAQ e comandi premi.
- Stabilizzata la sovrapposizione degli sfondi decorativi della pagina Premi rispetto al contenuto.

## 4.5.32 - 2026-05-22

- Rafforzato il generatore sitemap usando `git status --porcelain -z` per gestire correttamente rename, copie e percorsi con spazi.
- Mantenuta stabile la generazione di `lastmod` senza modifiche spurie a `sitemap.xml`.
- Aggiornata la versione applicativa per distribuire il ritocco agli script di pubblicazione.

## 4.5.31 - 2026-05-20

- Completata la pagina Premi con metadati social, JSON-LD e footer Privacy/Cookie coerente con il resto del sito.
- Aggiornata la FAQ con domande dedicate alla bacheca premi e al download PNG/JPEG.
- Riallineati i dati strutturati `dateModified` e la sitemap per le pagine pubbliche aggiornate.
- Puliti stili CSS non standard e permessi locali dei file pubblici.

## 4.5.30 - 2026-05-20

- Riallineata la homepage centrando il contenitore principale e la griglia delle materie.
- Uniformato il link Premi della testata allo stile compatto del link FAQ.
- Aggiornata la versione applicativa per invalidare la cache PWA del CSS home.

## 4.5.29 - 2026-05-20

- Resa pubblica e indicizzabile la pagina Premi, con link visibile dalla homepage.
- Aggiunta una guida nella bacheca per spiegare ai bambini come sbloccare badge, coppe, coccarde e trofei.
- Aggiornata la sitemap includendo `/premi` e rimossi gli header `noindex` dalla pagina.
- Confermato che i premi si conquistano solo completando le partite.

## 4.5.28 - 2026-05-20

- Aggiunta la pagina Premi con bacheca locale per badge, coccarde, coppe, corone e trofei.
- Collegato il sistema premi ai completamenti dei quiz su tutte le materie, con progressi salvati solo in localStorage.
- Aggiunta esportazione della bacheca in PNG/JPEG.
- Aggiornati Service Worker, redirect, documentazione e versione applicativa per distribuire la nuova funzione.

## 4.5.27 - 2026-05-18

- Corrette domande generate con etichette tecniche residue nei dataset di Italiano, Inglese e Matematica.
- Rifinite concordanze e formulazioni in Problemi, Scienze e Geografia per rendere più naturale il testo mostrato ai bambini.
- Aggiunto un audit automatico sui JSON delle materie per bloccare errori strutturali e pattern testuali non adatti alla pubblicazione.
- Aggiornata la versione applicativa per invalidare la cache PWA e distribuire subito i dataset corretti.

## 4.5.26 - 2026-05-18

- Rimosse dal runtime pubblico le funzioni sperimentali non più in uso, mantenendo stabile il flusso quiz.
- Ripuliti collegamenti interni, cache offline e testi informativi collegati alle funzioni rimosse.
- Preparata la base per un futuro sistema reward locale basato su riconoscimenti non monetari.

## 4.5.25 - 2026-05-17

- Ripristinati gli effetti audio generati dal browser per risposta corretta/sbagliata, streak, avvio, bonus e completamento.
- Confermato che il progetto non usa file audio, TTS o esercizi basati su ascolto da ripensare senza audio.
- Aggiornata la versione applicativa per distribuire correttamente il ripristino degli FX anche ai client PWA.

## 4.5.23 - 2026-05-17

- Ingrandita la mascotte nel titolo della homepage al doppio della dimensione precedente.
- Mantenuto il testo “La Scuola Amica” centrato rispetto al centro della pagina.
- Aggiornata la versione applicativa per evitare residui di cache nelle PWA già installate.

## 4.5.22 - 2026-05-17

- Avvicinato il sottotitolo “Scegli la tua materia e inizia a giocare!” al titolo della homepage.
- Conservato il centraggio del testo “La Scuola Amica” rispetto al centro della pagina.
- Aggiornata la versione applicativa per distribuire il CSS corretto ai client PWA.

## 4.5.21 - 2026-05-17

- Ridotta del 50% la mascotte nel titolo della homepage.
- Mantenuta la mascotte al posto dell’emoji, con resa più discreta e senza overflow mobile.
- Aggiornata la versione applicativa per distribuire il nuovo CSS ai client PWA.

## 4.5.20 - 2026-05-17

- Spostata la mascotte Cervellino dentro il titolo della homepage, al posto dell’emoji scuola.
- Ridimensionata la mascotte alla scala del testo del titolo, circa 70 px da desktop.
- Rimossa la mascotte grande sopra “La Scuola Amica” per rendere la hero più compatta.

## 4.5.19 - 2026-05-17

- Migliorato il contrasto di score bar e pulsanti principali nei flussi quiz, evitando testo piccolo in colori accento troppo chiari.
- Aggiornata la versione applicativa per distribuire correttamente i CSS modificati anche ai client con cache offline.

## 4.5.18 - 2026-05-14

- Applicato un pass SEO leggero su `scienze` e `italiano`.
- Aggiornati titoli, meta description, Open Graph, Twitter card e descrizioni JSON-LD delle due pagine.
- Rifiniti anche i testi statici visibili per rendere più chiaro il focus su esercizi e quiz per la scuola primaria.

## 4.5.17 - 2026-05-14

- Rafforzato il secondo cluster SEO con ottimizzazioni mirate su `geografia`, `storia` e `faq`.
- Aggiornati titoli, meta description, Open Graph e Twitter card per rendere gli snippet più chiari e coerenti con gli intenti di ricerca.
- Allineati anche i dati strutturati e i testi visibili delle tre pagine per consolidare rilevanza semantica e CTR potenziale.

## 4.5.16 - 2026-05-14

- Ottimizzati titoli, meta description e contenuti SEO statici di inglese, educazione civica e matematica.
- Allineati anche Open Graph, Twitter card e descrizioni JSON-LD delle tre pagine con miglior ROI organico.
- Aggiornati i `dateModified` delle pagine coinvolte per riflettere il refresh editoriale.

## 4.5.15 - 2026-05-14

- Compattate le classifiche dei quiz e di inglese riducendo le colonne principali, così risultano più leggibili anche su smartphone.
- Mantenuti i dettagli completi di punteggio in forma discreta tramite tooltip, evitando di appesantire la tabella per bambini e genitori.

## 4.5.14 - 2026-05-14

- Corrette alcune segnalazioni di qualità sul runtime: footer versione coerente, precache del Service Worker ripulita e score-bar più robusta in assenza di elementi DOM.
- Ripulito il motore inglese rimuovendo codice timer inattivo, migliorando l'accessibilità dei livelli bloccati e impedendo confetti residui dopo la navigazione.
- Migliorata la leggibilità mobile delle classifiche con contenitore a scorrimento orizzontale e target touch espliciti per classi e ambiti.

## 4.5.10 - 2026-05-08

- Rimossi gli ultimi stili applicati via attributo nel runtime pubblico e nell’editor interno, convertendoli in classi CSS condivise.
- Introdotti `utilities.css` e `js/dom-utils.js` come layer comune per visibilità, lock dello scroll, varianti decorative e replay animazioni.
- Convertiti i decorativi random di home, FAQ e motori quiz in varianti CSS precalcolate compatibili con una CSP più rigida.
- Stretta la CSP in `_headers` sostituendo `style-src-attr 'unsafe-inline'` con `style-src-attr 'none'`.
- Aggiornato il service worker per precaricare le nuove utility condivise e forzare il refresh client con la versione `4.5.10`.

## Unreleased - 2026-04-27

- Introdotta finestra locale di gioco da 30 minuti: per avviare una partita il timer deve essere attivato sul dispositivo, senza account o cookie e con supporto offline.
- Aggiunto cooldown locale di 60 minuti dopo la scadenza del timer prima di poter riattivare una nuova sessione di gioco.
- Resa più discreta la UI del timer nella home, mantenendo più evidente il pannello nelle schermate iniziali delle materie.
- FAQ pubbliche aggiornate con spiegazione del flusso `30 minuti di gioco + 60 minuti di pausa`.
- Aggiunti pannelli timer condivisi su home e schermate iniziali delle materie, con conto alla rovescia e attivazione esplicita del tempo di gioco.
- Aggiunto indicatore compatto del tempo residuo nella score bar durante la partita.
- I motori quiz (`subject-quiz-core`, `inglese`, `problemi`, `civica`) bloccano l’avvio se il timer non è attivo e interrompono la sessione quando la finestra dei 30 minuti scade.
- Fase 2 audit tecnico completata: sostituiti i dialog nativi principali con modali condivisi (`SA.ui.confirm` / `SA.ui.alert`) nei motori quiz e nell’update prompt.
- Migliorata la coerenza “Meno animazioni” anche lato runtime JS (`subject-quiz-core`, `inglese`, `problemi`, `civica`, `index-page`), inclusa la disattivazione confetti in inglese.
- Automatizzato l’aggiornamento dei contenuti strutturati e della sitemap prima della pubblicazione.
- Accessibilità/touch ergonomics: aumentate dimensioni minime dei toggle Palette/Animazioni (target 44px+) nel pannello Info.
- Testi privacy/FAQ allineati al nuovo comando “Cancella dati locali”.

## 4.5.8 - 2026-05-07

- Migliorati i segnali per i crawler per separare meglio i contenuti pubblici dalle aree tecniche.
- Aggiornata la sitemap con date di modifica più affidabili per riflettere meglio gli ultimi cambiamenti.
- Ottimizzati i contenuti dati del sito per ridurre il peso dei caricamenti e migliorare la rapidità d’uso.
- Ridotto ulteriormente l’uso di stili inline con una struttura CSS più ordinata e sicura.

## 4.5.7 - 2026-05-07

- Allineata la versione applicativa a `4.5.7` con sincronizzazione del footer dal runtime condiviso e aggiornamento dei riferimenti statici residui.
- Aggiunte alle pagine informative le funzioni condivise principali: pannello Info, palette accessibile e preferenza “Meno animazioni”.
- Allineati i segnali per motori di ricerca e sistemi di risposta con una comunicazione pubblica più coerente.
- Ottimizzati gli asset della mascotte “Cervellino” per ridurre il peso delle immagini e migliorare la velocità su mobile.

- Mascotte “Cervellino” integrata in PNG trasparente con 4 stati (`neutral`, `happy`, `sad`, `celebrate`) su tutte le materie.
- Allineati i motori quiz (`subject-quiz-core`, `inglese`, `problemi`, `civica`) al nuovo stato mascotte con feedback dinamico durante partita/bonus/risultato.
- Pagine informative (`chi-siamo`, `per-insegnanti`, `per-genitori`, `ai-info`) rese più sobrie con stylesheet dedicato `info-pages.css`.
- Service Worker: precache esteso ai nuovi asset mascotte PNG e al nuovo stylesheet informativo.
- Audit UX/UI bambini: aumentata la leggibilità dei microtesti (classi/ambiti, score label, breadcrumb) e migliorato il contrasto dei tag/card in home.
- Quiz feedback: progress dots più grandi, stato risposta corretto/sbagliato più evidente (non solo colore), animazione feedback estesa e celebrativa.
- Mascotte estesa alle pagine quiz materie (🦉) con stato dinamico nei motori quiz condivisi e dedicati.
- Riduzione distrazioni: diminuito il numero/opacity degli elementi decorativi animati nelle pagine principali.
- Accessibilità movimento: aggiunto toggle “Animazioni: Automatiche / Meno animazioni” nel pannello Info con preferenza persistente sul dispositivo.
- Layout contenuti: spostate le sezioni `seo-static` fuori dalla card interattiva principale nelle pagine quiz.
- SEO social: create e collegate 8 Open Graph image dedicate per le materie (`og-<materia>-1200x630.jpg`).
- Nuova pagina pubblica `chi-siamo` con metadata SEO/OG/JSON-LD, breadcrumb e integrazione in sitemap.
- Info Hub: aggiunto link rapido “Chi siamo” nel pannello Info condiviso (`shared.js`).
- PWA hardening: introdotte favicon/icone fisiche (`favicon.svg`, `.ico`, `icons/*.png`) e manifest aggiornato senza data URI SVG.
- Allineamento runtime script IIFE: rimossi `type=\"module\"` in favore di script `defer` classici.
- Sicurezza policy: rimossi meta CSP/Permissions-Policy duplicati dalle pagine HTML e centralizzata la gestione degli header di sicurezza.
- Accessibilità/robustezza: aggiunto fallback `<noscript>` su tutte le pagine pubbliche.
- README: rimosso percorso locale iCloud personale dalla sezione avvio in locale.
- GEO: aggiunto file `llms.txt` alla radice progetto.
- Nuove pagine informative pubbliche: `per-insegnanti`, `per-genitori`, `ai-info`.
- FAQ: refactor semantico elenco domande (`ul/li` + `details`) per maggiore robustezza screen reader.
- Accessibilità: aggiunti skip link e `id=\"contenuto-principale\"` alle pagine statiche mancanti.
- SEO social: aggiunte Open Graph image dedicate per `faq`, `supporta`, `accessibilita`, `per-insegnanti`, `per-genitori`, `ai-info`.
- Routing/sitemap: estese rotte pulite e sitemap alle nuove pagine informative.
- Licenza repository: aggiunto file `LICENSE` (MIT) e aggiornato `README.md`.

- Config materie: priorità a `window.SA.subjectConfig` con alias legacy mantenuto su `window.SUBJECT_CONFIG`.
- Aggiunto controllo prepublish che blocca riferimenti runtime diretti a `questions.json` (architettura split JSON enforced).
- Core quiz: rimosso fallback a `window.SUBJECT_CONFIG`, ora usa configurazione da `window.SA.subjectConfig`.
- Config materie (matematica/geografia/scienze/storia/italiano): eliminate assegnazioni globali dirette, mantenuta sola scrittura su namespace `SA`.
- Avviata migrazione ES modules: `index.html` e `faq.html` ora caricano `js/index-page.js` e `js/faq-page.js` con `type="module"`.
- Estesa migrazione ES modules a tutte le pagine applicative: tutti gli script runtime `src` ora usano `type="module"`.
- Rimossi alias globali legacy a favore del namespace `window.SA.*`.
- Deprecato e rimosso `questions.json` dal repo runtime; build aggiornata per generarlo solo su richiesta (`GENERATE_LEGACY_QUESTIONS_JSON=true`).
- Aggiornata la documentazione tecnica per allineare l’architettura dati a una struttura più modulare.
- Merge completo dei nuovi dataset domande validati (`8` materie) nei file `json/*.json`.
- Aggiornato `json/index.json` con nuove cardinalità per materia e totale complessivo (`7348` domande).
- Verifica integrità post-merge completata su tutte le materie con esito `PASS`.
- Corretto un refuso strutturale nel dataset italiano (`ita-2-ortografia-005`) per rimuovere un'opzione duplicata.
- Hardening CSP: rimossi gli script inline eseguibili dalle pagine pubbliche e spostati in `js/*.js`.
- Aggiornata la policy CSP nelle pagine principali con `script-src 'self'` (senza `unsafe-inline`).
- Aggiornato `sw.js` per includere in precache i nuovi script pagina.
- Migliorata la resilienza errori: rimossi i `catch` vuoti nei moduli principali, con logging silenzioso in modalità debug (`?debug` / localhost).
- Aggiunto fallback UX nel motore quiz: se il caricamento domande fallisce viene mostrato un messaggio chiaro all’utente.
- Verifiche tecniche completate con `node --check` e `prepublish-check.sh` (esito OK).
- Aggiornato il sistema di selezione domande con planner stocastico a slot (`area + difficoltà`) per ridurre pattern ripetitivi tra sessioni.
- Potenziata la logica anti-ripetizione multi-sessione con cooldown su ID e firma domanda, più selezione `softmax` dei candidati.
- Introdotte metriche locali di qualità sessione (`repeat rate`, `coverage`, `entropy`, `novelty`) salvate sul dispositivo con media rolling.
- Allineata la nuova logica algoritmo su tutte le materie quiz:
  - motore condiviso `subject-quiz-core.js` per matematica, italiano, geografia, storia, scienze
  - motori dedicati `js/inglese-page.js`, `js/problemi-page.js`, `js/civica-page.js` con la stessa strategia avanzata
- Esteso il generatore parametrico con profili `small`/`extended` e seed configurabile.
- Aggiunto un report CSV automatico di copertura domande generato a ogni esecuzione del generatore.
- Aggiunto anche un report CSV di sintesi con una riga per materia.
- Aggiunto flag `--report-only` per produrre solo il report CSV senza modificare i dataset.
- Eseguito il profilo `extended` sui dataset domande con controllo anti-duplicati e ID incrementali:
  - `matematica`: +128 domande parametriche (`totalQuestions=1716`)
  - `problemi`: +120 domande parametriche (`totalQuestions=920`)
  - `inglese`: +51 domande parametriche (`totalQuestions=334`)
- Aggiornati automaticamente `json/index.json`, `stats.rows`, `stats.areas`, `stats.classes` e timestamp `generatedAt`.

## 4.5.5 - 2026-05-01

- Aggiornata la versione applicativa a `4.5.5` (`app-version.js`, fallback runtime, footer pagine e metadati operativi).
- Aggiornata la sezione “Ultimi aggiornamenti” con lo storico dal 29 aprile al 1 maggio 2026.
- Completata la Fase 2 runtime: modali condivisi (`SA.ui.confirm` / `SA.ui.alert`) per dialog principali e update prompt.
- Migliorata la coerenza “Meno animazioni” lato JavaScript su home e motori quiz dedicati, con confetti disattivati quando richiesto.
- Automatizzati gli aggiornamenti dei contenuti strutturati e della sitemap prima della pubblicazione.
- Completata la Fase 3: aggiunto comando “Cancella dati locali” nel pannello Info e allineati i testi Privacy/FAQ.
- Accessibilità/touch ergonomics: target minimi dei toggle Palette/Animazioni portati a 44px+.

## 4.5.6 - 2026-05-06

- Migliorata la stabilità offline delle pagine principali e ridotti i redirect non necessari durante l’uso del sito.
- Rafforzata la continuità di navigazione sulle URL canoniche anche senza connessione.
- Versione applicativa aggiornata a `4.5.6` per riallineare la cache locale dei client.

## 4.5.2 - 2026-04-29

- Aggiornata la versione applicativa a `4.5.2` (`app-version.js`, fallback runtime e footer pagine).
- Service Worker: corretta gestione offline delle URL pulite con fallback cache più robusto.
- Service Worker: bump cache runtime a `lascuolaamica-v455` per forzare reinstallazione client con gli ultimi asset/fix.
- Allineato il meta `mobile-web-app-capable` su tutte le pagine HTML pubbliche.
- Font self-hosted consolidati su asset locali e documentazione tecnica sincronizzata (README + wiki).

## 4.5.1 - 2026-04-28

- Aggiornata la versione applicativa a `4.5.1` (`app-version.js`, footer pagine e fallback runtime).
- Rafforzata la parte GEO con `founder` + `foundingDate` nell’Organization JSON-LD.
- Aggiunto `numberOfQuestions` nei JSON-LD delle 8 pagine materia.
- FAQ e `llms.txt` allineati con dati quantitativi progetto (oltre 7.300 domande, totale 7.348).
- Esteso il supporto `data-motion="reduce"` a `faq.css` e `info-pages.css`.
- Aggiornata la pagina Accessibilità con la nuova versione portale.
- Aggiornati gli asset PNG della mascotte “Gufo Cervellino” (`neutral`, `happy`, `sad`, `celebrate`) e aggiunto il nuovo stato homepage `cervellino-waving-03.png`.
- Homepage: introdotta la mascotte di benvenuto nell’header (`.mascot-home`) con animazione di entrata + idle, sincronizzata con il toggle “Meno animazioni”.
- Quiz: mascotte domanda ridimensionata in modo responsive (88/128 base, 96/138 da tablet) e aggiunta mascotte grande nella schermata risultato con stato emotivo dinamico.
- Service Worker: precache esteso al nuovo asset `assets/mascotte/cervellino-waving-03.png`.

## 4.2.1 - 2026-04-18

- Completata validazione WCAG 2.1 A/AA manuale su tastiera, modali, zoom/reflow, VoiceOver e riduzione movimento.
- Corretto il reflow della home a zoom 200% (evitati tagli di card e testi).
- Pubblicata la pagina `accessibilita` con dichiarazione, metodologia e canale segnalazioni.
- Aggiunti link alla pagina Accessibilità in FAQ, Supporto e pannello Info.
- Aggiornati `sitemap.xml` e precache service worker con la nuova pagina.
- Versione portale aggiornata alla `4.2.1`.

## 4.2 - 2026-04-18

- Audit WCAG 2.1 AA automatico sulle pagine principali (rule set `wcag2a` e `wcag2aa`).
- Impostata la palette standard come default e mantenuto il toggle Standard/Accessibile.
- Rigenerati screenshot social home (`390x844`, `1280x720`, `1200x630`) senza footer.
- Deduplicati i dataset domande con rinumerazione ID e allineamento JSON aggregati.
- Aggiornata la versione applicativa e la sezione “Ultimi aggiornamenti” alla `4.2`.

## 4.1.1 - 2026-04-13

- Uniformate canonical, Open Graph URL, JSON-LD e link interni alle rotte senza estensione `.html`.
- Aggiornata la sitemap con URL canonici senza estensione.
- Aggiornata la pagina supporto con indicazione email `supporto@lascuolaamica.it`.

## 4.1 - 2026-04-12

- Revisione linguistica estesa (accenti, apostrofi, forme corrette).
- Correzione refusi in domande e testi informativi.
- Fix stringhe JS con apostrofi che causavano errori di sintassi.
- Allineamento dati in JSON materia e aggregato.
- Sincronizzazione `export` con stato aggiornato.

## Nota

Lo storico funzionale dettagliato mostrato all'utente è mantenuto nel pannello “Ultimi aggiornamenti” (`shared.js`).
