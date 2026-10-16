#!/usr/bin/env python3
"""Testi da registrare con ElevenLabs per la pagina /sistema-solare.

Scrive due file in docs/sistema-solare/:
- audio-testi.md    un blocco per audio, da copiare in ElevenLabs. Il nome del
                    file mp3 da salvare e' nel titolo del blocco.
- audio-testi.json  per ogni audio: file, testo letto dalla pagina e la sua
                    impronta (sha1). scripts/build_sistema_solare.py usa un mp3
                    solo se esiste in assets/sistema-solare/audio/ e se il testo
                    non e' cambiato da quando questo elenco e' stato scritto.

Il testo e' lo stesso che la pagina legge con la voce del browser (funzione
testoParlato in js/sistema-solare.js): nome, descrizione e curiosita'. Nel
blocco per ElevenLabs le unita' di misura sono scritte per esteso e ci sono
pochi tag di espressione di Eleven v3, che si possono cambiare o togliere.

    python3 scripts/testi_audio_sistema_solare.py
"""
import hashlib
import json
import pathlib
import re

RADICE = pathlib.Path(__file__).resolve().parent.parent
DOCS = RADICE / 'docs' / 'sistema-solare'


def impronta(testo):
    return hashlib.sha1(testo.encode('utf-8')).hexdigest()


def testo_corpo(c):
    return ' '.join([c['nome'] + '.', c['descrizione']] + list(c.get('curiosita') or []))


# Per la lettura ad alta voce: simboli e abbreviazioni per esteso.
SOSTITUZIONI = [
    (r'(\d)\s?°C', r'\1 gradi'), (r'(\d)\s?°', r'\1 gradi'), (r'\bkm/h\b', 'chilometri orari'),
    (r'\bkm/s\b', 'chilometri al secondo'), (r'\bkm\b', 'chilometri'), (r'\bUA\b', 'unità astronomiche'),
    (r'(\d)\s?%', r'\1 per cento'), (r'\bg/cm³', 'grammi per centimetro cubo'), (r'\bm/s²', 'metri al secondo quadrato'),
    (r'\bkg\b', 'chili'), (r'−', 'meno '),
]


def per_la_voce(testo):
    for a, b in SOSTITUZIONI:
        testo = re.sub(a, b, testo)
    return testo


def blocco_eleven(nome, descrizione, curiosita):
    righe = ['[excited] ' + per_la_voce(nome) + '.', per_la_voce(descrizione)]
    for k, frase in enumerate(curiosita):
        righe.append(('[curious] Lo sapevi? ' if k == 0 else '') + per_la_voce(frase))
    return '\n\n'.join(righe)


# Solo questi hanno un audio registrato (scelta di Mattia, 16/10/2026): gli
# altri corpi usano la voce del browser.
CON_AUDIO = ['sole', 'mercurio', 'venere', 'terra', 'luna', 'iss', 'marte', 'fascia-asteroidi',
             'giove', 'saturno', 'urano', 'nettuno', 'fascia-kuiper']


def main():
    dati = json.loads((DOCS / 'dati.json').read_text(encoding='utf-8'))
    voci = []
    for c in dati['corpi']:
        voci.append((c['id'], testo_corpo(c), blocco_eleven(c['nome'], c['descrizione'], c.get('curiosita') or [])))
    for s in dati.get('sciami', []):
        voci.append((s['id'], s['nome'] + '. ' + s['descrizione'], blocco_eleven(s['nome'], s['descrizione'], [])))
    for k in dati.get('schede', []):
        voci.append((k['id'], k['titolo'] + '. ' + k['testo'], blocco_eleven(k['titolo'], k['testo'], [])))

    # I capitoli del film delle Voyager (docs/sistema-solare/voyager.json).
    voy_p = DOCS / 'voyager.json'
    capitoli = json.loads(voy_p.read_text(encoding='utf-8'))['capitoli'] if voy_p.exists() else []
    for ch in capitoli:
        vid = 'film-' + ch['id']
        voci.append((vid, ch['titolo'] + '. ' + ch['testo'], blocco_eleven(ch['titolo'], ch['testo'], [])))
    CON_AUDIO_TUTTI = CON_AUDIO + ['film-' + ch['id'] for ch in capitoli]
    per_id = {v[0]: v for v in voci}
    voci = [per_id[vid] for vid in CON_AUDIO_TUTTI if vid in per_id]
    elenco = {vid: {'file': vid + '.mp3', 'testo': testo, 'sha1': impronta(testo)} for vid, testo, _ in voci}
    (DOCS / 'audio-testi.json').write_text(json.dumps(elenco, ensure_ascii=False, indent=1), encoding='utf-8')

    md = ['# Audio del Sistema Solare in 3D (testi per ElevenLabs)', '',
          f'{len(voci)} audio: il Sole, i pianeti, la Luna, la Stazione Spaziale, le due fasce e i capitoli del film delle Voyager (file film-...). Gli altri corpi usano la voce del browser.',
          'Per ognuno: copia il blocco in ElevenLabs (modello Eleven v3, voce italiana),',
          'scarica l\'mp3 e salvalo con il nome indicato in `assets/sistema-solare/audio/`.',
          'Poi lancia `python3 scripts/build_sistema_solare.py`: la pagina userà i file al posto della voce del browser.', '',
          '- I tag fra parentesi quadre (`[excited]`, `[curious]`) sono indicazioni di espressione di Eleven v3:',
          '  si possono cambiare o togliere. Non vengono letti.',
          '- Simboli e unità sono già scritti per esteso («gradi», «chilometri»).',
          '- Se un testo cambia in `dati.json`, rilancia questo script: l\'mp3 vecchio smette di essere usato',
          '  finché non viene registrato di nuovo (lo dice l\'impronta in `audio-testi.json`).',
          '- Consiglio: mp3 a 64 kbps mono. Bastano per la voce e restano leggeri.', '']
    for vid, testo, blocco in voci:
        md += [f'## {vid}.mp3', '', '```text', blocco, '```', '']
    (DOCS / 'audio-testi.md').write_text('\n'.join(md), encoding='utf-8')
    print(f'[OK] docs/sistema-solare/audio-testi.md e audio-testi.json: {len(voci)} audio')


if __name__ == '__main__':
    main()
