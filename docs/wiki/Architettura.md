# Architettura

## Frontend

- HTML statico per pagina materia.
- CSS condiviso + tema accessibile + font self-hosted (`fonts.css`).
- JavaScript vanilla con moduli logici.

## Moduli chiave

- `shared.js`: footer, modali, update log, wallet crediti, palette.
- `subject-quiz-core.js`: logica quiz condivisa.
- `questions-loader.js`: caricamento dataset JSON.
- `sw.js`: cache PWA e funzionamento offline, con supporto alle clean URLs (`/storia`) e fallback su variante `.html`.

## Dati

- Dataset per materia: `json/*.json`.
- Indice dataset: `json/index.json`.
- Report build: `questions-build-report.json`.

## Stato utente

- Persistenza locale (`localStorage`): punteggi, preferenze, crediti.
