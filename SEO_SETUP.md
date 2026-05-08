# SEO e Indicizzazione - Setup rapido

## File SEO creati/aggiornati
- `index.html`, `matematica.html`, `inglese.html`, `problemi.html`, `civica.html`
  - title e description ottimizzati
  - meta robots `index,follow`
  - canonical
  - Open Graph e Twitter meta
  - JSON-LD (structured data)
- `sitemap.xml`
- `robots.txt`
- `sw.js` (cache aggiornata per includere sitemap/robots)
- `prepublish-check.sh` (validazione automatica di sitemap/robots)
- `CLOUDFLARE_SECURITY_SETUP.md` (note pubbliche su hosting, protezione e controlli post-release)

## Prima di inviare a Google Search Console
1. Verifica che il dominio reale del sito coincida con quello usato in:
   - `robots.txt`
   - `sitemap.xml`
2. Pubblica i file in root, in modo che siano raggiungibili su:
   - `/robots.txt`
   - `/sitemap.xml`

## Search Console
1. Aggiungi la proprietà del sito in Google Search Console.
2. Vai su **Sitemaps** e invia: `https://lascuolaamica.it/sitemap.xml`
3. Controlla dopo qualche giorno la copertura di indicizzazione.

## Note
Se il dominio reale non è `https://lascuolaamica.it`, aggiorna gli URL in `robots.txt` e `sitemap.xml` prima della pubblicazione.
Mantieni la documentazione pubblica focalizzata su struttura SEO, contenuti e percorsi canonici: i dettagli operativi dell'infrastruttura vanno gestiti in canali riservati del team.
