import type { CosmeticItem } from '../types';

/** Full shop catalog (imported by gameState as SHOP_ITEMS). */
export const SHOP_CATALOG: CosmeticItem[] = [
  // Hats
  { id: '3', name: 'Cap', category: 'Hat', emoji: '🧢', gemPrice: 75, rarity: 'Common', isOwned: false },
  { id: '4', name: 'Crown', category: 'Hat', emoji: '👑', gemPrice: 500, rarity: 'Epic', isOwned: false },

  // Shoes
  { id: '5', name: 'Sneakers', category: 'Shoes', emoji: '👟', gemPrice: 100, rarity: 'Common', isOwned: false },
  { id: '6', name: 'Rocket Boots', category: 'Shoes', emoji: '🚀', gemPrice: 300, rarity: 'Rare', isOwned: false },
  { id: '20', name: 'Lobster Slippers', category: 'Shoes', emoji: '🦞', gemPrice: 45, rarity: 'Common', isOwned: false },

  // Banners
  { id: '7', name: 'Mountain Banner', category: 'Banner', emoji: '🏔️', gemPrice: 80, rarity: 'Common', isOwned: false },
  { id: '8', name: 'Galaxy Banner', category: 'Banner', emoji: '🌌', gemPrice: 250, rarity: 'Rare', isOwned: false },
  { id: '18', name: 'Witch City', category: 'Banner', emoji: '🧙‍♀️', gemPrice: 180, rarity: 'Uncommon', isOwned: false },

  // Trail effects
  { id: '9', name: 'Spark Trail', category: 'Trail Effect', emoji: '✨', gemPrice: 180, rarity: 'Uncommon', isOwned: false },
  { id: '10', name: 'Fire Trail', category: 'Trail Effect', emoji: '🔥', gemPrice: 400, rarity: 'Epic', isOwned: false },
  { id: '46', name: 'Rainbow Trail', category: 'Trail Effect', emoji: '🌈', gemPrice: 350, rarity: 'Epic', isOwned: false },

  // Pets
  { id: '11', name: 'Dog', category: 'Pet', emoji: '🐕', gemPrice: 220, rarity: 'Uncommon', isOwned: false },
  { id: '12', name: 'Dragon', category: 'Pet', emoji: '🐉', gemPrice: 600, rarity: 'Epic', isOwned: false },
  { id: '16', name: 'Cat', category: 'Pet', emoji: '🐱', gemPrice: 220, rarity: 'Uncommon', isOwned: false },
  { id: '50', name: 'Fox', category: 'Pet', emoji: '🦊', gemPrice: 200, rarity: 'Uncommon', isOwned: false },
  { id: '54', name: 'Hamster', category: 'Pet', emoji: '🐹', gemPrice: 125, rarity: 'Common', isOwned: false },

  // Flashlights
  { id: '13', name: 'Base Flashlight', category: 'Flashlight', emoji: '🔦', gemPrice: 60, rarity: 'Common', isOwned: false },
  { id: '17', name: 'Bright Flashlight', category: 'Flashlight', emoji: '💡', gemPrice: 150, rarity: 'Uncommon', isOwned: false },
  { id: '56', name: 'Lantern', category: 'Flashlight', emoji: '🏮', gemPrice: 150, rarity: 'Common', isOwned: false },

  // Compasses
  { id: '14', name: 'Base Compass', category: 'Compass', emoji: '🧭', gemPrice: 90, rarity: 'Uncommon', isOwned: false },

  // Backpacks
  { id: '15', name: 'Trail Backpack', category: 'Backpack', emoji: '🎒', gemPrice: 120, rarity: 'Common', isOwned: false },
  { id: '19', name: 'Hiking Pack', category: 'Backpack', emoji: '🏕️', gemPrice: 140, rarity: 'Uncommon', isOwned: false },
  { id: '63', name: 'Cooler Pack', category: 'Backpack', emoji: '🧊', gemPrice: 100, rarity: 'Common', isOwned: false },
];
