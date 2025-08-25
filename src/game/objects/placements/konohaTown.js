import * as THREE from 'three';
// NOTE: this file is at /src/game/objects/placements/, so we must go up THREE levels to reach /src/components/...
import { addRedBuildings } from '../../../components/game/objects/buildings.red.js';
import { addBlueBuildings } from '../../../components/game/objects/buildings.blue.js';
import { addYellowBuildings } from '../../../components/game/objects/buildings.yellow.js';
import { addGreenBuildings } from '../../../components/game/objects/buildings.green.js';
import { addDarkBuildings } from '../../../components/game/objects/buildings.dark.js';
/* @tweakable world-size used to convert map percent coords to world units (keep in sync with terrain.js) */
import { WORLD_SIZE } from '/src/scene/terrain.js';
// Fallback district data when a live /map model isn't available
import { DEFAULT_MODEL as FALLBACK_MODEL } from '../../../../map/defaults/full-default-model.js';
/* @tweakable fallback road list when /map is unavailable (empty = no avoidance from map roads) */
const DEFAULT_ROADS = [];
// Building palette and helpers extracted into separate module
import { createKonohaBuildingKit } from './konohaBuildingKit.js';

// @tweakable global scale factor applied to all Konoha town buildings (1 = original size)
const KONOHA_TOWN_SCALE = 0.5;
/* @tweakable base road avoidance buffer in world units (distance from road centerline) */
const ROAD_AVOID_BUFFER = 8;
/* @tweakable additional padding proportional to building size (multiplied by half-diagonal in XZ) */
const ROAD_AVOID_SIZE_FACTOR = 0.25;
/* @tweakable max attempts to nudge a building off a road before giving up */
const ROAD_AVOID_MAX_ATTEMPTS = 24;
/* @tweakable nudge step size per attempt in world units */
const ROAD_AVOID_STEP = 5;
/* @tweakable road width mapping: world units per map width unit (e.g., width=3 -> 3*4=12 world units total) */
const ROAD_COLLISION_UNITS_PER_WIDTH = 4;
/* @tweakable extra world-units padding added to computed road half-width during collision checks */
const ROAD_COLLISION_EXTRA_PAD = 2;

/* @tweakable when true, ensure all buildings are constrained to live map districts (from /map) */
const DISTRICT_ENFORCEMENT_ENABLED = true;
/* @tweakable nudge step size (world units) when pulling a building toward the nearest district */
const DISTRICT_NUDGE_STEP_UNITS = 6;
/* @tweakable when true, require live /map districts to place any town buildings at all */
const DISTRICT_REQUIRE_MAP = true;
/* @tweakable maximum number of nudge iterations per building before giving up */
const DISTRICT_NUDGE_MAX_ATTEMPTS = 40;
/* @tweakable when true, remove buildings that cannot be placed inside any district after nudging */
const DISTRICT_DROP_IF_FAIL = true;

// Build a cluster of Konoha town buildings and add them to the scene.
// Returns the group representing the town or null on failure.
export function placeKonohaTown(scene, objectGrid, settings, origin = new THREE.Vector3(-320, 0, -220)) {
    try {
      // Obtain palette, materials and building factory from helper module
      const kit = createKonohaBuildingKit(settings);

      const townGroup = new THREE.Group();
      townGroup.name = 'KonohaTown';

      addRedBuildings(townGroup,   { THREE, kit });
      addBlueBuildings(townGroup,  { THREE, kit });
      addYellowBuildings(townGroup,{ THREE, kit });
      addGreenBuildings(townGroup, { THREE, kit });
      addDarkBuildings(townGroup,  { THREE, kit });

    // Apply global town scale (affects visuals and spacing)
    townGroup.scale.setScalar(KONOHA_TOWN_SCALE);

    townGroup.position.copy(origin);
    scene.add(townGroup);

    // Require districts; if unavailable, fall back to built-in defaults
    let liveMap = (window.__konohaMapModel?.MODEL ?? window.__konohaMapModel) || null;
    if (!liveMap || !liveMap.districts || Object.keys(liveMap.districts).length === 0) {
      liveMap = FALLBACK_MODEL;
    }
    const liveDistricts = liveMap?.districts;
    if (
      DISTRICT_ENFORCEMENT_ENABLED &&
      DISTRICT_REQUIRE_MAP &&
      (!liveDistricts || Object.keys(liveDistricts).length === 0)
    ) {
      scene.remove(townGroup);
      return null;
    }

    // helper: precompute road segments in world space
    const roadSegments = (() => {
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
    })();

    // NEW: load live districts (optional) and prepare world-space polygons + centroids
    const districtData = liveMap; // resolved above from window.__konohaMapModel
    let districtPolys = [], districtCentroids = [];
    const toWorld = (px, py) => ({ x: (px / 100) * WORLD_SIZE - WORLD_SIZE / 2, z: (py / 100) * WORLD_SIZE - WORLD_SIZE / 2 });
    const buildDistrictSets = (model) => {
      districtPolys = [];
      districtCentroids = [];
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
    };
    if (DISTRICT_ENFORCEMENT_ENABLED) buildDistrictSets(districtData);

    // point-in-polygon (XZ)
    const pointInPolyXZ = (p, poly) => {
      let inside = false;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const xi = poly[i].x, zi = poly[i].z, xj = poly[j].x, zj = poly[j].z;
        const intersect = ((zi > p.z) !== (zj > p.z)) && (p.x < (xj - xi) * (p.z - zi) / ((zj - zi) || 1e-9) + xi);
        if (intersect) inside = !inside;
      }
      return inside;
    };
    const isInsideAnyDistrict = (p) => {
      if (!DISTRICT_ENFORCEMENT_ENABLED) return true;
      if (districtPolys.length === 0) return !DISTRICT_REQUIRE_MAP;
      for (let k = 0; k < districtPolys.length; k++) if (pointInPolyXZ(p, districtPolys[k])) return true;
      return false;
    };
    const nudgeTowardNearestDistrict = (building) => {
      if (!DISTRICT_ENFORCEMENT_ENABLED) return true;
      if (districtPolys.length === 0) return !DISTRICT_REQUIRE_MAP;
      // compute current OBB center
      building.updateWorldMatrix(true, true);
      const box = new THREE.Box3().setFromObject(building);
      const center = new THREE.Vector3(); box.getCenter(center);
      if (isInsideAnyDistrict({ x: center.x, z: center.z })) return true;
      // find nearest centroid
      let best = null, bestD2 = Infinity;
      for (const c of districtCentroids) {
        const dx = c.x - center.x, dz = c.z - center.z, d2 = dx * dx + dz * dz;
        if (d2 < bestD2) { bestD2 = d2; best = c; }
      }
      if (!best) return !DISTRICT_DROP_IF_FAIL; // nothing to do
      const step = DISTRICT_NUDGE_STEP_UNITS / KONOHA_TOWN_SCALE;
      const dir = new THREE.Vector3(best.x - center.x, 0, best.z - center.z).normalize();
      const orig = building.position.clone();
      for (let t = 0; t < DISTRICT_NUDGE_MAX_ATTEMPTS; t++) {
        building.position.addScaledVector(dir, step);
        building.updateWorldMatrix(true, false);
        const b = new THREE.Box3().setFromObject(building); const c2 = new THREE.Vector3(); b.getCenter(c2);
        if (isInsideAnyDistrict({ x: c2.x, z: c2.z })) return true;
      }
      building.position.copy(orig);
      return !DISTRICT_DROP_IF_FAIL;
    };

    // NEW: require full containment: all OBB corners (or circle samples) must lie inside a single district
    function buildingFullyInsideAnyDistrict(building) {
      if (!DISTRICT_ENFORCEMENT_ENABLED) return true;
      if (districtPolys.length === 0) return !DISTRICT_REQUIRE_MAP;
      const obb = getBuildingOBB(building);
      if (building.userData?.round && building.userData?.roundRadius) {
        const scl = building.scale;
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

    // Build an OBB approximating a building's footprint in world space
    function getBuildingOBB(building) {
      building.updateWorldMatrix(true, true);
      const box = new THREE.Box3().setFromObject(building);
      const center = new THREE.Vector3(), size = new THREE.Vector3();
      box.getCenter(center); box.getSize(size);
      const quat = new THREE.Quaternion();
      building.getWorldQuaternion(quat);
      const eulerY = new THREE.Euler().setFromQuaternion(quat, 'YXZ').y;
      return {
        center: { x: center.x, z: center.z },
        hx: Math.max(2, size.x / 2),
        hz: Math.max(2, size.z / 2),
        rotY: eulerY
      };
    }

    // 2D helpers for segment vs OBB distance (projected on XZ)
    /* @tweakable enable segment-rectangle intersection short-circuit (0 distance if intersecting) */
    const ROAD_SEG_INTERSECT_SHORTCIRCUIT = true;

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
      // Early exit if any endpoint inside
      if (pointInAABB(p0, hx, hz) || pointInAABB(p1, hx, hz)) return 0;
      // Check intersection with each rectangle edge
      if (ROAD_SEG_INTERSECT_SHORTCIRCUIT) {
        const verts = [{x:-hx,z:-hz},{x:hx,z:-hz},{x:hx,z:hz},{x:-hx,z:hz}];
        for (let i=0;i<4;i++){
          const a = verts[i], b = verts[(i+1)%4];
          if (segSegIntersect2D(p0,p1,a,b)) return 0;
        }
      }
      // Otherwise min distance: endpoints -> box, and box vertices -> segment
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
      // Transform into OBB local space
      const c = obb.center, ang = -obb.rotY;
      const cos = Math.cos(ang), sin = Math.sin(ang);
      const toLocal = ({x,z}) => ({ x: (x - c.x)*cos - (z - c.z)*sin, z: (x - c.x)*sin + (z - c.z)*cos });
      const p0 = toLocal(seg.a), p1 = toLocal(seg.b);
      return distanceSegAABB_Local(p0, p1, obb.hx, obb.hz);
    }

    // test if a building OBB overlaps any road segment given its half-width
    function obbOverlapsAnyRoad(obb) {
      for (let i = 0; i < roadSegments.length; i++) {
        const seg = roadSegments[i];
        const d = distanceSegOBB2D(seg, obb);
        if (d <= seg.half) return true;
      }
      return false;
    }

    // nudge a building locally (townGroup space) until not on road using OBB collision
    function ensureNotOnRoad(building) {
      const localStep = ROAD_AVOID_STEP / KONOHA_TOWN_SCALE;
      const obb0 = getBuildingOBB(building);
      // early out
      if (!obbOverlapsAnyRoad(obb0)) return;

      const dirs = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]];
      const orig = building.position.clone();
      for (let k = 1; k <= ROAD_AVOID_MAX_ATTEMPTS; k++) {
        for (let d = 0; d < dirs.length; d++) {
          building.position.set(orig.x + dirs[d][0]*localStep*k, orig.y, orig.z + dirs[d][1]*localStep*k);
          const obb = getBuildingOBB(building);
          if (!obbOverlapsAnyRoad(obb)) return;
        }
      }
      building.position.copy(orig); // give up: restore original
    }

    const addObbProxy = (building) => {
      // Ensure world matrices reflect current parent scale/transform
      building.updateWorldMatrix(true, false);

      // Compute world-space bounding box (includes scaling and rotation)
      const box = new THREE.Box3().setFromObject(building);
      const center = new THREE.Vector3();
      const size = new THREE.Vector3();
      box.getCenter(center);
      box.getSize(size);

      // World rotation (Y) for OBB orientation
      const quat = new THREE.Quaternion();
      building.getWorldQuaternion(quat);
      const euler = new THREE.Euler().setFromQuaternion(quat, 'YXZ');

      if (building.userData?.round && building.userData?.roundRadius) {
        const scl = new THREE.Vector3();
        building.matrixWorld.decompose(new THREE.Vector3(), new THREE.Quaternion(), scl);
        const avgXZ = (Math.abs(scl.x) + Math.abs(scl.z)) * 0.5;
        const proxy = new THREE.Object3D();
        proxy.position.set(center.x, 0, center.z);
        proxy.userData.collider = {
          type: 'sphere',
          radius: building.userData.roundRadius * avgXZ
        };
        proxy.userData.label = building.name || 'House';
        objectGrid.add(proxy);
        scene.add(proxy);
        return;
      } else {
        // Replace broad convex hull with per-mesh OBBs to match shapes exactly (skip roofs/details)
        const SKIP = new Set(['roof','details']);
        building.traverse((m) => {
          if (!m.isMesh || !m.geometry) return;
          let p = m.parent, drop = false; while (p) { if (SKIP.has(p.name)) { drop = true; break; } p = p.parent; }
          if (drop) return;
          const g = m.geometry; if (!g.boundingBox) g.computeBoundingBox();
          const bb = g.boundingBox;
          const localCenter = new THREE.Vector3(
            (bb.min.x + bb.max.x) / 2, (bb.min.y + bb.max.y) / 2, (bb.min.z + bb.max.z) / 2
          );
          const worldCenter = localCenter.clone().applyMatrix4(m.matrixWorld);
          const scl = new THREE.Vector3(); m.matrixWorld.decompose(new THREE.Vector3(), new THREE.Quaternion(), scl);
          const hx = Math.max(0.5, (bb.max.x - bb.min.x) * Math.abs(scl.x) / 2);
          const hz = Math.max(0.5, (bb.max.z - bb.min.z) * Math.abs(scl.z) / 2);
          if (hx < 1 || hz < 1) return; // ignore tiny bits
          const quat = new THREE.Quaternion(); m.getWorldQuaternion(quat);
          const rotY = new THREE.Euler().setFromQuaternion(quat, 'YXZ').y;
          const proxy = new THREE.Object3D();
          proxy.position.set(worldCenter.x, 0, worldCenter.z);
          proxy.userData.collider = { type: 'obb', center: { x: worldCenter.x, z: worldCenter.z }, halfExtents: { x: hx, z: hz }, rotationY: rotY };
          proxy.userData.label = building.name || 'House';
          objectGrid.add(proxy);
          scene.add(proxy);
        });
        return;
      }
    };

    townGroup.children.forEach(colorGroup => {
      colorGroup.children?.forEach(building => {
        ensureNotOnRoad(building);
        // NEW: enforce full district containment (nudge then drop if still failing)
        if (DISTRICT_ENFORCEMENT_ENABLED && districtPolys.length > 0) {
          if (!buildingFullyInsideAnyDistrict(building)) {
            if (!nudgeTowardNearestDistrict(building) || !buildingFullyInsideAnyDistrict(building)) {
              if (DISTRICT_DROP_IF_FAIL) { building.removeFromParent?.(); return; }
            }
          }
        }
        addObbProxy(building);
      });
    });

    return townGroup;
  } catch (e) {
    console.warn('Failed to integrate Konoha Buildings:', e);
    return null;
  }
}