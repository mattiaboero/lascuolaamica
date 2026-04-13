# Setup Editor Esercizi Privato (Token + URL, accesso persistente)

Questa guida abilita la pagina privata:

- URL: `https://lascuolaamica.it/admin/esercizi`
- Protezione attiva: token interno verificato via hash SHA-256
- Modalità consigliata: token nell'URL con hash fragment (`#k=`)

## 1) Scegli un token segreto

Scegli una stringa lunga e non banale (almeno 24 caratteri).

Esempio formato (non usare questo):

`scuolaamica-editor-2026-chiave-privata`

## 2) Calcola hash SHA-256 del token

### 2.1 Metodo Python (macOS)

```bash
python3 - <<'PY'
import hashlib
token = "scuolaamica-editor-2026-chiave-privata"
print(hashlib.sha256(token.encode()).hexdigest())
PY
```

### 2.2 Metodo shasum (alternativo)

```bash
printf "%s" "scuolaamica-editor-2026-chiave-privata" | shasum -a 256
```

Prendi l'hash (64 caratteri esadecimali).

## 3) Inserisci l'hash nel progetto

Apri il file:

`admin/editor-config.js`

Sostituisci `INSERISCI_HASH_SHA256` con l'hash reale.

Esempio:

```js
window.EDITOR_ACCESS_CONFIG = {
  tokenHash: "c5a53cece13f20d1a757c53871a8da954f73bedcbbe249fa90b3a3b988b44bfe"
};
```

## 4) Pubblica le modifiche

Usa il tuo flusso standard (GitHub + Cloudflare Pages o export manuale).

Verifica che la pagina risponda:

- `https://lascuolaamica.it/admin/esercizi`

## 5) Crea il link privato per i collaboratori (primo accesso)

Condividi il link nel formato:

`https://lascuolaamica.it/admin/esercizi#k=IL_TUO_TOKEN`

Nota pratica:

- meglio `#k=` rispetto a `?k=` perché il frammento `#` non viene inviato al server.

Dopo il primo accesso riuscito nello stesso browser, il collaboratore può usare anche:

`https://lascuolaamica.it/admin/esercizi`

## 6) Uso da parte dei collaboratori

1. Aprono il link privato con `#k=`.
2. L'editor si sblocca automaticamente.
3. Inseriscono gli esercizi.
4. Cliccano `Genera e scarica JSON`.
5. Ti inviano il file JSON via email.

## 7) Rotazione token (consigliata)

Quando cambia collaboratore (o periodicamente):

1. Genera un nuovo token.
2. Calcola il nuovo hash.
3. Aggiorna `admin/editor-config.js`.
4. Ripubblica.
5. Invia il nuovo link privato.

## 8) Limiti e buone pratiche

Questo modello è leggero e pratico, ma meno forte di un accesso con identità nominativa.

Per ridurre i rischi:

- non pubblicare mai il link in pagine pubbliche;
- condividi il link solo in canali privati;
- ruota spesso il token;
- mantieni la pagina fuori sitemap e con `noindex`.
