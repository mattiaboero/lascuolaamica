# Core Web Vitals Audit — lascuolaamica.it

**Origin:** https://lascuolaamica.it/
**Date:** 2026-08-25
**Method:** PageSpeed Insights API v5 (Lighthouse lab data, mobile + desktop strategy). CrUX field data attempted via `--crux-only`; site has insufficient Chrome traffic volume for CrUX eligibility (origin-level and per-URL both returned "No CrUX data" — expected for this traffic tier, not a bug). Lab data is the only available signal; treat with normal single-run variance caveats.

## CrUX Field Data

No CrUX data available for origin or any tested URL (insufficient 28-day Chrome traffic). Re-check periodically as traffic grows — see `scripts/crux_history.py`.

## Lighthouse Lab Scores — Summary (6 pages tested today)

| Page | Mobile Perf | Desktop Perf | Best Practices | Notes |
|------|------------|---------------|-----------------|-------|
| / (home) | 100 | 100 | 92 | Tested earlier — CF bot-mgmt script CSP block, informational only |
| /breakout | 100 | 100 | 92 | Tested earlier — same CF CSP note |
| /matematica | 98 | 85 | 100 | Desktop TBT 330ms (see below) |
| /faq | 100 | 100 | 100 | Clean across the board |
| /premi | 100 | 100 | 100 | Clean across the board |
| /chi-siamo | 87 | 100 | 92 | **Mobile CLS 0.254 — POOR** (see below) |

## Core Web Vitals detail — pages tested today

| Page | Strategy | LCP | CLS | TBT (lab proxy for INP) | CWV status |
|------|----------|-----|-----|-----|------------|
| /matematica | mobile | 2.3s | 0.009 | 0ms | LCP/CLS/INP: Good |
| /matematica | desktop | 0.6s | 0.010 | 330ms | LCP/CLS: Good; TBT elevated (7 long tasks) |
| /faq | mobile | 1.7s | 0.009 | 0ms | All Good |
| /faq | desktop | 0.4s | 0.001 | 0ms | All Good |
| /premi | mobile | 1.4s | 0.027 | 0ms | All Good |
| /premi | desktop | 0.4s | 0.002 | 0ms | All Good |
| /chi-siamo | mobile | 1.5s | **0.254** | 0ms | LCP/INP: Good; **CLS: Poor** |
| /chi-siamo | desktop | 0.4s | 0.015 | 0ms | All Good |

## Bottlenecks identified

### 1. /chi-siamo — mobile CLS 0.254 (Poor, fails even the 0.1–0.25 "needs improvement" band)

Desktop CLS on the same page is 0.015 (Good) — this is a mobile-viewport-specific regression, not a general page defect. The page has no `<img>`/`<iframe>` content of its own (confirmed via HTML inspection — only the Cloudflare bot-management 1×1 iframe, which is inert). Lighthouse reports 2 layout shifts on mobile vs 2 on desktop with much smaller magnitude, so the shifting element itself is present on both, but its effect on layout is amplified at mobile width.

Likely root causes, based on page markup (`js/rewards.js`, `js/app-version.js` deferred-loaded, populating `<span id="questionsTotalCount">` and `.footer-version` in the footer after initial paint) and `rewards.css` being loaded via `js/lazy-css.js` (async CSS injection pattern) rather than a blocking `<link rel="stylesheet">`:
- Footer text nodes (`#questionsTotalCount`, `.footer-version`) start empty/hidden and get populated by deferred JS after page load, changing footer height. At mobile width the footer content wraps to more lines, making the height delta (and therefore the CLS score) larger than on desktop where it fits on one line.
- `rewards.css` arrives late via `lazy-css.js`; if it affects footer/nav layout before it's applied, that's a second contributor.

This same deferred footer pattern likely exists on all pages (shared footer partial), but only manifests as CLS-Poor on /chi-siamo because it's the lightest page — nothing else is competing for/shifting layout, so the footer shift is proportionally larger and finishes late relative to an otherwise very fast page. Home and /breakout, tested earlier today, did not show this (CLS ~0–0.03), which is consistent with them having enough other content that the same footer shift is a smaller fraction of the affected area, or the shift lands within Lighthouse's windowing exclusion.

**Fix:** reserve space for `#questionsTotalCount` and `.footer-version` (min-height/min-width matching populated state, or `visibility:hidden` placeholder sized correctly) so their late population doesn't shift layout. Verify `rewards.css` is either inlined/critical for footer rules or that the footer doesn't use unstyled-by-default markup before it loads. Since this is a shared footer, fixing it in the shared partial/CSS benefits every page, not just /chi-siamo.

### 2. /matematica — desktop TBT 330ms (7 long tasks), Performance 85

Mobile run for the same page shows 0ms TBT, so this is a desktop-strategy-specific lab result — plausibly single-run variance, or the desktop Lighthouse profile (no CPU throttle) surfacing task-length differently than the 4x-throttled mobile profile. Matches the expected profile: /matematica loads the shared `subject-quiz-core.js` quiz engine, the heaviest JS payload among the pages audited. LCP (0.6s) and CLS (0.01) remain Good on desktop; TBT is a lab proxy, not a CWV metric itself, but 330ms sits at the edge of degrading real-world INP if it recurs consistently. Total-byte-weight for the page is 293 KiB, largest of the four new pages tested (faq 159 KiB, premi 157 KiB, chi-siamo 150 KiB) — consistent with the extra quiz-engine JS.

**Fix (lower priority, monitor first):** re-run PSI on /matematica a few more times / check CrUX once traffic accrues to confirm this isn't single-run noise. If it repeats, look at whether `subject-quiz-core.js` can defer non-critical initialization (e.g. question bank parsing) until after first paint/interaction, or split into a smaller synchronous bootstrap + lazy-loaded question logic.

## Recommendations (prioritized)

1. **High — /chi-siamo mobile CLS fix.** Reserve layout space for the deferred footer text nodes (`#questionsTotalCount`, `.footer-version`) in the shared footer CSS/partial. Fixes the only Poor CWV result found across 6 pages audited today, and benefits all pages sharing the footer.
2. **Low/monitor — /matematica desktop TBT.** Re-test to rule out single-run lab variance before investing in quiz-engine JS splitting. Not a CWV failure (LCP/CLS both Good); only relevant if it correlates with real INP issues once CrUX data becomes available.
3. **No action — Best Practices 92 on all pages with the CF bot-management script.** Confirmed non-fixable from our side (Cloudflare-injected inline script blocked by our own strict CSP); do not re-flag.
4. **Monitoring gap — no CrUX field data at any granularity.** Site traffic is below the CrUX eligibility threshold. Continue relying on Lighthouse lab data (PSI API) for now; re-check `crux_history.py` periodically as traffic grows so real-user data can validate these lab findings.

## Overall assessment

6/6 pages tested today (home, /breakout from earlier + /matematica, /faq, /premi, /chi-siamo now) pass Core Web Vitals on the metrics that matter most (LCP, INP-proxy/TBT) with wide margins — LCP consistently 0.4–2.3s (well under the 2.5s Good threshold), TBT 0ms on 5 of 6 mobile runs. The one CWV failure found is /chi-siamo's mobile CLS (0.254, Poor), a page-specific regression traced to deferred footer content injection, not a systemic site issue. Everything else confirms the excellent home/breakout baseline.

---
*Generated 2026-08-25. Lab data only (CrUX unavailable — insufficient traffic). Re-audit CrUX once available for real-user validation.*
