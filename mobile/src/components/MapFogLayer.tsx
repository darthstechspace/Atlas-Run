import React, { useMemo } from 'react';
import { Polygon, type Region } from 'react-native-maps';
import type { UnlockedArea } from '../types';
import { buildFogPolygon, getFogFillColor } from '../mapFog';
import type { MapTheme } from '../mapTheme';

type Props = {
  region: Region;
  unlockedAreas: UnlockedArea[];
  liveCenter: { latitude: number; longitude: number };
  liveRadiusMeters: number;
  mapTheme?: MapTheme;
};

/**
 * Single geo-locked fog polygon (viewport outer ring + explored holes).
 * Nearby reveal circles are unioned into one hole per cluster, not separate stacked bubbles.
 */
export const MapFogLayer = React.memo(function MapFogLayer({
  region,
  unlockedAreas,
  liveCenter,
  liveRadiusMeters,
  mapTheme = 'dark',
}: Props) {
  const fillColor = getFogFillColor(mapTheme);
  const fog = useMemo(
    () => buildFogPolygon(region, unlockedAreas, liveCenter, liveRadiusMeters),
    [
      region.latitude,
      region.longitude,
      region.latitudeDelta,
      region.longitudeDelta,
      unlockedAreas,
      liveCenter.latitude,
      liveCenter.longitude,
      liveRadiusMeters,
    ]
  );

  return (
    <Polygon
      coordinates={fog.coordinates}
      holes={fog.holes}
      fillColor={fillColor}
      strokeColor="transparent"
      strokeWidth={0}
      tappable={false}
      zIndex={8}
    />
  );
});
