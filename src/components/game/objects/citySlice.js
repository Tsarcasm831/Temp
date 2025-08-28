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
import { chooseBuilds } from "./citySlice.builds.js";
import {
  CITY_SLICE_DEFAULT_SCALE,
  CITY_SLICE_COLLIDERS_ENABLED,
  CITY_SLICE_COLLIDER_PADDING,
  CITY_SLICE_COLLIDER_MIN_HALF,
  CITY_SLICE_COLLIDER_DEBUG,
  CITY_SLICE_REQUIRE_DISTRICTS,
  CITY_SLICE_LOCAL_CONSTRAINTS
} from "./citySlice.constants.js";
import {
  deriveDistrictData,
  insideAnyDistrictPoint,
  pointInPoly as pointInPolyUtil,
  obbCorners as obbCornersUtil,
  fullyInsideAnyDistrict as fullyInsideAnyDistrictUtil,
  nudgeIntoDistrict as nudgeIntoDistrictUtil,
  obbOverlaps as obbOverlapsUtil,
  getBuildingOBB as getBuildingOBBUtil,
  resolveBuildingCollisions as resolveBuildingCollisionsUtil
} from "./citySlice.constraints.js";
import { registerPolygonCollidersForGroup } from "./citySlice.colliders.js";
/* @tweakable world-size used for map percent→world conversions */
/* NEW: static import for default map model to avoid top-level await */

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
  const choice = chooseBuilds(THREE, kit, ex, { variant, basicPaletteIndex });
  const builds = choice.builds;
  let rowsLocal = choice.rows, colsLocal = choice.cols;

  const [cx, cy, cz] = center;
  const X0 = cx - (colsLocal - 1) * spacingX / 2;
  const Z0 = cz - (rowsLocal - 1) * spacingZ / 2;

  let idx = 0;
  for (let r = 0; r < rowsLocal; r++) {
    for (let c = 0; c < colsLocal; c++) {
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
  const choice2 = chooseBuilds(THREE, kit, ex, { variant, basicPaletteIndex });
  const builds = choice2.builds;
  let rowsLocal2 = choice2.rows, colsLocal2 = choice2.cols;

  const [ox, oy, oz] = origin;
  const X0 = ox - (colsLocal2 - 1) * spacingX / 2;
  const Z0 = oz - (rowsLocal2 - 1) * spacingZ / 2;

  // Local constraints helpers (districts + collisions)
  const districtData = deriveDistrictData({ localConstraints: CITY_SLICE_LOCAL_CONSTRAINTS, requireDistricts: CITY_SLICE_REQUIRE_DISTRICTS });
  const insideAnyDistrict = (p) => insideAnyDistrictPoint(p, districtData);
  const fullyInsideAnyDistrict = (obb) => fullyInsideAnyDistrictUtil(obb, districtData);
  const nudgeIntoDistrict = (b, opts) => nudgeIntoDistrictUtil(b, districtData, { fullyInsideAnyDistrictFn: fullyInsideAnyDistrict, ...(opts || {}) });
  const getBuildingOBB = (b) => getBuildingOBBUtil(b, { colliderPadding, colliderMinHalf });
  const resolveBuildingCollisions = (b, placed, opts) => resolveBuildingCollisionsUtil(b, placed, { districtData, fullyInsideAnyDistrictFn: fullyInsideAnyDistrict }, opts);

  let idx = 0;
  if (!CITY_SLICE_LOCAL_CONSTRAINTS) {
    for (let r = 0; r < rowsLocal2; r++) {
      for (let c = 0; c < colsLocal2; c++) {
        if (idx >= builds.length) break;
        const b = builds[idx++];
        b.position.set(X0 + c * spacingX, 0, Z0 + r * spacingZ);
        b.rotation.y = (Math.random() - 0.5) * jitter;
        group.add(b);
      }
    }
  } else {
    const placedObbs = [];
    for (let r = 0; r < rowsLocal2; r++) {
      for (let c = 0; c < colsLocal2; c++) {
        if (idx >= builds.length) break;
        const b = builds[idx++];
        const pos = { x: X0 + c * spacingX, z: Z0 + r * spacingZ };
        b.position.set(pos.x, 0, pos.z);
        b.rotation.y = (Math.random() - 0.5) * jitter;
        if (!insideAnyDistrict(pos)) { if (!nudgeIntoDistrict(b)) { continue; } }
        let obb = (()=>{ b.updateWorldMatrix(true,false); return getBuildingOBB(b); })();
        if (!fullyInsideAnyDistrict(obb)) {
          if (!nudgeIntoDistrict(b)) { continue; }
          obb = (()=>{ b.updateWorldMatrix(true,false); return getBuildingOBB(b); })();
          if (!fullyInsideAnyDistrict(obb)) { continue; }
        }
        const placed = resolveBuildingCollisions(b, placedObbs);
        if (!placed) { continue; }
        placedObbs.push(placed);
        group.add(b);
      }
    }
  }

  group.traverse(o => { if (o.isMesh) { o.castShadow = !!settings.shadows; o.receiveShadow = !!settings.shadows; }});
  group.scale.setScalar(scale);

  // Colliders (OBB from world Box3)
  if (collidersEnabled && objectGrid) {
    registerPolygonCollidersForGroup(group, objectGrid, { colliderDebug });
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
