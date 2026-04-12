# Contenuti e domande

## Regole editoriali

- Linguaggio semplice, inclusivo e adatto alla primaria.
- Una risposta corretta univoca.
- Distrattori plausibili ma chiaramente errati.
- Coerenza con Indicazioni Nazionali.

## Qualità linguistica

Controllare sempre:

- accenti (`è`, `perché`, `qual è`, `cos'è`),
- apostrofi (`l'`, `dell'`),
- assenza refusi nei testi e nei metadati.

## Pipeline consigliata

1. Aggiorna i CSV sorgente.
2. Rigenera JSON (`build_questions_json.py`).
3. Esegui controlli (`prepublish-check.sh`).
4. Verifica manuale su almeno 2 classi per materia.
