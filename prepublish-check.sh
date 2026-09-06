#!/usr/bin/env bash
set -euo pipefail

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$BASE_DIR"

status=0
# Tutte le pagine del sito, non una lista da aggiornare a mano: una lista
# hardcoded lascia le pagine nuove fuori dai controlli senza che nessuno se ne
# accorga (stesso pattern gia' usato da scripts/sync_csp_hashes.py).
HTML_FILES=()
while IFS= read -r -d '' f; do HTML_FILES+=("$(basename "$f")"); done \
  < <(find . -maxdepth 1 -name '*.html' -print0 | sort -z)

# Pagine statiche che non dipendono da JS: un <noscript> qui sarebbe decorativo.
NOSCRIPT_EXEMPT=("404.html")

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

  local ns_exempt=0
  local exempt
  for exempt in "${NOSCRIPT_EXEMPT[@]}"; do
    [[ "$file" == "$exempt" ]] && ns_exempt=1
  done
  if [[ "$ns_exempt" -eq 1 ]]; then
    echo "[SKIP] $file: noscript non richiesto (pagina statica)"
  elif grep -qi '<noscript>' "$file"; then
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
  findings=$(find . \
    -path './node_modules' -prune -o \
    -path './.git' -prune -o \
    -path './.lighthouseci' -prune -o \
    -path './export' -prune -o \
    -path './graphify-out' -prune -o \
    -path './docs/graphify-out' -prune -o \
    -type f \( -name '*.js' -o -name '*.html' \) -print0 \
    | xargs -0 grep -nE 'eval\(|new Function\(|document\.write\(|innerHTML[[:space:]]*=|javascript:' || true)
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
    echo "[OK] _headers: inline script+style CSP hashes are aligned"
  else
    echo "[ERROR] _headers: inline script+style CSP hashes are not aligned"
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
  findings=$(find . \
    -path './node_modules' -prune -o \
    -path './.git' -prune -o \
    -type f -name '*.css' -print0 \
    | xargs -0 grep -n 'font-weight:[[:space:]]*1000' || true)
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
  # I due sink di script URL passano da Trusted Types (commit b228ac5): il
  # contratto da verificare e' che gli URL restino /sw.js e /app-version.js alla
  # radice, non la forma letterale della chiamata.
  if grep -qE "navigator\.serviceWorker\.register\((trustedScriptUrl\()?'/sw\.js'" shared.js \
    && grep -q "updateViaCache: 'none'" shared.js \
    && grep -q "importScripts(" sw.js \
    && grep -q "'/app-version.js'" sw.js \
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
    'manifest.json'
    'robots.txt'
    'sitemap.xml'
    ':!scripts/*.js'
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

check_cursor_key_explicit() {
  local missing=""
  local files=(
    "js/matematica-page.js"
    "js/geografia-page.js"
    "js/italiano-page.js"
    "js/scienze-page.js"
    "js/storia-page.js"
    "js/civica-page.js"
    "js/problemi-page.js"
    "js/inglese-page.js"
  )

  local f
  for f in "${files[@]}"; do
    if [[ -f "$f" ]] && ! grep -q "cursorKey:" "$f"; then
      missing+="$f "
    fi
  done

  if [[ -n "$missing" ]]; then
    echo "[ERROR] missing explicit cursorKey in: $missing"
    status=1
  else
    echo "[OK] all subject pages declare cursorKey explicitly"
  fi
}

check_subject_pages_size() {
  local oversized=""
  local files=(
    "js/matematica-page.js"
    "js/geografia-page.js"
    "js/italiano-page.js"
    "js/scienze-page.js"
    "js/storia-page.js"
    "js/civica-page.js"
    "js/problemi-page.js"
    "js/inglese-page.js"
  )

  local f
  for f in "${files[@]}"; do
    if [[ ! -f "$f" ]]; then
      oversized+="$f(missing) "
      continue
    fi
    local lines
    lines=$(wc -l < "$f")
    if [[ "$lines" -ge 250 ]]; then
      oversized+="$f(${lines}) "
    fi
  done

  if [[ -n "$oversized" ]]; then
    echo "[ERROR] subject page size limit exceeded: $oversized"
    status=1
  else
    echo "[OK] all subject pages are under 250 lines"
  fi
}

check_extension_contract_present() {
  local count
  count=$(grep -c "Extension Contract" subject-quiz-core.js || true)
  if [[ "$count" != "1" ]]; then
    echo "[ERROR] subject-quiz-core.js: Extension Contract marker expected once, found $count"
    status=1
  else
    echo "[OK] subject-quiz-core.js: Extension Contract marker present"
  fi
}

# Font e immagini vivono in ASSETS_CACHE_NAME (sw.js), una cache che activate non
# cancella mai, e _headers li marca immutable per un anno. Sostituirne uno
# mantenendo lo stesso nome significa che chi ha gia' visitato il sito non vedra'
# mai il file nuovo: va cambiato il nome del file, oppure alzato il suffisso di
# ASSETS_CACHE_NAME. Un file aggiunto (A) o rimosso (D) non pone il problema.
check_immutable_assets_not_replaced_in_place() {
  local asset_paths=('assets/*' 'assets/**/*' 'icons/*' 'screenshots/*')
  local stable_ext='\.(woff2?|ttf|svg|png|jpe?g|webp|avif|ico)$'
  local replaced="" sw_diff=""

  git rev-parse --is-inside-work-tree >/dev/null 2>&1 || return

  replaced=$(git diff --name-only --diff-filter=M -- "${asset_paths[@]}" | grep -Ei "$stable_ext" || true)
  sw_diff=$(git diff --no-color -- sw.js || true)

  if [[ -z "$replaced" ]] && git rev-parse --verify HEAD^ >/dev/null 2>&1; then
    replaced=$(git diff --name-only --diff-filter=M HEAD^ HEAD -- "${asset_paths[@]}" | grep -Ei "$stable_ext" || true)
    sw_diff=$(git diff --no-color HEAD^ HEAD -- sw.js || true)
  fi

  if [[ -z "$replaced" ]]; then
    echo "[OK] asset immutabili: nessuna sostituzione in place"
    return
  fi

  if printf '%s\n' "$sw_diff" | grep -q '^[+-]const ASSETS_CACHE_NAME'; then
    echo "[OK] asset immutabili sostituiti in place, con bump di ASSETS_CACHE_NAME"
  else
    echo "[ERROR] asset immutabili sostituiti in place senza bump di ASSETS_CACHE_NAME in sw.js"
    echo "$replaced"
    status=1
  fi
}

# Il senso delle cache stabili e' che sopravvivano al bump di versione. Derivarne
# il nome da CACHE_NAME (come faceva REWARDS_CACHE_NAME fino alla 4.12.37) le
# riporta a essere cancellate a ogni release, in silenzio.
check_stable_cache_names_are_literal() {
  if grep -qE "^const ASSETS_CACHE_NAME = '[a-z0-9-]+';$" sw.js \
    && grep -qE "^const REWARDS_CACHE_NAME = '[a-z0-9-]+';$" sw.js; then
    echo "[OK] sw.js: cache stabili con nomi letterali, indipendenti da APP_VERSION"
  else
    echo "[ERROR] sw.js: ASSETS_CACHE_NAME/REWARDS_CACHE_NAME non sono nomi letterali"
    status=1
  fi
}

# npm esegue da solo gli script che portano il nome di un suo hook di lifecycle.
# Lo script si chiamava "prepublish" (nome legacy, deprecato ma ancora attivo su
# npm 11): ogni npm install e ogni npm ci rieseguivano l'intero prepublish-check,
# quindi anche il passo freshness, che riscrive i dateModified dei JSON-LD dai
# timestamp dei file. In CI, dove il checkout da a tutti i file l'mtime di adesso,
# questo sporcava l'albero prima ancora del controllo vero e faceva fallire la
# verifica del bump di APP_VERSION.
check_no_npm_lifecycle_script_names() {
  local reserved=(preinstall install postinstall prepublish prepare)
  local found=""
  local name
  for name in "${reserved[@]}"; do
    if node -e "const s=require('./package.json').scripts||{};process.exit(s['$name']?0:1)"; then
      found="$found $name"
    fi
  done
  if [[ -n "$found" ]]; then
    echo "[ERROR] package.json: script con nome di hook npm (eseguiti a ogni install):$found"
    status=1
  else
    echo "[OK] package.json: nessuno script con nome di hook npm"
  fi
}

check_no_npm_lifecycle_script_names
check_pwa_root_only_contract
check_stable_cache_names_are_literal
check_pwa_cache_headers
check_pwa_version_bump_for_precache_changes
check_immutable_assets_not_replaced_in_place

if node scripts/check_grammar_rules.js; then
  echo "[OK] regole grammaticali: attive e senza falsi positivi"
else
  echo "[ERROR] regole grammaticali: una regola non scatta o produce falsi positivi"
  status=1
fi

if node scripts/check_storage_helpers.js; then
  echo "[OK] storage helpers: le quattro copie sono identiche"
else
  echo "[ERROR] storage helpers: le copie sono divergenti"
  status=1
fi

if node scripts/check_sw_precache.js; then
  echo "[OK] sw.js precache: tutti i path verificati esistono su disco"
else
  status=1
fi

if node scripts/check_update_log.js; then
  echo "[OK] UPDATE_LOG (shared.js) allineato ad APP_VERSION"
else
  status=1
fi

if node scripts/audit_questions_json.js; then
  echo "[OK] question JSON audit passed"
else
  status=1
fi

if node scripts/lint_content.js >/dev/null 2>&1; then
  echo "[OK] content linguistic lint passed"
else
  echo "[ERROR] content linguistic lint failed (run: npm run lint:content)"
  status=1
fi

if node scripts/check_math_explanations.js >/dev/null 2>&1; then
  echo "[OK] math in explanations verified"
else
  echo "[ERROR] wrong arithmetic in an explanation (run: npm run check:math)"
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

if npm run --silent freshness >/dev/null 2>&1; then
  echo "[OK] freshness: sitemap.xml e dateModified JSON-LD rigenerati dai timestamp reali"
else
  echo "[ERROR] freshness: rigenerazione sitemap.xml/JSON-LD fallita (npm run freshness)"
  status=1
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
check_cursor_key_explicit
check_subject_pages_size
check_extension_contract_present

if [[ $status -ne 0 ]]; then
  echo
  echo "Prepublish checks failed."
  exit $status
fi

echo
echo "Prepublish checks passed."
