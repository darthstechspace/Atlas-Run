import type { ImageSourcePropType } from 'react-native';

/** Custom shop icons (emoji used as fallback elsewhere). */
export const SHOP_ITEM_ICONS: Partial<Record<string, ImageSourcePropType>> = {
  '56': require('../../assets/shop/lantern.png'),
};

export function getShopItemIcon(id: string): ImageSourcePropType | undefined {
  return SHOP_ITEM_ICONS[id];
}
