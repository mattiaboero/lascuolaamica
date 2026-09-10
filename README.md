# La Scuola Amica

[![Licenza MIT](https://img.shields.io/badge/licenza-MIT-blue.svg)](LICENSE)
[![PWA](https://img.shields.io/badge/PWA-supportata-brightgreen.svg)](https://lascuolaamica.it)
[![WCAG 2.1 AA](https://img.shields.io/badge/WCAG%202.1-AA-success.svg)](https://lascuolaamica.it/accessibilita)
[![Domande](https://img.shields.io/badge/domande-9.223-orange.svg)](https://lascuolaamica.it)
[![Gratuito](https://img.shields.io/badge/accesso-gratuito%20%26%20senza%20registrazione-yellow.svg)](https://lascuolaamica.it)

Piattaforma educativa gratuita per la scuola primaria italiana. Quiz a risposta multipla su 8 materie, 4 classi, 9.223 domande, più due giochi — senza registrazione, senza tracciamento, accessibile anche offline.

🌐 **[lascuolaamica.it](https://lascuolaamica.it)**

---

## Perché esiste

Le piattaforme di esercitazione per la primaria chiedono quasi sempre un account. Spesso raccolgono dati. Spesso non funzionano senza connessione.

La Scuola Amica parte da un presupposto diverso: un bambino di 8 anni non dovrebbe dover creare un profilo per fare un quiz di matematica. Il sito funziona al primo caricamento, poi anche offline. Non sa chi sei. Non vuole saperlo.

---

## Materie disponibili

| Materia | Classi supportate |
|---|---|
| Matematica | 2ª – 5ª |
| Problemi di matematica | 2ª – 5ª |
| Italiano | 2ª – 5ª |
| Inglese | 2ª – 5ª |
| Educazione civica | 2ª – 5ª |
| Geografia | 2ª – 5ª |
| Storia | 2ª – 5ª |
| Scienze | 2ª – 5ª |

---

## Gioco arcade: Cervellino Spacca-Muri

Un rompi-mattoni ispirato a Breakout/Arkanoid, su [/breakout](https://lascuolaamica.it/breakout). Motore Canvas 2D vanilla indipendente (`js/breakout.js`), nessuna dipendenza dal quiz engine condiviso.

Le domande dei bonus e del salvataggio pallina pescano dallo stesso pool delle 8 materie, filtrato per la classe scelta a inizio partita. 4 bonus (barra larga, +1 vita, distruggi un colore, pallina appiccicosa) si attivano solo rispondendo bene a una domanda — raccogliere la capsula non basta. Se la pallina cade, una domanda a sorpresa può salvarla prima di perdere una vita. 10 trofei dedicati, visibili nella bacheca premi insieme a quelli dei quiz.

---

## Gioco di ortografia: Il Bosco delle Lettere

Un gioco di ortografia su [/bosco](https://lascuolaamica.it/bosco), per la 2ª e la 3ª. Motore Canvas 2D vanilla indipendente (`js/bosco.js`), scena disegnata interamente via codice: nessuno sprite, nessuno sfondo raster.

Il bambino esplora una radura, raccoglie il cartello con il gruppo di lettere giusto e lo porta al tabellone. Due modi di giocare:

- **Completa la parola** — sul tabellone c'è la parola bucata (`CAMPA_A`), nella radura i cartelli con i gruppi possibili. Si va dal suono al segno.
- **Caccia al suono** — sul tabellone c'è il gruppo (`GN`), nella radura tre parole intere. Il compito è rovesciato: dal segno al suono.

Il banco è di 129 parole su 10 famiglie ortografiche — GN, GLI, SCE/SCI, CHE/CHI, GHE/GHI, QU, CQU, doppie, accento, vocale in mezzo — ciascuna con la sua regola in parole semplici e distrattori scelti fra gli errori che i bambini fanno davvero (`GNI` per `GN`, `CU` per `QU`, la vocale nuda al posto di quella accentata). Il gioco ricorda quali famiglie vanno meno bene e le ripropone più spesso, con recupero spaziato. Sintesi vocale per ascoltare la parola, sei premi dedicati nella bacheca condivisa.

Il modello (parole, confini della radura, simulazione dell'acqua) è verificato da `scripts/check_bosco.js`, che carica `js/bosco.js` senza canvas.

---

## Come funziona

Ogni partita propone 10 domande a scelta multipla (4 opzioni). Al termine c'è un bonus facoltativo con moltiplicatore punteggio. Le domande vengono selezionate con un algoritmo stocastico per classe e ambito che riduce i pattern ripetitivi tra sessioni.

Dopo ogni risposta compare una spiegazione del perché è corretta o sbagliata. Il gioco adatta gradualmente la difficoltà al livello di chi gioca, tiene traccia delle serie di risposte corrette consecutive con un feedback dedicato, e propone un pulsante "Ripassa i tuoi errori" per rivedere solo le domande sbagliate in precedenza. Un filtro per sotto-ambito e un pannello "Progressi" con le statistiche delle ultime partite completano l'esperienza.

I risultati possono sbloccare una bacheca premi locale con badge, coccarde, coppe e trofei. La bacheca può essere esportata come immagine PNG/JPEG.

I progressi vengono salvati localmente nel browser. Non c'è nessun server che li riceve.

---

## Caratteristiche tecniche

- **PWA con supporto offline** — funziona dopo il primo caricamento, anche su URL pulite come `/storia` o `/faq`
- **Accessibilità WCAG 2.1 AA** — validata manualmente con tastiera, VoiceOver, zoom 200% e riduzione movimento
- **Privacy-first** — nessuna registrazione, nessun cookie di terze parti, dati di gioco salvati solo nella memoria locale del browser
- **9.223 domande** su 8 materie, coerenti con le Indicazioni Nazionali per la scuola primaria
- **Font self-hosted** — nessuna richiesta esterna a Google Fonts o CDN
- **Politiche di sicurezza restrittive** — contenuti pubblici e aree tecniche separati con controlli dedicati

## Architettura quiz unificata

Il sito usa un solo motore runtime, [subject-quiz-core.js](subject-quiz-core.js), condiviso da tutte le 8 materie. Ogni materia espone soltanto una config dichiarativa in `js/<subject>-page.js`, mentre i dataset vivono in `json/<subject>.json` e `json/index.json`.

La panoramica tecnica e la guida per aggiungere una nuova materia sono documentate nella wiki:
- [Architettura](docs/wiki/Architettura.md)
- [Contenuti e domande](docs/wiki/Contenuti-e-Domande.md)

---

## Vincoli PWA e deploy

- **Deploy target: root del dominio** — la PWA e pensata per essere pubblicata in root (`https://dominio.tld/`), non in sottocartella.
- **Service Worker root-only** — la registrazione usa `/sw.js` e il manifest usa `start_url` e `scope` su `/`.
- **Rewrite richiesti** — le clean URL (`/matematica`, `/faq`, `/premi`) richiedono regole compatibili con [_redirects](_redirects). GitHub Pages non copre questo scenario senza adattamenti esterni.
- **Fallback offline attuale** — se una navigazione offline non trova la pagina richiesta, il Service Worker torna alla home. Non esiste ancora una pagina offline dedicata.
- **Version bump obbligatorio** — quando cambiano asset precache o cache-first, va aggiornato `APP_VERSION` in [app-version.js](app-version.js) per invalidare la cache offline.

---

## Stack tecnico

```
HTML + CSS + JavaScript vanilla
Supporto offline progressivo
Dataset domande in JSON per materia
Script di build e verifica dedicati
Hosting statico con pubblicazione automatica
```

Nessun framework frontend. Nessuna dipendenza NPM a runtime.

---

## Struttura del progetto

```
├── index.html              # Home
├── *.html                  # Pagine materia
├── breakout.html           # Gioco arcade "Cervellino Spacca-Muri"
├── breakout.css            # Stili dedicati al gioco arcade
├── bosco.html              # Gioco di ortografia "Il Bosco delle Lettere"
├── bosco.css               # Stili dedicati al gioco di ortografia
├── premi.html              # Bacheca premi locale
├── rewards.css             # Stili bacheca premi
├── shared.js               # Componenti e logica condivisa
├── subject-quiz-core.js    # Motore quiz condiviso per tutte le 8 materie
├── js/
│   ├── breakout.js         # Motore Canvas 2D del gioco arcade
│   ├── bosco.js            # Motore Canvas 2D del gioco di ortografia
│   ├── rewards.js          # Motore premi locale
│   └── <subject>-page.js   # Config materia dichiarativa
├── questions-loader.js     # Loader dataset JSON
├── sw.js                   # Service Worker
├── json/
│   ├── index.json          # Indice con cardinalità per materia
│   └── *.json              # Dataset per materia
├── assets/                 # Immagini, mascotte, icone
├── scripts/                # Script build e utilità
└── docs/wiki/              # Documentazione tecnica
```

---

## Source of truth domande quiz

Il runtime usa i JSON in `json/*.json` come unica fonte dati reale tramite `questions-loader.js`.

- Il core condiviso idrata sia le domande standard sia le bonus questions da JSON.
- Le righe bonus vivono nei rispettivi file materia con `bonus: true` e bucket `bonusRaw` (`easy`, `medium`, `hard`).

---

## Avvio in locale

```bash
cd /percorso/al/progetto
python3 -m http.server 8080
```

Poi apri [http://localhost:8080](http://localhost:8080).

**Nota:** il sito richiede un server HTTP — non funziona aprendo `index.html` direttamente nel browser (i Service Worker e le richieste JSON richiedono un'origine).

**Nota PWA:** per riprodurre il comportamento reale offline/installabile serve anche un deploy in root con rewrite compatibili con [_redirects](_redirects).

---

## Qualità prima del deploy

```bash
npm run verify
```

Incatena i controlli che devono passare prima di ogni pubblicazione:

| comando | che cosa verifica |
|---|---|
| `check:materialized` | che ogni file tracciato sia davvero sul disco (il repo vive in iCloud) |
| `lint:js` / `lint:css` | ESLint e Stylelint |
| `audit:json` | integrità e schema dei dataset |
| `lint:content` | 93 regole su testo, opzioni e spiegazioni delle domande |
| `check:math` | ogni uguaglianza scritta in una spiegazione |
| `check:plausibility` | 28 regole sulla scala dei dati nei problemi |
| `check:bosco` | banco parole, confini della radura e acqua del gioco di ortografia |
| `check:balance` | che la risposta giusta non si concentri in una posizione |
| `check:counts` | che i numeri di domande pubblicati coincidano con i dataset |
| `check:prepublish` | `prepublish-check.sh`: sitemap, robots.txt, header PWA, contratti del quiz engine |
| `export` | costruisce `export/` e la verifica: niente di mancante, niente di interno |

`npm run freshness` riallinea invece i numeri e i file generati (conteggi, dati strutturati, sitemap, hash CSP).

---

## Build e deploy

**Export** (`export/`, la cartella che Cloudflare pubblica):

```bash
npm run export
```

Costruisce `export/` a partire dai file tracciati da git, con una **lista di inclusione**: pagine, stili, script del sito, `js/`, `json/`, immagini, `_headers` e `_redirects`. Tutto il resto — `scripts/`, `docs/`, `reports/`, `package.json`, i file `.md` — resta fuori. Le domande disattivate non vengono spedite, e JS e CSS vengono minificati con esbuild a versione fissata (−27% in transito anche dopo Brotli). Alla fine `scripts/check_export.js` verifica che non manchi niente di ciò che il sito usa (URL del service worker, riferimenti nelle pagine, sitemap, sintassi dei JS minificati, conteggio delle domande) e che non ci sia niente di interno. È l'ultimo passo di `npm run verify`.

**Backup deploy fuori repo** (default: `../export-backup`):

```bash
bash scripts/export_backup_outside_repo.sh
# Oppure con path specifico:
bash scripts/export_backup_outside_repo.sh "/percorso/assoluto/export-backup"
```

**Pubblicazione consigliata:**

- Repository GitHub collegata a una piattaforma di hosting statico
- Build command: `bash scripts/export_for_cloudflare.sh`
- Build output directory: `export`
- Variabile d'ambiente `NODE_VERSION`: `20` (o superiore, come in `engines`)

Se l'output directory non è `export`, Cloudflare pubblica la radice del repo: è successo fino al 10/09/2026, con `scripts/`, `reports/` e `package.json` raggiungibili dal sito.
- Regole di sicurezza e instradamento gestite nella configurazione di hosting del progetto

---

## Come contribuire

Le contribuzioni più utili sono nuove domande: vedi [CONTRIBUTING.md](CONTRIBUTING.md) per la pipeline completa, dalle convenzioni editoriali al flusso di integrazione dei contenuti.

Per bug report e segnalazioni tecniche, apri una issue. Per PR, segui il flusso in CONTRIBUTING.md.

---

## Wiki tecnica

La documentazione tecnica dettagliata è in `docs/wiki/`:

- [Architettura](docs/wiki/Architettura.md)
- [Installazione e deploy](docs/wiki/Installazione-e-Deploy.md)
- [Contenuti e domande](docs/wiki/Contenuti-e-Domande.md)
- [Sicurezza, privacy e minori](docs/wiki/Sicurezza-Privacy-e-Minori.md)
- [Runbook release](docs/wiki/Runbook-Release.md)

---

## Licenza

[MIT](LICENSE) — software libero, riutilizzabile, modificabile.
