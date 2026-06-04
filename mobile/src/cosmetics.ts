import type { CosmeticItem, EquippedCosmetics } from './types';
import { theme } from './theme';
import { SHOP_ITEMS } from './gameState';

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

/** Resolve display name/category from shop catalog (for profile & shop UI). */
export function syncCosmeticFromCatalog(item: CosmeticItem): CosmeticItem {
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

export function findCosmetic(
  id: string | undefined,
  cosmetics: CosmeticItem[],
  shopItems: CosmeticItem[]
): CosmeticItem | undefined {
  if (!id) return undefined;
  return cosmetics.find((c) => c.id === id) ?? shopItems.find((c) => c.id === id);
}

export function emojiFor(
  id: string | undefined,
  cosmetics: CosmeticItem[],
  shopItems: CosmeticItem[],
  fallback = ''
): string {
  return findCosmetic(id, cosmetics, shopItems)?.emoji ?? fallback;
}

export function trailColor(
  trailId: string | undefined,
  cosmetics: CosmeticItem[],
  shopItems: CosmeticItem[]
): string {
  const name = findCosmetic(trailId, cosmetics, shopItems)?.name ?? '';
  if (name.includes('Fire')) return '#ff6633';
  if (name.includes('Spark')) return theme.accentGold;
  if (name.includes('Rainbow')) return '#aa66ff';
  return theme.accentBlue;
}

/** Stable key so map markers re-snapshot when loadout changes. */
export function equippedVisualKey(equipped: EquippedCosmetics, profilePhotoUri?: string): string {
  return [
    equipped.hat,
    equipped.shoes,
    equipped.banner,
    equipped.trailEffect,
    equipped.pet,
    equipped.torch,
    equipped.compass,
    equipped.backpack,
    profilePhotoUri ?? '',
  ].join('|');
}
