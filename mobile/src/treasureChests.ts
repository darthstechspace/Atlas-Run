import type { ChestRarity, ChestReward, CosmeticItem, TreasureChest } from './types';

const CHEST_REWARD_CFG: Record<
  ChestRarity,
  { xp: [number, number]; gems: [number, number]; cosmeticChance: number }
> = {
  Common: { xp: [25, 60], gems: [2, 8], cosmeticChance: 0.08 },
  Rare: { xp: [80, 150], gems: [10, 25], cosmeticChance: 0.25 },
  Epic: { xp: [150, 300], gems: [25, 50], cosmeticChance: 0.45 },
  Legendary: { xp: [300, 600], gems: [50, 100], cosmeticChance: 0.7 },
};

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function rollChestRarity(): ChestRarity {
  const r = Math.random();
  if (r < 0.03) return 'Legendary';
  if (r < 0.15) return 'Epic';
  if (r < 0.4) return 'Rare';
  return 'Common';
}

export function chestRewardForTier(
  rarity: ChestRarity,
  shop: CosmeticItem[],
  owned: CosmeticItem[]
): ChestReward {
  const cfg = CHEST_REWARD_CFG[rarity];
  const xp = randInt(cfg.xp[0], cfg.xp[1]);
  const gems = randInt(cfg.gems[0], cfg.gems[1]);
  const isRare = rarity === 'Epic' || rarity === 'Legendary' || Math.random() < 0.12;
  let cosmetic: CosmeticItem | undefined;
  if (Math.random() < cfg.cosmeticChance) {
    const unowned = shop.filter((s) => !owned.some((o) => o.id === s.id));
    if (unowned.length) cosmetic = unowned[Math.floor(Math.random() * unowned.length)];
  }
  return { xp, gems, cosmetic, isRare, chestRarity: rarity };
}

export function spawnChestNear(
  lat: number,
  lng: number,
  existing: TreasureChest[],
  maxActive = 5
): TreasureChest | null {
  if (existing.length >= maxActive) return null;
  if (Math.random() > 0.12) return null;

  const angle = Math.random() * 2 * Math.PI;
  const distM = 60 + Math.random() * 140;
  const dLat = (distM * Math.cos(angle)) / 111320;
  const dLng = (distM * Math.sin(angle)) / (111320 * Math.cos((lat * Math.PI) / 180));

  return {
    id: `chest-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    latitude: lat + dLat,
    longitude: lng + dLng,
    rarity: rollChestRarity(),
    spawnedAt: Date.now(),
    expiresAt: Date.now() + 30 * 60 * 1000,
  };
}

export function pruneExpiredChests(chests: TreasureChest[]): TreasureChest[] {
  const now = Date.now();
  return chests.filter((c) => c.expiresAt > now);
}

export const LANDMARK_DISCOVER_XP = 50;
export const LANDMARK_DISCOVER_GEMS = 10;
export const LANDMARK_DISCOVER_RADIUS_M = 80;
