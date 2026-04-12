# Contribuire a La Scuola Amica

Grazie per voler contribuire.

## Regole base

- Mantieni linguaggio inclusivo e chiaro.
- Evita regressioni su accessibilità, SEO e performance.
- Non introdurre tracker o raccolta dati personali.
- Mantieni coerenza didattica con scuola primaria italiana.

## Flusso consigliato

1. Crea un branch da `main`.
2. Applica modifiche piccole e mirate.
3. Esegui `./prepublish-check.sh`.
4. Verifica a mano almeno:
   - una pagina materia,
   - pagina FAQ,
   - pagina supporto,
   - service worker offline di base.
5. Apri PR con descrizione chiara.

## Convenzioni contenuti

- Testi italiani: attenzione a accenti, apostrofi, `è`, `qual è`, `cos'è`.
- Domande: una sola risposta corretta, distrattori plausibili.
- Evita stereotipi di genere e linguaggio escludente.

## Checklist PR

- [ ] Nessun errore console nelle pagine toccate.
- [ ] `prepublish-check.sh` passato.
- [ ] Aggiornata versione se necessario (`app-version.js`).
- [ ] Aggiornata voce “Ultimi aggiornamenti” in `shared.js`.
- [ ] Sincronizzata cartella `export` per il deploy.
