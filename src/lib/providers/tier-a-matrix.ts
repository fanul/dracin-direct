/**
 * Tier A Provider Matrix Verification
 * 
 * Provides logic for verifying provider launch eligibility
 * and generating the verified Tier A provider matrix.
 */

import { LaunchVerificationStatus, isTierALaunchEligible } from './launch-contracts';

export interface ProviderVerificationResult {
  home: boolean;
  search: boolean;
  detail: boolean;
  episodes: boolean;
  playback: boolean;
  displayReady: boolean;
}

export interface TierASummary {
  launchEligible: boolean;
  status: LaunchVerificationStatus;
  reason: string;
  verifiedIntents: string[];
  failedIntents: string[];
}

/**
 * Summarizes verification results for Tier A launch eligibility.
 * 
 * A provider is launch-eligible if:
 * - All critical intents pass (home, search, detail, episodes, playback)
 * - Display quality is acceptable
 */
export function summarizeTierAResult(result: ProviderVerificationResult): TierASummary {
  const requiredIntents: Array<keyof ProviderVerificationResult> = [
    'home',
    'search', 
    'detail',
    'episodes',
    'playback',
  ];

  const verifiedIntents: string[] = [];
  const failedIntents: string[] = [];

  for (const intent of requiredIntents) {
    if (result[intent]) {
      verifiedIntents.push(intent);
    } else {
      failedIntents.push(intent);
    }
  }

  // Determine status
  let status: LaunchVerificationStatus;
  let reason: string;

  if (failedIntents.length === 0 && result.displayReady) {
    status = LaunchVerificationStatus.VERIFIED;
    reason = 'All intents verified';
  } else if (failedIntents.length === requiredIntents.length) {
    status = LaunchVerificationStatus.BLOCKED;
    reason = `All intents failed: ${failedIntents.join(', ')}`;
  } else if (failedIntents.length > 0) {
    status = LaunchVerificationStatus.BLOCKED;
    reason = `Failed intents: ${failedIntents.join(', ')}`;
  } else if (!result.displayReady) {
    status = LaunchVerificationStatus.BLOCKED;
    reason = 'Display quality not ready';
  } else {
    status = LaunchVerificationStatus.EXPERIMENTAL;
    reason = 'Partial verification';
  }

  const launchEligible = isTierALaunchEligible({
    status,
    playbackReady: result.playback,
    displayReady: result.displayReady,
  });

  return {
    launchEligible,
    status,
    reason,
    verifiedIntents,
    failedIntents,
  };
}

/**
 * Tier A provider candidates for verification.
 * These providers are considered for launch based on existing adapter
 * implementations and capability matrix.
 */
export const TIER_A_CANDIDATES = [
  'reelshort',
  'goodshort',
  'flextv',
  'shortmax',
  'netshort',
  'dramanova',
  'dramapops',
  'cashdrama',
] as const;

export type TierACandidate = (typeof TIER_A_CANDIDATES)[number];

/**
 * Alias for TIER_A_CANDIDATES for launch cache policy usage.
 */
export const TIER_A_PROVIDERS: readonly string[] = [...TIER_A_CANDIDATES];
/**
 * Creates a verification matrix for all Tier A candidates.
 */
export function buildTierAMatrix(
  results: Record<string, ProviderVerificationResult>
): Record<string, TierASummary> {
  const matrix: Record<string, TierASummary> = {};

  for (const slug of TIER_A_CANDIDATES) {
    const result = results[slug];
    if (result) {
      matrix[slug] = summarizeTierAResult(result);
    }
  }

  return matrix;
}