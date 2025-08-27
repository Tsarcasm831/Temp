#!/usr/bin/env python3
"""
Build a comprehensive JSON of only anime jutsu from cached pages, grouped by
basic elemental types: fire, water, wind, earth, lightning, other.

- Detection for anime: infobox line `|jutsu media=...` contains 'Anime'.
- Element detection: parse `|jutsu type=` for tokens including any of:
  Fire Release / Katon / Fire
  Water Release / Suiton / Water
  Wind Release / Fūton / Futon / Wind
  Earth Release / Doton / Earth
  Lightning Release / Raiton / Lightning

Output written to `cache/anime_comprehensive.json` with structure:
{
  "unique_count": <int>,           # number of unique anime jutsu
  "counts": {                      # per group counts (note: multi-element jutsu appear in multiple groups)
    "fire": <int>, "water": <int>, "wind": <int>, "earth": <int>, "lightning": <int>, "other": <int>
  },
  "groups": {
    "fire": [ <full original page JSON>, ... ],
    "water": [ ... ],
    "wind": [ ... ],
    "earth": [ ... ],
    "lightning": [ ... ],
    "other": [ ... ]
  }
}

Usage:
  python py/anime_by_element.py

Optional args:
  --pages-dir PATH   Directory of page JSONs (default: cache/pages)
  --out PATH         Output file (default: cache/anime_comprehensive.json)
  --verbose          Print progress
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Set

JUTSU_MEDIA_LINE = re.compile(r"^\s*\|\s*jutsu\s+media\s*=\s*(.+)$", re.IGNORECASE | re.MULTILINE)
JUTSU_TYPE_LINE = re.compile(r"^\s*\|\s*jutsu\s+type\s*=\s*(.+)$", re.IGNORECASE | re.MULTILINE)
WIKI_LINK_CLEAN = re.compile(r"\[\[(?:[^\]|]+\|)?([^\]]+)\]\]")
TEMPLATE_CLEAN = re.compile(r"\{\{[^}]*\}\}")

# Element keyword map (lowercased) -> group name
ELEMENT_KEYWORDS = {
    # Fire
    "fire release": "fire",
    "katon": "fire",
    "fire": "fire",
    # Water
    "water release": "water",
    "suiton": "water",
    "water": "water",
    # Wind
    "wind release": "wind",
    "futon": "wind",    # common ascii transliteration
    "fūton": "wind",     # macron
    "fuuton": "wind",
    "wind": "wind",
    # Earth
    "earth release": "earth",
    "doton": "earth",
    "earth": "earth",
    # Lightning
    "lightning release": "lightning",
    "raiton": "lightning",
    "lightning": "lightning",
}


def list_json_files(pages_dir: Path) -> Iterable[Path]:
    for p in pages_dir.glob("*.json"):
        if p.is_file():
            yield p


def read_page_json(path: Path) -> Optional[dict]:
    try:
        return json.loads(path.read_text(encoding="utf-8", errors="ignore"))
    except Exception:
        return None


def extract_wikitext(data: dict) -> str:
    raw = data.get("raw") if isinstance(data, dict) else None
    if isinstance(raw, dict) and isinstance(raw.get("wikitext"), str):
        return raw["wikitext"]
    # fallback: concatenate all strings
    def walk(o):
        if isinstance(o, str):
            yield o
        elif isinstance(o, dict):
            for v in o.values():
                yield from walk(v)
        elif isinstance(o, list):
            for v in o:
                yield from walk(v)
    return "\n".join(walk(data))


def clean_wiki_text(s: str) -> str:
    s = TEMPLATE_CLEAN.sub("", s)
    s = WIKI_LINK_CLEAN.sub(r"\1", s)
    return s


def get_media_value(wikitext: str) -> Optional[str]:
    m = JUTSU_MEDIA_LINE.search(wikitext)
    if not m:
        return None
    return m.group(1).strip()


def is_anime_media(value: str) -> bool:
    cleaned = clean_wiki_text(value)
    tokens = re.split(r"[,/]|\band\b|\bor\b", cleaned, flags=re.IGNORECASE)
    for t in tokens:
        if "anime" in t.strip().lower():
            return True
    return False


def get_type_value(wikitext: str) -> Optional[str]:
    m = JUTSU_TYPE_LINE.search(wikitext)
    if not m:
        return None
    return m.group(1).strip()


def infer_element_groups(type_value: Optional[str]) -> Set[str]:
    groups: Set[str] = set()
    if not type_value:
        return groups
    cleaned = clean_wiki_text(type_value)
    # Break on common separators and keep tokens + bigrams
    parts = re.split(r"[\s,\/;·•]+", cleaned)
    text_l = cleaned.lower()
    # Direct phrase checks first
    for key, grp in ELEMENT_KEYWORDS.items():
        if key in text_l:
            groups.add(grp)
    # Also check single-word tokens to catch plain Fire/Water/etc.
    for p in parts:
        k = p.strip().lower()
        if k in ELEMENT_KEYWORDS:
            groups.add(ELEMENT_KEYWORDS[k])
    return groups


def main():
    parser = argparse.ArgumentParser(description="Build anime-only jutsu grouped by element")
    parser.add_argument("--pages-dir", default="cache/pages")
    parser.add_argument("--out", default="cache/anime_comprehensive.json")
    parser.add_argument("--verbose", action="store_true")
    args = parser.parse_args()

    pages_dir = Path(args.pages_dir)
    out_path = Path(args.out)
    if not pages_dir.exists():
        raise SystemExit(f"Pages dir not found: {pages_dir}")

    groups: Dict[str, List[dict]] = {
        "fire": [],
        "water": [],
        "wind": [],
        "earth": [],
        "lightning": [],
        "other": [],
    }

    seen_ids: Set[int] = set()
    unique_count = 0

    if args.verbose:
        print(f"Scanning {pages_dir} for anime jutsu and grouping by element ...")

    for i, fp in enumerate(list_json_files(pages_dir)):
        data = read_page_json(fp)
        if not data:
            continue
        wikitext = extract_wikitext(data)
        media_val = get_media_value(wikitext)
        if not media_val or not is_anime_media(media_val):
            continue

        # Unique-ness by pageId if present, else filename hash via index
        pid = data.get("pageId")
        if isinstance(pid, int):
            if pid not in seen_ids:
                seen_ids.add(pid)
                unique_count += 1
        else:
            unique_count += 1  # fallback, may overcount across duplicates

        type_val = get_type_value(wikitext)
        elems = infer_element_groups(type_val)

        placed = False
        for e in sorted(elems):
            if e in groups:
                groups[e].append(data)  # include full original JSON
                placed = True
        if not placed:
            groups["other"].append(data)

        if args.verbose and (i % 500 == 0):
            print(f"...processed {i} files")

    counts = {k: len(v) for k, v in groups.items()}
    payload = {
        "unique_count": unique_count,
        "counts": counts,
        "groups": groups,
    }

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    if args.verbose:
        print(f"Wrote grouped anime jutsu to {out_path}")


if __name__ == "__main__":
    main()
