# Content Quality & E-E-A-T — lascuolaamica.it

Audited live (2026-08-25): homepage + 8 subject quiz pages + /breakout + 10 institutional
pages (19 sitemap URLs). Fetched raw HTML (no SPA shell detected — content is
server-rendered, `mode=raw` for all pages), extracted `<section class="seo-static">`
blocks separately from interactive quiz/game UI copy to isolate genuine SEO content.

### Content Quality Score: 71/100

## E-E-A-T Breakdown

| Factor | Score | Key Signals |
|--------|-------|-------------|
| Experience | 15/25 | Named founder narrative on `/chi-siamo` (Mattia Boero, "multimedia project manager a Torino"), specific quotable product facts (9,800+ domande nel database, 20 regioni italiane, tabelline ×2-×10). No case studies, no classroom/parent testimonials, no photos/screenshots of real usage, no "tested with children" evidence. |
| Expertise | 15/25 | `Person` schema (`author`) on `/chi-siamo` ties content to Mattia Boero — but it's name-only (no `jobTitle`, `sameAs`, portfolio/LinkedIn link, or credentials). Pages repeatedly claim curriculum alignment ("allineati al programma ministeriale", "Indicazioni Nazionali") without citing the MIM curriculum document or disclosing any pedagogical/teaching credential behind the content — the named author's background is multimedia/PM, not education. This is the weakest E-E-A-T link given the content is nominally curriculum-aligned for children. |
| Authoritativeness | 11/25 | `Organization` schema is minimal (name + url only — no `sameAs`, no `logo`, no link to press/social). No external citations, no backlinks/press-mention evidence found, no school/teacher partnerships or endorsements listed on `/per-insegnanti`. Zero third-party validation signals of any kind. |
| Trustworthiness | 22/25 | HTTPS everywhere, dedicated `/privacy`, `/cookie`, `/accessibilita` pages, explicit no-tracking/no-account-for-minors stance repeated consistently (chi-siamo, ai-info, faq, per-insegnanti, per-genitori), contact email on `/chi-siamo`, `dateModified`/`datePublished` in WebSite schema (2026-07-05, fresh), FAQPage schema on all 8 subject pages + `/faq`. Minor gaps: no visible ToS, no physical address (acceptable for a free non-commercial tool). |

**Weighted (per skill's 20/25/25/30 weighting):** Experience 60%×20=12.0, Expertise 60%×25=15.0, Authoritativeness 44%×25=11.0, Trust 88%×30=26.4 → **64.4/100** raw E-E-A-T. Blended into the overall Content Quality Score alongside strong technical execution (schema, freshness, low duplication, readability, AI-readiness) below.

### AI Citation Readiness: 79/100

**Strengths:**
- Dedicated `/ai-info` page — a declarative, machine-readable identity/fact block explicitly written for LLMs and crawlers ("Informazioni per AI e motori di ricerca"), with quotable facts (8 materie, 10 domande/partita, no tracking, offline-capable). Unusual and genuinely useful GEO signal, rare even on much larger sites.
- `FAQPage` schema on all 8 subject pages + `/faq` (7 Q&As per subject, verified equal count across matematica/civica/italiano — confirms the civica parity fix landed).
- `EducationalApplication`/`LearningResource` schema on subject pages, `AboutPage`+`Person` on chi-siamo, `WebSite`/`Organization`/`CollectionPage` via `@graph` on homepage.
- Consistent H2 → H3 hierarchy in the static content (intro block → FAQ block → subject deep-dive with H3 sub-sections), answer-first FAQ phrasing.
- Clean, low-noise HTML — trafilatura/LLM extraction picks up the static content cleanly without ad/nav clutter.

**Gaps:**
- H1 on every subject page is the emoji-decorated in-app game title (e.g. `🔢Matematica📐`, `🌍English Adventure`), not the keyword-descriptive phrase used in `<title>`/meta description. The keyword-rich phrase only appears in an H2 further down. Primary-keyword-in-H1 is a basic AI/SEO extraction signal that's currently skipped.
- Zero contextual in-content links between subject pages (no link from `/matematica` to `/problemi` for word problems, none to `/per-genitori`/`/per-insegnanti` from subject pages) — cross-linking exists only in global nav/footer (13 links, matches all 8 subjects + faq/privacy/cookie/home). Fine for crawlability, weak for AI topical-cluster signals.
- `Person`/`Organization` schema present but thin (no `sameAs`, no credentials) — limits entity resolution for AI systems trying to verify who stands behind curriculum claims.
- No cited external sources (curriculum guidelines, pedagogical references) for verifiability, which AI Overviews/AI Mode weigh when choosing what to cite as authoritative.

## Thin Content / Word Count Assessment

These are app/product pages, not articles — closest applicable floor is the **Product/Tool page minimum (300-400 words)**, not the Service-page (800) or Blog-post (1,500) floors, since the actual "content" is the interactive quiz and the static block exists to support SEO/AI-citation and answer FAQs, not to be the primary value delivery.

| Page | Static SEO-block words (`.seo-static` only) | Full extracted text (incl. quiz UI copy) | Assessment |
|------|---:|---:|---|
| matematica | 546 | 640 | Adequate |
| inglese | 606 | 716 | Adequate |
| problemi | 598 | 504 | Adequate |
| civica | 385 | 498 | At the product-page floor — thinnest of the 8, worth a modest expansion |
| geografia | 651 | 697 | Adequate |
| storia | 495 | 584 | Adequate |
| scienze | 611 | 702 | Adequate |
| italiano | 659 | 447 | Adequate |
| homepage | — | 134 | **Below the 500-word homepage floor** — but this is a collection/hub page whose job is to route to the 8 subject pages, not carry topical depth itself; low word count here is lower-risk than on a standalone landing page |
| chi-siamo | — | 181 | Thin for an About page but proportionate to project scope |
| per-insegnanti | — | 381 | Adequate for an audience-segment page |
| per-genitori | — | 342 | Adequate |
| ai-info | — | 134 | By design (declarative fact list, not prose) — fine |
| faq | — | 731 | Adequate |
| premi | — | 83 | Thin — utility/rewards-explainer page, low SEO stakes |
| accessibilita | — | 181 | Statement page, acceptable length for the genre |
| supporta | — | 92 | Thin — low SEO stakes (donation/support page) |
| privacy | — | 240 | Acceptable for a policy page |
| cookie | — | 138 | Acceptable for a policy page |

No page fell below the "under 100 words retrievable" error-handling threshold. `premi` and `supporta` are the only genuinely thin pages by absolute word count, but both are low-search-intent utility pages (not competing on informational queries), so the practical SEO risk is low.

## Duplicate Content Risk — 8 Subject Page Template

**Verdict: low / negligible real penalty risk. Not a mad-libs template.**

Measured 5-gram (shingle) Jaccard similarity between every pair of the 8 subject pages'
`.seo-static` text (i.e., excluding shared nav/footer):

- Highest overlap: matematica↔italiano at 4.35%
- Typical overlap: 0.2%–2.6%
- Most pairs: under 1.5%

This means **95%+ of the static content on every subject page is unique wording**, well
above the seo-programmatic quality gate's 30-40% uniqueness threshold (and far above the
harder 60%+ threshold that would trigger scaled-content-abuse concern). What *is* shared
across the 8 pages is purely structural: the same section pattern (H2 intro → H2 FAQ → H2
subject deep-dive with H3 sub-sections) and the same UI/quiz-mechanic boilerplate ("10
domande per partita, 4 risposte possibili", "nessun login, nessun cookie, funziona anche
offline"). That's normal, expected templating for a category of near-identical products
(8 quiz subjects sharing one game mechanic) — Google's guidance targets pages where the
*body content itself* is swapped-noun boilerplate, which is not what's happening here:
each page has genuinely subject-specific FAQ answers, subject-specific deep-dive facts
(regions of Italy, verb tenses, historical periods, etc.), and distinct titles/meta
descriptions/H1s. FAQPage schema question counts are equal (7 per page) by design, not by
copy-paste — each question is subject-specific per the sampled text.

The one real echo of a prior thin-content risk is documented in `audit-data.json`'s
existing Content Quality entry: civica.html previously had only 4 FAQ Q&As vs. 7 on
sibling pages (parity gap, not duplication) — confirmed fixed as of this fetch (civica
now shows 7, matching matematica and italiano).

## Readability

Computed on the `.seo-static` prose (excludes UI microcopy and the multiplication-table
grid, which are not prose):

| Page | Avg sentence length (words) | Avg word length (chars) |
|------|---:|---:|
| matematica | 16.5 | 4.8 |
| inglese | 11.4 | 5.0 |
| problemi | 11.1 | 5.0 |
| civica | 15.4 | 5.5 |
| geografia | 14.8 | 5.4 |
| storia | 13.5 | 5.8 |
| scienze | 16.1 | 5.7 |
| italiano | 10.1 | 5.2 |

Sentence lengths (10-17 words) sit within/near the 15-20-word target band, generally on
the tighter side — appropriate given this static prose is read by parents/teachers
scanning FAQs, not by the 7-11-year-old target users themselves (children interact with
the quiz UI, which uses much simpler, emoji-supported microcopy — a sensible split of
registers for the mixed audience). No jargon, no keyword-stuffed sentences observed.

## Keyword Optimization

Titles and meta descriptions are well-differentiated and naturally keyword-rich per
subject (e.g. matematica: "Esercizi di Matematica | Scuola Primaria Gratis" /
"Esercizi di matematica gratis per la scuola primaria: tabelline, calcolo, problemi,
geometria e logica..."). No stuffing observed — natural language throughout FAQs.

**Gap:** primary keyword phrase does not appear in H1 on any subject page (H1 is the
in-app emoji game title, e.g. `🔢Matematica📐`); it only appears in an H2 further down the
static block. Low-severity for a branded app UI, but an easy win for on-page/AI-extraction
signal strength.

## Issues Found

| # | Issue | Severity | Pages affected |
|---|---|---|---|
| 1 | Curriculum-alignment claims ("programma ministeriale", "Indicazioni Nazionali") not backed by cited source or disclosed pedagogical reviewer/credential | Medium | All 8 subject pages |
| 2 | `Organization`/`Person` schema present but thin (no `sameAs`, no credentials, no `jobTitle` beyond prose) — weak entity resolution for AI/authoritativeness | Medium | Sitewide (chi-siamo, homepage @graph) |
| 3 | Zero external citations/backlinks/press or school-partnership evidence | Medium | Sitewide |
| 4 | H1 does not contain the primary keyword phrase (emoji game title only) | Low | All 8 subject pages |
| 5 | No contextual in-content cross-links between subject pages (only global nav/footer) | Low | All 8 subject pages |
| 6 | civica.html is the thinnest subject page (385 static-block words) | Low | civica |
| 7 | Homepage extracted text (134 words) is well under the 500-word homepage floor | Low | homepage (mitigated: it's a hub page routing to 8 subject pages, not a standalone landing page) |
| 8 | `/premi` and `/supporta` are genuinely thin (83 and 92 words) | Low | premi, supporta |

## Recommendations

1. Add one sentence per subject page citing the specific curriculum reference (e.g. link
   to the MIM "Indicazioni Nazionali" document for the relevant subject/grade) to back the
   alignment claim with a real source — cheap authoritativeness/trust win.
2. Expand `Person` schema with `sameAs` (LinkedIn/portfolio) and `jobTitle`; add `sameAs`
   to `Organization` if any social/press presence exists. If none exists, that itself is
   worth knowing before over-investing in schema depth.
3. Change H1 on subject pages to include the keyword phrase (can keep the emoji/game
   branding as a secondary line or `aria-label`), e.g. `H1: Esercizi di Matematica —
   🔢Matematica📐` — small change, direct AI-extraction and on-page SEO benefit.
4. Add 1-2 contextual links from each subject page's static block to a related subject
   (e.g. matematica → problemi) and to `/per-genitori` or `/per-insegnanti` — reinforces
   topical clustering for GEO without touching the app UI.
5. Expand civica's deep-dive section modestly to match sibling depth (currently the
   shortest at 385 words vs. 495-659 on other subjects).
6. Homepage and `/premi`/`/supporta` are low priority — acceptable given their role
   (hub page, low-intent utility pages) but could each gain 2-3 sentences of context
   without cost.

## Was any duplicate-content penalty risk found on the 8 subject pages?

**No.** Measured phrase-level overlap is 0.2%-4.4% (5-gram Jaccard), meaning each subject
page is 95%+ unique prose, not template text with swapped nouns. The shared element is
structure (heading pattern) and UI microcopy, which is normal and expected for a family of
near-identical quiz products. This does not meet Google's scaled-content-abuse or
programmatic-thin-content criteria (which target <30-40% unique content). Real risk here
is negligible.
