import json
import os
import argparse
from typing import Dict
from datetime import datetime, timezone


def split_stats(location_dir: str, replace_stats: bool = False, pretty_bins: bool = False) -> None:
    """
    Split a large stats.json into per-fish files and a compact meta.json.

    - Reads:  <location_dir>/stats.json
    - Writes: <location_dir>/fish/<id>.json (one per fish)
              <location_dir>/meta.json (location + bins + fish_index)

    Leaves the original stats.json untouched for compatibility.
    """
    stats_path = os.path.join(location_dir, "stats.json")
    if not os.path.isfile(stats_path):
        raise FileNotFoundError(f"stats.json not found at: {stats_path}")

    with open(stats_path, "r", encoding="utf-8") as fp:
        stats = json.load(fp)

    location = stats.get("location")
    bins = stats.get("bins", {})
    fish: Dict[str, dict] = stats.get("fish", {})

    fish_dir = os.path.join(location_dir, "fish")
    os.makedirs(fish_dir, exist_ok=True)

    fish_index: Dict[str, str] = {}
    for fid, payload in fish.items():
        # Add id for convenience when loading individual files
        data = dict(payload)
        data["id"] = fid
        out_path_rel = f"fish/{fid}.json"
        out_path = os.path.join(location_dir, out_path_rel)
        with open(out_path, "w", encoding="utf-8") as fo:
            json.dump(data, fo, indent=2, ensure_ascii=False)
        fish_index[fid] = out_path_rel

    meta = {
        "location": location,
        "bins": bins,
        "fish_index": fish_index,
        "note": "Split version of stats.json. Load heavy fish data from fish/<id>.json."
    }

    meta_path = os.path.join(location_dir, "meta.json")
    with open(meta_path, "w", encoding="utf-8") as fo:
        json.dump(meta, fo, indent=2, ensure_ascii=False)

    # Optionally replace the original stats.json with a slim pointer-style payload
    if replace_stats:
        slim_stats = {
            "location": location,
            "bins": bins,
            "fish_index": fish_index,
            "note": "Slimmed stats.json; heavy per-fish fields moved to fish/<id>.json"
        }
        # Keep a backup of the original heavy stats for safety
        backup_path = os.path.join(location_dir, "stats.full.json")
        try:
            if not os.path.exists(backup_path):
                os.replace(stats_path, backup_path)
        except Exception:
            # If backup fails, proceed to overwrite to honor the request
            pass
        with open(stats_path, "w", encoding="utf-8") as fo:
            json.dump(slim_stats, fo, indent=2, ensure_ascii=False)

    # Optionally pretty-print the per-depth bin JSON files for readability
    if pretty_bins:
        try:
            for fname in os.listdir(location_dir):
                if not fname.endswith('.json'):
                    continue
                # match patterns like "0-100m.json"
                base = fname[:-5]
                if '-' in base and base.endswith('m') and base.split('-')[0].isdigit():
                    fpath = os.path.join(location_dir, fname)
                    try:
                        with open(fpath, 'r', encoding='utf-8') as f:
                            data = json.load(f)
                        with open(fpath, 'w', encoding='utf-8') as f:
                            json.dump(data, f, indent=2, ensure_ascii=False)
                    except Exception:
                        # Skip files that aren't standard arrays/objects
                        continue
        except FileNotFoundError:
            pass


def _load_heavy_map(location_dir: str):
    """Load location name, bins map, and heavy fish map from the best available source.
    Prefers stats.full.json; falls back to stats.json (heavy), or fish/<id>.json files using bins
    from slim stats.json/meta.json as needed.
    """
    stats_full = os.path.join(location_dir, "stats.full.json")
    stats_path = os.path.join(location_dir, "stats.json")
    meta_path = os.path.join(location_dir, "meta.json")
    fish_dir = os.path.join(location_dir, "fish")
    stats_dir = os.path.join(location_dir, "stats")

    if os.path.isfile(stats_full):
        with open(stats_full, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data.get("location"), data.get("bins", {}), data.get("fish", {})

    if os.path.isfile(stats_path):
        with open(stats_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        # If slim, 'fish' won't exist; reconstruct from fish/ using fish_index
        location = data.get("location")
        bins = data.get("bins", {})
        fish_map = data.get("fish")
        if isinstance(fish_map, dict) and fish_map:
            return location, bins, fish_map

        # Try meta.json for fish_index if present
        fish_index = data.get("fish_index")
        if not fish_index and os.path.isfile(meta_path):
            with open(meta_path, "r", encoding="utf-8") as mf:
                meta = json.load(mf)
            fish_index = meta.get("fish_index")
            if not bins:
                bins = meta.get("bins", {})
            if not location:
                location = meta.get("location")

        fish_map = {}
        if isinstance(fish_index, dict):
            for fid, rel in fish_index.items():
                fpath = os.path.join(location_dir, rel)
                try:
                    with open(fpath, "r", encoding="utf-8") as ff:
                        payload = json.load(ff)
                    # Remove redundant 'id' inside payload; we attach separately
                    if isinstance(payload, dict):
                        payload.pop("id", None)
                        fish_map[fid] = payload
                except Exception:
                    continue
        return location, bins, fish_map

    # Try reconstructing from per-depth stats directory
    if os.path.isdir(stats_dir):
        bins: Dict[str, list] = {}
        fish_map: Dict[str, dict] = {}
        for fname in sorted(os.listdir(stats_dir)):
            if not fname.endswith('.json'):
                continue
            fpath = os.path.join(stats_dir, fname)
            try:
                with open(fpath, 'r', encoding='utf-8') as f:
                    arr = json.load(f)
                ids = []
                if isinstance(arr, list):
                    for item in arr:
                        if not isinstance(item, dict):
                            continue
                        fid = item.get('id')
                        if not fid:
                            continue
                        ids.append(fid)
                        payload = dict(item)
                        payload.pop('id', None)
                        fish_map[fid] = payload
                bins[fname] = ids
            except Exception:
                continue

        # Derive a human label for location
        loc_key = os.path.basename(os.path.normpath(location_dir))
        location = loc_key.replace('_', ' ').title()
        return location, bins, fish_map

    # Nothing usable
    return None, {}, {}


def build_depth_structure(location_dir: str, include_ai_in_bins: bool = True, cleanup_split: bool = False) -> None:
    """Create per-depth minimal files (with aiImagePrompt) and detailed stats files, plus location.json.
    Optionally removes old split artifacts (meta.json, fish/).
    """
    location, bins, fish_map = _load_heavy_map(location_dir)
    if not bins or not fish_map:
        raise RuntimeError("Cannot load bins and fish map; ensure stats.full.json or per-fish files are present.")

    # Minimal per-depth files (overwrite existing) and detailed stats per-depth
    stats_dir = os.path.join(location_dir, "stats")
    os.makedirs(stats_dir, exist_ok=True)

    for bin_name, id_list in bins.items():
        # Minimal list with AI prompt (trim extras by default)
        minimal_items = []
        detailed_items = []
        for fid in id_list:
            payload = fish_map.get(fid, {})
            if not isinstance(payload, dict):
                payload = {}
            minimal = {
                "id": fid,
                "name": payload.get("name"),
                "themeName": payload.get("themeName"),
            }
            if include_ai_in_bins:
                minimal["aiImagePrompt"] = payload.get("aiImagePrompt")
            minimal_items.append(minimal)

            detailed = {
                "id": fid,
            }
            # Copy heavy fields through
            for k in [
                "name","themeName","depthRange","description","visualNotes",
                "chakraAffinity","clanMarkings","spawnLocations","rarity",
                "biomes","weightKg","baseValue","aiImagePrompt"
            ]:
                if k in payload:
                    detailed[k] = payload[k]
            detailed_items.append(detailed)

        # Write minimal (bin file) pretty-printed for readability
        with open(os.path.join(location_dir, bin_name), "w", encoding="utf-8") as fo:
            json.dump(minimal_items, fo, indent=2, ensure_ascii=False)

        # Write detailed stats for this depth
        with open(os.path.join(stats_dir, bin_name), "w", encoding="utf-8") as fo:
            json.dump(detailed_items, fo, indent=2, ensure_ascii=False)

    # Build location info file with common variables and English land translation
    # Best-effort to infer key from folder name
    loc_key = os.path.basename(os.path.normpath(location_dir))
    # Curated common variables for otogakure_trench
    THEME_OVERRIDES = {
        "otogakure_trench": {
            "env": "abyssal drop-offs and pressure shimmer; distant sonar-like pulses in the dark",
            "motifs": "waveform ripples, tuning-fork fin struts, resonance bands",
            "palette": "black-violet, oil blue, signal red",
            "chakra": "pulsing red-green chakra nodes that beat like a metronome"
        }
    }
    LAND_ENGLISH = {
        "otogakure": {"romanized": "Otogakure", "english": "Hidden Sound", "countryEnglish": "Sound Country"},
        "konoha": {"romanized": "Konoha", "english": "Hidden Leaf", "countryEnglish": "Leaf Country"},
        "kiri": {"romanized": "Kirigakure", "english": "Hidden Mist", "countryEnglish": "Mist Country"},
        "kumo": {"romanized": "Kumogakure", "english": "Hidden Cloud", "countryEnglish": "Cloud Country"},
        "iwa": {"romanized": "Iwagakure", "english": "Hidden Stone", "countryEnglish": "Stone Country"},
        "suna": {"romanized": "Sunagakure", "english": "Hidden Sand", "countryEnglish": "Sand Country"}
    }
    # Extract land slug from key (prefix before the first underscore)
    land_slug = loc_key.split('_', 1)[0]
    land_info = LAND_ENGLISH.get(land_slug, {"romanized": land_slug.capitalize(), "english": land_slug.capitalize(), "countryEnglish": None})
    # Derive English location label where possible
    location_english = None
    if land_info.get("english") and isinstance(location, str):
        # Replace the land's romanized name with its English translation if present in the location label
        # e.g., "Otogakure Trench" -> "Hidden Sound Trench"
        location_english = location.replace(land_info["romanized"], land_info["english"]) if land_info.get("romanized") else location
    theme = THEME_OVERRIDES.get(loc_key, {})
    depths = [{"bin": b, "count": len(ids or [])} for b, ids in bins.items()]
    location_info = {
        "key": loc_key,
        "location": location,
        "locationEnglish": location_english,
        "land": land_info.get("romanized"),
        "landEnglish": land_info.get("english"),
        "countryEnglish": land_info.get("countryEnglish"),
        "environment": theme.get("env"),
        "motifs": theme.get("motifs"),
        "palette": theme.get("palette"),
        "chakra_cue": theme.get("chakra"),
        "depths": depths,
        "generated": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    }
    with open(os.path.join(location_dir, "location.json"), "w", encoding="utf-8") as fo:
        json.dump(location_info, fo, indent=2, ensure_ascii=False)

    # Optionally remove old split artifacts to minimize file count
    if cleanup_split:
        try:
            meta_path = os.path.join(location_dir, "meta.json")
            if os.path.isfile(meta_path):
                os.remove(meta_path)
        except Exception:
            pass
        try:
            fish_dir = os.path.join(location_dir, "fish")
            if os.path.isdir(fish_dir):
                # Remove files then directory
                for fn in os.listdir(fish_dir):
                    fp = os.path.join(fish_dir, fn)
                    try:
                        os.remove(fp)
                    except Exception:
                        continue
                try:
                    os.rmdir(fish_dir)
                except Exception:
                    pass
        except Exception:
            pass


def _clean_visual_notes(text: str, location: str = None, location_english: str = None) -> str:
    if not isinstance(text, str):
        return ""
    t = text.strip()
    # Remove generic variant suffixes or location mentions
    for needle in ["variant markings adjusted for", "Variant tuned for", "Variant for", "adjusted for"]:
        idx = t.lower().find(needle)
        if idx != -1:
            t = t[:idx].strip()
    # Remove explicit location labels
    for nm in [location or "", location_english or ""]:
        if nm:
            t = t.replace(nm, "").strip()
    # Normalize punctuation
    t = t.strip(" ;,.")
    return t


def _make_visual_prompt(payload: dict, palette: str = None, location: str = None, location_english: str = None) -> str:
    visual = _clean_visual_notes(payload.get("visualNotes"), location, location_english)
    markings = str(payload.get("clanMarkings") or "").strip()
    parts = []
    if visual:
        parts.append(visual)
    if markings:
        parts.append(f"markings: {markings}")
    # Compose palette as a pure color hint
    if palette:
        parts.append(f"palette: {palette}")
    # Add rendering style guidance (visual only)
    parts.append("close-up, crisp detail, cinematic lighting, 3/4 view, realistic water caustics, single subject")
    # Join with semicolons for clarity
    out = "; ".join(p.strip() for p in parts if p)
    # Ensure final sentence punctuation
    if not out.endswith('.'):
        out += '.'
    return out


def reword_ai_prompts(location_dir: str) -> None:
    """Rewrite aiImagePrompt fields in both minimal depth files and stats depth files
    to focus on visual appearance only (no names, locations, or habitat)."""
    # Load location info for palette and labels
    location = None
    location_english = None
    palette = None
    loc_info_path = os.path.join(location_dir, "location.json")
    try:
        with open(loc_info_path, "r", encoding="utf-8") as f:
            loc_info = json.load(f)
        location = loc_info.get("location")
        location_english = loc_info.get("locationEnglish")
        palette = loc_info.get("palette")
    except Exception:
        pass

    # Helper to rewrite a list of entries
    def rewrite_list(items):
        changed = False
        for it in items:
            if not isinstance(it, dict):
                continue
            # Construct prompt from fields (ignore name/location)
            new_prompt = _make_visual_prompt(it, palette=palette, location=location, location_english=location_english)
            if it.get("aiImagePrompt") != new_prompt:
                it["aiImagePrompt"] = new_prompt
                changed = True
        return changed

    # Rewrite minimal depth files in the folder root
    for fname in os.listdir(location_dir):
        if not fname.endswith('.json'):
            continue
        base = fname[:-5]
        if '-' in base and base.endswith('m') and base.split('-')[0].isdigit():
            fpath = os.path.join(location_dir, fname)
            try:
                with open(fpath, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                if isinstance(data, list) and rewrite_list(data):
                    with open(fpath, 'w', encoding='utf-8') as f:
                        json.dump(data, f, indent=2, ensure_ascii=False)
            except Exception:
                continue

    # Rewrite per-depth detailed stats files
    stats_dir = os.path.join(location_dir, 'stats')
    if os.path.isdir(stats_dir):
        for fname in os.listdir(stats_dir):
            if not fname.endswith('.json'):
                continue
            fpath = os.path.join(stats_dir, fname)
            try:
                with open(fpath, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                if isinstance(data, list) and rewrite_list(data):
                    with open(fpath, 'w', encoding='utf-8') as f:
                        json.dump(data, f, indent=2, ensure_ascii=False)
            except Exception:
                continue


def main():
    parser = argparse.ArgumentParser(description="Split stats.json into per-fish files + meta.json")
    parser.add_argument(
        "location_dir",
        nargs="?",
        default=os.path.join("FishGame", "assets", "json", "otogakure_trench"),
        help="Directory containing stats.json (default: FishGame/assets/json/otogakure_trench)",
    )
    parser.add_argument(
        "--replace-stats",
        action="store_true",
        help="Replace stats.json with a slim pointer-based version",
    )
    parser.add_argument(
        "--pretty-bins",
        action="store_true",
        help="Pretty-print depth bin JSON files (0-100m.json, etc.)",
    )
    parser.add_argument(
        "--build-depth",
        action="store_true",
        help="Create per-depth minimal (with aiImagePrompt) and detailed stats files",
    )
    parser.add_argument(
        "--cleanup-split",
        action="store_true",
        help="Remove old split artifacts (meta.json and fish/)",
    )
    parser.add_argument(
        "--reword-ai",
        action="store_true",
        help="Rewrite aiImagePrompt fields to focus only on visual appearance",
    )
    args = parser.parse_args()

    # Run split only if a stats.json exists; otherwise skip (allow reword/build-depth to work from stats/)
    stats_json_path = os.path.join(args.location_dir, "stats.json")
    if os.path.isfile(stats_json_path):
        split_stats(args.location_dir, replace_stats=args.replace_stats, pretty_bins=args.pretty_bins)
    else:
        # If caller requested actions that need stats.json, just skip gracefully
        pass
    if args.build_depth:
        build_depth_structure(args.location_dir, include_ai_in_bins=True, cleanup_split=args.cleanup_split)
    if args.reword_ai:
        reword_ai_prompts(args.location_dir)
    print(json.dumps({
        "ok": True,
        "dir": args.location_dir,
        "replaced_stats": args.replace_stats,
        "pretty_bins": args.pretty_bins,
        "built_depth": args.build_depth,
        "cleaned_split": args.cleanup_split,
        "reworded_ai": args.reword_ai
    }, indent=2))


if __name__ == "__main__":
    main()
