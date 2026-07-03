# Piano qualità sito — La Scuola Amica (rev. luglio 2026)

**Focus:** qualità tecnica del sito, UX/UI, sicurezza, stabilità, SEO, AEO/GEO, correttezza.
**Contesto:** i piani contenuti (`PIANO-MIGLIORAMENTO-2026.md` / `PIANO-PROMPT-OPERATIVI-2026.md`) sono di fatto chiusi: **9.879 domande**, difficoltà uniformata, subarea popolate, funzioni app A1–A4 in produzione (`subject-quiz-core.js`: `ADAPT_KEY`, `WRONG_Q_KEY`). Questo piano copre ciò che resta per portare **il sito** (non il dataset) al massimo.

---

## 1. Diagnosi tecnica (analisi HTML/CSS/JS — verificata)

### Già solido — NON toccare
- **JSON-LD ricco e coerente** su ogni pagina: `WebSite`, `BreadcrumbList`, `FAQPage`, `EducationalAudience`, `EducationalOrganization`. AEO/GEO già forte.
- **reduced-motion** coperto da kill-switch globale `*` in `index.css:545` (`!important`), che disattiva anche le animazioni inline della home (sun/cloud/bounce/mascot). Nessun intervento necessario.
- **Header di sicurezza** in `_headers`: HSTS con `includeSubDomains`, COOP, CORP, `X-Frame-Options: DENY`, `Permissions-Policy` restrittiva, `X-Content-Type-Options: nosniff`. CSP con hash (no `unsafe-inline`), `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'`.
- **PWA**: SW con Cache-First statici / Network-First navigazioni, precache core atomico + opzionale tollerante ai 404, pulizia cache vecchie in `activate`. Solido.
- **Modalità accessibile Okabe-Ito** (guard `html:not([data-palette="okabe-ito"])`) — vincolo invariante in ogni restyle.

### Criticità verificate (priorità)

| # | Problema | Evidenza | Impatto |
|---|----------|----------|---------|
| **Q1** | Conteggio domande stale e visibile | `index.html:237` → "✓ 7.000+ domande" (reale **9.879**) | Sfiducia utente, sottostima nei rich snippet |
| **Q2** | Freshness drift SEO | `sitemap.xml` lastmod `2026-05-30`; JSON-LD `dateModified` `2026-05-23`; contenuti toccati `2026-07-01` | Segnali di aggiornamento vecchi di ~5 settimane; Google percepisce sito fermo |
| **Q3** | Automazione freshness non agganciata | `scripts/generate_sitemap.py` e `scripts/refresh_structured_data.py` esistono ma non girano nel rilascio | La drift Q2 si ripete a ogni release |
| **Q4** | Meta description oltre soglia | fino a **189 char** su più pagine (>160 troncano in SERP) | CTR organico ridotto, messaggio tagliato |
| **Q5** | Asset non minificati | `shared.js` 90KB, `subject-quiz-core.js` 91KB, `subject-quiz-theme.css` 50KB serviti raw | LCP/TBT mobile, byte inutili sotto rete lenta |
| **Q6** | Over-preload font | 5 `<link rel=preload as=font>` per pagina materia | Contesa banda al primo paint, LCP potenzialmente peggiore |
| **Q7** | Fragilità CSP inline | 46 hash script in `_headers`, sincronizzati a mano via `sync_csp_hashes.py` | Ogni micro-edit inline rompe la CSP se il sync salta; superficie d'errore |
| **Q8** | Hardening residuo header | manca `Reporting-Endpoints`/`report-to`, nessun report CSP; opzionale `require-trusted-types-for` | Nessuna visibilità su violazioni CSP in produzione |

> Nota metodo: ogni criticità è stata confermata sui file, non dedotta. Voci scartate in analisi (es. reduced-motion sulle animazioni home) perché già gestite.

---

## 2. Principi di esecuzione (risparmio token)

1. **Modello per peso del compito.** Deterministico/meccanico → `haiku`. UI/contenuto testuale → `sonnet`. Architettura, sicurezza, decisioni di build → `opus` (input limitato).
2. **Contesto scoped.** Ogni agente riceve solo i file su cui lavora, mai l'intero repo.
3. **Gate invariati.** Ogni task che tocca output pubblico chiude con `./prepublish-check.sh` + `npm run verify`; chi tocca CSP inline rilancia `npm run audit:csp`.
4. **Okabe-Ito intatto** e **soglie Lighthouse** (a11y ≥ 0.95) come vincoli non negoziabili.
5. **Effort.** Low = nessun ragionamento esteso. Medium = normale. High = esteso.

`subagent_type`: `general-purpose` (multi-step con scrittura), `Explore` (audit read-only), `Plan` (architettura read-only). La persona va **dentro** il prompt.

---

## 3. Attività

### Gruppo A — Accuratezza & Freshness (rapido, alto ROI SEO)

#### A1 — Correggere il conteggio domande stale
- **Persona:** Frontend maintainer · **subagent:** `general-purpose` · **modello:** `haiku` · **effort:** Low
- **Dipendenze:** nessuna · **Parallelo:** sì
```
Sei un frontend maintainer. Il totale reale domande è 9.879 (fonte: json/index.json). Cerca in TUTTI gli .html della root ogni stringa che cita un conteggio domande stale (es. "7.000+", "7000+", "7.375") e allineala al reale usando un arrotondamento onesto ("9.800+" o "9.879"). In index.html la riga interessata è la .main-facts (~riga 237). Se un valore è già reso dinamico da js (#questionsTotalCount), NON duplicarlo a mano. Verifica che non restino conteggi divergenti tra pagine, llms.txt e README. Chiudi con ./prepublish-check.sh. Aggiorna CHANGELOG.
```

#### A2 — Rigenerare sitemap + JSON-LD dates e agganciarli al rilascio
- **Persona:** Build/DevX engineer · **subagent:** `general-purpose` · **modello:** `sonnet` · **effort:** Medium
- **Dipendenze:** nessuna (chiude Q2 e Q3) · **Parallelo:** sì
```
Sei un build engineer. 1) Esegui scripts/generate_sitemap.py e scripts/refresh_structured_data.py e verifica che sitemap.xml e i blocchi JSON-LD dateModified riflettano le date reali dei file (git mtime). 2) Aggancia entrambi gli script alla pipeline di rilascio: aggiungi uno script npm "freshness" che li lancia in sequenza, e invocalo dentro prepublish-check.sh PRIMA dei controlli sitemap esistenti (così una sitemap stale fallisce il gate). Non alterare la logica interna degli script se non necessario. Mostra il diff di sitemap.xml e delle date JSON-LD. Chiudi con ./prepublish-check.sh e aggiorna CHANGELOG.
```

#### A3 — Ottimizzare le meta description (>160 char)
- **Persona:** SEO copywriter IT · **subagent:** `general-purpose` · **modello:** `sonnet` · **effort:** Medium
- **Dipendenze:** nessuna · **Parallelo:** sì
```
Sei un copywriter SEO italiano per un sito educativo per bambini. Individua in tutti gli .html della root le <meta name="description"> più lunghe di 160 caratteri (fino a 189) e riscrivile a 150-160 caratteri, mantenendo la keyword principale in testa, tono chiaro per genitori/insegnanti, senza clickbait e senza cambiare il significato. Allinea coerentemente og:description/twitter:description se ridondanti o troppo lunghi. Non toccare title, canonical, robots. Elenca prima/dopo con la lunghezza per pagina. Chiudi con ./prepublish-check.sh e CHANGELOG.
```

### Gruppo B — Performance

#### B1 — Minificazione asset statici in fase di build — ✅ GIÀ FATTO (verificato 2026-07-03)
- **Esito:** già implementato e in produzione. Il build command di deploy è `scripts/export_for_cloudflare.sh`, che nella funzione `minify_export_assets()` esegue `esbuild --minify --legal-comments=none --target=es2020` su **tutti** i .js/.css nella dir `export/` (l'output pubblicato). Non-distruttivo: i sorgenti in root restano leggibili/editabili a mano; le copie minificate vivono in `export/` (gitignored).
- **Perché non rompe nulla:** esbuild tocca solo i file ESTERNI (`script-src 'self'`, nessun hash); gli script inline in HTML non vengono toccati → hash CSP invariati; i nomi file restano identici → precache SW intatto.
- **Guadagno reale misurato** (poi ulteriormente ridotto da brotli all'edge): shared.js 90→64KB (gzip 21.6→18.2), subject-quiz-core.js 91→45KB (gzip 22.1→15.1), subject-quiz-theme.css 50→39KB, index.css 23→19KB.
- **Nota:** la voce originale di questo piano nasceva da analisi incompleta (letto `prepublish-check.sh`/`package.json` ma non `export_for_cloudflare.sh`). Nessuna azione richiesta.

#### B2 — Ridurre l'over-preload dei font
- **Persona:** Performance engineer · **subagent:** `general-purpose` · **modello:** `sonnet` · **effort:** Medium
- **Dipendenze:** nessuna · **Parallelo:** sì
```
Sei un performance engineer. Le pagine materia precaricano 5 woff2 (fredoka 700, nunito regular/700/800/900). Con una waterfall/Lighthouse verifica quali pesi sono realmente usati above-the-fold al primo paint e riduci i <link rel=preload as=font> ai soli 2-3 critici per l'LCP; gli altri restano caricati via @font-face senza preload. Mantieni crossorigin e il self-hosting. Verifica su preview (mobile) che non ci siano FOUT vistosi sul titolo Fredoka. Misura LCP prima/dopo. Non toccare il precache SW dei font (restano cacheabili). CHANGELOG.
```

### Gruppo C — Sicurezza & Stabilità

#### C1 — Ridurre la fragilità della CSP inline — ✅ FATTO (2026-07-03), diverso dalla diagnosi iniziale
- **Diagnosi corretta:** l'analisi che stava dietro questa voce assumeva "46 hash di script inline eseguibili da esternalizzare". Falso. **Tutti i 48 `<script>` inline del sito sono `type="application/ld+json"`** (dati strutturati SEO), zero JavaScript eseguibile inline. I data block JSON-LD non vengono eseguiti dal browser e **CSP `script-src` non li governa**: i loro hash erano superflui.
- **Fix applicato (migliore dell'esternalizzazione):** modificato `scripts/sync_csp_hashes.py` per hashare solo gli script *eseguibili* (`type` assente/`text/javascript`/`module`/`importmap`), saltando i data block. `_headers` `script-src` passa da **46 hash a solo `'self'`** (hash `style-src` invariati). Nessuna esternalizzazione, nessun rischio ordine/FOUC.
- **Perché è la vera fragilità:** i JSON-LD cambiano di continuo (date, conteggi, FAQ) → ogni edit rompeva la CSP e imponeva un resync (è successo in A1 e A2). Ora quegli edit non toccano più la CSP.
- **Nessun impatto produzione:** i data block non erano comunque soggetti a enforcement `script-src`. Nessun bump versione (`_headers`/`scripts/` non precachati). Verificato: gate verde, `npm run audit:csp` OK, 3 JSON-LD intatti nel DOM di una pagina materia.

#### C2 — Reporting CSP e hardening header residuo
- **Persona:** Security engineer · **subagent:** `general-purpose` · **modello:** `sonnet` · **effort:** Medium
- **Dipendenze:** nessuna · **Parallelo:** sì
```
Sei un security engineer. In _headers aggiungi visibilità sulle violazioni senza rischio funzionale: 1) Reporting-Endpoints + direttiva report-to nella CSP verso un endpoint di raccolta (o report-uri come fallback compatibile), documentando dove finiscono i report in CLOUDFLARE_SECURITY_SETUP.md. 2) Valuta e, se compatibile con il funzionamento offline/PWA, aggiungi Cross-Origin-Embedder-Policy. 3) Valuta require-trusted-types-for 'script' in sola modalità report (Content-Security-Policy-Report-Only) per misurare l'impatto PRIMA di applicarla. Non rendere enforce nulla che non sia stato verificato in report-only. Testa su preview che il sito e il SW restino funzionanti. CHANGELOG + doc.
```

#### C3 — Robustezza service worker e versionamento cache
- **Persona:** PWA engineer · **subagent:** `general-purpose` · **modello:** `sonnet` · **effort:** Medium
- **Dipendenze:** dopo B1/B2 se cambiano i path degli asset · **Parallelo:** sì altrimenti
```
Sei un PWA engineer. Rivedi sw.js per stabilità: 1) Verifica che CACHE_NAME sia legato alla versione app (app-version.js) così che ogni release invalidi la cache — conferma che un bump di versione forzi il refresh degli asset precachati e non lasci utenti su versioni miste. 2) Controlla che la lista CORE/OPTIONAL_PRECACHE_URLS sia allineata ai file reali (nessun path morto → nessun 404 silenzioso in install). 3) Aggiungi un test/script che confronti i path precache con i file su disco e fallisca in prepublish se divergono. Non cambiare la strategia Cache-First/Network-First. Verifica install/activate/offline su preview. CHANGELOG.
```

### Gruppo D — UI/UX & QA

#### D1 — Audit UX/UI e accessibilità visiva a campione
- **Persona:** UX designer + a11y specialist · **subagent:** `Explore` · **modello:** `opus` · **effort:** High
- **Dipendenze:** nessuna (audit read-only, produce backlog) · **Parallelo:** sì
```
Sei un designer UX e specialista di accessibilità. Audit READ-ONLY (nessuna modifica) del sito su: gerarchia visiva e leggibilità per bambini 7-11 anni; contrasto testo/sfondo (WCAG AA) sia in palette standard sia Okabe-Ito; dimensioni touch target (min 44px) su mobile; coerenza spaziature/tipografia tra pagine; stati focus visibili; comportamento con testo ingrandito 200%; overflow su viewport 320px. Usa gli strumenti preview (mobile/desktop, colorScheme dark se applicabile) e ispeziona valori CSS reali, non solo screenshot. Produci reports/ux-audit-2026.md: findings ordinati per severità con file:riga, impatto e fix proposto. Rispetta il vincolo: la modalità Okabe-Ito non va ridisegnata, solo verificata.
```

#### D2 — Applicare i fix UX prioritari dal referto
- **Persona:** Frontend engineer · **subagent:** `general-purpose` · **modello:** `sonnet` · **effort:** Medium
- **Dipendenze:** D1 · **Parallelo:** sì per pagina
```
Sei un frontend engineer. Applica i fix di severità alta/media elencati in reports/ux-audit-2026.md, uno gruppo coerente alla volta. Vincoli: modalità Okabe-Ito intatta (guard html:not([data-palette="okabe-ito"])), nessuna regressione a11y, riuso delle classi/token esistenti (tokens.css, utilities.css) invece di nuovo CSS ad hoc. Verifica ogni fix su preview (mobile+desktop) con screenshot prima/dopo. Non toccare i findings di severità bassa senza conferma. Chiudi con npm run lint:css + ./prepublish-check.sh. CHANGELOG per gruppo.
```

#### D3 — Regression finale Lighthouse / a11y / funzionale
- **Persona:** QA engineer · **subagent:** `Plan` (piano test) + `general-purpose` (esecuzione) · **modello:** `sonnet` · **effort:** Medium
- **Dipendenze:** tutte le precedenti · **Parallelo:** no (gate finale)
```
Sei un QA engineer. Dopo gli interventi A-D esegui la regressione completa: npm run lighthouse (conferma a11y ≥ 0.95, nessun calo perf/SEO/best-practices rispetto al baseline in lighthouserc.json), controllo manuale su preview di home + 2 pagine materia + una pagina info, in palette standard e Okabe-Ito, mobile e desktop. Verifica: freshness (sitemap/JSON-LD date aggiornate), conteggio domande coerente ovunque, nessuna violazione CSP in console, SW installa e serve offline. Produci reports/qa-sito-2026.md con esiti e blocchi residui. Nessun merge se una soglia Lighthouse regredisce.
```

---

## 4. Dipendenze e parallelismo

```
Quick wins (subito, paralleli):   A1  A2  A3  C2  D1
Performance (coordinare build):    B1 ─┐   B2
Sicurezza inline (stesso terreno): C1 ─┘  (C1 e B1 toccano gli inline: eseguire in serie, C1→B1 o congiunti)
Stabilità PWA (dopo path change):  C3  (dopo B1/B2 se i path cambiano)
UX:                                D1 ──► D2
Gate finale:                       tutto ──► D3
```

**Note throughput:**
- **A1/A2/A3** chiudono l'80% del valore SEO/accuratezza con costo minimo (`haiku`/`sonnet`, effort basso). Farle per prime.
- **C1 e B1** condividono il terreno degli script inline: coordinarle (prima C1 riduce gli hash, poi B1 minifica ciò che resta) per non risincronizzare la CSP due volte.
- **Opus** solo dove serve ragionamento: B1 (build/CSP), C1 (sicurezza inline), D1 (audit UX). Tutto il resto `sonnet`/`haiku`.
- **D3** è l'unico vero punto di sincronizzazione.

## 5. Definizione di "fatto"
- [ ] Nessun conteggio domande stale in HTML/llms.txt/README.
- [ ] `sitemap.xml` e JSON-LD `dateModified` rigenerati e agganciati a `prepublish-check.sh`.
- [ ] Tutte le meta description ≤ 160 caratteri.
- [ ] Asset esterni minificati; preload font ridotti ai critici; LCP mobile non peggiorato (idealmente migliorato).
- [ ] CSP: hash inline ridotti dove sicuro; reporting attivo; nessuna violazione in console.
- [ ] SW: precache allineato ai file reali, cache invalidata a ogni versione.
- [ ] `reports/ux-audit-2026.md` prodotto e fix alta/media applicati.
- [ ] Lighthouse a11y ≥ 0.95 mantenuto; Okabe-Ito intatto; `reports/qa-sito-2026.md` verde.
