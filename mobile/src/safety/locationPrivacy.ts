import type { GameStateShape } from '../gameState';

/** ~500 m grid step in degrees at mid-latitude. */
const GRID_DEG = 0.0045;

function stableHash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** Snap coordinates to a stable ~500 m grid with a user-specific offset. */
export function obfuscateCoordinate(
  lat: number,
  lng: number,
  userId: string
): { latitude: number; longitude: number } {
  const h = stableHash(userId || 'local');
  const offsetLat = ((h % 1000) / 1000 - 0.5) * GRID_DEG * 0.4;
  const offsetLng = (((h >> 10) % 1000) / 1000 - 0.5) * GRID_DEG * 0.4;

  const gridLat = Math.round(lat / GRID_DEG) * GRID_DEG + offsetLat;
  const gridLng = Math.round(lng / GRID_DEG) * GRID_DEG + offsetLng;

  return { latitude: gridLat, longitude: gridLng };
}

/** Coords safe to upload or share with friends. */
export function resolvePublicLocation(
  state: Pick<GameStateShape, 'safeModeEnabled' | 'userLocation' | 'account'>,
  userId?: string
): { latitude: number; longitude: number } {
  const { latitude, longitude } = state.userLocation;
  if (!state.safeModeEnabled) {
    return { latitude, longitude };
  }
  const id = userId ?? state.account?.email ?? 'local';
  return obfuscateCoordinate(latitude, longitude, id);
}
