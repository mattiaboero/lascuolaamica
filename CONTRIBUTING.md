# Contribuire a La Scuola Amica

Grazie per l'interesse. Le contribuzioni più frequenti e utili sono nuove domande — se sei un insegnante o hai competenze disciplinari sulla primaria, è lì che puoi fare la differenza più concreta.

---

## Tipi di contributo

### Nuove domande (contributo più utile)

Il dataset conta oggi 7.375 domande su 8 materie. Le aree meno coperte sono inglese, civica e problemi di matematica.

**Se hai accesso all'ambiente editoriale riservato:**

1. Apri l’ambiente editoriale riservato condiviso dal team
2. Seleziona materia e classe
3. Inserisci domanda, risposta corretta e 3 distrattori
4. Clicca `Genera e scarica JSON`
5. Invia il file JSON via email o come allegato alla PR

Quando modifichi i file in `json/`, ricorda che `_headers` impone
Cache-Control no-aggressive per garantire upgrade puliti. Non modificare
quella riga. Vedi `docs/wiki/Architettura.md` -> "Header HTTP critici".

**Se non hai accesso all'ambiente editoriale:**

Apri una issue con la proposta di domande in formato libero — valutiamo noi la conversione.

Le istruzioni di accesso operativo all’editor non sono riportate nella documentazione pubblica.

### Bug report

Apri una issue descrivendo:

- cosa è successo
- su quale materia/classe
- browser e sistema operativo
- se possibile, screenshot o messaggio di errore dalla console

### Contributi tecnici (codice)

Utili per bug fix, miglioramenti di accessibilità e performance. Non è il canale prioritario per aggiungere contenuti.

---

## Regole editoriali per le domande

- Linguaggio semplice, inclusivo, adatto all'età.
- Una sola risposta corretta, univoca — se ci sono casi limite, riformula.
- Distrattori plausibili ma chiaramente sbagliati. Evita trappole troppo sottili.
- Coerenza con le Indicazioni Nazionali per il curricolo della scuola primaria.
- Attenzione a: accenti (`è`, `perché`, `qual è`, `cos'è`), apostrofi (`l'`, `dell'`), niente refusi.
- Niente stereotipi di genere o linguaggio escludente.

---

## Flusso per contributi tecnici

1. Crea un branch da `main`.
2. Modifica mirata — non unire più fix non correlati nella stessa PR.
3. Esegui `./prepublish-check.sh` senza errori.
4. Verifica manualmente almeno:
   - una pagina materia (quiz completo)
   - pagina FAQ
   - pagina supporto
   - comportamento offline di base dopo primo caricamento
5. Apri PR con descrizione chiara: cosa cambia e perché.

### Cose da non fare

- Non introdurre tracker, analytics o raccolta dati personali — è un vincolo non negoziabile.
- Non rompere accessibilità, SEO o performance esistenti senza una ragione solida.
- Non aggiungere dipendenze NPM a runtime: il sito usa JavaScript vanilla per scelta.

---

## Checklist PR

- [ ] Nessun errore console nelle pagine toccate
- [ ] `./prepublish-check.sh` passa senza errori
- [ ] Versione aggiornata se necessario (`app-version.js`)
- [ ] Log "Ultimi aggiornamenti" aggiornato in `shared.js`
- [ ] Cartella `export/` sincronizzata

---

## Domande?

Apri una issue o scrivi a `supporto@lascuolaamica.it`.
