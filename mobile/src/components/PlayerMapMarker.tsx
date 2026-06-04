import { memo, useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, Platform } from 'react-native';
import { Marker } from 'react-native-maps';
import { theme } from '../theme';
import type { CosmeticItem, EquippedCosmetics } from '../types';
import { emojiFor, trailColor, equippedVisualKey } from '../cosmetics';
import { CosmeticIcon } from './CosmeticIcon';

type Props = {
  latitude: number;
  longitude: number;
  equipped: EquippedCosmetics;
  cosmetics: CosmeticItem[];
  shopItems: CosmeticItem[];
  isRunning?: boolean;
  profilePhotoUri?: string;
};

function PlayerMapMarkerInner({
  latitude,
  longitude,
  equipped,
  cosmetics,
  shopItems,
  isRunning,
  profilePhotoUri,
}: Props) {
  const avatarEmoji = emojiFor(equipped.compass, cosmetics, shopItems, '🧭');
  const hat = equipped.hat ? emojiFor(equipped.hat, cosmetics, shopItems, '') : null;
  const shoes = equipped.shoes ? emojiFor(equipped.shoes, cosmetics, shopItems, '') : null;
  const pet = equipped.pet ? emojiFor(equipped.pet, cosmetics, shopItems, '') : null;
  const torchId = equipped.torch;
  const torchEmoji = torchId ? emojiFor(torchId, cosmetics, shopItems, '') : '';
  const ringColor = trailColor(equipped.trailEffect, cosmetics, shopItems);
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  useEffect(() => {
    setTracksViewChanges(true);
    const timer = setTimeout(() => setTracksViewChanges(false), 2000);
    return () => clearTimeout(timer);
  }, [latitude, longitude, equippedVisualKey(equipped, profilePhotoUri), isRunning]);

  return (
    <Marker
      coordinate={{ latitude, longitude }}
      anchor={{ x: 0.5, y: 1 }}
      zIndex={999}
      tracksViewChanges={tracksViewChanges}
    >
      <View style={styles.wrap} collapsable={false} renderToHardwareTextureAndroid>
        <View style={styles.body}>
          {hat ? <Text style={styles.hat}>{hat}</Text> : null}
          <View
            style={[
              styles.ring,
              { borderColor: isRunning ? ringColor : ringColor + 'AA' },
              isRunning && styles.ringRunning,
            ]}
          >
            {torchId ? (
              <View style={styles.torch}>
                <CosmeticIcon itemId={torchId} emoji={torchEmoji} size={14} />
              </View>
            ) : null}
            <View style={styles.avatarClip}>
              {profilePhotoUri ? (
                <Image source={{ uri: profilePhotoUri }} style={styles.photo} />
              ) : (
                <Text style={styles.avatarEmoji}>{avatarEmoji}</Text>
              )}
            </View>
            {pet ? (
              <View style={styles.pet}>
                <Text style={styles.petEmoji}>{pet}</Text>
              </View>
            ) : null}
          </View>
          {shoes ? <Text style={styles.shoes}>{shoes}</Text> : null}
        </View>
        <View style={styles.pin} />
      </View>
    </Marker>
  );
}

export const PlayerMapMarker = memo(PlayerMapMarkerInner);

const AVATAR = 48;

const pinShadow = Platform.select({
  android: { elevation: 10 },
  ios: {
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  default: {},
});

const glowShadow = Platform.select({
  android: { elevation: 12 },
  ios: {
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  default: {},
});

const torchGlow = Platform.select({
  android: { elevation: 10 },
  ios: {
    shadowColor: '#ff8844',
    shadowOpacity: 0.45,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  default: {},
});

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    width: 72,
    overflow: 'visible',
    ...(Platform.OS === 'android' ? { elevation: 16 } : pinShadow),
  },
  body: {
    alignItems: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  ring: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    borderWidth: 3,
    backgroundColor: 'rgba(12,16,32,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  ringRunning: {
    shadowColor: theme.accentGold,
    shadowOpacity: 0.55,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  avatarClip: {
    width: AVATAR - 6,
    height: AVATAR - 6,
    borderRadius: (AVATAR - 6) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photo: { width: AVATAR - 6, height: AVATAR - 6, borderRadius: (AVATAR - 6) / 2 },
  avatarEmoji: { fontSize: 24 },
  torch: {
    position: 'absolute',
    left: -8,
    bottom: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(12,16,32,0.98)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ffaa4488',
    zIndex: 9,
    ...torchGlow,
  },
  hat: {
    fontSize: 16,
    lineHeight: 18,
    marginBottom: -8,
    zIndex: 2,
  },
  shoes: {
    fontSize: 12,
    lineHeight: 14,
    marginTop: -6,
    marginBottom: 2,
    zIndex: 2,
  },
  pet: {
    position: 'absolute',
    right: -6,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(12,16,32,0.98)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.accentGold,
    zIndex: 10,
    ...glowShadow,
  },
  petEmoji: { fontSize: 12, lineHeight: 14 },
  pin: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: theme.accentGold,
  },
});
