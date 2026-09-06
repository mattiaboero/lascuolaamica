# Changelog Repo

## 4.12.68 - 2026-09-06

### Fixed
- fix(contenuti): **5 domande dicevano ancora `il/i cuore`**. La regola sulle alternative non risolte, scritta nella 4.12.64, elencava le coppie a mano (`del/della`, `il/la`, `un/una`…) e `il/i` non c'era. Ora il pattern accetta qualunque coppia di articoli o preposizioni articolate separati da `/`. `km/h` e `'panino'/'michetta'` restano fuori perché non sono articoli. Corretto anche l'accordo del verbo dove il soggetto era plurale (`A quale apparato appartengono soprattutto i polmoni?`).
- fix(contenuti): **22 spiegazioni senza articolo iniziale** con verbi che la regola della 4.12.64 non copriva — cercava solo `è/era/ha`, e queste usano `appartiene`, `vive`, `significa` (`Cuore appartiene all'apparato circolatorio`, `Rana vive soprattutto nello stagno`). Le 10 sugli organi hanno anche il verbo riaccordato al plurale; le 8 che glossano un termine ora lo citano fra apici (`'Ipotesi' significa...`), come già faceva il resto del corpus. Gli infiniti sostantivati (`Correre significa muoversi`, `Riusare significa dare nuova vita`) sono corretti senza articolo e non sono stati toccati.
- fix(contenuti): `Rana vive soprattutto nel stagno` → `nello stagno`, e `A che cosa serve di solito il stazione?` → `la stazione` (doppio errore: articolo maschile su un nome femminile).

### Changed
- lint(contenuti): regola nuova per l'articolo davanti a s impura, z, gn, ps (`nel stagno`, `il zaino`). Esclude le forme fra apici: le spiegazioni di ortografia mostrano l'errore di proposito per insegnare la regola (`'sul zaino' sarebbe sbagliato`), ed era l'unico falso positivo sul corpus.
- lint(contenuti): la regola sulle alternative non risolte non elenca più le coppie a mano.

### Notes
- entrambe le regole verificate reintroducendo il difetto. La lezione del lotto scorso — enumerare la famiglia invece di fidarsi del prefisso — ha funzionato: `sci-5-corpo-031` è comparso nel campione, ma i difetti erano 5 nella stessa famiglia e 10 nelle spiegazioni collegate.

## 4.12.67 - 2026-09-06

Lotto quasi interamente di **regressioni introdotte dalle tre release precedenti**. Il campione mostra una variante per volta, mai la famiglia intera, ed è questo che le ha lasciate passare.

### Fixed
- fix(contenuti): **8 domande avevano la minuscola dopo il punto** (`...Non c'è un cestino vicino. cosa è meglio fare?`, `5 palline rosse e 5 blu. qual è la probabilità...`). Prodotte dalle riscritture della 4.12.64 e della 4.12.66, che sostituivano la coda della domanda senza guardare se era preceduta da una frase già chiusa.
- fix(contenuti): **22 domande di civica erano rimaste con la consegna sbagliata sulla quinta variante** (`Se vuoi spiegare chi è un volontario, qual è il comportamento corretto?`). Nella 4.12.65 avevo corretto tre varianti su cinque credendo di aver chiuso la famiglia: ogni tema ne ha cinque, e la quinta comincia con `Se` invece che con uno dei tre stem che stavo cercando. Le altre 13 di quella variante hanno opzioni all'azione e sono corrette così: non toccate.
- fix(contenuti): **118 domande mescolavano forma impersonale e seconda persona** (`Come ci si comporta bene quando scegli come bere a scuola?`), effetto della sostituzione fatta nella 4.12.66. Ora `Qual è il modo giusto di comportarsi quando...`.
- fix(contenuti): la famiglia sulla riduzione dei rifiuti aveva **opzioni di due tipi diversi** — una dichiarativa (quella corretta) e tre causali (`perché il riciclo è inutile`, `per fare più imballaggi`). Nessuno stem poteva reggerle tutte. Uniformate a forma dichiarativa e adattati i cinque stem.
- fix(contenuti): il distrattore `vince il più forte` in un elenco di infiniti restava in 4 domande gemelle; nella 4.12.64 ne avevo corretta una sola.

### Changed
- lint(contenuti): regola nuova per la minuscola dopo il punto, con le esclusioni verificate — `a.C.`/`d.C.`, i puntini di sospensione e le citazioni di punteggiatura (`la domanda 'chi? che cosa?'`).
- lint(contenuti): controllo nuovo per il distrattore all'indicativo dentro un elenco di infiniti. Come gli altri due controlli di questo tipo sta in `checkQuestion`, perché confronta le opzioni fra loro. Entrambi verificati reintroducendo il difetto.

### Notes
- **il campione da 60 non vede le famiglie.** Le domande di civica sono organizzate in cinque varianti per tema, e il campionamento per scheletro unico ne mostra una per volta: tre lotti di seguito hanno scoperto lo stesso difetto su varianti diverse. Da qui in avanti, quando un difetto sta in una famiglia, conviene enumerare la famiglia prima di correggere — non fidarsi del prefisso con cui è comparsa.

## 4.12.66 - 2026-09-06

### Fixed
- fix(contenuti): **150 domande erano frasi sospese chiuse da un punto interrogativo** (`Gli animali onnivori mangiano?`, `La rotazione della Terra causa?`, `In un paese, la piazza è un elemento?`). È la stessa famiglia dei lotti 2-6, ma quelle regole guardavano l'ultima parola — preposizione, articolo, punto — e qui la frase finisce con un verbo o un nome. Il segnale giusto è un altro: **nella domanda non compare nessuna parola interrogativa**, quindi quel `?` non chiude niente. Ora finiscono con i puntini.
- fix(contenuti): **216 domande di matematica erano ellittiche** (`Triangolo isoscele: base 14 cm, lati 8 cm. Perimetro?`, `Probabilità di ottenere testa lanciando una moneta?`, `Completa la sequenza: 2, 4, 6, 8,?`). Riformulate per esteso (`Qual è il perimetro?`, `Qual è la probabilità...?`, `Quale numero completa la sequenza 2, 4, 6, 8?`).
- fix(contenuti): **236 domande di civica** chiedevano `Che cosa mostra più rispetto quando...` o `Quale risposta aiuta di più la comunità quando...` anche dove la risposta non riguarda né il rispetto né la comunità (`...quando viaggi in auto da bambino? → usare seggiolino o rialzo`, `...quando usi il tablet per molto tempo? → fare pause`). Sostituiti con `Come ci si comporta bene quando...` e `Qual è la scelta migliore quando...`. Le cinque varianti di stem della materia restano tutte distinte.
- fix(contenuti): `sci-2-ciclo-001` chiedeva *quale parola fa parte del ciclo vitale* e offriva `crescita | morte | nascita | riproduzione`: **tutte e quattro corrette**. Ora chiede con quale fase il ciclo comincia. Altre quattro della stessa famiglia chiedevano cosa viene *dopo* una fase, con due opzioni entrambe successive: ora chiedono cosa viene **subito dopo**.
- fix(contenuti): due domande bonus di civica erano telegrafiche (`Bonus facile: semaforo pedonale rosso?`) e una di scienze chiedeva un sì/no offrendo quattro nomi come opzioni.

### Changed
- lint(contenuti): controllo nuovo per la frase sospesa chiusa con `?`. Vive in `checkQuestion` e non fra le regex, perché **deve leggere le opzioni**: con risposte sì/no o vero/falso la domanda è legittima (`Le polis greche erano unite in un unico Stato? — no, erano città-stato autonome`) e una regex sul solo testo non può distinguerlo.
- lint(contenuti): il primo tentativo di quel controllo **era inerte e sembrava verde**. Riconosceva le risposte affermative con `/^(sì|si|no|vero|falso)\b/`, e `si` senza accento è il pronome riflessivo: `si trova`, `si scioglie`, `si rigenerano`. Metà corpus veniva scartato come "domanda sì/no". Verificato reintroducendo un difetto: prima non lo segnalava, ora sì — e togliendo `si` sono emersi altri 7 difetti veri che il bug nascondeva.

### Notes
- terza volta che `\b` dopo una lettera accentata rompe una regola in silenzio: `perch[ée]\b`, `cos'è`, `com'era`. In JavaScript le lettere accentate non sono caratteri di parola, quindi quel confine non fa mai match. Nel codice il confine è ora un lookahead esplicito.

## 4.12.65 - 2026-09-06

### Fixed
- fix(contenuti): **403 domande di aritmetica finivano con `=?`** (`27 + 10 =?`). La prima conversione, a `= ?`, ha fatto scattare la regola preesistente sullo spazio prima della punteggiatura — che ha ragione, in italiano quello spazio non ci va — e la seconda, a `= ...`, pure. La forma buona è la domanda per esteso: `Qual è il risultato di 27 + 10?`. **`Quanto fa X?` era la scelta ovvia ed era sbagliata**: è già la consegna delle tabelline, e usarla anche qui ha creato 25 firme duplicate nella stessa classe (`mat-2-tabelline-002` = `mat-2-aritmetica-078`). Ecco a cosa serviva il `=?`: teneva separate le due famiglie. Ora la separazione è nella consegna, e l'uniformazione ha eliminato anche i duplicati che c'erano già prima.
- fix(contenuti): **96 domande di civica avevano uno dei tre stem alternativi incollato sopra una domanda di definizione** (`Che cosa mostra più rispetto quando vuoi ricordare su quale valore si fonda la Repubblica italiana?`). Sono le gemelle delle 24 riscritte nella 4.12.64: ogni tema ha quattro varianti, e nella scorsa release ne era stata corretta una sola. Riscritte come domande dirette con **tre formulazioni diverse per tema** (32 temi × 3), perché usare la stessa per tutte avrebbe prodotto 96 duplicati. Opzioni invariate.
- fix(contenuti): **66 spiegazioni chiudevano gli apici nel punto sbagliato** quando la risposta contiene un apostrofo (`La risposta corretta è 'l'euro'.`, `'un'alluvione'`). Ora usano le virgolette doppie, come già faceva civica.

### Changed
- lint(contenuti): tre regole nuove — operazione chiusa con `=?`, apici singoli chiusi male attorno a un valore con apostrofo, stem di civica sopra una domanda di definizione. Sul corpus di partenza segnalano 466 difetti, cioè esattamente quelli corretti qui.

### Notes
- 242 domande contengono la risposta nel testo (`Se la palla è sopra la sedia, quale espressione descrive bene la posizione? → sopra la sedia`). **Non toccate**: 50 sono la famiglia degli indicatori topologici di classe 2, dove riconoscere l'espressione giusta *è* l'esercizio, e le altre sono comprensione del testo, dove la risposta deve stare nel brano citato.

## 4.12.64 - 2026-09-06

### Fixed
- fix(contenuti): **126 domande di civica chiedevano "cosa fai?" e offrivano risposte all'infinito** ("In una situazione in cui vuoi parlare in classe, cosa fai? — alzare la mano"). In italiano quella consegna vuole un verbo di seconda persona, quindi lo stem diventa "cosa è meglio fare?". Le 6 domande della stessa famiglia che hanno già opzioni alla seconda persona ("Lo chiudi bene", "Fai colazione") sono corrette e non sono state toccate.
- fix(contenuti): **24 domande della stessa famiglia non chiedevano affatto un'azione**: il template "In una situazione in cui vuoi spiegare X, cosa fai?" era stato applicato anche a definizioni, e le opzioni erano la definizione stessa (`vuoi spiegare chi è un volontario, cosa fai? — una persona che aiuta la comunità`). Riscritte come domande dirette (`Chi è un volontario?`), opzioni invariate.
- fix(contenuti): **212 spiegazioni senza articolo iniziale** (`Rotazione è la risposta corretta.`, `Secchiello è spesso fatto di plastica.`). Le 191 col template tautologico sono state invertite invece di indovinare l'articolo: `La risposta corretta è 'rotazione'.`, `Lo stato corretto è 'gas'.` — l'articolo è già nel template, quindi nessun rischio di sbagliare il genere. Le 21 informative hanno l'articolo esplicito, con il participio riaccordato dove serviva (`La matita è spesso fatta di legno`).
- fix(contenuti): 5 domande di scienze avevano l'alternativa di genere del template mai risolta (`al senso del/della udito` → `al senso dell'udito`), e un'opzione di storia conteneva il refuso `fermire il commercio`.
- fix(contenuti): `In una situazione in cui partecipa a una videolezione` → `partecipi`, e il distrattore `vince il più forte` in un elenco di infiniti → `lasciare vincere il più forte`.

### Changed
- lint(contenuti): controllo nuovo sulla coerenza fra consegna e opzioni — `cosa fai?` con tutte le opzioni all'infinito è un errore. Non è una regex di `GRAMMATICA` perché serve confrontare la domanda con le opzioni, quindi vive in `checkQuestion`. Verificato rimettendo una domanda difettosa: il lint la segnala e le domande con opzioni alla seconda persona restano verdi.
- lint(contenuti): regola nuova per l'alternativa di genere non risolta (`del/della`, `il/la`, `un/una`), attiva solo sulla domanda: nelle spiegazioni di inglese `il/la suo/sua` è voluto, serve a dire che `his` e `her` non concordano con la cosa posseduta.

### Notes
- 62 domande finiscono con i due punti invece che con i puntini (`Un angolo acuto è:`, `Choose the correct sentence about a pencil:`). **Non toccate**: i due punti prima di un elenco sono corretti in italiano — lo insegna una domanda del corpus stesso — e la forma è coerente all'interno delle famiglie che la usano (geometria, analisi logica, inglese).
- 25 spiegazioni iniziano ancora senza articolo, e sono corrette: sono nomi propri (`Milano è il capoluogo`, `Giove è il pianeta più grande`, `Sparta era nota per`).

## 4.12.63 - 2026-09-06

### Fixed
- fix(contenuti): **28 domande con accordi rotti dal template**, trovate col lotto 7 della revisione linguistica. Undici avevano il pronome maschile con un soggetto femminile (`Irene compra 8 libri... In cassa gli applicano uno sconto`), tredici il prezzo unitario al maschile con un nome femminile (`4 magliette a 18 euro l'uno` → `l'una`; `puzzle` e `album` restano `l'uno`, sono maschili), tre l'articolo mancante a inizio domanda (`Automobile/Fungo/Matita è un essere...`), una il pronome maschile con un soggetto femminile comune (`Una famiglia... Quanto gli rimane?`).

### Changed
- lint(contenuti): la regola del pronome dativo non ha più le liste di nomi propri scritte a mano dentro il pattern. `NOMI_PERSONA_F` e `NOMI_PERSONA_M` sono estratte dal corpus e dichiarate a parte, e `check_grammar_rules.js` **rilegge i JSON a ogni build e fallisce se compare un nome che non sta in nessuna delle due liste**. Era la causa vera del residuo: la stessa classe di difetti era già stata corretta nella 4.12.59, ma la lista scritta a mano non conteneva Irene, Monica, Paola, Roberta, Giorgia ed Elisa, quindi la regola sembrava attiva e non intercettava niente. Verificato togliendo `Irene` dalla lista: il controllo fallisce.
- lint(contenuti): due regole nuove, prezzo unitario `l'uno` con nome femminile e pronome `gli` con soggetto femminile comune (`una famiglia`, `una bambina`, `una maestra`), con i rispettivi esempi sbagliati e le frasi corrette che non devono scattare (`Un bambino... quanto gli rimane?`, `3 puzzle a 14 euro l'uno`).
- lint(contenuti): la regola dell'articolo mancante copre anche `Automobile`, `Fungo`, `Matita`.

### Notes
- il rilevatore dell'articolo mancante filtrava i nomi comuni per frequenza (`>= 3` occorrenze in minuscolo): con quella soglia `Automobile è un essere...` sfuggiva. Abbassata a 1, i candidati restano 3 su 629 righe grezze.

## 4.12.62 - 2026-09-06

### Fixed
- fix(quiz): **una partita poteva proporre due volte la stessa domanda**. Il ramo finale di `buildSessionQuestions` riempiva gli slot mancanti ciclando sul pool già usato (`rankedLoose[out.length % rankedLoose.length]`), ignorando `sessionUsed`. Da quando la fine partita si riconosce su `questions.length` (4.12.36) una sessione più corta è legittima, quindi il riempimento per ripetizione è stato tolto: meglio nove domande che due volte la stessa.
- fix(quiz): `sessionUsed` tracciava solo gli id, mentre la firma anti-ripetizione è `hash(domanda|risposta)`. Due domande con id diverso ma testo e risposta identici potevano quindi uscire nella stessa partita. Ora la firma entra nello stesso insieme con il prefisso `sig:`, e i rami di riempimento la controllano come l'id.
- fix(contenuti): **sei domande erano ripetute nella stessa classe** con la stessa risposta e distrattori diversi. Riscritte come esercizi distinti invece di essere cancellate, per non ridurre il banco: `What colour is the sky on a sunny day?` → `What colour is the grass?`, `Which animal lives in water?` → `Which animal has long ears?`, `Which food is a vegetable?` → `Which food is a drink?`, `Qual è il contrario di 'alto'?` → `di 'grande'?`, il nome astratto `felicità` → `coraggio`, e un triangolo con le stesse misure di un altro (base 17 → 19 cm, area 85 → 95).

### Changed
- test(e2e): il harness verifica che una partita non contenga due volte la stessa domanda. **La prima esecuzione ha fallito, e il difetto era nel test**: dopo ogni risposta aspettava 1100 ms mentre il gioco avanza a 2200 ms, quindi rileggeva la domanda precedente e la registrava due volte. Ora attende che il testo cambi davvero o che compaia la schermata bonus. Il ciclo si ferma anche se la sessione è più corta di dieci domande.

### Notes
- restano 9 firme duplicate fra **classi o materie diverse** (`Le Dolomiti fanno parte delle...` in geografia 4 e 5, le stagioni in scienze e storia): sono legittime, lo stesso concetto ripreso a livelli diversi, e ora il motore impedisce comunque che escano insieme.
- restano 18 testi di domanda ripetuti nella stessa classe ma con **contenuto diverso** (`Quale parola è scritta correttamente?` compare 5 volte in italiano classe 2 con parole diverse). Non sono duplicati: sono la stessa consegna applicata a esercizi diversi, una forma normale per l'ortografia. Non toccati.

## 4.12.61 - 2026-09-06

### Fixed
- fix(contenuti): **riscritti gli stem di 50 domande di civica** il cui testo non corrispondeva alle opzioni. Chiedevano un comportamento — `Se parli della libertà di una persona, qual è il comportamento corretto?` — mentre le opzioni erano definizioni: `non ha limiti` / `finisce quando danneggia i diritti degli altri`. Il bambino leggeva "cosa fai?" e doveva scegliere fra quattro descrizioni. Rilievo aperto dal lotto 3 della revisione linguistica.

### Changed
- La famiglia è fatta di **10 argomenti × 5 varianti** (libertà, democrazia, monumenti, ricorrenze civili, api e insetti utili, biodiversità, economia circolare, acqua bene comune, regole della strada, strada come spazio pubblico), e le 5 varianti di ogni argomento **condividono le stesse opzioni**: riscriverle tutte con la stessa formulazione avrebbe prodotto 5 domande identiche. Sono state quindi scritte **50 formulazioni distinte**, calibrate sul tipo di opzioni: definizione (`Che cos'è la biodiversità?`), scopo (`A che cosa servono le ricorrenze civili?`), comportamento dove le opzioni erano davvero azioni (`Qual è il comportamento corretto verso le api e gli insetti utili?`).
- Sei accoppiamenti sono stati rifiniti dopo una rilettura: `Su che cosa si fonda la democrazia?` con risposta `rispettare regole, diritti e partecipazione` chiedeva un nome e riceveva un infinito, ed è diventato `Quale atteggiamento è alla base della democrazia?`; `Quando funzionano davvero le regole della strada?` con risposta `funzionano meglio se tutti le rispettano` ripeteva il verbo della domanda.
- Una formulazione nuova collideva con una domanda già esistente in un'altra area (`Perché l'acqua è considerata un bene comune?`, presente in `civ-3-acqua-9090`): intercettata dal controllo duplicati e riformulata.

### Notes
- verificato che le riscritture non abbiano introdotto duplicati: 38 domande con testo identico esistevano già prima di oggi in tutto il corpus e sono **esattamente le stesse** dopo (nessuna aggiunta dalle conversioni dei sei lotti). Restano un rilievo aperto a sé, non affrontato qui.

## 4.12.60 - 2026-09-06

### Fixed
- fix(contenuti): **29 stem sospesi** ancora chiusi con il punto interrogativo (`La deforestazione può causare?`, `Un materiale trasparente lascia passare?`, `Una specie che rischia di scomparire si dice?`). Erano sfuggiti ai passaggi precedenti per due motivi distinti: il filtro escludeva le domande contenenti parole interrogative, e in `L'acqua **che** entra nel terreno… si chiama?` il `che` è un pronome relativo, non una parola-domanda; inoltre la lista di code non conclusive non copriva `si dice`, `si trova`, `può causare`, `lascia passare`.

### Notes
- lotto 6: 60 domande fra le 6.380 a scheletro unico; 359 revisionate. Nessun errore di grammatica: solo la coda della classe "frase sospesa", che sei passaggi non hanno ancora chiuso del tutto.
- **la conversione è stata fatta a mano, per elenco esplicito di 29 id, e non con una regola.** Il rilevamento automatico proponeva 44 candidati, di cui 15 erano domande legittime: `In quale mare sfocia il fiume Tevere?` finisce in `-ere` come un infinito, `Sull'autobus, a chi è giusto cedere il posto a sedere?` finisce davvero con un infinito ma è una domanda vera, `A cosa servono le tasse…?` apre con una parola interrogativa che il filtro non riconosceva in quella posizione. Nessuna espressione regolare separa i due gruppi: la distinzione è semantica, non di forma. Per questo non è stata aggiunta una regola nuova al linter — sarebbe stata rumorosa — e la classe resta chiusa solo per i casi trovati.

## 4.12.59 - 2026-09-06

### Fixed
- fix(contenuti): **29 problemi con protagonista femminile usavano il pronome maschile** — `Beatrice ha 114 euro… Quanto denaro **gli** rimane?`, `Sara compra 4 magliette. In cassa **gli** applicano uno sconto` → `le rimane`, `le applicano`. È l'errore più sostanziale trovato dai lotti dopo la famiglia del burro: il template è scritto al maschile e il nome viene sostituito senza riaccordare il pronome, esattamente lo stesso meccanismo degli articoli.
- fix(contenuti): 15 difetti di forma — 11 domande che terminano con `perché?` mentre sono le opzioni a completare la frase (`Le energie rinnovabili sono importanti perché?`), 2 stem `si trova allo stato?`, 2 domande con il carattere unicode `…` invece dei tre punti.

### Changed
- ci(contenuti): tre regole nuove in `lint_content.js` (22 in totale). Quella sul pronome elenca i nomi propri usati nel corpus: in italiano il genere del pronome dipende dal referente, e nessuna espressione regolare lo deduce dal testo — l'elenco è il prezzo da pagare per intercettare la classe.
- I due stem `Quando l'acqua diventa ghiaccio, si trova allo stato?` erano sfuggiti ai passaggi precedenti perché il filtro escludeva le domande contenenti parole interrogative, e `Quando` lì è temporale, non interrogativo.

### Notes
- lotto 5: 60 domande fra le 6.373 a scheletro unico; 299 revisionate. Contrariamente a quanto suggerivo dopo il lotto 4, questo giro ha prodotto una classe grammaticale vera e di dimensioni non banali. La revisione a campione non ha ancora esaurito il suo valore.

## 4.12.58 - 2026-09-06

### Fixed
- fix(contenuti): **65 difetti di forma** trovati dal lotto 4 di revisione, tutti cercati poi su tutto il corpus:
  - **43 domande con il doppio punto interrogativo** (`Quale terreno trattiene più acqua??`), quasi tutte in scienze classe 2.
  - **14 domande senza alcuna punteggiatura finale** — né `?` né puntini (`Se cade neve, il tempo è`, `I pesci respirano con le`). Chiuse con i puntini, come le altre frasi da completare.
  - **3 domande senza articolo a inizio frase** (`Pesce è un essere...`, `Nuvola`, `Farfalla`): stessa famiglia `sci-2-viventi` già corretta nella 4.12.54, ma con nomi che la regola non elencava.
  - **3 domande di civica alla persona sbagliata**: `quando partecipa a una videolezione` → `quando partecipi`, coerente con il resto della famiglia che usa la seconda persona.
  - **1 nota di redazione rimasta nel testo**: la spiegazione di `pro-5-due_operazioni-9147` conteneva `5400 - 3870 = 1530 posti liberi (non utile)`, cioè un calcolo scartato dall'autore lasciato in pagina davanti al bambino. Riscritta.
  - **1 punteggiatura doppia** `:...` in `geo-5-italia_europa-010`.

### Changed
- ci(contenuti): due regole nuove in `lint_content.js` (19 in totale) per il doppio `?` e per la domanda senza punteggiatura finale; ampliata la lista dei nomi che richiedono l'articolo. `check_grammar_rules.js` verifica 19 regole contro 20 frasi sbagliate e 18 corrette.

### Notes
- lotto 4: 60 domande fra le 6.375 a scheletro unico; 239 revisionate finora. Nessun errore di grammatica vera in questo lotto — tutti difetti di forma e una nota di redazione, il che è coerente con l'idea che gli errori grammaticali fossero concentrati nelle famiglie generate da template, già setacciate.

## 4.12.57 - 2026-09-06

### Fixed
- fix(contenuti): `pro-5-divisione-9214` aveva un accordo sbagliato fra soggetto e verbo — *"Quanti libri **va** in ogni scaffale?"* → *"vanno"*.
- fix(contenuti): altre **104 domande a frase sospesa** uniformate ai puntini, in una forma che i passaggi precedenti non coprivano: chiuse con un verbo o un avverbio invece che con una preposizione (`Il Sole scalda l'acqua e favorisce?`, `Con gli occhi possiamo?`, `La neve è acqua allo stato?`). Distribuzione: scienze 72, geografia 18, storia 12, civica 2, matematica 1.

### Notes
- lotto 3 di revisione linguistica: 60 domande fra le 6.379 a scheletro unico. 179 revisionate finora.
- **tre tentativi prima di trovare il criterio giusto**, e vale la pena scriverlo. Il primo (nessuna parola interrogativa nella domanda) convertiva 332 domande ma includeva `Prossimo numero: 1, 4, 9, ___?` e `Probabilità di ottenere testa o croce?`. Il secondo (ultima parola in una lista di parole "sospese") ne convertiva 242 ma rompeva `Quanti libri verdi ci sono?` e `Perché questa regola è utile?`, che finiscono con quelle stesse parole. Solo la **congiunzione dei due filtri** — nessuna parola interrogativa **e** ultima parola non conclusiva, con esclusione di `___`, domande alternative con "o" e opzioni sì/no — dà le 104 corrette. Ogni tentativo è stato annullato con `git checkout` e riverificato leggendo un campione delle conversioni prodotte, non fidandosi del conteggio.
- rilievo aperto, non corretto: **50 domande di civica hanno lo stem che non corrisponde alle opzioni**. Chiedono un comportamento (`Se parli della libertà di una persona, qual è il comportamento corretto?`) ma le opzioni sono definizioni (`non ha limiti` / `finisce quando danneggia i diritti degli altri`). Sono domande di conoscenza travestite da domande di comportamento: sistemarle vuol dire riscrivere lo stem (`Che cos'è la libertà di una persona?`), cioè riscrivere contenuto didattico, non correggere un refuso. Serve una decisione editoriale.

## 4.12.56 - 2026-09-06

### Fixed
- fix(contenuti): **quattro domande sulle sillabe mostravano la parola già divisa** — `Quante sillabe ha la parola 'ca-sa'?`, `'far-fal-la'`, `'stra-or-di-na-rio'`, `'pa-pa-ga-llo'` — cioè contenevano la risposta. Rimossi i trattini. Togliendoli è emerso un refuso che la sillabazione nascondeva: `pa-pa-ga-llo` è **papagallo** con una p sola; corretto in `pappagallo` insieme alla sillabazione nella spiegazione (`pap-pa-gal-lo`).
- fix(contenuti): altre **150 domande a frase sospesa** uniformate ai puntini, in due forme che il primo passaggio non copriva: 72 chiuse con un articolo o una preposizione articolata (`Il Monte Bianco si trova nelle?`, `Il Po è un?`) e 78 chiuse con un punto invece che coi puntini (`Il cuore batte dentro.`, `Le articolazioni collegano.`), queste ultime quasi tutte in scienze.

### Changed
- ci(contenuti): tre regole nuove in `lint_content.js`, che sale a 17. Le regole sulla frase sospesa valgono **solo sul testo della domanda**: nelle spiegazioni le stesse parole sono legittime, e applicarle ovunque produceva 20 falsi positivi (`molti dei` = gli dèi, `contiene GLI` = il gruppo di lettere, `tre A.` = la lettera). La regola sull'articolo finale è inoltre **sensibile alle maiuscole**, perché `Quale parola contiene il suono GLI?` cita un gruppo di lettere e non usa un articolo.

### Notes
- lotto 2 di revisione linguistica: 60 domande estratte fra le 6.381 a scheletro unico, escluse quelle del lotto 1. Registro dei lotti in `reports/revisione-linguistica.json`, generato da `scripts/sample_review_batch.py`, così i lotti successivi non ripetono le stesse domande.
- durante l'applicazione la conversione automatica ha **danneggiato una domanda** (`Quale parola contiene il suono GLI?` diventata `... GLI...`): trovata dal linter subito dopo, ripristinata, e la regola resa sensibile alle maiuscole perché non riaccada. È il motivo per cui ogni passaggio automatico su questi dati va seguito da una rilettura: le regole non sanno distinguere un articolo da una lettera citata.
- i 20 falsi positivi nelle spiegazioni e i 7 comandi legittimi (`Arrotonda 3,7 all'unità più vicina.`, `Tra queste parole, individua la preposizione semplice.`) sono stati esclusi leggendoli, non con una scorciatoia: `Se metti un cubetto di ghiaccio al Sole, può.` contiene un verbo all'imperativo ma è una frase sospesa, non un comando.

## 4.12.55 - 2026-09-06

### Changed
- contenuti: uniformate **157 domande a frase sospesa**, che finivano con una preposizione o una copula seguita da punto interrogativo (`Una password serve a?`), alla forma con i puntini già usata da 374 domande del corpus (`Le colline sono spesso adatte a...`). Distribuzione: scienze 104, geografia 24, storia 19, italiano 6, civica 2, matematica 1, problemi 1.
- **47 delle 204 intercettate non sono state toccate**, perché sono interrogative vere che finiscono con le stesse parole: tutte le `Quanti … ci sono?` dei problemi (34 casi), `Quale strumento usi per sapere che ore sono?`, `Quanti centimetri sono?`, `Che tipo di precipitazione c'era?`, `Che figura retorica è?`, `Il verbo 'mangerò' a quale tempo è?`. Convertirle tutte e 204 in blocco avrebbe rotto quasi un quarto delle domande intercettate: l'elenco delle esclusioni è stato letto voce per voce.

### Added
- ci(contenuti): nuova regola in `lint_content.js` (15 in totale) sulle domande che terminano con una **preposizione sospesa**. È una regola senza ambiguità: in italiano una domanda non può finire con una preposizione, quindi non richiede eccezioni. La copula resta deliberatamente fuori: lì il punto interrogativo può essere corretto (`Che ore sono?`), ed è esattamente il confine che ha richiesto la lettura manuale. Esempi aggiunti a `check_grammar_rules.js`, che ora verifica 15 regole contro 15 frasi sbagliate e 14 corrette.

## 4.12.54 - 2026-09-06

### Fixed
- fix(contenuti): 6 domande corrette, emerse dal lotto di prova sulla revisione linguistica. Due spiegazioni con participio non accordato (`10 lumache rimasti` → `rimaste`, `8 galline rimasti` → `rimaste`) e quattro domande di scienze che iniziavano con un nome comune senza articolo (`Gatto è un essere...` → `Il gatto è un essere...`, idem per albero, sasso e fiore).
- ci(contenuti): le due classi corrispondenti aggiunte a `lint_content.js`, che sale a 14 regole di accordo. Verificato reintroducendo `Gatto è un essere...`: la build fallisce.

### Notes
- lotto di prova: 60 domande estratte a caso (seme fisso 20260906) fra le 6.421 con scheletro unico, cioè quelle che nessuna regola di template può raggiungere, stratificate per materia e rilette una per una. **2 errori grammaticali** trovati nel campione, entrambi appartenenti a classi che una volta riconosciute si cercano su tutto il corpus: le due classi valgono 6 domande in totale, ora corrette. Tasso di errore osservato nel campione: 3,3% (2 su 60), che su 6.421 domande proietterebbe un ordine di grandezza di ~200 casi — ma la proiezione è debole, perché gli errori veri tendono a raggrupparsi in famiglie e le due trovate erano piccole.
- osservazione di stile, non corretta: 204 domande terminano con una preposizione o una copula seguita da punto interrogativo (`Una password serve a?`, `Il deserto è un tipo di?`), mentre 374 domande usano la stessa costruzione con i puntini di sospensione (`Le colline sono spesso adatte a...`). Le due forme convivono nel corpus e la maggioranza usa i puntini, che è anche la forma corretta per una frase da completare. Uniformarle è una scelta editoriale su 204 domande: non l'ho fatta di mia iniziativa.

## 4.12.53 - 2026-09-06

### Fixed
- fix(contenuti): corretti errori di grammatica in **69 domande** su tre materie (problemi, geografia, scienze). Segnalazione di partenza: una domanda vista giocando a Spacca-Muri diceva *"Una ricetta per 4 persone richiede 8 burro (in grammi). Quante burro (in grammi) servono per 16 persone?"*. Non era un caso isolato ma una firma: template scritti per un nome e riempiti con un altro, senza riaccordare articoli, participi e interrogativi.
  - 18 domande della famiglia "ricetta": `8 burro (in grammi)` → `8 grammi di burro`, `Quante burro` → `Quanti grammi di burro`, `farine` → `farina`, `latte (in ml)` → `millilitri di latte`. Corretti anche `explanation` e `bonusRaw`, che ripetevano l'errore.
  - 48 domande con accordo rotto: `Un borsa`/`il borsa scontato` → `Una borsa`/`la borsa scontata`, `Un zaino` → `Uno zaino`, `Un scarpe` → `Un paio di scarpe`, `Nella laboratorio` → `Nel laboratorio`, `nella aula` → `nell'aula`, `della giardino` → `del giardino`, `Quante biscotti/cioccolatini/panini/euro` → `Quanti …`, `nel fattoria` → `nella fattoria`, `un matita` → `una matita`.
  - 3 domande di scienze con participio non accordato: `è spesso fatto una finestra` → `fatta una finestra`, `fatto un chiave` → `fatta una chiave`.

### Changed
- ci(contenuti): `scripts/lint_content.js` ha ora 12 regole di accordo grammaticale, che girano su ogni domanda a ogni build. Coprono la classe di errore trovata: unità di misura tra parentesi, numero + nome non numerabile, `quanti/quante` in disaccordo, articolo o preposizione in disaccordo, mancata elisione, participio non accordato. Le esclusioni sono deliberate e verificate una per una: `sale` (nel corpus significa stanze), `moto` (il moto di rivoluzione in scienze), `zuccheri` (plurale legittimo in biologia), `caffè` (numerabile).

### Notes
- metodo: la ricerca non è stata fatta a campione. Ho normalizzato le 9.879 domande in "scheletri" (numeri → `#`, nomi propri → `NOME`) ottenendo 7.820 forme distinte, di cui 180 famiglie con almeno 3 occorrenze che coprono 2.133 domande: rivedendo un rappresentante per famiglia si intercetta ogni errore sistematico di template a costo quasi nullo, ed è così che sono emersi i casi oltre a quello segnalato. Poi ho estratto tutte le 1.749 coppie articolo-nome del corpus e le ho confrontate con un lessico di genere: 19 coppie sospette, di cui 3 false (`il moto`, `un moto`, `3 sale`) verificate a mano prima di toccare i dati. Restano 7.534 domande con scheletro unico, che questo metodo non copre: per quelle serve una revisione linguistica a tappeto, non deterministica.

## 4.12.52 - 2026-09-06

### Fixed
- fix(a11y): `/tabelline` era l'unica pagina del sito sotto 100 in accessibilità (96 su desktop). Causa: `.tab-card.is-soon { opacity: 0.72 }` sulle due card "video in arrivo". L'opacità sul testo lo mescola col fondo e ne abbassa il contrasto: titolo a **3,17:1** e meta a **2,74:1**, contro il 6,16 e il 5,13 dei token pieni — entrambi sotto la soglia AA di 4,5:1, e infatti Lighthouse segnalava esattamente 2 titoli + 2 meta. È lo stesso errore già corretto su `.footer-meta` nella 4.12.x: l'opacità è una scorciatoia che sembra innocua e rompe il contrasto in modo dipendente dalla superficie. L'aria "in arrivo" sta ora sull'immagine (`opacity` + `grayscale`) e sul bordo tratteggiato, che non sono testo. Misurato dopo il fix: titolo **5,79:1**, meta **4,73:1**.
- chore: bump versione `4.12.51` → `4.12.52`.

## 4.12.51 - 2026-09-06

### Fixed
- perf(lcp): l'animazione di entrata dell'`<header>` partiva da `opacity: 0`, e un elemento a opacità zero non è candidato LCP: la metrica slittava in avanti di tutta la durata dell'animazione. Il conto tornava esatto sulla home — FCP 528 ms + 900 ms di `bounceIn` = 1428 ms, contro i 1440 ms riportati da PageSpeed. Riguardava due keyframe, `bounceIn` (`index.css`, 0,9 s) e `popIn` (`subject-quiz-theme.css`, 0,7 s), ognuno con un solo utilizzatore: la regola `header` del proprio file. I `0%` partono ora da `opacity: .35` e da una scala già visibile; durata, curva e rimbalzo sono invariati.
- Misurato in locale prima e dopo, mediana di 3 run per pagina: home 968 → 64 ms, `/premi` 968 → 56 ms, `/faq` 756 → 40 ms, `/breakout` 732 → 44 ms. `/matematica` resta a ~490 ms perché il suo elemento LCP (`div.intro-note`) sta fuori dall'header animato, e `/tabelline` era già a 32 ms perché non ha animazioni di entrata — due controlli negativi che confermano l'attribuzione.
- In produzione le varianti misurate davano 1304 ms con il keyframe attuale e 444 ms partendo visibili, contro i 440 ms che si otterrebbero eliminando del tutto l'animazione: il guadagno è quindi l'intero costo, senza rinunciare all'effetto.

### Notes
- metodo: il primo giro di misure era invalido e dava tutte le varianti a ~1300 ms. Iniettavo il CSS di prova con un `<style>`, che in produzione la CSP blocca (`style-src` con hash), quindi misuravo quattro volte la pagina non modificata. Rifatto applicando le varianti alla risposta di rete di `index.css` e stampando a ogni run lo stato effettivo di `animation-name`/`animation-duration` come prova che la variante fosse davvero attiva.
- chore: bump versione `4.12.50` → `4.12.51`.

## 4.12.50 - 2026-09-06

### Fixed
- fix(aeo): `llms.txt` non rispettava il formato di llmstxt.org e PageSpeed lo segnalava ("Il file non sembra contenere link"). L'intestazione H1 c'era, ma gli URL erano testo nudo (`- Matematica: https://…`) invece di link markdown, quindi un modello che legge il file non trovava nulla da seguire. Convertiti 15 URL in `- [nome](url)` e aggiunta la descrizione alle 11 pagine principali, che è la parte su cui un modello decide se una pagina gli serve. Le due righe `Versione corrente`, di cui una è letta dal controllo di allineamento in `prepublish-check.sh`, sono rimaste nel formato atteso.

### Changed
- refactor(css): `.footer-support-cta` aveva due proprietari e se le contendeva a colpi di `!important`. `utilities.css` dichiarava `background:#FF3D00; color:#fff !important`, lo `<style>` iniettato da `shared.js` dichiarava `background:#fff !important; color:#5f6b7a !important`: vinceva il secondo perché iniettato dopo, quindi il bottone arancione descritto nel CSS non è mai esistito su nessuna pagina. Misurato prima dell'intervento, il CSS sopravviveva per tre sole proprietà (`min-height`, `font-size`, `font-weight`), tutto l'aspetto veniva dal JS. Il componente è ora definito solo in `shared.js`, che è anche il file che lo crea in `ensureSupportCta()`; le tre proprietà superstiti e le regole di hover sono state spostate lì, la regola in `utilities.css` è stata cancellata e **entrambi gli `!important` sono spariti**, perché non compete più nessuno.
- Verificato che il refactor non cambia nulla: 10 combinazioni pagina/palette (`index`, `premi`, `matematica`, `tabelline`, `faq` × standard e Okabe-Ito) confrontate su 26 proprietà calcolate, **zero differenze**. Hover verificato a parte: `translateY(-1px)` e `brightness(1.05)` attivi come prima, con l'annullamento su touch.
- chore: bump versione `4.12.49` → `4.12.50`.

### Notes
- L'`!important` resta legittimo dove serve davvero — i blocchi `prefers-reduced-motion` e `html[data-motion="reduce"]` in `tokens.css` lo usano per non essere negoziabili. Il caso di questo componente era l'opposto: due definizioni dello stesso selettore che alzavano il peso per vincersi a vicenda, invece di avere un proprietario solo.

## 4.12.49 - 2026-09-06

### Fixed
- fix(a11y): il cromo della home era rimasto al viola legacy `#9B5DE5`, che su bianco dà **4,13:1** — sotto la soglia WCAG AA di 4,5:1 per il testo normale. Riguardava l'hover dei link del footer e i link delle modali condivise, cioè anche i pulsanti dell'Info hub, che sono `<a class="info-hub-btn">` e ricadono nella stessa regola. Portati a `var(--subj-math-a)` (`#6e57a6`, **5,87:1**) sotto la guardia `html:not([data-palette="okabe-ito"])`. Vale per `index.html` e `/premi`, le due pagine che caricano `index.css`.

### Notes
- correzione(audit): la voce A8 diceva che la home usa una palette materia diversa dai token Wada Sanzo delle pagine quiz, con gli otto `--math-a`/`--eng-a`/… ancora ai valori vecchi. Non regge: il blocco "FASE 2" di `index.css` migra già tutte e dieci le card — gradienti, ombre e colore del pulsante — ai token `--subj-*` sotto la guardia della modalità standard. Misurato: `.card-math` rende `rgb(110, 87, 166)`, cioè `#6e57a6` Wada, non `#9B5DE5`. Le variabili legacy in `:root` restano come base per la modalità accessibile e come fallback, ed erano usate in standard solo dalle tre regole di cromo qui sistemate. La migrazione della home era quindi quasi completa; mancava il contorno, che però è anche l'unico punto dove il colore vecchio faceva danno.
- Modalità Okabe-Ito non toccata, come da vincolo: verificato in Chromium prima e dopo con `data-palette="okabe-ito"` — gradiente della card, colore del pulsante, hover del footer e link della modale identici (`rgb(0, 91, 144)`, `rgb(0, 114, 178)`).
- chore: bump versione `4.12.48` → `4.12.49`.

## Non rilasciato

### Changed
- ci(e2e): il job `smoke` sforava il limite di 12 minuti e veniva ucciso da GitHub ("The job has exceeded the maximum execution time of 12m0s", run 34017730437). Causa: le tre suite di regressione aggiunte fra la 4.12.36 e la 4.12.43 giravano su tutte e otto le materie, come `perfect`. Ma `ripassa`, `interrupt` e `dialogs` esercitano codice condiviso — `subject-quiz-core.js` e `shared.js`, identici per ogni materia — quindi sette delle otto esecuzioni erano ridondanza. Ora girano su due materie (`matematica` e `inglese`) tramite la variabile `E2E_SUBJECTS`, e il fan-out sui tre livelli di inglese resta solo su `perfect`, l'unico modo che verifica che ogni livello dichiarato sia giocabile. Cronometrato in locale: perfect 300 s, ripassa 108 s, interrupt 59 s, dialogs 9 s, circa 8 minuti in totale contro i circa 17 di prima. Limite del job alzato comunque a 20 minuti come margine.

## 4.12.48 - 2026-09-06

### Fixed
- fix(build): `scripts/refresh_structured_data.py` derivava il `dateModified` dei JSON-LD dall'mtime del file. L'mtime non dice quando il contenuto è cambiato: un clone, un `git checkout` di branch o un merge lo riportano all'istante corrente, quindi ogni cambio di branch faceva dichiarare "modificate oggi" tutte e 23 le pagine. Due conseguenze concrete: diffs di puro rumore da scartare a mano prima di ogni commit (successo due volte durante il merge su main di oggi), e date di modifica false verso Google su pagine il cui contenuto non era stato toccato. Ora la data viene dall'ultimo commit che ha toccato il file, con l'mtime usato solo per i file non ancora committati — che sono davvero in lavorazione adesso.
- La logica esisteva già, corretta, in `scripts/generate_sitemap.py` per il `lastmod` della sitemap. Estratta in `scripts/git_dates.py` e usata da entrambi, invece di copiarla: sono due script Python nella stessa cartella, un modulo condiviso non ha i vincoli di ordine di caricamento che hanno gli helper lato browser.

### Notes
- Verificato con `touch *.html` (mtime di tutte le pagine portato all'istante corrente) seguito da `npm run freshness`: zero file riscritti. Prima, la stessa sequenza riscriveva il `dateModified` di una ventina di pagine più il `lastmod` di `sitemap.xml`.
- chore: bump versione `4.12.47` → `4.12.48`.

## 4.12.47 - 2026-09-06

### Fixed
- fix(ci): lo script npm si chiamava `prepublish`, che è il nome di un hook di lifecycle di npm — deprecato dalla v5 ma **ancora attivo su npm 11**, dove parte a ogni `npm install` e `npm ci`. Verificato in isolamento con un `package.json` minimo: uno script `prepublish` viene eseguito da `npm install`, uno `check:prepublish` no. Conseguenza: `npm ci` eseguiva l'intero `prepublish-check.sh` dentro il passo di installazione — 187 righe del suo output finite nello step "Install dependencies" della run 34017730431 — e con esso il passo `freshness`, che riscrive i `dateModified` dei JSON-LD dai timestamp dei file. In CI il checkout dà a tutti i file l'mtime corrente, quindi tutte le pagine risultavano modificate; il controllo vero, eseguito subito dopo, trovava l'albero sporco e falliva il bump di `APP_VERSION`. Script rinominato in `check:prepublish`.
- La trappola era latente da prima e non l'ha introdotta il lint aggiunto in 4.12.36: da sempre un `npm install` in questo repo riscriveva in silenzio i `dateModified` di tutte le pagine. Era invisibile perché nessun workflow eseguiva `npm ci` prima di `prepublish-check.sh`; aggiungerlo per far girare eslint e stylelint ha reso il difetto osservabile.

### Changed
- ci: nuovo controllo in `prepublish-check.sh` che fallisce se `package.json` dichiara uno script con il nome di un hook npm (`preinstall`, `install`, `postinstall`, `prepublish`, `prepare`), cioè eseguito a ogni installazione. Verificato rimettendo il nome vecchio.
- chore: bump versione `4.12.46` → `4.12.47`.

## 4.12.46 - 2026-09-06

### Fixed
- fix(a11y): il toggle "riduci animazioni" del sito non fermava le figure decorative fluttuanti, né sulla home né su `/faq`. `js/index-page.js` e `js/faq-page.js` sono caricati **prima** di `shared.js` (ordine dei `defer`), e `shared.js` è l'unico a impostare `html[data-motion]` e a esporre `SA.motion`: valutando la condizione all'esecuzione del file, l'attributo non esisteva ancora e la scelta dell'utente veniva ignorata. Restava rispettata solo la preferenza di sistema. Il controllo è ora dentro la funzione di render, che gira dopo il `load`. Misurato in Chromium con `scuolaAmica_motion_v1` a `reduce`: prima 4 figure su entrambe le pagine, dopo 0 su entrambe; con `auto` restano 4, invariato.

### Notes
- correzione(audit): la voce di D metteva le due implementazioni come duplicazione da estrarre in `SADom.renderFloatingIcons`, notando che `faq-page.js` controlla `matchMedia` direttamente mentre `index-page.js` passa da `SA.motion.isReduced()`. La differenza c'era, ma non era quella il difetto: **nessuna delle due funzionava**, perché entrambe valutano la condizione troppo presto. Corretto il momento del controllo in entrambe; l'estrazione in un helper condiviso non è stata fatta — le due copie differiscono per container, classe CSS, set di icone e strategia di scheduling, e un helper con quattro parametri per due chiamanti è più codice di quello che toglie.
- chore: bump versione `4.12.45` → `4.12.46`.

## 4.12.45 - 2026-09-06

### Fixed
- fix(ingest): `scripts/ingest_generated.py` non era idempotente. Ogni riga riceve un id nuovo da `next_id()`, quindi l'id non proteggeva da niente e rilanciare lo script sullo stesso shard duplicava le domande in silenzio — un rischio finora mitigato solo dalla memoria di chi lo lanciava, con l'avvertenza scritta nel wiki. Ora salta le domande il cui testo normalizzato (spazi compattati, minuscole) è già nel dataset, riporta quanti duplicati ha saltato e, dopo un ingest reale, sposta gli shard processati in `reports/generated/ingested/`. Verificato in un worktree isolato con uno shard di prova: con la versione precedente due esecuzioni lasciavano la stessa domanda due volte, con questa la seconda aggiunge 0 righe e la domanda resta unica.

### Changed
- ci: i due `except Exception` silenziosi ora scrivono su stderr. `scripts/generate_sitemap.py` quando `git log` non è utilizzabile e ripiega sull'mtime del file; `scripts/refresh_structured_data.py` quando un blocco JSON-LD non è parsabile e viene lasciato intatto — in quel caso il blocco resta senza `dateModified` aggiornato e prima non lo segnalava niente.
- docs(wiki): documentati i sei script manuali (`dedup_questions`, `derive_math_difficulty`, `fill_math_subarea`, `normalize_difficulty`, `retag_problemi_areas`, `update_total_questions`), che non compaiono in `package.json`, nei workflow o nel wiki: nessuno sapeva più quando andassero lanciati. Tabella con cosa fa ognuno e quando serve, più la nota che `normalize_difficulty.py` inferisce la difficoltà dalla classe e va quindi seguito da `derive_math_difficulty.py` su matematica.
- chore: bump versione `4.12.44` → `4.12.45`.

## 4.12.44 - 2026-09-06

### Fixed
- fix(metriche): l'entry di qualità sessione registrava come `subject` la chiave del cursore invece del nome della materia su 5 pagine su 8. `cfg.subject` è dichiarato solo in `civica`, `problemi` e `inglese`, quindi le altre cinque ripiegavano su `cfg.cursorKey` e scrivevano `"matematica_programma_cursor_v3"`, `"geografia_cursor_v3"` e simili. Aggiunto il ripiego su `cfg.questionsSource.subject`, lo stesso ordine che `recordRewards()` usa già: un punto solo invece di cinque file di configurazione da allineare.

### Changed
- refactor: rimosso codice morto verificato con grep su tutti i 23 HTML e su tutti i moduli JS. `shared.js`: il ramo `SA.questionsLoader.loadIndex` (metodo che il loader non espone, condizione sempre falsa) e gli export `SA.modal`, `SA.palette` e `SA.renderQuestionsTotal`, senza un solo call site — le funzioni restano, usate internamente. `questions-loader.js`: `normalizeKey` e `clone` tolti dall'API pubblica, restano interni. `js/dom-utils.js`: `show`, `hide`, `toggleClass` e `restartAnimation` non erano chiamate da nessuna parte, e nemmeno la classe `.is-hidden` che le prime due gestivano veniva mai applicata da JS; il file passa da 40 a 21 righe e resta con le due funzioni realmente usate.
- refactor(rewards): la regola "sblocca la bacheca quando tutto il resto è sbloccato" era copiata in `recordGame()` e `recordBreakout()`. Estratta in `maybeUnlockBachecaPiena()`.
- refactor(index): `js/index-page.js` era l'unico `*-page.js` con variabili di pagina nello scope globale (`items`, `cont`, `isMotionReduced`). Wrappato in IIFE come tutti gli altri.
- chore: bump versione `4.12.43` → `4.12.44`.

### Notes
- correzione(audit): la voce che dava la chiave `subject:` come "morta e da rimuovere dai 3 file che ce l'hanno" era sbagliata. `cfg.subject` è letto in due punti di `subject-quiz-core.js`: l'entry delle metriche di qualità e l'etichetta materia del riepilogo progressi. Rimuoverla avrebbe degradato entrambi. Il difetto reale era l'opposto — la chiave manca dove servirebbe — ed è stato risolto nel consumatore invece che nei file di configurazione.

## 4.12.43 - 2026-09-06

### Fixed
- fix(privacy): "Cancella dati locali" non cancellava i dati di Breakout. La whitelist di `isProjectStorageKey()` elencava i prefissi storici più la chiave esatta `lascuolaamica_rewards_v1`, lasciando fuori `lascuolaamica_breakout_highscore_v1`, `_class_v1` e `_muted_v1`: la modale prometteva "progressi, classifiche e preferenze salvate su questo dispositivo" e l'alert confermava "Dati rimossi: N", ma il record del gioco era ancora lì al reload. Aggiunto il prefisso `lascuolaamica_`, che copre anche i reward e rende superfluo il confronto esatto. Verificato in Chromium: le tre chiavi seminate spariscono e il messaggio riporta "Dati rimossi: 6".
- fix(quiz): lo storico anti-ripetizione veniva scritto con un tetto e riletto con un altro. `pickQuestion()` lasciava crescere ogni bucket fino a `max(TOTAL_Q * RECENT_ID_SESSIONS * 3, pool.length * 4, 60)` — per un'area di matematica circa 1600 id — mentre `loadHistoryStore()` troncava a 300 al caricamento successivo. Alzare `cfg.recentIdSessions` oltre 30 non allargava la finestra anti-ripetizione: la tappava in silenzio a 300, e ogni sessione scriveva in `localStorage` id che il caricamento dopo buttava via. Ora c'è una sola costante `HISTORY_BUCKET_MAX`, usata sia dal cap in scrittura sia dallo `slice` in lettura (vale per entrambi gli store, id e signature, che passano dalla stessa funzione).
- fix(ui): l'errore "Non riesco a caricare le domande" passava da `showFeedback`, cioè l'overlay da 3.5rem con `white-space: nowrap` la cui animazione `fbPop` termina a `opacity: 0` dopo 1,2 s — il parametro `holdMs: 4200` non ha mai avuto effetto. Su un telefono da 390 px la frase da 55 caratteri occupa circa 1500 px e deborda da entrambi i lati. Ora usa il dialogo condiviso, che resta finché l'utente non lo chiude, con fallback al vecchio feedback se `shared.js` non è ancora stato eseguito (è caricato dopo `subject-quiz-core.js`).

### Changed
- test(e2e): il modo `dialogs` semina cinque chiavi di storage, esegue "Cancella dati locali" e verifica che non ne resti nessuna. Verificato togliendo il prefisso dalla whitelist: il test elenca le tre chiavi di Breakout rimaste.
- chore: bump versione `4.12.42` → `4.12.43`.

### Notes
- Il fix dell'errore di caricamento non è riproducibile end-to-end con i test attuali: bloccando `**/json/**` le pagine materia restano comunque giocabili perché portano un banco inline di riserva (48 domande su `/storia`), quindi `notifyLoadError()` non viene raggiunto. Il percorso è più raro di quanto stimasse l'audit; la modifica è comunque protetta da fallback.
- Durante la verifica di "Cancella dati locali" sulla revisione precedente al fix dello `z-index` (4.12.40) il click su "Sì, cancella tutto" andava in timeout, intercettato dalla modale Info: conferma indipendente che quel bug rendeva la funzione inutilizzabile.

## 4.12.42 - 2026-09-06

### Changed
- security(csp): la CSP dichiarava `require-trusted-types-for 'script'` senza la direttiva `trusted-types` che elenca le policy ammesse, quindi qualunque script poteva crearne una con un nome qualsiasi e passare da lì per i sink di script URL — metà della protezione. Aggiunto `trusted-types sa-sw-url sa-sw-import`, gli unici due nomi creati dal codice (`shared.js:993` e `sw.js:14`). Verificato applicando la CSP reale a `/matematica` in Chromium: service worker registrato e in controllo, zero violazioni; e con un nome di policy sbagliato nella direttiva il browser blocca la creazione, a conferma che il vincolo è davvero applicato e non decorativo.
- perf(breakout): `breakout.html` non precaricava `/json/index.json`, che `js/breakout.js` richiede comunque all'avvio della partita tramite `SA.questionsLoader`. Aggiunto il `preload`, come già fanno le 8 pagine materia.
- seo(premi): `premi.html` era l'unica delle 20 pagine indicizzabili senza `max-video-preview:-1` nella meta robots. Allineata.
- fix(html): 7 `href` YouTube in `tabelline.html` usavano `&` non escapato invece di `&amp;` nel separatore dei parametri.

### Notes
- non fatto: quattro voci minori dell'audit lasciate come sono, perché il cambiamento costerebbe più del difetto. `class="site-footer"` manca su `index.html` e `premi.html`, ma non esiste una regola `.site-footer` nei fogli che quelle due pagine caricano e `shared.js:349` interroga già `.site-footer, footer`: aggiungerla non cambierebbe nulla. Le classi `page-404`, `page-cookie` e `page-privacy` sul body non hanno regole CSS né riferimenti JS, ma sono hook di pagina innocui. Le FAQ di `/tabelline` usano `h3`/`p` invece del pattern `<details>` delle altre pagine: è una scelta di presentazione, e il markup è appaiato al JSON-LD `FAQPage` verificato. `/reports/*` non ha un `Cache-Control` esplicito in `_headers` a differenza di `/json/*`: asimmetria senza effetto pratico.
- chore: bump versione `4.12.41` → `4.12.42`.

## 4.12.41 - 2026-09-06

### Fixed
- fix(breakout): `js/breakout.js` aveva perso le chiamate a `debugWarn` nei wrapper di `localStorage`. Un `localStorage` che lancia (Safari in navigazione privata, quota piena) faceva fallire il salvataggio di record, classe e stato audio del gioco senza lasciare traccia nemmeno con `?debug`, mentre gli altri tre moduli lo segnalavano. Ripristinati `DEBUG_MODE` e `debugWarn`; le quattro copie di `storageGet`/`storageSet` sono ora byte-identiche.

### Changed
- ci: nuovo `scripts/check_storage_helpers.js`, in `prepublish-check.sh`, che confronta i blocchi `storageGet`/`storageSet` nei quattro moduli e fallisce se divergono. Verificato togliendo una riga da `js/breakout.js`.

### Notes
- non fatto(refactor): gli helper di storage **non** sono stati unificati in un modulo condiviso, come suggeriva l'audit (~101 righe duplicate su 4 file). `shared.js` è caricato per **ultimo** in tutte e 23 le pagine, dopo `subject-quiz-core.js`, `js/rewards.js` e `js/breakout.js`: non può esporre gli helper in tempo per il loro init. Un modulo dedicato richiederebbe un nuovo `<script>` in 23 pagine, una voce di precache e un vincolo di ordinamento su ogni pagina, per ~30 righe di codice stabile e senza dipendenze. Verificato inoltre che il presunto rischio funzionale non esiste: tutti e quattro i moduli condividono lo stesso `SA.memoryStorage`, e i namespace delle chiavi sono disgiunti (`scuolaAmica_*`, `subject_*`, `lascuolaamica_rewards_v1`, `lascuolaamica_breakout_*`). Il problema reale era solo la deriva silenziosa fra le copie, che ora il controllo impedisce.
- non fatto(perf): la memoizzazione di `getLevelScopedPool()` (M5 dell'audit: ~10.000 chiamate a `questionMatchesLevel` e ~20.000 regex per un tap sulla classe su `/inglese`) è stata **misurata prima di implementarla**, e non serve. Con Chromium: 0,4-2,3 ms per tap e 6,1 ms per "Inizia!" senza throttling; 2,9-14 ms per tap e 17,5 ms per "Inizia!" con CPU throttling 6x, che approssima un tablet scolastico vecchio. Il conteggio delle operazioni era corretto, la conclusione sul ritardo percepibile no: una cache qui sarebbe codice in più per un problema che non si misura.
- chore: bump versione `4.12.40` → `4.12.41`.

## 4.12.40 - 2026-09-06

### Fixed
- fix(ui): "Cancella dati locali" non era utilizzabile. `#modalPromptShared` viene creato al primo uso e finisce nel DOM **prima** di `#modalInfoHub`, creato dopo: a parità di `z-index: 500` vince l'ultimo, quindi l'Info hub copriva il dialogo di conferma e ne intercettava i click. Verificato con `elementFromPoint` sul centro del bottone "Annulla": l'elemento in cima è `.info-hub-actions`, non il bottone. Il bambino (o il genitore) vedeva la finestra Info sopra e non poteva né confermare né annullare. Trovato scrivendo il test del focus, non presente nell'audit. `#modalPromptShared` passa a `z-index: 600`.
- fix(a11y): il focus di ritorno delle modali era una variabile sola (`prevFocus`). Aprendo un dialogo da dentro un'altra modale il riferimento al primo veniva sovrascritto e poi azzerato: alla chiusura dell'esterna il focus restava su un bottone dentro un overlay ormai `aria-hidden="true"` e il browser lo scaricava su `<body>`. Chi naviga da tastiera o con screen reader tornava in cima al documento dopo ogni cancellazione dati, e l'alert successivo partiva da lì. Sostituita con una `Map` per id di modale.
- fix(ui): un secondo dialogo annullava silenziosamente il primo. Tutti i dialoghi condividono un overlay e `showPromptDialog()` risolveva il precedente come **rifiutato** per prendere il suo posto. Scenario reale: il bambino preme "Inizia!", si apre il confirm della finestra di gioco, e nello stesso momento il service worker rileva un aggiornamento e chiama `SA.ui.confirm('È disponibile una nuova versione…')`. Il primo confirm veniva risolto `false`, `ensurePlayWindowActive()` restituiva `false` e `startGame()` usciva senza dire niente: la partita non partiva e al suo posto compariva un dialogo che nessuno aveva chiesto. Ora i dialoghi si accodano FIFO.

### Changed
- test(e2e): `--dialogs` apre la modale Info, ne apre una annidata, la chiude e verifica che il focus torni sul bottone corretto in entrambi i livelli; poi lancia due `SA.ui.confirm` in sequenza e verifica che il primo resti a schermo, che il secondo compaia dopo, e che entrambe le promise si risolvano `true`. Ognuno dei tre fix è stato verificato reintroducendo il bug: senza la `Map` il test riporta il focus finito sul `<link>` di noscript, senza la coda riporta `SECONDO` mostrato al posto di `PRIMO`, senza lo `z-index` il click su "Annulla" va in timeout. Aggiunti il modo `dialogs` a `run_e2e.sh`, lo script `test:e2e:dialogs` e lo step nel workflow E2E.
- chore: bump versione `4.12.39` → `4.12.40`.

## 4.12.39 - 2026-09-06

### Fixed
- fix(a11y): le 10 pagine info (`accessibilita`, `ai-info`, `chi-siamo`, `cookie`, `per-genitori`, `per-insegnanti`, `privacy`, `supporta`, `supporto-satispay`, `tabelline`) ignoravano la preferenza di sistema "riduci il movimento". `info-pages.css` aveva solo il blocco `html[data-motion="reduce"]` del toggle interno, non il `@media (prefers-reduced-motion: reduce)`. Misurato con Chromium in `reducedMotion: 'reduce'`: `transition-duration` di un link passa da `0s` a `1e-05s` su `/tabelline` e `/supporta`. L'audit segnalava anche `/faq`, ma quella pagina eredita il blocco da `subject-quiz-theme.css` ed era già a posto.
- perf: `js/lazy-css.js` iniettava `rewards.css` (606 righe) su tutte e 23 le pagine, comprese `/404` e `/tabelline`, che non caricano `js/rewards.js` e non hanno una sola classe `reward-*`/`lb-card` nel markup. L'iniezione ora avviene solo se la pagina dichiara il `preload` di `rewards.css` nell'head, che è il segnale già presente sulle 21 pagine che ne hanno bisogno; rimosso il preload orfano da `tabelline.html`.
- perf: su `faq.html` i due preload dei font e `fonts.css` stavano dopo ~245 righe di JSON-LD, e su `tabelline.html` l'intero blocco CSS stava dopo quattro blocchi JSON-LD. Il parser doveva attraversare tutto il JSON prima di scoprire i font e i fogli render-blocking. Spostati sopra, con l'ordine reciproco invariato.

### Changed
- refactor(css): rimossi 96 righe di `@keyframes` duplicati da `inglese.css` (`popIn`, `slideUp`, `fbPop`, `resultBoom`, `mascotResultIn`, `mascotResultCelebrate`, `emojiWiggle`), verificati identici a quelli di `subject-quiz-theme.css` che `inglese.html` carica prima: erano scaricati e parsati due volte sulla stessa pagina.
- refactor(css): il reset universale era ridichiarato in `index.css`, `info-pages.css`, `subject-quiz-theme.css` e — nella sola parte `box-sizing` — in `404.css`. Verificato che ognuna delle 23 pagine eredita esattamente uno di quei quattro file, quindi spostarlo in `tokens.css` (l'unico foglio incluso ovunque, e il primo caricato) non cambia nulla per nessuna pagina.
- refactor(css): il componente `.footer-support-cta` era copiato in `index.css`, `info-pages.css`, `subject-quiz-theme.css` e — per l'override `@media (hover: none)` — anche in `inglese.css`, quarta copia che l'audit non aveva visto. Consolidato in `utilities.css`, incluso da tutte le pagine e caricato per ultimo. Nota emersa durante la verifica: `shared.js` inietta a runtime uno `<style>` che ridefinisce lo stesso selettore con `background`/`color` in `!important` e un border-radius a pillola, quindi buona parte di quelle regole CSS non era mai visibile. Le proprietà residue che restano effettive (min-height, font-size, font-weight, transition) ora valgono uguali su tutte le pagine: prima su `inglese.html` il `font-weight` risultava 800 invece di 900 perché `.footer-link` di `inglese.css`, caricato dopo il tema, vinceva a parità di specificità. Verificato con screenshot del footer prima/dopo: nessuna differenza visibile, il testo visibile sta in `.support-tag` che ha un peso proprio.
- refactor(css): anche i due blocchi di riduzione del movimento (`@media (prefers-reduced-motion: reduce)` e `html[data-motion="reduce"]`) erano copiati rispettivamente in 3 e 4 file. Ora stanno una volta sola in `tokens.css`, il che è anche ciò che chiude il buco delle pagine info.
- chore: bump versione `4.12.38` → `4.12.39`.

### Notes
- non fatto(css): `index.css` definisce una propria palette per le card della home (`--math-a` ecc.) diversa dai token Wada Sanzo di `tokens.css` (`--subj-math-a` ecc.) usati dalle pagine quiz, quindi i colori materia non coincidono tra home e pagina della stessa materia. Coerente con il commento "FASE 0" in `tokens.css`: sembra una migrazione a fasi ancora aperta, non una svista, e allinearla è una decisione di design, non una pulizia. Lasciata invariata in attesa di conferma.
- non fatto(css): `.q-explanation` (`subject-quiz-theme.css`) anima `max-height`, che non è compositabile e forza un reflow a ogni apertura, cioè dopo ogni risposta su tutte le 8 pagine quiz. È l'animazione più frequente del sito su una proprietà costosa, ma l'elemento è piccolo e la riscrittura (`grid-template-rows` o `scaleY`) cambia il rendering dell'apertura: va misurata prima, non cambiata al buio.

## 4.12.38 - 2026-09-06

### Fixed
- fix(pwa): i 3,9 MB di immagini premio venivano cancellati a ogni release. `REWARDS_CACHE_NAME` era `` `${CACHE_NAME}-rewards` ``, quindi ereditava `APP_VERSION`: al bump il nome cambiava e la regola di `activate` (`key !== CACHE_NAME && key !== REWARDS_CACHE_NAME`) eliminava la cache precedente. Scenario: il bambino sblocca dei trofei, apre `/premi` (57 file in `assets/reward/`, cache-first a runtime), poi va offline; esce una patch, riapre la pagina online una volta e alla successiva apertura offline le immagini sono tutte rotte — l'esatto contrario di quanto promette il commento in `sw.js`. Il nome è ora stabile (`lascuolaamica-rewards-v1`) e non dipende dalla versione.
- fix(pwa): ogni bump di versione ri-scaricava 2,82 MB di asset immutati (106 URL di precache misurati: 5 woff2, 15 file mascotte, 17 OG jpg da ~100 KB, screenshot, icone). Una patch di sola copy costava al tablet di classe l'intero precache. Font e immagini stanno ora in `ASSETS_CACHE_NAME`, una cache stabile che `activate` non tocca; `CACHE_NAME` resta versionata per HTML, CSS, JS e JSON.

### Changed
- decisione(pwa): i `json/*.json` **restano** nella cache versionata, benché siano la parte più pesante di quanto veniva buttato via (da 848 KB per scienze a 1,49 MB per matematica, fino a ~8 MB con tutte le materie aperte). Sono contenuto che cambia con le release: servirli stale significherebbe continuare a mostrare una domanda sbagliata dopo che è stata corretta. Il ri-download riguarda solo le materie effettivamente aperte, e la correttezza vale più della banda.
- pwa: il contratto delle cache stabili è che un file sia immutabile **per nome**. Per sostituirne uno si cambia il nome del file, oppure si alza il suffisso di `ASSETS_CACHE_NAME`. Questo era già implicitamente vero per `_headers`, che marca `/assets/*`, `/icons/*` e `/screenshots/*` come `immutable` per un anno pur senza hash nei nomi: un'immagine sostituita in place restava invisibile ai visitatori di ritorno fino a un anno, senza che niente lo segnalasse. Ora `prepublish-check.sh` blocca la modifica in place di un file `woff2|ttf|svg|png|jpg|webp|avif|ico` sotto quelle cartelle se `sw.js` non contiene anche un bump di `ASSETS_CACHE_NAME`, e il vincolo è scritto sia in `sw.js` sia in `_headers`. Di conseguenza `assets/*`, `icons/*` e `screenshots/*` escono da `relevant_paths` del controllo su `APP_VERSION`: per quei file il bump di versione non serviva più a niente.
- chore: bump versione `4.12.37` → `4.12.38`. Alla prima attivazione del nuovo service worker le cache vecchie vengono eliminate una volta sola, inclusa quella dei premi con il vecchio nome: il ri-download dei 3,9 MB avviene un'ultima volta e poi mai più.

## 4.12.37 - 2026-09-05

### Fixed
- fix(quiz): il timer di avanzamento da 2200 ms accodato da `checkAnswer()` non veniva mai annullato. Uscendo dal gioco entro quella finestra dopo l'ultima risposta, il timeout scattava comunque e chiamava `openBonusPick()`, riportando l'utente dentro una partita che aveva già lasciato. Due percorsi reali: la scadenza della play window (`handlePlayWindowExpired()` alza `playWindowExpiryLock`, chiama `goStart()` e apre l'alert "Tempo di gioco terminato", ma chiuso l'alert ci si ritrova sulla schermata bonus, si gioca il bonus e `finishGame()` salva il punteggio — **il limite parentale dei 30 minuti risultava aggirabile**); e il pulsante "🏆 Classifica" nella `.header-row`, che sta fuori dai `.screen` ed è quindi sempre cliccabile. Il timer è ora in `nextStepTimer` e viene annullato in cima a `showScreen()`: l'avanzamento differito appartiene alla partita in corso, quindi qualunque cambio di schermata lo invalida. Un solo punto invece di uno per ogni via d'uscita (`goStart()`, `showLeaderboard()`, `showLevelsScreen()` passano tutti di lì, come gli altri 9 chiamanti).
- fix(inglese): il livello 3 "Campione" era `disabled` e `.locked` per tutte e quattro le classi, con il title "Livello non disponibile". `questionMatchesLevel()` combina `subareas`, `areas` e `fallbackDifficulty` in AND, e il livello chiedeva `fallbackDifficulty: [4]` mentre `json/inglese.json` contiene solo difficoltà 1, 2 e 3 (214/439/441 domande): zero corrispondenze, `poolSize: 0`, `available: false`. L'intero percorso avanzato di inglese era irraggiungibile in produzione. Portato a `fallbackDifficulty: [3]`, che con gli stessi filtri di subarea e area seleziona 96 domande.

### Changed
- test(e2e): `--interrupt` risponde a tutte e dieci le domande, esce dal gioco subito dopo l'ultima e verifica che 3 secondi dopo la schermata attiva sia ancora quella di uscita. Con il timer non annullato il test fallisce con `schermata attiva "screenBonusPick"`. La prima versione del controllo usciva dopo la *prima* risposta e non vedeva niente: in quel punto il timer chiama `loadQuestion()`, che non cambia schermata. Il bug si manifesta solo all'ultima domanda.
- test(e2e): `scripts/run_e2e.sh` gioca ora tutti e tre i livelli di inglese, non solo il primo. Un livello i cui filtri non selezionano domande resta `disabled` e il click fallisce: è esattamente il modo in cui il livello 3 sarebbe stato intercettato prima di andare in produzione.
- chore: bump versione `4.12.36` → `4.12.37`. `subject-quiz-core.js` e `js/inglese-page.js` sono in precache cache-first.

## 4.12.36 - 2026-09-05

### Fixed
- fix(quiz): la sessione "Ripassa i tuoi errori" si piantava sull'ultima domanda. `startRipassa()` costruisce `questions` dagli errori accumulati (1-9 elementi), ma `checkAnswer()` riconosceva la fine partita con `curQ >= TOTAL_Q` (costante 10): dopo l'ultima risposta il timer da 2200 ms chiamava `loadQuestion()` su `questions[N] === undefined` e `AREA_LABELS[q.area]` lanciava un `TypeError` dentro il callback, lasciando la schermata di gioco congelata con tutti i bottoni `disabled`, senza risultato né punteggio salvato. Poiché `ensureRipassaBtn()` mostra il bottone già a partire da un solo errore, il crash colpiva ogni utente al primo ripasso. Introdotta `sessionLen()` (`Math.min(TOTAL_Q, questions.length)`) e usata come lunghezza reale della sessione in `buildDots()`, `updateDots()`, `updateScoreBar()`, nel meta "Domanda X di Y", nella guardia di fine partita e nel campo `total` salvato in classifica e in `recordGame()`. La stessa guardia proteggeva anche il caso di un pool filtrato che restituisce meno di 10 domande (`buildSession()` termina con `slice(0, TOTAL_Q)` ma può produrne meno).
- fix(quiz): il contatore del punteggio mostrava `/10` fisso anche durante un ripasso da 3 domande. Il totale è ora nello span `#scoreQnTotal` e viene scritto da `updateScoreBar()` sulle 8 pagine materia.
- fix(404): `404.html` aveva lo span `.footer-version` ma era l'unica delle 23 pagine a non caricare `app-version.js`: il numero di versione nel footer restava sempre vuoto.

### Changed
- ci: `.github/workflows/prepublish.yml` non ha mai eseguito `npm run lint`. eslint e stylelint erano installati, configurati e invocabili da `npm run verify`, ma nessun workflow li chiamava: la pipeline eseguiva solo `prepublish-check.sh` (che lancia il lint *linguistico* dei contenuti) e `audit_questions_json.js`. Prova che il buco era reale: stylelint segnalava un errore su `info-pages.css:423` mai intercettato. Aggiunti `npm ci` e `npm run lint` al workflow.
- lint(css): disattivata `selector-id-pattern` in `.stylelintrc.json`. Gli id di questo progetto sono camelCase perché sono gli stessi usati da `getElementById` nel JS (`scoreQn`, `qText`, `screenGame`): la regola kebab-case di `stylelint-config-standard` è in conflitto con la convenzione del DOM del progetto, come già `selector-class-pattern` (disattivata da tempo).
- ci: `prepublish-check.sh` e `scripts/refresh_structured_data.py` enumeravano le pagine HTML in liste hardcoded, già disallineate: `tabelline.html` e `breakout.html` (più `404.html`, `cookie.html`, `privacy.html`) non esistevano quando le liste sono state scritte, quindi saltavano in silenzio i controlli di integrità e sicurezza e l'aggiornamento di `dateModified` nei blocchi JSON-LD. Entrambi ora fanno glob di `*.html`, come già faceva `scripts/sync_csp_hashes.py`. `404.html` è esente dal controllo `<noscript>` tramite una lista di eccezioni esplicita e commentata: è una pagina statica che non dipende da JS.
- test(e2e): `scripts/subject_quiz_test_harness.js` accetta `--ripassa`, che dopo la schermata risultato gioca la sessione di ripasso fino in fondo e verifica che il numero di risposte contate a risultato coincida con le domande da rivedere. Con il bug il test fallisce in attesa di `#screenResult.active`. Aggiunto il modo `ripassa` a `scripts/run_e2e.sh` (sessione `mixed` seguita dal ripasso), lo script `test:e2e:ripassa` e lo step corrispondente nel workflow E2E, che gira su ogni PR.
- fix(ci): `prepublish-check.sh` falliva a ogni esecuzione dalla 4.12.31. `check_pwa_root_only_contract` cercava le stringhe letterali `navigator.serviceWorker.register('/sw.js', {` e `importScripts('/app-version.js')`, ma il commit `b228ac5` ha instradato entrambi i sink di script URL attraverso Trusted Types (`register(trustedScriptUrl('/sw.js'), …)` e `importScripts(url)` con URL da policy): il contratto era rispettato, il grep no. Il controllo ora verifica che gli URL restino `/sw.js` e `/app-version.js` alla radice invece della forma letterale della chiamata. Con `npm run lint` appena aggiunto al workflow, un check rosso in permanenza avrebbe reso indistinguibile un fallimento vero da quello di fondo.
- fix(ci): il controllo dei pattern pericolosi analizzava anche `graphify-out/` e `docs/graphify-out/`, output del tool graphify e non codice del sito, segnalando i suoi `innerHTML`. Aggiunti ai `-prune` del `find` (come `node_modules`, `.git`, `.lighthouseci`, `export`) e a `.gitignore`.
- fix(test): `scripts/run_e2e.sh` non partiva su macOS. Con bash 3.2 e `set -u`, `"${extra[@]}"` su array vuoto è un unbound variable: la suite era eseguibile solo nella CI Ubuntu. Usato `${extra[@]+"${extra[@]}"}`.
- chore: bump versione `4.12.35` → `4.12.36`. `subject-quiz-core.js` e le 8 pagine materia sono in precache cache-first: senza bump di `CACHE_NAME` i visitatori di ritorno continuerebbero a eseguire la versione con il crash.

## 4.12.35 - 2026-09-05

### Changed
- fix(seo): card "Tabelline" nella griglia della home, in seconda posizione dopo Cervellino Spacca-Muri. Nella 4.12.34 `/tabelline` era raggiungibile solo da un link dentro il paragrafo della sezione `seo-static` di `/matematica` e da una voce della lista in fondo alla home: entrambi sotto la piega e dentro blocchi di testo, quindi quasi invisibili agli utenti e con poco peso come segnale di importanza interna. Una pagina di destinazione per il traffico del canale YouTube non può dipendere da un link nel corpo del testo. Colore Ocra (`#96631a` → `#9c6a1b`), l'unica tonalità Wada Sanzo non ancora usata dalle altre nove card: testo bianco a 5,13:1 e 4,68:1 sui due estremi del gradiente, `.card-btn` a 5,13:1 su bianco. Token `--subj-tabelline-*` in `tokens.css` e regola sotto la guardia `html:not([data-palette="okabe-ito"])`, come le altre card; la modalità accessibile resta invariata.
- chore: bump versione `4.12.34` → `4.12.35`. `index.html` e `index.css` sono in precache cache-first: senza bump di `CACHE_NAME` i visitatori di ritorno vedrebbero la home senza la nuova card.

### Notes
- decisione(schema): `/tabelline` non è stata aggiunta all'`ItemList` `#subjects` della home. Quella lista dichiara le otto materie del sito e le tabelline sono un sottoinsieme di matematica, non una materia: includerla gonfierebbe `numberOfItems` con un doppione. Il collegamento resta espresso dal `BreadcrumbList` di `/tabelline` (Home › Matematica › Tabelline).

## 4.12.34 - 2026-09-05

### Added
- feat(seo): nuova pagina `/tabelline`. Il canale YouTube "Cecilia e il Papà Mattone" ha sette video sulle tabelline (dal 2 all'8, 1.181.000 impressioni e 6,52% di CTR al 5 settembre 2026) che linkano `lascuolaamica.it` in descrizione, ma sul sito le tabelline erano solo una sezione di `/matematica`, pagina che deve competere per cinque argomenti insieme e che genera 10 impressioni in tre mesi. La landing 1:1 dà una destinazione coerente al traffico del canale e un bersaglio unico alla query. Contenuto: tabella completa 2-10 in HTML statico, griglia delle nove copertine con link ai video nella playlist, procedura di allenamento e quattro FAQ. JSON-LD: `WebPage`, `BreadcrumbList` (Home › Matematica › Tabelline), `FAQPage` con testo identico a quello visibile, e un `ItemList` di sette `VideoObject` con `uploadDate` e `duration` reali letti da YouTube.
- feat(seo): collegamento reciproco sito ↔ canale. `sameAs` del canale in `EducationalOrganization` (`index.html`) e in `ORG_SAME_AS` di `refresh_structured_data.py` perché sopravviva alla rigenerazione; link "Video su YouTube" nel footer di tutte le pagine; sezione "Canale YouTube" in `llms.txt` e `/ai-info`.
- chore(assets): nove copertine convertite in WebP 640x360 (~20 KB l'una, `loading="lazy"`) e `og-tabelline-1200x630.jpg` come montaggio 3x3 delle stesse copertine.

### Changed
- feat(ux): deep link `?area=<key>` in `subject-quiz-core.js`. Serviva perché il link dalla descrizione dei video aprisse direttamente le tabelline invece del menu degli ambiti. Implementato nel core e non in `matematica-page.js` per non violare il vincolo "nessun ramo specifico per materia": vale per ogni pagina materia. Chiave sconosciuta o non disponibile per la classe selezionata: `normalizeSelectedAreaForClass()` ricade su `mixed`, comportamento invariato.
- chore: bump versione `4.12.33` → `4.12.34`. `/tabelline` entra in `OPTIONAL_PRECACHE_URLS` di `sw.js` con strategia cache-first: senza bump di `CACHE_NAME` i visitatori di ritorno non riceverebbero la nuova pagina.

### Notes
- decisione(privacy): i video sono presentati come copertina più link, non come `<iframe>`. La CSP del sito è `default-src 'self'` senza `frame-src`, quindi l'embed richiederebbe di aprirla a `youtube-nocookie.com`, in contraddizione con il claim "nessun tracker di terze parti" dichiarato in `llms.txt` e `/per-genitori`. Conseguenza accettata: senza player in pagina Google non assegna i video rich result a `/tabelline` e Search Console può segnalare "video non trovato nella pagina". Lo schema `VideoObject` resta perché descrive correttamente risorse referenziate e non comporta penalizzazione. Soglia di riapertura: se il canale supera i 100 clic/mese verso il sito, valutare una facciata click-to-load (nessuna richiesta a YouTube prima del clic) più una riga di `frame-src`.
- decisione(seo): i link esterni restano in stessa scheda. Il gate di `prepublish-check.sh` impone `rel="noopener noreferrer"` su ogni `target="_blank"`, e `noreferrer` azzererebbe il referrer: YouTube Analytics registrerebbe il traffico dal sito come "diretto", rendendo non misurabile proprio la direzione sito → canale.
- verifica: `PLHctzIjd-9Qg` è un ID playlist valido (risponde, titolo "Tabelline con CalcOlettore, dalla 2 alla 10"), contrariamente alla nota "DA VERIFICARE" nel foglio di lavoro delle descrizioni YouTube.

## 4.12.33 - 2026-08-27

### Changed
- feat(seo): riscritti `title`/`description` di `/civica`, `/storia`, `/scienze`, `/geografia`, `/italiano` passando da head keyword generiche a long-tail già presenti nei dati GSC. L'analisi dell'export Search Console 25 mag-24 ago 2026 (909 impressioni, 37 clic) mostra che `/inglese` e `/civica` producono l'81% dei clic e che l'unica differenza strutturale fra le pagine è il `title`: le sei pagine materia sono identiche per template, lunghezza (~1200-1400 parole) e dataset (~1100 domande), ma `/inglese` è l'unica con un titolo che fa match esatto su una long-tail a bassa concorrenza (`100 domande in inglese per bambini`, pos. 4,86) invece del pattern generico `Esercizi di X | Scuola Primaria Gratis`, che compete con schede didattiche PDF consolidate. Titoli scelti sui cluster con più impressioni reali: `/civica` sui cluster `test`(18 impr.) + `domande ... con risposte`(13), fermi a pos. 21-29 e quindi la distanza più corta recuperabile del sito; `/storia` su `giochi di storia scuola primaria`(11, pos. 43,8), la cui SERP premia contenuti interattivi e non PDF; `/scienze` su `esercizi di scienze`(pos. 21, già 1 clic) con il sottotema `viventi e non viventi` che domina la SERP; `/geografia` e `/italiano` su `carte geografiche` e `grammatica`. Allineati per ogni pagina tutti gli 8 punti di contatto (`title`, `meta description`, `og:title`, `og:description`, `twitter:title`, `twitter:description`, `name` e `description` del JSON-LD), tutti i `title` sotto i 60 caratteri e le `description` sotto i 158.
- feat(seo): `description` di `/inglese` riscritte su "oltre 100 domande con risposte". La SERP delle query che portano traffico alla pagina (`domande semplici in inglese per bambini`, 15 impr. a pos. 8,47 con 0 clic) è dominata da liste di domande (`70 domande`, `54 domande`, lapbook), non da quiz: la pagina intercetta un intento di tipo "lista" con un'interfaccia a quiz, e lo snippet che prometteva solo "quiz" non convertiva nonostante la prima pagina. Claim verificato: il dataset contiene 1094 domande e la pagina ha già un `<h2>` "100 domande in inglese per bambini". Il `title` di `/inglese` è stato lasciato invariato di proposito: è l'asset che porta 20 dei 37 clic del trimestre, il rischio di regressione supera il beneficio atteso.
- chore: bump versione `4.12.32` → `4.12.33`. Le pagine materia sono in `OPTIONAL_PRECACHE_URLS` di `sw.js` con strategia cache-first: senza bump di `CACHE_NAME` i visitatori di ritorno continuerebbero a ricevere l'HTML con i vecchi metadati.

### Added
- chore(seo): archiviati in `lascuolaamica.it-audit/gsc/2026-08-27/` gli export Search Console (Coverage + Performance) e uno snapshot `onpage-baseline.txt` dei metadati pre-modifica, per poter misurare l'effetto della riscrittura a metà ottobre. Senza baseline il confronto post-stagionalità non sarebbe attribuibile.

### Notes
- decisione(seo): nessun investimento di contenuto su `/geografia` (pos. media 42,5) e `/italiano` (39,7) oltre alla riscrittura dei metadati. Da posizione 40+ l'on-page non recupera, e le rispettive SERP premiano un tipo di pagina che il sito non ha (schede PDF stampabili con soluzioni, analisi grammaticale). Soglia di riapertura: riconsiderare solo se la posizione media scende sotto 25 spontaneamente.
- decisione(seo): `/matematica` esclusa dalla riscrittura. Ha il dataset più grande del sito (1934 domande) e genera 10 impressioni in tre mesi: è un'anomalia da diagnosticare a parte, non un problema di `title` da coprire con una modifica di copy.
- analisi(seo): i "problemi critici" segnalati da Search Console sono tutti attesi e non richiedono intervento — le 12 "Pagina con reindirizzamento" sono i vecchi URL `.html` che fanno 301 corretto ai clean URL (verificato in produzione), le 3 `noindex` sono intenzionali, l'unico 404 è `villaggio.html`, pagina legacy già presente nell'export di aprile. Indicizzazione reale: 18 pagine su 20 in sitemap.
- analisi(seo): il calo percepito nel trimestre non è un calo. Posizione media migliorata da 21,1 a 16,8 fra il primo e l'ultimo blocco di 23 giorni, impressioni piatte (~9-11 al giorno); la differenza 14 → 10 clic fra gli ultimi due periodi di 28 giorni è rumore statistico a questi volumi, su un sito scolastico misurato in piena pausa estiva. La verifica va rifatta a metà ottobre, filtrando per Italia: ~110 impressioni da India, Indonesia, Vietnam e Filippine a pos. 43-45 inquinano la posizione media aggregata (14,7 Italia contro 16,0 complessiva).

## 4.12.32 - 2026-08-25

### Fixed
- fix(perf): CLS mobile fuori soglia (`/chi-siamo` 0.254 Poor, home 0.105) causata dal footer condiviso — `#questionsTotalCount` parte con l'attributo HTML `hidden` (footprint zero) e viene popolato da `renderQuestionsTotal()` (`shared.js`) dopo il paint iniziale, a larghezza mobile lo span andava a capo su più righe cambiando l'altezza del footer. Riservato lo spazio in CSS (`#questionsTotalCount[hidden]{display:inline-flex!important;visibility:hidden;min-width:22ch}` in `index.html`/`info-pages.css`, l'unico override necessario dato che `.footer-version` era già dimensionato via `.footer-link`) — verificato che il box riservato coincide con quello popolato (0px di shift su `/chi-siamo` mobile).
- fix(schema): testo `FAQPage` non combaciava col testo visibile su matematica/geografia/storia/italiano (3 risposte per pagina, item 5-7 espansi nello schema oltre il testo dell'HTML) — allineato lo schema al testo visibile 1:1 su tutte e 4 le pagine.
- fix(schema): `problemi.html` aveva 11 `<details>` visibili ma solo 7 in `FAQPage` — i 4 extra sono esempi svolti (uno per classe), non FAQ, correttamente esclusi dallo schema ma riusavano la classe `seo-faq-item` facendoli apparire come voci FAQ. Rinominati in `seo-example-item` (stile identico via selettore condiviso in `subject-quiz-theme.css`), nessun cambio visivo.
- fix(perf): trovato in test su iPhone reale — `body.info-page .wrapper` riservava solo 132px di padding-bottom per il footer fisso, ma su `/chi-siamo` (footer con più voci: contatore domande + CTA supporto) il footer va su 3 righe (169px reali), 37px in più dello spazio riservato. Il footer sovrapponeva il pulsante "Torna alla home", tagliandone il testo. Bug preesistente, indipendente dal fix CLS di questa release (stesso stato finale prima e dopo). Portato il padding a 190px con margine di sicurezza.

### Added
- feat(seo): prima immagine di contenuto del sito — anteprima gameplay di `/breakout` inserita nella sezione descrittiva della pagina, riusando l'asset `og-breakout-1200x630.jpg`. Copre il gap "zero immagini di contenuto" segnalato dall'audit SXO/visivo per la pagina più urgente. Aggiornato lo screenshot stesso in due passaggi: prima ricatturato dal gioco live perché mostrava ancora i mattoni piatti pre-restyling invece dell'attuale stile "candy"; una seconda ricattura ha poi ristretto l'inquadratura al solo riquadro di gioco (muro completo, pallina, barra, bordi), la prima versione tagliava a metà l'area vuota sotto il muro senza mostrare pallina/barra.

### Changed
- chore: bump versione `4.12.31` → `4.12.32` (CSS precachate in `sw.js` modificate: `subject-quiz-theme.css`, `info-pages.css`; bump di `CACHE_NAME` necessario).

## 4.12.31 - 2026-08-25

### Fixed
- fix(sw): `require-trusted-types-for 'script'` (introdotto in 4.12.29) blocca `navigator.serviceWorker.register()`/`importScripts()` quando riceve una stringa semplice invece di un `TrustedScriptURL` — sono entrambi "script URL sink" secondo la spec Trusted Types. Trovato durante un audit tecnico SEO in produzione (console: `This document requires 'TrustedScriptURL' assignment. The action has been blocked.`), non nei test locali dove la CSP non veniva applicata. Effetto reale: il Service Worker non si registrava più su nessun nuovo visitatore dal deploy del 16 luglio — funzionamento offline e precache silenziosamente disattivati per ~5 settimane, senza errori visibili all'utente (il sito restava comunque utilizzabile online, solo senza PWA/offline).
- fix(sw): `shared.js` crea una policy Trusted Types minima (`createScriptURL` identità, nessun input esterno: l'URL è sempre il letterale `/sw.js`) prima di chiamare `register()`. `sw.js` applica la stessa correzione al proprio `importScripts('/app-version.js')`, dato che la CSP si applica anche alla risposta HTTP di `sw.js` stesso (`_headers` usa `/*`). Fallback silenzioso alla stringa semplice se `window.trustedTypes`/`self.trustedTypes` non è disponibile (browser che non supportano Trusted Types ignorano comunque la direttiva `require-trusted-types-for`).
- chore(sitemap): `/breakout` era stata aggiunta a mano solo in `sitemap.xml`, non nella lista `PAGES` di `scripts/generate_sitemap.py` — al prossimo rilancio dello script sarebbe sparita silenziosamente. Rigenerata con date `lastmod` reali da git invece che a mano.
- chore(seo): sitemap risottomessa a Search Console via API (20 URL, zero errori); URL Inspection su `/breakout` conferma robots/canonical/meta corretti (non ancora indicizzata da Google, atteso per una pagina pubblicata lo stesso giorno). Richiesta di indicizzazione diretta via Indexing API non riuscita: l'account di servizio SEO non ha permessi da Proprietario su Search Console (serve intervento manuale dell'utente se lo si vuole abilitare).

### Changed
- chore: bump versione `4.12.30` → `4.12.31` (`sw.js` modificato, bump di `CACHE_NAME` necessario per far ripartire la registrazione sui client che l'avevano già persa).

## 4.12.30 - 2026-08-25

### Added
- feat(breakout): nuova pagina `/breakout` — gioco arcade "Cervellino Spacca-Muri" ispirato a Breakout/Arkanoid, motore Canvas 2D vanilla in `js/breakout.js` (nessuna dipendenza nuova). Barra/pallina/muro di 8 file (4 fasce colore, 1/3/5/7 punti), 3 vite, velocità progressiva (dopo 4 colpi, poi altri 12, poi al contatto con le due fasce più alte), barra dimezzata permanentemente per la vita corrente se la pallina sfonda il muro superiore. Frecce da desktop, drag touch da mobile/tablet, sotto-passi di fisica dimensionati sul raggio pallina per evitare tunneling ad alta velocità.
- feat(breakout): le domande di bonus e salva-pallina pescano dallo stesso pool delle 8 materie (`json/*.json` via `questions-loader.js`), filtrato per la classe scelta a inizio partita; pool mescolato e consumato senza ripetizioni nella sessione, ricaricato solo al cambio classe.
- feat(breakout): 4 bonus (barra larga, +1 vita, distruggi un colore, pallina appiccicosa) — la capsula che cade va presa con la barra ma si attiva solo rispondendo bene a una domanda, altrimenti va persa; ogni bonus temporizzato (15s, countdown a schermo) si può riattivare per estendere la durata. Se la pallina cade, una domanda a sorpresa la riattacca alla barra prima di scalare una vita, disponibile a ogni pallina persa.
- feat(rewards): 10 trofei dedicati a Cervellino Spacca-Muri in `js/rewards.js` (`recordBreakout`), sotto-stato separato dai contatori materia nello stesso `STORAGE_KEY` — giocare al gioco non altera "partite totali"/"materie giocate" dei trofei quiz. Registrazione progressiva (muro abbattuto, salvataggio, nuovo bonus scoperto), non solo a fine partita: sistemati tutti i varchi che facevano perdere il progresso (Ricomincia, Cambia classe, timer scaduto, cambio scheda) tramite `flushBreakoutProgress()` con invio a delta, idempotente sul conteggio partite.
- feat(a11y): overlay domanda con focus trap completo (Tab/Shift+Tab intrappolati, focus iniziale sulla prima opzione, ripristino del focus precedente alla chiusura) — la sola `aria-modal` non basta, i browser non impediscono a Tab di uscire dal dialog.
- feat(seo): `BreadcrumbList` e `FAQPage` JSON-LD su `/breakout` (5 domande, testo `<details>` e schema allineati 1:1), sezione dedicata in `llms.txt`, card in homepage.
- style(breakout): mattoni/pallina/barra ridisegnati in stile "candy" (gradienti pre-renderizzati su canvas offscreen, riusati via `drawImage` — più leggero del ridisegno per-frame precedente), occhietti sulla barra che seguono la pallina, capsule colorate per tipo, particelle e punteggio volante alla distruzione di un mattone, squash/stretch su pallina e barra agli urti. Tutti gli effetti decorativi rispettano il toggle "riduci animazioni" del sito e `prefers-reduced-motion`; la fisica di gioco non è mai interessata.
- style(breakout): palette mattoni dal registro Wada Sanzo (Sea Green/Blue/Orange Yellow/Jasper Red) più vivace dei token testo del sito — lecito perché i mattoni sono grafica di gioco (WCAG 1.4.11, soglia 3:1 non-text), non testo. Introdotti token separati `--breakout-feedback-ok`/`-ko` per l'overlay domanda (dove il colore fa da sfondo a testo bianco, resta ≥4.5:1) e varianti scurite per punteggio volante/simbolo capsula, per non ereditare i colori mattone ora troppo chiari in quei contesti testuali. Modalità Okabe-Ito invariata: stessi 4 colori certificati di prima.

### Fixed
- fix(a11y): `border-radius` del pulsante "Continua" nell'overlay domanda veniva schiacciato da una regola `:focus-visible` globale ogni volta che il pulsante riceveva il focus automatico — dichiarato un `border-radius` esplicito in `breakout.css` (che carica dopo, stessa specificità) per vincere la cascata.
- fix(ux): popup "nuovo premio" (`rewards.css`, posizionato in basso su tutte le pagine) cadeva sopra la barra di gioco su `/breakout`, dove il canvas riempie gran parte dello schermo — override scoped a `body.subject-breakout` che lo sposta in alto.
- fix(content): refuso "decomponitori" → "decompositori" in una domanda di scienze (`json/scienze.json`); refuso "righell" → "righello" ripetuto in 7 domande di problemi (`json/problemi.json`), stesso template generato.

### Changed
- chore: bump versione `4.12.29` → `4.12.30` (nuova pagina `/breakout` aggiunta a `OPTIONAL_PRECACHE_URLS` di `sw.js` insieme a `breakout.css`/`js/breakout.js`; bump di `CACHE_NAME` invalida automaticamente la cache di chi aveva già visitato il sito prima del rilascio).

## 4.12.29 - 2026-07-16

### Changed
- chore(admin): rimossa la cartella `admin/` (editor esercizi interno con auth token client-side) — non era mai in `OPTIONAL_PRECACHE_URLS`/deploy pubblico (già escluso da `export_for_cloudflare.sh`), nessun link nel sito la referenziava. Rimossi anche i riferimenti dead in `README.md`, `docs/wiki/Architettura.md`, `_headers` (`/admin/*`) e `scripts/export_for_cloudflare.sh` (`--exclude 'admin/'`, ora superfluo).
- perf(shared): `UPDATE_LOG` (30KB, 32% di `shared.js`) estratto in `json/changelog.json`, caricato via `fetch` lazy solo al click su "Ultimi aggiornamenti" invece di essere bundlato ed eseguito su ogni page load. `shared.js` passa da 95KB a 65KB. `scripts/check_update_log.js` e `scripts/audit_questions_json.js` aggiornati per il nuovo formato.
- security(headers): CSP `require-trusted-types-for 'script'` (codebase già a zero `innerHTML`/`insertAdjacentHTML`), `preload` su HSTS, regola eslint `no-restricted-properties` per vietare `innerHTML`/`insertAdjacentHTML` e prevenire regressioni.
- chore: bump versione `4.12.28` → `4.12.29` (nessuna pagina in `OPTIONAL_PRECACHE_URLS` impattata: cambi su file core già in `CORE_PRECACHE_URLS` di `sw.js`, invalidati automaticamente dal bump di `CACHE_NAME`).

## 4.12.28 - 2026-07-06

### Changed
- style(privacy): `.updated-note` (nuova classe in `info-pages.css`, usata da `privacy.html` e `cookie.html`) aggiunge `margin-top: 24px` al paragrafo "Ultimo aggiornamento", che risultava troppo attaccato al paragrafo precedente (blocco "Bambini" in privacy, "Come cancellare i dati" in cookie) — nessuna regola di spaziatura dedicata esisteva prima in `.modal-body p`.
- chore: bump versione `4.12.27` → `4.12.28` (`/privacy` e `/cookie` in `OPTIONAL_PRECACHE_URLS` di `sw.js`, contenuto/CSS modificato).

## 4.12.27 - 2026-07-06

### Changed
- content(privacy): `per-genitori.html` — aggiunto rimando contestuale a `Privacy Policy` e `Cookie Policy` nella sezione "Sicurezza e privacy" (prima i link erano solo nel footer), dove il genitore legge dei temi privacy; così la sfumatura sui dati tecnici del provider è a un clic. Allineata la formulazione del primo bullet ("nessun dato personale raccolto" → "…tramite le funzionalità del sito") a quella delle policy corrette in 4.12.26.
- chore: bump versione `4.12.26` → `4.12.27` (`/per-genitori` è in `OPTIONAL_PRECACHE_URLS` di `sw.js`, contenuto modificato).

## 4.12.26 - 2026-07-06

### Changed
- content(privacy): revisione di conformità GDPR/ePrivacy di `privacy.html` e `cookie.html` (sito rivolto a minori). Aggiunta la sezione **Titolare del trattamento** con identità (Mattia Boero) e contatto (`supporto@lascuolaamica.it`), assente prima e richiesta dall'Art. 13 GDPR. Riformulato "non raccoglie dati personali" (troppo assoluto): esplicitato che l'hosting **Cloudflare** può trattare dati tecnici come l'indirizzo IP nei log del server per sicurezza/erogazione, in qualità di responsabile, con garanzie adeguate (Clausole Contrattuali Standard) per trasferimenti extra-UE. Aggiunta sezione **Bambini** (Art. 8 GDPR non applicabile in assenza di trattamento su consenso → nessun age-gate; invito ai genitori). In `cookie.html` esplicitato che `localStorage` è tecnico e strettamente necessario → esente da consenso, nessun banner richiesto; aggiunto rimando ai dati tecnici del provider. Aggiunta data "Ultimo aggiornamento" visibile su entrambe e `dateModified` JSON-LD → `2026-07-06`.
- chore: bump versione `4.12.25` → `4.12.26` (`/privacy` e `/cookie` sono in `OPTIONAL_PRECACHE_URLS` di `sw.js`, contenuto modificato).

## 4.12.25 - 2026-07-05

### Changed
- content(seo-audit): risolto finding "Low" da audit SEO — meta description di `chi-siamo.html` era 153 caratteri, vicina alla soglia di troncamento SERP (~155-160). Accorciata a 137 caratteri mantenendo parole chiave e senso ("Chi siamo: La Scuola Amica è una piattaforma educativa gratuita per la scuola primaria. Missione, metodo didattico e principi di privacy."). `og:description`/`twitter:description`/JSON-LD `description` restano invariate (già distinte e non impattate).
- chore: bump versione `4.12.24` → `4.12.25` (`/chi-siamo` è in `OPTIONAL_PRECACHE_URLS` di `sw.js`, contenuto modificato).

Con questo si chiudono tutti i finding aperti dell'audit SEO del 2026-07-05 (vedi `lascuolaamica.it-audit/`): 5 fix consegnati in giornata (render-blocking CSS, regressione CLS, parità FAQ civica, indicizzazione GSC di 3 URL richiesta manualmente, meta description chi-siamo).

## 4.12.24 - 2026-07-05

### Added
- content(seo-audit): risolto finding "Medium" da audit SEO — `civica.html` aveva solo 4 coppie FAQ Question/Answer contro le 7-8 delle pagine materia gemelle (matematica, inglese, ecc.), profondità inconsistente nel cluster subject. Aggiunte 3 nuove FAQ (classe minima per iniziare, possibilità di scegliere un singolo ambito, contenuto dell'ambito "Strada e Gentilezza") sia nel JSON-LD `FAQPage` sia nella sezione `<details>` visibile, mantenendo l'allineamento 1:1 tra i due richiesto per rich-result eligibility. Ora 7 Q&A, parità raggiunta. Verificato: JSON-LD valido (parse + count), rendering preview corretto, nessun errore console.
- chore: bump versione `4.12.23` → `4.12.24` (`/civica` è in `OPTIONAL_PRECACHE_URLS` di `sw.js`, contenuto modificato).

## 4.12.23 - 2026-07-05

### Fixed
- fix(perf): regressione CLS mobile introdotta dal fix 4.12.22. Rendere `fonts.css` lazy-loaded (via `js/lazy-css.js`) rompeva l'ottimizzazione anti-CLS già presente nel CSS: `fonts.css` contiene, oltre ai veri `@font-face`, i font di fallback con metriche allineate (`Nunito Fallback`, `Fredoka One Fallback` — `ascent-override`/`descent-override`/`size-adjust` calcolati apposta) usati come secondo nome nello stack `font-family` (es. `'Nunito','Nunito Fallback',sans-serif`). Con `fonts.css` bloccante, il first paint usava già il fallback allineato; reso lazy, il first paint cadeva sul generico `sans-serif`/`cursive` non allineato, e lo swap al fallback allineato (poi al font vero) causava un layout shift reale — confermato con dato Lighthouse via PageSpeed Insights API: CLS mobile 0.165-0.183 ("Needs Improvement"), causa esatta "Web font loaded" su `<main>` (font Nunito 700/900), identificata dall'audit `layout-shifts`/`cls-culprits-insight` di Lighthouse, non da ipotesi. Rimesso `fonts.css` come `<link rel="stylesheet">` bloccante su tutte le 20 pagine; `rewards.css` resta l'unico file lazy-loaded via `js/lazy-css.js` (nessuna dipendenza da font-metric fallback, sicuro da ritardare). Verificato in preview: font e stile premi corretti, nessun errore console.
- chore: bump versione `4.12.22` → `4.12.23` (`js/lazy-css.js` modificato, cache-relevant).

## 4.12.22 - 2026-07-05

### Changed
- perf(seo-audit): risolto finding "High" da audit SEO — 5 stylesheet bloccanti nell'`<head>` di ogni pagina (`tokens.css`, `[page].css`/`subject-quiz-theme.css`/`info-pages.css`, `utilities.css`, `rewards.css`, `fonts.css`) ritardavano il first paint. `fonts.css` e `rewards.css` (i due meno critici per il contenuto above-the-fold: il primo gestisce solo `@font-face` con `font-display: swap` già attivo, il secondo stile del widget premi/toast, visibile solo a fine quiz o sotto la piega) ora vengono iniettati dinamicamente da un nuovo script esterno `js/lazy-css.js` (CSP-safe, nessun inline handler: il CSP del sito è `script-src 'self'` senza `unsafe-inline`, quindi la tecnica preload+`onload` inline non era praticabile). I due file restano comunque `<link rel="preload" as="style">` per non perdere il prefetch anticipato del browser. Riduce a 3 (o 4 su `faq.html`) gli stylesheet realmente bloccanti per pagina. Verificato in preview su `index.html`, `matematica.html`, `premi.html`: nessuna regressione visiva, nessun errore console, stile premi/font applicati correttamente. Il sito richiede comunque JS per funzionare (messaggio `<noscript>` esplicito), quindi nessun utente senza JS perde stili che non vedrebbe comunque.
- chore: aggiunto `/js/lazy-css.js` a `CORE_PRECACHE_URLS` in `sw.js` per mantenere la disponibilità offline di `fonts.css`/`rewards.css`.
- chore: bump versione `4.12.21` → `4.12.22` (`sw.js` precache modificato).

## 4.12.21 - 2026-07-05

### Fixed
- fix(contenuto): `UPDATE_LOG` (`shared.js`) era rimasto indietro di 2 release (4.12.19, 4.12.20) — segnalato da utente (popup "Info" mostrava ancora 4.12.18). Terza occorrenza dello stesso bug (già visto e "risolto" manualmente in 4.12.17 e 4.12.18): la regola "l'etichetta della voce più recente deve coincidere con `APP_VERSION`" viveva solo in prosa nel changelog, senza alcun controllo automatico, quindi si perde ogni volta che una release viene fatta pensando ad altro (in questo caso: audit contrasto WCAG e accessibilità screen reader). Aggiunta voce consolidata per 4.12.19-4.12.21.

### Added
- test(contenuto): nuovo gate bloccante `scripts/check_update_log.js` (`npm run check:update-log`) — verifica che la versione massima citata nella prima voce di `UPDATE_LOG` (`shared.js`) coincida con `APP_VERSION` (`app-version.js`). Agganciato in `prepublish-check.sh` subito dopo `check_sw_precache.js`. Verificato iniettando un mismatch di proposito: blocca correttamente, e torna verde una volta corretto. Questo era l'anello mancante — le prime due volte il problema era stato risolto solo nei dati, mai nel processo che lo genera.

### Changed
- chore: bump versione `4.12.20` → `4.12.21` (`shared.js` precachato).

## 4.12.20 - 2026-07-04

### Fixed
- fix(a11y-audit): audit manuale oltre Lighthouse (R6) — trovato un bug reale non rilevabile da tool automatici. Il pannello "Tempo di gioco" (`shared.js`, `ensurePlayWindowPanel`) aveva `aria-live="polite"` + `aria-atomic="true"` sull'intera `<section>`, e il countdown al suo interno si aggiorna ogni secondo per tutta la sessione di 30 minuti: uno screen reader avrebbe riletto l'intero paragrafo ("Timer attivo: puoi giocare liberamente...") una volta al secondo, non stop, mentre si gioca. Rimosso `aria-live` dalla sezione; aggiunta una regione `sr-only` dedicata che annuncia solo ai cambi di fase reali (idle → attivo → cooldown → scaduto), non ai tick del countdown. Verificato con simulazione isolata: 4 annunci su 7 render (3 tick nella stessa fase correttamente silenziosi).
- fix(a11y-audit): i pulsanti risposta corretta/sbagliata comunicavano lo stato solo via icona CSS `::after` (`✓`/`✕`, content generato via CSS — non affidabilmente esposto agli screen reader) e classe colore. Aggiunto helper `markAnswerState()` in `subject-quiz-core.js` che aggiorna anche `aria-label` del bottone (" (risposta corretta)"/" (risposta sbagliata)") per entrambi i flussi domanda standard e bonus. Nota: un primo tentativo aggiungeva uno `span.sr-only` come figlio, ma i bottoni risposta hanno sempre `aria-label` esplicito impostato da `renderAnswerButtonText` (anche in modalità bilingue) che sovrascrive qualsiasi contenuto figlio nel nome accessibile — corretto per aggiornare `aria-label` direttamente. Verificato con simulazione isolata su caso standard e bilingue.
- fix(a11y-audit): aggiunto `role="status"` mancante su `#qExplanation` (creato dinamicamente da A1) per coerenza con `#feedback`, che lo ha già nel markup statico.
- chore: bump versione `4.12.19` → `4.12.20` (JS precachato modificato).

## 4.12.19 - 2026-07-04

### Fixed
- fix(a11y-contrasto): `#questionsTotalCount` (contatore domande nel footer di `index.html`/`chi-siamo.html`) falliva WCAG AA — `.footer-meta` (`utilities.css`) applicava `opacity: 0.78` sopra il colore già conforme di `.footer-link`, portando il contrasto reale da 5.43:1 a 3.62:1 (rilevato da Lighthouse su `chi-siamo`, unica pagina delle 5 monitorate sotto 1.0 in accessibilità). Rimossa l'opacity: l'opacità su testo si mescola col colore di sfondo sottostante e ne abbassa il contrasto in modo dipendente dalla superficie, un pattern fragile per elementi mostrati su più pagine/contesti. Verificato in preview: colore reso `rgb(110,99,87)`, contrasto 5.86:1.
- chore(css): rimossi da `tokens.css` i token dichiarati nella Fase 0 del restyle Wada Sanzo e mai consumati da nessuna regola: `--radius-sm`, `--radius-pill`, `--space-1..5`, `--fs-h1/h2/body/q/small`, `--lh-tight/body`, `--fw-body/strong/btn`, `--shadow-btn`, `--t-fast/base`, `--ws-shadow-warm` (14 dichiarazioni). Verificato con grep su tutti i CSS/JS/HTML prima della rimozione; i token realmente usati (`--radius-md/lg`, `--shadow-card`, tutti i `--ws-*` rimanenti, `--subj-*`, `--info-blue*`) restano invariati.
- chore: bump versione `4.12.18` → `4.12.19` (CSS precachato modificato).

## Non rilasciato

### Fixed
- docs: `docs/wiki/Home.md` riportava ancora "7.375 domande" (reale 9.879) e `CONTRIBUTING.md` la stessa cifra stale più un elenco "aree meno coperte" (inglese/civica/problemi) non più accurato — verificato via `json/index.json` che oggi le aree più scoperte sono scienze (1.024) e inglese (1.094), non civica (1.121) né problemi (1.361, seconda materia più coperta). Corretti entrambi; `CONTRIBUTING.md` ora rimanda a `reports/coverage.md` invece di elencare cifre che si stanno per sfasare di nuovo.
- docs: `docs/wiki/Architettura.md` non documentava nessuna delle funzioni quiz A1-A4/B1/C1 (spiegazione risposta, difficoltà adattiva, ripassa errori, filtro sotto-ambito, streak feedback, overlay progressi) né la strategia di precache lazy dei JSON materia introdotta in 4.12.12. Aggiunta tabella funzioni con chiavi storage/opt-out e nota sw.js aggiornata.
- docs: `README.md` sezione "Come funziona" non menzionava le stesse funzioni quiz A1-A4/B1/C1. Aggiunto paragrafo riassuntivo.
- fix(gate): `relevant_paths` in `check_pwa_version_bump_for_precache_changes` (`prepublish-check.sh`) usava il pattern bare `*.js`, che secondo la semantica pathspec di git matcha anche file in sottocartelle come `scripts/*.js` — non precachati, mai pensati per triggerare il check. Scoperto perché il commit C3 (aggiunta di `scripts/check_sw_precache.js`) ha fatto fallire retroattivamente il gate al giro successivo. Aggiunto pathspec negativo `:!scripts/*.js` per escluderli esplicitamente.

### Added
- test(pwa): nuovo gate bloccante `scripts/check_sw_precache.js` (`npm run check:sw-precache`) — verifica che ogni path in `CORE_PRECACHE_URLS`/`OPTIONAL_PRECACHE_URLS` (`sw.js`) corrisponda a un file reale su disco. Prima un path morto in `OPTIONAL_PRECACHE_URLS` falliva silenziosamente (try/catch ingoia l'errore per non bloccare l'install), producendo 404 invisibili in produzione. Verificato che rilevi e blocchi un path rotto iniettato di proposito, sia a livello di script standalone sia dentro `npm run verify` completo. Agganciato in `prepublish-check.sh` subito dopo gli altri controlli PWA. Nessun bump versione (`scripts/`/`prepublish-check.sh` non precachati).

## 4.12.18 - 2026-07-04

### Fixed
- fix(contenuto): la voce più recente di `UPDATE_LOG` (`shared.js`) descriveva sempre la release *precedente* a `APP_VERSION` — segnalato da utente (versione 4.12.17, changelog fermo a "Release 4.12.16"). Causa: la voce viene scritta per riassumere il fix appena fatto, poi la STESSA commit bumpa la versione per invalidare la cache di `shared.js`, disallineando l'etichetta di un passo ogni volta. D'ora in poi l'etichetta della voce più recente deve coincidere con `APP_VERSION` finale del commit, non con la release del fix che la genera. Verificato in browser: `app-version.js` e prima voce di `shared.js` ora entrambi `4.12.18`.
- chore: bump versione `4.12.17` → `4.12.18` (`shared.js` precachato).

## 4.12.17 - 2026-07-04

### Fixed
- fix(contenuto): il log "Ultimi aggiornamenti" mostrato in Info (`UPDATE_LOG` in `shared.js`) era fermo alla release 4.10.2 (28 maggio 2026) — segnalato da utente, ~40 release senza voce nel log da allora. Aggiunte 6 voci narrative per gli utenti (parenti/insegnanti) che riassumono i punti salienti reali di 4.11.0→4.12.16: le 5 nuove funzioni quiz (spiegazione risposta, difficoltà adattiva, ripassa errori, filtro sotto-ambito, progressi), l'espansione del dataset a 9.879 domande, lo streak feedback, le pagine per genitori/insegnanti arricchite, e il lavoro di oggi (fallback offline, PWA più leggera, contrasto WCAG, fix Okabe-Ito). Non un'entry per patch (sarebbe ~40 voci illeggibili): consolidate per rilascio realmente user-facing, come già fatto in passato per il gap 4.6.8→4.9.0 (vedi entry 4.9.1 esistente).
- chore: bump versione `4.12.16` → `4.12.17` (`shared.js` precachato).

## 4.12.16 - 2026-07-04

### Fixed
- fix(a11y-okabe): risolto leak del colore di marca per-materia nella modalità accessibile Okabe-Ito. Gli 8 blocchi `body.subject-X` in `subject-quiz-theme.css` dichiaravano `--accent-1/2/3` senza guardia (intenzionalmente, per lasciare ereditare `--bg-1/2/3`/`--card-bg`/`--text-main` a Okabe-Ito), ma nello stesso blocco `--accent-1/2/3` finiva per sovrascrivere il palette Okabe reale (`#0072B2`/`#009E73`) col colore di marca della materia (es. matematica mostrava viola `#7b43ff` invece del blu Okabe). Rimossi `--accent-1/2/3` dagli 8 blocchi non guardati — restano solo bg/card-bg/text-main come da intento originale, invariato. In standard mode nessun impatto: `--accent-1/2/3` arriva già dal blocco guardato Wada esistente. Verificato in browser su 4 materie (matematica, inglese, problemi, civica): Okabe-Ito ora mostra `#0072B2`/`#009E73` uniformemente; standard mode identico a prima.
- fix(a11y-okabe): l'accent-2 ufficiale Okabe-Ito (`#009E73`) non raggiunge 4.5:1 su sfondo chiaro — senza alterare il valore canonico (citazione scientifica), aggiunto override scoped solo Okabe-Ito per i selettori dove accent-2 è colore di testo (`.icon-btn`, `.seo-static h2`, `.seo-faq-item summary`, `.related-subjects h2/a`, `.class-selector-label`/`.levels-title`) verso `--text-main` (per-materia, verificato 12.16–15.99:1 su tutte le 8). `.btn-replay` (accent-2 come sfondo con testo bianco) scurito solo in Okabe-Ito con lo stesso pattern `color-mix` già usato da `.start-btn`.
- fix(css): `body.subject-inglese` aveva `--accent-1`/`--accent-2` invertiti rispetto alla convenzione delle altre 7 materie, costringendo `inglese.css` a 6 regole di compenso (`.back-btn`, `.icon-btn`, `.class-btn.selected`, `.btn-replay`, `.btn-home`, `.modal-body h3`) che referenziavano la variabile "sbagliata" apposta. Rimosse tutte e 6 (ora ridondanti, il tema condiviso copre identicamente): `inglese.css` eredita gli stessi default delle altre materie. Mantenute le personalizzazioni genuinamente uniche di inglese (rainbow class-btn, level-card CEFR, levels-wrap, score-pill.ok/ko, level-badge) non toccate dal problema.
- chore: bump versione `4.12.15` → `4.12.16` (CSS precachato modificato).

## 4.12.15 - 2026-07-04

### Fixed
- fix(contenuto/civica): riformulato distrattore innaturale "Ridire in giro il problema di salute" (domanda diritto alla salute, classe 3) in "Raccontare in giro il problema di salute" — segnalato da utente come confuso in gioco, letto erroneamente come refuso di "ridere".
- fix(ui): aggiunto `margin-top: 10px` a `.bonus-note` (`subject-quiz-theme.css`) — il testo "Se sbagli il bonus, il punteggio resta invariato." era attaccato al pulsante "Tieni il punteggio e salta bonus" sopra (nessun margine per via del reset globale `* { margin: 0 }`). Verificato in preview su civica, stesso markup condiviso da tutte e 8 le materie.
- chore: bump versione `4.12.14` → `4.12.15` (CSS precachato modificato).

## 4.12.14 - 2026-07-04

### Fixed
- fix(a11y-contrasto): `accent-2` falliva WCAG AA 4.5:1 su tutte le 8 materie in modalità standard (testo reale su `.icon-btn`, `.seo-static h2`, `.seo-faq-item summary`, `.related-subjects h2/a` — misurato con font-size/weight reali in browser, non dedotti). `accent-1` falliva anche su geografia (4.02), scienze (4.04) e problemi (3.22, il peggiore). Scuriti gli 11 token in `tokens.css` (`--subj-*-a`/`--subj-*-b`) mantenendo la stessa tonalità fino a raggiungere ≥4.5:1 su bianco; gli altri 5 valori già conformi restano invariati. Verificato in browser su tutte le 8 materie (back-btn e icon-btn, i due selettori più a rischio): tutti ora tra 4.53 e 5.33. Nessun impatto su modalità Okabe-Ito (i token toccati sono `--subj-*-a/b`, consumati solo dal blocco standard-mode guardato; scoperto peraltro — separatamente, non toccato qui — che i blocchi `body.subject-X` non guardati fanno leak del colore di marca anche in Okabe-Ito: task di follow-up aperto).
- chore: bump versione `4.12.13` → `4.12.14` (CSS precachato modificato).

## 4.12.13 - 2026-07-04

### Fixed
- fix(fallback): `civica`, `inglese` e `problemi` non avevano NESSUNA banca di domande statica di riserva (`js/*-page.js`) — se il fetch di `json/index.json`/`json/<materia>.json` falliva (offline al primissimo avvio, rete assente), il quiz restava con zero domande invece di degradare a un contenuto minimo. Ora hanno reale contenuto di fallback generato campionando `json/civica.json` (60 domande, 4 aree), `json/problemi.json` (20 domande) e `json/inglese.json` (102 domande, 17 aree) — solo domande a bassa difficoltà, già passate dal pipeline di qualità corrente (dedup, difficoltà, lint), non testo scritto a mano. Formato identico alle banche già funzionanti (matematica/storia/scienze/italiano/geografia): `{ q, a, d }`. Verificato: sintassi JS valida, `eslint` pulito, `npm run verify` passa, tutte le pagine materia sotto il limite di 250 righe.
- chore: bump versione `4.12.12` → `4.12.13` (JS pagine materia precachati modificati).

## 4.12.12 - 2026-07-04

### Changed
- perf(pwa): rimossi i 8 `json/<materia>.json` (~7.9MB totali) da `OPTIONAL_PRECACHE_URLS` in `sw.js`. Prima venivano scaricati TUTTI all'install del service worker, anche le materie che l'utente non avrebbe mai aperto. Restano cacheable via `isSameOriginStaticAsset` (estensione `.json` già coperta dalla regex statica): ogni materia viene ora salvata offline al primo fetch reale della pagina, non prima. `json/index.json` resta in `CORE_PRECACHE_URLS` (piccolo, necessario alla home per il conteggio totale domande). Verificato in preview: dopo install solo `index.json` è in cache; dopo la visita a `/matematica` anche `matematica.json` viene cachato, gli altri 7 restano assenti finché non si visita quella materia.
- chore: bump versione `4.12.11` → `4.12.12` (strategia di precache del service worker modificata).

## 4.12.11 - 2026-07-04

### Changed
- perf(css): introdotto token condiviso `--info-blue`/`--info-blue-rgb` (`tokens.css`, #2d6cdf / `45 108 223`) per il blu informativo ricorrente (box "per genitori e insegnanti", `.play-window-*`, `.area-more-btn`, link/pill FAQ e premi) finora hardcoded in ~20 punti distinti tra `subject-quiz-theme.css`, `utilities.css`, `index.css`, `faq.css`, `rewards.css`. Sostituiti tutti gli usi letterali (`#2d6cdf`, `rgba(45, 108, 223, alpha)`) con `var(--info-blue)`/`rgba(var(--info-blue-rgb) / alpha)`; non toccate le dichiarazioni `--accent-2`/`--civ-b`/`--sci-b` che condividono lo stesso hex per altra semantica (colore per-subject, non "info box" generico). Zero cambio visivo: verificato in preview su index/faq/inglese, incluso il valore renderizzato in modalità Okabe-Ito (identico, il token non è palette-scoped).
- chore: bump versione `4.12.10` → `4.12.11` (CSS precachato modificato).

## 4.12.10 - 2026-07-04

### Changed
- perf(css): rimosse da `inglese.css` 83 regole duplicate/morte (1198 → 611 righe). 76 erano byte-identiche a `subject-quiz-theme.css` (waste puro, rischio drift su future modifiche condivise); 5 (`.seo-static`/`::before`/`h2`, `.seo-faq-item`, `.seo-faq-item summary`) erano già inerti perché shadowate da regole più specifiche `html:not([data-palette="okabe-ito"]) body.subject-inglese ...` aggiunte dal restyle Wada Sanzo (Fase 4) più avanti nello stesso file; 2 (`.si .n`/`.si .l`) erano dead code senza alcun markup corrispondente. Mantenute intatte tutte le personalizzazioni deliberate della pagina inglese (rainbow class-btn per classe, level-card CEFR con stati locked/hover, levels-wrap decorativo, seo-100-domande, differenze di colore legate ai token `--accent-1`/`--accent-2` invertiti per questo subject). Verificato in preview: nessuna differenza visiva, nessun errore console, stati locked/hover/seo confermati via inspect.
- chore: bump versione `4.12.9` → `4.12.10` (CSS precachato modificato).

## Non rilasciato

## 4.12.9 - 2026-07-04

### Changed
- perf(favicon): sostituito `favicon.svg` — era un export raster (PNG 1254×1254 imbustato in base64 dentro tag `<svg><image>`, 1.1MB) con un vero SVG vettoriale (path disegnati, Adobe Illustrator export, 6.5KB). Stesso path pubblico `/favicon.svg`, nessun link da aggiornare. Riduzione ~99% del peso scaricato da ogni visitatore nuovo.
- chore: bump versione `4.12.8` → `4.12.9` (asset statico modificato, cache browser/CDN da invalidare).

## 4.12.8 - 2026-07-03

### Changed
- a11y(contrasto): scuriti gli stop chiari dei gradienti dei pulsanti risposta blu/verde/rosso (palette standard Wada Sanzo, `subject-quiz-theme.css` blocco `html:not([data-palette="okabe-ito"])`) così che il testo bianco superi WCAG AA 4.5:1 su tutto il pulsante, non solo sulla metà scura. Prima il testo bianco falliva sullo stop chiaro (2.94–3.52); ora passa su entrambi gli stop (blu 5.33/4.77, verde 6.17/4.73, rosso 5.77/4.93). Il pulsante ambra (testo scuro) era già conforme e resta invariato. Modalità **Okabe-Ito non toccata**. Cambio visivo minimo: pulsanti leggermente più profondi.
- a11y(contrasto): sottotitolo home `.main-sub` da `rgba(255,255,255,.85)` a `#fff` (margine di contrasto in più sul gradiente cielo, nessun impatto visivo percepibile).
- chore: bump versione `4.12.7` → `4.12.8` (HTML/CSS precachati modificati); hash CSP degli stili risincronizzati per lo `<style>` inline di `index.html`.

### Note
- Audit UX/accessibilità completo in `reports/ux-audit-2026.md`. Il conteggio domande nel footer usa già `Intl.NumberFormat('it-IT')` (separatore migliaia corretto in produzione): nessuna modifica necessaria.

## 4.12.7 - 2026-07-03

### Changed
- perf(font): ridotto il preload dei font sulle 8 pagine materia (matematica, inglese, problemi, civica, geografia, storia, scienze, italiano) da 5 a 3 pesi critici (Fredoka-700, Nunito-800, Nunito-900). Rimossi i preload di Nunito-regular (peso mai usato in `subject-quiz-theme.css`) e Nunito-700 (usato solo per `.result-msg` post-risposta, non above-the-fold). Le dichiarazioni `@font-face` restano invariate: i pesi non più precaricati continuano a caricare on-demand se richiesti, con priorità di rete più bassa. Verificato su preview: nessun FOUT visibile sul titolo, nessun errore console. Bump versione `4.12.6` → `4.12.7` (HTML precachato modificato).

## Non rilasciato

### Changed
- fix(csp): `sync_csp_hashes.py` ora hasha solo gli script **eseguibili** (`type` assente/`text/javascript`/`module`/`importmap`), non più i blocchi `application/ld+json`. Tutti i 48 `<script>` inline del sito sono data block JSON-LD (dati strutturati SEO), che il browser non esegue e che CSP `script-src` non governa: i loro hash erano inutili e creavano fragilità: ogni modifica a date/conteggi/FAQ nei JSON-LD rompeva la CSP e imponeva un resync (vedi A1/A2). `_headers` `script-src` passa da 46 hash a solo `'self'` (hash `style-src` invariati). Nessun impatto su produzione: i data block non erano comunque soggetti a enforcement. Nessun bump versione (`_headers`/`scripts/` non precachati).
- chore(build): aggiunto script npm `freshness` (`refresh_structured_data.py` → `generate_sitemap.py` → `sync_csp_hashes.py`) e agganciato a `prepublish-check.sh` prima della validazione di `sitemap.xml`, cosicché il gate di rilascio rigeneri sempre `lastmod`/`dateModified` dai timestamp reali dei file invece di lasciarli stale. Rigenerati `sitemap.xml` e i `dateModified` JSON-LD delle pagine con contenuti allineati alle modifiche reali (fino al 2026-07-03).

## 4.12.6 - 2026-07-03

### Fixed
- content: allineato il conteggio domande stale ("7.000+" in `index.html`, "7.300" in `faq.html`, "843" per scienze in `per-insegnanti.html") al totale reale di `json/index.json` (9.879). `index.html` e `faq.html` ora mostrano "9.800+" (arrotondamento onesto); `per-insegnanti.html` mostra "1.024 domande" per scienze. Verificato che `llms.txt` e `README.md` fossero già corretti (9.879) e che `#questionsTotalCount` resti popolato dinamicamente da JS senza duplicazioni manuali. Bump versione `4.12.5` → `4.12.6` (contenuto precachato modificato).

## 4.12.5 - 2026-07-01

### Changed
- content(scienze): unificato slug subarea duplicato — `stati_e_proprieta_materia` (area `materia_materiali_trasformazioni`, 25 domande) rinominato in `stati_proprieta_materia`, coerente con lo stesso slug già usato in altre 3 aree. Nessuna domanda modificata nel testo. Nessun impatto UI (A4 raggruppa già i sotto-ambiti per etichetta visualizzata).
- chore: bump versione `4.12.4` → `4.12.5` (`json/scienze.json` precachato). Aggiornati `json/index.json`, `llms.txt`, `reports/coverage.md`.

## 4.12.4 - 2026-07-01

### Added
- content(scienze): **G8 fase 2 batch 2+3 — top-up classi 5 e 3.** +52 domande classe 5 (198 → **250**) e +39 classe 3 (211 → **250**), completando il target di 250 domande/classe per tutte le classi di scienze (c2=274, c3/c4/c5=250). Classe 5: organi di senso e sistema nervoso, ecosistemi e catene alimentari, biodiversità, sostenibilità energetica, atomi e molecole. Classe 3: salute e igiene di base, ciclo dell'acqua, viventi/non viventi, parti della pianta. Mix di difficoltà adeguato all'età, distrattori plausibili, spiegazioni formative, nessun duplicato semantico. Totale domande **9.788 → 9.879**.

### Changed
- chore: bump versione `4.12.3` → `4.12.4` (`json/scienze.json` precachato dal service worker). Aggiornati `json/index.json`, `README.md`, `llms.txt`, `reports/coverage.md`.

## 4.12.3 - 2026-07-01

### Added
- content(scienze): **G8 fase 2 batch 1 — top-up classe 4.** +90 domande vettate su 11 subaree sotto quota, portando scienze c4 da 160 a **250 domande** (target di piano). Mix di difficoltà 1/2/3 (30/40/20). Aree coperte: passaggi di stato e ciclo dell'acqua, stati e proprietà della materia, trasformazioni reversibili/irreversibili, salute e igiene, movimenti della Terra, forze e movimento, luce e suono, energia e fonti rinnovabili, classificazione dei viventi, adattamenti, tutela ambientale. Ogni domanda con distrattori plausibili e spiegazione formativa; nessun duplicato semantico. Totale domande **9.698 → 9.788**.

### Changed
- chore: bump versione `4.12.2` → `4.12.3` (`json/scienze.json` precachato dal service worker). Aggiornati `json/index.json`, `README.md`, `llms.txt`, `reports/coverage.md`.

## 4.12.2 - 2026-07-01

### Changed
- content(scienze): **G8 fase 1 — consolidamento subaree.** Rimappate 707/843 domande da 120 combinazioni area/subarea frammentate (retaggio ingest) a ~38 macro-subaree (2-4 per area, stesso pattern del consolidamento civica G3). Nessuna domanda aggiunta/rimossa/modificata nel testo, solo il campo `subarea`. Celle sotto soglia coverage: 315 → 273. Prepara il terreno per il top-up G8 fase 2 (scienze c3/c4/c5 sotto quota 250/classe).
- chore: bump versione `4.12.1` → `4.12.2` (`json/scienze.json` precachato dal service worker).

## 4.12.1 - 2026-07-01

### Added
- content(pagine-adulti): **G6 — pagine per-genitori/per-insegnanti arricchite.** Aggiunta mappa curricolare (materie × aree tematiche × classi 2ª-5ª, con conteggio domande) e sezione consigli d'uso pratici, separate per target: consigli casa in `/per-genitori`, suggerimenti didattici per materia in `/per-insegnanti`. Nessuna nuova classe CSS (riuso di `.section`/`.list` esistenti), zero impatto CSP.

### Changed
- chore: bump versione `4.12.0` → `4.12.1` (HTML precachato dal service worker); `dateModified` aggiornato in entrambe le pagine.

## 4.12.0 - 2026-07-01

### Added
- feat(quiz): **B1 — streak-aware feedback.** Tracciato lo streak di risposte corrette consecutive nella sessione (reset a 0 su risposta errata). Alle soglie 3/5/8 il messaggio di feedback casuale è sostituito da un messaggio dedicato col conteggio ("3 di fila! 🔥", "5 di fila! Serie perfetta! ⭐", "8 di fila! Sei inarrestabile! 🚀") e la mascotte passa a `celebrate` invece di `happy`. Sotto soglia 3, comportamento invariato (messaggio random + `happy`). Le domande bonus di fine partita restano un flusso separato, non toccano lo streak.
- Scope B3 (mascotte contestuale) tenuto lean: nessuna nuova UI/DOM — riuso degli elementi `#feedback`/`#mascot` esistenti, zero impatto CSP/accessibilità.

### Changed
- chore: bump versione `4.11.5` → `4.12.0` (cambio comportamentale in `subject-quiz-core.js`, precachato).

## 4.11.5 - 2026-07-01

### Added
- content(matematica): +74 domande vettate per colmare i veri gap curricolari core, portando ogni cella a 15: `decimali` cl.4 (+12) e cl.5 (+14), `frazioni` cl.3 (+13), `ragionamento` cl.3/4/5 (+11/+12/+12). Ogni cella ha un mix di difficoltà 1/2/3 (mantiene la varianza intra-classe richiesta da A2). Tutte le domande aritmetiche verificate automaticamente (742/742 corrette).
- test(content): nuovo guardrail bloccante **D3** in `scripts/lint_content.js` — rileva riferimenti penzolanti nel testo della domanda ("domanda n.X", "domanda precedente", "vedi/figura sopra"). Controllato solo sul campo `question` per non colpire l'uso legittimo di "nella domanda" nelle spiegazioni.

### Changed
- content: totale domande **9.624 → 9.698**. Aggiornati `llms.txt`, `README.md`, `json/index.json`.
- chore: bump versione `4.11.4` → `4.11.5`; rigenerato `reports/coverage.md`.

## 4.11.4 - 2026-06-30

### Fixed
- content(QA pedagogico): rimosso il riferimento penzolante "nella domanda n.X" da 287 domande di scienze (artefatto di numerazione CSV, privo di senso nel quiz mescolato). Gli stem ripuliti collassavano in soli 11 quesiti unici: **rimossi 276 duplicati ridondanti** (stesso testo+risposta+opzioni), tenuti gli 11 originali. Le domande gonfiate erano live e servite.
- content(geografia): corretta `geo-4-regioni_italiane-9097` — "la Lombardia confina con Svizzera e Austria" era errato (l'unico Stato estero confinante è la Svizzera). Domanda riformulata e spiegazione corretta.

### Changed
- content: totale domande **9.900 → 9.624** (cull duplicati scienze). Aggiornati `llms.txt`, `README.md`, `json/index.json` (`totalQuestions` + stats scienze).
- test(content): verifica automatica aritmetica su matematica+problemi — 736 quesiti computabili controllati, 0 errori. Confermata l'integrità meccanica (l'audit già copre answerIndex↔answer, risposta∈opzioni, duplicati).
- chore: bump versione `4.11.3` → `4.11.4` in `app-version.js`, `package.json`, `llms.txt`; rigenerato `reports/coverage.md`.

## 4.11.3 - 2026-06-30

### Fixed
- content(reachability): riattivate **706 domande "morte"** che il loader scartava perché il loro `area` (o `subarea` per italiano) non era nella `areaMap` di pagina e veniva mappato a stringa vuota (`mapArea` → `''` → riga droppata). Recuperate: civica 82 (area legacy `educazione_civica`), storia 178 (area legacy `storia`), scienze 212 (area legacy `scienze`), geografia 165 (area legacy `geografia`), italiano 69 (`alfabeto` + `riflessione_sulla_lingua` mai inserite nella areaMap). Ora tutte le domande del dataset sono effettivamente servibili in gioco.
- content(italiano): aggiunte `alfabeto` (in `write`) e `riflessione_sulla_lingua` (in `gram`) alla `areaMap` di `js/italiano-page.js`.

### Changed
- chore(taxonomy): civica — dissolte ~60 micro-subaree da 5 domande in 16 macro-subaree coerenti (4 per area), e ridistribuite le 82 domande dell'area legacy `educazione_civica` nelle 4 aree reali (rules/env/digital/road). Celle civica sotto soglia 154 → 19; i 9 `bonus_*` instradati a subaree reali.
- chore(taxonomy): storia/scienze/geografia — domande delle aree legacy ricollocate nelle aree "vive" mappate dalla pagina, fondendole nelle subaree esistenti dove naturale (0 duplicati ridondanti introdotti; verificate le varianti testo-uguale/risposta-diversa).
- chore(coverage): rigenerato `reports/coverage.md` (celle sotto soglia 481 → 312; il residuo è costituito in prevalenza da unità curricolari coerenti da ~10 domande, non da lacune reali).
- chore: bump versione `4.11.2` → `4.11.3` in `app-version.js`, `package.json`, `llms.txt`.

## 4.11.2 - 2026-06-30

### Changed
- chore(taxonomy): eliminata la subarea `vari` da italiano (66 domande cl.3-5) e inglese (26 domande cl.2-5), ciascuna riclassificata nella subarea curricolare corretta (morfologia, grammatica, lessico, sintassi, ortografia, lettura, lingua, uso_guidato, ecc.).
- chore(taxonomy): rinominata `riflessione_linguistica` → `riflessione_sulla_lingua` in italiano cl.4 (15 domande) per uniformità con cl.5.
- chore: bump versione `4.11.1` → `4.11.2` in `app-version.js`, `package.json`, `llms.txt`.

## 4.11.1 - 2026-06-30

### Fixed
- content: corrette 6 domande duplicate vere (testo + risposta + opzioni identici) sostituendole con domande distinte e curricolarmente coerenti (italiano 3, inglese 3), mantenendo il totale a 9.900. Una di queste (`ita-2-morfologia-9133`, articolo per "amica") era anche pedagogicamente errata ed è stata riscritta.

### Added
- test(content): nuovi guardrail bloccanti in `scripts/audit_questions_json.js` — `subarea` non vuota, `difficulty ∈ {1,2,3}`, `explanation` non vuota, e rilevamento duplicati ridondanti (stesso testo normalizzato + stessa risposta + stesse opzioni). Varianti con stesso testo ma risposta/opzioni diverse restano consentite.
- chore(qa): `scripts/lint_content.js` ora è cablato come gate bloccante in `prepublish-check.sh`.

### Changed
- chore(lint): `lint_content.js` — rimossa euristica apostrofo errata (`un'` segnalato anche per maschili corretti come "un albero"), applicati realmente i gruppi di regole prima inerti, reset `lastIndex` per regex globali, aggiunto check accenti troncati (`citta`→`città`, ecc.) con soppressione del contrasto didattico in ortografia.
- chore(ci): `.lighthouseci/` aggiunto a `.gitignore` ed escluso dallo scan pattern pericolosi in `prepublish-check.sh` (i report generati contengono `innerHTML`/`javascript:` nei dati inline).
- chore: bump versione `4.11.0` → `4.11.1` in `app-version.js`, `package.json`, `llms.txt`.

## 4.11.0 - 2026-06-30

### Added
- feat(quiz): A1 — spiegazione risposta. Dopo ogni risposta compare una card `#qExplanation` con il testo `explanation` dalla domanda JSON, colorata verde/rossa. Si azzera al caricamento della domanda successiva. Nessuna modifica HTML: il div è iniettato dinamicamente dal core.
- feat(quiz): A2 — difficoltà adattiva. Al termine di ogni partita il core calcola un target EMA per classe (`${CURSOR_KEY}_adapt_v1`) e aggiunge un termine `|q.difficulty − target| × 2.6` in `candidateScore`. Converge in 3–5 sessioni. Opt-out via `cfg.adaptiveDifficulty: false`. No-op su matematica (varianza intra-classe assente nei dati attuali).
- feat(quiz): A3 — ripassa errori. Le domande sbagliate vengono salvate in `${CURSOR_KEY}_wrong_q_v1` (max 30). Appare il pulsante "Ripassa i tuoi errori (N)" nella schermata iniziale; avvia una sessione speciale che, al completamento, rimuove dalla lista le domande risposte correttamente.
- feat(quiz): A4 — filtro sotto-ambito. Dopo la selezione dell'area appare una griglia di sotto-ambiti derivata dinamicamente da `BANKS` per area+classe corrente. Nessuna config per materia necessaria.
- feat(quiz): C1 — overlay progressi. Pulsante "Progressi" nella schermata risultati apre un modale con statistiche per classe/area e tabella delle ultime partite, costruita da `loadStats()` / `loadLB()`.

### Changed
- content: 9.366 domande totali (+1.991 rispetto a 7.375). Aggiornati badge README, llms.txt, index.json.
- content(matematica): `difficulty` ri-derivata da feature intrinseche (grandezza operandi, tipo operazione, decimali/frazioni, esponenti, parentesi, multi-step) con binning per terzili intra-classe, sostituendo il collasso sulla classe. Sblocca la difficoltà adattiva (A2) per matematica. Vedi `scripts/derive_math_difficulty.py`.
- content(matematica): riempite 1.701 `subarea` vuote tramite classificatore deterministico su vocabolario controllato (`scripts/fill_math_subarea.py`). Nessuna materia ha più domande con `subarea` vuota.
- content: +153 domande nuove autorali (inglese +111, italiano +32, geografia +10) per portare ogni coppia materia-classe ad almeno 250 domande attive. Nessuna classe sotto soglia.
- content: +534 domande nuove autorali di arricchimento (italiano +88, inglese +88, scienze +80, storia +72, civica +72, geografia +72, problemi +62), tutte deduplicate per testo e curricolarmente coerenti, raggiungendo 9.900 domande totali. Nessuna classe sotto 250.
- chore: bump versione `4.10.13` → `4.11.0` in `app-version.js`, `package.json`, `llms.txt`.

## 4.10.2 - 2026-05-28

### Changed
- refactor(css): rimossi 389 righe di CSS morto post-refactor quiz engine, con pulizia concentrata su `inglese.css` e su selettori legacy non più referenziati nei fogli condivisi e informativi.
- css(audit): confermato il mantenimento dei soli selettori runtime/dinamici ancora necessari (`float-v*`, `:focus-visible`, classi `sa-/is-/has-/js-`), evitando regressioni visive e di accessibilità.

## 4.10.1 - 2026-05-27

### Fixed
- repo: rimossi 4 file vault Obsidian erroneamente committati in v4.10.0 (`00-Dashboard.md`, `01-Progetto/Stato attuale.md`, `02-Release/4.10.0.md`, `03-Task/Completati.md`). Erano accessibili pubblicamente via `https://lascuolaamica.it/<file>.md`. Nessuna PII sensibile esposta. Aggiunto `.gitignore` per prevenire ricorrenze.

## 4.10.0 - 2026-05-27

### Changed
- ci: aggiunto workflow Lighthouse CI con audit su 5 URL chiave (home, 2 materie, premi, chi-siamo). Trigger su PR + daily schedule. Soglie minime pragmatiche baseline-aware: perf 0.64, a11y 0.95, best-practices 0.78, SEO 0.95, PWA warn 0.85.
- dx: aggiunto npm script `lighthouse` (`lhci autorun`).
- ci: report salvati 7 giorni in temporary-public-storage Lighthouse CI.

## 4.9.5 - 2026-05-26

### Changed
- perf(html): aggiunti `dns-prefetch` + `preconnect` self-origin e `preload` per `/json/index.json` su pagine materia. Riduce latency iniziale primo paint su mobile.

## 4.9.4 - 2026-05-26

### Changed
- chore(dx): migrato ESLint da legacy `.eslintrc.json` a flat config `eslint.config.mjs`, compatibile con ESLint 9 senza workaround `ESLINT_USE_FLAT_CONFIG=false`.
- chore(dx): rimosso `.eslintrc.json` obsoleto e semplificato lo script `lint:js` in `package.json`.

## 4.9.3 - 2026-05-26

### Changed
- chore(dx): aggiunti `package.json` e `package-lock.json` con script unificati per `lint`, `audit:json`, `prepublish`, `verify`, `sync:wiki` e harness test.
- tooling: configurati `ESLint` e `Stylelint` in assetto minimale compatibile con il codebase vanilla JS/CSS esistente, senza dipendenze runtime.

### Fixed
- prepublish-check.sh: esclusi `.git` e `node_modules` dai controlli di sicurezza e igiene CSS, evitando falsi positivi durante `npm install`.

## 4.9.2 - 2026-05-26

### Changed
- perf(rewards): ottimizzati in batch i 46 PNG in `assets/reward/` mantenendo i path originali e riducendo il peso totale della cartella da ~15MB a ~3.5MB.
- perf(rewards): aggiunto `assets/reward/bacheca-trofei-bg.webp` con fallback PNG tramite `<picture>` in `premi.html`.

### Fixed
- pwa(rewards): `sw.js` ora gestisce esplicitamente `assets/reward/*` in runtime cache dedicata (`cache-first` on-demand), evitando precaricamenti non necessari e mantenendo offline dopo la prima visita a `/premi`.
- ui(rewards): immagini reward non critiche renderizzate con `decoding=\"async\"` e lazy loading.

## 4.9.1 - 2026-05-25

### Fixed
- shared.js: aggiornato `UPDATE_LOG` con le 6 release mancanti (`4.6.8` -> `4.9.0`). Il popup info mostrava ancora `4.6.7` come ultima voce mentre il footer riportava `4.9.0`.

## 4.9.0 - 2026-05-25

### Changed
- refactor(quiz-engine): chiusura consolidation. 8/8 materie ora config-driven via `subject-quiz-core.js`. Codebase ridotta di ~3.500 righe nette di duplicazione (civica, problemi, inglese migrate definitivamente al pattern config).
- core: Extension Contract attivo con 0/3 hook funzione consumati (margine 100% per future estensioni). 4 guard rail in `prepublish-check.sh` (no-subject-branch, cursorKey-explicit, pages-size, extension-contract-present).
- docs/wiki/Architettura.md: aggiornata sezione Quiz engine con guida "aggiungere nuova materia" (~120 righe vs ~1500 pre-refactor).

### Validation
- 8/8 materie verificate smoke multi-device (desktop + tablet + smartphone).
- PWA install + offline + update flow verificati su device reale.
- Rewards + reset dati locali verificati.
- Soak branch refactor 7 giorni, 0 regressioni.
- Audit dead code: 0 helper duplicati, 0 const legacy, 0 commenti obsoleti residui.

## 4.8.0 - 2026-05-25

### Changed
- refactor(inglese): migrato `js/inglese-page.js` a configurazione dichiarativa via `subject-quiz-core`, riducendo il file runtime a 104 righe di sola config.
- core quiz: aggiunti `cfg.levels`, `cfg.renderMode='bilingual'` e `cfg.maxLevelDistance` come config field passivi. Nessun hook funzione consumato (`D=0` invariato).
- questions-loader: aggiunti `subarea` e `answerLang` come metadata opzionali in `rowToQuestion`, usati solo dalle materie che li dichiarano.
- json inglese: arricchito `json/inglese.json` con `answerLang` su tutte le domande, con builder dataset aggiornato.
- 8/8 materie quiz ora sono config-driven.

### Fixed
- prepublish-check.sh: `check_cursor_key_explicit` ora copre tutte le 8 page subject, incluso inglese post-migrazione.

## 4.7.1 - 2026-05-25
### Changed
- refactor(problemi): confermata e formalizzata `cfg.cursorKey = 'problemiMatematica_cursor_v1'` esplicita in config per allinearsi alla politica unica "cursorKey sempre esplicita". Nessuna migrazione dati richiesta.
- core quiz: politica unica documentata in `docs/archive/refactor-quiz-engine-2026/core-capabilities.md`. Nessun fallback derivato implementato nel core: ogni materia migrata deve dichiarare esplicitamente la propria `cursorKey`.

### Fixed
- prepublish-check.sh: aggiunto il guard `check_cursor_key_explicit` per prevenire omissioni future nelle materie gia` migrate/config-driven.

## 4.7.0 - 2026-05-25
### Changed
- refactor(problemi): migrato `js/problemi-page.js` a configurazione dichiarativa via `subject-quiz-core`, riducendo il file runtime a 39 righe di sola config.
- core quiz: aggiunti `cfg.answerMode` (default `mcq`, nuovo `numeric`) e `cfg.leaderboardAreaFallback`; `cfg.optionsGenerator` e` disponibile come strategy passiva di fallback senza hook funzione.
- Storage keys utenti problemi preservate (`problemiMatematica_lb_v1`, `problemiMatematica_history_v2`, `problemiMatematica_quality_v1`, `problemiMatematica_class_pref_v1`).

### Fixed
- questions-loader: bonus rows non piu` incluse nella banca principale delle 10 domande standard. Regressione pregressa introdotta in `v4.6.6` con la migrazione JSON-only (`civica`, `inglese`, `problemi`): alcune sessioni potevano contenere bonus rows tra le domande normali. Verifica retroattiva civica post-fix documentata in `docs/archive/refactor-quiz-engine-2026/test-report-civica.md`.

## 4.6.9 - 2026-05-24
### Changed
- refactor(civica): migrato `js/civica-page.js` a configurazione dichiarativa via `subject-quiz-core`, riducendo il file runtime a 81 righe di sola config.
- core quiz: aggiunta idratazione generica delle bonus questions dai bonus rows JSON e supporto al config field `mixedRepeatLimit`.
- core quiz: introdotti i pesi config-driven `targetGradeWeight` e `classDistanceWeight` per rispettare il profilo classe di civica senza branch per materia.
- Storage keys utenti preservate (`educazioneCivica_lb_v1`, `educazioneCivica_cursor_v1`, `educazioneCivica_history_v2`, `educazioneCivica_quality_v1`, `educazioneCivica_class_pref_v1`).

## 4.6.8 - 2026-05-24
### Changed
- refactor: migrazione civica/inglese/problemi a JSON-only con bonus rows da dataset
- dataset totale: 7.348 -> 7.375 domande

## 4.6.7 - 2026-05-24

- docs: aggiunta sezione header HTTP critici per i dataset
- Runtime home/info: aggiunto contatore totale domande nel footer di `index` e `chi-siamo`, alimentato da `json/index.json` con formato locale `it-IT`.
- Hardening dati PWA: documentato il vincolo operativo su `/json/*` con `Cache-Control: public, max-age=0, must-revalidate` per evitare JSON stale dopo upgrade.

## 4.6.6 - 2026-05-24

- Dataset quiz: completata la migrazione JSON-only per `civica`, `inglese` e `problemi`, rimuovendo il doppio binario tra dataset inline e dati caricati a runtime.
- Bonus questions: spostate nei rispettivi `json/*.json` con metadati `bonus: true` e `bonusRaw`, così entrano nella stessa pipeline di audit dei dataset principali.
- Runtime dedicati: aggiornati i tre motori pagina per idratare da JSON anche i bucket bonus e non dipendere più da `BANK`/`BONUS_QUESTIONS` hardcoded.
- Conteggi e documentazione: riallineato il totale progetto a `7.375` domande e aggiornata la documentazione tecnica sulla source of truth dei contenuti.

## 4.6.5 - 2026-05-24

- Pulizia conservativa: rimosse funzioni morte confermate in `shared.js` (`getCachedNodes`, `ensureUpdatesFooterLink`, `ensureFaqFooterLink`, `ensurePaletteFooterToggle`) e in `admin/esercizi.js` (`escapeHtml`) senza impatti sul runtime.
- Hardening operativo: rimossi artefatti obsoleti (`.DS_Store`, `__pycache__`, `*.pyc`) dal repository.
- Documentazione: aggiunte note esplicite su area `admin/` non come boundary di sicurezza, esclusione dall'export pubblico, source of truth quiz su JSON e stato di `supporto-satispay.html` come pagina non promossa.
- Aggiornata la versione applicativa per distribuire i ritocchi di runtime e documentazione ai client con cache.

## 4.6.4 - 2026-05-24

- PWA branding: aggiornate anche le icone del manifest (`icons/icon-192.png`, `icons/icon-192-maskable.png`, `icons/icon-512.png`, `icons/icon-512-maskable.png`) usando la nuova sorgente favicon consegnata nel progetto.
- Mantenuta la stessa mappa file del manifest, senza cambiare nomi o percorsi pubblici.
- Aggiornata la versione applicativa per distribuire il nuovo set di icone anche ai client con cache e installazioni già esistenti.

## 4.6.3 - 2026-05-24

- Branding: aggiornata la favicon del sito partendo dalla nuova sorgente SVG fornita nel progetto.
- Rigenerate le varianti browser `favicon.ico`, `icons/favicon-16x16.png`, `icons/favicon-32x32.png` e `icons/apple-touch-icon.png`.
- Aggiornata la versione applicativa per invalidare correttamente la cache dei client che avevano già le vecchie icone.

## 4.6.2 - 2026-05-24

- PWA: registrazione del Service Worker aggiornata con `updateViaCache: "none"` per evitare update incompleti quando cambia `app-version.js`.
- PWA: aggiunto `scope: "/"` al manifest e documentato esplicitamente il vincolo di deploy root-only con rewrite compatibili.
- PWA: aggiunto `Cache-Control: no-cache` anche per `app-version.js` e rafforzati i controlli prepublish su contratto root-only, header cache e bump `APP_VERSION`.
- Service Worker: rimossi dal precache iniziale gli asset reward più pesanti della bacheca, che restano caricati on-demand dalla pagina Premi.
- Premi: allineati i meta Apple/A2HS di `premi.html` alla baseline delle altre pagine pubbliche.

## 4.6.1 - 2026-05-23

- Service Worker: aggiunte al precache opzionale le route `/privacy`, `/cookie` e `/supporto-satispay` per supportare la navigazione offline dai link footer.
- Service Worker: confermata la versione cache derivata da `app-version.js` via `importScripts('/app-version.js')` e aggiornato `APP_VERSION` a `4.6.1`.
- Service Worker: rimosso dal precache core il loader CSS legacy non più parte del runtime caricato dalle pagine.
- Cleanup tecnico: eliminato il file orfano del loader CSS legacy e azzerati i riferimenti residui nel repository.
- CSS inglese: rimossi i duplicati base (`:root`, `body`, `.bg-shapes`, `.shape`, `@keyframes drift`) già coperti da `subject-quiz-theme.css`.
- CTA supporta: applicata l'opzione conservativa di rimozione del marker `cta-supporta` non standardizzato.
- Footer privacy/cookie: introdotto `aria-current=\"page\"` sulle pagine omonime per evitare self-link ridondanti.

## 4.6.0 - 2026-05-23

- Migrazione footer completata su tutte le pagine pubbliche: Privacy e Cookie ora sono link diretti a `/privacy` e `/cookie` senza dipendere da JavaScript.
- Corretto `inglese.html` allineando la classe versione footer da `flink` a `footer-link`.
- Mantenuti temporaneamente i modali Privacy/Cookie nel markup come fallback non attivo per una release conservativa.
- Aggiornata la versione applicativa a `4.6.0` per propagare il cambio strutturale del footer anche ai client con cache offline.

## 4.5.34 - 2026-05-23

- Aggiunte le pagine standalone `privacy` e `cookie` con URL indicizzabili e raggiungibili anche senza JavaScript.
- Aggiornata la pagina 404: link footer Privacy/Cookie puntano ora a `/privacy` e `/cookie`.
- Aggiornati routing Cloudflare (`_redirects`) e sitemap con le nuove URL pubbliche.
- Aggiornata la versione applicativa a `4.5.34` per allineare cache e release metadata.

## 4.5.33 - 2026-05-23

- Corretto il layout responsive della bacheca premi: 7 colonne su desktop/LIM, 4 su tablet e 2 su smartphone.
- Ripristinata la coerenza del footer: Privacy, Cookie e versione restano nel pannello Info senza duplicazioni visive.
- Migliorata l'ergonomia mobile con target touch più affidabili per footer, breadcrumb, FAQ e comandi premi.
- Stabilizzata la sovrapposizione degli sfondi decorativi della pagina Premi rispetto al contenuto.

## 4.5.32 - 2026-05-22

- Rafforzato il generatore sitemap usando `git status --porcelain -z` per gestire correttamente rename, copie e percorsi con spazi.
- Mantenuta stabile la generazione di `lastmod` senza modifiche spurie a `sitemap.xml`.
- Aggiornata la versione applicativa per distribuire il ritocco agli script di pubblicazione.

## 4.5.31 - 2026-05-20

- Completata la pagina Premi con metadati social, JSON-LD e footer Privacy/Cookie coerente con il resto del sito.
- Aggiornata la FAQ con domande dedicate alla bacheca premi e al download PNG/JPEG.
- Riallineati i dati strutturati `dateModified` e la sitemap per le pagine pubbliche aggiornate.
- Puliti stili CSS non standard e permessi locali dei file pubblici.

## 4.5.30 - 2026-05-20

- Riallineata la homepage centrando il contenitore principale e la griglia delle materie.
- Uniformato il link Premi della testata allo stile compatto del link FAQ.
- Aggiornata la versione applicativa per invalidare la cache PWA del CSS home.

## 4.5.29 - 2026-05-20

- Resa pubblica e indicizzabile la pagina Premi, con link visibile dalla homepage.
- Aggiunta una guida nella bacheca per spiegare ai bambini come sbloccare badge, coppe, coccarde e trofei.
- Aggiornata la sitemap includendo `/premi` e rimossi gli header `noindex` dalla pagina.
- Confermato che i premi si conquistano solo completando le partite.

## 4.5.28 - 2026-05-20

- Aggiunta la pagina Premi con bacheca locale per badge, coccarde, coppe, corone e trofei.
- Collegato il sistema premi ai completamenti dei quiz su tutte le materie, con progressi salvati solo in localStorage.
- Aggiunta esportazione della bacheca in PNG/JPEG.
- Aggiornati Service Worker, redirect, documentazione e versione applicativa per distribuire la nuova funzione.

## 4.5.27 - 2026-05-18

- Corrette domande generate con etichette tecniche residue nei dataset di Italiano, Inglese e Matematica.
- Rifinite concordanze e formulazioni in Problemi, Scienze e Geografia per rendere più naturale il testo mostrato ai bambini.
- Aggiunto un audit automatico sui JSON delle materie per bloccare errori strutturali e pattern testuali non adatti alla pubblicazione.
- Aggiornata la versione applicativa per invalidare la cache PWA e distribuire subito i dataset corretti.

## 4.5.26 - 2026-05-18

- Rimosse dal runtime pubblico le funzioni sperimentali non più in uso, mantenendo stabile il flusso quiz.
- Ripuliti collegamenti interni, cache offline e testi informativi collegati alle funzioni rimosse.
- Preparata la base per un futuro sistema reward locale basato su riconoscimenti non monetari.

## 4.5.25 - 2026-05-17

- Ripristinati gli effetti audio generati dal browser per risposta corretta/sbagliata, streak, avvio, bonus e completamento.
- Confermato che il progetto non usa file audio, TTS o esercizi basati su ascolto da ripensare senza audio.
- Aggiornata la versione applicativa per distribuire correttamente il ripristino degli FX anche ai client PWA.

## 4.5.23 - 2026-05-17

- Ingrandita la mascotte nel titolo della homepage al doppio della dimensione precedente.
- Mantenuto il testo “La Scuola Amica” centrato rispetto al centro della pagina.
- Aggiornata la versione applicativa per evitare residui di cache nelle PWA già installate.

## 4.5.22 - 2026-05-17

- Avvicinato il sottotitolo “Scegli la tua materia e inizia a giocare!” al titolo della homepage.
- Conservato il centraggio del testo “La Scuola Amica” rispetto al centro della pagina.
- Aggiornata la versione applicativa per distribuire il CSS corretto ai client PWA.

## 4.5.21 - 2026-05-17

- Ridotta del 50% la mascotte nel titolo della homepage.
- Mantenuta la mascotte al posto dell’emoji, con resa più discreta e senza overflow mobile.
- Aggiornata la versione applicativa per distribuire il nuovo CSS ai client PWA.

## 4.5.20 - 2026-05-17

- Spostata la mascotte Cervellino dentro il titolo della homepage, al posto dell’emoji scuola.
- Ridimensionata la mascotte alla scala del testo del titolo, circa 70 px da desktop.
- Rimossa la mascotte grande sopra “La Scuola Amica” per rendere la hero più compatta.

## 4.5.19 - 2026-05-17

- Migliorato il contrasto di score bar e pulsanti principali nei flussi quiz, evitando testo piccolo in colori accento troppo chiari.
- Aggiornata la versione applicativa per distribuire correttamente i CSS modificati anche ai client con cache offline.

## 4.5.18 - 2026-05-14

- Applicato un pass SEO leggero su `scienze` e `italiano`.
- Aggiornati titoli, meta description, Open Graph, Twitter card e descrizioni JSON-LD delle due pagine.
- Rifiniti anche i testi statici visibili per rendere più chiaro il focus su esercizi e quiz per la scuola primaria.

## 4.5.17 - 2026-05-14

- Rafforzato il secondo cluster SEO con ottimizzazioni mirate su `geografia`, `storia` e `faq`.
- Aggiornati titoli, meta description, Open Graph e Twitter card per rendere gli snippet più chiari e coerenti con gli intenti di ricerca.
- Allineati anche i dati strutturati e i testi visibili delle tre pagine per consolidare rilevanza semantica e CTR potenziale.

## 4.5.16 - 2026-05-14

- Ottimizzati titoli, meta description e contenuti SEO statici di inglese, educazione civica e matematica.
- Allineati anche Open Graph, Twitter card e descrizioni JSON-LD delle tre pagine con miglior ROI organico.
- Aggiornati i `dateModified` delle pagine coinvolte per riflettere il refresh editoriale.

## 4.5.15 - 2026-05-14

- Compattate le classifiche dei quiz e di inglese riducendo le colonne principali, così risultano più leggibili anche su smartphone.
- Mantenuti i dettagli completi di punteggio in forma discreta tramite tooltip, evitando di appesantire la tabella per bambini e genitori.

## 4.5.14 - 2026-05-14

- Corrette alcune segnalazioni di qualità sul runtime: footer versione coerente, precache del Service Worker ripulita e score-bar più robusta in assenza di elementi DOM.
- Ripulito il motore inglese rimuovendo codice timer inattivo, migliorando l'accessibilità dei livelli bloccati e impedendo confetti residui dopo la navigazione.
- Migliorata la leggibilità mobile delle classifiche con contenitore a scorrimento orizzontale e target touch espliciti per classi e ambiti.

## 4.5.10 - 2026-05-08

- Rimossi gli ultimi stili applicati via attributo nel runtime pubblico e nell’editor interno, convertendoli in classi CSS condivise.
- Introdotti `utilities.css` e `js/dom-utils.js` come layer comune per visibilità, lock dello scroll, varianti decorative e replay animazioni.
- Convertiti i decorativi random di home, FAQ e motori quiz in varianti CSS precalcolate compatibili con una CSP più rigida.
- Stretta la CSP in `_headers` sostituendo `style-src-attr 'unsafe-inline'` con `style-src-attr 'none'`.
- Aggiornato il service worker per precaricare le nuove utility condivise e forzare il refresh client con la versione `4.5.10`.

## Unreleased - 2026-04-27

- Introdotta finestra locale di gioco da 30 minuti: per avviare una partita il timer deve essere attivato sul dispositivo, senza account o cookie e con supporto offline.
- Aggiunto cooldown locale di 60 minuti dopo la scadenza del timer prima di poter riattivare una nuova sessione di gioco.
- Resa più discreta la UI del timer nella home, mantenendo più evidente il pannello nelle schermate iniziali delle materie.
- FAQ pubbliche aggiornate con spiegazione del flusso `30 minuti di gioco + 60 minuti di pausa`.
- Aggiunti pannelli timer condivisi su home e schermate iniziali delle materie, con conto alla rovescia e attivazione esplicita del tempo di gioco.
- Aggiunto indicatore compatto del tempo residuo nella score bar durante la partita.
- I motori quiz (`subject-quiz-core`, `inglese`, `problemi`, `civica`) bloccano l’avvio se il timer non è attivo e interrompono la sessione quando la finestra dei 30 minuti scade.
- Fase 2 audit tecnico completata: sostituiti i dialog nativi principali con modali condivisi (`SA.ui.confirm` / `SA.ui.alert`) nei motori quiz e nell’update prompt.
- Migliorata la coerenza “Meno animazioni” anche lato runtime JS (`subject-quiz-core`, `inglese`, `problemi`, `civica`, `index-page`), inclusa la disattivazione confetti in inglese.
- Automatizzato l’aggiornamento dei contenuti strutturati e della sitemap prima della pubblicazione.
- Accessibilità/touch ergonomics: aumentate dimensioni minime dei toggle Palette/Animazioni (target 44px+) nel pannello Info.
- Testi privacy/FAQ allineati al nuovo comando “Cancella dati locali”.

## 4.5.8 - 2026-05-07

- Migliorati i segnali per i crawler per separare meglio i contenuti pubblici dalle aree tecniche.
- Aggiornata la sitemap con date di modifica più affidabili per riflettere meglio gli ultimi cambiamenti.
- Ottimizzati i contenuti dati del sito per ridurre il peso dei caricamenti e migliorare la rapidità d’uso.
- Ridotto ulteriormente l’uso di stili inline con una struttura CSS più ordinata e sicura.

## 4.5.7 - 2026-05-07

- Allineata la versione applicativa a `4.5.7` con sincronizzazione del footer dal runtime condiviso e aggiornamento dei riferimenti statici residui.
- Aggiunte alle pagine informative le funzioni condivise principali: pannello Info, palette accessibile e preferenza “Meno animazioni”.
- Allineati i segnali per motori di ricerca e sistemi di risposta con una comunicazione pubblica più coerente.
- Ottimizzati gli asset della mascotte “Cervellino” per ridurre il peso delle immagini e migliorare la velocità su mobile.

- Mascotte “Cervellino” integrata in PNG trasparente con 4 stati (`neutral`, `happy`, `sad`, `celebrate`) su tutte le materie.
- Allineati i motori quiz (`subject-quiz-core`, `inglese`, `problemi`, `civica`) al nuovo stato mascotte con feedback dinamico durante partita/bonus/risultato.
- Pagine informative (`chi-siamo`, `per-insegnanti`, `per-genitori`, `ai-info`) rese più sobrie con stylesheet dedicato `info-pages.css`.
- Service Worker: precache esteso ai nuovi asset mascotte PNG e al nuovo stylesheet informativo.
- Audit UX/UI bambini: aumentata la leggibilità dei microtesti (classi/ambiti, score label, breadcrumb) e migliorato il contrasto dei tag/card in home.
- Quiz feedback: progress dots più grandi, stato risposta corretto/sbagliato più evidente (non solo colore), animazione feedback estesa e celebrativa.
- Mascotte estesa alle pagine quiz materie (🦉) con stato dinamico nei motori quiz condivisi e dedicati.
- Riduzione distrazioni: diminuito il numero/opacity degli elementi decorativi animati nelle pagine principali.
- Accessibilità movimento: aggiunto toggle “Animazioni: Automatiche / Meno animazioni” nel pannello Info con preferenza persistente sul dispositivo.
- Layout contenuti: spostate le sezioni `seo-static` fuori dalla card interattiva principale nelle pagine quiz.
- SEO social: create e collegate 8 Open Graph image dedicate per le materie (`og-<materia>-1200x630.jpg`).
- Nuova pagina pubblica `chi-siamo` con metadata SEO/OG/JSON-LD, breadcrumb e integrazione in sitemap.
- Info Hub: aggiunto link rapido “Chi siamo” nel pannello Info condiviso (`shared.js`).
- PWA hardening: introdotte favicon/icone fisiche (`favicon.svg`, `.ico`, `icons/*.png`) e manifest aggiornato senza data URI SVG.
- Allineamento runtime script IIFE: rimossi `type=\"module\"` in favore di script `defer` classici.
- Sicurezza policy: rimossi meta CSP/Permissions-Policy duplicati dalle pagine HTML e centralizzata la gestione degli header di sicurezza.
- Accessibilità/robustezza: aggiunto fallback `<noscript>` su tutte le pagine pubbliche.
- README: rimosso percorso locale iCloud personale dalla sezione avvio in locale.
- GEO: aggiunto file `llms.txt` alla radice progetto.
- Nuove pagine informative pubbliche: `per-insegnanti`, `per-genitori`, `ai-info`.
- FAQ: refactor semantico elenco domande (`ul/li` + `details`) per maggiore robustezza screen reader.
- Accessibilità: aggiunti skip link e `id=\"contenuto-principale\"` alle pagine statiche mancanti.
- SEO social: aggiunte Open Graph image dedicate per `faq`, `supporta`, `accessibilita`, `per-insegnanti`, `per-genitori`, `ai-info`.
- Routing/sitemap: estese rotte pulite e sitemap alle nuove pagine informative.
- Licenza repository: aggiunto file `LICENSE` (MIT) e aggiornato `README.md`.

- Config materie: priorità a `window.SA.subjectConfig` con alias legacy mantenuto su `window.SUBJECT_CONFIG`.
- Aggiunto controllo prepublish che blocca riferimenti runtime diretti a `questions.json` (architettura split JSON enforced).
- Core quiz: rimosso fallback a `window.SUBJECT_CONFIG`, ora usa configurazione da `window.SA.subjectConfig`.
- Config materie (matematica/geografia/scienze/storia/italiano): eliminate assegnazioni globali dirette, mantenuta sola scrittura su namespace `SA`.
- Avviata migrazione ES modules: `index.html` e `faq.html` ora caricano `js/index-page.js` e `js/faq-page.js` con `type="module"`.
- Estesa migrazione ES modules a tutte le pagine applicative: tutti gli script runtime `src` ora usano `type="module"`.
- Rimossi alias globali legacy a favore del namespace `window.SA.*`.
- Deprecato e rimosso `questions.json` dal repo runtime; build aggiornata per generarlo solo su richiesta (`GENERATE_LEGACY_QUESTIONS_JSON=true`).
- Aggiornata la documentazione tecnica per allineare l’architettura dati a una struttura più modulare.
- Merge completo dei nuovi dataset domande validati (`8` materie) nei file `json/*.json`.
- Aggiornato `json/index.json` con nuove cardinalità per materia e totale complessivo (`7348` domande).
- Verifica integrità post-merge completata su tutte le materie con esito `PASS`.
- Corretto un refuso strutturale nel dataset italiano (`ita-2-ortografia-005`) per rimuovere un'opzione duplicata.
- Hardening CSP: rimossi gli script inline eseguibili dalle pagine pubbliche e spostati in `js/*.js`.
- Aggiornata la policy CSP nelle pagine principali con `script-src 'self'` (senza `unsafe-inline`).
- Aggiornato `sw.js` per includere in precache i nuovi script pagina.
- Migliorata la resilienza errori: rimossi i `catch` vuoti nei moduli principali, con logging silenzioso in modalità debug (`?debug` / localhost).
- Aggiunto fallback UX nel motore quiz: se il caricamento domande fallisce viene mostrato un messaggio chiaro all’utente.
- Verifiche tecniche completate con `node --check` e `prepublish-check.sh` (esito OK).
- Aggiornato il sistema di selezione domande con planner stocastico a slot (`area + difficoltà`) per ridurre pattern ripetitivi tra sessioni.
- Potenziata la logica anti-ripetizione multi-sessione con cooldown su ID e firma domanda, più selezione `softmax` dei candidati.
- Introdotte metriche locali di qualità sessione (`repeat rate`, `coverage`, `entropy`, `novelty`) salvate sul dispositivo con media rolling.
- Allineata la nuova logica algoritmo su tutte le materie quiz:
  - motore condiviso `subject-quiz-core.js` per matematica, italiano, geografia, storia, scienze
  - motori dedicati `js/inglese-page.js`, `js/problemi-page.js`, `js/civica-page.js` con la stessa strategia avanzata
- Esteso il generatore parametrico con profili `small`/`extended` e seed configurabile.
- Aggiunto un report CSV automatico di copertura domande generato a ogni esecuzione del generatore.
- Aggiunto anche un report CSV di sintesi con una riga per materia.
- Aggiunto flag `--report-only` per produrre solo il report CSV senza modificare i dataset.
- Eseguito il profilo `extended` sui dataset domande con controllo anti-duplicati e ID incrementali:
  - `matematica`: +128 domande parametriche (`totalQuestions=1716`)
  - `problemi`: +120 domande parametriche (`totalQuestions=920`)
  - `inglese`: +51 domande parametriche (`totalQuestions=334`)
- Aggiornati automaticamente `json/index.json`, `stats.rows`, `stats.areas`, `stats.classes` e timestamp `generatedAt`.

## 4.5.5 - 2026-05-01

- Aggiornata la versione applicativa a `4.5.5` (`app-version.js`, fallback runtime, footer pagine e metadati operativi).
- Aggiornata la sezione “Ultimi aggiornamenti” con lo storico dal 29 aprile al 1 maggio 2026.
- Completata la Fase 2 runtime: modali condivisi (`SA.ui.confirm` / `SA.ui.alert`) per dialog principali e update prompt.
- Migliorata la coerenza “Meno animazioni” lato JavaScript su home e motori quiz dedicati, con confetti disattivati quando richiesto.
- Automatizzati gli aggiornamenti dei contenuti strutturati e della sitemap prima della pubblicazione.
- Completata la Fase 3: aggiunto comando “Cancella dati locali” nel pannello Info e allineati i testi Privacy/FAQ.
- Accessibilità/touch ergonomics: target minimi dei toggle Palette/Animazioni portati a 44px+.

## 4.5.6 - 2026-05-06

- Migliorata la stabilità offline delle pagine principali e ridotti i redirect non necessari durante l’uso del sito.
- Rafforzata la continuità di navigazione sulle URL canoniche anche senza connessione.
- Versione applicativa aggiornata a `4.5.6` per riallineare la cache locale dei client.

## 4.5.2 - 2026-04-29

- Aggiornata la versione applicativa a `4.5.2` (`app-version.js`, fallback runtime e footer pagine).
- Service Worker: corretta gestione offline delle URL pulite con fallback cache più robusto.
- Service Worker: bump cache runtime a `lascuolaamica-v455` per forzare reinstallazione client con gli ultimi asset/fix.
- Allineato il meta `mobile-web-app-capable` su tutte le pagine HTML pubbliche.
- Font self-hosted consolidati su asset locali e documentazione tecnica sincronizzata (README + wiki).

## 4.5.1 - 2026-04-28

- Aggiornata la versione applicativa a `4.5.1` (`app-version.js`, footer pagine e fallback runtime).
- Rafforzata la parte GEO con `founder` + `foundingDate` nell’Organization JSON-LD.
- Aggiunto `numberOfQuestions` nei JSON-LD delle 8 pagine materia.
- FAQ e `llms.txt` allineati con dati quantitativi progetto (oltre 7.300 domande, totale 7.348).
- Esteso il supporto `data-motion="reduce"` a `faq.css` e `info-pages.css`.
- Aggiornata la pagina Accessibilità con la nuova versione portale.
- Aggiornati gli asset PNG della mascotte “Gufo Cervellino” (`neutral`, `happy`, `sad`, `celebrate`) e aggiunto il nuovo stato homepage `cervellino-waving-03.png`.
- Homepage: introdotta la mascotte di benvenuto nell’header (`.mascot-home`) con animazione di entrata + idle, sincronizzata con il toggle “Meno animazioni”.
- Quiz: mascotte domanda ridimensionata in modo responsive (88/128 base, 96/138 da tablet) e aggiunta mascotte grande nella schermata risultato con stato emotivo dinamico.
- Service Worker: precache esteso al nuovo asset `assets/mascotte/cervellino-waving-03.png`.

## 4.2.1 - 2026-04-18

- Completata validazione WCAG 2.1 A/AA manuale su tastiera, modali, zoom/reflow, VoiceOver e riduzione movimento.
- Corretto il reflow della home a zoom 200% (evitati tagli di card e testi).
- Pubblicata la pagina `accessibilita` con dichiarazione, metodologia e canale segnalazioni.
- Aggiunti link alla pagina Accessibilità in FAQ, Supporto e pannello Info.
- Aggiornati `sitemap.xml` e precache service worker con la nuova pagina.
- Versione portale aggiornata alla `4.2.1`.

## 4.2 - 2026-04-18

- Audit WCAG 2.1 AA automatico sulle pagine principali (rule set `wcag2a` e `wcag2aa`).
- Impostata la palette standard come default e mantenuto il toggle Standard/Accessibile.
- Rigenerati screenshot social home (`390x844`, `1280x720`, `1200x630`) senza footer.
- Deduplicati i dataset domande con rinumerazione ID e allineamento JSON aggregati.
- Aggiornata la versione applicativa e la sezione “Ultimi aggiornamenti” alla `4.2`.

## 4.1.1 - 2026-04-13

- Uniformate canonical, Open Graph URL, JSON-LD e link interni alle rotte senza estensione `.html`.
- Aggiornata la sitemap con URL canonici senza estensione.
- Aggiornata la pagina supporto con indicazione email `supporto@lascuolaamica.it`.

## 4.1 - 2026-04-12

- Revisione linguistica estesa (accenti, apostrofi, forme corrette).
- Correzione refusi in domande e testi informativi.
- Fix stringhe JS con apostrofi che causavano errori di sintassi.
- Allineamento dati in JSON materia e aggregato.
- Sincronizzazione `export` con stato aggiornato.

## Nota

Lo storico funzionale dettagliato mostrato all'utente è mantenuto nel pannello “Ultimi aggiornamenti” (`shared.js`).
