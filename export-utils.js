import { W, H } from './constants.js';
import { MODEL } from './model.js';
import { out } from './constants.js';

export function dumpJSON(){ out.value = JSON.stringify(MODEL,null,2); }

export function buildExportSVG(){
  const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const dPolys = Object.values(MODEL.districts).map(d=>{
    const pts=d.points.map(([x,y])=>[x*W/100,y*H/100].join(',')).join(' ');
    const col = d.color || '#22d3ee';
    return `<polygon points="${pts}" fill="${col}" fill-opacity="0.33" stroke="${col}" stroke-width="2"/>`;
  }).join('\n');
  const dRoads = MODEL.roads.map(r=>{
    const pts=r.points.map(([x,y])=>[x*W/100,y*H/100].join(',')).join(' ');
    const col = r.type==='avenue'?'#f8fafc':(r.type==='canal'?'#38bdf8':'#cbd5e1');
    return `<polyline points="${pts}" fill="none" stroke="${col}" stroke-width="${Math.max(4, r.width||4)}" stroke-linecap="round" stroke-linejoin="round"/>`;
  }).join('\n');
  const dPins = MODEL.poi.map(p=>{
    const r = 8.8; // uniform px radius for all POIs in exported SVG
    const cx=p.x*W/100, cy=p.y*H/100;
    const fill = p.type==='gate'?'#ef4444':(p.type==='park'?'#22c55e':(p.type==='letter'?'#a78bfa':'#f59e0b'));
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="#000" stroke-width="1.1"><title>${esc(p.name||p.id||'')}</title></circle>`;
  }).join('\n');
  const dWalls = (MODEL.walls||[]).map(w=>{
    const cx=w.cx*W/100, cy=w.cy*H/100, r=w.r*W/100;
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#94a3b8" stroke-width="${w.width||8}" />`;
  }).join('\n');
  const dGrass = (MODEL.grass||[]).map(g=>{
    const pts=g.points.map(([x,y])=>[x*W/100,y*H/100].join(',')).join(' ');
    return `<polyline points="${pts}" fill="none" stroke="#16a34a" stroke-opacity=".4" stroke-width="${g.width||50}" stroke-linecap="round" stroke-linejoin="round"/>`;
  }).join('\n');
  const dForest = (MODEL.forest||[]).map(f=>{
    const pts=f.points.map(([x,y])=>[x*W/100,y*H/100].join(',')).join(' ');
    return `<polygon points="${pts}" fill="#166534" fill-opacity="0.75" stroke="#064e3b" stroke-width="1.5" />`;
  }).join('\n');
  const dMountains = (MODEL.mountains||[]).map(m=>{
    const pts=m.points.map(([x,y])=>[x*W/100,y*H/100].join(',')).join(' ');
    return m.shape==='triangle'
      ? `<polygon points="${pts}" fill="#78350f" fill-opacity=".85" stroke="#3f1d0b" stroke-width="1.5"/>`
      : `<polyline points="${pts}" fill="none" stroke="#78350f" stroke-opacity=".8" stroke-width="${m.width||10}" stroke-linecap="round" stroke-linejoin="round"/>`;
  }).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
${dGrass}
${dForest}
${dMountains}
${dRoads}
${dPolys}
${dWalls}
${dPins}
</svg>`;
}