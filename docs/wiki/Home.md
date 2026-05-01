# La Scuola Amica — Wiki tecnica

Documentazione tecnica del progetto [lascuolaamica.it](https://lascuolaamica.it).

---

## Pagine della wiki

| Pagina | Contenuto |
|---|---|
| [Architettura](Architettura) | Struttura frontend, moduli JS, gestione dati |
| [Installazione e deploy](Installazione-e-Deploy) | Avvio locale, build, Cloudflare Pages |
| [Contenuti e domande](Contenuti-e-Domande) | Pipeline editoriale, regole qualità, formato JSON |
| [Sicurezza, privacy e minori](Sicurezza-Privacy-e-Minori) | CSP, GDPR, privacy-by-design |
| [Runbook release](Runbook-Release) | Checklist pre-merge, deploy, rollback |

---

## Il progetto in sintesi

La Scuola Amica è una piattaforma educativa gratuita per la scuola primaria italiana. Quiz a risposta multipla su 8 materie (matematica, italiano, inglese, problemi, civica, geografia, storia, scienze), per le classi dalla 2ª alla 5ª.

**7.348 domande** validate, coerenti con le Indicazioni Nazionali.

Principi tecnici fondamentali:

- **Statico** — nessun server applicativo, nessun database. Solo HTML, CSS, JavaScript e JSON.
- **PWA offline-first** — funziona dopo il primo caricamento, su qualsiasi dispositivo.
- **Privacy-by-design** — nessuna registrazione, nessun cookie di terze parti, dati di gioco solo in localStorage.
- **WCAG 2.1 AA** — validata manualmente con tastiera, screen reader e riduzione movimento.
- **Zero dipendenze runtime** — JavaScript vanilla, font self-hosted.

---

## Repository e deploy

- **Repo:** GitHub (branch `main`)
- **Hosting:** Cloudflare Pages, deploy automatico da `main`
- **Build:** `bash scripts/export_for_cloudflare.sh` → directory `export/`
- **Sicurezza:** gestita tramite Cloudflare Rules (WAF, header, rate limiting)
