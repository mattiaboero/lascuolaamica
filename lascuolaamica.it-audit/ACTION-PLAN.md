# Action Plan — lascuolaamica.it

Audit del 2026-08-25. Punteggio SEO Health: **78/100**.

---

## ✅ Fase 1 — Critica — RISOLTA (2026-08-25)

1. ~~Disattivare il blocco Cloudflare ai crawler AI.~~ **Fatto.** Disattivato il toggle legacy "Block AI bots" (era su "Block on all pages"), preferenza mixed-purpose-crawler impostata su "continueranno a essere permessi", nuove "AI bot policies" (Search/Agent/Training) lasciate su `disabled`. Ri-verificato con user-agent reali: **GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot tutti HTTP 200 con contenuto reale** (non una pagina di challenge). Googlebot continua a passare come prima.

## 🟠 Fase 2 — Alto impatto (questa settimana)

3. ~~**CLS mobile**~~ **Fatto.** Causa: `#questionsTotalCount` nel footer condiviso parte con l'attributo HTML `hidden` (footprint zero) e viene popolato da `renderQuestionsTotal()` dopo il paint iniziale — a larghezza mobile lo span andava a capo cambiando l'altezza del footer. Riservato lo spazio in CSS (`min-width:22ch` sul selettore `[hidden]`, in `index.html` e `info-pages.css`). Verificato: box riservato e box popolato coincidono, **0px di shift** su `/chi-siamo` mobile (era 0.254 Poor).
4. Ri-testare `/matematica` desktop (TBT 330ms in un solo run, probabile rumore di misurazione — mobile stesso test 0ms).
5. Ri-controllare tra 24-48h l'indicizzazione di `/breakout` (richiesta già inviata oggi), `/premi`, `/cookie`, `/privacy` (risultavano unknown/non indicizzate in uno snapshot precedente, non ricontrollate in questo giro).

## ✅ Fase 2bis — Hardening del codice — RISOLTA (2026-09-06)

Revisione sistematica di HTML, CSS, JS, script di build e file testuali, con verifica in produzione. 16 release (4.12.36 → 4.12.51). Voci con impatto SEO/AEO/CWV:

- ~~LCP ritardato dall'animazione di entrata dell'header~~ **Fatto.** I keyframe `bounceIn` e `popIn` partivano da `opacity: 0`, che esclude l'elemento dai candidati LCP: la metrica slittava di tutta la durata dell'animazione. Misurato in produzione prima/dopo: `/premi` 1576 → 380 ms, home 1324 → 448 ms, `/breakout` 1124 → 380 ms, `/faq` 520 → 388 ms; PSI desktop home 1,44 s → 0,4 s. Animazione invariata per durata e rimbalzo.
- ~~`llms.txt` senza link markdown~~ **Fatto.** Non rispettava llmstxt.org (URL come testo nudo), PageSpeed lo segnalava. 15 URL convertiti in link, 11 descrizioni aggiunte.
- ~~`dateModified` dall'mtime~~ **Fatto.** Ora dalla storia git, come già il `lastmod` della sitemap; logica condivisa in `scripts/git_dates.py`.
- ~~CSP senza direttiva `trusted-types`~~ **Fatto.** `trusted-types sa-sw-url sa-sw-import`, verificato che un nome diverso venga bloccato.
- ~~Contrasto 4,13:1 nel cromo della home~~ **Fatto.** Portato a 5,87:1 (viola Wada Sanzo), modalità Okabe-Ito invariata.
- ~~Preferenza "riduci il movimento" ignorata~~ **Fatto.** Mancava il blocco `@media` sulle 10 pagine info, e il toggle interno non fermava le figure fluttuanti su home e `/faq`.
- ~~`premi.html` senza `max-video-preview:-1`, `&` non escapato su `/tabelline`, preload mancante su `/breakout`~~ **Fatto.**

### Nuove voci emerse

10. **`/tabelline`: Performance 83 e Accessibilità 96 su desktop** — unica pagina sotto 96 in entrambe, mai misurata prima perché pubblicata dopo l'audit di agosto. Da approfondire.
11. **`/matematica` mobile: LCP 2,6 s** — il peggiore del sito. L'elemento LCP (`div.intro-note`) sta fuori dall'header animato, quindi non ha beneficiato del fix. TBT 0 ms e CLS 0: è un problema di visibilità dell'elemento, non di thread principale.
12. **`/premi` mobile: CLS 0,088** — sotto soglia ma il più alto del sito, su una pagina la cui griglia si popola da JS.

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
