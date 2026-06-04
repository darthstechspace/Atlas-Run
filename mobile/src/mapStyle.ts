import type { MapTheme } from './mapTheme';

/** Hide Google POIs/icons; only Atlas Run landmarks should appear as pins. */
export const MAP_HIDE_POIS_STYLE = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.attraction', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.government', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.medical', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.place_of_worship', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.school', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.sports_complex', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit.station', stylers: [{ visibility: 'off' }] },
];

/** Dark base map; fog overlay (MapFogLayer) dims unrevealed areas on top. */
export const MAP_DARK_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#1a2234' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a2234' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2c3448' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#3d4659' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3d4f6a' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f394a' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#4b5870' }] },
  ...MAP_HIDE_POIS_STYLE,
];

/** Light base map; fog overlay still dims unrevealed areas. */
export const MAP_LIGHT_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#f0f2f5' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#5a6478' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#d8dde6' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#e8ecf2' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#b8d4e8' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#e2e6ec' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#c5ccd6' }] },
  ...MAP_HIDE_POIS_STYLE,
];

/** Cloud Map ID is dark-only; light mode always uses JSON styling. */
export function getMapCustomStyle(theme: MapTheme, cloudStyleActive: boolean) {
  if (theme === 'light') return MAP_LIGHT_STYLE;
  return cloudStyleActive ? MAP_HIDE_POIS_STYLE : MAP_DARK_STYLE;
}

export function useCloudMapStyleForTheme(theme: MapTheme, cloudCapable: boolean): boolean {
  return theme === 'dark' && cloudCapable;
}
