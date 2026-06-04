import { distanceMeters } from '../geo';
import type { UnlockedArea } from '../types';

export type SkillPath = 'explorer' | 'runner' | 'collector';
export type AuthProvider = 'email' | 'google' | 'apple';

export interface UserAccount {
  email: string;
  provider: AuthProvider;
  displayName: string;
  lastSync?: number;
}

export interface CityRegion {
  id: string;
  name: string;
  center: { latitude: number; longitude: number };
  radiusMeters: number;
}

export interface LandmarkCollectionEntry {
  landmarkId: string;
  collectedAt: number;
  loreUnlocked: boolean;
}

export interface PersonalRecords {
  fastestMileMin?: number;
  fastest5kMin?: number;
  longestRunMiles?: number;
  longestStreak?: number;
}

export interface SavedRoute {
  id: string;
  name: string;
  distanceMiles: number;
  rating: number;
  sharedBy?: string;
  createdAt: number;
}

export interface Title {
  id: string;
  name: string;
  requirement: string;
  unlocked: boolean;
}

export interface LeaderboardCategory {
  id: string;
  label: string;
  unit: string;
}

export const BOSTON_CENTER = { latitude: 42.355116, longitude: -71.065444 };
export const WORCESTER_CENTER = { latitude: 42.2626, longitude: -71.8023 };
export const SALEM_CENTER = { latitude: 42.5195, longitude: -70.8967 };
export const SPRINGFIELD_CENTER = { latitude: 42.1015, longitude: -72.5898 };

export const CITY_REGIONS: CityRegion[] = [
  { id: 'boston', name: 'Boston', center: BOSTON_CENTER, radiusMeters: 12000 },
  { id: 'worcester', name: 'Worcester', center: WORCESTER_CENTER, radiusMeters: 8000 },
  { id: 'salem', name: 'Salem', center: SALEM_CENTER, radiusMeters: 6000 },
  { id: 'springfield', name: 'Springfield', center: SPRINGFIELD_CENTER, radiusMeters: 9000 },
];

/** @deprecated Use CITY_REGIONS */
export const WORCESTER_REGIONS = CITY_REGIONS.filter((r) => r.id === 'worcester');

/** Estimate exploration % from unlocked fog bubbles overlapping a region */
export function regionExploredPercent(region: CityRegion, unlockedAreas: UnlockedArea[]): number {
  const inside = unlockedAreas.filter(
    (a) =>
      distanceMeters(
        { latitude: a.centerLatitude, longitude: a.centerLongitude },
        region.center
      ) <= region.radiusMeters + a.radiusMeters
  );
  if (inside.length === 0) return 0;

  const covered = inside.reduce((sum, a) => sum + Math.PI * a.radiusMeters ** 2, 0);
  const regionArea = Math.PI * region.radiusMeters ** 2;
  return Math.min(100, Math.round((covered / regionArea) * 100));
}

export function cityExploredPercent(unlockedAreas: UnlockedArea[], regionId?: string): number {
  if (regionId) {
    const city = CITY_REGIONS.find((r) => r.id === regionId);
    if (!city) return 0;
    return regionExploredPercent(city, unlockedAreas);
  }
  if (CITY_REGIONS.length === 0) return 0;
  const total = CITY_REGIONS.reduce((sum, r) => sum + regionExploredPercent(r, unlockedAreas), 0);
  return Math.round(total / CITY_REGIONS.length);
}

export const LEADERBOARD_CATEGORIES: LeaderboardCategory[] = [
  { id: 'distance', label: 'Weekly Distance', unit: 'mi' },
  { id: 'fog', label: 'Fog Cleared', unit: 'zones' },
  { id: 'landmarks', label: 'Landmarks Found', unit: 'found' },
  { id: 'level', label: 'Highest Level', unit: 'Lv' },
];

export const SKILL_PATHS: Record<SkillPath, { name: string; emoji: string; perks: string[] }> = {
  explorer: {
    name: 'Explorer',
    emoji: '🧭',
    perks: ['+10% fog reveal radius', 'Better chest gem drops', 'Bonus XP from new zones'],
  },
  runner: {
    name: 'Runner',
    emoji: '🏃',
    perks: ['+25% XP from distance', 'Faster leveling', 'Ghost run bonus XP'],
  },
  collector: {
    name: 'Collector',
    emoji: '📦',
    perks: ['+15% cosmetic drop rate', 'Rare landmark bonuses', 'Collection set rewards'],
  },
};

export const TITLES: Title[] = [
  { id: 't1', name: 'Trailblazer', requirement: 'Clear 10 zones', unlocked: false },
  { id: 't2', name: 'Fog Hunter', requirement: 'Clear 25 zones', unlocked: false },
  { id: 't3', name: 'Explorer', requirement: 'Collect 5 landmarks', unlocked: false },
  { id: 't4', name: 'Pathfinder', requirement: 'Run 10 miles total', unlocked: false },
  { id: 't5', name: 'Atlas Master', requirement: 'Reach level 20', unlocked: false },
];
