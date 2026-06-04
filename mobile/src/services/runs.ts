import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { weekStartDateKey } from '../lib/dates';

export type RunUpload = {
  startedAt: string;
  endedAt: string;
  distanceMiles: number;
  durationSec: number;
  polyline: { latitude: number; longitude: number }[];
  xpEarned: number;
};

export async function uploadRun(userId: string, run: RunUpload): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { ok: false, error: 'Supabase not configured' };

  try {
    const sb = getSupabase();
    const { error } = await sb.from('runs').insert({
      user_id: userId,
      started_at: run.startedAt,
      ended_at: run.endedAt,
      distance_miles: run.distanceMiles,
      duration_sec: run.durationSec,
      polyline: run.polyline,
      xp_earned: run.xpEarned,
    });

    if (error) return { ok: false, error: error.message };

    const weekStart = weekStartDateKey(new Date());
    const { data: existing } = await sb
      .from('weekly_stats')
      .select('*')
      .eq('user_id', userId)
      .eq('week_start', weekStart)
      .maybeSingle();

    const miles = (existing?.miles ?? 0) + run.distanceMiles;
    await sb.from('weekly_stats').upsert({
      user_id: userId,
      week_start: weekStart,
      miles,
      zones_cleared: existing?.zones_cleared ?? 0,
      landmarks_found: existing?.landmarks_found ?? 0,
    });

    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function incrementWeeklyLandmarks(userId: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const sb = getSupabase();
  const weekStart = weekStartDateKey(new Date());
  const { data: existing } = await sb
    .from('weekly_stats')
    .select('*')
    .eq('user_id', userId)
    .eq('week_start', weekStart)
    .maybeSingle();

  await sb.from('weekly_stats').upsert({
    user_id: userId,
    week_start: weekStart,
    miles: existing?.miles ?? 0,
    zones_cleared: existing?.zones_cleared ?? 0,
    landmarks_found: (existing?.landmarks_found ?? 0) + 1,
  });
}

export async function incrementWeeklyZones(userId: string, count = 1): Promise<void> {
  if (!isSupabaseConfigured) return;
  const sb = getSupabase();
  const weekStart = weekStartDateKey(new Date());
  const { data: existing } = await sb
    .from('weekly_stats')
    .select('*')
    .eq('user_id', userId)
    .eq('week_start', weekStart)
    .maybeSingle();

  await sb.from('weekly_stats').upsert({
    user_id: userId,
    week_start: weekStart,
    miles: existing?.miles ?? 0,
    zones_cleared: (existing?.zones_cleared ?? 0) + count,
    landmarks_found: existing?.landmarks_found ?? 0,
  });
}
