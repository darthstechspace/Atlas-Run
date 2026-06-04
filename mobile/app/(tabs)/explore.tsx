import { ScrollView, View, Text, StyleSheet, Image } from 'react-native';
import { useGame } from '../../src/GameContext';
import { GameCard } from '../../src/components/UI';
import { theme } from '../../src/theme';
import { CITY_REGIONS, cityExploredPercent } from '../../src/v3/data';
import {
  collectedCountForRegion,
  getAtlasLandmarkGoal,
  goalForRegion,
  landmarksForRegion,
  type AtlasRegionId,
} from '../../src/data/landmarkCatalog';
import { RARITY_COLORS } from '../../src/types';

const BOSTON_ICON = require('../../assets/city-icons/boston-icon.png');
const WORCESTER_SEAL = require('../../assets/city-icons/worcester-seal.png');
const SPRINGFIELD_SEAL = require('../../assets/city-icons/springfield-seal.png');
const SALEM_ICON = require('../../assets/city-icons/salem-icon.png');

function CityRegionIcon({ regionId }: { regionId: AtlasRegionId }) {
  if (regionId === 'boston') {
    return <Image source={BOSTON_ICON} style={styles.cityIcon} accessibilityLabel="Boston city seal" />;
  }
  if (regionId === 'worcester') {
    return <Image source={WORCESTER_SEAL} style={styles.cityIcon} accessibilityLabel="Worcester seal" />;
  }
  if (regionId === 'springfield') {
    return <Image source={SPRINGFIELD_SEAL} style={styles.cityIcon} accessibilityLabel="Springfield seal" />;
  }
  if (regionId === 'salem') {
    return <Image source={SALEM_ICON} style={styles.cityIcon} accessibilityLabel="Salem city seal" />;
  }
  return null;
}

export default function ExploreScreen() {
  const { state } = useGame();
  const collected = new Set(state.collectedLandmarks?.map((c) => c.landmarkId) ?? []);
  const collectedCount = collected.size;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>Massachusetts</Text>
        <Text style={styles.sub}>
          Boston, Worcester, Salem, and Springfield collection books. Walk near pins on the map to discover landmarks.
        </Text>
        <Text style={styles.sub}>
          {collectedCount}/{getAtlasLandmarkGoal()} found | {state.unlockedAreas.length} zones cleared
        </Text>

        {CITY_REGIONS.map((region) => {
          const regionId = region.id as AtlasRegionId;
          const pct = cityExploredPercent(state.unlockedAreas, region.id);
          const found = collectedCountForRegion(regionId, state.landmarks, collected);
          const goal = goalForRegion(regionId);
          return (
            <GameCard key={region.id} style={styles.cityCard}>
              <View style={styles.cityRow}>
                <CityRegionIcon regionId={regionId} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.cityName}>{region.name}</Text>
                  <Text style={styles.cityMeta}>
                    {found}/{goal} landmarks | {pct}% fog cleared
                  </Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${pct}%` }]} />
                  </View>
                </View>
                <Text style={styles.cityPct}>{pct}%</Text>
              </View>
            </GameCard>
          );
        })}

        {CITY_REGIONS.map((region) => {
          const regionId = region.id as AtlasRegionId;
          const regionLandmarks = landmarksForRegion(regionId, state.landmarks);
          const found = collectedCountForRegion(regionId, state.landmarks, collected);
          const goal = goalForRegion(regionId);

          return (
            <View key={`section-${region.id}`}>
              <Text style={styles.section}>{region.name} Landmarks</Text>
              <Text style={styles.collectionSub}>
                {found}/{goal} found
              </Text>

              {regionLandmarks.map((lm) => {
                const owned = collected.has(lm.id);
                return (
                  <GameCard key={lm.id} style={[styles.lmCard, !owned && styles.lmLocked]}>
                    <View style={styles.lmRow}>
                      <Text style={styles.lmIcon}>{owned ? '📍' : '❓'}</Text>
                      <View style={styles.lmBody}>
                        <Text style={styles.lmName}>{owned ? lm.name : 'Undiscovered'}</Text>
                        <Text style={[styles.lmMeta, { color: RARITY_COLORS[lm.rarity] }]}>
                          {lm.category} | {lm.rarity}
                        </Text>
                        {lm.discoverCondition && !owned && (
                          <Text style={styles.condition}>Requires: {lm.discoverCondition}</Text>
                        )}
                        {owned && <Text style={styles.lore}>{lm.lore}</Text>}
                      </View>
                    </View>
                  </GameCard>
                );
              })}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.backgroundDark },
  scroll: { padding: 16, paddingBottom: 40 },
  heading: { color: '#fff', fontSize: 22, fontWeight: '800' },
  sub: { color: theme.textSecondary, fontSize: 13, marginBottom: 14 },
  section: { color: '#fff', fontWeight: '800', fontSize: 16, marginTop: 16, marginBottom: 10 },
  collectionSub: { color: theme.textMuted, fontSize: 12, marginBottom: 10, marginTop: -4 },
  cityCard: { marginBottom: 8 },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cityIcon: { width: 32, height: 32, borderRadius: 16 },
  cityName: { color: '#fff', fontWeight: '700', marginBottom: 2 },
  cityMeta: { color: theme.textMuted, fontSize: 11, marginBottom: 6 },
  cityPct: { color: theme.accentGold, fontWeight: '800', fontSize: 18 },
  barTrack: { height: 8, backgroundColor: '#ffffff18', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: theme.accentGold, borderRadius: 4 },
  lmCard: { marginBottom: 8 },
  lmLocked: { opacity: 0.55 },
  lmRow: { flexDirection: 'row', alignItems: 'flex-start' },
  lmIcon: { fontSize: 28, width: 36 },
  lmBody: { flex: 1 },
  lmName: { color: '#fff', fontWeight: '700' },
  lmMeta: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  condition: { color: theme.accentPurple, fontSize: 10, marginTop: 4 },
  lore: { color: theme.textSecondary, fontSize: 11, marginTop: 6, fontStyle: 'italic' },
});
