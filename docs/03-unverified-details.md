# Unverified details & pending approvals

Everything in this document is **not** on the site as settled fact. Some of it is shown with a
visible "For the owner" annotation; some of it is deliberately absent. This is the list to work
through with the restaurant.

Legend: **Blocker** = the site should not go live without it. **Important** = affects a customer
decision. **Optional** = improves the site but nothing breaks without it.

---

## 1. Business facts needing verification

| # | Item | Current treatment on the site | What we need | Owner of the answer |
|---|---|---|---|---|
| 1 | **Opening hours** (Blocker) | Shown, with a visible "Confirm before launch" note | Day-by-day hours, lunch and dinner. Three versions disagree — see §2 | Restaurant |
| 2 | **Prices** (Blocker) | Shown exactly as published, with a "Prices need confirming" note | A current priced menu, or written confirmation that these are still correct | Restaurant |
| 3 | **Lunch buffet** (Important) | Absent entirely | Does it exist? Days, times, price | Restaurant |
| 4 | **Duplicate dishes at two prices** (Important) | Both entries shown, listed as owner questions on the menu page | Which price is current, or whether both are intended | Restaurant |
| 5 | **Dietary classifications** (Important) | Absent — no veg/vegan/halal/gluten-free/nut-free labels anywhere | Which dishes are vegetarian, which vegan, and whether to publish halal status | Restaurant |
| 6 | **Allergen information** (Important) | Absent | Whether to publish any, and in what wording — this carries liability, so it is the restaurant's call | Restaurant (+ qualified advice) |
| 7 | **Spice levels** (Optional) | Absent | Whether dishes should carry a mild/medium/hot indicator | Restaurant |
| 8 | **Reservations** (Important) | No booking action offered | Walk-in only, or reservations taken? By phone or online? | Restaurant |
| 9 | **Catering specifics** (Important) | Service named, specifics listed as open questions | Minimum/maximum headcount, lead time, delivery radius, pricing model, catering menu | Restaurant |
| 10 | **Parking & step-free access** (Optional) | Stated as "not published by the restaurant" | Any details worth publishing | Restaurant |
| 11 | **Social accounts** (Important) | Only Facebook is linked, marked as ownership-unconfirmed | Which accounts are official, and who controls them | Restaurant |
| 12 | **Instagram / TikTok** (Optional) | Absent | Do they exist? None could be found | Restaurant |
| 13 | **Twitter/X** (Optional) | Removed | The old site advertises a Twitter account in its footer, but no such account could be found and both footer icons are dead links. Confirmed dead, so the claim was dropped rather than copied | Restaurant |
| 14 | **Public email address** (Optional) | Absent | An address safe to publish, if one exists | Restaurant |
| 15 | **Cuisine description** (Optional) | Shown, sourced from the restaurant's own About page | Confirm the wording is still accurate; it is their text, summarised | Restaurant |
| 16 | **Press coverage** (Optional) | Absent | Any reviews or articles they want quoted, with permission | Restaurant |
| 17 | **Which strapline is canonical** (Optional) | The footer carries *"Authentic traditional Indian cuisine"*, taken from the website's own header | Two straplines are in circulation: the website says *"Authentic traditional Indian cuisine"*, while the building's signage and the logo both read *"A tradition from India."* Choose one and use it consistently across site, signage and print | Restaurant |
| 18 | **Google rating and review count** (Important) | Absent — no rating or review count is shown anywhere | The Google listing shows **3.5★ from 280 reviews** (Oct 2026). Deciding to publish a rating is a judgement call, not a default: a 3.5 shown without context can cost more than it earns, so this needs a deliberate decision plus a plan for improving it | Restaurant |
| 19 | **Patio / outdoor seating** (Optional) | Absent | Listing photographs show tables and chairs on the patio at the front entrance. Confirm whether patio seating is a standing feature and worth advertising on `/visit/` | Restaurant |
| 20 | **Buffet, confirmed or retired** (Important) | Absent entirely | Still unresolved. Neither the Google listing nor any supplied photograph shows a buffet, which weakens the case for the commented-out buffet hours — but silence is not evidence. Ask directly | Restaurant |

---

## 2. The hours conflict, in detail

Three sources disagree. The site currently shows the restaurant's **own** published hours, because
that is the most authoritative source available, and flags them.

| Source | Lunch | Dinner | Closed |
|---|---|---|---|
| **The restaurant's own Contact page** (used on the site) | Mon, Wed–Fri 11:00–2:30 · Sat 11:30–3:00 · Sun 11:30–2:30 | Mon–Sun 5:30–9:45 | Tuesday |
| **Google Business Profile** (listing screenshot, Oct 2026) | Mon, Wed–Fri 11:00–2:00 · Sat 11:30–2:30 · Sun 11:30–2:00 | Mon–Sun 5:30–9:30 | Tuesday |
| Yelp and Uber Eats listings | Mon 11:00–2:00 | 5:30–9:30 | — |
| Commented-out HTML on the restaurant's own homepage | Mon–Fri 11:30–2:30 (labelled "Buffet") | — | Sat–Sun 11:30–5:30 |

The third row is dead code on their homepage, not visible to visitors, but it shows a fourth
intention. Once the restaurant confirms the real hours, the change is one edit in
`src/config/site.js` → `hours.schedule` (and `hours.schema` for structured data), and the
"Confirm before launch" note is deleted.

### What the Google listing changes

The Google Business Profile screenshot supplied in chat (October 2026) is a **fourth** version, and it disagrees with the restaurant's own site in one consistent direction:
lunch ends 30 minutes earlier on weekdays (2:00 vs 2:30), on Saturday (2:30 vs 3:00) and on
Sunday (2:00 vs 2:30), and dinner ends 15 minutes earlier every night (9:30 vs 9:45). Its shape
matches the Yelp and Uber Eats listings, which state the same times but say nothing about a
closing day. On the one point where it can be cross-checked against another source, it agrees with
the restaurant's own site: **Tuesday closed**.

That direction matters, because the restaurant's own site has been **frozen since 2019** (see
[`01-website-audit.md`](01-website-audit.md)), whereas a Google Business Profile is normally kept
up to date by the business and is what most customers actually look at. On the evidence available,
the restaurant's own published hours are the **likeliest of the four to be stale** — but that is
inference, not confirmation.

The hours shown on the site are therefore **unchanged**: swapping one unverified source for
another would only move the uncertainty around, and the rule in this project is to show the
restaurant's own published hours until the owner says otherwise. What the screenshot gives the
owner is a concrete question to answer — *are the Google times the real ones?* If they are, the
fix is one edit to `hours.schedule`; Tuesday is already handled in both places.

### A contradiction this review found, and fixed

Cross-checking the four sources against the site's own output exposed a defect **inside this
build**, not in the source data: `hours.schedule` has listed Tuesday as closed all along, but
`hours.schema` — the config that feeds the `openingHoursSpecification` JSON-LD — declared Tuesday
open for lunch *and* included it in the seven-day dinner block. The rendered structured data was
telling Google that Urban Tadka opens on its one closing day.

This is precisely the failure mode the original audit ranked **High** ("hours conflict across
sources"), reproduced in the new build. Fixed in `src/config/site.js`: schema.org has no "closed"
marker, so a closed day is now expressed by omission, and the config carries a comment tying
`hours.schema` to `hours.schedule`. Verified in the rebuilt output — no block declares Tuesday
open. This is also a reminder to check every remaining `*status` flag the same way: a fact can be
right in one field and wrong in the field beside it.

---

## 3. Features requiring credentials, services or approval

| # | Feature | Blocked on | Notes |
|---|---|---|---|
| 1 | **Enquiry / catering form** | An approved destination email address, plus a form-handling service **or** a small serverless endpoint | A static site cannot receive a submission by itself. The brief for this build explicitly forbids shipping a form that appears to send but does not. The site ships working phone + directions actions instead and explains what is needed. Once an address is approved this is roughly half an hour of work. |
| 2 | **Analytics** | Owner's decision, and a lawful basis | None is installed. Adding any analytics requires a privacy assessment and, in some jurisdictions, a consent banner before the first script runs. |
| 3 | **Cookie consent banner** | Only if tracking is actually added | Deliberately **not** present. The site sets no cookies and makes no third-party request on load, so a banner would be pure friction. The Google map is click-to-load for exactly this reason. |
| 4 | **Ordering integration** | Confirmation of which platforms are official and who controls them | Grubhub and Uber Eats are linked as outbound links only. The restaurant's own ezCater link redirects to ezCater's homepage and serves no Urban Tadka page, so it has been given **no** button. A correct catering URL is needed. |
| 5 | **Reservations system** | Confirmation that reservations are accepted, and a provider | Not implemented. No booking widget is shown because none could be verified. |
| 6 | **Online payments** | Not recommended at this stage | Third-party platforms already handle payment. Taking payment directly would bring PCI scope and far more infrastructure than a restaurant site needs. |
| 7 | **Photographs** | Owner-supplied images + written permission to publish | The gallery page contains a 12-shot brief. |
| 8 | **Logo artwork** | Written permission, plus the vector original | The logo used is a typographic wordmark we drew. |
| 9 | **Domain, DNS and hosting** | Access from the restaurant | Their current site is maintained by a third party (Micropix, credited in the old footer). Confirm who controls DNS/hosting and whether a contract is in place — this is a practical blocker for launch, though not for the concept. |
| 10 | **Email/CRM for catering leads** | Owner's choice of tool | If catering becomes a real revenue line, leads need somewhere to go. Out of scope for this build. |
| 11 | **The repository licence** | The team's decision | This repo was created with a **CC0 1.0** `LICENSE` (public-domain dedication). That is probably wrong for client work. This build neither added nor changed any licence. Decide deliberately. |

---

## 4. Assets and permissions checklist

| Item | Status | Action |
|---|---|---|
| Restaurant name & menu text | Used as published, no permission sought yet | Written permission before publication |
| Logo artwork | **Not used** | Permission + vector file |
| Photographs | **None used** — all placeholders | Permission + originals |
| Reference screenshots supplied in chat (Google listing, customer review photos, TripAdvisor) | **Not used** — reviewed as evidence only, nothing committed | These are third-party images: some carry a **TripAdvisor watermark** and some are attributed to named Google reviewers. They cannot be published on the site or committed to this repo. Their lasting value is evidential — they corroborate the hours, the signage strapline and the photography brief — and they must be replaced by the restaurant's own photographs. Batch B2 (four such photographs) is catalogued in [`05-image-identification.md`](05-image-identification.md) and presented on the internal `/review/` page; the images themselves are still not committed, not published, and not on that page |
| Typefaces (Fraunces, Inter) | SIL OFL 1.1, commercial use permitted, self-hosted | Keep the bundled licence files |
| Icons | Hand-drawn for this project | None needed |
| Favicon | Original mark, drawn for this project | None needed |
| Menu data | Transcribed from the restaurant's page | Remains the restaurant's property |
| Old site mirror (`audit/`) | Local only, **gitignored** | Kept as audit evidence; not committed or redistributed |

---

## 5. What happens when each answer arrives

| Answer | Change required |
|---|---|
| Confirmed hours | Edit `siteConfig.hours` → `schedule` **and** `schema` (keep the two in step); delete the hours `ConceptNote` |
| Decision on the Google rating | Either add a rating display with its source and date, or leave it off — nothing changes structurally |
| Patio seating confirmed | Add an outdoor-seating line to `/visit/` |
| Canonical strapline chosen | Edit `siteConfig.brand.tagline` (and align signage/print) |
| Current prices | Re-run `npm run menu:parse` after updating the source, or edit `src/data/menu.json`; delete the price note |
| Dietary / allergen data | Add per-dish fields in `menu.json`; `DishCard` and `MenuCategory` render chips once data exists |
| Official social accounts | Edit `siteConfig.social.accounts`; remove the ownership note |
| Catering details | Replace the open-questions block on `/catering/` with real information |
| Photography supplied | Replace `<PhotoPlaceholder>` with `<img>` at the same positions; add `alt` text and `width`/`height` |
| Photograph identifications confirmed or corrected | Edit the record in `src/data/photo-records.json` **and** the matching row in [`05-image-identification.md`](05-image-identification.md). `npm run verify` fails if the two disagree, or if a record names a dish that is not on the menu at that price. Then replace the placeholder in `/review/` and `/gallery/` with the licence-cleared photograph |
| Accessibility barrier reported | Log it in `docs/04-qa-results.md`, fix it in the working build, and update `/accessibility/` — including its last-reviewed date |
| Accessibility feedback email approved | Add it to `/accessibility/` as a second route beside the telephone; until then the phone number stays the only contact method |
| Ready to publish | Set the real `deployment.siteUrl` **and** flip `deployment.allowIndexing` to `true` |
