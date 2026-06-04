import { Platform } from 'react-native';

/** Shown when a run starts without background/always location. */
export function runBackgroundLocationHint(): string {
  if (Platform.OS === 'android') {
    return 'Run started. Keep the app open, or allow "All the time" location for screen-off tracking.';
  }
  if (Platform.OS === 'ios') {
    return 'Run started. Choose "Always" in Location settings for screen-off tracking, or keep the app open.';
  }
  return 'Run started. Keep the app open for GPS tracking.';
}
