# QA Problemi matematici a più passaggi

File revisionato: `reports/qa-samples/problemi-sample.jsonl` (18 problemi)
Data: 2026-06-29
Metodo: ogni problema risolto da zero, poi confronto con `answer`, `options`, `explanation`.

## Riepilogo

| Esito | Conteggio |
|---|---|
| Corretti | 17 / 18 |
| Con errore | 1 / 18 |

- Errori di calcolo nella risposta dichiarata: **1** (P14)
- Errori di testo/explanation gravi: **1** (P14, lo stesso problema)

## DA CORREGGERE

### P14 — class 5, frazioni, difficulty 3
**Testo:** "Una raccolta fondi ha raggiunto 960 euro. 5/12 vengono usati per libri e 1/4 per materiale artistico. Quanti euro restano?"

**Il mio calcolo (passo per passo):**
1. 5/12 di 960 = 960 ÷ 12 × 5 = 80 × 5 = **400 euro** (libri)
2. 1/4 di 960 = 960 ÷ 4 = **240 euro** (materiale artistico)
3. Usati: 400 + 240 = **640 euro**
4. Restano: 960 − 640 = **320 euro**

**Risposta giusta: 320 euro**

**Problemi rilevati:**
- `answer` dichiarata = **"260 euro"** → ERRATA. Il valore corretto è 320 euro.
- La `answer` "260 euro" **non è nemmeno presente** tra le `options` `["260 euro", "400 euro", "300 euro", "360 euro"]`... anzi, è la prima opzione, ma è una risposta sbagliata marcata come corretta.
- **Il valore corretto 320 euro NON è presente tra le options.** Quindi il problema è irrecuperabile senza modificare le opzioni: nessuna opzione è corretta.
- La `explanation` contiene **meta-ragionamento del generatore trapelato nel dataset**: "...960 - 640 = 320... Ricontrollo: ... 960-640=320. **Aggiorno risposta.**" L'explanation arriva da sola al valore corretto 320 ma poi non aggiorna né `answer` né `options`. Testo non pubblicabile.

**Cosa cambiare:**
- `answer` → `"320 euro"`
- `options` → sostituire/inserire 320 come opzione corretta, es. `["320 euro", "400 euro", "300 euro", "360 euro"]` (rimuovere "260 euro" che non corrisponde a nessun passaggio plausibile).
- `explanation` → riscrivere pulita, senza meta-testo:
  "Prima: 5/12 di 960 = 400 euro per libri; 1/4 di 960 = 240 euro per arte. Poi: 400 + 240 = 640 euro usati; 960 − 640 = 320 euro restano."

## Problemi verificati CORRETTI (17)

- **P1** 180−40+25 = 165 ✓ (answer 165, presente, explanation coerente)
- **P2** 9×6×4 = 216 ✓
- **P3** 5×8+35 = 75 ✓
- **P4** 2×3 + 3×4 = 6+12 = 18 ✓
- **P5** 1/4 di 24 = 6 ✓
- **P6** 6×14 = 84 ✓
- **P7** 228÷12 = 19 ✓
- **P8** 7:45 + 4h15m = 12:00 ✓ (tempo corretto)
- **P9** 145+238+97 = 480 ✓
- **P10** 1980−765+432 = 1647 ✓
- **P11** 360−48+72 = 384 ✓
- **P12** 126,40+48,60 = 175,00; 250−175 = 75,00 ✓ (decimali corretti)
- **P13** 9×1,20 = 10,80; offerta 3×2 su 9 → si pagano 6 → 7,20; risparmio 3,60 ✓ (offerta interpretata bene)
- **P15** 125×24 = 3000; ×15 = 45000 g ✓
- **P16** 3240÷15 = 216 ✓
- **P17** 8:15+35m = 8:50; +5h10m = 14:00 ✓
- **P18** 48620+37845+52380 = 138845 ✓

Per tutti i 17: answer presente identica tra le options, distrattori plausibili (combinazioni di errori tipici: dimenticare un passaggio, segno sbagliato, ordine operazioni), una sola opzione corretta, dati sufficienti e non contraddittori, contesto adatto alla classe, lingua corretta (accenti/apostrofi a posto: "c'è" in P9 OK).

## PATTERN RICORRENTI

1. **Meta-ragionamento del generatore trapelato (CRITICO).** In P14 l'explanation contiene "Ricontrollo:", "Aggiorno risposta." — frammenti del processo del modello che non andrebbero mai nel dataset. Va aggiunto un filtro/lint che blocca explanation contenenti parole come "Ricontrollo", "Aggiorno", "...", per intercettarle prima della pubblicazione.
2. **Disallineamento answer ↔ explanation.** Sempre in P14, l'explanation calcola correttamente 320 ma `answer` resta 260: segnale che la validazione "answer deve coincidere con il risultato dell'explanation" non è applicata.
3. **answer non tra le options / opzione corretta assente.** P14: il valore giusto 320 non è tra le options. Serve un check automatico: `answer ∈ options` E `risultato_calcolato ∈ options`.
4. **Distrattori ben costruiti (positivo).** Nei 17 corretti i distrattori derivano da errori plausibili (es. P1: 155 = 180−40−25 sbagliando il segno del +25), il che li rende didatticamente validi.

## VERDETTO

- Tasso di errore: **1/18 = 5,56%**
- Soglia PASS richiesta: < 5%
- Esito: **RIGENERARE** (> 5%)

Nota: l'unico errore (P14) è particolarmente grave perché combina tre difetti contemporaneamente (calcolo/answer errata, opzione corretta assente, meta-testo trapelato nell'explanation). Anche con un singolo caso su 18, la presenza di meta-ragionamento del generatore nel dataset suggerisce di rieseguire i controlli automatici sull'intero corpus prima della pubblicazione, non solo sul campione.
