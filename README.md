# La Scuola Amica

Piattaforma educativa web per la scuola primaria, progettata per allenare le competenze con quiz interattivi.

Sito: https://lascuolaamica.it

## Materie disponibili

- Matematica
- Inglese
- Problemi di matematica
- Educazione civica
- Geografia
- Storia
- Scienze
- Italiano

## Caratteristiche principali

- 10 domande per partita, 4 opzioni di risposta.
- Bonus finale facoltativo con moltiplicatore punteggio.
- Progressione per classi (2ª, 3ª, 4ª, 5ª) nelle materie supportate.
- PWA con supporto offline dopo il primo caricamento.
- Accessibilità migliorata (palette accessibile, focus management, supporto tastiera).
- Privacy-first: nessuna registrazione, nessun tracciamento di terze parti.
- Dati di gioco salvati localmente nel browser (`localStorage`).

## Stack tecnico

- HTML, CSS, JavaScript vanilla
- Service Worker (`sw.js`)
- Dataset domande in JSON (`questions.json` e `json/*.json`)
- Script build domande: `build_questions_json.py`

## Struttura progetto (estratto)

- `index.html` home
- `*.html` pagine materia
- `shared.js` componenti e logica condivisa
- `subject-quiz-core.js` motore quiz materie
- `questions-loader.js` loader dataset
- `json/` dataset per materia
- `export/` cartella build locale (generata, non versionata)

## Avvio in locale

Usa un server statico, ad esempio:

```bash
cd "/Users/mattiaboero/Library/Mobile Documents/com~apple~CloudDocs/cervellino/files"
python3 -m http.server 8080
```

Poi apri [http://localhost:8080](http://localhost:8080).

## Qualità prima del deploy

Esegui sempre:

```bash
./prepublish-check.sh
```

## Build export locale

Genera il pacchetto deploy locale in `export/`:

```bash
bash scripts/export_for_cloudflare.sh
```

Genera un backup deploy fuori repo (default: cartella sorella `../export-backup`):

```bash
bash scripts/export_backup_outside_repo.sh
```

## Deploy consigliato

- Repository GitHub
- Cloudflare Pages con deploy automatico dal branch `main`
  - Build command: `bash scripts/export_for_cloudflare.sh`
  - Build output directory: `export`
- Regole headers/redirect gestite in Cloudflare (non via upload di `_headers` e `_redirects`)

Note deploy: vedi la wiki tecnica in `docs/wiki/`.

## Wiki

I testi wiki pronti sono in `docs/wiki/`.
Puoi copiarli nella Wiki GitHub o tenerli versionati nella repo.

## Licenza

Aggiungere la licenza desiderata (`LICENSE`) prima di pubblicare open source.
