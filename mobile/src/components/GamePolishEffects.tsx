import { useEffect, useRef } from 'react';
import { useGame } from '../GameContext';
import { BadgeUnlockModal } from './UI';
import { hapticBadgeUnlock, hapticChestOpen, hapticLandmarkFound } from '../platform/haptics';

/** Global haptics + badge unlock modal (any tab). */
export function GamePolishEffects() {
  const { state, dismissBadgeUnlock } = useGame();
  const badge = state.badgeUnlockQueue?.[0];
  const prevReward = useRef(false);
  const prevLandmark = useRef(false);
  const prevBadge = useRef(false);

  useEffect(() => {
    if (state.showRewardPopup && !prevReward.current) void hapticChestOpen();
    prevReward.current = state.showRewardPopup;
  }, [state.showRewardPopup]);

  useEffect(() => {
    if (state.showLandmarkDiscoveryPopup && !prevLandmark.current) void hapticLandmarkFound();
    prevLandmark.current = state.showLandmarkDiscoveryPopup;
  }, [state.showLandmarkDiscoveryPopup]);

  useEffect(() => {
    const showing = state.showBadgeUnlockModal && !!badge;
    if (showing && !prevBadge.current) void hapticBadgeUnlock();
    prevBadge.current = showing;
  }, [state.showBadgeUnlockModal, badge?.id]);

  return (
    <BadgeUnlockModal
      badge={badge}
      visible={state.showBadgeUnlockModal && !!badge}
      queueCount={state.badgeUnlockQueue?.length ?? 0}
      onDismiss={dismissBadgeUnlock}
    />
  );
}
