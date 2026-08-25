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

## Technical SEO — 95/100 (era 93)

Zero problemi critical/high. **Confermato dal vivo**: la registrazione del Service Worker (bug Trusted Types corretto oggi in produzione) tiene — testata con sessione Chromium pulita, stato `activated`, zero errori console. Header di sicurezza forti (CSP, HSTS con preload sottomesso oggi, X-Frame-Options, COOP, CORP, Permissions-Policy), nessun mixed content, redirect a hop singolo ovunque, 404 reale correttamente noindexata, contenuto interamente server-rendered (zero rischio di indicizzazione JS-dipendente).

~~CLS mobile 0.105 sulla home~~ **Risolto** (stessa causa e fix del caso più grave su chi-siamo, vedi Performance sotto). Restano: IndexNow non implementato (Low, non impatta Google); nessuna regola AI-crawler in robots.txt (Info, scelta deliberata, coerente col blocco Cloudflare già risolto).

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

~~`/chi-siamo` mobile CLS 0,254 (Poor)~~ **Risolto**: il footer condiviso popolava testo (contatore domande) dopo il paint iniziale via JS differito, andando a capo su più righe a larghezza mobile. Riservato lo spazio in CSS — verificato 0px di shift. Nel test su iPhone reale trovato anche un bug preesistente indipendente: il padding riservato del footer non copriva la sua altezza reale, tagliando il testo di un pulsante — corretto. Resta: `/matematica` desktop ha mostrato TBT 330ms in un solo run (Performance 85 vs 98-100 altrove) — probabile rumore di misurazione, da riverificare.

## AI Search Readiness (GEO) — 78/100 (era 50/100)

**Il problema più grave dell'intero audit, risolto e verificato in giornata.** Testato con user-agent reali: Cloudflare bloccava GPTBot, OAI-SearchBot, ClaudeBot e PerplexityBot con HTTP 403 "Your request was blocked" — a livello di edge, prima ancora che robots.txt venisse consultato. Googlebot, Bingbot e meta-externalagent passavano regolarmente (Google AI Overviews e Bing Copilot non erano impattati), ma ChatGPT e Perplexity non potevano proprio scaricare il sito. Causa: toggle legacy Cloudflare "Block AI bots" su "Block on all pages". Disattivato dall'utente in dashboard, preferenza mixed-purpose-crawler impostata su "permessi", nuove AI bot policies (Search/Agent/Training) lasciate `disabled` coerentemente con l'intento di accesso libero già dichiarato in robots.txt/llms.txt. **Ri-verificato live subito dopo**: tutti e 4 i bot rispondono 200 con contenuto reale (non una pagina di challenge).

Punti di forza: `llms.txt` completo e aggiornato oggi con la sezione del nuovo gioco; Citabilità 72/100, Struttura 80/100 — il contenuto stesso è ragionevolmente pronto per la citazione AI. Nessun segnale di brand mention (Wikipedia/Reddit/YouTube) — atteso per un sito lanciato ad aprile 2026, non un'azione immediata.

## Images — 35/100 (era 30)

~~Zero immagini di contenuto o screenshot su qualunque pagina controllata~~ **Parzialmente risolto**: `/breakout` ha ora un'anteprima gameplay reale nella sezione descrittiva (era la pagina più urgente per il persona "bambino che sfoglia giochi" prima di caricare il canvas). Le altre 19 pagine (8 materie + pagine utility) restano senza immagini di contenuto — resta la dimensione più debole dell'audit, priorità più bassa perché le pagine materia sono più "app" che "contenuto".

## Search Experience (SXO) — 56/100 (informativo)

Schema e Lighthouse eccellenti su `/breakout` (100/100) — la base tecnica non è il problema. Per la query "gioco arcade educativo bambini online gratis" i risultati Google sono esclusivamente portali multi-gioco (Poki, WellGames, Cartoonito) e listicle, mai pagine singolo-gioco come `/breakout` — mismatch di tipo-pagina strutturale, non un difetto della pagina in sé. **Deciso col titolare del sito**: nessun cambio strutturale, si accetta il posizionamento su query di marca/long-tail (una pagina hub "Giochi" avrebbe senso solo con più giochi in arrivo). `/per-genitori` targettizza l'intento fiducia/sicurezza, ma la query che i genitori cercano davvero ("aiutare i compiti scuola primaria") restituisce guide lunghe (800-1500+ parole), un formato che il sito non ha.

---

## Metodologia

Audit condotto sul sito **live in produzione** (non locale), 25 agosto 2026, con 10 sub-agent specializzati in parallelo (technical, content, schema, sitemap, performance, visual, geo, google-data, backlinks, sxo) più verifica diretta di title/meta tag. Dati Google reali via API (tier 1: PageSpeed Insights, CrUX, Search Console, URL Inspection, Sitemaps, Indexing API — service account con permessi Owner). Screenshot desktop+mobile in `screenshots/`. Findings dettagliati per categoria in `findings/*.md`.
