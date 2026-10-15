#!/usr/bin/env python3
"""
check-contrast.py — automated WCAG contrast gate.

Reads the real token values out of src/styles/tokens.css (rather than a copy),
then checks every foreground/background pair the design actually renders.

Why this exists: on a warm palette the obvious failure is using an accent colour
as text on a light surface. Brand gold #FFCC29 measures 1.51:1 on white — pretty,
and unreadable. This gate makes that class of mistake impossible to ship.

Thresholds (WCAG 2.2):
  4.5:1  normal text          (AA, 1.4.3)
  3.0:1  large text and       (AA 1.4.3 / non-text contrast 1.4.11)
         control boundaries

Usage:  python3 tools/check-contrast.py
Exit code 1 if any pair falls below its threshold.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TOKENS = ROOT / "src" / "styles" / "tokens.css"


def read_tokens(path: Path) -> dict[str, str]:
    """Pull `--name: #hex;` declarations out of the token stylesheet."""
    text = path.read_text(encoding="utf-8")
    tokens: dict[str, str] = {}
    for match in re.finditer(r"(--[a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\s*;", text):
        tokens[match.group(1)] = match.group(2).lower()
    return tokens


def relative_luminance(hex_color: str) -> float:
    value = hex_color.lstrip("#")
    if len(value) == 3:
        value = "".join(ch * 2 for ch in value)
    channels = [int(value[i : i + 2], 16) / 255 for i in (0, 2, 4)]
    linear = [
        c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in channels
    ]
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]


def contrast_ratio(foreground: str, background: str) -> float:
    a, b = relative_luminance(foreground), relative_luminance(background)
    lighter, darker = max(a, b), min(a, b)
    return (lighter + 0.05) / (darker + 0.05)


# Composite white-over-black at a given alpha, for translucent control borders.
def over(foreground: str, background: str, alpha: float) -> str:
    f = foreground.lstrip("#")
    b = background.lstrip("#")
    out = []
    for i in (0, 2, 4):
        channel = round(int(f[i : i + 2], 16) * alpha + int(b[i : i + 2], 16) * (1 - alpha))
        out.append(f"{channel:02x}")
    return "#" + "".join(out)


TEXT = 4.5
UI = 3.0

# (label, foreground token, background token, threshold, note)
PAIRS: list[tuple[str, str, str, float, str]] = [
    ("body text", "--ink", "--paper", TEXT, "default paragraph and heading colour"),
    ("secondary text", "--ink-2", "--paper", TEXT, "ledes, card text, prose"),
    ("caption text", "--ink-soft", "--paper", TEXT, "eyebrows, hints, meta"),
    ("secondary on warm", "--ink-2", "--paper-warm", TEXT, "menu summaries on bands"),
    ("caption on warm", "--ink-soft", "--paper-warm", TEXT, "category counts on bands"),
    ("primary button label", "#ffffff", "--cta", TEXT, "filled button text"),
    ("link text", "--cta", "--paper", TEXT, "inline links"),
    ("gold on night", "--brand-gold", "--night", TEXT, "hero eyebrow, footer headings"),
    ("night on gold", "--night", "--brand-gold", TEXT, "on-night button label"),
    ("hero lede on night", "#ded7cc", "--night", TEXT, "hero supporting sentence"),
    ("footer text on night", "#d8d1c6", "--night", TEXT, "footer and band copy"),
    ("footer muted on night", "#a8a19a", "--night", TEXT, "footer legal text"),
    ("footer faint on night", "#8f8880", "--night", TEXT, "smallest footer note"),
    # The focus ring is drawn with outline-offset, so it composites over the
    # surface BEHIND the element. Each surface therefore needs its own ring
    # colour; see the rule in src/styles/base.css.
    ("focus ring on paper", "--focus", "--paper", UI, "light surfaces"),
    ("focus ring on warm", "--focus", "--paper-warm", UI, "light bands"),
    ("focus ring on night", "--brand-gold", "--night", UI, "dark surfaces use gold"),
    ("control border on paper", "--line-control", "--paper", UI, "inputs, nav toggle, chips"),
    ("control border on warm", "--line-control", "--paper-warm", UI, "chips on warm bands"),
    ("control border on white", "--line-control", "#ffffff", UI, "text inputs"),
    ("button outline", "--cta", "--paper", UI, "secondary button border"),
    ("button outline on night", "#fbf8f3", "--night", UI, "outline button on dark"),
]

# Translucent borders are checked as their composited colour.
COMPOSITE = over("#fbf8f3", "#1c1917", 0.5)

# Pairs that MUST fail, proving the gate is actually discriminating.
NEGATIVE_CONTROLS = [
    ("brand gold on white (must never be text)", "#ffcc29", "#fbf8f3"),
    # Records why the ring colour is surface-aware: the default blue is invisible
    # against the crimson CTA, so "just use one focus colour" is not an option.
    ("blue focus ring on the crimson CTA", "#0b5fff", "#bf383e"),
]


def main() -> int:
    if not TOKENS.exists():
        print(f"error: {TOKENS} not found", file=sys.stderr)
        return 1

    tokens = read_tokens(TOKENS)
    failures: list[str] = []

    print(f"Token source: {TOKENS.relative_to(ROOT)}")
    print(f"Tokens read  : {len(tokens)}\n")

    def value(token: str) -> str:
        if token.startswith("#"):
            return token.lower()
        if token not in tokens:
            failures.append(f"token {token} is not defined in tokens.css")
            return "#000000"
        return tokens[token]

    print("--- required pairs ---")
    for label, fg_token, bg_token, threshold, note in PAIRS:
        fg, bg = value(fg_token), value(bg_token)
        ratio = contrast_ratio(fg, bg)
        ok = ratio >= threshold
        if not ok:
            failures.append(f"{label}: {ratio:.2f}:1, needs {threshold}:1 ({note})")
        print(
            f"  {'PASS' if ok else 'FAIL'}  {label:28s} {fg} on {bg} = "
            f"{ratio:5.2f}:1  (need {threshold})"
        )

    print("\n--- composite: gallery lightbox border (50% white over night) ---")
    ratio = contrast_ratio(COMPOSITE, value("--night"))
    ok = ratio >= UI
    if not ok:
        failures.append(f"lightbox border: {ratio:.2f}:1, needs {UI}:1")
    print(
        f"  {'PASS' if ok else 'FAIL'}  {'lightbox control border':28s} {COMPOSITE} on "
        f"{value('--night')} = {ratio:5.2f}:1  (need {UI})"
    )

    print("\n--- negative controls (these must fail) ---")
    for label, fg, bg in NEGATIVE_CONTROLS:
        ratio = contrast_ratio(fg, bg)
        correctly_rejected = ratio < TEXT
        if not correctly_rejected:
            failures.append(f"negative control {label} unexpectedly passed at {ratio:.2f}:1")
        print(
            f"  {'as expected' if correctly_rejected else 'UNEXPECTED'}  {label:44s} "
            f"{ratio:5.2f}:1"
        )

    if failures:
        print(f"\n{len(failures)} contrast failure(s):")
        for failure in failures:
            print(f"  x {failure}")
        return 1

    print("\nAll contrast pairs pass their WCAG 2.2 AA threshold.")
    print("Note: this verifies token pairs, not rendered pixels in a browser.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
