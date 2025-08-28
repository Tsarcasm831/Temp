import * as THREE from 'three';
import { WORLD_SIZE } from '/src/scene/terrain.js';
import {
  DISTRICT_ENFORCEMENT_ENABLED,
  DISTRICT_REQUIRE_MAP,
  DISTRICT_NUDGE_STEP_UNITS,
  DISTRICT_NUDGE_MAX_ATTEMPTS,
  DISTRICT_DROP_IF_FAIL,
  KONOHA_TOWN_SCALE
} from './konohaTownConfig.js';
import { getBuildingOBB } from './konohaTownRoads.js';
import { getFootprintPolygon } from './konohaTownColliders.js';

export function buildDistrictSets(model) {
  const districtPolys = [];
  const districtCentroids = [];
  const toWorld = (px, py) => ({ x: (px / 100) * WORLD_SIZE - WORLD_SIZE / 2, z: (py / 100) * WORLD_SIZE - WORLD_SIZE / 2 });
  try {
    const districts = model?.districts || {};
    for (const d of Object.values(districts)) {
      if (!Array.isArray(d.points) || d.points.length < 3) continue;
      const poly = d.points.map(([x, y]) => toWorld(x, y));
      districtPolys.push(poly);
      const c = poly.reduce((a, p) => ({ x: a.x + p.x, z: a.z + p.z }), { x: 0, z: 0 });
      districtCentroids.push({ x: c.x / poly.length, z: c.z / poly.length });
    }
  } catch {}
  return { districtPolys, districtCentroids };
}

function pointInPolyXZ(p, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, zi = poly[i].z, xj = poly[j].x, zj = poly[j].z;
    const intersect = ((zi > p.z) !== (zj > p.z)) && (p.x < (xj - xi) * (p.z - zi) / ((zj - zi) || 1e-9) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function isInsideAnyDistrict(p, districtPolys) {
  if (!DISTRICT_ENFORCEMENT_ENABLED) return true;
  if (districtPolys.length === 0) return !DISTRICT_REQUIRE_MAP;
  for (let k = 0; k < districtPolys.length; k++) if (pointInPolyXZ(p, districtPolys[k])) return true;
  return false;
}

export function nudgeTowardNearestDistrict(building, districtPolys, districtCentroids) {
  if (!DISTRICT_ENFORCEMENT_ENABLED) return true;
  if (districtPolys.length === 0) return !DISTRICT_REQUIRE_MAP;
  building.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(building);
  const center = new THREE.Vector3(); box.getCenter(center);
  if (isInsideAnyDistrict({ x: center.x, z: center.z }, districtPolys)) return true;
  let best = null, bestD2 = Infinity;
  for (const c of districtCentroids) {
    const dx = c.x - center.x, dz = c.z - center.z, d2 = dx * dx + dz * dz;
    if (d2 < bestD2) { bestD2 = d2; best = c; }
  }
  if (!best) return !DISTRICT_DROP_IF_FAIL;
  const step = DISTRICT_NUDGE_STEP_UNITS / KONOHA_TOWN_SCALE;
  const dir = new THREE.Vector3(best.x - center.x, 0, best.z - center.z).normalize();
  const orig = building.position.clone();
  for (let t = 0; t < DISTRICT_NUDGE_MAX_ATTEMPTS; t++) {
    building.position.addScaledVector(dir, step);
    building.updateWorldMatrix(true, false);
    const b = new THREE.Box3().setFromObject(building); const c2 = new THREE.Vector3(); b.getCenter(c2);
    if (isInsideAnyDistrict({ x: c2.x, z: c2.z }, districtPolys)) return true;
  }
  building.position.copy(orig);
  return !DISTRICT_DROP_IF_FAIL;
}

export function buildingFullyInsideAnyDistrict(building, districtPolys) {
  if (!DISTRICT_ENFORCEMENT_ENABLED) return true; if (districtPolys.length===0) return !DISTRICT_REQUIRE_MAP;
  const hull = getFootprintPolygon(building);
  const pip=(p,poly)=>{ let s=false; for(let i=0,j=poly.length-1;i<poly.length;j=i++){ const a=poly[i],b=poly[j]; const t=((a.z>p.z)!==(b.z>p.z))&&(p.x<((b.x-a.x)*(p.z-a.z))/((b.z-a.z)||1e-9)+a.x); if(t)s=!s;} return s; };
  const segI=(p1,p2,q1,q2)=>{ const o=(a,b,c)=>((b.z-a.z)*(c.x-b.x)-(b.x-a.x)*(c.z-b.z)); const s1=o(p1,p2,q1),s2=o(p1,p2,q2),s3=o(q1,q2,p1),s4=o(q1,q2,p2); return ((s1>0)!==(s2>0)) && ((s3>0)!==(s4>0)); };
  return districtPolys.some(poly=>{
    if(!hull.every(p=>pip(p,poly))) return false;
    for(let i=0;i<hull.length;i++){ const a=hull[i],b=hull[(i+1)%hull.length];
      for(let j=0;j<poly.length;j++){ const c=poly[j],d=poly[(j+1)%poly.length]; if(segI(a,b,c,d)) return false; }
    }
    return true;
  });
}