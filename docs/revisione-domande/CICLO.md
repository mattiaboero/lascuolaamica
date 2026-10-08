# Il ciclo di lavoro della Fase 1

Un ciclo tratta N lotti da 40 della stessa materia (N = 7 regge bene). Tutti i comandi dalla radice del progetto; `R` sta per `node scripts/revisione_domande.js`.

1. `date`, poi `R lotto --materia M --lotti N --nome M` → lotti `M-k`.
2. In parallelo, in primo piano: per ogni lotto un agente **bambino** (modello sonnet) e un agente **maestra** (modello opus). Istruzioni in `bambino.md` e `maestra.md`; il bambino legge solo `bambino.json`.
3. `R verdetti M-k ...` → ogni lotto ha il suo `da-riscrivere.json`.
4. In parallelo: per ogni lotto un agente **scrittore** (opus) che finisce con `R riscritture M-k --prova`. Se dal ciclo prima c'è un lotto `M-resto-j`, uno scrittore anche per quello. Dire agli scrittori di non produrre fotocopie e di spegnere i doppioni dello stesso schema oltre il quarto.
5. `R riscritture M-k ... M-resto-j` (una mano sola, in serie), poi `npm run -s audit:json`, `lint:content`, `check:math`. Gli errori di forma del lint si correggono subito nel testo: la domanda è ancora «in revisione» e viene riletta.
6. **Solo dopo il lint verde:** `R lotto --in-revisione --materia M --nome M-g2` → lotti del secondo giro.
7. Bambino e maestra **nuovi** su ogni lotto `M-g2-k`.
8. `R verdetti M-g2-k ...`, poi `R raccogli M-resto-j M-g2-k ...`: le poche bocciate di nuovo passano allo scrittore del ciclo seguente. Alla terza bocciatura `verdetti` spegne la domanda.
9. Commit locale (`fix(M): revisione delle domande, lotti a-b`), `R check --materia M`.

A materia finita (`in sospeso 0`): `R rapporto reports/revisione-M.md --materia M --titolo "..."`, controlli (`npm run lint`, `audit:json`, `lint:content`, `check:math`, `check:balance`), commit.

Non fare: lanciare `riscritture` senza `--prova` da più agenti insieme; creare i lotti `g2` prima che il lint sia verde (cambiare il testo dopo fa saltare l'hash).
