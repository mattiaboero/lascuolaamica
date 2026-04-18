# Changelog Repo

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
