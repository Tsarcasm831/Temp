import * as THREE from 'three';
import { WORLD_SIZE } from '/src/scene/terrain.js';
import {
  DEFAULT_ROADS,
  KONOHA_TOWN_SCALE,
  ROAD_AVOID_STEP,
  ROAD_AVOID_MAX_ATTEMPTS,
  ROAD_COLLISION_UNITS_PER_WIDTH,
  ROAD_COLLISION_EXTRA_PAD,
  ROAD_SEG_INTERSECT_SHORTCIRCUIT
} from './konohaTownConfig.js';

export function buildRoadSegments() {
  const segs = [];
  const toWorld = (xPct, yPct) => ({
    x: (xPct / 100) * WORLD_SIZE - WORLD_SIZE / 2,
    z: (yPct / 100) * WORLD_SIZE - WORLD_SIZE / 2
  });
  for (const r of DEFAULT_ROADS) {
    const pts = r.points || [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = toWorld(pts[i][0], pts[i][1]);
      const b = toWorld(pts[i + 1][0], pts[i + 1][1]);
      const widthUnits = (r.width || 3) * ROAD_COLLISION_UNITS_PER_WIDTH;
      segs.push({ a, b, half: Math.max(1, widthUnits * 0.5 + ROAD_COLLISION_EXTRA_PAD) });
    }
  }
  return segs;
}

export function getBuildingOBB(building) {
  building.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(building);
  const center = new THREE.Vector3();
  box.getCenter(center);
  const quat = new THREE.Quaternion();
  building.getWorldQuaternion(quat);
  const eulerY = new THREE.Euler().setFromQuaternion(quat, 'YXZ').y;
  const scl = new THREE.Vector3();
  building.getWorldScale(scl);

  let hx, hz;
  if (building.userData?.footprint) {
    hx = (building.userData.footprint.w * Math.abs(scl.x)) / 2;
    hz = (building.userData.footprint.d * Math.abs(scl.z)) / 2;
  } else {
    const size = new THREE.Vector3();
    box.getSize(size);
    hx = size.x / 2;
    hz = size.z / 2;
  }
  return {
    center: { x: center.x, z: center.z },
    hx: Math.max(2, hx),
    hz: Math.max(2, hz),
    rotY: eulerY
  };
}

function pointInAABB(p, hx, hz) { return Math.abs(p.x) <= hx && Math.abs(p.z) <= hz; }

function segSegIntersect2D(p1, p2, q1, q2) {
  const o = (a,b,c)=>Math.sign((b.z-a.z)*(c.x-b.x)-(b.x-a.x)*(c.z-b.z));
  const o1=o(p1,p2,q1), o2=o(p1,p2,q2), o3=o(q1,q2,p1), o4=o(q1,q2,p2);
  return (o1!==o2) && (o3!==o4);
}

function distancePointAABB(p, hx, hz) {
  const dx = Math.max(0, Math.abs(p.x) - hx);
  const dz = Math.max(0, Math.abs(p.z) - hz);
  return Math.hypot(dx, dz);
}

function distanceSegAABB_Local(p0, p1, hx, hz) {
  if (pointInAABB(p0, hx, hz) || pointInAABB(p1, hx, hz)) return 0;
  if (ROAD_SEG_INTERSECT_SHORTCIRCUIT) {
    const verts = [{x:-hx,z:-hz},{x:hx,z:-hz},{x:hx,z:hz},{x:-hx,z:hz}];
    for (let i=0;i<4;i++){
      const a = verts[i], b = verts[(i+1)%4];
      if (segSegIntersect2D(p0,p1,a,b)) return 0;
    }
  }
  let best = Math.min(distancePointAABB(p0,hx,hz), distancePointAABB(p1,hx,hz));
  const verts = [{x:-hx,z:-hz},{x:hx,z:-hz},{x:hx,z:hz},{x:-hx,z:hz}];
  const segV = { x: p1.x - p0.x, z: p1.z - p0.z };
  const segLen2 = Math.max(1e-8, segV.x*segV.x + segV.z*segV.z);
  for (let v of verts) {
    const t = Math.max(0, Math.min(1, ((v.x - p0.x)*segV.x + (v.z - p0.z)*segV.z)/segLen2));
    const cx = p0.x + segV.x*t, cz = p0.z + segV.z*t;
    const dx = v.x - cx, dz = v.z - cz;
    best = Math.min(best, Math.hypot(dx,dz));
  }
  return best;
}

function distanceSegOBB2D(seg, obb) {
  const c = obb.center, ang = -obb.rotY;
  const cos = Math.cos(ang), sin = Math.sin(ang);
  const toLocal = ({x,z}) => ({ x: (x - c.x)*cos - (z - c.z)*sin, z: (x - c.x)*sin + (z - c.z)*cos });
  const p0 = toLocal(seg.a), p1 = toLocal(seg.b);
  return distanceSegAABB_Local(p0, p1, obb.hx, obb.hz);
}

function obbOverlapsAnyRoad(obb, roadSegments) {
  for (let i = 0; i < roadSegments.length; i++) {
    const seg = roadSegments[i];
    const d = distanceSegOBB2D(seg, obb);
    if (d <= seg.half) return true;
  }
  return false;
}

export function ensureNotOnRoad(building, roadSegments) {
  const localStep = ROAD_AVOID_STEP / KONOHA_TOWN_SCALE;
  const obb0 = getBuildingOBB(building);
  if (!obbOverlapsAnyRoad(obb0, roadSegments)) return;

  const dirs = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]];
  const orig = building.position.clone();
  for (let k = 1; k <= ROAD_AVOID_MAX_ATTEMPTS; k++) {
    for (let d = 0; d < dirs.length; d++) {
      building.position.set(
        orig.x + dirs[d][0]*localStep*k,
        orig.y,
        orig.z + dirs[d][1]*localStep*k
      );
      const obb = getBuildingOBB(building);
      if (!obbOverlapsAnyRoad(obb, roadSegments)) return;
    }
  }
  building.position.copy(orig);
}
