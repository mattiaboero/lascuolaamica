# Architettura

## Principi di base

Il sito è un'applicazione statica: nessun server applicativo, nessun database, nessuna build framework. Il deploy produce file HTML, CSS, JS e JSON serviti direttamente dalla piattaforma di hosting statico.

Questa scelta non è per semplicità: è per controllabilità. Ogni file che arriva al browser è ispezionabile, ogni comportamento è deterministico, ogni dipendenza è esplicita.

---

## Frontend

**HTML statico per pagina.** Ogni materia ha la propria pagina HTML. Nessun routing lato client, nessun SPA.

**CSS condiviso** con tema accessibile e font self-hosted. I font `.woff2` sono in `assets/fonts/` e referenziati da `fonts.css` — nessuna richiesta esterna a Google Fonts o CDN.

**JavaScript vanilla organizzato per responsabilità.** La logica è suddivisa in file condivisi e file pagina dedicati, così il comportamento resta leggibile e controllabile.

---

## Moduli principali

| File | Ruolo |
|---|---|
| `shared.js` | Footer, modali, log aggiornamenti, palette colori |
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
4. Le metriche di qualità sessione (`repeat rate`, `coverage`, `entropy`, `novelty`) vengono salvate nella memoria locale del browser con media rolling

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

Il riferimento legacy a `questions.json` (file aggregato) non è usato nel runtime pubblico. I controlli pre-pubblicazione bloccano riferimenti diretti non desiderati.

---

## Stato utente

Tutto nella memoria locale del browser, tutto locale, niente server:

- Punteggi e progressi per materia/classe
- Preferenze UI (palette, riduzione animazioni)
- Metriche qualità sessione quiz

---

## Service Worker

`sw.js` gestisce:

- **Precache** degli asset statici principali
- **Fallback offline** sulle rotte pubbliche principali
- Strategie differenziate per contenuti statici e dati quiz

---

## Sicurezza

- **Policy di sicurezza restrittive** per ridurre l’esecuzione di contenuti non previsti
- **Header di protezione** applicati a livello infrastrutturale
- **Dati tecnici** esclusi dall’indicizzazione diretta
- Dettagli completi: [Sicurezza, privacy e minori](Sicurezza-Privacy-e-Minori)
