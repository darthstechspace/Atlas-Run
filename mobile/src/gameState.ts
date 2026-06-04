import type {
  Badge,
  CosmeticItem,
  EquippedCosmetics,
  Friend,
  GhostRun,
  Landmark,
  Quest,
  QuestCategory,
  UnlockedArea,
  ChestReward,
  LeaderboardEntry,
  TreasureChest,
  LandmarkDiscovery,
  ActivityEntry,
} from './types';
import type {
  UserAccount,
  SkillPath,
  LandmarkCollectionEntry,
  PersonalRecords,
  SavedRoute,
} from './v3/data';
import { WORCESTER_CENTER } from './v3/data';
import { getAtlasLandmarkCatalog, mergeLandmarkCatalog } from './data/landmarkCatalog';
import { mergeCollectedLandmarks } from './lib/collectedLandmarks';
import {
  chestRewardForTier,
  spawnChestNear,
  pruneExpiredChests,
  LANDMARK_DISCOVER_XP,
  LANDMARK_DISCOVER_GEMS,
  LANDMARK_DISCOVER_RADIUS_M,
} from './treasureChests';
import { computeFogRevealRadius } from './petBuffs';
import {
  getEquippedBannerBuff,
  getEquippedCompassBuff,
  getEquippedBackpackBuff,
  getSocialBanner,
  getRunXpMultiplier,
  getLandmarkGemMultiplier,
  getLandmarkXpMultiplier,
  getChestGemMultiplier,
} from './gearBuffs';
import { distanceMeters } from './geo';
import { localDateKey, isoWeekKey } from './lib/dates';
import { SHOP_CATALOG } from './shop/catalog';

export { distanceMeters } from './geo';

export function xpRequiredForLevel(level: number) {
  return 100 + (level - 1) * 75;
}

export const SHOP_ITEMS: CosmeticItem[] = SHOP_CATALOG;

export const INITIAL_QUESTS: Quest[] = [
  { id: 'q1', title: 'Morning Mile', description: 'Run 1 mile today', type: 'daily', category: 'runMiles', targetValue: 1, currentValue: 0, gemReward: 10, isClaimed: false },
  { id: 'q2', title: 'Chest Hunter', description: 'Open 1 treasure chest', type: 'daily', category: 'openChest', targetValue: 1, currentValue: 0, gemReward: 15, isClaimed: false },
  { id: 'q3', title: 'Landmark Scout', description: 'Discover 1 new landmark', type: 'daily', category: 'discoverLandmarks', targetValue: 1, currentValue: 0, gemReward: 20, isClaimed: false },
  { id: 'q4', title: 'Step Counter', description: 'Walk 10,000 steps', type: 'weekly', category: 'walkSteps', targetValue: 10000, currentValue: 3200, gemReward: 50, itemReward: 'Mystery Trail Effect', isClaimed: false },
  { id: 'q5', title: 'Social Runner', description: 'Add a friend', type: 'weekly', category: 'addFriend', targetValue: 1, currentValue: 0, gemReward: 25, isClaimed: false },
  { id: 'q6', title: 'Weekly Warrior', description: 'Run 5 miles this week', type: 'weekly', category: 'runMiles', targetValue: 5, currentValue: 2, gemReward: 75, isClaimed: false },
];

export const INITIAL_FRIENDS: Friend[] = [];

export const INITIAL_BADGES: Badge[] = [
  { id: 'b1', name: 'First Steps', description: 'Complete your first run', emoji: '👟', isUnlocked: false, requirement: 'Run any distance' },
  { id: 'b2', name: 'Explorer', description: 'Unlock 5 areas', emoji: '🗺️', isUnlocked: false, requirement: 'Discover 5 fog areas' },
  { id: 'b3', name: 'Treasure Hunter', description: 'Open 5 chests', emoji: '📦', isUnlocked: false, requirement: 'Open 5 treasure chests' },
  { id: 'b4', name: 'Marathon Spirit', description: 'Run 10 total miles', emoji: '🏅', isUnlocked: false, requirement: '10 total miles' },
  { id: 'b5', name: 'Level 10', description: 'Reach level 10', emoji: '⭐', isUnlocked: false, requirement: 'Level 10' },
  { id: 'b6', name: 'Streak Master', description: '7-day streak', emoji: '🔥', isUnlocked: false, requirement: '7 day streak' },
  { id: 'b7', name: 'Ghost Buster', description: 'Complete 3 ghost runs', emoji: '👻', isUnlocked: false, requirement: '3 ghost runs' },
];

export const INITIAL_GHOST_RUNS: GhostRun[] = [
  { id: 'g1', date: Date.now() - 86400000, distanceMiles: 2.3, durationMinutes: 22, xpEarned: 115, routeName: 'Sunset Loop' },
  { id: 'g2', date: Date.now() - 172800000, distanceMiles: 1.8, durationMinutes: 18, xpEarned: 90, routeName: 'Harbor Run' },
];

function getLandmarkDiscoverRadiusM(state: Pick<GameStateShape, 'equipped'>) {
  const compass = getEquippedCompassBuff(state.equipped.compass);
  return LANDMARK_DISCOVER_RADIUS_M + (compass?.discoverRadiusBonus ?? 0);
}

function findDiscoverableLandmark(state: GameStateShape, coord: { latitude: number; longitude: number }): Landmark | null {
  const found = new Set(state.collectedLandmarks.map((c) => c.landmarkId));
  const radius = getLandmarkDiscoverRadiusM(state);
  const candidates = state.landmarks
    .filter((lm) => !found.has(lm.id))
    .filter((lm) => isLandmarkVisible(lm, state.level))
    .filter(
      (lm) =>
        distanceMeters(coord, { latitude: lm.latitude, longitude: lm.longitude }) <= radius
    )
    .sort(
      (a, b) =>
        distanceMeters(coord, { latitude: a.latitude, longitude: a.longitude }) -
        distanceMeters(coord, { latitude: b.latitude, longitude: b.longitude })
    );
  return candidates[0] ?? null;
}

function discoverLandmark(state: GameStateShape, lm: Landmark): GameStateShape {
  const xp = Math.floor(LANDMARK_DISCOVER_XP * getLandmarkXpMultiplier(state.equipped));
  const gems = Math.floor(LANDMARK_DISCOVER_GEMS * getLandmarkGemMultiplier(state.equipped));
  let s = addXp(state, xp);
  s = {
    ...s,
    gems: s.gems + gems,
    collectedLandmarks: [
      ...s.collectedLandmarks,
      { landmarkId: lm.id, collectedAt: Date.now(), loreUnlocked: true },
    ],
    pendingLandmarkDiscovery: { landmark: lm, xp, gems },
    showLandmarkDiscoveryPopup: true,
    quests: updateQuest(s.quests, 'discoverLandmarks', 1),
  };
  return appendActivity(withMeta(s), '📍', `You discovered ${lm.name}`);
}

export interface GameStateShape {
  username: string;
  profilePhotoUri?: string;
  level: number;
  xp: number;
  gems: number;
  totalMiles: number;
  streakDays: number;
  safeModeEnabled: boolean;
  playSafetyAlertsEnabled: boolean;
  userLocation: { latitude: number; longitude: number };
  unlockedAreas: UnlockedArea[];
  landmarks: Landmark[];
  openedChests: number;
  cosmetics: CosmeticItem[];
  equipped: EquippedCosmetics;
  quests: Quest[];
  friends: Friend[];
  badges: Badge[];
  ghostRuns: GhostRun[];
  isRunning: boolean;
  runDistanceMiles: number;
  isGhostRunActive: boolean;
  ghostRunTarget?: GhostRun;
  lastReward?: ChestReward;
  showRewardPopup: boolean;
  pendingLandmarkDiscovery?: LandmarkDiscovery;
  showLandmarkDiscoveryPopup: boolean;
  badgeUnlockQueue: Badge[];
  showBadgeUnlockModal: boolean;
  treasureChests: TreasureChest[];
  toastMessage?: string;
  account?: UserAccount;
  skillPath?: SkillPath;
  equippedTitle?: string;
  unlockedTitles: string[];
  collectedLandmarks: LandmarkCollectionEntry[];
  personalRecords: PersonalRecords;
  savedRoutes: SavedRoute[];
  guildId?: string;
  syncVersion?: number;
  activityLog: ActivityEntry[];
  lastDailyResetDate?: string;
  lastWeeklyResetDate?: string;
}

const MIN_MOVE_TO_UNLOCK_METERS = 10;
const EXPLORE_BUBBLE_RADIUS = 100;

export function getExploreRadiusMeters(
  state: Pick<GameStateShape, 'skillPath' | 'equipped' | 'userLocation'>
) {
  return computeFogRevealRadius(
    EXPLORE_BUBBLE_RADIUS,
    state.skillPath,
    state.equipped.pet,
    state.equipped.torch,
    state.userLocation
  );
}

const MAX_ACTIVITY_LOG = 30;

function applyQuestResets(state: GameStateShape): GameStateShape {
  const today = localDateKey();
  const week = isoWeekKey();
  let quests = state.quests;
  let { lastDailyResetDate, lastWeeklyResetDate } = state;

  if (lastDailyResetDate !== today) {
    quests = quests.map((q) =>
      q.type === 'daily' ? { ...q, currentValue: 0, isClaimed: false } : q
    );
    lastDailyResetDate = today;
  }
  if (lastWeeklyResetDate !== week) {
    quests = quests.map((q) =>
      q.type === 'weekly' ? { ...q, currentValue: 0, isClaimed: false } : q
    );
    lastWeeklyResetDate = week;
  }

  return { ...state, quests, lastDailyResetDate, lastWeeklyResetDate };
}

function appendActivity(state: GameStateShape, emoji: string, text: string): GameStateShape {
  const entry: ActivityEntry = {
    id: `act${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    emoji,
    text,
    timestamp: Date.now(),
  };
  return {
    ...state,
    activityLog: [entry, ...(state.activityLog ?? [])].slice(0, MAX_ACTIVITY_LOG),
  };
}

const SHOP_CATALOG_BY_ID = new Map(SHOP_ITEMS.map((item) => [item.id, item]));

const LEGACY_COSMETIC_NAMES: Record<string, string> = {
  '3': 'Cap',
  '4': 'Crown',
  '5': 'Sneakers',
  '11': 'Dog',
  '12': 'Dragon',
  '13': 'Base Flashlight',
  '14': 'Base Compass',
  '16': 'Cat',
  '17': 'Bright Flashlight',
  '18': 'Witch City',
  '19': 'Hiking Pack',
  '20': 'Lobster Slippers',
  '46': 'Rainbow Trail',
  '50': 'Fox',
  '54': 'Hamster',
  '56': 'Lantern',
  '63': 'Cooler Pack',
};

function syncCosmeticFromCatalog(item: CosmeticItem): CosmeticItem {
  const ref = SHOP_CATALOG_BY_ID.get(item.id);
  const category =
    ref?.category ?? ((item.category as string) === 'Torch' ? 'Flashlight' : item.category);
  return {
    ...item,
    name: ref?.name ?? LEGACY_COSMETIC_NAMES[item.id] ?? item.name,
    category,
    emoji: ref?.emoji ?? item.emoji,
    rarity: ref?.rarity ?? item.rarity,
  };
}

function syncCosmeticsInState(state: GameStateShape): GameStateShape {
  return { ...state, cosmetics: state.cosmetics.map(syncCosmeticFromCatalog) };
}

function stripOutfits(state: GameStateShape): GameStateShape {
  const equipped = { ...state.equipped };
  delete (equipped as { outfit?: string }).outfit;
  return {
    ...state,
    cosmetics: state.cosmetics.filter((c) => (c.category as string) !== 'Outfit'),
    equipped,
  };
}

export type GameAction =
  | { type: 'HYDRATE'; payload: GameStateShape }
  | { type: 'SYNC_GPS'; payload: { latitude: number; longitude: number } }
  | { type: 'SET_LOCATION'; payload: { latitude: number; longitude: number } }
  | { type: 'SET_PROFILE_PHOTO'; payload: string | undefined }
  | { type: 'SET_USERNAME'; payload: string }
  | { type: 'SYNC_CLOUD' }
  | { type: 'SET_SKILL_PATH'; payload: SkillPath }
  | { type: 'EQUIP_TITLE'; payload: string }
  | { type: 'SEND_GIFT'; payload: string }
  | { type: 'SAVE_ROUTE'; payload: { name: string; distanceMiles: number } }
  | { type: 'JOIN_GUILD'; payload: string }
  | { type: 'LEAVE_GUILD' }
  | { type: 'TOGGLE_SAFE_MODE' }
  | { type: 'TOGGLE_PLAY_SAFETY_ALERTS' }
  | { type: 'START_RUN' }
  | { type: 'START_GHOST_RUN'; payload: GhostRun }
  | { type: 'RUN_GPS_UPDATE'; payload: { latitude: number; longitude: number; distanceMiles: number } }
  | { type: 'END_RUN'; payload?: { beatGhost?: boolean; distanceMiles?: number; durationSec?: number; polyline?: { latitude: number; longitude: number }[] } }
  | { type: 'SET_FRIENDS'; payload: Friend[] }
  | { type: 'SET_LANDMARKS'; payload: Landmark[] }
  | { type: 'SET_SYNC_VERSION'; payload: number }
  | { type: 'OPEN_CHEST'; payload: string }
  | { type: 'CLAIM_QUEST'; payload: string }
  | { type: 'PURCHASE_ITEM'; payload: string }
  | { type: 'PURCHASE_GEMS'; payload: number }
  | { type: 'EQUIP'; payload: CosmeticItem }
  | { type: 'DISMISS_LANDMARK_DISCOVERY' }
  | { type: 'DISMISS_REWARD' }
  | { type: 'DISMISS_BADGE_UNLOCK' }
  | { type: 'SET_TOAST'; payload: string }
  | { type: 'CLEAR_TOAST' };

export function createInitialState(): GameStateShape {
  const starterCompass: CosmeticItem = { id: 's2', name: 'Basic Compass', category: 'Compass', emoji: '🧭', gemPrice: 0, rarity: 'Common', isOwned: true };
  const loc = { latitude: WORCESTER_CENTER.latitude, longitude: WORCESTER_CENTER.longitude };
  return {
    username: 'Explorer',
    profilePhotoUri: undefined,
    level: 1,
    xp: 0,
    gems: 150,
    totalMiles: 0,
    streakDays: 3,
    safeModeEnabled: false,
    playSafetyAlertsEnabled: true,
    userLocation: loc,
    unlockedAreas: [],
    landmarks: [...getAtlasLandmarkCatalog()],
    treasureChests: [],
    openedChests: 0,
    cosmetics: [starterCompass],
    equipped: { compass: starterCompass.id },
    quests: INITIAL_QUESTS,
    friends: INITIAL_FRIENDS,
    badges: INITIAL_BADGES,
    ghostRuns: INITIAL_GHOST_RUNS,
    isRunning: false,
    runDistanceMiles: 0,
    isGhostRunActive: false,
    showRewardPopup: false,
    showLandmarkDiscoveryPopup: false,
    badgeUnlockQueue: [],
    showBadgeUnlockModal: false,
    unlockedTitles: [],
    collectedLandmarks: [],
    personalRecords: {},
    savedRoutes: [],
    syncVersion: 1,
    activityLog: [],
    lastDailyResetDate: localDateKey(),
    lastWeeklyResetDate: isoWeekKey(),
  };
}

function addXp(state: GameStateShape, amount: number): GameStateShape {
  let { xp, level } = state;
  xp += amount;
  let req = xpRequiredForLevel(level);
  while (xp >= req) {
    xp -= req;
    level += 1;
    req = xpRequiredForLevel(level);
  }
  return { ...state, xp, level };
}

function exploreRadius(state: GameStateShape) {
  return getExploreRadiusMeters(state);
}

/**
 * Fog reveal: add a circular unlocked zone when the player moves to a new spot.
 * Zone bubbles are tracked in unlockedAreas[] for stats and badges.
 */
function unlockArea(state: GameStateShape, coord: { latitude: number; longitude: number }, radius?: number): GameStateShape {
  const r = radius ?? exploreRadius(state);
  const tooClose = state.unlockedAreas.some((a) =>
    distanceMeters({ latitude: a.centerLatitude, longitude: a.centerLongitude }, coord) < 35
  );
  if (tooClose) return state;
  const area: UnlockedArea = {
    id: `a${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    centerLatitude: coord.latitude,
    centerLongitude: coord.longitude,
    radiusMeters: r,
  };
  const quests = updateQuest(state.quests, 'discoverAreas', 1);
  return { ...state, unlockedAreas: [...state.unlockedAreas, area], quests };
}

function exploreAtLocation(state: GameStateShape, coord: { latitude: number; longitude: number }): GameStateShape {
  const before = state.unlockedAreas.length;
  let s = unlockArea(state, coord);
  if (s.unlockedAreas.length > before) {
    s = { ...s, toastMessage: '🗺️ New area discovered!' };
  }
  return s;
}

function updateQuest(quests: Quest[], category: QuestCategory, amount: number): Quest[] {
  return quests.map((q) => {
    if (q.isClaimed || q.category !== category) return q;
    const inc = category === 'addFriend' ? amount : Math.max(amount, 1);
    return { ...q, currentValue: Math.min(q.currentValue + inc, q.targetValue) };
  });
}

function checkTitles(state: GameStateShape): string[] {
  const unlocked = new Set(state.unlockedTitles);
  if (state.unlockedAreas.length >= 10) unlocked.add('Trailblazer');
  if (state.unlockedAreas.length >= 25) unlocked.add('Fog Hunter');
  if (state.collectedLandmarks.length >= 5) unlocked.add('Explorer');
  if (state.totalMiles >= 10) unlocked.add('Pathfinder');
  if (state.level >= 20) unlocked.add('Atlas Master');
  return [...unlocked];
}

function withMeta(state: GameStateShape): GameStateShape {
  const before = state.badges;
  const badges = checkBadges(state);
  const newUnlocks = badges.filter(
    (b) => b.isUnlocked && !before.some((pb) => pb.id === b.id && pb.isUnlocked)
  );
  const queue = [...(state.badgeUnlockQueue ?? []), ...newUnlocks];
  return {
    ...state,
    badges,
    unlockedTitles: checkTitles({ ...state, badges }),
    badgeUnlockQueue: queue,
    showBadgeUnlockModal: queue.length > 0,
  };
}

function checkBadges(state: GameStateShape): Badge[] {
  return state.badges.map((b) => {
    let unlocked = b.isUnlocked;
    if (b.name === 'First Steps' && state.totalMiles >= 0.1) unlocked = true;
    if (b.name === 'Explorer' && state.unlockedAreas.length >= 5) unlocked = true;
    if (b.name === 'Treasure Hunter' && state.openedChests >= 5) unlocked = true;
    if (b.name === 'Marathon Spirit' && state.totalMiles >= 10) unlocked = true;
    if (b.name === 'Level 10' && state.level >= 10) unlocked = true;
    if (b.name === 'Streak Master' && state.streakDays >= 7) unlocked = true;
    if (b.name === 'Ghost Buster' && state.ghostRuns.length >= 3) unlocked = true;
    return { ...b, isUnlocked: unlocked };
  });
}

export function gameReducer(state: GameStateShape, action: GameAction): GameStateShape {
  switch (action.type) {
    case 'HYDRATE':
      return applyQuestResets(
        syncCosmeticsInState(
          stripOutfits({
            ...action.payload,
            isRunning: false,
            runDistanceMiles: 0,
            showRewardPopup: false,
            showLandmarkDiscoveryPopup: false,
            pendingLandmarkDiscovery: undefined,
            badgeUnlockQueue: [],
            showBadgeUnlockModal: false,
            toastMessage: undefined,
            landmarks: mergeLandmarkCatalog(getAtlasLandmarkCatalog(), action.payload.landmarks ?? []),
            treasureChests: action.payload.treasureChests ?? [],
            activityLog: action.payload.activityLog ?? [],
          })
        )
      );
    case 'SYNC_GPS': {
      const coord = action.payload;
      const savedFar =
        state.unlockedAreas.length === 0 ||
        state.unlockedAreas.every(
          (a) => distanceMeters({ latitude: a.centerLatitude, longitude: a.centerLongitude }, coord) > 800
        );
      if (savedFar) {
        const start: UnlockedArea = {
          id: 'start',
          centerLatitude: coord.latitude,
          centerLongitude: coord.longitude,
          radiusMeters: EXPLORE_BUBBLE_RADIUS,
        };
        let s = withMeta({
          ...state,
          userLocation: coord,
          unlockedAreas: [start],
          landmarks: mergeLandmarkCatalog(state.landmarks, getAtlasLandmarkCatalog()),
        });
        const lm = findDiscoverableLandmark(s, coord);
        return lm ? discoverLandmark(s, lm) : s;
      }
      let s = exploreAtLocation({ ...state, userLocation: coord }, coord);
      if (!s.showLandmarkDiscoveryPopup) {
        const lm = findDiscoverableLandmark(s, coord);
        if (lm) s = discoverLandmark(s, lm);
      }
      return s;
    }
    case 'SET_LOCATION': {
      const moved = distanceMeters(state.userLocation, action.payload);
      let s = { ...state, userLocation: action.payload };
      if (moved >= MIN_MOVE_TO_UNLOCK_METERS) {
        s = exploreAtLocation(s, action.payload);
      }
      s = { ...s, treasureChests: pruneExpiredChests(s.treasureChests) };
      if (moved >= 35) {
        const spawned = spawnChestNear(action.payload.latitude, action.payload.longitude, s.treasureChests);
        if (spawned) s = { ...s, treasureChests: [...s.treasureChests, spawned] };
      }
      if (!s.showLandmarkDiscoveryPopup) {
        const lm = findDiscoverableLandmark(s, action.payload);
        if (lm) s = discoverLandmark(s, lm);
      }
      return s;
    }
    case 'SET_PROFILE_PHOTO':
      return { ...state, profilePhotoUri: action.payload };
    case 'SET_USERNAME':
      return { ...state, username: action.payload };
    case 'SYNC_CLOUD':
      return {
        ...state,
        account: state.account
          ? { ...state.account, lastSync: Date.now() }
          : state.account,
        toastMessage: 'Progress synced to cloud',
      };
    case 'SET_SKILL_PATH':
      return { ...state, skillPath: action.payload, toastMessage: `Path chosen: ${action.payload}!` };
    case 'EQUIP_TITLE':
      return { ...state, equippedTitle: action.payload };
    case 'SEND_GIFT':
      return { ...state, gems: Math.max(0, state.gems - 5), toastMessage: 'Gift sent! 🎁' };
    case 'SAVE_ROUTE':
      return withMeta({
        ...state,
        savedRoutes: [
          { id: `r${Date.now()}`, name: action.payload.name, distanceMiles: action.payload.distanceMiles, rating: 0, createdAt: Date.now() },
          ...state.savedRoutes,
        ],
        toastMessage: 'Route saved!',
      });
    case 'JOIN_GUILD': {
      const guild = action.payload;
      return withMeta({ ...state, guildId: guild, toastMessage: 'Joined crew! 🎉' });
    }
    case 'LEAVE_GUILD':
      return withMeta({ ...state, guildId: undefined, toastMessage: 'Left crew' });
    case 'TOGGLE_SAFE_MODE':
      return { ...state, safeModeEnabled: !state.safeModeEnabled };
    case 'TOGGLE_PLAY_SAFETY_ALERTS':
      return { ...state, playSafetyAlertsEnabled: !state.playSafetyAlertsEnabled };
    case 'START_RUN':
      return { ...state, isRunning: true, runDistanceMiles: 0, isGhostRunActive: false, ghostRunTarget: undefined };
    case 'START_GHOST_RUN':
      return { ...state, isRunning: true, runDistanceMiles: 0, isGhostRunActive: true, ghostRunTarget: action.payload };
    case 'RUN_GPS_UPDATE': {
      if (!state.isRunning) return state;
      const { latitude, longitude, distanceMiles } = action.payload;
      const coord = { latitude, longitude };
      let s = gameReducer({ ...state, runDistanceMiles: distanceMiles }, { type: 'SET_LOCATION', payload: coord });
      if (s.isGhostRunActive && s.ghostRunTarget && s.runDistanceMiles >= s.ghostRunTarget.distanceMiles) {
        return gameReducer(s, {
          type: 'END_RUN',
          payload: { beatGhost: true, distanceMiles: s.runDistanceMiles },
        });
      }
      return s;
    }
    case 'END_RUN': {
      if (!state.isRunning) return state;
      const beat = action.payload?.beatGhost ?? false;
      const dist = action.payload?.distanceMiles ?? state.runDistanceMiles;
      let xpEarned = Math.floor(dist * 50 * getRunXpMultiplier(state.equipped)) + (beat ? 100 : 0);
      let s = addXp({ ...state, totalMiles: state.totalMiles + dist }, xpEarned);
      const durationMin = Math.max(1, Math.floor((action.payload?.durationSec ?? 300) / 60));
      const run: GhostRun = {
        id: `gr${Date.now()}`,
        date: Date.now(),
        distanceMiles: dist,
        durationMinutes: durationMin,
        xpEarned,
        routeName: `Run #${state.ghostRuns.length + 1}`,
      };
      const pr = { ...s.personalRecords };
      if (!pr.longestRunMiles || dist > pr.longestRunMiles) pr.longestRunMiles = dist;
      const paceMinPerMile = dist > 0 ? durationMin / dist : undefined;
      if (paceMinPerMile && (!pr.fastestMileMin || paceMinPerMile < pr.fastestMileMin)) {
        pr.fastestMileMin = paceMinPerMile;
      }
      if (!pr.longestStreak || s.streakDays + 1 > pr.longestStreak) {
        pr.longestStreak = s.streakDays + 1;
      }
      let quests = updateQuest(s.quests, 'runMiles', Math.floor(dist));
      quests = updateQuest(quests, 'walkSteps', Math.floor(dist * 1600));
      s = withMeta({
        ...s,
        isRunning: false,
        runDistanceMiles: 0,
        isGhostRunActive: false,
        ghostRunTarget: undefined,
        ghostRuns: [run, ...s.ghostRuns],
        streakDays: s.streakDays + 1,
        personalRecords: pr,
        quests,
        toastMessage: beat ? 'Ghost Run beaten! +100 bonus XP! 👻' : `Run complete! +${xpEarned} XP, ${dist.toFixed(2)} mi`,
      });
      return appendActivity(
        s,
        '🏃',
        `You finished a ${dist.toFixed(1)} mi run (+${xpEarned} XP)`
      );
    }
    case 'OPEN_CHEST': {
      const chest = state.treasureChests.find((c) => c.id === action.payload);
      if (!chest) return state;
      const dist = distanceMeters(state.userLocation, { latitude: chest.latitude, longitude: chest.longitude });
      if (dist > 50) return { ...state, toastMessage: 'Get closer to open this chest!' };
      const reward = chestRewardForTier(chest.rarity, SHOP_ITEMS, state.cosmetics);
      const boostedReward = {
        ...reward,
        xp: Math.floor(reward.xp * getLandmarkXpMultiplier(state.equipped)),
        gems: Math.floor(reward.gems * getChestGemMultiplier(state.equipped)),
      };
      let s = addXp(state, boostedReward.xp);
      s = { ...s, gems: s.gems + boostedReward.gems };
      if (boostedReward.cosmetic && !s.cosmetics.some((c) => c.id === boostedReward.cosmetic!.id)) {
        s = { ...s, cosmetics: [...s.cosmetics, { ...boostedReward.cosmetic, isOwned: true }] };
      }
      s = unlockArea(
        { ...s, treasureChests: s.treasureChests.filter((c) => c.id !== chest.id), openedChests: s.openedChests + 1 },
        { latitude: chest.latitude, longitude: chest.longitude },
        120
      );
      return appendActivity(
        withMeta({
          ...s,
          quests: updateQuest(s.quests, 'openChest', 1),
          lastReward: boostedReward,
          showRewardPopup: true,
        }),
        '📦',
        `You opened a ${chest.rarity} chest`
      );
    }
    case 'CLAIM_QUEST': {
      const q = state.quests.find((x) => x.id === action.payload);
      if (!q || q.currentValue < q.targetValue || q.isClaimed) return state;
      return {
        ...state,
        gems: state.gems + q.gemReward,
        quests: state.quests.map((x) => (x.id === q.id ? { ...x, isClaimed: true } : x)),
        toastMessage: q.itemReward ? `Claimed! +${q.gemReward} gems & ${q.itemReward}!` : `Claimed! +${q.gemReward} gems!`,
      };
    }
    case 'PURCHASE_ITEM': {
      const item = SHOP_ITEMS.find((i) => i.id === action.payload);
      if (!item || state.gems < item.gemPrice || state.cosmetics.some((c) => c.id === item.id)) {
        return { ...state, toastMessage: state.gems < (item?.gemPrice ?? 0) ? 'Not enough gems!' : 'You already own this!' };
      }
      return {
        ...state,
        gems: state.gems - item.gemPrice,
        cosmetics: [...state.cosmetics, { ...item, isOwned: true }],
        toastMessage: `Purchased ${item.name}! 🎉`,
      };
    }
    case 'PURCHASE_GEMS':
      return { ...state, gems: state.gems + action.payload, toastMessage: `Purchased ${action.payload} gems! 💎` };
    case 'EQUIP': {
      if ((action.payload.category as string) === 'Outfit') return state;
      const keyMap: Record<string, keyof EquippedCosmetics> = {
        Hat: 'hat',
        Shoes: 'shoes',
        Banner: 'banner',
        'Trail Effect': 'trailEffect',
        Pet: 'pet',
        Flashlight: 'torch',
        Torch: 'torch',
        Compass: 'compass',
        Backpack: 'backpack',
      };
      const key = keyMap[action.payload.category];
      if (!key) return state;
      const socialBanner = action.payload.category === 'Banner' ? getSocialBanner(action.payload.id) : null;
      return {
        ...state,
        equipped: { ...state.equipped, [key]: action.payload.id },
        toastMessage: socialBanner ? `${socialBanner.name} equipped and visible in Social` : undefined,
      };
    }
    case 'SET_FRIENDS':
      return { ...state, friends: action.payload };
    case 'SET_LANDMARKS':
      return { ...state, landmarks: mergeLandmarkCatalog(state.landmarks, action.payload) };
    case 'SET_SYNC_VERSION':
      return { ...state, syncVersion: action.payload };
    case 'DISMISS_LANDMARK_DISCOVERY':
      return { ...state, showLandmarkDiscoveryPopup: false, pendingLandmarkDiscovery: undefined };
    case 'DISMISS_REWARD':
      return { ...state, showRewardPopup: false, lastReward: undefined };
    case 'DISMISS_BADGE_UNLOCK': {
      const queue = (state.badgeUnlockQueue ?? []).slice(1);
      return {
        ...state,
        badgeUnlockQueue: queue,
        showBadgeUnlockModal: queue.length > 0,
      };
    }
    case 'SET_TOAST':
      return { ...state, toastMessage: action.payload };
    case 'CLEAR_TOAST':
      return { ...state, toastMessage: undefined };
    default:
      return state;
  }
}

export function getCategoryLeaderboard(state: GameStateShape, category: string): LeaderboardEntry[] {
  const myBanner = getSocialBanner(state.equipped.banner) ?? undefined;
  const me = {
    id: 'me',
    name: state.username,
    weeklyMiles: Math.min(state.totalMiles, 12.5),
    rank: 0,
    isCurrentUser: true,
    socialBanner: myBanner,
  };
  const score = (f: Friend, isMe: boolean) => {
    if (category === 'fog') return isMe ? state.unlockedAreas.length : f.unlockedAreas;
    if (category === 'landmarks') {
      return isMe ? (state.collectedLandmarks?.length ?? 0) : (f.landmarksFound ?? 0);
    }
    if (category === 'level') return isMe ? state.level : f.level;
    return isMe ? me.weeklyMiles : f.weeklyMiles;
  };
  const entries = [
    ...state.friends.map((f) => ({
      id: f.id,
      name: f.name,
      weeklyMiles: score(f, false) as number,
      rank: 0,
      isCurrentUser: false,
      socialBanner: f.socialBanner,
    })),
    { ...me, weeklyMiles: score({} as Friend, true) as number },
  ];
  entries.sort((a, b) => b.weeklyMiles - a.weeklyMiles);
  return entries.map((e, i) => ({ ...e, rank: i + 1 }));
}

/** Ensure cloud leaderboard uses local collected count for the signed-in player. */
export function finalizeLeaderboard(
  rows: LeaderboardEntry[],
  category: string,
  state: GameStateShape,
  userId?: string
): LeaderboardEntry[] {
  if (category !== 'landmarks') return rows;
  const myCount = state.collectedLandmarks?.length ?? 0;
  const myBanner = getSocialBanner(state.equipped.banner) ?? undefined;
  let patched = rows.length ? [...rows] : [];
  if (!patched.some((e) => e.isCurrentUser || (userId && e.id === userId))) {
    patched.push({
      id: userId ?? 'me',
      name: state.username,
      weeklyMiles: myCount,
      rank: 0,
      isCurrentUser: true,
      socialBanner: myBanner,
    });
  }
  patched = patched.map((e) =>
    e.isCurrentUser || e.id === userId ? { ...e, weeklyMiles: Math.max(e.weeklyMiles, myCount) } : e
  );
  patched.sort((a, b) => b.weeklyMiles - a.weeklyMiles);
  return patched.map((e, i) => ({ ...e, rank: i + 1 }));
}

export function isLandmarkVisible(lm: Landmark, level: number): boolean {
  if (!lm.discoverCondition) return true;
  const day = new Date().getDay();
  const cond = lm.discoverCondition.toLowerCase();
  if (cond.includes('weekend') && day !== 0 && day !== 6) return false;
  if (cond.includes('level') && level < 5) return false;
  return true;
}
