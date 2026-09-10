#!/usr/bin/env bash
#
# Costruisce export/: la cartella che Cloudflare Pages pubblica. Dentro ci va
# solo quello che il sito serve, niente di cio' che serve a svilupparlo.
#
# Uso: bash scripts/export_for_cloudflare.sh [cartella]   (default: export/)
#
# Tre scelte, tutte nate da cio' che si e' visto in produzione il 10/09/2026:
#
# 1. LISTA DI INCLUSIONE, NON DI ESCLUSIONE. Si parte dai file tracciati da git
#    e si tiene solo cio' che corrisponde a INCLUDI. Prima era il contrario: una
#    lista di esclusioni che non conteneva node_modules/ (201 MB copiati nel
#    sito) e che escludeva _headers e _redirects, senza i quali Cloudflare perde
#    CSP, HSTS e regole di cache. Con l'inclusione una cartella nuova non finisce
#    online per dimenticanza: per pubblicarla bisogna nominarla qui.
#
# 2. COPIA PURA, NIENTE RIGENERATO. Sitemap e dati strutturati si aggiornano con
#    `npm run freshness` prima del rilascio e vengono verificati da `npm run
#    verify`. Rigenerarli qui voleva dire pubblicare file diversi da quelli
#    verificati — e su Cloudflare, dove il clone puo' non avere la storia git,
#    le date sarebbero uscite sbagliate.
#
# 3. MINIFICAZIONE CON UNA VERSIONE FISSATA. Prima si usava `npx --yes esbuild`,
#    cioe' scaricando a ogni build l'ultima versione di un pacchetto non fissato:
#    una dipendenza che cambia da sola in produzione. Ora esbuild e' una
#    devDependency a versione esatta, installata dal lockfile. Non era mai girata
#    davvero (in produzione i JS erano identici ai sorgenti), e vale la pena:
#    misurato il 10/09/2026, JS e CSS passano da 150 a 110 KB in transito anche
#    dopo il Brotli di Cloudflare, -27%. Se esbuild manca la build si ferma: una
#    minificazione saltata in silenzio e' lo stesso difetto di un controllo muto.
#
# L'unica trasformazione e' sui dataset: le domande disattivate (active: false)
# restano nel repo come archivio ma non vengono spedite, perche' nessuna pagina
# le mostra. Il loader le scarta comunque; qui semplicemente non viaggiano.
#
# Dopo la copia, scripts/check_export.js verifica che export/ sia completo e
# pulito: se manca un file che il sito usa, o se c'e' qualcosa di interno,
# l'export fallisce invece di pubblicare un sito rotto.

set -euo pipefail

BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DST_INPUT="${1:-export}"
if [[ "$DST_INPUT" = /* ]]; then DST="$DST_INPUT"; else DST="$BASE_DIR/$DST_INPUT"; fi
DST="${DST%/}"

# Cosa il sito pubblica. Un'espressione per riga, confrontata con i percorsi di
# `git ls-files`. Nella radice: pagine, stili, script del sito, e i file che
# Cloudflare e i browser cercano per nome.
INCLUDI=(
  '^[^/]+\.html$'
  '^[^/]+\.css$'
  '^[^/]+\.js$'
  '^(_headers|_redirects|manifest\.json|robots\.txt|sitemap\.xml|llms\.txt|favicon\.svg|favicon\.ico)$'
  '^js/'
  '^json/[^/]+\.json$'
  '^assets/'
  '^icons/'
  '^screenshots/'
)

cd "$BASE_DIR"

filtro="$(IFS='|'; echo "${INCLUDI[*]}")"
elenco="$(mktemp)"
trap 'rm -f "$elenco"' EXIT

git ls-files | grep -E "$filtro" > "$elenco"

echo "[INFO] $(wc -l < "$elenco" | tr -d ' ') file da pubblicare (su $(git ls-files | wc -l | tr -d ' ') tracciati)"

rm -rf "$DST"
mkdir -p "$DST"
# tar invece di rsync: c'e' ovunque, sul Mac come nell'immagine di build di
# Cloudflare, dove rsync non e' garantito.
# COPYFILE_DISABLE: sul Mac tar aggiungerebbe file "._*" con gli attributi estesi.
COPYFILE_DISABLE=1 tar -cf - -T "$elenco" | tar -xf - -C "$DST"

echo "[INFO] Dataset: tolgo le domande disattivate"
python3 - "$DST/json" <<'PY'
import json, pathlib, sys
cartella = pathlib.Path(sys.argv[1])
for f in sorted(cartella.glob('*.json')):
    dati = json.loads(f.read_text(encoding='utf-8'))
    if not isinstance(dati, dict) or not isinstance(dati.get('questions'), list):
        continue  # index.json, changelog.json: non sono banche di domande
    prima = len(dati['questions'])
    dati['questions'] = [q for q in dati['questions'] if q.get('active') is not False]
    f.write_text(json.dumps(dati, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    tolte = prima - len(dati['questions'])
    if tolte:
        print(f'  {f.name}: {tolte} disattivate tolte, {len(dati["questions"])} restano')
PY

ESBUILD="$BASE_DIR/node_modules/.bin/esbuild"
if [[ ! -x "$ESBUILD" ]]; then
  echo "[ERROR] esbuild non installato: esegui npm ci (e' fissato in package.json)" >&2
  exit 1
fi
echo "[INFO] Minifico JS e CSS con esbuild $("$ESBUILD" --version)"
# Si minificano le copie in export/, mai i sorgenti: il repo resta leggibile.
minificati="$(mktemp -d)"
trap 'rm -f "$elenco"; rm -rf "$minificati"' EXIT
( cd "$DST" && find . -type f \( -name '*.js' -o -name '*.css' \) -print0 \
    | xargs -0 "$ESBUILD" --minify --legal-comments=none --target=es2020 \
        --outbase=. --outdir="$minificati" --log-level=warning )
( cd "$minificati" && tar -cf - . ) | tar -xf - -C "$DST"

node "$BASE_DIR/scripts/check_export.js" "$DST"

echo "[OK] export pronto in: $DST"
