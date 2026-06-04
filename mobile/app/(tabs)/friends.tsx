import { useState, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, Alert, TextInput, Share } from 'react-native';
import { useGame } from '../../src/GameContext';
import { GameCard, Toast } from '../../src/components/UI';
import { theme } from '../../src/theme';
import { LEADERBOARD_CATEGORIES } from '../../src/v3/data';
import type { LeaderboardEntry, SocialBanner } from '../../src/types';
import { isSupabaseConfigured } from '../../src/lib/supabase';
import { getSocialBanner } from '../../src/gearBuffs';

type Tab = 'leaderboards' | 'friends' | 'feed';

function formatTimeAgo(timestamp: number) {
  const sec = Math.floor((Date.now() - timestamp) / 1000);
  if (sec < 60) return 'just now';
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

function InfoBanner({ title, body }: { title: string; body: string }) {
  return (
    <GameCard style={{ marginBottom: 12, borderColor: theme.accentBlue + '55' }}>
      <Text style={styles.infoTitle}>{title}</Text>
      <Text style={styles.infoBody}>{body}</Text>
    </GameCard>
  );
}

function SocialBannerBadge({ banner, compact }: { banner: SocialBanner; compact?: boolean }) {
  return (
    <View style={[styles.socialBanner, compact && styles.socialBannerCompact]}>
      <Text style={styles.socialBannerEmoji}>{banner.emoji}</Text>
      <Text style={[styles.socialBannerName, compact && styles.socialBannerNameCompact]} numberOfLines={1}>
        {banner.name}
      </Text>
    </View>
  );
}

export default function SocialScreen() {
  const {
    state,
    getLeaderboardByCategory,
    searchAndAddFriend,
    pendingFriendRequests,
    acceptFriendRequest,
    declineFriendRequest,
    refreshFriends,
  } = useGame();

  const [tab, setTab] = useState<Tab>('leaderboards');
  const [lbCategory, setLbCategory] = useState('distance');
  const [lbScope, setLbScope] = useState<'global' | 'friends'>('global');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [friendQuery, setFriendQuery] = useState('');

  const cat = LEADERBOARD_CATEGORIES.find((c) => c.id === lbCategory);
  const mySocialBanner = getSocialBanner(state.equipped.banner);

  useEffect(() => {
    (async () => {
      const rows = await getLeaderboardByCategory(lbCategory, lbScope);
      setLeaderboard(rows);
    })();
  }, [
    lbCategory,
    lbScope,
    getLeaderboardByCategory,
    state.totalMiles,
    state.unlockedAreas.length,
    state.collectedLandmarks.length,
    state.level,
  ]);

  async function handleAddFriend() {
    const username = friendQuery.trim();
    if (!username) return;
    const result = await searchAndAddFriend(username);
    if (result.ok) {
      setFriendQuery('');
      if ('accepted' in result && result.accepted) {
        Alert.alert('Friends!', `You and ${username} are now friends.`);
      } else {
        Alert.alert('Sent', `Friend request sent to ${username}. They can accept on any device when signed in.`);
      }
    } else {
      Alert.alert('Error', result.error ?? 'Could not send request');
    }
  }

  async function shareUsername() {
    await Share.share({
      message: `Add me on Atlas Run! Search my username: ${state.username}`,
    });
  }

  const incomingRequests = pendingFriendRequests.filter((r) => r.isIncoming);
  const outgoingRequests = pendingFriendRequests.filter((r) => !r.isIncoming);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'leaderboards', label: 'Ranks' },
    { id: 'friends', label: 'Friends' },
    { id: 'feed', label: 'Feed' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs} contentContainerStyle={styles.tabsInner}>
        {tabs.map((t) => (
          <Pressable key={t.id} style={[styles.tab, tab === t.id && styles.tabActive]} onPress={() => setTab(t.id)}>
            <Text style={[styles.tabText, tab === t.id && styles.tabTextActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.scroll}>
        <GameCard style={{ marginBottom: 12, borderColor: theme.accentGold + '55', borderWidth: 1 }}>
          <Text style={styles.sectionHint}>Your social banner</Text>
          {mySocialBanner ? (
            <SocialBannerBadge banner={mySocialBanner} />
          ) : (
            <Text style={styles.bannerHint}>Equip a banner in the Shop to show it here and to friends.</Text>
          )}
        </GameCard>

        {tab === 'leaderboards' && (
          <>
            {!isSupabaseConfigured ? (
              <InfoBanner
                title="Local ranks"
                body="Add Supabase to mobile/.env for live global leaderboards. Rankings below use your save and any friends on this device."
              />
            ) : null}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {(['global', 'friends'] as const).map((s) => (
                <Pressable key={s} style={[styles.chip, lbScope === s && styles.chipActive]} onPress={() => setLbScope(s)}>
                  <Text style={[styles.chipText, lbScope === s && styles.chipTextActive]}>
                    {s === 'global' ? 'Global' : 'Friends'}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.chipRow, { marginBottom: 12 }]}>
              {LEADERBOARD_CATEGORIES.map((c) => (
                <Pressable key={c.id} style={[styles.chip, lbCategory === c.id && styles.chipActive]} onPress={() => setLbCategory(c.id)}>
                  <Text style={[styles.chipText, lbCategory === c.id && styles.chipTextActive]}>{c.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <GameCard>
              {leaderboard.length === 0 ? (
                <Text style={styles.empty}>No leaderboard data yet. Run to climb the ranks!</Text>
              ) : (
                leaderboard.map((e) => (
                  <View key={e.id} style={styles.lbRow}>
                    <Text style={styles.rank}>{e.rank <= 3 ? ['🥇', '🥈', '🥉'][e.rank - 1] : `#${e.rank}`}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.lbName, e.isCurrentUser && { color: theme.accentGold }]}>
                        {e.name}{e.isCurrentUser ? ' (You)' : ''}
                      </Text>
                      {e.socialBanner ? <SocialBannerBadge banner={e.socialBanner} compact /> : null}
                    </View>
                    <Text style={styles.lbScore}>
                      {e.weeklyMiles.toFixed(cat?.id === 'level' || cat?.id === 'fog' || cat?.id === 'landmarks' ? 0 : 1)} {cat?.unit}
                    </Text>
                  </View>
                ))
              )}
            </GameCard>
          </>
        )}

        {tab === 'friends' && (
          <>
            {!isSupabaseConfigured ? (
              <InfoBanner
                title="Friends require an account"
                body="Set up free Supabase (see FREE_SETUP.txt) to add friends on iOS or Android. Solo play works offline without signing in."
              />
            ) : (
              <GameCard style={{ marginBottom: 12, borderColor: theme.accentGreen + '55', borderWidth: 1 }}>
                <Text style={styles.sectionHint}>Your username (share with friends)</Text>
                <Text style={styles.myUsername}>{state.username}</Text>
                <Text style={styles.bannerHint}>
                  Friends on another phone search this exact username while signed into the same Atlas Run cloud.
                </Text>
                <Pressable onPress={shareUsername} style={{ marginTop: 8 }}>
                  <Text style={styles.shareLink}>Share username</Text>
                </Pressable>
                <Pressable onPress={() => void refreshFriends()} style={{ marginTop: 6 }}>
                  <Text style={styles.refreshLink}>Refresh requests</Text>
                </Pressable>
              </GameCard>
            )}
            {state.safeModeEnabled ? (
              <GameCard style={{ marginBottom: 12, borderColor: theme.accentPurple + '88' }}>
                <Text style={styles.safeModeBanner}>Safe Mode on: friends see approximate location only</Text>
              </GameCard>
            ) : null}
            <View style={styles.addRow}>
              <TextInput
                style={styles.input}
                placeholder="Search username"
                placeholderTextColor={theme.textMuted}
                value={friendQuery}
                onChangeText={setFriendQuery}
                autoCapitalize="none"
                editable={isSupabaseConfigured}
              />
              <Pressable style={[styles.addBtn, !isSupabaseConfigured && styles.addBtnDisabled]} onPress={handleAddFriend} disabled={!isSupabaseConfigured}>
                <Text style={styles.addText}>Add</Text>
              </Pressable>
            </View>

            {incomingRequests.length > 0 && (
              <>
                <Text style={styles.sectionHint}>Incoming Requests</Text>
                {incomingRequests.map((req) => (
                  <GameCard key={req.id} style={{ marginBottom: 8 }}>
                    <Text style={styles.friendName}>{req.username}</Text>
                    <Text style={styles.pendingHint}>Wants to be friends</Text>
                    <View style={styles.actionRow}>
                      <Pressable style={styles.actionBtn} onPress={() => acceptFriendRequest(req.id)}>
                        <Text style={styles.accept}>Accept</Text>
                      </Pressable>
                      <Pressable style={styles.actionBtn} onPress={() => declineFriendRequest(req.id)}>
                        <Text style={styles.decline}>Decline</Text>
                      </Pressable>
                    </View>
                  </GameCard>
                ))}
              </>
            )}

            {outgoingRequests.length > 0 && (
              <>
                <Text style={styles.sectionHint}>Sent Requests</Text>
                {outgoingRequests.map((req) => (
                  <GameCard key={req.id} style={{ marginBottom: 8, opacity: 0.9 }}>
                    <Text style={styles.friendName}>{req.username}</Text>
                    <Text style={styles.pendingHint}>Waiting for them to accept on their device</Text>
                  </GameCard>
                ))}
              </>
            )}

            {state.friends.length === 0 ? (
              <Text style={styles.empty}>No friends yet. Search by username to connect!</Text>
            ) : (
              state.friends.map((f) => (
                <GameCard key={f.id} style={{ marginBottom: 12 }}>
                  <Text style={styles.friendName}>{f.avatarEmoji} {f.name} | Lv.{f.level}</Text>
                  {f.socialBanner ? (
                    <View style={{ marginTop: 6 }}>
                      <SocialBannerBadge banner={f.socialBanner} />
                    </View>
                  ) : null}
                  <Text style={styles.friendStats}>{f.weeklyMiles.toFixed(1)} mi | {f.unlockedAreas} zones</Text>
                  <View style={styles.actionRow}>
                    <Pressable
                      style={styles.actionBtn}
                      onPress={() =>
                        Alert.alert(
                          f.name,
                          `Level ${f.level}\n${f.weeklyMiles.toFixed(1)} mi this week\n${f.unlockedAreas} zones cleared${
                            f.socialBanner ? `\nBanner: ${f.socialBanner.emoji} ${f.socialBanner.name}` : ''
                          }`
                        )
                      }
                    >
                      <Text style={styles.profile}>Profile</Text>
                    </Pressable>
                  </View>
                </GameCard>
              ))
            )}
          </>
        )}

        {tab === 'feed' && (
          <>
            {(state.activityLog?.length ?? 0) === 0 ? (
              <GameCard>
                <Text style={styles.infoTitle}>Your activity feed</Text>
                <Text style={styles.infoBody}>
                  Discover landmarks, open chests, and finish runs. Your actions will appear here as you play.
                </Text>
              </GameCard>
            ) : (
              <>
                <Text style={styles.sectionHint}>Your activity</Text>
                {state.activityLog.map((item) => (
                  <GameCard key={item.id} style={{ marginBottom: 8 }}>
                    <View style={styles.feedRow}>
                      <Text style={styles.feedEmoji}>{item.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.feedText}>{item.text}</Text>
                        <Text style={styles.feedTime}>{formatTimeAgo(item.timestamp)}</Text>
                      </View>
                    </View>
                  </GameCard>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
      <Toast message={state.toastMessage} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.backgroundDark },
  tabs: { maxHeight: 48 },
  tabsInner: { paddingHorizontal: 12, paddingTop: 8, gap: 8 },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: theme.cardBorder, marginRight: 8 },
  tabActive: { backgroundColor: theme.accentGold, borderColor: theme.accentGold },
  tabText: { color: theme.textSecondary, fontWeight: '700', fontSize: 13 },
  tabTextActive: { color: '#000' },
  scroll: { padding: 16, paddingBottom: 40 },
  chipRow: { marginBottom: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: theme.accentBlue + '60', marginRight: 8 },
  chipActive: { backgroundColor: theme.accentBlue },
  chipText: { color: theme.accentBlue, fontSize: 11, fontWeight: '700' },
  chipTextActive: { color: '#fff' },
  lbRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.cardBorder + '30' },
  rank: { width: 36, fontSize: 16 },
  lbName: { color: '#fff', fontWeight: '700' },
  lbScore: { color: theme.accentGold, fontWeight: '700' },
  addRow: { flexDirection: 'row', gap: 8, marginBottom: 12, alignItems: 'center' },
  input: {
    flex: 1,
    backgroundColor: theme.cardBackground,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    borderRadius: 12,
    padding: 12,
    color: '#fff',
  },
  addBtn: { borderWidth: 1, borderColor: theme.accentBlue, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 },
  addBtnDisabled: { opacity: 0.45 },
  addText: { color: theme.accentBlue, fontWeight: '700' },
  friendName: { color: '#fff', fontWeight: '800', fontSize: 16 },
  friendStats: { color: theme.textSecondary, fontSize: 12, marginVertical: 4 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  actionBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: theme.cardBorder },
  profile: { color: theme.accentBlue, fontWeight: '700', fontSize: 11 },
  accept: { color: theme.accentGreen, fontWeight: '700', fontSize: 11 },
  decline: { color: '#ff6666', fontWeight: '700', fontSize: 11 },
  safeModeBanner: { color: theme.accentPurple, fontSize: 12, fontWeight: '600' },
  sectionHint: { color: theme.textSecondary, marginBottom: 8, fontWeight: '700' },
  empty: { color: theme.textMuted, textAlign: 'center', padding: 20 },
  feedRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  feedEmoji: { fontSize: 22 },
  feedText: { color: '#fff', fontSize: 14 },
  feedTime: { color: theme.textMuted, fontSize: 11, marginTop: 4 },
  infoTitle: { color: '#fff', fontWeight: '800', fontSize: 16, marginBottom: 4 },
  infoBody: { color: theme.textSecondary, fontSize: 13, lineHeight: 18 },
  socialBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: theme.accentGold + '22',
    borderWidth: 1,
    borderColor: theme.accentGold + '66',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  socialBannerCompact: { marginTop: 4, paddingHorizontal: 8, paddingVertical: 4 },
  socialBannerEmoji: { fontSize: 18 },
  socialBannerName: { color: theme.accentGold, fontWeight: '800', fontSize: 13 },
  socialBannerNameCompact: { fontSize: 11 },
  bannerHint: { color: theme.textMuted, fontSize: 13, lineHeight: 18 },
  myUsername: { color: theme.accentGold, fontSize: 22, fontWeight: '900', marginBottom: 4 },
  shareLink: { color: theme.accentBlue, fontWeight: '700' },
  refreshLink: { color: theme.textMuted, fontWeight: '600', fontSize: 12 },
  pendingHint: { color: theme.textSecondary, fontSize: 12, marginBottom: 4 },
});
