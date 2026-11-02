/**
 * Launch Cache Policy
 *
 * Provides DB/cache-first policy helpers for Tier A launch readiness.
 * Enforces caching strategies that minimize upstream requests to captain.sapimu.au
 * while maintaining acceptable data freshness for launch surfaces.
 */

import { TIER_A_PROVIDERS } from './tier-a-matrix';

/**
 * Cache TTL configuration for launch mode
 */
export interface LaunchCacheTTL {
  /** Home page cache TTL in seconds */
  homeTTL: number;
  /** Stale home cache fallback TTL in seconds */
  homeStaleTTL: number;
  /** Provider detail page cache TTL in seconds */
  providerDetailTTL: number;
  /** Episodes cache TTL in seconds */
  episodesTTL: number;
}

/**
 * Upstream fetch policy configuration
 */
export interface UpstreamPolicy {
  /** Cooldown period between upstream fetches in milliseconds */
  upstreamCooldownMs: number;
  /** Maximum retry attempts for upstream fetches */
  maxUpstreamRetries: number;
  /** Maximum number of providers to fan-out to */
  maxProviderFanOut: number;
  /** Whether to allow non-Tier A providers in responses */
  allowNonTierA: boolean;
}

/**
 * Combined launch cache policy
 */
export interface LaunchCachePolicy extends LaunchCacheTTL, UpstreamPolicy {}

/**
 * Configuration for launch cache policy
 */
export interface LaunchCachePolicyConfig {
  /** Whether launch mode is enabled */
  launchModeEnabled: boolean;
  /** Whether to restrict to Tier A providers only */
  tierAProvidersOnly?: boolean;
  /** Custom TTL overrides */
  overrides?: Partial<LaunchCacheTTL>;
}

/**
 * Input for shouldUseCachedHomeData decision
 */
export interface ShouldUseCachedHomeDataInput {
  /** Whether cache has a hit */
  cacheHit: boolean;
  /** Timestamp of cached data (epoch ms) */
  cacheTimestamp?: number;
  /** Whether launch mode is enabled */
  launchModeEnabled: boolean;
  /** Whether to allow stale fallback */
  allowStaleFallback?: boolean;
}

/**
 * Result of cache decision
 */
export interface CacheDecisionResult {
  /** Whether to use cached data */
  useCache: boolean;
  /** Reason for the decision */
  reason: string;
  /** Whether to trigger background revalidation */
  shouldRevalidate?: boolean;
}

/**
 * Input for shouldSkipUpstreamFetch decision
 */
export interface ShouldSkipUpstreamFetchInput {
  /** Whether DB has data */
  dbHit: boolean;
  /** Timestamp of DB data (epoch ms) */
  dbTimestamp?: number;
  /** Provider being accessed */
  providerSlug: string;
  /** Whether launch mode is enabled */
  launchModeEnabled: boolean;
  /** Whether strict launch mode is enabled (no upstream fallbacks) */
  strictLaunchMode?: boolean;
  /** Type of endpoint being accessed */
  endpointType?: 'home' | 'detail' | 'episodes' | 'playback';
  /** Timestamp of last upstream fetch (epoch ms) */
  lastUpstreamFetch?: number;
}

/**
 * Result of upstream skip decision
 */
export interface UpstreamSkipResult {
  /** Whether to skip upstream fetch */
  skipUpstream: boolean;
  /** Reason for the decision */
  reason: string;
}

/** Default TTLs for launch mode (conservative for free-tier) */
const LAUNCH_MODE_TTLS: LaunchCacheTTL = {
  homeTTL: 15 * 60, // 15 minutes
  homeStaleTTL: 60 * 60, // 1 hour
  providerDetailTTL: 10 * 60, // 10 minutes
  episodesTTL: 5 * 60, // 5 minutes
};

/** Default TTLs for non-launch mode (more aggressive refresh) */
const DEFAULT_TTLS: LaunchCacheTTL = {
  homeTTL: 5 * 60, // 5 minutes
  homeStaleTTL: 15 * 60, // 15 minutes
  providerDetailTTL: 5 * 60, // 5 minutes
  episodesTTL: 3 * 60, // 3 minutes
};

/** Default upstream policy for launch mode */
const LAUNCH_UPSTREAM_POLICY: UpstreamPolicy = {
  upstreamCooldownMs: 60_000, // 1 minute
  maxUpstreamRetries: 2,
  maxProviderFanOut: 8, // Tier A only
  allowNonTierA: false,
};

/** Default upstream policy for non-launch mode */
const DEFAULT_UPSTREAM_POLICY: UpstreamPolicy = {
  upstreamCooldownMs: 30_000, // 30 seconds
  maxUpstreamRetries: 3,
  maxProviderFanOut: 41, // All providers
  allowNonTierA: true,
};

/** Upstream cooldown period for episodes endpoint */
const EPISODES_UPSTREAM_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

/** DB freshness threshold (how old DB data can be before considered stale) */
const DB_FRESHNESS_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour

/**
 * Determines whether to use cached home data based on cache state and launch mode.
 */
export function shouldUseCachedHomeData(
  input: ShouldUseCachedHomeDataInput
): CacheDecisionResult {
  const { cacheHit, cacheTimestamp, launchModeEnabled, allowStaleFallback } = input;

  if (!cacheHit) {
    return { useCache: false, reason: 'cache_miss' };
  }

  const now = Date.now();
  const ttl = launchModeEnabled ? LAUNCH_MODE_TTLS.homeTTL : DEFAULT_TTLS.homeTTL;
  const staleTtl = launchModeEnabled ? LAUNCH_MODE_TTLS.homeStaleTTL : DEFAULT_TTLS.homeStaleTTL;

  if (cacheTimestamp) {
    const ageMs = now - cacheTimestamp;
    const ageSeconds = ageMs / 1000;

    // Fresh cache within TTL
    if (ageSeconds < ttl) {
      return { useCache: true, reason: 'cache_fresh' };
    }

    // Stale but within stale TTL and fallback allowed
    if (ageSeconds < staleTtl && allowStaleFallback) {
      return { useCache: true, reason: 'stale_fallback', shouldRevalidate: true };
    }

    // Cache is stale
    return { useCache: false, reason: 'cache_stale' };
  }

  // Cache hit but no timestamp - assume fresh
  return { useCache: true, reason: 'cache_fresh' };
}

/**
 * Determines whether to skip upstream fetch based on DB state and launch mode.
 */
export function shouldSkipUpstreamFetch(
  input: ShouldSkipUpstreamFetchInput
): UpstreamSkipResult {
  const {
    dbHit,
    dbTimestamp,
    providerSlug,
    launchModeEnabled,
    strictLaunchMode,
    endpointType,
    lastUpstreamFetch,
  } = input;

  // Check if provider is Tier A
  const isTierA = TIER_A_PROVIDERS.includes(providerSlug);

  // Strict launch mode for Tier A providers - always use DB
  if (strictLaunchMode && launchModeEnabled && isTierA && dbHit) {
    return { skipUpstream: true, reason: 'strict_launch_tier_a' };
  }

  // Check upstream cooldown for episodes
  if (endpointType === 'episodes' && lastUpstreamFetch) {
    const timeSinceLastFetch = Date.now() - lastUpstreamFetch;
    if (timeSinceLastFetch < EPISODES_UPSTREAM_COOLDOWN_MS) {
      return { skipUpstream: true, reason: 'upstream_cooldown' };
    }
  }

  if (!dbHit) {
    return { skipUpstream: false, reason: 'db_miss' };
  }

  if (dbTimestamp) {
    const ageMs = Date.now() - dbTimestamp;

    // DB data is fresh
    if (ageMs < DB_FRESHNESS_THRESHOLD_MS) {
      return { skipUpstream: true, reason: 'db_fresh' };
    }

    // DB data is stale
    return { skipUpstream: false, reason: 'db_stale' };
  }

  // DB hit but no timestamp - assume fresh
  return { skipUpstream: true, reason: 'db_fresh' };
}

/**
 * Gets the launch cache policy configuration.
 */
export function getLaunchCachePolicy(config: LaunchCachePolicyConfig): LaunchCachePolicy {
  const { launchModeEnabled, tierAProvidersOnly, overrides } = config;

  const baseTTLs = launchModeEnabled ? LAUNCH_MODE_TTLS : DEFAULT_TTLS;
  const baseUpstream = launchModeEnabled ? LAUNCH_UPSTREAM_POLICY : DEFAULT_UPSTREAM_POLICY;

  // Apply TTL overrides
  const ttls: LaunchCacheTTL = {
    ...baseTTLs,
    ...overrides,
  };

  // Adjust upstream policy based on tier A restriction
  const upstream: UpstreamPolicy = {
    ...baseUpstream,
    maxProviderFanOut: tierAProvidersOnly || (launchModeEnabled && !config.tierAProvidersOnly)
      ? TIER_A_PROVIDERS.length
      : baseUpstream.maxProviderFanOut,
    allowNonTierA: launchModeEnabled ? (tierAProvidersOnly === false) : true,
  };

  return {
    ...ttls,
    ...upstream,
  };
}