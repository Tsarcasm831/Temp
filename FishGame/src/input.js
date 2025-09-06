import { renderer, camera } from './scene.js';

function worldFromEvent(e){
  const rect=renderer.domElement.getBoundingClientRect();
  const nx=( (e.clientX-rect.left)/rect.width)*2-1;
  const ny=-( (e.clientY-rect.top)/rect.height)*2+1;
  return { x: camera.position.z && camera.unproject ? camera.unproject({}) && 0 : new Error(), v: new Error() }; // placeholder unused
}
export function toWorld(e){
  const rect=renderer.domElement.getBoundingClientRect();
  const nx=( (e.clientX-rect.left)/rect.width)*2-1;
  const ny=-( (e.clientY-rect.top)/rect.height)*2+1;
  const v = new THREE.Vector3(nx,ny,0); // will be replaced in app via scene.toWorld
  return {nx,ny,rect,v};
}

export function setupInput({onCastOrReel,onSliceStart,onSliceMove,onSliceEnd,onResetRun,onHardReset,toWorldFn,onLateralMove}){
  let pressing=false;
  renderer.domElement.addEventListener('pointerdown', (e)=>{ pressing=true; onCastOrReel?.(); onSliceStart?.(toWorldFn(e)); });
  renderer.domElement.addEventListener('pointerup', ()=>{ pressing=false; onSliceEnd?.(); });
  renderer.domElement.addEventListener('pointermove', (e)=>{ if(pressing) onSliceMove?.(toWorldFn(e)); });
  renderer.domElement.addEventListener('pointermove', (e)=>{ onLateralMove?.(toWorldFn(e)); });
  addEventListener('keydown',(e)=>{
    if(e.key==='f'||e.key==='F'){ onCastOrReel?.(); }
    if(e.key==='r'||e.key==='R'){ onResetRun?.(); }
    if(e.key==='Escape'){ onHardReset?.(); }
  });
}