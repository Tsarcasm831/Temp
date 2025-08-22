// buildings.yellow.js
export function addYellowBuildings(town, { THREE, kit }) {
    const { makeBuilding, Palette } = kit;
    const group = new THREE.Group(); group.name = "YellowBuildings";
  
    group.add(makeBuilding({
      name: "A2", w: 46, d: 34, floors: 2,
      roofType: "hip", roofColor: Palette.roofYellow,
      sign: true, position: [-150, 0, -30]
    }));
  
    group.add(makeBuilding({
      name: "B1", w: 70, d: 44, floors: 2,
      roofType: "hip", roofColor: Palette.roofYellow,
      position: [-220, 0, 60]
    }));
  
    group.add(makeBuilding({
      name: "B2_rotunda", w: 70, d: 70, floors: 2,
      round: true,
      roofColor: Palette.roofYellow,
      position: [-140, 0, 60]
    }));
  
    group.add(makeBuilding({
      name: "C2", w: 62, d: 40, floors: 2,
      roofType: "gable", roofColor: Palette.roofYellow,
      balcony: true,
      position: [-150, 0, 160]
    }));
  
    group.add(makeBuilding({
      name: "C5", w: 50, d: 36, floors: 2,
      roofType: "hip", roofColor: Palette.roofYellow,
      position: [90, 0, 160]
    }));
  
    town.add(group);
    return group;
  }
  