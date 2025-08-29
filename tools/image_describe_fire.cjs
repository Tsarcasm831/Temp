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

function parseElements(facts, name, summary) {
  const e = lower(facts['element/type'] || facts['element'] || facts['type'] || '');
  const text = lower(`${name} ${summary || ''}`);
  const set = new Set();
  const addIf = (key, label) => { if (e.includes(key) || text.includes(key)) set.add(label); };
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
  if (text.includes('amaterasu')) set.add('black-flames');
  return Array.from(set);
}

function elementImagery(elements) {
  const lines = [];
  const has = (k) => elements.includes(k);
  if (has('black-flames')) {
    lines.push('black, inextinguishable flames with purple highlights, heat distortion, and ember trails');
  }
  if (has('fire') && !has('black-flames')) {
    lines.push('roaring orange-red flames, ember particles, and heat shimmer');
  }
  if (has('wind')) lines.push('slicing wind currents, speed lines, drifting dust motes');
  if (has('water')) lines.push('surging water arcs, spray, cool blue highlights');
  if (has('earth')) lines.push('cracking stone debris, flying dust, grounded tones');
  if (has('lightning')) lines.push('crackling blue-white lightning bolts and arcing energy');
  if (has('storm')) lines.push('laser-like beams, turbulent atmosphere, high-energy glow');
  if (has('lava')) lines.push('molten lava splashes with glowing edges and smoke');
  if (has('wood')) lines.push('growing wooden tendrils, bark textures, splinters');
  if (has('yin') || has('yang')) lines.push('abstract chakra aura, arcane glyphs, dramatic contrast');
  return lines;
}

function chakraColor(elements) {
  if (elements.includes('black-flames')) return 'inky black with violet edges';
  if (elements.includes('fire')) return 'fiery orange-red';
  if (elements.includes('lightning')) return 'electric blue-white';
  if (elements.includes('wind')) return 'teal-white';
  if (elements.includes('water')) return 'aqua blue';
  if (elements.includes('earth')) return 'warm ochre';
  if (elements.includes('lava')) return 'molten orange';
  return 'high-contrast';
}

function detectMotifs(name, summary) {
  const t = lower(`${name} ${summary || ''}`);
  const m = [];
  if (t.includes('dragon')) m.push('dragon-shaped effect');
  if (t.includes('shield') || t.includes('wrapping')) m.push('defensive aura wrapping the user');
  if (t.includes('bullet') || t.includes('meteor') || t.includes('beam')) m.push('projectile focus');
  if (t.includes('cooperation') || t.includes('allied')) m.push('multi-caster formation');
  return m;
}

function describe(entry) {
  const name = entry.name || entry.sourcePage || 'Unknown Technique';
  const blocks = entry?.raw?.markdown;
  const summary = (entry.summary && typeof entry.summary === 'string')
    ? entry.summary
    : (() => {
        // Fallback: try find first paragraph
        if (Array.isArray(blocks)) {
          const p = blocks.find(b => b.type === 'paragraph' && b.text);
          return p ? p.text : '';
        }
        return '';
      })();
  const facts = Array.isArray(blocks) ? extractQuickFacts(blocks) : {};
  const elements = parseElements(facts, name, summary);
  const effects = elementImagery(elements);
  const chakra = chakraColor(elements);
  const motifs = detectMotifs(name, summary);

  const s0 = 'naruto-style, anime cel-shading, bold linework';
  const s1 = `Key art of ${name} mid-cast with a dynamic action pose.`;
  const s2 = effects.length
    ? `Emphasize ${effects[0]}${effects[1] ? `; also include ${effects.slice(1,3).join('; ')}` : ''}.`
    : `Emphasize dramatic chakra effects and clear depiction of the technique.`;
  const s3 = `Three-quarter cinematic angle, slight low tilt, strong rim light, ${chakra} chakra aura, motion speed-lines.`;
  const s4 = motifs.length
    ? `Highlight motif: ${motifs.join(', ')}.`
    : `Clear focal point on the jutsu effect.`;
  const s5 = 'Clean, uncluttered background with atmospheric depth; high contrast; leave negative space for UI, subject framed slightly off-center.';

  return `${s0}. ${s1} ${s2} ${s3} ${s4} ${s5}`;
}

function run(path) {
  const input = fs.readFileSync(path, 'utf8');
  const data = JSON.parse(input);
  const out = data.map(e => {
    const copy = { ...e };
    // Rename thumbnail -> image-description with new description
    copy['image-description'] = describe(copy);
    if ('thumbnail' in copy) delete copy.thumbnail;
    if ('images' in copy) delete copy.images;
    return copy;
  });
  fs.writeFileSync(path, JSON.stringify(out, null, 2) + '\n', 'utf8');
}

if (require.main === module) {
  const file = process.argv[2] || 'cache/by_group/fire.json';
  run(file);
}
