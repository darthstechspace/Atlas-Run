import AsyncStorage from '@react-native-async-storage/async-storage';

import type { GameStateShape } from './gameState';

import { createInitialState } from './gameState';

import { getAtlasLandmarkCatalog, mergeLandmarkCatalog } from './data/landmarkCatalog';



const STORAGE_KEY_V2 = '@atlasrun/save_v2';

const STORAGE_KEY_V1 = '@atlasrun/save_v1';



/** Fields saved to device for offline cache */

export type PersistedGameData = Pick<

  GameStateShape,

  | 'username'

  | 'profilePhotoUri'

  | 'level'

  | 'xp'

  | 'gems'

  | 'totalMiles'

  | 'streakDays'

  | 'safeModeEnabled'

  | 'playSafetyAlertsEnabled'

  | 'userLocation'

  | 'unlockedAreas'

  | 'landmarks'

  | 'treasureChests'

  | 'openedChests'

  | 'cosmetics'

  | 'equipped'

  | 'quests'

  | 'badges'

  | 'ghostRuns'

  | 'account'

  | 'skillPath'

  | 'equippedTitle'

  | 'unlockedTitles'

  | 'collectedLandmarks'

  | 'personalRecords'

  | 'savedRoutes'

  | 'guildId'

  | 'syncVersion'

  | 'activityLog'

  | 'lastDailyResetDate'

  | 'lastWeeklyResetDate'

>;



export function toPersistedState(state: GameStateShape): PersistedGameData {

  return {

    username: state.username,

    profilePhotoUri: state.profilePhotoUri,

    level: state.level,

    xp: state.xp,

    gems: state.gems,

    totalMiles: state.totalMiles,

    streakDays: state.streakDays,

    safeModeEnabled: state.safeModeEnabled,

    playSafetyAlertsEnabled: state.playSafetyAlertsEnabled,

    userLocation: state.userLocation,

    unlockedAreas: state.unlockedAreas,

    landmarks: state.landmarks,

    treasureChests: state.treasureChests,

    openedChests: state.openedChests,

    cosmetics: state.cosmetics,

    equipped: state.equipped,

    quests: state.quests,

    badges: state.badges,

    ghostRuns: state.ghostRuns,

    account: state.account,

    skillPath: state.skillPath,

    equippedTitle: state.equippedTitle,

    unlockedTitles: state.unlockedTitles,

    collectedLandmarks: state.collectedLandmarks,

    personalRecords: state.personalRecords,

    savedRoutes: state.savedRoutes,

    guildId: state.guildId,

    syncVersion: state.syncVersion ?? 1,

    activityLog: state.activityLog ?? [],

    lastDailyResetDate: state.lastDailyResetDate,

    lastWeeklyResetDate: state.lastWeeklyResetDate,

  };

}



async function migrateV1ToV2(): Promise<PersistedGameData | null> {

  const v1 = await AsyncStorage.getItem(STORAGE_KEY_V1);

  if (!v1) return null;

  const data = JSON.parse(v1) as PersistedGameData;

  await AsyncStorage.setItem(STORAGE_KEY_V2, v1);

  await AsyncStorage.removeItem(STORAGE_KEY_V1);

  return data;

}



export async function loadSavedState(): Promise<GameStateShape | null> {

  try {

    let raw = await AsyncStorage.getItem(STORAGE_KEY_V2);

    if (!raw) {

      const migrated = await migrateV1ToV2();

      if (migrated) raw = JSON.stringify(migrated);

    }

    if (!raw) return null;



    const data = JSON.parse(raw) as PersistedGameData;
    const mergedLandmarks = mergeLandmarkCatalog(getAtlasLandmarkCatalog(), data.landmarks ?? []);
    const base = createInitialState();

    return {
      ...base,
      ...data,
      syncVersion: data.syncVersion ?? 1,
      activityLog: data.activityLog ?? [],
      lastDailyResetDate: data.lastDailyResetDate,
      lastWeeklyResetDate: data.lastWeeklyResetDate,
      unlockedTitles: data.unlockedTitles ?? [],
      collectedLandmarks: data.collectedLandmarks ?? [],
      personalRecords: data.personalRecords ?? {},
      savedRoutes: data.savedRoutes ?? [],
      guildId: data.guildId,
      friends: [],
      landmarks: mergedLandmarks.length ? mergedLandmarks : [...getAtlasLandmarkCatalog()],

      treasureChests: data.treasureChests ?? [],

      showLandmarkDiscoveryPopup: false,

      pendingLandmarkDiscovery: undefined,

      isRunning: false,

      runDistanceMiles: 0,

      isGhostRunActive: false,

      ghostRunTarget: undefined,

      lastReward: undefined,

      showRewardPopup: false,

      badgeUnlockQueue: [],

      showBadgeUnlockModal: false,

      toastMessage: undefined,

    };

  } catch {

    return null;

  }

}



export async function saveGameState(state: GameStateShape): Promise<void> {

  try {

    await AsyncStorage.setItem(STORAGE_KEY_V2, JSON.stringify(toPersistedState(state)));

  } catch {

    // ignore write errors

  }

}



export async function clearSavedState(): Promise<void> {

  await AsyncStorage.removeItem(STORAGE_KEY_V2);

  await AsyncStorage.removeItem(STORAGE_KEY_V1);

}

