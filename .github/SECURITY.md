# Sicurezza

## Segnalare una vulnerabilità

Non aprire una issue pubblica. Usa la segnalazione privata di GitHub: [Segnala una vulnerabilità](https://github.com/mattiaboero/lascuolaamica/security/advisories/new).

Indica la pagina o il file coinvolto, i passi per riprodurre il problema e l'effetto che hai osservato.

## Versione supportata

È supportata solo la versione in produzione su <https://lascuolaamica.it>, cioè l'ultimo commit di `main`.

## Che cosa interessa

Il sito non ha account e non raccoglie dati personali: i progressi restano nel browser. Sono utili soprattutto le segnalazioni su:

- script eseguiti nelle pagine senza essere previsti;
- aggiramenti della Content Security Policy o degli altri header;
- service worker e cache offline;
- catena di build, workflow e dipendenze.

## Dipendenze di sviluppo: rischio accettato

Valutazione del 24 ottobre 2026 (versione 4.26.1), aggiornata il 1 novembre
2026 (versione 4.27.15).

Il sito non ha dipendenze di produzione: nel browser arrivano solo HTML, CSS e
JavaScript del repository. Il job `prepublish` lancia `npm audit --omit=dev
--audit-level=high` a ogni PR e a ogni push su `main`, quindi una dipendenza di
produzione vulnerabile, se un giorno entrasse, blocca il merge.

`npm audit` sulle devDependencies segnala 23 avvisi: 13 alti, 8 moderati, 2
bassi, nessuno critico. Diciannove vengono da `@lhci/cli` 0.15.1, l'ultima
versione, che fissa `lighthouse` 12.6.1, `chrome-launcher` 0.13, `tmp` ^0.1 e
`inquirer` ^6. I pacchetti coinvolti sono `@lhci/cli`, `@lhci/utils`,
`lighthouse`, `puppeteer-core`, `@puppeteer/browsers`, `chromium-bidi`, `zod`,
`extract-zip`, `proxy-agent`, `pac-proxy-agent`, `get-uri`, `basic-ftp`,
`chrome-launcher`, `rimraf`, `glob`, `inquirer`, `external-editor`, `tmp` e
`uuid`. L'unica correzione proposta da npm è tornare a `@lhci/cli` 0.1.0
(`--force`); `npx` al posto della devDependency e gli `overrides` sono stati
scartati.

Gli altri quattro vengono da `eslint` 10.14.0, l'ultima versione, che usa
`minimatch` 10.2: `eslint`, `@eslint/config-array`,
`@eslint-community/eslint-utils` e `minimatch`. Il difetto di `minimatch`,
corretto dalla 11.0.1, è una lentezza con pattern costruiti apposta. La
correzione proposta da npm, tornare a `eslint` 4.0.0, non è una correzione.
`qs`, segnalato il 1 novembre, si è risolto con `npm audit fix` senza
`--force`.

Perché non arrivano al sito: sono strumenti di misura. L'export per Cloudflare
(`scripts/export_for_cloudflare.sh`) copia solo i file del sito tracciati da
git, mai `node_modules/`, e `scripts/check_export.js` blocca la pubblicazione
se nell'export c'è qualcosa di interno.

Perché le falle non sono sfruttabili nell'uso che ne facciamo:

- `@lhci/cli` gira solo nel workflow Lighthouse giornaliero e, a mano, sul
  computer di chi sviluppa, sempre contro le pagine del sito: nessun input
  arriva da terzi;
- `extract-zip`, `tmp`: estrazione di archivi e nomi di file temporanei
  scelti da chi li chiama; qui nessun archivio o nome viene dall'esterno;
- `proxy-agent`, `pac-proxy-agent`, `get-uri`, `basic-ftp`: proxy PAC e URL
  FTP, che non configuriamo;
- `zod`, `chromium-bidi`, `puppeteer-core`: dati che arrivano dal browser
  avviato dallo strumento stesso, sulle nostre pagine;
- `inquirer`, `external-editor`: solo nella procedura guidata interattiva
  (`lhci wizard`), che non usiamo;
- `minimatch`, `glob`, `rimraf`, `chrome-launcher`: confrontano nomi di file
  con pattern scritti da noi (configurazione di ESLint, cartelle temporanee di
  Chrome); nessun pattern arriva da fuori;
- `uuid`: il difetto riguarda le versioni v3, v5 e v6 con buffer passati da
  chi chiama, non l'uso interno dello strumento.

Quando rivederla: appena esce una versione di `@lhci/cli` con `lighthouse` 13
(Dependabot la propone nel gruppo `sviluppo`), appena `eslint` passa a
`minimatch` 11, oppure se `@lhci/cli` o `eslint` dovessero leggere URL, file o
pattern forniti da terzi.

Le scelte di progetto sono descritte in [Sicurezza, privacy e minori](../docs/wiki/Sicurezza-Privacy-e-Minori.md).
