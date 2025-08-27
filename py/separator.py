#!/usr/bin/env python3
"""
Separate anime_c_clean.json into per-group files.

Reads the cleaned dataset (default: cache/anime_c_clean.json) and writes one
JSON file per group (fire, water, wind, earth, lightning, other) into an
output directory. Each file is a JSON array of items from that group, with
content preserved, including raw.markdown.

Usage:
  python py/separator.py --in cache/anime_c_clean.json --out-dir cache/by_group --verbose

Options:
  --in PATH         Input JSON (default: cache/anime_c_clean.json)
  --out-dir PATH    Output directory for group files (default: cache/by_group)
  --pretty          Pretty-print JSON (default compact)
  --verbose         Print progress
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Dict, List


def main() -> None:
    ap = argparse.ArgumentParser(description="Split cleaned anime jutsu JSON into per-group files")
    ap.add_argument("--in", dest="inp", default="cache/anime_c_clean.json")
    ap.add_argument("--out-dir", dest="out_dir", default="cache/by_group")
    ap.add_argument("--pretty", action="store_true")
    ap.add_argument("--verbose", action="store_true")
    args = ap.parse_args()

    inp = Path(args.inp)
    out_dir = Path(args.out_dir)
    if not inp.exists():
        raise SystemExit(f"Input not found: {inp}")

    data = json.loads(inp.read_text(encoding="utf-8", errors="ignore"))
    groups: Dict[str, List[dict]] = data.get("groups") or {}
    if not isinstance(groups, dict) or not groups:
        raise SystemExit("No 'groups' found in input JSON")

    out_dir.mkdir(parents=True, exist_ok=True)

    # Write per-group files
    counts = {}
    for name, items in groups.items():
        if not isinstance(items, list):
            continue
        counts[name] = len(items)
        out_path = out_dir / f"{name}.json"
        if args.pretty:
            out_path.write_text(json.dumps(items, ensure_ascii=False, indent=2), encoding="utf-8")
        else:
            out_path.write_text(json.dumps(items, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        if args.verbose:
            print(f"Wrote {len(items)} items -> {out_path}")

    # Write an index with counts and metadata
    index = {
        "unique_count": data.get("unique_count"),
        "counts": counts,
        "out_dir": str(out_dir).replace("\\", "/"),
        "source": str(inp).replace("\\", "/"),
    }
    idx_path = out_dir / "index.json"
    idx_path.write_text(json.dumps(index, ensure_ascii=False, indent=2), encoding="utf-8")
    if args.verbose:
        print(f"Wrote index -> {idx_path}")


if __name__ == "__main__":
    main()
