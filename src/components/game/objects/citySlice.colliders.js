import * as THREE from "three";

export function registerPolygonCollidersForGroup(group, objectGrid, { colliderDebug = false } = {}) {
  if (!objectGrid) return;
  const nameCounts = new Map();
  group.children.forEach((building) => {
    const pts = [];
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
    const hull = (() => {
      const arr = pts.slice().sort((a, b) => (a.x === b.x ? a.z - b.z : a.x - b.x));
      const cross = (o, a, b) => (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x);
      const lower = [];
      for (const p of arr) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop(); lower.push(p); }
      const upper = [];
      for (let i = arr.length - 1; i >= 0; i--) { const p = arr[i]; while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop(); upper.push(p); }
      upper.pop(); lower.pop(); return lower.concat(upper);
    })();
    if (hull.length >= 3) {
      const cx = hull.reduce((s, p) => s + p.x, 0) / hull.length;
      const cz = hull.reduce((s, p) => s + p.z, 0) / hull.length;
      const proxy = new THREE.Object3D();
      proxy.position.set(cx, 0, cz);
      const baseName = building.name || 'SliceBuilding';
      const next = (nameCounts.get(baseName) || 0) + 1;
      nameCounts.set(baseName, next);
      const uniqueName = next === 1 ? baseName : `${baseName} (${next})`;
      proxy.name = uniqueName;
      proxy.userData = {
        label: uniqueName,
        collider: { type: 'polygon', points: hull },
        onInteract: (obj, player) => {
          try {
            const target = building;
            const orig = target.scale.clone();
            const start = (typeof performance !== 'undefined' ? performance.now() : Date.now());
            const dur = 450; const amp = 0.08;
            const step = () => {
              const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
              const t = Math.min(1, (now - start) / dur);
              const s = 1 + amp * Math.sin(t * Math.PI);
              target.scale.set(orig.x * s, orig.y * s, orig.z * s);
              if (t < 1) { (typeof requestAnimationFrame !== 'undefined' ? requestAnimationFrame : setTimeout)(step, 16); }
              else { target.scale.copy(orig); }
            };
            step();
            // eslint-disable-next-line no-console
            console.log(`Interacted with ${uniqueName}`);
          } catch (_) {}
        }
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

