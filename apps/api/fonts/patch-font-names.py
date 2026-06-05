#!/usr/bin/env python3
"""Patch Helvetica Neue TTF name tables so each weight is a unique font family.

librsvg/fontconfig cannot reliably pick weight 300 vs 400 when every face shares
the same family name ("HelveticaNeue"). Giving each file its own family name
(e.g. "HelveticaNeue Regular") makes SVG font-family selection deterministic.
"""
from __future__ import annotations

from pathlib import Path

from fontTools.ttLib import TTFont

FONT_DIR = Path(__file__).resolve().parent

# filename → (unique family name, subfamily label, usWeightClass)
FACES: dict[str, tuple[str, str, int]] = {
    'HelveticaNeue-Thin.ttf': ('HelveticaNeue Thin', 'Thin', 100),
    'HelveticaNeue-Light.ttf': ('HelveticaNeue Light', 'Light', 300),
    'HelveticaNeue-Regular.ttf': ('HelveticaNeue Regular', 'Regular', 400),
    'HelveticaNeue-Medium.ttf': ('HelveticaNeue Medium', 'Medium', 500),
    'HelveticaNeue-Bold.ttf': ('HelveticaNeue Bold', 'Bold', 700),
}


def set_name(font: TTFont, name_id: int, value: str) -> None:
    name_table = font['name']
    # Drop existing records for this nameID so we don't leave stale duplicates.
    name_table.names = [n for n in name_table.names if n.nameID != name_id]
    for platform_id, plat_enc_id, lang_id in ((3, 1, 0x409), (1, 0, 0)):
        name_table.setName(value, name_id, platform_id, plat_enc_id, lang_id)


def patch_font(path: Path, family: str, subfamily: str, weight: int) -> None:
    font = TTFont(path)
    ps_name = family.replace(' ', '-')

    set_name(font, 1, family)       # Font Family
    set_name(font, 2, subfamily)    # Font Subfamily
    set_name(font, 4, family)      # Full name
    set_name(font, 6, ps_name)      # PostScript name

    font['OS/2'].usWeightClass = weight
    font.save(path)
    print(f'patched {path.name}: family="{family}" weight={weight}')


def main() -> None:
    for filename, (family, subfamily, weight) in FACES.items():
        patch_font(FONT_DIR / filename, family, subfamily, weight)


if __name__ == '__main__':
    main()
