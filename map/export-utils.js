import { W, H } from './constants.js';
import { MODEL } from './model.js';
import { out } from './constants.js';

export function dumpJSON(){
  // split export into separate sections + terrain grouping
  const data = {
    meta: {
      counts: {
        districts: Object.keys(MODEL.districts||{}).length,
        roads: (MODEL.roads||[]).length,
        poi: (MODEL.poi||[]).length,
        walls: (MODEL.walls||[]).length,
        rivers: 0,
        grass: (MODEL.grass||[]).length,
        forest: (MODEL.forest||[]).length,
        mountains: (MODEL.mountains||[]).length
      }
    },
    districts: MODEL.districts || {},
    roads: MODEL.roads || [],
    poi: MODEL.poi || [],
    walls: MODEL.walls || [],
    rivers: [],
    terrain: {
      grass: MODEL.grass || [],
      forest: MODEL.forest || [],
      mountains: MODEL.mountains || []
    }
  };
  out.value = JSON.stringify(data,null,2);
  window.dispatchEvent(new CustomEvent('json:updated'));
}

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
  // Export grass as many thin blade lines instead of fat polylines
  const dGrass = (MODEL.grass||[]).map(g=>{
    const pts = Array.isArray(g?.points) ? g.points : [];
    if(pts.length === 0) return '';
    const px = pts.map(([x,y])=>({x:x*W/100, y:y*H/100}));
    const baseW = Math.max(10, Math.min(120, Number(g.width)||40));
    const stepPx = Math.max(6, Math.min(26, 30 - baseW/3));
    const hMin = Math.max(6, Math.min(28, baseW * 0.18));
    const hMax = Math.max(10, Math.min(44, baseW * 0.55));
    const tMin = 0.8, tMax = 2.4;
    const rnd = (a,b)=>a+Math.random()*(b-a);
    let out='';
    for(let i=0;i<px.length-1;i++){
      const a=px[i], b=px[i+1]; const dx=b.x-a.x, dy=b.y-a.y; const len=Math.hypot(dx,dy)||1;
      const ux=dx/len, uy=dy/len; const nx=-uy, ny=ux;
      for(let t=0;t<=len;t+=stepPx){
        const bx=a.x+ux*t + rnd(-2,2), by=a.y+uy*t + rnd(-2,2);
        const side = Math.random()<0.5? -1: 1;
        const ang = rnd(-0.35,0.35); const cos=Math.cos(ang), sin=Math.sin(ang);
        const rx=nx*cos - ny*sin, ry=nx*sin + ny*cos;
        const h=rnd(hMin,hMax)*side; const tx=bx+rx*h, ty=by+ry*h; const w=rnd(tMin,tMax);
        out += `<line x1="${bx}" y1="${by}" x2="${tx}" y2="${ty}" stroke="#16a34a" stroke-opacity=".8" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>\n`;
      }
    }
    if(px.length===1){
      const c=px[0];
      for(let k=0;k<18;k++){
        const ang=rnd(0,Math.PI*2), len=rnd(hMin*0.6,hMax*0.9);
        const tx=c.x+Math.cos(ang)*len*0.5, ty=c.y+Math.sin(ang)*len*0.5, w=rnd(tMin,tMax);
        out += `<line x1="${c.x}" y1="${c.y}" x2="${tx}" y2="${ty}" stroke="#16a34a" stroke-opacity=".8" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>\n`;
      }
    }
    return out;
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

export function buildDefaultModelJS(){
  const obj = {
    districts: MODEL.districts || {},
    roads: MODEL.roads || [],
    poi: MODEL.poi || [],
    walls: MODEL.walls || [],
    rivers: [],
    grass: MODEL.grass || [],
    forest: MODEL.forest || [],
    mountains: MODEL.mountains || []
  };
  return `export const DEFAULT_MODEL = ${JSON.stringify(obj, null, 2)};\n`;
}
