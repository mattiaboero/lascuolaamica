# Deploy automatico con GitHub + Cloudflare Pages

Questa è la configurazione consigliata per evitare upload manuali incompleti.

## 1) Crea la repository GitHub

1. Crea repo (es. `lascuolaamica`).
2. Carica i file del progetto (`files/`) come root repo.
3. Commit iniziale su `main`.

## 2) Collega Cloudflare Pages

1. Cloudflare Dashboard -> Workers & Pages -> Create application -> **Pages**.
2. Connect to Git.
3. Seleziona la repo.
4. Impostazioni build:
   - Framework preset: `None`
   - Build command: vuoto
   - Build output directory: `export`
   - Root directory: `/`

Nota importante:

- Non usare il flusso Worker con `npx wrangler deploy` per questo progetto statico.
- Nei log corretti di Pages è normale vedere `No build command specified. Skipping build step.`

## 3) Configura dominio

- Dominio primario: `lascuolaamica.it`
- Redirect `www` -> root via Single Redirect (301).
- Se esiste un vecchio progetto, rimuovi prima il dominio da quello vecchio e poi aggiungilo al nuovo.

## 4) Header e redirect

Nel tuo setup sono gestiti da Cloudflare Rules.

Quindi in deploy **non è necessario** caricare `_headers` e `_redirects`.

## 5) Regole consigliate già adottate

- JSON domande (`/json/*`):
  - `X-Robots-Tag: noindex, nofollow`
  - `Cache-Control: public, max-age=0, must-revalidate`
- `sw.js`:
  - `Cache-Control: no-cache`
- Header globali sicurezza:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
- Asset statici (`/assets/*`, `/screenshots/*`):
  - `Cache-Control: public, max-age=31536000, immutable`

## 6) Workflow rilascio

1. Aggiorna `export/` con `scripts/export_for_cloudflare.sh`.
2. Commit e merge su `main`.
3. Cloudflare Pages esegue autodeploy.
4. Verifica post-deploy:
   - Home e almeno 2 materie.
   - FAQ e supporto.
   - `curl -I` su `/json/index.json` e `/sw.js`.

## 7) Rollback

- Da Cloudflare Pages -> Deployments -> Retry/Promote versione precedente.
- Oppure revert commit su GitHub e nuovo deploy automatico.
