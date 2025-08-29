const fs = require('fs');

function lower(s) { return String(s || '').toLowerCase(); }

function sectionRanges(blocks) {
  const ranges = [];
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.type === 'heading' && Number(b.level) === 2) {
      ranges.push({ title: String(b.text || '').trim(), start: i + 1, end: blocks.length });
    }
  }
  for (let i = 0; i < ranges.length - 1; i++) ranges[i].end = ranges[i + 1].start - 1;
  const map = new Map();
  for (const r of ranges) map.set(r.title.toLowerCase(), r);
  return map;
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
        facts[m[1].trim().toLowerCase()] = m[2].trim();
      }
    }
  }
  return facts;
}

function parseElements(facts, name) {
  const e = lower(facts['element/type'] || facts['element'] || facts['type'] || '');
  const set = new Set();
  const addIf = (key, label) => { if (e.includes(key)) set.add(label); };
  addIf('fire release', 'fire');
  addIf('wind release', 'wind');
  addIf('water release', 'water');
  addIf('earth release', 'earth');
  addIf('lightning release', 'lightning');
  addIf('storm release', 'storm');
  addIf('lava release', 'lava');
  addIf('wood release', 'wood');
  addIf('yin release', 'yin');
  addIf('yang release', 'yang');
  // Special cases from name
  if (lower(name).includes('amaterasu')) set.add('black-flames');
  return Array.from(set);
}

function elementImagery(elements) {
  const lines = [];
  const has = (k) => elements.includes(k);
  if (has('black-flames')) {
    lines.push('black, inextinguishable flames with heat distortion and ember trails');
  }
  if (has('fire') && !has('black-flames')) {
    lines.push('roaring orange-red flames, ember particles, and heat shimmer');
  }
  if (has('wind')) lines.push('slicing wind currents with dust motes and motion streaks');
  if (has('water')) lines.push('surging water arcs with spray and blue highlights');
  if (has('earth')) lines.push('cracking stone, debris shards, and flying dust');
  if (has('lightning')) lines.push('crackling blue-white lightning arcing through the scene');
  if (has('storm')) lines.push('laser-like energy beams and turbulent atmosphere');
  if (has('lava')) lines.push('molten lava splashes with glowing edges and smoke');
  if (has('wood')) lines.push('growing wooden tendrils and bark textures');
  if (has('yin') || has('yang')) lines.push('abstract chakra aura, subtle glyphs, and high-contrast lighting');
  return lines;
}

function buildThumbnailDescription(entry) {
  const name = entry.name || entry.sourcePage || 'Unknown Technique';
  const blocks = entry?.raw?.markdown;
  const facts = Array.isArray(blocks) ? extractQuickFacts(blocks) : {};
  const elements = parseElements(facts, name);
  const effects = elementImagery(elements);

  const s1 = `Cinematic thumbnail showing ${name} in action.`;
  const s2 = effects.length
    ? `Emphasize ${effects[0]}${effects[1] ? `; also suggest ${effects.slice(1,3).join('; ')}` : ''}.`
    : `Emphasize dramatic chakra effects with clear visual cues of the technique.`;
  const s3 = `Dynamic three-quarter angle on the caster with intense rim lighting and a clear focal point on the jutsu effect.`;
  const s4 = `Use a neutral, uncluttered background to keep UI legible, with high contrast and the subject slightly off-center.`;

  return `${s1} ${s2} ${s3} ${s4}`;
}

function transform(path) {
  const input = fs.readFileSync(path, 'utf8');
  const data = JSON.parse(input);
  const out = data.map(e => {
    const copy = { ...e };
    if ('pageId' in copy) delete copy.pageId;
    copy.thumbnail = buildThumbnailDescription(copy);
    return copy;
  });
  fs.writeFileSync(path, JSON.stringify(out, null, 2) + '\n', 'utf8');
}

if (require.main === module) {
  const file = process.argv[2] || 'cache/by_group/fire.json';
  transform(file);
}

