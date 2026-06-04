const { AndroidConfig, IOSConfig } = require('@expo/config-plugins');

/**
 * Ensures Google Maps native SDK + API keys are wired for iOS and Android on prebuild/EAS.
 * Requires EXPO_PUBLIC_GOOGLE_MAPS_API_KEY (injected via ios.config.googleMapsApiKey).
 */
function withAtlasMaps(config) {
  config = AndroidConfig.GoogleMapsApiKey.withGoogleMapsApiKey(config);
  config = IOSConfig.Maps.withMaps(config);
  return config;
}

module.exports = withAtlasMaps;
