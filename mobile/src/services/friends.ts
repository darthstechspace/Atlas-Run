import type { Friend, LeaderboardEntry } from '../types';
import { weekStartDateKey } from '../lib/dates';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { getSocialBanner } from '../gearBuffs';

export type PendingFriendRequest = {
  id: string;
  requesterId: string;
  addresseeId: string;
  username: string;
  status: string;
  isIncoming: boolean;
};

type PublicProfileRow = {
  id: string;
  username: string;
  level?: number;
  avatar_url?: string | null;
  equipped?: { banner?: string } | null;
};

type FriendProfileRow = PublicProfileRow & {
  safe_mode_enabled?: boolean;
  public_lat?: number | null;
  public_lng?: number | null;
};

type SendFriendRequestResult = {
  ok: boolean;
  error?: string;
  accepted?: boolean;
  username?: string;
};

export async function fetchCloudUsername(userId: string): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const sb = getSupabase();
  const { data, error } = await sb.from('profiles').select('username').eq('id', userId).maybeSingle();
  if (error || !data?.username) return null;
  return data.username;
}

export async function searchProfileByUsername(username: string): Promise<{ id: string; username: string } | null> {
  if (!isSupabaseConfigured) return null;
  const sb = getSupabase();
  const { data, error } = await sb.rpc('search_profiles_by_username', { p_username: username.trim() });
  if (error || !data?.length) return null;
  const row = data[0] as { id: string; username: string };
  return row;
}

/** Sends a friend request by username; works across iOS/Android with the same Supabase account. */
export async function sendFriendRequestByUsername(username: string): Promise<SendFriendRequestResult> {
  if (!isSupabaseConfigured) return { ok: false, error: 'Not configured' };
  const trimmed = username.trim();
  if (!trimmed) return { ok: false, error: 'Enter a username' };

  const sb = getSupabase();
  const { data, error } = await sb.rpc('send_friend_request', { p_username: trimmed });
  if (error) return { ok: false, error: error.message };
  return (data ?? { ok: false, error: 'Unknown error' }) as SendFriendRequestResult;
}

export async function respondFriendRequest(
  friendshipId: string,
  status: 'accepted' | 'declined'
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { ok: false, error: 'Not configured' };
  const sb = getSupabase();
  const { error } = await sb.from('friendships').update({ status }).eq('id', friendshipId);
  return { ok: !error, error: error?.message };
}

export async function fetchFriends(userId: string): Promise<Friend[]> {
  if (!isSupabaseConfigured) return [];
  const sb = getSupabase();

  const { data: friendships } = await sb
    .from('friendships')
    .select('id, requester_id, addressee_id, status')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .eq('status', 'accepted');

  if (!friendships?.length) return [];

  const friendIds = friendships.map((f) => (f.requester_id === userId ? f.addressee_id : f.requester_id));
  const { data: profiles, error } = await sb.rpc('get_friend_profiles', { p_user_ids: friendIds });
  if (error || !profiles?.length) return [];

  const weekStart = weekStartDateKey(new Date());
  const { data: stats } = await sb.from('weekly_stats').select('user_id, miles').eq('week_start', weekStart);
  const milesMap = new Map((stats ?? []).map((s) => [s.user_id, s.miles]));

  const { data: zoneCounts } = await sb.from('unlocked_areas').select('user_id');
  const zoneMap = new Map<string, number>();
  (zoneCounts ?? []).forEach((z) => zoneMap.set(z.user_id, (zoneMap.get(z.user_id) ?? 0) + 1));

  const { data: landmarkProfiles } = await sb
    .from('profiles')
    .select('id, collected_landmarks')
    .in('id', friendIds);
  const landmarkMap = new Map<string, number>();
  (landmarkProfiles ?? []).forEach((row) => {
    const arr = row.collected_landmarks;
    if (!Array.isArray(arr)) {
      landmarkMap.set(row.id, 0);
      return;
    }
    const ids = new Set(
      arr
        .map((item: unknown) =>
          typeof item === 'string' ? item : (item as { landmarkId?: string })?.landmarkId
        )
        .filter(Boolean)
    );
    landmarkMap.set(row.id, ids.size);
  });

  return (profiles as FriendProfileRow[]).map((p) => {
    const equipped = p.equipped as { banner?: string } | null;
    const socialBanner = getSocialBanner(equipped?.banner) ?? undefined;
    return {
      id: p.id,
      name: p.username,
      level: p.level ?? 1,
      weeklyMiles: milesMap.get(p.id) ?? 0,
      unlockedAreas: zoneMap.get(p.id) ?? 0,
      landmarksFound: landmarkMap.get(p.id) ?? 0,
      avatarEmoji: '🏃',
      isOnline: false,
      socialBanner,
    };
  });
}

export async function fetchPendingRequests(userId: string): Promise<PendingFriendRequest[]> {
  if (!isSupabaseConfigured) return [];
  const sb = getSupabase();
  const { data } = await sb
    .from('friendships')
    .select('id, requester_id, addressee_id, status')
    .eq('status', 'pending')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

  if (!data?.length) return [];

  const otherIds = data.map((r) => (r.requester_id === userId ? r.addressee_id : r.requester_id));
  const { data: profiles } = await sb.rpc('get_public_profile_fields', { p_user_ids: otherIds });
  const nameMap = new Map((profiles as PublicProfileRow[] ?? []).map((p) => [p.id, p.username]));

  return data.map((r) => {
    const otherId = r.requester_id === userId ? r.addressee_id : r.requester_id;
    return {
      id: r.id,
      requesterId: r.requester_id,
      addresseeId: r.addressee_id,
      username: nameMap.get(otherId) ?? 'Runner',
      status: r.status,
      isIncoming: r.addressee_id === userId,
    };
  });
}

export async function fetchLeaderboard(
  userId: string,
  category: string,
  scope: 'global' | 'friends'
): Promise<LeaderboardEntry[]> {
  if (!isSupabaseConfigured) return [];
  const sb = getSupabase();
  const { data, error } = await sb.rpc('get_leaderboard', {
    p_category: category,
    p_scope: scope,
    p_limit: 50,
  });

  if (error || !data) return [];

  const userIds = data.map((row: { user_id: string }) => row.user_id);
  const { data: profiles } = await sb.rpc('get_public_profile_fields', { p_user_ids: userIds });
  const bannerMap = new Map(
    ((profiles as PublicProfileRow[]) ?? []).map((p) => {
      const equipped = p.equipped as { banner?: string } | null;
      return [p.id, getSocialBanner(equipped?.banner) ?? undefined] as const;
    })
  );

  return data.map(
    (row: { user_id: string; username: string; score: number; rank: number }, i: number) => ({
      id: row.user_id,
      name: row.username,
      weeklyMiles: Number(row.score),
      rank: Number(row.rank) || i + 1,
      isCurrentUser: row.user_id === userId,
      socialBanner: bannerMap.get(row.user_id),
    })
  );
}
