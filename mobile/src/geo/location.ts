import { BOSTON_CENTER, WORCESTER_CENTER, SALEM_CENTER, SPRINGFIELD_CENTER } from '../v3/data';

/** Default demo spawn, not a real user location. */
export const PLACEHOLDER_SF = { latitude: 37.7749, longitude: -122.4194 };

export type MapCoords = { latitude: number; longitude: number };

export function isPlaceholderLocation(loc: MapCoords): boolean {
  return (
    Math.abs(loc.latitude - PLACEHOLDER_SF.latitude) < 0.001 &&
    Math.abs(loc.longitude - PLACEHOLDER_SF.longitude) < 0.001
  );
}

function nearCenter(loc: MapCoords, center: MapCoords): boolean {
  return (
    Math.abs(loc.latitude - center.latitude) < 0.002 &&
    Math.abs(loc.longitude - center.longitude) < 0.002
  );
}

/** Fresh-install default map center, not the player's GPS position. */
export function isDefaultCityCenter(loc: MapCoords): boolean {
  return (
    nearCenter(loc, BOSTON_CENTER) ||
    nearCenter(loc, WORCESTER_CENTER) ||
    nearCenter(loc, SALEM_CENTER) ||
    nearCenter(loc, SPRINGFIELD_CENTER)
  );
}

/** Return coords only if valid and not a placeholder/default spawn. */
export function resolveMapLocation(loc: MapCoords | null | undefined): MapCoords | null {
  if (loc == null || !Number.isFinite(loc.latitude) || !Number.isFinite(loc.longitude)) return null;
  if (isPlaceholderLocation(loc)) return null;
  if (isDefaultCityCenter(loc)) return null;
  return loc;
}
