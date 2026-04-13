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

echo "[INFO] Sync source -> $DST"
rsync -av --delete --delete-excluded \
  --exclude 'export/' \
  --exclude '.git/' \
  --exclude '.github/' \
  --exclude '.gitignore' \
  --exclude 'docs/' \
  --exclude 'scripts/' \
  --exclude '.wrangler/' \
  --exclude '.DS_Store' \
  --exclude '*.md' \
  --exclude '*.sh' \
  --exclude '*.py' \
  --exclude '_headers' \
  --exclude '_redirects' \
  "$SRC" "$DST"

find "$DST" -name '.DS_Store' -delete

echo "[OK] Export aggiornato in: $DST"
