#!/usr/bin/env python3
"""
verify-build.py — quality gate for the built site.

Runs against dist/ after `npm run build` and checks the things that are easy to
break and embarrassing to ship:

  * every internal link resolves to a file that exists
  * every in-page anchor (#order, #appetizers...) resolves to a real id
  * no href="#" or empty href (dead controls)
  * every page has exactly one <h1> and no skipped heading levels
  * unique, non-empty <title> and meta description
  * canonical, robots, Open Graph and JSON-LD present and well formed
  * every <img> has alt, every <button> has an accessible name
  * target="_blank" is always paired with rel="noopener"
  * no TODO / FIXME / lorem ipsum, and no "undefined"/"null" leaking into text
  * sitemap.xml lists exactly the pages that were built
  * robots.txt matches the indexing setting

Uses only the Python standard library, so it adds no dependency to the project.

Usage:
    python3 tools/verify-build.py            # verify dist/
    python3 tools/verify-build.py --quiet    # errors only
Exit code is 1 if any check fails.
"""

from __future__ import annotations

import json
import re
import sys
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"

VOID_TAGS = {
    "area", "base", "br", "col", "embed", "hr", "img", "input",
    "link", "meta", "param", "source", "track", "wbr",
}
HEADING_TAGS = {"h1", "h2", "h3", "h4", "h5", "h6"}
BAD_TEXT = re.compile(r"\b(TODO|FIXME|XXX|Lorem ipsum|PLACEHOLDER TEXT)\b", re.IGNORECASE)


class Page(HTMLParser):
    """Minimal DOM-ish collector for the checks above."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.html_lang: str | None = None
        self.charset: str | None = None
        self.viewport: str | None = None
        self.title = ""
        self.description: str | None = None
        self.canonical: str | None = None
        self.robots: str | None = None
        self.og: dict[str, str] = {}
        self.jsonld: list[str] = []
        self.headings: list[tuple[str, str]] = []
        self.anchors: list[dict] = []
        self.images: list[dict] = []
        self.buttons: list[dict] = []
        self.ids: set[str] = set()
        self.text_parts: list[str] = []
        self.forms: list[dict] = []
        self._stack: list[dict] = []
        self._in_title = False
        self._in_jsonld = False
        self._in_script_or_style = 0

    # -- helpers ---------------------------------------------------------
    def _current_text(self) -> str:
        return " ".join(
            (frame["text"] for frame in self._stack if frame.get("collect")),
        ).strip()

    def handle_starttag(self, tag, attrs):
        a = {k.lower(): (v or "") for k, v in attrs}
        if tag == "html":
            self.html_lang = a.get("lang")
        if tag == "meta":
            if "charset" in a:
                self.charset = a["charset"]
            name = a.get("name", "").lower()
            prop = a.get("property", "").lower()
            if name == "viewport":
                self.viewport = a.get("content", "")
            elif name == "description":
                self.description = a.get("content", "")
            elif name == "robots":
                self.robots = a.get("content", "")
            elif prop.startswith("og:"):
                self.og[prop] = a.get("content", "")
        if tag == "link" and a.get("rel", "").lower() == "canonical":
            self.canonical = a.get("href")
        if "id" in a and a["id"]:
            self.ids.add(a["id"])
        if tag == "title":
            self._in_title = True
        if tag == "script":
            if a.get("type", "").lower() == "application/ld+json":
                self._in_jsonld = True
            self._in_script_or_style += 1
        if tag == "style":
            self._in_script_or_style += 1

        if tag in HEADING_TAGS:
            self._stack.append({"tag": tag, "text": "", "collect": True})
        elif tag == "a":
            frame = {"tag": "a", "text": "", "collect": True,
                     "href": a.get("href", ""), "target": a.get("target", ""),
                     "rel": a.get("rel", "")}
            self._stack.append(frame)
            self.anchors.append(frame)
        elif tag == "button":
            frame = {"tag": "button", "text": "", "collect": True,
                     "aria-label": a.get("aria-label", "")}
            self._stack.append(frame)
            self.buttons.append(frame)
        elif tag == "img":
            self.images.append({"alt": a.get("alt"), "src": a.get("src", "")})
        elif tag == "form":
            frame = {"tag": "form", "text": "", "collect": False,
                     "action": a.get("action", ""), "method": a.get("method", "get")}
            self._stack.append(frame)
            self.forms.append(frame)
        elif tag not in VOID_TAGS:
            self._stack.append({"tag": tag, "text": "", "collect": False})

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False
        if tag == "script":
            self._in_jsonld = False
            self._in_script_or_style = max(0, self._in_script_or_style - 1)
        if tag == "style":
            self._in_script_or_style = max(0, self._in_script_or_style - 1)

        # Pop the most recent matching open tag (tolerates unclosed voids).
        for index in range(len(self._stack) - 1, -1, -1):
            frame = self._stack[index]
            if frame["tag"] == tag:
                del self._stack[index:]
                if tag in HEADING_TAGS:
                    self.headings.append((tag, frame["text"].strip()))
                break

    def handle_data(self, data):
        if self._in_title:
            self.title += data
        if self._in_jsonld:
            self.jsonld.append(data)
        if self._in_script_or_style:
            return
        for frame in self._stack:
            if frame.get("collect"):
                frame["text"] += data
        self.text_parts.append(data)


def collect_pages() -> dict[str, Page]:
    pages: dict[str, Page] = {}
    for path in sorted(DIST.rglob("*.html")):
        rel = path.relative_to(DIST)
        posix = rel.as_posix()
        if rel.name == "index.html":
            parent = rel.parent.as_posix()
            url = "/" if parent == "." else f"/{parent}/"
        else:
            # e.g. /404.html must NOT be folded onto "/".
            url = f"/{posix}"
        parser = Page()
        parser.feed(path.read_text(encoding="utf-8", errors="replace"))
        parser.close()
        pages[url] = parser
    return pages


def dist_path(url: str) -> Path:
    """Map a page URL back to the file on disk (/ -> index.html, /menu/ -> menu/index.html)."""
    if url == "/":
        return DIST / "index.html"
    if url.endswith("/"):
        return DIST / url.lstrip("/") / "index.html"
    return DIST / url.lstrip("/")


def resolve_target(href_path: str, pages: dict[str, Page]) -> str | None:
    """Map an internal href to the key used in `pages`."""
    if href_path in pages:
        return href_path
    candidate = href_path.rstrip("/") + "/"
    if candidate in pages:
        return candidate
    plain = href_path.lstrip("/")
    if plain and f"/{plain}" in pages:
        return f"/{plain}"
    if f"/{plain}.html" in pages:
        return f"/{plain}.html"
    # A real file on disk (assets, fonts, favicon, robots).
    fs = DIST / plain
    if fs.exists():
        return None  # exists, not an HTML page: fine
    return "MISSING"


def main() -> int:
    quiet = "--quiet" in sys.argv

    if not DIST.exists():
        print("error: dist/ not found. Run `npm run build` first.", file=sys.stderr)
        return 1

    pages = collect_pages()
    errors: list[str] = []
    warnings: list[str] = []
    notes: list[str] = []

    if not pages:
        print("error: no HTML pages found in dist/", file=sys.stderr)
        return 1

    # ------------------------------------------------------------------
    # 1. Per-page checks
    # ------------------------------------------------------------------
    titles: dict[str, list[str]] = {}
    descriptions: dict[str, list[str]] = {}

    for url, page in sorted(pages.items()):
        def fail(message: str) -> None:
            errors.append(f"{url}: {message}")

        if page.html_lang != "en":
            fail(f'<html lang> is {page.html_lang!r}, expected "en"')
        if not page.charset:
            fail("no <meta charset>")
        if not page.viewport or "width=device-width" not in page.viewport:
            fail(f"viewport meta missing or wrong: {page.viewport!r}")

        title = page.title.strip()
        if not title:
            fail("empty <title>")
        titles.setdefault(title, []).append(url)

        desc = (page.description or "").strip()
        if not desc:
            fail("no meta description")
        elif len(desc) > 175:
            warnings.append(f"{url}: meta description is {len(desc)} chars (>175)")
        descriptions.setdefault(desc, []).append(url)

        if not page.canonical or not page.canonical.startswith("http"):
            fail(f"canonical not absolute: {page.canonical!r}")
        if not page.robots:
            fail("no robots meta")
        elif "noindex" not in page.robots:
            warnings.append(
                f"{url}: robots meta is {page.robots!r}; concept builds should be noindex"
            )

        for prop in ("og:title", "og:description", "og:url"):
            if not page.og.get(prop):
                fail(f"missing {prop}")

        for blob in page.jsonld:
            try:
                json.loads(blob)
            except json.JSONDecodeError as exc:
                fail(f"invalid JSON-LD: {exc}")

        h1s = [text for tag, text in page.headings if tag == "h1"]
        if len(h1s) != 1:
            fail(f"expected exactly one <h1>, found {len(h1s)}")
        elif not h1s[0]:
            fail("<h1> has no text")

        # Heading order: never skip a level going down.
        level = 0
        for tag, text in page.headings:
            current = int(tag[1])
            if level and current > level + 1:
                fail(f"heading level jumps from h{level} to h{current} ({text[:40]!r})")
            level = current

        # Images: alt attribute must be present (empty is allowed when decorative).
        for image in page.images:
            if image["alt"] is None:
                fail(f'<img src="{image["src"]}"> has no alt attribute')

        # Buttons need an accessible name.
        for button in page.buttons:
            if not button["text"].strip() and not button["aria-label"].strip():
                fail("a <button> has no text and no aria-label")

        # Forms must actually submit somewhere.
        for form in page.forms:
            if not form["action"].strip():
                fail("<form> has no action attribute")

        # Links.
        for anchor in page.anchors:
            href = anchor["href"].strip()
            if href in ("", "#"):
                fail(f'dead link: href="{href}" (text: {anchor["text"].strip()[:40]!r})')
                continue
            if "noopener" not in anchor["rel"] and anchor.get("target") == "_blank":
                fail(f'target="_blank" without rel="noopener": {href}')
            if href.startswith(("mailto:", "tel:", "http://", "https://", "//")):
                continue

            path_part, _, fragment = href.partition("#")
            if path_part.startswith("/"):
                resolved = resolve_target(path_part, pages)
                if resolved == "MISSING":
                    fail(f"internal link target does not exist: {href}")
                elif resolved and fragment:
                    if fragment not in pages[resolved].ids:
                        fail(f"anchor #{fragment} not found in {resolved}")
            elif fragment and not path_part:
                if fragment not in page.ids:
                    fail(f"in-page anchor #{fragment} has no matching id")

        body_text = " ".join(page.text_parts)
        if BAD_TEXT.search(body_text):
            fail(f"placeholder text found: {BAD_TEXT.search(body_text).group(0)!r}")
        if re.search(r">\s*(undefined|null)\s*<", body_text):
            fail("a literal undefined/null leaked into the rendered text")

        # Brand tokens must be injected from config AND must outrank the
        # stylesheet fallbacks. Astro emits its <link> after this block, so the
        # selector is doubled; without it, re-theming from site.js silently fails.
        raw = dist_path(url).read_text(encoding="utf-8", errors="replace")
        if "--brand-gold" not in raw:
            fail("brand tokens were not injected from src/config/site.js")
        elif ":root:root" not in raw:
            fail(
                "injected brand tokens use plain :root, so stylesheet fallbacks "
                "would override them and re-theming from config would fail"
            )

    # Duplicate titles/descriptions are a real SEO problem.
    for title, urls in titles.items():
        if len(urls) > 1:
            errors.append(f"duplicate <title> {title!r} on {urls}")
    for desc, urls in descriptions.items():
        if len(urls) > 1:
            errors.append(f"duplicate meta description on {urls}")

    # ------------------------------------------------------------------
    # 2. robots.txt and sitemap.xml
    # ------------------------------------------------------------------
    robots = DIST / "robots.txt"
    if not robots.exists():
        errors.append("robots.txt was not built")
    else:
        text = robots.read_text(encoding="utf-8")
        if "Sitemap:" not in text and "Disallow: /" not in text:
            errors.append("robots.txt has neither a sitemap nor a disallow rule")
        notes.append(
            "robots.txt mode: "
            + ("indexing allowed" if "Allow: /" in text else "indexing disallowed (concept build)")
        )

    sitemap = DIST / "sitemap.xml"
    if not sitemap.exists():
        errors.append("sitemap.xml was not built")
    else:
        try:
            root = ET.fromstring(sitemap.read_text(encoding="utf-8"))
            ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
            locs = [el.text for el in root.findall(".//s:loc", ns)]
            if not locs:
                errors.append("sitemap.xml has no <loc> entries")
            listed = {
                re.sub(r"^https?://[^/]+", "", loc).rstrip("/") + "/" for loc in locs
            }
            built = set(pages.keys())
            # 404.html is intentionally absent from the sitemap.
            built.discard("/404.html")
            missing = built - listed
            extra = listed - built
            if missing:
                errors.append(f"sitemap is missing built pages: {sorted(missing)}")
            if extra:
                errors.append(f"sitemap lists pages that were not built: {sorted(extra)}")
        except ET.ParseError as exc:
            errors.append(f"sitemap.xml is not valid XML: {exc}")

    # ------------------------------------------------------------------
    # 3. Assets referenced by pages
    # ------------------------------------------------------------------
    asset_refs: set[str] = set()
    for path in DIST.rglob("*.html"):
        html = path.read_text(encoding="utf-8", errors="replace")
        for match in re.finditer(r'(?:href|src)="(/[^"#?]+\.(?:css|js|woff2|svg|png|jpg|webp|ico))"', html):
            asset_refs.add(match.group(1))
    for ref in sorted(asset_refs):
        if not (DIST / ref.lstrip("/")).exists():
            errors.append(f"referenced asset does not exist: {ref}")

    source_maps = list(DIST.rglob("*.map"))
    if source_maps:
        warnings.append(f"{len(source_maps)} source map(s) shipped in dist/")

    # ------------------------------------------------------------------
    # 4. Report
    # ------------------------------------------------------------------
    total_bytes = sum(p.stat().st_size for p in DIST.rglob("*") if p.is_file())

    if not quiet:
        print(f"Pages built      : {len(pages)}")
        for url in sorted(pages):
            target = dist_path(url)
            size = target.stat().st_size if target.exists() else 0
            print(f"  {url:22s} {size / 1024:6.1f} KB html")
        print(f"Assets referenced: {len(asset_refs)}")
        print(f"Total dist size  : {total_bytes / 1024:.0f} KB")
        for note in notes:
            print(f"note: {note}")

    if warnings and not quiet:
        print(f"\n{len(warnings)} warning(s):")
        for warning in warnings:
            print(f"  ! {warning}")

    if errors:
        print(f"\n{len(errors)} error(s):")
        for error in errors:
            print(f"  x {error}")
        return 1

    print("\nAll checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
