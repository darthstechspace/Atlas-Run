import type { Landmark } from '../types';
import { BOSTON_LANDMARK_CATALOG, BOSTON_LANDMARK_GOAL } from './bostonLandmarks';
import { WORCESTER_LANDMARK_CATALOG, WORCESTER_LANDMARK_GOAL } from './worcesterLandmarks';
import { SALEM_LANDMARK_CATALOG, SALEM_LANDMARK_GOAL } from './salemLandmarks';
import { SPRINGFIELD_LANDMARK_CATALOG, SPRINGFIELD_LANDMARK_GOAL } from './springfieldLandmarks';

export { BOSTON_LANDMARK_CATALOG, BOSTON_LANDMARK_GOAL } from './bostonLandmarks';
export { WORCESTER_LANDMARK_CATALOG, WORCESTER_LANDMARK_GOAL } from './worcesterLandmarks';
export { SALEM_LANDMARK_CATALOG, SALEM_LANDMARK_GOAL } from './salemLandmarks';
export { SPRINGFIELD_LANDMARK_CATALOG, SPRINGFIELD_LANDMARK_GOAL } from './springfieldLandmarks';

export type AtlasRegionId = 'boston' | 'worcester' | 'salem' | 'springfield';

const REGION_GOALS: Record<AtlasRegionId, number> = {
  boston: BOSTON_LANDMARK_GOAL,
  worcester: WORCESTER_LANDMARK_GOAL,
  salem: SALEM_LANDMARK_GOAL,
  springfield: SPRINGFIELD_LANDMARK_GOAL,
};

export function mergeLandmarkCatalog(existing: Landmark[], incoming: Landmark[]): Landmark[] {
  const byId = new Map<string, Landmark>();
  for (const lm of existing) {
    if (lm.category !== 'School') byId.set(lm.id, lm);
  }
  for (const lm of incoming) {
    if (lm.category !== 'School' && !byId.has(lm.id)) byId.set(lm.id, lm);
  }
  return [...byId.values()];
}

let atlasLandmarkCatalogCache: Landmark[] | null = null;

export function getAtlasLandmarkCatalog(): Landmark[] {
  if (!atlasLandmarkCatalogCache) {
    atlasLandmarkCatalogCache = mergeLandmarkCatalog(
      mergeLandmarkCatalog(
        mergeLandmarkCatalog(WORCESTER_LANDMARK_CATALOG, BOSTON_LANDMARK_CATALOG),
        SALEM_LANDMARK_CATALOG
      ),
      SPRINGFIELD_LANDMARK_CATALOG
    );
  }
  return atlasLandmarkCatalogCache;
}

export function getAtlasLandmarkGoal(): number {
  return getAtlasLandmarkCatalog().length;
}

export function landmarkRegionId(landmark: Landmark): AtlasRegionId {
  if (landmark.id.startsWith('wor-')) return 'worcester';
  if (landmark.id.startsWith('bos-')) return 'boston';
  if (landmark.id.startsWith('sal-')) return 'salem';
  if (landmark.id.startsWith('spr-')) return 'springfield';
  return 'boston';
}

export function landmarksForRegion(regionId: AtlasRegionId, landmarks: Landmark[]): Landmark[] {
  return landmarks.filter((lm) => landmarkRegionId(lm) === regionId);
}

export function collectedCountForRegion(
  regionId: AtlasRegionId,
  landmarks: Landmark[],
  collectedIds: Set<string>
): number {
  return landmarksForRegion(regionId, landmarks).filter((lm) => collectedIds.has(lm.id)).length;
}

export function goalForRegion(regionId: AtlasRegionId): number {
  return REGION_GOALS[regionId];
}
