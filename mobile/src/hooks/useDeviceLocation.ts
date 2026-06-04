import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { locationServicesOffHint, locationSettingsHint } from '../platform/locationPermission';

export type DeviceCoords = { latitude: number; longitude: number };

type State = {
  location: DeviceCoords | null;
  error: string | null;
  ready: boolean;
};

function logGps(message: string, data: Record<string, unknown>) {
  if (__DEV__) console.warn('[AtlasRun GPS]', message, data);
}

export function useDeviceLocation() {
  const [state, setState] = useState<State>({ location: null, error: null, ready: false });
  const subRef = useRef<Location.LocationSubscription | null>(null);
  const gotFixRef = useRef(false);

  const applyFix = useCallback((lat: number, lng: number, source: string) => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    setState((prev) => {
      if (
        prev.location &&
        Math.abs(prev.location.latitude - lat) < 1e-7 &&
        Math.abs(prev.location.longitude - lng) < 1e-7
      ) {
        return prev;
      }
      gotFixRef.current = true;
      logGps(`${source} fix`, { lat, lng });
      return { location: { latitude: lat, longitude: lng }, error: null, ready: true };
    });
  }, []);

  const retry = useCallback(async () => {
    gotFixRef.current = false;
    setState((s) => ({ ...s, ready: false, error: null }));
    for (const accuracy of [Location.Accuracy.High, Location.Accuracy.Balanced, Location.Accuracy.Lowest]) {
      try {
        const fix = await Location.getCurrentPositionAsync({ accuracy });
        applyFix(fix.coords.latitude, fix.coords.longitude, 'retry');
        return;
      } catch (error) {
        logGps('retry failed', {
          accuracy,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
    const last = await Location.getLastKnownPositionAsync().catch(() => null);
    if (last) {
      applyFix(last.coords.latitude, last.coords.longitude, 'retry-lastKnown');
      return;
    }
    setState({ location: null, ready: true, error: `Could not get GPS. ${locationSettingsHint()}` });
  }, [applyFix]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const servicesOn = await Location.hasServicesEnabledAsync();
      if (!servicesOn) {
        if (!cancelled) {
          setState({ location: null, error: locationServicesOffHint(), ready: true });
        }
        return;
      }

      const perm = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;

      if (perm.status !== Location.PermissionStatus.GRANTED) {
        setState({ location: null, error: locationSettingsHint(), ready: true });
        return;
      }

      try {
        await Location.enableNetworkProviderAsync();
      } catch {
        // Android only
      }

      try {
        subRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            distanceInterval: 3,
            timeInterval: 1000,
          },
          (update) => {
            if (cancelled) return;
            applyFix(update.coords.latitude, update.coords.longitude, 'watch');
          },
          (watchError) => logGps('watch error', { error: watchError })
        );
      } catch (error) {
        logGps('watch setup failed', { error: error instanceof Error ? error.message : String(error) });
      }

      for (const accuracy of [Location.Accuracy.Balanced, Location.Accuracy.Lowest]) {
        if (cancelled || gotFixRef.current) break;
        try {
          const fix = await Location.getCurrentPositionAsync({ accuracy });
          applyFix(fix.coords.latitude, fix.coords.longitude, 'getCurrent');
          break;
        } catch (error) {
          logGps('getCurrent failed', {
            accuracy,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      if (cancelled) return;

      if (!gotFixRef.current) {
        const last = await Location.getLastKnownPositionAsync().catch(() => null);
        if (last) {
          applyFix(last.coords.latitude, last.coords.longitude, 'lastKnown');
        } else {
          setState({ location: null, ready: true, error: 'Waiting for GPS signal… go near a window or outdoors.' });
        }
      }
    })();

    return () => {
      cancelled = true;
      subRef.current?.remove();
      subRef.current = null;
    };
  }, [applyFix]);

  return { ...state, retry };
}
