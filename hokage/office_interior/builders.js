import * as THREE from "three";

// Smooth circular walls with a large window opening behind the desk.
// Adds separate invisible box colliders so movement stays accurate without visual seams.
export function buildWalls(scene){
  const group = new THREE.Group();
  group.name = "Walls";
  scene.add(group);

  const radius = 7.0;   // match floor/ceiling radius from sceneSetup
  const height = 3.0;   // slightly below the 3.1m ceiling disc
  const segs = 96;      // visual smoothness for curved walls

  // two-tone wall (lower/upper)
  const lowerH = 1.05;
  const upperH = height - lowerH;
  const lowerMat = new THREE.MeshStandardMaterial({ color: 0xe8d397, roughness: 0.95, metalness: 0.02 });
  const upperMat = new THREE.MeshStandardMaterial({ color: 0x8a5b3f, roughness: 0.9, metalness: 0.04 });

  // Window opening centered toward -Z (behind the desk)
  const windowCenter = Math.PI;      // -Z direction
  const windowHalf = 0.55;           // radians (opening ~63°)

  // helper to build a curved wall arc
  function curvedBand(h, mat, thetaStart, thetaLength){
    const geo = new THREE.CylinderGeometry(radius, radius, h, segs, 1, true, thetaStart, thetaLength);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = h/2;
    mesh.castShadow = true; mesh.receiveShadow = true;
    return mesh;
  }

  // left arc
  const leftLen = Math.max(0, windowCenter - windowHalf);
  if (leftLen > 0){
    const lowerLeft = curvedBand(lowerH, lowerMat, 0, leftLen);
    const upperLeft = curvedBand(upperH, upperMat, 0, leftLen); upperLeft.position.y = lowerH + upperH/2;
    group.add(lowerLeft, upperLeft);
  }
  // right arc
  const rightStart = windowCenter + windowHalf;
  const rightLen = Math.max(0, Math.PI*2 - (windowCenter + windowHalf));
  if (rightLen > 0){
    const lowerRight = curvedBand(lowerH, lowerMat, rightStart, rightLen);
    const upperRight = curvedBand(upperH, upperMat, rightStart, rightLen); upperRight.position.y = lowerH + upperH/2;
    group.add(lowerRight, upperRight);
  }

  // trims (slightly offset outward to avoid z-fighting)
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x5f3a24, roughness: 0.8, metalness: 0.05, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  const trimOffset = 0.012;
  function curvedTrim(y){
    if (leftLen > 0){
      const t1 = new THREE.Mesh(new THREE.CylinderGeometry(radius + trimOffset, radius + trimOffset, 0.055, segs, 1, true, 0, leftLen), trimMat);
      t1.position.y = y; group.add(t1);
    }
    if (rightLen > 0){
      const t2 = new THREE.Mesh(new THREE.CylinderGeometry(radius + trimOffset, radius + trimOffset, 0.055, segs, 1, true, rightStart, rightLen), trimMat);
      t2.position.y = y; group.add(t2);
    }
  }
  curvedTrim(lowerH + 0.001);
  curvedTrim(height - 0.055 + 0.001);

  // simple window frame across the opening (visual only)
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x3b2b1c, roughness: 0.85, metalness: 0.04 });
  const frame = new THREE.Group(); group.add(frame);
  const openR = radius - 0.02;
  const w = 3.8, h = 2.1, depth = 0.06;
  const bar = (sx, sy, sw, sh) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(sw, sh, depth), frameMat);
    const ang = windowCenter; // point toward -Z
    m.position.set(Math.sin(ang) * openR, sy, Math.cos(ang) * openR);
    // orient facing inward
    m.lookAt(0, sy, 0); m.rotateY(Math.PI);
    m.castShadow = true; m.receiveShadow = true;
    m.scale.x = 1; m.scale.y = 1;
    // offset sideways along local X for left/right pieces
    m.translateX(sx);
    return m;
  };
  // outer rectangle (top/bottom + sides) arranged around center
  frame.add(bar(0, lowerH + upperH - h/2, w, 0.08)); // top
  frame.add(bar(0, lowerH + 0.02, w, 0.08));         // bottom
  frame.add(bar(-w/2 + 0.04, lowerH + upperH/2, 0.08, h)); // left
  frame.add(bar(+w/2 - 0.04, lowerH + upperH/2, 0.08, h)); // right

  // Invisible colliders approximating the walls (exclude window opening)
  const colliderMat = new THREE.MeshBasicMaterial({ visible: false });
  const colliderCount = 28;
  for (let i = 0; i < colliderCount; i++){
    const a0 = (i / colliderCount) * Math.PI * 2;
    const a1 = ((i + 1) / colliderCount) * Math.PI * 2;
    const aMid = (a0 + a1) * 0.5;
    const angDiff = Math.atan2(Math.sin(aMid - windowCenter), Math.cos(aMid - windowCenter));
    if (Math.abs(angDiff) < windowHalf) continue; // skip inside the window span

    const segWidth = (a1 - a0) * radius;
    const thickness = 0.16;
    // lower and upper colliders (merge height into one box to reduce count)
    const col = new THREE.Mesh(new THREE.BoxGeometry(segWidth, height, thickness), colliderMat);
    col.position.set(Math.sin(aMid) * radius, height/2, Math.cos(aMid) * radius);
    col.lookAt(0, col.position.y, 0);
    col.rotateY(Math.PI);
    col.userData = { collide: true };
    group.add(col);
  }

  return group;
}

// Simple wooden desk with collision on the tabletop and front panel.
export function buildDesk(){
  const group = new THREE.Group();
  group.name = "Desk";

  const wood = new THREE.MeshStandardMaterial({ color: 0x6b5234, roughness: 0.85, metalness: 0.05 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x3a2a1c, roughness: 0.9, metalness: 0.04 });

  // desktop
  const topW = 1.8, topD = 0.9, topT = 0.06, topY = 0.78;
  const top = new THREE.Mesh(new THREE.BoxGeometry(topW, topT, topD), wood);
  top.position.set(0, topY, 0);
  top.castShadow = true; top.receiveShadow = true;
  top.userData = { collide: true };
  group.add(top);

  // modesty/front panel
  const panel = new THREE.Mesh(new THREE.BoxGeometry(topW - 0.12, 0.5, 0.04), dark);
  panel.position.set(0, topY - 0.25, -topD * 0.48);
  panel.castShadow = true; panel.receiveShadow = true;
  panel.userData = { collide: true };
  group.add(panel);

  // legs
  const legGeo = new THREE.BoxGeometry(0.08, topY - 0.05, 0.08);
  const legY = (topY - 0.05) / 2;
  for (const sx of [-1, 1]){
    for (const sz of [-1, 1]){
      const leg = new THREE.Mesh(legGeo, dark);
      leg.position.set((topW * 0.5 - 0.12) * sx, legY, (topD * 0.5 - 0.12) * sz);
      leg.castShadow = true; leg.receiveShadow = true;
      group.add(leg);
    }
  }

  return group;
}

// Small decorative props to place on the desk (no collision).
export function buildProps(){
  const group = new THREE.Group();
  group.name = "Props";

  const matBook = new THREE.MeshStandardMaterial({ color: 0x2e3138, roughness: 0.8, metalness: 0.02 });
  const matCup = new THREE.MeshStandardMaterial({ color: 0xcfcfcf, roughness: 0.5, metalness: 0.1 });

  // a couple of books
  const book1 = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.04, 0.16), matBook);
  book1.position.set(-0.35, 0.04, 0.05);
  book1.castShadow = true; group.add(book1);

  const book2 = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.03, 0.14), matBook);
  book2.position.set(-0.12, 0.035, 0.09);
  book2.rotation.y = 0.15; book2.castShadow = true; group.add(book2);

  // a cup
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.09, 24), matCup);
  cup.position.set(0.42, 0.07, -0.06);
  cup.castShadow = true; group.add(cup);

  return group;
}

// Distant skyline: simple silhouettes outside the office for ambience (no collision).
export function buildSkyline(){
  const group = new THREE.Group();
  group.name = "Skyline";

  // Cluster silhouettes only outside the window (-Z), not around the whole ring
  const mat = new THREE.MeshStandardMaterial({ color: 0x1a212b, roughness: 1.0, metalness: 0.0 });
  const radius = 11.5;   // outside the wall radius
  const center = Math.PI; // -Z
  const halfArc = 0.7;   // limit skyline to window span

  for (let i = 0; i < 28; i++){
    const t = i / 27; // 0..1
    const a = center - halfArc + t * (halfArc * 2);
    const w = 0.4 + Math.random() * 0.8;
    const h = 2.6 + Math.random() * 5.2;
    const d = 0.22 + Math.random() * 0.18;
    const box = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    box.position.set(Math.sin(a) * radius, h / 2 - 0.1, Math.cos(a) * radius);
    box.lookAt(0, box.position.y, 0); box.rotateY(Math.PI);
    group.add(box);
  }

  // Optional low horizon strip
  const horizon = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, 0.12, 64, 1, true, center - halfArc, halfArc * 2),
    new THREE.MeshStandardMaterial({ color: 0x0e1319, roughness: 1.0, metalness: 0.0 })
  );
  horizon.position.y = 0.02;
  group.add(horizon);

  return group;
}
