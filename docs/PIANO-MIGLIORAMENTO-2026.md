# Piano di miglioramento — La Scuola Amica

**Obiettivo:** portare app e dataset alla migliore versione possibile per l'avvio dell'anno scolastico (**14 settembre 2026**).
**Finestra di lavoro:** 28 giugno → 14 settembre 2026 (~11 settimane).
**Stato di partenza:** 7.375 domande, 8 materie, classi 2ª–5ª, PWA offline, WCAG 2.1 AA, privacy-first.

---

## 1. Diagnosi (analisi del codice e dei dati)

### Punti di forza già solidi (da non toccare)
- Motore unico `subject-quiz-core.js` condiviso da tutte le materie; ogni materia è solo config dichiarativa. Architettura pulita.
- Le opzioni vengono **rimescolate a runtime** (`buildAnswerOptions` → `shuffle`, riga 442). Lo sbilanciamento di posizione della risposta nei JSON (es. geografia 819/52/12/2) **non è un bug live**: l'ordine in cui un bambino vede le opzioni è casuale.
- PWA offline, font self-hosted, CSP con hash, Lighthouse CI, ESLint/Stylelint flat config, `prepublish-check.sh`. Igiene tecnica matura.
- Modalità accessibile Okabe-Ito presente (guard `html:not([data-palette="okabe-ito"])`) — vincolo da rispettare in ogni restyle.

### Criticità che limitano la qualità (priorità per il 14 settembre)

| # | Problema | Dato oggettivo | Impatto |
|---|----------|----------------|---------|
| C1 | **Squilibrio del numero di domande tra materie** | italiano 399, inglese 463 vs matematica 1876, problemi 1049, civica 969 | italiano/inglese ripetono presto le stesse domande → noia, prevedibilità |
| C2 | **Spiegazioni mancanti in matematica** | solo ~74/classe hanno `explanation` (≈84% vuote, 1581/1876) | la materia più giocata non dà feedback didattico dopo la risposta |
| C3 | **Campo `difficulty` incoerente** | matematica `null`, scienze solo 1–2, storia 1–3, civica/inglese 1–4 | impossibile una difficoltà adattiva affidabile e trasversale |
| C4 | **`problemi` ha una sola area** (`problemi`) per 1049 domande | nessun sotto-ambito (addizione/sottrazione/moltiplicazione/divisione/misure/euro/tempo) esposto | impossibile esercitare un ambito specifico o mappare il curricolo |
| C5 | **Copertura italiano sbilanciata per ambito e classe** | scrittura c2=2, sintassi c2=3 e c3=0, alfabeto solo c2, lingua sparsa | ambiti chiave del curricolo poco o nulla coperti in alcune classi |
| C6 | **Duplicati testuali residui** | matematica 16, italiano 10, inglese 8, scienze 4, storia 3 domande ripetute | piccola perdita di varietà; da pulire |
| C7 | **Tracce di generazione templatica automatica** | bias di posizione estremo in geografia, distrattori a volte deboli | qualità pedagogica dei distrattori da rivedere a campione |

> Nota: i dati sono strutturalmente puliti (nessuna opzione vuota, nessuna domanda con <4 opzioni, nessuna risposta corretta fuori dalle opzioni, nessun duplicato di opzione interno). La base è sana: il lavoro è di **contenuto e didattica**, non di bonifica strutturale.

---

## 2. Obiettivi di contenuto (espansione domande)

### Target per materia

Riequilibrio verso ~**250–300 domande per classe** nelle materie leggere, mantenendo le forti. Traguardo complessivo: **≈10.000 domande** (badge README da aggiornare).

| Materia | Oggi | Target | Δ | Priorità |
|---|---:|---:|---:|---|
| Italiano | 399 | **1.000** | +600 | 🔴 alta |
| Inglese | 463 | **900** | +440 | 🔴 alta |
| Matematica (spiegazioni) | 1.876 | 1.876 + **~1.500 spiegazioni** | — | 🔴 alta |
| Problemi (ri-categorizzazione + nuove) | 1.049 | **1.300** | +250 + tag area | 🟠 media |
| Scienze | 843 | **1.050** | +200 | 🟠 media |
| Storia | 891 | **1.050** | +160 | 🟠 media |
| Geografia | 885 | **1.050** | +165 | 🟠 media |
| Civica | 969 | **1.050** | +80 | 🟢 bassa |
| **Totale** | **7.375** | **≈9.900** | **+~2.500 nuove + 1.500 spiegazioni** | |

### Criteri editoriali per ogni nuova domanda (non negoziabili)
1. **Coerenza con le Indicazioni Nazionali** per la classe indicata (vedi §3 mappa per materia).
2. **Zero errori** lessicali e grammaticali. Lint automatico su accenti (`è`, `perché`, `qual è`, `cos'è`, `né`) e apostrofi (`l'`, `un'`, `po'`), più revisione umana a campione.
3. **Risposta corretta unica e univoca.** Niente ambiguità.
4. **Distrattori plausibili** (errori tipici dei bambini), non trabocchetti sottili.
5. **`explanation` obbligatoria** e formativa: spiega *perché*, non ripete la risposta.
6. **`difficulty` 1–3 sempre valorizzata** (1 = base, 2 = consolidamento, 3 = sfida).
7. **Tono stimolante**: contesti concreti e vicini ai bambini (animali, gioco, scuola, natura, sport), nomi propri vari e inclusivi, niente stereotipi.
8. **Sotto-area (`subarea`) sempre compilata** per permettere esercizio mirato.

---

## 3. Mappa curricolare per materia (cosa aggiungere)

**Italiano** — riempire i buchi: alfabeto/ordine alfabetico (c2), ortografia digrammi/accento/apostrofo (c2–c3), morfologia articoli/nomi/aggettivi/verbi (c3–c5), sintassi soggetto/predicato/espansioni (c4–c5), comprensione del testo (tutte), lessico/sinonimi/contrari (tutte), scrittura/punteggiatura (c3–c5).

**Inglese** — consolidare aree esistenti (colori, numeri, animali, famiglia, cibo, to be, have got, routine, casa, sport, hobby) ed estendere: present continuous (c4–c5), preposizioni di luogo, plurali, ora/orario, vestiti, ambiente/natura, classroom language. Mantenere `answerLang`/`subarea`.

**Matematica** — priorità alle **spiegazioni** sulle domande esistenti (aritmetica, tabelline, geometria, logica e dati). Nuove domande solo dove un ambito è scarso per classe (es. frazioni e decimali c4–c5, perimetro/area c4–c5, statistica/grafici).

**Problemi** — **ri-taggare per area** (addizione, sottrazione, moltiplicazione, divisione, due operazioni, euro/denaro, misure, tempo, frazioni) e aggiungere problemi a più passaggi per c4–c5.

**Scienze** — viventi/non viventi, classificazioni, corpo umano e apparati (c4–c5), stati della materia, ecosistemi e catene alimentari, sistema solare, energia, metodo scientifico.

**Storia** — tempo e strumenti (c2), fonti e metodo (c3), Preistoria, civiltà dei fiumi, Egizi, Greci, Romani (c4–c5). Coprire la linea del tempo e il rapporto causa-effetto.

**Geografia** — orientamento e carte, paesaggi (montagna/collina/pianura/acqua), regioni climatiche, Italia fisica e politica, settori economici, Europa (c5).

**Civica** — già la più completa: rifinire Costituzione e diritti, cittadinanza digitale, ambiente, sicurezza stradale; aggiungere educazione finanziaria di base e affettività/rispetto.

---

## 4. Miglioramenti app / sito web

### A. Didattica (abilitati dal lavoro sui contenuti)
- **A1 — Spiegazione sempre dopo la risposta.** Mostrare `explanation` a fine domanda (richiede C2 risolto). Già supportata dal dato: renderla visibile e curata.
- **A2 — Difficoltà adattiva.** Usare `difficulty` (richiede C3 uniformato): alzare/abbassare il livello in base alle risposte recenti della sessione.
- **A3 — "Ripassa i tuoi errori".** Coda locale (localStorage) delle domande sbagliate, riproposte a distanza (ripetizione dilazionata leggera). Coerente con privacy-first: tutto in locale.
- **A4 — Esercizio per ambito.** Selettore di area/subarea per allenare un argomento specifico (abilitato da C4 e dalle `subarea` compilate).

### B. Esperienza bambino
- **B1 — Feedback più caldo** su risposta corretta/errata (già presenti `FEEDBACK_OK/KO`): ampliare con micro-incoraggiamenti e collegarli alla bacheca premi.
- **B2 — Restyle palette Wada Sanzo** (fase standard già pianificata; mai toccare la modalità accessibile Okabe-Ito).
- **B3 — Mascotte coerente** come guida (asset in `assets/mascotte`): tip/incoraggiamenti contestuali.

### C. Genitori / insegnanti
- **C1 — Riepilogo progressi per ambito** (locale, esportabile come oggi la bacheca PNG): mostra punti forti/deboli per materia e area, utile a casa e in classe.
- **C2 — Pagine `per-genitori`/`per-insegnanti`** arricchite con la mappa curricolare e suggerimenti d'uso.

### D. Qualità e infrastruttura contenuti
- **D1 — Linter linguistico italiano** automatico in `prepublish-check.sh`: accenti, apostrofi, doppi spazi, refusi comuni, lunghezza opzioni.
- **D2 — Validatore schema esteso**: `explanation` non vuota, `difficulty` ∈ {1,2,3}, `subarea` non vuota, anti-duplicato semantico (non solo testuale esatto).
- **D3 — Mappa di copertura curricolare**: report che evidenzia ambiti/classi sotto-rappresentati (estende `audit_questions_json.js`).
- **D4 — Pulizia duplicati** C6 (37 domande).

### E. Tecnico (mantenimento)
- Mantenere soglie Lighthouse CI; verificare a11y dopo ogni restyle.
- `shared.js` (90 KB) e `subject-quiz-core.js` (76 KB): valutare code-splitting non bloccante se la perf mobile lo richiede (basso rischio, bassa priorità).

---

## 5. Roadmap temporale (11 settimane)

| Fase | Settimane | Contenuto |
|---|---|---|
| **F0 — Fondamenta dati** | 1 (30 giu–6 lug) | C3 uniforma `difficulty`; D2 validatore esteso; D1 linter linguistico; D4 dedup; C4 ri-tagga `problemi` per area |
| **F1 — Contenuti prioritari** | 2–5 (7 lug–3 ago) | Italiano +600, Inglese +440, spiegazioni matematica (~1.500) |
| **F2 — Contenuti restanti** | 4–7 (21 lug–17 ago) | Scienze/Storia/Geografia/Civica +~600; nuovi problemi a più passaggi |
| **F3 — Qualità linguistica e didattica** | 6–9 (4–31 ago) | Revisione umana a campione distrattori/spiegazioni; controllo curricolare; D3 report copertura |
| **F4 — App** | 8–10 (11 ago–7 set) | A1 spiegazione sempre visibile; A2 adattiva; A3 ripassa errori; A4 esercizio per ambito; C1 riepilogo progressi |
| **F5 — QA e lancio** | 10–11 (1–14 set) | Lighthouse/a11y regression, verifica manuale 2 classi/materia, aggiornamento `index.json`/badge/CHANGELOG, soft launch |

> Le fasi contenuti (F1–F3) si sovrappongono volutamente: l'espansione è parallelizzabile per materia.

---

## 6. Definizione di "fatto" (gate per il 14 settembre)
- [ ] ≈9.900 domande; nessuna materia sotto ~250/classe.
- [ ] Ogni domanda: `explanation` piena, `difficulty` 1–3, `subarea` compilata.
- [ ] `problemi` ri-categorizzato per area; italiano senza buchi di ambito/classe.
- [ ] Linter linguistico verde su tutti i JSON; zero duplicati testuali.
- [ ] A1–A4 in produzione; C1 riepilogo progressi disponibile.
- [ ] Lighthouse a11y ≥ 0.95 mantenuto; modalità Okabe-Ito intatta.
- [ ] README/`index.json`/CHANGELOG aggiornati al nuovo conteggio.

---

## 7. Rischi e mitigazioni
- **Volume contenuti vs qualità.** Mitigazione: generazione assistita + revisione umana a campione obbligatoria (§3), linter automatico (D1), gate curricolare (D3). Mai pubblicare lotti non revisionati.
- **Errori didattici sottili** (risposta ambigua, distrattore troppo vicino). Mitigazione: verifica manuale 2 classi/materia (pipeline wiki esistente) + report copertura.
- **Slittamento tempi.** Mitigazione: F1 (italiano/inglese/spiegazioni mate) è la priorità minima spendibile; se serve tagliare, si rinviano F2 civica e parte degli "app nice-to-have" A3/A4 a dopo il lancio.
