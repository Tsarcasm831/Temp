#!/usr/bin/env python3
"""
Split 'other' group into Advanced elements (Kekkei Genkai / Yin–Yang) buckets by keywords
found in the item's raw.markdown Quick Facts.

Buckets:
  Wood, Ice, Boil, Scorch, Storm, Lava, Magnet, Explosion, Dust, Crystal,
  Steel, Swift, Dark, Yin, Yang, Yin–Yang

Input (default): cache/by_group/other.json
Output dir (default): cache/by_group/other_advanced
  - one file per bucket, plus unclassified.json and index.json

Usage:
  python py/split_other_advanced.py --in cache/by_group/other.json --out-dir cache/by_group/other_advanced --pretty --verbose
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Dict, List, Tuple

# Canonical bucket names and keyword patterns (case-insensitive)
BUCKET_PATTERNS: List[Tuple[str, re.Pattern]] = [
    ("Wood", re.compile(r"\bwood\s*release|\bmokuton\b", re.IGNORECASE)),
    ("Ice", re.compile(r"\bice\s*release|\bhyouton|\bhyōton\b", re.IGNORECASE)),
    ("Boil", re.compile(r"\bboil\s*release|\bfutton|\bfut\u014don\b", re.IGNORECASE)),
    ("Scorch", re.compile(r"\bscorch\s*release|\bshakuton\b", re.IGNORECASE)),
    ("Storm", re.compile(r"\bstorm\s*release|\blaser\s*circus|\branton\b", re.IGNORECASE)),
    ("Lava", re.compile(r"\blava\s*release|\byouton|\by\u014dton\b", re.IGNORECASE)),
    ("Magnet", re.compile(r"\bmagnet\s*release|\bjat\u014d|\bjatou|\bjiton\b|\bmagnetic\b", re.IGNORECASE)),
    ("Explosion", re.compile(r"\bexplosion\s*release|\bbakuton\b", re.IGNORECASE)),
    ("Dust", re.compile(r"\bdust\s*release|\bjinton\b", re.IGNORECASE)),
    ("Crystal", re.compile(r"\bcrystal\s*release|\bsh\u014dton|\bshoton\b", re.IGNORECASE)),
    ("Steel", re.compile(r"\bsteel\s*release|\bkouton|\bk\u014dton\b", re.IGNORECASE)),
    ("Swift", re.compile(r"\bswift\s*release|\bshunton\b", re.IGNORECASE)),
    ("Dark", re.compile(r"\bdark\s*release|\bmeiton\b", re.IGNORECASE)),
    ("Yin–Yang", re.compile(r"yin[\-–\s]*yang\s*release|yin\s*&\s*yang|yin\s*/\s*yang|\byoton\b|\binton\b\s*and\s*\byang\b", re.IGNORECASE)),
    ("Yin", re.compile(r"\byin\s*release|\binton\b", re.IGNORECASE)),
    ("Yang", re.compile(r"\byang\s*release|\by\u014dton\b|\byoton\b", re.IGNORECASE)),
]

# We will search in Quick Facts 'Element/Type' line if present, otherwise whole markdown
ELEMENT_LINE_RX = re.compile(r"^\s*[-\*]\s*Element/Type:\s*(.+)$", re.IGNORECASE | re.MULTILINE)


def extract_element_text(markdown: str) -> str:
    if not isinstance(markdown, str):
        return ""
    m = ELEMENT_LINE_RX.search(markdown)
    if m:
        return m.group(1)
    return markdown  # fallback to full body


def main() -> None:
    ap = argparse.ArgumentParser(description="Split 'other' group into advanced element buckets")
    ap.add_argument("--in", dest="inp", default="cache/by_group/other.json")
    ap.add_argument("--out-dir", dest="out_dir", default="cache/by_group/other_advanced")
    ap.add_argument("--pretty", action="store_true")
    ap.add_argument("--verbose", action="store_true")
    args = ap.parse_args()

    inp = Path(args.inp)
    out_dir = Path(args.out_dir)
    if not inp.exists():
        raise SystemExit(f"Input not found: {inp}")

    items = json.loads(inp.read_text(encoding="utf-8", errors="ignore"))
    if not isinstance(items, list):
        raise SystemExit("Input must be a JSON array of items")

    out_dir.mkdir(parents=True, exist_ok=True)

    buckets: Dict[str, List[dict]] = {name: [] for name, _ in BUCKET_PATTERNS}
    unclassified: List[dict] = []

    for it in items:
        md = None
        raw = it.get("raw") if isinstance(it, dict) else None
        if isinstance(raw, dict):
            md = raw.get("markdown")
        text = extract_element_text(md or "")
        placed = False
        for name, rx in BUCKET_PATTERNS:
            if rx.search(text):
                buckets[name].append(it)
                placed = True
        if not placed:
            unclassified.append(it)

    # Write per-bucket files
    for name, arr in buckets.items():
        out_path = out_dir / f"{name.lower().replace('–','-').replace(' ','_')}.json"
        if args.pretty:
            out_path.write_text(json.dumps(arr, ensure_ascii=False, indent=2), encoding="utf-8")
        else:
            out_path.write_text(json.dumps(arr, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        if args.verbose:
            print(f"Wrote {len(arr):4d} -> {out_path}")

    # Write unclassified
    u_path = out_dir / "unclassified.json"
    if args.pretty:
        u_path.write_text(json.dumps(unclassified, ensure_ascii=False, indent=2), encoding="utf-8")
    else:
        u_path.write_text(json.dumps(unclassified, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    if args.verbose:
        print(f"Wrote {len(unclassified):4d} -> {u_path}")

    # Index
    index = {name: len(arr) for name, arr in buckets.items()}
    index["unclassified"] = len(unclassified)
    idx_path = out_dir / "index.json"
    idx_path.write_text(json.dumps(index, ensure_ascii=False, indent=2), encoding="utf-8")
    if args.verbose:
        print(f"Wrote index -> {idx_path}")


if __name__ == "__main__":
    main()
