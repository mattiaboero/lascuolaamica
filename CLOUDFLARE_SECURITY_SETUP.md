# Cloudflare Security Setup (Consigliato)

Questo setup e pensato per `lascuolaamica.it` (sito statico educativo), con priorita su:
- sicurezza pratica,
- basso rischio di falsi positivi,
- compatibilita con SEO/AEO,
- piano Free (con note Pro/Business dove utile).

## 1) SSL/TLS (subito)

Dashboard Cloudflare -> **SSL/TLS**

1. **Encryption mode**: `Full (strict)`
2. **Always Use HTTPS**: `ON`
3. **Automatic HTTPS Rewrites**: `ON`
4. **Minimum TLS Version**: `TLS 1.2`
5. **HSTS**: `ON` con `max-age` iniziale 1 mese, `includeSubDomains` OFF, `preload` OFF

Note:
- Dopo 2-4 settimane senza problemi, puoi portare HSTS a 6-12 mesi.
- `preload` attivalo solo quando sei certo al 100% che ogni host/subdominio sia sempre HTTPS.

## 2) Security Settings (subito)

Dashboard Cloudflare -> **Security > Settings**

1. **Browser Integrity Check**: `ON`
2. **Bot Fight Mode (Free)**: `ON`
3. **Block AI Bots**: `OFF` (consigliato se vuoi mantenere AEO/visibilita AI)

Nota importante Free plan:
- Bot Fight Mode non e bypassabile via WAF Skip/Page Rules.
- Se vedi blocchi legittimi (strumenti esterni/API), valuta disattivazione o passaggio a Super Bot Fight Mode (Pro+).

## 3) Managed Rules (subito)

Dashboard Cloudflare -> **Security > WAF > Managed rules**

1. Deploy del **Cloudflare Free Managed Ruleset**
2. Action: lascia quella consigliata di default
3. Monitora Security Events per 48h, poi regola eccezioni solo se servono

Se in futuro passi a Pro/Business:
- abilita anche **Cloudflare Managed Ruleset**
- abilita anche **Cloudflare OWASP Core Ruleset**

## 4) Custom WAF Rules (alta priorita)

Dashboard Cloudflare -> **Security > WAF > Custom rules**

Nel piano Free hai 5 regole: qui trovi una baseline sicura e leggera.

### Regola 1 - Blocca metodi HTTP non usati
Action: `Block`

Expression:
```txt
not http.request.method in {"GET" "HEAD" "OPTIONS"}
```

### Regola 2 - Blocca probe su path noti di exploit
Action: `Block`

Expression:
```txt
lower(http.request.uri.path) contains "/wp-admin" or
lower(http.request.uri.path) contains "/wp-login.php" or
lower(http.request.uri.path) contains "/xmlrpc.php" or
lower(http.request.uri.path) contains "/.env" or
lower(http.request.uri.path) contains "/.git" or
lower(http.request.uri.path) contains "/phpmyadmin" or
lower(http.request.uri.path) contains "/composer.json" or
lower(http.request.uri.path) contains "/composer.lock" or
lower(http.request.uri.path) contains "/vendor/"
```

### Regola 3 - Challenge su query tipiche da injection/path traversal
Action: `Managed Challenge`

Expression:
```txt
lower(http.request.uri.query) contains "<script" or
lower(http.request.uri.query) contains "%3cscript" or
lower(http.request.uri.query) contains "union select" or
lower(http.request.uri.query) contains "union%20select" or
lower(http.request.uri.query) contains "../" or
lower(http.request.uri.query) contains "%2e%2e%2f" or
lower(http.request.uri.query) contains "or 1=1" or
lower(http.request.uri.query) contains "or%201=1"
```

Ordine consigliato:
1. Regola 1
2. Regola 2
3. Regola 3

## 5) Rate Limiting (alta priorita)

Dashboard Cloudflare -> **Security > WAF > Rate limiting rules**

Piano Free: in genere 1 regola.

### Regola rate limit baseline
Action: `Block`

Match expression:
```txt
http.host eq "lascuolaamica.it" and not starts_with(http.request.uri.path, "/cdn-cgi/")
```

Parametri consigliati:
- Period: `10 seconds`
- Requests per period: `300`
- Mitigation timeout (duration): `60 seconds`
- Characteristics: usa i default per IP (o Source IP se disponibile in UI)

Se vedi falsi positivi (es. rete scolastica condivisa):
- alza a `600` richieste / 10s
- oppure usa `Managed Challenge` al posto di Block

## 6) Response Header Transform Rules (consigliato)

Dashboard Cloudflare -> **Rules > Transform Rules > Response Header Transform Rules**

Crea una regola con filtro:
```txt
http.host eq "lascuolaamica.it"
```

Setta questi response headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), accelerometer=(), gyroscope=(), magnetometer=()`

Nota:
- hai gia meta tag CSP/Permissions nel codice; il passo Cloudflare rende i controlli piu robusti a livello header HTTP.

### 6.1) Regola JSON domande (consigliato)

Filtro:
```txt
http.host eq "lascuolaamica.it" and starts_with(http.request.uri.path, "/json/")
```

Headers da impostare:
- `X-Robots-Tag: noindex, nofollow`
- `Cache-Control: public, max-age=0, must-revalidate`

### 6.2) Regola asset statici lunghi (consigliato)

Filtro:
```txt
http.host eq "lascuolaamica.it" and (
  starts_with(http.request.uri.path, "/assets/") or
  starts_with(http.request.uri.path, "/screenshots/")
)
```

Header da impostare:
- `Cache-Control: public, max-age=31536000, immutable`

Nota:
- usa `Set static` (non `Add static`) per evitare header duplicati.

## 7) Verifica post-configurazione (obbligatoria)

1. **Security Events** (ultime 24-72h): controlla picchi e falsi positivi.
2. **Google Search Console**: nessun calo su scansione/indicizzazione.
3. Test manuale su:
- home,
- ogni materia,
- FAQ,
- supporta,
- PWA offline (dopo primo caricamento).

4. Test header da terminale:
```bash
curl -I https://lascuolaamica.it/json/index.json
curl -I https://lascuolaamica.it/json/matematica.json
curl -I https://lascuolaamica.it/assets/village/casa.svg
curl -I https://lascuolaamica.it/screenshots/og-home-1200x630.jpg
```

## 8) Runbook rapido quando scatta un falso positivo

1. Non spegnere tutto subito.
2. Metti temporaneamente la regola incriminata da `Block` a `Managed Challenge`.
3. Controlla l'evento (IP, URI, user-agent, regola).
4. Applica eccezione puntuale.
5. Riporta la regola a `Block` quando stabile.

## Riferimenti ufficiali

- WAF overview/availability: https://developers.cloudflare.com/waf/
- Custom rules (limiti Free inclusi): https://developers.cloudflare.com/waf/custom-rules/
- Managed rules (incluso Free Managed Ruleset): https://developers.cloudflare.com/waf/managed-rules/
- Rate limiting rules: https://developers.cloudflare.com/waf/rate-limiting-rules/
- Security interoperability (ordine esecuzione): https://developers.cloudflare.com/waf/feature-interoperability/
- Bot Fight Mode (limiti Free): https://developers.cloudflare.com/bots/get-started/bot-fight-mode/
- Full (strict): https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/full-strict/
- Always Use HTTPS: https://developers.cloudflare.com/ssl/edge-certificates/additional-options/always-use-https/
- Automatic HTTPS Rewrites: https://developers.cloudflare.com/ssl/edge-certificates/additional-options/automatic-https-rewrites/
- HSTS: https://developers.cloudflare.com/ssl/edge-certificates/additional-options/http-strict-transport-security/
- Response Header Transform Rules: https://developers.cloudflare.com/rules/transform/response-header-modification/
