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

Le scelte di progetto sono descritte in [Sicurezza, privacy e minori](../docs/wiki/Sicurezza-Privacy-e-Minori.md).
