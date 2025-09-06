import * as THREE from 'three';
import { scene } from './scene.js';
import { rand } from './utils.js';

/* replace static base fish with dynamic konoha specs */
export let FISH_TYPES = [];
const SPECIAL_NAME_TO_FILE = {
  'Dorado (Mahi-Mahi)': 'dorado.png',
  'Sea Bass': 'sea_bass.png',
  'Red Drum': 'red_drum.png',
  'Bigeye Tuna': 'bigeye_tuna.png',
  'Deep Sea Smelt': 'deep_sea_smelt.png',
  'Roughy (Orange)': 'roughy_orange.png'
};

export const loader = new THREE.TextureLoader();
/* add per-texture alpha mask cache */
export const alphaCache = new Map();

export async function loadKonohaFish(){
  const resp = await fetch('konoha_riverbank.json', { cache: 'no-cache' });
  const list = await resp.json();
  const rarSpeed = r => r==='Common'?[0.8,1.6]:r==='Uncommon'?[0.6,1.4]:r==='Rare'?[0.5,1.2]:r==='Epic'?[0.4,1.0]:[0.3,0.8];
  const toDepth = s => { const m = s.match(/(-?\d+)[^\d]+(-?\d+)/); if(!m) return [ -4, -12 ]; return [ -Number(m[1]), -Number(m[2]) ].sort((a,b)=>a-b); };
  const radiusFromMaxKg = kg => Math.min(1.2, 0.35 + Math.log10((kg||1)+1)*0.28);
  FISH_TYPES = list.map(f=>{
    const fn = SPECIAL_NAME_TO_FILE[f.name] || f.name.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'') + '.png';
    return {
      name: f.name,
      color: '#ffffff',
      radius: radiusFromMaxKg(f.weightKg?.max),
      speed: rarSpeed(f.rarity),
      value: Math.round(((f.baseValue?.min||1)+(f.baseValue?.max||5))/2),
      depth: toDepth(f.depthRange),
      tex: `assets/konoha_riverbank/fish/${fn}`,
      invertX: false,
      rarity: f.rarity || 'Common'
    };
  });
  buildWeightedSpecs();
}

export const textureCache = new Map();
export function preloadFishTextures(){
  return Promise.all(FISH_TYPES.map(spec=>new Promise(res=>{
    if(textureCache.has(spec.tex)) return res();
    loader.load(spec.tex, tex=>{ 
      tex.colorSpace=THREE.SRGBColorSpace; 
      tex.minFilter=THREE.LinearFilter; 
      tex.magFilter=THREE.LinearFilter; 
      tex.generateMipmaps=false; 
      textureCache.set(spec.tex, tex);
      // build alpha mask
      try{ const c=document.createElement('canvas'); c.width=tex.image.width; c.height=tex.image.height;
        const ctx=c.getContext('2d'); ctx.drawImage(tex.image,0,0); const img=ctx.getImageData(0,0,c.width,c.height);
        alphaCache.set(spec.tex, {data:img.data, w:c.width, h:c.height});
      }catch(e){}
      res(); 
    }, ()=>res());
  })));
}

const rarityWeight = r => r==='Common'?40:r==='Uncommon'?20:r==='Rare'?6:r==='Epic'?3:r==='Legendary'?1:10;
let WEIGHTED_SPECS = [];
function buildWeightedSpecs(){
  WEIGHTED_SPECS.length = 0;
  for(const s of FISH_TYPES){ const w = rarityWeight(s.rarity); for(let i=0;i<w;i++) WEIGHTED_SPECS.push(s); }
}

export class Fish {
  constructor(spec, viewW){
    this.spec=spec;
    const size = spec.radius * 2.2;
    const cached = textureCache.get(spec.tex);
    let map, texAspect = 1; // width/height
    if(cached){
      map = cached;
      texAspect = (cached.image && cached.image.height) ? (cached.image.width / cached.image.height) : 1;
    }else{
      map = loader.load(spec.tex, (tex)=>{ 
        const img=tex.image; const a = img && img.height ? (img.width / img.height) : 1; 
        tex.colorSpace = THREE.SRGBColorSpace; tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter; tex.generateMipmaps = false;
        const w=size*a, h=size; this.mesh.geometry.dispose(); this.mesh.geometry = new THREE.PlaneGeometry(w,h); 
        this.baseW = w; this.baseH = h;
        // ensure alpha mask exists
        try{ const c=document.createElement('canvas'); c.width=img.width; c.height=img.height; const ctx=c.getContext('2d'); ctx.drawImage(img,0,0); const id=ctx.getImageData(0,0,c.width,c.height); alphaCache.set(spec.tex,{data:id.data,w:c.width,h:c.height}); }catch(e){}
      });
    }
    map.colorSpace = THREE.SRGBColorSpace; map.minFilter = THREE.LinearFilter; map.magFilter = THREE.LinearFilter; map.generateMipmaps = false;
    this.mesh=new THREE.Mesh(new THREE.PlaneGeometry(size*texAspect, size), new THREE.MeshBasicMaterial({map, transparent:true}));
    this.mesh.position.set(rand(-viewW/2+1, viewW/2-1), rand(spec.depth[0], spec.depth[1]), 0);
    this.speed = (Math.random()<0.5?-1:1) * rand(spec.speed[0], spec.speed[1]);
    this.alive=true; this.attached=false; scene.add(this.mesh);
    this.baseFlip = spec.invertX ? -1 : 1;
    this.mesh.scale.x = (this.speed >= 0 ? -1 : 1) * this.baseFlip;
  }
  aabb(){ const p=this.mesh.position; return {x:p.x,y:p.y,r:this.spec.radius}; }
  hitTestPoint(px,py){
    const mask = alphaCache.get(this.spec.tex);
    const sx = Math.abs(this.mesh.scale.x)||1, sy = Math.abs(this.mesh.scale.y)||1;
    const halfW = (this.baseW||1)*0.5*sx, halfH = (this.baseH||1)*0.5*sy;
    const dx = px - this.mesh.position.x, dy = py - this.mesh.position.y;
    if(Math.abs(dx)>halfW || Math.abs(dy)>halfH) return false;
    if(!mask){ return (dx*dx + dy*dy) <= (this.spec.radius+0.2)*(this.spec.radius+0.2); }
    const u = (dx/ (2*halfW)) + 0.5, v = 0.5 - (dy/ (2*halfH));
    const ix = Math.max(0, Math.min(mask.w-1, (u*mask.w)|0));
    const iy = Math.max(0, Math.min(mask.h-1, (v*mask.h)|0));
    const idx = (iy*mask.w + ix)*4; return mask.data[idx+3] > 10;
  }
  update(dt, viewW){
    if(!this.alive || this.attached) return;
    const p=this.mesh.position; p.x += this.speed*dt*3;
    if(p.x < -viewW/2+1){p.x = -viewW/2+1; this.speed=Math.abs(this.speed); this.mesh.scale.x = -1 * this.baseFlip; }
    if(p.x >  viewW/2-1){p.x =  viewW/2-1; this.speed=-Math.abs(this.speed); this.mesh.scale.x = 1 * this.baseFlip; }
  }
  dispose(){ scene.remove(this.mesh); this.mesh.geometry.dispose(); this.mesh.material.dispose(); }
}

export const fishPool = new Set();
export function spawnFishRow(viewW){
  const rolls = 8;
  for(let i=0;i<rolls;i++){
    const spec = WEIGHTED_SPECS.length ? WEIGHTED_SPECS[(Math.random()*WEIGHTED_SPECS.length)|0] : FISH_TYPES[0];
    if(!spec) continue;
    fishPool.add(new Fish(spec, viewW));
  }
}
export function clearFish(){ for(const f of fishPool){ f.dispose(); } fishPool.clear(); }