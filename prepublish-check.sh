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
  "chi-siamo.html"
  "per-insegnanti.html"
  "per-genitori.html"
  "ai-info.html"
  "accessibilita.html"
  "supporta.html"
  "supporto-satispay.html"
  "faq.html"
  "premi.html"
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

  if grep -qiE '<link[^>]+rel=["'"'"']icon["'"'"']' "$file"; then
    echo "[OK] $file: favicon links found"
  else
    echo "[ERROR] $file: missing favicon links"
    status=1
  fi

  if grep -qi '<noscript>' "$file"; then
    echo "[OK] $file: noscript fallback found"
  else
    echo "[ERROR] $file: missing <noscript> fallback"
    status=1
  fi
}

for file in "${HTML_FILES[@]}"; do
  check_html_integrity "$file"
done

check_version_alignment() {
  if [[ ! -f "app-version.js" || ! -f "llms.txt" ]]; then
    echo "[ERROR] missing app-version.js and/or llms.txt"
    status=1
    return
  fi

  local app_version llms_version
  app_version=$(sed -nE "s/.*APP_VERSION = '([^']+)'.*/\\1/p" app-version.js | head -n1)
  llms_version=$(sed -nE "s/^- Versione corrente: ([0-9]+(\\.[0-9]+)*)\\.?$/\\1/p" llms.txt | head -n1)

  if [[ -z "$app_version" ]]; then
    echo "[ERROR] app-version.js: unable to parse APP_VERSION"
    status=1
    return
  fi

  if [[ -z "$llms_version" ]]; then
    echo "[ERROR] llms.txt: unable to parse 'Versione corrente'"
    status=1
    return
  fi

  if [[ "$app_version" != "$llms_version" ]]; then
    echo "[ERROR] Version mismatch: app-version.js=$app_version llms.txt=$llms_version"
    status=1
  else
    echo "[OK] Version alignment: app-version.js and llms.txt are both $app_version"
  fi
}

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

check_csp_hashes() {
  if python3 scripts/sync_csp_hashes.py --check; then
    echo "[OK] _headers: inline script CSP hashes are aligned"
  else
    echo "[ERROR] _headers: inline script CSP hashes are not aligned"
    status=1
  fi
}

check_rewards_page_metadata() {
  if grep -q 'property="og:title"' premi.html \
    && grep -q 'name="twitter:card"' premi.html \
    && grep -q '"@type": "WebPage"' premi.html \
    && grep -q '"@type": "BreadcrumbList"' premi.html \
    && grep -q 'href="/privacy"' premi.html \
    && grep -q 'href="/cookie"' premi.html; then
    echo "[OK] premi.html: social metadata, JSON-LD and policy links found"
  else
    echo "[ERROR] premi.html: missing social metadata, JSON-LD or policy links"
    status=1
  fi
}

check_css_hygiene() {
  local findings
  findings=$(grep -R -n 'font-weight:[[:space:]]*1000' . --include='*.css' || true)
  if [[ -n "$findings" ]]; then
    echo "[ERROR] non-standard font-weight:1000 found"
    echo "$findings"
    status=1
  else
    echo "[OK] CSS: no font-weight:1000 declarations"
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

check_version_alignment
check_csp_hashes
check_rewards_page_metadata
check_css_hygiene
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

check_pwa_root_only_contract() {
  if grep -q "navigator.serviceWorker.register('/sw.js', {" shared.js \
    && grep -q "updateViaCache: 'none'" shared.js \
    && grep -q 'importScripts('\''/app-version.js'\'')' sw.js \
    && grep -q '"start_url": "/"' manifest.json \
    && grep -q '"scope": "/"' manifest.json; then
    echo "[OK] PWA: root-only contract, scope and updateViaCache are aligned"
  else
    echo "[ERROR] PWA: root-only contract, scope or updateViaCache not aligned"
    status=1
  fi
}

check_pwa_cache_headers() {
  if grep -qE '^/sw\.js$' _headers \
    && grep -A1 '^/sw\.js$' _headers | grep -q 'Cache-Control: no-cache' \
    && grep -qE '^/app-version\.js$' _headers \
    && grep -A1 '^/app-version\.js$' _headers | grep -q 'Cache-Control: no-cache'; then
    echo "[OK] PWA: no-cache headers found for sw.js and app-version.js"
  else
    echo "[ERROR] PWA: missing no-cache header for sw.js and/or app-version.js"
    status=1
  fi
}

check_pwa_version_bump_for_precache_changes() {
  local relevant_paths=(
    '*.html'
    '*.css'
    '*.js'
    'js/*.js'
    'json/*.json'
    'assets/*'
    'assets/**/*'
    'icons/*'
    'screenshots/*'
    'manifest.json'
    'robots.txt'
    'sitemap.xml'
  )
  local changed_relevant=""

  subject_quiz_core_comment_only_diff() {
    local diff_text="$1"
    local non_comment=""
    non_comment=$(printf '%s\n' "$diff_text" \
      | grep -E '^[+-]' \
      | grep -vE '^\+\+\+|^---' \
      | grep -vE '^[+-][[:space:]]*$|^[+-][[:space:]]*//' || true)
    [[ -z "$non_comment" ]]
  }

  exempt_comment_only_subject_quiz_core() {
    local changed_list="$1"
    local diff_text="$2"
    local normalized=""
    normalized=$(printf '%s\n' "$changed_list" | sed '/^[[:space:]]*$/d')
    if [[ "$normalized" == "subject-quiz-core.js" ]] && subject_quiz_core_comment_only_diff "$diff_text"; then
      return 0
    fi
    return 1
  }

  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    changed_relevant=$(git diff --name-only -- "${relevant_paths[@]}" || true)

    if [[ -z "$changed_relevant" ]] && git rev-parse --verify HEAD^ >/dev/null 2>&1; then
      changed_relevant=$(git diff --name-only HEAD^ HEAD -- "${relevant_paths[@]}" || true)
      if [[ -n "$changed_relevant" ]]; then
        local committed_core_diff=""
        committed_core_diff=$(git diff --unified=0 --no-color HEAD^ HEAD -- subject-quiz-core.js || true)
        if exempt_comment_only_subject_quiz_core "$changed_relevant" "$committed_core_diff"; then
          changed_relevant=""
        fi
      fi
      if [[ -n "$changed_relevant" ]] && git diff --quiet HEAD^ HEAD -- app-version.js; then
        echo "[ERROR] PWA: asset precache/cache-first changes detected without APP_VERSION bump"
        echo "$changed_relevant"
        status=1
        return
      fi
      echo "[OK] PWA: APP_VERSION bump check passed (HEAD^..HEAD)"
      return
    fi

    if [[ -n "$changed_relevant" ]]; then
      local working_core_diff=""
      working_core_diff=$(git diff --unified=0 --no-color -- subject-quiz-core.js || true)
      if exempt_comment_only_subject_quiz_core "$changed_relevant" "$working_core_diff"; then
        changed_relevant=""
      fi
    fi

    if [[ -n "$changed_relevant" ]] && git diff --quiet -- app-version.js; then
      echo "[ERROR] PWA: asset precache/cache-first changes detected without local APP_VERSION bump"
      echo "$changed_relevant"
      status=1
      return
    fi
  fi

  echo "[OK] PWA: APP_VERSION bump check passed for cache-relevant files"
}

check_core_no_subject_branch() {
  local findings
  findings=$(grep -nE 'config\.subject[[:space:]]*===|cfg\.subject[[:space:]]*===' subject-quiz-core.js \
    | grep -vE '^[0-9]+:[[:space:]]*//' || true)
  if [[ -n "$findings" ]]; then
    echo "[ERROR] subject-quiz-core.js: subject-specific branch detected"
    echo "$findings"
    status=1
  else
    echo "[OK] subject-quiz-core.js: no subject-specific branches"
  fi
}

check_pwa_root_only_contract
check_pwa_cache_headers
check_pwa_version_bump_for_precache_changes

if node scripts/audit_questions_json.js; then
  echo "[OK] question JSON audit passed"
else
  status=1
fi

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

  if grep -qE 'Content-Security-Policy:[[:space:]]+' _headers \
    && grep -qE 'Permissions-Policy:[[:space:]]+' _headers; then
    echo "[OK] _headers: CSP and Permissions-Policy found"
  else
    echo "[ERROR] _headers: missing CSP and/or Permissions-Policy"
    status=1
  fi

  if grep -qE '^/assets/\*$' _headers && grep -qE '^/screenshots/\*$' _headers \
    && grep -qE '^/icons/\*$' _headers \
    && grep -qE 'Cache-Control:[[:space:]]+public, max-age=31536000, immutable' _headers; then
    echo "[OK] _headers: long cache rules found for assets/icons/screenshots"
  else
    echo "[ERROR] _headers: missing long cache rules for /assets/*, /icons/* or /screenshots/*"
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
    "https://lascuolaamica.it/chi-siamo"
    "https://lascuolaamica.it/per-insegnanti"
    "https://lascuolaamica.it/per-genitori"
    "https://lascuolaamica.it/ai-info"
    "https://lascuolaamica.it/supporta"
    "https://lascuolaamica.it/faq"
    "https://lascuolaamica.it/premi"
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

check_core_no_subject_branch

if [[ $status -ne 0 ]]; then
  echo
  echo "Prepublish checks failed."
  exit $status
fi

echo
echo "Prepublish checks passed."
