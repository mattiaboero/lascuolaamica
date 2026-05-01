# Sicurezza, privacy e minori

Il sito è progettato per bambini tra i 7 e i 10 anni. Questa pagina descrive le scelte tecniche fatte per rispettare quella responsabilità.

---

## Principi fondamentali

**Nessuna registrazione.** Il sito funziona senza account, senza email, senza nome. Un bambino apre il browser e inizia a giocare.

**Nessun tracciamento di terze parti.** Nessun pixel di analytics, nessun cookie pubblicitario, nessuna integrazione social che trasmette dati a server esterni.

**Dati di gioco solo in locale.** Punteggi, progressi e preferenze sono in `localStorage` sul dispositivo. Non vengono mai inviati a nessun server.

**Zero dipendenze esterne a runtime.** Font self-hosted, nessuna richiesta a CDN di terze parti, nessun SDK esterno caricato lato client.

---

## Hardening tecnico

### Content Security Policy

La CSP è impostata con `script-src 'self'`: nessun inline script eseguibile, nessuna risorsa JS da domini esterni. Applicata via header HTTP su Cloudflare, non via meta tag HTML (più robusta, non bypassabile da contenuti della pagina).

### Header di sicurezza

Gestiti centralmente su Cloudflare Rules:

| Header | Valore |
|---|---|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | camera, microfono, geolocalizzazione, pagamento, USB: tutti disabilitati |

### JSON domande

I file `json/*.json` vengono serviti con `X-Robots-Tag: noindex, nofollow` per non indicizzarli come contenuto standalone.

### TLS

TLS 1.2 minimo, HSTS attivo, certificato in `Full (strict)` mode su Cloudflare.

---

## Conformità GDPR

Il sito non raccoglie dati personali. Non ci sono form di contatto con dati identificativi, non ci sono cookie persistenti di terze parti, non c'è profilazione.

Il trattamento dati è limitato a:

- **Log di accesso Cloudflare** — IP e user-agent a livello infrastrutturale, non riconducibili a identità specifiche
- **localStorage** — dati che restano sul dispositivo dell'utente, mai trasmessi

Non è richiesto il consenso esplicito ai cookie perché non ci sono cookie di profilazione. La Cookie Policy e la Privacy Policy sono accessibili dal sito.

---

## Minori e GDPR

Il Regolamento UE 2016/679 prevede tutele specifiche per i minori. Il sito li rispetta strutturalmente:

- Nessun dato identificativo raccolto
- Nessun account, nessuna profilazione
- Nessun contenuto generato dagli utenti
- Nessuna comunicazione verso i bambini (no newsletter, no notifiche push)

---

## Accessibilità

WCAG 2.1 livello AA, validata manualmente con:

- Navigazione da tastiera completa
- VoiceOver (macOS/iOS)
- Zoom 200% e reflow
- Riduzione movimento (con toggle persistente in localStorage)

Dichiarazione di accessibilità disponibile su `/accessibilita`.

---

## Segnalazioni

Per vulnerabilità di sicurezza o problemi di privacy: `supporto@lascuolaamica.it`
