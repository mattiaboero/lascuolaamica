# La Scuola Amica

[![Licenza MIT](https://img.shields.io/badge/licenza-MIT-blue.svg)](LICENSE)
[![PWA](https://img.shields.io/badge/PWA-supportata-brightgreen.svg)](https://lascuolaamica.it)
[![WCAG 2.1 AA](https://img.shields.io/badge/WCAG%202.1-AA-success.svg)](https://lascuolaamica.it/accessibilita)
[![Domande](https://img.shields.io/badge/domande-7.348-orange.svg)](https://lascuolaamica.it)
[![Gratuito](https://img.shields.io/badge/accesso-gratuito%20%26%20senza%20registrazione-yellow.svg)](https://lascuolaamica.it)

Piattaforma educativa gratuita per la scuola primaria italiana. Quiz a risposta multipla su 8 materie, 4 classi, 7.348 domande — senza registrazione, senza tracciamento, accessibile anche offline.

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

## Come funziona

Ogni partita propone 10 domande a scelta multipla (4 opzioni). Al termine c'è un bonus facoltativo con moltiplicatore punteggio. Le domande vengono selezionate con un algoritmo stocastico per classe e ambito che riduce i pattern ripetitivi tra sessioni.

I risultati possono sbloccare una bacheca premi locale con badge, coccarde, coppe e trofei. La bacheca può essere esportata come immagine PNG/JPEG.

I progressi vengono salvati localmente nel browser. Non c'è nessun server che li riceve.

---

## Caratteristiche tecniche

- **PWA con supporto offline** — funziona dopo il primo caricamento, anche su URL pulite come `/storia` o `/faq`
- **Accessibilità WCAG 2.1 AA** — validata manualmente con tastiera, VoiceOver, zoom 200% e riduzione movimento
- **Privacy-first** — nessuna registrazione, nessun cookie di terze parti, dati di gioco salvati solo nella memoria locale del browser
- **7.348 domande** su 8 materie, coerenti con le Indicazioni Nazionali per la scuola primaria
- **Font self-hosted** — nessuna richiesta esterna a Google Fonts o CDN
- **Politiche di sicurezza restrittive** — contenuti pubblici e aree tecniche separati con controlli dedicati

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
├── premi.html              # Bacheca premi locale
├── rewards.css             # Stili bacheca premi
├── shared.js               # Componenti e logica condivisa
├── subject-quiz-core.js    # Motore quiz (matematica, italiano, geo, storia, scienze)
├── js/
│   ├── rewards.js          # Motore premi locale
│   ├── inglese-page.js     # Motore quiz inglese
│   ├── problemi-page.js    # Motore quiz problemi
│   └── civica-page.js      # Motore quiz civica
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
./prepublish-check.sh
```

Lo script verifica integrità JSON, assenza di riferimenti a `questions.json` legacy, sitemap e robots.txt.

---

## Build e deploy

**Export locale** (`export/`):

```bash
bash scripts/export_for_cloudflare.sh
```

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
