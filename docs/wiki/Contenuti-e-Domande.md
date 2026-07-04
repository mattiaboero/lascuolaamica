# Contenuti e domande

Il dataset conta **9.879 domande** su 8 materie, per classi dalla 2ª alla 5ª. Questa pagina descrive come sono strutturate, come vengono generate e come mantenerle.

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

L’indice dati tiene il conteggio aggiornato per materia e il timestamp di generazione.

Le bonus questions non vivono più inline nei file pagina: stanno negli stessi JSON materia, con `bonus: true` e `bonusRaw` impostato su `easy`, `medium` o `hard`.

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
4. Esegui i controlli: `./prepublish-check.sh` (include audit JSON, lint contenuti, freshness sitemap/JSON-LD)
5. Verifica manuale su almeno 2 classi per materia toccata
6. Merge su `main` → pubblicazione automatica

**Attenzione:** `ingest_generated.py` non deduplica automaticamente in caso di ri-esecuzione sullo stesso shard — archiviare gli shard già ingeriti e verificare i duplicati prima di rilanciare.

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
