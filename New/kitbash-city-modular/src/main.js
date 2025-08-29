import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Lcg } from './rng.js';
import { PALETTES } from './palettes.js';
import { recolorGroup, footprintRadius } from './helpers.js';
import { makeBuilding } from './buildingFactory.js';

let paletteIndex = 0;

/* ---------- World ---------- */
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio||1));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled=true;
document.body.appendChild(renderer.domElement);

const scene=new THREE.Scene();
scene.background=new THREE.Color('#0b0f14');
const camera=new THREE.PerspectiveCamera(55, window.innerWidth/window.innerHeight, 0.1, 500);
camera.position.set(10,9,12);
const controls=new OrbitControls(camera, renderer.domElement);
controls.target.set(0,0.6,0); controls.enableDamping=true; controls.maxPolarAngle=Math.PI*0.49;
controls.minDistance=4; controls.maxDistance=50;

/* Lights, ground, streets */
scene.add(new THREE.HemisphereLight('#e7f2ff','#203040',0.65));
const dir=new THREE.DirectionalLight('#ffffff',0.9); dir.position.set(8,12,6); dir.castShadow=true;
dir.shadow.mapSize.set(2048,2048);
dir.shadow.camera.left=-18; dir.shadow.camera.right=18; dir.shadow.camera.top=14; dir.shadow.camera.bottom=-14;
scene.add(dir);
const ground=new THREE.Mesh(new THREE.CircleGeometry(28,64), new THREE.MeshStandardMaterial({color:'#1e293b',roughness:1}));
ground.rotation.x=-Math.PI/2; ground.receiveShadow=true; scene.add(ground);
const streetMat=new THREE.MeshStandardMaterial({color:'#0f172a',roughness:1});
for(let i=0;i<8;i++){ const seg=new THREE.Mesh(new THREE.BoxGeometry(0.6,0.02,26),streetMat); seg.position.y=0.01; seg.rotation.y=i*Math.PI/8; scene.add(seg); }

/* ---------- Collision-aware placement ---------- */
function placeCity(seed=Date.now()){
  const toRemove=[]; scene.traverse(o=>{ if(o.userData && o.userData.isBuilding) toRemove.push(o); });
  toRemove.forEach(o=>scene.remove(o));

  const rng=Lcg(seed); const pal=PALETTES[paletteIndex % PALETTES.length];
  const buildings=[]; const triesPer=40; const count=60;
  const Rmin=3.2, Rmax=24.5;

  for(let i=0;i<count;i++){
    const clonePrev = i>6 && (rng()<0.3);
    let bld;
    if(clonePrev && buildings.length){
      const src=buildings[(rng()*Math.min(buildings.length,20))|0].clone(true);
      src.traverse(o=>{ if(o.isMesh) o.material=o.material.clone(); });
      bld=src; recolorGroup(bld,pal);
      bld.userData.radius=footprintRadius(bld);
      bld.userData.isBuilding=true;
    }else{
      bld=makeBuilding(rng,pal); bld.userData.isBuilding=true;
    }
    let placed=false;
    for(let t=0;t<triesPer;t++){
      const r=Math.sqrt(rng())*(Rmax-Rmin)+Rmin, a=rng()*Math.PI*2;
      const x=Math.cos(a)*r, z=Math.sin(a)*r;
      const ok=buildings.every(o=>{
        const dx=o.position.x-x, dz=o.position.z-z;
        const minDist=o.userData.radius + bld.userData.radius + 0.35;
        return (dx*dx+dz*dz) >= (minDist*minDist);
      });
      if(ok){ bld.position.set(x,0,z); buildings.push(bld); scene.add(bld); placed=true; break; }
    }
    if(!placed){ /* crowd skip */ }
  }
}

/* ---------- Loop & controls ---------- */
let seed=(Math.random()*1e9)|0;
placeCity(seed);
addEventListener('resize', ()=>{ renderer.setSize(innerWidth, innerHeight); camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); });
addEventListener('keydown', (e)=>{
  if(e.code==='Space'){ seed=(Math.random()*1e9)|0; placeCity(seed); }
  if(e.key==='c' || e.key==='C'){ paletteIndex=(paletteIndex+1)%PALETTES.length; placeCity(seed); }
  if(e.key==='r' || e.key==='R'){ paletteIndex=(paletteIndex+1)%PALETTES.length; const pal=PALETTES[paletteIndex];
    scene.traverse(o=>{ if(o.userData&&o.userData.isBuilding&&o.userData.recolor){ o.userData.recolor(pal); }});
  }
});
(function animate(){ requestAnimationFrame(animate); controls.update(); renderer.render(scene,camera); })();
