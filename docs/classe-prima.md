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
