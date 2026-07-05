# Action Plan — lascuolaamica.it

## Phase 1: Critical Fixes (Week 1)
- None. No critical/blocking issues found.

## Phase 2: High-Impact Improvements (Weeks 2-3)
1. **Reduce render-blocking CSS** — bundle/inline critical CSS for the 5 stylesheets loaded in `<head>` (tokens.css, [page].css, fonts.css, utilities.css, rewards.css), or inline above-the-fold rules and defer the rest. Improves LCP.
2. **Bring `civica.html` FAQ schema to parity** — add 3-4 more Q&A pairs to match the 7-8 count on sibling subject pages (matematica, inglese, geografia, etc.).

## Phase 3: Content & Authority (Month 2)
1. Trim `chi-siamo.html` meta description from 153 to ~140 chars for safer SERP truncation margin.
2. Once Google Search Console is connected, run `seo-google` to replace the Performance category's static-analysis estimate (80/100) with real CrUX/GSC field data (LCP, INP, CLS, indexation status).
3. Consider a Moz/Bing Webmaster or Common Crawl backlink check to establish a baseline domain authority reading (no backlink data was available in this pass).

## Phase 4: Monitoring & Iteration (Ongoing)
1. Keep sitemap `lastmod` dates accurate on content updates (currently accurate as of 2026-07-03/07-01).
2. Re-audit after the CSS bundling change to confirm LCP improvement.
3. Watch that new subject/content pages maintain the same schema/meta/canonical discipline already established across the 19 existing pages.
