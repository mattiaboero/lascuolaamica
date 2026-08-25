# Technical SEO Audit — lascuolaamica.it

Date: 2026-08-25
Scope: Live production site (Cloudflare Pages), 20-URL sitemap, static HTML/CSS/vanilla JS/JSON PWA.
Sitemap validation detail: see `sitemap.md` (score 98/100, not repeated here).

## Technical Score: 93/100

## Category Breakdown

| Category | Status | Score |
|---|---|---|
| Crawlability | pass | 96/100 |
| Indexability | pass | 98/100 |
| Security | pass | 99/100 |
| URL Structure | pass | 100/100 |
| Mobile | pass | 92/100 |
| Core Web Vitals | pass (warn on mobile CLS) | 88/100 |
| Structured Data | pass | 95/100 |
| JS Rendering | pass | 100/100 |
| IndexNow | fail (not implemented) | 0/100 |

Weighted score reflects that IndexNow is a minor/optional protocol (Bing/Yandex/Naver only, no Google impact) — its absence pulls the average down but is Low priority, not a blocker.

---

## 1. Crawlability — PASS (96/100)

**What works:**
- `robots.txt` (200, `text/plain`) present, valid, correctly disallows only non-content paths: `/json/`, `/reports/`, `/questions-build-report.json` — none of which are in the sitemap or user-facing.
- `Sitemap:` directive present in robots.txt, points to the correct URL.
- No blocking of CSS/JS — Googlebot can fully render the page.
- Content is 100% present in raw server-rendered HTML (see JS Rendering section) — no crawl budget cost from client-side rendering.
- Custom 404 page returns real HTTP 404 (verified) with `<meta name="robots" content="noindex, follow">` — correct, avoids soft-404 and index bloat.
- AI crawler stance is `User-agent: * / Allow: /` — no AI-specific blocks (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, etc. all allowed). This is consistent with the site's own `/ai-info` page (verified live, 200, titled "Informazioni per AI e motori di ricerca") which is explicitly written to be consumed by LLMs/answer engines — the open-crawl policy is a deliberate GEO choice, not an oversight. No change recommended.
- `llms.txt` exists at root (verified 200) — ahead of most sites on the emerging LLM-discovery convention.

**Findings:**
| Severity | Finding | Recommendation |
|---|---|---|
| Low | No explicit rate/crawl-delay or AI-training-specific rules (`GPTBot`, `Google-Extended`) in robots.txt | Optional only. Current "allow all" is defensible given the `/ai-info` + `llms.txt` strategy (site wants AI visibility). No action needed unless a training-opt-out policy decision is made later. |

---

## 2. Indexability — PASS (98/100)

**What works:**
- Self-referencing canonical on every page checked (`/`, `/matematica`, `/breakout`): matches served URL exactly, no trailing slash, no query string.
- `<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">` on indexable pages — correctly maximizes snippet/preview eligibility.
- No conflicting noindex/canonical pairs found.
- No parameter URLs, no www/non-www duplication (www redirects 301 → apex, single hop).
- No duplicate/thin-content risk detected across the 8 subject pages (each has distinct title/description/canonical).
- 20/20 sitemap URLs return 200 live (confirmed in `sitemap.md`).

**Findings:**
None blocking. No High/Critical indexability issues found.

---

## 3. Security — PASS (99/100)

**Confirmed still strong, as flagged in the brief — no regressions found:**
- HTTPS enforced: `http://` → 301 → `https://` (single hop, verified).
- HSTS: `strict-transport-security: max-age=31536000; includeSubDomains; preload` present on every response checked (home, robots.txt, sitemap.xml).
- HSTS preload submission: confirmed live via `hstspreload.org` API — `status: "pending"`. This is expected today (submitted 2026-08-25) and not a bug.
- CSP: strict allowlist (`default-src 'self'`, `script-src 'self'`, no `unsafe-inline`/`unsafe-eval`), `require-trusted-types-for 'script'`, `frame-ancestors 'none'`, `upgrade-insecure-requests`.
- `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Resource-Policy: same-origin`, `Permissions-Policy` locking down camera/mic/geolocation/payment/usb/serial/sensors.
- No mixed content: zero `http://` sub-resource references found in homepage HTML.

**CSP/Trusted Types Service Worker fix — verified live (see also console section below):**
- Loaded `https://lascuolaamica.it/` in a fresh headless Chromium session (Playwright), waited for network idle + 3s settle.
- `navigator.serviceWorker.getRegistration()` → `{registered: true, scope: "https://lascuolaamica.it/", active: "activated", waiting: false, installing: false}`.
- **Confirmed: the SW registers and activates successfully post-fix (v4.12.31). The 2026-07-16 regression is resolved.**
- `shared.js` (line ~1012) registers via a `trustedScriptUrl()` wrapper before calling `navigator.serviceWorker.register()`, consistent with `require-trusted-types-for 'script'`.

**Findings:**
| Severity | Finding | Recommendation |
|---|---|---|
| Low | One CSP `script-src` console violation was observed during the live browser test — but it is **not** the SW/Trusted Types bug. It is Cloudflare's own auto-injected inline bot-management/challenge-platform bootstrap script (`cdn-cgi/challenge-platform/scripts/jsd/main.js` loader), blocked because it's inline and the CSP has no `unsafe-inline`/hash/nonce for it. This is injected by the Cloudflare edge, not the origin app. | Cosmetic only — doesn't affect users or SEO. If it should be silenced: either add the specific hash Chrome reports (`sha256-RlaRCwl1nGZo41kne5gZX0gCqoBAStIZqVkFMR9jkD4=`) to `script-src`, or check Cloudflare dashboard for "Browser Integrity Check"/bot-management script injection settings. Not worth spending effort on unless it starts breaking a real feature. |

---

## 4. URL Structure — PASS (100/100)

- Clean, hyphen-free single-word slugs (`/matematica`, `/per-insegnanti`, `/chi-siamo`) — descriptive, lowercase, no query params for content.
- Flat hierarchy (all content one level deep from root) — well within 3-click depth.
- Redirects: verified single-hop only in every case tested — `http→https` (301), `www→non-www` (301), trailing-slash→no-slash (308). No chains.
- Trailing slash usage is consistent: canonical form has no trailing slash on subpages, homepage is `/`.
- All URLs well under the 100-character flag threshold.

No findings.

---

## 5. Mobile — PASS (92/100)

**What works:**
- `<meta name="viewport" content="width=device-width, initial-scale=1.0">` present and correct.
- Responsive CSS: `clamp()` for fluid typography, CSS grid with `repeat(auto-fit, minmax(...))` for card layout, dedicated `@media (max-width: 900px)` and `@media (max-width: 640px)` breakpoints collapsing to 2-column then 1-column.
- Footer nav links use `min-width:44px; min-height:44px` (meets the 44-48px touch-target guidance).
- Base font stack via Nunito, body text sized well above 16px in the rendered CSS.
- `mobile-web-app-capable` meta + manifest.json (`display: standalone`) present for installable PWA behavior.
- Lighthouse "Accessibility" score: 100/100 (mobile PSI run).

**Findings:**
| Severity | Finding | Recommendation |
|---|---|---|
| Low | `apple-mobile-web-app-capable` meta tag is missing (only the non-prefixed `mobile-web-app-capable` and `apple-mobile-web-app-status-bar-style` are present) | Add `<meta name="apple-mobile-web-app-capable" content="yes">` alongside the existing tags for full standalone-mode support on older iOS Safari versions. One-line fix, cosmetic. |

---

## 6. Core Web Vitals — PASS, one WARN (88/100)

No CrUX field data is available (`"No CrUX data for this origin. The site likely has insufficient Chrome traffic volume for eligibility."`) — expected for a low-traffic site, per the skill's error-handling guidance. Lab data via PageSpeed Insights API (Lighthouse) used as proxy for `/`:

| Metric | Mobile (lab) | Desktop (lab) | Threshold | Status |
|---|---|---|---|---|
| LCP | 1.5s | 0.4s | Good <2.5s | Good |
| CLS | **0.105** | 0.048 | Good <0.1 | **Mobile: Needs Improvement** (just over threshold) / Desktop: Good |
| TBT (proxy for INP, no field INP data) | 0ms | 20ms | — | Good |
| FCP | 1.1s | 0.3s | — | Good |
| Lighthouse Performance | 97/100 | 100/100 | — | Good |
| Page weight | 158 KiB | 174 KiB | — | Good, lightweight |

**Findings:**
| Severity | Finding | Recommendation |
|---|---|---|
| Medium | Mobile CLS = 0.105, just over the 0.1 "Good" threshold (3 layout shifts detected in the Lighthouse trace vs. 2 on desktop, where CLS is 0.048). Font-swap CLS is already well-mitigated (size-adjusted local fallback `@font-face` for both Fredoka One and Nunito are present in `fonts.css`), so the residual shift likely comes from elsewhere on mobile viewport — candidates: (a) `js/lazy-css.js` appending `rewards.css` after load, shifting badge/reward UI in; (b) CSS entrance animations (`bounceIn`, `mascotHomeIn`) interacting with the responsive grid reflow at narrow viewports. | Re-run Lighthouse locally with the Performance panel's "Layout Shift" trace open (or `chrome://tracing`) on a mobile emulation to get the exact shifting element (the PSI script used here doesn't expose per-shift element attribution). Reserve space (min-height/aspect-ratio) for whatever renders late. Low effort once the specific element is identified — not urgent, still "Needs Improvement" not "Poor". |

INP has no field or reliable lab equivalent (TBT is a rough proxy only) — cannot be fully assessed without real-user data; flag as "insufficient data" rather than a gap.

---

## 7. Structured Data — PASS (95/100)

**What works:**
- JSON-LD present on every page checked, valid syntax, `@graph` pattern used correctly on homepage: `WebSite`, `CollectionPage`, `ItemList` (8 subjects), `EducationalOrganization` (with `founder` Person entity) — all correctly cross-referenced via `@id`.
- `/faq` page: 3 separate JSON-LD blocks (likely `FAQPage` + breadcrumb + organization — consistent with page purpose).
- `/breakout` page: 3 JSON-LD blocks present (game/software + breadcrumb pattern).
- All structured data is present in the **initial server-rendered HTML** (not JS-injected) — fully compliant with the Dec-2025 Google JS-SEO guidance on structured-data timing.

**Findings:**
| Severity | Finding | Recommendation |
|---|---|---|
| Low | Not independently re-validated against Google's Rich Results Test in this pass (out of scope — full schema validation belongs to the `seo-schema` sub-skill per the skill's cross-reference guidance) | Run the `seo-schema` skill for type-by-type validation if rich-result eligibility needs confirming. |

---

## 8. JavaScript Rendering — PASS (100/100)

- `render_page.py --mode auto` did a **raw fetch and did not trigger Playwright** — confirms `is_spa: False`. All critical content (title, meta description, canonical, robots meta, H1, JSON-LD, subject cards) is present in the first-byte HTML response, no client-side rendering dependency for indexing.
- `<noscript>` fallback present with its own stylesheet (`noscript.css`) and a visible message — degrades gracefully with JS disabled.
- Confirms this is genuinely static HTML/vanilla JS as described, not a CSR framework — best-case scenario for crawlability, zero JS-rendering risk for Googlebot.

No findings.

---

## 9. IndexNow Protocol — FAIL / NOT IMPLEMENTED (0/100)

- No IndexNow key file found (checked `/indexnow.txt` and common patterns — 404).
- No `indexnow` references in `robots.txt`.
- No IndexNow submission code found anywhere in the source repo (`grep -ri indexnow` across the whole working tree returned nothing).

**Findings:**
| Severity | Finding | Recommendation |
|---|---|---|
| Low | IndexNow not implemented — Bing, Yandex, and Naver won't get push-based instant-index signals; they'll rely on regular crawl schedules instead. | Optional, not urgent (no Google impact — Google doesn't use IndexNow). Since the site already has a Cloudflare Pages deploy hook and a `generate_sitemap.py` build step, the lazy add is a 5-line POST to `https://api.indexnow.org/indexnow` with a generated key file at `/<key>.txt`, fired from the same deploy script that regenerates the sitemap — reuse that existing hook rather than building new infrastructure. |

---

## Critical Issues (fix immediately)
None found.

## High Priority (fix within 1 week)
None found.

## Medium Priority (fix within 1 month)
1. **Mobile CLS 0.105 (Needs Improvement, just over the 0.1 Good threshold)** — identify the exact shifting element via a local Lighthouse trace with element attribution (candidates: `lazy-css.js`-loaded `rewards.css`, or entrance animations at narrow viewports); reserve space for it. See Core Web Vitals section.

## Low Priority (backlog)
1. IndexNow not implemented — add a lightweight push notification to Bing/Yandex/Naver on deploy, reusing the existing sitemap-generation deploy hook.
2. Add `apple-mobile-web-app-capable` meta tag alongside the existing PWA meta tags (one line).
3. Cloudflare's auto-injected bot-management inline script trips one CSP `script-src` console warning — cosmetic, only worth fixing if it starts breaking a real feature (add its hash to CSP, or check Cloudflare dashboard bot-management injection settings).
4. Consider explicit AI-crawler-specific robots.txt rules only if a training opt-out policy decision is made — current "allow all" is a deliberate, defensible choice given the `/ai-info` + `llms.txt` GEO strategy already in place.

---

## Confirmed: SW / CSP Trusted Types fix (v4.12.31) is holding

Live test via headless Chromium (Playwright), fresh session, `https://lascuolaamica.it/`:
- `navigator.serviceWorker.getRegistration()` → registered, scope `/`, **active state: `activated`**, nothing stuck in `installing`/`waiting`.
- Zero console errors related to Trusted Types or Service Worker registration.
- One unrelated CSP console warning from a Cloudflare-injected inline script (see Security section) — not a regression of the fixed bug, and pre-existing behavior of Cloudflare's own bot-management injection under a strict `script-src 'self'` CSP.

**The 2026-07-16 regression is resolved and verified live.**
