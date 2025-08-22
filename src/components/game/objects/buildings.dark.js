// buildings.dark.js
// Flat-roof / dark variants.
export function addDarkBuildings(town, { THREE, kit }) {
    const { makeBuilding, Palette } = kit;
    const group = new THREE.Group(); group.name = "DarkBuildings";
  
    group.add(makeBuilding({
      name: "A3", w: 52, d: 38, floors: 2,
      roofType: "flat", roofColor: Palette.roofDark,
      position: [-90, 0, -36]
    }));
  
    town.add(group);
    return group;
  }
  