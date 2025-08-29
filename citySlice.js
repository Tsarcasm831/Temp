// citySlice.js
// Entry point for creating the 6x5 (30) building city slice as modules.
// This is designed to "plug into the game": you pass in a THREE.Group or Scene.
// It DOES NOT create an HTML page or its own renderer; it's headless by default.
//
// Usage inside your game:
//   import * as THREE from "three";
//   import { addKonohaCitySlice } from "./citySlice.js";
//   const root = new THREE.Group();
//   scene.add(root);
//   addKonohaCitySlice(root, { rows:6, cols:5 }); // returns the slice group
//
// For a quick standalone browser demo, see the comment at the bottom.

import * as THREE from "three";
import { createKit } from "./citySlice.kit.js";
import { createExotics } from "./citySlice.exotics.js";
import { buildOriginals } from "./citySlice.originals.js";
import { buildMore } from "./citySlice.more.js";
import { buildBasic, BASIC_ROOF_PALETTES } from "./citySlice.basic.js";
/* @tweakable world-size used for map percent→world conversions */
import { WORLD_SIZE } from "/src/scene/terrain.js";
/* NEW: static import for default map model to avoid top-level await */
import { DEFAULT_MODEL as MAP_DEFAULT_MODEL } from "/map/defaults/full-default-model.js";

export function addKonohaCitySlice(target, opts = {}) {
  const {
    rows = 6, cols = 5,
    spacingX = 300, spacingZ = 280,
    jitter = 0.14,
    withGround = false, groundColor = 0x74ad66,
    center = [0, 0, 0],
    // NEW: choose basic subset + palette
    variant = 'default',
    basicPaletteIndex = 0
  } = opts;

  const kit = createKit(THREE);
  const ex  = createExotics(THREE, kit);
  const slice = new THREE.Group(); slice.name = "KonohaCitySlice";
  target.add(slice);

  if (withGround) {
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(cols * spacingX + 800, rows * spacingZ + 800),
      new THREE.MeshStandardMaterial({ color: groundColor, roughness: 1 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    slice.add(ground);
  }

  // Make buildings based on variant
  let builds = [];
  if (variant === 'basic') {
    const color = BASIC_ROOF_PALETTES[(basicPaletteIndex % BASIC_ROOF_PALETTES.length + BASIC_ROOF_PALETTES.length) % BASIC_ROOF_PALETTES.length].color;
    builds = buildBasic(THREE, kit, ex, { roofColor: color });
  } else {
    const originals = buildOriginals(THREE, kit, ex);
    const more      = buildMore(THREE, kit, ex);
    builds          = originals.concat(more);
  }

  const [cx, cy, cz] = center;
  const X0 = cx - (cols - 1) * spacingX / 2;
  const Z0 = cz - (rows - 1) * spacingZ / 2;

  let idx = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (idx >= builds.length) break;
      const b = builds[idx++];
      b.position.set(X0 + c * spacingX, 0, Z0 + r * spacingZ);
      b.rotation.y = (Math.random() - 0.5) * jitter;
      slice.add(b);
    }
  }

  // shadow flags
  slice.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return { slice, kit, ex };
}

/* @tweakable global scale applied to all city-slice buildings added via addCitySliceBuildings */
const CITY_SLICE_DEFAULT_SCALE = 0.5;
/* @tweakable enable OBB colliders for each city-slice building */
const CITY_SLICE_COLLIDERS_ENABLED = true;
/* @tweakable extra padding (world units) added to OBB half-extents */
const CITY_SLICE_COLLIDER_PADDING = 0.5;
/* @tweakable minimum allowed OBB half-extent (world units) to avoid degenerate colliders */
const CITY_SLICE_COLLIDER_MIN_HALF = 2;
/* @tweakable attach a tiny debug marker to each collider center */
const CITY_SLICE_COLLIDER_DEBUG = false;
/* @tweakable require live /map districts to place any city-slice buildings */
const CITY_SLICE_REQUIRE_DISTRICTS = true;

/**
 * Buildings-module style API: add the 30-building city slice into a given parent group (e.g., "town"),
 * and register per-building OBB colliders into objectGrid.
 */
export function addCitySliceBuildings(
  town,
  {
    THREE,
    kit = createKit(THREE),
    settings = {},
    objectGrid = null,
    rows = 6,
    cols = 5,
    spacingX = 300,
    spacingZ = 280,
    jitter = 0.14,
    origin = [300, 0, 300],
    /* @tweakable per-call scale override for this slice (falls back to CITY_SLICE_DEFAULT_SCALE) */
    scale = CITY_SLICE_DEFAULT_SCALE,
    collidersEnabled = CITY_SLICE_COLLIDERS_ENABLED,
    colliderPadding = CITY_SLICE_COLLIDER_PADDING,
    colliderMinHalf = CITY_SLICE_COLLIDER_MIN_HALF,
    colliderDebug = CITY_SLICE_COLLIDER_DEBUG
  } = {}
) {
  const ex = createExotics(THREE, kit);
  const group = new THREE.Group();
  group.name = "CitySliceBuildings";
  town.add(group);

  const variant = settings?.citySliceVariant || 'default';
  const basicPaletteIndex = settings?.citySlicePaletteIndex ?? 0;
  let builds = [];
  if (variant === 'basic') {
    const color = BASIC_ROOF_PALETTES[(basicPaletteIndex % BASIC_ROOF_PALETTES.length + BASIC_ROOF_PALETTES.length) % BASIC_ROOF_PALETTES.length].color;
    builds = buildBasic(THREE, kit, ex, { roofColor: color });
  } else {
    const originals = buildOriginals(THREE, kit, ex);
    const more = buildMore(THREE, kit, ex);
    builds = originals.concat(more);
  }

  const [ox, oy, oz] = origin;
  const X0 = ox - (cols - 1) * spacingX / 2;
  const Z0 = oz - (rows - 1) * spacingZ / 2;

  // NEW: constrain to districts if live map model is present
  // Use live model when present; fall back to defaults when missing/empty
  const liveModelAll = (window.__konohaMapModel?.MODEL ?? window.__konohaMapModel);
  const fallbackAll = MAP_DEFAULT_MODEL;
  const useModel = (liveModelAll && Object.keys(liveModelAll?.districts || {}).length > 0) ? liveModelAll : fallbackAll;
  const districtPolys = useModel?.districts
    ? Object.values(useModel.districts).filter(d=>Array.isArray(d.points)&&d.points.length>=3)
        .map(d=>d.points.map(([px,py])=>({ x:(px/100)*WORLD_SIZE - WORLD_SIZE/2, z:(py/100)*WORLD_SIZE - WORLD_SIZE/2 })))
    : null;
  const pointInPoly = (p, poly) => {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const a = poly[i], b = poly[j];
      const intersects = ((a.z > p.z) !== (b.z > p.z)) &&
        (p.x < ( (b.x - a.x) * (p.z - a.z) / ((b.z - a.z) || 1e-9) + a.x ));
      if (intersects) inside = !inside;
    }
    return inside;
  };
  const insideAnyDistrict = (p) => {
    if (!districtPolys || districtPolys.length === 0) return !CITY_SLICE_REQUIRE_DISTRICTS ? true : false;
    return districtPolys.some(poly=>pointInPoly(p,poly));
  };

  // NEW: require full OBB containment (all corners inside one district)
  const obbCorners = (obb) => {
    const { center:c, hx, hz, rotY:a } = obb; const cos=Math.cos(a), sin=Math.sin(a);
    const pts=[[-hx,-hz],[hx,-hz],[hx,hz],[-hx,hz]];
    return pts.map(([x,z])=>({ x: c.x + x*cos - z*sin, z: c.z + x*sin + z*cos }));
  };
  const fullyInsideAnyDistrict = (obb) => {
    if (!districtPolys || districtPolys.length===0) return !CITY_SLICE_REQUIRE_DISTRICTS ? true : false;
    const pts = obbCorners(obb);
    return districtPolys.some(poly => pts.every(p => pointInPoly(p, poly)));
  };

  function getBuildingOBB(building) {
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

  let idx = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (idx >= builds.length) break;
      const b = builds[idx++];
      const pos = { x: X0 + c * spacingX, z: Z0 + r * spacingZ };
      if (!insideAnyDistrict(pos)) { continue; }
      b.position.set(pos.x, 0, pos.z);
      b.rotation.y = (Math.random() - 0.5) * jitter;
      // require full containment based on OBB
      const obb = (()=>{ b.updateWorldMatrix(true,false); return getBuildingOBB(b); })();
      if (!fullyInsideAnyDistrict(obb)) { continue; }
      group.add(b);
    }
  }

  group.traverse(o => { if (o.isMesh) { o.castShadow = !!settings.shadows; o.receiveShadow = !!settings.shadows; }});
  group.scale.setScalar(scale);

  // Colliders (OBB from world Box3)
  if (collidersEnabled && objectGrid) {
    group.children.forEach((building) => {
      // Build precise polygon collider from merged mesh bounds (projected XZ convex hull)
      const pts = [];
      const tempBox = new THREE.Box3();
      const corner = new THREE.Vector3();
      building.traverse((m) => {
        if (!m.isMesh || !m.geometry) return;
        const g = m.geometry;
        if (!g.boundingBox) g.computeBoundingBox();
        const bb = g.boundingBox;
        for (let xi = 0; xi <= 1; xi++) {
          for (let yi = 0; yi <= 1; yi++) {
            for (let zi = 0; zi <= 1; zi++) {
              corner.set(
                xi ? bb.max.x : bb.min.x,
                yi ? bb.max.y : bb.min.y,
                zi ? bb.max.z : bb.min.z
              ).applyMatrix4(m.matrixWorld);
              pts.push({ x: corner.x, z: corner.z });
            }
          }
        }
      });
      // Convex hull (monotonic chain) on XZ
      const hull = (() => {
        const arr = pts.slice().sort((a, b) => (a.x === b.x ? a.z - b.z : a.x - b.x));
        const cross = (o, a, b) => (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x);
        const lower = [];
        for (const p of arr) { while (lower.length >= 2 && cross(lower[lower.length-2], lower[lower.length-1], p) <= 0) lower.pop(); lower.push(p); }
        const upper = [];
        for (let i = arr.length - 1; i >= 0; i--) { const p = arr[i]; while (upper.length >= 2 && cross(upper[upper.length-2], upper[upper.length-1], p) <= 0) upper.pop(); upper.push(p); }
        upper.pop(); lower.pop(); return lower.concat(upper);
      })();
      if (hull.length >= 3) {
        // Centroid for proxy position
        const cx = hull.reduce((s,p)=>s+p.x,0)/hull.length;
        const cz = hull.reduce((s,p)=>s+p.z,0)/hull.length;
        const proxy = new THREE.Object3D();
        proxy.position.set(cx, 0, cz);
        proxy.userData = {
          label: building.name || 'SliceBuilding',
          collider: { type: 'polygon', points: hull }
        };
        objectGrid.add(proxy);
        group.add(proxy);
        if (colliderDebug) {
          const dbg = new THREE.Mesh(
            new THREE.SphereGeometry(0.6, 10, 10),
            new THREE.MeshBasicMaterial({ color: 0xffaa00 })
          );
          dbg.position.copy(proxy.position);
          dbg.userData = { skipMinimap: true };
          group.add(dbg);
        }
      }
    });
  }

  return group;
}

/* -------------------------------------------------------
   OPTIONAL: tiny standalone viewer for quick eyeballing.
   Uncomment to use in a blank HTML file with an importmap
   for "three". (Keep this commented in-game.)
------------------------------------------------------- */
/*
if (typeof window !== "undefined" && !window.__CITY_SLICE_DEMO__) {
  window.__CITY_SLICE_DEMO__ = true;
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.body.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xa8c7ff);

  const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 6000);
  camera.position.set(1100, 620, 1200);

  const controlsMod = await import("three/examples/jsm/controls/OrbitControls.js");
  const controls = new controlsMod.OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 80, 0);
  controls.enableDamping = true;

  // light
  scene.add(new THREE.HemisphereLight(0xffffff, 0x4b5563, .65));
  const sun = new THREE.DirectionalLight(0xffffff, 1.2);
  sun.position.set(1600, 1300, 500);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096,4096);
  sun.shadow.camera.left=-2200; sun.shadow.camera.right=2200;
  sun.shadow.camera.top=1500;   sun.shadow.camera.bottom=-1500;
  sun.shadow.camera.near=50;    sun.shadow.camera.far=4500;
  sun.shadow.bias=-0.0002;      sun.shadow.normalBias=1.2;
  scene.add(sun);

  const root = new THREE.Group(); scene.add(root);
  addKonohaCitySlice(root, { rows:6, cols:5, withGround:true });

  addEventListener("resize", ()=>{
    camera.aspect = innerWidth/innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });
  (function loop(){
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  })();
}
*/
