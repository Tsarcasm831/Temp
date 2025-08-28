import { buildOriginals } from "./citySlice.originals.js";
import { buildMore } from "./citySlice.more.js";
import { buildBasicFive, buildBasicFiveGrid, BASIC_ROOF_PALETTES } from "./citySlice.basic.js";

// Returns { builds, rows, cols }
export function chooseBuilds(THREE, kit, ex, { variant = 'default', basicPaletteIndex = 0 } = {}) {
  let builds = [];
  let rows = 6, cols = 5;
  if (variant === 'basic') {
    const palettes = BASIC_ROOF_PALETTES;
    const safeIndex = (basicPaletteIndex % palettes.length + palettes.length) % palettes.length;
    const color = palettes[safeIndex].color;
    builds = buildBasicFive(THREE, kit, ex, { roofColor: color });
    rows = 1; cols = builds.length;
  } else if (variant === 'basic-grid' || variant === 'basicGrid') {
    builds = buildBasicFiveGrid(THREE, kit, ex);
    rows = 5; cols = BASIC_ROOF_PALETTES.length; // 5 x 12 grid
  } else {
    const originals = buildOriginals(THREE, kit, ex);
    const more = buildMore(THREE, kit, ex);
    builds = originals.concat(more);
  }
  return { builds, rows, cols };
}

