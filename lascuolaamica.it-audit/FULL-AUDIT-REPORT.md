# SEO Audit — lascuolaamica.it
Date: 2026-07-05
Method: source-level audit (repo = live site source), homepage fetch verified live headers/HTML match.

## Executive Summary

**SEO Health Score: 90/100**

Business type: EdTech / educational content site (free primary-school quiz platform, non-commercial, single-maintainer). Small site (19 indexable pages via sitemap).

This site already carries the results of prior SEO/a11y/security work sessions — the baseline is strong. No critical blockers found.

### Top findings
1. **High** — 5 render-blocking stylesheets loaded serially in `<head>` on every page (tokens.css, index.css/[page].css, fonts.css, utilities.css, rewards.css). No critical-CSS inlining.
2. **Medium** — `civica.html` has visibly thinner FAQ schema (4 Q&A) vs. sibling subject pages (7-8 Q&A) — inconsistent depth across the subject cluster.
3. **Medium** — No live Core Web Vitals field data verified in this pass (no Search Console/CrUX credentials detected) — recommend running `seo-google` once credentials are set up.
4. **Low** — `chi-siamo.html` meta description is 153 chars, closest to Google's ~155-160 truncation edge of any page.
5. **Info** — `supporto-satispay.html` correctly `noindex`'d and intentionally excluded from sitemap.xml — correct handling, not a bug.

### Quick wins
- Consolidate/inline critical CSS for the 5 header stylesheets, or combine into one bundled file per page type.
- Add 3-4 more FAQ Q&As to `civica.html` to match subject-page parity (currently 4 vs 7-8 elsewhere).
- Trim `chi-siamo.html` meta description a few characters for safety margin.

## Technical SEO — Score 92/100
**What works:**
- `robots.txt` clean: `Allow: /`, sensible `Disallow: /json/`, `/reports/`, points to sitemap.
- `sitemap.xml` valid, 19 URLs, correct `lastmod`/`priority`/`changefreq`.
- Every page has a unique, self-referencing canonical.
- Response headers (live-verified): CSP (strict, no `unsafe-inline`), HSTS (`max-age=31536000; includeSubDomains`), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, COOP/CORP, Permissions-Policy locking down camera/mic/geolocation/etc. Served via Cloudflare, HTTPS enforced.
- Service worker (`sw.js`) present for offline/PWA support — consistent with "works offline" claim in copy.

**Findings:**
- **High** — Render-blocking CSS chain (5 stylesheets) in `<head>` before any deferred script; no inline critical CSS. Impacts LCP on first visit (cache/SW mitigates repeat visits).
- **Low** — No `hreflang` — correct, since site is single-language (it-IT) only; flagged as non-issue.

## Content Quality (E-E-A-T) — Score 88/100
**What works:**
- Dedicated `chi-siamo.html` (About) with `Person` + `AboutPage` schema naming the real maintainer (Mattia Boero) — transparent authorship, unusual and positive for a free EdTech site.
- `per-insegnanti.html` / `per-genitori.html` split content by audience (teachers vs parents) — matches real search intent segmentation.
- `accessibilita.html` publishes a real WCAG 2.1 A/AA accessibility statement — trust signal, also ties into the a11y work already logged in project history.
- `privacy.html` / `cookie.html` state plainly "no personal data collected, no profiling cookies" — strong trust/compliance signal for a children's site (COPPA/GDPR-adjacent expectations).
- Each subject page (matematica, inglese, problemi, civica, geografia, storia, scienze, italiano) has unique on-page copy (raw word counts 537-904, before dynamic quiz content loads).

**Findings:**
- **Medium** — `civica.html` FAQ schema has only 4 Q&A vs 7-8 on every other subject page — thinner structured content, may under-perform siblings for FAQ rich results.
- **Info** — Quiz content itself (9,879 questions per llms.txt) is loaded dynamically via JS/JSON, not present in static HTML — acceptable for an interactive app, but means crawlers relying on raw HTML (not renderers) see only the shell text. Googlebot renders JS so this is low risk; flagged for awareness only.

## On-Page SEO — Score 90/100
**What works:**
- All 19 pages: unique `<title>`, unique meta description, single `<h1>`, self-canonical — zero duplicates found.
- Meta descriptions well-sized (68-153 chars); `supporto-satispay.html` short at 68 chars but that page is intentionally noindexed.
- Home page has 37 internal links — healthy internal linking for a site this size.

**Findings:**
- **Low** — `chi-siamo.html` description at 153 chars sits close to typical truncation threshold; trim by ~10-15 chars for safety.

## Schema & Structured Data — Score 95/100
**What works:**
- Rich, varied, valid JSON-LD across the site: `WebSite`, `Organization`/`EducationalOrganization`, `Person`, `AboutPage`, `CollectionPage`, `ItemList`, `BreadcrumbList` on every page, and `FAQPage`/`Question`/`Answer` on all 8 subject pages + faq.html.
- `EducationalAudience` markup on subject pages — correctly signals target grade level (2ª-5ª primaria) to search engines, a schema type most competitors skip.
- `faq.html` alone carries 25 Question/Answer pairs.

**Findings:**
- **Medium** (see Content section) — `civica.html` FAQPage depth (4) inconsistent with sibling pages (7-8); bring to parity for uniform rich-result eligibility.

## Performance — Score 80/100 (estimated, no live CWV field data)
**What works:**
- Fonts preloaded (`fredoka` 700, `nunito` regular) with `font-display: swap` on all `@font-face` rules — prevents invisible-text flash.
- All page scripts use `defer` — no render-blocking JS.
- OG/social preview images are reasonably sized (43-80 KB per 1200x630 JPEG) — not bloated.

**Findings:**
- **High** — 5 separate render-blocking stylesheet requests per page before first paint; no bundling/inlining of critical CSS.
- **Info** — No CrUX/GSC/PageSpeed API credentials detected in this environment; this score is a lab-style estimate from static analysis, not live field data. Recommend running `seo-google` once Search Console access is configured to replace this estimate with real LCP/INP/CLS.

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
This audit was performed by reading the site's own source repository (the audited domain is this project's own live deployment) plus one live HTTP fetch to confirm headers/HTML match production. This is more reliable than a blind crawl and let every page be checked, not just a sample. No Lighthouse/CrUX/GSC/Moz/DataForSEO credentials were available in this environment, so Performance and Backlinks are estimated/qualitative rather than measured — flagged above wherever that applies.
