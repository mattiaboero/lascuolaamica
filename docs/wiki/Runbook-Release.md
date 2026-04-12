# Runbook release

## Prima del merge

1. Aggiorna contenuti/codice.
2. Aggiorna versione (`app-version.js`) se necessario.
3. Aggiorna “Ultimi aggiornamenti” in `shared.js`.
4. Esegui `./prepublish-check.sh`.
5. Sincronizza `export/`.

## Deploy

1. Merge su `main`.
2. Cloudflare Pages autodeploy.
3. Smoke test:
   - home,
   - due materie,
   - FAQ,
   - supporto,
   - header HTTP principali (`curl -I`).

## Rollback

- Ripristina deployment precedente da Cloudflare Pages, oppure revert commit su `main`.
