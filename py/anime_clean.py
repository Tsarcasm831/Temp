#!/usr/bin/env python3
"""
Read cache/anime_comprehensive.json and output a nearly identical, but human-readable
version with wiki markup cleaned: cache/anime_c_clean.json

Cleaning includes:
- Strip templates like {{...}}
- Convert wiki links [[Page|Label]] -> Label, [[Page]] -> Page
- Remove category/file/media links [[Category:...]], [[File:...]] entirely
- Remove <ref>...</ref>, <references/>, HTML comments, most HTML tags
- Unescape HTML entities
- Normalize repeated whitespace and stray wiki punctuation ('' ''', == ==)
- Replace tildes '~' artifacts with spaces

Usage:
  python py/anime_clean.py

Options:
  --in PATH   (default: cache/anime_comprehensive.json)
  --out PATH  (default: cache/anime_c_clean.json)
  --verbose
"""
from __future__ import annotations

import argparse
import json
import re
from html import unescape
from pathlib import Path
import subprocess
import os
from typing import Any

# Patterns
RE_COMMENT = re.compile(r"<!--.*?-->", re.DOTALL)
RE_REF = re.compile(r"<ref[^>]*?>.*?</ref>", re.IGNORECASE | re.DOTALL)
RE_REFERENCES = re.compile(r"<references\s*/\s*>", re.IGNORECASE)
RE_TAGS = re.compile(r"</?\w+[^>]*>")  # generic HTML tags fallback
RE_TEMPLATE = re.compile(r"\{\{[^{}]*\}\}")  # simple template removal (non-nested)
RE_LINK_LABEL = re.compile(r"\[\[(?:[^\]|]+\|)?([^\]]+)\]\]")
RE_LINK_SOLO = re.compile(r"\[\[([^\]|#]+)(?:#[^\]]+)?\]\]")
RE_CATEGORY = re.compile(r"\[\[\s*Category\s*:[^\]]*\]\]", re.IGNORECASE)
RE_FILE = re.compile(r"\[\[\s*(?:File|Image)\s*:[^\]]*\]\]", re.IGNORECASE)
RE_DEFAULTSORT = re.compile(r"\{\{\s*DEFAULTSORT:[^}]*\}\}", re.IGNORECASE)
RE_HEADING = re.compile(r"^\s*=+\s*(.*?)\s*=+\s*$", re.MULTILINE)
RE_BOLD_ITALIC = re.compile(r"'''+|''")
RE_TILDES = re.compile(r"~+")
RE_WS = re.compile(r"[\t\x0b\x0c\r]+")  # keep newlines intact
# Only collapse runs of spaces (not newlines)
RE_MULTI_SPACE = re.compile(r" {2,}")
# Trim trailing spaces per line
RE_TRAILING_SPACES = re.compile(r"[ \t]+$", re.MULTILINE)
# Collapse excessive blank lines
RE_MULTI_NL = re.compile(r"\n{3,}")
# Bullet markers at line start -> '- '
RE_BULLETS = re.compile(r"(?m)^\s*[\*#]\s*")
RE_INTERLANG = re.compile(r"^\s*\[\[[a-z-]{2,}:[^\]]+\]\]\s*$", re.IGNORECASE | re.MULTILINE)

# Section titles to remove completely (case-insensitive)
SECTIONS_TO_DROP = {s.lower() for s in [
    "Overview",
    "Influence",
    "Trivia",
    "See Also",
    "References",
]}


def remove_infobox_jutsu(text: str) -> str:
    """Remove the full '{{Infobox/Jutsu ...}}' template with balanced braces.
    Case-insensitive match on the template name.
    """
    # Find start (case-insensitive)
    needle = "{{Infobox/Jutsu"
    lower = text.lower()
    start = lower.find(needle.lower())
    if start == -1:
        return text
    i = start
    depth = 0
    n = len(text)
    while i < n - 1:
        # Handle opening '{{' and closing '}}'
        if text[i] == '{' and text[i + 1] == '{':
            depth += 1
            i += 2
            continue
        if text[i] == '}' and text[i + 1] == '}':
            depth -= 1
            i += 2
            if depth <= 0:
                # Remove inclusive of end braces
                return text[:start] + text[i:]
            continue
        i += 1
    # Fallback: if not properly closed, cut from start to end
    return text[:start]


def remove_sections(text: str) -> str:
    """Remove entire sections by heading title from SECTIONS_TO_DROP.
    A section is from its heading line to the next heading or end of text.
    """
    # Find all headings with their spans
    matches = list(RE_HEADING.finditer(text))
    if not matches:
        return text
    to_remove = []
    for idx, m in enumerate(matches):
        title = m.group(1).strip().lower()
        if title in SECTIONS_TO_DROP:
            start = m.start()
            end = matches[idx + 1].start() if idx + 1 < len(matches) else len(text)
            to_remove.append((start, end))
    if not to_remove:
        return text
    # Build new text excluding the ranges
    out = []
    prev = 0
    for (a, b) in to_remove:
        if prev < a:
            out.append(text[prev:a])
        prev = b
    if prev < len(text):
        out.append(text[prev:])
    return "".join(out)


def clean_text(s: str) -> str:
    if not s:
        return s
    original = s
    s = unescape(s)
    # Remove entire Infobox/Jutsu template first
    s = remove_infobox_jutsu(s)
    s = RE_COMMENT.sub(" ", s)
    s = RE_REF.sub(" ", s)
    s = RE_REFERENCES.sub(" ", s)
    # Remove specified sections completely
    s = remove_sections(s)
    # Remove categories and file/image links entirely first
    s = RE_CATEGORY.sub(" ", s)
    s = RE_FILE.sub(" ", s)
    # Remove interlanguage links like [[de:...]] on their own lines
    s = RE_INTERLANG.sub(" ", s)
    s = RE_DEFAULTSORT.sub(" ", s)
    # Convert wiki links to labels
    s = RE_LINK_LABEL.sub(r"\1", s)
    s = RE_LINK_SOLO.sub(r"\1", s)
    # Drop simple templates repeatedly in case of multiple occurrences
    for _ in range(5):
        new_s = RE_TEMPLATE.sub(" ", s)
        if new_s == s:
            break
        s = new_s
    # Remove any remaining HTML tags
    s = RE_TAGS.sub(" ", s)
    # Remove wiki bold/italic quotes and headings markup
    s = RE_BOLD_ITALIC.sub(" ", s)
    # Convert wiki headings to markdown-style '## Title' with spacing
    s = RE_HEADING.sub(r"\n\n## \1\n\n", s)
    # Replace tildes with space (e.g., user lists using ~~with~)
    s = RE_TILDES.sub(" ", s)
    # Convert bullet markers and keep structure
    s = RE_BULLETS.sub("- ", s)
    # Normalize whitespace but keep newlines
    s = RE_WS.sub(" ", s)
    s = RE_TRAILING_SPACES.sub("", s)
    s = RE_MULTI_SPACE.sub(" ", s)
    s = RE_MULTI_NL.sub("\n\n", s)
    s = s.strip()
    return s


def clean_any(obj: Any) -> Any:
    if isinstance(obj, str):
        return clean_text(obj)
    if isinstance(obj, list):
        return [clean_any(v) for v in obj]
    if isinstance(obj, dict):
        # Special-case: do not clean markdown content we attach
        out = {}
        for k, v in obj.items():
            if k == "markdown" and isinstance(v, str):
                out[k] = v  # preserve formatting
            elif k == "raw" and isinstance(v, dict) and "wikitext" in v and isinstance(v["wikitext"], str):
                # raw.wikitext will be dropped; handled later when merging markdown
                # Keep other raw fields cleaned
                rv = {rk: (vv if rk == "wikitext" else clean_any(vv)) for rk, vv in v.items()}
                out[k] = rv
            else:
                out[k] = clean_any(v)
        return out
    return obj


def main():
    parser = argparse.ArgumentParser(description="Clean wiki markup in anime jutsu JSON")
    parser.add_argument("--in", dest="inp", default="cache/anime_comprehensive.json")
    parser.add_argument("--out", dest="out", default="cache/anime_c_clean.json")
    parser.add_argument("--verbose", action="store_true")
    args = parser.parse_args()

    inp = Path(args.inp)
    outp = Path(args.out)
    if not inp.exists():
        raise SystemExit(f"Input not found: {inp}")

    data = json.loads(inp.read_text(encoding="utf-8", errors="ignore"))

    # Ensure markdown directory exists; if not, run generator
    md_dir = Path("cache/clean_md")
    if not md_dir.exists():
        if args.verbose:
            print("clean_md not found, generating via py/anime_to_markdown.py ...")
        # Run the markdown generator
        try:
            subprocess.run([
                "python",
                "py/anime_to_markdown.py",
                "--pages-dir",
                "cache/pages",
                "--out-dir",
                str(md_dir),
            ], check=True)
        except Exception as e:
            print(f"WARN: Failed to generate markdown: {e}")

    # Build an index: name(lower) -> markdown text
    md_index = {}
    if md_dir.exists():
        for fp in md_dir.glob("*.md"):
            try:
                txt = fp.read_text(encoding="utf-8", errors="ignore")
                # First line expected '# Name'
                title = None
                for line in txt.splitlines():
                    if line.strip().startswith("# "):
                        title = line.strip()[2:].strip()
                        break
                key = (title or fp.stem).strip().lower()
                if key:
                    md_index[key] = txt
            except Exception:
                continue

    def attach_markdown(o: Any) -> Any:
        # Traverse and attach markdown to items with a 'name'
        if isinstance(o, dict):
            name = o.get("name") if isinstance(o.get("name"), str) else None
            out = {k: attach_markdown(v) for k, v in o.items()}
            if name:
                key = name.strip().lower()
                md = md_index.get(key)
                if md:
                    # Ensure raw exists and set only raw.markdown
                    raw = out.get("raw")
                    if isinstance(raw, dict):
                        raw = dict(raw)
                    else:
                        raw = {}
                    raw.pop("wikitext", None)
                    raw["markdown"] = md
                    out["raw"] = raw
            return out
        if isinstance(o, list):
            return [attach_markdown(v) for v in o]
        return o

    merged = attach_markdown(data)
    cleaned = clean_any(merged)

    outp.parent.mkdir(parents=True, exist_ok=True)
    outp.write_text(json.dumps(cleaned, ensure_ascii=False, indent=2), encoding="utf-8")

    if args.verbose:
        # Basic stats display
        if isinstance(cleaned, dict) and "counts" in cleaned:
            print("Groups:", cleaned.get("counts"))
        print(f"Wrote cleaned JSON -> {outp}")


if __name__ == "__main__":
    main()
