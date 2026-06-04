import { Platform } from 'react-native';
import * as Location from 'expo-location';
import Constants from 'expo-constants';

const APP_NAME = Constants.expoConfig?.name ?? 'Atlas Run';

/** User-facing hint when GPS or location permission fails. */
export function locationSettingsHint(): string {
  if (Platform.OS === 'android') {
    return `Open Settings → Apps → ${APP_NAME} → Permissions → Location, and allow "While using the app" (or "All the time" during runs).`;
  }
  if (Platform.OS === 'ios') {
    return `Open Settings → ${APP_NAME} → Location, and choose "While Using the App" or "Always" for runs with the screen off.`;
  }
  return 'Open Settings and allow location for this app.';
}

export function locationServicesOffHint(): string {
  if (Platform.OS === 'android') {
    return 'Turn on Location in Android Settings (quick settings or Settings → Location).';
  }
  return 'Turn on Location Services in Settings.';
}

export async function ensureForegroundLocation(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === Location.PermissionStatus.GRANTED;
}

/**
 * Foreground is required; background/always is requested on native so runs keep tracking with the screen off.
 * Returns false only when foreground is denied.
 */
export async function ensureRunLocationPermissions(): Promise<{
  ok: boolean;
  background: boolean;
}> {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== Location.PermissionStatus.GRANTED) {
    return { ok: false, background: false };
  }

  if (Platform.OS === 'web') {
    return { ok: true, background: false };
  }

  const bg = await Location.requestBackgroundPermissionsAsync();
  return {
    ok: true,
    background: bg.status === Location.PermissionStatus.GRANTED,
  };
}
