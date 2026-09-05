# Audit codice — 23 pagine HTML statiche

Data: 2026-09-05. Audit di sola lettura, nessun file modificato.
Ambito: markup, codice sporco, performance, accessibilità di base, coerenza cross-pagina, JSON-LD.
Escluso: SEO title/description (già coperto da audit precedente).

## Metodo

- Parsing DOM con `html.parser` (Python) su tutte e 23 le pagine per tag non chiusi/annidamento invalido → **nessun errore** (stack di apertura/chiusura bilanciato su tutte le pagine).
- Controllo `id` duplicati per pagina (regex) → **nessuno**.
- Controllo attributi duplicati sullo stesso tag → **nessuno**.
- Controllo `tidy` (HTML4-based) → il grosso degli errori segnalati sono falsi positivi (tag HTML5 come `nav/main/section/header/footer/details/summary` non riconosciuti dalla DTD, `<a>` con `<div>` dentro è valido in HTML5, `<link>` in `<noscript>` nel `<body>` è valido per gli standard correnti, `<meta charset>` non necessita di `content`). Gli unici avvisi reali sono riportati sotto.
- Controllo `href`/`src` locali contro il filesystem (esclusi i redirect a URL "clean" gestiti da `_redirects`) → **nessun asset mancante**.
- Controllo `<img>`: alt/width/height/loading presenti su tutti i 10 tag `<img>` del sito → **nessun problema**.
- Nessun `style="..."` inline su nessuna pagina.
- Nessun form/input/label sul sito (nessun problema di label associata).
- Gerarchia heading (h1→h6) senza salti su tutte le pagine.
- JSON-LD: tutti i blocchi sono JSON valido; FAQPage `mainEntity` verificato 1:1 contro i `<details>/<summary>` visibili — corrispondenza esatta ovunque; canonical / og:url / ultimo breadcrumb coerenti su tutte le 23 pagine.

## Alta

| Sev | File:riga | Cosa | Perché | Fix |
|---|---|---|---|---|
| Alta | `404.html:43` | Il footer contiene `<span class="footer-link footer-version" data-app-version data-app-version-format="compact"></span>`, ma `404.html` è l'unica delle 23 pagine a non caricare `app-version.js` (script list: solo `js/lazy-css.js`) | lo script che popola `.footer-version` (in `app-version.js`) non gira mai su questa pagina: lo span resta vuoto ad ogni visita della pagina di errore | Aggiungere `<script defer src="app-version.js"></script>` prima di `</body>`, oppure rimuovere lo span se la versione non deve comparire lì |

## Media

| Sev | File:riga | Cosa | Perché | Fix |
|---|---|---|---|---|
| Media | `breakout.html:36-44` (head) | Manca `<link rel="preload" href="/json/index.json" as="fetch" crossorigin>`, presente invece in `civica.html`, `geografia.html`, `inglese.html`, `italiano.html`, `matematica.html`, `problemi.html`, `scienze.html`, `storia.html` | `js/breakout.js` (`loadQuestionPool`, riga 267) fa fetch dello stesso `json/index.json` all'avvio partita: senza preload il download parte più tardi rispetto alle altre pagine quiz che condividono lo stesso file | Aggiungere lo stesso `<link rel="preload">` usato dalle altre pagine quiz |
| Media | `premi.html:9` | `<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">` — manca `max-video-preview:-1`, presente su tutte le altre 20 pagine indicizzabili | boilerplate robots incoerente tra pagine (unica pagina indicizzabile con valore diverso) | Allineare a `index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1` |
| Media | `premi.html` (script list, dopo riga 140) | Carica `shared.js` ma non `js/dom-utils.js`; `shared.js` inietta in ogni footer un pulsante "Info" che apre una modale e chiama `SADom.lockScroll` (guardia `typeof === 'function'`, quindi nessun errore) | su `premi.html` il click sul pulsante iniettato apre la modale senza bloccare lo scroll di sfondo, diversamente da tutte le altre pagine che caricano `dom-utils.js` | Aggiungere `<script defer src="js/dom-utils.js"></script>` a `premi.html` |

## Bassa

| Sev | File:riga | Cosa | Perché | Fix |
|---|---|---|---|---|
| Bassa | `tabelline.html:334,342,350,358,366,374,382` | 7 `href` YouTube con `&` non escappato (es. `...watch?v=-YtYzeJPDC4&list=PLHctzIjd-9Qg`) invece di `&amp;` | non valido per lo spec HTML (ambiguous ampersand in attributo); i browser lo tollerano ma un validator lo segnala | Sostituire `&` con `&amp;` nei 7 `href` |
| Bassa | `index.html:399`, `premi.html:133` | `<footer role="contentinfo">` senza `class="site-footer"`, presente invece sulle altre 21 pagine (`<footer class="site-footer" role="contentinfo">`) | boilerplate del footer non uniforme; compensato da un selettore CSS sul tag `footer` nudo in `index.css` (riga 453), quindi nessun impatto visivo, solo markup divergente | Aggiungere `class="site-footer"` per allineare il markup, oppure documentare la scelta come intenzionale |
| Bassa | `404.html:26`, `cookie.html:81`, `privacy.html:81` | `<body class="info-page page-404">` / `page-cookie` / `page-privacy`: nessuna di queste 3 classi ha una regola corrispondente in nessun file CSS, mentre le altre 8 pagine "info" (`page-accessibilita`, `page-ai-info`, `page-chi-siamo`, `page-per-genitori`, `page-per-insegnanti`, `page-supporta`, `page-supporto-satispay`, `page-tabelline`) hanno un gradiente dedicato in `info-pages.css` (blocco "FASE 4 — Info pages: restyle Wada Sanzo") | classe morta/non cablata: le 3 pagine ricadono sul tema generico `.info-page` invece di un tema dedicato come le altre | Definire le regole `.page-404`/`.page-cookie`/`.page-privacy` in CSS (se il restyle è ancora in corso, va bene lasciarlo com'è, ma va tracciato) oppure rimuovere le classi orfane |
| Bassa | `tabelline.html:453-462` | La sezione FAQ usa coppie statiche `<h3 class="section-title">`/`<p class="text">` invece del pattern `<details class="seo-faq-item"><summary>...</summary>...</details>` usato da tutte le altre pagine con FAQ (`breakout`, `civica`, `faq`, `geografia`, `inglese`, `italiano`, `matematica`, `problemi`, `scienze`, `storia`) | contenuto coerente col JSON-LD (verificato), ma qui le domande non sono collassabili/accordion come ovunque altrove: pattern UI incoerente | Uniformare al pattern `<details>/<summary>` per coerenza, se la pagina deve comportarsi come le altre |
| Bassa | Ordine `<meta name="theme-color">` nel `<head>` | 14 pagine (`404`, `ai-info`, `breakout`, `chi-siamo`, `cookie`, `faq`, `index`, `matematica`, `per-genitori`, `per-insegnanti`, `premi`, `privacy`, `supporta`, `tabelline`) mettono `theme-color` subito dopo `<link rel="manifest">`, prima delle icone; le altre 9 (`accessibilita`, `civica`, `geografia`, `inglese`, `italiano`, `problemi`, `scienze`, `storia`, `supporto-satispay`) lo mettono dopo il blocco delle 4 icone | nessun impatto funzionale (l'ordine dei meta tag è irrilevante per il rendering), solo boilerplate `<head>` non uniforme tra le due famiglie di pagine | Scegliere un ordine unico per il template head e applicarlo a tutte le pagine |

## Riepilogo per severità

- Alta: 1
- Media: 3
- Bassa: 5
- Totale voci: 9
