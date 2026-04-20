# Changelog Repo

## Unreleased - 2026-04-19

- Hardening CSP: rimossi gli script inline eseguibili dalle pagine pubbliche e spostati in `js/*.js`.
- Aggiornata la policy CSP nelle pagine principali con `script-src 'self'` (senza `unsafe-inline`).
- Aggiornato `sw.js` per includere in precache i nuovi script pagina.
- Migliorata la resilienza errori: rimossi i `catch` vuoti nei moduli principali, con logging silenzioso in modalità debug (`?debug` / localhost).
- Aggiunto fallback UX nel motore quiz: se il caricamento domande fallisce viene mostrato un messaggio chiaro all’utente.
- Verifiche tecniche completate con `node --check` e `prepublish-check.sh` (esito OK).
- Esteso il generatore parametrico `scripts/append_parametric_pilot.py` con profili `small`/`extended` e seed configurabile.
- Aggiunto report CSV automatico di copertura domande (`reports/questions_coverage_latest.csv` + archivio timestampato) generato a ogni run del generatore.
- Aggiunto flag `--report-only` per produrre solo il report CSV senza modificare i dataset.
- Eseguito il profilo `extended` sui dataset domande con controllo anti-duplicati e ID incrementali:
  - `matematica`: +128 domande parametriche (`totalQuestions=1716`)
  - `problemi`: +120 domande parametriche (`totalQuestions=920`)
  - `inglese`: +51 domande parametriche (`totalQuestions=334`)
- Aggiornati automaticamente `json/index.json`, `stats.rows`, `stats.areas`, `stats.classes` e timestamp `generatedAt`.

## 4.2.1 - 2026-04-18

- Completata validazione WCAG 2.1 A/AA manuale su tastiera, modali, zoom/reflow, VoiceOver e riduzione movimento.
- Corretto il reflow della home a zoom 200% (evitati tagli di card e testi).
- Pubblicata la pagina `accessibilita` con dichiarazione, metodologia e canale segnalazioni.
- Aggiunti link alla pagina Accessibilità in FAQ, Supporto e pannello Info.
- Aggiornati `sitemap.xml` e precache service worker con la nuova pagina.
- Versione portale aggiornata alla `4.2.1`.

## 4.2 - 2026-04-18

- Audit WCAG 2.1 AA automatico sulle pagine principali (rule set `wcag2a` e `wcag2aa`).
- Corrette le criticità di contrasto nel tema standard per home, FAQ e Villaggio.
- Impostata la palette standard come default e mantenuto il toggle Standard/Accessibile.
- Rigenerati screenshot social home (`390x844`, `1280x720`, `1200x630`) senza footer.
- Deduplicati i dataset domande con rinumerazione ID e allineamento JSON aggregati.
- Aggiornata la versione applicativa e la sezione “Ultimi aggiornamenti” alla `4.2`.

## 4.1.1 - 2026-04-13

- Uniformate canonical, Open Graph URL, JSON-LD e link interni alle rotte senza estensione `.html`.
- Aggiornata la sitemap con URL canonici senza estensione.
- Rimossi dalla sitemap gli URL non visibili (`villaggio`, `supporto-satispay`).
- Impostato `noindex,nofollow` su `villaggio` e `supporto-satispay`.
- Aggiornata la pagina supporto con indicazione email `supporto@lascuolaamica.it`.

## 4.1 - 2026-04-12

- Revisione linguistica estesa (accenti, apostrofi, forme corrette).
- Correzione refusi in domande e testi informativi.
- Fix stringhe JS con apostrofi che causavano errori di sintassi.
- Allineamento dati in JSON materia e aggregato.
- Sincronizzazione `export` con stato aggiornato.

## Nota

Lo storico funzionale dettagliato mostrato all'utente è mantenuto nel pannello “Ultimi aggiornamenti” (`shared.js`).
