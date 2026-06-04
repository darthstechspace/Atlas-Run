import type { EquippedCosmetics } from './types';
import { getEquippedPetBuff } from './petBuffs';

type GearBuff = { label: string; runXp?: number; landmarkGems?: number; chestGems?: number; landmarkXp?: number };

export const FLASHLIGHT_BUFFS: Record<string, { label: string; fog?: number }> = {
  '13': { label: '+10% explore radius', fog: 1.1 },
  '17': { label: '+15% explore radius', fog: 1.15 },
  '56': { label: '+12% explore radius (+20% in Salem)', fog: 1.12 },
};

export const TORCH_BUFFS = FLASHLIGHT_BUFFS;

export const BANNER_BUFFS: Record<
  string,
  { label: string; emoji: string; name: string; runXp?: number; landmarkGems?: number; chestGems?: number }
> = {
  '7': { label: 'Shows Mountain Banner in Social, +8% run XP', emoji: '🏔️', name: 'Mountain Banner', runXp: 1.08 },
  '8': {
    label: 'Shows Galaxy Banner in Social, +15% landmark gems, +10% chest gems',
    emoji: '🌌',
    name: 'Galaxy Banner',
    landmarkGems: 1.15,
    chestGems: 1.1,
  },
  '18': {
    label: 'Shows Witch City banner in Social, +10% landmark gems',
    emoji: '🧙‍♀️',
    name: 'Witch City',
    landmarkGems: 1.1,
  },
};

export const HAT_BUFFS: Record<string, GearBuff> = {
  '4': { label: '+5% run XP', runXp: 1.05 },
};

export const SHOES_BUFFS: Record<string, GearBuff> = {
  '6': { label: '+12% run XP', runXp: 1.12 },
};

export const COMPASS_BUFFS: Record<string, { label: string; discoverRadiusBonus?: number }> = {
  '14': { label: '+15m landmark discovery radius', discoverRadiusBonus: 15 },
};

export const BACKPACK_BUFFS: Record<string, { label: string; chestGems?: number; landmarkXp?: number }> = {
  '15': { label: '+10% chest gems', chestGems: 1.1 },
  '19': { label: '+15% chest gems', chestGems: 1.15 },
  '63': { label: '+8% chest gems', chestGems: 1.08 },
};

function multiplyFactors(factors: (number | undefined)[]): number {
  return factors.reduce<number>((acc, f) => (f ? acc * f : acc), 1);
}

export function getRunXpMultiplier(equipped: EquippedCosmetics): number {
  const pet = getEquippedPetBuff(equipped.pet);
  const banner = getEquippedBannerBuff(equipped.banner);
  const hat = equipped.hat ? HAT_BUFFS[equipped.hat] : undefined;
  const shoes = equipped.shoes ? SHOES_BUFFS[equipped.shoes] : undefined;
  return multiplyFactors([pet?.runXp, banner?.runXp, hat?.runXp, shoes?.runXp]);
}

export function getLandmarkGemMultiplier(equipped: EquippedCosmetics): number {
  const pet = getEquippedPetBuff(equipped.pet);
  const banner = getEquippedBannerBuff(equipped.banner);
  const hat = equipped.hat ? HAT_BUFFS[equipped.hat] : undefined;
  return multiplyFactors([pet?.chestGems, banner?.landmarkGems, hat?.landmarkGems]);
}

export function getLandmarkXpMultiplier(equipped: EquippedCosmetics): number {
  const pet = getEquippedPetBuff(equipped.pet);
  const shoes = equipped.shoes ? SHOES_BUFFS[equipped.shoes] : undefined;
  const backpack = getEquippedBackpackBuff(equipped.backpack);
  return multiplyFactors([pet?.landmarkXp, shoes?.landmarkXp, backpack?.landmarkXp]);
}

export function getChestGemMultiplier(equipped: EquippedCosmetics): number {
  const pet = getEquippedPetBuff(equipped.pet);
  const banner = getEquippedBannerBuff(equipped.banner);
  const backpack = getEquippedBackpackBuff(equipped.backpack);
  const hat = equipped.hat ? HAT_BUFFS[equipped.hat] : undefined;
  return multiplyFactors([pet?.chestGems, banner?.chestGems, backpack?.chestGems, hat?.chestGems]);
}

export function getEquippedFlashlightBuff(flashlightId?: string) {
  if (!flashlightId) return null;
  return FLASHLIGHT_BUFFS[flashlightId] ?? null;
}

export const getEquippedTorchBuff = getEquippedFlashlightBuff;

export function getEquippedBannerBuff(bannerId?: string) {
  if (!bannerId) return null;
  return BANNER_BUFFS[bannerId] ?? null;
}

export function getSocialBanner(bannerId?: string): { emoji: string; name: string } | null {
  const banner = getEquippedBannerBuff(bannerId);
  if (!banner) return null;
  return { emoji: banner.emoji, name: banner.name };
}

export function getEquippedCompassBuff(compassId?: string) {
  if (!compassId) return null;
  return COMPASS_BUFFS[compassId] ?? null;
}

export function getEquippedBackpackBuff(backpackId?: string) {
  if (!backpackId) return null;
  return BACKPACK_BUFFS[backpackId] ?? null;
}

export function gearBuffLabel(category: string, id: string): string | undefined {
  if (category === 'Flashlight' || category === 'Torch') return FLASHLIGHT_BUFFS[id]?.label;
  if (category === 'Banner') return BANNER_BUFFS[id]?.label;
  if (category === 'Hat') return HAT_BUFFS[id]?.label;
  if (category === 'Shoes') return SHOES_BUFFS[id]?.label;
  if (category === 'Compass') return COMPASS_BUFFS[id]?.label;
  if (category === 'Backpack') return BACKPACK_BUFFS[id]?.label;
  return undefined;
}
