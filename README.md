# Urban Tadka — restaurant website redesign concept

A complete, production-shaped redesign of **Urban Tadka** (1800 Market Place Blvd, Suite #190,
Irving, TX 75063 — North Indian).

> **Status: unapproved design concept, not published.**
> We do not own the restaurant, its name, its logo, its menu copy or its photographs. This
> build exists for the owner to review. It is deliberately **not indexed** — see
> [Going live](#going-live) — and it must not be presented as approved by Urban Tadka.

---

## Quick start

```bash
npm install        # install dependencies (Astro + self-hosted fonts)
npm run dev        # dev server on http://localhost:3000
npm run build      # static output into dist/
npm run preview    # serve the built site on http://localhost:3000
npm run verify     # run the quality gate against dist/ (run after build)
```

Requirements: **Node 18.17+ or 20.3+** (developed on Node 24) and, only for the menu migration
tool, **Python 3**.

---

## What is real and what is a placeholder

This is the part worth reading before showing the site to anyone.

### Real, and taken from the restaurant's own published information

| What | Where it comes from |
|---|---|
| All 157 dishes, their descriptions and prices | Transcribed verbatim from the restaurant's own menu page by `tools/parse-legacy-menu.py` |
| Name, address, phone | The restaurant's site, and identical on every public listing |
| Opening hours | The restaurant's own Contact page |
| Cuisine description, the Punjab region list, the meaning of "tadka" | The restaurant's own About page |
| Catering existing as a service | The restaurant's own homepage ("LUNCH . DINNER . CATERING") |
| Facebook page | Publicly indexed; ownership unconfirmed |
| Ordering platforms | Grubhub (verified live) and Uber Eats (publicly indexed) |

### Deliberately absent

- **No photographs.** Every image position is a labelled placeholder. The two photos on the
  restaurant's current site appear to be generic stock (a stock chef holding a salad is captioned
  "Catering Services"), so reusing them would misrepresent the food. AI-generated food imagery
  would be worse. Reveal the shot needed by reading each placeholder's caption — the gallery page
  doubles as a photography brief.
- **No logo artwork.** The header uses a typographic wordmark. We hold no written permission to
  redistribute the restaurant's logo. Drop an authorised SVG in and it switches over:
  `siteConfig.brand.logo.src`.
- **No dietary or allergen labels.** The source menu states none. Marking a dish vegetarian,
  vegan, halal, gluten-free or nut-free without written confirmation could affect someone's
  health, so the site shows none and says why.
- **No reviews, ratings, awards, statistics, founding story or testimonials.** None are published
  by the restaurant, so none appear.
- **No working contact form.** The site has no server and no verified email address. Rather than
  ship a form that silently does nothing, the pages give working phone and directions actions and
  explain exactly what is needed to activate a form.

### Flagged in place, with visible annotations

Anything unconfirmed renders a `<ConceptNote>` ("For the owner") rather than passing as settled
fact. The two big ones are opening hours (three conflicting versions exist) and prices (published
in 2019). See [`docs/03-unverified-details.md`](docs/03-unverified-details.md).

---

## Project structure

```
src/
  config/site.js          ← ALL client-specific content lives here
  data/menu.json          ← the real menu, single source of truth
  lib/menu.js             ← menu access helpers used by every page
  layouts/MainLayout.astro
  components/             ← reusable across any restaurant
    BaseHead · Header · Footer · ActionBar · Button · Icon
    SectionHeading · DishCard · MenuCategory · GalleryGrid
    PhotoPlaceholder · ConceptNote · MapEmbed · StructuredData
  pages/
    index · menu · about · gallery · visit · catering · privacy · 404
    robots.txt.js · sitemap.xml.js   ← generated from config
  styles/
    tokens.css            ← design tokens (structure)
    base.css              ← reset, focus, motion, print
    components.css        ← shared primitives
public/
  favicon.svg             ← original mark, not the restaurant's logo
tools/
  parse-legacy-menu.py    ← one-off legacy menu → JSON migration
  verify-build.py         ← quality gate (stdlib only)
docs/
  01-website-audit.md  02-brand-direction.md
  03-unverified-details.md  04-qa-results.md
audit/                    ← local mirror of the old site (gitignored)
```

### Stack, and why

**Astro**, static output. Reasons, in order:

1. The menu is the client's most-edited content. It lives in one JSON file and renders through one
   component, so a price change is a single edit in a single place instead of a hunt through 157
   inline `<span>`s.
2. Shared header/nav/footer come from one layout, so pages cannot drift apart — the restaurant's
   current site links "About us" to `#` on one page and to `about.html` on another.
3. Output is plain HTML/CSS with **zero runtime dependencies**, so it deploys to the restaurant's
   existing Apache/PHP host or any static host. No Node is needed in production.
4. A React/Vue SPA would hurt SEO for a local restaurant and add dependencies for no gain.

Fonts are **self-hosted** from npm (Fontsource). There is no Google Fonts request, no analytics,
no advertising pixel and no third-party script on the critical path.

---

## Reusing this for another restaurant

The layout, components and styles contain nothing Urban-Tadka-specific. To retheme:

1. **Content and branding** → edit `src/config/site.js` (name, colours, contact, hours, social,
   ordering, navigation, featured dishes, SEO defaults, indexing gate).
2. **Menu** → replace `src/data/menu.json` with the new restaurant's menu in the same shape, or
   point the parser at their page and adjust its `CATEGORY_SLUGS` map.
3. **Photography** → replace `<PhotoPlaceholder>` with `<img>` at the same positions. Aspect ratios
   are already defined, so layouts do not shift.
4. **Logo** → set `siteConfig.brand.logo.src`.
5. `src/styles/` needs no changes: brand colours are injected as CSS custom properties at build
   time from the config.

Note on the repository licence: this repo was created with a **CC0 1.0** `LICENSE` file, which
dedicates the work in it to the public domain. For a client-services repository that is probably
not what you want, and the brief for this build explicitly said not to apply an open-source licence
to the whole project. **Decide the licence deliberately** (private/proprietary, or a services
agreement) rather than inheriting CC0. No licence was added or changed by this build.

Two related items that also need a deliberate decision rather than a default:

- **Repository visibility.** This repo holds a client's brand direction, pricing data and an audit
  of their current site. Keep it private unless there is a reason not to.
- **Ownership claims.** Do not assert exclusive copyright over everything here without review:
  the code was machine-assisted, the fonts and Typefaces are third-party (SIL OFL 1.1), and the
  menu content, restaurant name and any future photographs belong to the client. Client rights
  should be set out in the written agreement, not implied by a repository licence file.

---

## Accessibility

Target: **WCAG 2.2 AA** for the parts we control. This is a target, not a certification, and it is
not claimed as one.

- Palette contrast was **computed, not eyeballed**. Brand gold `#FFCC29` measures 1.51:1 on white,
  so it is used as a surface/accent only and never as text on light backgrounds — the most common
  failure mode in warm-palette redesigns.
- One `<h1>` per page, no skipped heading levels, `<header>/<nav>/<main>/<footer>` landmarks.
- Skip-to-content link is the first focusable element.
- Visible `:focus-visible` ring on every control; never removed.
- Mobile navigation: labelled button (not a bare icon), `aria-expanded`, Esc to close, focus moved
  into the panel on open and returned to the toggle on close, background scroll locked.
- Menu filtering and the gallery lightbox are **keyboard operable** and built on native
  `<button>`, `<dialog>` and `<details>` — no custom reimplementation of platform behaviour.
- `prefers-reduced-motion` disables transitions and smooth scrolling.
- The gallery lightbox uses native `<dialog>`: Esc closes it, focus is restored to the tile that
  opened it, and Left/Right move between images.

Automated checks are reported in [`docs/04-qa-results.md`](docs/04-qa-results.md). A manual
screen-reader pass and real-device testing have **not** been run and are listed there as pending.

---

## Performance

Measured on the actual build output:

| Metric | Value |
|---|---|
| Homepage HTML | 62 KB raw → **9.4 KB gzip** |
| Menu page HTML (157 dishes) | 120 KB raw → **13 KB gzip** |
| CSS (global) | 20 KB raw → **4.7 KB gzip** |
| JavaScript shipped | **0 KB** — Astro inlines the small scripts needed per page |
| Fonts actually downloaded | ~128 KB (3 latin subsets) |
| Images | **0 KB** — none are shipped |
| Homepage first load | **~142 KB** |
| Build time | < 1 second |

Unused font subsets (Cyrillic, Greek, Vietnamese) ship in `dist/` but are never downloaded: each
`@font-face` carries a `unicode-range`, so a browser fetches only the Latin range an English page
actually uses. `font-display: swap` means text paints immediately.

The restaurant's current site, by comparison, loads a 546 KB decorative PNG and a 633 KB
background PNG before any content.

---

## Going live

Before this can be published, in order:

1. **Owner authorisation.** Written permission to use the restaurant's name, logo, menu and
   photographs. Without it, this stays a private concept.
2. **Set the real domain** in `src/config/site.js` → `deployment.siteUrl`. It is currently a
   placeholder (`https://urban-tadka-concept.example`), which is why canonical URLs and the
   sitemap point there.
3. **Verify the flagged facts** — hours, prices, ordering links, social accounts. See
   `docs/03-unverified-details.md`.
4. **Re-run the gate:** `npm run build && npm run verify`.
5. **Flip the indexing switch** — `deployment.allowIndexing: true`. This single flag changes both
   `robots.txt` and every page's `robots` meta tag together, so they can never disagree. Until
   then the site ships `noindex, nofollow` and a disallowing robots file, because a concept must
   not outrank the client's live site.
6. **Serve over HTTPS.** The restaurant's current host serves a certificate for
   `ny201.whpservers.com` rather than their own domain, so `https://` currently produces a browser
   security warning. Any host used for this build must have a valid certificate for the real
   domain with an HTTP → HTTPS redirect.

### Deploying

The build is static, so anything that serves files works.

```bash
npm run build          # → dist/
```

- **Any static host** (Cloudflare Pages, Netlify, GitHub Pages, S3): publish `dist/`.
- **The restaurant's existing Apache/PHP host:** upload the *contents* of `dist/` to the web root.
  Keep directory URLs working (`/menu/` → `/menu/index.html`) and configure gzip/brotli plus long
  cache lifetimes for `/_astro/*`.
- Cache headers worth setting: `/_astro/*` immutable for a year (filenames are content-hashed),
  HTML short-lived.

---

## Testing

```bash
npm run build && npm run verify
```

`tools/verify-build.py` is a dependency-free quality gate. It fails the build if any of these break:

- internal links or in-page anchors point at nothing
- `href="#"`, empty `href`, or a form with no action (dead controls)
- a page lacks exactly one `<h1>`, or heading levels skip
- titles or meta descriptions are missing or duplicated
- canonical, robots, Open Graph or JSON-LD are missing or malformed
- an `<img>` has no `alt`, or a `<button>` has no accessible name
- `target="_blank"` without `rel="noopener"`
- brand tokens are missing or were injected at the wrong specificity (which would silently break
  re-theming from config)
- placeholder text such as "TODO" or "lorem ipsum" reaches the output
- the sitemap does not match the pages actually built

Exit code is `1` on any failure, so it drops straight into CI.

---

## Roadmap / not yet done

- Social content calendar and short-form video shot lists (was Phase 4 of the brief).
- A working enquiry form — needs an approved destination address, and brings privacy obligations
  (see `/privacy/`).
- Real photography to replace the placeholders.
- Manual screen-reader and real-device passes.
