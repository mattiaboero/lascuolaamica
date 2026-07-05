# Action Plan — lascuolaamica.it

Updated 2026-07-05 (evening) with real Google API data (PSI/CrUX/GSC). Phase 2 item 1 (render-blocking CSS) already shipped — commit `8282bc8`.

## Phase 1: Critical Fixes (Week 1)
- None. No critical/blocking issues found.

## Phase 2: High-Impact Improvements (Weeks 2-3)
1. ~~**Reduce render-blocking CSS**~~ — **Done.** `rewards.css` lazy-loads via `js/lazy-css.js` (commit `8282bc8`). `fonts.css` intentionally kept blocking (see item 2 — it carries metric-matched fallback fonts required at first paint).
2. ~~**Fix mobile CLS 0.183**~~ — **Done, same day.** Root cause: making `fonts.css` lazy (item 1's first attempt) broke the site's existing anti-CLS fallback-font system (`Nunito Fallback`/`Fredoka One Fallback` with `ascent-override`/`size-adjust`, used as the 2nd font-stack choice). Reverted `fonts.css` to blocking `<link rel="stylesheet">` on all 20 pages; only `rewards.css` remains lazy. Not yet re-measured against production with PSI post-deploy — follow-up: re-run `pagespeed_check.py` after this ships to confirm CLS back to Good.
3. **Request indexing for 3 unindexed URLs** — GSC confirms `/premi` and `/cookie` are "unknown to Google" (never crawled), `/privacy` is "discovered, not indexed." Use GSC URL Inspection > Request Indexing for all three; check they aren't orphaned in internal linking.
4. **Bring `civica.html` FAQ schema to parity** — add 3-4 more Q&A pairs to match the 7-8 count on sibling subject pages (matematica, inglese, geografia, etc.).

## Phase 3: Content & Authority (Month 2)
1. Trim `chi-siamo.html` meta description from 153 to ~140 chars for safer SERP truncation margin.
2. Complete GSC URL Inspection for the 5 sitemap URLs not yet checked (`/ai-info`, `/supporta`, `/supporto-satispay` + 2 others) — rate-limited during this session's run, not an error.
3. Consider a Moz/Bing Webmaster or Common Crawl backlink check to establish a baseline domain authority reading (no backlink data was available in this pass).

## Phase 4: Monitoring & Iteration (Ongoing)
1. Keep sitemap `lastmod` dates accurate on content updates (currently accurate as of 2026-07-05).
2. Re-check CrUX eligibility in 2-3 months — currently "Insufficient Chrome traffic volume for eligibility" (expected for a young/low-traffic site, not a defect).
3. Watch that new subject/content pages maintain the same schema/meta/canonical discipline already established across the 19 existing pages.
4. Search performance baseline (28 days, real GSC data): 6 clicks, 233 impressions, CTR 2.58%, avg. position 18.4. Track this trending up over time as an authority-building signal.
