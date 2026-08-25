# GEO Audit — lascuolaamica.it

Date: 2026-08-25

## GEO Health Score: 50/100

| Dimension | Weight | Score | Weighted |
|---|---|---|---|
| Citability | 25% | 72/100 | 18.0 |
| Structural Readability | 20% | 80/100 | 16.0 |
| Multi-Modal Content | 15% | 35/100 | 5.25 |
| Authority & Brand Signals | 20% | 30/100 | 6.0 |
| Technical Accessibility | 20% | 25/100 | 5.0 |
| **Total** | | | **50.25 → 50/100** |

The site's HTML/robots.txt/llms.txt "recipe" is excellent, but a Cloudflare edge rule is actively blocking the verified AI crawlers that recipe is meant to attract. That single issue caps Technical Accessibility and is the dominant drag on the overall score.

## AI Crawler Access Status — CRITICAL FINDING

`robots.txt` is fully open (`Allow: /`) and `llms.txt` states "Il sito è liberamente accessibile ai crawler." Neither is true in practice: Cloudflare's bot-management edge layer returns a hard `403 Your request was blocked` to verified AI-crawler user agents, independent of robots.txt.

Tested live (2026-08-25), user agent → HTTP status:

| Crawler | UA tested | Status | Should be |
|---|---|---|---|
| GPTBot | `GPTBot/1.0` | **403 blocked** | Allow |
| OAI-SearchBot | `OAI-SearchBot/1.0` | **403 blocked** | Allow |
| ClaudeBot | `ClaudeBot/1.0` | **403 blocked** | Allow |
| PerplexityBot | `PerplexityBot/1.0` | **403 blocked** | Allow |
| CCBot | `CCBot/2.0` | 403 blocked | OK (training-only, optional block) |
| Bytespider | `Bytespider` | 403 blocked | OK (not in required-allow list) |
| Googlebot | verified UA | 200 OK | — |
| Bingbot | verified UA | 200 OK | — |
| meta-externalagent | verified UA | 200 OK | — |
| Default/no special UA | curl default | 200 OK | — |

Response headers on the blocked requests (`server: cloudflare`, `cf-ray`, generic "Your request was blocked" plain-text body) confirm this is Cloudflare's **"AI Scrapers and Crawlers" bot-management toggle**, not an application-level or robots.txt rule — it sits in front of the origin and the site's own code/config has no visibility into it.

**Impact:** ChatGPT (GPTBot/OAI-SearchBot) and Perplexity cannot currently fetch/index any page on the domain for live answers or training-time crawl, regardless of how good the on-page content is. Google AI Overviews and Bing Copilot are unaffected (they ride on Googlebot/Bingbot, which are allowed).

**Fix:** Cloudflare dashboard → Security → Bots → "AI Scrapers and Crawlers" → switch from Block to Allow (or add explicit Allow rules for GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot in WAF custom rules). One-toggle change, no code deploy needed. **This is the single highest-impact fix in the whole GEO audit.**

## llms.txt Status: Present, high quality

`https://lascuolaamica.it/llms.txt` exists, was updated today (2026-08-25) to add the new `/breakout` arcade game under a "Giochi arcade" section, and follows the informal llms.txt convention well:
- Clear one-paragraph identity block + version number
- Structured sections: Identità, Materie (8 links), Giochi arcade, Dati quantitativi, Caratteristiche principali, Fondazione, Contatti utili, Note per sistemi AI
- Quantitative facts stated directly ("Domande totali: 9.879 (verificate a luglio 2026)")
- Explicit "Note per sistemi AI" closing section

Gaps:
- No RSL 1.0 licensing signal anywhere (no `License:` line in robots.txt, no RSL `<link>`/XML). Not required, but would let the site state machine-readable terms for AI training use.
- The "liberamente accessibile ai crawler" claim in the Note per sistemi AI section is currently false in practice because of the Cloudflare block above — fix the block, or soften the claim until fixed.
- llms.txt is not linked from `robots.txt` or `<head>` of pages (no discovery hint); low-effort to add `# llms.txt: https://lascuolaamica.it/llms.txt` style comment, though most llms.txt consumers already check the well-known path directly.

## Citability Analysis (passage-level, SSR HTML — content is fully server-rendered, no CSR gap)

The site is 100% SSR: `curl` with a default UA returns fully-populated HTML, including all `seo-static` copy blocks and JSON-LD, with zero JS execution required. This is a strong technical foundation once the Cloudflare block is fixed.

| Page | Block | Word count | vs. 134-167 optimal | Notes |
|---|---|---|---|---|
| Home | `.seo-home` | 138 | In range | Direct answer opens the block: "La Scuola Amica è una piattaforma educativa gratuita..." |
| /matematica | `.seo-static` | 85 | Below range | Concise but thin — could be extended without padding |
| /breakout | `.seo-static` | 150 | In range | Direct answer opens: "Cervellino Spacca-Muri è il gioco arcade di La Scuola Amica ispirato ai classici rompi-mattoni..." |
| /breakout | FAQ (`FAQPage` schema, 5 Q&A) | ~35-45/answer | Below range (by design) | Each `<details><summary>` is a genuine question, answer is 2 self-contained sentences — good AI-citation shape even though shorter than the "ideal" passage stat, which targets summary paragraphs, not FAQ snippets |

Strengths:
- `/breakout` has real `FAQPage` JSON-LD matching the visible `<details>/<summary>` Q&A — a strong, correctly-marked-up citability asset. Other subject pages should get the same treatment (only civica.html was previously noted to have 7 Q&A per other audit findings; verify FAQPage schema exists on all 8 subject pages, not just breakout).
- Specific, attributable stats present ("9.879 domande, verificate a luglio 2026", "10 domande con 4 risposte", "8 file di mattoni").
- Self-contained opening sentences that work if quoted out of context.

Weaknesses:
- H2 headings are keyword-phrases, not questions, on non-FAQ sections ("Esercizi di matematica scuola primaria online gratis: quiz, tabelline e problemi") — fine for classic SEO, suboptimal for AI-answer-engine extraction which favors literal question headings.
- /matematica's answer block is short (85 words) relative to the 134-167 sweet spot; the other 7 subject pages should be checked for the same gap.
- No visible "last verified" or source citation on the 9.879-question stat beyond the llms.txt copy — a dated inline citation on-page would strengthen trust signals for AI summarizers pulling numbers.

## Brand Mention Analysis

| Signal | Status | Note |
|---|---|---|
| Wikipedia entity | Absent | Expected for a site launched April 2026; no near-term action possible |
| Reddit presence | Absent | No mentions found (Bing site-search, 2026-08-25) |
| YouTube mentions | Absent | Strongest AI-citation correlator (~0.737) per GEO research — biggest realistic growth lever once content/marketing matures |
| LinkedIn | Not checked directly, no `sameAs` link present | — |
| GitHub | Present | `EducationalOrganization.sameAs` → `github.com/mattiaboero/lascuolaamica`, public repo, MIT license, confirms entity is real and maintained |
| Domain Rating / backlinks | Not assessed (weak correlator anyway, ~0.266) | — |

Authorship/E-E-A-T: `chi-siamo` page carries `AboutPage` schema with `author: Person (Mattia Boero)`, `datePublished`/`dateModified`. This is a legitimate, correctly-marked single-author signal, but the Person entity itself has no `sameAs` (no LinkedIn/personal site link), so there's no way for an AI system to cross-verify who "Mattia Boero" is beyond this one domain. Given the near-total absence of Wikipedia/Reddit/YouTube signals, Authority & Brand is the weakest dimension and is expected to stay weak until the site accumulates third-party mentions — not a quick technical fix.

## Platform-Specific GEO Scores

| Platform | Crawler used | Score | Basis |
|---|---|---|---|
| Google AI Overviews | Googlebot (allowed) | 55/100 | Good schema + SSR content reachable; limited by weak backlink/entity maturity |
| Bing Copilot | Bingbot (allowed) | 55/100 | Same reachability as Google; Bing weighs Wikipedia/entity graph, which is currently empty |
| ChatGPT (browsing + training) | GPTBot / OAI-SearchBot (**blocked**) | 10/100 | Cannot fetch the site at all right now — score reflects only what may be indexed via other means (e.g. Bing-backed search) until the Cloudflare block is lifted |
| Perplexity | PerplexityBot (**blocked**) | 10/100 | Same as above |

## Top 5 Highest-Impact Changes

1. **Unblock GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot at the Cloudflare edge.** Effort: trivial (1 dashboard toggle / WAF rule, no deploy). Impact: critical — this is the only reason ChatGPT/Perplexity can't cite the site at all today.
2. **Verify `FAQPage` schema + `<details>/<summary>` Q&A exists on all 8 subject pages, not just `/breakout`.** Effort: low (breakout gives a ready template to copy). Impact: high — FAQ blocks are the most reliably-extractable citation unit for AI answer engines.
3. **Extend the shortest `.seo-static` blocks (e.g. /matematica at 85 words) toward the 134-167 word range with one more direct, self-contained sentence.** Effort: low, content-only. Impact: medium — brings under-length subject pages in line with /breakout and home, which are already well-sized.
4. **Rephrase non-FAQ H2s as literal questions** (e.g. "Esercizi di matematica scuola primaria online gratis" → "Quali esercizi di matematica trovi per la scuola primaria?"). Effort: low. Impact: medium — question-form headings are a directly-cited GEO signal independent of schema.
5. **Add a `sameAs` (LinkedIn or personal site) to the `Person` author entity on chi-siamo**, and pursue one YouTube asset (even a short gameplay demo of Cervellino Spacca-Muri) — YouTube mentions are the single strongest brand-citation correlator in GEO research (~0.737). Effort: medium (content production, not a code change). Impact: medium-high over time; won't move the needle this week but is the highest-leverage Authority fix available.

## Note on scope
This audit did not have DataForSEO MCP tools available (`ai_optimization_chat_gpt_scraper`, `ai_opt_llm_ment_search`); platform scores above are estimated from crawler-access + on-page signals, not live LLM-citation testing.
