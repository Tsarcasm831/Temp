// konohaBuildings.js
// Usage (minimal HTML):
// -------------------------------------------------------
// <script type="importmap">
// {
//   "imports": {
//     "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
//     "three/examples/jsm/controls/OrbitControls.js":
//       "https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js"
//   }
// }
// </script>
// <script type="module" src="./konohaBuildings.js"></script>
// -------------------------------------------------------

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { addRedBuildings }    from "./buildings.red.js";
import { addBlueBuildings }   from "./buildings.blue.js";
import { addYellowBuildings } from "./buildings.yellow.js";
import { addGreenBuildings }  from "./buildings.green.js";
import { addDarkBuildings }   from "./buildings.dark.js";

/* -------------------------------------------------------
   Scene / Renderer / Camera
------------------------------------------------------- */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x20252d);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 4000);
camera.position.set(480, 380, 520);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(40, 60, 10);
controls.enableDamping = true;

// lights
scene.add(new THREE.HemisphereLight(0xffffff, 0x4b5563, 0.55));
const sun = new THREE.DirectionalLight(0xffffff, 1.2);
sun.position.set(600, 800, 200);
sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096);
sun.shadow.camera.left = -1200; sun.shadow.camera.right = 1200;
sun.shadow.camera.top = 800;    sun.shadow.camera.bottom = -800;
sun.shadow.camera.near = 50;    sun.shadow.camera.far = 2200;
sun.shadow.bias = -0.0002;      sun.shadow.normalBias = 1.2;
scene.add(sun);

// ground
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(4000, 4000),
  new THREE.MeshStandardMaterial({ color: 0x16191e, roughness: 1 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

/* -------------------------------------------------------
   Materials palette
------------------------------------------------------- */
const Palette = {
  plaster: 0xe8efc9,
  trim: 0xb7c097,
  skirt: 0x66705d,
  wood: 0x6d5433,
  frame: 0x3b3f45,
  glass: 0x8db1c6,
  roofRed: 0xd7413a,
  roofBlue: 0x5570b7,
  roofYellow: 0xd6c14e,
  roofGreen: 0x3e8048,
  roofDark: 0x2f3338
};
const M = {
  plaster: new THREE.MeshStandardMaterial({ color: Palette.plaster, roughness: .95, metalness: .02 }),
  trim:    new THREE.MeshStandardMaterial({ color: Palette.trim,    roughness: .95, metalness: .02 }),
  skirt:   new THREE.MeshStandardMaterial({ color: Palette.skirt,   roughness: .95, metalness: .02 }),
  wood:    new THREE.MeshStandardMaterial({ color: Palette.wood,    roughness: .9,  metalness: .03 }),
  frame:   new THREE.MeshStandardMaterial({ color: Palette.frame,   roughness: .9,  metalness: .02 }),
  glass:   new THREE.MeshStandardMaterial({ color: Palette.glass,   roughness: .2,  metalness: .02 }),
  roof: (c) => new THREE.MeshStandardMaterial({
    color: c, roughness: .9, metalness: .02,
    polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1
  })
};

/* -------------------------------------------------------
   Small kit pieces
------------------------------------------------------- */
function box(w, h, d, mat) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.castShadow = m.receiveShadow = true;
  return m;
}
function cylinder(r, h, mat, radial = 32) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, radial), mat);
  m.castShadow = m.receiveShadow = true;
  return m;
}
function cone(r, h, mat, radial = 32) {
  const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, radial), mat);
  m.castShadow = m.receiveShadow = true;
  return m;
}
function seamLines(mesh, color = 0x20242a, alpha = 0.28) {
  const g = new THREE.EdgesGeometry(mesh.geometry, 25);
  const m = new THREE.LineBasicMaterial({ color, transparent: true, opacity: alpha });
  const lines = new THREE.LineSegments(g, m);
  lines.position.copy(mesh.position);
  lines.rotation.copy(mesh.rotation);
  mesh.add(lines);
  return lines;
}

/* -------------------------------------------------------
   Windows / Doors / Balcony / Sign
------------------------------------------------------- */
function makeWindow(w = 12, h = 10, depth = 1.2) {
  const g = new THREE.Group();
  const frame = box(w, h, depth, M.frame); frame.position.y = h / 2; g.add(frame);
  const glass = box(w - 2, h - 2, depth - 0.6, M.glass);
  glass.position.y = h / 2; glass.position.z = 0.3; g.add(glass);
  return g;
}
function makeDoor(w = 12, h = 18, depth = 1.6) {
  const g = new THREE.Group();
  const frame = box(w, h, depth, M.frame); frame.position.y = h / 2; g.add(frame);
  const panel = box(w - 2, h - 2, depth - 0.6, M.wood);
  panel.position.y = h / 2; panel.position.z = 0.4; g.add(panel);
  return g;
}
function makeBalcony(w = 30, d = 10, h = 3) {
  const g = new THREE.Group();
  const floor = box(w, 2, d, M.wood); floor.position.y = 1; g.add(floor);
  const rail = new THREE.Mesh(new THREE.BoxGeometry(w, h, 1.2), M.frame);
  rail.position.set(0, h / 2 + 2, d / 2 - 0.6); rail.castShadow = true; g.add(rail);
  const count = Math.floor((w - 4) / 3);
  for (let i = 0; i < count; i++) {
    const x = -w / 2 + 2 + i * 3;
    const pk = box(0.6, h - 0.8, 1.0, M.frame);
    pk.position.set(x, h / 2 + 2, d / 2 - 0.6); g.add(pk);
  }
  return g;
}
function makeSign(w = 22, h = 6) {
  const g = new THREE.Group();
  const slab = box(w, 2, h, M.wood); slab.position.set(0, 1, 0); g.add(slab);
  const plate = box(w - 2, 1.2, h - 1.6, M.frame); plate.position.set(0, 1.2, 0.1); g.add(plate);
  return g;
}

/* -------------------------------------------------------
   Roofs
------------------------------------------------------- */
function makeGableRoof(w, d, thickness, color) {
  const grp = new THREE.Group();
  const t = thickness ?? 2;
  const slopeH = Math.max(w, d) * 0.18;
  const baseY = t / 2;
  const s1 = box(w, t, d / 2, M.roof(color)); s1.position.set(0, baseY, -d / 4);
  const s2 = box(w, t, d / 2, M.roof(color)); s2.position.set(0, baseY,  d / 4);
  const ang = Math.atan2(slopeH, d / 2);
  s1.rotation.x =  ang; s2.rotation.x = -ang;
  [s1, s2].forEach(s => { seamLines(s, 0x000000, 0.35); grp.add(s); });
  const ridge = box(w + 1.0, t * 0.8, 1.4, M.roof(Palette.roofDark));
  ridge.position.set(0, baseY + Math.sin(ang) * (d / 2), 0);
  grp.add(ridge);
  return grp;
}
function makeHipRoof(w, d, thickness, color) {
  const grp = new THREE.Group();
  const t = thickness ?? 2;
  const base = box(w, t, d, M.roof(color)); base.position.y = t / 2; grp.add(base); seamLines(base, 0x000, 0.35);
  const cap = box(Math.max(6, w * 0.18), 1.6, Math.max(6, d * 0.18), M.roof(Palette.roofDark));
  cap.position.y = t / 2 + Math.max(w, d) * 0.22 + 0.2; grp.add(cap);
  return grp;
}
function makeFlatRoof(w, d, t = 2, color = Palette.roofDark) {
  const slab = box(w, t, d, M.roof(color));
  seamLines(slab, 0x000, 0.15);
  return slab;
}
function makeDomeRoof(radius, color) {
  const grp = new THREE.Group();
  const drum = cylinder(radius * 0.95, 10, M.roof(Palette.roofDark), 36);
  drum.position.y = 5; grp.add(drum);
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 36, 24, 0, Math.PI * 2, 0, Math.PI / 2),
    M.roof(color)
  );
  dome.position.y = 5; dome.castShadow = dome.receiveShadow = true; grp.add(dome);
  const cap = cone(radius * 0.18, 8, M.roof(Palette.roofDark), 24);
  cap.position.y = 5 + radius * 0.98; grp.add(cap);
  return grp;
}
function makeConeRoof(radius, color) {
  const grp = new THREE.Group();
  const eave = cylinder(radius * 1.05, 3, M.roof(Palette.roofDark), 32); eave.position.y = 1.5; grp.add(eave);
  const con = cone(radius, radius * 1.2, M.roof(color), 32); con.position.y = 1.5 + radius * 0.6; grp.add(con);
  return grp;
}

/* -------------------------------------------------------
   Rect/Floor level and full Building
------------------------------------------------------- */
function makeLevel({ w = 60, d = 40, h = 24, plaster = M.plaster, trim = M.trim, skirt = M.skirt, withSkirt = true } = {}) {
  const grp = new THREE.Group();
  const body = box(w, h, d, plaster); body.position.y = h / 2; grp.add(body);
  const t = 2.2;
  const corners = [
    [-w / 2 + t / 2, h / 2, -d / 2 + t / 2], [w / 2 - t / 2, h / 2, -d / 2 + t / 2],
    [-w / 2 + t / 2, h / 2,  d / 2 - t / 2], [w / 2 - t / 2, h / 2,  d / 2 - t / 2]
  ];
  corners.forEach(p => { const c = box(t, h, t, trim); c.position.set(...p); grp.add(c); });
  if (withSkirt) {
    const sk = box(w + 2, 6, d + 2, skirt); sk.position.y = 3; grp.add(sk);
  }
  return grp;
}
function addWindowsRect(grp, { w, d, h, y = 10, inset = 1.6, gap = 12, size = [10, 8] }) {
  const [ww, hh] = size;
  const countX = Math.floor((w - 16) / gap);
  for (let i = 0; i < countX; i++) {
    const x = -w / 2 + 8 + i * gap;
    const W1 = makeWindow(ww, hh, inset); W1.position.set(x, y,  d / 2 + 0.6); W1.rotation.y = Math.PI;   grp.add(W1);
    const W2 = makeWindow(ww, hh, inset); W2.position.set(x, y, -d / 2 - 0.6);                               grp.add(W2);
  }
  const countZ = Math.floor((d - 16) / gap);
  for (let i = 0; i < countZ; i++) {
    const z = -d / 2 + 8 + i * gap;
    const W1 = makeWindow(ww, hh, inset); W1.position.set( w / 2 + 0.6, y, z); W1.rotation.y = -Math.PI/2;  grp.add(W1);
    const W2 = makeWindow(ww, hh, inset); W2.position.set(-w / 2 - 0.6, y, z); W2.rotation.y =  Math.PI/2;  grp.add(W2);
  }
}

function makeBuilding(opts) {
  const {
    name = "bldg",
    w = 60, d = 40, floors = 2, floorH = 24,
    roofType = "hip", roofColor = Palette.roofBlue,
    balcony = false, sign = false, door = true,
    round = false, cone = false,
    position = [0, 0, 0], rotationY = 0
  } = opts;

  const B = new THREE.Group(); B.name = name;
  const foundation = new THREE.Group(); foundation.name = "foundation"; B.add(foundation);
  const levels = new THREE.Group();     levels.name     = "levels";     B.add(levels);
  const details = new THREE.Group();    details.name    = "details";    B.add(details);
  const roof = new THREE.Group();       roof.name       = "roof";       B.add(roof);

  if (!round) {
    for (let f = 0; f < floors; f++) {
      const L = makeLevel({ w, d, h: floorH });
      L.position.y = f * floorH;
      levels.add(L);
      addWindowsRect(L, { w, d, h: floorH, y: floorH * 0.55 });
      if (f === 0 && door) {
        const Dr = makeDoor(14, 20, 2);
        Dr.position.set(0, 10, d / 2 + 1.1); Dr.rotation.y = Math.PI;
        L.add(Dr);
      }
      if (f === 1 && balcony) {
        const Bc = makeBalcony(Math.min(36, w - 12), 10, 6);
        Bc.position.set(0, floorH + 2, d / 2 + 5.6); L.add(Bc);
      }
    }
    const topY = floors * floorH;
    let roofMesh;
    if (roofType === "gable") roofMesh = makeGableRoof(w - 2, d - 2, 2, roofColor);
    else if (roofType === "flat") roofMesh = makeFlatRoof(w - 6, d - 6, 2.2, Palette.roofDark);
    else roofMesh = makeHipRoof(w - 2, d - 2, 2, roofColor);
    roofMesh.position.y = topY + 1.4;
    roof.add(roofMesh);
    if (sign) {
      const s = makeSign(24, 6);
      s.position.set(-w / 2 - 2, floorH * 0.9, 0);
      s.rotation.y = Math.PI / 2;
      details.add(s);
    }
  } else {
    const radius = Math.max(w, d) * 0.45;
    for (let f = 0; f < floors; f++) {
      const drum = cylinder(radius * (1 - f * 0.05), floorH, M.plaster, 32);
      drum.position.y = floorH / 2 + f * floorH;
      levels.add(drum);
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2;
        const col = box(2.2, floorH, 2.2, M.trim);
        col.position.set(Math.cos(ang) * radius * 0.98, floorH / 2 + f * floorH, Math.sin(ang) * radius * 0.98);
        levels.add(col);
      }
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI * 2;
        const W = makeWindow(10, 9, 1.2);
        W.position.set(Math.cos(ang) * radius * 0.98, floorH * 0.55 + f * floorH, Math.sin(ang) * radius * 0.98);
        W.lookAt(0, W.position.y, 0);
        levels.add(W);
      }
    }
    const topY = floors * floorH;
    const cap = cone ? makeConeRoof(radius * 0.95, roofColor) : makeDomeRoof(radius * 0.95, roofColor);
    cap.position.y = topY + 2; roof.add(cap);
  }

  B.position.set(...position);
  B.rotation.y = rotationY;
  B.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return B;
}

/* -------------------------------------------------------
   Town: call color modules
------------------------------------------------------- */
const town = new THREE.Group(); town.name = "KonohaTown"; scene.add(town);

// Build per-color sets
const kit = { THREE, Palette, M, makeBuilding };

addRedBuildings(town,    { THREE, kit });
addBlueBuildings(town,   { THREE, kit });
addYellowBuildings(town, { THREE, kit });
addGreenBuildings(town,  { THREE, kit });
addDarkBuildings(town,   { THREE, kit });

/* -------------------------------------------------------
   Resize / Render loop
------------------------------------------------------- */
addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
(function loop() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
})();
