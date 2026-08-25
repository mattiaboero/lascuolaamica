# Action Plan — lascuolaamica.it

Audit del 2026-08-25. Punteggio SEO Health: **78/100**.

---

## ✅ Fase 1 — Critica — RISOLTA (2026-08-25)

1. ~~Disattivare il blocco Cloudflare ai crawler AI.~~ **Fatto.** Disattivato il toggle legacy "Block AI bots" (era su "Block on all pages"), preferenza mixed-purpose-crawler impostata su "continueranno a essere permessi", nuove "AI bot policies" (Search/Agent/Training) lasciate su `disabled`. Ri-verificato con user-agent reali: **GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot tutti HTTP 200 con contenuto reale** (non una pagina di challenge). Googlebot continua a passare come prima.

## 🟠 Fase 2 — Alto impatto (questa settimana)

3. ~~**CLS mobile**~~ **Fatto.** Causa: `#questionsTotalCount` nel footer condiviso parte con l'attributo HTML `hidden` (footprint zero) e viene popolato da `renderQuestionsTotal()` dopo il paint iniziale — a larghezza mobile lo span andava a capo cambiando l'altezza del footer. Riservato lo spazio in CSS (`min-width:22ch` sul selettore `[hidden]`, in `index.html` e `info-pages.css`). Verificato: box riservato e box popolato coincidono, **0px di shift** su `/chi-siamo` mobile (era 0.254 Poor).
4. Ri-testare `/matematica` desktop (TBT 330ms in un solo run, probabile rumore di misurazione — mobile stesso test 0ms).
5. Ri-controllare tra 24-48h l'indicizzazione di `/breakout` (richiesta già inviata oggi), `/premi`, `/cookie`, `/privacy` (risultavano unknown/non indicizzate in uno snapshot precedente, non ricontrollate in questo giro).

## 🟡 Fase 3 — Contenuto e autorevolezza (questo mese)

6. ~~Allineare il testo FAQPage schema al testo visibile~~ **Fatto.** matematica/geografia/storia/italiano allineati 1:1 (schema conteneva versioni espanse mai mostrate in pagina). `problemi.html`: i 4 `<details>` extra erano esempi svolti, non FAQ — correttamente esclusi dallo schema già prima, ma riusavano la classe `seo-faq-item` facendoli sembrare FAQ; rinominati in `seo-example-item` (stesso stile, nessun cambio visivo).
7. ~~Aggiungere un'immagine di anteprima a `/breakout`~~ **Fatto.** Riusato l'asset `og-breakout-1200x630.jpg` già esistente (screenshot reale del gameplay) come immagine di contenuto nella sezione descrittiva della pagina — prima immagine di contenuto dell'intero sito.
8. Aumentare i target touch del footer a 48px minimo.
9. Aggiungere link `sameAs` allo schema Person/Organization del fondatore.
10. Valutare di avvicinare la keyword all'H1 delle pagine materia (oggi solo emoji+titolo) senza perdere il brand giocoso.
11. Aggiungere 1-2 link contestuali tra pagine materia correlate.

**`/breakout` mismatch di tipo-pagina (SXO)**: decisione presa con l'utente — nessun cambio strutturale, si accetta il posizionamento su query di marca/long-tail invece di costruire una pagina hub "Giochi" (avrebbe senso solo con più giochi in arrivo).

## 🟢 Fase 4 — Monitoraggio continuo

12. Ricontrollare Common Crawl tra 3-4 mesi (l'assenza attuale è dovuta al lancio del sito dopo lo snapshot CC interrogato, non un segnale di bassa autorità).
13. Perseguire backlink realistici: elenchi di risorse scuola/insegnanti, listicle "risorse gratuite scuola primaria", link reciproci da scuole che già usano il sito. Esplicitamente sconsigliati: directory a pagamento, link farm.
14. Monitorare il trend GSC (oggi: 10 click/238 impression/28gg, in miglioramento rispetto allo snapshot precedente; `/inglese` in posizione 2.4 per una query long-tail reale è un primo segnale positivo).
15. Tracciare segnali di brand mention (YouTube/Reddit/Wikipedia) — zero oggi è atteso per un sito lanciato ad aprile 2026, non un'azione immediata.

---

## Non azionabile / già a posto

- **Trofeo/documento**: fix Service Worker Trusted Types confermato attivo in produzione (verificato dal vivo oggi).
- **Sitemap**: 98/100, zero problemi strutturali.
- **Rischio contenuto duplicato tra le 8 pagine materia**: verificato e smentito (overlap 5-gram 0.2%-4.4%, ben sotto la soglia di rischio).
- **Review/AggregateRating schema**: correttamente NON aggiunto (nessun meccanismo di recensione reale esiste, sarebbe spam).
- Script inline bloccato dalla CSP visto in console: è di Cloudflare stesso (bot management), non modificabile da codice, nessun impatto funzionale.
