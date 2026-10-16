#!/usr/bin/env python3
"""Prepara le mappe di superficie della pagina /sistema-solare.

Legge gli originali scaricati (una cartella, un file per corpo: <id>.<ext>) e
l'elenco delle scelte con fonte e licenza (JSON {id: {url, credito, licenza,
tipo, copertura}}), poi:

- riduce ogni mappa a 2048x1024 (o 1024x512 se l'originale e' piu' piccolo di
  1800 px): potenze di due, cosi' WebGL 1 genera le mipmap;
- la salva in WebP in assets/sistema-solare/<id>.webp;
- scrive docs/sistema-solare/texture.json con file, credito, licenza, tipo e
  longitudine al centro della mappa.

Gli unici interventi sui pixel sono quelli di SATURNO, dichiarati sotto.
Urano e Nettuno non usano la mappa: Hubble ne vede solo l'emisfero rivolto alla
Terra e i bordi hanno artefatti di colore. Al loro posto c'e' un colore
uniforme, la media dei pixel validi della mappa Hubble.

    python3 scripts/prepara_mappe_sistema_solare.py <cartella_originali> <scelte.json>

Con --basse rifa' solo le mappe leggere (512x256) in assets/sistema-solare/basse/,
partendo dalle WebP grandi gia' in assets: il motore le carica per prime e
passa alla grande solo quando il corpo e' grande sullo schermo.

    python3 scripts/prepara_mappe_sistema_solare.py --basse

Richiede ImageMagick (magick) e cwebp.
"""
import json
import pathlib
import subprocess
import sys

RADICE = pathlib.Path(__file__).resolve().parent.parent
USCITA = RADICE / 'assets' / 'sistema-solare'
ELENCO = RADICE / 'docs' / 'sistema-solare' / 'texture.json'

# Longitudine (gradi est) al centro della mappa. 0 dove non indicato.
# "verificata": controllata su un elemento noto della superficie.
LON_CENTRO = {
    'plutone': (180, 'verificata: Tombaugh Regio, il "cuore", centrato a circa 180°E, sta al centro'),
    'dione': (180, 'verificata: emisfero posteriore (centro 270°W = 90°E) a sinistra del centro, come vuole una mappa centrata a 180°'),
    'giapeto': (180, 'verificata: Cassini Regio (centro 90°W = 270°E) a destra del centro'),
    'tritone': (180, 'non verificata: mosaico di P. Schenk come Dione e Giapeto'),
    'caronte': (180, 'non verificata: mosaico New Horizons come Plutone'),
}
VERIFICATE_A_ZERO = {
    'terra': 'verificata: meridiano di Greenwich al centro',
    'luna': 'verificata: faccia visibile (mari) al centro',
    'venere': 'verificata: Maxwell Montes (3°E, 65°N) in alto al centro',
    'io': 'verificata: Pele (255°W = 105°E) a circa 3/4 della larghezza',
    'teti': 'verificata: cratere Odysseus (129°W = 231°E) a sinistra',
    'mimas': 'verificata: cratere Herschel (104°W = 256°E) a sinistra',
    'marte': 'verificata: Hellas (70°E, 42°S) a destra del centro, in basso',
}

# Saturno (Hubble OPAL 2025), 5 pixel per grado. Righe senza dati: 0-42
# (oltre 81,6°N, fuori vista), 430-445 (circa 4°N-1°N, coperte dagli anelli),
# 880-899 (oltre 86°S). Le righe vicine ai buchi hanno artefatti di colore:
# i buchi si allargano di qualche riga per riempire da dati puliti.
SATURNO_BUCHI = {
    'polo_nord': (0, 62),
    'equatore': (424, 452),
    'polo_sud': (858, 899),
}


def magick(*args):
    subprocess.run(['magick', *map(str, args)], check=True)


def larghezza(path):
    out = subprocess.run(['magick', 'identify', '-format', '%w', f'{path}[0]'], check=True,
                         capture_output=True, text=True).stdout
    return int(out)


def colore_medio(path, crop):
    out = subprocess.run(['magick', str(path), '-crop', crop, '+repage', '-format',
                          '%[fx:mean.r] %[fx:mean.g] %[fx:mean.b]', 'info:'],
                         check=True, capture_output=True, text=True).stdout
    return [round(float(x), 3) for x in out.split()]


def saturno_riempito(src, tmp):
    """Riempie le righe vuote: poli con la riga valida piu' vicina, fascia
    equatoriale con una sfumatura fra le due righe valide ai bordi."""
    magick(src, '-alpha', 'off', '-colorspace', 'sRGB', '-depth', '8', tmp)
    a0, a1 = SATURNO_BUCHI['polo_nord']
    magick(tmp, '(', '+clone', '-crop', f'1800x1+0+{a1 + 1}', '+repage', '-scale', f'1800x{a1 + 1}!', ')',
           '-geometry', '+0+0', '-composite', tmp)
    b0, b1 = SATURNO_BUCHI['polo_sud']
    magick(tmp, '(', '+clone', '-crop', f'1800x1+0+{b0 - 1}', '+repage', '-scale', f'1800x{b1 - b0 + 1}!', ')',
           '-geometry', f'+0+{b0}', '-composite', tmp)
    e0, e1 = SATURNO_BUCHI['equatore']
    sopra, sotto = tmp + '.sopra.png', tmp + '.sotto.png'
    magick(tmp, '-crop', f'1800x1+0+{e0 - 1}', '+repage', sopra)
    magick(tmp, '-crop', f'1800x1+0+{e1 + 1}', '+repage', sotto)
    for y in range(e0, e1 + 1):
        # Peso della riga sotto: da quasi 0 vicino al bordo alto a quasi 100.
        peso = round(100 * (y - e0 + 1) / (e1 - e0 + 2))
        magick(tmp, '(', sotto, sopra, '-compose', 'blend', '-define', f'compose:args={peso}', '-composite', ')',
               '-compose', 'over', '-geometry', f'+0+{y}', '-composite', tmp)
    pathlib.Path(sopra).unlink()
    pathlib.Path(sotto).unlink()


def basse():
    """Mappe 512x256 (potenze di due, per le mipmap) dalle WebP grandi."""
    cartella = USCITA / 'basse'
    cartella.mkdir(exist_ok=True)
    totale = 0
    for src in sorted(USCITA.glob('*.webp')):
        tmp = str(cartella / f'.{src.stem}.png')
        magick(src, '-alpha', 'off', '-colorspace', 'sRGB', '-filter', 'Lanczos', '-resize', '512x256!', tmp)
        dest = cartella / src.name
        subprocess.run(['cwebp', '-quiet', '-q', '80', '-m', '6', tmp, '-o', str(dest)], check=True)
        pathlib.Path(tmp).unlink()
        totale += dest.stat().st_size
        print(f'[OK] basse/{dest.name} {dest.stat().st_size // 1024} KB')
    print(f'[OK] basse: {totale // 1024} KB in tutto')


def main():
    if sys.argv[1:] == ['--basse']:
        basse()
        return
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    originali = pathlib.Path(sys.argv[1])
    scelte = json.loads(pathlib.Path(sys.argv[2]).read_text(encoding='utf-8'))
    USCITA.mkdir(parents=True, exist_ok=True)
    elenco = {}

    for cid, info in sorted(scelte.items()):
        src = next(originali.glob(cid + '.*'))
        voce = {'credito': info['credito'], 'licenza': info['licenza'], 'fonte': info['url'],
                'pagina_fonte': info.get('pagina_fonte'), 'copertura': info.get('copertura')}
        if cid in ('urano', 'nettuno'):
            # Solo le righe con dati validi, lontano dai bordi con artefatti.
            crop = '100%x40%+0+18' if cid == 'urano' else '100%x18%+0+270'
            voce.update({'colore': colore_medio(src, crop),
                         'tipo': 'colore medio misurato da Hubble' + (', contrasto aumentato dagli astronomi' if cid == 'nettuno' else ''),
                         'nota': 'Colore uniforme: media dei pixel validi della mappa OPAL (righe ' + crop + '). '
                                 'La mappa non si usa: copre solo l\'emisfero visto da Hubble.'})
            elenco[cid] = voce
            print(f'[OK] {cid}: colore medio {voce["colore"]}')
            continue

        tmp = str(USCITA / f'.{cid}.png')
        if cid == 'saturno':
            saturno_riempito(src, tmp)
            voce['nota'] = ('Righe senza dati (o con artefatti ai bordi) riempite: poli (oltre 77,6°N e 81,6°S) con la riga '
                            'valida piu\' vicina, fascia equatoriale coperta dagli anelli (circa 5,2°N-0,4°S) con una '
                            'sfumatura fra le righe ai bordi.')
        else:
            magick(f'{src}[0]', '-alpha', 'off', '-colorspace', 'sRGB', tmp)
        lato = 2048 if larghezza(src) >= 1800 else 1024
        magick(tmp, '-filter', 'Lanczos', '-resize', f'{lato}x{lato // 2}!', tmp)
        dest = USCITA / f'{cid}.webp'
        subprocess.run(['cwebp', '-quiet', '-q', '82', '-m', '6', tmp, '-o', str(dest)], check=True)
        # Miniatura per i pulsanti dei pianeti (128x64, pochi KB).
        (USCITA / 'mini').mkdir(exist_ok=True)
        magick(dest, '-resize', '128x64!', '-quality', '70', USCITA / 'mini' / f'{cid}.webp')
        pathlib.Path(tmp).unlink()

        lon, verifica = LON_CENTRO.get(cid, (0, VERIFICATE_A_ZERO.get(cid, 'non verificata: convenzione piu\' comune (0° al centro)')))
        voce.update({'file': dest.name, 'tipo': info.get('tipo'), 'lon_centro': lon, 'lon_verifica': verifica})
        elenco[cid] = voce
        print(f'[OK] {cid}: {dest.name} {lato}x{lato // 2} {dest.stat().st_size // 1024} KB')

    ELENCO.write_text(json.dumps(elenco, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'[OK] {ELENCO.relative_to(RADICE)}: {len(elenco)} voci')
    basse()


if __name__ == '__main__':
    main()
