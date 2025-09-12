import { DEFAULT_MODEL } from './user-defaults.js';
let BASE_MODEL = DEFAULT_MODEL;
try{
  const saved = localStorage.getItem('konoha-default-model');
  if(saved){ BASE_MODEL = JSON.parse(saved); }
}catch{}
export const MODEL = BASE_MODEL;

export const state = {
  mode:'select', edit:false, snap:false,
  selected:null, 
  drawing:null, 
  addingPOI:false,
  brush:{
    road:{type:'street', width:4},
    river:{width:7},
    forest:{width:40},
    mountain:{shape:'line', width:10, triSize:8}
  },
  locks:{ districtsLocked:false, poiLocked:true } // lock POIs & districts
};

// ensure rivers array exists for new feature
// remove all rivers
MODEL.rivers = [];
// delete district-9 from defaults if present
if (MODEL?.districts && MODEL.districts['district-9']) { delete MODEL.districts['district-9']; }
// ensure paint layers exist
if(!Array.isArray(MODEL.grass)) MODEL.grass = [];
if(!Array.isArray(MODEL.forest)) MODEL.forest = [];
if(!Array.isArray(MODEL.mountains)) MODEL.mountains = [];

// Ensure a visible grass mark at grid LI300
// Note: Some users may have a saved default model in localStorage which overrides code defaults.
// This guarantees the requested grass shows up even when a saved default exists.
try{
  const target = { id:'grass-1', width:60, points:[[53.42,49.92],[53.58,49.92]] };
  const close = (a,b,t=0.2)=>Math.abs(a-b)<=t;
  const has = (MODEL.grass||[]).some(g=>{
    const p=g?.points?.[0];
    return p && close(p[0], target.points[0][0]) && close(p[1], target.points[0][1]);
  });
  if(!has){ MODEL.grass.push(target); }
}catch{}
