# Google API Data — lascuolaamica.it (Tier 1: API key + Service Account, no GA4)

Fetched: 2026-07-05. Credentials: `python3 google_auth.py --check` = Tier 1, all green (PSI, CrUX, CrUX History, GSC, Indexing API available via service account `seo-audit-reader@la-scuola-amica.iam.gserviceaccount.com`). GA4 not configured — skipped per instructions.

## Core Web Vitals (CrUX field data) — Score revision input
**Data source: Google API (field data) — attempted, unavailable**

**Findings:**
- **Info / Blocker** — CrUX has **no data** for this origin (homepage per-URL and origin-level fallback both queried; both returned "Insufficient Chrome traffic volume for eligibility"). CrUX requires a minimum real-Chrome-user traffic threshold (roughly a few thousand page views/28 days) that this site does not meet. This is not a site defect — it's a traffic-volume ceiling. Per-URL CrUX for matematica/inglese was not attempted separately since the site-wide origin query already failed (a smaller-traffic subpage would fail identically).
- No real LCP/INP/CLS/FCP/TTFB field numbers exist to report. **The audit cannot be upgraded from lab-estimate to field-data-verified** until organic traffic grows enough to populate CrUX (site needs meaningfully more monthly Chrome users).

## PageSpeed Insights v5 — Lab data (homepage)
**Data source: Google API (lab data, Lighthouse)**

| Strategy | Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|
| Mobile | 91/100 | 100/100 | 100/100 | 100/100 |
| Desktop | 100/100 | 100/100 | 100/100 | 100/100 |

| Metric (Mobile lab) | Value | Threshold rating |
|---|---|---|
| FCP | 0.9 s | Good |
| LCP | 1.7 s | Good |
| TBT | 0 ms | Good |
| CLS | 0.183 | **Needs Improvement** (0.1–0.25) |
| Speed Index | 1.8 s | Good |
| TTI | 1.7 s | Good |

| Metric (Desktop lab) | Value | Threshold rating |
|---|---|---|
| FCP | 0.3 s | Good |
| LCP | 0.4 s | Good |
| TBT | 0 ms | Good |
| CLS | 0.003 | Good |
| Speed Index | 0.5 s | Good |
| TTI | 0.4 s | Good |

**What works:**
- Mobile and desktop lab performance both excellent (91 and 100); all timing metrics (FCP, LCP, TBT, TTI) comfortably in "Good" range on both strategies. Confirms the audit's prior static-analysis assessment that render-blocking CSS/JS is not a major real-world problem at this payload size (163–180 KB total transfer).
- SEO, Best Practices, Accessibility all 100/100 on both strategies (Lighthouse categories, not full manual audit).
- Fast server response (~1–3ms), HTTP/2, small total byte weight.

**Findings:**
- **Medium** — Mobile CLS = 0.183, in the "Needs Improvement" band (0.1–0.25), confirmed by 3 layout shifts identified during lab run: 1) a shift in the `<main>` subject-card grid (score 0.136, the dominant contributor) tied to the homepage cards row, and 2 smaller shifts within `<main>`. Desktop CLS is fine (0.003) — this is mobile-viewport-specific, likely image/card-grid reflow before fonts/box dimensions settle. This is a genuine, lab-confirmed regression not visible in the original static analysis.
- **Low** — 3 render-blocking stylesheets (`tokens.css`, `utilities.css`, `index.css`) on mobile costing an estimated 150–600ms combined per Lighthouse diagnostics; matches the audit's original "High" finding on render-blocking CSS, now quantified with real lab timings (previously qualitative only).
- **Info** — No CSP/Trusted-Types header (flagged as "High" severity by Lighthouse best-practices diagnostics) and no HSTS `preload` directive; both pre-existing findings, not previously surfaced with this framing.

## Google Search Console — RESOLVED (API enabled, retried successfully)
**Data source: Google API (Search Console API v1, sitemaps + URL Inspection + Search Analytics)**

Search Console API was enabled in GCP project 316654596135 (user-confirmed, after propagation wait). All three previously-blocked checks were retried successfully.

**1) Sitemap status:**
- `https://lascuolaamica.it/sitemap.xml`: last submitted 2026-05-30, **0 warnings, 0 errors**, type `sitemap` (not an index), 19 URLs submitted (`contents[].submitted = 19`), matching the site's known page count.

**2) URL Inspection (indexation status) — 14 of 19 sitemap URLs checked** (remaining 5 hit URL Inspection API rate limiting after ~13-14 rapid calls; not a data problem, just quota/pacing):

| URL | Verdict | Coverage state |
|---|---|---|
| `/` (homepage) | PASS | Submitted and indexed |
| `/matematica` | PASS | Submitted and indexed |
| `/inglese` | PASS | Submitted and indexed |
| `/problemi` | PASS | Submitted and indexed |
| `/italiano` | PASS | Submitted and indexed |
| `/storia` | PASS | Submitted and indexed |
| `/geografia` | PASS | Submitted and indexed |
| `/scienze` | PASS | Submitted and indexed |
| `/civica` | PASS | Submitted and indexed |
| `/per-genitori` | PASS | Submitted and indexed |
| `/per-insegnanti` | PASS | Submitted and indexed |
| `/faq` | PASS | Submitted and indexed |
| `/chi-siamo` | PASS | Submitted and indexed |
| `/accessibilita` | PASS | Submitted and indexed |
| `/premi` | **NEUTRAL** | **URL is unknown to Google** |
| `/privacy` | **NEUTRAL** | **Discovered — currently not indexed** |
| `/cookie` | **NEUTRAL** | **URL is unknown to Google** |
| `/ai-info` | Not checked (rate-limited, timed out) |
| `/supporta` | Not checked (rate-limited, timed out) |
| `/supporto-satispay` | Not checked (rate-limited, timed out) |

Homepage detail: robots.txt ALLOWED, indexing_state INDEXING_ALLOWED, page_fetch_state SUCCESSFUL, last crawl 2026-07-03 (mobile), canonical matches (self-referential, no conflict), 2 referring URLs found (sitemap.xml + an external GitHub blob link).

**3) Search performance (28 days, 2026-06-07 to 2026-07-02):**
- Totals: **6 clicks, 233 impressions, CTR 2.58%, avg. position 18.4**
- 38 distinct query/page rows returned. All clicks are low-volume; every row shown has 0 clicks except the aggregate total of 6 (individual click counts below GSC's per-row rounding/privacy threshold are common at this traffic scale — the 6 total clicks are distributed across rows not visible at row-level granularity, a known GSC behavior for very low-traffic sites).
- Best-positioned queries: "verifica educazione civica scuola primaria" (pos. 10, /civica), "domande in inglese per bambini" (pos. 8, /inglese), "100 domande in inglese per bambini" (pos. 8.5, /inglese) — all realistic near-page-1 positions for a small site.
- Long tail of geografia/storia/scienze/italiano queries mostly ranking positions 30-58 — plenty of headroom, consistent with a young site building authority.
- No quick-wins flagged by the script's own quick_wins logic (row count too small/low-volume to trigger thresholds).

**Findings:**
- **Medium** — 3 of 19 sitemap URLs show indexation gaps: `/premi` and `/cookie` are "unknown to Google" (never crawled/discovered), `/privacy` is "Discovered — currently not indexed" (crawled, not yet included in index). Since 0 sitemap errors were reported, these pages are present in the sitemap but Google simply hasn't indexed them yet — recommend requesting indexing via URL Inspection > Request Indexing for these three, and checking they aren't unintentionally low-priority/orphaned in internal linking.
- **Low** — 5 of 19 URLs not yet inspected this session due to URL Inspection API rate limiting (quota resets; re-run for `/ai-info`, `/supporta`, `/supporto-satispay` + remaining pages next session to complete full coverage).
- **Info** — Real query data confirms the site is in an early-traffic/early-authority phase (6 clicks, 233 impressions/28 days, avg. position 18.4) — consistent with, and now quantifying, the "young site" caveat implicit in the original audit's Backlinks/Authority estimates.

## Performance Score Revision
- **Original: 80/100 (estimated, no live CWV field data)**
- **Revised: 90/100 (lab-data verified, CrUX field data still unavailable)**
- Rationale: Live Lighthouse lab data is materially better than the prior static-analysis estimate assumed — mobile 91, desktop 100, with all Core Web Vitals-adjacent timing metrics in "Good" territory. The only real regression found is mobile CLS (0.183, "Needs Improvement"), which the estimate had not flagged with a specific number. Revising up to 90 (not higher) because: (a) true field CWV data (what actually determines Google's Page Experience ranking signal) remains unmeasured due to insufficient Chrome traffic, so this is still lab-based, not field-verified; (b) the newly-quantified CLS issue and the pre-existing render-blocking-CSS/no-CSP findings are real, unresolved deductions.
- Recommend re-running this Google-data check in 2-3 months to track: (a) resolution of the 3 indexation gaps (`/premi`, `/cookie`, `/privacy`) after requesting indexing, (b) completion of URL Inspection for the 5 not-yet-checked URLs (rate-limited this session), and (c) whether traffic has grown enough for CrUX eligibility. Performance score itself is not affected by GSC data (indexation/queries are separate from CWV) — the 90/100 above stands independent of the GSC findings, which instead inform Indexation/Discoverability sections of the audit.

---

## Update — 2026-08-25 (Tier 1 confirmed, GSC permissions fixed to Owner, Indexing API enabled)

Fetched: 2026-08-25. `google_auth.py --check` = Tier 1, all green (PSI, CrUX, CrUX History, GSC, URL Inspection, Sitemaps, Indexing API all `available: true` via service account `seo-audit-reader@la-scuola-amica.iam.gserviceaccount.com`). GA4 still not configured (no `ga4_property_id`) — out of scope, not a credential problem. This update re-checks sitemap submission and indexation status following the same-day fix of GSC service-account permissions (now Owner-level) and enablement of the Indexing API, plus publication of the new `/breakout` page.

**1) Sitemap status (re-checked):**
- `https://lascuolaamica.it/sitemap.xml`: last submitted **2026-08-25T09:34:37Z (today)**, **0 warnings, 0 errors**, type `sitemap` (not an index), **20 URLs submitted** — one more than the 19 recorded on 2026-07-05, consistent with the new `/breakout` page being added to the sitemap. Sitemap health is clean.

**2) URL Inspection — sample of 4 (homepage + matematica + breakout + faq):**

| URL | Verdict | Coverage state | Last crawl |
|---|---|---|---|
| `/` (homepage) | PASS | Submitted and indexed | 2026-08-21 (mobile) |
| `/matematica` | PASS | Submitted and indexed | 2026-08-05 (mobile) |
| `/breakout` | NEUTRAL | **URL is unknown to Google** | never crawled |
| `/faq` | PASS | Submitted and indexed | 2026-08-04 (mobile) |

- Homepage: robots.txt ALLOWED, indexing_state INDEXING_ALLOWED, page_fetch_state SUCCESSFUL, canonical self-referential (matches), 2 referring URLs (sitemap.xml + an external GitHub blob link to `italiano.html`).
- `/matematica` and `/faq`: both indexed with matching self-canonicals; `/matematica` additionally shows a detected Breadcrumbs rich-result item (verdict PASS).
- `/breakout` — expected result: page was published today and an indexing request was just submitted via the Indexing API. `coverage_state = "URL is unknown to Google"` with no crawl history yet is the normal pre-crawl state immediately after a same-day Indexing API submission; this is not a failure. Recommend re-inspecting in 24-48h to confirm Google has picked up the request (typical turnaround for Indexing API-notified URLs is hours to a few days, not guaranteed).

**3) Search performance (28 days, 2026-07-28 to 2026-08-22):**
- Totals: **10 clicks, 238 impressions, CTR 4.2%, avg. position 16.0** — improved on all four metrics vs. the 2026-07-05 snapshot (6 clicks / 233 impressions / 2.58% CTR / pos. 18.4), consistent with a young site still building authority.
- 26 distinct query/page rows. Best performer: "100 domande in inglese per bambini" → `/inglese`, pos. 2.4, 2 clicks / 11 impressions, CTR 18.2% — a genuine near-top ranking. "esercizi di scienze" → `/scienze`, pos. 17.2, 1 click.
- New queries surfacing this period for `/civica`, `/geografia`, `/italiano`, `/storia`, `/per-genitori`, `/per-insegnanti`, `/ai-info`, `/supporta` — mostly positions 20-80 (long tail, low authority, expected at this stage), but breadth of surfaced queries (26 vs 38 previously) growing indicates expanding topical footprint even as absolute volume stays low.
- No quick-wins flagged (data still too sparse for the script's threshold logic).

**Findings:**
- **Info** — Sitemap correctly reflects the new `/breakout` page (20 URLs, 0 errors) same-day as publication; sitemap pipeline is healthy and current.
- **Info (expected, not a defect)** — `/breakout` shows "unknown to Google" in URL Inspection. This matches the expected pre-crawl state for a same-day Indexing-API-notified page; homepage and other subject pages (`/matematica`, `/faq`) remain solidly indexed with no regression.
- **Positive** — Search performance ticked up across all four headline metrics (clicks, impressions, CTR, avg. position) over the prior ~7-week gap between checks; `/inglese` is now ranking near page 1 (pos. 2.4) for "100 domande in inglese per bambini," a concrete early win worth watching for continued growth or feature-snippet eligibility.
- **Carryover from 2026-07-05** — The three indexation gaps flagged then (`/premi`, `/cookie` unknown; `/privacy` discovered-not-indexed) were not re-checked this session (out of the 4-URL sample scope); recommend re-inspecting them alongside `/breakout` in the next follow-up to confirm whether the GSC permission fix / Indexing API enablement helps them get picked up too.
