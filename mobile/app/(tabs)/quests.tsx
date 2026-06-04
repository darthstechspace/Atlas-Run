import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useGame } from '../../src/GameContext';
import { GameCard, GlowButton, Toast } from '../../src/components/UI';
import { theme } from '../../src/theme';
import type { Quest } from '../../src/types';

function QuestCard({ quest, onClaim }: { quest: Quest; onClaim: () => void }) {
  const progress = Math.min(quest.currentValue / quest.targetValue, 1);
  const complete = quest.currentValue >= quest.targetValue;
  return (
    <GameCard style={{ marginBottom: 12, opacity: quest.isClaimed ? 0.7 : 1 }}>
      <Text style={styles.title}>{quest.title}</Text>
      <Text style={styles.desc}>{quest.description}</Text>
      <View style={styles.barTrack}><View style={[styles.barFill, { width: `${progress * 100}%`, backgroundColor: complete ? theme.accentGreen : theme.accentPurple }]} /></View>
      <Text style={styles.progress}>{quest.currentValue} / {quest.targetValue}</Text>
      <View style={styles.rewardRow}>
        <Text style={styles.gems}>💎 +{quest.gemReward}</Text>
        {quest.itemReward && <Text style={styles.item}>🎁 {quest.itemReward}</Text>}
        {complete && !quest.isClaimed ? (
          <GlowButton label="Claim" onPress={onClaim} />
        ) : quest.isClaimed ? (
          <Text style={styles.claimed}>Claimed</Text>
        ) : (
          <Text style={styles.claimed}>In Progress</Text>
        )}
      </View>
    </GameCard>
  );
}

export default function QuestsScreen() {
  const { state, claimQuest } = useGame();
  const daily = state.quests.filter((q) => q.type === 'daily');
  const weekly = state.quests.filter((q) => q.type === 'weekly');

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <GameCard style={styles.header}>
          <Text style={styles.headerLabel}>Your Gems</Text>
          <Text style={styles.gemsBig}>💎 {state.gems}</Text>
          <Text style={styles.streak}>🔥 {state.streakDays} day streak</Text>
        </GameCard>
        <Text style={styles.section}>☀️ Daily Quests</Text>
        {daily.map((q) => <QuestCard key={q.id} quest={q} onClaim={() => claimQuest(q.id)} />)}
        <Text style={styles.section}>📅 Weekly Quests</Text>
        {weekly.map((q) => <QuestCard key={q.id} quest={q} onClaim={() => claimQuest(q.id)} />)}
      </ScrollView>
      <Toast message={state.toastMessage} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.backgroundDark },
  scroll: { padding: 16, paddingBottom: 40 },
  header: { marginBottom: 20, alignItems: 'center' },
  headerLabel: { color: theme.textMuted, fontSize: 12 },
  gemsBig: { color: theme.accentGold, fontSize: 28, fontWeight: '800' },
  streak: { color: '#fff', marginTop: 4 },
  section: { color: '#fff', fontWeight: '800', fontSize: 16, marginBottom: 10, marginTop: 8 },
  title: { color: '#fff', fontWeight: '800', fontSize: 16 },
  desc: { color: theme.textSecondary, fontSize: 12, marginVertical: 4 },
  barTrack: { height: 8, backgroundColor: '#ffffff15', borderRadius: 4, overflow: 'hidden', marginVertical: 8 },
  barFill: { height: '100%', borderRadius: 4 },
  progress: { color: theme.textSecondary, fontSize: 11, marginBottom: 8 },
  rewardRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  gems: { color: theme.accentGold, fontWeight: '700' },
  item: { color: theme.accentPurple, fontSize: 12 },
  claimed: { color: theme.textMuted, fontWeight: '600', marginLeft: 'auto' },
});
