/* @tweakable use built-in fallbacks when external map modules are unavailable */
import { DEFAULT_MODEL as MAP_DEFAULT_MODEL } from '/map/defaults/full-default-model.js';
const DEFAULT_ROADS = (MAP_DEFAULT_MODEL?.roads) || [];
const DEFAULT_DISTRICTS = (MAP_DEFAULT_MODEL?.districts) || {};
const DEFAULT_GRASS = (MAP_DEFAULT_MODEL?.grass) || [];

// Utility: grid label parsing and world position helper for rivers
import { parseGridLabel, posForCell } from '../../../game/objects/utils/gridLabel.js';
/* @tweakable world size used to convert percent map coordinates into world units */
import { WORLD_SIZE } from '/src/scene/terrain.js';

/**
 * Load roads and districts from the map defaults.
 * Data is cached after first call.
 */
export async function loadKonohaRoads() {
  if (__roadsCache) return __roadsCache;
  // Try to import the live model if enabled and not yet attempted
  if (USE_LIVE_MAP_DISTRICTS && !__liveModelRef) {
    try {
      const mod = await import(MAP_MODEL_PATH);
      __liveModelRef = mod?.MODEL ?? null;
    } catch (_) {
      __liveModelRef = null; // missing or failed; fallback below
    }
  }
  // Prefer live data from the editor; gracefully fall back to defaults if missing or invalid
  const liveDistricts = (USE_LIVE_MAP_DISTRICTS && __liveModelRef && __liveModelRef.districts && Object.keys(__liveModelRef.districts).length)
    ? __liveModelRef.districts
    : DEFAULT_DISTRICTS;
  const liveRoads = (USE_LIVE_MAP_DISTRICTS && __liveModelRef && Array.isArray(__liveModelRef.roads) && __liveModelRef.roads.length)
    ? __liveModelRef.roads
    : DEFAULT_ROADS;
  const liveGrass = (USE_LIVE_MAP_DISTRICTS && __liveModelRef && Array.isArray(__liveModelRef.grass))
    ? __liveModelRef.grass
    : DEFAULT_GRASS;
  __roadsCache = {
    roads: { all: liveRoads },
    districts: liveDistricts,
    grass: liveGrass
  };
  return __roadsCache;
}

// Road drawing defaults
/* @tweakable when true, attempt to use the live map model from /map if present */
const USE_LIVE_MAP_DISTRICTS = true;
/* @tweakable module path used to import the live map model */
const MAP_MODEL_PATH = '/map/model.js';
/* @tweakable internal cache for roads/districts (null to force reload) */
let __roadsCache = null;
/* @tweakable internal ref to live MODEL from /map to avoid repeated imports */
let __liveModelRef = null;

const ROAD_COLOR = '#d9c3a3';
const ROAD_OPACITY = 0.85;
const ROAD_BASE_WIDTH = 6; // pixels when r.width == 3
/* road textures (project-root paths) */
const ROAD_TEX_SECONDARY = '/secondary_road_texture.png';

// Cached image/pattern for road texture strokes
let __roadTexImg = null;
let __roadTexPattern = null;
let __roadTexLoaded = false;

function loadImage(src){
  return new Promise((resolve)=>{
    const img = new Image();
    img.onload = ()=> resolve(img);
    img.onerror = ()=> resolve(null);
    img.src = src;
  });
}

async function ensureRoadPattern(ctx){
  if(__roadTexPattern) return __roadTexPattern;
  if(!__roadTexLoaded){
    __roadTexLoaded = true;
    __roadTexImg = await loadImage(ROAD_TEX_SECONDARY);
  }
  if(__roadTexImg){
    // Draw into a small offscreen canvas to control tile size
    const tile = 24; // px
    const can = document.createElement('canvas');
    can.width = tile; can.height = tile;
    const c2 = can.getContext('2d');
    c2.drawImage(__roadTexImg, 0, 0, tile, tile);
    __roadTexPattern = ctx.createPattern(can, 'repeat');
  }
  return __roadTexPattern;
}

/**
 * Draw polyline roads loaded from the map defaults.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} scale  pixels per world unit
 * @param {number} cx     canvas x coordinate of world origin
 * @param {number} cy     canvas y coordinate of world origin
 * @param {Object} options drawing options
 */
export async function drawRoads(ctx, scale, cx, cy, options = {}) {
  const { roads } = await loadKonohaRoads();
  const opt = {
    color: options.primaryColor || ROAD_COLOR,
    alpha: typeof options.alpha === 'number' ? options.alpha : ROAD_OPACITY,
    baseWidth: options.wPrimary || ROAD_BASE_WIDTH
  };

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalAlpha = opt.alpha;
  const roadPattern = await ensureRoadPattern(ctx);

  for (const r of roads.all) {
    if (!r.points || r.points.length < 2) continue;
    ctx.beginPath();
    r.points.forEach(([x, y], idx) => {
      const wx = (x / 100) * WORLD_SIZE - WORLD_SIZE / 2;
      const wz = (y / 100) * WORLD_SIZE - WORLD_SIZE / 2;
      const px = cx + wx * scale;
      const py = cy + wz * scale;
      if (idx === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    const widthFactor = (r.width || 3) / 3;
    ctx.lineWidth = opt.baseWidth * widthFactor;
    // Use texture for non-canal roads; fall back to color when pattern missing
    const rtype = (r.type || '').toLowerCase();
    if (rtype === 'canal') {
      ctx.strokeStyle = options.canalColor || '#38bdf8';
    } else if (roadPattern) {
      ctx.strokeStyle = roadPattern;
    } else {
      ctx.strokeStyle = opt.color;
    }
    ctx.stroke();
  }

  ctx.restore();
}

// Grass strokes from map terrain (polyline strokes drawn in green)
const GRASS_COLOR = '#16a34a';
const GRASS_ALPHA = 0.4;
const GRASS_WIDTH_SCALE = 0.5; // multiply map width (e.g., 50) to get canvas px

/**
 * Draw grass polylines from the map model's terrain.grass array.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} scale  pixels per world unit
 * @param {number} cx     canvas x coordinate of world origin
 * @param {number} cy     canvas y coordinate of world origin
 * @param {Object} options { color, alpha, widthScale }
 */
export async function drawGrass(ctx, scale, cx, cy, options = {}) {
  const { grass } = await loadKonohaRoads();
  if (!Array.isArray(grass) || grass.length === 0) return;
  const color = options.color || GRASS_COLOR;
  const alpha = (typeof options.alpha === 'number') ? options.alpha : GRASS_ALPHA;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = color;

  const rnd = (a,b)=>a+Math.random()*(b-a);

  for (const g of grass) {
    const pts = Array.isArray(g?.points) ? g.points : [];
    if (pts.length === 0) continue;
    const baseW = Math.max(10, Math.min(120, Number(g.width)||40));
    // Keep approx 10-26px spacing in screen px: convert to world units with scale
    const stepWorld = Math.max(2, (30 - baseW/3) / Math.max(1e-6, scale));
    const hMinPx = Math.max(6, Math.min(28, baseW * 0.18));
    const hMaxPx = Math.max(10, Math.min(44, baseW * 0.55));
    const tMin = 0.8, tMax = 2.4; // px

    // Convert pct to world units
    const wp = pts.map(([x,y])=>({
      x: (x/100)*WORLD_SIZE - WORLD_SIZE/2,
      z: (y/100)*WORLD_SIZE - WORLD_SIZE/2
    }));

    if (wp.length === 1) {
      // Tuft at single point
      const c = wp[0];
      for (let k=0;k<18;k++){
        const ang=rnd(0,Math.PI*2), lenPx=rnd(hMinPx*0.6,hMaxPx*0.9);
        const lenW = lenPx / Math.max(1e-6, scale);
        const tx=c.x + Math.cos(ang)*lenW*0.5;
        const tz=c.z + Math.sin(ang)*lenW*0.5;
        ctx.beginPath();
        ctx.moveTo(cx + c.x*scale, cy + c.z*scale);
        ctx.lineTo(cx + tx*scale, cy + tz*scale);
        ctx.lineWidth = rnd(tMin,tMax);
        ctx.stroke();
      }
      continue;
    }

    for (let i=0;i<wp.length-1;i++){
      const a=wp[i], b=wp[i+1];
      const dx=b.x-a.x, dz=b.z-a.z; const len=Math.hypot(dx,dz)||1;
      const ux=dx/len, uz=dz/len; const nx=-uz, nz=ux; // normal
      for (let t=0;t<=len; t+=stepWorld){
        const bx=a.x+ux*t + rnd(-1.5,1.5); // jitter in world units
        const bz=a.z+uz*t + rnd(-1.5,1.5);
        const side = Math.random()<0.5? -1: 1;
        const ang = rnd(-0.35,0.35); const cos=Math.cos(ang), sin=Math.sin(ang);
        const rx=nx*cos - nz*sin, rz=nx*sin + nz*cos;
        const hPx=rnd(hMinPx,hMaxPx)*side; const hW=hPx/Math.max(1e-6, scale);
        const tx=bx + rx*hW; const tz=bz + rz*hW;
        ctx.beginPath();
        ctx.moveTo(cx + bx*scale, cy + bz*scale);
        ctx.lineTo(cx + tx*scale, cy + tz*scale);
        ctx.lineWidth = rnd(tMin,tMax);
        ctx.stroke();
      }
    }
  }

  ctx.restore();
}

// District drawing defaults
const DISTRICT_STROKE = '#ffffff';
const DISTRICT_FILL = '#ffffff';

/**
 * Draw district polygons.
 */
export async function drawDistricts(ctx, scale, cx, cy, options = {}) {
  const { districts } = await loadKonohaRoads();
  const opt = {
    stroke: options.stroke || DISTRICT_STROKE,
    fill: options.fill || DISTRICT_FILL,
    alpha: typeof options.alpha === 'number' ? options.alpha : 0.2,
    lineWidth: options.lineWidth || 2
  };

  ctx.save();
  ctx.globalAlpha = opt.alpha;
  for (const d of Object.values(districts)) {
    if (!d.points || d.points.length < 3) continue;
    ctx.beginPath();
    d.points.forEach(([x, y], idx) => {
      const wx = (x / 100) * WORLD_SIZE - WORLD_SIZE / 2;
      const wz = (y / 100) * WORLD_SIZE - WORLD_SIZE / 2;
      const px = cx + wx * scale;
      const py = cy + wz * scale;
      if (idx === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.fillStyle = opt.fill;
    ctx.fill();
    ctx.strokeStyle = opt.stroke;
    ctx.lineWidth = opt.lineWidth;
    ctx.stroke();
  }
  ctx.restore();
}

// Fallback walls when map/ is absent
const DEFAULT_WALLS = [];

/* @tweakable wall stroke color on overlays (minimap/world/terrain) */
const WALL_COLOR = '#bfc0c2';
/* @tweakable wall stroke opacity on overlays (0..1) */
const WALL_ALPHA = 0.9;
/* @tweakable multiplier applied to wall "width" from map data to compute stroke thickness */
const WALL_STROKE_SCALE = 2.0;

/**
 * Draw circular walls based on DEFAULT_WALLS.
 * Each wall entry uses percentage-based center (cx,cy) and radius r (0..100 of map),
 * which we convert into world units like roads/districts.
 */
export async function drawWalls(ctx, scale, cx, cy, options = {}) {
  const color = options.color || WALL_COLOR;
  const alpha = typeof options.alpha === 'number' ? options.alpha : WALL_ALPHA;
  const strokeScale = typeof options.strokeScale === 'number' ? options.strokeScale : WALL_STROKE_SCALE;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = alpha;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const w of DEFAULT_WALLS) {
    const wx = (w.cx / 100) * WORLD_SIZE - WORLD_SIZE / 2;
    const wz = (w.cy / 100) * WORLD_SIZE - WORLD_SIZE / 2;
    const rr = (w.r / 100) * WORLD_SIZE;
    const px = cx + wx * scale;
    const py = cy + wz * scale;
    const pr = rr * scale;

    ctx.beginPath();
    ctx.lineWidth = (w.width || 8) * strokeScale;
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

/* River rendering re-used from previous implementation */
/* @tweakable river start grid label */
const RIVER_START_LABEL = 'WB88';
/* @tweakable river end grid label */
const RIVER_END_LABEL = 'VP99';
/* @tweakable river width in grid cells */
const RIVER_WIDTH_CELLS = 3;
/* @tweakable river color */
const RIVER_COLOR = '#3aa0ff';
/* @tweakable river opacity (0..1) */
const RIVER_ALPHA = 0.78;
/* @tweakable river meander amount (world units) */
const RIVER_MEANDER = 120;

/**
 * Draw a single river ribbon between two grid labels.
 * ctx: 2D context; scale: pixels per world unit; (cx,cy): canvas coords of world (0,0)
 */
export function drawRiver(ctx, scale, cx, cy, opts = {}) {
  const startLabel = opts.startLabel || RIVER_START_LABEL;
  const endLabel = opts.endLabel || RIVER_END_LABEL;
  const widthCells = opts.widthCells || RIVER_WIDTH_CELLS;
  const rgba = opts.color || RIVER_COLOR;
  const alpha = (typeof opts.alpha === 'number') ? opts.alpha : RIVER_ALPHA;
  const meander = (typeof opts.meander === 'number') ? opts.meander : RIVER_MEANDER;

  const { i: si, j: sj } = parseGridLabel(startLabel);
  const { i: ei, j: ej } = parseGridLabel(endLabel);
  const p0 = posForCell(si, sj, WORLD_SIZE);
  const p1 = posForCell(ei, ej, WORLD_SIZE);

  const mid = { x: (p0.x + p1.x) / 2, z: (p0.z + p1.z) / 2 };
  const dx = p1.x - p0.x, dz = p1.z - p0.z;
  const len = Math.hypot(dx, dz) || 1;
  const nx = -dz / len, nz = dx / len;
  const c = { x: mid.x + nx * meander, z: mid.z + nz * meander };

  const w = Math.max(1, widthCells * 5) * scale; // 5 world units per grid cell
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = rgba;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.moveTo(cx + p0.x * scale, cy - p0.z * scale);
  ctx.quadraticCurveTo(cx + c.x * scale, cy - c.z * scale, cx + p1.x * scale, cy - p1.z * scale);
  ctx.stroke();
  ctx.restore();
}

export const KONOHA_ROADS = {
  get roads() { return __roadsCache?.roads || null; },
  get districts() { return __roadsCache?.districts || null; },
  get grass() { return __roadsCache?.grass || null; }
};
