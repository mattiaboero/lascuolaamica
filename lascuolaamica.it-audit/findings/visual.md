# Visual Audit — lascuolaamica.it (live production)

Date: 2026-08-25
Pages tested: `/` (home), `/matematica`, `/breakout`
Viewports: Desktop 1920x1080, Mobile 375x812 (DSF 2, `is_mobile`/`has_touch` for touch checks)
Tool: Playwright (Chromium headless)

## Overall visual score: 8.5 / 10

Warm, cohesive Wada-Sanzo palette, clear mascot branding, no horizontal
scroll anywhere, no broken layouts, reduced-motion toggle present. Two minor
deductions: subject-page mobile above-fold buries the primary CTA under
instructional copy, and a permanently fixed footer eats ~21% of the mobile
viewport.

## Screenshots
`/Users/mattiaboero/Library/Mobile Documents/com~apple~CloudDocs/cervellino/files/lascuolaamica.it-audit/screenshots/`
- `homepage-desktop.png`, `homepage-mobile.png`
- `matematica-desktop.png`, `matematica-mobile.png`
- `breakout-desktop-prestart.png`, `breakout-mobile-prestart.png` (setup screen, before "Inizia!")
- `breakout-desktop-ingame.png`, `breakout-mobile-ingame.png` (canvas actually rendering gameplay)

## Homepage (/)

**Desktop above-the-fold:** Excellent. H1 "La Scuola Amica", subtitle
"Scegli la tua materia e inizia a giocare!", trust badges (Gratis / Senza
registrazione / Offline / 9.800+ domande), a session-timer CTA ("Attiva 30
minuti"), and all 4 subject cards with their own CTAs (Gioca / Let's go /
Risolvi) are visible without scrolling on a 1920x1080 screen. Communicates
purpose within 3 seconds — pass.

**Mobile above-the-fold:** Hero card (owl mascot, H1, subtitle, trust
badges, timer CTA) fills the screen; the first game card ("Cervellino
Spacca-Muri") is only partially visible before the fixed bottom bar. Primary
CTA ("Attiva 30 minuti") is visible, subject cards require one scroll — this
is acceptable, the value prop and main action are both above the fold.

**Layout:** No overlap, no cut-off text, `scrollWidth === clientWidth` on
both viewports (no horizontal scroll).

## /matematica (subject page)

**Desktop above-the-fold:** Good — H1, subtitle, Audio/Classifica buttons,
instructions box, and start of the "Scegli la classe" grade-selector grid
are all visible in the first 1080px.

**Mobile above-the-fold — issue found:** The instructional text block
("Esercizi allineati al programma ministeriale…", 6 lines) consumes the
entire first viewport screen. The actual "Scegli la classe" buttons (the
real primary CTA to start playing) are **not visible without scrolling** on
a 375x812 phone. A first-time child visitor sees rules text before any
button to tap. Recommend shortening/collapsing the instructions on mobile
(e.g. behind a "?" info toggle) so a class-selector button is above the
fold, matching the homepage's better pattern.

## /breakout (Cervellino Spacca-Muri — Canvas 2D game)

**Pre-start screen (both viewports):** Renders correctly — title, mascot
brick icon, rules box, class selector, session timer, "Inizia!" button.
Note: at this stage the `<canvas>` exists in the DOM but is not laid out
(0x0 CSS box, fully transparent pixel buffer) — this is correct/expected,
since gameplay hasn't started yet, not a bug.

**In-game canvas — verified by actually clicking through class-select →
activate timer → "Inizia!":**
- **Desktop:** Canvas renders at 900x600, fills its container correctly.
  Brick wall (4 color rows), paddle, ball, and HUD (stars, lives ❤3, level
  ▶1, medals, countdown timer) all render with correct colors and no
  clipping. Confirmed non-blank via pixel sampling (`getImageData`).
- **Mobile:** Canvas backing store is 1800x1200 (2x DSF) but scales down to
  a responsive CSS size of 343x229px, fitting inside the 375px viewport
  with margin — same visual content as desktop, correctly proportioned, no
  distortion, no clipping, no horizontal scroll. Confirmed non-blank via
  pixel sampling.
- **Touch controls:** Dispatched synthetic `touchstart/touchmove/touchend`
  on the canvas (drag gesture) — no errors, no horizontal scroll introduced
  by the drag interaction. (Did not verify paddle pixel-position tracking
  frame-by-frame — out of scope per task instructions ("no need to test
  deeply"), but the canvas is listening for touch events and the page
  layout is stable under interaction.)

**Verdict: canvas renders correctly on both desktop and mobile — not
broken/blank.** This was the highest-risk item on the audit and it passes.

## Reduced-motion toggle

`data-motion="reduce"` / "riduci animazioni" toggle detected in the DOM on
all three pages tested. Normal (non-reduced) rendering looks correct on all
screenshots — no stuck/broken animation states observed at page-load.

## Color contrast (visual spot-check, target audience 7-11yo)

- White text on saturated teal/purple/blue/pink card backgrounds (hero,
  subject cards, HUD chips): strong contrast, easily readable — good for
  young readers.
- Dark navy text on light dashed instruction boxes: good contrast.
- Footer text (gray on white/cream): acceptable but the lowest-contrast
  text on the site; fine for secondary/legal links, not used for primary
  content.
- No thin/low-contrast text found blocking core gameplay or subject
  instructions.
- Not run through an automated WCAG contrast-ratio checker (axe/Lighthouse)
  in this pass — recommend a follow-up automated a11y contrast scan for
  precise ratios; visual spot-check found no red flags.

## Mobile responsiveness — issues found

1. **Fixed bottom footer bar (`position: fixed; bottom: 0`)** is present on
   every page and measures **169px tall on a 375x812 viewport — about 21%
   of the visible screen** permanently occupied by Privacy/Cookie/Info/
   Supporta links. This compounds the /matematica above-fold issue (less
   room for the class-selector buttons) and reduces usable game area on
   /breakout's setup screen (last "Classe 5ª" and time-activation button
   sit right at/behind the bar edge). Recommend: collapse this to a slim
   single-row bar, or make it a normal in-flow footer + a smaller sticky
   CTA if persistence is needed.
2. **Footer touch targets are 44px tall** (Privacy Policy, Cookie Policy,
   Info, Supporta il progetto) — just under the 48x48px recommended minimum
   for child users. Minor; increase to 48px.
3. No horizontal scroll detected on any of the 6 page/viewport
   combinations tested (`document.documentElement.scrollWidth ===
   clientWidth` confirmed programmatically for home, matematica, breakout
   × desktop/mobile, and again for breakout mid-drag).
4. Breakout canvas scales responsively and proportionally on mobile — no
   distortion, no overflow.

## Summary of issues by severity

- **Medium:** /matematica mobile buries the class-selector CTA below the
  fold behind a long instructions block.
- **Low:** global fixed footer consumes ~21% of the mobile viewport on
  every page, slightly compounding the above issue.
- **Low:** footer link touch targets are 44px, just under the 48px
  guideline.
- **Pass:** /breakout canvas renders correctly, non-blank, responsive, no
  horizontal scroll, on both desktop and mobile, both pre-game and in-game.
- **Pass:** reduced-motion toggle present and normal rendering unaffected.
- **Pass:** homepage above-the-fold communicates the offer clearly within
  3 seconds on both desktop and mobile.
