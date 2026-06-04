import type { GameStateShape } from '../gameState';
import {
  createInitialState,
  INITIAL_BADGES,
  INITIAL_GHOST_RUNS,
  INITIAL_QUESTS,
  SHOP_ITEMS,
} from '../gameState';
import type { Landmark, LandmarkRarity, UnlockedArea } from '../types';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { resolvePublicLocation } from '../safety/locationPrivacy';
import { getAtlasLandmarkCatalog, mergeLandmarkCatalog } from '../data/landmarkCatalog';
import {
  collectedFromUserLandmarkRows,
  mergeCollectedLandmarks,
  normalizeCollectedLandmarks,
} from '../lib/collectedLandmarks';

export type PullResult =
  | { ok: true; state: GameStateShape; serverVersion: number }
  | { ok: false; error: string };

export type PushResult = { ok: true; serverVersion: number } | { ok: false; error: string };

function rowToLandmark(row: {
  place_id: string;
  name: string;
  latitude: number;
  longitude: number;
  category: string;
  rarity: string;
  lore: string | null;
  last_opened_at?: string | null;
}): Landmark {
  return {
    id: row.place_id,
    name: row.name,
    latitude: row.latitude,
    longitude: row.longitude,
    category: row.category as Landmark['category'],
    rarity: row.rarity as LandmarkRarity,
    lore: row.lore ?? '',
    lastOpenedAt: row.last_opened_at ? new Date(row.last_opened_at).getTime() : undefined,
  };
}

export async function pullCloudSave(userId: string): Promise<PullResult> {
  if (!isSupabaseConfigured) return { ok: false, error: 'Supabase not configured' };

  try {
    const sb = getSupabase();
    const { data: profile, error: profileErr } = await sb
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileErr || !profile) return { ok: false, error: profileErr?.message ?? 'Profile not found' };

    const { data: areas } = await sb.from('unlocked_areas').select('*').eq('user_id', userId);
    const { data: userLandmarks } = await sb.from('user_landmarks').select('place_id, last_opened_at, collected_at').eq('user_id', userId);

    const placeIds = (userLandmarks ?? []).map((ul) => ul.place_id);
    let cacheRows: Record<string, unknown>[] = [];
    if (placeIds.length > 0) {
      const { data: cache } = await sb.from('landmark_cache').select('*').in('place_id', placeIds);
      cacheRows = cache ?? [];
    }
    const cacheMap = new Map(cacheRows.map((c) => [String(c.place_id), c]));

    const base = createInitialState();
    const unlockedAreas: UnlockedArea[] = (areas ?? []).map((a) => ({
      id: a.client_id ?? a.id,
      centerLatitude: a.center_latitude,
      centerLongitude: a.center_longitude,
      radiusMeters: a.radius_meters,
    }));

    const landmarks: Landmark[] = (userLandmarks ?? [])
      .map((ul) => {
        const cache = cacheMap.get(ul.place_id);
        if (!cache) return null;
        return rowToLandmark({
          place_id: String(cache.place_id),
          name: String(cache.name),
          latitude: Number(cache.latitude),
          longitude: Number(cache.longitude),
          category: String(cache.category),
          rarity: String(cache.rarity),
          lore: cache.lore as string | null,
          last_opened_at: ul.last_opened_at,
        });
      })
      .filter(Boolean) as Landmark[];

    const lat = profile.last_lat ?? base.userLocation.latitude;
    const lng = profile.last_lng ?? base.userLocation.longitude;

    const state: GameStateShape = {
      ...base,
      username: profile.username,
      profilePhotoUri: profile.avatar_url ?? undefined,
      level: profile.level,
      xp: profile.xp,
      gems: profile.gems,
      totalMiles: profile.total_miles,
      streakDays: profile.streak_days,
      safeModeEnabled: profile.safe_mode_enabled,
      userLocation: { latitude: lat, longitude: lng },
      unlockedAreas,
      landmarks: mergeLandmarkCatalog(
        getAtlasLandmarkCatalog(),
        landmarks.length ? landmarks : base.landmarks
      ),
      openedChests: profile.opened_chests,
      cosmetics: profile.cosmetics?.length ? profile.cosmetics : base.cosmetics,
      equipped: profile.equipped ?? base.equipped,
      quests: profile.quests?.length ? profile.quests : INITIAL_QUESTS,
      badges: profile.badges?.length ? profile.badges : INITIAL_BADGES,
      ghostRuns: profile.ghost_runs?.length ? profile.ghost_runs : INITIAL_GHOST_RUNS,
      skillPath: profile.skill_path ?? undefined,
      equippedTitle: profile.equipped_title ?? undefined,
      unlockedTitles: profile.unlocked_titles ?? [],
      collectedLandmarks: mergeCollectedLandmarks(
        normalizeCollectedLandmarks(profile.collected_landmarks),
        collectedFromUserLandmarkRows(userLandmarks ?? [])
      ),
      personalRecords: profile.personal_records ?? {},
      savedRoutes: profile.saved_routes ?? [],
      syncVersion: profile.sync_version ?? 1,
      account: {
        email: '',
        provider: 'email',
        displayName: profile.username,
        lastSync: Date.now(),
      },
      friends: [],
      isRunning: false,
      runDistanceMiles: 0,
      isGhostRunActive: false,
      showRewardPopup: false,
    };

    return { ok: true, state, serverVersion: profile.sync_version ?? 1 };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function pushCloudSave(userId: string, state: GameStateShape, localVersion: number): Promise<PushResult> {
  if (!isSupabaseConfigured) return { ok: false, error: 'Supabase not configured' };

  try {
    const sb = getSupabase();
    const nextVersion = localVersion + 1;

    const { data: existing } = await sb.from('profiles').select('sync_version').eq('id', userId).single();
    if (existing && existing.sync_version > localVersion) {
      return { ok: false, error: 'CONFLICT' };
    }

    const publicLoc = resolvePublicLocation(state, userId);

    const { error: profileErr } = await sb
      .from('profiles')
      .update({
        username: state.username,
        avatar_url: state.profilePhotoUri ?? null,
        level: state.level,
        xp: state.xp,
        gems: state.gems,
        total_miles: state.totalMiles,
        streak_days: state.streakDays,
        skill_path: state.skillPath ?? null,
        equipped: state.equipped,
        equipped_title: state.equippedTitle ?? null,
        unlocked_titles: state.unlockedTitles,
        safe_mode_enabled: state.safeModeEnabled,
        opened_chests: state.openedChests,
        cosmetics: state.cosmetics,
        quests: state.quests,
        badges: state.badges,
        ghost_runs: state.ghostRuns,
        collected_landmarks: state.collectedLandmarks,
        personal_records: state.personalRecords,
        saved_routes: state.savedRoutes,
        last_lat: publicLoc.latitude,
        last_lng: publicLoc.longitude,
        sync_version: nextVersion,
      })
      .eq('id', userId);

    if (profileErr) return { ok: false, error: profileErr.message };

    const { data: remoteAreas } = await sb.from('unlocked_areas').select('client_id, id').eq('user_id', userId);
    const remoteIds = new Set((remoteAreas ?? []).map((a) => a.client_id ?? a.id));
    const newAreas = state.unlockedAreas.filter((a) => !remoteIds.has(a.id));

    if (newAreas.length > 0) {
      await sb.from('unlocked_areas').insert(
        newAreas.map((a) => ({
          user_id: userId,
          client_id: a.id,
          center_latitude: a.centerLatitude,
          center_longitude: a.centerLongitude,
          radius_meters: a.radiusMeters,
        }))
      );
    }

    return { ok: true, serverVersion: nextVersion };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function uploadAvatar(userId: string, localUri: string): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const sb = getSupabase();
    const ext = localUri.split('.').pop()?.split('?')[0] ?? 'jpg';
    const path = `${userId}/avatar.${ext}`;
    const res = await fetch(localUri);
    const blob = await res.blob();
    const { error } = await sb.storage.from('avatars').upload(path, blob, { upsert: true, contentType: blob.type });
    if (error) return null;
    const { data } = sb.storage.from('avatars').getPublicUrl(path);
    return data.publicUrl;
  } catch {
    return null;
  }
}
