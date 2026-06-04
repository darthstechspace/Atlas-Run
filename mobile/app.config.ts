import path from 'path';
import { load as loadEnv } from '@expo/env';
import { ExpoConfig, ConfigContext } from 'expo/config';
import { APP_VERSION, NATIVE_BUILD_VERSION } from './src/config/version.ts';

loadEnv(path.join(__dirname));

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';
const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? '';
const googleMapsMapIdIos = process.env.EXPO_PUBLIC_GOOGLE_MAPS_MAP_ID_IOS?.trim() ?? '';
const googleMapsMapIdAndroid = process.env.EXPO_PUBLIC_GOOGLE_MAPS_MAP_ID_ANDROID?.trim() ?? '';

/** Host mobile/PRIVACY.txt at a public HTTPS URL before Play Store submission. */
const privacyPolicyUrl = process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL?.trim() ?? '';

/** From mobile/.env (EAS_PROJECT_ID) or Expo dashboard after eas init */
const easProjectId =
  process.env.EAS_PROJECT_ID?.trim() || '02bf57c4-f43f-4cbf-9ccd-e644893f93a7';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Atlas Run',
  slug: 'atlas-run',
  version: APP_VERSION,
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  scheme: 'atlasrun',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#0F0F1E',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.atlasrun.app',
    buildNumber: String(NATIVE_BUILD_VERSION),
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'Atlas Run needs your location to reveal the map, find treasure chests, and track runs.',
      ITSAppUsesNonExemptEncryption: false,
      ...(privacyPolicyUrl ? { NSPrivacyPolicyURL: privacyPolicyUrl } : {}),
      ...(googleMapsApiKey ? { GMSApiKey: googleMapsApiKey } : {}),
    },
    config: {
      /** Used by Expo prebuild to install Google Maps iOS SDK (see plugins/withAtlasMaps.js). */
      googleMapsApiKey,
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#0F0F1E',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    permissions: ['ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION'],
    package: 'com.atlasrun.app',
    versionCode: NATIVE_BUILD_VERSION,
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: true,
    config: {
      googleMaps: {
        apiKey: googleMapsApiKey,
      },
    },
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    './plugins/withAtlasMaps.js',
    [
      'expo-build-properties',
      {
        android: {
          minSdkVersion: 24,
          compileSdkVersion: 35,
          targetSdkVersion: 35,
        },
        ios: {
          /** Google Maps SDK for iOS 14+; Expo 54 requires deployment target >= 15.1. */
          deploymentTarget: '15.1',
        },
      },
    ],
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#0F0F1E',
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'Atlas Run needs your location to reveal the map and find treasure chests.',
        locationAlwaysAndWhenInUsePermission:
          'Atlas Run tracks your run distance even when the screen is off. Choose "Always" (iOS) or "Allow all the time" (Android) for the best experience.',
        isIosBackgroundLocationEnabled: true,
        isAndroidBackgroundLocationEnabled: true,
        isAndroidForegroundServiceEnabled: true,
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'Atlas Run needs access to your photos for your profile picture.',
        cameraPermission: 'Atlas Run needs camera access to take a profile picture.',
      },
    ],
  ],
  extra: {
    supabaseUrl,
    supabaseAnonKey,
    googleMapsApiKey,
    googleMapsMapIdIos,
    googleMapsMapIdAndroid,
    privacyPolicyUrl,
    eas: { projectId: easProjectId },
  },
});
