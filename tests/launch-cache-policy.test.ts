import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  shouldUseCachedHomeData,
  shouldSkipUpstreamFetch,
  getLaunchCachePolicy,
  type LaunchCachePolicyConfig,
} from '../src/lib/providers/launch-cache-policy';

describe('launch cache policy', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('shouldUseCachedHomeData', () => {
    it('returns true when cache is fresh within TTL', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const result = shouldUseCachedHomeData({
        cacheHit: true,
        cacheTimestamp: now - 5 * 60 * 1000, // 5 minutes ago (within 15min TTL)
        launchModeEnabled: true,
      });

      expect(result.useCache).toBe(true);
      expect(result.reason).toBe('cache_fresh');
    });

    it('returns false when cache is stale beyond TTL', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const result = shouldUseCachedHomeData({
        cacheHit: true,
        cacheTimestamp: now - 30 * 60 * 1000, // 30 minutes ago (beyond 15min TTL)
        launchModeEnabled: true,
      });

      expect(result.useCache).toBe(false);
      expect(result.reason).toBe('cache_stale');
    });

    it('returns true for stale cache in launch mode with stale-while-revalidate', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const result = shouldUseCachedHomeData({
        cacheHit: true,
        cacheTimestamp: now - 30 * 60 * 1000, // 30 minutes ago (stale)
        launchModeEnabled: true,
        allowStaleFallback: true,
      });

      expect(result.useCache).toBe(true);
      expect(result.reason).toBe('stale_fallback');
      expect(result.shouldRevalidate).toBe(true);
    });

    it('returns false when cache miss', () => {
      const result = shouldUseCachedHomeData({
        cacheHit: false,
        launchModeEnabled: true,
      });

      expect(result.useCache).toBe(false);
      expect(result.reason).toBe('cache_miss');
    });
  });

  describe('shouldSkipUpstreamFetch', () => {
    it('skips upstream fetch when DB data is fresh', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const result = shouldSkipUpstreamFetch({
        dbHit: true,
        dbTimestamp: now - 10 * 60 * 1000, // 10 minutes ago
        providerSlug: 'reelshort',
        launchModeEnabled: true,
      });

      expect(result.skipUpstream).toBe(true);
      expect(result.reason).toBe('db_fresh');
    });

    it('allows upstream fetch when DB data is stale', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const result = shouldSkipUpstreamFetch({
        dbHit: true,
        dbTimestamp: now - 2 * 60 * 60 * 1000, // 2 hours ago (stale)
        providerSlug: 'reelshort',
        launchModeEnabled: true,
      });

      expect(result.skipUpstream).toBe(false);
      expect(result.reason).toBe('db_stale');
    });

    it('allows upstream fetch when DB miss', () => {
      const result = shouldSkipUpstreamFetch({
        dbHit: false,
        providerSlug: 'reelshort',
        launchModeEnabled: true,
      });

      expect(result.skipUpstream).toBe(false);
      expect(result.reason).toBe('db_miss');
    });

    it('forces upstream skip for Tier A providers in strict launch mode', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      // Even with stale DB, strict mode should skip upstream for Tier A
      const result = shouldSkipUpstreamFetch({
        dbHit: true,
        dbTimestamp: now - 2 * 60 * 60 * 1000, // Stale
        providerSlug: 'reelshort', // Tier A provider
        launchModeEnabled: true,
        strictLaunchMode: true,
      });

      expect(result.skipUpstream).toBe(true);
      expect(result.reason).toBe('strict_launch_tier_a');
    });
  });

  describe('getLaunchCachePolicy', () => {
    it('returns default TTLs for launch mode', () => {
      const policy = getLaunchCachePolicy({
        launchModeEnabled: true,
      });

      expect(policy.homeTTL).toBe(15 * 60); // 15 minutes
      expect(policy.homeStaleTTL).toBe(60 * 60); // 1 hour
      expect(policy.providerDetailTTL).toBe(10 * 60); // 10 minutes
      expect(policy.episodesTTL).toBe(5 * 60); // 5 minutes
    });

    it('returns conservative TTLs when launch mode disabled', () => {
      const policy = getLaunchCachePolicy({
        launchModeEnabled: false,
      });

      expect(policy.homeTTL).toBe(5 * 60); // 5 minutes (more aggressive refresh)
      expect(policy.homeStaleTTL).toBe(15 * 60); // 15 minutes
      expect(policy.providerDetailTTL).toBe(5 * 60); // 5 minutes
      expect(policy.episodesTTL).toBe(3 * 60); // 3 minutes
    });

    it('allows custom TTL overrides', () => {
      const policy = getLaunchCachePolicy({
        launchModeEnabled: true,
        overrides: {
          homeTTL: 30 * 60, // Custom 30 minutes
        },
      });

      expect(policy.homeTTL).toBe(30 * 60);
      expect(policy.providerDetailTTL).toBe(10 * 60); // Default
    });

    it('returns upstream cooldown settings for launch mode', () => {
      const policy = getLaunchCachePolicy({
        launchModeEnabled: true,
      });

      expect(policy.upstreamCooldownMs).toBe(60_000); // 1 minute cooldown
      expect(policy.maxUpstreamRetries).toBe(2);
    });
  });

  describe('launch mode provider fan-out', () => {
    it('limits fan-out to Tier A providers only in launch mode', () => {
      const config: LaunchCachePolicyConfig = {
        launchModeEnabled: true,
        tierAProvidersOnly: true,
      };

      const policy = getLaunchCachePolicy(config);

      expect(policy.maxProviderFanOut).toBe(8); // Only Tier A providers
      expect(policy.allowNonTierA).toBe(false);
    });

    it('allows all providers when launch mode disabled', () => {
      const policy = getLaunchCachePolicy({
        launchModeEnabled: false,
      });

      expect(policy.maxProviderFanOut).toBe(41); // All providers
      expect(policy.allowNonTierA).toBe(true);
    });
  });

  describe('episodes cache policy', () => {
    it('prevents aggressive upstream refetch for repeat requests', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      // First request - should allow fallback
      const firstResult = shouldSkipUpstreamFetch({
        dbHit: true,
        dbTimestamp: now - 2 * 60 * 60 * 1000, // Stale
        providerSlug: 'reelshort',
        launchModeEnabled: true,
        endpointType: 'episodes',
        lastUpstreamFetch: now - 30 * 60 * 1000, // 30 min ago
      });

      // Recent upstream fetch - should skip
      const recentResult = shouldSkipUpstreamFetch({
        dbHit: true,
        dbTimestamp: now - 2 * 60 * 60 * 1000, // Stale
        providerSlug: 'reelshort',
        launchModeEnabled: true,
        endpointType: 'episodes',
        lastUpstreamFetch: now - 60 * 1000, // 1 min ago
      });

      expect(firstResult.skipUpstream).toBe(false);
      expect(recentResult.skipUpstream).toBe(true);
      expect(recentResult.reason).toBe('upstream_cooldown');
    });
  });
});