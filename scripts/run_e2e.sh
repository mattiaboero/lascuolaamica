#!/usr/bin/env bash
#
# E2E runner: esegue subject_quiz_test_harness.js su tutte le 8 materie.
# Uso: bash scripts/run_e2e.sh [modes]
#   modes = lista comma-separated (default: perfect)
#   esempi: bash scripts/run_e2e.sh perfect
#           bash scripts/run_e2e.sh perfect,mixed,worst
#
# Env:
#   E2E_BASE_URL  host test server (default http://127.0.0.1:4173)
#
# Richiede: playwright in node_modules (npm ci + playwright install chromium),
#           test server attivo sul baseUrl.

set -uo pipefail

BASE="${E2E_BASE_URL:-http://127.0.0.1:4173}"
MODES="${1:-perfect}"
SUBJECTS=(matematica inglese problemi civica geografia storia scienze italiano)

fail=0
IFS=',' read -ra MODE_ARR <<< "$MODES"

for mode in "${MODE_ARR[@]}"; do
  for subj in "${SUBJECTS[@]}"; do
    extra=()
    # inglese usa screenLevels: seleziona livello 1
    if [[ "$subj" == "inglese" ]]; then
      extra=(--level 1)
    fi
    echo "=== E2E: $subj mode=$mode ==="
    if ! node scripts/subject_quiz_test_harness.js \
          --base-url "$BASE" --page "$subj" --mode "$mode" "${extra[@]}"; then
      echo "[FAIL] $subj mode=$mode"
      fail=1
    fi
  done
done

if [[ $fail -ne 0 ]]; then
  echo "E2E FAILED"
  exit 1
fi
echo "E2E PASSED (subjects=${#SUBJECTS[@]} modes=$MODES)"
