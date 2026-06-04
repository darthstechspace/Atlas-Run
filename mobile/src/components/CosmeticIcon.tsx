import { Image, Text, StyleSheet } from 'react-native';
import { getShopItemIcon } from '../shop/itemIcons';

type Props = {
  itemId: string;
  emoji: string;
  size?: number;
};

export function CosmeticIcon({ itemId, emoji, size = 36 }: Props) {
  const source = getShopItemIcon(itemId);
  if (source) {
    return <Image source={source} style={[styles.image, { width: size, height: size }]} resizeMode="contain" />;
  }
  return <Text style={[styles.emoji, { fontSize: size, lineHeight: size + 2 }]}>{emoji}</Text>;
}

const styles = StyleSheet.create({
  image: { alignSelf: 'center' },
  emoji: { textAlign: 'center' },
});
