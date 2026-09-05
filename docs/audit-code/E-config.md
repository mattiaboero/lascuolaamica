# Audit E — config e file non-codice

Perimetro: `llms.txt`, `robots.txt`, `sitemap.xml`, `manifest.json`, `_headers`, `_redirects`, `.stylelintrc.json`, `eslint.config.mjs`, `lighthouserc.json`, `package.json`.

Metodo: lettura diretta dei file + verifica incrociata su disco + esecuzione read-only di `python3 scripts/sync_csp_hashes.py --check`, `npx eslint`, `npx stylelint` + check live (curl) su `https://lascuolaamica.it` per sitemap, redirect, llms.txt e header HTTP effettivi. Nessun file modificato.

---

## 1. Coerenza incrociata sitemap / robots / redirects / llms.txt

| Sev. | File:riga | Cosa | Perché | Fix |
|---|---|---|---|---|
| — | sitemap.xml (21 URL) | Tutti i 21 URL risolvono 200 live e hanno un file `.html` sorgente + canonical corrispondente 1:1 (verificato con curl e grep sui 20 `.html` pubblici + index) | Nessuna discrepanza | — |
| — | robots.txt:2-4 | `Disallow: /json/`, `/reports/`, `/questions-build-report.json` non intersecano nessun URL di sitemap.xml | Nessun blocco di pagine indicizzabili | — |
| — | _redirects (34 righe) | Ogni target `.html→pretty-url` verificato live (es. `/matematica.html`→301→`/matematica`, `/supporto-satispay.html`→301→`/supporto-satispay`); i blocchi vault (`/01-Progetto/*` ecc.) restituiscono 404 come da regola `404!` | Corretto | — |
| — | llms.txt | Tutti i link citati (8 materie, `/breakout`, `/faq`, canale YouTube, playlist tabelline) risolvono 200 live | Corretto | — |
| bassa | sitemap.xml / _redirects | `supporto-satispay.html` ha redirect .html→pretty-url ma **non** è in sitemap.xml | Intenzionale: la pagina ha `<meta name="robots" content="noindex, follow">` (supporto-satispay.html:riga con meta robots) ed è correttamente esclusa dalla lista `PAGES` di `scripts/generate_sitemap.py`, che è la fonte di verità sia per sitemap.xml sia (implicitamente) per l'esclusione | Nessun fix — è corretto così, annotato solo per completezza |

## 2. _headers — CSP, security header, cache-control

| Sev. | File:riga | Cosa | Perché | Fix |
|---|---|---|---|---|
| — | _headers:10 | CSP allineata agli hash generati da `scripts/sync_csp_hashes.py` | `python3 scripts/sync_csp_hashes.py --check` → `[OK] CSP script+style hashes allineati` (verificato in esecuzione read-only) | — |
| media | _headers:19-26 | `/assets/*`, `/icons/*`, `/screenshots/*` → `Cache-Control: public, max-age=31536000, immutable`, ma i file non sono fingerprinted (nessun hash/versione nel nome: `icon-192.png`, `cervellino-happy.webp`, `og-home-1200x630.jpg`...). Verificato: **0 riferimenti con query-string di cache-busting** su 385 riferimenti a asset in tutti gli `.html` | Se un asset in queste cartelle viene aggiornato mantenendo lo stesso nome file, i client che l'hanno già scaricato (fetch diretto, non via Service Worker Cache API) continueranno a servire la versione vecchia fino a 1 anno, senza possibilità di invalidazione lato server | Introdurre un content-hash nel nome file (o querystring di versione) per gli asset in `assets/`, `icons/`, `screenshots/`, oppure abbassare il max-age se i file possono cambiare senza rename |
| bassa | _headers:16-17 | `/reports/*` ha `X-Robots-Tag` ma nessuna riga `Cache-Control` esplicita (a differenza di `/json/*` che la ha) | Incoerenza minore tra due regole "sorelle" per contenuti non-indicizzabili; ricade sul default `/*` (max-age=0, must-revalidate, verificato live) quindi non è un rischio concreto, solo un'asimmetria nel file | Aggiungere `Cache-Control: public, max-age=0, must-revalidate` sotto `/reports/*` per coerenza con `/json/*` |
| bassa | _headers:10 (CSP) | `require-trusted-types-for 'script'` è impostato ma manca la direttiva `trusted-types <nomi-policy>` | Il codice crea due policy nominate (`sa-sw-url` in shared.js:968, `sa-sw-import` in sw.js:14) ma senza un allowlist esplicito qualunque script che riesca a chiamare `createPolicy` può registrare una policy con nome arbitrario; aggiungere l'allowlist è difesa in profondità, non blocca un bug oggi | Aggiungere `trusted-types sa-sw-url sa-sw-import 'allow-duplicates'` (se necessario) alla CSP |
| bassa | index.html, index.css, shared.js (live) | HTML e asset non-fingerprinted in root (`index.css`, `shared.js`, `tokens.css`...) sono serviti con `Cache-Control: public, max-age=0, must-revalidate` (verificato via `curl -I` live) — nessuna regola dedicata in `_headers`, ricadono sul default `/*` | Non è un errore (evita staleness), ma è sub-ottimale: ogni load rivalida via ETag anche quando il contenuto non è cambiato. Non classificato come bug, solo nota per un eventuale miglioramento performance | Se si vuole cache più aggressiva, serve prima introdurre versioning nei nomi file |

## 3. manifest.json — icone, coerenza sw.js / precache

| Sev. | File:riga | Cosa | Perché | Fix |
|---|---|---|---|---|
| — | manifest.json (icons, screenshots) | Tutte le icone dichiarate (`icon-192.png`, `icon-192-maskable.png`, `icon-512.png`, `icon-512-maskable.png`) e gli screenshot (`home-390x844.webp`, `home-1280x720.webp`) esistono su disco in `icons/` e `screenshots/` | Verificato con `ls` | — |
| — | sw.js:29-49 (CORE_PRECACHE_URLS), sw.js:64-146 (OPTIONAL_PRECACHE_URLS) | 106 URL totali in precache; le uniche 21 voci non trovate come file letterali sul disco sono le pretty-url delle pagine (`/matematica`, `/faq`, ecc.), che esistono come `<nome>.html` e sono servite senza estensione dal redirect/clean-URL della piattaforma (confermato live: 200 su tutte) | Nessuna voce morta reale | — |
| — | sw.js vs manifest.json | Tutte le icone di manifest.json sono anche in OPTIONAL_PRECACHE_URLS (sw.js:110-116) | Coerente | — |

## 4. Regole di lint disattivate o troppo permissive

| Sev. | File:riga | Cosa | Perché | Fix |
|---|---|---|---|---|
| alta | (nessun file di config — gap nella CI) | `npm run lint` (eslint + stylelint) **non è mai eseguito in CI**: `.github/workflows/prepublish.yml` esegue solo `bash prepublish-check.sh` e `node scripts/audit_questions_json.js`; `prepublish-check.sh:436` chiama solo `scripts/lint_content.js` (lint linguistico dei contenuti), non eslint/stylelint | Verificato eseguendo `npx stylelint "*.css"` in locale: **1 errore reale e non corretto** è presente oggi nel repo (`info-pages.css:423` — `#questionsTotalCount` non è kebab-case, regola `selector-id-pattern`). Il fatto che superi la CI da tempo conferma che stylelint non gira mai automaticamente | Aggiungere uno step `npm run lint` al workflow `prepublish.yml` (o a un workflow dedicato) così eslint/stylelint bloccano la PR |
| bassa | .stylelintrc.json:9,15 | `declaration-block-no-duplicate-properties` e `declaration-block-no-redundant-longhand-properties` disattivate | Verificato: nel CSS esistono realmente 16 blocchi con proprietà duplicate (index.css, breakout.css, inglese.css, subject-quiz-theme.css), pattern tipico di fallback (`prop: valore-base; prop: var(--x);`) — la disattivazione è quindi giustificata dall'uso reale, non "gratuita" | Nessun fix necessario, ma vale la pena lasciare un commento nel file che spieghi il perché (fallback pattern) per chi tocca il config in futuro |
| bassa | eslint.config.mjs:69 | `no-console` è `warn` (non `error`) e permette `warn`/`error` | Coerente con l'uso reale: gli script Node in `scripts/` (build/report) usano `console.log` per output umano — 15 warning attuali, 0 errori | Nessun fix necessario |

## 5. Voci morte in package.json / config di tool non installati

| Sev. | File:riga | Cosa | Perché | Fix |
|---|---|---|---|---|
| — | package.json (tutti gli script) | Tutti i 21 script di `package.json` puntano a file realmente esistenti (verificato uno per uno: `scripts/*.js`, `scripts/*.py`, `scripts/*.sh`, `prepublish-check.sh`) | Nessuna voce morta | — |
| bassa | package.json:31 (`playwright: ^1.48.0`) | `node_modules/playwright` è assente nell'ambiente locale corrente, mentre è presente in `package-lock.json` | `node_modules/` è in `.gitignore` (riga 3) quindi è normale stato locale, non un bug di repo: `npm ci` (usato in `.github/workflows/e2e.yml:22`) lo installerebbe. Non eseguibile localmente `npm run test:e2e:*` finché non si fa `npm ci` / `npm run test:e2e:install` | Nessun fix di codice; solo nota operativa per chi lavora in locale |
| bassa | premi.html:9 | `<meta name="robots">` di premi.html manca `max-video-preview:-1` presente invece in tutte le altre 19 pagine indicizzabili | Incoerenza cosmetica, impatto SEO trascurabile (il default UA per max-video-preview è comunque permissivo) | Allineare la stringa robots di premi.html alle altre pagine |

---

## Riassunto

**Conteggio per severità:** alta 1 · media 1 · bassa 8 · nessun problema (verificato OK) 10+

**Le 5 più importanti:**
1. **[alta]** `npm run lint` (eslint+stylelint) non gira mai in CI (`.github/workflows/prepublish.yml` chiama solo `prepublish-check.sh` + `audit_questions_json.js`); prova concreta: `stylelint` trova oggi 1 errore reale mai intercettato (`info-pages.css:423`, `selector-id-pattern`).
2. **[media]** `/assets/*`, `/icons/*`, `/screenshots/*` in `_headers` hanno `Cache-Control: immutable, max-age=31536000` ma i file non sono fingerprinted (0 query-string di cache-busting su 385 riferimenti) — un aggiornamento asset con stesso nome resta invisibile ai client per fino a un anno.
3. **[bassa]** CSP ha `require-trusted-types-for 'script'` ma manca la direttiva `trusted-types` che elenchi le policy consentite (`sa-sw-url`, `sa-sw-import`).
4. **[bassa]** `/reports/*` in `_headers` non ha `Cache-Control` esplicito, a differenza di `/json/*` (asimmetria, non rischio reale).
5. **[bassa]** `premi.html` ha una meta-robots leggermente diversa (manca `max-video-preview:-1`) rispetto alle altre 19 pagine indicizzabili.

Tutto il resto verificato (sitemap↔html↔canonical↔robots↔redirects↔llms.txt, manifest.json↔icone su disco↔sw.js precache, script package.json↔file esistenti, CSP↔hash sync) è coerente e senza voci morte.
