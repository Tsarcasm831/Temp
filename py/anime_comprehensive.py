#!/usr/bin/env python3
"""
Build a comprehensive JSON of only anime jutsu from cached pages.

Detection rule: In the page wikitext (typically under raw.wikitext),
find an Infobox line like `|jutsu media=...` and include the page if
that value contains the token 'Anime' (case-insensitive). Handles values
like `Anime`, `Anime, Game`, `Anime and Manga`, etc.

Output written to `cache/anime_comprehensive.json` with structure:
{
  "count": <int>,
  "items": [
    {
      "name": str,
      "sourcePage": str | None,
      "pageId": int | None,
      "url": str | None,
      "thumbnail": str | None,
      "media": str,                 # the raw value of `jutsu media`
      "categories": [str, ...]      # categories extracted from page
    },
    ...
  ]
}

Usage:
  python py/anime_comprehensive.py

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
from typing import Dict, Iterable, List, Optional

# Extract categories like [[Category:Something|...]]
CATEGORY_PATTERN = re.compile(r"\[\[\s*Category\s*:\s*([^\]|#]+)", re.IGNORECASE)
# Extract a single infobox line for jutsu media. We capture until end-of-line.
JUTSU_MEDIA_LINE = re.compile(r"^\s*\|\s*jutsu\s+media\s*=\s*(.+)$", re.IGNORECASE | re.MULTILINE)

# Basic cleanup of wiki markup in values like [[Anime|Anime]] -> Anime
WIKI_LINK_CLEAN = re.compile(r"\[\[(?:[^\]|]+\|)?([^\]]+)\]\]")
TEMPLATE_CLEAN = re.compile(r"\{\{[^}]*\}\}")


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
    # remove templates and reduce links to label text
    s = TEMPLATE_CLEAN.sub("", s)
    s = WIKI_LINK_CLEAN.sub(r"\1", s)
    return s


def value_contains_anime(value: str) -> bool:
    cleaned = clean_wiki_text(value)
    # split by commas and connectors
    tokens = re.split(r"[,/]|\band\b|\bor\b", cleaned, flags=re.IGNORECASE)
    for t in tokens:
        if "anime" in t.strip().lower():
            return True
    return False


def extract_media_value(wikitext: str) -> Optional[str]:
    m = JUTSU_MEDIA_LINE.search(wikitext)
    if not m:
        return None
    # Take the raw captured value; it may span only one line
    val = m.group(1).strip()
    return val


def extract_categories(wikitext: str) -> List[str]:
    cats: List[str] = []
    for m in CATEGORY_PATTERN.finditer(wikitext):
        name = m.group(1).strip()
        name = name.split("#", 1)[0].strip()
        if name:
            cats.append(name)
    # Return unique in original order
    seen = set()
    unique = []
    for c in cats:
        if c.lower() not in seen:
            seen.add(c.lower())
            unique.append(c)
    return unique


def build_anime_list(pages_dir: Path, verbose: bool = False) -> Dict:
    items: List[Dict] = []
    for i, fp in enumerate(list_json_files(pages_dir)):
        data = read_page_json(fp)
        if not data:
            if verbose:
                print(f"WARN: skip unreadable {fp.name}")
            continue
        wikitext = extract_wikitext(data)
        media_val = extract_media_value(wikitext)
        if not media_val:
            continue
        if not value_contains_anime(media_val):
            continue
        item = {
            "name": data.get("name"),
            "sourcePage": data.get("sourcePage"),
            "pageId": data.get("pageId"),
            "url": data.get("url"),
            "thumbnail": data.get("thumbnail"),
            "media": media_val,
            "categories": extract_categories(wikitext),
        }
        items.append(item)
        if verbose and (i % 500 == 0):
            print(f"...processed {i} files, {len(items)} anime so far")
    return {"count": len(items), "items": items}


def main():
    parser = argparse.ArgumentParser(description="Build anime-only jutsu list from cached pages")
    parser.add_argument("--pages-dir", default="cache/pages")
    parser.add_argument("--out", default="cache/anime_comprehensive.json")
    parser.add_argument("--verbose", action="store_true")
    args = parser.parse_args()

    pages_dir = Path(args.pages_dir)
    out_path = Path(args.out)
    if not pages_dir.exists():
        raise SystemExit(f"Pages dir not found: {pages_dir}")

    if args.verbose:
        print(f"Scanning {pages_dir} for anime jutsu ...")
    payload = build_anime_list(pages_dir, verbose=args.verbose)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    if args.verbose:
        print(f"Wrote {payload['count']} anime jutsu -> {out_path}")


if __name__ == "__main__":
    main()
