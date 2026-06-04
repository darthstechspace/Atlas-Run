import * as Location from 'expo-location';
import { distanceMeters } from '../geo';

export type GpsPoint = { latitude: number; longitude: number; timestamp: number };

export type RunSession = {
  startedAt: number;
  points: GpsPoint[];
  distanceMiles: number;
  subscription: Location.LocationSubscription | null;
};

const METERS_PER_MILE = 1609.344;
const MIN_SEGMENT_METERS = 3;
const MAX_SPEED_MPS = 12;

/** Module-level guard: only one GPS watch may be active for runs. */
let activeSubscription: Location.LocationSubscription | null = null;
let activeSessionId = 0;

export function createRunSession(): RunSession {
  return { startedAt: Date.now(), points: [], distanceMiles: 0, subscription: null };
}

export function appendGpsPoint(session: RunSession, lat: number, lng: number): RunSession {
  const point: GpsPoint = { latitude: lat, longitude: lng, timestamp: Date.now() };
  const prev = session.points[session.points.length - 1];
  if (!prev) {
    return { ...session, points: [point] };
  }

  const segMeters = distanceMeters(prev, point);
  if (segMeters < MIN_SEGMENT_METERS) return session;

  const dtSec = (point.timestamp - prev.timestamp) / 1000;
  if (dtSec > 0 && segMeters / dtSec > MAX_SPEED_MPS) return session;

  return {
    ...session,
    points: [...session.points, point],
    distanceMiles: session.distanceMiles + segMeters / METERS_PER_MILE,
  };
}

/** Stop any in-flight run GPS watch (safe to call multiple times). */
export function stopActiveGpsWatch(): void {
  activeSubscription?.remove();
  activeSubscription = null;
}

/** Invalidate callbacks from older run sessions. */
export function invalidateRunSession(): number {
  stopActiveGpsWatch();
  activeSessionId += 1;
  return activeSessionId;
}

export function currentRunSessionId(): number {
  return activeSessionId;
}

export async function startGpsWatch(
  session: RunSession,
  sessionId: number,
  onPoint: (session: RunSession) => void
): Promise<RunSession> {
  stopActiveGpsWatch();

  let current = session;

  const sub = await Location.watchPositionAsync(
    { accuracy: Location.Accuracy.High, distanceInterval: 5, timeInterval: 2000 },
    (update) => {
      if (sessionId !== activeSessionId) return;
      current = appendGpsPoint(current, update.coords.latitude, update.coords.longitude);
      onPoint(current);
    }
  );

  if (sessionId !== activeSessionId) {
    sub.remove();
    return session;
  }

  activeSubscription = sub;
  return { ...current, subscription: sub };
}

export function stopGpsWatch(session: RunSession): RunSession {
  if (session.subscription) {
    session.subscription.remove();
    if (activeSubscription === session.subscription) {
      activeSubscription = null;
    }
  } else {
    stopActiveGpsWatch();
  }
  return { ...session, subscription: null };
}

export function sessionDurationSec(session: RunSession): number {
  return Math.max(1, Math.floor((Date.now() - session.startedAt) / 1000));
}
