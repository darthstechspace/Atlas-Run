import Constants from 'expo-constants';
import {
  ATLAS_GOOGLE_MAP_ID_ANDROID,
  ATLAS_GOOGLE_MAP_ID_IOS,
  getAtlasGoogleMapId,
  usesAtlasCloudMapStyle,
} from './googleMaps';

type Extra = {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  googleMapsApiKey?: string;
  googleMapsMapIdIos?: string;
  googleMapsMapIdAndroid?: string;
};

function trim(value: string | undefined): string {
  return (value ?? '').trim();
}

/** Read Supabase config from Expo extra (primary) with Metro env inlining as fallback. */
export function readSupabaseEnv(): { url: string; anonKey: string } {
  const extra = Constants.expoConfig?.extra as Extra | undefined;

  const url = trim(extra?.supabaseUrl ?? process.env.EXPO_PUBLIC_SUPABASE_URL);
  const anonKey = trim(extra?.supabaseAnonKey ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

  return { url, anonKey };
}

export function isValidSupabaseUrl(url: string): boolean {
  return (
    url.startsWith('https://') &&
    !url.includes('YOUR_PROJECT_REF') &&
    url.includes('.supabase.co')
  );
}

export function readGoogleMapsKey(): string {
  const extra = Constants.expoConfig?.extra as Extra | undefined;
  return trim(extra?.googleMapsApiKey ?? process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY);
}

export function readGoogleMapsMapId(): string {
  return getAtlasGoogleMapId();
}

export function isGoogleMapsConfigured(): boolean {
  const key = readGoogleMapsKey();
  return key.length > 10 && !key.includes('YOUR_');
}

export function isGoogleMapsMapIdConfigured(): boolean {
  return usesAtlasCloudMapStyle() && readGoogleMapsMapId().length > 8;
}

export { ATLAS_GOOGLE_MAP_ID_IOS, ATLAS_GOOGLE_MAP_ID_ANDROID, getAtlasGoogleMapId, usesAtlasCloudMapStyle };
