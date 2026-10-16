#!/usr/bin/env python3
"""Prepara un modello 3D (ISS, Voyager) per la pagina /sistema-solare.

I modelli di NASA 3D Resources (github.com/nasa/NASA-3D-Resources, "free and
without copyright") sono glTF compressi con Draco, che il motore del sito
(WebGL 1, nessuna libreria) non legge. Due passi:

1. Blender, senza finestra, apre il .glb e ne scrive triangoli, normali e
   colori:
     /Applications/Blender.app/Contents/MacOS/Blender -b \\
       --python scripts/blender_esporta_modello.py -- modello.glb grezzo.json
2. Questo script lo centra, lo porta a lunghezza 1 e lo impacchetta in
   assets/sistema-solare/<nome>.bin, 10 byte per vertice:
     posizione  3 x Int16 (normalizzati: -1..1)
     normale    3 x Int8  (normalizzati)
     colore     1 x Uint8 (indice nella tavolozza dei materiali)
   Tavolozza, assi e crediti vanno in docs/sistema-solare/<nome>-modello.json,
   letto da build_sistema_solare.py.

    python3 scripts/prepara_modello_sistema_solare.py grezzo.json iss "credito" "url fonte"
    python3 scripts/prepara_modello_sistema_solare.py grezzo.json voyager "credito" "url fonte"
"""
import json
import pathlib
import struct
import sys

RADICE = pathlib.Path(__file__).resolve().parent.parent


def main():
    grezzo = json.loads(pathlib.Path(sys.argv[1]).read_text())
    nome, credito, fonte = sys.argv[2], sys.argv[3], sys.argv[4]
    pos, nor, col = grezzo['pos'], grezzo['nor'], grezzo['col']
    n = len(pos) // 3
    lo = [min(pos[k::3]) for k in range(3)]
    hi = [max(pos[k::3]) for k in range(3)]
    centro = [(a + b) / 2 for a, b in zip(lo, hi)]
    estensione = [b - a for a, b in zip(lo, hi)]
    mezzo = max(estensione) / 2
    tavolozza = []
    indici = []
    for v in range(n):
        # Blender da' il colore base in spazio lineare: la pagina disegna in sRGB.
        c = tuple(round(max(0.0, x) ** (1 / 2.2), 3) for x in col[v * 3:v * 3 + 3])
        if c not in tavolozza:
            tavolozza.append(c)
        indici.append(tavolozza.index(c))
    out = bytearray()
    for v in range(n):
        p = [(pos[v * 3 + k] - centro[k]) / mezzo for k in range(3)]
        q = [max(-1.0, min(1.0, nor[v * 3 + k])) for k in range(3)]
        out += struct.pack('<3h3bB', *[round(x * 32767) for x in p], *[round(x * 127) for x in q], indici[v])
    dest = RADICE / 'assets' / 'sistema-solare' / f'{nome}.bin'
    dest.write_bytes(bytes(out))
    info = {
        'file': f'{nome}.bin', 'vertici': n, 'byte_per_vertice': 10,
        'tavolozza': [list(c) for c in tavolozza],
        # Lunghezza di ogni asse del modello, con 1 = asse piu' lungo.
        'estensione_assi': [round(e / max(estensione), 4) for e in estensione],
        'credito': credito,
        'fonte': fonte,
        'licenza': 'NASA 3D Resources: "free and without copyright"; citare NASA come fonte (linee guida NASA).'
    }
    (RADICE / 'docs' / 'sistema-solare' / f'{nome}-modello.json').write_text(json.dumps(info, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'[OK] {dest.relative_to(RADICE)}: {n} vertici, {len(out) // 1024} KB, {len(tavolozza)} colori, assi {info["estensione_assi"]}')


if __name__ == '__main__':
    main()
