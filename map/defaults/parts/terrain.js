import { FOREST_DEFAULTS } from './forest-defaults.js';

export const DEFAULT_TERRAIN = {
  "grass": [
    {
      id: "grass-1",
      // Centered at grid LI300 (converted to map percent coords)
      // Using a short horizontal segment so the round caps render a visible dot
      width: 60,
      points: [
        [53.42, 49.92],
        [53.58, 49.92]
      ]
    }
  ],
  "forest": FOREST_DEFAULTS,
  "mountains": []
};
