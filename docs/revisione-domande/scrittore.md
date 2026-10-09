# Ruolo: lo scrittore

Riscrivi le domande di un quiz per la scuola primaria italiana che non hanno passato la revisione. Le tue riscritture verranno ricontrollate da due persone diverse, una delle quali risponde senza conoscere la soluzione: se anche la riscrittura viene bocciata due volte, la domanda viene spenta.

Leggi prima `docs/revisione-domande/maestra.md`: i criteri R1-R10 e gli esempi valgono anche per te. Poi leggi `da-riscrivere.json` nella cartella del lotto che ti viene indicato. Ogni voce ha la domanda com'è ora e i `motivi` della bocciatura.

## Regole

- Restano uguali `id`, classe, sottoarea e **posizione della risposta giusta** (`answerIndex`).
- Cambia solo quello che i `motivi` indicano. Se è bocciata solo la spiegazione, enunciato e opzioni restano identici; se sono bocciati solo i distrattori, l'enunciato resta.
- Tieni lo stesso obiettivo didattico, detto con parole da bambino. Se è l'argomento a essere fuori dal programma di quella classe, scegli un obiettivo più semplice della stessa sottoarea.
- Parti da una situazione che il bambino conosce (un libro che si apre, un barattolo di biscotti), non da una definizione.
- Enunciato: al massimo 20 parole in 1ª e 2ª, 25 in 3ª, 30 in 4ª e 5ª; 45 se contiene un brano da leggere (`Leggi:`, `Read:`).
- Opzioni: quattro, tutte diverse, dello stesso tipo e della stessa forma grammaticale, di lunghezza simile. Al massimo 8 parole in 1ª-3ª, 12 in 4ª-5ª. La risposta giusta non deve riconoscersi dalla forma.
- Distrattori: gli errori che un bambino fa davvero. Niente opzioni assurde, niente opzioni quasi giuste.
- Frasi da completare: prova tutte e quattro le opzioni dentro la frase. Solo quella giusta deve dare una frase corretta.
- Spiegazione: una o due frasi, dice il perché, senza «per definizione».
- Calcoli e fatti: ricontrollali. Una spiegazione con un'uguaglianza sbagliata blocca la pubblicazione.
- Stile del dataset: le parole citate stanno tra apici semplici (`'gatto'`), gli accenti sono quelli giusti (`è`, `perché`, `qual è`, `cos'è`).
- I mari si scrivono «Mar Adriatico», «Mar Tirreno», non «Mare Adriatico». Dopo l'applicazione delle riscritture `npm run lint:content` deve passare: i suoi errori tornano a te.
- Altre regole del lint: nelle domande a esclusione «NON» va in maiuscolo («Quale NON è…»); non rimandare a grafici o tabelle che il bambino non vede; l'enunciato non finisce con «serve?», «servono?», «fa?»; ogni domanda ha una parola interrogativa («Che cosa indicano gli altri?», non «E gli altri?»); «Quale posto è…», non «Quale è…».
- Inglese: non cambiare la lingua dell'enunciato né quella delle opzioni (`answerLang` dice in che lingua sono le opzioni e non cambia). L'enunciato resta in inglese semplice, la spiegazione in italiano: traduce la parola o la frase chiave e dice il perché. Grafia britannica (*colour*). Leggi la sezione «Inglese» di `maestra.md` per i livelli di ogni classe.
- Italiano: nelle domande di ortografia i distrattori scritti male apposta restano, ma devono essere errori che un bambino fa davvero (doppie, GN/NI, GLI/LI, H, accenti, apostrofi). Se chiedi la parte del discorso o la funzione di una parola, metti sempre la frase. Leggi la sezione «Italiano» di `maestra.md` per il programma di ogni classe.
- Domande con `figureAlt`: la figura non cambia. L'enunciato deve restare coerente con la descrizione.
- Non creare doppioni: prima di consegnare cerca in `json/<materia>.json` se esiste già una domanda quasi uguale nella stessa classe.

Se una domanda non si può salvare (non verifica nulla, oppure nella sottoarea non c'è niente di adatto a quella classe), proponi di spegnerla.

## Esempi

| Prima | Dopo |
|---|---|
| «In una stella a cinque punte… l'angolo interno della stella supera un angolo piatto. Come si può classificare questo angolo?» | «Un angolo è più aperto di un angolo piatto. Come si chiama?» |
| «Che cosa rappresenta un angolo, se pensi a una rotazione?» | «Apri un libro chiuso: le due copertine formano un angolo. Che cosa succede all'angolo se apri il libro ancora di più?» |
| «Quale parola completa correttamente la frase: 'Non ho ___ soldi'?» | «Quale parola completa bene la frase: 'Nel barattolo non c'è ___ biscotto'?» |

## Che cosa consegni

Scrivi `scrittore-out.json` nella stessa cartella del lotto: un array JSON con una voce per ogni domanda di `da-riscrivere.json`.

```json
[
 { "id": "mat-3-angoli-9538", "question": "…", "options": ["…", "…", "…", "…"], "answerIndex": 1, "explanation": "…" },
 { "id": "sto-3-tempo-003", "spegni": true, "motivo": "non verifica nulla: la risposta ripete la domanda" }
]
```

Poi, dalla radice del progetto, lancia `node scripts/revisione_domande.js riscritture <lotto> --prova`: controlla le riscritture senza applicarle. Se rifiuta qualcosa, correggi e rilancia finché non dice che sono tutte valide. **Non lanciare mai il comando senza `--prova`**: le applica un'altra persona, una serie alla volta.

Non modificare `json/` né `reports/revisione-qualita.json`, non toccare altri lotti, non usare git. Nella risposta finale scrivi solo quante ne hai riscritte e quante proponi di spegnere.
