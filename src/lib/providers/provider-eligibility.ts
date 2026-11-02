import type { ProviderHealthStatus } from '@/lib/types';

export type ProviderLifecycleState =
  | 'candidate'
  | 'verified'
  | 'active'
  | 'degraded'
  | 'maintenance'
  | 'disabled'
  | 'removed';

export type SupportTier = 'Tier A' | 'Tier B' | 'Tier C';

export interface ProviderHealthInfo {
  lifecycleState: ProviderLifecycleState;
  healthScore: number;
}

export interface ShouldGateInput extends ProviderHealthInfo {
  allowDegraded?: boolean;
}

export interface GateResult {
  gate: boolean;
  reason: string;
  restrictions?: string[];
}

export interface ProviderCapabilities {
  supportsHome?: boolean;
  supportsSearch?: boolean;
  supportsPlayback?: boolean;
  supportsDetail?: boolean;
  supportsEpisodes?: boolean;
}

export interface GetEligibilityInput extends ProviderHealthInfo {
  slug: string;
  supportTier: SupportTier;
  capabilities: ProviderCapabilities;
}

export interface ProviderEligibilityResult {
  eligible: boolean;
  tier: SupportTier;
  allowedIntents: string[];
  restrictions?: string[];
}

export interface GetIntentEligibilityInput extends ProviderHealthInfo {
  slug: string;
  intent: string;
  supportsIntent: boolean;
  browseOnlyMode?: boolean;
}

export interface IntentEligibilityResult {
  allowed: boolean;
  reason?: string;
}

const HEALTH_THRESHOLDS = {
  fullAccess: 70,
  browseOnly: 50,
  critical: 30,
};

const INTENT_HEALTH_THRESHOLDS: Record<string, number> = {
  home: 40,
  search: 40,
  detail: 40,
  episodes: 50,
  playback: 70,
  subtitle: 50,
};

const NON_GATED_STATES = new Set(['active', 'verified']);
const RESTRICTED_STATES = new Set(['degraded']);
const ALWAYS_GATED_STATES = new Set(['disabled', 'removed', 'maintenance', 'candidate']);

export function shouldGateProvider(input: ShouldGateInput): GateResult {
  const { lifecycleState, healthScore, allowDegraded } = input;

  if (ALWAYS_GATED_STATES.has(lifecycleState)) {
    const reasonMap: Record<string, string> = {
      candidate: 'provider_not_verified',
      disabled: 'provider_disabled',
      removed: 'provider_removed',
      maintenance: 'provider_maintenance',
    };
    return {
      gate: true,
      reason: reasonMap[lifecycleState] || `provider_${lifecycleState}`,
    };
  }

  if (lifecycleState === 'degraded') {
    if (healthScore < HEALTH_THRESHOLDS.critical) {
      return {
        gate: true,
        reason: 'health_score_critical',
      };
    }

    if (healthScore >= HEALTH_THRESHOLDS.browseOnly) {
      return {
        gate: false,
        reason: 'eligible_with_restrictions',
        restrictions: ['browse_only', 'degraded'],
      };
    }

    return {
      gate: true,
      reason: 'health_score_low_for_degraded',
    };
  }

  if (NON_GATED_STATES.has(lifecycleState)) {
    if (healthScore < HEALTH_THRESHOLDS.critical) {
      return {
        gate: true,
        reason: 'health_score_critical',
      };
    }

    return {
      gate: false,
      reason: 'eligible',
    };
  }

  return {
    gate: true,
    reason: 'unknown_state',
  };
}

export function getProviderEligibility(input: GetEligibilityInput): ProviderEligibilityResult {
  const { slug, lifecycleState, supportTier, healthScore, capabilities } = input;

  const gateResult = shouldGateProvider({
    lifecycleState,
    healthScore,
    allowDegraded: supportTier !== 'Tier A',
  });

  if (gateResult.gate) {
    return {
      eligible: false,
      tier: supportTier,
      allowedIntents: [],
      restrictions: ['blocked'],
    };
  }

  const allowedIntents: string[] = [];
  const restrictions: string[] = gateResult.restrictions || [];

  if (capabilities.supportsHome && healthScore >= INTENT_HEALTH_THRESHOLDS.home) {
    allowedIntents.push('home');
  }

  if (capabilities.supportsSearch && healthScore >= INTENT_HEALTH_THRESHOLDS.search) {
    allowedIntents.push('search');
  }

  if (capabilities.supportsDetail && healthScore >= INTENT_HEALTH_THRESHOLDS.detail) {
    allowedIntents.push('detail');
  }

  if (capabilities.supportsEpisodes && healthScore >= INTENT_HEALTH_THRESHOLDS.episodes) {
    allowedIntents.push('episodes');
  }

  const playbackThreshold = supportTier === 'Tier A'
    ? INTENT_HEALTH_THRESHOLDS.playback
    : HEALTH_THRESHOLDS.fullAccess;

  if (capabilities.supportsPlayback && healthScore >= playbackThreshold) {
    if (!restrictions.includes('browse_only')) {
      allowedIntents.push('playback');
    }
  }

  return {
    eligible: allowedIntents.length > 0,
    tier: supportTier,
    allowedIntents,
    restrictions: restrictions.length > 0 ? restrictions : undefined,
  };
}

export function getEligibilityForIntent(input: GetIntentEligibilityInput): IntentEligibilityResult {
  const { slug, intent, lifecycleState, healthScore, supportsIntent, browseOnlyMode } = input;

  if (ALWAYS_GATED_STATES.has(lifecycleState)) {
    return {
      allowed: false,
      reason: `provider_${lifecycleState}`,
    };
  }

  if (!supportsIntent) {
    return {
      allowed: false,
      reason: 'intent_not_supported',
    };
  }

  const threshold = INTENT_HEALTH_THRESHOLDS[intent] || HEALTH_THRESHOLDS.fullAccess;

  if (intent === 'playback' && browseOnlyMode) {
    return {
      allowed: false,
      reason: 'browse_only_mode',
    };
  }

  if (lifecycleState === 'degraded' && intent === 'playback') {
    return {
      allowed: false,
      reason: 'degraded_playback_not_allowed',
    };
  }

  if (healthScore < threshold) {
    return {
      allowed: false,
      reason: `health_score_below_${intent}_threshold`,
    };
  }
  if (lifecycleState === 'degraded' && intent === 'playback' && healthScore < HEALTH_THRESHOLDS.fullAccess) {
    return {
      allowed: false,
      reason: 'degraded_playback_not_allowed',
    };
  }

  return { allowed: true };
}