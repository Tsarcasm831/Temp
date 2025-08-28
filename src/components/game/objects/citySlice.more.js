// citySlice.more.js
// Second 15 buildings (more oriental variety). Returns an array of Groups.
export function buildMore(THREE, kit, ex) {
  const P = kit.Palette;
  const {
    octagonTower, hexPavilion, stupa, teaHouseStilts, marketHall,
    bellPavilion, siheyuan, twinBridge, toriiGateComplex, barrelHall,
    karahafuHall, drumPagodaHybrid, tallWatchtower, cornerPagoda
  } = ex;

  // Helper to assign numbered names per base type
  const counts = Object.create(null);
  const nameOf = (base) => {
    counts[base] = (counts[base] || 0) + 1;
    return counts[base] === 1 ? base : `${base} ${counts[base]}`;
  };

  const b1  = octagonTower({r:28,floors:3,roofColor:P.roofSea,plaster:"B"}); b1.name  = nameOf('Octagon Tower');
  const b2  = hexPavilion({r:26,roofColor:P.roofOrange}); b2.name  = nameOf('Hex Pavilion');
  const b3  = stupa({r:26,levels:5,roofColor:P.roofTeal}); b3.name  = nameOf('Stupa');
  const b4  = teaHouseStilts({w:78,d:52,roofColor:P.roofTerracotta}); b4.name  = nameOf('Teahouse on Stilts');
  const b5  = marketHall({w:140,d:46,roofColor:P.roofClay}); b5.name  = nameOf('Market Hall');

  const b6  = bellPavilion({w:86,d:86,roofColor:P.roofOrange}); b6.name  = nameOf('Bell Pavilion');
  const b7  = siheyuan({w:140,d:140,roofColor:P.roofTerracotta}); b7.name  = nameOf('Siheyuan Courtyard');
  const b8  = twinBridge({w:60,d:36,h:22,roofColor:P.roofTeal}); b8.name  = nameOf('Twin Bridge');
  const b9  = toriiGateComplex({w:96,d:36,roofColor:P.roofTerracotta}); b9.name  = nameOf('Torii Gate Complex');
  const b10 = barrelHall({w:120,d:46,roofColor:P.roofSea}); b10.name = nameOf('Barrel Hall');

  const b11 = karahafuHall({w:96,d:48,roofColor:P.roofTerracotta}); b11.name = nameOf('Karahafu Hall');
  const b12 = drumPagodaHybrid({w:84,d:58,r:24}); b12.name = nameOf('Drum-Pagoda Hybrid');
  const b13 = tallWatchtower({w:40,d:40,floors:5,roofColor:P.roofSea}); b13.name = nameOf('Watchtower');
  const b14 = cornerPagoda({w:104,d:76,tiers:4,roofColor:P.roofOrange}); b14.name = nameOf('Corner Pagoda');
  const b15 = octagonTower({r:30,floors:4,roofColor:P.roofBlue,plaster:"C"}); b15.name = nameOf('Octagon Tower');

  return [b1,b2,b3,b4,b5,b6,b7,b8,b9,b10,b11,b12,b13,b14,b15];
}
