# Food-image identification workflow

This document defines how photographs are analysed and catalogued before any of them are used on
the site. It exists because **a wrong dish on a restaurant's website is worse than no photograph**:
it misleads customers and embarrasses the restaurant. Where evidence is thin, the correct output is
uncertainty, not a confident guess.

---

## 1. Ground rules

| Rule | Why |
|---|---|
| Every uploaded image gets a record. None is silently skipped. | A skipped image becomes an untracked file that someone later places by guesswork. |
| Original filenames are preserved verbatim. | They are the only audit trail back to the upload. |
| An image is **never** assumed to belong to the restaurant currently under discussion. | Listing photos, competitor images and stock images all look alike in a batch. The restaurant association has to be stated or confirmed, not inferred. |
| A filename is **not** evidence of content. | `butter-chicken.jpg` may contain anything. |
| Nothing is invented: not a dish name, ingredient, cooking method, spice level, dietary property, allergen, price, or ownership claim. | These are the claims that create liability and customer complaints. |
| Originals are never overwritten, renamed, moved, compressed or modified. | Display renames are *suggested* records, applied only on explicit authorisation. |
| Web research never replaces the uploaded image, and a search result's photo is never assumed to show the same dish. | Research verifies names; it does not identify someone else's photograph. |

## 2. Evidence order

Weigh evidence in this order, strongest first:

**A.** information supplied with the image · **B.** readable text inside the image · **C.** a matching
item in a supplied menu list · **D.** visual characteristics (shape, colour, texture, visible
ingredients, cooking method implied by appearance, garnish, accompaniments, serving style) ·
**E.** external research.

Visual traits establish *appearance*, not recipe. An orange curry may be butter chicken, tikka
masala, paneer makhni or shahi paneer. A bowl of rice is not biryani. Grilled meat is not
automatically tandoori chicken. A fried pastry is not automatically a samosa.

## 3. Confidence levels

| Level | Meaning | How the dish may be named |
|---|---|---|
| **HIGH** | Clearly recognisable, or reliable text identifies it | Name it as a visual identification. Never claim the recipe or ingredients are verified. |
| **MEDIUM** | Resembles a specific dish, but the image does not establish identity | Mark as *probable*. |
| **LOW** | Several dishes fit equally well | Use a general category only. Do not present a specific dish as fact. |
| **UNIDENTIFIED** | Insufficient evidence | Assign no dish name. |

Confidence is never raised to make a result look more complete.

## 4. Record schema

One record per image. Fields are kept separate on purpose — collapsing them is how a guess becomes
a fact.

| Field | Notes |
|---|---|
| `image_id` | Unique internal ID. |
| `original_filename` | Preserved exactly as uploaded. |
| `content_type` | Single dish · multiple dishes · drink · dessert · raw ingredients · interior/exterior · menu · logo/non-food · unidentifiable. |
| `visual_identification` | What the image itself shows. |
| `alternatives` | Other dishes that would fit the same evidence. |
| `confidence` | HIGH / MEDIUM / LOW / UNIDENTIFIED. |
| `evidence` | Which of A–E, and what specifically. |
| `official_menu_match` | The menu name from `src/data/menu.json`, or none. |
| `verification_status` | See below. |
| `website_category` | Where it would sit if used. |
| `suggested_filename` | Lowercase, hyphenated, descriptive. A restaurant prefix is added **only** once the restaurant association is confirmed. |
| `alt_text` | Factual, no promotion, no keyword stuffing. |
| `description` | One short factual line for the site. |

### Verification statuses

`VERIFIED FROM PROVIDED TEXT` · `VERIFIED AGAINST OFFICIAL MENU` · `VISUAL IDENTIFICATION ONLY` ·
`PROBABLE MATCH` · `NEEDS HUMAN REVIEW` · `NOT A FOOD IMAGE` · `UNIDENTIFIED`

`VERIFIED AGAINST OFFICIAL MENU` is used **only** when an official menu was available and a
meaningful match was established. Looking like a menu item is not verification.

## 5. Duplicate handling

Classify pairs as: exact duplicate · same image at another resolution · cropped version · similar
photographs of one dish · different photographs of one dish · different dishes that merely look
alike. Duplicates are reported, never deleted. The same dish appearing in several images shares one
dish identity but keeps separate image records.

## 6. Per-batch output contract

1. total images received · 2. total analysed · 3. food images identified · 4. images matched to menu
items · 5. images with uncertain identity · 6. non-food images · 7. possible duplicates ·
8. images requiring human review. Counts come from actual processing, not estimates. Any image that
could not be analysed is listed by filename with the reason.

---

## 7. Batch record — B2, 15 Oct 2026

Four images supplied in chat. All four are **third-party Google Maps review photographs**
(attributed to named reviewers), so they are **evidence only — not publishable, not committed**.
See `03-unverified-details.md` §4.

The menu available for matching is `src/data/menu.json` (142 items, 13 categories), transcribed
from the restaurant's own menu page.

| ID | Original filename | Content | Visual identification | Alternatives | Conf. | Evidence | Official menu match | Status | Category | Suggested filename | Alt text |
|---|---|---|---|---|---|---|---|---|---|---|---|
| B2-01 | `paste-1792096537295-22776.png` | Single dish (grilled) | Grilled paneer (Indian cheese) tikka on a sizzler | Chicken tikka; paneer tikka variant unclear | HIGH (dish) / MEDIUM (variant) | B: caption reads "Paneer tikka" — a reviewer's label, not the restaurant's. D: pale, uniform cut faces with no fibrous grain, which argues paneer over chicken; charred edges; served on a cast-iron sizzler over shredded cabbage with lemon and a green chutney | **Paneer Tikka** $19.49 (probable); also **Amritsari Paneer Tikka** $19.49 (redder marinade) | PROBABLE MATCH | Menu — tandoor | `paneer-tikka-sizzler.jpg` | "Grilled paneer tikka served on a cast-iron sizzler with lemon and green chutney." |
| B2-02 | `paste-1792096555651-22776.png` | Single dish (fried) | Fried chicken appetiser with frenched wing bones | Chicken lollipops; chicken pakora; chicken 65 | MEDIUM | D: deep orange-red spiced crust, **thin bone ends protruding**, bed of shredded cabbage, lemon wedge, green chutney. Bones argue against boneless chicken 65 | **Chicken Lollipops** $13.99 (probable); alternatives **Chicken Pakora** $9.99, **Chicken 65** $13.99 | PROBABLE MATCH | Menu — appetisers | `fried-chicken-appetiser-platter.jpg` | "Deep-fried chicken appetiser with protruding wing bones, served with lemon and green chutney." |
| B2-03 | `paste-1792096572449-22776.png` | Multiple dishes | Three curries and tandoor bread — none individually identifiable | Orange curry: butter chicken / tikka masala / paneer makhni / shahi paneer. Dark gravy: any brown curry. Yellow speckled: a lentil dal | LOW | D only. No caption. A garnish, a creamy orange gravy and visible lentil grains are visible but distinguish none of the candidates | none confirmed | NEEDS HUMAN REVIEW | Only if the restaurant confirms the dishes | `mixed-curry-plate.jpg` | "Indian curries and tandoor bread served on a steel plate; dishes not individually identified." |
| B2-04 | `paste-1792096679678-22776.png` | Multiple dishes | Two curries, steamed white rice, naan, green herb-coated kebabs | Rice: plain or jeera. Green kebabs: hara bhara kebab, spinach pakora or a veg kebab. Curries unidentified | LOW–MEDIUM | B: caption reads "ood platter with naan bread" (truncated) — generic. D: rice is plainly steamed, **not** biryani; the kebabs carry a green spinach/herb coating with lemon on shredded cabbage | **Harabara Kebob** $12.99 (probable, for the green kebabs only); **Plain Rice** $4.99 (possible); curries none | NEEDS HUMAN REVIEW | Menu — appetisers / rice | `table-platter-naan-rice-kebabs.jpg` | "A table of Indian dishes with naan, steamed rice and green herb-coated kebabs; individual curries not identified." |

### Short website descriptions (§5 field)

The 12-column record table above follows §9's output contract. This field is carried separately so
the table does not widen further. These are factual one-liners suitable for a caption or card body.

| ID | Website description |
|---|---|
| B2-01 | Grilled paneer tikka on a sizzling cast-iron platter with lemon and green chutney. |
| B2-02 | A fried chicken appetiser with frenched wing bones, served on shredded cabbage with lemon and chutney. |
| B2-03 | Three Indian curries with folded tandoor bread on a steel platter. |
| B2-04 | A large table spread: naan, steamed rice, green herb-coated kebabs and two curries. |

### Duplicate finding

**B2-01 is very probably the same photograph as two images from the previous batch**
(`paste-1792096533298-22776.png` and `paste-1792096534668-22776.png`), which were themselves
identical to each other. The paste timestamps sit ~3 seconds apart and the frames match
(composition, reviewer attribution "A M", plateware, chutney bowl).

This is a **visual** comparison. The files could not be read byte-for-byte — see limitations — so
it is reported as a probable duplicate, not a confirmed one. If confirmed, the one dish keeps a
single dish identity while each file keeps its own image record.

### Batch summary (actual counts)

| Measure | Count |
|---|---|
| Images received | 4 |
| Images analysed | 4 |
| Food images | 4 |
| Non-food images | 0 |
| Probable menu matches | 2 (B2-01, B2-02) |
| Partial match (one component of a multi-dish frame) | 1 (B2-04) |
| Menu matches confirmed | **0** — nothing here rises to official verification |
| Uncertain identity | 2 (B2-03, B2-04) |
| Possible duplicates | 1 (B2-01 vs two B1 files) |
| Requiring human review | 2 (B2-03, B2-04), plus the variant question on B2-01 |

## 8. Limitations of this run

1. **No file-level access to the images.** They were supplied as paths on the user's own computer;
   this environment cannot open, save, rename or organise them. Analysis was performed on the
   images as rendered in the conversation. **No file was saved, renamed or modified**, and no claim
   to the contrary is made here.
2. **The restaurant association is not established by the user.** These look like listing photos for
   the same restaurant as batch B1 (matching reviewer-photo format, plateware and the menu's
   vocabulary), but that link is contextual. Menu matching below is therefore against the menu in
   this repository, and is marked conservative.
3. **These images cannot be published.** Third-party review photography with named reviewers.
   They are evidence, not assets.
4. Web lookup was not used to confirm dish names for this batch; see rule 10.

## 9. Open questions this batch raises

| # | Question | Owner |
|---|---|---|
| 1 | Does the restaurant confirm any of the probable matches (B2-01, B2-02, B2-04)? | Restaurant |
| 2 | Is `Amritsari Chicken Tikkka` in the menu data a typo in the source menu, or intentional? It is transcribed verbatim. | Restaurant |
| 3 | Our own photography should cover the dishes already in the brief; the green kebab and sizzler platter shots validated here should be on the list. | Photography |

---

## 10. Where this workflow is published

This document is the authored record. It has two counterparts in the repository, and they are
kept in step deliberately:

| Artefact | Role |
|---|---|
| `docs/05-image-identification.md` | This document — the authored record of each batch, written to be read and reviewed by a person. |
| `src/data/photo-records.json` | The machine-readable catalogue: the same records in the form the review page renders and a website-building agent would read. It carries the summary, the duplicate finding, the limitations and the open questions. |
| `src/pages/review.astro` (served at `/review/`) | The shareable review page. It presents the records, explains what is being asked, and lets a reviewer record a decision per image — confirm, correct, or escalate to the restaurant — which is assembled into a text block to send back. |
| `tools/verify-photo-records.py` | The gate that keeps the three honest: a record may only name a dish that exists in `src/data/menu.json` **at the same price**, the summary must be borne out by the records it summarises, and every record must still appear in this document with the same filename, confidence, status and suggested name. |

**The photographs themselves are not on that page either.** The withhold rule in §1 applies to every
artefact, not just to the website: third-party review images are evidence for identification and are
never republished. The page names each original file instead, so a reviewer can match a record to
the file in their own copy.

To run and share it:

```bash
npm run check          # typecheck, build, and all three gates
npm run dev            # then open /review/
```

`npm run verify` now includes the photo-record gate, so a wrong dish name, a stale price or a record
that has drifted from this document fails the build rather than reaching a person as a confident
claim.

The same build is deployed to the preview environment at
https://site-fe03b03cd9e449fcb4905b5454ba6cde.freebuff.page (site id and URLs in `deploy/site.json`, a
static-asset Worker in `deploy/worker.js` serving a copy of `dist/`). To update what that link serves,
rebuild and deploy again against the preview environment. Every page stays `noindex` with `Disallow: /`
in robots, so the link works for anyone who has it but will not appear in search results.
