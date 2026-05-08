# Note pubbliche su hosting e sicurezza

Questo documento pubblico mantiene solo una sintesi ad alto livello.

La configurazione operativa dettagliata dell’infrastruttura, delle regole di protezione e dei controlli di pubblicazione viene gestita separatamente dal team e non è documentata nella repository pubblica.

## Principi mantenuti in produzione

- traffico servito solo tramite HTTPS;
- protezione dei contenuti pubblici con policy di sicurezza restrittive;
- separazione tra contenuti editoriali pubblici e aree tecniche;
- controlli anti-abuso e anti-automazione calibrati per non compromettere SEO, AEO e accessibilità;
- verifiche post-release su pagine pubbliche, asset principali e uso offline.

## Per chi contribuisce al progetto

Se devi lavorare su contenuti o codice applicativo, fai riferimento a:

- [README.md](README.md)
- [docs/wiki/Home.md](docs/wiki/Home.md)
- [docs/wiki/Installazione-e-Deploy.md](docs/wiki/Installazione-e-Deploy.md)
- [docs/wiki/Runbook-Release.md](docs/wiki/Runbook-Release.md)

Le configurazioni infrastrutturali più sensibili non fanno parte del materiale pubblico della repo.
