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
  if (!DISTRICT_ENFORCEMENT_ENABLED) return true;
  if (districtPolys.length === 0) return !DISTRICT_REQUIRE_MAP;
  const obb = getBuildingOBB(building);
  if (building.userData?.round && building.userData?.roundRadius) {
    const scl = new THREE.Vector3();
    building.getWorldScale(scl);
    const avg = (Math.abs(scl.x) + Math.abs(scl.z)) * 0.5;
    const R = building.userData.roundRadius * avg;
    const samples = 12;
    for (let k = 0; k < districtPolys.length; k++) {
      let ok = true;
      for (let i = 0; i < samples && ok; i++) {
        const a = (i / samples) * Math.PI * 2;
        const x = obb.center.x + Math.cos(a) * R;
        const z = obb.center.z + Math.sin(a) * R;
        ok = ok && pointInPolyXZ({ x, z }, districtPolys[k]);
      }
      if (ok) return true;
    }
    return false;
  }
  const c = obb.center, hx = obb.hx, hz = obb.hz, a = obb.rotY;
  const cos = Math.cos(a), sin = Math.sin(a);
  const local = [[-hx,-hz],[hx,-hz],[hx,hz],[-hx,hz]].map(([x,z])=>({
    x: c.x + x*cos - z*sin,
    z: c.z + x*sin + z*cos
  }));
  return districtPolys.some(poly => local.every(p => pointInPolyXZ(p, poly)));
}
