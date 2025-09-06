import os
import json
import re
from typing import Dict, List, Tuple

BASE_DIR = os.path.join("FishGame", "assets", "json")


def parse_range_from_filename(fname: str) -> Tuple[int, int]:
    # e.g., "0-50m.json" or "501-1000m.json"
    m = re.match(r"^(\d+)-(\d+)m\.json$", fname)
    if not m:
        raise ValueError(f"Unrecognized filename range format: {fname}")
    a, b = int(m.group(1)), int(m.group(2))
    return a, b


def parse_depth_range(text: str) -> Tuple[int, int]:
    # Accept strings like "10–200m" or "0-50m" or "0–100"
    if not isinstance(text, str):
        raise ValueError("depthRange not a string")
    nums = re.findall(r"\d+", text)
    if len(nums) >= 2:
        lo, hi = int(nums[0]), int(nums[1])
        if lo > hi:
            lo, hi = hi, lo
        return lo, hi
    elif len(nums) == 1:
        # Interpret single value as 0–value
        return 0, int(nums[0])
    else:
        raise ValueError("No numbers found in depthRange")


def overlaps(a: Tuple[int, int], b: Tuple[int, int]) -> bool:
    # inclusive overlap check
    return not (a[1] < b[0] or a[0] > b[1])


def get_location_dirs(base: str) -> List[str]:
    return [
        d for d in os.listdir(base)
        if os.path.isdir(os.path.join(base, d)) and d != "__pycache__"
    ]


def load_all_fish_for_location(loc_dir: str) -> List[Tuple[dict, Tuple[int, int]]]:
    results: List[Tuple[dict, Tuple[int, int]]] = []
    for fname in os.listdir(loc_dir):
        if not fname.endswith(".json"):
            continue
        if fname == "manifest.json":
            continue
        fpath = os.path.join(loc_dir, fname)
        try:
            with open(fpath, "r", encoding="utf-8") as f:
                data = json.load(f)
        except Exception:
            continue
        # Only lists of fish dictionaries are relevant
        if not isinstance(data, list):
            continue
        # Fallback range from filename
        file_range = None
        try:
            file_range = parse_range_from_filename(fname)
        except Exception:
            file_range = None
        for fish in data:
            if not isinstance(fish, dict):
                continue
            # Try to parse fish depthRange; fallback to file range; else default 0–1000
            f_range: Tuple[int, int]
            dr = fish.get("depthRange")
            if isinstance(dr, str):
                try:
                    f_range = parse_depth_range(dr)
                except Exception:
                    f_range = file_range if file_range else (0, 1000)
            else:
                f_range = file_range if file_range else (0, 1000)
            results.append((fish, f_range))
    return results


def dedupe_fish(items: List[dict]) -> List[dict]:
    seen = set()
    out = []
    for fi in items:
        key = (
            fi.get("name"),
            fi.get("themeName"),
            fi.get("description"),
        )
        if key in seen:
            continue
        seen.add(key)
        out.append(fi)
    return out


def main():
    if not os.path.isdir(BASE_DIR):
        raise SystemExit(f"Missing base dir: {BASE_DIR}")

    # Define 100m bins up to 1000m, non-overlapping, boundary style like existing files
    # 0-100, 101-200, 201-300, ..., 901-1000
    bins: List[Tuple[int, int, str]] = []
    start = 0
    end = 100
    bins.append((start, end, f"{start}-{end}m.json"))
    cur = 101
    while cur <= 1000:
        hi = (cur // 100) * 100  # floor
        if hi < cur:
            hi += 100
        if hi < cur:
            hi = cur + 99
        if hi > 1000:
            hi = 1000
        bins.append((cur, hi, f"{cur}-{hi}m.json"))
        cur = hi + 1

    summary: Dict[str, Dict[str, int]] = {}

    for loc in get_location_dirs(BASE_DIR):
        loc_dir = os.path.join(BASE_DIR, loc)
        fish_with_ranges = load_all_fish_for_location(loc_dir)
        # Prepare per-bin lists
        per_bin: Dict[str, List[dict]] = {fn: [] for _, _, fn in bins}
        for fish, fr in fish_with_ranges:
            for lo, hi, fn in bins:
                if overlaps(fr, (lo, hi)):
                    per_bin[fn].append(fish)
        # Dedupe and write
        summary[loc] = {}
        for lo, hi, fn in bins:
            items = dedupe_fish(per_bin[fn])
            out_path = os.path.join(loc_dir, fn)
            with open(out_path, "w", encoding="utf-8") as f:
                json.dump(items, f, indent=2, ensure_ascii=False)
            summary[loc][fn] = len(items)

    # Print a compact summary to stdout
    print(json.dumps(summary, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()

