import type { Landmark } from '../types';

/** Curated Springfield POIs; works offline. */
const SPRINGFIELD_LANDMARK_RAW: Landmark[] = [
  { id: 'spr-hoop-hall', name: 'Naismith Basketball Hall of Fame', latitude: 42.0922, longitude: -72.5858, category: 'Museum', rarity: 'Epic', lore: 'Where basketball\'s story began on the Connecticut River.' },
  { id: 'spr-armory', name: 'Springfield Armory National Historic Site', latitude: 42.1074, longitude: -72.5812, category: 'Museum', rarity: 'Epic', lore: 'Birthplace of American military small-arms innovation.' },
  { id: 'spr-museums', name: 'Springfield Museums', latitude: 42.1044, longitude: -72.5856, category: 'Museum', rarity: 'Rare', lore: 'Quadrangle of art, science, and Dr. Seuss sculptures.' },
  { id: 'spr-forest-park', name: 'Forest Park', latitude: 42.0703, longitude: -72.5642, category: 'Park', rarity: 'Rare', lore: '735 acres of rose gardens, ponds, and paved loops.' },
  { id: 'spr-symphony', name: 'Springfield Symphony Hall', latitude: 42.101, longitude: -72.5895, category: 'Historic', rarity: 'Uncommon', lore: '1920s concert hall anchoring downtown culture.' },
  { id: 'spr-court-square', name: 'Court Square', latitude: 42.1013, longitude: -72.5899, category: 'Historic', rarity: 'Uncommon', lore: 'Downtown crossroads since colonial days.' },
  { id: 'spr-city-hall', name: 'Springfield City Hall', latitude: 42.1015, longitude: -72.59, category: 'Historic', rarity: 'Uncommon', lore: 'Campanile tower rises over municipal government.' },
  { id: 'spr-union-station', name: 'Springfield Union Station', latitude: 42.1065, longitude: -72.5945, category: 'Historic', rarity: 'Uncommon', lore: 'Restored transit hub for rail and bus travelers.' },
  { id: 'spr-forest-park-zoo', name: 'The Zoo in Forest Park', latitude: 42.0745, longitude: -72.558, category: 'Park', rarity: 'Uncommon', lore: 'Seasonal zoo paths through the city\'s largest park.' },
  { id: 'spr-nathans', name: "Nathan Bill's Park", latitude: 42.068, longitude: -72.552, category: 'Park', rarity: 'Common', lore: 'Neighborhood green with ball fields and playgrounds.' },
  { id: 'spr-riverfront', name: 'Riverfront Park', latitude: 42.101, longitude: -72.593, category: 'Park', rarity: 'Common', lore: 'Connecticut River views beside downtown walkways.' },
  { id: 'spr-stearns', name: 'Stearns Square', latitude: 42.0995, longitude: -72.5885, category: 'Historic', rarity: 'Common', lore: 'Arts district square with murals and cafes.' },
  { id: 'spr-puritan', name: 'The Puritan Statue', latitude: 42.1012, longitude: -72.5905, category: 'Monument', rarity: 'Uncommon', lore: 'Storrs Park bronze of Springfield\'s founding spirit.' },
  { id: 'spr-indian-orchard', name: 'Indian Orchard Mills', latitude: 42.163, longitude: -72.508, category: 'Historic', rarity: 'Rare', lore: 'Red-brick mill campus revived for artists and makers.' },
  { id: 'spr-merrick', name: 'Merrick Public Library', latitude: 42.1048, longitude: -72.5845, category: 'Library', rarity: 'Common', lore: 'Museum row reading rooms and local history stacks.' },
];

export const SPRINGFIELD_LANDMARK_CATALOG: Landmark[] = SPRINGFIELD_LANDMARK_RAW.filter(
  (lm) => lm.category !== 'School'
);

export const SPRINGFIELD_LANDMARK_GOAL = SPRINGFIELD_LANDMARK_CATALOG.length;
