#!/usr/bin/env python3
"""
Scan all JSON pages under `cache/pages/` and aggregate all categories found in
page wikitext (matched via `[[Category:...]]`).

Output written to `cache/categories.json` with the following structure:
{
  "categories": ["Cat A", "Cat B", ...],        # unique, sorted
  "counts": {"Cat A": 12, "Cat B": 3, ...}     # frequency across pages
}

Usage:
  python py/categories.py

Optional args:
  --pages-dir PATH       Override pages directory (default: cache/pages)
  --out PATH             Override output file path (default: cache/categories.json)
  --verbose              Print progress
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Dict, Iterable, List, Set, Tuple

CATEGORY_PATTERN = re.compile(r"\[\[\s*Category\s*:\s*([^\]|#]+)", re.IGNORECASE)
# Note: We purposely stop at '|' or ']' or '#' (for section links) and trim whitespace later.


def find_json_files(pages_dir: Path) -> Iterable[Path]:
    for p in pages_dir.glob("*.json"):
        if p.is_file():
            yield p


def extract_categories_from_wikitext(wikitext: str) -> List[str]:
    cats: List[str] = []
    for m in CATEGORY_PATTERN.finditer(wikitext):
        name = m.group(1).strip()
        # Normalize whitespace and remove trailing fragments like "#Section"
        name = name.split("#", 1)[0].strip()
        if name:
            cats.append(name)
    return cats


def parse_page_categories(page_json_path: Path, verbose: bool = False) -> List[str]:
    try:
        text = page_json_path.read_text(encoding="utf-8", errors="ignore")
        data = json.loads(text)
    except Exception as e:
        if verbose:
            print(f"WARN: Failed to read/parse {page_json_path}: {e}")
        return []

    # Try typical schema: data["raw"]["wikitext"]
    wikitext = None
    raw = data.get("raw") if isinstance(data, dict) else None
    if isinstance(raw, dict):
        wikitext = raw.get("wikitext")

    if not isinstance(wikitext, str):
        # Fallback: scan any string fields for category tags (rare, but safe)
        def walk(obj) -> Iterable[str]:
            if isinstance(obj, str):
                yield obj
            elif isinstance(obj, dict):
                for v in obj.values():
                    yield from walk(v)
            elif isinstance(obj, list):
                for v in obj:
                    yield from walk(v)
        concatenated = "\n".join(walk(data))
        wikitext = concatenated

    return extract_categories_from_wikitext(wikitext)


def aggregate_categories(files: Iterable[Path], verbose: bool = False) -> Tuple[List[str], Dict[str, int]]:
    counts: Dict[str, int] = {}
    for fp in files:
        cats = parse_page_categories(fp, verbose=verbose)
        for c in cats:
            counts[c] = counts.get(c, 0) + 1
    unique_sorted = sorted(counts.keys(), key=lambda s: s.lower())
    return unique_sorted, counts


def main():
    parser = argparse.ArgumentParser(description="Aggregate categories from cached pages")
    parser.add_argument("--pages-dir", default="cache/pages", help="Directory containing page JSON files")
    parser.add_argument("--out", default="cache/categories.json", help="Output JSON file path")
    parser.add_argument("--verbose", action="store_true", help="Enable verbose logging")
    args = parser.parse_args()

    pages_dir = Path(args.pages_dir)
    out_path = Path(args.out)

    if not pages_dir.exists() or not pages_dir.is_dir():
        raise SystemExit(f"Pages directory not found or not a directory: {pages_dir}")

    files = list(find_json_files(pages_dir))
    if args.verbose:
        print(f"Scanning {len(files)} files in {pages_dir}...")

    categories, counts = aggregate_categories(files, verbose=args.verbose)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    payload = {"categories": categories, "counts": counts}
    out_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    if args.verbose:
        print(f"Wrote {len(categories)} unique categories to {out_path}")


if __name__ == "__main__":
    main()
