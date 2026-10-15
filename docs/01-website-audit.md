# Urban Tadka — Existing Website Audit (Phase 1)

**Business:** Urban Tadka, 1800 Market Place Blvd, Suite #190, Irving, TX 75063 · (469) 420-9920
**Site audited:** http://www.urbantadkadallas.com/index.html
**Audit date:** 15 Oct 2026
**Audited by:** conceptual review only. We do not own these assets and made no changes to the live site.

---

## 1. Scope and method

Every finding below was produced by directly requesting the live site and inspecting the
response. Nothing was assumed from a template or a screenshot.

| Check | Method |
|---|---|
| Pages | `curl` fetch of `index.html`, `about.html`, `menu.html`, `contact.html` (all HTTP 200) |
| Stylesheet | `curl` fetch of `style.css` (HTTP 200, 4,065 bytes) |
| Assets | Enumerated every `images/*` reference; requested each one for status + byte size |
| Image dimensions | Parsed PNG/JPG headers locally |
| HTTPS | `openssl s_client` on port 443 for `www` and non-`www`; `curl` on `https://` |
| Machine-readable files | Requested `robots.txt`, `sitemap.xml`, `favicon.ico` (all HTTP 404) |
| Headers / compression | Response headers inspected; gzip tested with `Accept-Encoding` |
| Markup quality | Counted `viewport`, `alt`, `<h1>`, `lang`, `meta description`, `ld+json`, `<script>` per page |
| Menu structure | Diffed accordion `href="#collapseN"` targets against the `id="collapseN"` values actually present |
| Contrast | Computed WCAG contrast ratios for the exact hex pairs used in the CSS |
| Visual assets | Downloaded and visually inspected the logo, hero background, and the two homepage photos |
| External business facts | Public search index (Yelp, Uber Eats, Grubhub, TripAdvisor, Facebook, Texas Monthly) |

Raw evidence is kept in `audit/raw/` (page HTML, CSS, headers, extracted menu text) and
`audit/assets/` (downloaded images).

---

## 2. What the site actually is

A four-page static site (`index`, `about`, `menu`, `contact`) written in 2016, hosted on
Apache/2 at webhostingpad (`ns5/ns6.webhostingpad.com`, 162.244.94.37). Every page carries
`Last-Modified: Tue, 22 Oct 2019` — the content has not changed in roughly seven years.
The footer credits the build and maintenance to Micropix (817-684-0423), which matters
practically: that agency, not us, currently controls the site.

There is no CMS, no framework, and no build step. Styling is a single 4 KB stylesheet
plus heavy inline `style="..."` attributes. The menu page loads Bootstrap 3.2.0 CSS.

**Genuine brand assets exist and are worth preserving** — this is not a brand-less business.
The logo is a steel spice bowl (peppercorns, star anise, turmeric, coriander, cinnamon,
chilli) above "URBAN" in gold outline and "Tadka" in a warm script, with a small tagline
block reading *"A tradition from India."* The hero background is an amber/gold gradient
with a wooden mortar and pestle surrounded by real spice piles. The palette (deep maroon,
gold, warm cream) is coherent and recognisable. We should build on it, not replace it.

---

## 3. Confirmed observations

### Security and delivery
1. **HTTPS is broken on the domain.** The certificate served for both
   `urbantadkadallas.com` and `www.urbantadkadallas.com` has
   `subject=CN = ny201.whpservers.com` — the host's own hostname, not the restaurant's.
   `curl` fails with *"no alternative certificate subject name matches target host name"*.
   A visitor who types `https://`, or follows a link that upgrades to HTTPS, gets a
   browser security warning.
2. **No HTTP → HTTPS redirect and no HSTS.** `http://urbantadkadallas.com/` returns
   `200 OK` directly.
3. **Gzip compression is enabled** (home page 5,628 → 1,834 bytes). This is working
   correctly and should be kept.

### Mobile
4. **There is no viewport meta tag on `index.html`, `about.html` or `contact.html`.**
   On `menu.html` it exists but is commented out:
   `<!---<meta name="viewport" content="width=device-width, initial-scale=1">--->`.
   Mobile browsers therefore render the site at a ~980 px default layout width and zoom out.
   All text renders tiny; every page requires pinch-zoom to read.
5. **Layouts are fixed-width** (`#header` 982 px, `#banner` 982 px, `#main_cont` 982 px,
   `#footer` 982 px, and the menu container `width:1100px`). There is **no media query
   anywhere in `style.css`**. This is a non-responsive design, not a merely imperfect one.

### Search and metadata
6. **Page titles are generic:** "Index", "About", "Menu", "Contact Us". The homepage title
   is literally the word "Index" — it carries no restaurant name, cuisine, or city.
7. **No `<meta name="description">` on any page.** No Open Graph or Twitter card tags,
   so links shared to Facebook, Instagram, WhatsApp or iMessage render as a bare URL.
8. **No structured data at all** — no `Restaurant`/`LocalBusiness` JSON-LD, no
   `openingHoursSpecification`, no `menu` markup, no `sameAs` social links.
9. **No `<html lang>` attribute on any page**, and **no `<meta charset>`**.
10. **`robots.txt`, `sitemap.xml` and `favicon.ico` all return 404.**
11. The site *is* indexed: a branded search returns it at position 2. SEO is not failing on
    brand queries; the gaps are for non-brand local discovery and rich results.

### Accessibility
12. **0 of 14 `<img>` elements across all four pages have an `alt` attribute.**
13. **No `<h1>` on any page**; there is exactly one `<h2>` in the whole site
    (the menu page's "Our Menu"). Heading structure is effectively absent — visual hierarchy
    is produced with `<div>`/`<span>` plus inline `font-family`/`font-size`.
14. **Contrast:** most brand pairs pass, one does not. Measured:
    - `#890707` maroon on white — 10.01:1 ✅
    - `#FF0000` red on white (footer copyright at 12 px, "READ MORE" at 14 px bold) — **4.00:1 ❌**
      (fails AA 4.5:1; both sizes are below the "large text" threshold)
    - White on `#E70034` button red — 4.72:1 ✅
    - `#000000` on `#EBB249` menu gold — 11.00:1 ✅
15. Malformed markup undermines assistive tech: `about.html` and `contact.html` contain
    unbalanced `</p>` tags, and `menu.html` nests `<p><h4 class="panel-title">`.
16. **The menu's interactive controls are anchors with no ARIA state** — Bootstrap 3
    collapse `href` links with no `aria-expanded`, `aria-controls` or button semantics.

### Menu
17. **There is a real structural bug in the accordion.** Four separate category headings —
    "Biryani / Rice" (appears twice), "Biryani", and "Chawal" — all point to the *same*
    panel, `href="#collapse7"`. Clicking "Chawal" therefore opens the Biryani/Rice content.
18. **Duplicate category headings:** "Biryani / Rice" ×2 and "Drinks" ×2. 17 headings for
    13 unique panels.
19. **~157 priced items are rendered as unformatted inline runs** of `<strong><em>` inside
    two floated columns with hard-coded `<br />` line breaks, e.g. *"Crispy outer layer
    filled with seasoned <br />potatoes inside"*. There is no table, list, or grid — no
    dish row alignment, so prices do not scan vertically.
20. **No dietary, allergen or spice-level information anywhere** — no vegetarian marker on
    an otherwise heavily paneer/vegetable menu, no nut/dairy/gluten notes.
21. **Menu content problems needing owner input:** "Masala Paratha - $4.99" merges two
    dishes' descriptions ("...dry ground spices. Whole wheat roti seasoned with dry mint");
    "Chilli Paneer" appears at $13.99 (Appetizer) and $18.49 (Paneer); "Harabara Kebob"
    and "Subzian" use non-standard transliterations; there is no catering menu even though
    catering is advertised on the homepage.
22. **The menu's JavaScript loads over plain HTTP and is a decade old:**
    `http://maxcdn.bootstrapcdn.com/bootstrap/3.2.0/js/bootstrap.min.js` (insecure origin,
    mixed content, and a version predating the XSS fix in 3.3.5). jQuery 1.11.1 loads from
    the Google CDN over HTTPS.
23. **`css/bootstrap.min.css` is 109,507 bytes** — one third of the menu page's total
    payload — for accordion styling alone.

### Imagery and performance
24. **Only two photographs exist on the homepage, and both appear to be generic stock.**
    The "Featured Dish" image is a 214×164 px, 28 KB photo of a lamb shank with beans —
    it does not depict the menu item it is captioned as ("Lamb Curry — Cubes of lamb cooked
    in a light sauce…"). The "Services → Catering Services" image is a stock chef in a
    generic white uniform holding a plate of salad — not this restaurant's food or staff.
    There is no photograph of the dining room, the tandoor, or any actual dish by name.
25. The hero background is a 939×570 px **546 KB PNG**; the About page background is a
    **633 KB PNG**. Neither is a photograph of the restaurant.
26. **No responsive images**: no `srcset`, `sizes`, `<picture>`, WebP/AVIF, or
    `loading="lazy"` anywhere. Filenames also contain typos (`backgrounnd.jpg`,
    `backgrounnd_abt.png`).

### Content, trust and conversion
27. **The only ordering link may be dead.** The nav item "Order Online Now" points to
    `https://www.ezcater.com/brand/pvt/urban-tadka-texas`. Requested on 15 Oct 2026 it
    **redirects to the ezCater homepage** (`https://www.ezcater.com/`, title "Corporate
    Catering - Order Online from ezCater") and serves no Urban Tadka content. Confirmed
    behaviour, though it could be geo/bot filtering — see §5.
28. **The restaurant is live and selling on three delivery platforms the website never
    links to:** Uber Eats (rating 4.6, 1,000+ ratings), Grubhub (4.5, 37 ratings) and
    ezCater for corporate catering. The site links only ezCater.
29. **Every social media link is dead.** On all four pages the Facebook and Twitter icons
    and the "FRIEND US ON FACEBOOK" / "FOLLOW US ON TWITTER !" text are `href="#"`.
    A Facebook page (`facebook.com/UrbanTadkaDallas`) does exist publicly, so there is a
    real destination the site simply doesn't link to.
30. **"Services → Catering Services → READ MORE" is also `href="#"`** — the one
    non-food revenue path on the homepage goes nowhere.
31. **Opening hours appear on the Contact page only**, and they conflict with the
    restaurant's own third-party listings. The site says Lunch **Mon, Wed–Fri 11:00–2:30**,
    Sat 11:30–3:00, Sun 11:30–2:30; Dinner **Mon–Sun 5:30–9:45**; **Tuesday closed**.
    Yelp and Uber Eats advertise 11:00–2:00 and 5:30–9:30. The homepage also still contains
    **commented-out hours** advertising a Mon–Fri 11:30–2:30 **buffet** and Sat–Sun
    11:30–5:30 — a third, contradictory set.
32. **Content errors:** "Lamb **Speicialities**" in the homepage featured block; the same
    description is truncated mid-sentence ("cooked in a light sauce ..."); the About page
    reads "the menu **bas** evolved"; the copyright line says **© 2016**.
33. **No trust or conversion affordances:** no tap-to-call link (the phone number is plain
    text on every page), no click-to-directions link, no reservation action, no party-size
    or private-dining information, and no FAQ.
34. **No contact form exists at all** (nothing to fix, but also nothing capturing catering
    enquiries) — and no privacy policy, terms, or accessibility statement.

### Positives worth stating
35. **Name, address and phone are consistent** between the site and every public listing
    (Yelp, Uber Eats, Grubhub, TripAdvisor, Facebook all show 1800 Market Place Blvd Ste 190,
    Irving, TX 75063 and (469) 420-9920). NAP consistency is a real local-SEO asset.
36. Gzip works. The menu's full text *is* in the crawlable HTML, so dish names are
    indexable today. The existing logo is distinctive and licensed to the restaurant.
37. The site is small (4 pages, ~35 KB of HTML total) which makes a rebuild low-risk and fast.

---

## 4. Audit table

Priority = customer impact × effort. "Test" describes how we would prove the improvement worked.

| # | Finding | Why it matters to a customer | Recommended improvement | Priority | How to test |
|---|---|---|---|---|---|
| 1 | HTTPS certificate is wrong — `CN = ny201.whpservers.com`; browsers show a security warning | Some visitors abandon a "Not secure" warning; Google ranks HTTPS lower; can't add secure ordering/forms | Issue a certificate for the domain and its `www`, force HTTP→HTTPS, add HSTS | **High** | `curl -vI https://www.urbantadkadallas.com` returns 200 with a valid cert for the domain; SSL Labs grade A; http→https 301 |
| 2 | No `viewport` meta (3 pages) and commented out on the menu page | Mobile visitors see a zoomed-out 980 px page; text is unreadably small | Add `viewport` to every page; rebuild with responsive CSS | **High** | At 390 px width the page reports `document.documentElement.clientWidth === 390` and no horizontal scroll; verify on iPhone + Android |
| 3 | No responsive CSS — fixed 982 px / 1100 px containers, zero media queries | The majority of restaurant local searches are mobile; the site is effectively unusable there | Fluid grid, `clamp()` type scale, single-column mobile layouts, responsive menu cells | **High** | Lighthouse mobile "no horizontal scroll" pass at 360/390/768/1024/1440 px |
| 4 | Only "Order Online Now" link redirects to ezCater's generic homepage | A hungry visitor ready to order hits a dead end and leaves | Verify live ordering channels, then link Uber Eats, Grubhub and ezCater directly with clear labels | **High** | Each ordering URL returns the correct branded page from a US IP; tap test on a real phone |
| 5 | All social links are `href="#"` on all 4 pages | Visitors can't find or follow the restaurant; no social proof, no repeat-visit channel | Verify live accounts, then link them properly; drop the dead Twitter claim if unused | **High** | Every footer icon resolves to the correct live account; automated link check reports 0 dead links |
| 6 | Menu accordion bug: 4 headings share `href="#collapse7"` | Clicking "Chawal" or "Biryani" opens the wrong food — customers misread the menu | Rebuild the menu with correct one-to-one category→panel mapping | **High** | Click every category heading, confirm the revealed dishes match the heading label |
| 7 | Homepage shows a stock chef-with-salad and a stock lamb shank that doesn't match its caption | Generic stock imagery reduces trust in the food and feels like a different restaurant | Replace with permissioned photography of actual dishes; keep no photo until real ones exist | **High** | Stakeholder review of each image against its real dish; caption-to-photo match confirmed |
| 8 | 0 of 14 images have `alt`; no `<h1>`; single `<h2>` sitewide | Screen-reader and low-vision users get no image or structure information | Add descriptive `alt` per image, one `<h1>` per page, logical `h2`/`h3` outline | **High** | axe DevTools / Lighthouse a11y audit: 0 "image-alt" and 0 "heading-order" violations |
| 9 | Opening hours conflict across the site and third-party listings ("Tuesday closed" vs Mon openings; stale buffat hours in HTML comments) | A customer drives over on the wrong day or arrives during a closed window | Single verified hours source, shown on every page and in `openingHoursSpecification` | **High** | Owner signs off hours in writing; Google Business Profile, Yelp, Uber Eats and site all display identical hours |
| 10 | No tap-to-call and no click-to-directions anywhere (phone is plain text) | The two highest-intent mobile actions require manual copying | `tel:` links everywhere the number appears + a Google Maps directions link | **Medium** | Tap the number and the address on a phone; both open the dialer and Maps |
| 11 | Titles are "Index"/"About"/"Menu"/"Contact Us"; no meta description; no OG tags | Poor search snippets and blank-looking social shares reduce click-through | Unique descriptive titles ("Urban Tadka | North Indian Restaurant in Irving, TX"), per-page descriptions, Open Graph tags | **Medium** | Inspect rendered SERP snippet; Facebook Sharing Debugger shows title, description and image |
| 12 | No `Restaurant`/`LocalBusiness` structured data | No rich results (hours, price range, menu) in local search — competitors outrank | Add JSON-LD with verified name, address, phone, geo, hours, `menu`, `servesCuisine`, `sameAs` | **Medium** | Google Rich Results Test shows a valid Restaurant entity with no errors |
| 13 | No `robots.txt`, `sitemap.xml` or favicon (all 404) | No favicon looks unfinished; crawlers get no guidance | Add `favicon`/icon set, `robots.txt`, `sitemap.xml` | **Medium** | All three return 200; Search Console accepts and indexes the sitemap |
| 14 | Menu: ~157 items as inline `<strong><em>` runs with hard `<br />` breaks, two floated columns | Prices don't align; scanning is slow; large menu feels like a wall of text | Semantic per-category lists with dish name/description/price rows that collapse on mobile | **Medium** | 5-second test: a user can find a named dish and its price on a phone |
| 15 | Duplicate headings ("Biryani / Rice" ×2, "Drinks" ×2); 17 headings for 13 panels | Confusing, looks unmaintained; users re-scan the same category | Consolidated, de-duplicated category list | **Medium** | Count categories in the DOM vs. the approved menu document; no duplicates |
| 16 | No dietary / allergen / spice information at all | Vegetarian and allergy-conscious diners can't assess a dish; Indian cuisine often needs this most | Add verified veg/non-veg and spice markers **only after owner confirmation**; add an allergen note | **Medium** | Owner-approved markers only; each marked dish cross-checked against the kitchen's answer |
| 17 | Menu prices are unverifiable/stale (site frozen since 2019; duplicate "Chilli Paneer" at two prices) | Wrong prices damage trust and cause disputes at the table | Get a current priced menu from the owner; date-stamp it; make updates a one-line edit | **Medium** | Owner signs off the exact figures; a documented edit takes under 5 minutes |
| 18 | Bootstrap 3.2.0 JavaScript over plain `http://maxcdn` (mixed content, outdated) | Browsers may block the script, breaking category expansion; known XSS advisory | Remove the dependency entirely and use semantic, progressively-enhanced markup | **Medium** | DevTools Console and Network show 0 mixed-content blocks; all categories still expand with JS disabled |
| 19 | Dead "Catering Services → READ MORE" (`href="#"`) — the only non-food revenue path | Catering enquiries — the highest-value customers — have nowhere to go | Real catering page with verified details, minimums and an enquiry path | **Medium** | Link resolves to a real page; a test enquiry reaches the restaurant |
| 20 | No photograph of the dining room, the tandoor, or the actual food | Customers can't picture a night out; no emotional reason to choose this restaurant | Permissioned gallery: room, tandoor, plated dishes, staff at work | **Medium** | Each image is owner-approved and internally verifiable as the real restaurant |
| 21 | Oversized PNG backgrounds (546 KB hero, 633 KB About) | Slow first paint on mobile data; visitors bounce before the page loads | Replace decorative PNGs with lean CSS gradients/textures; convert photos to WebP with `srcset` and `loading="lazy"` | **Medium** | Lighthouse "efficiently encode images"/"properly size images" pass; LCP under 2.5 s on mobile |
| 22 | `#FF0000` red text at 12–14 px on white measures 4.00:1 | Low-vision users struggle to read the footer and "READ MORE" labels | Darken to the existing brand maroon `#890707` (10.01:1) or a mid red ≥4.5:1 | **Low** | axe contrast checker reports 0 violations at AA |
| 23 | Malformed markup: unbalanced `</p>`, `<p><h4>` nesting; deprecated `<body background="...">` | Unpredictable rendering and assistive-tech parsing | Clean, validating, semantic HTML5 | **Low** | W3C HTML Validator reports 0 errors on each page |
| 24 | Copyright says "© 2016"; `Last-Modified` 2019 | Suggests an abandoned business, undermining "are they still open?" confidence | Dynamic or current copyright year | **Low** | Footer shows the current year without manual edits |
| 25 | Typos in content ("Speicialities", "bas evolved") and a truncated dish description | Sloppiness reads as carelessness about food too | Copy-edit all text with owner-approved wording | **Low** | Proofread pass; owner approves final copy |
| 26 | No privacy policy, no accessibility statement, no contact form | Catering/bulk enquiries have no channel; no transparency on data handling | Add a contact/enquiry form with a working backend, labelled fields, and a policy that matches what is actually collected | **Low** | Submit a test enquiry end-to-end; policy text matches the implemented data flow |

---

## 5. What I could not verify (stated, not guessed)

These are **not** findings. They are open items. I did not invent results for them.

1. **Whether the ezCater page still exists.** It redirected to `ezcater.com` and returned
   HTTP 406 to a plain `curl`. That could be a retired page *or* bot/geo filtering.
   **Needs:** a manual browser check from a US IP.
2. **Instagram and TikTok accounts.** No public evidence found for either. Absence from a
   search index is not proof of absence. **Needs:** owner confirmation.
3. **Whether the owner controls the Facebook page** at `facebook.com/UrbanTadkaDallas`.
   The page is publicly indexed (4.3★, 64 ratings, "86% recommend") but Facebook returned a
   login wall, so I could not read its content — and a page existing does not prove who runs it.
4. **The Twitter/X account** the footer advertises. No account was located.
5. **Current opening hours.** Three conflicting versions exist (site, third-party listings,
   commented-out HTML). **Needs:** owner-signed hours.
6. **Current prices, dish availability, and whether the buffet still exists.**
   The site was frozen in 2019; the homepage's buffet hours are commented out; public
   searches for "Urban Tadka lunch buffet" suggest it may exist, but that is a guess, not a fact.
7. **Dietary/allergen status.** I make no claim about any dish being vegetarian, vegan,
   halal, gluten-free or nut-free. One directory lists the restaurant as halal with a
   "verbal assurance" — **this is a third party's claim and must not go on the site**
   without the owner's written confirmation and an understanding of the liability involved.
8. **Catering capability, minimums, lead times and delivery radius.**
9. **Whether the logo files and photographs are the restaurant's own assets** and whether the
   current webmaster (Micropix) holds the originals.
10. **Whether the current developer/host will cooperate** with a handover of DNS/hosting, or
    whether the restaurant is under contract. This is a practical blocker for any real launch.
11. **Real-world performance metrics** (Lighthouse/CrUX field data). I inspected payloads,
    markup and headers, but have not yet run Lighthouse — that happens in Phase 8 against
    our own build, not against the live site.
12. **Google Business Profile ownership and accuracy.** Consistent NAP suggests it exists;
    I did not log in to inspect it.

---

## 6. The five highest-impact improvements

Ranked by the number of real customers each one unblocks.

1. **Make the site secure and mobile-first.** Fix HTTPS (real certificate, forced redirect,
   HSTS) and add a viewport + responsive layout. Today the site displays a security warning
   when accessed over HTTPS and renders as a zoomed-out desktop page on a phone. Nothing
   else we improve matters much until this is fixed.
2. **Repair the path to a sale.** One working ordering link (and it may be dead), no
   tap-to-call, no directions, and dead social links. Meanwhile the restaurant already sells
   on Uber Eats and Grubhub. Give every visitor an obvious, working next step: call, order,
   directions, catering.
3. **Rebuild the menu as a scannable, correct, mobile-readable document.** ~157 items are
   currently unaligned inline text, four category headings open the wrong panel, categories
   are duplicated, and no dietary or spice information exists. The menu is the single most
   valuable page on a restaurant site.
4. **Replace stock imagery with real photography, and fix the accessibility baseline.**
   The only two homepage photos are generic stock that doesn't match its own captions; 0 of
   14 images have `alt` and the site has no `<h1>`. Real, permissioned photos plus proper
   markup make the restaurant look like itself and make the site usable by everyone.
5. **Publish one verified set of facts and make the site findable.** Hours, phone, address
   and prices currently disagree across the site and public listings, and there is no
   structured data, meta description, sitemap or favicon. One owner-approved source of truth
   feeds the site, the `Restaurant` schema, Google, Yelp and social.

---

## 7. Questions requiring the owner's verification

**Business facts**
1. Current opening hours, day by day, including lunch and dinner service and any weekly
   closing day. (Three versions are currently in circulation.)
2. Is the lunch buffet still offered? What days, times and price?
3. Current menu, with exact dish names, prices and availability — and whether items are
   seasonal or rotating.
4. Which dishes are vegetarian? Any vegan? Any nut, dairy or gluten concerns the kitchen
   wants stated? Any halal status they want published (with the wording the owner approves)?
5. Can certain dishes be made milder or spicier on request?
6. Is catering offered? If so: minimum headcount, lead time, delivery radius, service
   style, and the correct contact for enquiries.
7. Are reservations accepted, walk-ins only, or does it vary by day and party size?

**Digital access and assets**
8. Who owns and controls the domain, DNS and hosting? Is there an active contract with
   Micropix, and can the originals (logo, photographs, source files) be handed over?
9. Which social accounts are official, and who has the logins? (Facebook confirmed;
   Instagram, TikTok and Twitter unconfirmed.)
10. Is the ezCater catering page still active? Which ordering channels are live today —
    Uber Eats, Grubhub, ezCater, or others — and which should we link?
11. Do we have written permission to use the logo and any supplied photography in a public
    portfolio? (Required before we show this concept publicly.)
12. Are there existing reviews or press mentions the owner wants referenced, and can we
    quote them verbatim with attribution?

**Legal and compliance**
13. Any allergen, alcohol, or pricing regulations the owner wants addressed on the site.
14. Who should receive catering and business enquiries, and is an email address or phone
    number preferable for publication?

---

## 8. Phase 1 status

| Item | Status |
|---|---|
| Pages fetched and inspected | ✅ 4/4 pages + stylesheet |
| Assets enumerated and measured | ✅ 11 image references, all HTTP 200 |
| HTTPS / headers / compression | ✅ inspected |
| Machine-readable files | ✅ checked (robots, sitemap, favicon all 404) |
| Menu structure bug | ✅ confirmed by anchor/ID diff |
| Contrast ratios | ✅ measured for 7 real pairs |
| Live performance scores | ⛔ not yet run — Phase 8 |
| Social account verification | ⛔ blocked (login walls); owner input needed |
| Ordering channel verification | ⛔ ambiguous; needs a US browser check |

**Next:** Phase 2 brand direction — proposed below for approval, derived from the real
logo and hero assets rather than invented.
