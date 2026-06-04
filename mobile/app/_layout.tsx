import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/providers/AuthProvider';
import { ConnectivityProvider } from '../src/providers/ConnectivityProvider';
import { GameProvider } from '../src/GameContext';
import { MapThemeProvider } from '../src/providers/MapThemeProvider';
import { AuthGate } from '../src/components/AuthGate';
import { OfflineBanner } from '../src/components/OfflineBanner';
import { OnboardingOverlay } from '../src/components/OnboardingOverlay';
import { GamePolishEffects } from '../src/components/GamePolishEffects';
import { theme } from '../src/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ConnectivityProvider>
          <AuthGate>
            <GameProvider>
              <MapThemeProvider>
                <StatusBar style="light" />
                <OfflineBanner />
                <GamePolishEffects />
                <OnboardingOverlay />
                <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.backgroundDark } }}>
                  <Stack.Screen name="(tabs)" />
                </Stack>
              </MapThemeProvider>
            </GameProvider>
          </AuthGate>
        </ConnectivityProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
