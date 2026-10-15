#!/usr/bin/env python3
"""
Parse the restaurant's legacy menu HTML into structured JSON.

Source : audit/raw/menu.html  (a copy of the live page, kept for provenance)
Output : src/data/menu.json

Why this exists
---------------
The legacy page holds ~157 price strings as unformatted inline <strong><em> runs
inside Bootstrap accordion panels. Four category headings point at the same
panel (href="#collapse7"), so the legacy page cannot be read reliably by hand.
This tool extracts the real dish names, prices and descriptions once, so that
`src/data/menu.json` becomes the single source of truth the site renders from.

This is a one-off migration tool. Day to day, edit src/data/menu.json directly.

Nothing here invents data. If a field is absent in the source, it is emitted as
null — the site renders "price to be confirmed" rather than a guess.

Usage:  python3 tools/parse-legacy-menu.py
"""

import html
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "audit" / "raw" / "menu.html"
OUT = ROOT / "src" / "data" / "menu.json"

# Panel order as it appears on the legacy page. Duplicate headings exist in the
# source ("Biryani / Rice" twice, "Drinks" twice); the duplicates are merged
# here and the fact is recorded in _meta.notes so the owner can confirm the
# intended category list.
CATEGORY_SLUGS = {
    "Appetizer": "appetizers",
    "Naan / Bread": "breads",
    "Paneer": "paneer",
    "Subzian / Veggies": "vegetables",
    "Chicken Specialties": "chicken",
    "Lamb / Goat Specialties": "lamb-goat",
    "Fish Specialties": "seafood",
    "From our Tandoor": "tandoor",
    "Biryani / Rice": "rice-biryani",
    "Biryani": "rice-biryani",
    "Chawal": "rice-biryani",
    "Daal / Lentils": "lentils",
    "Sides": "sides",
    "Meetha / Desserts": "desserts",
    "Drinks": "drinks",
}

TAG_RE = re.compile(r"<[^>]+>")
WS_RE = re.compile(r"[ \t\r\n\u00a0]+")
# "Samosa - $7.99"  (dash separated)  or "Samosa $7.99"  (price only)
DASH_PRICE_RE = re.compile(r"^(?P<name>.+?)\s*[-\u2013]\s*\$(?P<price>\d+(?:\.\d{2})?)\s*$")
BARE_PRICE_RE = re.compile(r"^(?P<name>.+?)\s*\$(?P<price>\d+(?:\.\d{2})?)\s*$")
HAS_PRICE_RE = re.compile(r"\$\s*\d")

# Legacy markup uses two different row shapes, so the parser is line based:
#   Appetizers      <strong><em>Samosa - $7.99</em></strong><br /><em>desc</em>
#   Everything else <strong>Saag Paneer - $18.49</strong><br /><em>desc</em>
# Both collapse to "<name> - $<price>" followed by description lines.


def clean(fragment: str) -> str:
    """Strip tags and collapse whitespace from an HTML fragment."""
    if not fragment:
        return ""
    text = fragment.replace("<br />", " ").replace("<br/>", " ").replace("<br>", " ")
    text = TAG_RE.sub(" ", text)
    text = html.unescape(text)
    text = text.replace("\u2019", "'").replace("\u2018", "'")
    return WS_RE.sub(" ", text).strip()


def split_panels(source: str) -> list[tuple[str, str]]:
    """Return [(category_title, body_html), ...] in document order."""
    headings = list(
        re.finditer(
            r'<h4 class="panel-title">\s*<a[^>]*>(?P<title>[^<]*)</a>',
            source,
        )
    )
    panels = []
    for index, match in enumerate(headings):
        start = match.end()
        end = headings[index + 1].start() if index + 1 < len(headings) else len(source)
        panels.append((html.unescape(match.group("title")).strip(), source[start:end]))
    return panels


def to_lines(body: str) -> list[str]:
    """Flatten a panel body to one meaningful string per visual row."""
    text = body
    for pattern, replacement in (
        (r"<br\s*/?>", "\n"),
        (r"</p\s*>", "\n"),
        (r"</em\s*>", "\n"),
        (r"</div\s*>", "\n"),
    ):
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
    text = TAG_RE.sub("", text)
    text = html.unescape(text)
    lines = []
    for line in text.split("\n"):
        line = WS_RE.sub(" ", line).strip()
        if line:
            lines.append(line)
    return lines


def parse_items(body: str) -> tuple[list[dict], list[str]]:
    """
    Pull items out of a panel body, along with any price-bearing line that
    could not be interpreted (reported rather than silently dropped).
    """
    items: list[dict] = []
    unmatched: list[str] = []
    current: dict | None = None
    desc_parts: list[str] = []

    def flush() -> None:
        nonlocal current, desc_parts
        if current is not None:
            current["description"] = (" ".join(desc_parts).strip()) or None
        current = None
        desc_parts = []

    for line in to_lines(body):
        match = DASH_PRICE_RE.match(line) or BARE_PRICE_RE.match(line)
        if match:
            flush()
            current = {
                "name": match.group("name").strip(),
                "price": float(match.group("price")),
                "description": None,
            }
            items.append(current)
        elif HAS_PRICE_RE.search(line):
            # A price we could not attribute to a dish name: keep the raw row
            # so it shows up in the report instead of vanishing.
            unmatched.append(line)
        elif current is not None:
            desc_parts.append(line)
        # else: stray text before any dish in this panel - ignore.
    flush()
    return items, unmatched


def merge_into(catalog: dict, slug: str, title: str, items: list[dict], unmatched: list[str]) -> None:
    existing = catalog.setdefault(
        slug, {"slug": slug, "sourceTitle": title, "items": [], "_unmatchedRows": []}
    )
    existing["_unmatchedRows"].extend(unmatched)
    seen = {(i["name"].lower(), i["price"]) for i in existing["items"]}
    for item in items:
        key = (item["name"].lower(), item["price"])
        if key in seen:
            continue
        seen.add(key)
        existing["items"].append(item)


def main() -> int:
    if not SRC.exists():
        print(f"error: source not found: {SRC}", file=sys.stderr)
        print("Fetch it with:", file=sys.stderr)
        print(
            '  curl -sS -o audit/raw/menu.html "http://www.urbantadkadallas.com/menu.html"',
            file=sys.stderr,
        )
        return 1

    source = SRC.read_text(encoding="utf-8", errors="replace")

    catalog: dict = {}
    order: list[str] = []
    duplicate_headings: list[str] = []
    seen_titles: set[str] = set()
    all_unmatched: list[str] = []
    source_prices = len(re.findall(r"\$\s*\d", source))

    for title, body in split_panels(source):
        slug = CATEGORY_SLUGS.get(title)
        if slug is None:
            print(f"warning: unmapped category heading ignored: {title!r}", file=sys.stderr)
            continue
        if title in seen_titles:
            duplicate_headings.append(title)
        seen_titles.add(title)
        if slug not in catalog:
            order.append(slug)
        items, unmatched = parse_items(body)
        all_unmatched.extend(unmatched)
        merge_into(catalog, slug, title, items, unmatched)

    total_items = sum(len(c["items"]) for c in catalog.values())
    missing_price = [
        f'{c["slug"]}: {i["name"]}'
        for c in catalog.values()
        for i in c["items"]
        if i["price"] is None
    ]
    missing_desc = sum(1 for c in catalog.values() for i in c["items"] if not i["description"])

    # Rows whose names collide across categories (e.g. "Chilli Paneer" is both an
    # appetiser at 13.99 and a curry at 18.49). Not an error, but the owner
    # should confirm both are intended.
    by_name: dict[str, list[str]] = {}
    for c in catalog.values():
        for i in c["items"]:
            by_name.setdefault(i["name"].lower(), []).append(f'{c["slug"]} @ {i["price"]}')

    output = {
        "_meta": {
            "source": "http://www.urbantadkadallas.com/menu.html",
            "note": (
                "Extracted verbatim from the restaurant's own published menu page. "
                "Dish names, descriptions and prices are the restaurant's, not ours. "
                "Prices were published in 2019 and MUST be re-confirmed by the owner "
                "before this site goes live."
            ),
            "confidence": "verbatim-from-owner-site",
            "unverified": [
                "All prices are as published on the legacy site (last modified 2019-10-22).",
                "No dish is marked vegetarian, vegan, halal, gluten-free or nut-free - "
                "no dietary data exists in the source, and none has been invented.",
                "Allergen information is not available and is deliberately absent.",
                "Spice levels are not available.",
                "Category names are taken from the legacy headings; duplicates were merged.",
            ],
            "mergeNotes": {
                "duplicateHeadingsInSource": duplicate_headings,
                "mergedCategories": {
                    "Biryani / Rice + Biryani + Chawal": "rice-biryani",
                    "Subzian / Veggies": "vegetables",
                },
                "noteOnLegacyBug": (
                    "On the legacy page four headings (Biryani / Rice x2, Biryani, Chawal) "
                    "share href=\"#collapse7\", so they all opened the same panel. "
                    "This file reflects the dishes actually present in the source markup."
                ),
            },
            "stats": {
                "categories": len(catalog),
                "items": total_items,
                "itemsWithoutPrice": len(missing_price),
                "itemsWithoutDescription": missing_desc,
                "priceStringsInSource": source_prices,
                "unmatchedPriceRows": len(all_unmatched),
                "namesAppearingInMultipleCategories": {
                    k: v for k, v in sorted(by_name.items()) if len(v) > 1
                },
            },
            "warnings": {
                "itemsWithoutPrice": missing_price,
                "unmatchedPriceRows": all_unmatched,
            },
        },
        "currency": "USD",
        "categories": [catalog[slug] for slug in order],
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(output, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    print(f"wrote {OUT.relative_to(ROOT)}")
    print(f"  categories : {len(catalog)}")
    print(f"  items      : {total_items}")
    print(f"  no price   : {len(missing_price)}")
    print(f"  no desc    : {missing_desc}")
    print(f"  price strings in source: {source_prices}")
    print(f"  unmatched price rows   : {len(all_unmatched)}")
    for slug in order:
        print(f'    {slug:16s} {len(catalog[slug]["items"]):3d} items')
    if duplicate_headings:
        print(f"  merged duplicate headings: {', '.join(sorted(set(duplicate_headings)))}")
    if missing_price:
        print("  rows needing attention:")
        for row in missing_price:
            print(f"    - {row}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
