# Audit UX / Accessibilità — La Scuola Amica (2026-07-03)

**Metodo:** ispezione read-only con preview (viewport 320px, 375px mobile, desktop), computed style reali, snapshot accessibilità, verifica palette standard + Okabe-Ito, lettura CSS sorgente. Nessuna modifica applicata in questa fase (D1).

**Verdetto sintetico:** il sito è in **ottimo stato** UX/a11y. Struttura semantica solida, landmark e ARIA corretti, touch target adeguati, focus visibile, nessun overflow, modalità accessibile funzionante. Un solo finding sostanziale (contrasto etichette pulsanti risposta), il resto sono note minori/cosmetiche.

---

## Cosa è risultato conforme (verificato, non da toccare)

| Area | Esito | Evidenza |
|---|---|---|
| Overflow orizzontale @320px | ✅ nessuno | `scrollWidth == clientWidth == 320`; elementi "larghi" sono solo decorazioni (nuvole/colline) con clip |
| Touch target ≥44px | ✅ | footer-link 44, faq-mini 44, card-btn 48, home-reward-btn 48, skip-link 48, answer-btn min-height 66 |
| Focus visibile (tastiera) | ✅ | `.subject-card:focus-visible` outline 4px; `.footer-link:focus-visible` 3px; `.home-reward-btn:focus-visible` 4px |
| Semantica / landmark / ARIA | ✅ | banner, navigation+breadcrumb, main, region con `aria-label`, button con nomi accessibili, skip-link |
| Modalità Okabe-Ito | ✅ | `data-palette="okabe-ito"` + `palette-okabe.css` iniettato, testo scuro alto contrasto su card chiare |
| Reduced-motion | ✅ | kill-switch globale `*` in `index.css:545` copre anche le animazioni inline della home |
| Dati strutturati JSON-LD | ✅ | 3 blocchi per pagina materia, validi e intatti nel DOM |
| Reward teaser (home) | ✅ | bg gradiente chiaro, testo scuro `#43566c` / blu, focus presente |

---

## Findings (ordinati per severità)

### F1 — Contrasto etichette pulsanti risposta (BASSA, borderline) ⚠️ decisione owner
> **Nota di revisione:** la prima stesura di questo finding citava i colori delle regole *base* `.answer-btn:nth-child()` (subject-quiz-theme.css:1088-1107). Errato: in palette standard rende il blocco **Wada Sanzo** `html:not([data-palette="okabe-ito"]) .answer-btn:nth-child()` (**subject-quiz-theme.css:1948-1967**), con colori più scuri/muti. Dati sotto ricalcolati su quelli reali.

- **Colori reali standard (Wada Sanzo) + contrasto testo bianco (misurato):**
  - btn1 blu `#2e6fa6→#4e8fc4`: stop scuro **5.33** ✓ / stop chiaro **3.47** ✗
  - btn2 verde `#2e8455→#4da870`: stop scuro **4.62** ✓ / stop chiaro **2.94** ✗
  - btn4 rosso `#c4452f→#d9673e`: stop scuro **4.95** ✓ / stop chiaro **3.52** ✗
  - btn3 ambra `#c8881a→#e0a526` con testo scuro `--ws-slate-black #2c2a28`: **4.76–6.52** ✓ (corretto)
- **Problema:** etichetta `font-weight:900`, `0.98rem` (~15.7px = testo normale, AA 4.5:1). Il testo bianco **passa sullo stop scuro** ma **fallisce sullo stop chiaro** (2.94–3.52) di btn1/btn2/btn4. Il testo è centrato → siede a metà gradiente (~3.7–4.4), appena sotto AA 4.5 ma sopra 3.0.
- **Perché "testo scuro" NON è la soluzione qui:** i colori Wada Sanzo sono già scuri sugli stop d'inizio; testo scuro fallirebbe su quegli stop (scuro-su-scuro). L'unico fix robusto è **scurire gli stop chiari** dei gradienti btn1/2/4 finché il bianco passa ≥4.5 su tutto il pulsante (target luminanza stop chiaro ≤0.183). Effetto: pulsanti leggermente più muti.
- **Contesto/severità:** shortfall AA **lieve e borderline** nella palette standard "vivace", con **alternativa accessibile Okabe-Ito già disponibile** (non affetta). Grassetto aiuta la percezione.
- **Vincolo:** modificare la palette Wada Sanzo standard è un cambio al sistema di design deliberato (restyle a fasi) → **decisione owner**. **NON** toccare Okabe-Ito.
- **Opzioni:** (A) scurire stop chiari btn1/2/4 standard → conforme AA ovunque, muta lievemente; (B) lasciare com'è → borderline accettato, Okabe come via accessibile, documentato.

### F2 — Formato conteggio domande non uniforme (COSMETICA)
- **Dove:** home `.main-facts` mostra "9.800+ domande" (statico, arrotondato) mentre il footer `#questionsTotalCount` mostra "9879 domande disponibili" (dinamico, esatto).
- **Impatto:** nessun errore — entrambi corretti, contesti diversi (claim marketing vs conteggio live). Solo lieve incoerenza di stile numerico ("9.800+" con separatore vs "9879" senza).
- **Fix opzionale:** uniformare il separatore delle migliaia nel footer ("9.879") per coerenza tipografica. Bassissima priorità.

### F3 — `.main-sub` bianco su gradiente cielo (BORDERLINE, informativa)
- **Dove:** home, `.main-sub` "Scegli la tua materia…", `rgba(255,255,255,.85)` su gradiente teal-blu, 17.6px bold + `text-shadow`.
- **Impatto:** sullo stop più chiaro del gradiente il contrasto può avvicinarsi alla soglia AA, ma testo grande-ish + grassetto + ombra mitigano; visivamente leggibile. Non un fail conclamato.
- **Fix opzionale:** portare l'opacità del testo a 1.0 (da .85) → margine di contrasto gratuito, zero impatto visivo percepibile.

---

## Conclusione operativa (per D2)
- **Nessun finding ALTA severità.** Nessun blocco di accessibilità critico.
- **F1** (BASSA/borderline): il testo bianco dei pulsanti risposta standard passa AA sullo stop scuro e fallisce su quello chiaro (2.94–3.52). L'unico fix conforme è scurire gli stop chiari dei gradienti Wada Sanzo btn1/2/4 (opzione A) — cambio al sistema di design, **decisione owner**. Alternativa: lasciare (Okabe-Ito già copre l'esigenza accessibile). Il "testo scuro" non è applicabile (colori d'inizio troppo scuri).
- **F2/F3** sono migliorie cosmetiche opzionali a costo quasi nullo (F3: opacità 1.0; F2: separatore migliaia).
- Ogni modifica alle palette **Okabe-Ito** e **Wada Sanzo standard** richiede decisione owner e resta fuori scope di un fix automatico.
