# Contenuti e domande

Il dataset conta **7.375 domande** su 8 materie, per classi dalla 2ª alla 5ª. Questa pagina descrive come sono strutturate, come vengono generate e come mantenerle.

---

## Formato JSON

Ogni materia ha un file `json/<materia>.json` con questa struttura:

```json
{
  "subject": "matematica",
  "totalQuestions": 1716,
  "generatedAt": "2026-04-29T...",
  "stats": {
    "rows": 1716,
    "areas": [...],
    "classes": [2, 3, 4, 5]
  },
  "questions": [
    {
      "id": "mat-2-addizioni-001",
      "class": 2,
      "area": "addizioni",
      "difficulty": 1,
      "question": "Quanto fa 7 + 5?",
      "options": ["10", "11", "12", "13"],
      "correct": 2
    }
  ]
}
```

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

1. Aggiorna i CSV sorgente (se usati come base)
2. Esegui il generatore JSON: `python3 build_questions_json.py`
3. Per domande parametriche: `python3 scripts/append_parametric_pilot.py --profile extended`
4. Esegui i controlli: `./prepublish-check.sh`
5. Verifica manuale su almeno 2 classi per materia toccata
6. Aggiorna l’indice dati con le nuove cardinalità
7. Merge su `main` → pubblicazione automatica

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
