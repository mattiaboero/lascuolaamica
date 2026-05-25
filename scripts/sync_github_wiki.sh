#!/usr/bin/env bash
#
# Sync docs/wiki/*.md -> GitHub wiki repo separato.
# Uso: ./scripts/sync_github_wiki.sh
#
# Vincoli:
# - blocca push se rileva path leak /Users/.
# - branch wiki = master (default GitHub wiki).
# - clone fresh ogni run per evitare stato sporco /tmp.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC_DIR="$REPO_ROOT/docs/wiki"
WIKI_DIR="/tmp/lascuolaamica.wiki"
WIKI_REMOTE="https://github.com/mattiaboero/lascuolaamica.wiki.git"
WIKI_BRANCH="master"

if [[ ! -d "$SRC_DIR" ]]; then
  echo "[ERROR] $SRC_DIR not found"
  exit 1
fi

echo "[INFO] cleaning $WIKI_DIR"
rm -rf "$WIKI_DIR"

echo "[INFO] cloning wiki repo"
git clone --quiet "$WIKI_REMOTE" "$WIKI_DIR"

echo "[INFO] copying docs/wiki/*.md -> wiki repo"
cp "$SRC_DIR"/*.md "$WIKI_DIR/"

echo "[INFO] checking for path leak"
if grep -l "/Users/" "$WIKI_DIR"/*.md > /dev/null 2>&1; then
  echo "[ERROR] path leak /Users/ detected, abort push"
  grep -n "/Users/" "$WIKI_DIR"/*.md
  exit 1
fi
echo "[OK] no path leak"

cd "$WIKI_DIR"

if git diff --quiet; then
  echo "[OK] no changes, nothing to sync"
  cd "$REPO_ROOT"
  rm -rf "$WIKI_DIR"
  exit 0
fi

echo "[INFO] changes detected, committing"
git add .
git diff --staged --stat

git commit -m "docs(wiki): sync from main docs/wiki/"

echo "[INFO] pushing to $WIKI_BRANCH"
git push origin "$WIKI_BRANCH"

echo "[OK] wiki sync completed"

cd "$REPO_ROOT"
rm -rf "$WIKI_DIR"
echo "[OK] cleanup done"
