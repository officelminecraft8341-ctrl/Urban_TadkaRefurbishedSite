#!/usr/bin/env python3
"""
verify-photo-records.py — keeps the photograph catalogue honest.

The catalogue in src/data/photo-records.json is what the review page renders and
what a website-building agent would read. Its whole value is that nothing in it
is invented, so this gate checks the claims that would be expensive to get wrong:

  1. Every dish a record names exists in src/data/menu.json AT THE SAME PRICE.
     A dish name that is not on the restaurant's menu is a fabricated menu item,
     which is exactly the failure the workflow exists to prevent.
  2. Every verification status is one of the statuses the catalogue defines.
  3. Every record's id, original filename, confidence, status and suggested
     filename also appear in the authored batch record
     (docs/05-image-identification.md), so the rendered catalogue cannot drift
     away from the document a person actually reviews.
  4. The batch summary agrees with the records it summarises: "menu matches
     confirmed: 0" cannot survive a record being marked as verified.
  5. Record ids and suggested filenames are unique, and suggested filenames obey
     the naming rule (lowercase, hyphenated, no unnecessary characters).
  6. A batch whose photographs are not publishable contains no record claiming an
     included image.
  7. Alt text and descriptions are present and free of promotional language.

Reads JSON with the standard library only, so it adds no dependency to the
project. Runs against the source files, not against dist/.

Usage:  python3 tools/verify-photo-records.py
Exit code 1 if any check fails.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RECORDS = ROOT / "src" / "data" / "photo-records.json"
MENU = ROOT / "src" / "data" / "menu.json"
DOC = ROOT / "docs" / "05-image-identification.md"

FILENAME_RE = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*\.(jpg|jpeg|png|webp|avif)$")

# Columns in the authored batch-record table (docs/05-image-identification.md):
# the 12-column output contract, which carries the 13-field record schema with the
# website description split into its own table. Used to identify that table here,
# since the document holds other tables whose rows begin with a record id.
COLUMNS = 12

# Section 6 of the workflow forbids promotional language in alt text: it is an
# accessibility description, not marketing copy. A blocklist catches the usual
# offenders; it is not a substitute for reading the text.
PROMOTIONAL = (
    "delicious", "authentic", "amazing", "mouth-watering", "mouthwatering",
    "best ", "tasty", "yummy", "irresistible", "perfectly", "must-try",
)

def menu_index() -> tuple[set[tuple[str, float]], set[str]]:
    data = json.loads(MENU.read_text(encoding="utf-8"))
    pairs: set[tuple[str, float]] = set()
    names: set[str] = set()
    for category in data["categories"]:
        for item in category["items"]:
            pairs.add((item["name"], float(item["price"])))
            names.add(item["name"])
    return pairs, names


def doc_rows() -> dict[str, str]:
    """Pull the batch record table rows out of the authored document.

    The document holds more than one table whose rows begin with a record id —
    the record table and the 2-column website-description table — so the record
    table is located by its header (the only COLUMNS-wide table whose first cell
    is "ID") and read until the table ends. Matching on "| B" alone silently
    picked up the shorter table and overwrote the record rows, which made every
    parity check below compare against the wrong cells.
    """
    if not DOC.exists():
        return {}

    lines = DOC.read_text(encoding="utf-8").splitlines()
    start = None
    for index, line in enumerate(lines):
        if not line.strip().startswith("|"):
            continue
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        if len(cells) == COLUMNS and cells[0] == "ID":
            start = index
            break

    if start is None:
        return {}

    rows: dict[str, str] = {}
    # start + 2 skips the header row and the |---|---| separator beneath it.
    for line in lines[start + 2 :]:
        stripped = line.strip()
        if not stripped.startswith("|"):
            break
        cells = [cell.strip() for cell in stripped.strip("|").split("|")]
        if len(cells) != COLUMNS:
            break
        rows[cells[0]] = stripped
    return rows


def main() -> int:
    for path in (RECORDS, MENU):
        if not path.exists():
            print(f"error: {path.relative_to(ROOT)} not found.", file=sys.stderr)
            return 1

    catalogue = json.loads(RECORDS.read_text(encoding="utf-8"))
    pairs, menu_names = menu_index()
    rows = doc_rows()
    statuses = set(catalogue["_meta"]["statuses"])

    errors: list[str] = []
    checked = 0

    seen_ids: dict[str, str] = {}
    seen_names: dict[str, str] = {}

    for batch in catalogue["batches"]:
        batch_id = batch["id"]
        records = batch["records"]
        slug = batch_id

        for record in records:
            checked += 1
            rid = record["id"]
            where = f"{slug}/{rid}"

            # -- 1. menu truth ------------------------------------------
            for item in record["officialMenuMatch"]["items"]:
                name, price = item["name"], float(item["price"])
                if (name, price) not in pairs:
                    if name in menu_names:
                        errors.append(
                            f"{where}: {name!r} is on the menu but not at ${price:.2f} "
                            f"— the price in this record does not match src/data/menu.json"
                        )
                    else:
                        errors.append(
                            f"{where}: {name!r} does not exist in src/data/menu.json "
                            f"— an invented menu item"
                        )

            # -- 2. statuses -------------------------------------------
            if record["verificationStatus"] not in statuses:
                errors.append(
                    f"{where}: verification status {record['verificationStatus']!r} "
                    f"is not one of the defined statuses"
                )

            # -- 3. parity with the authored document -------------------
            row = rows.get(rid)
            if not row:
                errors.append(
                    f"{where}: no matching row in {DOC.relative_to(ROOT)} "
                    f"— the authored record and this catalogue disagree"
                )
            else:
                cells = [cell.strip() for cell in row.strip("|").split("|")]
                if len(cells) != COLUMNS:
                    errors.append(
                        f"{where}: the authored row has {len(cells)} columns, "
                        f"expected {COLUMNS}"
                    )
                for field, expected in (
                    ("original_filename", record["originalFilename"]),
                    ("confidence", record["confidence"]),
                    ("verification_status", record["verificationStatus"]),
                    ("suggested_filename", record["suggestedFilename"]),
                    ("alt_text", record["altText"]),
                ):
                    if expected not in row:
                        errors.append(
                            f"{where}: {field} {expected!r} is not in the authored row "
                            f"of {DOC.relative_to(ROOT)}"
                        )

            # -- 4. naming rule ----------------------------------------
            if not FILENAME_RE.match(record["suggestedFilename"]):
                errors.append(
                    f"{where}: suggested filename {record['suggestedFilename']!r} "
                    f"is not lowercase hyphenated words with an image extension"
                )

            # -- 5. text that will be published ------------------------
            for field in ("altText", "description"):
                if not record[field].strip():
                    errors.append(f"{where}: {field} is empty")
            lowered = record["altText"].lower()
            for word in PROMOTIONAL:
                if word in lowered:
                    errors.append(
                        f"{where}: alt text contains promotional language ({word.strip()!r}); "
                        f"alt text is a description, not marketing copy"
                    )

            # -- 6. withhold rule --------------------------------------
            if not batch["photosPublishable"] and record["imageIncluded"]:
                errors.append(
                    f"{where}: batch {slug} is marked not publishable but the record "
                    f"claims an included image"
                )

            # -- 7. uniqueness -----------------------------------------
            if rid in seen_ids:
                errors.append(f"{where}: duplicate record id (also {seen_ids[rid]})")
            seen_ids[rid] = where

            name = record["suggestedFilename"]
            if name in seen_names:
                errors.append(f"{where}: duplicate suggested filename (also {seen_names[name]})")
            seen_names[name] = where

        # -- 8. the summary must be borne out by the records -------------
        counts = {row["label"]: row for row in batch["summary"]}

        def number(label: str) -> int | None:
            entry = counts.get(label)
            if entry is None:
                errors.append(f"{slug}: summary is missing {label!r}")
                return None
            try:
                return int(entry["value"])
            except ValueError:
                errors.append(f"{slug}: summary value for {label!r} is not a number")
                return None

        by_status: dict[str, int] = {}
        for record in records:
            key = record["verificationStatus"]
            by_status[key] = by_status.get(key, 0) + 1

        uncertain = sum(1 for r in records if r["confidenceLevel"].startswith("low"))

        expectations = (
            ("Images received", len(records)),
            ("Images analysed", len(records)),
            ("Menu matches confirmed", by_status.get("VERIFIED AGAINST OFFICIAL MENU", 0)),
            ("Requiring human review", by_status.get("NEEDS HUMAN REVIEW", 0)),
            ("Probable menu matches", by_status.get("PROBABLE MATCH", 0)),
            ("Uncertain identity", uncertain),
        )
        for label, actual in expectations:
            claimed = number(label)
            if claimed is not None and claimed != actual:
                errors.append(
                    f"{slug}: summary claims {label} = {claimed}, but the records give {actual}"
                )

        # Every authored row for this batch must have a record here, too.
        for rid in sorted(rows):
            if rid.startswith(batch_id) and rid not in seen_ids:
                errors.append(
                    f"{slug}: {DOC.relative_to(ROOT)} has a row for {rid} that this "
                    f"catalogue does not contain"
                )

    print(f"Catalogue      : {RECORDS.relative_to(ROOT)}")
    print(f"Menu source    : {MENU.relative_to(ROOT)} ({len(pairs)} name/price pairs)")
    print(f"Authored record: {DOC.relative_to(ROOT)} ({len(rows)} rows)")
    print(f"Records checked: {checked}\n")

    if errors:
        print(f"{len(errors)} error(s):")
        for error in errors:
            print(f"  x {error}")
        return 1

    print("All checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
