import * as THREE from 'three';
import { placeGrassPatch } from './index.js';
import { DEFAULT_MODEL as MAP_DEFAULT_MODEL } from '/map/defaults/full-default-model.js';

function pctToWorld(px, py, worldSize) {
  return {
    x: (px / 100) * worldSize - worldSize / 2,
    z: (py / 100) * worldSize - worldSize / 2,
  };
}

function pointInPoly(p, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, zi = poly[i].z;
    const xj = poly[j].x, zj = poly[j].z;
    const intersect = ((zi > p.z) !== (zj > p.z)) && (p.x < (xj - xi) * (p.z - zi) / ((zj - zi) || 1e-9) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function distPointSeg(px, pz, ax, az, bx, bz) {
  const vx = bx - ax, vz = bz - az;
  const wx = px - ax, wz = pz - az;
  const c1 = vx * wx + vz * wz;
  const c2 = vx * vx + vz * vz || 1e-9;
  const t = Math.max(0, Math.min(1, c1 / c2));
  const cx = ax + vx * t, cz = az + vz * t;
  const dx = px - cx, dz = pz - cz;
  return Math.hypot(dx, dz);
}

function getRoadsDistrictsSync(){
  // Prefer live model exposed by the map editor when running side-by-side
  try{
    if (typeof window !== 'undefined'){
      const live = (window.__konohaMapModel?.MODEL ?? window.__konohaMapModel);
      if (live && (live.roads || live.districts)){
        return {
          roads: Array.isArray(live.roads) ? live.roads : [],
          districts: live.districts || {}
        };
      }
    }
  }catch(_){/* ignore */}
  // Fallback to defaults bundled with the app
  try{
    const dflt = MAP_DEFAULT_MODEL || {};
    return { roads: Array.isArray(dflt.roads) ? dflt.roads : [], districts: dflt.districts || {} };
  }catch(_){ return { roads: [], districts: {} }; }
}

export function placeAutoGrass(scene, objectGrid, worldSize, settings, opts = {}) {
  const { roads: rs, districts: ds } = getRoadsDistrictsSync();
  const allRoads = Array.isArray(rs) ? rs : [];
  const allDistricts = ds || {};

  // Convert districts to world coordinates for point-in-polygon checks
  const districtPolys = Object.values(allDistricts).map(d =>
    (d?.points || []).map(([px, py]) => pctToWorld(px, py, worldSize))
  ).filter(poly => poly.length >= 3);

  // Convert road polylines to world for distance checks
  const roadSegs = [];
  for (const r of allRoads) {
    const pts = (r?.points || []).map(([px, py]) => pctToWorld(px, py, worldSize));
    for (let i = 0; i < pts.length - 1; i++) {
      roadSegs.push([pts[i], pts[i + 1]]);
    }
  }

  // Sampling parameters (multi-scale density)
  const spacing = Math.max(40, Math.min(160, opts.spacing || 70));
  const jitter = Math.min(spacing * 0.45, 32);
  const roadBuffer = Math.max(8, Math.min(36, opts.roadBuffer || 16));
  const maxPatches = Math.max(60, Math.min(800, opts.maxPatches || 480));

  const half = worldSize / 2;
  const patches = [];
  const seen = new Set();
  const sampleGrid = (ox, oz) => {
    for (let x = -half + spacing * 0.5 + ox; x < half; x += spacing) {
      for (let z = -half + spacing * 0.5 + oz; z < half; z += spacing) {
        const px = x + (Math.random() * 2 - 1) * jitter;
        const pz = z + (Math.random() * 2 - 1) * jitter;
        const p = { x: px, z: pz };
        // Skip if inside any district polygon
        let inside = false;
        for (let k = 0; k < districtPolys.length; k++) {
          if (pointInPoly(p, districtPolys[k])) { inside = true; break; }
        }
        if (inside) continue;
        // Skip if near any road segment
        let nearRoad = false;
        for (let k = 0; k < roadSegs.length; k++) {
          const [a, b] = roadSegs[k];
          if (distPointSeg(px, pz, a.x, a.z, b.x, b.z) <= roadBuffer) { nearRoad = true; break; }
        }
        if (nearRoad) continue;
        const key = `${Math.round(px/spacing)},${Math.round(pz/spacing)}`;
        if (seen.has(key)) continue;
        seen.add(key);
        patches.push({ x: px, z: pz });
      }
    }
  };
  // Two-phase sampling to fill gaps (offset pass)
  sampleGrid(0, 0);
  sampleGrid(spacing/2, spacing/2);

  // If too many candidates, downsample randomly to cap performance
  if (patches.length > maxPatches) {
    for (let i = patches.length - 1; i >= 0; i--) {
      if (Math.random() < 1 - maxPatches / patches.length) patches.splice(i, 1);
    }
  }

  const group = new THREE.Group();
  group.name = 'GrassAuto';
  scene.add(group);

  // Place variable patches
  for (let i = 0; i < patches.length; i++) {
    const p = patches[i];
    // Choose one of several archetypes for variety
    const roll = Math.random();
    let count, radius, spread, blades, hmin, hmax, width, offsets = null, baseColor = null;
    if (roll < 0.25) {
      // Dense tuft cluster
      count = 8 + Math.floor(Math.random() * 8); // 8..15
      radius = 2.2 + Math.random() * 0.8;
      spread = 6 + Math.random() * 6;           // tight
      blades = 140 + Math.floor(Math.random() * 100);
      hmin = 1.2 + Math.random() * 0.4; hmax = hmin + 1.6 + Math.random() * 1.0;
      width = 0.09 + Math.random() * 0.05;
    } else if (roll < 0.5) {
      // Oval sweep (wind-swept look)
      const a = 14 + Math.random() * 10; // major axis
      const b = 6 + Math.random() * 6;   // minor axis
      const theta = Math.random() * Math.PI; // orientation
      count = 10 + Math.floor(Math.random() * 8);
      radius = 2.0 + Math.random() * 1.1;
      spread = Math.max(a, b);
      offsets = [];
      for (let k=0;k<count;k++){
        const t = Math.random() * Math.PI * 2;
        const r = Math.sqrt(Math.random());
        let ox = Math.cos(t) * a * r * 0.5;
        let oz = Math.sin(t) * b * r * 0.5;
        const cos = Math.cos(theta), sin = Math.sin(theta);
        const rx = ox * cos - oz * sin, rz = ox * sin + oz * cos;
        offsets.push({ x: rx, z: rz });
      }
      blades = 120 + Math.floor(Math.random() * 80);
      hmin = 1.0 + Math.random() * 0.5; hmax = hmin + 1.4 + Math.random() * 1.0;
      width = 0.08 + Math.random() * 0.05;
    } else if (roll < 0.7) {
      // Ring meadow edge
      count = 12 + Math.floor(Math.random() * 8);
      const R = 10 + Math.random() * 6;
      radius = 2.0 + Math.random() * 1.0;
      spread = R + 2;
      offsets = [];
      for (let k=0;k<count;k++){
        const t = (k / count) * Math.PI * 2 + Math.random() * 0.3;
        const rr = R + (Math.random() * 2 - 1) * 2;
        offsets.push({ x: Math.cos(t) * rr, z: Math.sin(t) * rr });
      }
      blades = 100 + Math.floor(Math.random() * 80);
      hmin = 1.1 + Math.random() * 0.5; hmax = hmin + 1.8 + Math.random() * 0.8;
      width = 0.08 + Math.random() * 0.05;
    } else {
      // Broad scatter (natural field)
      count = 14 + Math.floor(Math.random() * 10);
      radius = 2.0 + Math.random() * 1.2;
      spread = 14 + Math.random() * 12;
      blades = 110 + Math.floor(Math.random() * 90);
      hmin = 1.0 + Math.random() * 0.5; hmax = hmin + 1.6 + Math.random() * 1.2;
      width = 0.08 + Math.random() * 0.05;
    }
    // Slight color tone shifts per patch for variation
    const tone = 0x1a7d36; const tone2 = 0x2aa35a;
    baseColor = (Math.random()<0.5) ? tone : tone2;

    const options = {
      blades,
      radius,
      spread,
      height: { min: hmin, max: hmax },
      width,
      colorJitter: 0.12,
      baseColor,
      offsets
    };

    const patch = placeGrassPatch(scene, objectGrid, worldSize, settings, { x: p.x, z: p.z }, count, options);
    if (patch) group.add(patch);
  }

  return group;
}
