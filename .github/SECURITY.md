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
2026 (versione 4.27.15) e dopo il passaggio a `@lhci/cli` 0.16.0.

Il sito non ha dipendenze di produzione: nel browser arrivano solo HTML, CSS e
JavaScript del repository. Il job `prepublish` lancia `npm audit --omit=dev
--audit-level=high` a ogni PR e a ogni push su `main`, quindi una dipendenza di
produzione vulnerabile, se un giorno entrasse, blocca il merge.

`npm audit` sulle devDependencies segnala 12 avvisi: 9 alti, 3 moderati,
nessuno critico. Nove vengono da `@lhci/cli` 0.16.0, l'ultima versione, che
usa `lighthouse` 13.6.0. La radice è `basic-ftp` 5.3.1 (lentezza con risposte
FTP costruite apposta), che risale la catena `get-uri`, `pac-proxy-agent`,
`proxy-agent`, `@puppeteer/browsers`, `puppeteer-core`, `lighthouse`,
`@lhci/utils` e `@lhci/cli`. L'unica correzione proposta da npm è tornare a
`@lhci/cli` 0.13.0 (`--force`), che riporterebbe `lighthouse` 11: non è una
correzione.

Gli altri tre vengono da `eslint` 10.14.0, l'ultima versione, che usa
`minimatch` 10.2: `eslint`, `@eslint/config-array` e `minimatch`. Il difetto di `minimatch`,
corretto dalla 11.0.1, è una lentezza con pattern costruiti apposta. La
correzione proposta da npm, tornare a `eslint` 9, non è una correzione.
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
- `proxy-agent`, `pac-proxy-agent`, `get-uri`, `basic-ftp`: proxy PAC e URL
  FTP, che non configuriamo;
- `puppeteer-core`, `@puppeteer/browsers`: dati che arrivano dal browser
  avviato dallo strumento stesso, sulle nostre pagine;
- `minimatch`: confronta nomi di file con pattern scritti da noi
  (configurazione di ESLint); nessun pattern arriva da fuori.

Quando rivederla: appena esce una versione di `@lhci/cli` o di `lighthouse`
che porta una versione di `basic-ftp` senza questo avviso (Dependabot la
propone nel gruppo `sviluppo`), appena `eslint` passa a `minimatch` 11, oppure se `@lhci/cli` o `eslint` dovessero leggere URL, file o
pattern forniti da terzi.

Le scelte di progetto sono descritte in [Sicurezza, privacy e minori](../docs/wiki/Sicurezza-Privacy-e-Minori.md).
