import * as THREE from 'three';
import {
  KONOHA_TOWN_COLLIDERS_ENABLED,
  KONOHA_TOWN_COLLIDER_PADDING,
  KONOHA_TOWN_COLLIDER_MIN_HALF,
  KONOHA_TOWN_COLLIDER_DEBUG
} from './konohaTownConfig.js';

export function addObbProxy(building, { scene, objectGrid, townGroup }) {
  if (!KONOHA_TOWN_COLLIDERS_ENABLED || !objectGrid) return;

  building.updateWorldMatrix(true, false);

  const box = new THREE.Box3().setFromObject(building);
  const center = new THREE.Vector3();
  box.getCenter(center);

  const quat = new THREE.Quaternion();
  building.getWorldQuaternion(quat);
  const euler = new THREE.Euler().setFromQuaternion(quat, 'YXZ');
  const scl = new THREE.Vector3();
  building.getWorldScale(scl);

  const proxy = new THREE.Object3D();
  proxy.position.set(center.x, 0, center.z);

  if (building.userData?.round && building.userData?.roundRadius) {
    const avgXZ = (Math.abs(scl.x) + Math.abs(scl.z)) * 0.5;
    const r = building.userData.roundRadius * avgXZ + KONOHA_TOWN_COLLIDER_PADDING;
    const roundProxy = new THREE.Object3D();
    roundProxy.position.set(center.x, 0, center.z);
    roundProxy.userData.collider = {
      type: 'sphere',
      center: { x: center.x, z: center.z },
      radius: Math.max(KONOHA_TOWN_COLLIDER_MIN_HALF, r)
    };
    roundProxy.userData.label = building.name || 'House';
    objectGrid.add(roundProxy);
    scene.add(roundProxy);
    return;
  } else {
    // replace OBB with precise polygon footprint per-building
    const pts = getFootprintPolygon(building);
    proxy.userData.collider = { type: 'polygon', points: pts };
  }

  proxy.userData.label = building.name || 'House';
  objectGrid.add(proxy);
  // Add to scene to keep proxy in world-space (avoid parent transforms offsetting it)
  scene.add(proxy);

  if (KONOHA_TOWN_COLLIDER_DEBUG) {
    const dbg = new THREE.Mesh(
      new THREE.SphereGeometry(0.6, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0xffaa00 })
    );
    dbg.position.copy(proxy.position);
    dbg.userData = { skipMinimap: true };
    scene.add(dbg);
  }
}

// NEW: precise world-space footprint (convex hull of projected vertices)
export function getFootprintPolygon(root) {
  const pts = [];
  const v = new THREE.Vector3();
  root.updateWorldMatrix(true, true);
  root.traverse((m) => {
    if (!m.isMesh || !m.geometry) return;
    const pos = m.geometry.attributes?.position;
    if (!pos) return;
    for (let i = 0; i < pos.count; i++) {
      v.set(pos.getX(i), pos.getY(i), pos.getZ(i)).applyMatrix4(m.matrixWorld);
      pts.push({ x: v.x, z: v.z });
    }
  });
  if (pts.length < 3) {
    const box = new THREE.Box3().setFromObject(root);
    const min = box.min, max = box.max;
    return [
      { x: min.x, z: min.z }, { x: max.x, z: min.z },
      { x: max.x, z: max.z }, { x: min.x, z: max.z }
    ];
  }
  // Monotone chain convex hull on XZ
  const arr = pts.sort((a, b) => (a.x === b.x ? a.z - b.z : a.x - b.x));
  const cross = (o, a, b) => (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x);
  const lower = [];
  for (const p of arr) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop(); lower.push(p); }
  const upper = [];
  for (let i = arr.length - 1; i >= 0; i--) { const p = arr[i]; while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop(); upper.push(p); }
  upper.pop(); lower.pop();
  return lower.concat(upper);
}