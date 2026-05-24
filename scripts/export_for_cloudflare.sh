#!/usr/bin/env bash
set -euo pipefail

BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$BASE_DIR/"
DST_DEFAULT="$BASE_DIR/export/"
DST_INPUT="${1:-$DST_DEFAULT}"

if [[ "$DST_INPUT" = /* ]]; then
  DST="$DST_INPUT"
else
  DST="$BASE_DIR/$DST_INPUT"
fi

DST="${DST%/}/"
mkdir -p "$DST"

minify_export_assets() {
  if ! command -v npx >/dev/null 2>&1; then
    echo "[WARN] npx non disponibile: salto minificazione JS/CSS"
    return
  fi

  local tmp_dir
  tmp_dir="$(mktemp -d)"
  local -a assets=()

  while IFS= read -r -d '' file; do
    assets+=("$file")
  done < <(find "$DST" -type f \( -name '*.js' -o -name '*.css' \) -print0)

  if [[ ${#assets[@]} -eq 0 ]]; then
    rm -rf "$tmp_dir"
    return
  fi

  echo "[INFO] Minify JS/CSS export assets"
  npx --yes esbuild "${assets[@]}" \
    --minify \
    --legal-comments=none \
    --target=es2020 \
    --outbase="$DST" \
    --outdir="$tmp_dir"

  rsync -a "$tmp_dir"/ "$DST"/
  rm -rf "$tmp_dir"
}

echo "[INFO] Refresh structured data dates"
python3 "$BASE_DIR/scripts/refresh_structured_data.py"

echo "[INFO] Regenerate sitemap.xml"
python3 "$BASE_DIR/scripts/generate_sitemap.py"

echo "[INFO] Sync source -> $DST"
rsync -av --delete --delete-excluded \
  --exclude 'export/' \
  --exclude '.claude/' \
  --exclude '.git/' \
  --exclude '.github/' \
  --exclude '.gitignore' \
  --exclude '__pycache__/' \
  --exclude 'admin/' \
  --exclude 'docs/' \
  --exclude 'reports/' \
  --exclude 'scripts/' \
  --exclude '.wrangler/' \
  --exclude '.DS_Store' \
  --exclude '*.md' \
  --exclude '*.pyc' \
  --exclude '*.sh' \
  --exclude '*.py' \
  --exclude '_headers' \
  --exclude '_redirects' \
  "$SRC" "$DST"

find "$DST" -name '.DS_Store' -delete

minify_export_assets

echo "[OK] Export aggiornato in: $DST"
