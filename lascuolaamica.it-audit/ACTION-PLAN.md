# Action Plan — lascuolaamica.it

Updated 2026-07-05 (evening) with real Google API data (PSI/CrUX/GSC). Phase 2 item 1 (render-blocking CSS) already shipped — commit `8282bc8`.

## Phase 1: Critical Fixes (Week 1)
- None. No critical/blocking issues found.

## Phase 2: High-Impact Improvements (Weeks 2-3)
1. ~~**Reduce render-blocking CSS**~~ — **Done.** `rewards.css` lazy-loads via `js/lazy-css.js` (commit `8282bc8`). `fonts.css` intentionally kept blocking — it carries metric-matched fallback fonts required at first paint.
2. ~~**Fix mobile CLS 0.183**~~ — **Done, verified in production.** Root cause: making `fonts.css` lazy (item 1's first attempt) broke the site's existing anti-CLS fallback-font system. Reverted `fonts.css` to blocking (commit `802d9e6`). Re-ran PSI against production: CLS 0.165-0.183 → **0.074 (Good)**, Performance category 99/100.
3. ~~**Bring `civica.html` FAQ schema to parity**~~ — **Done.** Added 3 Q&A pairs (4 → 7), matching sibling subject pages. JSON-LD validated, visible `<details>` kept in sync (commit pending).
4. **Request indexing for 3 unindexed URLs** — GSC confirms `/premi` and `/cookie` are "unknown to Google" (never crawled), `/privacy` is "discovered, not indexed." Use GSC URL Inspection > Request Indexing for all three; check they aren't orphaned in internal linking.

## Phase 3: Content & Authority (Month 2)
1. Trim `chi-siamo.html` meta description from 153 to ~140 chars for safer SERP truncation margin.
2. Complete GSC URL Inspection for the 5 sitemap URLs not yet checked (`/ai-info`, `/supporta`, `/supporto-satispay` + 2 others) — rate-limited during this session's run, not an error.
3. Consider a Moz/Bing Webmaster or Common Crawl backlink check to establish a baseline domain authority reading (no backlink data was available in this pass).

## Phase 4: Monitoring & Iteration (Ongoing)
1. Keep sitemap `lastmod` dates accurate on content updates (currently accurate as of 2026-07-05).
2. Re-check CrUX eligibility in 2-3 months — currently "Insufficient Chrome traffic volume for eligibility" (expected for a young/low-traffic site, not a defect).
3. Watch that new subject/content pages maintain the same schema/meta/canonical discipline already established across the 19 existing pages.
4. Search performance baseline (28 days, real GSC data): 6 clicks, 233 impressions, CTR 2.58%, avg. position 18.4. Track this trending up over time as an authority-building signal.
