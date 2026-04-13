# Installazione e deploy

## Locale

```bash
cd "/Users/mattiaboero/Library/Mobile Documents/com~apple~CloudDocs/cervellino/files"
python3 -m http.server 8080
```

## Verifica prepublish

```bash
./prepublish-check.sh
```

## Deploy produzione

- Repository GitHub collegata a Cloudflare Pages.
- Deploy automatico dal branch `main`.
- Build command Cloudflare Pages: `bash scripts/export_for_cloudflare.sh`
- Build output directory Cloudflare Pages: `export`
- Regole sicurezza/cache/redirect gestite in Cloudflare Rules.

## Export manuale fuori repo (backup)

Per creare un pacchetto deploy manuale fuori dalla repo:

```bash
bash scripts/export_backup_outside_repo.sh
```

Per indicare una destinazione specifica:

```bash
bash scripts/export_backup_outside_repo.sh "/percorso/assoluto/export-backup"
```

## Nota importante

Per questo progetto, `_headers` e `_redirects` non devono essere inclusi nel pacchetto deploy quando le regole equivalenti sono già attive su Cloudflare.
