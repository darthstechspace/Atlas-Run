import type { Landmark } from '../types';
import { getAtlasLandmarkCatalog } from '../data/landmarkCatalog';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';

export async function fetchNearbyLandmarks(
  lat: number,
  lng: number,
  radius = 1500
): Promise<{ ok: boolean; landmarks: Landmark[]; error?: string }> {
  if (!isSupabaseConfigured) {
    return { ok: false, landmarks: [], error: 'Supabase not configured' };
  }

  // Edge function is optional until deployed; skip to avoid noisy failed requests.
  if (process.env.EXPO_PUBLIC_ENABLE_LANDMARKS_EDGE !== 'true') {
    return { ok: false, landmarks: [], error: 'Edge function disabled' };
  }

  try {
    const sb = getSupabase();
    const { data, error } = await sb.functions.invoke('nearby-landmarks', {
      body: { lat, lng, radius },
    });

    if (error) {
      return { ok: false, landmarks: [], error: error.message };
    }

    const rows = (data?.landmarks ?? []) as Array<{
      place_id: string;
      name: string;
      latitude: number;
      longitude: number;
      category: string;
      rarity: string;
      lore: string;
    }>;

    const landmarks: Landmark[] = rows.map((r) => ({
      id: r.place_id,
      name: r.name,
      latitude: r.latitude,
      longitude: r.longitude,
      category: r.category as Landmark['category'],
      rarity: r.rarity as Landmark['rarity'],
      lore: r.lore,
    }));

    return { ok: true, landmarks };
  } catch (e) {
    return { ok: false, landmarks: [], error: String(e) };
  }
}

export async function recordUserLandmark(userId: string, placeId: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const sb = getSupabase();
  const catalog = getAtlasLandmarkCatalog().find((lm) => lm.id === placeId);
  if (catalog) {
    await sb.from('landmark_cache').upsert(
      {
        place_id: catalog.id,
        name: catalog.name,
        latitude: catalog.latitude,
        longitude: catalog.longitude,
        category: catalog.category,
        rarity: catalog.rarity,
        lore: catalog.lore,
      },
      { onConflict: 'place_id' }
    );
  }
  const { error } = await sb.from('user_landmarks').upsert(
    {
      user_id: userId,
      place_id: placeId,
      last_opened_at: new Date().toISOString(),
      collected_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,place_id' }
  );
  if (error && __DEV__) {
    console.warn('[AtlasRun] recordUserLandmark failed:', error.message);
  }
}

export async function loadCachedLandmarksNear(
  lat: number,
  lng: number,
  delta = 0.05
): Promise<Landmark[]> {
  if (!isSupabaseConfigured) return [];
  const sb = getSupabase();
  const { data } = await sb
    .from('landmark_cache')
    .select('*')
    .gte('latitude', lat - delta)
    .lte('latitude', lat + delta)
    .gte('longitude', lng - delta)
    .lte('longitude', lng + delta)
    .limit(30);

  return (data ?? []).map((r) => ({
    id: r.place_id,
    name: r.name,
    latitude: r.latitude,
    longitude: r.longitude,
    category: r.category as Landmark['category'],
    rarity: r.rarity as Landmark['rarity'],
    lore: r.lore ?? '',
  }));
}
