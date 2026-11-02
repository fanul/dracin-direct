/**
 * Launch-grade Tier A verification state model.
 * This module defines the contract for provider launch eligibility
 * independent of the broader provider lifecycle.
 */

export enum LaunchVerificationStatus {
  VERIFIED = 'verified',
  BLOCKED = 'blocked',
  EXPERIMENTAL = 'experimental',
}

export interface ProviderLaunchReadiness {
  status: LaunchVerificationStatus;
  playbackReady: boolean;
  displayReady: boolean;
}

/**
 * Determines if a provider is eligible for Tier A launch.
 * A provider is launch-eligible only if:
 * - Status is VERIFIED (not blocked or experimental)
 * - playbackReady is true (playback endpoint resolves and is web-compatible)
 * - displayReady is true (metadata quality is acceptable for display)
 */
export function isTierALaunchEligible(readiness: ProviderLaunchReadiness): boolean {
  return (
    readiness.status === LaunchVerificationStatus.VERIFIED &&
    readiness.playbackReady === true &&
    readiness.displayReady === true
  );
}

/**
 * Required intents for Tier A (Full Streamable) providers.
 * These providers must support home, search, detail, episodes, and playback.
 */
export const REQUIRED_INTENTS_FOR_TIER_A = [
  'home',
  'search',
  'detail',
  'episodes',
  'playback',
] as const;

/**
 * Required intents for Tier B (Browseable) providers.
 * These providers support browsing but may not have stable playback.
 */
export const REQUIRED_INTENTS_FOR_TIER_B = ['home', 'detail'] as const;

export type TierAIntent = (typeof REQUIRED_INTENTS_FOR_TIER_A)[number];
export type TierBIntent = (typeof REQUIRED_INTENTS_FOR_TIER_B)[number];