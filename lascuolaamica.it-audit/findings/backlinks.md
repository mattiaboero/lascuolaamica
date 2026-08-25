# Backlink Profile Audit — lascuolaamica.it

Date: 2026-08-25
Scope: Free source data only. Tier 0 (Common Crawl + Verify) — no Moz, Bing, or DataForSEO API keys configured (`python3 backlinks_auth.py --check --json` confirms `tier: 0`).
Context: Non-commercial, free primary-school educational resource, launched ~April 2026 — a modest/sparse backlink profile is expected and is not itself a red flag.

## Backlink Health Score: INSUFFICIENT DATA

Only 0/7 scoring factors (referring domain count, domain quality distribution, anchor text naturalness, toxic link ratio, link velocity, follow/nofollow ratio, geographic relevance) have any data source available at Tier 0 for this domain. Per the skill's scoring policy, a numeric score is not reported when fewer than 4/7 factors have data — producing one here would be misleading. This was confirmed programmatically via `validate_backlink_report.py` (status: PASS, 0 errors), which specifically checks health-score sufficiency.

---

## 1. Common Crawl Domain Graph — Common Crawl (domain-level, confidence: 0.50)

Source: `python3 commoncrawl_graph.py lascuolaamica.it --json`
Release used: `cc-main-2026-jan-feb-mar` (CC's most recent available release at audit time; data freshness ~quarterly).

| Metric | Value |
|---|---|
| In crawl | **false** |
| In rankings | **false** |
| PageRank | null |
| Harmonic centrality | null |
| Top referring domains | none |
| Referring domains sample | 0 |

**Interpretation (important — do not over-read this):** the domain is not present in Common Crawl's dataset at all. This does **not** mean "zero backlinks" or "low authority" — it means CC has not crawled/indexed the domain yet. The most likely explanation here is timing: the site launched around April 2026, and the CC release queried (Jan–Mar 2026) predates the site's existence, so absence is expected and uninformative rather than a negative finding. The next CC release covering April 2026 onward may pick it up if any inbound links exist.

## 2. Backlink Verification Crawler — Verify (confidence: 0.95, when run)

Not run. `verify_backlinks.py` requires a `--links` file of known/candidate backlink source URLs to check; none were supplied for this audit and none are known in advance (no prior link-building campaign, no existing directory listings on record). Nothing to verify at this time. If/when candidate referring URLs surface (e.g., from Google Search Console's "Links" report, which the site owner has direct access to but this audit does not), re-run:
```
python3 scripts/verify_backlinks.py --target https://lascuolaamica.it/ --links <file> --json
```

## 3. Moz / Bing / DataForSEO

Not available — no API keys configured (`moz_api_key`, `BING_WEBMASTER_API_KEY` not set; no DataForSEO MCP tools present). No DA/PA, spam score, anchor text, or referring-domain-count data could be retrieved from these tiers. This is the primary reason the score is reported as INSUFFICIENT DATA rather than a number.

---

## Honest Summary

No backlink data — positive or negative — was retrievable for lascuolaamica.it from any Tier 0 source. This is consistent with the site's actual profile (new, ~4 months old, no paid tools/directories run yet) rather than evidence of a problem. Do not interpret the absence of Common Crawl data as "poor backlink profile"; it is simply "not yet observed."

## Recommendations (realistic for a non-commercial free educational resource)

Given this is a free tool for Italian primary school with no commercial intent, link building should focus on natural, low-effort placements rather than a formal outreach campaign:

### Medium Priority
1. **Submit to Italian teacher/school resource directories and aggregators** — e.g. regional USR (Ufficio Scolastico Regionale) resource pages, "risorse didattiche gratuite" collection sites, and teacher-community link lists (e.g. maestre/maestri blog roundups). These sites actively curate free tools and are a natural fit given the `/per-insegnanti` page already exists on the site.
2. **Pitch inclusion in "risorse gratuite scuola primaria" / "siti utili per la scuola primaria" listicle articles** on established Italian edu-blogs (e.g. maestra-focused WordPress blogs, Pinterest-adjacent Italian teacher blogs). These listicles are refreshed periodically and are open to free-tool submissions via comment or contact form.
3. **Local school website links** — many Italian primary schools maintain a "link utili" or "risorse online" page; reaching out to a handful of schools already using the site (if any usage data exists) for a reciprocal-free listing is a realistic, low-effort win.

### Low Priority
4. **Italian open-education/OER aggregators** (e.g. Erickson Live community boards, Pearltrees-style curated collections used by Italian teachers) — worth a one-time submission pass once the site has more content/case studies to point to.
5. **Re-check Common Crawl in ~3-4 months** once a newer CC release (covering post-April-2026 crawls) is published — the domain may appear then even without active outreach, simply from organic discovery.

### Explicitly not recommended
- Paid directory submissions, link farms, or guest-post link schemes — inappropriate for a free non-commercial educational tool and carries toxic-link risk with no commercial upside.
- Formal digital-PR/outreach campaign — disproportionate effort for the site's current size and non-commercial nature; revisit only if traffic/usage grows substantially.

---

## Cross-References
- Content quality (E-E-A-T) relevant to earning organic links: recommend `/seo content https://lascuolaamica.it/` (not duplicated here).
- Crawlability/technical prerequisites for being discovered by future crawls: see `technical.md` (already PASS, 93/100) — no blockers to being picked up by Common Crawl or search engines going forward.

## Data Freshness Notes
- Common Crawl: quarterly releases; the queried release (`cc-main-2026-jan-feb-mar`) predates the site's April 2026 launch.
- Moz / Bing: not queried (no credentials).
