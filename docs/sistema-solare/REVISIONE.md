# Il Sistema Solare in 3D — guida alla revisione

Stato al 16 ottobre 2026: **pagina in revisione, non pubblicata e non collegata al sito.**
Nessun link dalla home o da altre pagine, niente sitemap, niente service worker,
`noindex` nella pagina. Prima della pubblicazione: revisione di un fisico, poi
prova con i bambini.

## Come aprirla

```
python3 -m http.server 8080
```

poi `http://localhost:8080/sistema-solare.html`. Si può aprire direttamente su un
corpo: `sistema-solare.html#giove`, `#perseidi`, `#buco-nero`.

## File

| File | Cosa contiene |
|---|---|
| `docs/sistema-solare/dati.json` | Dati fisici e testi per i bambini, con le fonti di ogni voce (`fonti`) e le note (`note`, `valori_derivati`). |
| `docs/sistema-solare/orbite.json` | Elementi orbitali e orientamento dei poli, con fonte e note. |
| `docs/sistema-solare/revisione-A.json`, `revisione-B.json` | Le 35 correzioni dei due revisori indipendenti, già applicate, con motivo e fonte. |
| `docs/sistema-solare/faq.json` | Le 12 domande frequenti della pagina, con le fonti. Da rileggere come le schede. |
| `scripts/build_sistema_solare.py` | Unisce i JSON in `js/sistema-solare-dati.js` e scrive in `sistema-solare.html` le parti statiche: schede di tutti i corpi, domande frequenti (testo visibile e FAQPage identici) e crediti delle immagini. Non aggiunge numeri. |
| `scripts/check_sistema_solare.js` | Controlli automatici (sotto). |
| `js/sistema-solare-motore.js` | Calcolo delle posizioni e disegno 3D (WebGL, nessuna libreria). |
| `js/sistema-solare.js` | Interfaccia e testi calcolati (rapporti, bilancia, tempo della luce). |

Controlli: `python3 scripts/build_sistema_solare.py --check && node scripts/check_sistema_solare.js`

## Cosa chiedere al fisico

Le domande sono in ordine di importanza. Per ognuna c'è dove guardare.

### 1. I dati delle schede

56 corpi, 7 sciami meteorici, 5 schede (fascia degli asteroidi, fascia di Kuiper,
nube di Oort, meteoroide/meteora/meteorite, buchi neri). Fonti principali: NASA
NSSDC Fact Sheets, JPL Solar System Dynamics, JPL Small-Body Database, NASA
Science, IAU, IMO (calendario 2027, quello 2026 non era raggiungibile), ESA, EHT,
NOIRLab. Due revisori indipendenti hanno ricontrollato ogni voce.

Punti dove le fonti non concordano, già decisi ma da confermare:

- **Lune conosciute**: Giove 115, Saturno 293 (NASA, agosto-settembre 2026),
  Urano 29, Nettuno 16. La scheda NSSDC è ferma a 95/274/28.
- **Eris**: rotazione sincrona con Disnomia (378,9 ore, studi 2023) invece delle
  25,9 ore della pagina NASA. La massa è quella del sistema Eris+Disnomia.
- **Caronte**: densità 1,705 g/cm³ (coerente con massa e raggio). La tabella JPL
  riporta 1,853, che non torna con la sua stessa massa e il suo raggio.
- **Dimorphos**: periodo e distanza dopo l'impatto DART (0,47365 giorni, 1,152 km).
- **Giove**: «più di 1300 volte il volume della Terra» (rapporto NSSDC 1321)
  invece del «ci starebbero 1000 Terre» della NASA. Grande Macchia Rossa «seguita
  senza interruzioni dal 1831» invece di «da più di 300 anni».
- **Temperature**: per i giganti è la temperatura a 1 bar; dove le fonti non danno
  un valore il campo è vuoto e non si mostra.

### 2. Le posizioni

- **Pianeti**: elementi kepleriani di Standish, tabella 1 di «Approximate
  Positions of the Planets» (JPL), validi 1800-2050. Per questo la data si può
  scegliere solo in quell'intervallo. Errori nominali dichiarati dalla fonte: da
  10″ (Nettuno) a 600″ (Saturno) in longitudine. La «Terra» è il baricentro
  Terra-Luna.
- **Pianeti nani, asteroidi, comete**: elementi osculanti JPL SBDB a un'epoca
  sola, propagati con il problema dei due corpi, senza perturbazioni. Lontano
  dall'epoca l'errore cresce. Per le comete si parte dal tempo del perielio
  (Halley: 9 febbraio 1986). Con il periodo fisso il modello sbaglia gli altri
  perieli di Halley, perché quello vero cambia da un giro all'altro: 1910 (vero
  20 aprile, modello 11 marzo), 2061 (vero 28 luglio, modello 8 gennaio 2062),
  1835 (vero 16 novembre, modello 10 aprile 1834). Da valutare se serve una
  propagazione migliore o se basta dirlo.
- **Lune**: elementi osculanti JPL Horizons in eclittica J2000 attorno al pianeta
  (epoca 20 novembre 2025), con il moto medio dal periodo medio JPL. Niente
  precessione di nodi e apsidi: la fase è buona vicino a oggi, approssimata
  lontano. La pagina lo dice.
- Controlli automatici sulle posizioni: opposizione di Marte del 16 gennaio 2025
  (scarto < 1°), perielio di Halley del 9 febbraio 1986 (|r − q| < 0,01 UA),
  perielio e afelio della Terra a gennaio e luglio.

### 3. Rotazione e orientamento

- Sole e pianeti: polo e primo meridiano IAU (Archinal et al. 2018, file NAIF
  `pck00011.tpc`), solo termini lineari. La Terra usa i valori IAU 2009.
- Lune in rotazione sincrona: polo perpendicolare all'orbita e longitudine 0
  rivolta al pianeta. È la definizione IAU per questi corpi, approssimata.
- Corpi senza orientamento noto (Eris, Haumea, Makemake, Bennu, Ryugu, comete…):
  polo verso il nord dell'eclittica e nessuna rotazione. **È un'approssimazione
  da segnalare**: in scena non girano.
- Corpi non sferici: ellissoide con i tre diametri veri (`assi_km`). Non sono i
  modelli di forma veri.

### 4. Che cosa NON è in scala, e lo dichiara

- Nella scena le **distanze** sono accorciate (dal Sole: 18 · r^0,45 unità, r in
  UA) e i **raggi** ingranditi (0,012 · R^0,42, R in km). Le distanze delle lune
  dal pianeta sono accorciate con un'altra funzione. Tutte crescono con il valore
  vero, quindi l'ordine resta giusto. Un riquadro sulla scena lo dice sempre.
- **Confronta le grandezze**: raggi in scala vera fra loro, corpi in fila.
- **Fasce** (asteroidi 2,0-3,2 UA, Kuiper 30-50 UA): nuvole di punti casuali fra i
  raggi citati, spessore 10° scelto per il disegno. Indicano dove sono le fasce,
  non dove si trova ciascun oggetto.
- **Anelli**: raggi NSSDC e PDS. L'opacità è una scelta di disegno che segue solo
  l'ordine di densità (B > A > C > Cassini…; quelli di Giove quasi invisibili).
  Gli anelli stretti sono disegnati come linee, senza una larghezza inventata.
- **Buco nero** (solo nel confronto): sfera nera grande quanto l'orizzonte di
  Schwarzschild, r = 2GM/c², con M = 4,0 · 10⁶ masse solari (la scheda dice
  «circa 4 milioni»). Ne esce un diametro di circa 24 milioni di km. L'alone
  arancione è un disegno e la scheda lo dice.
- **Illuminazione**: solo la luce del Sole (Lambert), senza ombre, eclissi o
  ombre degli anelli.

### 5. Le mappe di superficie

32 mappe vere in `assets/sistema-solare/` (6 MB in tutto), preparate da
`scripts/prepara_mappe_sistema_solare.py`. L'elenco con fonte, licenza,
credito e longitudine centrale è in `docs/sistema-solare/texture.json`.
Le motivazioni delle scelte e delle esclusioni sono in `mappe-da-scaricare.md`.

- **Longitudine al centro della mappa**: verificata su elementi noti per Terra,
  Luna, Venere, Marte, Io, Teti, Mimas, Plutone, Dione e Giapeto. Per le altre si
  usa la convenzione più comune (0° al centro, 180° per i mosaici di Schenk e New
  Horizons). **Da controllare**, soprattutto Cerere, Titano, Tritone e Caronte.
  Se è sbagliata, la mappa resta giusta ma è ruotata attorno all'asse.
- **Saturno** (Hubble OPAL 2025): mancano i dati ai poli e in una fascia
  equatoriale coperta dagli anelli. Le righe vuote sono riempite con la riga
  valida più vicina (poli) e con una sfumatura (equatore). È l'unico intervento
  sui pixel.
- **Urano e Nettuno**: niente mappa. Hubble ne vede solo metà e i bordi hanno
  artefatti. Il colore uniforme è la media dei pixel validi delle mappe OPAL.
  Per Nettuno gli astronomi hanno aumentato il contrasto, quindi il verde-azzurro
  potrebbe essere più saturo del vero. **Da valutare.**
- **Sole**: bianco uniforme (NASA Space Place: visto dallo spazio il Sole è
  bianco). L'alone è un disegno.
- **Lune di Urano e Tritone**: Voyager 2 ne ha visto solo l'emisfero sud. Il
  resto della mappa è nero e la scheda lo dice.
- **Senza mappa** (grigi): Eris, Haumea, Makemake, Amaltea, Iperione, Proteo,
  Nereide, Disnomia, Pallade, Igea, Eros, Itokawa, Didymos, Dimorphos, Fetonte,
  Arrokoth e le comete.
- **Ryugu**: mappa JAXA con licenza educativa non commerciale («© JAXA»),
  approvata da Mattia il 16/10/2026.

### 6. I calcoli mostrati ai bambini

- **Bilancia**: peso sulla Terra × g / 9,80665. Per i giganti si usa la gravità a
  1 bar, per il Sole quella della fotosfera, e la scheda lo dice.
- **Tempo della luce**: distanza dalla Terra nelle posizioni del modello, diviso
  c. Per una luna si usa il suo pianeta.
- **Sole come un pallone da 22 cm**: stessa scala per diametro e distanza media.
- **Rapporti con la Terra**: diametro e massa divisi per quelli della Terra.

### 7. Le parti di gioco (aggiunte il 16/10/2026)

- **Missioni**: 10 sfide («Trova il pianeta più caldo, in media»). La risposta
  non è scritta a mano: la calcola `js/sistema-solare.js` dai dati delle schede
  (massimo, minimo o condizione unica). Se dopo una revisione cambia un numero,
  la risposta lo segue. Una missione senza un'unica risposta non viene proposta.
  Da controllare le formulazioni: «più caldo» usa la temperatura media (per i
  giganti quella a 1 bar), «pianeta meno denso dell'acqua» la densità media.
- **Cartellino** sulla scena: tre dati presi dalla scheda e le curiosità della
  scheda, che cambiano ogni 8 secondi (si possono fermare).
- **Viaggio guidato**: 12 tappe dal Sole a Plutone, 14 secondi l'una o il tempo
  della lettura con la voce. Con il movimento ridotto non avanza da solo.
- **Passaporto**: un timbro per corpo visitato, salvato solo nel browser.
- **Tempo**: parte a 1 ora al secondo, così la Terra fa un giro su se stessa in
  24 secondi.

### 8. Revisione del 16/10/2026 (dopo la prima prova di Mattia)

- **Vista a tutto schermo** di partenza: comandi sopra la scena, ✕ per la pagina
  normale, ⛶ per lo schermo intero del browser (dove c'è).
- **Velocità automatica del tempo**: 1 mese al secondo quando si guarda tutto il
  sistema, 1 ora al secondo vicino a un corpo. Sono velocità vere tutte e due.
- **Schede per bambini**: domande semplici («Quanto dura un giorno?»), durate dette
  a parole («6 giorni e 9 ore»), «Tu su Marte» (peso ed età). I numeri tecnici sono
  in «Dati per i grandi». Calcoli nuovi da controllare: età = anni × 365,25 /
  periodo orbitale; tempo della luce dal Sole = semiasse maggiore / c; «giorno» =
  giorno solare dove la scheda lo dà, altrimenti rotazione siderale.
- **Viaggio guidato** come autopilota: 16 tappe, comprese le due fasce, Io e
  Titano. Ogni tappa dura 10 secondi, o la lettura con la voce, e la camera gira
  piano.
- **Audio**: `docs/sistema-solare/audio-testi.md` contiene i 68 testi da
  registrare con ElevenLabs. La pagina usa gli mp3 solo se il testo non è
  cambiato dopo la registrazione.

### 9. Stazione Spaziale Internazionale (16/10/2026)

- **Dati**: `docs/sistema-solare/iss.json`, fonti NASA ed ESA. In `dati.json`
  c'è solo ciò che ha una fonte. È stata tolta la curiosità «16 albe e 16
  tramonti», dedotta dall'agente.
- **Orbita**: dal TLE CelesTrak del 15/10/2026, con la rotazione del piano dovuta
  a J2 (−4,95° al giorno, formula in `scripts/build_sistema_solare.py`). La
  distanza dalla Terra è in proporzione vera.
  **La posizione lungo l'orbita è indicativa** e lo dice la scheda: il TLE vale
  pochi giorni. Per tenerla vicina al vero va aggiornato il TLE in `iss.json`.
- **Modello**: NASA 3D Resources «ISS (A)», NASA/Ames, convertito con Blender
  (`scripts/blender_esporta_modello.py` e `scripts/prepara_iss_sistema_solare.py`).
  È disegnato circa 4700 volte più grande del vero, e la scheda lo dice.
  L'orientamento (traliccio perpendicolare all'orbita) è un'approssimazione.

### 10. Movimento «estetico» (16/10/2026, richiesta di Mattia)

Le rotazioni non sono più in tempo reale accelerato: sono scelte per guardarle.

- Ogni corpo parte dalla **posizione vera** del giorno mostrato.
- Poi ognuno si muove con una velocità compressa: la velocità vera elevata alla
  0,35 e limitata. I limiti stanno in `js/sistema-solare-motore.js`, funzione
  `velocitaEstetica`.
  - Orbite: fra 0,6 e 9 gradi al secondo. La Terra fa un giro attorno al Sole in
    un minuto, Nettuno in circa 6 minuti, la Luna e la ISS in circa 40 secondi.
  - Rotazioni: fra 0,6 e 10 gradi al secondo. La Terra fa un giro su se stessa in
    circa un minuto, Venere, al contrario, in 10 minuti.
- **L'ordine resta vero**: chi è più veloce resta più veloce, e il verso di
  rotazione è quello vero. **I rapporti invece non sono veri**, e la pagina lo
  dice: accanto alla data compare «movimento rallentato» e la nota è in
  Strumenti.
- In **Strumenti → Tempo vero** si torna alla versione di prima: date vere e
  velocità accelerate 1 ora, 1 giorno, 1 mese o 1 anno al secondo.
- Le distanze vere scritte nelle schede («oggi è a … km dalla Terra») usano
  sempre la posizione vera del giorno mostrato, non quella animata.
- **ISS**: orbita e scia rosa. Nel primo piano la Terra non si disegna, e la
  camera non può entrare dentro nessun corpo.

### 11. Interfaccia per bambini (16/10/2026)

- Un colore per funzione: verde = parti, blu = scopri e guarda, viola = ascolta,
  giallo = missione, arancione = passaporto, grigio = opzioni. Ogni pulsante ha
  icona e parola. Il contrasto del testo, misurato dal browser nelle due
  palette, va da 5,2 a 8,5 a 1.
- In basso, il «poster» dei pianeti, dal Sole a Nettuno. Ognuno è grande come la
  radice del suo raggio vero, quindi non in scala, e la pagina lo scrive.
- Alla prima visita c'è un benvenuto con due scelte; si rivede da Opzioni.
- Avvisi «🛂 Nuovo timbro» e «🎉 Missione compiuta», e il numero di timbri sul
  pulsante del passaporto.

### 12. Il viaggio delle Voyager (16/10/2026)

Si apre da **Altri posti → Sonde Voyager → 🎬** oppure, alla fine del viaggio
guidato, da solo. Dura circa 2 minuti e mezzo: 9 capitoli, dal lancio al 2049.

- **Dati e testi**: `docs/sistema-solare/voyager.json`, solo fonti NASA/JPL e
  NSSDC, riletto da un revisore indipendente (20 correzioni, in
  `revisione-voyager.json`). Dove le fonti non concordano c'è una nota e il
  numero non è usato (per esempio la velocità di lettura del Disco d'oro).
- **Traiettorie**: JPL Horizons, soluzione `Voyager_*_ST+refit2022_m`
  (R. Jacobson, DE440), in `voyager-traiettoria.json`. Passo di 6 ore attorno
  ai sorvoli, poi 5 e 30 giorni. Il file che la pagina scarica
  (`assets/sistema-solare/voyager-traiettorie-v1.json`, 113 KB compresso)
  arriva al 2050. Da chiedere al fisico:
  - fino al 1981 (V1) e al 1989 (V2) Horizons usa coniche raccordate «con
    accuratezza approssimativa»: orari e distanze dei sorvoli sono approssimati;
  - dopo il 1992 non ci sono nuovi tracciamenti nella soluzione: **il futuro è
    una previsione**, e il film lo scrive («🔭 Il futuro»).
- **Che cosa non è in scala**:
  - le distanze dal Sole sono compresse come quelle dei pianeti;
  - vicino a un pianeta la sonda è disegnata rispetto al pianeta disegnato, non
    rispetto al Sole: con le distanze compresse, altrimenti passerebbe lontano
    dal pianeta che sta visitando. Il passaggio fra i due modi è graduale
    (funzione `visivaSonda` in `js/sistema-solare-motore.js`), quindi la
    forma della scia vicino ai sorvoli non è quella vera;
  - l'eliopausa è disegnata come una sfera alla distanza a cui ciascuna sonda
    l'ha attraversata (V1 nel 2012, V2 nel 2018). La forma vera non è una sfera,
    e la scheda non dice il contrario: va controllato che il testo sia chiaro;
  - il modello 3D (NASA 3D Resources «Voyager Probe (A)», ridotto a 9870
    triangoli) è disegnato enormemente più grande del vero, come la ISS.
    L'antenna è rivolta verso la Terra.
- **Tempo** (rivisto il 16/10/2026 su richiesta di Mattia): la data in alto è
  quella vera del punto della traiettoria. Fra un capitolo e l'altro corre di
  anni in pochi secondi, nelle soste si ferma. **Solo le sonde seguono la
  data.** Pianeti e lune partono dalla posizione vera del 19 agosto 1977 e poi
  si muovono con il movimento estetico (sezione 10), altrimenti fra il 1990 e
  il 2049 la Terra farebbe decine di giri in pochi secondi. Attorno ai sorvoli
  scivolano lungo l'orbita fino alla posizione vera (funzione `tempiDisegno` in
  `js/sistema-solare-motore.js`, rampa di 200 giorni di film):
  - la Terra ai lanci, e i corpi sorvolati (Giove, Saturno, Titano, Urano,
    Nettuno) dal primo all'ultimo sorvolo, seguono la data vera: le sonde li
    incontrano dove li hanno incontrati davvero. Misurato sullo schermo, a ogni
    sorvolo la sonda è a 2–5 raggi del pianeta disegnato;
  - le altre lune di quei pianeti si fermano nella posizione vera del primo
    sorvolo (quella che le sonde hanno visto) e girano solo su se stesse.
  **Fuori dai sorvoli i pianeti non sono dove erano in quella data** (per
  esempio nel capitolo «Ancora in viaggio» del 2026). Le schede del film non
  dicono dove si trovano i pianeti, ma va chiesto al fisico se serve una nota.
- **ISS**: non si mostra prima del 20 novembre 1998, lancio del primo modulo
  (ESA, campo `primo_modulo` in `iss.json`).
- **Scia**: bianca per Voyager 1, azzurra per Voyager 2, dalla Terra al giorno
  mostrato.
- **Foto**: disegno ufficiale (PIA04495), «pallido puntino azzurro» nella
  versione 2020 (PIA23645), «ritratto di famiglia» (PIA00451), copertina del
  Disco d'oro. Tutte NASA/JPL-Caltech, crediti nella didascalia.
- **Audio**: i testi dei capitoli sono in `audio-testi.md` (sezione film). Gli
  mp3 non ci sono ancora: con «Nel viaggio guidato, leggi ad alta voce» acceso in Opzioni, il film
  usa la voce del browser e aspetta che finisca prima di ripartire.

## Prova con i bambini

Cosa osservare (bambini di 9-11 anni, senza aiuto all'inizio):

1. Senza spiegazioni: riescono a scegliere un pianeta e ad arrivarci? Usano i
   pulsanti, toccano la scena o trascinano?
2. Capiscono il riquadro «non è in scala»? Dopo **Confronta le grandezze**
   sanno dire quanto è grande il Sole rispetto alla Terra?
3. Leggono la scheda? Quali riquadri guardano, quali saltano? La **bilancia**
   la usano?
4. Parole difficili: annotare quelle che chiedono (UA, orbita, rotazione
   sincrona, obliquità…).
5. Il **tempo che scorre**: lo notano? Lo fermano? Capiscono che la data cambia?
6. **Ascolta**: lo provano? La voce è comprensibile?
7. Da tablet: due dita per avvicinarsi, un dito per girare. Funziona?
8. Dopo 10 minuti: che cosa ricordano?
9. Le missioni: le leggono da soli? Si arrendono o provano altri corpi? Il
   messaggio «Non è Marte (largo 6779 km)» li aiuta a ragionare?
10. Il viaggio guidato: lo seguono fino in fondo? Con la voce o senza?
11. Il passaporto: li spinge a cercare le lune e le comete?
12. Il benvenuto: lo leggono? Scelgono «Parti per il viaggio» o «Esploro da solo»?
13. Il poster dei pianeti: capiscono chi è più grande? Toccano i pianeti o i nomi?
14. I colori: dopo qualche minuto sanno dire che cosa fa il pulsante verde e
    che cosa fa quello viola?
15. Il film delle Voyager: lo guardano fino alla fine? Leggono le schede o
    premono subito «Vai avanti»? Capiscono che dopo «oggi» è una previsione?

## Prima della pubblicazione (da fare dopo le revisioni)

- Seguire la checklist di `docs/sistema-solare/AUDIT-SEO.md` (fase P). La fase
  A è fatta: schede, FAQ e crediti statici, titolo, JSON-LD, immagine di
  anteprima, pagina leggibile senza JavaScript.
- Collegamenti: card in home, link da Scienze e Per insegnanti, sitemap,
  `_redirects`, precache nel service worker, `llms.txt`, togliere `noindex`,
  immagine OG, `check:sistema-solare` nella catena `verify`, contrasto con
  `npm run check:contrast`.
- Versione, `json/changelog.json`, `CHANGELOG.md`.
