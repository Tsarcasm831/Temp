import * as THREE from 'three';
import { clamp, rand, lerp, dist2, segPointDist } from './utils.js';
import { toast, updateHUD, showCTA, hideCTA } from './hud.js';
import { renderer, scene, camera, viewH, handleResize, anchor, sinker, hook, updateLine, sliceLine, sliceGeom, seabedY, boatY, toWorld as toWorldScene, updateWater, waterLevelY, boatReady } from './scene.js';
import { fishPool, spawnFishRow, clearFish, preloadFishTextures, loadKonohaFish } from './fish.js';
import { setupInput } from './input.js';
import { initJournal, recordDiscovery } from './journal.js';

const Phase = { READY:'READY', DESCENT:'DESCENT', ASCENT:'ASCENT', SLICE:'SLICE' };
let phase = Phase.READY, score=0, runCaught=[], MAX_CAUGHT=10;
const ABSOLUTE_MAX_DEPTH = -10000; let maxUnlockedDepth = -10; const DEPTH_UNLOCK_STEP = 100;
/* add slice-based depth progression */
let depthLevel = 0;
const BASE_SLICE_REQ = 10, SLICE_GROWTH = 1.3;
const sliceThreshold = () => Math.ceil(BASE_SLICE_REQ * Math.pow(SLICE_GROWTH, depthLevel));
let cutCountThisSlicePhase = 0;
/* track cuts during a single drag */
let cutsThisDrag = 0;
/* trail for slicing */
const trailDots = [];
const DOWN_SPEED=6.5, UP_SPEED=7.5;
const gravity=-18; let airborne=[]; let slicePoints=[];

const SLICE_OFFSET = viewH; let targetCamY = 0;
const depthEls = { val: document.getElementById('depthVal'), bottom: document.getElementById('depthBottom'), marker: document.getElementById('depthMarker') };
const loadingEl = document.getElementById('loading'); const loadingStatus = document.getElementById('loadingStatus');
const setLoading = (t)=>{ if(loadingStatus) loadingStatus.textContent=t; }; const hideLoading=()=>{ if(loadingEl) loadingEl.style.display='none'; };

function setPhase(p){ phase=p; updateHUD({phase,score,caught:runCaught.length}); }
function setScore(v){ score=v|0; updateHUD({phase,score,caught:runCaught.length}); }
function setCaughtCount(){ updateHUD({phase,score,caught:runCaught.length}); }

function resetAll(){
  setPhase(Phase.READY); runCaught.length=0; setCaughtCount();
  clearFish(); spawnFishRow(viewW());
  airborne.length=0; slicePoints.length=0; sliceGeom.setFromPoints([]);
  sinker.position.set(anchor.x,anchor.y,0.01); hook.position.copy(sinker.position); updateLine(); showCTA();
  targetCamY = 0; maxUnlockedDepth = -10; // reset progression on hard reset
  depthLevel = 0; cutCountThisSlicePhase = 0; updateDepthUI();
}

function viewW(){ return viewH * innerWidth / innerHeight; }

function castOrReel(){
  if(phase===Phase.READY){ hideCTA(); setPhase(Phase.DESCENT); toast('Dropping line…','#93c5fd'); 
    if(maxUnlockedDepth < -10) targetCamY = (sinker.position.y <= -5) ? sinker.position.y : 0;
    return; 
  }
  if(phase===Phase.DESCENT){ setPhase(Phase.ASCENT); toast('Reeling in!','#a7f3d0'); if(maxUnlockedDepth < -10) targetCamY = (sinker.position.y <= -5) ? sinker.position.y : 0; else targetCamY = 0; return; }
}

setupInput({
  onCastOrReel: ()=>{ if(phase===Phase.READY||phase===Phase.DESCENT) castOrReel(); },
  onSliceStart: (w)=>{ if(phase===Phase.SLICE){ slicePoints.push(world2(w)); cutsThisDrag = 0; } },
  onSliceMove: (w)=>{ 
    if(phase===Phase.SLICE){ 
      const p=world2(w); 
      slicePoints.push(p); 
      if(slicePoints.length>32) slicePoints.shift(); 
      sliceGeom.setFromPoints(slicePoints.map(p=>new THREE.Vector3(p.x,p.y,0))); 
      addTrailDot(p.x, p.y); 
      checkCuts(); 
    } 
  },
  onSliceEnd: ()=>{ if(phase===Phase.SLICE){ toast(cutsThisDrag>0?'Sliced!':'Miss! ', cutsThisDrag>0?'#facc15':'#94a3b8'); } },
  onResetRun: ()=>{ runCaught.length=0; setCaughtCount(); setPhase(Phase.READY); sinker.position.set(anchor.x,anchor.y,0.01); updateLine(); showCTA(); targetCamY = 0; cutCountThisSlicePhase = 0; },
  onHardReset: ()=>{ resetAll(); setScore(0); },
  toWorldFn: (e)=> toWorldScene(e),
  onLateralMove: (p)=>{ 
    if(phase===Phase.DESCENT){ 
      const half = viewW()/2 - 1; 
      sinker.position.x = clamp(p.x, -half, half); 
      updateLine(); 
    } 
  }
});

function world2(v3){ return {x:v3.x, y:v3.y}; }

function checkCuts(){
  if(slicePoints.length<2) return;
  for(let ai=0; ai<airborne.length; ai++){
    const it=airborne[ai]; if(it.cut) continue;
    const p=it.mesh.position;
    const scaleMul = Math.max(Math.abs(it.mesh.scale.x), Math.abs(it.mesh.scale.y));
    const r = it.spec.radius * scaleMul * 1.05;
    for(let i=1;i<slicePoints.length;i++){
      const a=slicePoints[i-1], b=slicePoints[i];
      if(segPointDist({x:p.x,y:p.y}, a, b) <= r){
        it.cut=true; it.mesh.material.color.set('#fca5a5'); setScore(score + it.spec.value); toast(`CUT +${it.spec.value}`, '#facc15');
        cutCountThisSlicePhase++; cutsThisDrag++;
        break;
      }
    }
  }
}

const clock=new THREE.Clock(); updateHUD({phase,score,caught:0});
updateDepthUI();

function updateDepthUI(){ const el=document.getElementById('depthLimit'); if(el) el.textContent = (maxUnlockedDepth|0); }
function devAdjustDepth(dir){
  const before = maxUnlockedDepth;
  maxUnlockedDepth = Math.max(ABSOLUTE_MAX_DEPTH, Math.min(-10, maxUnlockedDepth + (dir>0?DEPTH_UNLOCK_STEP:-DEPTH_UNLOCK_STEP)));
  if(maxUnlockedDepth!==before){ toast(`Depth limit: ${maxUnlockedDepth}m`, '#93c5fd'); updateDepthUI(); }
  if(phase===Phase.DESCENT && sinker.position.y <= maxUnlockedDepth){ setPhase(Phase.ASCENT); toast('Hit depth limit — reeling!','#a7f3d0'); }
}

/* add button bindings for dev depth */
document.getElementById('depthDec')?.addEventListener('click', ()=>devAdjustDepth(-1)); // deeper
document.getElementById('depthInc')?.addEventListener('click', ()=>devAdjustDepth(1));  // shallower

function updateDepthMeter(){
  const surfaceY = waterLevelY;
  const bottomY = Math.min(maxUnlockedDepth, seabedY);
  const span = (surfaceY - bottomY) || 1;
  const h = depthEls.marker?.parentElement?.clientHeight || 200;
  const depthPos = surfaceY - sinker.position.y; // positive meters
  const t = Math.max(0, Math.min(1, depthPos / span));
  const y = t * h;
  if(depthEls.marker){ depthEls.marker.style.top = `${y|0}px`; }
  if(depthEls.val){ depthEls.val.textContent = `${depthPos.toFixed(1)}m`; }
  if(depthEls.bottom){ depthEls.bottom.textContent = `${maxUnlockedDepth}m`; }
}

function gameLoop(){
  const dt=Math.min(clock.getDelta(),0.033);
  updateWater(dt);
  updateDepthMeter();

  if(phase===Phase.DESCENT){
    sinker.position.y -= DOWN_SPEED*dt;
    if(maxUnlockedDepth < -10) targetCamY = (sinker.position.y <= -5) ? sinker.position.y : 0;
    // auto reel on first hook during descent
    for(const f of fishPool){ if(!f.alive||f.attached) continue;
      const p=sinker.position;
      if(f.hitTestPoint(p.x,p.y) && runCaught.length<MAX_CAUGHT){
        recordDiscovery(f.spec);
        f.attached=true; runCaught.push(f); setCaughtCount(); setPhase(Phase.ASCENT);
        toast(`Hooked ${f.spec.name}! Reeling…`,'#a7f3d0'); if(maxUnlockedDepth < -10) targetCamY = (sinker.position.y <= -5) ? sinker.position.y : 0; break;
      }
    }
    if(sinker.position.y <= maxUnlockedDepth){ setPhase(Phase.ASCENT); toast('Hit depth limit — reeling!','#a7f3d0'); if(maxUnlockedDepth < -10) targetCamY = (sinker.position.y <= -5) ? sinker.position.y : 0; else targetCamY = 0; }
    updateLine();
  } else if(phase===Phase.ASCENT){
    sinker.position.y += UP_SPEED*dt;
    if(maxUnlockedDepth < -10) targetCamY = (sinker.position.y <= -5) ? sinker.position.y : 0;
    for(const f of fishPool){
      if(!f.alive || f.attached) continue;
      const p=sinker.position;
      if(f.hitTestPoint(p.x,p.y)){ if(runCaught.length<MAX_CAUGHT){ recordDiscovery(f.spec); f.attached=true; runCaught.push(f); setCaughtCount(); toast(`Hooked ${f.spec.name}!`,'#93c5fd'); } }
    }
    for(let i=0;i<runCaught.length;i++){
      const f=runCaught[i], t=i*0.4+0.3, denom=(runCaught.length*0.4+0.7);
      const target=new THREE.Vector3(lerp(sinker.position.x,anchor.x,t/denom), lerp(sinker.position.y,anchor.y,t/denom),0);
      f.mesh.position.lerp(target,0.5);
    }
    if(sinker.position.y >= anchor.y){
      sinker.position.y=anchor.y; updateLine();
      if(runCaught.length>0){
        setPhase(Phase.SLICE); targetCamY = SLICE_OFFSET; airborne.length=0; cutCountThisSlicePhase = 0;
        for(const f of runCaught){
          f.attached=false; f.alive=true; f.mesh.position.set(rand(-2,2), boatY-0.5 + SLICE_OFFSET, 0.6); f.mesh.material.color.set('#ffffff');
          f.mesh.scale.multiplyScalar(1.3);
          f.mesh.renderOrder = 50; f.mesh.material.depthTest = false;
          airborne.push({mesh:f.mesh, vel:{x:rand(-2.5,2.5), y:rand(6.5,9.5)}, spec:f.spec, cut:false});
        }
        runCaught.length=0; setCaughtCount(); toast('SLICE! Drag to cut fish!','#f472b6');
      } else {
        setPhase(Phase.READY); showCTA(); targetCamY = 0; toast('No fish hooked — try again','#94a3b8');
      }
    }
    updateLine();
  } else if(phase===Phase.SLICE){
    for(const it of airborne){ const p=it.mesh.position; it.vel.y += gravity*dt; p.x += it.vel.x*dt; p.y += it.vel.y*dt; }
    /* update slice trail dots */
    for(let i=trailDots.length-1;i>=0;i--){
      const t=trailDots[i]; t.life -= dt; 
      t.mesh.material.opacity = Math.max(0, t.life / t.maxLife);
      t.mesh.scale.multiplyScalar(1 - dt*3);
      if(t.life<=0){ scene.remove(t.mesh); t.mesh.geometry.dispose(); t.mesh.material.dispose(); trailDots.splice(i,1); }
    }
    for(let i=airborne.length-1;i>=0;i--){
      const it=airborne[i], p=it.mesh.position;
      if(p.y < seabedY-1 + SLICE_OFFSET){
        if(!it.cut){ const half=Math.floor(it.spec.value*0.5); setScore(score + half); toast(`UNCUT +${half}`,'#60a5fa'); }
        scene.remove(it.mesh); it.mesh.geometry.dispose(); it.mesh.material.dispose(); airborne.splice(i,1);
      }
    }
    if(airborne.length===0){ setPhase(Phase.READY); showCTA(); spawnFishRow(viewW()); slicePoints.length=0; sliceGeom.setFromPoints([]); targetCamY = 0;
      const needed = sliceThreshold();
      if(cutCountThisSlicePhase >= needed && maxUnlockedDepth > ABSOLUTE_MAX_DEPTH){
        const before = -maxUnlockedDepth;
        maxUnlockedDepth = Math.max(ABSOLUTE_MAX_DEPTH, maxUnlockedDepth - DEPTH_UNLOCK_STEP);
        if(-maxUnlockedDepth !== before){ depthLevel++; toast(`Depth unlocked to ${-maxUnlockedDepth}m (Level ${depthLevel})`, '#93c5fd'); }
      } else {
        toast(`Cut ${cutCountThisSlicePhase}/${needed} — slice more to unlock depth`, '#94a3b8');
      }
    }
  }

  for(const f of fishPool){ if(!f.attached) f.update(dt, viewW()); }

  renderer.render(scene,camera); requestAnimationFrame(gameLoop);
  camera.position.y += (targetCamY - camera.position.y) * Math.min(1, dt*6);
}

async function init(){ 
  setLoading('Fetching fish lists…');
  await cacheFishLists();
  setLoading('Loading fish specs…');
  await loadKonohaFish();
  setLoading('Preloading textures…');
  await Promise.all([preloadFishTextures()]);
  initJournal();
  spawnFishRow(viewW()); requestAnimationFrame(gameLoop); toast('Ready!','#93c5fd'); 
  hideLoading();
}

async function cacheFishLists(){
  try{
    const cache = await caches.open('ninja-fishing-v1');
    const key = new Request('/data/fish_lists.json');
    const hit = await cache.match(key);
    if(hit){ setLoading('Fish lists loaded from cache'); return; }
    const resp = await fetch('/json/fish_lists.json', {cache:'no-cache'});
    const data = await resp.json();
    const body = JSON.stringify(data);
    const cachedResp = new Response(body, {headers:{'Content-Type':'application/json','Cache-Control':'max-age=31536000'}});
    await cache.put(key, cachedResp);
    setLoading('Fish lists cached');
  }catch(e){ setLoading('Fish lists load failed (offline?)'); }
}

init();

/* helper to spawn a fading trail dot */
function addTrailDot(x,y){
  const geo = new THREE.CircleGeometry(0.08, 16);
  const mat = new THREE.MeshBasicMaterial({color:0xffffff, transparent:true, opacity:0.9, depthTest:false});
  const m = new THREE.Mesh(geo, mat); m.position.set(x,y,0.9); m.renderOrder=999;
  scene.add(m);
  trailDots.push({mesh:m, life:0.35, maxLife:0.35});
}