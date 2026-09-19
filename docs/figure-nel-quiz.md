# Figure nelle domande (F6)

Alcuni argomenti non si insegnano bene a sole parole: leggere l'orologio con le lancette, misurare un angolo col goniometro, confrontare angoli, contare uno schieramento, riconoscere i tipi di linea. F6 aggiunge a una domanda una figura facoltativa, e un piccolo pilota di domande che la usano.

## Schema

Due campi facoltativi nella riga di `json/<materia>.json`:

| campo | tipo | regola |
|---|---|---|
| `figure` | stringa | id del file `assets/figure/<id>.svg`; deve rispettare `^[a-z0-9-]{1,60}$` e il file deve esistere ed essere tracciato da git |
| `figureAlt` | stringa | obbligatorio se c'è `figure`; alternativa testuale in italiano, 20-300 caratteri, finisce col punto |

Senza `figure` la domanda è identica a prima. Le domande bonus (`bonus: true`) non possono avere figure: il bonus ha un altro percorso di rendering.

## Rendering

- `questions-loader.js` copia `figure` e `figureAlt` nella domanda (`rowToQuestion`).
- `subject-quiz-core.js`, in `loadQuestion()`, toglie la figura della domanda precedente e, se la domanda ne ha una valida, crea un `<img class="q-figure" id="qFigure">` fra `#qText` e `#answers`, con `src="assets/figure/<id>.svg"`, `alt=figureAlt`, `width="320" height="240"`, `decoding="async"`.
- Si crea un elemento nuovo a ogni domanda invece di cambiare `src`: cambiando `src` il browser continua a mostrare la vecchia immagine finché la nuova non è pronta, e con la rete lenta il bambino vedrebbe l'orologio della domanda prima sotto il testo della domanda nuova.
- Niente CLS: `width`/`height` danno al browser le proporzioni prima del caricamento; il CSS limita la larghezza (`width: 100%; max-width: 320px; height: auto`). Su un telefono di 375px la figura occupa la colonna del testo accanto alla mascotte (215px, misurati); niente scroll orizzontale.
- Nessuna modifica agli HTML delle materie: l'elemento nasce dal core, come già la spiegazione (`#qExplanation`), e funziona su tutte le materie.

## Sicurezza

- Nessuna stringa SVG/HTML dal JSON finisce nel DOM: il dataset contiene solo un id, e l'unica cosa che il codice ne fa è comporre un URL sotto `assets/figure/`.
- L'id si valida due volte con la stessa regex: nell'audit (`audit_questions_json.js`) e a runtime nel core, prima di comporre l'URL. Il controllo a runtime serve per il ripasso, che rilegge i dati da `localStorage`: un valore manomesso non può uscire dalla cartella né diventare un URL con schema.
- Un SVG caricato con `<img>` è un'immagine: niente script, niente risorse esterne, nessun accesso alla pagina.
- CSP: `img-src 'self' data:` in `_headers` basta, nessuna modifica. Attenzione però: Cloudflare manda la CSP anche sulla risposta del file `.svg`, e l'SVG la applica a sé stesso. Un `<style>` interno o un attributo `style="..."` verrebbero bloccati (in locale con `python3 -m http.server` non si vede, perché non manda header). Per questo gli SVG usano solo attributi di presentazione (`fill`, `stroke`, `font-size`, ...) e l'audit rifiuta `<style`, `style=`, `<script`, `<foreignObject`, `href`, `on*=`.

## Accessibilità

- `figureAlt` è obbligatorio e diventa l'`alt` dell'immagine. Quando la figura è essenziale, l'alt deve bastare da solo per rispondere: descrive ciò che si vede, non la risposta. Per l'orologio descrive dove sono le lancette ("la lancetta corta è a metà fra il 4 e il 5, la lunga sul 6"): è il contenuto equivalente, e resta al bambino il passaggio da posizione a ora. Per il goniometro nomina le due scale e dove passano i lati.
- Colori: il sito non ha una modalità scura (nessun `prefers-color-scheme` nei CSS), e un SVG dentro `<img>` non legge le variabili CSS della pagina. Le figure sono quindi "cartoncini" autonomi: fondo bianco, bordo e tratti in grigio antracite `#2c2a28` (lo stesso nero caldo di `--ws-slate-black`), un solo colore d'accento per volta. Contrasto dei tratti principali 14:1 su bianco; accenti dalla palette Okabe-Ito: blu `#0072b2` (5,2:1 su bianco, 4,7:1 sul fondo `#eef4f9` del goniometro: va bene anche per il testo) e vermiglio `#d55e00` (3,9:1 su bianco, 3,5:1 sul fondo del goniometro: solo tratti spessi almeno 3 unità, mai testo; la soglia per la grafica è 3:1). Così le figure restano leggibili anche per chi usa la modalità Okabe-Ito, che non viene toccata. Nessuna informazione affidata al solo colore: le lancette si distinguono per lunghezza e spessore, gli angoli hanno una lettera.
- Se il browser forza una modalità scura sulle immagini, il cartoncino bianco resta leggibile; se la pagina un giorno avrà il tema scuro, il cartoncino con bordo arrotondato funziona anche su fondo scuro.

## Ripasso

`pushWrongQ()` salva anche `fig` e `figAlt` (solo se la domanda ha una figura); `startRipassa()` li rimette nella domanda. I record già salvati senza questi campi continuano a funzionare: nessuna figura. Una figura non si cancella mai dal repo finché qualche domanda (anche disattivata) la usa, e comunque conviene non cancellarla: un record di ripasso può citarla per settimane. Se il file manca, il browser mostra l'`alt` al suo posto.

## Altri consumatori del dataset

`js/breakout.js` pesca domande da tutte le materie e le mostra solo come testo: salta le righe con `figure`, altrimenti "Che ore segna l'orologio?" arriverebbe senza orologio.

## Service worker, cache, export

- Niente precache: le figure sono poche KB e servono solo a chi apre quelle domande. `sw.js` le mette già in `ASSETS_CACHE_NAME` alla prima richiesta (Cache First, `.svg` è in `STABLE_ASSET_RE`) e le tiene offline. `check_sw_precache.js` non cambia.
- `_headers` marca `/assets/*` come `immutable` e la cache degli asset non si svuota mai: **un file di figura non si modifica in place**. Per correggerne uno si crea un id nuovo (`orologio-4-30-b`) e si aggiorna la domanda. `prepublish-check.sh` (controllo "asset immutabili sostituiti in place") lo blocca già.
- Export: `export_for_cloudflare.sh` copia `assets/` dai file tracciati da git, quindi un SVG dimenticato fuori da `git add` non verrebbe pubblicato. `check_export.js` verifica che ogni `figure` delle domande pubblicate abbia il suo file nell'export. Gli SVG non si minificano: sono scritti a mano e piccoli.

## Regole per disegnare un SVG

- Un file per figura in `assets/figure/<id>.svg`, id in minuscolo con trattini (`orologio-4-30`, `goniometro-40`, `schieramento-3x5`).
- `viewBox="0 0 320 240"` e `width="320" height="240"` sulla radice, sempre (formato unico 4:3: l'`<img>` ha dimensioni fisse e non serve leggere il file per evitare il CLS). L'audit lo verifica.
- Primo elemento: il cartoncino, `<rect x="1" y="1" width="318" height="238" rx="14" fill="#fff" stroke="#d9d2c5" stroke-width="2"/>`.
- Peso massimo 6 KB. Niente immagini raster incorporate, niente font esterni, niente `<style>`, niente `style=`, niente script o link.
- Testo nell'SVG solo se indispensabile (numeri dell'orologio, gradi del goniometro, lettere A-B-C): `font-family="Arial, Helvetica, sans-serif"`, grassetto, almeno 16 unità (a 375px la figura è larga 215px, scala 0,67: 16 diventa circa 11px, ed è il minimo; meglio 18-20 dove c'è spazio). Il testo della domanda resta nel JSON, mai nell'immagine.
- Tratti principali spessi almeno 3 unità, colori come sopra.
- Il file comincia con `<svg` (niente prologo XML) e ha un `id` sugli elementi che portano la risposta (`lancetta-ore`, `lancetta-minuti`, `lato-1`, `lato-2`, `angolo-A`, `linea-B`, ...): servono a verificare la figura.
- Le coordinate si calcolano, non si stimano. Nel pilota uno script usa e getta ha generato gli SVG, e un secondo script, senza usare i parametri del primo, ha riletto dai file le coordinate (angolo delle lancette, lati del goniometro, pallini, comandi dei tracciati) e ricavato la risposta di ogni domanda.

## Aggiungere una domanda con figura

1. Disegna l'SVG seguendo le regole sopra e aggiungilo a git.
2. Nello shard JSONL aggiungi i due campi alla riga: `"figure":"orologio-4-30","figureAlt":"Un orologio con le lancette: ..."`. `ingest_generated.py` li porta nel dataset (li valida con la stessa regex e rifiuta la riga se manca `figureAlt`).
3. Il testo della domanda deve avere senso insieme alla figura ("Che ore segna l'orologio della cucina?") e non deve nominare "la figura sopra" (lint). Stem unici anche fra domande con figure diverse: l'ingest salta un testo già presente, e la firma anti-ripetizione della partita è testo + risposta.
4. Il resto della sequenza è quella di `docs/prompt-generazione-matematica.md` (ingest una volta, `sync_question_counts.py`, controlli).
5. Guarda la domanda nel browser a 375px e a 1280px prima del commit.

## Cose imparate in F9 (26 figure, 40 domande)

- **Goniometro: il lato mobile passa vicino ai numeri quasi sempre.** Le cifre sono sui due anelli (esterno r≈104, interno r≈76) a 0, 30, 60, ... gradi, e anche un lato a 10° da un numero può toccarlo. Misurata la distanza fra il bordo del lato (mezzo tratto 2,5) e il riquadro delle cifre (larghezza 0,556 × corpo per cifra, altezza 0,716 × corpo): le etichette non sono simmetriche, quindi gli angoli liberi (≥ 1 unità) cambiano col lato fermo. Con le etichette dei file pubblicati: lato fermo a destra 20, 40, 50, 70, 80, 100; a sinistra 80, 100, 110, 130, 140, 160. Tutti gli altri toccano un numero.
- **Nei goniometri nuovi i lati si disegnano prima dei numeri** (come in `goniometro-40-sinistra`): l'alone chiaro dei numeri resta sopra al lato e ogni cifra si legge intera.
- **Orologio: l'ora si ricava con l'arrotondamento, non con la divisione intera.** Una coordinata a un decimale sposta la lancetta corta di qualche centesimo di grado: `(angolo - minuti × 0,5) // 30` dava le 10 per le 11 in punto. Usare `round(... / 30)`.
- **Il testo alternativo delle figure misurabili si può ricostruire dalla lettura** (orologio, goniometro, schieramento) e confrontare parola per parola con lo shard; per poligoni, rette e angoli con l'arco resta un controllo a mano sulle coordinate.
- **Le lettere A-D come risposta finiscono con una preposizione per il lint** ("... della coppia A?" è letto come "a" sospesa): mettere la lettera prima ("Nella coppia A, che posizione hanno ...?").
