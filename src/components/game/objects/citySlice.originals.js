// citySlice.originals.js
// First 15 buildings (kept from "originals" in buildings2.html). Returns an array of Groups.
export function buildOriginals(THREE, kit, ex) {
  const P = kit.Palette;
  const {
    pagoda, drumTower, terrace, bathhouse, gatehouse, libraryTower
  } = ex;

  // Helper to assign numbered names per base type to ensure readable base names
  const counts = Object.create(null);
  const nameOf = (base) => {
    counts[base] = (counts[base] || 0) + 1;
    return counts[base] === 1 ? base : `${base} ${counts[base]}`;
  };

  const b1  = pagoda({w:92,d:68,tiers:3,roofColor:P.roofOrange,plaster:"B"}); b1.name  = nameOf('Pagoda');
  const b2  = drumTower({r:34,floors:3,roofColor:P.roofBlue,beltColor:P.vermilion,plaster:"A"}); b2.name  = nameOf('Drum Tower');
  const b3  = terrace({w:96,d:48,floors:2,roofColor:P.roofClay,plaster:"C"}); b3.name  = nameOf('Terrace House');
  const b4  = bathhouse({w:88,d:56,r:30,roofMain:P.roofTeal,roofSides:P.roofTerracotta,plaster:"B"}); b4.name  = nameOf('Bathhouse');
  const b5  = gatehouse({w:96,d:40,roofColor:P.roofTerracotta,coneColor:P.roofSea,plaster:"A"}); b5.name  = nameOf('Gatehouse');

  const b6  = pagoda({w:86,d:62,tiers:4,roofColor:P.roofTerracotta,plaster:"A"}); b6.name  = nameOf('Pagoda');
  const b7  = libraryTower({r:22,floors:5,roofColor:P.roofSea,beltColor:P.rust}); b7.name  = nameOf('Library Tower');
  const b8  = terrace({w:88,d:44,floors:3,roofColor:P.roofOrange,plaster:"B"}); b8.name  = nameOf('Terrace House');
  const b9  = bathhouse({w:78,d:52,r:26,roofMain:P.roofBlue,roofSides:P.roofOrange,plaster:"C"}); b9.name  = nameOf('Bathhouse');
  const b10 = drumTower({r:36,floors:2,roofColor:P.roofSea,beltColor:P.brick,plaster:"B"}); b10.name = nameOf('Drum Tower');

  const b11 = gatehouse({w:90,d:38,roofColor:P.roofClay,coneColor:P.roofTeal,plaster:"C"}); b11.name = nameOf('Gatehouse');
  const b12 = pagoda({w:100,d:72,tiers:3,roofColor:P.roofOrange,plaster:"A"}); b12.name = nameOf('Pagoda');
  const b13 = terrace({w:82,d:42,floors:2,roofColor:P.roofTerracotta,plaster:"B"}); b13.name = nameOf('Terrace House');
  const b14 = libraryTower({r:24,floors:4,roofColor:P.roofBlue,beltColor:P.vermilion}); b14.name = nameOf('Library Tower');
  const b15 = bathhouse({w:92,d:60,r:32,roofMain:P.roofSea,roofSides:P.roofClay,plaster:"A"}); b15.name = nameOf('Bathhouse');

  return [b1,b2,b3,b4,b5,b6,b7,b8,b9,b10,b11,b12,b13,b14,b15];
}
