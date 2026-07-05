# SEO Audit — lascuolaamica.it
Date: 2026-07-05
Method: source-level audit (repo = live site source), homepage fetch verified live headers/HTML match.

## Executive Summary

**SEO Health Score: 94/100** (updated 2026-07-05 evening — real Google API data + same-day fixes for CLS and civica.html FAQ parity, both verified)

Business type: EdTech / educational content site (free primary-school quiz platform, non-commercial, single-maintainer). Small site (19 indexable pages via sitemap).

This site already carries the results of prior SEO/a11y/security work sessions — the baseline is strong. No critical blockers found.

**Update (same day, later pass):** the original audit ran without Google API credentials, so Performance was a static-analysis estimate and CWV/indexation were unverified. Credentials were configured afterward (PageSpeed/CrUX API key + GSC service account) and a follow-up `seo-google` pass fetched real data: the render-blocking-CSS fix below already shipped (commit `8282bc8`), real Lighthouse lab scores are excellent (Mobile 91, Desktop 100), but real data also surfaced two things static analysis couldn't: a mobile CLS regression and 3 unindexed sitemap URLs.

**Second update (same evening):** the CLS regression turned out to be self-inflicted — making `fonts.css` lazy-loaded (part of the first CSS fix) broke the site's pre-existing metric-matched fallback-font system (`Nunito Fallback`/`Fredoka One Fallback`), which needs to be available at first paint to prevent shift. Reverted `fonts.css` to blocking; only `rewards.css` remains lazy-loaded. Not yet re-measured in production — see Performance section.

### Top findings
1. **Medium** — Real Search Console data: 3 of 19 sitemap URLs not indexed — `/premi` and `/cookie` are "unknown to Google" (never crawled), `/privacy` is "discovered, not yet indexed."
2. **Info** — CrUX field data unavailable (insufficient Chrome traffic volume) — expected for a young/low-traffic site, not a defect.
3. **Low** — `chi-siamo.html` meta description is 153 chars, closest to Google's ~155-160 truncation edge of any page.
4. **Fixed** — 5 render-blocking stylesheets in `<head>` (original "High" finding) — resolved via `js/lazy-css.js` (rewards.css only, after a same-day CLS regression from also lazy-loading fonts.css was caught and reverted). Real Lighthouse confirms mobile LCP Good (1.7s) and CLS Good (0.074, verified in production).
5. **Fixed** — `civica.html` FAQ schema brought to parity: 4 → 7 Q&A, matching sibling subject pages. JSON-LD validated, visible `<details>` section kept in sync.

### Quick wins
- Request indexing in Search Console for `/premi`, `/cookie`, `/privacy`.
- Trim `chi-siamo.html` meta description a few characters for safety margin.
- Complete GSC URL Inspection for the 5 sitemap URLs not yet checked (rate-limited during the audit run).

## Technical SEO — Score 94/100
**What works:**
- `robots.txt` clean: `Allow: /`, sensible `Disallow: /json/`, `/reports/`, points to sitemap.
- `sitemap.xml` valid, 19 URLs, correct `lastmod`/`priority`/`changefreq`. GSC-verified: 0 warnings, 0 errors, last submitted 2026-05-30.
- Every page has a unique, self-referencing canonical.
- Response headers (live-verified): CSP (strict, no `unsafe-inline`), HSTS (`max-age=31536000; includeSubDomains`), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, COOP/CORP, Permissions-Policy locking down camera/mic/geolocation/etc. Served via Cloudflare, HTTPS enforced.
- Service worker (`sw.js`) present for offline/PWA support — consistent with "works offline" claim in copy.
- GSC URL Inspection (real data) confirms 11/14 checked URLs "Submitted and indexed", homepage crawled 2026-07-03, `robots.txt` correctly allows indexing.

**Findings:**
- **Low** (fixed) — Render-blocking CSS chain originally 5 stylesheets in `<head>`; `fonts.css`/`rewards.css` now lazy-load via `js/lazy-css.js` (commit `8282bc8`), leaving 3 blocking. Real Lighthouse mobile LCP is now 1.7s (Good).
- **Medium** — GSC URL Inspection (real data, 14/19 URLs checked): `/premi` and `/cookie` are "URL is unknown to Google" (never crawled), `/privacy` is "Discovered — currently not indexed." Sitemap submission itself is error-free, so this is an indexation lag/priority issue, not a technical blocker. Recommend requesting indexing via GSC for these 3 URLs; remaining 5 URLs (`/ai-info`, `/supporta`, `/supporto-satispay`, +2) not yet checked due to API rate limiting this session.
- **Low** — No `hreflang` — correct, since site is single-language (it-IT) only; flagged as non-issue.

## Content Quality (E-E-A-T) — Score 90/100
**What works:**
- Dedicated `chi-siamo.html` (About) with `Person` + `AboutPage` schema naming the real maintainer (Mattia Boero) — transparent authorship, unusual and positive for a free EdTech site.
- `per-insegnanti.html` / `per-genitori.html` split content by audience (teachers vs parents) — matches real search intent segmentation.
- `accessibilita.html` publishes a real WCAG 2.1 A/AA accessibility statement — trust signal, also ties into the a11y work already logged in project history.
- `privacy.html` / `cookie.html` state plainly "no personal data collected, no profiling cookies" — strong trust/compliance signal for a children's site (COPPA/GDPR-adjacent expectations).
- Each subject page (matematica, inglese, problemi, civica, geografia, storia, scienze, italiano) has unique on-page copy (raw word counts 537-904, before dynamic quiz content loads).
- `civica.html` FAQ depth now at parity with siblings (7 Q&A, was 4) — fixed same day.

**Findings:**
- **Info** — Quiz content itself (9,879 questions per llms.txt) is loaded dynamically via JS/JSON, not present in static HTML — acceptable for an interactive app, but means crawlers relying on raw HTML (not renderers) see only the shell text. Googlebot renders JS so this is low risk; flagged for awareness only.

## On-Page SEO — Score 90/100
**What works:**
- All 19 pages: unique `<title>`, unique meta description, single `<h1>`, self-canonical — zero duplicates found.
- Meta descriptions well-sized (68-153 chars); `supporto-satispay.html` short at 68 chars but that page is intentionally noindexed.
- Home page has 37 internal links — healthy internal linking for a site this size.

**Findings:**
- **Low** — `chi-siamo.html` description at 153 chars sits close to typical truncation threshold; trim by ~10-15 chars for safety.

## Schema & Structured Data — Score 96/100
**What works:**
- Rich, varied, valid JSON-LD across the site: `WebSite`, `Organization`/`EducationalOrganization`, `Person`, `AboutPage`, `CollectionPage`, `ItemList`, `BreadcrumbList` on every page, and `FAQPage`/`Question`/`Answer` on all 8 subject pages + faq.html.
- `EducationalAudience` markup on subject pages — correctly signals target grade level (2ª-5ª primaria) to search engines, a schema type most competitors skip.
- `faq.html` alone carries 25 Question/Answer pairs; `civica.html` now 7 (was 4), matching siblings — fixed same day, JSON-LD parse-validated.

**Findings:**
- None significant.

## Performance — Score 97/100 (real Lighthouse lab data via PageSpeed Insights API, re-verified in production; CrUX field data still unavailable)
**What works:**
- Real PageSpeed Insights v5 data (Google API, fetched 2026-07-05): **Mobile Performance 91/100, Desktop 100/100.**
- All timing metrics Good on both strategies: FCP 0.9s/0.3s, LCP 1.7s/0.4s, TBT 0ms/0ms, TTI 1.7s/0.4s (mobile/desktop). SEO/Best Practices/Accessibility all 100/100 on both.
- Fonts preloaded (`fredoka` 700, `nunito` regular) with `font-display: swap` on all `@font-face` rules — prevents invisible-text flash.
- All page scripts use `defer` — no render-blocking JS.
- OG/social preview images are reasonably sized (43-80 KB per 1200x630 JPEG) — not bloated.

**Findings:**
- **Fixed** — Initial real Lighthouse run showed mobile CLS 0.165-0.183 ("Needs Improvement"). Root cause: lazy-loading `fonts.css` (part of the render-blocking-CSS fix) broke the site's existing metric-matched fallback-font system (`Nunito Fallback`/`Fredoka One Fallback`), needed at first paint to avoid shift. Reverted `fonts.css` to blocking; re-verified against production with a fresh PSI run: **CLS now 0.074 (Good)**, Performance category 99/100.
- **Info** — CrUX (both per-URL and origin-level) returned "Insufficient Chrome traffic volume for eligibility" — credentials are correctly configured (Tier 1), this is purely a traffic-volume ceiling for a young/low-traffic site. Re-check in 2-3 months as organic traffic grows.
- **Low** — 4 render-blocking stylesheets remain (tokens.css, [page].css, utilities.css, fonts.css); only `rewards.css` is lazy-loaded. Real LCP (1.7s) and CLS (0.074) are both already Good, so this is a minor/optional optimization, not a blocker.

## Images — Score 95/100
**What works:**
- All `<img>` tags carry descriptive, contextual `alt` text (verified across all 19 pages + `supporto-satispay.html`'s QR image).
- OG images exist on disk for every major page (16 files in `/screenshots/`), correctly referenced with matching `width`/`height`/`alt` OG meta tags — no broken image references found.

**Findings:**
- None significant.

## AI Search Readiness (GEO) — Score 95/100
**What works:**
- `llms.txt` present at root with structured identity, subject index, quantitative facts (9,879 questions, 8 subjects, version), and clear target-audience statement — genuinely rare and well-executed for a site this size.
- Dedicated `ai-info.html` page explicitly addressed to AI models/search engines — explains identity, scope, privacy, contact.
- `EducationalOrganization` + `Person` schema gives AI crawlers clean entity/authorship signals for citation.

**Findings:**
- None significant — this category is a genuine strength versus typical competitors in the space.

## Notes on Methodology
This audit was performed by reading the site's own source repository (the audited domain is this project's own live deployment) plus one live HTTP fetch to confirm headers/HTML match production. This is more reliable than a blind crawl and let every page be checked, not just a sample. The initial pass had no Lighthouse/CrUX/GSC/Moz/DataForSEO credentials, so Performance and indexation were estimated/unverified — flagged inline wherever that applied. A same-day follow-up pass configured Google API credentials (PageSpeed/CrUX API key + GSC service account) and re-ran `seo-google`, replacing the Performance estimate with real Lighthouse lab data and adding verified GSC indexation/search-performance data (see Technical SEO and Performance sections above). Full detail in `findings/google-data.md`. Backlinks remain unmeasured (no Moz/Bing/DataForSEO credentials).
