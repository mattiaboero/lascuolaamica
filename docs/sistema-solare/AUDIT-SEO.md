# Il Sistema Solare in 3D — audit SEO e AEO

16 ottobre 2026, branch `feat/sistema-solare`. Audit in sola lettura: nessun file del
sito è stato modificato. Tre analisi indipendenti (tecnica, schema del sito, parole
chiave/SERP/risposte AI) riunite qui; i numeri delle FAQ sono stati ricontrollati su
`js/sistema-solare-dati.js`.

Legenda: **[M]** misurato o osservato, **[S]** stima o giudizio.

## Stato (16/10/2026, sera)

Fase A applicata sul branch, pagina ancora `noindex`:

- **C1** schede statiche, **A2** FAQ, **M3** crediti: generati da
  `scripts/build_sistema_solare.py` fra i marcatori `SCHEDE` e `FAQ-JSONLD` di
  `sistema-solare.html` (15 schede complete, 12 domande da `faq.json`, 41
  crediti). `--check` segnala se non sono allineati ai dati. Le fonti sono
  scritte come indirizzi, come nella scheda della scena.
- **C2** senza JavaScript si leggono titolo, testo e schede (regole in
  `noscript.css`, file condiviso: alla pubblicazione serve il bump); in vista
  immersiva l'h1 resta nel documento, nascosto solo alla vista.
- **C3** `screenshots/og-sistema-solare-1200x630.jpg` (vista d'insieme, 93 KB).
- **A1** title 53 caratteri, description 146, h1 «… per bambini».
- **A3** JSON-LD allineato (`#app`, Wikidata, `isBasedOn`, età 9-11).
- **A6** tolta per ora la frase sull'offline (torna con la fase P).
- **M1** «Fermale», **M2** «1 volte la Terra», **B1** immagine del film, **B2**
  «8 pianeti» con fonte NASA (in `faq.json`).
- **M4** audio a 64 kbps mono: da 9,6 a 3,2 MB; originali a 192 kbps nel
  Cestino del Mac (`sistema-solare-audio-originali-192k-20261016`).
- **A4/A5** prestazioni: vedi «Prestazioni dopo la fase A» in fondo.

Verifiche: Lighthouse accessibilità e buone pratiche 100 (desktop e mobile),
SEO 66 solo per il `noindex` voluto; axe senza violazioni A/AA su schede, FAQ
e crediti in tema chiaro e scuro; nessun ID duplicato; FAQ visibili e JSON-LD
identiche.

## In breve

La struttura della pagina è già al livello di Bosco e Scienze (title, canonical, Open
Graph, JSON-LD, testo per adulti). Il limite vero è un altro: **il 95% dei contenuti
non lo legge nessun motore**.

1. Le schede dei 60 corpi (circa 12.000 parole con fonte NASA/JPL/IAU) esistono solo
   dentro `js/sistema-solare-dati.js` e compaiono una alla volta. Nell'HTML ci sono 752
   parole, di cui 261 informative. I crawler delle AI (GPTBot, ClaudeBot, PerplexityBot)
   in genere non eseguono JavaScript: per loro i dati non esistono. **[M]**
2. La modalità immersiva è scritta nell'HTML (`body.ss-immersivo`) e nasconde con
   `display:none` h1, breadcrumb, testo per adulti e anche il `<noscript>`. Senza JS si
   vede solo un riquadro scuro con pulsanti che non funzionano. **[M]**
3. L'immagine di anteprima (`og-sistema-solare-1200x630.jpg`) è dichiarata ma non esiste,
   e nessun controllo se ne accorge. **[M]**

**L'occasione:** non esiste un simulatore 3D del Sistema Solare in italiano pensato per
bambini. I concorrenti italiani (Focus Junior, solaresistema.it) hanno pubblicità o
tracciamento e non citano fonti. Le domande puntuali («quante lune ha Saturno 2026»,
«quanto dura un anno su Marte») trovano oggi risposte vecchie o discordanti. La pagina
ha dati datati e con fonte: è il materiale che le risposte AI preferiscono citare. **[M+S]**

**Data utile:** il 18 novembre 2026 Voyager 1 sarà a un giorno luce dalla Terra, e i
giornali ne parlano già. Il dato è già nel film. Se le revisioni finiscono prima, la
parte Voyager ha un picco di interesse naturale. Non è un motivo per accorciare le
revisioni. **[M+S]**

## Cosa dicono i dati di ricerca

- **Search Console** (giugno 2025 – ottobre 2026): **nessuna** query di astronomia sul
  sito. `/scienze` ha 407 impressioni, posizione media 10,3. La pagina parte da zero e
  non toglie traffico a nessuna pagina esistente. **[M]**
- **Volumi di ricerca:** non disponibili. Le priorità vengono dai suggerimenti di Google
  (numero e ricchezza delle varianti). **[M]**
- **SERP italiane e AI Overview:** non osservabili direttamente (CAPTCHA). L'analisi
  usa fonti indirette. **[M]**

| Gruppo di ricerche | Esempi (dai suggerimenti di Google) | La pagina risponde? |
|---|---|---|
| Esplorare in 3D | sistema solare 3d (per bambini, online, simulatore), simulatore sistema solare | **Sì, è il tema principale** |
| Curiosità puntuali (AEO) | quanto dura un anno su… (tutti i pianeti), quante lune ha… (con «2026»), qual è il pianeta più…, quanto ci mette la luce del Sole | **Sì, con dato e fonte** |
| Grandezze | grandezza dei pianeti, pianeti a confronto, pianeti in ordine | Sì (confronto in scala vera) |
| Voyager | dove si trova Voyager 1, disco d'oro, pallido puntino azzurro, eliopausa | Sì (film e schede) |
| Insegnanti | sistema solare classe quinta, verifica, schede | In parte: i quiz di Scienze coprono le verifiche |
| Materiale da stampare | pdf, disegni, lavoretti | No |

**[S]** Le ricerche generiche («sistema solare», «pianeti») sono difficili per un sito
senza storia in astronomia. Le occasioni concrete sono «sistema solare 3d per
bambini» e la coda lunga delle curiosità.

## Interventi, per priorità

Fase **A**: si può fare subito sul branch, la pagina resta `noindex`.
Fase **P**: si fa il giorno della pubblicazione, dopo fisico e bambini.

### Critici

| # | Problema | Correzione | Fase |
|---|---|---|---|
| C1 | Schede solo in JS | **Atlante statico generato** da `scripts/build_sistema_solare.py` tra due marcatori in `sistema-solare.html`: un `<article id="venere">` per Sole, pianeti, Luna e pianeti nani (testo, dati principali, fonti con link), una tabella per gli altri corpi. Nessun numero scritto a mano: si rigenera dai dati, quindi segue le correzioni del fisico. Peso stimato 20-25 KB compressi **[S]**. In più gli `id` danno contenuto vero ai link `/sistema-solare#venere` | A |
| C2 | Immersiva nasconde h1, testo e `<noscript>` | Aggiungere a `noscript.css` (già caricato nel noscript) le regole che annullano l'immersiva; spostare l'`<h1>` dentro l'HUD, visibile e piccolo accanto a 🏠. Si risolve anche l'h1 assente per VoiceOver | A |
| C3 | Immagine OG mancante | Screenshot reale 1200×630 della vista d'insieme con le etichette. Nome definitivo prima del deploy (`/screenshots/*` è immutabile); alt che descriva l'immagine | A |

### Alti

| # | Problema | Correzione | Fase |
|---|---|---|---|
| A1 | Title di 83 caratteri, description di 184 | Title: `Sistema Solare 3D per bambini: esplora pianeti e lune` (53). Description: `Esplora il Sistema Solare in 3D: Sole, 8 pianeti, lune e comete nelle posizioni vere, con dati NASA spiegati ai bambini. Gratis, senza pubblicità.` (146). H1: `Il Sistema Solare in 3D per bambini` | A |
| A2 | Nessuna FAQ | Sezione `seo-faq` con `<details>`, come Bosco, e `FAQPage` con **lo stesso identico testo**. Testi pronti più sotto. I rich result FAQ non sono da aspettarsi: il valore è la citabilità nelle risposte AI | A |
| A3 | JSON-LD diverso dal resto del sito | Versione allineata più sotto: tipo come le materie, `isPartOf` e `publisher` per `@id`, `about` con le entità Wikidata, `isBasedOn` con i dataset NASA/JPL, età 9-11 | A |
| A4 | Prestazioni: 2,4 MB di mappe nella vista d'insieme, task lungo all'avvio. Lighthouse mobile 28, desktop 54 (su GPU software; con GPU vera mobile 46). Bosco 77 | Mappe in due livelli (512×256 nella vista d'insieme, 2048 solo da vicino); caricarle dopo il primo disegno, una per fotogramma; provare Mercurio e Marte a qualità minore | A |
| A5 | LCP legato al JS (il benvenuto compare dopo l'avvio) | Si risolve con l'h1 visibile di C2; in alternativa benvenuto già visibile nell'HTML | A |
| A6 | «Funziona anche offline» non è vero per tutto: `.bin` (modelli ISS e Voyager) e `.mp3` non passano dal service worker | Aggiungere `bin` alla cache stabile di `sw.js` (495 KB, solo quando servono); per l'audio c'è già il ripiego sulla voce del browser. Oppure correggere la frase | P |
| A7 | Integrazione nel sito | Checklist completa più sotto | P |

### Medi e bassi

| # | Problema | Correzione | Fase |
|---|---|---|---|
| M1 | «Fermale» ha un `aria-label` diverso dal testo (WCAG 2.5.3, segnalato da Lighthouse) | `aria-label="Fermale: ferma le curiosità che cambiano da sole"` | A |
| M2 | Scheda Terra: «(1 volte la Terra)» (`js/sistema-solare.js:490`) | Non mostrare il rapporto quando vale 1 | A |
| M3 | Crediti delle immagini solo nelle schede (già nella checklist di REVISIONE.md) | Sezione statica «Fonti e crediti», generata da `texture-fonti.json` | A |
| M4 | Audio a 192 kbps, 9,6 MB | Ricomprimere a 48-64 kbps mono, con nomi nuovi (`/assets/*` è immutabile). Nessun effetto SEO | A |
| B1 | `<img>` del film senza `src` (HTML non valido) | `hidden` sull'immagine o crearla da JS | A |
| B2 | «8 pianeti» non ha una frase con fonte nei dati | Aggiungerla a `dati.json` con fonte NASA prima di usarla nelle FAQ | A |
| B3 | Un URL per ogni pianeta? | **No, per ora.** Sessanta pagine quasi tutte sottili, da mantenere in sitemap, precache e revisione. Gli `article id` dell'atlante coprono i link profondi. Rivalutare dopo 2-3 mesi di Search Console | — |
| B4 | Image sitemap | Non serve: le foto NASA sono ovunque. Conta lo screenshot originale (C3) | — |

## Testi pronti

Tutti i numeri sono nei dati della pagina con la loro fonte. Anche questi testi vanno
fatti rileggere al fisico.

### Introduzione statica (sostituisce o arricchisce `.seo-static`)

> Questa pagina è un **modello 3D del Sistema Solare** pensato per i bambini della
> scuola primaria, in particolare di quarta e quinta. Puoi volare dal Sole agli otto
> pianeti, incontrare i pianeti nani come Plutone e Cerere, 27 lune, asteroidi,
> comete e la Stazione Spaziale Internazionale. I pianeti partono da dove si
> trovano davvero nel giorno scelto: le posizioni sono calcolate con i dati del Jet
> Propulsion Laboratory della NASA.
>
> Ogni corpo ha una scheda semplice: quanto è grande, quanto durano un giorno e un anno,
> che temperatura fa, quante lune ha e quanto segnerebbe la tua bilancia lassù. Ogni
> numero ha la sua fonte (NASA, ESA, Unione Astronomica Internazionale). Nel confronto
> delle grandezze vedi pianeti e Sole nelle proporzioni vere. C'è anche un viaggio
> guidato con la voce, missioni da completare con il passaporto spaziale e un film sul
> viaggio delle sonde Voyager.
>
> È gratis, senza pubblicità e senza registrazione.

La frase sull'offline va aggiunta solo dopo A6.

### FAQ (testo visibile e `FAQPage` identici)

1. **Quanti pianeti ci sono nel Sistema Solare?** Otto: Mercurio, Venere, Terra, Marte,
   Giove, Saturno, Urano e Nettuno. Plutone dal 2006 è un pianeta nano, per decisione
   dell'Unione Astronomica Internazionale. *(Dopo B2.)*
2. **Qual è il pianeta più grande?** Giove: il suo volume è più di 1300 volte quello
   della Terra. È un gigante di gas e non ha una superficie solida.
3. **Qual è il pianeta più vicino al Sole?** Mercurio. È poco più grande della Luna e fa
   un giro attorno al Sole in 88 giorni.
4. **Qual è il pianeta più caldo?** Venere, con una temperatura media di 464 °C, anche se
   Mercurio è più vicino al Sole: le sue nubi spesse trattengono il calore.
5. **Quanto tempo impiega la luce del Sole ad arrivare sulla Terra?** Poco più di 8 minuti.
6. **Quanto dura un anno su Marte?** Circa 687 giorni terrestri (686,98).
7. **Quanto peserei su Marte?** La bilancia segnerebbe circa il 38% di quanto segna sulla
   Terra: se sulla Terra segna 30 kg, su Marte circa 11 kg e sulla Luna circa 5 kg. Tu
   resti uguale: cambia quanto il pianeta ti tira verso il basso.
8. **Quante lune hanno Giove e Saturno?** Saturno 293 (conteggio di agosto 2026), Giove
   115 (settembre 2026). Il numero cresce quando ne vengono scoperte di nuove. Urano ne
   ha 29, Nettuno 16, Marte 2, la Terra 1; Mercurio e Venere nessuna.
9. **Dove si trova oggi Voyager 1?** Il 15 ottobre 2026 era a circa 172 UA dal Sole,
   cioè circa 25,7 miliardi di km: i suoi segnali impiegano quasi 24 ore per arrivare
   sulla Terra. Il 18 novembre 2026 sarà a un giorno luce dalla Terra.
10. **Che cos'è il «pallido puntino azzurro»?** È la foto della Terra scattata da
    Voyager 1 il 14 febbraio 1990 da circa 6 miliardi di km: la Terra è un puntino
    grande circa un pixel.
11. **Il modello è in scala?** No: le distanze sono accorciate e i corpi ingranditi,
    altrimenti i pianeti sarebbero puntini invisibili. Il confronto delle grandezze
    mostra le proporzioni vere.
12. **Ci sono buchi neri nel Sistema Solare?** No. Quello al centro della nostra
    galassia, Sagittarius A*, è a circa 27 000 anni luce; il più vicino che conosciamo,
    Gaia BH1, a circa 1600. Il Sole non diventerà mai un buco nero: è troppo leggero.

**Da tenere aggiornati:** i numeri che cambiano nel tempo (lune, posizione di Voyager)
vanno scritti con la data, e ricontrollati a ogni rilascio che tocca i dati. La data
dei dati va mostrata in pagina («Dati aggiornati al …») e messa in `dateModified`.

### JSON-LD della pagina

Sostituisce il primo blocco di `sistema-solare.html`. Il breadcrumb resta com'è. Gli ID
Wikidata sono stati verificati il 16/10/2026; gli URL di `isBasedOn` sono quelli già in
`docs/sistema-solare/`.

```json
{
  "@context": "https://schema.org",
  "@type": ["EducationalApplication", "LearningResource"],
  "@id": "https://lascuolaamica.it/sistema-solare#app",
  "name": "Il Sistema Solare in 3D",
  "description": "Modello 3D esplorabile del Sistema Solare per la scuola primaria: Sole, pianeti, pianeti nani, lune, asteroidi, comete, sciami meteorici, ISS e il viaggio delle sonde Voyager, con le posizioni calcolate dagli elementi orbitali del JPL e i dati di NASA, JPL e IAU spiegati in italiano.",
  "url": "https://lascuolaamica.it/sistema-solare",
  "image": "https://lascuolaamica.it/screenshots/og-sistema-solare-1200x630.jpg",
  "inLanguage": "it-IT",
  "applicationCategory": "EducationalApplication",
  "operatingSystem": "Web Browser",
  "browserRequirements": "Richiede WebGL per la scena 3D; le schede sono leggibili anche senza",
  "educationalUse": ["self-study", "demonstration"],
  "learningResourceType": ["Interactive resource", "Simulation"],
  "interactivityType": "active",
  "teaches": ["il Sole e i pianeti del Sistema Solare", "pianeti nani, lune, asteroidi e comete", "moto di rotazione e di rivoluzione", "grandezze e distanze nel Sistema Solare", "sciami meteorici"],
  "about": [
    {"@type": "Thing", "name": "Sistema solare", "sameAs": "https://www.wikidata.org/wiki/Q544"},
    {"@type": "Thing", "name": "Sole", "sameAs": "https://www.wikidata.org/wiki/Q525"},
    {"@type": "Thing", "name": "Mercurio", "sameAs": "https://www.wikidata.org/wiki/Q308"},
    {"@type": "Thing", "name": "Venere", "sameAs": "https://www.wikidata.org/wiki/Q313"},
    {"@type": "Thing", "name": "Terra", "sameAs": "https://www.wikidata.org/wiki/Q2"},
    {"@type": "Thing", "name": "Marte", "sameAs": "https://www.wikidata.org/wiki/Q111"},
    {"@type": "Thing", "name": "Giove", "sameAs": "https://www.wikidata.org/wiki/Q319"},
    {"@type": "Thing", "name": "Saturno", "sameAs": "https://www.wikidata.org/wiki/Q193"},
    {"@type": "Thing", "name": "Urano", "sameAs": "https://www.wikidata.org/wiki/Q324"},
    {"@type": "Thing", "name": "Nettuno", "sameAs": "https://www.wikidata.org/wiki/Q332"},
    {"@type": "Thing", "name": "Luna", "sameAs": "https://www.wikidata.org/wiki/Q405"},
    {"@type": "Thing", "name": "Plutone", "sameAs": "https://www.wikidata.org/wiki/Q339"},
    {"@type": "Thing", "name": "Stazione Spaziale Internazionale", "sameAs": "https://www.wikidata.org/wiki/Q25271"},
    {"@type": "Thing", "name": "Voyager 1", "sameAs": "https://www.wikidata.org/wiki/Q48469"},
    {"@type": "Thing", "name": "Voyager 2", "sameAs": "https://www.wikidata.org/wiki/Q48475"}
  ],
  "isBasedOn": [
    {"@type": "Dataset", "name": "Planetary Fact Sheets", "url": "https://nssdc.gsfc.nasa.gov/planetary/factsheet/", "publisher": {"@type": "Organization", "name": "NASA NSSDC"}},
    {"@type": "Dataset", "name": "Approximate Positions of the Planets", "url": "https://ssd.jpl.nasa.gov/planets/approx_pos.html", "publisher": {"@type": "Organization", "name": "NASA JPL"}}
  ],
  "isAccessibleForFree": true,
  "typicalAgeRange": "9-11",
  "educationalLevel": "Scuola primaria",
  "audience": {"@type": "EducationalAudience", "educationalRole": "student"},
  "isPartOf": {"@id": "https://lascuolaamica.it/#website"},
  "publisher": {"@id": "https://lascuolaamica.it/#organization"},
  "datePublished": "AAAA-MM-GG del rilascio",
  "dateModified": "lo riscrive npm run freshness"
}
```

`datePublished` va scritto a mano: `refresh_structured_data.py` non lo aggiorna. Nella
home si può aggiungere al nodo `CollectionPage` un `hasPart` verso
`/breakout#app`, `/bosco#app` e `/sistema-solare#app` (consigliato anche dall'audit
dell'11/09, mai fatto). Non va aggiunto all'`ItemList` delle 8 materie.

### Link interni (fase P)

| Da | Dove | Testo del link |
|---|---|---|
| Home | card dopo Tabelline, più una riga nel testo `seo-home` | «Sistema Solare 3D» / «Il Sistema Solare in 3D» |
| Scienze | voce «Sistema solare» del testo (riga 302) e aside «Esplora» | «modello 3D del Sistema Solare» |
| Per insegnanti | mappa curricolare, accanto ad «astronomia» | «il Sistema Solare in 3D, da proiettare sulla LIM» |
| Per genitori | in coda alla sezione giochi | «il Sistema Solare in 3D per bambini» |
| ai-info | perimetro didattico | «Il Sistema Solare in 3D» |
| Sistema Solare | verso Scienze | «quiz di scienze sul Sistema Solare» |

Il ponte naturale è Scienze: 61 domande attive su Sistema Solare e moti della Terra,
quasi tutte di 4ª e 5ª (ambito «Ambienti e cicli»). La card in home va con la guardia
`html:not([data-palette="okabe-ito"])` e il controllo del contrasto.

`llms.txt`, sezione «Altre risorse» (obbligatorio: `check_export.js` fallisce se la
pagina è in sitemap e non qui):

```
- [Il Sistema Solare in 3D](https://lascuolaamica.it/sistema-solare): modello 3D esplorabile per la 4ª e la 5ª. Sole, 8 pianeti, pianeti nani, lune, asteroidi, comete e sciami meteorici nelle posizioni vere (elementi orbitali JPL, 1800-2050), con una scheda per ogni corpo su dati NASA, JPL e IAU con le fonti. Non in scala, e lo dice; un confronto mostra le grandezze vere. Viaggio guidato, missioni e film delle sonde Voyager.
```

## Checklist di pubblicazione (fase P, in ordine)

Da fare dopo fisico e bambini, su un albero che contenga **solo** il Sistema Solare.

1. Togliere dall'albero i file della Scuderia prima di `freshness`: oggi `scuderia-prova.html` ha script e stile inline, e `sync_csp_hashes.py` ne scriverebbe gli hash in `_headers` dentro la PR (`audit:csp` già fallisce per questo).
2. Committare gli asset di `assets/sistema-solare/` solo quando sono definitivi: `/assets/*` è immutabile per un anno e la cache stabile del service worker non si svuota. Le correzioni dei dati passano da `js/sistema-solare-dati.js`, che invece si aggiorna con la versione.
3. `sistema-solare.html`: `robots` come le altre pagine (`index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1`), `datePublished`, frase sull'offline coerente con A6.
4. `scripts/generate_sitemap.py`: `("/sistema-solare", "sistema-solare.html"),` dopo `/bosco`.
5. `_redirects`: `/sistema-solare.html /sistema-solare 301`.
6. `sw.js`, precache: `/sistema-solare`, `/sistema-solare.css`, i tre `js/sistema-solare*.js`, l'immagine OG (circa 113 KB compressi in più all'installazione). Facoltativo `bin` nella cache stabile (A6). Le mappe restano fuori.
7. `llms.txt` (riga sopra) e link interni.
8. `scripts/check_contrast.sh`: aggiungere la pagina. `package.json`: `check:sistema-solare` nella catena `verify` e in `prepublish-check.sh`, perché giri anche in CI.
9. Versione (proposta 4.22.0) nei tre file più `package-lock.json`; voce in `json/changelog.json`.
10. `npm run freshness`, controllare il diff (nessun hash nuovo in `_headers`); `npm run verify`; `npm run check:contrast` con server sulla porta 4173.
11. `CHANGELOG.md`, `docs/wiki/Architettura.md`, `project_history.md`.
12. PR, prova del precache sull'anteprima `*.pages.dev`, merge.
13. Dopo il deploy: produzione contro `export/`, 301 da `.html`, immagine OG a 200, compressione dei `.bin` su Cloudflare (non verificata), `npm run indexnow`, controllo URL in Search Console, tag della release.

**Attenzione:** l'export pubblica ogni `*.html` tracciato. Un merge su `main` prima
delle revisioni metterebbe online la pagina, anche se `noindex`.

## Misure Lighthouse (12.6.1, in locale)

Server Python senza compressione né minificazione: gli avvisi su compressione, cache e
minificazione dipendono dall'ambiente locale.

| Esecuzione | Perf | A11y | Best practices | SEO | LCP | TBT | CLS | Peso |
|---|---|---|---|---|---|---|---|---|
| Mobile, GPU software | 28 | 100 | 100 | 66* | 7,0 s | 15,9 s | 0 | 3,1 MB |
| Desktop, GPU software | 54 | 100** | 100 | 66* | 1,5 s | 3,6 s | 0 | 3,2 MB |
| Mobile, GPU vera | 46 | – | – | – | 6,4 s | 3,1 s | 0,038 | 3,1 MB |
| Bosco, mobile (confronto) | 77 | – | – | – | 3,9 s | 0,09 s | 0 | 0,46 MB |

\* L'unico controllo SEO fallito è il `noindex` voluto. \*\* Con il difetto M1.

**Non misurato:** INP e dati reali di Chrome (non esistono ancora), comportamento di
Googlebot con WebGL, risposte reali di AI Overview e Perplexity, volumi di ricerca.

## Fonti principali

- Search Console del dominio via API; suggerimenti di Google (`hl=it`).
- Concorrenti visti: solaresistema.it, solarsystemscope.com, eyes.nasa.gov,
  theskylive.com/it, focusjunior.it, geopop.it, studentville.it, sterngucker.de/it.
- Notizie su Voyager 1 a un giorno luce: focus.it, editorialedomani.it, meteoweb.eu.
- Dati interni: `js/sistema-solare-dati.js`, `docs/sistema-solare/*.json`, `json/scienze.json`.

## Prestazioni dopo la fase A

Mappe in due livelli (`assets/sistema-solare/basse/`, 32 file 512×256, 684 KB in
tutto, rigenerabili con `python3 scripts/prepara_mappe_sistema_solare.py --basse`)
e caricamento sulla GPU di una mappa per fotogramma, solo dopo il primo disegno
(`caricaTexture` e `caricaSullaGpu` in `js/sistema-solare-motore.js`). La mappa
grande arriva quando il corpo supera 130 px di raggio sullo schermo
(`SOGLIA_GRANDE`) o è quello scelto; fino ad allora resta la bassa. Se una bassa
manca, si usa la grande.

Lighthouse in locale, GPU software, 4 giri per lato, stessi file:

| | Punteggio | LCP | TBT | Mappe scaricate | Peso pagina |
|---|---|---|---|---|---|
| Mobile prima | 34–36 | 8,0–9,4 s | 13,6–17,9 s | 2416 KB | 3,2 MB |
| Mobile dopo | 31–37 | 7,1–9,5 s | 1,5–4,3 s | 197 KB | 1,0 MB |
| Desktop prima | 40–52 | 1,6–2,2 s | 3,8–4,7 s | 2511 KB | 3,3 MB |
| Desktop dopo | 42–70 | 1,9–2,2 s | 0,23–1,1 s | 210 KB | 1,0 MB |

**Resta aperto (A5):** l'LCP non migliora. L'elemento LCP è il testo del
benvenuto, che compare dopo l'avvio dello script dell'interfaccia (un task da
3-4 s su mobile simulato; circa 75 ms senza rallentamenti su un Mac). Con una
GPU vera il motore parte in 14 ms invece di 561: i numeri di laboratorio con GPU
software sono pessimisti. Vanno rivisti con i dati reali di Chrome dopo la
pubblicazione, oppure si rende il benvenuto visibile già nell'HTML alla prima
visita.
