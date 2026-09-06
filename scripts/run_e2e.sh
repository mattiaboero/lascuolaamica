#!/usr/bin/env bash
#
# E2E runner: esegue subject_quiz_test_harness.js su tutte le 8 materie.
# Uso: bash scripts/run_e2e.sh [modes]
#   modes = lista comma-separated (default: perfect)
#   esempi: bash scripts/run_e2e.sh perfect
#           bash scripts/run_e2e.sh perfect,mixed,worst
#   il modo "ripassa" gioca una sessione mixed e poi "Ripassa i tuoi errori"
#   il modo "interrupt" verifica che uscire dal gioco annulli l'avanzamento differito
#   il modo "dialogs" verifica focus di ritorno delle modali e coda dei dialoghi
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
    # inglese usa screenLevels: si giocano tutti i livelli dichiarati, non solo
    # il primo. Un livello il cui filtro non seleziona domande resta disabled e
    # il click fallisce: e' successo in produzione (livello 3 con
    # fallbackDifficulty [4], assente dai dati) senza che nulla lo segnalasse.
    levels=("")
    if [[ "$subj" == "inglese" ]]; then
      levels=(1 2 3)
    fi
    for lvl in "${levels[@]}"; do
    extra=()
    if [[ -n "$lvl" ]]; then
      extra=(--level "$lvl")
    fi
    run_mode="$mode"
    # "ripassa" non e' un mode del harness: e' una sessione mixed seguita dal ripasso
    if [[ "$mode" == "ripassa" ]]; then
      run_mode="mixed"
      extra+=(--ripassa)
    fi
    # "interrupt" esce dalla partita subito dopo una risposta
    if [[ "$mode" == "interrupt" ]]; then
      run_mode="perfect"
      extra+=(--interrupt)
    fi
    # "dialogs" non gioca: verifica focus di ritorno e coda dei dialoghi
    if [[ "$mode" == "dialogs" ]]; then
      run_mode="perfect"
      extra+=(--dialogs)
    fi
    echo "=== E2E: $subj mode=$mode${lvl:+ level=$lvl} ==="
    if ! node scripts/subject_quiz_test_harness.js \
          --base-url "$BASE" --page "$subj" --mode "$run_mode" ${extra[@]+"${extra[@]}"}; then
      echo "[FAIL] $subj mode=$mode${lvl:+ level=$lvl}"
      fail=1
    fi
    done
  done
done

if [[ $fail -ne 0 ]]; then
  echo "E2E FAILED"
  exit 1
fi
echo "E2E PASSED (subjects=${#SUBJECTS[@]} modes=$MODES)"
