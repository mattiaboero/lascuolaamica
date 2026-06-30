# QA didattica e linguistica — Italiano & Inglese

Revisione editoriale e pedagogica di un campione di domande generate.
Data: 2026-06-29 · Revisore: QA editoriale (pedagogia primaria + inglese)

Criteri applicati: correttezza fattuale, univocità della risposta, errori linguistici
(accenti/apostrofi/concordanze), qualità dei distrattori, coerenza con la classe
(Indicazioni Nazionali), qualità della `explanation`.

---

## 1. RIEPILOGO

| Materia  | Tot domande | Valide | Da correggere | di cui errori GRAVI* |
|----------|-------------|--------|---------------|----------------------|
| Italiano | 42          | 38     | 4             | 2                    |
| Inglese  | 34          | 31     | 3             | 1                    |

\*"Errore grave" = risposta dichiarata sbagliata, domanda senza risposta corretta/univoca,
o errore fattuale che induce in errore l'alunno. I problemi solo nella `explanation` o nei
distrattori (con `answer` comunque corretta) sono conteggiati come "da correggere" ma NON gravi.

---

## 2. DA CORREGGERE

### ITALIANO

#### ⚠️ GRAVE — id `italiano_classe2 / ortografia` (riga 7)
**Domanda:** "Quale parola contiene il suono 'gn'?"
**Opzioni:** gnocchi, grande, gnomo, sogno — **answer dichiarata:** "sogno"

**Problema:** la domanda NON è univoca ed è didatticamente fuorviante. Tre opzioni su
quattro (`gnocchi`, `gnomo`, `sogno`) contengono il digramma GN, quindi ci sono tre
risposte corrette. La `explanation` stessa lo ammette ("Tutte le opzioni contengono GN,
ma 'sogno' è la parola più comune") e poi giustifica la scelta con un criterio arbitrario
("la più comune"), che non è un criterio ortografico valido. Solo `grande` non ha GN.

**Correzione proposta** — riscrivere così che ci sia un solo distrattore con GN e tre senza,
oppure invertire la logica. Esempio di sostituzione completa:
- `question`: "In quale parola NON si sente il suono 'gn' di 'ragno'?"
- `options`: ["bagno", "gnomo", "nonno", "lavagna"]
- `answer`: "nonno"
- `explanation`: "Il suono 'gn' di 'ragno' si scrive sempre con le lettere G+N: bagno, gnomo,
  lavagna. In 'nonno' invece c'è una doppia N (nn) e il suono è diverso."

#### ⚠️ GRAVE — id `italiano_classe5 / lessico` (riga 37)
**Domanda:** "Dalla radice latina 'aqua' derivano molte parole italiane. Quale tra le seguenti NON deriva da 'aqua'?"
**Opzioni:** acquedotto, acquario, acquazzone, acquerello — **answer dichiarata:** "acquerello"

**Problema:** domanda difettosa: la risposta dichiarata è auto-contraddittoria. La `explanation`
afferma esplicitamente "tutte derivano effettivamente da 'aqua'" — quindi NON esiste l'opzione
"che NON deriva da aqua" richiesta dalla domanda. `acquerello` deriva eccome da `acqua`
(pittura ad acqua). La domanda è insolubile e la spiegazione confessa l'errore.

**Correzione proposta** — sostituire un'opzione con una parola che davvero non deriva da `aqua`:
- `options`: ["acquedotto", "acquario", "acquazzone", "aquilone"]
- `answer`: "aquilone"
- `explanation`: "'Acquedotto', 'acquario' e 'acquazzone' derivano dal latino 'aqua' (acqua).
  'Aquilone' invece deriva da 'aquila' (per la forma o per il volo alto), non dall'acqua:
  attenzione, si scrive senza la C. Conoscere l'etimologia aiuta a scrivere correttamente."

#### id `italiano_classe2 / lettura` (riga 4) — explanation confusa (non grave)
**Domanda:** "...Quanti tipi di animali ci sono nel bosco?" — **answer:** "4" (corretta)

**Problema:** la `answer` è giusta, ma la `explanation` contiene un conteggio scritto in modo
ambiguo/errato come operazione: "1 (scoiattoli) + 2 (volpi) + 3 (cervi) + 4 (gufi) = 4".
Quella sequenza somiglia a una somma (1+2+3+4 = 10, non 4): è una numerazione, non un'addizione.
Per un bambino di classe 2 è fonte di confusione.

**Correzione proposta** (solo `explanation`):
"Il testo elenca quattro tipi di animali: scoiattoli, volpi, cervi e gufi. Contandoli uno a uno
arriviamo a 4."

#### id `italiano_classe5 / ortografia` (riga 35) — opzioni duplicate (non grave)
**Domanda:** "Come si scrive correttamente?"
**Opzioni:** ["l'una cosa e l'altra", "l'una cosa e l'altra", "la una cosa e la altra", "l'una cosa e la altra"]

**Problema:** le prime due opzioni sono identiche ("l'una cosa e l'altra"). Una scelta multipla
con due opzioni testualmente uguali è un difetto di costruzione (l'alunno vede due risposte
"giuste" e il sistema potrebbe accettarne una sola). La `answer` è corretta ma il duplicato va rimosso.

**Correzione proposta** (sostituire la 2ª opzione con un distrattore plausibile diverso):
- `options`: ["l'una cosa e l'altra", "l'una cosa e l'altra ", "la una cosa e la altra", "l'una cosa e la altra"]
  → NO: non basta uno spazio. Usare un vero distrattore:
- `options`: ["l'una cosa e l'altra", "luna cosa e laltra", "la una cosa e la altra", "l'una cosa e la altra"]
- (`answer` invariata: "l'una cosa e l'altra")

---

### INGLESE

#### ⚠️ GRAVE — id `inglese / preposizioni` classe 4 (riga 24)
**Domanda:** "The dog is ___ the door. It wants to come in!"
**Opzioni:** in front of, behind, under, between — **answer dichiarata:** "in front of"

**Problema:** la risposta non è univoca e la chiave è discutibile. Il contesto "It wants to
come in!" (vuole entrare) suggerisce semanticamente che il cane è **fuori**, davanti alla porta —
ma "in front of" e "behind" sono entrambi grammaticalmente corretti e, a seconda del punto di
vista (interno/esterno), un bambino può ragionevolmente scegliere `behind`. La domanda è di
inferenza logica più che di preposizione, e l'indizio è troppo debole per renderla univoca.

**Correzione proposta** — ancorare la preposizione a un indizio spaziale inequivocabile, p.es.:
- `question`: "Look: the cat is ___ the table. We can see its tail under the table."
- `options`: ["on", "under", "in front of", "between"]
- `answer`: "under"
- `explanation`: "'Under' significa 'sotto'. Se vediamo la coda del gatto sotto il tavolo,
  il gatto è 'under the table'. 'On' = sopra, 'in front of' = davanti."

(In alternativa, se si vuole mantenere la porta: aggiungere un indizio esplicito tipo
"It is outside and wants to come in" e accettare solo "in front of".)

#### id `inglese / lessico_base` classe 3 (riga 11) — coerenza classe / esplicitezza (non grave)
**Domanda:** "What kind of weather does this describe? The trees are bending and your hair flies around."
**answer:** "windy" (corretta)

**Problema:** la `answer` è corretta e i distrattori (hot, icy, cloudy) sono validi. Il rilievo
è lieve: il testo dell'indizio ("The trees are bending and your hair flies around") usa un lessico
piuttosto ricco (`bending`, `flies around`) per una classe 3, dove l'inglese è ancora elementare.
Non è un errore, ma è al limite superiore di difficoltà rispetto alle Indicazioni (classe 3:
lessico concreto e frasi minime). Segnalo come dubbio di calibrazione, non come errore.

**Suggerimento** (opzionale, semplificazione lessico):
- `question`: "What is the weather like? The wind is strong and moves the trees."
- (resto invariato)

#### id `inglese / future_going_to` classe 5 (riga 33) — mismatch subarea/contenuto (non grave)
**Domanda:** "'I promise I ___ forget your birthday!' Which form is correct?"
**answer:** "won't" (corretta)

**Problema:** la risposta e la spiegazione sono corrette dal punto di vista didattico
(promessa spontanea → `will/won't`). Tuttavia la `subarea` è etichettata `future_going_to`,
mentre la domanda insegna proprio il contrario: che qui NON si usa `going to` ma `will`.
È un'incoerenza di tassonomia/metadati: o si cambia la subarea, o si sposta su una subarea
tipo `future_will`. Contenuto OK, etichetta fuori posto.

**Correzione proposta** (solo metadato): `subarea` → `future_will` (oppure `future_forms`).

---

## 3. PATTERN RICORRENTI

1. **Domande "NOT/eccezione" con tutte le opzioni valide.** Ricorre in italiano (righe 7 e 37):
   si chiede di trovare l'eccezione, ma tutte le opzioni rientrano nella categoria, e la
   spiegazione finisce per ammetterlo. È il difetto più serio: genera item insolubili.
   → Regola di controllo: in ogni domanda "Quale NON...", verificare che esista UNA e una sola
   opzione che davvero non appartiene alla categoria.

2. **`explanation` che ammette o introduce l'errore.** Quando la spiegazione contiene frasi del tipo
   "tutte le opzioni... ma scegliamo la più comune" / "in questo caso tutte derivano", è una
   bandiera rossa automatica: la domanda è mal costruita. → Usare queste frasi come trigger di lint.

3. **Univocità debole nei distrattori plausibili (inglese, preposizioni/inferenza).** Item che
   dipendono da un'inferenza di punto di vista (riga 24) anziché da una regola grammaticale chiara
   tendono ad avere più risposte difendibili. → Per item di preposizioni, ancorare sempre a un
   indizio spaziale esplicito e non ambiguo.

4. **Difetti di costruzione formale (opzioni duplicate).** Riga 35: due opzioni identiche.
   → Lint: rifiutare ogni domanda con opzioni testualmente uguali (anche normalizzando spazi).

5. **Coerenza metadati ↔ contenuto.** Riga 33 inglese: subarea `future_going_to` su un item su `will`.
   → Verifica incrociata subarea/contenuto.

**Nota positiva:** accenti, apostrofi e ortografia di base sono complessivamente CORRETTI nel
campione. Le forme delicate sono trattate bene e con spiegazioni accurate: `sé`/`se`/`se stesso`
(riga 20), `c'è`/`ci sono` (riga 14), `un` davanti a vocale senza apostrofo (riga 11), elisione
dell'articolo (riga 35, a parte il duplicato). Niente refusi su `perché`, `qual è`, `cos'è`, `né`.
Lato inglese: grammatica corretta (to be, possessivi, simple past con `didn't + base`, comparativi,
relativi who/which), spiegazioni in italiano corrette e ben tarate.

---

## 4. VERDETTO PER MATERIA

### ITALIANO
- Errori GRAVI: 2 su 42 = **4,8%**
- Da correggere (totale, inclusi minori): 4 su 42 = 9,5%
- **VERDETTO: PASS (al limite).** Il tasso di errori gravi è 4,8%, appena sotto la soglia del 5%.
  La qualità ortografica e grammaticale è solida. **Raccomandazione:** correggere puntualmente le
  righe 7 e 37 (item insolubili) prima della pubblicazione, e ripulire 4 e 35. Non serve rigenerare
  l'intero set, ma introdurre il lint del pattern #1/#2 per evitare nuovi item "NOT" difettosi.

### INGLESE
- Errori GRAVI: 1 su 34 = **2,9%**
- Da correggere (totale, inclusi minori): 3 su 34 = 8,8%
- **VERDETTO: PASS.** Tasso di errori gravi 2,9%, sotto soglia. Inglese corretto e spiegazioni
  in italiano accurate. **Raccomandazione:** correggere la riga 24 (univocità preposizione),
  sistemare il metadato della riga 33 e valutare la semplificazione lessicale della riga 11.
  Set pubblicabile dopo questi ritocchi.

---

## 5. NOTA METODOLOGICA
Campione: 42 (it) + 34 (en) = 76 domande, una per ogni combinazione classe×subarea presente nei
file. La stima del tasso d'errore è quindi indicativa sull'intero dataset solo se il campione è
rappresentativo. Dato che 2 dei 3 errori italiani gravi sono dello stesso tipo (domande "NOT"),
si consiglia un controllo mirato su TUTTE le domande "Quale NON / Which... NOT" del dataset
completo prima del rilascio.
