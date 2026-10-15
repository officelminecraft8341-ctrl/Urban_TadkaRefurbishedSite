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

---

## 2. The hours conflict, in detail

Three sources disagree. The site currently shows the restaurant's **own** published hours, because
that is the most authoritative source available, and flags them.

| Source | Lunch | Dinner | Closed |
|---|---|---|---|
| **The restaurant's own Contact page** (used on the site) | Mon, Wed–Fri 11:00–2:30 · Sat 11:30–3:00 · Sun 11:30–2:30 | Mon–Sun 5:30–9:45 | Tuesday |
| Yelp and Uber Eats listings | Mon 11:00–2:00 | 5:30–9:30 | — |
| Commented-out HTML on the restaurant's own homepage | Mon–Fri 11:30–2:30 (labelled "Buffet") | — | Sat–Sun 11:30–5:30 |

The third row is dead code on their homepage, not visible to visitors, but it shows a fourth
intention. Once the restaurant confirms the real hours, the change is one edit in
`src/config/site.js` → `hours.schedule` (and `hours.schema` for structured data), and the
"Confirm before launch" note is deleted.

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
| Typefaces (Fraunces, Inter) | SIL OFL 1.1, commercial use permitted, self-hosted | Keep the bundled licence files |
| Icons | Hand-drawn for this project | None needed |
| Favicon | Original mark, drawn for this project | None needed |
| Menu data | Transcribed from the restaurant's page | Remains the restaurant's property |
| Old site mirror (`audit/`) | Local only, **gitignored** | Kept as audit evidence; not committed or redistributed |

---

## 5. What happens when each answer arrives

| Answer | Change required |
|---|---|
| Confirmed hours | Edit `siteConfig.hours`; delete the hours `ConceptNote` |
| Current prices | Re-run `npm run menu:parse` after updating the source, or edit `src/data/menu.json`; delete the price note |
| Dietary / allergen data | Add per-dish fields in `menu.json`; `DishCard` and `MenuCategory` render chips once data exists |
| Official social accounts | Edit `siteConfig.social.accounts`; remove the ownership note |
| Catering details | Replace the open-questions block on `/catering/` with real information |
| Photography supplied | Replace `<PhotoPlaceholder>` with `<img>` at the same positions; add `alt` text and `width`/`height` |
| Ready to publish | Set the real `deployment.siteUrl` **and** flip `deployment.allowIndexing` to `true` |
