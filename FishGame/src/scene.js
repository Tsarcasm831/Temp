import * as THREE from 'three';
export const appEl = document.getElementById('app');
export const renderer = new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,2)); 
renderer.setSize(innerWidth,innerHeight); 
appEl.appendChild(renderer.domElement);
export const scene = new THREE.Scene(); 
scene.background = new THREE.Color('#061226');
export const viewH = 22; 
export let viewW = viewH * innerWidth / innerHeight;
export const camera = new THREE.OrthographicCamera(-viewW/2,viewW/2,viewH/2,-viewH/2,0.1,100); 
camera.position.z=10;

const waterUniforms = { uTime: { value: 0 }, uSurfaceY: { value: 0 } };
const water = new THREE.Mesh(new THREE.PlaneGeometry(200,2400, 512, 64), new THREE.ShaderMaterial({
  uniforms: waterUniforms,
  depthWrite: false,
  vertexShader: 'uniform float uTime; uniform float uSurfaceY; varying vec2 vUv; varying float ny; void main(){vUv=uv; vec3 p=position; float t=uTime; float w1=0.12*sin(position.x*0.6+t*0.8); float w2=0.08*sin(position.x*1.7-t*1.4); float w3=0.05*sin(position.x*3.3+t*2.1); p.y+=w1+w2+w3; float dydx=0.12*0.6*cos(position.x*0.6+t*0.8)+0.08*1.7*cos(position.x*1.7-t*1.4)+0.05*3.3*cos(position.x*3.3+t*2.1); ny=normalize(vec3(-dydx,1.0,0.0)).y; vec4 wp=modelMatrix*vec4(p,1.0); wp.y=min(wp.y,uSurfaceY); gl_Position=projectionMatrix*viewMatrix*wp;} ',
  fragmentShader: 'uniform float uTime; varying vec2 vUv; varying float ny; void main(){float t=uTime; vec3 deep=vec3(0.02,0.09,0.18); vec3 shallow=vec3(0.10,0.22,0.36); float g=smoothstep(0.0,1.0,vUv.y); vec3 col=mix(deep,shallow,g); float band1=smoothstep(0.86,0.94, vUv.y+0.02*sin(vUv.x*12.0+t*0.8)); float band2=smoothstep(0.92,0.98, vUv.y+0.03*sin(vUv.x*22.0-t*1.6)); col+=0.12*(band1+band2); float fres=pow(1.0-clamp(ny*0.5+0.5,0.0,1.0),2.0); vec3 sky=vec3(0.12,0.18,0.28); col=mix(col,sky,0.15+0.35*fres); float gl=pow(max(0.0,sin((vUv.x+vUv.y*0.2)*50.0+t*3.0)),16.0)*0.22; col+=vec3(gl); gl_FragColor=vec4(col,1.0);} '
}));
water.position.y=0; 
scene.add(water);

export const seabedY = -1000; // ocean floor at -1000m to avoid any breaks down to -1000m
const floor = new THREE.Mesh(new THREE.PlaneGeometry(200,3), new THREE.MeshBasicMaterial({color:'#0a1628'})); 
floor.position.y=seabedY-1.5; 
scene.add(floor);

export const boatY = viewH/2 - 1.2; 
// replace simple boat with textured sprite
let boatReadyResolve; export const boatReady = new Promise(r=>boatReadyResolve=r);
const boatTex = new THREE.TextureLoader().load('assets/boat.png', tex=>{ const img=tex.image; const aspect=img?img.height/img.width:0.25; boat.geometry.dispose(); boat.geometry=new THREE.PlaneGeometry(6,6*aspect); const h=6*aspect; if(h>0){ waterLevelY = boat.position.y - h*0.5 - 0.06; if(waterLine) waterLine.position.y = waterLevelY; } boatReadyResolve?.(); });
boatTex.colorSpace = THREE.SRGBColorSpace;
const boat = new THREE.Mesh(new THREE.PlaneGeometry(6,1.5), new THREE.MeshBasicMaterial({map:boatTex, transparent:true}));
boat.position.set(0,boatY,0); boat.material.depthTest=false; boat.renderOrder=10;
scene.add(boat);

export let waterLevelY = boatY - 1.0;

export const anchor = new THREE.Vector2(0, boatY - 0.5);
export const sinker = new THREE.Mesh(new THREE.CircleGeometry(0.15,24), new THREE.MeshBasicMaterial({color:'#eab308'})); 
sinker.position.set(anchor.x,anchor.y,0.01); 
scene.add(sinker);

const lineMat = new THREE.LineBasicMaterial({color:0x94a3b8, transparent:true});
lineMat.depthTest = false; lineMat.opacity = 0.95; lineMat.depthWrite = false;
let lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(anchor.x,anchor.y,0.01), new THREE.Vector3(sinker.position.x,sinker.position.y,0.01)]);
export let line = new THREE.Line(lineGeo, lineMat); 
line.renderOrder = 90;
scene.add(line);

export const hook = new THREE.Mesh(new THREE.RingGeometry(0.18,0.26,20), new THREE.MeshBasicMaterial({color:'#d1d5db'})); 
hook.position.set(0,0,0.02); 
hook.material.depthTest = false; hook.renderOrder = 90;
scene.add(hook);

export const sliceMaterial = new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:0.8});
sliceMaterial.depthTest = false;
export let sliceGeom = new THREE.BufferGeometry().setFromPoints([]); 
export const sliceLine = new THREE.Line(sliceGeom, sliceMaterial); 
sliceLine.renderOrder = 999;
scene.add(sliceLine);

export function updateLine(){ 
  const pts=[new THREE.Vector3(anchor.x,anchor.y,0.01), new THREE.Vector3(sinker.position.x,sinker.position.y,0.01)]; 
  line.geometry.setFromPoints(pts); 
  hook.position.copy(sinker.position); 
}

export function toWorld(e){ 
  const rect=renderer.domElement.getBoundingClientRect(); 
  const nx=( (e.clientX-rect.left)/rect.width)*2-1; 
  const ny=-( (e.clientY-rect.top)/rect.height)*2+1; 
  return new THREE.Vector3(nx,ny,0).unproject(camera); 
}

export function handleResize(){ 
  renderer.setSize(innerWidth,innerHeight); 
  viewW = viewH * innerWidth / innerHeight; 
  camera.left=-viewW/2; 
  camera.right=viewW/2; 
  camera.top=viewH/2; 
  camera.bottom=-viewH/2; 
  camera.updateProjectionMatrix(); 
}

const waterLine = new THREE.Mesh(new THREE.PlaneGeometry(200,0.06), new THREE.MeshBasicMaterial({color:'#ffffff', transparent:true, opacity:0.18, depthTest:false}));
waterLine.position.set(0, waterLevelY, 0.05);
waterLine.renderOrder = 5;
scene.add(waterLine);

export function updateWater(dt){ 
  const u = water.material.uniforms;
  if(u && u.uTime){ u.uTime.value += dt; u.uSurfaceY.value = waterLevelY; const t=u.uTime.value; waterLine.position.y = waterLevelY + Math.sin(t*1.3)*0.03; waterLine.material.opacity = 0.12 + 0.06*Math.sin(t*2.1); }
}