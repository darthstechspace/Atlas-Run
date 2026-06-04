import { getAtlasLandmarkCatalog } from '../data/landmarkCatalog';
import type { LandmarkCollectionEntry } from '../v3/data';

/** Parse profile JSON / legacy saves into collection entries. */
export function normalizeCollectedLandmarks(raw: unknown): LandmarkCollectionEntry[] {
  if (!raw) return [];
  if (!Array.isArray(raw)) return [];
  const out: LandmarkCollectionEntry[] = [];
  for (const item of raw) {
    if (typeof item === 'string') {
      out.push({ landmarkId: item, collectedAt: Date.now(), loreUnlocked: true });
      continue;
    }
    if (item && typeof item === 'object' && 'landmarkId' in item) {
      const e = item as LandmarkCollectionEntry;
      if (!e.landmarkId) continue;
      out.push({
        landmarkId: e.landmarkId,
        collectedAt: typeof e.collectedAt === 'number' ? e.collectedAt : Date.now(),
        loreUnlocked: e.loreUnlocked ?? true,
      });
    }
  }
  return out;
}

/** Union by landmarkId; keeps the newest collectedAt per id. */
export function mergeCollectedLandmarks(
  ...lists: (LandmarkCollectionEntry[] | null | undefined)[]
): LandmarkCollectionEntry[] {
  const byId = new Map<string, LandmarkCollectionEntry>();
  for (const list of lists) {
    if (!list?.length) continue;
    for (const entry of list) {
      if (!entry?.landmarkId) continue;
      const prev = byId.get(entry.landmarkId);
      if (!prev || (entry.collectedAt ?? 0) >= (prev.collectedAt ?? 0)) {
        byId.set(entry.landmarkId, entry);
      }
    }
  }
  return [...byId.values()];
}

/** Build entries from cloud user_landmarks rows (atlas catalog ids only). */
export function collectedFromUserLandmarkRows(
  rows: { place_id: string; collected_at?: string | null }[]
): LandmarkCollectionEntry[] {
  const catalogIds = new Set(getAtlasLandmarkCatalog().map((lm) => lm.id));
  return rows
    .filter((r) => catalogIds.has(r.place_id))
    .map((r) => ({
      landmarkId: r.place_id,
      collectedAt: r.collected_at ? new Date(r.collected_at).getTime() : Date.now(),
      loreUnlocked: true,
    }));
}
