# Urban Tadka — Proposed Brand & Design Direction (Phase 2)

**Status: PROPOSAL — awaiting approval.** No implementation decisions have been made beyond this document.

---

## 1. The strategic idea in one line

**Keep the gold-and-crimson identity Urban Tadka already owns, and spend the redesign budget
on clarity, real food, and working next steps — not on a new look.**

Most restaurant redesigns fail because they discard a recognisable mark in favour of a trend.
Urban Tadka has a distinctive, well-made logo (a steel spice bowl with a mirrored "Я" and a
script "Tadka") and a coherent warm palette. The problems are in delivery — HTTPS, mobile,
menu legibility, dead links — not in the brand. So the identity stays; the execution changes.

### Why this isn't generic AI restaurant design

- No purple gradient. The palette is sampled from the restaurant's own logo (§2).
- No "Experience Excellence" filler. Headlines carry real information: the cuisine,
  the neighbourhood, the dish.
- No invented awards, counters, reviews, or statistics. Every fact on the site is either
  verifiable today or labelled as pending owner confirmation.
- No emoji as interface icons, no cursor effects, no scroll-jacking, no pill-shaped
  button soup, no newsletter pop-up, no countdown timer.
- **No AI-generated imagery, and specifically no AI-generated food.** Per the brief, food
  photography is supplied by the restaurant later. Until then, image slots render as
  clearly-labelled neutral placeholders — never as generated food, and never as stock
  standing in for a dish.
- No cultural stereotyping: no henna-pattern wallpaper, no "ethnic" display font, no
  mandala clip-art. The specificity comes from the food and the spices, which are real.

---

## 2. Colour palette

Every hex below was read out of the restaurant's own `Logo.png` (405×149, exact-colour
histogram) or from the existing `style.css`. Contrast ratios were computed, not estimated.

### Sampled from the logo

| Role | Hex | Origin | Verified use |
|---|---|---|---|
| Brand gold | `#FFCC29` | logo, dominant colour (3,029 px) | Accent, rules, dark-background highlights |
| Brand crimson | `#BF383E` | logo "URBAN" red (1,289 px) | Primary buttons, links |
| Charcoal | `#373435` | logo outlines + tagline bar (3,319 px) | Headings, dark surfaces |
| Steel grey | `#BDBFC1` / `#E6E7E8` | the logo's spice bowl | Dividers, secondary surfaces |
| Existing maroon | `#890707` | current CSS, headings | Replaced by `#7A1418` for consistency |
| Existing menu gold | `#EBB249` | current CSS, menu headings | Replaced by `#FFCC29` |
| Existing CTA red | `#E70034` | current CSS, "To Go Menu" button | Replaced by `#BF383E` |

### Proposed design tokens

| Token | Hex | Purpose | Contrast evidence |
|---|---|---|---|
| `--ink` | `#373435` | Body and heading text on light | 9.48:1 on cream ✅ |
| `--ink-soft` | `#6B6560` | Secondary text, captions | ≥4.5:1 on cream ✅ |
| `--paper` | `#FBF8F3` | Page background (warm off-white) | — |
| `--paper-warm` | `#F3EDE3` | Alternating section bands, cards | — |
| `--crimson` | `#BF383E` | Primary action, active nav | white on it 5.45:1 ✅ |
| `--oxblood` | `#7A1418` | Headlines, hero overlay, dark CTA hover | 10.82:1 on white ✅ |
| `--gold` | `#FFCC29` | Accent underline, badges, dividers | 8.16:1 with charcoal ✅ |
| `--night` | `#1C1917` | Footer, hero scrim | 17.49:1 with white ✅ |
| `--line` | `#E4DED2` | Card and input borders | — |
| `--focus` | `#0B5FFF` | Focus rings only | ≥3:1 on every surface ✅ |

**Hard rule:** brand gold `#FFCC29` is **never** used for text on a light background — it
measures 1.51:1 on white. It is a surface and accent colour only (dark text on gold, or gold
on charcoal). This single rule prevents the most common failure of warm-palette redesigns.

**Print/brand note:** `#890707` and `#E70034` from the old CSS are retained in the brand
record as "legacy approximations" of the logo's crimson, so business cards and signage don't
drift. The website standardises on the sampled values.

---

## 3. Typography

**Problem to solve:** the current site requests `Papyrus`, `SnellRoundhand BoldScript`,
`Rockwell`, `Myriad Pro`, `Arrus Blk BT`, `Brush Script Std` and `AR BERKLEY`. None are
web fonts. Rendering therefore differs wildly by device — and several
(Myriad Pro, Rockwell, Arrus Blk BT, Helvetica LT) are **commercial licences we must not
self-host or embed**. The current site gets away with it only because it never serves them;
it just names them and hopes.

**Proposal: two open-licensed families, self-hosted.**

| Role | Typeface | Licence | Notes |
|---|---|---|---|
| Display / headings | **Fraunces** (variable) | SIL OFL 1.1 | Warm, high-contrast serif with real character; contemporary rather than "ethnic décor". Weights 400–700, `opsz` axis used for large sizes. |
| Body / UI | **Inter** (variable) | SIL OFL 1.1 | Neutral, superb at small sizes and on mobile; complete numeric coverage for prices. |
| Accent (optional) | none | — | The script in the logo stays **inside the logo image**. We do not load a decorative script font — it's the usual route into stereotype and it slows the page. |

**Licensing actions required:** SIL OFL permits commercial use and self-hosting. Font files
must ship with their `OFL.txt` and reserved font names must not be used in modified versions.
We will **self-host** the WOFF2 files rather than call Google Fonts — that removes a
third-party request (a privacy and performance win, see Phase 7) and removes an external
dependency. Subset to Latin + the punctuation actually used, subset with `font-display: swap`.

**Type scale** (fluid, `clamp()`):

| Token | Mobile | Desktop | Use |
|---|---|---|---|
| `--fs-hero` | 2.25rem | 3.75rem | Hero headline only |
| `--fs-h1` | 2rem | 2.75rem | Page titles |
| `--fs-h2` | 1.5rem | 2rem | Section titles |
| `--fs-h3` | 1.1875rem | 1.375rem | Card / dish names |
| `--fs-body` | 1rem (16px floor) | 1.0625rem | Body copy |
| `--fs-sm` | 0.875rem | 0.875rem | Captions, legal |

Line height 1.6 for body, 1.15–1.2 for display. Measure capped at **68ch**. No 12 px body text.

---

## 4. Buttons

Three levels only. Radius **6 px** — deliberately not pill-shaped.

| Level | Default | Hover | Active | Focus-visible |
|---|---|---|---|---|
| Primary | crimson `#BF383E` fill, white text | `#A32E34` | `#8E272D` | 3 px `--focus` ring, 2 px offset |
| Secondary | transparent, 1.5 px `#BF383E` border, crimson text | crimson 8% tint fill | 14% tint | same ring |
| Tertiary | text + underline, `--oxblood` | underline thickens | — | same ring |

Rules: height **≥44 px**, horizontal padding 20 px (28 px for primary), label is a verb
("Order pickup", "Get directions", "Call the restaurant") — never "Click here" or "Learn more"
on its own. Disabled state uses `--ink-soft` with `aria-disabled`, never colour alone.
No gradients, no shadows on buttons, no icon-plus-text collisions at 320 px.

---

## 5. Cards

Used for dishes, gallery items, and info blocks.

- Surface `--paper-warm`, 1 px `--line` border, radius **10 px**, no drop shadow by default.
- Hover (pointer devices only): border → `#D8CFBE`, 1 px lift via `translateY(-2px)`,
  `prefers-reduced-motion` disables the transform.
- Dish card anatomy: image (4:3) → dish name (`--fs-h3`) → one-line description →
  price right-aligned on its own baseline (`font-variant-numeric: tabular-nums`) →
  optional verified dietary/spice chip.
- Image and text have equal weight: no full-bleed image with a tiny caption underneath.
- Card grids: 1 up <600 px, 2 up 600–1023 px, 3 up ≥1024 px.
- Cards are never the only affordance — every card's whole surface is a real link or
  contains an explicit action, and never both a card link and a nested button.

---

## 6. Spacing, layout and grid

Base unit **8 px**; allowed steps: `4, 8, 12, 16, 24, 32, 48, 64, 96, 128`.
Section vertical padding: **64 px mobile / 96 px desktop**. Card grid gap: 16 px mobile /
24 px desktop. Content max-width **1200 px**; text columns clamped to 68ch inside it.
Horizontal page padding: 20 px mobile / 32 px tablet / 48 px desktop.

Whitespace is the primary tool for "premium but approachable" — not gold ornament. The
current site's density (a 982 px box with inline `<br />` padding hacks) is the thing to fix.

---

## 7. Imagery

1. **Only real, permissioned photography.** No AI food, no stock standing in for a dish,
   no "representative image" captions.
2. **Placeholder policy while assets are pending:** neutral `--paper-warm` block with a 1 px
   `--line` border, centred caption "Photo pending — Urban Tadka to supply". Visually
   intentional, obviously empty, impossible to mistake for a dish.
3. **Treatment:** consistent 4:3 (dishes) and 16:9 (hero, room) crops, no heavy filters,
   one shared grade so the gallery looks like one restaurant. Food shots are the hero —
   never desaturated, never behind a 70% black scrim.
4. **Delivery:** AVIF → WebP → JPEG fallback, `srcset` with 400/800/1200/1600 px widths,
   explicit `width`/`height` on every `<img>` to prevent layout shift,
   `loading="lazy"` below the fold, hero image preloaded with `fetchpriority="high"`.
   Target: hero under 150 KB, dish images under 80 KB.
5. **Alt text:** written per image, describing the food and the scene ("Lamb curry with
   basmati rice in a steel bowl, garnished with coriander"), not keyword stuffing, not
   "image of". Decorative rules and textures get `alt=""`.
6. **Licensing:** every supplied photo is logged with its source and the owner's written
   permission before publication; EXIF is stripped on export.

---

## 8. Navigation

**Desktop:** sticky header on `--paper` with a 1 px bottom rule once scrolled. Logo left
(link to home, with `aria-label="Urban Tadka — home"`), primary nav right, then two
actions: "Call" (with the number visible) and "Order" (primary button). Max 5 nav items.
Current page marked with `aria-current="page"` and a gold 2 px underline — not by colour alone.

**Mobile:** logo + "Order" button + a labelled menu button ("Menu", not a bare icon).
Tapping opens a full-height panel: focus moves into it, `Esc` closes it, background scroll
locks, focus is trapped, and closing returns focus to the button. Links are ≥48 px tall with
16 px text. Nav items and their order:

`Home · Menu · About · Gallery · Catering · Visit Us`

**Persistent mobile action bar** (the single highest-conversion element on a restaurant site):
a fixed bottom bar on screens under 768 px with **Call** and **Directions**. Dismissible, and
it respects `env(safe-area-inset-bottom)`.

**Not proposed:** mega menus, parallax headers, hero video autoplay, animated hamburgers.

---

## 9. Mobile design rules

- Single column below 600 px, no horizontal scrolling at 320 px.
- Body text 16 px minimum — also prevents iOS input zoom.
- Every tap target ≥44×44 px with ≥8 px separation.
- Phone number is always a `tel:` link; the address is always a Maps directions link.
- Sticky header stays ≤64 px tall so it doesn't eat the viewport.
- Tables (allergens, catering packages) become stacked labelled rows, never a sideways scroller.
- Menu categories are reachable without JavaScript (details/summary, or anchor-linked sections).

---

## 10. Icon style

- One coherent set: **Lucide** (ISC licence — permissive, commercial-safe), stroke-based,
  1.75 px stroke, 20 px inline / 24 px standalone, `currentColor`.
- Icons **always** paired with a text label; never an icon-only control except the menu
  toggle, which carries an accessible name.
- **No emoji in the interface.** No emoji as bullet points, no emoji in headings.
- Purely decorative icons get `aria-hidden="true"`.
- Photos are never used as icons.

---

## 11. Accessibility commitments

Target **WCAG 2.2 AA** for the parts we control — stated as a target, not a certification.
We will not claim the site is "fully accessible" or "compliant"; the restaurant's third-party
embeds and eventual content can change that.

- Palette pre-verified for contrast (§2); no gold text on light surfaces.
- `:focus-visible` ring on every interactive element, never removed.
- One `<h1>` per page, no skipped heading levels, `<header>/<nav>/<main>/<footer>` landmarks.
- Skip-to-content link as the first focusable element.
- Accordions and filters built on native `<details>`/`<button>` with `aria-expanded` and
  `aria-controls`, fully keyboard operable (Enter/Space/arrows as appropriate).
- `prefers-reduced-motion` honoured — no scroll animations, no autoplay.
- `lang="en"` on `<html>`; `tel:` links announce the number; form fields have real
  `<label>`s, `autocomplete`, and errors linked with `aria-describedby`.
- Images: meaningful `alt`, decorative `alt=""`.
- No information conveyed by colour alone (spice level = icon + text label).
- Testing: axe DevTools + Lighthouse + manual keyboard pass per page, logged in Phase 8.

---

## 12. Proposed site structure and user journeys

Six pages, each with one job. Nothing is proposed that the business cannot verify.

```
/                 Home — orient, appetise, route to the next step
/menu/            Menu — find a dish and its price in seconds
/about/           About — the cuisine and the restaurant, verified facts only
/gallery/         Gallery — prove the room and the food are real
/catering/        Catering — only if the owner confirms service; enquiry path
/visit/           Visit Us — hours, address, directions, phone, parking
404               Helpful: hours, phone, and links (never a dead end)
```

**Journeys we are designing for**

| Visitor | Intent | Path | Success |
|---|---|---|---|
| Hungry, on a phone, nearby | "Where do I eat now?" | Home → Menu → Call / Order | Opens dialer or an ordering app |
| Deciding for tonight | "Is this good, and what's on the menu?" | Home → Gallery → Menu | Menu category viewed, directions tapped |
| Planning a family or group meal | "Can they seat 8? Is it veg-friendly?" | Home → Visit Us → Call | Call placed |
| Catering / office organiser | "Can they cater 40 people?" | Home → Catering → Enquiry | Enquiry submitted or call made |
| Searching "Indian restaurant Irving" | Needs hours + address fast | Visit Us (from SERP) | Directions tapped |

**Homepage component plan** (top to bottom)

1. Sticky header — logo, nav, Call, Order
2. Hero — one real photograph, headline naming the cuisine and city, one-line support,
   primary "View the menu" + secondary "Get directions"
3. Quick facts strip — address, today's hours, phone (verified values only)
4. Featured dishes — 3 real dishes with real names and prices (or the photo placeholder)
5. Menu preview — category tiles linking into the menu page
6. Restaurant introduction — 2 short paragraphs, verified content only
7. Gallery preview — 4 images, link to full gallery
8. Visit us — map embed, directions button, hours, phone
9. Footer — contact, nav, verified social links, privacy, no dead links

Every section on that list answers a question a real customer has. Nothing is decorative.

---

## 13. Proposed technical approach (needs approval)

The repository is currently empty (a CC0 `LICENSE` and an initial commit only). Node 24 and
npm 11 are available. So this is a greenfield build and the stack is a genuine choice.

**Recommendation: a small static site generator (Eleventy), outputting plain HTML/CSS/JS.**

Rationale:
- The menu is the client's most-edited content. With the menu held in one JSON data file and
  a template, a price change is **one line in one file**, not a hunt through 157 inline spans.
  This directly addresses audit finding #17.
- Shared header/footer/nav come from one layout, so the four pages can never drift apart again
  (today `about.html` links "About us" to `#` while `index.html` links it correctly).
- Output is **plain static HTML** — deployable on the restaurant's existing Apache/PHP host,
  or on any static host, with no Node runtime required in production.
- It gives real component reuse without shipping a client-side framework, per Phase 6's
  "use React only when it provides a real advantage". A React SPA would hurt SEO here and
  add dependencies for no benefit.
- Dependencies stay in `devDependencies`; the delivered site has none.

**Alternative if the owner prefers zero build tooling:** hand-written static HTML pages with a
shared CSS file. Slightly more duplication when the menu changes, but no Node at all. I would
still recommend Eleventy, but this is the owner's call.

Either way: no CMS, no database, no analytics beyond a privacy-respecting option the owner
approves, and no third-party scripts on the critical path.

**Rejected:** Next.js/React (SSR complexity, no benefit here), WordPress (ongoing maintenance
and security surface the restaurant doesn't need for six pages), a page builder (lock-in),
Bootstrap/Tailwind CDN (unused CSS, external request).

---

## 14. Content rules we will enforce

- **Nothing invented.** No award, no rating, no "best in Dallas", no customer count, no
  founder biography, no founding date, no ingredient claim, no dietary claim.
- **Unverified = absent.** If the owner hasn't confirmed it, it doesn't ship. The
  placeholder is honest emptiness, not plausible filler.
- **Dietary and allergen labels require written confirmation.** We will not mark a dish
  vegetarian, vegan, halal, gluten-free or nut-free without the owner's sign-off, and the
  page will carry a "confirm with the restaurant" note because kitchens and suppliers change.
- **Hours, address, phone and prices come from one approved source** and must match Google,
  Yelp and the delivery platforms.
- No fake urgency, no hidden fees, no pre-ticked boxes, no dark patterns.

---

## 15. What I need approved to proceed

1. **Brand direction** — palette, type pairing, button/card style, navigation model (§2–§9).
2. **Site structure** — the six pages and the journeys in §12.
3. **Stack** — Eleventy static build vs. hand-written HTML (§13).
4. **Placeholder policy** — neutral "photo pending" blocks until the restaurant supplies
   real photography (§7). Confirm this is acceptable for the concept presentation.
5. **Owner verification** — the 14 questions in `docs/01-website-audit.md` §7, at minimum
   current hours, current prices, and which social accounts are official.

Once 1–4 are approved I will build the phase order in the brief (structure → brand tokens →
components → pages → menu data → social plan → QA), pausing before anything that depends on
unverified business facts.
