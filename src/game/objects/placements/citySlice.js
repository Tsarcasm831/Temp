import * as THREE from 'three';
import { addCitySliceBuildings } from '../../../components/game/objects/citySlice.js';
// @tweakable world-size for map percent→world conversion (must match terrain.js)
import { WORLD_SIZE } from '/src/scene/terrain.js';
// @tweakable fallbacks when /map directory is unavailable
const DEFAULT_ROADS = [];
const DEFAULT_DISTRICTS = {};
const MODEL = null;

/* @tweakable origin position for the City Slice (world units) */
const CITY_SLICE_ORIGIN = new THREE.Vector3(300, 0, 300);
/* @tweakable global scale for City Slice buildings */
const CITY_SLICE_SCALE = 0.5;
/* @tweakable enable OBB colliders for City Slice buildings */
const CITY_SLICE_ENABLE_COLLIDERS = true;
/* @tweakable extra padding added to OBB half-extents (world units) */
const CITY_SLICE_COLLIDER_PADDING = 0.5;
/* @tweakable minimum OBB half-extent (world units) */
const CITY_SLICE_COLLIDER_MIN_HALF = 2;
/* @tweakable attach small debug markers to collider centers */
const CITY_SLICE_COLLIDER_DEBUG = false;

// Build the Konoha city slice and add it to the scene with collision proxies.
// Returns the slice group or null on failure.
export function placeCitySlice(scene, objectGrid, settings) {
  try {
    const town = new THREE.Group();
    town.name = 'CitySliceRoot';
    scene.add(town);

    // Use the buildings-module style API to add and place the slice, with colliders
    const group = addCitySliceBuildings(town, {
      THREE,
      settings,
      objectGrid,
      origin: [CITY_SLICE_ORIGIN.x, CITY_SLICE_ORIGIN.y, CITY_SLICE_ORIGIN.z],
      scale: CITY_SLICE_SCALE,
      collidersEnabled: CITY_SLICE_ENABLE_COLLIDERS,
      colliderPadding: CITY_SLICE_COLLIDER_PADDING,
      colliderMinHalf: CITY_SLICE_COLLIDER_MIN_HALF,
      colliderDebug: CITY_SLICE_COLLIDER_DEBUG
    });

    return group;
  } catch (e) {
    console.warn('Failed to place city slice:', e);
    return null;
  }
}

function pointInPolyXZ(p, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, zi = poly[i].z, xj = poly[j].x, zj = poly[j].z;
    const intersect = ((zi > p.z) !== (zj > p.z)) &&
      (p.x < (xj - xi) * (p.z - zi) / ((zj - zi) || 1e-9) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function getBuildingOBB(building) {
  building.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(building);
  const center = new THREE.Vector3(), size = new THREE.Vector3();
  box.getCenter(center); box.getSize(size);
  const quat = new THREE.Quaternion(); building.getWorldQuaternion(quat);
  const eulerY = new THREE.Euler().setFromQuaternion(quat, 'YXZ').y;
  return { center: { x: center.x, z: center.z }, hx: Math.max(1, size.x / 2), hz: Math.max(1, size.z / 2), rotY: eulerY };
}

function segSegIntersect2D(p1, p2, q1, q2) {
  const o=(a,b,c)=>Math.sign((b.z-a.z)*(c.x-b.x)-(b.x-a.x)*(c.z-b.z));
  const o1=o(p1,p2,q1), o2=o(p1,p2,q2), o3=o(q1,q2,p1), o4=o(q1,q2,p2);
  return (o1!==o2)&&(o3!==o4);
}
function distanceSegAABB_Local(p0, p1, hx, hz) {
  const inside=(p)=>Math.abs(p.x)<=hx&&Math.abs(p.z)<=hz;
  if (inside(p0)||inside(p1)) return 0;
  if (CITY_SLICE_ROAD_SEG_INTERSECT_SHORTCIRCUIT) {
    const v=[{x:-hx,z:-hz},{x:hx,z:-hz},{x:hx,z:hz},{x:-hx,z:hz}];
    for(let i=0;i<4;i++) if (segSegIntersect2D(p0,p1,v[i],v[(i+1)%4])) return 0;
  }
  const dPAABB=(p)=>Math.hypot(Math.max(0,Math.abs(p.x)-hx), Math.max(0,Math.abs(p.z)-hz));
  let best=Math.min(dPAABB(p0), dPAABB(p1));
  const verts=[{x:-hx,z:-hz},{x:hx,z:-hz},{x:hx,z:hz},{x:-hx,z:hz}];
  const vx=p1.x-p0.x,vz=p1.z-p0.z,len2=Math.max(1e-8,vx*vx+vz*vz);
  for(const v of verts){ const t=Math.max(0,Math.min(1,((v.x-p0.x)*vx+(v.z-p0.z)*vz)/len2)); const cx=p0.x+vx*t,cz=p0.z+vz*t; best=Math.min(best,Math.hypot(v.x-cx,v.z-cz)); }
  return best;
}
function distanceSegOBB2D(seg, obb) {
  const c=obb.center, a=-obb.rotY, cos=Math.cos(a), sin=Math.sin(a);
  const toLocal=({x,z})=>({ x:(x-c.x)*cos-(z-c.z)*sin, z:(x-c.x)*sin+(z-c.z)*cos });
  return distanceSegAABB_Local(toLocal(seg.a), toLocal(seg.b), obb.hx, obb.hz);
}

function obbOverlapsAnyRoad(obb) {
  // Inflate by size factor to keep a safety buffer around roads
  const hx = obb.hx * (1 + CITY_SLICE_ROAD_AVOID_SIZE_FACTOR);
  const hz = obb.hz * (1 + CITY_SLICE_ROAD_AVOID_SIZE_FACTOR);
  const inflated = { center: obb.center, hx, hz, rotY: obb.rotY };
  for (let i = 0; i < roadSegments.length; i++) {
    if (distanceSegOBB2D(roadSegments[i], inflated) <= roadSegments[i].half) return true;
  }
  return false;
}

function ensureNotOnRoad(building) {
  const localStep = CITY_SLICE_ROAD_AVOID_STEP / CITY_SLICE_SCALE;
  const orig = building.position.clone();
  const obb0 = getBuildingOBB(building);
  if (!obbOverlapsAnyRoad(obb0)) return true;
  const dirs = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]];
  for (let k = 1; k <= CITY_SLICE_ROAD_AVOID_MAX_ATTEMPTS; k++) {
    for (let d = 0; d < dirs.length; d++) {
      building.position.set(orig.x + dirs[d][0]*localStep*k, orig.y, orig.z + dirs[d][1]*localStep*k);
      if (!obbOverlapsAnyRoad(getBuildingOBB(building))) return true;
    }
  }
  building.position.copy(orig);
  return false;
}

function isInsideAnyDistrict(worldPos) {
  for (let i = 0; i < districtPolys.length; i++) {
    if (pointInPolyXZ(worldPos, districtPolys[i])) return true;
  }
  return false;
}
function nudgeTowardNearestDistrict(building) {
  if (!CITY_SLICE_DISTRICT_ENFORCE || districtCentroids.length === 0) return true;
  const obb = getBuildingOBB(building);
  if (isInsideAnyDistrict(obb.center)) return true;
  // find nearest centroid
  let best = districtCentroids[0], bestD2 = Infinity;
  for (const c of districtCentroids) {
    const dx = c.x - obb.center.x, dz = c.z - obb.center.z, d2 = dx*dx + dz*dz;
    if (d2 < bestD2) { bestD2 = d2; best = c; }
  }
  const step = CITY_SLICE_DISTRICT_NUDGE_STEP / CITY_SLICE_SCALE;
  const dir = new THREE.Vector3(best.x - obb.center.x, 0, best.z - obb.center.z).normalize();
  const orig = building.position.clone();
  for (let k = 1; k <= CITY_SLICE_DISTRICT_MAX_ATTEMPTS; k++) {
    building.position.addScaledVector(dir, step);
    if (isInsideAnyDistrict(getBuildingOBB(building).center)) return true;
  }
  building.position.copy(orig);
  return false;
}