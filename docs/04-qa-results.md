# Quality-assurance results

Everything below was **actually run** on the build in this repository. Nothing is claimed as
passed that was not executed. Where a check could not be run in this environment, it is listed
in §4 as not run, with the reason.

## 1. Environment

| | |
|---|---|
| Node | 24.21.0 |
| npm | 11.19.0 |
| Astro | 7.4.0 |
| Python (build tools only) | 3.12.3 |
| Dependencies | 188 packages, **0 vulnerabilities** (`npm install` output) |
| Runtime dependencies shipped to the browser | **none** |

## 2. Commands run, and their results

### `npm run check` — the full gate — **exit 0**

Runs typecheck → build → build verification → contrast verification.

| Step | Command | Result |
|---|---|---|
| Type check | `astro check` (strict preset) | **0 errors, 0 warnings, 0 hints** across 29 files |
| Build | `astro build` | **8 pages + robots.txt + sitemap.xml**, exit 0, ~1.0 s |
| Build verification | `tools/verify-build.py` | **All checks passed**, exit 0 |
| Contrast verification | `tools/check-contrast.py` | **All 22 pairs pass WCAG 2.2 AA**, exit 0 |

### `tools/verify-build.py` — what it actually checks

Runs against `dist/`. Any failure exits 1.

| Check | Result |
|---|---|
| Every internal link resolves to a built file | pass |
| Every in-page anchor (`#order`, `#appetizers`, …) resolves to a real `id` | pass |
| No `href="#"` or empty `href` anywhere | pass |
| No `<form>` without an `action` | pass |
| Exactly one `<h1>` per page, no skipped heading levels | pass |
| Unique, non-empty `<title>` per page | pass (8 unique) |
| Unique, non-empty meta description per page | pass (8 unique) |
| Canonical URL present and absolute | pass |
| `robots` meta present and correct for a concept build | pass (`noindex, nofollow`) |
| Open Graph `og:title`, `og:description`, `og:url` | pass |
| JSON-LD parses | pass |
| Every `<img>` has an `alt` attribute | pass (0 images shipped by design) |
| Every `<button>` has an accessible name | pass |
| `target="_blank"` always paired with `rel="noopener"` | pass |
| Brand tokens injected **and** injected at a specificity that wins | pass |
| No `TODO` / `FIXME` / lorem ipsum in output | pass |
| No literal `undefined` / `null` rendered into text | pass |
| `sitemap.xml` matches the pages actually built | pass |

### `tools/check-contrast.py` — contrast audit

Reads the real token values from `src/styles/tokens.css`, so it fails if someone edits a colour.
22 pairs checked, plus 2 **negative controls** that must fail (proving the gate discriminates).

All 22 pass. The tightest margins:

| Pair | Ratio | Required |
|---|---|---|
| Caption text on warm bands | 4.93:1 | 4.5 |
| Control border on warm bands | 3.00:1 | 3.0 |
| Focus ring on light bands | 4.40:1 | 3.0 |
| Focus ring on dark surfaces | 11.59:1 | 3.0 |

Negative controls correctly rejected: brand gold as text on white (1.42:1) and the default blue
focus ring against the crimson CTA (1.06:1).

### HTTP-level checks against the built output

Served `dist/` and requested every route:

| Route | Status | Content-Type |
|---|---|---|
| `/` | 200 | text/html |
| `/menu/` | 200 | text/html |
| `/about/` | 200 | text/html |
| `/gallery/` | 200 | text/html |
| `/visit/` | 200 | text/html |
| `/catering/` | 200 | text/html |
| `/privacy/` | 200 | text/html |
| `/404.html` | 200 | text/html |
| `/robots.txt` | 200 | text/plain |
| `/sitemap.xml` | 200 | application/xml |
| `/favicon.svg` | 200 | image/svg+xml |

### Measured performance

| Metric | Measured |
|---|---|
| Homepage HTML | 62.3 KB raw → **9.4 KB gzip** |
| Menu page (157 dishes) | 120.4 KB raw → **13.1 KB gzip** |
| Gallery | 59.1 KB raw → 8.8 KB gzip |
| Visit | 40.5 KB raw → 7.5 KB gzip |
| Global CSS | 20.2 KB raw → **4.7 KB gzip** |
| JavaScript bundle | **none** — Astro inlines the small per-page scripts |
| Fonts downloaded by an English visitor | 3 latin subsets, **127.5 KB** (10 further subsets ship but are never fetched — each `@font-face` carries a `unicode-range`) |
| Homepage first load | **≈ 142 KB**, and zero images |
| Build time | < 1.1 s |

For comparison, the restaurant's current site loads a 546 KB decorative PNG and a 633 KB
background PNG before any content.

## 3. Defects found and fixed during this QA pass

These were caught by the checks, not by inspection — which is the point of having them.

| # | Defect | How it was caught | Impact if shipped |
|---|---|---|---|
| 1 | Brand tokens were injected **before** the stylesheet, so CSS fallbacks won the cascade | Manual verification of cascade order | Re-theming from `siteConfig` would silently do nothing — the entire client-configuration promise would be broken. Fixed with `:root:root`; now enforced by a check in `verify-build.py` |
| 2 | Blue focus ring on the crimson button measured **1.06:1** | `check-contrast.py` | Keyboard users would see essentially no focus indicator on the site's primary button. Fixed with surface-aware ring colours |
| 3 | Interactive borders measured **1.5–2.4:1**, below the 3:1 WCAG requires for control boundaries | `check-contrast.py` | Inputs, the nav toggle and menu chips would be hard to locate. Fixed with a dedicated `--line-control` token (3.30:1 on paper) |
| 4 | `display: flex` on `.menu-cat__empty` and `.map__placeholder` overrode the `hidden` attribute | Reasoning about the cascade while reviewing state handling | Two "hidden" elements would always be visible: a stray "no dishes match" message and a duplicate map placeholder. Fixed with a global `[hidden]` rule |
| 5 | `Icon` rendered multi-path icons as several separate `<svg>` elements | Reviewing the component after writing it | Every icon with more than one path (phone, clock, map pin, truck…) would render broken and misaligned |
| 6 | Menu search used a `<form>` with no `action` | `verify-build.py` (form-action check) | A submit control that does nothing without JavaScript. Replaced with `role="search"` on a container |
| 7 | Every dish description was duplicated into a `data-search` attribute | Reviewing the menu page's page weight | ~13 KB of redundant HTML on the menu page. Replaced with cached `textContent` in the filter |
| 8 | The verifier itself mapped `404.html` onto `/`, so the 404 page was never checked | Reviewing the verifier's own output ("8 pages built" vs 7 listed) | A whole page would have been silently unverified |
| 9 | 12 TypeScript errors under Astro's strict preset | `astro check` | Untyped component props and null handling; the reusable component layer would rot. All fixed with explicit `Props` interfaces |
| 10 | Typo in the gallery photography brief | Proofread while fixing the file | Visible copy error |

### Static responsive audit (320 px requirement)

Rendering could not be tested without a browser, so the stylesheets were audited for the two
things that actually cause horizontal scrolling.

| Check | Result |
|---|---|
| Any `width` / `min-width` in px large enough to exceed a 320 px viewport | **none** — the only fixed widths are 1 px and small icon circles (2.25–3.5 rem) |
| Content constraints | all `max-width` in `rem`/`var()`, which cap width and cannot cause overflow |
| `100vw` usage | one, on the gallery lightbox: `min(60rem, calc(100vw - 2rem))`. It is a top-layer `<dialog>`, outside document flow, with 2 rem of margin, so it cannot widen the page |
| Breakpoints | mobile-first at 34 / 40 / 48 / 60 / 64 rem — no desktop-only layout |
| Body text size | 16 px minimum; 14 px for secondary, 13 px for uppercase labels |
| Long unbreakable strings | the menu source URL uses `word-break: break-word`; print styles use `break-all` |

This is evidence about the CSS, not proof of rendered layout. A browser pass is still required
(item 1 under "Must fix before showing the owner").

## 4. Checks that were NOT run — stated as limitations, not passes

| Check | Why it could not be run |
|---|---|
| **Lighthouse / PageSpeed scores** | No browser or headless Chrome in this environment. The measured byte sizes and zero-JS/zero-image payload above are the substitute evidence. **Do not quote a Lighthouse score for this build until one is actually taken.** |
| **axe-core / automated accessibility audit** | Same reason. Contrast was verified numerically against token values from source; that is *not* the same as auditing rendered pixels. |
| **Rendered visual inspection** | No browser. Layouts are verified by reading the CSS and by the responsive rules in `src/styles/`, not by looking at them. **A human should view every page at 320, 375, 390, 430 px and desktop widths before this is shown as finished.** |
| **JavaScript runtime behaviour** | The scripts compile (the build and `astro check` would fail otherwise) and their markup hooks are present in the output, but they have not been *executed*: mobile nav open/close/focus handling, the menu filter, the gallery lightbox and the click-to-load map are **unverified at runtime**. |
| **Screen-reader testing** (VoiceOver, NVDA, TalkBack) | Requires a real device/screen reader. |
| **Real-device testing** (iOS Safari, Android Chrome) | No devices. iOS Safari is the browser most likely to surprise, particularly with `100vh`, `env(safe-area-inset-*)` and `<dialog>`. |
| **Browser console errors** | No browser. |
| **Cross-browser check** | Only the build output was inspected. |
| **Network-throttled testing** | No throttling harness available. |
| **Deployment / HTTPS** | Nothing is deployed. The `http → https` redirect and certificate requirements are documented in the README, not tested. |
| **The menu filter with JavaScript disabled** | Reasoned about (all 157 dishes are server-rendered, so the menu is fully readable without JS) but not verified in a JS-disabled browser. |

## 5. Remaining issues, prioritised

### Must fix before showing the owner

1. **View every page in a real browser** at the widths listed above. This is the single biggest
   gap: the code is verified, the rendering is not.
2. **Exercise the four interactive behaviours manually** — mobile nav (open, Esc, focus return,
   scroll lock), menu filter (type, clear, no-match state), gallery lightbox (open, arrows, Esc,
   focus return), map click-to-load.
3. **Screen-reader pass** on home, menu and visit.

### Should fix before launch

4. All details in [`docs/03-unverified-details.md`](03-unverified-details.md) — hours, prices,
   social accounts, ordering links.
5. **Replace the placeholder images.** Every current image position is an intentional placeholder.
6. **Set the real domain and flip `allowIndexing`.** Both are one-line changes in
   `src/config/site.js`, and doing only one of them leaves the concept either indexed or
   unlaunchable.
7. **Decide the repository licence.** The repo currently inherits a CC0 1.0 `LICENSE`, which may
   not suit client work.

### Worth considering

8. **Menu page weight.** 120 KB raw for 157 dishes. Fine gzipped (13 KB), but if the menu grows
   substantially, collapsible categories or pagination would help.
9. **Preload the two critical font files.** Would reduce the swap flash. Requires the hashed
   filenames, so it needs build-time wiring in `BaseHead`.
10. **Subset the fonts further.** 127 KB of 142 KB first-load is fonts. A Latin-only subset built
    with `fonttools` would cut this materially, at the cost of adding a build step.
11. **An `og:image`.** Not shipped because we have no photograph. Every social share currently
    renders without a preview image — worth solving once real photography exists.
12. **A working enquiry form**, once an approved address exists. See
    `docs/03-unverified-details.md` §3.
13. **Social content calendar and video shot lists** — the one deliverable from the original brief
    that has not been produced.
