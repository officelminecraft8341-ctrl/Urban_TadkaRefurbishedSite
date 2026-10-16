# Asset inventory — Urban Tadka design concept

For owner/developer use, not shown to diners. Each row states what the asset is,
where it lives in this project, where it came from, its licence position, whether
permission exists, and what must happen before any sale or publication.

**Rule applied throughout: nothing is declared safe unless permission or a
licence file was actually seen. Uncertain items are flagged for manual
verification, not cleared.**

I am not a lawyer. This inventory is a working record, not legal advice. Have a
qualified attorney review it before sale, publication or any claim of compliance.

Last reviewed: 16 October 2026, against the preview build then live.

---

## 1. Developer-original work (provisional)

| Asset | Where | Source | Licence / status | Permission | Required action |
|---|---|---|---|---|---|
| Page layouts, components, styles, scripts | `src/layouts/`, `src/components/`, `src/styles/`, inline `<script>` in `.astro` pages | Written for this project (machine-assisted) | Provisional: © [Independent developer — replace with legal business name]. Final ownership, licence and payment terms must be set in a signed written agreement | N/A (own work) | Replace placeholder in `src/config/site.js` → `developer.name`; set terms in signed contract; have attorney review |
| Hand-drawn icons | `src/components/Icon.astro` | Hand-authored for this project, no third-party library | Same provisional developer ownership as above | N/A | None, keep |
| Favicon mark (bowl + steam) | `public/favicon.svg` | Original mark drawn for this project | Same provisional developer ownership | N/A | None, keep |
| Placeholder food/room panels | `src/components/PhotoPlaceholder.astro` (CSS art) | Original CSS artwork for this project | Same provisional developer ownership | N/A | Replace with licensed photography before launch; keep placeholders until then |
| Verification tooling | `tools/*.py`, `src/lib/menu.js` | Written for this project | Same provisional developer ownership | N/A | None |
| Concept docs written for this build | `docs/`, `README.md` (to the extent original) | Written for this project | Same provisional developer ownership | N/A | Keep repo private; see §4 |

## 2. Restaurant-owned material used WITHOUT documented permission (review only)

| Asset | Where | Source | Licence / status | Permission | Required action |
|---|---|---|---|---|---|
| Restaurant name "Urban Tadka" | Throughout (`src/config/site.js` → `brand.name`, headers, titles) | Restaurant's own published site | Trademark rights (if any) belong to the restaurant; no licence | **None sought yet** | Written permission to use the name in a demo and, separately, on a live site — before any sale or publication |
| Address, phone, hours, cuisine description | `src/config/site.js` → `business`, `hours`; rendered on Home, Visit, About | Restaurant's own published pages + public listings | Facts; presentation is ours, underlying business facts are theirs | **None sought yet** | Owner re-confirmation (hours/prices conflict — see `docs/03-unverified-details.md`) + written permission to publish |
| All 157 dish names, descriptions, prices | `src/data/menu.json` (via `tools/parse-legacy-menu.py` from restaurant's menu page) | Restaurant's own menu page, transcribed verbatim | Menu text remains the restaurant's property; no licence | **None sought yet** | Written permission to reproduce; re-confirm prices (2019) and duplicate-price dishes before launch |
| Tagline "Authentic traditional Indian cuisine" | `src/config/site.js` → `brand.tagline`, footer | Restaurant's site header, verbatim | Restaurant's wording | **None sought yet** | Confirm canonical strapline (§17 of doc 03) + permission as above |
| Region/spice lists, "tadka" explanation | `src/pages/about.astro` | Restaurant's About page, summarised | Restaurant's description | **None sought yet** | Owner approval of wording (checklist §2) |
| Brand colour values (#FFCC29, #BF383E, #373435, #BDBFC1) | `src/config/site.js` → `brand.colors` | Sampled from restaurant's logo file by pixel histogram | Colour values are facts, not artwork; logo artwork itself is NOT reproduced | N/A (values) but logo permission still outstanding | Low risk as values; still needs logo permission if artwork is ever used |

## 3. Third-party assets with licences

| Asset | Where | Source | Licence / status | Permission | Required action |
|---|---|---|---|---|---|
| Fraunces + Inter typefaces | `node_modules/@fontsource-variable/*`, self-hosted files in `dist/` | Fontsource npm packages (upstream: Google Fonts / SIL OFL) | SIL Open Font License 1.1 — commercial use and self-hosting permitted; licence files ship with the packages | Licensed via OFL | Keep bundled licence files; do not strip attribution |
| Astro framework + `@astrojs/check`, TypeScript | `package.json`, `node_modules/` (build-time only, not shipped) | npm | Their respective open-source licences (build tooling, not site content) | Licensed | None for the demo; keep `package-lock.json` for reproducibility |
| Google Maps embed + directions/place links | `src/components/MapEmbed.astro`, `src/config/site.js` (`mapEmbedUrl`, `directionsUrl`, `mapsPlaceUrl`) | Google | Google's Terms + Privacy Policy apply once loaded/visited; embed loads only on explicit click | Visitor accepts Google's terms by loading | Keep click-to-load; keep plain-language cookie warning; never auto-load |
| Grubhub / Uber Eats ordering links | `src/config/site.js` → `ordering.options`; Visit page, footer | Third-party platforms | Their terms apply on their sites; link ownership unverified | **Ownership unverified** | Owner must confirm official platform pages + who controls them; ezCater link deliberately NOT linked (redirects to homepage) |
| Facebook page link | `src/config/site.js` → `social.accounts`; footer | Facebook | Facebook's terms apply there; account ownership unverified | **Ownership unverified** | Owner must confirm official accounts; no Twitter/X, Instagram or TikTok linked because none could be verified |

## 4. Deliberately absent (correctly withheld)

| Asset | Status | Why withheld | Required action |
|---|---|---|---|
| Restaurant logo artwork | Not reproduced; header uses typographic wordmark | No written permission to redistribute artwork | Vector original + written permission, or approve wordmark permanently |
| Food/room photographs | None shipped; all positions are labelled placeholders | No authorised photography; stock/AI food imagery would misrepresent; review-batch images are third-party Google review photos with no republication licence | Owner-supplied photos + written permission + model releases for recognisable people |
| Reviews, ratings (3.5★ / 280 Google reviews seen Oct 2026), awards, testimonials, founding story | Not shown | None published by the restaurant; rating display is a judgement call | Deliberate owner decision only, with source + date if ever shown |
| Dietary/allergen labels, halal status, spice levels | Not shown | Source menu states none; guessing affects health and carries liability | Exact owner-approved wording only, if at all |
| Contact/enquiry form, reservations widget, online payments, analytics, advertising pixels | Not installed | No verified destination address; static site; tracking would trigger consent/privacy duties | Owner decision + lawful basis + privacy update before adding any of them |
| Old-site mirror (`audit/`), chat-supplied reference screenshots | Local only, gitignored, never committed or published | Third-party images (some watermarked/attributed); audit evidence only | Keep out of repo and off the site |

## 5. Repository licence + visibility

- `LICENSE` was a **CC0 1.0 public-domain dedication** from repo creation. That is
  wrong for client-services work: it gives away the developer-original work above
  and implies rights over restaurant/third-party material the developer does not
  own. It has been replaced with a provisional all-rights-reserved notice naming
  the configurable developer and excluding third-party/restaurant material.
  Final terms belong in a signed contract, reviewed by counsel.
- Keep this repository **private** until the restaurant approves publication: it
  holds brand direction, pricing data and an audit of their current site.
- Do not assert exclusive copyright over everything here: code was
  machine-assisted, typefaces are third-party (OFL), and menu/restaurant content
  belongs to the restaurant.

## 6. Uncertain items flagged for manual verification (do not launch without)

1. Written permission for: restaurant name, menu text, tagline, logo (if ever used), photographs (when supplied), staff/customer likenesses.
2. Hours + prices re-confirmation (three sources disagree; prices frozen at 2019).
3. Ordering platform page ownership (Grubhub/Uber Eats) + correct catering URL.
4. Social account ownership (Facebook `UrbanTadkaDallas` only; no X/Instagram/TikTok verified).
5. Developer legal business name in `siteConfig.developer.name` + signed contract terms.
6. Attorney review of this inventory, the privacy notice, the demo banner/footer
   wording, and any Texas-specific business disclosures before sale or launch.
