# Runbook release

Checklist da seguire ad ogni release. L'ordine conta.

---

## Preparazione

1. Aggiorna contenuti e/o codice sul branch di lavoro
2. Aggiorna la versione in `app-version.js` (se la release è rilevante per gli utenti)
3. Aggiorna il log "Ultimi aggiornamenti" in `shared.js`
4. Aggiorna il numero di domande in FAQ e `llms.txt` se cambiato
5. Esegui `./prepublish-check.sh` — deve passare senza errori
6. Sincronizza `export/` con `bash scripts/export_for_cloudflare.sh`
7. Aggiorna `CHANGELOG.md` con le voci della release

---

## Merge e deploy

1. Merge su `main`
2. Cloudflare Pages avvia il deploy automatico
3. Attendi la fine del build (1–3 minuti tipicamente)
4. Esegui lo smoke test:

```bash
# Header HTTP
curl -I https://lascuolaamica.it
curl -I https://lascuolaamica.it/json/index.json
curl -I https://lascuolaamica.it/assets/mascotte/cervellino-neutral.png

# Verifica CSP
curl -I https://lascuolaamica.it | grep content-security-policy
```

5. Verifica manuale nel browser:
   - Home
   - Due materie diverse (quiz completo)
   - FAQ
   - Pagina supporto
   - Funzionamento offline (dopo primo caricamento, disconnetti e ricarica)

---

## Rollback

**Via Cloudflare Pages** (rapido): ripristina il deployment precedente dalla dashboard Pages → Deployments.

**Via Git** (completo): revert del commit su `main` → push → deploy automatico.

Preferire il rollback Cloudflare per problemi urgenti in produzione. Il revert Git è preferibile se il problema è nei dati (JSON domande).
