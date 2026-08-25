# Sitemap Audit — lascuolaamica.it

Date: 2026-08-25
Sitemap: https://lascuolaamica.it/sitemap.xml
Robots.txt: https://lascuolaamica.it/robots.txt

## Score: 98/100 — Pass

## Validation Report

| Check | Result | Notes |
|---|---|---|
| XML syntax valid | PASS | `xmllint --noout` clean |
| URL count vs 50k limit | PASS | 20 URLs, no index needed |
| Duplicate `<loc>` entries | PASS | 0 duplicates |
| All URLs return HTTP 200 | PASS | 20/20 checked live, no redirects, no 4xx/5xx |
| Canonical form (no trailing-slash mismatch, no www/non-www dupes) | PASS | `/` for homepage, no trailing slash elsewhere — consistent |
| robots.txt allows all sitemap URLs | PASS | Only `/json/`, `/reports/`, `/questions-build-report.json` disallowed — none overlap with sitemap |
| robots.txt references sitemap | PASS | `Sitemap:` directive present, correct URL |
| lastmod accuracy | PASS | Dates vary (2026-07-05/06 and 2026-08-25), sourced from real git commit history via `generate_sitemap.py` — not a fabricated blanket date |
| priority / changefreq present | INFO | Both tags present on all 20 entries; Google ignores both. Not an error, but dead weight — safe to drop in a future cleanup |
| Sitemap coverage vs expected page list (20 URLs) | PASS | Exact 1:1 match, 0 missing, 0 extra |
| Orphan page check (crawled from homepage + interlinked footer/pages) | PASS | All 20 pages reachable via homepage nav + footer + cross-links (chi-siamo ↔ per-insegnanti ↔ per-genitori ↔ ai-info ↔ faq). No orphans. |
| Noindexed URLs in sitemap | Not checked (no meta-robots audit requested) | — |

## Missing Pages (crawled/expected but not in sitemap)
None.

## Extra Pages (in sitemap but 404/redirected/non-canonical)
None.

## Excluded by design (confirmed correct, not flagged)
- `/json/*`, `/reports/*` — data files, blocked in robots.txt, correctly absent from sitemap.

## Quality Gates
- Location pages detected: 0 (site has 0 programmatic/location pages, well under the 30-page warning threshold). No action needed.

## Structural Issues
None found. Sitemap is clean, minimal, and matches the live site 1:1.

## Recommendations (non-blocking)
1. Optional: strip `<priority>` and `<changefreq>` tags — Google ignores both since 2023 (confirmed by Google's own documentation); removing them shrinks the file with zero SEO impact.
2. Sitemap was resubmitted to GSC today with 0 errors/warnings — no further action required this cycle.
