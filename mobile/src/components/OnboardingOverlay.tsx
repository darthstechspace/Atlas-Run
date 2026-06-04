import { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameCard, GlowButton } from './UI';
import { theme } from '../theme';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  getAtlasLandmarkGoal,
  BOSTON_LANDMARK_GOAL,
  WORCESTER_LANDMARK_GOAL,
} from '../data/landmarkCatalog';
import { APP_VERSION_SHORT } from '../config/version';

const ONBOARDING_KEY = '@atlasrun/onboarding_v4';

const STEPS = [
  {
    emoji: '📍',
    title: 'Discover landmarks',
    body: `Walk within ~80m of real sites in Boston (${BOSTON_LANDMARK_GOAL}), Worcester (${WORCESTER_LANDMARK_GOAL}), Salem, and Springfield. ${getAtlasLandmarkGoal()} landmarks across Massachusetts (+50 XP and +10 gems each).`,
  },
  {
    emoji: '🔦',
    title: 'Gear up',
    body: 'Flashlights widen your explore radius. Banners show on your Social profile and boost run XP or gem rewards. Buy and equip items in the Shop.',
  },
  {
    emoji: '📦',
    title: 'Find treasure chests',
    body: 'Chests spawn as you move. Tap one on the map and get close to open it for XP, gems, and cosmetics.',
  },
  {
    emoji: '🏃',
    title: 'Track your runs',
    body: 'Tap Start Run on the map, walk or jog, then End Run. Miles and XP save to your phone even without an account.',
  },
  {
    emoji: '☁️',
    title: 'Play for free',
    body: isSupabaseConfigured
      ? "You're signed in, so progress can sync to the cloud. Friends and leaderboards use Supabase (free tier)."
      : 'No account needed. Add Supabase to mobile/.env later for cloud save and friends. Everything else works offline.',
  },
  {
    emoji: '⚠️',
    title: 'Play safely',
    body: 'Stay aware of your surroundings. Never play while driving. Pause if you are moving too fast.',
  },
];

export function OnboardingOverlay() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    (async () => {
      const done = await AsyncStorage.getItem(ONBOARDING_KEY);
      if (!done) setVisible(true);
    })();
  }, []);

  async function finish() {
    await AsyncStorage.setItem(ONBOARDING_KEY, '1');
    setVisible(false);
  }

  function next() {
    if (step >= STEPS.length - 1) void finish();
    else setStep((s) => s + 1);
  }

  if (!visible) return null;

  const current = STEPS[step];

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.bg}>
        <GameCard style={styles.card}>
          <ScrollView contentContainerStyle={styles.scroll}>
            <Text style={styles.stepLabel}>
              Welcome to Atlas Run {APP_VERSION_SHORT} ({step + 1}/{STEPS.length})
            </Text>
            <Text style={styles.emoji}>{current.emoji}</Text>
            <Text style={styles.title}>{current.title}</Text>
            <Text style={styles.body}>{current.body}</Text>
          </ScrollView>
          <GlowButton label={step >= STEPS.length - 1 ? 'Start Exploring' : 'Next'} onPress={next} />
          {step > 0 ? (
            <Pressable onPress={() => void finish()}>
              <Text style={styles.skip}>Skip</Text>
            </Pressable>
          ) : null}
        </GameCard>
      </View>
    </Modal>
  );
}

export async function resetOnboardingFlag(): Promise<void> {
  await AsyncStorage.removeItem(ONBOARDING_KEY);
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#000000cc', justifyContent: 'center', padding: 24 },
  card: { gap: 16, maxHeight: '80%' },
  scroll: { alignItems: 'center', paddingBottom: 8 },
  stepLabel: { color: theme.textMuted, fontSize: 12, fontWeight: '700', marginBottom: 8 },
  emoji: { fontSize: 48, marginBottom: 8 },
  title: { color: '#fff', fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 10 },
  body: { color: theme.textSecondary, fontSize: 15, lineHeight: 22, textAlign: 'center' },
  skip: { color: theme.textMuted, textAlign: 'center', fontWeight: '700', marginTop: 4 },
});
