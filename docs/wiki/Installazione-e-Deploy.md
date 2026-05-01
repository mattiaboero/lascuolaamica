# Installazione e deploy

---

## Avvio in locale

```bash
cd /percorso/al/progetto
python3 -m http.server 8080
```

Poi apri [http://localhost:8080](http://localhost:8080).

Il sito richiede un server HTTP anche in locale: Service Worker e richieste JSON non funzionano aprendo `index.html` direttamente nel filesystem (`file://`).

---

## Verifica prepublish

```bash
./prepublish-check.sh
```

Il check verifica:

- integrità e formato dei file JSON domande
- assenza di riferimenti runtime a `questions.json` (legacy, rimosso)
- `sitemap.xml` e `robots.txt` presenti e validi
- nessun errore di sintassi JS (`node --check`)

Il deploy non dovrebbe partire senza che questo passi.

---

## Build per il deploy

**Export per Cloudflare Pages:**

```bash
bash scripts/export_for_cloudflare.sh
```

Produce la directory `export/` con tutti i file pronti al deploy. `export/` è generata — non va versionata.

**Backup manuale fuori repo:**

```bash
bash scripts/export_backup_outside_repo.sh
# Con path specifico:
bash scripts/export_backup_outside_repo.sh "/percorso/assoluto/export-backup"
```

---

## Deploy su Cloudflare Pages

Il deploy è automatico al push su `main`.

Configurazione Cloudflare Pages:

| Parametro | Valore |
|---|---|
| Build command | `bash scripts/export_for_cloudflare.sh` |
| Build output directory | `export` |

**Nota importante:** non includere `_headers` e `_redirects` nel pacchetto deploy se le regole equivalenti sono già attive su Cloudflare Rules — avere entrambi può causare conflitti.

Sicurezza, header e redirect sono gestiti tramite Cloudflare Rules. Vedi [CLOUDFLARE_SECURITY_SETUP.md](../../CLOUDFLARE_SECURITY_SETUP.md) per la configurazione completa.

---

## Aggiornamento Service Worker

Dopo ogni release, la versione cache in `sw.js` va aggiornata (es. `lascuolaamica-v455`) per forzare la reinstallazione del SW nei client già attivi. Questo è incluso nel Runbook release.
