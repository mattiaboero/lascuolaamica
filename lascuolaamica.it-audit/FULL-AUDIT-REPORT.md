# Full SEO Audit — lascuolaamica.it

Data: 2026-08-25. Sito: piattaforma educativa gratuita per la scuola primaria italiana (classi 2ª-5ª), PWA statica (HTML/CSS/JS vanilla, no framework), 20 pagine, hosting Cloudflare Pages. 8 materie quiz + 1 gioco arcade canvas ("Cervellino Spacca-Muri", pubblicato oggi stesso).

## Executive Summary

**SEO Health Score: 82/100** (78 all'audit iniziale → 81 dopo il fix Cloudflare → 82 dopo i fix di CLS/schema/immagini)

| Categoria | Punteggio | Peso |
|---|---|---|
| Technical SEO | 95 ⬆️ (era 93) | 22% |
| Content Quality | 71 | 23% |
| On-Page SEO | 82 | 20% |
| Schema/Structured Data | 96 ⬆️ (era 91) | 10% |
| Performance (CWV) | 96 ⬆️ (era 90) | 10% |
| AI Search Readiness | 78 ⬆️ (era 50) | 10% |
| Images | 35 ⬆️ (era 30) | 5% |

Fondamenta tecniche solide (sicurezza, schema, performance, sitemap tutti sopra 90). Il problema più grave trovato — blocco Cloudflare ai crawler AI — è stato **risolto e verificato in giornata**, così come CLS mobile e il mismatch schema/testo delle FAQ. Resta l'assenza di immagini/media sulla maggior parte delle pagine come principale area debole (`/breakout` ora ne ha una).

### ✅ Risolto in giornata

- **Cloudflare bloccava GPTBot/ClaudeBot/PerplexityBot/OAI-SearchBot a livello edge (403)**, nonostante robots.txt e llms.txt dichiarassero accesso libero. Causa: toggle legacy "Block AI bots" su "Block on all pages". Disattivato, preferenza mixed-purpose-crawler impostata su "permessi", nuove AI bot policies lasciate `disabled`. **Ri-verificato live**: tutti e 4 i bot ora rispondono 200 con contenuto reale.
- **CLS mobile fuori soglia** su `/chi-siamo` (0.254 Poor) e home (0.105 borderline). Causa: `#questionsTotalCount` nel footer condiviso parte con l'attributo HTML `hidden` (footprint zero) e viene popolato da JS differito dopo il paint iniziale, andando a capo su più righe a larghezza mobile. Riservato lo spazio in CSS. **Verificato**: box riservato e box popolato coincidono, 0px di shift. Trovato in corso di test su iPhone reale un secondo bug preesistente e indipendente: il padding del footer (132px) non copriva la sua altezza reale su 3 righe (169px) su `/chi-siamo`, tagliando il testo del pulsante "Torna alla home" — portato a 190px.
- **Testo FAQPage schema non combaciava col testo visibile** su matematica/geografia/storia/italiano (3 risposte per pagina, schema espanso oltre il testo dell'HTML). Allineato 1:1 su tutte e 4 le pagine. Su `problemi.html` i 4 "esempi svolti" extra (già correttamente esclusi dallo schema) riusavano la classe CSS delle FAQ facendo apparire 11 voci FAQ invece di 7 — rinominati in una classe distinta, nessun cambio visivo.
- **Prima immagine di contenuto del sito**: anteprima gameplay su `/breakout`, riusando/ricatturando l'asset esistente. Aggiornata due volte dopo test su device reale: prima perché mostrava ancora i mattoni piatti pre-restyling invece dello stile "candy" attuale, poi reinquadrata per includere pallina e barra invece di tagliare nello spazio vuoto.

### Decisione presa (nessuna azione)

**`/breakout` mismatch di tipo-pagina (SXO)**: discusso con il titolare del sito, si accetta il posizionamento su query di marca/long-tail invece di costruire una pagina hub "Giochi" — avrebbe senso solo con più giochi in arrivo.

### Problemi rimanenti

1. Zero immagini/screenshot sulle altre 19 pagine (8 materie + pagine utility) — resta la dimensione più debole dell'audit, `/breakout` era la pagina più urgente ed è risolta.
2. Ri-testare `/matematica` desktop (TBT 330ms in un solo run, probabile rumore di misurazione).

### Quick win rimanenti

1. Alzare i target touch del footer da 44px a 48px minimo.
2. Aggiungere link `sameAs` allo schema Person/Organization del fondatore.

---

## Aggiornamento 6 settembre 2026 — hardening del codice

Non un nuovo audit: revisione sistematica del codice (HTML, CSS, JS, script di build, file testuali) con verifica in produzione di ogni fix. 16 release, dalla 4.12.36 alla 4.12.51. Qui sotto solo ciò che tocca le dimensioni di questo report; il resto è nel CHANGELOG.

### Misure PageSpeed Insights dopo i fix (API, 6 settembre)

| Pagina | Strategia | Perf | A11y | BP | SEO | FCP | LCP | CLS |
|---|---|---|---|---|---|---|---|---|
| home | mobile | 100 | 100 | 100 | 100 | 1,3 s | 1,7 s | 0 |
| home | desktop | 99 | — | — | — | 0,3 s | **0,4 s** | — |
| /matematica | mobile | 86 | 100 | 100 | 100 | 1,2 s | 2,6 s | 0 |
| /matematica | desktop | 100 | 100 | 100 | 100 | — | 0,5 s | 0,001 |
| /premi | mobile | 98 | 100 | 100 | 100 | — | 1,5 s | 0,088 |
| /premi | desktop | 100 | 100 | 100 | 100 | — | 0,5 s | 0,01 |
| /faq | mobile | 99 | 100 | 100 | 100 | 1,3 s | 1,8 s | 0 |
| /faq | desktop | 99 | 100 | 100 | 100 | 0,4 s | 0,7 s | 0,007 |
| /tabelline | desktop | **83** | **96** | 100 | 100 | 0,6 s | 0,7 s | 0,024 |

### ✅ Risolto

- **LCP: l'animazione di entrata dell'`<header>` partiva da `opacity: 0`.** Un elemento a opacità zero non è candidato LCP, quindi la metrica slittava in avanti di tutta la durata dell'animazione. Il conto tornava esatto sulla home: FCP 528 ms + 900 ms di `bounceIn` = 1428 ms, contro i 1440 ms di "ritardo di rendering dell'elemento" riportati da PageSpeed. Riguardava due keyframe (`bounceIn` in `index.css`, `popIn` in `subject-quiz-theme.css`), ognuno con un unico utilizzatore. I `0%` partono ora da `opacity: .35` e da una scala già visibile; durata, curva e rimbalzo invariati. **Misurato in produzione prima/dopo**: `/premi` 1576 → 380 ms, home 1324 → 448 ms, `/breakout` 1124 → 380 ms, `/faq` 520 → 388 ms. Confermato da PSI desktop: LCP home **1,44 s → 0,4 s**. `/tabelline` e `/chi-siamo`, che non hanno animazioni di entrata, restano invariate a ~370 ms: controllo negativo che conferma l'attribuzione.
- **`llms.txt` non rispettava il formato llmstxt.org.** L'audit di agosto lo dava come punto di forza ("completo e aggiornato"): era una valutazione ottimistica. L'intestazione H1 c'era, ma gli URL erano testo nudo (`- Matematica: https://…`) invece di link markdown, e PageSpeed lo segnalava ("Il file non sembra contenere link"). Convertiti 15 URL in `- [nome](url)` e aggiunta una descrizione alle 11 pagine principali, che è la parte su cui un modello decide se una pagina gli serve.
- **`dateModified` dei JSON-LD derivato dall'mtime del file.** Un clone, un checkout di branch o un merge riportano l'mtime all'istante corrente: ogni cambio di branch faceva dichiarare "modificate oggi" tutte e 23 le pagine, un segnale falso verso Google su contenuti non toccati. Ora la data viene dall'ultimo commit che ha modificato il file; l'mtime resta solo per i file non ancora committati. Stessa logica già usata per il `lastmod` della sitemap, ora condivisa in `scripts/git_dates.py`.
- **CSP: aggiunta la direttiva `trusted-types`.** La policy dichiarava `require-trusted-types-for 'script'` senza elencare le policy ammesse, quindi qualunque script poteva crearne una e passare dai sink di script URL. Ora `trusted-types sa-sw-url sa-sw-import`, gli unici due nomi creati dal codice; verificato che con un nome diverso il browser blocca davvero.
- **Contrasto sotto AA nel cromo della home.** Hover dei link del footer e link delle modali (compresi i pulsanti dell'Info hub, che sono `<a>`) usavano il viola legacy `#9B5DE5`: **4,13:1 su bianco**, sotto la soglia AA di 4,5:1. Portati al viola Wada Sanzo `#6e57a6`, **5,87:1**. Modalità accessibile Okabe-Ito verificata invariata.
- **Preferenza di sistema "riduci il movimento" ignorata.** Due difetti distinti: le 10 pagine info non avevano il blocco `@media (prefers-reduced-motion: reduce)` (misurato: `transition-duration` di un link passa da `0s` a `1e-05s` dopo il fix); e il toggle interno del sito non fermava le figure decorative fluttuanti su home e `/faq`, perché il controllo veniva valutato prima che `shared.js` impostasse `html[data-motion]` (misurato: 4 figure → 0 con la preferenza attiva).
- **Igiene on-page**: `premi.html` era l'unica delle 20 pagine indicizzabili senza `max-video-preview:-1` nella meta robots; 7 `href` YouTube su `/tabelline` usavano `&` non escapato; `breakout.html` non precaricava `/json/index.json`, che carica comunque all'avvio.

### 🔍 Nuovi rilievi da questo giro

1. **`/tabelline` è la pagina più debole del sito**: Performance 83 e Accessibilità 96 su desktop, unica sotto 96 in entrambe le dimensioni. È anche la più recente (pubblicata il 5 settembre, dopo l'audit di agosto) e non era mai stata misurata. Da approfondire.
2. **`/matematica` mobile: LCP 2,6 s**, il valore peggiore rilevato. L'elemento LCP è `div.intro-note`, che sta fuori dall'`<header>` animato e quindi non ha beneficiato del fix. Il TBT è 0 e il CLS 0, quindi è un problema di quando quell'elemento diventa visibile, non di lavoro sul thread principale.
3. **`/premi` mobile CLS 0,088**: sotto la soglia di 0,1 ma è il valore più alto del sito, e la pagina ha una griglia di premi che si popola da JS.
4. **Verifica SEO/AEO di `/tabelline` a livello di codice: nessun problema.** Title, description, canonical, `og:url` coerenti; 1 H1 + 4 H2; JSON-LD `WebPage`, `BreadcrumbList`, `FAQPage` (4 Q&A) e `ItemList` di 7 `VideoObject` completi di `embedUrl`, `thumbnailUrl` (tutte e 7 esistenti su disco), `uploadDate` e `duration`. `contentUrl` assente ma non richiesto con `embedUrl` presente.

### Nota sui punteggi

I punteggi per categoria in cima al report **non sono stati ricalcolati**: servirebbe un audit completo come quello del 25 agosto, non una misurazione parziale. Le tabelle e i numeri qui sopra sono misure dirette del 6 settembre, e vanno lette come aggiornamento puntuale delle voci che toccano.

---

## Technical SEO — 95/100 (era 93)

Zero problemi critical/high. **Confermato dal vivo**: la registrazione del Service Worker (bug Trusted Types corretto oggi in produzione) tiene — testata con sessione Chromium pulita, stato `activated`, zero errori console. Header di sicurezza forti (CSP, HSTS con preload sottomesso oggi, X-Frame-Options, COOP, CORP, Permissions-Policy), nessun mixed content, redirect a hop singolo ovunque, 404 reale correttamente noindexata, contenuto interamente server-rendered (zero rischio di indicizzazione JS-dipendente).

~~CLS mobile 0.105 sulla home~~ **Risolto** (stessa causa e fix del caso più grave su chi-siamo, vedi Performance sotto). Restano: IndexNow non implementato (Low, non impatta Google); nessuna regola AI-crawler in robots.txt (Info, scelta deliberata, coerente col blocco Cloudflare già risolto). **6 settembre**: aggiunta la direttiva CSP `trusted-types` che mancava accanto a `require-trusted-types-for`, e il `dateModified` dei JSON-LD non deriva più dall'mtime del file (dichiarava modificate oggi tutte le pagine a ogni cambio di branch).

## Content Quality — 71/100

Nessun rischio reale di contenuto duplicato tra le 8 pagine materia: overlap di frasi a 5 parole misurato allo 0,2%-4,4% tra ogni coppia di pagine, ben sotto la soglia 30-40% che fa scattare preoccupazioni di contenuto scalato. Il gap FAQ di civica.html (4→7) è confermato risolto. Presente una pagina `/ai-info` dedicata alla trasparenza AI — raro e genuinamente utile.

Punto debole: Autorevolezza (11/25) — nessuna citazione esterna, backlink, stampa o partnership scolastiche; lo schema Organization/Person è solo-nome. Gli H1 delle pagine materia non contengono la keyword (solo emoji+titolo in-app, la frase chiave compare solo in un H2 più sotto). Nessun link contestuale tra le pagine materia (solo nav/footer globali). Il claim di allineamento al "programma ministeriale" non cita il documento specifico, e il background dell'autore dichiarato non è una credenziale pedagogica.

## On-Page SEO — 82/100

Verificato direttamente: tutte le 20 pagine hanno title tag unici e ben formati (31-57 caratteri), meta description tutte nel range sicuro per la SERP (118-149 caratteri), nessun duplicato. I due problemi (H1 senza keyword, gap di link interni) sono condivisi con Content Quality sopra.

## Schema / Structured Data — 96/100 (era 91)

33 blocchi JSON-LD su 20 pagine, tutti validi, nessun tipo deprecato, tutte le date ISO 8601. Il blocco EducationalApplication/LearningResource è pienamente coerente sulle 8 pagine materia. Schema Person per l'autore già correttamente collegato via `@id` al fondatore in homepage. Review/AggregateRating correttamente NON aggiunto (nessun meccanismo di recensione reale, sarebbe spam).

~~Testo FAQPage non combaciava col testo visibile su matematica/geografia/storia/italiano~~ **Risolto**, allineato 1:1. ~~`problemi.html` aveva 7 Q&A in schema contro 11 `<details>` visibili~~ **Risolto**: i 4 extra erano esempi svolti già correttamente esclusi dallo schema, solo la classe CSS condivisa con le FAQ generava confusione visiva — rinominata. Resta: schema Person/Organization privo di `sameAs` (Low).

## Performance (Core Web Vitals) — 96/100 (era 90)

Home e `/breakout`: Performance 100, Accessibilità 100, SEO 100 (mobile+desktop), LCP 1,7-1,8s, TBT 0ms. `/faq` e `/premi`: 100/100 su entrambi i dispositivi. Peso pagina eccellente (150-174 KiB ovunque). Nessun dato CrUX field disponibile — traffico ancora insufficiente, atteso per un sito piccolo/nuovo, non un problema.

~~`/chi-siamo` mobile CLS 0,254 (Poor)~~ **Risolto**: il footer condiviso popolava testo (contatore domande) dopo il paint iniziale via JS differito, andando a capo su più righe a larghezza mobile. Riservato lo spazio in CSS — verificato 0px di shift. Nel test su iPhone reale trovato anche un bug preesistente indipendente: il padding riservato del footer non copriva la sua altezza reale, tagliando il testo di un pulsante — corretto. ~~Resta: `/matematica` desktop ha mostrato TBT 330ms in un solo run~~ **Riverificato il 6 settembre**: `/matematica` desktop è a 100/100 con TBT 10 ms, era rumore. **6 settembre**: risolta la causa strutturale del ritardo LCP su tutte le pagine con header animato (LCP desktop home 1,44 s → 0,4 s); emersi due nuovi rilievi, `/matematica` mobile a LCP 2,6 s e `/tabelline` desktop a Performance 83. Dettagli nella sezione di aggiornamento.

## AI Search Readiness (GEO) — 78/100 (era 50/100)

**Il problema più grave dell'intero audit, risolto e verificato in giornata.** Testato con user-agent reali: Cloudflare bloccava GPTBot, OAI-SearchBot, ClaudeBot e PerplexityBot con HTTP 403 "Your request was blocked" — a livello di edge, prima ancora che robots.txt venisse consultato. Googlebot, Bingbot e meta-externalagent passavano regolarmente (Google AI Overviews e Bing Copilot non erano impattati), ma ChatGPT e Perplexity non potevano proprio scaricare il sito. Causa: toggle legacy Cloudflare "Block AI bots" su "Block on all pages". Disattivato dall'utente in dashboard, preferenza mixed-purpose-crawler impostata su "permessi", nuove AI bot policies (Search/Agent/Training) lasciate `disabled` coerentemente con l'intento di accesso libero già dichiarato in robots.txt/llms.txt. **Ri-verificato live subito dopo**: tutti e 4 i bot rispondono 200 con contenuto reale (non una pagina di challenge).

Punti di forza: `llms.txt` completo e aggiornato oggi con la sezione del nuovo gioco — ma **il 6 settembre si è scoperto che non rispettava il formato llmstxt.org**: gli URL erano testo nudo invece di link markdown, quindi la valutazione di agosto su questo punto era ottimistica; ora corretto e verificato; Citabilità 72/100, Struttura 80/100 — il contenuto stesso è ragionevolmente pronto per la citazione AI. Nessun segnale di brand mention (Wikipedia/Reddit/YouTube) — atteso per un sito lanciato ad aprile 2026, non un'azione immediata.

## Images — 35/100 (era 30)

~~Zero immagini di contenuto o screenshot su qualunque pagina controllata~~ **Parzialmente risolto**: `/breakout` ha ora un'anteprima gameplay reale nella sezione descrittiva (era la pagina più urgente per il persona "bambino che sfoglia giochi" prima di caricare il canvas). Le altre 19 pagine (8 materie + pagine utility) restano senza immagini di contenuto — resta la dimensione più debole dell'audit, priorità più bassa perché le pagine materia sono più "app" che "contenuto".

## Search Experience (SXO) — 56/100 (informativo)

Schema e Lighthouse eccellenti su `/breakout` (100/100) — la base tecnica non è il problema. Per la query "gioco arcade educativo bambini online gratis" i risultati Google sono esclusivamente portali multi-gioco (Poki, WellGames, Cartoonito) e listicle, mai pagine singolo-gioco come `/breakout` — mismatch di tipo-pagina strutturale, non un difetto della pagina in sé. **Deciso col titolare del sito**: nessun cambio strutturale, si accetta il posizionamento su query di marca/long-tail (una pagina hub "Giochi" avrebbe senso solo con più giochi in arrivo). `/per-genitori` targettizza l'intento fiducia/sicurezza, ma la query che i genitori cercano davvero ("aiutare i compiti scuola primaria") restituisce guide lunghe (800-1500+ parole), un formato che il sito non ha.

---

## Metodologia

Audit condotto sul sito **live in produzione** (non locale), 25 agosto 2026, con 10 sub-agent specializzati in parallelo (technical, content, schema, sitemap, performance, visual, geo, google-data, backlinks, sxo) più verifica diretta di title/meta tag. Dati Google reali via API (tier 1: PageSpeed Insights, CrUX, Search Console, URL Inspection, Sitemaps, Indexing API — service account con permessi Owner). Screenshot desktop+mobile in `screenshots/`. Findings dettagliati per categoria in `findings/*.md`.
