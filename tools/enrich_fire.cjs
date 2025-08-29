const fs = require('fs');

function slugify(name) {
  return String(name || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function sectionRanges(blocks) {
  // Collect ranges for level-2 headings
  const ranges = [];
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.type === 'heading' && Number(b.level) === 2) {
      ranges.push({ title: String(b.text || '').trim(), start: i + 1, end: blocks.length });
    }
  }
  // Set end boundaries
  for (let i = 0; i < ranges.length - 1; i++) {
    ranges[i].end = ranges[i + 1].start - 1;
  }
  const map = new Map();
  for (const r of ranges) map.set(r.title.toLowerCase(), r);
  return map;
}

function collectLists(blocks, start, end) {
  const items = [];
  for (let i = start; i <= end; i++) {
    const b = blocks[i];
    if (!b) continue;
    if (b.type === 'list' && Array.isArray(b.items)) {
      for (let it of b.items) {
        if (typeof it !== 'string') continue;
        it = it.trim();
        // If item starts with a bold or triple-bold label, strip it to keep the executable part
        // Case A: **Label:** rest (colon inside bold)
        it = it.replace(/^\*{2,3}[^*]*:\*{2}\s*/, '');
        // Case B: **Label**: rest (colon after bold)
        it = it.replace(/^\*{2,3}[^*]+\*{2}:\s*/, '');
        // Drop leading list asterisks or hyphens accidentally carried
        it = it.replace(/^[*\-•]\s+/, '');
        // Normalize extra spaces introduced by formatting
        it = it.replace(/\s{2,}/g, ' ');
        if (it) items.push(it);
      }
    } else if (b.type === 'paragraph') {
      // Treat standalone paragraph as a single item if list absent
      const t = String(b.text || '').trim();
      if (t) items.push(t);
    }
  }
  return items;
}

function extractQuickFacts(blocks) {
  const ranges = sectionRanges(blocks);
  const q = ranges.get('quick facts');
  const facts = {};
  if (!q) return facts;
  for (let i = q.start; i <= q.end; i++) {
    const b = blocks[i];
    if (!b) continue;
    if (b.type === 'list' && Array.isArray(b.items)) {
      for (const raw of b.items) {
        if (typeof raw !== 'string') continue;
        const m = raw.match(/^\*\*([^*]+)\*\*:\s*(.*)$/);
        if (!m) continue;
        const key = m[1].trim().toLowerCase();
        const val = m[2].trim();
        facts[key] = val;
      }
    }
  }
  return facts;
}

function extractSummary(blocks) {
  const ranges = sectionRanges(blocks);
  const s = ranges.get('summary');
  let paras = [];
  if (s) {
    for (let i = s.start; i <= s.end; i++) {
      const b = blocks[i];
      if (b && b.type === 'paragraph' && b.text) paras.push(b.text.trim());
    }
  }
  if (!paras.length) {
    // Fallback: first paragraph anywhere
    const p = blocks.find(b => b.type === 'paragraph' && String(b.text || '').trim());
    if (p) paras.push(p.text.trim());
  }
  const text = paras.join(' ').replace(/\s{2,}/g, ' ').trim();
  return text || null;
}

function enrich(entry) {
  const name = entry.name || entry.sourcePage || 'Unknown';
  const id = slugify(name);
  const blocks = (entry.raw && Array.isArray(entry.raw.markdown)) ? entry.raw.markdown : [];
  const ranges = sectionRanges(blocks);
  const quick = extractQuickFacts(blocks);

  // Rank
  const rank = quick['rank'] ? quick['rank'] : 'Unknown';

  // Chakra cost
  const chakraCost = quick['chakra cost'] || quick['chakra'] || 'Unknown';

  // Seals -> array
  let seals = [];
  if (quick['seals']) {
    seals = quick['seals']
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
  }

  // Summary
  const summary = extractSummary(blocks) || '';

  // Technique: Usage + Notes as actionable steps
  const technique = [];
  const usage = ranges.get('usage');
  if (usage) technique.push(...collectLists(blocks, usage.start, usage.end));
  const notes = ranges.get('notes');
  if (notes) technique.push(...collectLists(blocks, notes.start, notes.end));

  // Tips: Drawbacks bullets
  const tips = [];
  const drawbacks = ranges.get('drawbacks');
  if (drawbacks) tips.push(...collectLists(blocks, drawbacks.start, drawbacks.end));

  // Images: include thumbnail if present
  const images = [];
  if (entry.thumbnail) images.push(entry.thumbnail);

  // Ensure arrays
  const ensureArray = a => Array.isArray(a) ? a : [];

  return {
    ...entry,
    id,
    name,
    rank,
    chakraCost,
    seals: ensureArray(seals),
    summary,
    technique: ensureArray(technique),
    training: ensureArray(entry.training || []), // keep if any pre-existing
    tips: ensureArray(tips),
    images: ensureArray(images),
  };
}

function processFile(path) {
  const input = fs.readFileSync(path, 'utf8');
  const data = JSON.parse(input);
  const result = data.map(enrich);
  fs.writeFileSync(path, JSON.stringify(result, null, 2) + '\n', 'utf8');
}

if (require.main === module) {
  const file = process.argv[2] || 'cache/by_group/fire.json';
  processFile(file);
}
