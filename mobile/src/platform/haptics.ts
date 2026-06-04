import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

async function safeHaptic(fn: () => Promise<void>) {
  if (Platform.OS === 'web') return;
  try {
    await fn();
  } catch {
    // Expo Go / unsupported devices
  }
}

export function hapticChestOpen() {
  return safeHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

export function hapticLandmarkFound() {
  return safeHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
}

export function hapticBadgeUnlock() {
  return safeHaptic(() =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  );
}
