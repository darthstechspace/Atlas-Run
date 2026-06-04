import { useCallback, useRef, useState } from 'react';
import type { Region } from 'react-native-maps';

/**
 * Tracks map region for fog viewport culling.
 * Updates while panning (throttled) so fog stays aligned with geographic coordinates.
 */
export function useFogRegion(initial: Region | null) {
  const [fogRegion, setFogRegion] = useState<Region | null>(initial);
  const throttleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef<Region | null>(initial);

  const syncFogRegion = useCallback((region: Region) => {
    latestRef.current = region;
    setFogRegion(region);
  }, []);

  const onRegionChange = useCallback((region: Region) => {
    latestRef.current = region;
    if (throttleRef.current) return;
    throttleRef.current = setTimeout(() => {
      throttleRef.current = null;
      if (latestRef.current) setFogRegion(latestRef.current);
    }, 80);
  }, []);

  const onRegionChangeComplete = useCallback(
    (region: Region) => {
      if (throttleRef.current) {
        clearTimeout(throttleRef.current);
        throttleRef.current = null;
      }
      syncFogRegion(region);
    },
    [syncFogRegion]
  );

  return { fogRegion, onRegionChange, onRegionChangeComplete, syncFogRegion };
}
