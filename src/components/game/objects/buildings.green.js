// buildings.green.js
export function addGreenBuildings(town, { THREE, kit }) {
    const { makeBuilding, Palette } = kit;
    const group = new THREE.Group(); group.name = "GreenBuildings";
  
    group.add(makeBuilding({
      name: "B6", w: 50, d: 36, floors: 2,
      roofType: "hip", roofColor: Palette.roofGreen,
      position: [130, 0, 60]
    }));
  
    group.add(makeBuilding({
      name: "C1_gate", w: 100, d: 32, floors: 1,
      roofType: "hip", roofColor: Palette.roofGreen,
      position: [-250, 0, 160]
    }));
  
    group.add(makeBuilding({
      name: "C6_cone", w: 60, d: 60, floors: 2,
      round: true, cone: true,
      roofColor: Palette.roofGreen,
      position: [170, 0, 160]
    }));
  
    town.add(group);
    return group;
  }
  