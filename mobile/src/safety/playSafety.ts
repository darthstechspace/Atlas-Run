export type PlaySafetyLevel = 'ok' | 'warn' | 'drive';

export type GpsSample = {
  latitude: number;
  longitude: number;
  timestamp: number;
};

export const WARN_SPEED_MPS = 8;
export const DRIVE_SPEED_MPS = 11;
export const SUSTAINED_SEC = 5;

function speedMps(from: GpsSample, to: GpsSample): number {
  const dtSec = (to.timestamp - from.timestamp) / 1000;
  if (dtSec <= 0) return 0;
  const latDiff = to.latitude - from.latitude;
  const lngDiff = to.longitude - from.longitude;
  const meters = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111_320;
  return meters / dtSec;
}

export type PlaySafetyState = {
  level: PlaySafetyLevel;
  sustainedWarnSince: number | null;
  sustainedDriveSince: number | null;
};

export function createPlaySafetyState(): PlaySafetyState {
  return { level: 'ok', sustainedWarnSince: null, sustainedDriveSince: null };
}

export function evaluateMovement(
  prev: GpsSample | null,
  next: GpsSample,
  state: PlaySafetyState
): PlaySafetyState {
  if (!prev) {
    return { level: 'ok', sustainedWarnSince: null, sustainedDriveSince: null };
  }

  const speed = speedMps(prev, next);
  const now = next.timestamp;

  if (speed >= DRIVE_SPEED_MPS) {
    const driveSince = state.sustainedDriveSince ?? now;
    if (now - driveSince >= SUSTAINED_SEC * 1000) {
      return { level: 'drive', sustainedWarnSince: null, sustainedDriveSince: driveSince };
    }
    return { level: 'ok', sustainedWarnSince: null, sustainedDriveSince: driveSince };
  }

  if (speed >= WARN_SPEED_MPS) {
    const warnSince = state.sustainedWarnSince ?? now;
    if (now - warnSince >= SUSTAINED_SEC * 1000) {
      return { level: 'warn', sustainedWarnSince: warnSince, sustainedDriveSince: null };
    }
    return { level: 'ok', sustainedWarnSince: warnSince, sustainedDriveSince: null };
  }

  return { level: 'ok', sustainedWarnSince: null, sustainedDriveSince: null };
}

export function playSafetyMessage(level: PlaySafetyLevel): string | null {
  switch (level) {
    case 'warn':
      return 'Slow down. Stay aware of your surroundings.';
    case 'drive':
      return "Don't play while driving. Stop and end your run.";
    default:
      return null;
  }
}
