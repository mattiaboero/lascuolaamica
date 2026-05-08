# Sicurezza, privacy e minori

Il sito è progettato per bambini tra i 7 e i 10 anni. Questa pagina descrive le scelte tecniche fatte per rispettare quella responsabilità.

---

## Principi fondamentali

**Nessuna registrazione.** Il sito funziona senza account, senza email, senza nome. Un bambino apre il browser e inizia a giocare.

**Nessun tracciamento di terze parti.** Nessun pixel di analytics, nessun cookie pubblicitario, nessuna integrazione social che trasmette dati a server esterni.

**Dati di gioco solo in locale.** Punteggi, progressi e preferenze restano nella memoria locale del browser sul dispositivo. Non vengono mai inviati a nessun server.

**Zero dipendenze esterne a runtime.** Font self-hosted, nessuna richiesta a CDN di terze parti, nessun SDK esterno caricato lato client.

---

## Hardening tecnico

### Policy di sicurezza dei contenuti

Il sito usa policy restrittive per limitare l’esecuzione di script non previsti e per ridurre la superficie di attacco lato browser.

### Header di sicurezza

Vengono applicati header moderni per impedire embedding indesiderato, ridurre il rischio di interpretazioni errate dei contenuti e limitare l’accesso a funzioni del dispositivo non necessarie.

### JSON domande

I file dati tecnici non sono destinati all’indicizzazione come contenuto standalone.

### Trasporto cifrato

Il sito usa HTTPS e una configurazione conservativa del trasporto cifrato per proteggere la navigazione.

---

## Conformità GDPR

Il sito non raccoglie dati personali. Non ci sono form di contatto con dati identificativi, non ci sono cookie persistenti di terze parti, non c'è profilazione.

Il trattamento dati è limitato a:

- **Log tecnici dell’infrastruttura di hosting e protezione** — necessari al funzionamento e alla sicurezza del servizio
- **Memoria locale del browser** — dati che restano sul dispositivo dell'utente, mai trasmessi

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
- Riduzione movimento (con preferenza persistente sul dispositivo)

Dichiarazione di accessibilità disponibile su `/accessibilita`.

---

## Segnalazioni

Per vulnerabilità di sicurezza o problemi di privacy: `supporto@lascuolaamica.it`
