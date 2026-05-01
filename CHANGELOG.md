# Changelog Repo

## Unreleased - 2026-04-27

- Fase 2 audit tecnico completata: sostituiti i dialog nativi principali con modali condivisi (`SA.ui.confirm` / `SA.ui.alert`) nei motori quiz e nell’update prompt.
- Migliorata la coerenza “Meno animazioni” anche lato runtime JS (`subject-quiz-core`, `inglese`, `problemi`, `civica`, `index-page`), inclusa la disattivazione confetti in inglese.
- Pipeline export Cloudflare aggiornata: esecuzione automatica di `refresh_structured_data.py` e `generate_sitemap.py` prima del sync.
- Fase 3 avviata: aggiunto nel pannello Info il comando “Cancella dati locali” per rimuovere progressi, crediti, classifiche e preferenze salvate sul dispositivo.
- Accessibilità/touch ergonomics: aumentate dimensioni minime dei toggle Palette/Animazioni (target 44px+) nel pannello Info.
- Testi privacy/FAQ allineati al nuovo comando “Cancella dati locali”.

- Mascotte “Cervellino” integrata in PNG trasparente con 4 stati (`neutral`, `happy`, `sad`, `celebrate`) su tutte le materie.
- Allineati i motori quiz (`subject-quiz-core`, `inglese`, `problemi`, `civica`) al nuovo stato mascotte con feedback dinamico durante partita/bonus/risultato.
- Villaggio: aggiunta micro-celebrazione visiva all’acquisto (tile pop + flash card shop) con toast di conferma costruzione.
- Pagine informative (`chi-siamo`, `per-insegnanti`, `per-genitori`, `ai-info`) rese più sobrie con stylesheet dedicato `info-pages.css`.
- Service Worker: precache esteso ai nuovi asset mascotte PNG e al nuovo stylesheet informativo.
- Audit UX/UI bambini: aumentata la leggibilità dei microtesti (classi/ambiti, score label, breadcrumb) e migliorato il contrasto dei tag/card in home.
- Touch ergonomics: uniformati target minimi dei controlli principali (`back`, `skip bonus`, `icon button`, `close modal`, bottoni Villaggio).
- Quiz feedback: progress dots più grandi, stato risposta corretto/sbagliato più evidente (non solo colore), animazione feedback estesa e celebrativa.
- Mascotte estesa alle pagine quiz materie (🦉) con stato dinamico nei motori quiz condivisi e dedicati.
- Riduzione distrazioni: diminuito il numero/opacity degli elementi decorativi animati nelle pagine principali.
- Accessibilità movimento: aggiunto toggle “Animazioni: Automatiche / Meno animazioni” nel pannello Info con persistenza su `localStorage`.
- Layout contenuti: spostate le sezioni `seo-static` fuori dalla card interattiva principale nelle pagine quiz.
- SEO social: create e collegate 8 Open Graph image dedicate per le materie (`og-<materia>-1200x630.jpg`).
- Nuova pagina pubblica `chi-siamo` con metadata SEO/OG/JSON-LD, breadcrumb e integrazione in sitemap.
- Info Hub: aggiunto link rapido “Chi siamo” nel pannello Info condiviso (`shared.js`).
- PWA hardening: introdotte favicon/icone fisiche (`favicon.svg`, `.ico`, `icons/*.png`) e manifest aggiornato senza data URI SVG.
- Allineamento runtime script IIFE: rimossi `type=\"module\"` in favore di script `defer` classici.
- Sicurezza policy: rimossi meta CSP/Permissions-Policy duplicati dalle pagine HTML (restano su `_headers`).
- Accessibilità/robustezza: aggiunto fallback `<noscript>` su tutte le pagine pubbliche.
- README: rimosso percorso locale iCloud personale dalla sezione avvio in locale.
- GEO: aggiunto file `llms.txt` alla radice progetto.
- Nuove pagine informative pubbliche: `per-insegnanti`, `per-genitori`, `ai-info`.
- FAQ: refactor semantico elenco domande (`ul/li` + `details`) per maggiore robustezza screen reader.
- Accessibilità: aggiunti skip link e `id=\"contenuto-principale\"` alle pagine statiche mancanti.
- SEO social: aggiunte Open Graph image dedicate per `faq`, `supporta`, `accessibilita`, `per-insegnanti`, `per-genitori`, `ai-info`.
- Routing/sitemap: estese rotte pulite e sitemap alle nuove pagine informative.
- Licenza repository: aggiunto file `LICENSE` (MIT) e aggiornato `README.md`.

- Villaggio: introdotto aggiornamento griglia mirato (`paintTile` + `updateGridArea`) per ridurre i rerender completi su piazzamento/rimozione/selezione.
- Config materie: priorità a `window.SA.subjectConfig` con alias legacy mantenuto su `window.SUBJECT_CONFIG`.
- Aggiunto controllo prepublish che blocca riferimenti runtime diretti a `questions.json` (architettura split JSON enforced).
- Core quiz: rimosso fallback a `window.SUBJECT_CONFIG`, ora usa configurazione da `window.SA.subjectConfig`.
- Config materie (matematica/geografia/scienze/storia/italiano): eliminate assegnazioni globali dirette, mantenuta sola scrittura su namespace `SA`.
- Avviata migrazione ES modules: `index.html` e `faq.html` ora caricano `js/index-page.js` e `js/faq-page.js` con `type="module"`.
- Estesa migrazione ES modules a tutte le pagine applicative: tutti gli script runtime `src` ora usano `type="module"`.
- Rimossi alias globali legacy (`window.QuestionsLoader`, `window.ScuolaEconomy`, `window.ScuolaPalette`, `window.openModal/closeModal`) a favore di `window.SA.*`.
- Deprecato e rimosso `questions.json` dal repo runtime; build aggiornata per generarlo solo su richiesta (`GENERATE_LEGACY_QUESTIONS_JSON=true`).
- Aggiornati `_headers`, `README` e wiki architettura per allineamento definitivo a dataset split `json/index.json` + `json/*.json`.
- Merge completo dei nuovi dataset domande validati (`8` materie) nei file `json/*.json`.
- Aggiornato `json/index.json` con nuove cardinalità per materia e totale complessivo (`7348` domande).
- Verifica integrità post-merge completata su tutte le materie (`PASS`) con report tecnico `reports/post_merge_validation_v3.json`.
- Corretto un refuso strutturale nel dataset italiano (`ita-2-ortografia-005`) per rimuovere un'opzione duplicata.
- Hardening CSP: rimossi gli script inline eseguibili dalle pagine pubbliche e spostati in `js/*.js`.
- Aggiornata la policy CSP nelle pagine principali con `script-src 'self'` (senza `unsafe-inline`).
- Aggiornato `sw.js` per includere in precache i nuovi script pagina.
- Migliorata la resilienza errori: rimossi i `catch` vuoti nei moduli principali, con logging silenzioso in modalità debug (`?debug` / localhost).
- Aggiunto fallback UX nel motore quiz: se il caricamento domande fallisce viene mostrato un messaggio chiaro all’utente.
- Verifiche tecniche completate con `node --check` e `prepublish-check.sh` (esito OK).
- Aggiornato il sistema di selezione domande con planner stocastico a slot (`area + difficoltà`) per ridurre pattern ripetitivi tra sessioni.
- Potenziata la logica anti-ripetizione multi-sessione con cooldown su ID e firma domanda, più selezione `softmax` dei candidati.
- Introdotte metriche locali di qualità sessione (`repeat rate`, `coverage`, `entropy`, `novelty`) salvate in `localStorage` con media rolling.
- Allineata la nuova logica algoritmo su tutte le materie quiz:
  - motore condiviso `subject-quiz-core.js` per matematica, italiano, geografia, storia, scienze
  - motori dedicati `js/inglese-page.js`, `js/problemi-page.js`, `js/civica-page.js` con la stessa strategia avanzata
- Esteso il generatore parametrico `scripts/append_parametric_pilot.py` con profili `small`/`extended` e seed configurabile.
- Aggiunto report CSV automatico di copertura domande (`reports/questions_coverage_latest.csv` + archivio timestampato) generato a ogni run del generatore.
- Aggiunto anche report CSV di sintesi (`reports/questions_coverage_summary_latest.csv` + archivio timestampato) con 1 riga per materia.
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
- Pipeline export Cloudflare automatizzata con refresh JSON-LD + rigenerazione sitemap pre-sync.
- Completata la Fase 3: aggiunto comando “Cancella dati locali” nel pannello Info e allineati i testi Privacy/FAQ.
- Accessibilità/touch ergonomics: target minimi dei toggle Palette/Animazioni portati a 44px+.

## 4.5.2 - 2026-04-29

- Aggiornata la versione applicativa a `4.5.2` (`app-version.js`, fallback runtime e footer pagine).
- Service Worker: corretta gestione offline delle clean URLs (`request.mode === 'navigate'`) con fallback cache su variante `.html`.
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
- Corrette le criticità di contrasto nel tema standard per home, FAQ e Villaggio.
- Impostata la palette standard come default e mantenuto il toggle Standard/Accessibile.
- Rigenerati screenshot social home (`390x844`, `1280x720`, `1200x630`) senza footer.
- Deduplicati i dataset domande con rinumerazione ID e allineamento JSON aggregati.
- Aggiornata la versione applicativa e la sezione “Ultimi aggiornamenti” alla `4.2`.

## 4.1.1 - 2026-04-13

- Uniformate canonical, Open Graph URL, JSON-LD e link interni alle rotte senza estensione `.html`.
- Aggiornata la sitemap con URL canonici senza estensione.
- Rimossi dalla sitemap gli URL non visibili (`villaggio`, `supporto-satispay`).
- Impostato `noindex,nofollow` su `villaggio` e `supporto-satispay`.
- Aggiornata la pagina supporto con indicazione email `supporto@lascuolaamica.it`.

## 4.1 - 2026-04-12

- Revisione linguistica estesa (accenti, apostrofi, forme corrette).
- Correzione refusi in domande e testi informativi.
- Fix stringhe JS con apostrofi che causavano errori di sintassi.
- Allineamento dati in JSON materia e aggregato.
- Sincronizzazione `export` con stato aggiornato.

## Nota

Lo storico funzionale dettagliato mostrato all'utente è mantenuto nel pannello “Ultimi aggiornamenti” (`shared.js`).
