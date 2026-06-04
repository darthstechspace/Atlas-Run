import { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ScrollView, ActivityIndicator, Platform, Alert } from 'react-native';
import MapView, { Circle, Marker, PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useGame } from '../../src/GameContext';
import { GameCard, GlowButton, XPBar, Toast, RewardModal, LandmarkFoundModal } from '../../src/components/UI';
import { MapFogLayer } from '../../src/components/MapFogLayer';
import { PlayerMapMarker } from '../../src/components/PlayerMapMarker';
import { ChestMarker, LandmarkPin } from '../../src/components/MapIcons';
import { useFogRegion } from '../../src/hooks/useFogRegion';
import { roundCoordForFog } from '../../src/mapFog';
import { theme } from '../../src/theme';
import { useDeviceLocation } from '../../src/hooks/useDeviceLocation';
import { resolveMapLocation } from '../../src/geo/location';
import { getMapCustomStyle, useCloudMapStyleForTheme } from '../../src/mapStyle';
import { isGoogleMapsConfigured, getAtlasGoogleMapId, usesAtlasCloudMapStyle } from '../../src/config/env';
import { useMapTheme } from '../../src/hooks/useMapTheme';
import { CHEST_RARITY_COLORS, type GhostRun, type TreasureChest } from '../../src/types';
import { distanceMeters, getExploreRadiusMeters, isLandmarkVisible } from '../../src/gameState';
import { getAtlasLandmarkGoal } from '../../src/data/landmarkCatalog';
import { playSafetyMessage } from '../../src/safety/playSafety';

const STREET_DELTA = 0.012;

function regionFor(lat: number, lng: number, delta = STREET_DELTA): Region {
  return { latitude: lat, longitude: lng, latitudeDelta: delta, longitudeDelta: delta };
}

export default function MapScreen() {
  const {
    state,
    isReady,
    xpProgress,
    startRun,
    startGhostRun,
    endRun,
    openChest,
    dismissLandmarkDiscovery,
    dismissReward,
    syncGps,
    shopItems,
    refreshLandmarks,
    playSafetyLevel,
  } = useGame();

  const mapRef = useRef<MapView>(null);
  const [selectedChest, setSelectedChest] = useState<TreasureChest | null>(null);
  const [showGhost, setShowGhost] = useState(false);
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  const mapReadyRef = useRef(false);
  const lastMapCenterRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const zoomDeltaRef = useRef(STREET_DELTA);
  const { fogRegion, onRegionChange, onRegionChangeComplete: onFogRegionComplete, syncFogRegion } =
    useFogRegion(null);

  const { location: gpsLocation, error: locationError, retry: retryLocation } =
    useDeviceLocation();
  const { mapTheme } = useMapTheme();

  const savedLocation = resolveMapLocation(state.userLocation);
  const playerPos = gpsLocation ?? savedLocation;

  const centerMapOnPlayer = useCallback((pos: { latitude: number; longitude: number }, animated = false) => {
    const next = regionFor(pos.latitude, pos.longitude, zoomDeltaRef.current);
    lastMapCenterRef.current = { latitude: pos.latitude, longitude: pos.longitude };
    setMapRegion(next);
    syncFogRegion(next);
    if (mapReadyRef.current) {
      mapRef.current?.animateToRegion(next, animated ? 450 : 0);
    }
  }, [syncFogRegion]);

  const lastSyncedRef = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!playerPos) return;
    const { latitude, longitude } = playerPos;
    const last = lastSyncedRef.current;
    if (last && last.lat === latitude && last.lng === longitude) return;
    lastSyncedRef.current = { lat: latitude, lng: longitude };
    syncGps(latitude, longitude);
    refreshLandmarks(latitude, longitude);
  }, [playerPos?.latitude, playerPos?.longitude, syncGps, refreshLandmarks]);

  useEffect(() => {
    if (!playerPos) return;
    const prev = lastMapCenterRef.current;
    if (!prev) {
      centerMapOnPlayer(playerPos, false);
      return;
    }
    const moved = distanceMeters(prev, playerPos);
    if (moved > 250) {
      centerMapOnPlayer(playerPos, true);
    }
  }, [playerPos?.latitude, playerPos?.longitude, centerMapOnPlayer]);

  const centerOnUser = useCallback(() => {
    if (!playerPos) {
      void retryLocation();
      return;
    }
    const next = regionFor(playerPos.latitude, playerPos.longitude, zoomDeltaRef.current);
    mapRef.current?.animateToRegion(next, 500);
    setMapRegion(next);
    syncFogRegion(next);
    lastMapCenterRef.current = { latitude: playerPos.latitude, longitude: playerPos.longitude };
  }, [playerPos, retryLocation, syncFogRegion]);

  if (!isReady) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.accentGold} />
        <Text style={styles.muted}>Loading your adventure…</Text>
      </View>
    );
  }

  if (!playerPos || !mapRegion) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.accentGold} />
        <Text style={styles.muted}>{locationError ?? 'Finding your location…'}</Text>
        <Pressable style={styles.retryBtn} onPress={() => void retryLocation()}>
          <Text style={styles.retryText}>Retry GPS</Text>
        </Pressable>
      </View>
    );
  }

  const collectedIds = new Set(state.collectedLandmarks.map((c) => c.landmarkId));
  const nearbyLandmarks = state.landmarks.filter(
    (lm) =>
      isLandmarkVisible(lm, state.level) &&
      distanceMeters(playerPos, { latitude: lm.latitude, longitude: lm.longitude }) <= 2500
  );

  const chestDist = selectedChest
    ? distanceMeters(playerPos, { latitude: selectedChest.latitude, longitude: selectedChest.longitude })
    : 0;
  const canOpenChest = selectedChest && chestDist <= 50;

  const exploreRadius = getExploreRadiusMeters(state);
  const fogLiveCenter = roundCoordForFog(playerPos.latitude, playerPos.longitude);
  const googleMapsEnabled = isGoogleMapsConfigured();
  const googleMapId = getAtlasGoogleMapId();
  const cloudCapable = googleMapsEnabled && usesAtlasCloudMapStyle();
  const useCloudMapStyle = useCloudMapStyleForTheme(mapTheme, cloudCapable);
  const safetyMessage = state.playSafetyAlertsEnabled ? playSafetyMessage(playSafetyLevel) : null;

  function handleStartRun() {
    if (playSafetyLevel === 'drive') {
      Alert.alert(
        'Too fast to start',
        "Don't play while driving. Stop safely before starting a run.",
        [{ text: 'OK' }]
      );
      return;
    }
    void startRun();
  }

  function handleStartGhostRun(run: GhostRun) {
    if (playSafetyLevel === 'drive') {
      Alert.alert(
        'Too fast to start',
        "Don't play while driving. Stop safely before starting a run.",
        [{ text: 'OK' }]
      );
      return;
    }
    setShowGhost(false);
    void startGhostRun(run);
  }

  return (
    <View style={styles.container}>
      <MapView
        key={`atlas-map-${mapTheme}-${useCloudMapStyle ? googleMapId : 'local'}`}
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={googleMapsEnabled ? PROVIDER_GOOGLE : undefined}
        mapType="standard"
        googleMapId={useCloudMapStyle ? googleMapId : undefined}
        googleRenderer={Platform.OS === 'android' ? 'LATEST' : undefined}
        customMapStyle={getMapCustomStyle(mapTheme, useCloudMapStyle)}
        showsPointsOfInterest={false}
        poiClickEnabled={false}
        initialRegion={mapRegion}
        onMapReady={() => {
          mapReadyRef.current = true;
          if (__DEV__) {
            console.log(`[AtlasRun] Map theme: ${mapTheme}${useCloudMapStyle ? ` | cloud ${googleMapId}` : ''} (${Platform.OS})`);
          }
          if (playerPos) {
            const next = regionFor(playerPos.latitude, playerPos.longitude, zoomDeltaRef.current);
            mapRef.current?.animateToRegion(next, 0);
          }
        }}
        onRegionChange={onRegionChange}
        onRegionChangeComplete={(region) => {
          if (region) {
            zoomDeltaRef.current = region.latitudeDelta;
            setMapRegion(region);
            onFogRegionComplete(region);
          }
        }}
        showsMyLocationButton={false}
      >
        {fogRegion ? (
          <MapFogLayer
            region={fogRegion}
            unlockedAreas={state.unlockedAreas}
            liveCenter={fogLiveCenter}
            liveRadiusMeters={exploreRadius}
            mapTheme={mapTheme}
          />
        ) : null}

        {nearbyLandmarks.map((lm) => (
          <Marker
            key={`lm-${lm.id}`}
            coordinate={{ latitude: lm.latitude, longitude: lm.longitude }}
            zIndex={20}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <LandmarkPin category={lm.category} collected={collectedIds.has(lm.id)} />
          </Marker>
        ))}

        {state.treasureChests.map((chest) => {
          const nearby =
            distanceMeters(playerPos, { latitude: chest.latitude, longitude: chest.longitude }) <= 50;
          return (
            <Marker
              key={chest.id}
              coordinate={{ latitude: chest.latitude, longitude: chest.longitude }}
              onPress={() => setSelectedChest(chest)}
              zIndex={35}
            >
              <ChestMarker rarity={chest.rarity} isNearby={nearby} />
            </Marker>
          );
        })}

        <Circle
          center={playerPos}
          radius={exploreRadius}
          fillColor={theme.accentBlue + '08'}
          strokeColor={theme.accentBlue + '66'}
          strokeWidth={1.5}
          zIndex={25}
        />
        <PlayerMapMarker
          latitude={playerPos.latitude}
          longitude={playerPos.longitude}
          equipped={state.equipped}
          cosmetics={state.cosmetics}
          shopItems={shopItems}
          isRunning={state.isRunning}
          profilePhotoUri={state.profilePhotoUri}
        />
      </MapView>

      {locationError && !gpsLocation ? (
        <View style={styles.gpsBanner}>
          <Text style={styles.gpsBannerText}>{locationError}</Text>
          <Pressable onPress={() => void retryLocation()}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      {!googleMapsEnabled ? (
        <View style={styles.mapKeyBanner}>
          <Text style={styles.mapKeyText}>
            Add EXPO_PUBLIC_GOOGLE_MAPS_API_KEY to mobile/.env, enable Maps SDK for iOS + Android in Google Cloud, then rebuild
            the app (EAS iOS/Android). Expo Go on iPhone uses Apple Maps only. Landmarks still work offline.
          </Text>
        </View>
      ) : null}

      {safetyMessage ? (
        <View
          style={[
            styles.safetyBanner,
            playSafetyLevel === 'drive' ? styles.safetyBannerDrive : styles.safetyBannerWarn,
            (!isGoogleMapsConfigured() || (locationError && !gpsLocation)) && styles.safetyBannerOffset,
          ]}
        >
          <Ionicons
            name={playSafetyLevel === 'drive' ? 'car' : 'warning'}
            size={16}
            color={playSafetyLevel === 'drive' ? '#ff6666' : theme.accentPurple}
          />
          <Text style={styles.safetyBannerText}>{safetyMessage}</Text>
        </View>
      ) : null}

      <View style={[styles.hud, (!isGoogleMapsConfigured() || safetyMessage) && styles.hudBelowBanner]}>
        <GameCard style={styles.hudRow}>
          <View style={styles.hudStat}>
            <Ionicons name="flame" size={16} color="#ff8844" />
            <Text style={styles.streak}>{state.streakDays}</Text>
          </View>
          <View style={styles.hudStat}>
            <Ionicons name="diamond" size={16} color={theme.accentGold} />
            <Text style={styles.gems}>{state.gems}</Text>
          </View>
          <View style={styles.hudXp}>
            <XPBar progress={xpProgress} level={state.level} />
          </View>
        </GameCard>
        <Text style={styles.coordsHint}>
          Landmarks {collectedIds.size}/{getAtlasLandmarkGoal()} | Chests {state.openedChests}
        </Text>
      </View>

      <Pressable style={styles.recenterBtn} onPress={centerOnUser} accessibilityLabel="Center on me">
        <Ionicons name="locate" size={22} color={theme.accentGold} />
      </Pressable>

      {state.isRunning && (
        <View style={styles.runningBadge}>
          <Ionicons name="fitness" size={14} color="#ff4444" />
          <Text style={styles.runningText}> RUNNING {state.isGhostRunActive ? ' GHOST' : ''}</Text>
        </View>
      )}

      <View style={styles.controls}>
        <GameCard>
          {state.isRunning ? (
            <View style={styles.runRow}>
              <View>
                <Text style={styles.miles}>{state.runDistanceMiles.toFixed(2)} mi</Text>
                {state.ghostRunTarget && (
                  <Text style={styles.ghostTarget}>vs {state.ghostRunTarget.routeName}</Text>
                )}
                {playSafetyLevel !== 'ok' && state.playSafetyAlertsEnabled ? (
                  <Text style={styles.runSafetyHint}>High speed: distance may not count</Text>
                ) : null}
              </View>
              <GlowButton label="End Run" onPress={endRun} color="#cc4444" />
            </View>
          ) : (
            <View style={styles.btnRow}>
              <Pressable style={styles.secondaryBtn} onPress={() => setShowGhost(true)}>
                <Ionicons name="skull-outline" size={18} color={theme.accentPurple} />
                <Text style={styles.secondaryText}>Ghost Run</Text>
              </Pressable>
              <GlowButton label="Start Run" onPress={handleStartRun} />
            </View>
          )}
        </GameCard>
      </View>

      {selectedChest && (
        <Modal transparent animationType="slide">
          <Pressable style={styles.modalBg} onPress={() => setSelectedChest(null)}>
            <Pressable onPress={(e) => e.stopPropagation()}>
              <GameCard style={styles.chestPopup}>
                <View style={{ alignItems: 'center' }}>
                  <ChestMarker rarity={selectedChest.rarity} isNearby={canOpenChest ?? false} />
                </View>
                <Text style={styles.chestTitle}>{selectedChest.rarity} Chest</Text>
                <Text style={{ color: CHEST_RARITY_COLORS[selectedChest.rarity], fontWeight: '700', textAlign: 'center' }}>
                  Tap to loot XP, gems & cosmetics
                </Text>
                {chestDist > 50 ? (
                  <Text style={styles.hint}>{Math.round(chestDist)}m away. Walk closer!</Text>
                ) : (
                  <Text style={[styles.hint, { color: theme.accentGreen }]}>You're close enough!</Text>
                )}
                <View style={styles.btnRow}>
                  <Pressable style={styles.secondaryBtn} onPress={() => setSelectedChest(null)}>
                    <Text style={styles.secondaryText}>Close</Text>
                  </Pressable>
                  <GlowButton
                    label="Open Chest"
                    disabled={!canOpenChest}
                    onPress={() => {
                      openChest(selectedChest.id);
                      setSelectedChest(null);
                    }}
                  />
                </View>
              </GameCard>
            </Pressable>
          </Pressable>
        </Modal>
      )}

      <Modal visible={showGhost} transparent animationType="fade">
        <View style={styles.modalBg}>
          <GameCard>
            <Text style={styles.chestTitle}>Ghost Run</Text>
            <Text style={styles.hint}>Race a previous run!</Text>
            <ScrollView style={{ maxHeight: 240 }}>
              {state.ghostRuns.map((run: GhostRun) => (
                <Pressable
                  key={run.id}
                  style={styles.ghostItem}
                  onPress={() => handleStartGhostRun(run)}
                >
                  <Text style={{ color: '#fff', fontWeight: '700' }}>{run.routeName}</Text>
                  <Text style={styles.hint}>
                    {run.distanceMiles.toFixed(1)} mi | {run.xpEarned} XP
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <GlowButton label="Cancel" onPress={() => setShowGhost(false)} color={theme.accentPurple} />
          </GameCard>
        </View>
      </Modal>

      <RewardModal reward={state.lastReward} visible={state.showRewardPopup} onDismiss={dismissReward} />
      <LandmarkFoundModal
        discovery={state.pendingLandmarkDiscovery}
        visible={state.showLandmarkDiscoveryPopup}
        onDismiss={dismissLandmarkDiscovery}
      />
      <Toast message={state.toastMessage} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.backgroundDark },
  centered: { justifyContent: 'center', alignItems: 'center', gap: 12, padding: 24 },
  muted: { color: theme.textSecondary, textAlign: 'center' },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.accentGold,
  },
  retryText: { color: theme.accentGold, fontWeight: '700' },
  gpsBanner: {
    position: 'absolute',
    top: 48,
    left: 12,
    right: 12,
    backgroundColor: '#3a1010ee',
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 20,
  },
  gpsBannerText: { color: '#ffaaaa', flex: 1, fontSize: 12, marginRight: 8 },
  mapKeyBanner: {
    position: 'absolute',
    top: 48,
    left: 12,
    right: 12,
    backgroundColor: '#1a1a3eee',
    borderRadius: 10,
    padding: 10,
    zIndex: 20,
    borderWidth: 1,
    borderColor: theme.accentBlue + '66',
  },
  mapKeyText: { color: theme.textSecondary, fontSize: 11, lineHeight: 16 },
  safetyBanner: {
    position: 'absolute',
    top: 48,
    left: 12,
    right: 12,
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 20,
    borderWidth: 1,
  },
  safetyBannerWarn: {
    backgroundColor: theme.accentPurple + '22',
    borderColor: theme.accentPurple + '88',
  },
  safetyBannerDrive: {
    backgroundColor: '#3a1010ee',
    borderColor: '#ff666688',
  },
  safetyBannerOffset: { top: 96 },
  safetyBannerText: { color: '#fff', flex: 1, fontSize: 12, fontWeight: '600' },
  hud: { position: 'absolute', top: 36, left: 12, right: 12, zIndex: 5 },
  hudBelowBanner: { top: 104 },
  hudRow: { flexDirection: 'row', alignItems: 'center', gap: 10, overflow: 'hidden' },
  hudStat: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 0 },
  hudXp: { flex: 1, minWidth: 0 },
  streak: { color: '#fff', fontWeight: '700' },
  gems: { color: theme.accentGold, fontWeight: '800', fontSize: 16 },
  coordsHint: { color: theme.textMuted, fontSize: 9, textAlign: 'center', marginTop: 4 },
  recenterBtn: {
    position: 'absolute',
    right: 16,
    top: 116,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.cardBackground,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 15,
  },
  runningBadge: {
    position: 'absolute',
    top: 104,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000aa',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    zIndex: 5,
  },
  runningText: { color: '#ff4444', fontWeight: '800', fontSize: 12 },
  controls: { position: 'absolute', bottom: 20, left: 12, right: 12, zIndex: 5 },
  runRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  btnRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'center' },
  miles: { color: '#fff', fontSize: 22, fontWeight: '800' },
  ghostTarget: { color: theme.accentPurple, fontSize: 12 },
  runSafetyHint: { color: '#ff8844', fontSize: 10, marginTop: 4, fontWeight: '600' },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: theme.accentBlue + '99',
  },
  secondaryText: { color: theme.accentBlue, fontWeight: '700' },
  modalBg: { flex: 1, backgroundColor: '#000000aa', justifyContent: 'center', padding: 20 },
  chestPopup: { gap: 10 },
  chestTitle: { color: '#fff', fontSize: 20, fontWeight: '800', textAlign: 'center' },
  hint: { color: theme.textSecondary, textAlign: 'center' },
  ghostItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: theme.cardBorder + '40' },
});
