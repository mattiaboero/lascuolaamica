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
- Regole sicurezza/cache/redirect gestite in Cloudflare Rules.

## Nota importante

Per questo progetto, `_headers` e `_redirects` non devono essere inclusi nel pacchetto deploy quando le regole equivalenti sono già attive su Cloudflare.
