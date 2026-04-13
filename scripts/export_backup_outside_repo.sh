#!/usr/bin/env bash
set -euo pipefail

BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DEFAULT_BACKUP_DIR="$(cd "$BASE_DIR/.." && pwd)/export-backup"
DST="${1:-$DEFAULT_BACKUP_DIR}"

echo "[INFO] Backup export fuori repo in: $DST"
bash "$BASE_DIR/scripts/export_for_cloudflare.sh" "$DST"
echo "[OK] Backup pronto: $DST"
