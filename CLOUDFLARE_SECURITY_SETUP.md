# Note pubbliche su hosting e sicurezza

Questo documento pubblico mantiene solo una sintesi ad alto livello.

La configurazione operativa dettagliata dell’infrastruttura, delle regole di protezione e dei controlli di pubblicazione viene gestita separatamente dal team e non è documentata nella repository pubblica.

## Principi mantenuti in produzione

- traffico servito solo tramite HTTPS;
- protezione dei contenuti pubblici con policy di sicurezza restrittive;
- separazione tra contenuti editoriali pubblici e aree tecniche;
- controlli anti-abuso e anti-automazione calibrati per non compromettere SEO, AEO e accessibilità;
- verifiche post-release su pagine pubbliche, asset principali e uso offline.

## Passi manuali

Fatti dal responsabile del progetto, fuori dalla repository e fuori dalle
automazioni. Qui c'è solo cosa è stato fatto, senza valori segreti.

- [x] **DMARC** (24 ottobre 2026). Verificata la firma DKIM di Aruba, il
  provider di posta; il record `_dmarc` è passato da `p=none` a
  `p=quarantine`. I report aggregati arrivano a supporto@lascuolaamica.it
  (verificato nel DNS pubblico il 24 ottobre 2026).
- [x] **CAA** (24 ottobre 2026). Record CAA per `letsencrypt.org` e `pki.goog`,
  più quelli aggiunti da Cloudflare per le autorità che usa: nessun'altra
  autorità può emettere certificati per il dominio.
- [x] **WIKI_SYNC_TOKEN** (24 ottobre 2026). Token fine-grained limitato a
  questo repository, permesso Contents in lettura e scrittura, scadenza 24
  ottobre 2027. Provato al merge della PR #134: il workflow Sync Wiki ha
  clonato e aggiornato il wiki; lanciato anche a mano, riuscito. Va rinnovato
  prima della scadenza.
- [x] **Satispay** (24 ottobre 2026). QR tolto dal sito. Era il profilo
  personale, non un conto per le donazioni: nessuna donazione ricevuta e
  niente da disattivare nell'app.

## Per chi contribuisce al progetto

Se devi lavorare su contenuti o codice applicativo, fai riferimento a:

- [README.md](README.md)
- [docs/wiki/Home.md](docs/wiki/Home.md)
- [docs/wiki/Installazione-e-Deploy.md](docs/wiki/Installazione-e-Deploy.md)
- [docs/wiki/Runbook-Release.md](docs/wiki/Runbook-Release.md)

Le configurazioni infrastrutturali più sensibili non fanno parte del materiale pubblico della repo.
