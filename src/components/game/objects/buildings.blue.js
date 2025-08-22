// buildings.blue.js
export function addBlueBuildings(town, { THREE, kit }) {
    const { makeBuilding, Palette } = kit;
    const group = new THREE.Group(); group.name = "BlueBuildings";
  
    group.add(makeBuilding({
      name: "A4_rotunda", w: 64, d: 64, floors: 2,
      round: true,
      roofColor: Palette.roofBlue,
      position: [-10, 0, -40]
    }));
  
    group.add(makeBuilding({
      name: "A6", w: 48, d: 36, floors: 2,
      roofType: "hip", roofColor: Palette.roofBlue,
      sign: true,
      position: [120, 0, -36]
    }));
  
    group.add(makeBuilding({
      name: "B3", w: 56, d: 42, floors: 3,
      roofType: "gable", roofColor: Palette.roofBlue,
      balcony: true, sign: true,
      position: [-60, 0, 62]
    }));
  
    group.add(makeBuilding({
      name: "B5", w: 48, d: 36, floors: 2,
      roofType: "hip", roofColor: Palette.roofBlue,
      sign: true,
      position: [70, 0, 62]
    }));
  
    group.add(makeBuilding({
      name: "C3_rotundaTall", w: 72, d: 72, floors: 3,
      round: true,
      roofColor: Palette.roofBlue,
      position: [-60, 0, 160]
    }));
  
    town.add(group);
    return group;
  }
  