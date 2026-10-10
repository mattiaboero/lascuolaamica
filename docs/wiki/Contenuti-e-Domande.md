# Contenuti e domande

Il dataset conta **9.915 domande** su 8 materie, per classi dalla 2ª alla 5ª. Questa pagina descrive come sono strutturate, come vengono generate e come mantenerle.

---

## Formato JSON

Ogni materia ha un file `json/<materia>.json` con questa struttura:

```json
{
  "schemaVersion": 1,
  "subject": "matematica",
  "totalQuestions": 1934,
  "generatedAt": "2026-07-01T...",
  "stats": { "areas": {...}, "classes": {...} },
  "questions": [
    {
      "id": "mat-2-tabelline-001",
      "subject": "matematica",
      "class": 2,
      "area": "tabelline",
      "subarea": "calcolo_mentale",
      "difficulty": 1,
      "question": "Quanto fa 2 × 4?",
      "options": ["7", "5", "6", "8"],
      "answerIndex": 3,
      "answer": "8",
      "explanation": "2 × 4 significa 2 preso 4 volte...",
      "active": true
    }
  ]
}
```

`json/index.json` è l'entry point caricato dal client (`questions-loader.js`): elenca i path dei file materia e i totali aggregati; ogni file materia viene poi caricato separatamente (lazy) dal core quiz.

**Due consumer, un solo dataset.** Oltre alle 8 pagine materia, anche il gioco arcade `/breakout` (`js/breakout.js`) legge da qui tramite `questions-loader.js`, filtrando per classe. Chi modifica i JSON materia sta quindi modificando anche il pool del gioco — non serve nessun passo aggiuntivo, ma vale la pena saperlo.

L’indice dati tiene il conteggio aggiornato per materia e il timestamp di generazione.

Le bonus questions non vivono più inline nei file pagina: stanno negli stessi JSON materia, con `bonus: true` e `bonusRaw` impostato su `easy`, `medium` o `hard`. Conta anche `class`: a fine partita il motore pesca, nel livello scelto, le righe entro una classe di distanza da quella della partita e, se mancano, quelle più vicine. Un bonus nuovo va quindi scritto per la classe a cui è destinato.

Per inglese il dataset include anche metadata opzionali usati dal core:

- `subarea` per il filtraggio dei livelli
- `answerLang` per il rendering bilingue delle opzioni (`en` oppure `it`)

---

## Regole editoriali

**Linguaggio.** Semplice, inclusivo, adatto all'età. Evitare costruzioni complesse o lessico da scuola media.

**Risposta corretta.** Una sola, univoca. Se la domanda ammette più risposte plausibili, riformularla.

**Distrattori.** Plausibili (errori comuni, misconcezioni tipiche), ma chiaramente sbagliati a riflessione. Non trabocchetti inutilmente sottili.

**Coerenza con le Indicazioni Nazionali.** I contenuti devono corrispondere al curricolo italiano della scuola primaria per la classe indicata.

**Qualità linguistica.** Controllare sempre:

- accenti: `è`, `perché`, `qual è`, `cos'è`, `né`
- apostrofi: `l'`, `dell'`, `un'`, `po'`
- assenza di refusi nei testi e nei metadati

**Inclusività.** Niente stereotipi di genere, etnici o culturali. Nomi propri vari nelle domande. Contesti aperti a bambine e bambini.

---

## Pipeline aggiornamento domande

1. Genera le domande in JSONL in `reports/generated/<subject>-c*.jsonl`
2. Ingest nel dataset materia: `python3 scripts/ingest_generated.py --subject <materia>` (o `--all`)
3. Per domande parametriche: `python3 scripts/append_parametric_pilot.py --profile extended`
4. Le domande nuove entrano con `active: false`. Si accendono solo dopo la revisione a tre ruoli (vedi sotto)
5. Esegui i controlli: `npm run verify` (include audit JSON, lint contenuti, `check:revisione`, `check:leggibilita`, freshness sitemap/JSON-LD)
6. Verifica manuale su almeno 2 classi per materia toccata
7. Merge su `main` → pubblicazione automatica

### Nessuna domanda attiva senza verdetto

Dalla revisione dell'ottobre 2026 ogni domanda attiva deve avere in `reports/revisione-qualita.json` un verdetto (`ok` o `riscritta`) sull'impronta del testo corrente: classe, enunciato, opzioni, risposta giusta e spiegazione. `npm run check:revisione` lo controlla ed è dentro `npm run verify`, quindi dentro il check `prepublish` richiesto su `main`.

- Chi ritocca anche una virgola di una domanda attiva ne cambia l'impronta: la domanda va riletta (`node scripts/revisione_domande.js lotto --ids <id>`) prima del merge.
- Il verdetto nasce da tre ruoli separati: un risolutore alla cieca che non vede la soluzione, un revisore che applica la rubrica, uno scrittore che riscrive le bocciate. Chi riscrive non approva. Alla terza bocciatura la domanda viene spenta. Procedura in `docs/revisione-domande/CICLO.md`.
- `check:revisione` blocca anche le **opzioni in serie**: se in una materia e classe più del 40% delle domande con quattro numeri consecutivi come opzioni ha la risposta giusta sul più grande (o sul più piccolo), si indovina senza fare il conto.
- `npm run check:leggibilita` blocca enunciati, opzioni e spiegazioni oltre la lunghezza adatta alla classe.

Dalla 4.12.45 `ingest_generated.py` è idempotente: salta le domande il cui testo è già presente nel dataset (confronto normalizzato: spazi compattati, minuscole) e, a fine ingest reale, sposta gli shard processati in `reports/generated/ingested/`. Il conteggio finale riporta anche quanti duplicati ha saltato. Prima ogni riga riceveva un id nuovo da `next_id()`, quindi rilanciare lo script sullo stesso shard duplicava le domande in silenzio.

---

## Script manuali (non in CI)

Strumenti one-shot, da lanciare a mano quando serve. Non sono in `package.json` né nei workflow: nessuno li esegue automaticamente.

| Script | Cosa fa | Quando serve |
| --- | --- | --- |
| `dedup_questions.py` | Rimuove domande duplicate dai dataset materia | Dopo un ingest sospetto, o come bonifica una tantum |
| `derive_math_difficulty.py` | Ricalcola `difficulty` di matematica dalle caratteristiche intrinseche della domanda | Se la difficoltà risulta collassata sulla classe (era il caso prima del suo primo uso: la difficoltà adattiva richiede varianza dentro la classe, non fra classi) |
| `fill_math_subarea.py` | Riempie le `subarea` vuote di matematica in modo deterministico | Dopo un import che lascia `subarea` vuota |
| `normalize_difficulty.py` | Normalizza i valori di `difficulty` su tutte le materie | Bonifica di dataset importati con difficoltà fuori scala. Nota: inferisce dalla classe, quindi su matematica va seguito da `derive_math_difficulty.py` |
| `retag_problemi_areas.py` | Riassegna le aree delle domande di `problemi` | Dopo un cambio della tassonomia delle aree |
| `update_total_questions.py` | Riallinea `totalQuestions` e `stats.rows` nei JSON materia | Se un'edit manuale ha lasciato i contatori disallineati |

Prima di lanciarne uno: commit pulito, perché scrivono direttamente sui `json/*.json` e la rete di sicurezza è solo git.

---

## Anti-duplicati

Il generatore parametrico include controllo anti-duplicati su ID e firma domanda. Eseguire sempre con seed configurabile per riproducibilità.

Per verificare la copertura senza modificare i dataset:

```bash
python3 scripts/append_parametric_pilot.py --report-only
```

Il report CSV viene salvato nell’area report del progetto.

---

## Aggiungere domande manualmente (flusso riservato)

Per collaboratori con accesso al flusso editoriale riservato:

1. Apri l’ambiente editoriale condiviso dal team
2. Seleziona materia e classe
3. Inserisci la domanda — l’ID viene calcolato automaticamente
4. Genera ed esporta il JSON parziale
5. Invia il file per l’integrazione nel dataset principale

I dettagli operativi dell’accesso non sono documentati nella wiki pubblica.
