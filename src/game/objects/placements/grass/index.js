import * as THREE from 'three';
import { parseGridLabel, posForCell } from '../../utils/gridLabel.js';

/* @tweakable default label for demo placement */
const DEFAULT_GRASS_LABEL = 'LI300';

/*
 Build a single grass clump using many thin planes to mimic blades.
 Options:
 - blades: number of blades in the clump
 - radius: spread radius (world units) from clump center
 - height: { min, max } blade height in world units
 - width: blade width (world units)
 - color: base color (hex)
 - colorJitter: per-blade color variation (0..1)
*/
// Shared assets per module to minimize allocations
let __grassGeom = null;
let __grassMat = null;

function ensureGrassAssets() {
  if (!__grassGeom) {
    // Taller plane with vertical segments for nicer bend and lighting
    const segY = 4;
    const g = new THREE.PlaneGeometry(1, 1, 1, segY);
    const pos = g.attributes.position;
    // Curve the blade slightly backward along Z and taper top width via x scale in vertex positions
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i); // -0.5..+0.5
      const t = (y + 0.5);   // 0..1 from bottom to top
      const bend = (t - 0.5) * 0.22; // gentle arc
      pos.setZ(i, bend);
      // slight inward taper toward tip
      pos.setX(i, pos.getX(i) * (0.7 + 0.3 * (1 - t)));
    }
    pos.needsUpdate = true;
    g.computeVertexNormals();

    // Vertex colors: darker at base, lighter at tip for depth
    const colors = new Float32Array(pos.count * 3);
    const cBase = new THREE.Color(0x1b6e2d);
    const cTip = new THREE.Color(0x2bbf65);
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const t = (y + 0.5); // 0..1
      const c = cBase.clone().lerp(cTip, Math.pow(t, 0.9));
      colors[i*3+0] = c.r; colors[i*3+1] = c.g; colors[i*3+2] = c.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    __grassGeom = g;
  }
  if (!__grassMat) {
    // Lambert is lighter than Standard; vertex colors provide variation
    __grassMat = new THREE.MeshLambertMaterial({
      side: THREE.DoubleSide,
      vertexColors: true,
    });
    __grassMat.toneMapped = true;
  }
}

export function buildGrassClump(options = {}){
  ensureGrassAssets();
  const blades = Math.max(16, Math.min(1000, options.blades ?? 160));
  const radius = Math.max(0.5, options.radius ?? 2.2);
  const hmin = Math.max(0.4, options.height?.min ?? 1.4);
  const hmax = Math.max(hmin, options.height?.max ?? 3.4);
  const width = Math.max(0.03, options.width ?? 0.1);
  const jitter = Math.max(0, Math.min(1, options.colorJitter ?? 0.1));
  const baseColor = new THREE.Color(options.baseColor ?? 0x1f8a3a);

  // Single InstancedMesh for the whole clump -> 1 draw call
  const mesh = new THREE.InstancedMesh(__grassGeom, __grassMat, blades);
  mesh.name = 'GrassClump(Instanced)';
  mesh.castShadow = false; mesh.receiveShadow = true;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  if (mesh.instanceColor) mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
  mesh.userData = mesh.userData || {};
  mesh.userData.isGrass = true;

  const mat = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const p = new THREE.Vector3();
  const e = new THREE.Euler();
  const base = baseColor;
  const rnd = (a,b)=>a + Math.random()*(b-a);

  let maxH = 0;
  for (let i=0;i<blades;i++){
    const h = rnd(hmin, hmax); maxH = Math.max(maxH, h);
    const w = rnd(width*0.7, width*1.35);
    const ang = Math.random()*Math.PI*2; const r = Math.pow(Math.random(), 0.6) * radius;
    p.set(Math.cos(ang)*r, h*0.5, Math.sin(ang)*r);
    e.set(rnd(-0.35,0.35), Math.random()*Math.PI*2, rnd(-0.35,0.35)); q.setFromEuler(e);
    s.set(w, h, 1);
    mat.compose(p, q, s); mesh.setMatrixAt(i, mat);
    // per-instance color jitter
    const c = base.clone(); const j=rnd(-jitter, jitter); c.offsetHSL(0, j*0.25, j*0.25);
    if (mesh.setColorAt) mesh.setColorAt(i, c);
  }
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

  // Reasonable bounds for culling
  mesh.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, maxH*0.5, 0), Math.sqrt(radius*radius + (maxH*0.5)*(maxH*0.5)) + 0.5);
  mesh.userData.baseCount = mesh.count;
  return mesh;
}

// Place a single clump at a grid label
export function placeGrassClump(scene, objectGrid, worldSize, settings, label = DEFAULT_GRASS_LABEL, options = {}){
  try{
    const { i, j } = parseGridLabel(label);
    const p = posForCell(i, j, worldSize);
    const group = buildGrassClump(options);
    group.position.set(p.x, 0, p.z);
    scene.add(group);
    return group;
  }catch(e){
    console.warn('Failed to place Grass clump at', label, e);
    return null;
  }
}

// Place multiple clumps around a label in a small patch
export function placeGrassPatch(scene, objectGrid, worldSize, settings, label = DEFAULT_GRASS_LABEL, count = 8, options = {}){
  ensureGrassAssets();
  // Build a single InstancedMesh for the entire patch to minimize draw calls
  const bladesPer = Math.max(16, Math.min(1000, options.blades ?? 160));
  const total = bladesPer * Math.max(1, count|0);
  const inst = new THREE.InstancedMesh(__grassGeom, __grassMat, total);
  inst.name = 'GrassPatch(Instanced)';
  inst.castShadow = false; inst.receiveShadow = true;
  inst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  if (inst.instanceColor) inst.instanceColor.setUsage(THREE.DynamicDrawUsage);
  // Base count stored for LOD adjustments
  inst.userData = inst.userData || {};
  inst.userData.isGrass = true;

  const rnd = (a,b)=>a + Math.random()*(b-a);
  const radius = Math.max(0.5, options.radius ?? 2.2);
  const spread = Math.max(0, options.spread ?? 12);
  const hmin = Math.max(0.4, options.height?.min ?? 1.4);
  const hmax = Math.max(hmin, options.height?.max ?? 3.6);
  const width = Math.max(0.03, options.width ?? 0.1);
  const jitter = Math.max(0, Math.min(1, options.colorJitter ?? 0.1));
  const baseColor = new THREE.Color(options.baseColor ?? 0x1f8a3a);

  let center = new THREE.Vector3(0,0,0);
  if (typeof label === 'string') {
    try{
      const { i, j } = parseGridLabel(label);
      const c = posForCell(i, j, worldSize);
      center.set(c.x, 0, c.z);
    }catch(_){ /* fall through */ }
  } else if (label && typeof label === 'object') {
    const x = Number(label.x) || 0; const z = Number(label.z) || 0;
    center.set(x, 0, z);
  }

  // Precompute clump offsets (allow custom offsets for varied shapes)
  let clumps = [];
  if (Array.isArray(options.offsets) && options.offsets.length > 0) {
    for (let i = 0; i < options.offsets.length; i++) {
      const o = options.offsets[i];
      const vx = (o?.x ?? 0); const vz = (o?.z ?? 0);
      clumps.push(new THREE.Vector3(vx, 0, vz));
    }
  } else {
    clumps = [new THREE.Vector3(0,0,0)];
    for (let k=1;k<count;k++){
      const d = spread * Math.random();
      const a = Math.random()*Math.PI*2;
      clumps.push(new THREE.Vector3(Math.cos(a)*d, 0, Math.sin(a)*d));
    }
  }

  const mat = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const p = new THREE.Vector3();
  const e = new THREE.Euler();
  const base = baseColor;

  let idx = 0, maxH = 0;
  for (let c = 0; c < clumps.length; c++){
    const off = clumps[c];
    for (let b = 0; b < bladesPer; b++){
      const h = rnd(hmin, hmax); maxH = Math.max(maxH, h);
      const w = rnd(width*0.7, width*1.35);
      const ang = Math.random()*Math.PI*2; const rr = Math.pow(Math.random(), 0.6) * radius;
      // Instance position is local to the mesh; mesh itself will be positioned at 'center'
      p.set(off.x + Math.cos(ang)*rr, h*0.5, off.z + Math.sin(ang)*rr);
      e.set(rnd(-0.35,0.35), Math.random()*Math.PI*2, rnd(-0.35,0.35)); q.setFromEuler(e);
      s.set(w, h, 1);
      mat.compose(p, q, s); inst.setMatrixAt(idx, mat);
      const ccol = base.clone(); const j=rnd(-jitter, jitter); ccol.offsetHSL(0, j*0.25, j*0.25);
      if (inst.setColorAt) inst.setColorAt(idx, ccol);
      idx++;
    }
  }
  inst.count = idx;
  inst.instanceMatrix.needsUpdate = true;
  if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
  // Position the instanced mesh at the patch center; set a reasonable local bound
  inst.position.copy(center);
  inst.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, maxH*0.5, 0), Math.max(1, spread + radius + maxH*0.6));
  inst.userData.baseCount = inst.count;
  scene.add(inst);
  return inst;
}
