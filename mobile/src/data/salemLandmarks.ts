import type { Landmark } from '../types';

/** Curated Salem POIs; works offline. */
const SALEM_LANDMARK_RAW: Landmark[] = [
  { id: 'sal-peabody-essex', name: 'Peabody Essex Museum', latitude: 42.5219, longitude: -70.8911, category: 'Museum', rarity: 'Epic', lore: 'Maritime art and global collections in the Essex Street district.' },
  { id: 'sal-witch-museum', name: 'Salem Witch Museum', latitude: 42.5232, longitude: -70.8917, category: 'Museum', rarity: 'Rare', lore: '1692 trials told through dramatic exhibits on Washington Square.' },
  { id: 'sal-seven-gables', name: 'House of the Seven Gables', latitude: 42.5209, longitude: -70.8842, category: 'Historic', rarity: 'Epic', lore: 'Hawthorne\'s seaside mansion and colonial gardens.' },
  { id: 'sal-maritime', name: 'Salem Maritime Visitor Center', latitude: 42.5208, longitude: -70.8875, category: 'Historic', rarity: 'Rare', lore: 'Gateway to wharves that built early American trade.' },
  { id: 'sal-derby-wharf', name: 'Derby Wharf', latitude: 42.5206, longitude: -70.8848, category: 'Historic', rarity: 'Uncommon', lore: 'Longest extant waterfront wharf from the age of sail.' },
  { id: 'sal-burying-point', name: 'Charter Street Burying Ground', latitude: 42.5215, longitude: -70.893, category: 'Historic', rarity: 'Rare', lore: 'Oldest cemetery in Salem; judges and sea captains rest here.' },
  { id: 'sal-salem-common', name: 'Salem Common', latitude: 42.5228, longitude: -70.8935, category: 'Park', rarity: 'Uncommon', lore: 'Open green since 1717; muster ground and festival hub.' },
  { id: 'sal-witch-memorial', name: 'Salem Witch Trials Memorial', latitude: 42.5226, longitude: -70.8915, category: 'Monument', rarity: 'Rare', lore: 'Quiet benches remember twenty lives lost in 1692.' },
  { id: 'sal-pickering-wharf', name: 'Pickering Wharf', latitude: 42.5195, longitude: -70.8865, category: 'Historic', rarity: 'Common', lore: 'Shops and slips along the working harbor.' },
  { id: 'sal-salem-willows', name: 'Salem Willows Park', latitude: 42.505, longitude: -70.848, category: 'Park', rarity: 'Uncommon', lore: 'Arcade, beaches, and sunset walks on the neck.' },
  { id: 'sal-ropes-mansion', name: 'Ropes Mansion', latitude: 42.5235, longitude: -70.89, category: 'Historic', rarity: 'Uncommon', lore: 'Georgian home and garden on Essex Street.' },
  { id: 'sal-phillips-house', name: 'Phillips House', latitude: 42.522, longitude: -70.8905, category: 'Historic', rarity: 'Uncommon', lore: 'Four generations of family life preserved indoors.' },
  { id: 'sal-salem-station', name: 'Salem Station', latitude: 42.5225, longitude: -70.8955, category: 'Historic', rarity: 'Common', lore: 'Commuter rail hub linking the North Shore to Boston.' },
  { id: 'sal-winter-island', name: 'Winter Island Park', latitude: 42.511, longitude: -70.875, category: 'Park', rarity: 'Uncommon', lore: 'Fort Pickering light views and harbor campsites.' },
  { id: 'sal-st-peters', name: "St. Peter's Episcopal Church", latitude: 42.523, longitude: -70.892, category: 'Historic', rarity: 'Common', lore: 'Federal-style steeple on the path to the common.' },
];

export const SALEM_LANDMARK_CATALOG: Landmark[] = SALEM_LANDMARK_RAW.filter(
  (lm) => lm.category !== 'School'
);

export const SALEM_LANDMARK_GOAL = SALEM_LANDMARK_CATALOG.length;
