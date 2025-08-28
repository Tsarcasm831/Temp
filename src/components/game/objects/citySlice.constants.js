// Constants and toggles for city slice behavior

/* @tweakable global scale applied to all city-slice buildings added via addCitySliceBuildings */
export const CITY_SLICE_DEFAULT_SCALE = 0.5;
/* @tweakable enable OBB colliders for each city-slice building */
export const CITY_SLICE_COLLIDERS_ENABLED = true;
/* @tweakable extra padding (world units) added to OBB half-extents */
export const CITY_SLICE_COLLIDER_PADDING = 0.5;
/* @tweakable minimum allowed OBB half-extent (world units) to avoid degenerate colliders */
export const CITY_SLICE_COLLIDER_MIN_HALF = 2;
/* @tweakable attach a tiny debug marker to each collider center */
export const CITY_SLICE_COLLIDER_DEBUG = false;
/* @tweakable require live /map districts to place any city-slice buildings */
export const CITY_SLICE_REQUIRE_DISTRICTS = true;
/* @tweakable use advanced local constraints (nudging + collision) here; keep off to defer to placement logic */
export const CITY_SLICE_LOCAL_CONSTRAINTS = false;

