#!/usr/bin/env bash
set -euo pipefail

BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$BASE_DIR/"
DST="$BASE_DIR/export/"

echo "[INFO] Sync source -> export"
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
