import Constants from 'expo-constants';
import { Platform } from 'react-native';

/** ATLUSMAPS cloud style: iOS Map ID (Google Cloud Console). */
export const ATLAS_GOOGLE_MAP_ID_IOS = 'eead448905b2fd794d94df0e';

/** ATLUSMAPS cloud style: Android Map ID (Google Cloud Console). */
export const ATLAS_GOOGLE_MAP_ID_ANDROID = 'eead448905b2fd79ebfbd0f9';

type Extra = {
  googleMapsMapIdIos?: string;
  googleMapsMapIdAndroid?: string;
};

function trim(value: string | undefined): string {
  return (value ?? '').trim();
}

/** Platform Map ID for react-native-maps `googleMapId` (env overrides built-in defaults). */
export function getAtlasGoogleMapId(): string {
  const extra = Constants.expoConfig?.extra as Extra | undefined;

  if (Platform.OS === 'ios') {
    return (
      trim(extra?.googleMapsMapIdIos ?? process.env.EXPO_PUBLIC_GOOGLE_MAPS_MAP_ID_IOS) ||
      ATLAS_GOOGLE_MAP_ID_IOS
    );
  }

  if (Platform.OS === 'android') {
    return (
      trim(extra?.googleMapsMapIdAndroid ?? process.env.EXPO_PUBLIC_GOOGLE_MAPS_MAP_ID_ANDROID) ||
      ATLAS_GOOGLE_MAP_ID_ANDROID
    );
  }

  return '';
}

/** Native Google Maps with cloud styling, not JSON customMapStyle. */
export function usesAtlasCloudMapStyle(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}
