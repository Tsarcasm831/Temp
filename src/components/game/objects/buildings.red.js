// buildings.red.js
export function addRedBuildings(town, { THREE, kit }) {
    const { makeBuilding, Palette } = kit;
    const group = new THREE.Group(); group.name = "RedBuildings";
  
    group.add(makeBuilding({
      name: "A1", w: 60, d: 40, floors: 2,
      roofType: "gable", roofColor: Palette.roofRed,
      balcony: true, sign: true,
      position: [-220, 0, -40], rotationY: Math.PI * 0.02
    }));
  
    group.add(makeBuilding({
      name: "A5", w: 58, d: 40, floors: 2,
      roofType: "gable", roofColor: Palette.roofRed,
      balcony: true,
      position: [60, 0, -40], rotationY: -0.06
    }));
  
    group.add(makeBuilding({
      name: "B4", w: 64, d: 44, floors: 2,
      roofType: "gable", roofColor: Palette.roofRed,
      position: [10, 0, 64]
    }));
  
    group.add(makeBuilding({
      name: "C4", w: 60, d: 44, floors: 2,
      roofType: "gable", roofColor: Palette.roofRed,
      sign: true,
      position: [20, 0, 160]
    }));
  
    town.add(group);
    return group;
  }
  