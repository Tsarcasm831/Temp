import * as THREE from 'three';
// NOTE: this file is at /src/game/objects/placements/, so we must go up THREE levels to reach /src/components/...
import { addRedBuildings } from '../../../components/game/objects/buildings.red.js';
import { addBlueBuildings } from '../../../components/game/objects/buildings.blue.js';
import { addYellowBuildings } from '../../../components/game/objects/buildings.yellow.js';
import { addGreenBuildings } from '../../../components/game/objects/buildings.green.js';
import { addDarkBuildings } from '../../../components/game/objects/buildings.dark.js';
// Building palette and helpers extracted into separate module
import { createKonohaBuildingKit } from './konohaBuildingKit.js';
import {
  KONOHA_TOWN_SCALE,
  DISTRICT_ENFORCEMENT_ENABLED,
  DISTRICT_REQUIRE_MAP,
  DISTRICT_DROP_IF_FAIL
} from './konohaTownConfig.js';
import { buildRoadSegments, ensureNotOnRoad } from './konohaTownRoads.js';
import {
  buildDistrictSets,
  buildingFullyInsideAnyDistrict,
  nudgeTowardNearestDistrict
} from './konohaTownDistricts.js';
import { addObbProxy } from './konohaTownColliders.js';
/* NEW: fallback to default map model when live map is missing/empty */
import { DEFAULT_MODEL as MAP_DEFAULT_MODEL } from '/map/defaults/full-default-model.js';

// Build a cluster of Konoha town buildings and add them to the scene.
// Returns the group representing the town or null on failure.
export function placeKonohaTown(scene, objectGrid, settings, origin = new THREE.Vector3(-320, 0, -220)) {
  try {
    // Obtain palette, materials and building factory from helper module
    const kit = createKonohaBuildingKit(settings);

    const townGroup = new THREE.Group();
    townGroup.name = 'KonohaTown';

    addRedBuildings(townGroup,   { THREE, kit });
    addBlueBuildings(townGroup,  { THREE, kit });
    addYellowBuildings(townGroup,{ THREE, kit });
    addGreenBuildings(townGroup, { THREE, kit });
    addDarkBuildings(townGroup,  { THREE, kit });

    // Apply global town scale (affects visuals and spacing)
    townGroup.scale.setScalar(KONOHA_TOWN_SCALE);

    townGroup.position.copy(origin);
    scene.add(townGroup);

    // Require district data from the live /map model. Guard against the
    // absence of `window` (e.g. during server-side rendering) by falling back
    // to the global object when necessary.
    const w = typeof window !== 'undefined' ? window : globalThis;
    const liveMapAll = (w.__konohaMapModel?.MODEL ?? w.__konohaMapModel) || null;
    const hasLiveDistricts = liveMapAll && Object.keys(liveMapAll?.districts || {}).length > 0;
    const liveMap = hasLiveDistricts ? liveMapAll : MAP_DEFAULT_MODEL;
    const liveDistricts = liveMap?.districts;
    if (
      DISTRICT_ENFORCEMENT_ENABLED &&
      DISTRICT_REQUIRE_MAP &&
      (!liveDistricts || Object.keys(liveDistricts).length === 0)
    ) {
      scene.remove(townGroup);
      return null;
    }

    const roadSegments = buildRoadSegments();
    const { districtPolys, districtCentroids } = DISTRICT_ENFORCEMENT_ENABLED
      ? buildDistrictSets(liveMap)
      : { districtPolys: [], districtCentroids: [] };

    townGroup.children.forEach(colorGroup => {
      colorGroup.children?.forEach(building => {
        ensureNotOnRoad(building, roadSegments);
        if (DISTRICT_ENFORCEMENT_ENABLED && districtPolys.length > 0) {
          if (!buildingFullyInsideAnyDistrict(building, districtPolys)) {
            if (!nudgeTowardNearestDistrict(building, districtPolys, districtCentroids) ||
                !buildingFullyInsideAnyDistrict(building, districtPolys)) {
              if (DISTRICT_DROP_IF_FAIL) { building.removeFromParent?.(); return; }
            }
          }
        }
        addObbProxy(building, { scene, objectGrid, townGroup });
      });
    });

    return townGroup;
  } catch (e) {
    console.warn('Failed to integrate Konoha Buildings:', e);
    return null;
  }
}