# Prompt operativi — esecuzione Piano 2026

Companion di `PIANO-MIGLIORAMENTO-2026.md`. Per ogni attività: **qualifica/persona**, **subagent_type**, **modello Code**, **effort**, **parallelizzabilità**, **dipendenze**, **prompt pronto da incollare**.

---

## Strategia di risparmio token (principi trasversali)

1. **Modello per peso del compito.** Meccanico/deterministico → `haiku`. Generazione di contenuti in volume → `sonnet`. Algoritmi, QA didattica fine, decisioni d'architettura → `opus` (solo dove serve, su input limitato).
2. **Contesto minimo scoped.** Ogni agente riceve **solo** il file materia su cui lavora + lo schema di una domanda (10 righe), mai l'intero repo. Niente lettura di JSON da 1 MB nel contesto del modello: si lavora a **script + campione**.
3. **Sharding per parallelizzare.** I job di generazione si spezzano per materia e per classe → tanti job piccoli e indipendenti, eseguibili **in background** (`run_in_background: true`), così non bloccano il piano e ogni contesto resta corto.
4. **Output append + validazione a script.** Le domande generate vengono scritte in JSONL e validate dal linter/validatore (T0.4), **non** rilette dal modello. Il modello non rilegge ciò che ha appena scritto.
5. **Opus solo a campione.** La revisione di qualità gira su un campione stratificato (es. 5–8% per lotto), non sull'intero dataset: costo limitato, segnale alto.
6. **Effort.** Low = nessun ragionamento esteso (compiti deterministici). Medium = ragionamento normale (generazione, UI). High = ragionamento esteso (algoritmi, QA didattica, architettura).

> `subagent_type` disponibili qui: `general-purpose` (multi-step con scrittura), `Explore` (audit read-only), `Plan` (architettura, read-only). Le persone ("Sei un docente…") vanno **dentro il prompt**.

---

## FASE 0 — Fondamenta dati (sett. 1) — sblocca tutto, costo basso

### T0.1 — Uniformare `difficulty` 1–3 su tutti i JSON
- **Qualifica:** Data engineer (script deterministico) · **subagent:** `general-purpose` · **modello:** `haiku` · **effort:** Low
- **Parallelo:** sì (ma è globale: eseguire prima di T0.3) · **Dipendenze:** nessuna
```
Sei un data engineer. Scrivi ed esegui uno script Python che normalizza il campo "difficulty" in TUTTI i file json/<materia>.json (matematica, problemi, italiano, inglese, civica, geografia, storia, scienze).
Regole: difficulty deve essere un intero in {1,2,3}. Mappa: valori esistenti 1->1, 2->2, 3 o 4->3, null/mancante->inferisci dalla classe (classe 2->1, classe 3->1, classe 4->2, classe 5->2) SOLO se non desumibile altrimenti; non toccare domande già valorizzate 1-3 tranne il collasso 4->3.
Non modificare nessun altro campo. Mantieni ordine e formattazione stabile (indent=1, ensure_ascii=False, come i file attuali). Stampa un report prima/dopo per materia. Esegui, poi rilancia scripts/audit_questions_json.js per confermare nessuna regressione.
```

### T0.2 — Ri-categorizzare `problemi` per area
- **Qualifica:** Data engineer + classificatore didattico · **subagent:** `general-purpose` · **modello:** `sonnet` · **effort:** Medium
- **Parallelo:** sì (tocca solo problemi.json) · **Dipendenze:** nessuna
```
Sei un data engineer con competenze di didattica della matematica. In json/problemi.json tutte le 1049 domande hanno area="problemi". Scrivi ed esegui uno script Python che assegna una "subarea" coerente leggendo il testo della domanda, fra: addizione, sottrazione, moltiplicazione, divisione, due_operazioni, euro_denaro, misure, tempo, frazioni.
Usa euristiche sul testo (parole chiave + presenza operatori, "€", unità di misura, "metà/doppio/terzo" per frazioni). Dove ambiguo, usa "due_operazioni" o lascia subarea esistente se sensata. NON cambiare question/options/answer/explanation. Aggiorna anche il blocco stats/areas nei file json/index.json e json/problemi.json di conseguenza. Stampa la distribuzione finale per subarea x classe e confermala con scripts/audit_questions_json.js.
```

### T0.3 — Deduplica le 37 domande ripetute
- **Qualifica:** Data engineer · **subagent:** `general-purpose` · **modello:** `haiku` · **effort:** Low
- **Parallelo:** no (globale, eseguire dopo T0.1) · **Dipendenze:** T0.1
```
Sei un data engineer. In ogni json/<materia>.json rimuovi i duplicati di domanda (stesso testo "question" normalizzato lowercase/trim) tenendo la prima occorrenza con explanation non vuota se esiste. Conteggio atteso da bonificare: matematica 16, italiano 10, inglese 8, scienze 4, storia 3. Scrivi ed esegui lo script, aggiorna i conteggi in json/index.json, stampa quante righe rimosse per materia e conferma con scripts/audit_questions_json.js.
```

### T0.4 — Linter linguistico IT + validatore schema esteso
- **Qualifica:** Tooling/DevX engineer · **subagent:** `general-purpose` · **modello:** `sonnet` · **effort:** Medium
- **Parallelo:** sì · **Dipendenze:** nessuna (ma usato da tutte le fasi successive)
```
Sei un tooling engineer. Aggiungi due controlli alla pipeline esistente (prepublish-check.sh + uno script Node nuovo scripts/lint_content.js):
1) Linter linguistico italiano sui campi question/options/explanation: segnala accenti errati comuni (es. "perche", "qual'è", "po'" mancante dell'apostrofo, "se stesso" ok), doppi spazi, spazio prima di punteggiatura, virgolette miste, refusi frequenti. Per inglese (language="en"/answerLang) salta il check accenti italiani.
2) Validatore schema esteso: explanation non vuota, difficulty in {1,2,3}, subarea non vuota, options length==4, answer presente in options, nessun duplicato di domanda. Output: report con conteggio errori per materia, exit code !=0 se errori bloccanti. Integra in prepublish-check.sh e aggiungi npm script "lint:content". Non modificare i dataset, solo segnalare.
```

### T0.5 — Report copertura curricolare
- **Qualifica:** Analista dati didattici · **subagent:** `Explore` · **modello:** `haiku` · **effort:** Low
- **Parallelo:** sì · **Dipendenze:** nessuna
```
Sei un analista dati. Estendi scripts/audit_questions_json.js (o crea scripts/coverage_report.js) per produrre una matrice materia x classe x area/subarea con i conteggi attuali, evidenziando le celle sotto soglia (meno di 15 domande per coppia subarea-classe nelle materie target). Salva il report in reports/coverage.md. Solo lettura dei JSON, nessuna modifica ai dati.
```

---

## FASE 1 — Contenuti prioritari (sett. 2–5)

> Pattern comune a tutti i job di generazione: **uno shard = una materia × una classe**, output in `reports/generated/<materia>-c<classe>.jsonl`, poi validato da T0.4. Esegui in **background**. Persona didattica nel prompt.

### T1.1 — Italiano +600 (4 shard: c2/c3/c4/c5, ~150 ciascuno)
- **Qualifica:** Docente di italiano scuola primaria · **subagent:** `general-purpose` · **modello:** `sonnet` · **effort:** Medium
- **Parallelo:** sì (4 job indipendenti, background) · **Dipendenze:** T0.4 attivo · **Run:** `run_in_background: true`
```
Sei un docente di italiano della scuola primaria italiana con esperienza sulle Indicazioni Nazionali. Genera 150 domande a scelta multipla per la classe <N> (sostituisci con 2,3,4 o 5).
Copri in modo bilanciato gli ambiti deboli per questa classe: alfabeto/ordine alfabetico, ortografia (digrammi, accento, apostrofo, doppie), morfologia (articoli, nomi, aggettivi, verbi, pronomi), sintassi (soggetto, predicato, espansioni), comprensione del testo, lessico (sinonimi/contrari/famiglie di parole), punteggiatura. Adegua la difficoltà alla classe.
Formato per ogni domanda (JSON, una per riga, JSONL): {"class":N,"area":"italiano_classe<N>","subarea":"<ambito>","difficulty":1|2|3,"question":"...","options":["a","b","c","d"],"answer":"<testo opzione corretta>","explanation":"<perché, formativa, non ripete la risposta>","language":"it"}.
Regole NON negoziabili: italiano impeccabile (accenti è/perché/qual è/cos'è/né, apostrofi l'/un'/po'); una sola risposta corretta univoca; distrattori plausibili (errori tipici dei bambini), non trabocchetti; tono concreto e invogliante (animali, gioco, scuola, natura), nomi propri vari e inclusivi, zero stereotipi; explanation sempre presente. Scrivi l'output in reports/generated/italiano-c<N>.jsonl. Non rileggere il file dopo averlo scritto.
```

### T1.2 — Inglese +440 (4 shard per classe, ~110 ciascuno)
- **Qualifica:** Insegnante EFL primaria (madrelingua-equivalente) · **subagent:** `general-purpose` · **modello:** `sonnet` · **effort:** Medium
- **Parallelo:** sì (4 job, background) · **Dipendenze:** T0.4 · **Run:** background
```
You are a primary-school EFL teacher familiar with the Italian "Indicazioni Nazionali" for English. Generate 110 multiple-choice questions for class <N> (2,3,4,5).
Cover and extend these areas balanced by level: colours, numbers, animals, family, food, to be, have got, daily routine, house, sport, hobbies, plus present continuous (c4-c5), prepositions of place, plurals, telling the time, clothes, nature/environment, classroom language. Match difficulty to the class.
JSONL, one object per line: {"class":N,"area":"<area>","subarea":"<sub>","difficulty":1|2|3,"question":"<English>","options":["a","b","c","d"],"answer":"<correct option text>","explanation":"<short, in Italian, formative>","language":"en","answerLang":"en"}.
Rules: correct English, age-appropriate; one unambiguous correct answer; plausible distractors (typical learner errors); friendly engaging tone; explanation in Italian so the child learns the rule. Write to reports/generated/inglese-c<N>.jsonl. Do not re-read the file.
```

### T1.3 — Spiegazioni matematica (~1.500 mancanti, 4 shard per classe)
- **Qualifica:** Docente di matematica primaria · **subagent:** `general-purpose` · **modello:** `sonnet` · **effort:** Medium
- **Parallelo:** sì (4 job per classe, background) · **Dipendenze:** nessuna (lavora su esistenti)
```
Sei un docente di matematica della scuola primaria. In json/matematica.json, per la classe <N>, molte domande hanno "explanation" vuota. Scrivi ed esegui uno script Python che, per ogni domanda di classe <N> con explanation vuota, GENERA una spiegazione breve e formativa coerente con question/answer (mostra il passaggio chiave, es. "2 × 4 = 8: conti il 2 quattro volte"). Per le domande con calcolo verifica tu stesso che answer sia corretta; se trovi una risposta errata, segnalala in reports/math-anomalies.md SENZA correggerla d'ufficio.
La spiegazione: italiano corretto, niente trabocchetti, spiega il "perché"/metodo non ripete solo il risultato. Aggiorna in place il campo explanation, mantenendo formattazione stabile. Stampa quante spiegazioni aggiunte per area. Conferma poi con scripts/audit_questions_json.js e con npm run lint:content.
```

---

## FASE 2 — Contenuti restanti (sett. 4–7) — tutti in background, paralleli

### T2.1–T2.4 — Scienze +200 / Storia +160 / Geografia +165 / Civica +80
- **Qualifica:** Docente della materia, scuola primaria · **subagent:** `general-purpose` · **modello:** `sonnet` · **effort:** Medium
- **Parallelo:** sì (un job per materia, o sharda per classe se >200) · **Dipendenze:** T0.4, T0.5 (per mirare le celle deboli) · **Run:** background
```
Sei un docente di <MATERIA> della scuola primaria italiana, esperto delle Indicazioni Nazionali. Consulta reports/coverage.md e genera <K> domande nuove a scelta multipla concentrandoti sulle celle subarea x classe sotto soglia.
Ambiti di riferimento:
- scienze: viventi/non viventi, classificazioni, corpo umano e apparati (c4-c5), stati della materia, ecosistemi e catene alimentari, sistema solare, energia, metodo scientifico.
- storia: tempo e strumenti (c2), fonti e metodo (c3), Preistoria, civiltà dei fiumi, Egizi, Greci, Romani (c4-c5), linea del tempo, causa-effetto.
- geografia: orientamento e carte, paesaggi (montagna/collina/pianura/acqua), clima, Italia fisica e politica, settori economici, Europa (c5).
- civica: Costituzione e diritti, cittadinanza digitale, ambiente, sicurezza stradale, educazione finanziaria di base, rispetto e affettività.
Formato JSONL: {"class":N,"area":"<area canonica della materia>","subarea":"<sub>","difficulty":1|2|3,"question":"...","options":[4],"answer":"<testo corretto>","explanation":"<perché, formativa>","language":"it"}.
Regole: coerenza con la classe; italiano impeccabile; risposta unica univoca; distrattori plausibili; tono concreto e invogliante; explanation sempre presente. Scrivi in reports/generated/<MATERIA>-nuove.jsonl. Non rileggere il file.
```

### T2.5 — Problemi a più passaggi c4–c5 (+250)
- **Qualifica:** Docente di matematica (problem solving) · **subagent:** `general-purpose` · **modello:** `sonnet` · **effort:** Medium · **Run:** background · **Dipendenze:** T0.2
```
Sei un docente di matematica della primaria. Genera 250 problemi a scelta multipla per classi 4 e 5, a DUE o più passaggi (es. comprare più oggetti e calcolare il resto; misure e proporzioni semplici; frazioni di una quantità). Ogni problema con contesto concreto e invogliante, numeri realistici, una sola risposta corretta e distrattori che riflettono errori tipici (operazione sbagliata, dimenticare un passaggio).
JSONL: {"class":4|5,"area":"problemi","subarea":"due_operazioni|misure|euro_denaro|frazioni","difficulty":2|3,"question":"...","options":[4],"answer":"<testo>","explanation":"<i passaggi: prima ... poi ...>","language":"it","bonusRaw":"<facoltativo: domanda bonus collegata>"}.
Verifica tu i calcoli. Scrivi in reports/generated/problemi-multistep.jsonl. Non rileggere il file.
```

### T2.X — Merge & ingest dei JSONL generati nei dataset
- **Qualifica:** Data engineer · **subagent:** `general-purpose` · **modello:** `haiku` · **effort:** Low · **Dipendenze:** tutti i job F1/F2 finiti + T0.4 verde
```
Sei un data engineer. Scrivi ed esegui uno script che ingerisce i file reports/generated/*.jsonl nei rispettivi json/<materia>.json: assegna id progressivi nel formato esistente (es. ita-3-grammatica-045), riempie i campi mancanti coerenti con lo schema (subject, sourceSubject, tag/tags, program, active=true, bonus=false), e accoda. Poi esegui npm run lint:content e scripts/audit_questions_json.js: NON fare commit se il linter fallisce. Aggiorna json/index.json (totali, areas, classes) e stampa il nuovo conteggio totale.
```

---

## FASE 3 — QA linguistica e didattica (sett. 6–9)

### T3.1 — Revisione qualità a campione (Opus, costo limitato)
- **Qualifica:** Revisore editoriale + pedagogista · **subagent:** `general-purpose` · **modello:** `opus` · **effort:** High
- **Parallelo:** sì per materia · **Dipendenze:** T2.X (dati ingeriti)
```
Sei un revisore editoriale e pedagogista della scuola primaria. Da json/<materia>.json estrai (via script) un campione stratificato del 6% per classe e subarea, SOLO delle domande nuove/modificate in questo ciclo. Valuta ciascuna su: correttezza didattica e coerenza con le Indicazioni Nazionali della classe; assenza di errori lessicali/grammaticali; univocità della risposta; qualità dei distrattori (plausibili ma non ambigui); tono adatto e invogliante; explanation realmente formativa.
Produci reports/qa-<materia>.md con: domande da correggere (id + problema + fix proposto), pattern ricorrenti, verdetto pass/fail del lotto. Se il tasso di errore supera il 5%, raccomanda la rigenerazione dello shard interessato. Non modificare i dataset: solo referto.
```

### T3.2 — Applicare le correzioni del referto
- **Qualifica:** Data engineer · **subagent:** `general-purpose` · **modello:** `haiku` · **effort:** Low · **Dipendenze:** T3.1
```
Sei un data engineer. Applica ai json/<materia>.json le correzioni elencate in reports/qa-<materia>.md (match per id). Solo i campi indicati. Poi npm run lint:content + audit. Stampa quante domande corrette per materia.
```

---

## FASE 4 — App (sett. 8–10)

### T4.1 — A1: spiegazione sempre visibile dopo la risposta
- **Qualifica:** Frontend engineer (vanilla JS) · **subagent:** `general-purpose` · **modello:** `sonnet` · **effort:** Medium · **Dipendenze:** T1.3 + T2.X
```
Sei un frontend engineer vanilla JS. Nel motore subject-quiz-core.js, dopo che il bambino risponde, mostra il campo explanation della domanda in un riquadro accessibile (aria-live polite) sotto il feedback corretto/errato. Rispetta lo stile esistente e la modalità accessibile Okabe-Ito (guard html:not([data-palette="okabe-ito"])). Niente regressioni a11y. Verifica con preview e screenshot su 1 materia. Aggiungi voce al CHANGELOG.
```

### T4.2 — A2: difficoltà adattiva
- **Qualifica:** Software engineer (algoritmi) · **subagent:** `general-purpose` · **modello:** `opus` · **effort:** High · **Dipendenze:** T0.1
```
Sei un software engineer. In subject-quiz-core.js aggiungi una difficoltà adattiva leggera: usa il campo difficulty (1-3, ora uniforme) per alzare/abbassare il livello delle domande successive in base alle ultime 3-4 risposte della sessione (più corrette di fila -> preferisci difficulty maggiore; errori -> torna a 1). Mantieni la selezione stocastica esistente come base, applica solo un bias di peso. Tutto in locale, nessun tracciamento. Non rompere il fallback quando un livello è scarso. Aggiungi test nel subject_quiz_test_harness.js e verifica.
```

### T4.3 — A3: "Ripassa i tuoi errori"
- **Qualifica:** Frontend engineer · **subagent:** `general-purpose` · **modello:** `sonnet` · **effort:** Medium · **Dipendenze:** nessuna
```
Sei un frontend engineer. Aggiungi una coda locale (localStorage, privacy-first, nessun server) delle domande sbagliate per materia; offri una modalità "Ripassa i tuoi errori" che le ripropone (ripetizione dilazionata leggera: ripresenta dopo qualche turno, rimuove dopo 2 risposte corrette). Integra nel flusso esistente di subject-quiz-core.js senza rompere le partite normali. Gestisci il limite di dimensione storage. Verifica con preview. CHANGELOG.
```

### T4.4 — A4: esercizio per ambito
- **Qualifica:** Frontend engineer · **subagent:** `general-purpose` · **modello:** `sonnet` · **effort:** Medium · **Dipendenze:** T0.2 (subarea problemi) + T2.X
```
Sei un frontend engineer. Aggiungi un selettore facoltativo che permette di allenare una singola area/subarea della materia (oltre alla modalità "tutto"). Popola le opzioni dalle subarea presenti nel dataset della materia/classe. Mantieni lo stile e l'a11y esistenti, modalità Okabe-Ito intatta. Verifica con preview su 2 materie. CHANGELOG.
```

### T4.5 — C1: riepilogo progressi per genitori/insegnanti
- **Qualifica:** Frontend engineer · **subagent:** `general-purpose` · **modello:** `sonnet` · **effort:** Medium · **Dipendenze:** A3 (dati errori) opzionale
```
Sei un frontend engineer. Crea una vista "Progressi" (locale, esportabile come la bacheca premi attuale in PNG) che mostra punti forti/deboli per materia e area in base alle risposte salvate localmente. Nessun dato lascia il dispositivo. Aggiorna le pagine per-genitori.html e per-insegnanti.html con un link e una breve spiegazione d'uso. Rispetta a11y e Okabe-Ito. Verifica con preview. CHANGELOG.
```

---

## FASE 5 — QA finale e lancio (sett. 10–11)

### T5.1 — Regression Lighthouse / a11y / verifica funzionale
- **Qualifica:** QA engineer · **subagent:** `Plan` (per il piano di test) + esecuzione `general-purpose` · **modello:** `sonnet` · **effort:** Medium · **Dipendenze:** tutte F4
```
Sei un QA engineer. Esegui npm run lighthouse e i controlli a11y; verifica manualmente (preview) 2 classi per ogni materia toccata e le nuove funzioni A1-A4 e C1. Conferma soglie Lighthouse mantenute (a11y >= 0.95) e modalità Okabe-Ito intatta. Produci reports/qa-finale.md con esiti e blocchi residui.
```

### T5.2 — Aggiornamento conteggi e annuncio
- **Qualifica:** Maintainer · **subagent:** `general-purpose` · **modello:** `haiku` · **effort:** Low · **Dipendenze:** T2.X, T5.1 verde
```
Sei il maintainer. Aggiorna al nuovo conteggio totale: badge "domande" nel README.md, json/index.json, llms.txt, e le pagine che citano il numero. Scrivi la voce CHANGELOG della release. Rigenera sitemap se necessario (scripts/generate_sitemap.py). Esegui ./prepublish-check.sh come gate finale.
```

---

## Mappa dipendenze e parallelismo (per non bloccare il piano)

```
F0:  T0.1 ─┐
     T0.3 ─┘ (dopo T0.1, globali, in serie)
     T0.2  T0.4  T0.5   (paralleli tra loro e con T0.1/T0.3)
                │
F1:  T1.1×4  T1.2×4  T1.3×4   ── tutti background, dopo T0.4 ──┐
F2:  T2.1 T2.2 T2.3 T2.4 T2.5 ── tutti background ────────────┤
                                                              ▼
                                                        T2.X (merge/ingest)
                                                              │
F3:  T3.1 (per materia) ──► T3.2
                                                              │
F4:  T4.1  T4.3  T4.4  T4.5 (sonnet, paralleli) ; T4.2 (opus) │ — partono in parallelo a F2/F3
                                                              ▼
F5:                                              T5.1 ──► T5.2
```

**Note di throughput:**
- F1/F2 = ~14 job di generazione, tutti indipendenti e in background: nessuno blocca l'altro, contesti corti, costo dominato da `sonnet`.
- L'unico vero punto di sincronizzazione è **T2.X** (merge): richiede che i JSONL siano pronti e il linter verde.
- F4 (app) non dipende dai contenuti tranne A1/A4: può avanzare in parallelo a F1–F3.
- Opus usato solo in **T3.1** (QA a campione) e **T4.2** (algoritmo): spesa di ragionamento concentrata dove rende.
