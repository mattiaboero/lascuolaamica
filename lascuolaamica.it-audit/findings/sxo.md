# Search Experience Optimization (SXO) Audit — lascuolaamica.it

Date: 2026-08-25
Pages analyzed: `/` (home), `/matematica`, `/breakout`, `/per-genitori` — raw HTML fetch (`--mode raw`, browser UA; site is not an SPA, confirmed server-rendered per `schema.md`). SERP data via 4 live Google searches (Italian queries).

## SXO Gap Score: 56/100 (separate from SEO Health Score)

| Page | Score | Verdict |
|---|---|---|
| `/matematica` | 66/100 | Best performer — genuinely aligned with search intent |
| `/` (home) | 64/100 | Aligned page type, thin on media/proof |
| `/breakout` | 53/100 | **Page-type mismatch** drags an otherwise well-built page down |
| `/per-genitori` | 40/100 | Weakest — targets a narrower intent than the persona query it needs to win |

## Headline finding: `/breakout` is a single-game page competing against portal/category pages

Query tested: **"gioco arcade educativo bambini online gratis"**. Top 8 organic results are exclusively **game portals/category pages** (Cartoonito arcade category, Poki educational hub, WellGames arcade list, giochibambini.it, funnygames.it, giochionlineperbambini.com) or **roundup listicles** (Aranzulla "giochi gratis per bambini"). Zero single-game landing pages appear in the top 10.

`/breakout` is a single-game landing page (490 words, one `<canvas>`, no static screenshots/preview images for pre-play trust-building). Against a SERP where every ranking result lets the user browse dozens/hundreds of games before committing, a lone unbranded game page is structurally the wrong content type for this query.

**Severity: CRITICAL** — Page Type dimension scores 3/15, the lowest of any dimension across all 4 pages, despite `/breakout` having the 2nd-best schema markup (`EducationalApplication`+`Game`, `BreadcrumbList`, `FAQPage`) and clean Lighthouse scores (100/100 mobile+desktop per `performance.md`) of the set. The technical foundation is solid; the content format doesn't match what Google is rewarding for this query.

This mismatch does *not* apply to branded queries (e.g. "cervellino spacca muri") — only to the generic exploratory query a first-time visitor would use.

## SERP Analysis Summary (4 queries, 8-9 results each)

| Query → target page | SERP dominant type | Confidence | Target page type | Match |
|---|---|---|---|---|
| "giochi educativi scuola primaria gratis online" → `/` | Hub/portal listing many games by subject | ~85% (6/7 hub-style) | Hub/portal (8 subjects + game, badge system) | **ALIGNED** |
| "esercizi matematica scuola primaria gratis online" → `/matematica` | Split: interactive quiz tools (~50%) vs. downloadable/printable worksheet hubs (~50%) | Mixed intent | Interactive quiz tool only, no printable/PDF option | **MEDIUM** — wins the interactive half, invisible to the "scarica e stampa" half |
| "gioco arcade educativo bambini online gratis" → `/breakout` | Game portal/category page or roundup listicle | ~100% (8/8) | Single-game landing page | **CRITICAL** |
| "aiutare i compiti scuola primaria consigli genitori" → `/per-genitori` | Long-form parenting advice article (Uppa, Sitly, Nostrofiglio, Centro Età Evolutiva — all 800-1500+ word guides) | ~90% (8/9) | Trust/safety FAQ page (privacy, GDPR, no-ads — 379 words) | **HIGH** — different intent than the page is built for; page answers "is this safe/free?" not "how do I help with homework?" |

Note: `/per-genitori`'s actual on-page targeting (title: "Per genitori \| Quiz educativi primaria gratis"; meta: sicurezza, privacy GDPR, nessuna pubblicità) suggests it was never meant to win "aiutare i compiti" — but that query is exactly what a parent persona searches before discovering the brand exists, and nothing on the site currently serves that advice-guide intent. This is a content-gap, not a mis-targeted page.

## User Stories (derived from SERP signals)

1. **"As a parent scanning results before clicking, I want to see this is free and safe without ads before I trust it with my kid."** — Signal: `/per-genitori`'s own meta description leads with "gratis... nessuna pubblicità... GDPR", confirming this is the #1 parent objection the SERP/query space surfaces. *(consideration stage)*
2. **"As a parent who just typed 'come aiutare mio figlio con i compiti', I want a practical guide, not a product FAQ."** — Signal: 8/9 top results for that query are long-form advice articles, none are product pages. *(awareness stage — persona hasn't found the brand yet)*
3. **"As a kid picking a game, I want to see what it looks like before I commit to loading it."** — Signal: every top-ranking arcade result (Poki, WellGames, Cartoonito) shows thumbnail grids; `/breakout` has zero preview images, only a `<canvas>` that renders after commitment. *(decision stage)*
4. **"As a parent/teacher searching for practice material, I want either an interactive quiz or a printable worksheet — whichever fits how we're using it (screen time vs. offline homework).**" — Signal: `/matematica`'s SERP competitors split roughly 50/50 between interactive tools and downloadable PDF worksheets; the site only offers the former. *(consideration stage)*
5. **"As a teacher, I want a dedicated classroom-tool page that speaks to my role, not a genitori-first message."** — Signal: `/per-genitori` links out to `/per-insegnanti`, implying teacher intent is currently secondary/derivative rather than a first-class SERP entry point. *(consideration stage — not deeply assessed, see Limitations)*

## Gap Analysis (7 dimensions, 100 pts) — per page

| Dimension (max) | `/` | `/matematica` | `/breakout` | `/per-genitori` |
|---|---|---|---|---|
| Page Type (15) | 14 | 10 | **3** | 5 |
| Content Depth (15) | 8 | 12 | 8 | 5 |
| UX Signals (15) | 9 | 13 | 12 | 11 |
| Schema (15) | 12 | 15 | 14 | 6 |
| Media (15) | 2 | 3 | 3 | 2 |
| Authority (15) | 9 | 5 | 5 | 4 |
| Freshness (10) | 10 | 8 | 8 | 7 |
| **Total** | **64** | **66** | **53** | **40** |

Evidence highlights:
- **Media is the weakest dimension site-wide** (2-3/15 on every page): zero `<img>`/`<svg>` on all 4 pages checked; `/breakout`'s only visual asset is the game `<canvas>` itself, which doesn't help pre-click trust or accessibility snapshots. Competing SERP results (worksheet sites, game portals) are thumbnail/diagram-heavy.
- **Schema** is genuinely strong on `/matematica` (15/15) and `/breakout` (14/15) — `EducationalApplication`/`Game`/`LearningResource`, `BreadcrumbList`, `FAQPage` all present (confirmed against `schema.md`, which found 91/100 site-wide schema health). `/per-genitori` only carries `WebPage`+`BreadcrumbList`, no `FAQPage` despite prose that reads like answered questions — though a dedicated `/faq` exists site-wide, so this is a minor gap, not a critical one.
- **Authority** is weak everywhere (4-9/15): no visible author/date bylines, testimonials, or external validation on any of the 4 pages themselves, even though `/chi-siamo` carries a `Person`-schema founder bio (per `schema.md`) — that trust signal isn't surfaced or linked from the pages that most need it (`/per-genitori`, `/breakout`).
- **Freshness** is strong across the board (7-10/10) — sitemap `lastmod` dates are current (home/breakout: 2026-08-25; matematica: 2026-07-05; per-genitori: 2026-07-06).

## Persona Scoring (100 pts: Relevance/Clarity/Trust/Action, 25 each) — sorted weakest first

| Persona | Relevance | Clarity | Trust | Action | Total | Weakest lever |
|---|---|---|---|---|---|---|
| **Parent seeking homework-help advice** (query 4) | 8 | 15 | 15 | 10 | **48** | Relevance — no page on-site matches this query's content format at all; needs a new long-form guide, not a fix to `/per-genitori` |
| **Kid/player browsing for a game** (query 3) | 12 | 18 | 15 | 15 | **60** | Relevance — arrives expecting a game catalog, lands on one game with no preview thumbnail |
| **Parent verifying safety/free/no-ads** | 20 | 18 | 20 | 14 | **72** | Action — page cross-links well (Per insegnanti, FAQ, Chi siamo, AI info, supporto) but has no single obvious "start here" CTA for a first-time parent |
| **Parent/teacher seeking printable worksheets** | 10 | 20 | 18 | 12 | **60** | Relevance — no PDF/print option exists; this sub-intent is entirely unserved |
| **Parent/teacher seeking interactive practice** (query 1, interactive half) | 22 | 20 | 18 | 20 | **80** | Action — strongest overall; difficulty selector + leaderboard + "Inizia!" CTA are clear and immediate |

Top persona-alignment gap: **the homework-help-advice parent (score 48/100)** — this persona doesn't fail because of a broken page, but because no page on the site targets their query's content format at all.

## Recommendations (priority order)

1. Add a long-form "come aiutare i compiti" style advice article/guide (targets User Story #2, closes the 48/100 persona gap) — cross-reference `/seo content` for E-E-A-T-driven long-form content.
2. Add static preview thumbnails/screenshots to `/breakout` (and ideally all 8 subject pages) — closes the Media gap (2-3/15 everywhere) and directly serves the "kid browsing" persona (60/100) which is penalized on Relevance for lack of a pre-commit preview.
3. Surface the `/chi-siamo` founder/trust bio (or a condensed version) directly on `/per-genitori` and `/breakout` — cheap Authority win, schema-linkable via existing `@id` pattern noted in `schema.md`.
4. Consider a lightweight printable/PDF variant of `/matematica` exercises to capture the "scarica e stampa" half of that query's SERP intent — flag as optional, only build if user demand is confirmed (avoid speculative scope per YAGNI).
5. `/breakout`'s page-type mismatch is structural, not a copy fix — a portal-style "giochi arcade" landing page (with `/breakout` as one entry, future games as others) would better match the SERP consensus if more games are planned; if `/breakout` stays the only game, prioritize branded-query ranking over this generic one instead of trying to out-portal actual portals.

## Limitations

- No SERP data available for AI Overview presence, featured snippets, or PAA boxes (WebSearch tool returns organic links + AI summary text, not raw SERP feature markup) — could not assess AIO/snippet eligibility directly.
- Teacher persona (`/per-insegnanti`) was not one of the 4 pages fetched for this pass — teacher-specific SXO scoring above is inferred from `/per-genitori`'s outbound link, not a direct audit.
- Page-type taxonomy and user-story/persona-scoring frameworks were applied from first principles (standard SXO categories: hub/portal, tool/app, long-form guide, trust/FAQ, listicle) — the skill's dedicated reference docs (`page-type-taxonomy.md`, `user-story-framework.md`, `persona-scoring.md`) were not found installed in this environment, so category boundaries may differ slightly from the canonical skill definitions.
- SERP results reflect a single query snapshot (2026-08-25, no location/device targeting specified) — rankings and dominant page types can shift; re-check before acting on the CRITICAL mismatch finding for `/breakout`.
- CrUX real-user data was unavailable for this site (per `performance.md`), so all UX-signal scoring above relies on Lighthouse lab data, not field data.

Next: Generate a PDF report? Use `/seo google report`
