# Structured Data (Schema.org) Audit — lascuolaamica.it

Date: 2026-08-25
Pages checked: 20/20 (full sitemap), fetched raw HTML (`--mode never`); confirmed server-rendered by diffing raw vs Playwright-rendered homepage (identical JSON-LD block count) — no client-side injection anywhere on the site.

## Score: 91/100 — Pass with content-integrity fixes needed

## Detection Summary

| Page type | Count | Blocks per page | Types used |
|---|---|---|---|
| Homepage | 1 | 1 (`@graph`) | WebSite, CollectionPage, ItemList, EducationalOrganization |
| Subject pages | 8 (matematica, inglese, problemi, civica, geografia, storia, scienze, italiano) | 3 each | EducationalApplication+LearningResource, BreadcrumbList, FAQPage |
| /breakout | 1 | 3 | EducationalApplication+Game, BreadcrumbList, FAQPage |
| /chi-siamo | 1 | 2 | AboutPage (with embedded Person author), BreadcrumbList |
| /faq | 1 | 3 | WebPage, BreadcrumbList, FAQPage (25 Q&A) |
| Other utility pages (per-insegnanti, per-genitori, ai-info, premi, accessibilita, supporta, privacy, cookie) | 8 | 2 each | WebPage, BreadcrumbList |

Total: 33 JSON-LD `<script>` blocks across 20 pages, all valid JSON, all format `https://schema.org` context, no Microdata/RDFa found anywhere.

## Validation Report

| Check | Result | Notes |
|---|---|---|
| JSON parses (all 33 blocks) | PASS | 0 parse errors |
| `@context` = `https://schema.org` (not http) | PASS | 20/20 pages |
| Deprecated types used (HowTo, SpecialAnnouncement, CourseInfo, EstimatedSalary, LearningVideo) | PASS | None found |
| Absolute URLs (no relative `url`/`item` values) | PASS | Scripted check across all blocks, 0 violations |
| ISO 8601 dates | PASS | All `datePublished`/`dateModified` in `YYYY-MM-DD` |
| No placeholder text | PASS | None found |
| Required properties present per type used | PASS | See per-type notes below |
| BreadcrumbList consistency (Home → page, absolute `item` URLs) | PASS | Identical structure on all 20 pages |
| EducationalApplication/LearningResource template consistency (8 subject pages) | PASS | All 8 have identical property set: `applicationCategory`, `educationalUse`, `learningResourceType`, `teaches`, `isAccessibleForFree`, `typicalAgeRange`, `educationalLevel`, `numberOfQuestions`, `audience`, `isPartOf`, `publisher` (via `@id` ref) |
| FAQPage Q&A count = visible `<details>` count | **5/9 PASS, 4/9 issues** | See FAQPage section below — civica (7/7), inglese (8/8), scienze (7/7), breakout (5/5), faq.html (25/25) are clean; matematica, problemi, geografia, storia have text divergence (counts match on matematica/geografia/storia, problemi has a real count gap) |
| FAQPage text 1:1 match (Google's rich-result requirement, kept for AI-citation accuracy per current no-SERP-benefit status) | **FAIL on 5/9 FAQ pages** | Detailed below |
| Homepage `@graph` completeness | PASS | `EducationalOrganization` has `logo` (ImageObject, 512x512), `sameAs` (GitHub), `founder` (Person, `@id`-linked to chi-siamo author) — this is already implemented, contrary to the brief's assumption that it might be missing |
| Person schema for chi-siamo author bio | PASS (already present) | `chi-siamo.html` has `AboutPage.author` = Person with `@id: https://lascuolaamica.it/chi-siamo#author`, same `@id` reused as `EducationalOrganization.founder` on the homepage graph — correct `@id`-linking pattern. Minimal though: only `@type`/`@id`/`name`, no `url`/`sameAs`/`jobTitle` |

## FAQPage — Detailed 1:1 Text-Match Findings

Note per current policy: FAQPage rich results are retired for all sites (May 2026), so these are **not** SERP-breaking errors. They remain relevant because the same JSON-LD text is what an LLM/AI assistant would quote when citing the page — a mismatch means the AI could cite something the human visitor never actually reads on the page, and general "misleading structured data" is independently discouraged by Google's spam policies. Classified as **content-integrity issues**, not critical rich-result errors.

| Page | Visible `<details>` | Schema Q&A | Result |
|---|---|---|---|
| civica | 7 | 7 | Clean — text matches exactly, confirms the previously-flagged civica shortfall (4→7) is genuinely fixed |
| inglese | 8 | 8 | Clean |
| scienze | 7 | 7 | Clean |
| breakout | 5 | 5 | Clean |
| faq.html | 25 | 25 | 24/25 exact; 1 trivial punctuation diff (visible text quotes "Supporta il progetto", schema strips the quote marks) — negligible |
| **matematica** | 7 | 7 | Counts match but **3 of 7 answers** are paraphrased/expanded in schema vs. visible page text (items 5, 6, 7 — tabelline, calcolo mentale, geometria) |
| **geografia** | 7 | 7 | Counts match but **3 of 7 answers** expanded in schema beyond visible text (regioni d'Italia, carta geografica, paesaggi) |
| **storia** | 7 | 7 | Counts match but **3 of 7 answers** expanded in schema (periodi storici, fonti storiche, civiltà antiche) |
| **italiano** | 7 | 7 | Counts match but **3 of 7 answers** expanded in schema (parti del discorso, tempi verbali, ortografia) |
| **problemi** | 11 | 7 | **Real count gap.** First 7 are genuine FAQ (3 of which also have the same text-expansion issue). The remaining 4 `<details class="seo-faq-item">` are worked-example word problems (one per grade level, e.g. "Classe 2ª — Addizione: Marco ha 12 caramelle…") — these are correctly *not* in FAQPage (they're not Q&A, they're worked examples) but they reuse the identical FAQ CSS class/collapsible pattern, making the page visually present 11 "FAQ-style" items while only 7 are marked up. Not a schema bug, but a content-authoring inconsistency worth a look. |

Pattern across the 5 affected pages: items 5–7 (matematica/geografia/storia/italiano) or items 5–7 (problemi) consistently have schema answers that add sentences not present on the visible page — looks like a template default ("first 4 Q&A short + hand-written, later Q&A schema-only expanded for keyword coverage") rather than random drift. Single root-cause fix likely applies to all 4-5 pages at once (same generator/template).

## EducationalApplication/LearningResource — Property Check (8 subject pages)

All 8 pages carry the full recommended set (`applicationCategory`, `operatingSystem`, `educationalUse`, `learningResourceType`, `teaches`, `isAccessibleForFree`, `typicalAgeRange`, `educationalLevel`, `numberOfQuestions`, `audience.educationalRole`, `isPartOf`, `publisher` via `@id`). No page is missing any property present on its siblings — the "8-page template" is genuinely consistent (only the FAQ text-match issue breaks the pattern, and only in the FAQPage block, not this one).

## Missing Opportunities (not currently implemented)

1. **AggregateRating/Review** — correctly absent. No genuine user-review mechanism exists on the site (it's a free quiz PWA with no review UI); adding Review/AggregateRating schema without a real collection mechanism would violate Google's structured-data spam policy (fake ratings). **Not recommended** unless a genuine review feature ships first.
2. **Person (`founder`/`author`) enrichment** — currently minimal (`@type`, `@id`, `name` only, both on `home`'s `EducationalOrganization.founder` and `chi-siamo`'s `AboutPage.author`, correctly `@id`-linked to each other). Adding `url` (→ `/chi-siamo`) and `sameAs` (GitHub profile, if public) would strengthen entity resolution for AI/LLM answer engines.
3. **`/breakout` not referenced from the homepage `@graph`** — the homepage `ItemList` (8 subjects) intentionally excludes it since it's a game, not a subject, which is correct — but there's no schema link at all from home → breakout (no `hasPart`, no second `ItemList`). A `WebPage.hasPart` reference from `CollectionPage` (home) to `/breakout`'s `EducationalApplication` would improve discoverability for crawlers/AI without touching the subjects `ItemList`.

## Generated JSON-LD — Person Enrichment (opportunity #2)

Patch to `chi-siamo.html`'s `AboutPage.author` (and homepage's `EducationalOrganization.founder`, same `@id`, keep both in sync):

```json
{
  "@type": "Person",
  "@id": "https://lascuolaamica.it/chi-siamo#author",
  "name": "Mattia Boero",
  "url": "https://lascuolaamica.it/chi-siamo",
  "sameAs": [
    "https://github.com/mattiaboero"
  ]
}
```

## Recommendations (priority order)

1. **Fix the FAQPage text mismatch on matematica, geografia, storia, italiano** (3 answers each) and the count gap on problemi (7 vs 11 visible) — align schema `acceptedAnswer.text` to the exact visible `<p>` text, or vice versa. No SERP risk (FAQ rich results retired) but fixes AI-citation accuracy and closes a spam-policy grey area. Single template fix likely covers all 4-5 pages.
2. Enrich `founder`/`author` Person with `url` + `sameAs` (see JSON-LD above) — cheap, improves entity graph for AI answer engines.
3. Optional: link `/breakout` from the homepage graph (`hasPart` on `CollectionPage`) for better crawl/AI discoverability — skip if not worth the diff, low priority.
4. No action on Review/AggregateRating — correctly absent, do not add without a real review mechanism.
