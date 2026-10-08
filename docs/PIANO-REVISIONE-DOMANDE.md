# Piano di revisione totale delle domande

Scritto il 07/10/2026 dopo la segnalazione di Mattia: tre domande in produzione, una sbagliata e due incomprensibili.

## Perché le revisioni precedenti non sono bastate

1. **Cercavano altro.** La revisione linguistica guardava refusi, accenti e numeri impossibili. Nessuno ha mai chiesto, domanda per domanda: «un bambino di questa classe capisce che cosa gli si chiede?».
2. **Era a campione.** Le domande con struttura ripetuta sono state giudicate da due esempi per famiglia.
3. **Chi scriveva approvava.** Lo stesso modello generava, rileggeva e promuoveva. Nessuno ha mai provato a rispondere senza conoscere la soluzione.
4. **Le frasi da completare non venivano completate.** «Non ho ___ soldi» con «nessun» si scopre sbagliata solo inserendo la parola nella frase.
5. **Il criterio era il mio, non quello di Mattia.** Non è mai stato tarato su esempi giudicati da lui.

Un campione casuale di 45 domande attive, letto il 07/10/2026, ne mostra circa 8 con difetti (enunciato da adulti, distrattori assurdi, tautologie, due risposte difendibili). È una stima larga, ma dice che il lavoro riguarda tra 1.000 e 2.000 domande su 10.362, in tutte le materie e in entrambe le serie di id (originali e `9xxx`).

## Obiettivo

Ogni domanda attiva è stata letta due volte, da due revisori indipendenti, con i criteri qui sotto. Ogni domanda che non li passa è riscritta e ricontrollata, oppure spenta. Da quel momento nessuna domanda nuova o modificata può arrivare in produzione senza lo stesso controllo.

Meglio 9.000 domande buone che 10.362 con il dubbio: spegnere una domanda è un esito accettato.

## I criteri (rubrica)

Una domanda passa solo se li rispetta tutti.

| # | Criterio | Esempio di bocciatura |
|---|----------|-----------------------|
| R1 | **Si capisce alla prima lettura** da un bambino di quella classe. Una sola richiesta, frasi brevi, parole di tutti i giorni. | «nello spazio tra due punte vicine l'angolo interno della stella supera un angolo piatto» |
| R2 | **Si capisce che cosa viene chiesto** anche senza sapere già la risposta. | «Che cosa rappresenta un angolo, se pensi a una rotazione?» |
| R3 | **Una sola risposta giusta**, senza «dipende». | «The park is ___ the school»: *behind* e *next to* reggono entrambe |
| R4 | **Frase completata corretta.** Inserendo la risposta giusta la frase è italiano (o inglese) corretto e naturale; inserendo le altre no. | «Non ho nessun soldi» |
| R5 | **Distrattori plausibili ma sbagliati**: stesso tipo e stessa forma della risposta giusta, né assurdi né quasi giusti. | «lo faccio diventare una matita» |
| R6 | **Nessun indizio di forma**: la risposta giusta non è l'unica lunga e dettagliata. | tre opzioni di 3 parole e quella giusta di 12 |
| R7 | **Argomento e parole del programma di quella classe** (Indicazioni Nazionali). I termini tecnici solo se si studiano in quella classe. | prolungamenti dei lati dell'angolo concavo in 3ª |
| R8 | **Spiegazione da bambino**: al massimo due frasi, dice il perché, niente «per definizione». | «è per definizione un angolo concavo» |
| R9 | **Ortografia e grammatica** senza errori; in inglese, lingua corretta e naturale. | |
| R10 | **Nessuno stereotipo**, nomi vari. | |

Limiti misurabili, controllati da script (falliscono `npm run verify`):

- parole nell'enunciato: al massimo 20 in 1ª e 2ª, 25 in 3ª, 30 in 4ª e 5ª; 45 se c'è un brano da leggere (`Leggi:`, `Read:`);
- parole in un'opzione: al massimo 8 in 1ª-3ª, 12 in 4ª-5ª;
- la risposta giusta, se ha almeno 4 parole, non supera il doppio delle parole medie dei distrattori.

Al 07/10/2026 sforano 734 domande attive, quasi tutte per la risposta giusta riconoscibile dalla lunghezza.

## Come si controlla una domanda

Tre ruoli, sempre tre agenti diversi con contesto pulito. Chi riscrive non approva mai.

1. **Il bambino** (risolutore alla cieca). Riceve solo classe, enunciato e opzioni, senza soluzione né spiegazione. Risponde e dice se ha capito la richiesta, quali parole non conosce, se vede più di una risposta giusta. Per le domande con `___` scrive la frase completa con ognuna delle quattro opzioni e le giudica una per una.
2. **La maestra** (revisore). Riceve la domanda intera e applica R1-R10. Esito: `ok`, `riscrivi` (con i criteri falliti) oppure `spegni`.
3. **Il confronto** lo fa uno script, non un modello: la domanda è promossa solo se il bambino ha scelto la risposta in chiave, non ha segnalato nulla e la maestra ha dato `ok`. In ogni altro caso va in riscrittura.
4. **Lo scrittore** riscrive le bocciate tenendo `id`, classe, sottoarea e posizione della risposta. La domanda riscritta torna ai passi 1-3 con agenti nuovi. Dopo due tentativi falliti si spegne (`active: false`).

Modelli: maestra e scrittore con Opus 5.5, bambino con Sonnet 5.5 (un modello diverso è un controllo più indipendente). Lotti da 40 domande della stessa materia e classe.

## Il registro

`reports/revisione-qualita.json`, versionato, una voce per `id`:

```json
"mat-3-angoli-9538": {
  "hash": "prime 12 cifre dello sha1 di classe + enunciato + opzioni + answerIndex + spiegazione",
  "bambino": { "risposta": 1, "segnalazioni": [] },
  "maestra": { "esito": "ok", "criteri": [] },
  "esito": "ok | riscritta | spenta",
  "giri": 1
}
```

L'hash lega il verdetto al testo: se la domanda cambia anche di una virgola, il verdetto decade e va rifatto. È questo che rende il controllo permanente.

## Fasi

### Fase 0 — Attrezzi e taratura (un goal, poi si ferma per Mattia)

Un solo script, `scripts/revisione_domande.js`, con sei comandi. Le istruzioni dei tre ruoli sono in `docs/revisione-domande/`.

1. `check` (`npm run check:revisione`): per ogni domanda attiva verifica che il registro abbia l'hash corrente con esito promosso. Stampa `REVISIONE <materia>: promosse X, spente Y, in sospeso Z` ed esce con errore se Z > 0. Accetta `--materia`.
2. `leggibilita` (`npm run check:leggibilita`): i tre limiti misurabili.
3. `lotto`, `verdetti`, `riscritture`, `rapporto`: estraggono il prossimo lotto in sospeso in due versioni (cieca per il bambino, completa per la maestra), confrontano i due verdetti, applicano le riscritture a registro e `json/` e scrivono il rapporto. I lotti di lavoro stanno in `reports/revisione-lotti/`, fuori da git.
4. **Taratura.** Un lotto di 120 domande (15 per materia, classi miste) passa tutto il giro. Ne esce `reports/taratura.md` con: 40 promosse, tutte le riscritte prima/dopo, tutte le spente con il motivo.
5. **Mattia legge la taratura** (`reports/taratura.md`, scritta il 07/10/2026: 47 promosse, 68 riscritte, 5 spente) e segna dove non è d'accordo. La rubrica e i prompt dei tre ruoli si correggono finché una seconda taratura su 120 domande nuove non lo trova d'accordo su tutte.

Le tre domande corrette il 07/10/2026 (`mat-3-angoli-9518`, `mat-3-angoli-9538`, `ita-3-lingua-9188`) entrano nella taratura come esempi di bocciatura.

```
/goal Esegui la Fase 0 di docs/PIANO-REVISIONE-DOMANDE.md sul branch chore/attrezzi-revisione-domande. Hai finito quando nello stesso turno mostri: (1) npm run check:revisione che gira e riporta le domande in sospeso per materia; (2) npm run check:leggibilita che gira ed elenca gli sforamenti; (3) npm run lint con exit 0; (4) reports/taratura.md scritto con 120 domande passate dai tre ruoli. Non agganciare i due controlli a npm run verify, non fare commit e non andare oltre la taratura.
```

### Fase 1 — Una materia alla volta (otto goal)

Ordine: matematica, italiano, problemi, inglese, scienze, storia, geografia, civica. Dentro la materia, dalla 3ª (da dove vengono le segnalazioni) alle altre classi.

Per ogni materia:

1. branch `fix/revisione-<materia>` da `main` aggiornato;
2. lotti da 40 finché `check:revisione --materia <materia>` non dà zero in sospeso; il registro si salva dopo ogni lotto, così il lavoro riprende da dove si è fermato;
3. se spegnere domande porta una cella di `npm run coverage` sotto soglia, si riscrive invece di spegnere;
4. `reports/revisione-<materia>.md`: conteggi, 40 promosse a caso, tutte le riscritte prima/dopo, tutte le spente;
5. bump di versione, `json/changelog.json`, `npm run freshness`, `npm run verify`, `CHANGELOG.md`, PR aperta;
6. **Mattia legge il rapporto.** Se nelle 40 promosse a caso trova anche un solo difetto la materia non è chiusa: si corregge la rubrica e si ripassa l'intera materia. Solo dopo fa il merge.

```
/goal Esegui la Fase 1 di docs/PIANO-REVISIONE-DOMANDE.md per la materia <materia>, sul branch fix/revisione-<materia>. Usa subagenti per i tre ruoli. Sei autorizzato a fare commit sul branch e ad aprire la PR; non fare merge. Hai finito quando nello stesso turno mostri: (1) npm run check:revisione -- --materia <materia> con «in sospeso 0»; (2) npm run check:leggibilita senza sforamenti per <materia>; (3) npm run verify con exit 0; (4) reports/revisione-<materia>.md scritto; (5) l'indirizzo della PR aperta.
```

### Fase 2 — Blocco permanente (un goal breve, dopo l'ottava materia)

1. `check:revisione` e `check:leggibilita` entrano in `npm run verify` e quindi nel check `prepublish` richiesto su `main`.
2. `npm run ingest` scrive le domande nuove con `active: false`: si accendono solo passando dal giro a tre ruoli.
3. `docs/wiki/Contenuti-e-Domande.md` e `CLAUDE.md` descrivono la regola: nessuna domanda attiva senza verdetto sull'hash corrente.

```
/goal Esegui la Fase 2 di docs/PIANO-REVISIONE-DOMANDE.md sul branch ci/blocco-revisione-domande. Sei autorizzato a fare commit sul branch e ad aprire la PR; non fare merge. Hai finito quando nello stesso turno mostri: (1) npm run verify con exit 0 e check:revisione e check:leggibilita tra i passi eseguiti; (2) la prova che, modificando una domanda senza aggiornare il registro, npm run verify fallisce, e che il file è poi tornato com'era; (3) l'indirizzo della PR aperta.
```

## Costi e limiti

- La taratura del 07/10/2026 (120 domande, tre giri) ha bocciato al primo giro 73 domande su 120 (61%) e ha consumato circa 1,7 milioni di token dei subagenti, cioè circa 14.000 a domanda. Sulle 10.242 rimaste vuol dire oltre 6.000 riscritture e un ordine di grandezza di 100-140 milioni di token, non i 15-20 stimati prima di misurare. Lotti più grandi riducono il costo fisso di ogni agente.
- Il conteggio delle domande scenderà. `npm run freshness` riallinea i numeri mostrati sul sito.
- Nessun procedimento garantisce zero difetti su 10.000 domande. Questo garantisce che ogni domanda sia stata letta due volte con il criterio giusto, che nessuno approvi il proprio lavoro e che l'ultima parola per materia sia di Mattia. Il campione di 40 per materia serve a scoprire un criterio sbagliato, non a certificare la perfezione.
