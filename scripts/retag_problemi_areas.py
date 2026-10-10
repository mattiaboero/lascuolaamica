#!/usr/bin/env python3
"""Sottoaree di json/problemi.json: propone un'etichetta dal contenuto.

La sottoarea dice di che cosa parla il problema. Oggi la pagina Problemi non
ha il selettore degli argomenti (manca la griglia degli ambiti), quindi il
bambino non la vede: serve ai conteggi di copertura, al registro degli errori
da ripassare e a un eventuale selettore. Definizioni, in ordine di precedenza:

  percentuali      si calcola una percentuale (sconto, «il 25% di»)
  frazioni         si calcola una frazione di una quantità (anche «metà»,
                   «un terzo») o si lavora con frazioni
  tempo            il risultato è una durata, un orario o una data, oppure
                   serve passare da un'unità di tempo a un'altra. L'età in
                   anni non conta
  euro_denaro      prezzi, spese, resto, risparmi
  misure           lunghezze, pesi, capacità, con o senza equivalenze
  due_operazioni   nessun tema qui sopra e più di un'operazione
  addizione, sottrazione, moltiplicazione, divisione
                   nessun tema qui sopra e una sola operazione

La prima versione cercava parole chiave come sottostringhe: «l» per i litri
stava in quasi ogni frase e metà dei problemi finiva in «misure». Qui le
unità valgono solo attaccate a un numero e l'operazione si legge dalle
uguaglianze della spiegazione.

Uso:
  python3 scripts/retag_problemi_areas.py              stampa la proposta
  python3 scripts/retag_problemi_areas.py --json f     la salva come {id: sottoarea}
  python3 scripts/retag_problemi_areas.py --applica f  scrive nel dataset le
                                                       sottoaree del file f
"""
import json
import re
import sys
from collections import Counter
from pathlib import Path

DATASET = Path(__file__).parent.parent / 'json' / 'problemi.json'

N = r'\d(?:[\d.,]*\d)?'
TEMPO_UNITA = r'(?:or[ae]|minut[oi]|second[oi]|giorn[oi]|settiman[ae]|mes[ei]|ann[oi]|h|min)'
ORARIO = r'\b\d{1,2}[:.]\d{2}\b'
LUNGHEZZE = r'(?:mm|cm|dm|m|dam|hm|km|millimetri|centimetri|decimetri|metr[oi]|chilometr[oi])'
PESI = r'(?:mg|g|dag|hg|kg|q|t|grammi|ettogrammi|ett[oi]|chil[oi]|chilogramm[oi]|quintal[ei]|tonnellat[ae])'
CAPACITA = r'(?:ml|cl|dl|l|hl|millilitri|centilitri|decilitri|litr[oi]|ettolitri)'
MISURA = rf'{N}\s?(?:{LUNGHEZZE}|{PESI}|{CAPACITA})(?:[²³2-3])?(?!\w)'
EURO = r'€|\beuro\b|\bcentesim[oi]\b'


def operazioni(spiegazione):
    """Segni delle uguaglianze isolate («3 × 8 = 24») nella spiegazione."""
    segni = []
    for sinistra in re.findall(rf'((?:{N}\s*[+\-×÷:]\s*)+{N})\s*=', spiegazione):
        segni.extend(re.findall(r'[+×÷:]|(?<=\s)-(?=\s)|(?<=\d)-(?=\d)', sinistra))
    return ['÷' if s == ':' else s for s in segni]


def sottoarea(q):
    domanda = q['question']
    risposta = str(q['answer'])
    testo = f'{domanda} {risposta}'
    richiesta = domanda.split('.')[-1].lower() if '.' in domanda else domanda.lower()

    if re.search(r'%|per cento', testo):
        return 'percentuali'
    if re.search(r'\b\d+/\d+\b|\bmetà\b|\bfrazion[ei]\b|\b(?:un|due|tre|quattro) (?:terz[oi]|quart[oi]|quint[oi]|sest[oi]|ottav[oi]|decim[oi])\b', testo, re.I):
        return 'frazioni'

    eta = re.search(r'\bann[oi] (?:ha|hanno|avrà|aveva)\b|\bha \d+ anni\b|\betà\b', domanda, re.I)
    tempo_risposta = re.search(rf'{N}\s?{TEMPO_UNITA}\b|{ORARIO}', risposta)
    tempo_richiesta = re.search(r'che ora|quanto tempo|quant[ei] (?:minuti|ore|second[oi]|giorni|settimane|mesi|anni)\b', richiesta)
    if (tempo_risposta or tempo_richiesta) and not eta:
        return 'tempo'

    if re.search(EURO, testo, re.I):
        return 'euro_denaro'
    if re.search(MISURA, testo) or re.search(r'\bperimetro\b|\barea\b', domanda, re.I):
        return 'misure'

    # Tre addendi o due sottrazioni di fila restano una sola operazione.
    segni = sorted(set(operazioni(q['explanation'])))
    if len(segni) != 1:
        return 'due_operazioni' if len(segni) > 1 else 'da_leggere'
    return {'+': 'addizione', '-': 'sottrazione', '×': 'moltiplicazione', '÷': 'divisione'}[segni[0]]


def tabella(domande, etichetta):
    conti = Counter((etichetta(q), q['class']) for q in domande)
    print(f"{'sottoarea':<18}" + ''.join(f'{c}ª'.rjust(6) for c in (2, 3, 4, 5)) + 'tot'.rjust(7))
    for nome in sorted({k[0] for k in conti}):
        riga = [conti.get((nome, c), 0) for c in (2, 3, 4, 5)]
        print(f'{nome:<18}' + ''.join(str(n).rjust(6) for n in riga) + str(sum(riga)).rjust(7))


def main():
    dati = json.loads(DATASET.read_text(encoding='utf-8'))
    attive = [q for q in dati['questions'] if q.get('active', True)]
    if '--applica' in sys.argv:
        nuove = json.loads(Path(sys.argv[sys.argv.index('--applica') + 1]).read_text(encoding='utf-8'))
        mancanti = [q['id'] for q in attive if q['id'] not in nuove]
        if mancanti:
            sys.exit(f'{len(mancanti)} domande attive senza sottoarea nel file: {mancanti[:5]}')
        cambiate = 0
        for q in dati['questions']:
            if q['id'] in nuove and q['subarea'] != nuove[q['id']]:
                q['subarea'] = nuove[q['id']]
                cambiate += 1
        # Stesso formato di JSON.stringify(data, null, 1): niente a capo finale.
        DATASET.write_text(json.dumps(dati, indent=1, ensure_ascii=False), encoding='utf-8')
        print(f'sottoaree cambiate: {cambiate}\n')
        tabella(attive, lambda q: q['subarea'])
        return
    proposta = {q['id']: sottoarea(q) for q in attive}
    if '--json' in sys.argv:
        Path(sys.argv[sys.argv.index('--json') + 1]).write_text(json.dumps(proposta, indent=1), encoding='utf-8')
    tabella(attive, lambda q: proposta[q['id']])
    print(f"\ncambierebbero: {sum(1 for q in attive if q['subarea'] != proposta[q['id']])} su {len(attive)}")


if __name__ == '__main__':
    main()
