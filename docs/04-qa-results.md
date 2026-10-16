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
| 11 | `hours.schedule` marked Tuesday closed, but `hours.schema` declared it open — lunch 11:00–14:00 **and** inside the seven-day dinner block | Cross-checking the site's own structured data against the fourth hours source supplied in chat | The rendered JSON-LD told Google the restaurant opens on its one closing day — exactly the hours inconsistency the original audit ranked **High**, reproduced in the new build. Found in the *built* output, not the source. Fixed in `src/config/site.js` → `hours.schema` (schema.org has no "closed" marker, so a closed day is expressed by omission), with a comment tying it to `hours.schedule`. Verified in the rebuilt `dist/visit/index.html` (0 blocks declare Tuesday open, visible row still reads "Closed") and on the live dev server |
| 12 | The new photo-record verifier matched **any** table row beginning with a record id, so the 2-column website-description table overwrote the rows from the 12-column record table | Running the new gate: it reported all four records as having drifted from the authored document | Every parity check in the gate would have compared against the wrong cells, and it would have failed on data that was correct — a gate that cries wolf gets switched off. Fixed by locating the record table by its header rather than by the id prefix |
| 13 | The record table was assumed to have 13 columns; it has 12 (the 13-field schema has the website description split into its own table) | The same gate run, immediately after fixing 12 | A permanent false failure. Corrected by counting the columns in the file rather than by relaxing the check |

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

---

## 6. Photograph-review page (`/review/`) — verification of this addition

A page added so the dish identifications can be checked by someone who was not in the
conversation that produced them. Files: `src/pages/review.astro`, `src/data/photo-records.json`,
`tools/verify-photo-records.py`, and one entry in the sitemap's route list.

### What was run

| Check | Command | Result |
|---|---|---|
| Typecheck, build and all three gates | `npm run check` | **exit 0.** 9 pages built (was 8); `/review/` = 64.6 KB HTML plus a 4.1 KB page script; 0 errors, 0 warnings |
| Contrast gate | part of the above | all 21 token pairs pass, plus the composite lightbox-border check — 22 passing lines in the output, 0 failures; both negative controls still fail as designed |
| Photo-record gate | `python3 tools/verify-photo-records.py` | 4 records checked, 157 menu name/price pairs, all checks passed |
| The gate is discriminating | 7 deliberate faults injected into the catalogue, then restored | **exit 1 with 10 errors**, each naming the fault: an invented dish, a real dish at the wrong price, drift from the authored document, an undefined verification status, a summary the records contradict, a withheld photograph claimed as included, promotional alt text. Restored file re-checked clean |
| Built artifact | inspection of `dist/review/index.html` | all four record ids, the data hooks the script needs, both `NEEDS HUMAN REVIEW` records, menu names and prices, and the noindex meta are present; the batch id and date are passed to the script through the page rather than hardcoded; the page script is emitted as `/_astro/review.astro_astro_type_script_index_0_lang.*.js` (4.1 KB) and carries its storage key. (It was inlined when shorter — Astro switches to an external asset once the script crosses its inline threshold, so this is expected, not a regression.) |
| Served page | dev server, with the preview `Host` header | `/review/` **200 `text/html`**, 113,692 bytes, containing the record content; `/`, `/gallery/`, `/menu/` all 200 |
| Live deploy (preview) | `sites_deploy` against the Cloudflare preview environment, payload 30 files / 1 MB with no maps or secrets | **succeeded** — receipt `cf517f31`, serving `https://site-fe03b03cd9e449fcb4905b5454ba6cde.freebuff.page` (recorded in `deploy/site.json`) |
| Live checks on the public URL | curl probes of status codes, content markers and assets | `/`, `/review/` (record markers and noindex present), `/menu/`, `/gallery/`, `/visit/` all **200**; `/does-not-exist/` a real **404**, not an SPA fallback; the page script **200 `text/javascript`** |
| Host validation still on | dev server, `Host: evil.example.com` | **403** — the page was not made reachable by widening the allowlist |

### What was NOT verified

| Check | Why |
|---|---|
| **The review controls at runtime** | No browser. Saving to `localStorage`, restoring after a reload, the copy button, the file download and the reset button have **not been executed**. They compile and their markup hooks are present, which is not the same thing. |
| **Rendered layout of the new page** | No browser; verified by reading the CSS and by the responsive rules above, not by looking at it. |
| **Screen-reader behaviour of the decision fieldset** | Requires a screen reader. The radios, the fieldset legend and the note label are conventional, but "conventional" is a design argument, not a test. |
| **Print / PDF output** | No print styles were written for this page and none were tested. A reviewer who prints it will get the browser's default treatment. |

### Known limitations of this addition

| Limitation | Detail |
|---|---|
| **One batch at a time** | The page renders the **first** batch in `src/data/photo-records.json`. Later batches are validated by the gate but not displayed, so adding a batch means extending the page before it can be reviewed. The batch id and date are read from the page rather than hardcoded, so a second batch will not be mislabelled — but it will not appear. |
| **No server side** | Decisions live in the reviewer's own browser and are returned as copied text. Nothing is transmitted, so there is no way for two reviewers to see each other's answers. |
| **Not linked from the site** | `/review/` is absent from the navigation and from the footer, deliberately: it is an internal artefact, not a page for diners. It is reachable only by its URL, and it is added to the sitemap solely because the build gate requires the sitemap to list every page that was built. |
| **Preview, not production** | The public link is the preview environment, with `noindex` on every page and `Disallow: /` in robots. A production deploy on the restaurant's own domain is a separate, owner-approved step. |

---

## 8. Presentation polish pass (15 Oct 2026)

Requested: make the concept presentable to the owner without pretending it is
finished and without inventing anything. Working method below; the full catalogue
of findings and the resulting owner checklist live in `docs/06-owner-review-checklist.md`.

### What changed

- **Photo areas are finished art panels, not labelled boxes.** `PhotoPlaceholder`
  renders spice-toned gradients with a thali-ring motif, drawn in CSS from brand
  tokens — no “Placeholder” tag, no shot request, no technical label. Panels are
  decorative (`aria-hidden`); names live in adjacent content or control labels.
- **About rewritten** from the restaurant's own published description only:
  hero, heritage with the city list, tadka meaning with the spice list, a pure-art
  band, and the existing call-to-action. No history invented; the history question
  is the first item on the owner checklist.
- **Eleven internal notes removed from public pages** (About, Gallery ×2 plus its
  photography-brief section, Catering, Visit ×2, Menu owner-questions section)
  and moved to the owner checklist. Four disclosures that affect visitors — hours
  and prices staleness — stay as single muted lines, not alert boxes. The dietary
  health disclosure, the privacy and accessibility notes, and the footer concept
  disclaimer are untouched.
- **Gallery tiles are numbered, not named** (“View photo 3 of 12”), so no tile
  claims content it does not show. The menu's duplicate-name table and confirm
  list moved to the checklist; the page keeps its dietary disclosure.

### Verification

`npm run check` exit 0: 10 pages, 0 errors, 0 warnings. A sweep of the built HTML
for placeholder language, shot requests and removed note titles returns nothing on
public pages (the single remaining match is inside the internal review tool, and
“noindex” matches are the required robots meta tag). No fixed-pixel widths above
icon size in any new or edited style. The pre-change payload is archived at
`deploy/backup/preview-2026-10-15-pre-polish.tar.gz`.

### Engineering posture for this static site (Section 11 lenses, classified)

- **REQUIRED and done:** pre-change backup with byte-identity check; deploy
  receipt recorded and the live URL re-verified afterward (rollback = redeploy
  the archived payload); no secrets anywhere in the payload; platform HTTPS and
  edge caching rather than any custom infrastructure.
- **UNNECESSARY and deliberately not built:** Docker, Kubernetes, queues, workers,
  databases, custom monitoring, feature flags, Terraform — a static restaurant
  concept has no problem any of those solve. The three Python gates and the live
  curl probes are the proportionate version of CI checks and health checks.

---

## 9. Beta notes on the site (15 Oct 2026)

Requested: a visible developer note for the beta preview, with per-page notes on
which edits and photographs are still needed. Built as `src/components/DevNotes.astro`
(a floating pill plus a dialog with the current page's notes, mounted once in
MainLayout), driven by `src/data/dev-notes.json` (9 pages, 32 notes), with the full
list at `/dev-notes/` for readers without JavaScript — the pill is an ordinary
link there, intercepted into a dialog only when scripting runs.

Caught by the gate during construction: the dialog's close control was first a
`<form method="dialog">`, which the build verifier rejects on every page (all
forms must declare an action). Rebuilt as a plain button on the gallery viewer's
pattern — the dialog only ever opens with JavaScript running, so the control is
never reachable dead.

`npm run check` exit 0: 11 pages, 0 errors, 0 warnings. Tag badge colours reuse
only contrast-verified token pairs, and each badge carries its meaning as a word.
`docs/06` records the on-site mirror relationship so the two lists cannot drift
unnoticed.

---

## 7. Accessibility, privacy-accuracy and legal-risk pass (15 Oct 2026)

Requested as a compliance, accessibility and legal-risk review of the deployed preview. The brief
arrived truncated mid-sentence, so only the received portion was acted on: preserve the site, fix
real accessibility defects against WCAG 2.2 AA as a target, and publish an Accessibility statement
from the footer. Anything in the missing tail was not invented.

### Environment limits, stated first

No browser binaries and no accessibility runners (axe, pa11y, Lighthouse, Playwright) exist here,
so this was a static audit: every component and page read, every claim checked against the source,
and every fix verified through the build gates and the built HTML. No keyboard walkthrough, screen
reader, zoom observation or automated audit was possible — the statement page says exactly that.

### Defects found and fixed

| # | Defect | Risk if shipped | Fix |
|---|---|---|---|
| 1 | Footer and privacy page claimed the site is “not published” — false since the preview deploy | A false legal-status statement on a public URL | Both now say “shared as a preview link only, not indexed” |
| 2 | Footer claimed photographs among the restaurant's property on the site — none are shipped | Misrepresenting what the site carries | Line now names menu details and the restaurant name only |
| 3 | Four “See this on the menu” links, identical text to four different destinations | Screen-reader users hear the same link four times with no way to tell them apart (WCAG 2.4.4) | The dish name rides along in a visually-hidden span |
| 4 | Loading the map hid the focused button, dropping keyboard users at the top of the page with no announcement | Lost place, no context for what appeared | The map frame is a labelled region and receives focus on load |
| 5 | Dead `heading="Map"` prop on the homepage map, silently ignored | Suggests a heading is rendered when none is — a future editor trusts it | Removed; the region label in fix 4 is the real name |
| 6 | Review-page questions table scrolls horizontally but was not keyboard-scrollable | Keyboard users could not reach overflowed content | Region role, label and `tabindex="0"`, using the global focus ring |
| 7 | Privacy badge and inventory said “no forms” while the menu has a search box and `/review/` records decisions | A privacy claim a visitor can see is untrue | Badge reads “0 trackers · 0 cookies · 0 accounts”; a new inventory row discloses the on-device review storage, which never transmits |
| 8 | New statement page's night-section list would have rendered dark-on-dark | `.prose li` (0,1,1) beats a div-level override regardless of order — caught by reasoning about the cascade, fixed with a doubled class | Verified numerically: the rendered pairs measure 11.54:1 and 16.51:1 in the gate's own output |

### The statement page

`/accessibility/` (29.8 KB), linked from every footer beside Privacy. It states the WCAG 2.2 AA
target with an explicit no-certificate, no-immunity, no-overlay clause; lists what was built and
how it is re-checked; gives the verified telephone number as the only contact route and says plainly
that no email exists; documents six known limitations each with an alternative; and carries a
last-reviewed date of 15 October 2026 with a per-deployment review process. No business facts were
invented for it: no email, no SLA, no conformance claim.

### Verification

`npm run check` exit 0: 10 pages built, 0 errors, 0 warnings, contrast and photo-record gates pass.
The overclaim scan (guarantee/compliant/certified/licensed/awards) returned only honest “holds no
licence” statements. The pre-change deployment was archived to
`deploy/backup/preview-2026-10-15-pre-a11y.tar.gz` before rebuilding — the backup was verified
byte-identical to the live payload first.

---

## 10. Shot labels inside the photo panels (15 Oct 2026)

Requested: ditch the on-site beta notes; keep the same panel design but name the
needed photograph in the middle of each panel. Removed `src/components/DevNotes.astro`,
`src/pages/dev-notes.astro` and `src/data/dev-notes.json`, the `DevNotes` mount in
`MainLayout`, and the `/dev-notes/` sitemap entry; updated the `docs/06` on-site
mirror note to match. `PhotoPlaceholder` keeps its spice-gradient art and thali ring
and now renders a centred "Photo needed" card with the shot name. Every position is
labelled: hero spread, spice bowl, four homepage previews, four featured-dish
close-ups (from the dish name), four About panels, and the twelve gallery tiles
(driven by one shot list shared with the lightbox slides).

`npm run check` exit 0: 10 pages, 0 errors, 0 warnings. Pre-change build archived
before redeploying.

Deploy note: the first redeploy uploaded a stale payload — `deploy/dist/` (what the
manifest's `assetsDirectory` points at) had not been synced from root `dist/`, so
the live URL kept serving the old build with identical request hash. Synced
`deploy/dist` from the verified root `dist/` and redeployed under a fresh request id.
Live sweep passes: all pages 200 with no pill, "Photo needed" counts 10/4/24 on
`/`/`/about/`/`/gallery/`, `/dev-notes/` a real 404.

---

## 11. Accessibility engineering pass, WCAG 2.2 AA target (16 Oct 2026)

Target confirmed against the W3C WCAG 2.2 Recommendation and Quick Reference:
31 Level A + 24 Level AA criteria, including the nine criteria new in 2.2
(2.4.11, 2.4.12 AAA, 2.4.13 AAA, 2.5.7, 2.5.8, 3.2.6, 3.3.7, 3.3.8, 3.3.9 AAA).
4.1.1 Parsing is removed in 2.2 and was not evaluated. App type: static public
website (Astro 7, no client JS framework, no auth, no payments, no media).
Critical journeys: find/call the restaurant, read hours, browse/filter the menu,
order via phone or platform links, review photo records (internal tool).

### Issues found by reading every page and component (IDs for tracking)

| ID | Finding | WCAG | Severity | Status |
|---|---|---|---|---|
| A11Y-01 | Menu search input had `outline: none` with no `:focus-within` style — keyboard users saw no focus mark in the search box | 2.4.7 | HIGH | FIXED AND RETESTED |
| A11Y-02 | About art-band `aria-hidden` hid visible "Photo needed" text from assistive tech | 1.1.1 / 1.3.1 | MEDIUM | FIXED AND RETESTED |
| A11Y-03 | Gallery tile names ("View photo…") did not contain the visible "Photo needed" words voice users speak | 2.5.3 | MEDIUM | FIXED AND RETESTED |
| A11Y-04 | Review decision hints existed in data but were never rendered | 3.3.2 / plain language | LOW | FIXED AND RETESTED |
| A11Y-05 | Foreign-language phrases (`tadka`, `sarson da saag`, dish names) carry no `lang` tags; the correct codes need a native speaker | 3.1.2 | LOW | REQUIRES HUMAN REVIEW |
| A11Y-06 | Photo-label text contrast verified by token math, not rendered pixels | 1.4.3 | LOW | REQUIRES HUMAN REVIEW |

Already sound on inspection (no change): skip link, landmarks (all labelled),
heading order (gate-enforced), native dialog lightbox with focus return, map
focus handoff, live regions, table scopes, 24 px+ targets, no time limits, no
motion or flashing, redundant state cues (aria-current + gold rule, radio dots +
highlight), no auth/validation/drag/gesture flows (criteria N/A).

### Testing actually performed

`npm run check` exit 0 (10 pages, 0 errors, 0 warnings; all three gates pass).
Fixes verified in built output: `:focus-within` in the menu CSS bundle, new tile
names on all 12 gallery buttons, 12 described radios on `/review/`, bare
`art-band` on `/about/`. `/accessibility/` updated (two new inventory entries,
last-reviewed 16 Oct 2026).

### NOT PERFORMED (no browser, screen reader, or runner exists here)

Keyboard walkthrough, NVDA/VoiceOver/TalkBack passes, 200%/400% zoom and reflow
observation, text-spacing check, reduced-motion observation, axe/Lighthouse
scan. The statement page says exactly this. Do not claim conformance on this
evidence alone — independent review with disabled participants is still required
before any formal claim.
