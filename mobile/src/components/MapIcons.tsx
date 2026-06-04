import { View, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme';
import { RARITY_COLORS, CHEST_RARITY_COLORS, type LandmarkRarity, type ChestRarity } from '../types';

/** Built-in vector icons; no image files required */

export function ChestMarker({ rarity, isNearby }: { rarity: LandmarkRarity | ChestRarity; isNearby?: boolean }) {
  const color = (CHEST_RARITY_COLORS as Record<string, string>)[rarity] ?? RARITY_COLORS[rarity as LandmarkRarity] ?? '#888';
  return (
    <View style={[styles.chest, { borderColor: color, transform: [{ scale: isNearby ? 1.15 : 1 }] }]}>
      <MaterialCommunityIcons name="treasure-chest" size={26} color={color} />
    </View>
  );
}

export function LandmarkPin({ category, collected }: { category: string; collected?: boolean }) {
  return (
    <View style={[styles.landmarkPin, collected && styles.landmarkCollected]}>
      <Ionicons name="location" size={22} color={collected ? theme.accentGreen : theme.accentBlue} />
    </View>
  );
}

export function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const color = focused ? theme.accentGold : theme.textMuted;
  const size = 24;
  switch (name) {
    case 'map':
      return <Ionicons name={focused ? 'map' : 'map-outline'} size={size} color={color} />;
    case 'quests':
      return <Ionicons name={focused ? 'document-text' : 'document-text-outline'} size={size} color={color} />;
    case 'profile':
      return <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />;
    case 'friends':
      return <Ionicons name={focused ? 'people' : 'people-outline'} size={size} color={color} />;
    case 'shop':
      return <Ionicons name={focused ? 'bag' : 'bag-outline'} size={size} color={color} />;
    case 'explore':
      return <Ionicons name={focused ? 'compass' : 'compass-outline'} size={size} color={color} />;
    default:
      return <Ionicons name="ellipse" size={size} color={color} />;
  }
}

const styles = StyleSheet.create({
  chest: {
    backgroundColor: 'rgba(15, 15, 30, 0.92)',
    borderWidth: 2.5,
    borderRadius: 28,
    padding: 8,
    shadowColor: theme.accentGold,
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 6,
  },
  landmarkPin: {
    backgroundColor: 'rgba(15, 15, 30, 0.9)',
    borderRadius: 999,
    padding: 6,
    borderWidth: 2,
    borderColor: theme.accentBlue + '99',
  },
  landmarkCollected: {
    borderColor: theme.accentGreen + '99',
  },
});
