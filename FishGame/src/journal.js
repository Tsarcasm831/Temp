import { FISH_TYPES } from './fish.js';
let discovered = new Set(); 
const modal=document.getElementById('journalModal'); 
const content=document.getElementById('journalContent');
export function initJournal(){ 
  document.getElementById('fishLibraryBtn')?.addEventListener('click',openJournal); 
  document.getElementById('journalClose')?.addEventListener('click',closeJournal); 
  modal?.addEventListener('click',e=>{ if(e.target===modal) closeJournal(); }); 
}
export function recordDiscovery(spec){ 
  if(spec?.name) discovered.add(spec.name); 
}
export function openJournal(){ 
  if(!modal) return; 
  render(); 
  modal.style.display='flex'; 
  modal.setAttribute('aria-hidden','false'); 
}
export function closeJournal(){ 
  if(!modal) return; 
  modal.style.display='none'; 
  modal.setAttribute('aria-hidden','true'); 
}
function render(){ 
  if(!content) return; 
  content.innerHTML=''; 
  (FISH_TYPES||[]).forEach(s=>{ 
    const known=discovered.has(s.name); 
    const el=document.createElement('div'); 
    el.className='j-card'; 
    el.innerHTML=`<img src="${s.tex}" alt="${s.name}" ${known?'':'style="filter:grayscale(1) brightness(0.25) opacity(0.6) drop-shadow(0 0 0 transparent)"'}><div class="meta"><span>${known?s.name:'????'}</span><span>${s.rarity||''}</span></div><div class="meta"><span>Depth</span><span>${Math.abs(s.depth[0])}–${Math.abs(s.depth[1])}m</span></div>`; 
    content.appendChild(el); 
  }); 
}