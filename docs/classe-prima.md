# Classe 1ª in matematica

La 1ª entra solo in matematica e si accende dalla configurazione della pagina. Finché `js/matematica-page.js` non ha `classes: [1, 2, 3, 4, 5]`, il sito resta com'è: 2ª-5ª.

## P1: motore

- `cfg.classes` elenca le classi mostrate (default `[2, 3, 4, 5]`). `normalizeGrade` accetta 1, `CLASS_DEFAULTS`/`CLASS_PROFILES` hanno la 1ª.
- Regola della 1ª (`fitsClassOneRule`): le domande con `class: 1` escono solo nelle partite di 1ª, e la 1ª usa solo quelle. Vale per pool, livelli, sottoambiti e bonus, anche con `MAX_GRADE_DISTANCE = 1`. Chi è in 2ª non deve ritrovarsi domande per chi comincia; chi è in 1ª non sa ancora leggere quelle di 2ª.
- `<html data-classe="N">` si imposta all'avvio e al cambio classe. È l'aggancio per il CSS.
- Audit: `class` intero 2-5, 1-5 solo per matematica. `coverage_report` ha la colonna c1.

## P2: lettura

### Maiuscolo

In 1ª si legge lo stampato maiuscolo. `html[data-classe="1"]` mette `.q-text` e `.answer-btn` in `text-transform: uppercase`, con corpo più grande e un po' di spaziatura (`subject-quiz-theme.css`). I dati restano in minuscolo/maiuscolo misti. Sono solo regole di tipografia: niente colori, nessuna guardia per la palette Okabe-Ito. Verificato a 375×812 e 1280×800: niente scroll orizzontale, l'ultima risposta resta sopra il footer fisso.

### Ascolta

Il bottone «🗣️ Ascolta» sta sopra il testo della domanda, nel gioco e nel bonus. Legge la domanda e poi le quattro risposte nell'ordine dei bottoni. È un'altra cosa rispetto a «🔊 Audio», che accende e spegne solo gli effetti sonori.

- Web Speech API del browser (`speechSynthesis`), nessuna dipendenza, nessuna richiesta di rete: la CSP in `_headers` non cambia.
- Si usano solo voci `it-*` con `localService === true`. Le voci remote (per esempio «Google italiano» su Chrome) mandano il testo a un server, e questo è un sito per bambini. Senza voce italiana locale il bottone resta nascosto. Le voci arrivano in modo asincrono: si ricontrolla a ogni `voiceschanged`.
- È un interruttore (`aria-pressed`). Il primo tocco legge la domanda corrente, ed è anche il gesto che iOS chiede. Da acceso legge da solo ogni domanda nuova. Non parte mai da solo senza un gesto: anche con la preferenza salvata la prima lettura segue il clic su «Inizia».
- La preferenza si salva per classe in `localStorage` (`<cursorKey>_speak_c<N>_v1`, `'1'`/`'0'`), tramite `storageGet`/`storageSet`. In 1ª il bottone è più grande. Per ora non si accende da solo in 1ª.
- Si ferma (`speechSynthesis.cancel()`) quando si risponde, alla domanda successiva, a ogni cambio di schermata, su `pagehide` e quando la pagina va in background.
- Solo il testo pronunciato cambia: `+ - − × ÷ > < =` fra numeri diventano «più», «meno», «per», «diviso», «maggiore di», «minore di», «uguale a». `:` e `x` valgono «diviso» e «per» solo con uno spazio da entrambi i lati («10 : 2», «3 x 3»), così «multiplo di 5: 10» resta com'è. `___` e `?` usati come incognita si leggono «quanto».
- Le parti in inglese (`lang="en"`, pagina di inglese) usano una voce inglese locale. Se non c'è, si saltano: meglio che farle leggere alla voce italiana.
- Non si leggono da soli né l'`alt` delle figure, che è compito dello screen reader, né la spiegazione.
- Il nome accessibile è «Ascolta: leggi ad alta voce la domanda», così contiene il testo visibile (WCAG 2.5.3).

Limiti noti:

- Android/Chrome: molte voci Google risultano `localService: false` anche quando sono scaricate. In quel caso il bottone non compare.
- Safari iOS: se la prima lettura automatica viene bloccata, basta spegnere e riaccendere Ascolta.
- Le frazioni (`1/2`) le legge la voce del sistema, a modo suo.

## Bonus e pool piccoli

- Anche il bonus segue la regola della 1ª. Le righe bonus del JSON portano `grade` da `class`. I bonus scritti nella config della pagina (`bonusQuestions` in `matematica-page.js`) sono di 1ª solo con `grade: 1`. La schermata del bonus mostra solo i livelli con domande per la classe. Se non ce n'è nessuno, la partita va dritta al risultato. **Prima di accendere la 1ª servono bonus con `grade: 1`**, altrimenti la 1ª non ha il bonus.
- Niente domande ripetute nella stessa partita: quando il pool finisce, `pickQuestion` non ricomincia più da capo. I fallback prendono solo domande non ancora uscite, e se non bastano la partita è più corta (`sessionLen()` usa `questions.length`). Con un'area di 1ª sotto le 10 domande, il fallback largo completa la partita con altre domande di 1ª di altre aree, come già succede nelle altre classi.

## P3: figure

In 1ª più o meno 6 domande su 10 hanno bisogno di un disegno: a 6 anni si conta, si confronta e si riconosce guardando. Le figure seguono tutte le regole di `docs/figure-nel-quiz.md`, ma invece di disegnarle una per una le costruisce un generatore che resta nel repo.

### Generatore

`scripts/figure_classe_prima.py` legge solo l'id: l'id contiene tutti i parametri e lo stesso id dà sempre lo stesso file, byte per byte.

```bash
python3 scripts/figure_classe_prima.py c1-conta-mele-7 c1-retta-0-10-salto-3-7
python3 scripts/figure_classe_prima.py --shard reports/generated/matematica-c1-<slug>.jsonl
```

Scrive `assets/figure/<id>.svg` e aggiorna `scripts/data/figure-classe-prima.json` (per ogni id: modello, fatti veri della figura, testo alternativo). Con `--shard` genera ogni figura `c1-*` citata nello shard e scrive nella riga il suo `figureAlt`. Un file già tracciato da git non viene mai riscritto: se il disegno di un id pubblicato dovesse cambiare, lo script si ferma e serve un id nuovo.

| modello | id | disegno |
|---|---|---|
| T1 contare | `c1-conta-<mele\|palline\|stelle\|cubi>-<n>` | n oggetti (1-20) in file da 5, con uno spazio dopo il 10 |
| T1 due gruppi | `c1-conta-<oggetto>-<a>-<b>` | a oggetti arancioni pieni, sotto b oggetti blu vuoti (addizione) |
| T2 confronto | `c1-confronto-<a>-<b>` | riquadri A e B con 0-10 pallini, in colonne da 5 |
| T3 linea dei numeri | `c1-retta-<x>-<y>-salto-<da>-<a>` | tacche da x a y (al massimo 11), pallino sul `da`, salti di 1 fino ad `a` |
| T3 numero mancante | `c1-retta-<x>-<y>-manca-<m>` | come sopra, con "?" al posto di m |
| T4 decine e unità | `c1-decine-<d>-<u>` | d bastoncini da 10 quadretti e u cubetti sciolti |
| T5 figure piane | `c1-forme-<4 lettere c q r t>` | A-D: cerchio, quadrato, rettangolo, triangolo, in misure e versi diversi |
| T6 posizioni | `c1-posizione-<tavolo\|scatola>-<rel>` | palla sopra, sotto, a destra, a sinistra del tavolo; dentro o accanto alla scatola |
| T7 percorsi | `c1-percorso-<C>x<R>-<mosse>[-frecce]` | griglia, pallino in basso a sinistra, stella d'arrivo; `d3a2` = 3 a destra e 2 in alto (d s a b) |
| T8 linee | `c1-linee-<4 lettere a c>` | linee A-D aperte o chiuse |
| T8 regioni | `c1-regione-<4 lettere i f s>` | una linea chiusa e i punti A-D dentro, fuori o sulla linea |
| T9 ritmi | `c1-ritmo-<motivo c q t>-<n>` | n figure (al massimo 7, almeno due giri del motivo) e un riquadro "?" |
| T10 lunghezze | `c1-strisce-<l1>-<l2>[-<l3>]` | strisce A-C a quadretti, lunghezze diverse di almeno 2 |
| T10 pesi | `c1-bilancia-<a\|b>` | bilancia a due piatti, scende il piatto più pesante |
| T11 ideogramma | `c1-ideogramma-<a>-<b>-<c>` | righe A (cerchi), B (quadrati), C (triangoli), quantità diverse |

Scelte di disegno:

- Davanti e dietro non ci sono: in un disegno piatto non si distinguono senza ambiguità.
- La linea dei numeri mostra al massimo 11 tacche. Per i numeri fino a 20 si usa una finestra (`c1-retta-10-20-...`): con 21 tacche su 320 unità le etichette di due cifre si toccano.
- Colori Okabe-Ito come le altre figure. Quando il colore distingue due gruppi (T1 a due gruppi) cambia anche il riempimento (pieni e vuoti) e i gruppi stanno su file diverse. Nelle altre figure il colore non porta mai l'informazione: contano forma, lettera, posizione.
- Il testo nel disegno è solo lettere A-D e numeri, da 18 a 24 unità; il vermiglio non si usa mai per il testo.
- Il `figureAlt` descrive la disposizione, non il risultato: per contare «Una fila di 5 mele e sotto una fila di 2 mele.», non «7 mele»; per le figure piane le proprietà («una figura con 3 lati»), non il nome.

### Verificatore

`scripts/verifica_figure_classe_prima.py` è scritto a parte e non importa il generatore. Per ogni `assets/figure/c1-*.svg` ricava i fatti dalla sola geometria e li confronta con il manifest:

- contare: forme per tipo (cerchio, stella a 10 vertici, quadrato) e per colore, al massimo 5 per fila; nei due gruppi, pieni contro vuoti e file separate;
- confronto: pallini dentro ciascun riquadro, lettera sopra il suo riquadro;
- linea dei numeri: legge le etichette e la distanza fra le tacche, poi i salti dagli estremi degli archi (ognuno lungo 1, uno di seguito all'altro), il pallino di partenza e la punta della freccia; per "?" il numero della tacca;
- decine: bastoncini (rettangoli alti 10 volte la larghezza, con 9 righe dentro) e cubetti;
- figure piane: cerchio, triangolo (nessun angolo sotto 25°), quadrato o rettangolo (lati in rapporto almeno 1,6, altrimenti è ambiguo);
- posizioni: riquadri della palla e del tavolo o della scatola; percorsi: celle della griglia, frecce seguite dalla partenza fino alla stella;
- linee: chiusa se il tracciato finisce con `Z`, aperta solo se le estremità distano almeno 40; regioni: punto nel poligono, sulla linea entro 1,5, altrimenti almeno 12 lontano, e la lettera tutta da una parte;
- ritmi: il periodo più corto che si ripete almeno due volte e la figura che segue; strisce: quadretti contati dalle righe interne; bilancia: il lato più basso del giogo; ideogramma: forme per riga.

Controlla anche le regole comuni: peso fino a 6 KB, radice 320×240, niente style/script/link/`url(`, cartoncino come primo elemento, solo i colori della palette, testo in Arial grassetto da almeno 16 e mai vermiglio, ogni elemento dentro il cartoncino, etichette che non si sovrappongono. Infine, per ogni domanda di `json/matematica.json` con una figura `c1-*`: classe 1 e `figureAlt` uguale a quello del manifest. Esce con 1 al primo problema. Provato con 19 alterazioni fatte a mano (un oggetto in meno, un salto lungo 2, una linea chiusa aperta, un punto spostato, un `style=`, un testo piccolo o vermiglio, ...): li trova tutti.

### Aggiungere una domanda con figura

1. Scegli l'id dal modello (tabella sopra) e scrivi la riga nello shard `reports/generated/matematica-c1-<slug>.jsonl` con `"figure": "<id>"` (il `figureAlt` lo mette il generatore).
2. `python3 scripts/figure_classe_prima.py --shard reports/generated/matematica-c1-<slug>.jsonl`
3. Guarda i file nuovi a circa 215 px di larghezza (quella della figura su un telefono di 375): se un bambino può leggerli male, cambia i parametri, non il file.
4. Controlla ogni risposta sui fatti del manifest (il pilota lo ha fatto con uno script usa e getta).
5. `git add assets/figure/c1-*.svg scripts/data/figure-classe-prima.json`, poi ingest e controlli come in `docs/prompt-generazione-matematica.md`, più `python3 scripts/verifica_figure_classe_prima.py`.

### Scrivere le domande di 1ª

- Domanda di 3-8 parole, una frase sola, numeri in cifre.
- Opzioni di 1-2 parole, un numero o una lettera A-D. Nello shard le lettere stanno in ordine A, B, C, D; il gioco poi mescola i bottoni come per ogni domanda.
- Spiegazione di 1-2 frasi brevi, con il numero della risposta e il conto giusto («5 + 2 = 7»).
- Stem tutti diversi, anche fra domande sulla stessa figura: l'ingest salta un testo già presente. Si cambia oggetto o contesto («Quante mele ha raccolto il nonno?», «Quante stelle ha disegnato Sara?»).

### Pilota

24 domande (`mat-1-*-001`…`024`, shard in `reports/generated/ingested/matematica-c1-pilota-figure.jsonl`) su 21 figure di T1, T2, T3, T4, T5 e T8, più 11 figure di prova per gli altri modelli (T6, T7, T9, T10, T11: 32 file in tutto). Aree: aritmetica/numeri 7, operazioni 6, raggruppamento 3, geometria/figure 4, linee 4 (difficoltà 9/11/4). Gli argomenti `c1-*` di `scripts/data/mappa-argomenti-matematica.json` riconoscono ognuna delle 24 domande in un argomento solo; `coverage_report.js` le conta nella colonna c1.

- In gioco (copia con `classes: [1, 2, 3, 4, 5]`, 375×812) la figura è larga 297 px: il testo della domanda sta a destra della mascotte, la figura no. Domanda, figura e quattro risposte non stanno in una schermata: per l'ultima risposta serve scorrere, e scorrendo resta sopra il footer fisso.
- Con le figure il testo può essere cortissimo e resta univoco: le 24 domande non collidono né fra loro né col dataset.
- `lint_content.js` legge la «A» finale di «nel riquadro A?» come la preposizione: la domanda è diventata «Nel riquadro A, quanti pallini ci sono?». `check_grammar_rules.js` prendeva «cassetta» per un refuso di «casetta»: ora è «cesta».
- Quattro bonus con `grade: 1` in `matematica-page.js` (due facili, un medio, un difficile): nella copia la 1ª vede tutti e tre i livelli di bonus.
- I conteggi pubblici (`sync_question_counts.py`) includono già le 24 domande, anche se la classe è nascosta.
