import { ScrollView, View, Text, StyleSheet, Pressable, Switch, Alert, Image, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { clearSavedState } from '../../src/storage';
import { resetOnboardingFlag } from '../../src/components/OnboardingOverlay';
import { useGame } from '../../src/GameContext';
import { useAuth } from '../../src/providers/AuthProvider';
import { GameCard, XPBar, Toast, GlowButton } from '../../src/components/UI';
import { theme } from '../../src/theme';
import { SKILL_PATHS, TITLES } from '../../src/v3/data';
import { PET_BUFFS } from '../../src/petBuffs';
import { gearBuffLabel } from '../../src/gearBuffs';
import type { SkillPath } from '../../src/v3/data';
import { emojiFor, syncCosmeticFromCatalog } from '../../src/cosmetics';
import { CosmeticIcon } from '../../src/components/CosmeticIcon';
import { getSupabaseConfigDebug } from '../../src/lib/supabase';
import { APP_VERSION_SHORT } from '../../src/config/version';
import { isPrivacyPolicyConfigured, readPrivacyPolicyUrl } from '../../src/config/legal';
import { useMapTheme } from '../../src/hooks/useMapTheme';
import type { MapTheme } from '../../src/mapTheme';

export default function ProfileScreen() {
  const { user, signOut, isConfigured } = useAuth();
  const { state, xpRequired, xpProgress, equip, isEquipped, toggleSafeMode, togglePlaySafetyAlerts, setProfilePhoto, syncCloud, setSkillPath, equipTitle, saveRoute, shopItems } = useGame();
  const { mapTheme, setMapTheme } = useMapTheme();
  const avatarEmoji = emojiFor(state.equipped.compass, state.cosmetics, shopItems, '🧭');
  const hatEmoji = state.equipped.hat ? emojiFor(state.equipped.hat, state.cosmetics, shopItems, '') : null;
  const privacyPolicyUrl = readPrivacyPolicyUrl();
  const showPrivacyLink = isPrivacyPolicyConfigured();

  async function pickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo library access to set a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProfilePhoto(result.assets[0].uri);
    }
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow camera access to take a profile picture.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProfilePhoto(result.assets[0].uri);
    }
  }

  function photoOptions() {
    Alert.alert('Profile photo', 'Choose a source', [
      { text: 'Take Photo', onPress: takePhoto },
      { text: 'Choose from Library', onPress: pickPhoto },
      ...(state.profilePhotoUri
        ? [{ text: 'Remove Photo', style: 'destructive' as const, onPress: () => setProfilePhoto(undefined) }]
        : []),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <GameCard style={styles.header}>
          <Pressable onPress={photoOptions} style={styles.avatarWrap}>
            {state.profilePhotoUri ? (
              <Image source={{ uri: state.profilePhotoUri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={{ fontSize: 48 }}>{avatarEmoji}</Text>
              </View>
            )}
            {hatEmoji ? <Text style={styles.avatarHat}>{hatEmoji}</Text> : null}
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={14} color="#000" />
            </View>
          </Pressable>
          <Text style={styles.photoHint}>Tap to change photo</Text>
          <Text style={styles.name}>{state.username}</Text>
          {isConfigured ? (
            <Text style={styles.usernameHint}>Friends search this username on iOS or Android</Text>
          ) : null}
          <Text style={styles.betaBadge}>{APP_VERSION_SHORT}</Text>
          <Text style={styles.level}>Level {state.level}</Text>
          <XPBar progress={xpProgress} level={state.level} />
          <Text style={styles.xpText}>
            {state.xp} / {xpRequired} XP
          </Text>
          {state.equippedTitle && (
            <Text style={styles.titleBadge}>🏅 {state.equippedTitle}</Text>
          )}
        </GameCard>

        <GameCard style={{ marginBottom: 16 }}>
          <Text style={styles.section}>Account</Text>
          {isConfigured && user ? (
            <>
              <Text style={styles.accountLine}>{state.username}</Text>
              <Text style={styles.accountSub}>{user.email ?? 'Signed in'}</Text>
              <Text style={styles.accountSub}>
                Cloud sync v{state.syncVersion ?? 1}
                {state.account?.lastSync ? ` | ${new Date(state.account.lastSync).toLocaleString()}` : ''}
              </Text>
              <Pressable onPress={syncCloud} style={{ marginTop: 8 }}>
                <Text style={{ color: theme.accentGreen, fontWeight: '700' }}>Sync to Cloud</Text>
              </Pressable>
              <Pressable onPress={signOut} style={{ marginTop: 8 }}>
                <Text style={{ color: '#ff6666', fontWeight: '700' }}>Sign Out</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.accountSub}>
                {isConfigured
                  ? 'Sign in required. Restart the app to open the sign-in screen.'
                  : 'Offline mode: Supabase env vars were not loaded by Expo.'}
              </Text>
              {!isConfigured ? (
                <>
                  <Text style={[styles.accountSub, { marginTop: 6, fontSize: 11 }]}>
                    1. Check mobile/.env{'\n'}
                    2. Run: npx expo start -c{'\n'}
                    3. Reload Expo Go
                  </Text>
                  {__DEV__ ? (
                    <Text style={[styles.accountSub, { marginTop: 6, fontSize: 10, color: theme.textMuted }]}>
                      Debug: {getSupabaseConfigDebug()}
                    </Text>
                  ) : null}
                </>
              ) : null}
            </>
          )}
        </GameCard>

        <Text style={styles.section}>Skill Path</Text>
        {(Object.entries(SKILL_PATHS) as [SkillPath, typeof SKILL_PATHS.explorer][]).map(([key, path]) => (
          <GameCard key={key} style={{ marginBottom: 8, borderColor: state.skillPath === key ? theme.accentGold : theme.cardBorder, borderWidth: state.skillPath === key ? 2 : 1 }}>
            <Text style={styles.pathName}>{path.emoji} {path.name}</Text>
            {path.perks.map((p) => (
              <Text key={p} style={styles.perk}>- {p}</Text>
            ))}
            {state.skillPath === key ? (
              <Text style={{ color: theme.accentGreen, fontWeight: '700', marginTop: 6 }}>Active</Text>
            ) : (
              <Pressable onPress={() => setSkillPath(key)} style={{ marginTop: 8 }}>
                <Text style={{ color: theme.accentGold, fontWeight: '700' }}>Choose Path</Text>
              </Pressable>
            )}
          </GameCard>
        ))}

        <Text style={styles.section}>Titles</Text>
        <View style={styles.titleGrid}>
          {TITLES.map((t) => {
            const unlocked = state.unlockedTitles.includes(t.name);
            return (
              <Pressable
                key={t.id}
                style={[styles.titleChip, !unlocked && styles.titleLocked]}
                onPress={() => unlocked && equipTitle(t.name)}
              >
                <Text
                  style={{
                    color: state.equippedTitle === t.name ? theme.accentGold : unlocked ? '#fff' : theme.textMuted,
                    fontSize: 12,
                    fontWeight: '700',
                  }}
                >
                  {unlocked ? t.name : '🔒 ' + t.requirement}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.section}>Personal Records</Text>
        <GameCard style={styles.prCard}>
          <Text style={styles.record}>Fastest mile: {state.personalRecords?.fastestMileMin?.toFixed(1) ?? 'n/a'} min</Text>
          <Text style={styles.record}>Longest run: {state.personalRecords?.longestRunMiles?.toFixed(1) ?? state.totalMiles.toFixed(1)} mi</Text>
          <Text style={styles.record}>Longest streak: {state.personalRecords?.longestStreak ?? state.streakDays} days</Text>
          {state.ghostRuns[0] && (
            <Pressable onPress={() => saveRoute(state.ghostRuns[0].routeName, state.ghostRuns[0].distanceMiles)} style={{ marginTop: 8 }}>
              <Text style={{ color: theme.accentBlue, fontWeight: '700' }}>Save last route</Text>
            </Pressable>
          )}
        </GameCard>

        <View style={styles.grid}>
          {[
            { icon: '🏃', label: 'Total Miles', value: state.totalMiles.toFixed(1) },
            { icon: '🗺️', label: 'Areas', value: String(state.unlockedAreas.length) },
            { icon: '📦', label: 'Chests', value: String(state.openedChests) },
            { icon: '🔥', label: 'Streak', value: `${state.streakDays}d` },
          ].map((s) => (
            <GameCard key={s.label} style={styles.stat}>
              <Text style={{ fontSize: 22 }}>{s.icon}</Text>
              <Text style={styles.statVal}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </GameCard>
          ))}
        </View>

        <Text style={styles.section}>Badges</Text>
        <View style={styles.badgeGrid}>
          {state.badges.map((b) => (
            <View key={b.id} style={[styles.badge, !b.isUnlocked && { opacity: 0.3 }]}>
              <Text style={{ fontSize: 24 }}>{b.emoji}</Text>
              <Text style={styles.badgeName}>{b.name}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.section}>Cosmetics</Text>
        {state.cosmetics.map((raw) => {
          const item = syncCosmeticFromCatalog(raw);
          return (
          <GameCard key={item.id} style={styles.cosmeticRow}>
            <CosmeticIcon itemId={item.id} emoji={item.emoji} size={28} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.cosName}>{item.name}</Text>
              <Text style={styles.cosCat}>{item.category}</Text>
              {gearBuffLabel(item.category, item.id) ? (
                <Text style={styles.petBonus}>{gearBuffLabel(item.category, item.id)}</Text>
              ) : item.category === 'Pet' && PET_BUFFS[item.id] ? (
                <Text style={styles.petBonus}>{PET_BUFFS[item.id].label}</Text>
              ) : null}
            </View>
            {isEquipped(item) ? (
              <Text style={{ color: theme.accentGreen, fontWeight: '700' }}>Equipped</Text>
            ) : (
              <Pressable onPress={() => equip(item)}>
                <Text style={{ color: theme.accentGold, fontWeight: '700' }}>Equip</Text>
              </Pressable>
            )}
          </GameCard>
          );
        })}

        <Text style={styles.section}>Safety</Text>
        <GameCard style={{ marginBottom: 12 }}>
          <View style={styles.safeRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.safeTitle}>Safe Mode</Text>
              <Text style={styles.safeDesc}>
                Approximate location only when synced; exact GPS stays on your device.
              </Text>
            </View>
            <Switch value={state.safeModeEnabled} onValueChange={toggleSafeMode} trackColor={{ true: theme.accentPurple }} />
          </View>
          <View style={[styles.safeRow, { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: theme.cardBorder + '40' }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.safeTitle}>Play safety alerts</Text>
              <Text style={styles.safeDesc}>Warn when moving too fast or while driving.</Text>
            </View>
            <Switch
              value={state.playSafetyAlertsEnabled}
              onValueChange={togglePlaySafetyAlerts}
              trackColor={{ true: theme.accentPurple }}
            />
          </View>
          <Text style={styles.safetyCopy}>
            Stay aware of your surroundings. Never play while driving. Pause if you are moving too fast.
          </Text>
        </GameCard>

        <GameCard style={{ marginTop: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Ionicons name="map-outline" size={16} color={theme.accentBlue} />
            <Text style={styles.safeTitle}>Map appearance</Text>
          </View>
          <Text style={styles.safeDesc}>Dark or light style on the Map tab. Saved on this device.</Text>
          <View style={styles.mapThemeRow}>
            {(['dark', 'light'] as MapTheme[]).map((mode) => {
              const active = mapTheme === mode;
              return (
                <Pressable
                  key={mode}
                  onPress={() => setMapTheme(mode)}
                  style={[styles.mapThemeChip, active && styles.mapThemeChipActive]}
                  accessibilityLabel={mode === 'dark' ? 'Dark map' : 'Light map'}
                  accessibilityState={{ selected: active }}
                >
                  <Ionicons
                    name={mode === 'dark' ? 'moon' : 'sunny'}
                    size={18}
                    color={active ? theme.accentGold : theme.textMuted}
                  />
                  <Text style={[styles.mapThemeLabel, active && styles.mapThemeLabelActive]}>
                    {mode === 'dark' ? 'Dark' : 'Light'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </GameCard>

        <GameCard style={{ marginTop: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Ionicons name="save-outline" size={16} color={theme.accentGreen} />
            <Text style={styles.saveTitle}>Saved on device</Text>
          </View>
          <Text style={styles.saveDesc}>
            XP, gems, landmarks, chests, runs, and cosmetics persist on this phone with no account required.
          </Text>
          <Pressable
            onPress={async () => {
              await resetOnboardingFlag();
              Alert.alert('Tutorial reset', 'Close and reopen the app to see the welcome guide again.');
            }}
            style={{ marginBottom: 10 }}
          >
            <Text style={{ color: theme.accentBlue, fontWeight: '700' }}>Show tutorial again</Text>
          </Pressable>
          {showPrivacyLink ? (
            <Pressable
              onPress={() => void Linking.openURL(privacyPolicyUrl)}
              style={{ marginBottom: 10 }}
            >
              <Text style={{ color: theme.accentBlue, fontWeight: '700' }}>Privacy Policy</Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={() =>
              Alert.alert('Reset progress?', 'This clears all local save data.', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Reset',
                  style: 'destructive',
                  onPress: async () => {
                    await clearSavedState();
                    Alert.alert('Done', 'Restart the app to begin fresh.');
                  },
                },
              ])
            }
          >
            <Text style={styles.resetBtn}>Reset local save</Text>
          </Pressable>
        </GameCard>
      </ScrollView>
      <Toast message={state.toastMessage} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.backgroundDark },
  scroll: { padding: 16, paddingBottom: 40 },
  header: { alignItems: 'center', gap: 6, marginBottom: 16 },
  avatarWrap: { position: 'relative', marginBottom: 4 },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  avatarHat: { position: 'absolute', top: -4, right: -4, fontSize: 28 },
  avatarFallback: {
    backgroundColor: theme.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.accentPurple,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.accentGold,
    borderRadius: 999,
    padding: 6,
  },
  photoHint: { color: theme.textMuted, fontSize: 11 },
  usernameHint: { color: theme.textMuted, fontSize: 12, marginTop: 4, textAlign: 'center' },
  name: { color: '#fff', fontSize: 24, fontWeight: '800' },
  level: { color: theme.accentGold, fontWeight: '700' },
  betaBadge: {
    color: theme.accentPurple,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  xpText: { color: theme.textSecondary, fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  stat: { width: '48%', alignItems: 'center', padding: 14 },
  statVal: { color: '#fff', fontWeight: '800', fontSize: 18 },
  statLabel: { color: theme.textMuted, fontSize: 11 },
  resetBtn: { color: '#ff6666', fontWeight: '700', fontSize: 13 },
  titleBadge: { color: theme.accentGold, fontWeight: '700', fontSize: 13 },
  section: { color: '#fff', fontWeight: '800', fontSize: 16, marginBottom: 10, marginTop: 16 },
  accountLine: { color: '#fff', fontWeight: '700', fontSize: 16 },
  accountSub: { color: theme.textSecondary, fontSize: 12 },
  pathName: { color: '#fff', fontWeight: '800', fontSize: 15 },
  perk: { color: theme.textSecondary, fontSize: 12 },
  titleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  titleChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: theme.cardBackground, borderWidth: 1, borderColor: theme.cardBorder },
  titleLocked: { opacity: 0.6 },
  record: { color: theme.textSecondary, fontSize: 13, marginVertical: 2 },
  prCard: { marginBottom: 12 },
  petBonus: { color: theme.accentGreen, fontSize: 10, marginTop: 2 },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badge: { width: '22%', alignItems: 'center', padding: 8 },
  badgeName: { color: theme.textSecondary, fontSize: 9, textAlign: 'center' },
  cosmeticRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cosName: { color: '#fff', fontWeight: '700' },
  cosCat: { color: theme.textMuted, fontSize: 11 },
  safeRow: { flexDirection: 'row', alignItems: 'center' },
  safeTitle: { color: '#fff', fontWeight: '700' },
  safeDesc: { color: theme.textMuted, fontSize: 11 },
  safetyCopy: { color: theme.textSecondary, fontSize: 11, lineHeight: 16, marginTop: 14 },
  saveTitle: { color: '#fff', fontWeight: '700' },
  saveDesc: { color: theme.textSecondary, fontSize: 12, marginBottom: 10 },
  mapThemeRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  mapThemeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: theme.cardBackground,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  mapThemeChipActive: { borderColor: theme.accentGold, borderWidth: 2 },
  mapThemeLabel: { color: theme.textMuted, fontWeight: '700', fontSize: 14 },
  mapThemeLabelActive: { color: '#fff' },
});
