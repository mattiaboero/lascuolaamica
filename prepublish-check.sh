#!/usr/bin/env bash
set -euo pipefail

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$BASE_DIR"

status=0
HTML_FILES=(
  "index.html"
  "matematica.html"
  "inglese.html"
  "problemi.html"
  "civica.html"
  "geografia.html"
  "storia.html"
  "scienze.html"
  "italiano.html"
  "villaggio.html"
  "supporta.html"
  "faq.html"
)

check_html_integrity() {
  local file="$1"
  if [[ ! -f "$file" ]]; then
    echo "[ERROR] Missing file: $file"
    status=1
    return
  fi

  local html_line
  html_line=$(grep -n -m1 '</html>' "$file" | cut -d: -f1 || true)
  if [[ -z "$html_line" ]]; then
    echo "[ERROR] $file: missing </html>"
    status=1
    return
  fi

  local trailing
  trailing=$(tail -n +$((html_line + 1)) "$file" | sed '/^[[:space:]]*$/d')
  if [[ -n "$trailing" ]]; then
    echo "[ERROR] $file: content found after </html>"
    status=1
  else
    echo "[OK] $file: no content after </html>"
  fi

  local opens closes
  opens=$(grep -o '<script[^>]*>' "$file" | wc -l | tr -d ' ')
  closes=$(grep -o '</script>' "$file" | wc -l | tr -d ' ')
  if [[ "$opens" != "$closes" ]]; then
    echo "[ERROR] $file: script tag mismatch (open=$opens close=$closes)"
    status=1
  else
    echo "[OK] $file: script tags balanced"
  fi

  if grep -q 'onclick="' "$file"; then
    echo "[ERROR] $file: inline onclick attributes found"
    status=1
  else
    echo "[OK] $file: no inline onclick attributes"
  fi

  if grep -qiE '<meta[^>]+http-equiv=["'"'"']Content-Security-Policy["'"'"']' "$file"; then
    echo "[OK] $file: CSP meta found"
  else
    echo "[ERROR] $file: missing Content-Security-Policy meta"
    status=1
  fi

  if grep -qiE '<meta[^>]+http-equiv=["'"'"']Permissions-Policy["'"'"']' "$file"; then
    echo "[OK] $file: Permissions-Policy meta found"
  else
    echo "[ERROR] $file: missing Permissions-Policy meta"
    status=1
  fi
}

for file in "${HTML_FILES[@]}"; do
  check_html_integrity "$file"
done

check_security_patterns() {
  local findings=""
  findings=$(find . -type f \( -name '*.js' -o -name '*.html' \) -print0 | xargs -0 grep -nE 'eval\(|new Function\(|document\.write\(|innerHTML[[:space:]]*=|javascript:' || true)
  if [[ -n "$findings" ]]; then
    echo "[ERROR] dangerous patterns detected (eval/document.write/innerHTML/javascript:)"
    echo "$findings"
    status=1
  else
    echo "[OK] no dangerous patterns detected"
  fi
}

check_target_blank_rel() {
  local file="$1"
  local line_num=0
  local bad=0

  while IFS= read -r line; do
    line_num=$((line_num + 1))
    if [[ "$line" == *'target="_blank"'* ]]; then
      if [[ "$line" != *'rel="'* || "$line" != *'noopener'* || "$line" != *'noreferrer'* ]]; then
        echo "[ERROR] $file:$line_num target=\"_blank\" missing rel=\"noopener noreferrer\""
        bad=1
      fi
    fi
  done < "$file"

  if [[ $bad -eq 0 ]]; then
    echo "[OK] $file: target=\"_blank\" links are hardened"
  else
    status=1
  fi
}

check_security_patterns
for file in "${HTML_FILES[@]}"; do
  check_target_blank_rel "$file"
done

check_runtime_split_json_only() {
  local findings=""
  findings=$(grep -nE 'questions\.json' questions-loader.js sw.js js/*.js *.html 2>/dev/null || true)
  if [[ -n "$findings" ]]; then
    echo "[ERROR] runtime references to questions.json found (expected split json/index.json + json/*.json only)"
    echo "$findings"
    status=1
  else
    echo "[OK] runtime files: no direct questions.json references"
  fi
}

check_runtime_split_json_only

if [[ ! -f "robots.txt" ]]; then
  echo "[ERROR] Missing file: robots.txt"
  status=1
else
  if grep -qE '^Sitemap:[[:space:]]+https?://.*/sitemap\.xml$' robots.txt; then
    echo "[OK] robots.txt: sitemap directive found"
  else
    echo "[ERROR] robots.txt: sitemap directive missing or invalid"
    status=1
  fi
fi

if [[ ! -f "_redirects" ]]; then
  echo "[ERROR] Missing file: _redirects"
  status=1
else
  if grep -qE '^https://www\.lascuolaamica\.it/\* https://lascuolaamica\.it/:splat 301$' _redirects; then
    echo "[OK] _redirects: www -> non-www redirect found"
  else
    echo "[WARN] _redirects: www -> non-www redirect not found (expected via Cloudflare Rules)"
  fi
  if grep -qE '^/index\.html / 301$' _redirects; then
    echo "[OK] _redirects: index.html -> / redirect found"
  else
    echo "[ERROR] _redirects: missing /index.html -> / redirect"
    status=1
  fi
fi

if [[ ! -f "_headers" ]]; then
  echo "[ERROR] Missing file: _headers"
  status=1
else
  if grep -qE '^/json/\*$' _headers \
    && grep -qE 'X-Robots-Tag:[[:space:]]+noindex, nofollow' _headers \
    && grep -qE 'Cache-Control:[[:space:]]+public, max-age=0, must-revalidate' _headers; then
    echo "[OK] _headers: split json noindex/cache rules found"
  else
    echo "[ERROR] _headers: missing /json/* noindex/cache rules"
    status=1
  fi

  if grep -qE '^/\*$' _headers \
    && grep -qE 'X-Content-Type-Options:[[:space:]]+nosniff' _headers \
    && grep -qE 'X-Frame-Options:[[:space:]]+DENY' _headers \
    && grep -qE 'Referrer-Policy:[[:space:]]+strict-origin-when-cross-origin' _headers; then
    echo "[OK] _headers: baseline security headers found"
  else
    echo "[ERROR] _headers: missing baseline security headers on /*"
    status=1
  fi

  if grep -qE '^/assets/\*$' _headers && grep -qE '^/screenshots/\*$' _headers \
    && grep -qE 'Cache-Control:[[:space:]]+public, max-age=31536000, immutable' _headers; then
    echo "[OK] _headers: long cache rules found for assets/screenshots"
  else
    echo "[ERROR] _headers: missing long cache rules for /assets/* or /screenshots/*"
    status=1
  fi
fi

if [[ ! -f "sitemap.xml" ]]; then
  echo "[ERROR] Missing file: sitemap.xml"
  status=1
else
  if grep -qE '<urlset' sitemap.xml && grep -qE '<loc>https://lascuolaamica\.it/</loc>' sitemap.xml; then
    echo "[OK] sitemap.xml: basic structure valid"
  else
    echo "[ERROR] sitemap.xml: missing urlset or home entry"
    status=1
  fi

  if grep -qE '<loc>https://www\.' sitemap.xml; then
    echo "[ERROR] sitemap.xml: contains www URL, expected non-www only"
    status=1
  else
    echo "[OK] sitemap.xml: non-www domain enforced"
  fi

  if grep -qE '<lastmod>[0-9]{4}-[0-9]{2}-[0-9]{2}</lastmod>' sitemap.xml; then
    echo "[OK] sitemap.xml: lastmod format valid"
  else
    echo "[ERROR] sitemap.xml: missing valid lastmod format (YYYY-MM-DD)"
    status=1
  fi

  declare -a expected_urls=(
    "https://lascuolaamica.it/"
    "https://lascuolaamica.it/matematica"
    "https://lascuolaamica.it/inglese"
    "https://lascuolaamica.it/problemi"
    "https://lascuolaamica.it/civica"
    "https://lascuolaamica.it/geografia"
    "https://lascuolaamica.it/storia"
    "https://lascuolaamica.it/scienze"
    "https://lascuolaamica.it/italiano"
    "https://lascuolaamica.it/supporta"
    "https://lascuolaamica.it/faq"
    "https://lascuolaamica.it/accessibilita"
  )

  for url in "${expected_urls[@]}"; do
    if grep -q "<loc>${url}</loc>" sitemap.xml; then
      echo "[OK] sitemap.xml: contains ${url}"
    else
      echo "[ERROR] sitemap.xml: missing ${url}"
      status=1
    fi
  done
fi

if command -v ruby >/dev/null 2>&1; then
  if ruby -rjson -e '
    m = JSON.parse(File.read("manifest.json"))
    screenshots = m["screenshots"]
    ok = screenshots.is_a?(Array) && screenshots.all? { |s| s.is_a?(Hash) && s["src"].to_s.strip != "" }
    exit(ok ? 0 : 1)
  '; then
    echo "[OK] manifest.json: screenshots contain src"
  else
    echo "[ERROR] manifest.json: one or more screenshots are missing src"
    status=1
  fi
else
  echo "[WARN] ruby not available, manifest screenshot check skipped"
fi

if [[ $status -ne 0 ]]; then
  echo
  echo "Prepublish checks failed."
  exit $status
fi

echo
echo "Prepublish checks passed."
