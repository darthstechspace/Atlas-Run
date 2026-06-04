import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { theme } from '../theme';
import type { Badge, ChestReward, LandmarkDiscovery, ChestRarity } from '../types';

export function GameCard({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function GlowButton({ label, onPress, color = theme.accentGold, disabled }: { label: string; onPress: () => void; color?: string; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[styles.glowBtn, { backgroundColor: color, opacity: disabled ? 0.5 : 1 }]}>
      <Text style={styles.glowBtnText}>{label}</Text>
    </Pressable>
  );
}

export function XPBar({ progress, level }: { progress: number; level: number }) {
  return (
    <View style={styles.xpWrap}>
      <View style={styles.xpTrack}>
        <View style={[styles.xpFill, { width: `${Math.min(progress * 100, 100)}%` }]} />
      </View>
      <Text style={styles.xpLabel}>Lv.{level}</Text>
    </View>
  );
}

export function Toast({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <View style={styles.toastWrap} pointerEvents="none">
      <Text style={styles.toast}>{message}</Text>
    </View>
  );
}

export function RewardModal({ reward, visible, onDismiss }: { reward?: ChestReward; visible: boolean; onDismiss: () => void }) {
  if (!reward) return null;
  const tier = reward.chestRarity ?? 'Common';
  const title =
    tier === 'Legendary'
      ? '🌟 LEGENDARY CHEST! 🌟'
      : tier === 'Epic'
        ? '✨ EPIC CHEST! ✨'
        : tier === 'Rare'
          ? '💎 Rare Chest!'
          : '📦 Treasure Chest!';
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalBg}>
        <GameCard style={styles.rewardCard}>
          <Text style={[styles.rewardTitle, (reward.isRare || tier === 'Legendary') && { color: theme.accentGold }]}>
            {title}
          </Text>
          <Text style={styles.rewardLine}>⚡ +{reward.xp} XP</Text>
          <Text style={[styles.rewardLine, { color: theme.accentGold }]}>💎 +{reward.gems} Gems</Text>
          {reward.cosmetic && (
            <Text style={[styles.rewardLine, { color: theme.accentPurple }]}>
              {reward.cosmetic.emoji} {reward.cosmetic.name}
            </Text>
          )}
          <GlowButton label="Collect" onPress={onDismiss} />
        </GameCard>
      </View>
    </Modal>
  );
}

const CATEGORY_EMOJI: Record<string, string> = {
  Museum: '🏛️',
  Park: '🌳',
  Library: '📚',
  Historic: '🏛️',
  Monument: '🗿',
  Trail: '🥾',
};

export function BadgeUnlockModal({
  badge,
  visible,
  queueCount = 1,
  onDismiss,
}: {
  badge?: Badge;
  visible: boolean;
  queueCount?: number;
  onDismiss: () => void;
}) {
  if (!badge) return null;
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalBg}>
        <GameCard style={styles.rewardCard}>
          <Text style={styles.badgeUnlockLabel}>🏆 Badge Unlocked</Text>
          <Text style={styles.landmarkEmoji}>{badge.emoji}</Text>
          <Text style={styles.landmarkName}>{badge.name}</Text>
          <Text style={styles.badgeUnlockDesc}>{badge.description}</Text>
          <Text style={styles.badgeUnlockReq}>{badge.requirement}</Text>
          {queueCount > 1 ? (
            <Text style={styles.badgeQueueHint}>+{queueCount - 1} more waiting</Text>
          ) : null}
          <GlowButton label="Awesome" onPress={onDismiss} />
        </GameCard>
      </View>
    </Modal>
  );
}

export function LandmarkFoundModal({
  discovery,
  visible,
  onDismiss,
}: {
  discovery?: LandmarkDiscovery;
  visible: boolean;
  onDismiss: () => void;
}) {
  if (!discovery) return null;
  const { landmark, xp, gems } = discovery;
  const emoji = CATEGORY_EMOJI[landmark.category] ?? '📍';
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalBg}>
        <GameCard style={styles.rewardCard}>
          <Text style={styles.landmarkFoundLabel}>📍 New Landmark Found</Text>
          <Text style={styles.landmarkEmoji}>{emoji}</Text>
          <Text style={styles.landmarkName}>{landmark.name}</Text>
          <Text style={styles.landmarkCategory}>{landmark.category}</Text>
          <Text style={styles.rewardLine}>⚡ +{xp} XP</Text>
          <Text style={[styles.rewardLine, { color: theme.accentGold }]}>💎 +{gems} Gems</Text>
          <GlowButton label="Add to Collection" onPress={onDismiss} />
        </GameCard>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.cardBorder + '80',
    padding: 16,
  },
  glowBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
  },
  glowBtnText: { fontWeight: '800', color: '#000', fontSize: 15 },
  xpWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, width: '100%', minWidth: 0 },
  xpTrack: { flex: 1, height: 8, backgroundColor: '#ffffff20', borderRadius: 4, overflow: 'hidden', minWidth: 0 },
  xpFill: { height: '100%', backgroundColor: theme.accentPurple, borderRadius: 4 },
  xpLabel: { color: theme.accentGold, fontSize: 11, fontWeight: '700', flexShrink: 0 },
  toastWrap: { position: 'absolute', bottom: 100, left: 0, right: 0, alignItems: 'center', zIndex: 999 },
  toast: { backgroundColor: '#000000cc', color: '#fff', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 999, fontWeight: '700', overflow: 'hidden' },
  modalBg: { flex: 1, backgroundColor: '#000000b0', justifyContent: 'center', padding: 24 },
  rewardCard: { alignItems: 'center', gap: 12 },
  rewardTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  rewardLine: { fontSize: 17, fontWeight: '700', color: theme.accentBlue },
  landmarkFoundLabel: { fontSize: 16, fontWeight: '800', color: theme.accentGreen, textAlign: 'center' },
  landmarkEmoji: { fontSize: 40, textAlign: 'center' },
  landmarkName: { fontSize: 20, fontWeight: '800', color: '#fff', textAlign: 'center' },
  landmarkCategory: { fontSize: 13, color: theme.textSecondary, textAlign: 'center', marginBottom: 4 },
  badgeUnlockLabel: { fontSize: 16, fontWeight: '800', color: theme.accentGold, textAlign: 'center' },
  badgeUnlockDesc: { fontSize: 14, color: theme.textSecondary, textAlign: 'center', lineHeight: 20 },
  badgeUnlockReq: { fontSize: 11, color: theme.textMuted, textAlign: 'center', fontStyle: 'italic' },
  badgeQueueHint: { fontSize: 11, color: theme.accentPurple, fontWeight: '700' },
});
