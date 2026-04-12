# Architettura

## Frontend

- HTML statico per pagina materia.
- CSS condiviso + tema accessibile.
- JavaScript vanilla con moduli logici.

## Moduli chiave

- `shared.js`: footer, modali, update log, wallet crediti, palette.
- `subject-quiz-core.js`: logica quiz condivisa.
- `questions-loader.js`: caricamento dataset JSON.
- `sw.js`: cache PWA e funzionamento offline.

## Dati

- Dataset unificato: `questions.json`.
- Dataset per materia: `json/*.json`.
- Report build: `questions-build-report.json`.

## Stato utente

- Persistenza locale (`localStorage`): punteggi, preferenze, crediti.
