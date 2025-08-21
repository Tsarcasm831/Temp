import { DEFAULT_MODEL } from './user-defaults.js';
export const MODEL = DEFAULT_MODEL;

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
  }
};

// ensure rivers array exists for new feature
if(!Array.isArray(MODEL.rivers)) MODEL.rivers = [];
// ensure paint layers exist
if(!Array.isArray(MODEL.grass)) MODEL.grass = [];
if(!Array.isArray(MODEL.forest)) MODEL.forest = [];
if(!Array.isArray(MODEL.mountains)) MODEL.mountains = [];