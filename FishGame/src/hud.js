export function toast(msg, color="#cbd5e1"){
  const t=document.createElement('div'); t.className='chip'; t.textContent=msg; t.style.color=color;
  document.getElementById('toast').appendChild(t); setTimeout(()=>t.remove(),1600);
}
export const setPhaseText = v => document.getElementById('phase').textContent = v;
export const setScoreText = v => document.getElementById('score').textContent = v|0;
export const setCaughtText = v => document.getElementById('caught').textContent = v|0;
export const showCTA = () => { const el=document.getElementById('cta'); if(el) el.style.display=''; };
export const hideCTA = () => { const el=document.getElementById('cta'); if(el) el.style.display='none'; };
export function updateHUD({phase,score,caught}){ setPhaseText(phase); setScoreText(score); setCaughtText(caught); }

