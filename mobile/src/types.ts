export type LandmarkCategory =
  | 'Historic'
  | 'Park'
  | 'Museum'
  | 'Trail'
  | 'Monument'
  | 'School'
  | 'Library';
export type LandmarkRarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic';
export type ChestRarity = 'Common' | 'Rare' | 'Epic' | 'Legendary';

export type CosmeticCategory =
  | 'Hat'
  | 'Shoes'
  | 'Banner'
  | 'Trail Effect'
  | 'Pet'
  | 'Flashlight'
  | 'Compass'
  | 'Backpack';

export interface Landmark {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  rarity: LandmarkRarity;
  category: LandmarkCategory;
  lore: string;
  /** e.g. weekend, level-5 */
  discoverCondition?: string;
  lastOpenedAt?: number;
}
export type QuestType = 'daily' | 'weekly';
export type QuestCategory = 'runMiles' | 'openChest' | 'discoverAreas' | 'discoverLandmarks' | 'walkSteps' | 'addFriend';

export interface UnlockedArea {
  id: string;
  centerLatitude: number;
  centerLongitude: number;
  radiusMeters: number;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  category: QuestCategory;
  targetValue: number;
  currentValue: number;
  gemReward: number;
  itemReward?: string;
  isClaimed: boolean;
}

export interface SocialBanner {
  emoji: string;
  name: string;
}

export interface Friend {
  id: string;
  name: string;
  level: number;
  weeklyMiles: number;
  unlockedAreas: number;
  landmarksFound: number;
  avatarEmoji: string;
  isOnline: boolean;
  socialBanner?: SocialBanner;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  emoji: string;
  isUnlocked: boolean;
  requirement: string;
}

export interface CosmeticItem {
  id: string;
  name: string;
  category: CosmeticCategory;
  emoji: string;
  gemPrice: number;
  rarity: LandmarkRarity;
  isOwned: boolean;
}

export interface ActivityEntry {
  id: string;
  emoji: string;
  text: string;
  timestamp: number;
}

export interface EquippedCosmetics {
  hat?: string;
  shoes?: string;
  banner?: string;
  trailEffect?: string;
  pet?: string;
  torch?: string;
  compass?: string;
  backpack?: string;
}

export interface GhostRun {
  id: string;
  date: number;
  distanceMiles: number;
  durationMinutes: number;
  xpEarned: number;
  routeName: string;
}

export interface ChestReward {
  xp: number;
  gems: number;
  cosmetic?: CosmeticItem;
  isRare: boolean;
  chestRarity?: ChestRarity;
}

export interface TreasureChest {
  id: string;
  latitude: number;
  longitude: number;
  rarity: ChestRarity;
  spawnedAt: number;
  expiresAt: number;
}

export interface LandmarkDiscovery {
  landmark: Landmark;
  xp: number;
  gems: number;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  weeklyMiles: number;
  rank: number;
  isCurrentUser: boolean;
  socialBanner?: SocialBanner;
}

export const RARITY_COLORS: Record<LandmarkRarity, string> = {
  Common: '#888888',
  Uncommon: '#33D98C',
  Rare: '#408CFF',
  Epic: '#8C40F2',
};

export const CHEST_RARITY_COLORS: Record<ChestRarity, string> = {
  Common: '#888888',
  Rare: '#408CFF',
  Epic: '#8C40F2',
  Legendary: '#FFB020',
};
