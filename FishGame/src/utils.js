export const clamp = (v,min,max)=>Math.max(min,Math.min(max,v));
export const rand = (a=0,b=1)=>a+Math.random()*(b-a);
export const lerp = (a,b,t)=>a+(b-a)*t;
export function dist2(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
export function segPointDist(p,a,b){
  const ap={x:p.x-a.x,y:p.y-a.y}, ab={x:b.x-a.x,y:b.y-a.y};
  const ab2=ab.x*ab.x+ab.y*ab.y||1e-9, t=clamp((ap.x*ab.x+ap.y*ab.y)/ab2,0,1);
  const proj={x:a.x+t*ab.x,y:a.y+t*ab.y}; return Math.hypot(p.x-proj.x,p.y-proj.y);
}

