# Audio del Sistema Solare in 3D (testi per ElevenLabs)

22 audio: il Sole, i pianeti, la Luna, la Stazione Spaziale, le due fasce e i capitoli del film delle Voyager (file film-...). Gli altri corpi usano la voce del browser.
Per ognuno: copia il blocco in ElevenLabs (modello Eleven v3, voce italiana),
scarica l'mp3 e salvalo con il nome indicato in `assets/sistema-solare/audio/`.
Poi lancia `python3 scripts/build_sistema_solare.py`: la pagina userà i file al posto della voce del browser.

- I tag fra parentesi quadre (`[excited]`, `[curious]`) sono indicazioni di espressione di Eleven v3:
  si possono cambiare o togliere. Non vengono letti.
- Simboli e unità sono già scritti per esteso («gradi», «chilometri»).
- Se un testo cambia in `dati.json`, rilancia questo script: l'mp3 vecchio smette di essere usato
  finché non viene registrato di nuovo (lo dice l'impronta in `audio-testi.json`).
- Consiglio: mp3 a 64 kbps mono. Bastano per la voce e restano leggeri.

## sole.mp3

```text
[excited] Sole.

Il Sole è la nostra stella. È una palla enorme di gas caldissimo, soprattutto idrogeno ed elio. La sua luce e il suo calore rendono possibile la vita sulla Terra.

[curious] Lo sapevi? Il Sole contiene il 99,8 per cento di tutta la massa del Sistema Solare.

La luce del Sole impiega poco più di 8 minuti per arrivare sulla Terra.

Servirebbero circa 1,3 milioni di Terre per riempire il volume del Sole.

Fra circa 5 miliardi di anni il Sole diventerà una gigante rossa e poi una nana bianca.
```

## mercurio.mp3

```text
[excited] Mercurio.

Mercurio è il pianeta più piccolo e il più vicino al Sole. È poco più grande della Luna ed è pieno di crateri. Di giorno fa caldissimo, di notte fa freddissimo.

[curious] Lo sapevi? Da Mercurio il Sole sembrerebbe più di tre volte più grande che dalla Terra.

È il pianeta più veloce: fa un giro attorno al Sole in 88 giorni.

Un giorno completo, da un'alba all'altra, dura 176 giorni terrestri: proprio due anni di Mercurio.

Molti crateri portano i nomi di artisti, musicisti e scrittori.
```

## venere.mp3

```text
[excited] Venere.

Venere è il pianeta più caldo del Sistema Solare, anche se Mercurio è più vicino al Sole. Le sue nubi spesse trattengono il calore. È grande quasi come la Terra.

[curious] Lo sapevi? Gira su se stessa al contrario: lì il Sole sorge a ovest e tramonta a est.

Per fare un giro completo su se stessa impiega 243 giorni terrestri: più di quanto impiega a girare attorno al Sole (225 giorni).

Dopo la Luna, è l'oggetto più luminoso del cielo notturno.

Dieci sonde sovietiche sono atterrate su Venere e hanno mandato dati: la più resistente, Venera 13, ha funzionato per circa due ore.
```

## terra.mp3

```text
[excited] Terra.

La Terra è il nostro pianeta, il terzo dal Sole. È l'unico posto conosciuto dove c'è la vita. Gran parte della sua superficie è coperta d'acqua.

[curious] Lo sapevi? Gli oceani coprono circa il 71 per cento della superficie.

Fa un giro attorno al Sole in 365,25 giorni: per questo ogni quattro anni c'è l'anno bisestile.

L'asse è inclinato di 23,4 gradi: è questo che crea le stagioni.

Si è formata circa 4,5 miliardi di anni fa.
```

## luna.mp3

```text
[excited] Luna.

La Luna è l'unico satellite naturale della Terra. Mostra sempre la stessa faccia, perché ruota su se stessa nello stesso tempo in cui gira attorno alla Terra. È l'unico corpo celeste, oltre alla Terra, su cui hanno camminato delle persone.

[curious] Lo sapevi? Si allontana dalla Terra di circa 3,8 cm all'anno.

La gravità sulla Luna è circa un sesto di quella terrestre.

Gli astronauti delle missioni Apollo hanno riportato sulla Terra 382 chili di rocce e polvere lunari.

Le macchie scure, chiamate mari, sono antiche colate di lava solidificata.
```

## iss.mp3

```text
[excited] Stazione Spaziale Internazionale.

La Stazione Spaziale Internazionale è un grande laboratorio che gira attorno alla Terra a circa 400 chilometri di altezza. Ci vivono di solito sette astronauti, che fanno esperimenti per capire meglio lo spazio e la Terra. Da novembre del 2000 a bordo c'è sempre stato qualcuno.

[curious] Lo sapevi? Gira così veloce che fa il giro della Terra in circa un'ora e mezza: circa 16 giri al giorno.

Passando sopra la Terra, sorvola più del 90 per cento delle persone che vivono sul pianeta.

L'acqua a bordo si ricicla: così dalla Terra servono il 65 per cento di rifornimenti d'acqua in meno.

Per non perdere forza nei muscoli e nelle ossa, ogni astronauta fa ginnastica almeno due ore al giorno.

La costruiscono e la usano insieme cinque agenzie spaziali: fra loro c'è l'ESA, di cui fa parte l'Italia.
```

## marte.mp3

```text
[excited] Marte.

Marte è il pianeta rosso. Il colore viene dalla ruggine del ferro nelle rocce e nella polvere. È un deserto freddo, con vulcani, canyon e calotte di ghiaccio ai poli.

[curious] Lo sapevi? Ha il vulcano più grande del Sistema Solare, Olympus Mons: è alto circa 22 chilometri, quasi tre volte il monte Everest.

Il canyon Valles Marineris è lungo circa 3870 chilometri.

Un giorno su Marte si chiama sol e dura poco più di 24 ore e mezza.

È l'unico pianeta che conosciamo abitato solo da robot.
```

## fascia-asteroidi.mp3

```text
[excited] La fascia degli asteroidi.

Tra Marte e Giove c'è una zona piena di asteroidi: è la fascia principale. Gli asteroidi sono rocce rimaste dalla nascita del Sistema Solare. Sono tantissimi, ma sono molto lontani uno dall'altro. Tutti insieme pesano meno della nostra Luna. Il più grande è il pianeta nano Cerere.
```

## giove.mp3

```text
[excited] Giove.

Giove è il pianeta più grande del Sistema Solare. È un gigante fatto soprattutto di gas: non ha una superficie solida. Le sue strisce colorate sono nubi spinte da venti fortissimi.

[curious] Lo sapevi? Ha il giorno più corto di tutti i pianeti: circa 10 ore.

La Grande Macchia Rossa è una tempesta più grande della Terra: gli astronomi la seguono senza interruzioni dal 1831.

Il suo volume è più di 1300 volte quello della Terra.

Ha anelli sottili e scuri, scoperti nel 1979 dalla sonda Voyager 1.
```

## saturno.mp3

```text
[excited] Saturno.

Saturno è il secondo pianeta più grande ed è famoso per i suoi anelli. Gli anelli sono fatti di miliardi di pezzi di ghiaccio e roccia. Anche Saturno è un gigante di gas.

[curious] Lo sapevi? La sua densità media è più bassa di quella dell'acqua.

Gli anelli principali sono larghissimi ma spessi in genere solo circa 10 metri.

Al polo nord c'è una corrente d'aria a forma di esagono, larga circa 30 000 chilometri.

Ha più lune confermate di qualsiasi altro pianeta.
```

## urano.mp3

```text
[excited] Urano.

Urano è un gigante di ghiaccio, di colore azzurro. Ruota quasi coricato su un fianco, come una palla che rotola. È stato il primo pianeta scoperto con il telescopio.

[curious] Lo sapevi? Il suo asse è inclinato di quasi 98 gradi.

Ogni polo ha circa 42 anni di luce continua e poi circa 42 anni di buio.

Le sue lune hanno nomi di personaggi di William Shakespeare e Alexander Pope.

Solo una sonda lo ha visitato: Voyager 2, nel 1986.
```

## nettuno.mp3

```text
[excited] Nettuno.

Nettuno è il pianeta più lontano dal Sole. È un gigante di ghiaccio blu, freddo e buio. È il pianeta con i venti più forti.

[curious] Lo sapevi? È il primo pianeta trovato grazie ai calcoli matematici, invece che con le normali osservazioni del cielo.

Fa un giro attorno al Sole in circa 165 anni.

I suoi venti superano i 2000 chilometri all'ora.

Nel 1989 Voyager 2 vide una enorme tempesta scura, la Grande Macchia Scura, che poi è scomparsa.
```

## fascia-kuiper.mp3

```text
[excited] La fascia di Kuiper.

Oltre Nettuno c'è un grande anello a forma di ciambella pieno di corpi ghiacciati: è la fascia di Kuiper. Lì si trovano Plutone e quasi tutti i pianeti nani conosciuti. Sono resti della nascita del Sistema Solare. Una sola sonda è passata vicino ai suoi corpi e li ha fotografati: New Horizons.
```

## film-lancio.mp3

```text
[excited] Si parte!.

Il 20 agosto 1977 parte Voyager 2 da Cape Canaveral, in Florida. Il 5 settembre parte la sua gemella, Voyager 1, su una strada più veloce. A dicembre Voyager 1 è già davanti.
```

## film-giove.mp3

```text
[excited] Vulcani su Io.

Voyager 1 passa vicino a Giove il 5 marzo 1979, Voyager 2 il 9 luglio. Sulla luna Io si vedono vulcani in eruzione: è la prima volta che li vediamo fuori dalla Terra. Giove ha anche un anello sottile e lune mai viste prima.
```

## film-saturno.mp3

```text
[excited] Saturno e Titano.

Il 12 novembre 1980 Voyager 1 visita Saturno e passa vicino a Titano, una luna con un'atmosfera spessa fatta soprattutto di azoto. Poi lascia il piano in cui girano i pianeti e punta verso lo spazio fra le stelle. Voyager 2 arriva a Saturno nell'agosto 1981.
```

## film-urano.mp3

```text
[excited] Visita a Urano.

Il 24 gennaio 1986 Voyager 2 è la prima sonda a visitare Urano. Scopre 10 lune nuove e 2 anelli nuovi. La luce del Sole lì è 400 volte più debole che sulla Terra.
```

## film-nettuno.mp3

```text
[excited] Nettuno e i geyser di Tritone.

Il 25 agosto 1989 Voyager 2 passa a meno di 5.000 chilometri sopra le nubi di Nettuno, dove soffiano i venti più forti mai misurati su un pianeta. Sulla luna Tritone, gelida, vede eruzioni simili a geyser. Fino al 2026 è l'unica sonda che ha visitato Urano e Nettuno.
```

## film-pale-blue-dot.mp3

```text
[excited] Un puntino azzurro.

Il 14 febbraio 1990, da circa 6 miliardi di chilometri, Voyager 1 si gira e fotografa il Sole e sei pianeti: è il «ritratto di famiglia». Nella foto la Terra è un puntino azzurro grande circa un pixel. L'idea della foto era dello scienziato Carl Sagan.
```

## film-bolla-del-sole.mp3

```text
[excited] Fuori dalla bolla del Sole.

Il Sole soffia intorno a sé una grande bolla di particelle, l'eliosfera. Voyager 1 incontra il suo confine interno, lo shock di terminazione, nel 2004 e il 25 agosto 2012 esce dalla bolla, a circa 122 unità astronomiche dal Sole. Voyager 2 la segue il 5 novembre 2018. Nel 2026 sono le uniche sonde arrivate nello spazio interstellare.
```

## film-oggi.mp3

```text
[excited] Ancora in viaggio.

Il 15 ottobre 2026 Voyager 1 è a circa 172 unità astronomiche dal Sole e i suoi segnali impiegano quasi 24 ore per arrivare sulla Terra; Voyager 2 è a circa 144 unità astronomiche. L'energia delle sonde cala ogni anno, così il gruppo della missione spegne gli strumenti uno alla volta: a quella data Voyager 1 ne ha 2 accesi, Voyager 2 ne ha 3.
```

## film-futuro.mp3

```text
[excited] E poi?.

Il 18 novembre 2026 Voyager 1 si trova a un giorno luce dalla Terra: la luce impiega un giorno intero per arrivare fin lì. Nessuno sa quando le sonde smetteranno di parlarci: nel 2026 la NASA spera di tenere acceso almeno uno strumento fino agli anni 2030. Secondo le stime, fra circa 40.000 anni le due sonde passeranno vicino ad altre stelle, ma sempre a più di un anno luce di distanza. Con loro viaggiano i dischi d'oro con i saluti della Terra.
```
