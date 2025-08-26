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
    let hxRaw, hzRaw;
    if (building.userData?.footprint) {
      hxRaw = (building.userData.footprint.w * Math.abs(scl.x)) / 2;
      hzRaw = (building.userData.footprint.d * Math.abs(scl.z)) / 2;
    } else {
      const size = new THREE.Vector3();
      box.getSize(size);
      hxRaw = size.x / 2;
      hzRaw = size.z / 2;
    }
    const hx = Math.max(KONOHA_TOWN_COLLIDER_MIN_HALF, hxRaw + KONOHA_TOWN_COLLIDER_PADDING);
    const hz = Math.max(KONOHA_TOWN_COLLIDER_MIN_HALF, hzRaw + KONOHA_TOWN_COLLIDER_PADDING);
    proxy.userData.collider = {
      type: 'obb',
      center: { x: center.x, z: center.z },
      halfExtents: { x: hx, z: hz },
      rotationY: euler.y
    };
  }

  proxy.userData.label = building.name || 'House';
  objectGrid.add(proxy);
  townGroup.add(proxy);

  if (KONOHA_TOWN_COLLIDER_DEBUG) {
    const dbg = new THREE.Mesh(
      new THREE.SphereGeometry(0.6, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0xffaa00 })
    );
    dbg.position.copy(proxy.position);
    dbg.userData = { skipMinimap: true };
    townGroup.add(dbg);
  }
}
