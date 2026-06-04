import type { SkillPath } from './v3/data';
import { CITY_REGIONS } from './v3/data';
import { distanceMeters } from './geo';

export const PET_BUFFS: Record<
  string,
  { label: string; fog?: number; runXp?: number; chestGems?: number; landmarkXp?: number }
> = {
  '11': { label: '+5% run XP', runXp: 1.05 },
  '12': { label: '+10% landmark XP, +5% fog reveal', fog: 1.05, landmarkXp: 1.1 },
  '16': { label: '+3% landmark gems', chestGems: 1.03 },
  '50': { label: '+6% run XP', runXp: 1.06 },
};

const FLASHLIGHT_FOG: Record<string, number> = {
  '13': 1.1,
  '17': 1.15,
  '56': 1.12,
};

const LANTERN_ID = '56';
const LANTERN_FOG_SALEM = 1.2;

function isInSalemRegion(coord?: { latitude: number; longitude: number }): boolean {
  if (!coord) return false;
  const salem = CITY_REGIONS.find((r) => r.id === 'salem');
  if (!salem) return false;
  return distanceMeters(coord, salem.center) <= salem.radiusMeters;
}

function flashlightFogMultiplier(flashlightId?: string, coord?: { latitude: number; longitude: number }): number {
  if (!flashlightId) return 1;
  if (flashlightId === LANTERN_ID && isInSalemRegion(coord)) return LANTERN_FOG_SALEM;
  return FLASHLIGHT_FOG[flashlightId] ?? 1;
}

export function getEquippedPetBuff(petId?: string) {
  if (!petId) return null;
  return PET_BUFFS[petId] ?? null;
}

export function computeFogRevealRadius(
  base: number,
  skillPath?: SkillPath | null,
  equippedPetId?: string,
  equippedFlashlightId?: string,
  coord?: { latitude: number; longitude: number }
): number {
  let r = base;
  if (skillPath === 'explorer') r *= 1.1;
  const pet = getEquippedPetBuff(equippedPetId);
  if (pet?.fog) r *= pet.fog;
  r *= flashlightFogMultiplier(equippedFlashlightId, coord);
  return r;
}
