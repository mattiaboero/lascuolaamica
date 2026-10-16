# Mappe di superficie da scaricare (in attesa di permesso)

Una mappa per corpo, scelta fra quelle **vere** (costruite con immagini di sonde o
telescopi) e di **pubblico dominio**. Verranno scaricate una volta, ridotte a WebP
2048×1024 (o meno) in `assets/sistema-solare/` e registrate con il credito.

Peso totale da scaricare: circa **57 MB**. Peso finale nel sito: circa 4-6 MB.

| Corpo | File | Fonte | Licenza | Tipo | Peso |
|---|---|---|---|---|---|
| Mercurio | PIA16298.jpg | NASA Photojournal (MESSENGER) | pubblico dominio | grigi | 1,1 MB |
| Venere | Cylindrical_Map_of_Venus.jpg | Wikimedia Commons (NASA/JPL Magellan) | pubblico dominio | radar | 2,5 MB |
| Terra | land_shallow_topo_2048.jpg | NASA Earth Observatory (Blue Marble) | pubblico dominio | colori naturali | 0,24 MB |
| Luna | lroc_color_2k.jpg | NASA SVS (LRO) | pubblico dominio | colori naturali | 0,46 MB |
| Marte | Mars_Viking_MDIM21_ClrMosaic_1km.jpg (3840 px) | Wikimedia Commons (NASA/USGS Viking) | pubblico dominio | colori naturali approssimati | 2,4 MB |
| Giove | PIA07782.jpg | NASA Photojournal (Cassini) | pubblico dominio | colori naturali | 0,44 MB |
| Saturno | OPAL saturn-2025a globalmap.tif | STScI MAST, programma OPAL (Hubble) | dati pubblici HST, con citazione | colori quasi naturali | 4,9 MB |
| Urano | OPAL uranus-2025a globalmap.tif | STScI MAST, OPAL (Hubble) | dati pubblici HST, con citazione | colori naturali | 0,79 MB |
| Nettuno | OPAL neptune-2025b globalmap.tif | STScI MAST, OPAL (Hubble) | dati pubblici HST, con citazione | colori naturali, contrasto accentuato | 0,79 MB |
| Cerere | ceres_dawn_fc_dlr_global_feb2016_1024.jpg | USGS Astrogeology (Dawn) | pubblico dominio | grigi | 0,18 MB |
| Plutone | PIA11707.jpg | NASA Photojournal (New Horizons) | pubblico dominio | colore migliorato | 1,4 MB |
| Caronte | PIA19866.jpg | NASA Photojournal (New Horizons) | pubblico dominio | grigi | 1,15 MB |
| Fobos | Mars - Phobos.jpg | NASA 3D Resources (Viking) | pubblico dominio | grigi | 0,60 MB |
| Deimos | Mars - Deimos.jpg | NASA 3D Resources (Viking) | pubblico dominio | grigi | 0,48 MB |
| Io | full.jpg (Io color merged) | USGS Astrogeology (Galileo/Voyager) | pubblico dominio | colore migliorato | 0,20 MB |
| Europa | europa_..._global_mosaic_500m_1024.jpg | USGS Astrogeology | pubblico dominio | grigi | 0,07 MB |
| Ganimede | ganymede_..._global_clrmosaic_1024.jpg | USGS Astrogeology | pubblico dominio | falsi colori | 0,08 MB |
| Callisto | callisto_..._global_mosaic_1024.jpg | USGS Astrogeology | pubblico dominio | grigi | 0,07 MB |
| Titano | PIA22770.jpg | NASA Photojournal (Cassini ISS) | pubblico dominio | grigi (infrarosso) | 0,89 MB |
| Encelado | enceladus_..._schenk2024_1024.jpg | USGS Astrogeology (Cassini) | pubblico dominio | grigi | 0,13 MB |
| Mimas | PIA14926.jpg | NASA Photojournal (Cassini) | pubblico dominio | grigi | 1,4 MB |
| Teti | PIA14931.jpg | NASA Photojournal (Cassini) | pubblico dominio | grigi | 7,1 MB |
| Dione | PIA18434.jpg | NASA Photojournal (Cassini) | pubblico dominio | colore migliorato | 10,3 MB |
| Rea | PIA14928.jpg | NASA Photojournal (Cassini) | pubblico dominio | grigi | 5,6 MB |
| Giapeto | PIA18436.jpg | NASA Photojournal (Cassini) | pubblico dominio | colore migliorato | 5,0 MB |
| Miranda, Ariel, Umbriel, Titania, Oberon | Uranus - <nome>.jpg | NASA 3D Resources (USGS/JPL, Voyager 2) | pubblico dominio | grigi, solo emisfero sud | 1,1 MB in tutto |
| Tritone | PIA18668.jpg | NASA Photojournal (Voyager 2) | pubblico dominio | colore migliorato, circa 40% della superficie | 4,3 MB |
| Vesta | Vesta_map_for_GeoHack.png | Wikimedia Commons (NASA Dawn) | pubblico dominio | grigi | 3,2 MB |
| Bennu | Bennu_global_..._8bit_print.jpg | NASA SVS (OSIRIS-REx) | pubblico dominio | grigi | 0,22 MB |

Gli URL esatti sono in
`docs/sistema-solare/texture-fonti.json` (bozza dell'agente, copiata dallo
scratchpad).

## Facoltativa

| Corpo | File | Fonte | Licenza | Peso |
|---|---|---|---|---|
| Ryugu | hyb2_onc_Global_02_l3dm_v06.jpg | JAXA DARTS (Hayabusa2) | policy ISAS/JAXA: uso educativo e non commerciale con credito «© JAXA». Non è una licenza aperta. | 2,9 MB |

## Escluse, e perché

- **Sole**: le mappe disponibili sono in ultravioletto o artistiche. Il Sole resta
  di colore uniforme e la scheda spiega che la superficie cambia di continuo.
- **Eris, Haumea, Makemake, Amaltea, Iperione, Proteo, Nereide, Pallade, Igea,
  Didymos, Dimorphos, Halley, 67P**: nessuna mappa vera e globale. Restano grigi.
- **Eros, Itokawa**: le uniche mappe globali sono rilievi ridisegnati (Stooke) o
  file da 39 MB. Restano grigi.
- **Arrokoth**: solo una ricostruzione di terzi (CC BY-SA), in parte inventata.
- **Texture di Solar System Scope**: ritoccate. Quelle di Eris, Haumea e Makemake
  sono dichiarate fittizie.
- **Texture NASA 3D di Plutone, Caronte, Nettuno e Titano**: la NASA stessa le
  dichiara artistiche.
