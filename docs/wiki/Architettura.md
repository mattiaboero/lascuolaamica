# Architettura

## Principi di base

Il sito è un'applicazione statica: nessun server applicativo, nessun database, nessuna build framework. Il deploy produce file HTML, CSS, JS e JSON che Cloudflare Pages serve direttamente.

Questa scelta non è per semplicità: è per controllabilità. Ogni file che arriva al browser è ispezionabile, ogni comportamento è deterministico, ogni dipendenza è esplicita.

---

## Frontend

**HTML statico per pagina.** Ogni materia ha la propria pagina HTML. Nessun routing lato client, nessun SPA.

**CSS condiviso** con tema accessibile e font self-hosted. I font `.woff2` sono in `assets/fonts/` e referenziati da `fonts.css` — nessuna richiesta esterna a Google Fonts o CDN.

**JavaScript vanilla con ES modules.** L'architettura ha migrato da script globali (con alias `window.*`) a moduli ES. Tutti gli script runtime usano `type="module"`.

---

## Moduli principali

| File | Ruolo |
|---|---|
| `shared.js` | Footer, modali, log aggiornamenti, wallet crediti, palette colori |
| `subject-quiz-core.js` | Motore quiz condiviso (matematica, italiano, geo, storia, scienze) |
| `js/inglese-page.js` | Motore quiz inglese (dedicato) |
| `js/problemi-page.js` | Motore quiz problemi (dedicato) |
| `js/civica-page.js` | Motore quiz civica (dedicato) |
| `questions-loader.js` | Caricamento e parsing dataset JSON |
| `sw.js` | Service Worker: cache PWA, fallback offline, clean URLs |

---

## Algoritmo di selezione domande

Il sistema usa un **planner stocastico a slot** per ridurre i pattern ripetitivi tra sessioni. Per ogni partita:

1. Le domande vengono raggruppate per `area` e `difficoltà`
2. I candidati vengono selezionati con selezione `softmax` (non casuale pura)
3. Un sistema di cooldown su ID e firma domanda riduce le ripetizioni multi-sessione
4. Le metriche di qualità sessione (`repeat rate`, `coverage`, `entropy`, `novelty`) vengono salvate in `localStorage` con media rolling

Tutti i motori quiz (condiviso e dedicati) usano la stessa strategia.

---

## Dati

```
json/
├── index.json          # Indice con cardinalità per materia e timestamp
├── matematica.json
├── italiano.json
├── inglese.json
├── problemi.json
├── civica.json
├── geografia.json
├── storia.json
└── scienze.json
```

Il riferimento legacy a `questions.json` (file aggregato) è stato rimosso. Il build lo genera solo se `GENERATE_LEGACY_QUESTIONS_JSON=true`.

Il prepublish check blocca qualsiasi riferimento runtime diretto a `questions.json`.

---

## Stato utente

Tutto in `localStorage`, tutto locale, niente server:

- Punteggi e progressi per materia/classe
- Preferenze UI (palette, riduzione animazioni)
- Crediti economia (Villaggio)
- Metriche qualità sessione quiz

---

## Service Worker

`sw.js` gestisce:

- **Precache** di tutti gli asset statici (HTML, CSS, JS, font, JSON, immagini mascotte)
- **Fallback offline** per clean URLs — `/storia` risolve a `storia.html` dalla cache
- **Strategia cache-first** per asset statici, **network-first** per JSON domande

La versione cache (`lascuolaamica-v4xx`) viene aggiornata ad ogni release per forzare reinstallazione client.

---

## Sicurezza

- **CSP**: `script-src 'self'` — nessun inline script eseguibile
- **Permissions-Policy** e header sicurezza via Cloudflare Rules (non meta tag HTML)
- **JSON domande**: `X-Robots-Tag: noindex, nofollow` via header Cloudflare
- Dettagli completi: [Sicurezza, privacy e minori](Sicurezza-Privacy-e-Minori)
