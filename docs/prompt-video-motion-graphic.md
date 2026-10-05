# Prompt per il video motion graphic 9:16

Prompt da incollare in Claude per generare un video verticale che presenta La Scuola Amica.
I valori vengono da `tokens.css`, `fonts.css` e `index.css` (versione 4.21.1): se la palette o i font cambiano, vanno riallineati qui.

## Prompt

```text
Crea un video motion graphic verticale 9:16 che presenta "La Scuola Amica" (lascuolaamica.it).

FORMATO
- 1080×1920 px, 30 fps, durata 25–30 s, loop pulito non richiesto.
- Zone sicure: niente testo nei primi 250 px in alto e negli ultimi 340 px in basso (interfaccia Reels/TikTok/Shorts); margini laterali 60 px.
- Realizzalo come animazione HTML/CSS/JS in un unico file, palco fisso 1080×1920, timeline deterministica (registrabile a schermo).
- Deve funzionare senza audio: ogni messaggio è scritto a schermo.

IL PROGETTO (testi esatti, non inventare numeri)
- Nome: La Scuola Amica
- Cos'è: giochi educativi gratis per la scuola primaria, classi 1ª–5ª
- Payoff: "Scegli la tua materia e inizia a giocare!"
- Quattro punti: Gratis · Senza registrazione · Offline dopo il primo accesso · 10.300+ domande
- Altri fatti: nessun tracciamento, funziona su telefono, tablet e computer, 10 domande a partita con 4 risposte, bacheca premi con coccarde e trofei
- Chiusura: lascuolaamica.it
- Pubblico del video: genitori e insegnanti. Tono caldo, chiaro, giocoso ma non infantile. Italiano, frasi brevi.

FONT
- Titoli: Fredoka Bold 700 (Google Fonts "Fredoka"). Bianco su fondi colorati, letter-spacing 2px, interlinea 1.1, ombra dura 3px 3px 0 rgba(0,0,0,.18).
- Testi: Nunito 400 / 700 / 800 / 900 (Google Fonts "Nunito"). Sottotitoli 800, corpo 700.
- Dimensioni a 1080 px di larghezza: titolo 120–150 px, sottotitolo 56–64 px, corpo minimo 44 px.
- Nessun altro font.

COLORI BASE (palette Wada Sanzo, calda)
- Sfondo: gradiente verticale crema #fbf4e6 → #f1e6cf
- Superfici/card chiare: avorio #fffdf7, bordo #e7d8be
- Testo principale: nero caldo #2c2a28; testo secondario #6e6357
- Brand dominante: verdigris #2f8e86
- Secondario: blu #3c6e9f
- Pannello titolo: gradiente 135° #2f8e86 → #3c6e9f, testo bianco
- Accento / invito all'azione: terracotta #dd6347 (variante scura #c8553d)
- Evidenza / "sole": giallo grano #f2c14e
- Positivo #2e8455, negativo #c4452f, avviso #c8881a
- Non usare: viola acceso #9B5DE5, azzurro cielo, nero puro, bianco puro come sfondo.

COLORI PER MATERIA (card: gradiente 145° dal primo al secondo; emoji come icona)
- 🔢 Matematica #6e57a6 → #8068bb
- 📖 Italiano #c24a5b → #ce4556
- 🌍 Inglese #2e6fa6 → #3a7baf
- 🧠 Problemi #bc5925 → #ba5b16
- 🏛️ Civica #1f7a5e → #348368
- 🗺️ Geografia #3a8454 → #45825b
- 📜 Storia #9a6a43 → #976e45
- 🔬 Scienze #29837d → #3a817a
- 🧮 Tabelline #96631a → #9c6a1b
- 🎮 Cervellino Spacca-Muri (gioco arcade) #993377 → #b03b89
- 🌳 Il Bosco delle Lettere (gioco di ortografia) #55742f → #5c7a2e

FORME
- Card: raggio 32 px, anello interno bianco 4 px al 30%, ombra colorata morbida 0 12px 40px al 45% del colore della card.
- Pannelli: raggio 28 px; elementi piccoli 18 px; ombra calda 0 14px 34px rgba(44,42,40,.16).
- Pulsanti e pillole: fondo bianco, raggio 50 px, testo Fredoka nel colore della materia, ombra dura 0 4px 0 rgba(0,0,0,.15).
- Scenografia: sole giallo grano con alone, nuvole avorio al 70%, colline verdi in basso (#45825b → #3a8454 e #79b58f → #4f9b6f). Stile piatto, niente 3D, niente fotografie.

MASCOTTE E LOGO (file allegati, usali così come sono, non ridisegnarli)
- Cervellino: gufetto blu con zainetto giallo, vettoriale piatto con contorno blu scuro. PNG trasparenti 600×848 in 5 pose: saluto, felice, neutro, festeggia, triste.
- Logo: casa-scuola su libro aperto con bandierina e stella (favicon.svg). Colori: #005b8d, #006eb8, #80719e, #87c540, #c03a23, #f27291, #f99d1b su crema #fffbe9.

MOVIMENTO
- Entrate con rimbalzo: cubic-bezier(.36,.07,.19,.97), da scala .85 e rotazione −6° a scala 1.08 poi 1, durata .9 s.
- Card: salgono da 60 px più in basso con scala .9 → 1, .6 s, sfalsate di .15 s una dall'altra.
- Mascotte: entra con cubic-bezier(.22,1,.36,1) in .7 s, poi dondola piano (±3°, 6 px, ciclo 3 s).
- Icone: oscillano ±4° e 8 px, ciclo 2.5 s. Sole: pulsa scala 1 → 1.06 in 4 s. Nuvole: scorrono lente in orizzontale.
- Transizioni fra scene: scorrimento verticale o cambio colore a tutto schermo nel colore della materia. Niente lampi, niente tagli stroboscopici.

SCALETTA (modificabile)
1. 0–3 s — sfondo crema, sole, colline; Cervellino saluta; compare il logo.
2. 3–7 s — pannello verdigris/blu con "La Scuola Amica" e sotto "Giochi educativi gratis per la scuola primaria".
3. 7–14 s — le 8 card delle materie entrano una dopo l'altra, ognuna col suo colore ed emoji.
4. 14–18 s — Tabelline e i due giochi: Cervellino Spacca-Muri, Il Bosco delle Lettere.
5. 18–24 s — le quattro pillole: Gratis, Senza registrazione, Offline, 10.300+ domande. Cervellino festeggia.
6. 24–30 s — "Scegli la tua materia e inizia a giocare!" + pulsante terracotta "lascuolaamica.it" + logo.
```

## File da allegare al prompt

- Font: `assets/fonts/fredoka-v17-latin-700.woff2`, `assets/fonts/nunito-v32-latin-regular.woff2`, `nunito-v32-latin-700.woff2`, `nunito-v32-latin-800.woff2`, `nunito-v32-latin-900.woff2`
- Mascotte: `assets/mascotte/cervellino-waving-03.png`, `cervellino-happy.png`, `cervellino-neutral.png`, `cervellino-celebrate.png`, `cervellino-sad.png`
- Logo: `favicon.svg`

## Note

- Nel CSS il font dei titoli si chiama `'Fredoka One'`, ma il file è Fredoka Bold 700: nel prompt c'è il nome vero.
- Nel repository ci sono due loghi diversi: `favicon.svg` (toni caldi, fondo crema) e `icons/icon-512.png` (blu e verde accesi, fondo bianco). Il prompt usa l'SVG, vettoriale e più vicino alla palette.
- Numero di domande: la home dice «10.300+», il README «10.362». Il prompt usa quello della home; va aggiornato quando cambia.
- Scaletta e durata sono una proposta, non un dato del progetto. Le zone sicure (250 px sopra, 340 px sotto) sono un margine prudente, non una misura ufficiale delle piattaforme.
- La modalità accessibile Okabe-Ito non riguarda il video: i colori sono quelli della modalità standard.
