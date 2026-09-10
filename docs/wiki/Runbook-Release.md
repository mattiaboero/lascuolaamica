# Runbook release

Checklist da seguire ad ogni release. L'ordine conta.

---

## Preparazione

1. Aggiorna contenuti e/o codice sul branch di lavoro
2. Allinea la versione nei tre file che la citano: `app-version.js`, `package.json`, `llms.txt`. `check_version_alignment` in `prepublish-check.sh` blocca la release se divergono.
3. Aggiorna `json/changelog.json`, che alimenta il popup "Ultimi aggiornamenti" del sito (non più `shared.js`, che si limita a leggerlo). Convenzione: **una voce per giornata**, massimo 7 righe, e l'etichetta `date` deve citare la versione corrente — `check_update_log` lo verifica.
4. Esegui `npm run freshness`: riallinea da solo i conteggi di domande in ogni pagina, i dati strutturati, la sitemap e gli hash CSP. Non serve più aggiornare a mano FAQ e `llms.txt`.
5. Esegui `npm run verify` — deve passare senza errori. Include `prepublish-check.sh` come ultimo anello.
6. `export/` si costruisce da sola come ultimo passo di `npm run verify`, e Cloudflare la ricostruisce allo stesso modo al deploy
7. Aggiorna `CHANGELOG.md` con le voci della release

---

## Che cosa esegue `npm run verify`

| comando | che cosa verifica |
|---|---|
| `check:materialized` | che ogni file tracciato sia davvero sul disco: il repo vive in iCloud, e un file sfrattato legge vuoto e fa passare i controlli senza eseguirli |
| `lint:js` / `lint:css` | ESLint e Stylelint |
| `audit:json` | integrità e schema dei dataset |
| `lint:content` | 93 regole su testo, opzioni e spiegazioni delle domande |
| `check:math` | ogni uguaglianza scritta dentro una spiegazione |
| `check:plausibility` | 28 regole sulla scala dei dati nei problemi |
| `check:bosco` | banco parole, confini della radura e acqua del gioco di ortografia |
| `check:balance` | che la risposta giusta non si concentri in una posizione |
| `check:counts` | che i numeri di domande pubblicati coincidano con i dataset |
| `check:prepublish` | `prepublish-check.sh` |
| `export` | costruisce `export/` e la verifica con `check_export.js`: niente di mancante, niente di interno |

Fuori dalla catena, da lanciare quando si toccano le regole di lint: `npm run check:grammar-rules`, un meta-controllo che verifica che ogni regola grammaticale intercetti ancora il suo esempio e non tocchi le frasi corrette.

## Guard rail in prepublish-check.sh

Architetturali:

1. `check_core_no_subject_branch` — vieta `if (cfg.subject === ...)` nel core condiviso.
2. `check_cursor_key_explicit` — verifica che tutte le page subject dichiarino `cursorKey` in modo esplicito.
3. `check_subject_pages_size` — verifica che ogni file `js/<subject>-page.js` resti sotto la soglia massima prevista.
4. `check_extension_contract_present` — verifica che il commento "Extension Contract" sia presente in `subject-quiz-core.js`.
5. `check_runtime_split_json_only` — vieta il ritorno di dataset legacy fuori da `json/`.

Release e PWA:

6. `check_version_alignment` — la versione deve coincidere in `app-version.js`, `package.json` e `llms.txt`.
7. `check_update_log` — la prima voce di `json/changelog.json` deve citare la versione corrente.
8. `check_pwa_version_bump_for_precache_changes` — se cambia un file in precache, la versione deve salire.
9. `check_sw_precache`, `check_pwa_cache_headers`, `check_pwa_root_only_contract`, `check_stable_cache_names_are_literal`, `check_immutable_assets_not_replaced_in_place`.

Sicurezza e igiene: `check_security_patterns`, `check_csp_hashes`, `check_target_blank_rel`, `check_storage_helpers`, `check_html_integrity`, `check_css_hygiene`, `check_rewards_page_metadata`, `check_no_npm_lifecycle_script_names`.

Questi controlli servono a bloccare regressioni architetturali prima del merge.

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
