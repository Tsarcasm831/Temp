import * as THREE from 'three';
import { buildKitbashSet } from '../../../components/game/objects/kitbash.builds.js';
import { buildingToHullPoints, convexHullXZ } from '../../../components/game/objects/citySlice.helpers.js';

/* @tweakable origin for Kitbash neighborhood (world units) */
const KITBASH_ORIGIN = new THREE.Vector3(-350, 0, 300);
/* @tweakable layout: rows x cols */
const KITBASH_ROWS = 3;
const KITBASH_COLS = 5;
/* @tweakable spacing between buildings (pre-scale, in world units) */
const KITBASH_SPACING_X = 280;
const KITBASH_SPACING_Z = 260;
/* @tweakable global scale for Kitbash buildings (40% smaller than before) */
const KITBASH_SCALE = 0.3;
/* @tweakable jitter rotation range (radians) */
const KITBASH_JITTER_ROT = 0.25;
/* @tweakable max nudge attempts to avoid overlapping CitySlice */
const KITBASH_MAX_NUDGE = 50;
/* @tweakable nudge step (world units) */
const KITBASH_NUDGE_STEP = 4;

function approxPolyRadius(poly, cx, cz) {
  let r = 0;
  for (let i = 0; i < poly.length; i++) {
    const dx = poly[i].x - cx;
    const dz = poly[i].z - cz;
    r = Math.max(r, Math.hypot(dx, dz));
  }
  return r;
}

function overlapsAnyCitySlice(objCenter, radius, objectGrid) {
  const nearby = objectGrid.getObjectsNear(objCenter, radius + 180) || [];
  for (let i = 0; i < nearby.length; i++) {
    const o = nearby[i];
    const lbl = o?.userData?.label || '';
    const col = o?.userData?.collider;
    if (!lbl || !col) continue;
    if (!/SliceBuilding/i.test(lbl)) continue; // we only avoid CitySlice buildings
    if (col.type === 'polygon' && Array.isArray(col.points)) {
      const cx = o.position?.x ?? 0, cz = o.position?.z ?? 0;
      const rr = approxPolyRadius(col.points, cx, cz);
      const dx = objCenter.x - cx, dz = objCenter.z - cz;
      const d = Math.hypot(dx, dz);
      if (d < (radius + rr) * 0.95) return true;
    } else if (col.type === 'aabb' || col.type === 'obb') {
      const cx = col.center?.x ?? o.position?.x ?? 0;
      const cz = col.center?.z ?? o.position?.z ?? 0;
      const rr = Math.max(4, (col.halfExtents?.x || 6) + (col.halfExtents?.z || 6));
      const dx = objCenter.x - cx, dz = objCenter.z - cz;
      const d = Math.hypot(dx, dz);
      if (d < (radius + rr) * 0.9) return true;
    } else if (col.type === 'sphere' && typeof col.radius === 'number') {
      const cx = o.position?.x ?? 0, cz = o.position?.z ?? 0;
      const rr = col.radius;
      const dx = objCenter.x - cx, dz = objCenter.z - cz;
      const d = Math.hypot(dx, dz);
      if (d < (radius + rr) * 0.9) return true;
    }
  }
  return false;
}

export function placeKitbash(scene, objectGrid, settings) {
  try {
    const root = new THREE.Group();
    root.name = 'KitbashRoot';
    scene.add(root);

    // Build meshes
    const builds = buildKitbashSet(THREE, { count: KITBASH_ROWS * KITBASH_COLS, paletteIndex: settings?.citySlicePaletteIndex ?? 0 });

    // Layout grid around origin
    const X0 = KITBASH_ORIGIN.x - (KITBASH_COLS - 1) * KITBASH_SPACING_X / 2;
    const Z0 = KITBASH_ORIGIN.z - (KITBASH_ROWS - 1) * KITBASH_SPACING_Z / 2;

    let idx = 0;
    for (let r = 0; r < KITBASH_ROWS; r++) {
      for (let c = 0; c < KITBASH_COLS; c++) {
        if (idx >= builds.length) break;
        const b = builds[idx++];
        const px = X0 + c * KITBASH_SPACING_X;
        const pz = Z0 + r * KITBASH_SPACING_Z;
        b.position.set(px, 0, pz);
        b.rotation.y = (Math.random() - 0.5) * KITBASH_JITTER_ROT;
        root.add(b);

        // Avoid overlapping CitySlice: nudge outward if needed
        const radius = Math.max(3, (b.userData?.radius || 8)) * KITBASH_SCALE;
        const center = new THREE.Vector3(px, 0, pz);
        if (objectGrid && overlapsAnyCitySlice(center, radius, objectGrid)) {
          // Nudge in spiral pattern until free
          let placed = false;
          const dirs = [
            [1, 0], [-1, 0], [0, 1], [0, -1],
            [1, 1], [-1, 1], [1, -1], [-1, -1]
          ];
          const step = KITBASH_NUDGE_STEP;
          for (let k = 1; k <= KITBASH_MAX_NUDGE && !placed; k++) {
            for (let d = 0; d < dirs.length && !placed; d++) {
              const nx = px + dirs[d][0] * step * k;
              const nz = pz + dirs[d][1] * step * k;
              center.set(nx, 0, nz);
              if (!overlapsAnyCitySlice(center, radius, objectGrid)) {
                b.position.set(nx, 0, nz);
                placed = true;
              }
            }
          }
          if (!placed) {
            // Could not find a non-overlapping spot; drop this building
            root.remove(b);
          }
        }
      }
    }

    // Lighting/shadows and scale first so matrices represent final transforms
    root.traverse(o => { if (o.isMesh) { o.castShadow = !!settings?.shadows; o.receiveShadow = !!settings?.shadows; } });
    root.scale.setScalar(KITBASH_SCALE);

    // Build colliders and proxies with unique interaction handler
    if (objectGrid) {
      root.children.forEach((building) => {
        if (!building) return;
        // Ensure world matrices are up to date (important after applying root scale)
        try { building.updateWorldMatrix(true, true); } catch (_) {}
        const pts = buildingToHullPoints(building);
        const hull = convexHullXZ(pts);
        if (hull.length >= 3) {
          const cx = hull.reduce((s, p) => s + p.x, 0) / hull.length;
          const cz = hull.reduce((s, p) => s + p.z, 0) / hull.length;
          const proxy = new THREE.Object3D();
          proxy.position.set(cx, 0, cz);
          proxy.userData = {
            label: building.name || 'Kitbash Building',
            collider: { type: 'polygon', points: hull },
            onInteract: () => {
              try {
                window.dispatchEvent(new CustomEvent('open-kitbash-building', {
                  detail: {
                    name: building.name || 'Kitbash Building',
                    palette: building.userData?.paletteName || 'custom'
                  }
                }));
              } catch (_) { /* no-op */ }
            }
          };
          objectGrid.add(proxy);
          // Add directly to the scene to avoid inheriting root scale on the proxy transform
          scene.add(proxy);
          // Also attach a color hint for minimap
          try { proxy.userData.colorHex = 'c084fc'; } catch (_) {}
        }
      });
    }

    return root;
  } catch (e) {
    console.warn('Failed to place Kitbash set:', e);
    return null;
  }
}
