# Installazione e deploy

---

## Avvio in locale

```bash
cd /percorso/al/progetto
python3 -m http.server 8080
```

Poi apri [http://localhost:8080](http://localhost:8080).

Il sito richiede un server HTTP anche in locale: il supporto offline e il caricamento dei dati non funzionano aprendo `index.html` direttamente nel filesystem (`file://`).

---

## Verifica prepublish

```bash
./prepublish-check.sh
```

Il check verifica:

- integrità e formato dei file JSON domande
- assenza di riferimenti runtime legacy non desiderati
- `sitemap.xml` e `robots.txt` presenti e validi
- nessun errore di sintassi JS (`node --check`)

Il deploy non dovrebbe partire senza che questo passi.

---

## Build per la pubblicazione

**Export per l’ambiente di hosting:**

```bash
bash scripts/export_for_cloudflare.sh
```

Produce la directory `export/` con tutti i file pronti al deploy. `export/` è generata — non va versionata.

### Vincolo PWA: deploy in root

La configurazione PWA attuale e supportata con affidabilita solo quando il sito e pubblicato **in root del dominio**:

- Service Worker registrato su `/sw.js`
- manifest con `start_url: "/"` e `scope: "/"`
- clean URL dipendenti da rewrite host compatibili con [`_redirects`](../../_redirects)

Questo significa che un deploy in sottocartella o su GitHub Pages non e un target supportato al momento.

### Aggiornamenti cache offline

Quando cambiano risorse servite in precache o cache-first, bisogna aggiornare `APP_VERSION` in [`app-version.js`](../../app-version.js). Il controllo prepublish blocca le modifiche rilevanti se la versione non viene incrementata.

**Backup manuale fuori repo:**

```bash
bash scripts/export_backup_outside_repo.sh
# Con path specifico:
bash scripts/export_backup_outside_repo.sh "/percorso/assoluto/export-backup"
```

---

## Pubblicazione automatica

La pubblicazione parte automaticamente al push su `main`.

Parametri essenziali della build automatica:

| Parametro | Valore |
|---|---|
| Build command | `bash scripts/export_for_cloudflare.sh` |
| Build output directory | `export` |

---

## Aggiornamento Service Worker

Dopo ogni release, la versione della cache offline va riallineata per forzare l’aggiornamento nei client già attivi. Questo controllo è incluso nel Runbook release.

Il runtime registra il Service Worker con `updateViaCache: "none"` e sia [`sw.js`](../../sw.js) sia [`app-version.js`](../../app-version.js) devono essere serviti con `Cache-Control: no-cache`.
