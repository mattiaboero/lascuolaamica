# Prompt di generazione — matematica per argomento

Documento di lavoro per le fasi che riempiono gli argomenti di `scripts/data/mappa-argomenti-matematica.json`. Pilota: F1, `c4-frazioni-equivalenti` (20 domande, `mat-4-frazioni-9512`…`9531`). Uno shard = un argomento.

## 1. Prompt da incollare

Sostituire i segnaposto `<...>` con i campi dell'argomento nella mappa.

```
Sei un insegnante di matematica della scuola primaria italiana. Scrivi <N> domande a scelta multipla
sull'argomento "<title>" (id <id>) per la classe <class>, bambini di <età> anni.
Area "<area>", subarea "<subarea>".

Regole sul testo
- Domanda breve, una sola lettura, una sola risposta giusta. Niente trabocchetti.
- Notazione italiana: frazioni "3/4", moltiplicazione "×" (mai la x), divisione "÷" nelle spiegazioni,
  decimali con la virgola "3,5", migliaia col punto "1.200".
- Domanda vera chiusa da "?"; frase sospesa chiusa da "..." (tre punti, non il carattere …).
  Spazio da riempire: "___" (tre underscore). Negazione: "NON" in maiuscolo.
- Niente rimandi a figure, tabelle o disegni: il disegno si descrive a parole
  ("una torta divisa in 8 fette uguali, ne mangi 4").
- Nomi propri vari; contesti concreti (cibo, gioco, scuola, sport).
- Il testo deve far scattare la regex "match" dell'argomento (per le frazioni equivalenti:
  la domanda contiene "frazione/frazioni ... equivalente/i"), tranne dove renderebbe la domanda innaturale.

Opzioni
- Esattamente 4, tutte diverse anche per valore (lint: "1/4" e "2/8" insieme sono un errore,
  anche se sono entrambe distrattori; "3,5" e "3,50" idem).
- Ogni distrattore nasce da un errore tipico e nominabile. Per le frazioni equivalenti:
  sommare lo stesso numero sopra e sotto (1/2 → 2/3), moltiplicare solo un termine (1/2 → 1/4),
  invertire (2/1), semplificare dividendo per numeri diversi (12/18 → 4/9), fermarsi a metà
  della semplificazione (mai come distrattore se è ancora equivalente!), usare il fattore
  come risultato (2/3 = ___/12 → 4).
- Nelle domande "Quale numero completa ...", nessun distrattore può essere un numero già
  scritto nella consegna (lint).
- La risposta giusta NON deve essere sempre la più grande né sempre nella stessa posizione:
  distribuire "answer" su tutte e 4 le posizioni in modo uniforme (5/5/5/5 su 20).
- "NON è equivalente" con 4 frazioni semplici è impossibile (tre avrebbero lo stesso valore):
  usare coppie ("2/3 e 3/4") o gruppi ("2/6, 3/9, 4/12").

Difficoltà (solo 1, 2, 3: il dataset e il linter non accettano altro)
- 1 = un passo con fattore 2 o 3, numeri entro 12. Es.: "Quale frazione è equivalente a 1/2?"
- 2 = un passo con fattore fino a 5, numeri fino a 20, oppure riconoscere l'errore di un
  ragionamento. Es.: "2/3 = ___/12", "10/15 ai minimi termini".
- 3 = due passi (semplificare e poi amplificare), MCD non ovvio, problema in contesto.
  Es.: "8/12 = ___/9", "Riduci 12/18 ai minimi termini".
- Su 20 domande: circa 7/7/6.

Spiegazione
- 1-3 frasi, seconda persona, tono incoraggiante; mai "sbagliato", mai "La risposta corretta è X." da sola.
- Mostra il passaggio con i numeri: "Il denominatore passa da 3 a 12, cioè 3 × 4 = 12:
  moltiplichi per 4 anche il numeratore, 2 × 4 = 8. Quindi 2/3 = 8/12."
- Se la risposta è un numero, quel numero deve comparire nella spiegazione.
- Ogni "a × b = c" e "a ÷ b = c" deve essere giusto (lo verifica check_math_explanations.js).
- Mai "× 1 =" accanto a una frazione unitaria; niente "Prima: ... Poi: ..." con i due punti.
- Finisce con il punto.

Varietà: almeno 6 forme diverse su 20, per esempio
  quale è equivalente · quale numero completa (numeratore e denominatore mancante) ·
  quale coppia è / NON è equivalente · riduci ai minimi termini · disegno descritto a parole ·
  problema breve · regola ("che cosa puoi fare?") · errore di un compagno ("Ha ragione?") ·
  gruppo di frazioni tutte equivalenti.

Output: JSONL, un oggetto per riga, in reports/generated/matematica-c<class>-<slug>.jsonl
{"class":4,"area":"aritmetica","subarea":"frazioni","difficulty":1,"question":"...",
 "options":["...","...","...","..."],"answer":"<testo identico a un'opzione>",
 "explanation":"...","language":"it"}
```

## 2. Campi

Nello shard vanno solo `class`, `area`, `subarea`, `difficulty`, `question`, `options`, `answer`, `explanation`, `language`. Il resto lo mette `ingest_generated.py`: `id` (`mat-<classe>-<subarea>-<n>`, dove n continua il massimo fra tutti gli id `mat-<classe>-*`), `answerIndex` (posizione di `answer` in `options`, quindi l'ordine delle opzioni nello shard è quello servito), `subject`, `sourceSubject`, `tag`/`tags`, `program` (`matematica_primaria_classe_<n>`), `active`, `bonus`, `teacherNote`.

## 3. Checklist prima dell'ingest

1. Ogni risposta verificata con uno script usa e getta (per le frazioni: `fractions.Fraction`): esattamente un'opzione giusta, distrattori davvero sbagliati, nessun valore ripetuto, calcoli della spiegazione giusti. Il generatore del pilota faceva questi controlli e rifiutava di scrivere lo shard se uno falliva.
2. Distribuzione `difficulty` e posizione della risposta come sopra.
3. Stem unici, e diversi dagli stem già nel dataset (l'ingest salta un testo identico, ma non vede le varianti).
4. Prova generale su una copia: `json/` e `scripts/` in una cartella temporanea, shard in `reports/generated/`, ingest e tutti i controlli lì. Si corregge lo shard finché la copia è verde, e solo dopo si tocca il repo.

## 4. Sequenza dei comandi (repo)

```bash
git switch -c feat/<fase>-<slug>
python3 scripts/ingest_generated.py --subject matematica --dry-run
python3 scripts/ingest_generated.py --subject matematica     # UNA volta; sposta lo shard in reports/generated/ingested/
python3 scripts/sync_question_counts.py                      # obbligatorio dopo l'ingest, vedi sotto
node scripts/audit_questions_json.js
node scripts/lint_content.js
node scripts/check_math_explanations.js
node scripts/check_plausibility.js
node scripts/check_answer_balance.js
node scripts/check_grammar_rules.js
python3 scripts/sync_question_counts.py --check
python3 scripts/dedup_questions.py                           # sola lettura; matematica deve restare assente
node scripts/coverage_report.js                              # riscrive reports/coverage.md
git diff --stat                                              # json/matematica.json ≈ 31 righe per domanda
```

Nel commit vanno `json/matematica.json`, `json/index.json`, lo shard in `reports/generated/ingested/`, `reports/coverage.md` e i file toccati da `sync_question_counts.py` (README, CONTRIBUTING, llms.txt, wiki, pagine html). Versione e CHANGELOG no: si toccano solo al rilascio.

## 5. Cose imparate nel pilota

- **Non lanciare `derive_math_difficulty.py`.** È uno script da usare una volta sola: ricalcola in terzili *tutte* le domande di ogni classe. Con 20 domande nuove in c4 avrebbe cambiato la difficoltà di 208 domande che non c'entrano (e di 10 delle 20 nuove), e scrive il JSON con l'a capo finale. La difficoltà si decide nello shard.
- **Difficoltà 4 e 5 non esistono.** L'ingest le converte in silenzio (1 per c2-c3, 2 per c4-c5) e l'audit rifiuta tutto ciò che non è 1-3.
- **Dopo l'ingest `json/index.json` è sbagliato.** `update_index()` scrive in `totalQuestions` tutte le righe, comprese le 656 disattivate (9.899 invece di 9.243). Lo corregge `sync_question_counts.py`, che va quindi sempre lanciato dopo.
- **L'archivio è `reports/generated/ingested/`.** Lo sposta l'ingest da solo (dalla 4.12.45). La vecchia `_archive_ingested/` contiene i lotti precedenti. Rilanciare l'ingest con lo stesso shard aggiunge 0 righe ("20 duplicati gia presenti"): verificato sulla copia.
- **`--all` non vede gli shard per argomento**, perché cerca `<materia>-c2.jsonl`. Usare sempre `--subject matematica`.
- **Le regex della mappa si sovrappongono.** `c4-frazioni-concetto` usa `frazion` e conta anche le domande sulle equivalenti (è passata da 2 a 21, "coperto", senza nessuna domanda sul concetto). Leggere la copertura di un argomento generico sottraendo quelli specifici. La regex di `c4-frazioni-equivalenti` riconosce 19 domande su 20: il problema di Giulia e Sara non nomina le frazioni equivalenti, e non conviene farlo perché svelerebbe la risposta.
- **Conflitti fra il lint e le abitudini didattiche:** la divisione nelle spiegazioni si scrive "÷", non ":" (la forma "12: 4 =" fa fallire il lint); due distrattori con lo stesso valore fanno fallire il lint anche se sono entrambi sbagliati.
- **Tag e program dell'ingest sono diversi da quelli delle domande storiche** (`tags` con la subarea invece dell'area, `program` con `primaria_`). L'app non li legge: si lasciano come sono.
- **`subject_quiz_test_harness.js` ha bisogno di un server su 127.0.0.1:4173**: senza server fallisce, e non dipende dai contenuti.
- **Dopo l'ingest le domande nuove entrano nel prossimo lotto** di `sample_review_batch.py` (hanno uno scheletro unico). `--registra` resta una decisione di chi fa la revisione.

## 6. Cose imparate in F2 (20 argomenti, 232 domande)

- **Subarea nuove (`numeri`, `multipli_divisori`, `equivalenze`, `angoli`, ...) sono sicure.** `subarea` è testo libero: `audit_questions_json.js` chiede solo che non sia vuoto, `subject-quiz-core.js` costruisce i pulsanti-filtro da qualunque valore distinto trovi nei dati, `coverage_report.js` raggruppa per stringa. Il flag `newSubarea` nella mappa è solo documentazione, nessuno script lo legge. Usare le subarea già scritte nella mappa, non forzarle su `operazioni`/`misure`/`figure`.
- **La normalizzazione del testo di `audit_questions_json.js` toglie anche la virgola decimale**, non solo la punteggiatura: "23 ÷ 10" e "2,3 × 10" diventano entrambi "quanto fa 23 10" e con risposta/opzioni ugualmente equivalenti dopo la normalizzazione scattano come `redundant_duplicate`. Capita quando due argomenti diversi (moltiplicazione e divisione per 10/100/1000) usano apposta gli stessi numeri per mostrare l'operazione inversa: basta cambiare le cifre in uno dei due.
- **Le spiegazioni con resto ("7 ÷ 2 = 3 col resto di 1")** fanno fallire `check_math_explanations.js`, perché lo script legge solo "a ÷ b = c" e non capisce "col resto di". Lo skip previsto dallo script richiede la forma "(con resto di N)" fra parentesi, non "col resto di N" a testo libero.
- **`"Dov'è il suo errore?"` non supera `lint_content.js`**: la regex delle frasi sospese cerca la parola intera `dove`, e l'elisione "Dov'è" non la contiene. Usare "Dove si trova il suo errore?" o un'altra forma con "dove" per esteso.
- **Il carattere "−" (segno meno tipografico U+2212) nelle spiegazioni di sottrazione fa fallire il lint** anche se il calcolo è giusto: usare il trattino normale "-".
- **`× 1 =` fa fallire il lint ovunque appaia dopo una frazione unitaria (`1/d`) entro 120 caratteri**, anche se il fattore 1 non è quello unitario (es. "4 × 1 = 4" dopo aver citato "1/5"). Riscrivere evitando "× 1 =" letterale, per esempio con un'addizione ripetuta.
- **Le parole tronche "aver"/"poter" (participio + verbo senza "-e" finale) non sono nella lista prestiti di `lint_content.js`**: sono italiano corretto ("dopo aver segnato") ma il lint le rifiuta lo stesso. Usare la forma piena "avere"/"potere", più facile che aggiungere ogni participio tronco alla lista.
- **Le domande "quale/qual è il più piccolo/grande X fra queste opzioni numeriche" devono nominare ogni opzione nella spiegazione**, non solo la risposta giusta (`check_grammar_rules.js`, regola del lotto 68): se le opzioni sono tutte numeriche e la domanda contiene "maggiore/minore/più grande/più piccolo", ogni valore delle opzioni deve comparire testualmente nella spiegazione.
- **Una domanda che comincia con "In un diagramma..." fa scattare la regola "rimanda a una tabella che non c'è"** anche se il diagramma è poi descritto per intero a parole: la regex guarda solo l'inizio della frase (`^In un (?:grafico|istogramma|diagramma)`). Riformulare l'apertura (es. "Un diagramma ad albero per scomporre 8 ha...").
- **Nomi propri nuovi vanno aggiunti a `NOMI_PERSONA_F`/`NOMI_PERSONA_M` in `lint_content.js`** (`check_grammar_rules.js` li legge da lì): un nome comune come "Luigi" non ancora in lista fa fallire la regola "nomi propri non classificati", non per un problema del contenuto.
- **Ampliare le regex della mappa mantenendo la copertura degli argomenti già coperti**: prima di allargare un pattern, contare i match sull'intero dataset di classe 4 (esistenti + nuove), non solo sullo shard nuovo — un pattern troppo largo aggiunge sovrapposizioni silenziose con argomenti limitrofi (es. "propri[ae]|impropri[ae]|apparent[ei]" per la classificazione delle frazioni cattura anche le domande sui numeri misti, che citano "frazione impropria": è una sovrapposizione nota e accettata, non un bug).
