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
2. La piattaforma di hosting avvia il deploy automatico
3. Attendi la fine del build (1–3 minuti tipicamente)
4. Esegui lo smoke test:

5. Verifica manuale nel browser:
   - Home
   - Due materie diverse (quiz completo)
   - FAQ
   - Pagina supporto
   - Funzionamento offline (dopo primo caricamento, disconnetti e ricarica)
6. Se necessario, verifica anche header, asset principali e comportamenti di sicurezza con gli strumenti del team.

---

## Rollback

**Via dashboard hosting** (rapido): ripristina il deployment precedente dalla schermata dei deploy.

**Via Git** (completo): revert del commit su `main` → push → deploy automatico.

Preferire il rollback dalla dashboard hosting per problemi urgenti in produzione. Il revert Git è preferibile se il problema è nei dati o nei contenuti versionati.
