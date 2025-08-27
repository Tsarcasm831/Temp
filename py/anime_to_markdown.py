#!/usr/bin/env python3
"""
Generate readable Markdown files for anime jutsu with clear sections.

- Filters pages to anime-only via `| jutsu media =` containing 'Anime'
- Parses the Infobox/Jutsu block to extract structured fields (users, type, range, etc.)
- Cleans wikitext to readable text (reuses logic similar to anime_clean.py)
- Heuristically splits content into sections: Summary, Usage, Counters/Defenses, Drawbacks, Notes

Outputs one .md per jutsu under --out-dir (default: cache/clean_md)

Usage:
  python py/anime_to_markdown.py --pages-dir cache/pages --out-dir cache/clean_md --verbose
"""
from __future__ import annotations

import argparse
import re
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple
from html import unescape
import json

# Reuse core patterns (lightweight copies)
RE_COMMENT = re.compile(r"<!--.*?-->", re.DOTALL)
RE_REF = re.compile(r"<ref[^>]*?>.*?</ref>", re.IGNORECASE | re.DOTALL)
RE_REFERENCES = re.compile(r"<references\s*/\s*>", re.IGNORECASE)
RE_TAGS = re.compile(r"</?\w+[^>]*>")
RE_TEMPLATE_SIMPLE = re.compile(r"\{\{[^{}]*\}\}")
RE_LINK_LABEL = re.compile(r"\[\[(?:[^\]|]+\|)?([^\]]+)\]\]")
RE_LINK_SOLO = re.compile(r"\[\[([^\]|#]+)(?:#[^\]]+)?\]\]")
RE_CATEGORY = re.compile(r"\[\\[\s*Category\s*:[^\]]*\]\]", re.IGNORECASE)
RE_FILE = re.compile(r"\[\[\s*(?:File|Image)\s*:[^\]]*\]\]", re.IGNORECASE)
RE_BOLD_ITALIC = re.compile(r"'''+|''")
RE_WS = re.compile(r"[\t\x0b\x0c\r]+")
RE_MULTI_SPACE = re.compile(r" {2,}")
RE_TRAILING_SPACES = re.compile(r"[ \t]+$", re.MULTILINE)
RE_MULTI_NL = re.compile(r"\n{3,}")
RE_BULLETS = re.compile(r"(?m)^\s*[\*#]\s*")
RE_HEADING = re.compile(r"^\s*=+\s*(.*?)\s*=+\s*$", re.MULTILINE)
RE_INTERLANG_LINE = re.compile(r"^(?:\[\[[a-z-]{2,}:[^\]]+\]\]|[a-z]{2,}(?:-[a-z]+)?:\s*.+)$", re.IGNORECASE | re.MULTILINE)
# Inline heading pattern (not line-anchored) to catch '... == Heading == ...'
RE_INLINE_HEADING = re.compile(r"\s*==\s*(.*?)\s*==\s*")

JUTSU_MEDIA_LINE = re.compile(r"^\s*\|\s*jutsu\s+media\s*=\s*(.+)$", re.IGNORECASE | re.MULTILINE)


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
    return ""


def value_contains_anime(value: str) -> bool:
    s = RE_LINK_LABEL.sub(r"\1", value)
    s = RE_TEMPLATE_SIMPLE.sub(" ", s)
    tokens = re.split(r"[,/]|\band\b|\bor\b", s, flags=re.IGNORECASE)
    return any("anime" in t.strip().lower() for t in tokens)


def extract_media_value(wikitext: str) -> Optional[str]:
    m = JUTSU_MEDIA_LINE.search(wikitext)
    return m.group(1).strip() if m else None


def find_infobox_span(wikitext: str) -> Optional[Tuple[int, int]]:
    lower = wikitext.lower()
    start = lower.find("{{infobox/jutsu")
    if start == -1:
        return None
    i, depth, n = start, 0, len(wikitext)
    while i < n - 1:
        if wikitext[i] == '{' and wikitext[i+1] == '{':
            depth += 1
            i += 2
            continue
        if wikitext[i] == '}' and wikitext[i+1] == '}':
            depth -= 1
            i += 2
            if depth <= 0:
                return (start, i)
            continue
        i += 1
    return (start, n)


def parse_infobox(wikitext: str) -> Dict[str, str]:
    span = find_infobox_span(wikitext)
    if not span:
        return {}
    a, b = span
    block = wikitext[a:b]
    fields: Dict[str, str] = {}
    for line in block.splitlines():
        if '|' not in line:
            continue
        # lines like: | key = value
        m = re.match(r"^\s*\|\s*([^=|]+?)\s*=\s*(.*?)\s*$", line)
        if not m:
            continue
        key = m.group(1).strip().lower()
        val = m.group(2).strip()
        # Strip refs/templates/links inside value
        val = RE_REF.sub(" ", val)
        val = RE_LINK_LABEL.sub(r"\1", val)
        val = RE_TEMPLATE_SIMPLE.sub(" ", val)
        val = RE_FILE.sub(" ", val)
        val = RE_CATEGORY.sub(" ", val)
        val = RE_TAGS.sub(" ", val)
        val = RE_BOLD_ITALIC.sub(" ", val)
        val = RE_WS.sub(" ", val)
        val = RE_MULTI_SPACE.sub(" ", val).strip()
        fields[key] = val
    return fields


def strip_infobox(wikitext: str) -> str:
    span = find_infobox_span(wikitext)
    if not span:
        return wikitext
    a, b = span
    return wikitext[:a] + wikitext[b:]


def clean_body_text(wikitext: str) -> str:
    s = unescape(wikitext)
    s = RE_COMMENT.sub(" ", s)
    s = RE_REF.sub(" ", s)
    s = RE_REFERENCES.sub(" ", s)
    s = RE_CATEGORY.sub(" ", s)
    s = RE_FILE.sub(" ", s)
    s = RE_LINK_LABEL.sub(r"\1", s)
    s = RE_LINK_SOLO.sub(r"\1", s)
    # remove simple templates iteratively
    for _ in range(5):
        new_s = RE_TEMPLATE_SIMPLE.sub(" ", s)
        if new_s == s:
            break
        s = new_s
    s = RE_TAGS.sub(" ", s)
    s = RE_BOLD_ITALIC.sub(" ", s)
    # Convert wiki headings to Markdown and ensure spacing (line-anchored)
    s = RE_HEADING.sub(r"\n## \1\n", s)
    # Also convert any inline '== Heading ==' occurrences
    s = RE_INLINE_HEADING.sub(lambda m: "\n## " + m.group(1).strip() + "\n", s)
    # Drop interlanguage lines like 'fr:Title' or '[[fr:Title]]'
    s = RE_INTERLANG_LINE.sub(" ", s)
    s = RE_WS.sub(" ", s)
    s = RE_TRAILING_SPACES.sub("", s)
    s = RE_MULTI_SPACE.sub(" ", s)
    s = RE_MULTI_NL.sub("\n\n", s)
    return s.strip()


def split_sentences(text: str) -> List[str]:
    # simple splitter on period/question/exclamation keeping basic readability
    parts = re.split(r"(?<=[.!?])\s+", text)
    items = [p.strip() for p in parts if p.strip()]
    # Remove pure headings from sentences list
    items = [p for p in items if not p.startswith("## ")]
    return items


def classify_sentences(sentences: List[str]) -> Dict[str, List[str]]:
    groups = {"usage": [], "counters": [], "drawbacks": [], "notes": []}
    for s in sentences:
        low = s.lower()
        if any(k in low for k in ["avoid", "dodge", "counter", "intercept", "push", "absorb", "seal", "space–time", "kamui", "shield", "deflect", "resist", "jinchuriki", "kāma", "karma"]):
            groups["counters"].append(s)
        elif any(k in low for k in ["cost", "strain", "bleed", "drawback", "risk", "exhaust", "pain", "damage to the user"]):
            groups["drawbacks"].append(s)
        elif any(k in low for k in ["produces", "creates", "allows", "used to", "can be used", "surrounding themselves", "shape the flames", "control"]):
            groups["usage"].append(s)
        else:
            groups["notes"].append(s)
    return groups


def render_markdown(name: str, fields: Dict[str, str], body: str) -> str:
    # Title
    out: List[str] = [f"# {name}", ""]
    # Quick facts
    quick: List[str] = []
    if fields.get("jutsu type"):
        quick.append(f"- Element/Type: {fields['jutsu type']}")
    if fields.get("jutsu classification"):
        quick.append(f"- Classification: {fields['jutsu classification']}")
    if fields.get("jutsu class type"):
        quick.append(f"- Class: {fields['jutsu class type']}")
    if fields.get("jutsu range"):
        quick.append(f"- Range: {fields['jutsu range']}")
    if fields.get("users"):
        quick.append(f"- Users: {fields['users']}")
    if fields.get("jutsu media"):
        quick.append(f"- Media: {fields['jutsu media']}")
    if quick:
        out.append("## Quick Facts")
        out.extend(quick)
        out.append("")
    # Body sections
    sentences = split_sentences(body)
    if sentences:
        # summary = first 2 sentences
        out.append("## Summary")
        out.append(" ".join(sentences[:2]))
        out.append("")
        groups = classify_sentences(sentences[2:] if len(sentences) > 2 else [])
        if groups["usage"]:
            out.append("## Usage")
            for s in groups["usage"]:
                out.append(f"- {s}")
            out.append("")
        if groups["counters"]:
            out.append("## Counters / Defenses")
            for s in groups["counters"]:
                out.append(f"- {s}")
            out.append("")
        if groups["drawbacks"]:
            out.append("## Drawbacks")
            for s in groups["drawbacks"]:
                out.append(f"- {s}")
            out.append("")
        if groups["notes"]:
            out.append("## Notes")
            for s in groups["notes"]:
                out.append(f"- {s}")
            out.append("")
    return "\n".join(out).strip() + "\n"


def main():
    ap = argparse.ArgumentParser(description="Generate readable Markdown for anime jutsu")
    ap.add_argument("--pages-dir", default="cache/pages")
    ap.add_argument("--out-dir", default="cache/clean_md")
    ap.add_argument("--limit", type=int, default=0, help="Limit number of pages (debug)")
    ap.add_argument("--verbose", action="store_true")
    args = ap.parse_args()

    pages_dir = Path(args.pages_dir)
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    count = 0
    written = 0
    for i, fp in enumerate(list_json_files(pages_dir)):
        data = read_page_json(fp)
        if not data:
            continue
        wt = extract_wikitext(data)
        if not wt:
            continue
        media_val = extract_media_value(wt)
        if not media_val or not value_contains_anime(media_val):
            continue
        name = data.get("name") or fp.stem
        fields = parse_infobox(wt)
        # ensure we keep media from line if infobox missing
        if "jutsu media" not in fields and media_val:
            fields["jutsu media"] = RE_LINK_LABEL.sub(r"\1", media_val)
        body_raw = strip_infobox(wt)
        body_clean = clean_body_text(body_raw)
        md = render_markdown(name, fields, body_clean)
        # safe filename
        safe = re.sub(r"[^\w\-]+", "_", name).strip("_") or fp.stem
        (out_dir / f"{safe}.md").write_text(md, encoding="utf-8")
        written += 1
        count += 1
        if args.verbose and (i % 500 == 0):
            print(f"...processed {i} files -> {written} markdowns")
        if args.limit and written >= args.limit:
            break

    if args.verbose:
        print(f"Wrote {written} markdown files to {out_dir}")


if __name__ == "__main__":
    main()
