import * as THREE from "three";
import { WORLD_SIZE } from "/src/scene/terrain.js";
import { DEFAULT_MODEL as MAP_DEFAULT_MODEL } from "/map/defaults/full-default-model.js";

// Build district polygons and centroids from live map model or defaults.
export function deriveDistrictData({ localConstraints = false, requireDistricts = true } = {}) {
  if (!localConstraints) {
    return { districtPolys: [], districtCentroids: [], requireDistricts, localConstraints };
  }
  const liveModelAll = (typeof window !== 'undefined' ? (window.__konohaMapModel?.MODEL ?? window.__konohaMapModel) : null);
  const useModel = (liveModelAll && Object.keys(liveModelAll?.districts || {}).length > 0) ? liveModelAll : MAP_DEFAULT_MODEL;
  const districtsArr = useModel?.districts ? Object.values(useModel.districts) : [];
  const districtPolys = districtsArr
    .filter(d => Array.isArray(d.points) && d.points.length >= 3)
    .map(d => d.points.map(([px, py]) => ({ x: (px / 100) * WORLD_SIZE - WORLD_SIZE / 2, z: (py / 100) * WORLD_SIZE - WORLD_SIZE / 2 })));
  const districtCentroids = districtsArr
    .filter(d => Array.isArray(d.points) && d.points.length >= 3)
    .map(d => {
      const pts = d.points.map(([px, py]) => ({ x: (px / 100) * WORLD_SIZE - WORLD_SIZE / 2, z: (py / 100) * WORLD_SIZE - WORLD_SIZE / 2 }));
      const c = pts.reduce((acc, p) => ({ x: acc.x + p.x, z: acc.z + p.z }), { x: 0, z: 0 });
      return { x: c.x / pts.length, z: c.z / pts.length };
    });
  return { districtPolys, districtCentroids, requireDistricts, localConstraints };
}

export function pointInPoly(p, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    const intersects = ((a.z > p.z) !== (b.z > p.z)) &&
      (p.x < (((b.x - a.x) * (p.z - a.z)) / ((b.z - a.z) || 1e-9) + a.x));
    if (intersects) inside = !inside;
  }
  return inside;
}

export function obbCorners(obb) {
  const { center: c, hx, hz, rotY: a } = obb; const cos = Math.cos(a), sin = Math.sin(a);
  const pts = [[-hx, -hz], [hx, -hz], [hx, hz], [-hx, hz]];
  return pts.map(([x, z]) => ({ x: c.x + x * cos - z * sin, z: c.z + x * sin + z * cos }));
}

export function fullyInsideAnyDistrict(obb, { districtPolys, localConstraints, requireDistricts }) {
  if (!localConstraints) return true;
  if (!districtPolys || districtPolys.length === 0) return !requireDistricts ? true : false;
  const pts = obbCorners(obb);
  return districtPolys.some(poly => pts.every(p => pointInPoly(p, poly)));
}

export function insideAnyDistrictPoint(p, { districtPolys, localConstraints, requireDistricts }) {
  if (!localConstraints) return true;
  if (!districtPolys || districtPolys.length === 0) return !requireDistricts ? true : false;
  return districtPolys.some(poly => pointInPoly(p, poly));
}

export function obbOverlaps(a, b) {
  const A = obbCorners(a), B = obbCorners(b);
  const axes = [];
  const edge = (C, i) => ({ x: C[(i + 1) % 4].x - C[i].x, z: C[(i + 1) % 4].z - C[i].z });
  const norm = (v) => { const m = Math.hypot(v.x, v.z) || 1; return { x: -v.z / m, z: v.x / m } };
  axes.push(norm(edge(A, 0)), norm(edge(A, 1)), norm(edge(B, 0)), norm(edge(B, 1)));
  const proj = (pts, ax) => {
    let lo = Infinity, hi = -Infinity; for (const p of pts) { const d = p.x * ax.x + p.z * ax.z; if (d < lo) lo = d; if (d > hi) hi = d; } return { lo, hi };
  };
  for (const ax of axes) { const pA = proj(A, ax), pB = proj(B, ax); if (pA.hi < pB.lo || pB.hi < pA.lo) return false; }
  return true;
}

export function getBuildingOBB(building, { colliderPadding = 0.5, colliderMinHalf = 2 } = {}) {
  const box = new THREE.Box3().setFromObject(building);
  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  box.getCenter(center);
  box.getSize(size);
  const quat = new THREE.Quaternion();
  building.getWorldQuaternion(quat);
  const euler = new THREE.Euler().setFromQuaternion(quat, 'YXZ');
  const hxRaw = Math.max(0.0001, size.x / 2);
  const hzRaw = Math.max(0.0001, size.z / 2);
  const hx = Math.max(colliderMinHalf, hxRaw + colliderPadding);
  const hz = Math.max(colliderMinHalf, hzRaw + colliderPadding);
  return { center: { x: center.x, z: center.z }, hx, hz, rotY: euler.y };
}

export function nudgeIntoDistrict(building, { districtCentroids }, { fullyInsideAnyDistrictFn = fullyInsideAnyDistrict, step = 6, max = 40 } = {}) {
  if ((districtCentroids?.length || 0) === 0) return false;
  const obb0 = (() => { building.updateWorldMatrix(true, false); return getBuildingOBB(building); })();
  if (fullyInsideAnyDistrictFn(obb0)) return true;
  const c0 = obb0.center;
  let best = districtCentroids[0], bestD2 = Infinity;
  for (const c of districtCentroids) { const dx = c.x - c0.x, dz = c.z - c0.z, d2 = dx * dx + dz * dz; if (d2 < bestD2) { bestD2 = d2; best = c; } }
  const dir = new THREE.Vector3(best.x - c0.x, 0, best.z - c0.z).normalize();
  const orig = building.position.clone();
  for (let k = 0; k < max; k++) {
    building.position.addScaledVector(dir, step);
    const obb = (() => { building.updateWorldMatrix(true, false); return getBuildingOBB(building); })();
    if (fullyInsideAnyDistrictFn(obb)) return true;
  }
  building.position.copy(orig);
  return false;
}

export function resolveBuildingCollisions(building, placedObbs, { districtData, fullyInsideAnyDistrictFn = fullyInsideAnyDistrict }, { step = 5, max = 48 } = {}) {
  const orig = building.position.clone();
  const tryCheck = () => {
    const obb = (() => { building.updateWorldMatrix(true, false); return getBuildingOBB(building); })();
    for (const o of placedObbs) if (obbOverlaps(obb, o)) return { ok: false, obb: null };
    return { ok: true, obb };
  };
  let res = tryCheck(); if (res.ok) return res.obb;
  for (let iter = 1; iter <= max; iter++) {
    let dir = new THREE.Vector3(0, 0, 0);
    const cur = (() => { building.updateWorldMatrix(true, false); return getBuildingOBB(building); })();
    for (const o of placedObbs) { if (obbOverlaps(cur, o)) { const vx = cur.center.x - o.center.x; const vz = cur.center.z - o.center.z; const m = Math.hypot(vx, vz) || 1; dir.x += vx / m; dir.z += vz / m; } }
    if (dir.lengthSq() < 1e-6) { const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]; const d = dirs[(iter - 1) % dirs.length]; dir.set(d[0], 0, d[1]); }
    dir.normalize();
    building.position.addScaledVector(dir, step);
    const obb = (() => { building.updateWorldMatrix(true, false); return getBuildingOBB(building); })();
    if (!fullyInsideAnyDistrictFn(obb, districtData)) { building.position.copy(orig); return null; }
    res = tryCheck(); if (res.ok) return res.obb;
  }
  building.position.copy(orig);
  return null;
}

