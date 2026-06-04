import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';
import {
  createInitialState,
  gameReducer,
  getCategoryLeaderboard,
  finalizeLeaderboard,
  xpRequiredForLevel,
  type GameStateShape,
  SHOP_ITEMS,
} from './gameState';
import type { SkillPath } from './v3/data';
import { loadSavedState, saveGameState } from './storage';
import type { CosmeticItem, GhostRun, LeaderboardEntry } from './types';
import { useAuth } from './providers/AuthProvider';
import { useConnectivity } from './providers/ConnectivityProvider';
import { pullCloudSave, pushCloudSave, uploadAvatar } from './services/sync';
import { uploadRun, incrementWeeklyLandmarks, incrementWeeklyZones } from './services/runs';
import {
  createRunSession,
  startGpsWatch,
  stopGpsWatch,
  stopActiveGpsWatch,
  invalidateRunSession,
  sessionDurationSec,
  type RunSession,
} from './services/GpsRunTracker';
import { mergeCollectedLandmarks } from './lib/collectedLandmarks';
import { fetchNearbyLandmarks, loadCachedLandmarksNear, recordUserLandmark } from './services/landmarks';
import {
  fetchFriends,
  fetchLeaderboard,
  fetchPendingRequests,
  fetchCloudUsername,
  sendFriendRequestByUsername,
  respondFriendRequest,
  type PendingFriendRequest,
} from './services/friends';
import {
  createPlaySafetyState,
  evaluateMovement,
  type GpsSample,
  type PlaySafetyLevel,
} from './safety/playSafety';
import { ensureRunLocationPermissions, locationSettingsHint } from './platform/locationPermission';
import { runBackgroundLocationHint } from './platform/runLocationHint';

interface GameContextValue {
  state: GameStateShape;
  isReady: boolean;
  shopItems: typeof SHOP_ITEMS;
  getLeaderboardByCategory: (cat: string, scope?: 'global' | 'friends') => Promise<LeaderboardEntry[]>;
  pendingFriendRequests: PendingFriendRequest[];
  syncCloud: () => Promise<void>;
  setSkillPath: (path: SkillPath) => void;
  equipTitle: (title: string) => void;
  sendGift: (friendId: string) => void;
  joinGuild: (guildId: string) => void;
  leaveGuild: () => void;
  saveRoute: (name: string, distanceMiles: number) => void;
  xpRequired: number;
  xpProgress: number;
  startRun: () => Promise<void>;
  startGhostRun: (run: GhostRun) => Promise<void>;
  endRun: () => Promise<void>;
  openChest: (id: string) => void;
  claimQuest: (id: string) => void;
  purchaseItem: (id: string) => void;
  purchaseGems: (amount: number) => void;
  equip: (item: CosmeticItem) => void;
  searchAndAddFriend: (username: string) => Promise<{ ok: boolean; error?: string; accepted?: boolean }>;
  acceptFriendRequest: (id: string) => Promise<void>;
  declineFriendRequest: (id: string) => Promise<void>;
  refreshFriends: () => Promise<void>;
  dismissReward: () => void;
  dismissLandmarkDiscovery: () => void;
  dismissBadgeUnlock: () => void;
  toggleSafeMode: () => void;
  togglePlaySafetyAlerts: () => void;
  playSafetyLevel: PlaySafetyLevel;
  setProfilePhoto: (uri: string | undefined) => Promise<void>;
  syncGps: (lat: number, lng: number) => void;
  refreshLandmarks: (lat: number, lng: number) => Promise<void>;
  isEquipped: (item: CosmeticItem) => boolean;
  /** True when signed in but the last cloud push failed (network/server). */
  cloudSyncPaused: boolean;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const { user, isConfigured, session } = useAuth();
  const { isOnline } = useConnectivity();
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState);
  const [isReady, setIsReady] = useState(false);
  const [cloudSyncPaused, setCloudSyncPaused] = useState(false);
  const [pendingFriendRequests, setPendingFriendRequests] = useState<PendingFriendRequest[]>([]);
  const [playSafetyLevel, setPlaySafetyLevel] = useState<PlaySafetyLevel>('ok');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipSave = useRef(true);
  const gpsSynced = useRef(false);
  const runSession = useRef<RunSession | null>(null);
  const activeRunId = useRef(0);
  const lastLandmarkFetch = useRef<{ lat: number; lng: number } | null>(null);
  const syncVersionRef = useRef(1);
  const prevLandmarkCount = useRef(0);
  const landmarkCloudBackfilled = useRef(false);
  const prevZoneCount = useRef(0);
  const lastGpsSample = useRef<GpsSample | null>(null);
  const playSafetyStateRef = useRef(createPlaySafetyState());
  const wasOnlineRef = useRef(isOnline);
  const stateRef = useRef(state);
  stateRef.current = state;

  const applyCloudPushResult = useCallback(
    (result: Awaited<ReturnType<typeof pushCloudSave>>) => {
      if (result.ok) {
        setCloudSyncPaused(false);
        syncVersionRef.current = result.serverVersion;
        dispatch({ type: 'SET_SYNC_VERSION', payload: result.serverVersion });
        return;
      }
      if (result.error !== 'CONFLICT') {
        setCloudSyncPaused(true);
      }
    },
    []
  );

  const updatePlaySafety = useCallback((latitude: number, longitude: number, alertsEnabled: boolean) => {
    const next: GpsSample = { latitude, longitude, timestamp: Date.now() };
    const evaluated = evaluateMovement(lastGpsSample.current, next, playSafetyStateRef.current);
    playSafetyStateRef.current = evaluated;
    lastGpsSample.current = next;
    if (alertsEnabled) {
      setPlaySafetyLevel(evaluated.level);
    } else {
      setPlaySafetyLevel('ok');
    }
  }, []);

  useEffect(() => {
    (async () => {
      const saved = await loadSavedState();
      if (isConfigured && user) {
        const cloud = await pullCloudSave(user.id);
        if (cloud.ok) {
          const collectedLandmarks = mergeCollectedLandmarks(
            cloud.state.collectedLandmarks,
            saved?.collectedLandmarks
          );
          const hydrated = {
            ...cloud.state,
            collectedLandmarks,
            account: user.email
              ? {
                  email: user.email,
                  provider: (user.app_metadata?.provider as 'email' | 'google' | 'apple') ?? 'email',
                  displayName: cloud.state.username,
                  lastSync: Date.now(),
                }
              : cloud.state.account,
          };
          dispatch({ type: 'HYDRATE', payload: hydrated });
          syncVersionRef.current = cloud.serverVersion;
        } else {
          if (saved) dispatch({ type: 'HYDRATE', payload: saved });
        }
      } else {
        if (saved) dispatch({ type: 'HYDRATE', payload: saved });
      }
      skipSave.current = false;
      setIsReady(true);
      if (isConfigured && user) {
        const cloudUsername = await fetchCloudUsername(user.id);
        if (cloudUsername) {
          dispatch({ type: 'SET_USERNAME', payload: cloudUsername });
        }
      }
    })();
  }, [user?.id, isConfigured]);

  useEffect(() => {
    if (!isReady) return;
    prevLandmarkCount.current = state.collectedLandmarks.length;
    prevZoneCount.current = state.unlockedAreas.length;
  }, [isReady, state.collectedLandmarks.length, state.unlockedAreas.length]);

  useEffect(() => {
    if (!isReady || skipSave.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await saveGameState(state);
      syncVersionRef.current = state.syncVersion ?? syncVersionRef.current;
      if (isConfigured && user && isOnline) {
        const result = await pushCloudSave(user.id, state, syncVersionRef.current);
        if (result.ok) {
          applyCloudPushResult(result);
        } else if (result.error === 'CONFLICT') {
          const saved = await loadSavedState();
          const cloud = await pullCloudSave(user.id);
          if (cloud.ok) {
            const collectedLandmarks = mergeCollectedLandmarks(
              cloud.state.collectedLandmarks,
              saved?.collectedLandmarks
            );
            dispatch({ type: 'HYDRATE', payload: { ...cloud.state, collectedLandmarks } });
            syncVersionRef.current = cloud.serverVersion;
            dispatch({ type: 'SET_SYNC_VERSION', payload: cloud.serverVersion });
            dispatch({ type: 'CLEAR_TOAST' });
            setCloudSyncPaused(false);
          }
        } else {
          applyCloudPushResult(result);
        }
      } else if (isConfigured && user && !isOnline) {
        setCloudSyncPaused(true);
      }
    }, 400);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [
    isReady,
    user?.id,
    state.level,
    state.xp,
    state.gems,
    state.totalMiles,
    state.streakDays,
    state.unlockedAreas,
    state.cosmetics,
    state.equipped,
    state.ghostRuns,
    state.quests,
    state.badges,
    state.landmarks,
    state.treasureChests,
    state.openedChests,
    state.userLocation,
    state.safeModeEnabled,
    state.playSafetyAlertsEnabled,
    state.username,
    state.profilePhotoUri,
    state.collectedLandmarks,
    state.skillPath,
    state.guildId,
    state.activityLog,
    state.unlockedTitles,
    state.equippedTitle,
    state.personalRecords,
    state.savedRoutes,
    state.lastDailyResetDate,
    state.lastWeeklyResetDate,
    isConfigured,
    isOnline,
    applyCloudPushResult,
  ]);

  useEffect(() => {
    if (!isReady || !user || !isConfigured) return;
    const cameOnline = !wasOnlineRef.current && isOnline;
    wasOnlineRef.current = isOnline;
    if (!cameOnline) return;
    void (async () => {
      const result = await pushCloudSave(user.id, stateRef.current, syncVersionRef.current);
      applyCloudPushResult(result);
    })();
  }, [isOnline, isReady, user?.id, isConfigured, applyCloudPushResult]);

  useEffect(() => {
    if (!state.toastMessage) return;
    const t = setTimeout(() => dispatch({ type: 'CLEAR_TOAST' }), 2500);
    return () => clearTimeout(t);
  }, [state.toastMessage]);

  useEffect(() => {
    if (!user || !isConfigured) return;

    const refresh = () => void refreshFriendsInternal(user.id);
    refresh();

    const interval = setInterval(refresh, 30000);
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') refresh();
    });

    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [user?.id, isConfigured]);

  useEffect(() => {
    if (!isReady || !user || !isConfigured) return;

    if (!landmarkCloudBackfilled.current) {
      landmarkCloudBackfilled.current = true;
      void Promise.all(
        state.collectedLandmarks.map((c) => recordUserLandmark(user.id, c.landmarkId))
      );
      prevLandmarkCount.current = state.collectedLandmarks.length;
      return;
    }

    if (state.collectedLandmarks.length > prevLandmarkCount.current) {
      void incrementWeeklyLandmarks(user.id);
      const added = state.collectedLandmarks.slice(prevLandmarkCount.current);
      void Promise.all(added.map((c) => recordUserLandmark(user.id, c.landmarkId)));
    }
    prevLandmarkCount.current = state.collectedLandmarks.length;
  }, [isReady, user, isConfigured, state.collectedLandmarks]);

  useEffect(() => {
    if (!isReady || !user || !isConfigured) return;
    const delta = state.unlockedAreas.length - prevZoneCount.current;
    if (delta > 0) void incrementWeeklyZones(user.id, delta);
    prevZoneCount.current = state.unlockedAreas.length;
  }, [isReady, user, isConfigured, state.unlockedAreas.length]);

  async function refreshFriendsInternal(userId: string) {
    const friends = await fetchFriends(userId);
    dispatch({ type: 'SET_FRIENDS', payload: friends });
    const pending = await fetchPendingRequests(userId);
    setPendingFriendRequests(pending);
  }

  const refreshFriends = useCallback(async () => {
    if (user) await refreshFriendsInternal(user.id);
  }, [user?.id]);

  const xpRequired = xpRequiredForLevel(state.level);
  const xpProgress = state.xp / xpRequired;

  const isEquipped = useCallback(
    (item: CosmeticItem) => {
      const m: Record<string, string | undefined> = {
        Hat: state.equipped.hat,
        Shoes: state.equipped.shoes,
        Banner: state.equipped.banner,
        'Trail Effect': state.equipped.trailEffect,
        Pet: state.equipped.pet,
        Flashlight: state.equipped.torch,
        Torch: state.equipped.torch,
        Compass: state.equipped.compass,
        Backpack: state.equipped.backpack,
      };
      return m[item.category] === item.id;
    },
    [state.equipped]
  );

  const syncCloud = useCallback(async () => {
    if (!user || !isConfigured) return;
    if (!isOnline) {
      setCloudSyncPaused(true);
      return;
    }
    const result = await pushCloudSave(user.id, state, syncVersionRef.current);
    if (result.ok) {
      applyCloudPushResult(result);
      dispatch({ type: 'SYNC_CLOUD' });
    } else {
      applyCloudPushResult(result);
    }
  }, [user, state, isConfigured, isOnline, applyCloudPushResult]);

  const getLeaderboardByCategory = useCallback(
    async (cat: string, scope: 'global' | 'friends' = 'global') => {
      let rows: LeaderboardEntry[];
      if (user && isConfigured) {
        const cloud = await fetchLeaderboard(user.id, cat, scope);
        rows = cloud.length ? cloud : getCategoryLeaderboard(state, cat);
      } else {
        rows = getCategoryLeaderboard(state, cat);
      }
      return finalizeLeaderboard(rows, cat, state, user?.id);
    },
    [user, state, isConfigured]
  );

  const teardownRunTracking = useCallback(() => {
    activeRunId.current = invalidateRunSession();
    if (runSession.current) {
      runSession.current = stopGpsWatch(runSession.current);
      runSession.current = null;
    } else {
      stopActiveGpsWatch();
    }
  }, []);

  const beginGpsRun = useCallback(
    async (runId: number) => {
      const session = createRunSession();
      runSession.current = await startGpsWatch(session, runId, (updated) => {
        if (runId !== activeRunId.current) return;
        runSession.current = updated;
        const last = updated.points[updated.points.length - 1];
        if (last) {
          updatePlaySafety(last.latitude, last.longitude, state.playSafetyAlertsEnabled);
          dispatch({
            type: 'RUN_GPS_UPDATE',
            payload: {
              latitude: last.latitude,
              longitude: last.longitude,
              distanceMiles: updated.distanceMiles,
            },
          });
        }
      });
    },
    [state.playSafetyAlertsEnabled, updatePlaySafety]
  );

  const startRun = useCallback(async () => {
    teardownRunTracking();
    const perm = await ensureRunLocationPermissions();
    if (!perm.ok) {
      dispatch({ type: 'SET_TOAST', payload: locationSettingsHint() });
      return;
    }
    if (!perm.background) {
      dispatch({ type: 'SET_TOAST', payload: runBackgroundLocationHint() });
    }
    const runId = activeRunId.current;
    dispatch({ type: 'START_RUN' });
    await beginGpsRun(runId);
  }, [teardownRunTracking, beginGpsRun]);

  const startGhostRun = useCallback(
    async (run: GhostRun) => {
      teardownRunTracking();
      const perm = await ensureRunLocationPermissions();
      if (!perm.ok) {
        dispatch({ type: 'SET_TOAST', payload: locationSettingsHint() });
        return;
      }
      if (!perm.background) {
        dispatch({ type: 'SET_TOAST', payload: runBackgroundLocationHint() });
      }
      const runId = activeRunId.current;
      dispatch({ type: 'START_GHOST_RUN', payload: run });
      await beginGpsRun(runId);
    },
    [teardownRunTracking, beginGpsRun]
  );

  const endRun = useCallback(async () => {
    const runId = activeRunId.current;
    activeRunId.current += 1;
    stopActiveGpsWatch();

    let session = runSession.current;
    if (session) {
      session = stopGpsWatch(session);
      runSession.current = null;
    }
    const distanceMiles = session?.distanceMiles ?? state.runDistanceMiles;
    const durationSec = session ? sessionDurationSec(session) : 0;
    const polyline = session?.points.map((p) => ({ latitude: p.latitude, longitude: p.longitude })) ?? [];

    dispatch({
      type: 'END_RUN',
      payload: { distanceMiles, durationSec, polyline },
    });

    if (user && isConfigured && session && distanceMiles > 0) {
      await uploadRun(user.id, {
        startedAt: new Date(session.startedAt).toISOString(),
        endedAt: new Date().toISOString(),
        distanceMiles,
        durationSec,
        polyline,
        xpEarned: Math.floor(distanceMiles * 50),
      });
    }
  }, [user, state.runDistanceMiles, isConfigured]);

  useEffect(() => () => {
    teardownRunTracking();
  }, [teardownRunTracking]);

  useEffect(() => {
    if (!state.playSafetyAlertsEnabled) {
      setPlaySafetyLevel('ok');
    }
  }, [state.playSafetyAlertsEnabled]);

  const refreshLandmarks = useCallback(
    async (lat: number, lng: number) => {
      const last = lastLandmarkFetch.current;
      if (last) {
        const dLat = Math.abs(last.lat - lat);
        const dLng = Math.abs(last.lng - lng);
        if (dLat < 0.004 && dLng < 0.004) return;
      }
      lastLandmarkFetch.current = { lat, lng };

      if (isConfigured && user) {
        const result = await fetchNearbyLandmarks(lat, lng);
        if (result.ok && result.landmarks.length) {
          dispatch({ type: 'SET_LANDMARKS', payload: result.landmarks });
          return;
        }
        const cached = await loadCachedLandmarksNear(lat, lng);
        if (cached.length) dispatch({ type: 'SET_LANDMARKS', payload: cached });
      }
    },
    [user, isConfigured]
  );

  const openChestWithSync = useCallback(
    (id: string) => {
      dispatch({ type: 'OPEN_CHEST', payload: id });
    },
    []
  );

  const setProfilePhoto = useCallback(
    async (uri: string | undefined) => {
      if (uri && user && isConfigured) {
        const url = await uploadAvatar(user.id, uri);
        dispatch({ type: 'SET_PROFILE_PHOTO', payload: url ?? uri });
      } else {
        dispatch({ type: 'SET_PROFILE_PHOTO', payload: uri });
      }
    },
    [user, isConfigured]
  );

  const searchAndAddFriend = useCallback(
    async (username: string) => {
      if (!user || !isConfigured) return { ok: false, error: 'Sign in required' };
      const result = await sendFriendRequestByUsername(username);
      if (result.ok) await refreshFriendsInternal(user.id);
      return result;
    },
    [user, isConfigured]
  );

  const syncGps = useCallback((latitude: number, longitude: number) => {
    updatePlaySafety(latitude, longitude, state.playSafetyAlertsEnabled);
    if (!gpsSynced.current) {
      gpsSynced.current = true;
      dispatch({ type: 'SYNC_GPS', payload: { latitude, longitude } });
    } else {
      dispatch({ type: 'SET_LOCATION', payload: { latitude, longitude } });
    }
  }, [state.playSafetyAlertsEnabled, updatePlaySafety]);

  const value: GameContextValue = {
    state,
    isReady,
    shopItems: SHOP_ITEMS,
    getLeaderboardByCategory,
    pendingFriendRequests,
    syncCloud,
    setSkillPath: (path) => dispatch({ type: 'SET_SKILL_PATH', payload: path }),
    equipTitle: (title) => dispatch({ type: 'EQUIP_TITLE', payload: title }),
    sendGift: (id) => dispatch({ type: 'SEND_GIFT', payload: id }),
    joinGuild: (guildId) => dispatch({ type: 'JOIN_GUILD', payload: guildId }),
    leaveGuild: () => dispatch({ type: 'LEAVE_GUILD' }),
    saveRoute: (name, distanceMiles) => dispatch({ type: 'SAVE_ROUTE', payload: { name, distanceMiles } }),
    xpRequired,
    xpProgress,
    startRun,
    startGhostRun,
    endRun,
    openChest: openChestWithSync,
    claimQuest: (id) => dispatch({ type: 'CLAIM_QUEST', payload: id }),
    purchaseItem: (id) => dispatch({ type: 'PURCHASE_ITEM', payload: id }),
    purchaseGems: (amount) => dispatch({ type: 'PURCHASE_GEMS', payload: amount }),
    equip: (item) => dispatch({ type: 'EQUIP', payload: item }),
    searchAndAddFriend,
    acceptFriendRequest: async (id) => {
      await respondFriendRequest(id, 'accepted');
      if (user) await refreshFriendsInternal(user.id);
    },
    declineFriendRequest: async (id) => {
      await respondFriendRequest(id, 'declined');
      if (user) await refreshFriendsInternal(user.id);
    },
    refreshFriends,
    dismissReward: () => dispatch({ type: 'DISMISS_REWARD' }),
    dismissLandmarkDiscovery: () => dispatch({ type: 'DISMISS_LANDMARK_DISCOVERY' }),
    dismissBadgeUnlock: () => dispatch({ type: 'DISMISS_BADGE_UNLOCK' }),
    toggleSafeMode: () => dispatch({ type: 'TOGGLE_SAFE_MODE' }),
    togglePlaySafetyAlerts: () => dispatch({ type: 'TOGGLE_PLAY_SAFETY_ALERTS' }),
    playSafetyLevel,
    setProfilePhoto,
    syncGps,
    refreshLandmarks,
    isEquipped,
    cloudSyncPaused,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
