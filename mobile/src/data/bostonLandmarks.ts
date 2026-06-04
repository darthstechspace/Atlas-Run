import type { Landmark } from '../types';

/** Curated real Boston POIs with verified coordinates; works offline. */
const BOSTON_LANDMARK_RAW: Landmark[] = [
  { id: 'bos-mfa', name: 'Museum of Fine Arts, Boston', latitude: 42.339381, longitude: -71.094048, category: 'Museum', rarity: 'Epic', lore: 'One of the largest art collections in the Americas.' },
  { id: 'bos-gardner', name: 'Isabella Stewart Gardner Museum', latitude: 42.338164, longitude: -71.099075, category: 'Museum', rarity: 'Epic', lore: 'Venetian palazzo courtyard and stolen Vermeer lore.' },
  { id: 'bos-mos', name: 'Museum of Science', latitude: 42.367713, longitude: -71.071062, category: 'Museum', rarity: 'Rare', lore: 'Charles River science halls and planetarium shows.' },
  { id: 'bos-childrens-museum', name: "Boston Children's Museum", latitude: 42.351976, longitude: -71.049805, category: 'Museum', rarity: 'Uncommon', lore: 'Fort Point Channel hands-on discovery for all ages.' },
  { id: 'bos-ica', name: 'Institute of Contemporary Art', latitude: 42.352567, longitude: -71.042867, category: 'Museum', rarity: 'Rare', lore: 'Cantilevered galleries over Boston Harbor.' },
  { id: 'bos-uss-museum', name: 'USS Constitution Museum', latitude: 42.373567, longitude: -71.056584, category: 'Museum', rarity: 'Rare', lore: 'Old Ironsides and Charlestown Navy Yard history.' },
  { id: 'bos-jfk-library', name: 'JFK Presidential Library', latitude: 42.316258, longitude: -71.034049, category: 'Museum', rarity: 'Epic', lore: 'Columbia Point waterfront memorial to President Kennedy.' },
  { id: 'bos-mapparium', name: 'Mary Baker Eddy Library', latitude: 42.343065, longitude: -71.084718, category: 'Museum', rarity: 'Rare', lore: 'Walk inside the stained-glass Mapparium globe.' },
  { id: 'bos-tea-party', name: 'Boston Tea Party Ships & Museum', latitude: 42.352271, longitude: -71.050723, category: 'Museum', rarity: 'Uncommon', lore: 'Reenact the 1773 harbor protest.' },
  { id: 'bos-aquarium', name: 'New England Aquarium', latitude: 42.359084, longitude: -71.049742, category: 'Museum', rarity: 'Uncommon', lore: 'Giant ocean tank and harbor seals on Central Wharf.' },

  { id: 'bos-faneuil', name: 'Faneuil Hall', latitude: 42.360024, longitude: -71.056187, category: 'Historic', rarity: 'Epic', lore: 'Cradle of Liberty since colonial town meetings.' },
  { id: 'bos-old-state-house', name: 'Old State House', latitude: 42.358792, longitude: -71.057487, category: 'Historic', rarity: 'Rare', lore: 'Declaration of Independence read from this balcony in 1776.' },
  { id: 'bos-paul-revere', name: 'Paul Revere House', latitude: 42.363739, longitude: -71.053694, category: 'Historic', rarity: 'Rare', lore: 'Home of the midnight rider in the North End.' },
  { id: 'bos-old-north', name: 'Old North Church', latitude: 42.36631, longitude: -71.054734, category: 'Historic', rarity: 'Rare', lore: 'Two lanterns warned of the British route by sea.' },
  { id: 'bos-kings-chapel', name: "King's Chapel", latitude: 42.358012, longitude: -71.060122, category: 'Historic', rarity: 'Uncommon', lore: 'Stone Anglican chapel on Tremont Street since 1754.' },
  { id: 'bos-old-south', name: 'Old South Meeting House', latitude: 42.356934, longitude: -71.058734, category: 'Historic', rarity: 'Uncommon', lore: 'Where the Sons of Liberty planned the Tea Party.' },
  { id: 'bos-granary', name: 'Granary Burying Ground', latitude: 42.357422, longitude: -71.061654, category: 'Historic', rarity: 'Uncommon', lore: 'Resting place of Revere, Adams, and Hancock.' },
  { id: 'bos-state-house', name: 'Massachusetts State House', latitude: 42.358736, longitude: -71.063778, category: 'Historic', rarity: 'Rare', lore: 'Bulfinch gold dome on Beacon Hill.' },
  { id: 'bos-quincy-market', name: 'Quincy Market', latitude: 42.360177, longitude: -71.054954, category: 'Historic', rarity: 'Uncommon', lore: '1826 market hall now lined with food stalls.' },
  { id: 'bos-custom-house', name: 'Custom House Tower', latitude: 42.358612, longitude: -71.053488, category: 'Historic', rarity: 'Uncommon', lore: 'Art Deco tower marking the old port customs district.' },
  { id: 'bos-athenaeum', name: 'Boston Athenaeum', latitude: 42.357872, longitude: -71.062953, category: 'Library', rarity: 'Rare', lore: 'Member library and art gallery since 1807.' },
  { id: 'bos-african-meeting', name: 'African Meeting House', latitude: 42.360634, longitude: -71.065192, category: 'Historic', rarity: 'Rare', lore: 'Oldest surviving Black church building in the U.S.' },
  { id: 'bos-vilna-shul', name: 'Vilna Shul', latitude: 42.364019, longitude: -71.063567, category: 'Historic', rarity: 'Uncommon', lore: 'Historic synagogue on Beacon Hill.' },
  { id: 'bos-uss-constitution', name: 'USS Constitution', latitude: 42.372647, longitude: -71.055719, category: 'Historic', rarity: 'Epic', lore: "World's oldest commissioned naval vessel still afloat." },
  { id: 'bos-navy-yard', name: 'Charlestown Navy Yard', latitude: 42.373563, longitude: -71.055878, category: 'Historic', rarity: 'Uncommon', lore: 'Dry docks and warship heritage on the harbor.' },
  { id: 'bos-fenway', name: 'Fenway Park', latitude: 42.346676, longitude: -71.097218, category: 'Historic', rarity: 'Epic', lore: "America's most beloved ballpark since 1912." },
  { id: 'bos-td-garden', name: 'TD Garden', latitude: 42.366198, longitude: -71.062146, category: 'Historic', rarity: 'Uncommon', lore: 'Celtics and Bruins home above North Station.' },
  { id: 'bos-south-station', name: 'South Station', latitude: 42.352311, longitude: -71.055331, category: 'Historic', rarity: 'Common', lore: 'Grand rail terminal gateway to the South.' },
  { id: 'bos-north-station', name: 'North Station', latitude: 42.365554, longitude: -71.061297, category: 'Historic', rarity: 'Common', lore: 'Commuter hub beneath the Garden.' },
  { id: 'bos-acorn-st', name: 'Acorn Street', latitude: 42.357803, longitude: -71.069058, category: 'Historic', rarity: 'Uncommon', lore: 'Cobblestone lane photographed on Beacon Hill.' },
  { id: 'bos-louisburg', name: 'Louisburg Square', latitude: 42.357556, longitude: -71.067744, category: 'Historic', rarity: 'Rare', lore: 'Private Federal-era square on Beacon Hill.' },
  { id: 'bos-chinatown-gate', name: 'Chinatown Gate', latitude: 42.351014, longitude: -71.059487, category: 'Historic', rarity: 'Common', lore: 'Paifang arch welcoming visitors to Chinatown.' },
  { id: 'bos-trinity', name: 'Trinity Church', latitude: 42.349821, longitude: -71.075413, category: 'Historic', rarity: 'Rare', lore: 'Richardson Romanesque masterpiece in Copley Square.' },
  { id: 'bos-symphony', name: 'Symphony Hall', latitude: 42.342862, longitude: -71.085684, category: 'Historic', rarity: 'Rare', lore: 'Acoustically perfect home of the BSO.' },
  { id: 'bos-christian-science', name: 'Christian Science Plaza', latitude: 42.344515, longitude: -71.083723, category: 'Historic', rarity: 'Uncommon', lore: 'Reflecting pool and Mary Baker Eddy Mother Church.' },

  { id: 'bos-common', name: 'Boston Common', latitude: 42.355116, longitude: -71.065444, category: 'Park', rarity: 'Epic', lore: "America's oldest public park, established 1634." },
  { id: 'bos-public-garden', name: 'Public Garden', latitude: 42.354096, longitude: -71.070892, category: 'Park', rarity: 'Rare', lore: 'Swan boats and Victorian flower beds.' },
  { id: 'bos-esplanade', name: 'Charles River Esplanade', latitude: 42.355645, longitude: -71.078941, category: 'Park', rarity: 'Uncommon', lore: 'River paths for runs with skyline views.' },
  { id: 'bos-arboretum', name: 'Arnold Arboretum', latitude: 42.307572, longitude: -71.120049, category: 'Park', rarity: 'Epic', lore: 'Olmsted-designed tree collections in Jamaica Plain.' },
  { id: 'bos-franklin-park', name: 'Franklin Park', latitude: 42.303246, longitude: -71.093278, category: 'Park', rarity: 'Rare', lore: "Boston's largest park and zoo grounds." },
  { id: 'bos-jamaica-pond', name: 'Jamaica Pond', latitude: 42.3228, longitude: -71.116204, category: 'Park', rarity: 'Uncommon', lore: '1.7-mile pond loop in the Emerald Necklace.' },
  { id: 'bos-castle-island', name: 'Castle Island', latitude: 42.337862, longitude: -71.012458, category: 'Park', rarity: 'Rare', lore: 'Fort Independence and harbor breezes in South Boston.' },
  { id: 'bos-columbus-park', name: 'Christopher Columbus Park', latitude: 42.360892, longitude: -71.051197, category: 'Park', rarity: 'Common', lore: 'Harborfront roses and trellis by Long Wharf.' },
  { id: 'bos-greenway', name: 'Rose Kennedy Greenway', latitude: 42.358932, longitude: -71.051542, category: 'Park', rarity: 'Uncommon', lore: 'Linear park where the elevated highway once ran.' },
  { id: 'bos-embrace', name: 'The Embrace', latitude: 42.356118, longitude: -71.065092, category: 'Monument', rarity: 'Rare', lore: 'Memorial honoring Dr. King and Coretta Scott King.' },
  { id: 'bos-fens', name: 'Back Bay Fens', latitude: 42.340156, longitude: -71.096789, category: 'Park', rarity: 'Uncommon', lore: 'Emerald Necklace marsh gardens near the MFA.' },

  { id: 'bos-bunker-hill', name: 'Bunker Hill Monument', latitude: 42.376326, longitude: -71.060785, category: 'Monument', rarity: 'Epic', lore: '221-foot obelisk marking the 1775 battle.' },
  { id: 'bos-shaw-memorial', name: 'Robert Gould Shaw Memorial', latitude: 42.355387, longitude: -71.065806, category: 'Monument', rarity: 'Rare', lore: 'Saint-Gaudens bronze honoring the 54th Regiment.' },
  { id: 'bos-ducklings', name: 'Make Way for Ducklings', latitude: 42.35438, longitude: -71.070467, category: 'Monument', rarity: 'Common', lore: 'Mrs. Mallard and brood bronze in the Public Garden.' },
  { id: 'bos-holocaust-memorial', name: 'New England Holocaust Memorial', latitude: 42.352992, longitude: -71.059449, category: 'Monument', rarity: 'Rare', lore: 'Six glass towers on the Freedom Trail path.' },
  { id: 'bos-massacre-site', name: 'Boston Massacre Site', latitude: 42.358717, longitude: -71.05714, category: 'Monument', rarity: 'Uncommon', lore: '1770 clash outside the Old State House.' },
  { id: 'bos-zakim-bridge', name: 'Leonard P. Zakim Bridge', latitude: 42.368314, longitude: -71.062813, category: 'Monument', rarity: 'Uncommon', lore: 'Cable-stay span over the Charles on I-93.' },

  { id: 'bos-freedom-trail', name: 'Freedom Trail', latitude: 42.355983, longitude: -71.065574, category: 'Trail', rarity: 'Epic', lore: '2.5-mile red-brick path through Revolutionary Boston.' },
  { id: 'bos-harborwalk', name: 'Harborwalk at Long Wharf', latitude: 42.360267, longitude: -71.050412, category: 'Trail', rarity: 'Common', lore: 'Waterfront promenade with ferry and skyline views.' },
  { id: 'bos-charles-path', name: 'Charles River Reservation', latitude: 42.361278, longitude: -71.082302, category: 'Trail', rarity: 'Uncommon', lore: 'Paved paths for tempo miles along the Charles.' },
  { id: 'bos-emerald-necklace', name: 'Emerald Necklace', latitude: 42.334521, longitude: -71.112876, category: 'Trail', rarity: 'Rare', lore: "Olmsted's linked park chain through Boston." },
  { id: 'bos-copps-hill', name: "Copp's Hill Burying Ground", latitude: 42.367892, longitude: -71.056254, category: 'Historic', rarity: 'Uncommon', lore: 'North End hill cemetery overlooking the harbor.' },

  { id: 'bos-bpl', name: 'Boston Public Library', latitude: 42.349328, longitude: -71.07762, category: 'Library', rarity: 'Rare', lore: 'McKim Renaissance courtyard and Bates Hall reading room.' },
  { id: 'bos-copley', name: 'Copley Square', latitude: 42.349944, longitude: -71.076089, category: 'Historic', rarity: 'Uncommon', lore: 'Heart of Back Bay between library and Trinity.' },
  { id: 'bos-prudential', name: 'Prudential Tower', latitude: 42.347086, longitude: -71.082321, category: 'Historic', rarity: 'Common', lore: 'Skyline views from the Back Bay landmark.' },
  { id: 'bos-newbury', name: 'Newbury Street', latitude: 42.351489, longitude: -71.076512, category: 'Historic', rarity: 'Common', lore: 'Brownstone boutiques from Arlington to Mass Ave.' },
  { id: 'bos-harvard-yard', name: 'Harvard Yard', latitude: 42.374443, longitude: -71.116943, category: 'Historic', rarity: 'Epic', lore: 'Red-brick heart of Harvard in Cambridge.' },
  { id: 'bos-mit-dome', name: 'MIT Great Dome', latitude: 42.358281, longitude: -71.091623, category: 'Historic', rarity: 'Rare', lore: 'Neoclassical dome on the Cambridge campus.' },
  { id: 'bos-rowes-wharf', name: "Rowes Wharf", latitude: 42.356719, longitude: -71.050312, category: 'Historic', rarity: 'Common', lore: 'Harbor hotel arch and ferry departures.' },
  { id: 'bos-longfellow-bridge', name: 'Longfellow Bridge', latitude: 42.36135, longitude: -71.074019, category: 'Historic', rarity: 'Uncommon', lore: 'Salt-and-pepper towers linking Boston and Cambridge.' },
  { id: 'bos-boston-opera', name: 'Boston Opera House', latitude: 42.351515, longitude: -71.065, category: 'Historic', rarity: 'Uncommon', lore: 'Restored 1928 theater on Washington Street.' },
  { id: 'bos-frog-pond', name: 'Boston Common Frog Pond', latitude: 42.356565, longitude: -71.065742, category: 'Park', rarity: 'Common', lore: 'Skating rink and splash pool on the Common.' },
];

export const BOSTON_LANDMARK_CATALOG: Landmark[] = BOSTON_LANDMARK_RAW.filter(
  (lm) => lm.category !== 'School'
);

export const BOSTON_LANDMARK_GOAL = BOSTON_LANDMARK_CATALOG.length;
