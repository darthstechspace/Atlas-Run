import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../providers/AuthProvider';
import { useConnectivity } from '../providers/ConnectivityProvider';
import { useGame } from '../GameContext';
import { isSupabaseConfigured } from '../lib/supabase';
import { theme } from '../theme';

export function OfflineBanner() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { isOnline, isChecking } = useConnectivity();
  const { cloudSyncPaused } = useGame();

  if (!isSupabaseConfigured || !user || isChecking) return null;

  const showOffline = !isOnline;
  const showSyncPaused = isOnline && cloudSyncPaused;
  if (!showOffline && !showSyncPaused) return null;

  const message = showOffline
    ? "Playing offline. Progress saves on this device. Cloud sync when you're back online."
    : "Cloud sync paused. Still saving on this device. We'll retry when the connection is stable.";

  return (
    <View style={[styles.banner, { paddingTop: insets.top + 6 }]} pointerEvents="none">
      <Ionicons name={showOffline ? 'cloud-offline-outline' : 'cloud-upload-outline'} size={16} color={theme.accentGold} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 10,
    backgroundColor: '#1a1528ee',
    borderBottomWidth: 1,
    borderBottomColor: theme.accentGold + '55',
  },
  text: {
    flex: 1,
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
});
