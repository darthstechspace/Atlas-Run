import { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { useGame } from '../../src/GameContext';
import { GameCard, Toast } from '../../src/components/UI';
import { theme } from '../../src/theme';
import { RARITY_COLORS, type CosmeticCategory } from '../../src/types';
import { PET_BUFFS } from '../../src/petBuffs';
import { gearBuffLabel } from '../../src/gearBuffs';
import { CosmeticIcon } from '../../src/components/CosmeticIcon';

const CATEGORIES: (CosmeticCategory | 'All')[] = [
  'All',
  'Hat',
  'Shoes',
  'Flashlight',
  'Compass',
  'Backpack',
  'Banner',
  'Trail Effect',
  'Pet',
];

export default function ShopScreen() {
  const { state, shopItems, purchaseItem, equip, isEquipped } = useGame();
  const [category, setCategory] = useState<CosmeticCategory | 'All'>('All');

  const filtered = category === 'All' ? shopItems : shopItems.filter((i) => i.category === category);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <GameCard style={styles.balance}>
          <View style={{ flex: 1 }}>
            <Text style={styles.balanceLabel}>Your Balance</Text>
            <Text style={styles.balanceGems}>💎 {state.gems}</Text>
            <Text style={styles.earnHint}>Earn gems from landmarks, quests, chests, and runs.</Text>
          </View>
        </GameCard>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
          {CATEGORIES.map((c) => (
            <Pressable key={c} style={[styles.chip, category === c && styles.chipActive]} onPress={() => setCategory(c)}>
              <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.grid}>
          {filtered.map((item) => {
            const owned = state.cosmetics.some((c) => c.id === item.id);
            const afford = state.gems >= item.gemPrice;
            return (
              <GameCard key={item.id} style={[styles.item, { borderColor: RARITY_COLORS[item.rarity] + '60', borderWidth: 1 }]}>
                <CosmeticIcon itemId={item.id} emoji={item.emoji} size={40} />
                <Text style={styles.itemName}>{item.name}</Text>
                {gearBuffLabel(item.category, item.id) ? (
                  <Text style={styles.petBuff}>{gearBuffLabel(item.category, item.id)}</Text>
                ) : item.category === 'Pet' && PET_BUFFS[item.id] ? (
                  <Text style={styles.petBuff}>{PET_BUFFS[item.id].label}</Text>
                ) : null}
                <Text style={{ color: RARITY_COLORS[item.rarity], fontSize: 10, fontWeight: '700', textAlign: 'center' }}>{item.rarity}</Text>
                {owned ? (
                  isEquipped(item) ? (
                    <Text style={styles.owned}>Equipped</Text>
                  ) : (
                    <Pressable onPress={() => equip(item)}>
                      <Text style={styles.equipLink}>Equip</Text>
                    </Pressable>
                  )
                ) : (
                  <>
                    <Text style={[styles.price, !afford && { color: '#ff6666' }]}>💎 {item.gemPrice}</Text>
                    <Pressable style={[styles.buyBtn, !afford && { backgroundColor: '#555' }]} onPress={() => purchaseItem(item.id)} disabled={!afford}>
                      <Text style={styles.buyText}>Buy</Text>
                    </Pressable>
                  </>
                )}
              </GameCard>
            );
          })}
        </View>
      </ScrollView>
      <Toast message={state.toastMessage} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.backgroundDark },
  scroll: { padding: 16, paddingBottom: 40 },
  balance: { marginBottom: 16, borderColor: theme.accentGold + '50', borderWidth: 1 },
  balanceLabel: { color: theme.textMuted, fontSize: 12 },
  balanceGems: { color: theme.accentGold, fontSize: 26, fontWeight: '800' },
  earnHint: { color: theme.textSecondary, fontSize: 12, marginTop: 6, lineHeight: 17 },
  chips: { marginBottom: 16, maxHeight: 40 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: theme.accentBlue + '60', marginRight: 8 },
  chipActive: { backgroundColor: theme.accentGold },
  chipText: { color: theme.accentBlue, fontWeight: '700', fontSize: 12 },
  chipTextActive: { color: '#000' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  item: { width: '47%', alignItems: 'center', gap: 6, padding: 12 },
  itemName: { color: '#fff', fontWeight: '700', fontSize: 12, textAlign: 'center' },
  petBuff: { color: theme.accentGreen, fontSize: 9, textAlign: 'center', marginTop: 2 },
  owned: { color: theme.accentGreen, fontWeight: '700' },
  equipLink: { color: theme.accentGold, fontWeight: '700' },
  price: { color: theme.accentGold, fontWeight: '800' },
  buyBtn: { backgroundColor: theme.accentGold, paddingHorizontal: 20, paddingVertical: 6, borderRadius: 999 },
  buyText: { fontWeight: '800', color: '#000' },
});
