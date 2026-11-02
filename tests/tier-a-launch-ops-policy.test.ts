import { describe, expect, it } from 'vitest';
import {
  getSyncBudgetPolicy,
  shouldIncludeProviderInSync,
  estimateSyncJobCost,
  type SyncBudgetPolicy,
  type SyncJobConfig,
} from '../src/lib/providers/launch-ops-policy';

describe('tier a launch ops policy', () => {
  describe('getSyncBudgetPolicy', () => {
    it('returns conservative limits for free-tier launch mode', () => {
      const policy = getSyncBudgetPolicy({
        launchModeEnabled: true,
        freeTierMode: true,
      });

      expect(policy.maxProvidersPerSync).toBe(8);
      expect(policy.maxConcurrentSyncs).toBe(2);
      expect(policy.syncIntervalMinutes).toBe(60);
      expect(policy.timeoutMs).toBe(25000);
    });

    it('returns relaxed limits for non-launch mode', () => {
      const policy = getSyncBudgetPolicy({
        launchModeEnabled: false,
        freeTierMode: true,
      });

      expect(policy.maxProvidersPerSync).toBe(41);
      expect(policy.maxConcurrentSyncs).toBe(5);
      expect(policy.syncIntervalMinutes).toBe(30);
    });

    it('returns higher limits for paid tier', () => {
      const policy = getSyncBudgetPolicy({
        launchModeEnabled: true,
        freeTierMode: false,
      });

      expect(policy.maxProvidersPerSync).toBe(20);
      expect(policy.maxConcurrentSyncs).toBe(5);
    });

    it('allows custom overrides', () => {
      const policy = getSyncBudgetPolicy({
        launchModeEnabled: true,
        freeTierMode: true,
        overrides: {
          maxProvidersPerSync: 5,
        },
      });

      expect(policy.maxProvidersPerSync).toBe(5);
      expect(policy.timeoutMs).toBe(25000);
    });
  });

  describe('shouldIncludeProviderInSync', () => {
    it('includes Tier A providers in launch mode sync', () => {
      const result = shouldIncludeProviderInSync({
        providerSlug: 'reelshort',
        isTierA: true,
        isVerified: true,
        launchModeEnabled: true,
        tierAOnly: true,
      });

      expect(result.include).toBe(true);
    });

    it('excludes non-Tier A providers in tierAOnly mode', () => {
      const result = shouldIncludeProviderInSync({
        providerSlug: 'unknown',
        isTierA: false,
        isVerified: false,
        launchModeEnabled: true,
        tierAOnly: true,
      });

      expect(result.include).toBe(false);
      expect(result.reason).toContain('not_tier_a');
    });

    it('includes all providers in non-launch mode', () => {
      const result = shouldIncludeProviderInSync({
        providerSlug: 'anyprovider',
        isTierA: false,
        isVerified: false,
        launchModeEnabled: false,
        tierAOnly: false,
      });

      expect(result.include).toBe(true);
    });

    it('excludes blocked providers', () => {
      const result = shouldIncludeProviderInSync({
        providerSlug: 'blocked',
        isTierA: true,
        isVerified: false,
        isBlocked: true,
        launchModeEnabled: true,
        tierAOnly: true,
      });

      expect(result.include).toBe(false);
      expect(result.reason).toContain('blocked');
    });
  });

  describe('estimateSyncJobCost', () => {
    it('estimates cost for sync job within budget', () => {
      const config: SyncJobConfig = {
        providerCount: 8,
        estimatedItemsPerProvider: 100,
        estimatedTimePerProviderMs: 2000,
      };

      const estimate = estimateSyncJobCost(config);

      expect(estimate.totalTimeMs).toBe(16000);
      expect(estimate.estimatedMemoryMB).toBeGreaterThan(0);
      expect(estimate.withinFreeTierLimits).toBe(true);
    });

    it('flags jobs exceeding free tier limits', () => {
      const config: SyncJobConfig = {
        providerCount: 41,
        estimatedItemsPerProvider: 500,
        estimatedTimePerProviderMs: 5000,
      };

      const estimate = estimateSyncJobCost(config);

      expect(estimate.withinFreeTierLimits).toBe(false);
      expect(estimate.limitWarnings).toContain('execution_time_exceeded');
    });

    it('calculates memory estimate based on items', () => {
      const smallConfig: SyncJobConfig = {
        providerCount: 5,
        estimatedItemsPerProvider: 50,
        estimatedTimePerProviderMs: 1000,
      };

      const largeConfig: SyncJobConfig = {
        providerCount: 5,
        estimatedItemsPerProvider: 500,
        estimatedTimePerProviderMs: 1000,
      };

      const smallEstimate = estimateSyncJobCost(smallConfig);
      const largeEstimate = estimateSyncJobCost(largeConfig);

      expect(largeEstimate.estimatedMemoryMB).toBeGreaterThan(smallEstimate.estimatedMemoryMB);
    });
  });

  describe('vercel limits awareness', () => {
    it('respects function timeout limits', () => {
      const policy = getSyncBudgetPolicy({
        launchModeEnabled: true,
        freeTierMode: true,
      });

      expect(policy.timeoutMs).toBeLessThanOrEqual(30000);
    });

    it('respects memory limits for free tier', () => {
      const config: SyncJobConfig = {
        providerCount: 8,
        estimatedItemsPerProvider: 200,
        estimatedTimePerProviderMs: 2000,
      };

      const estimate = estimateSyncJobCost(config);

      expect(estimate.estimatedMemoryMB).toBeLessThanOrEqual(1024);
    });
  });

  describe('sync scheduling', () => {
    it('returns interval compatible with Vercel cron', () => {
      const policy = getSyncBudgetPolicy({
        launchModeEnabled: true,
        freeTierMode: true,
      });

      expect(policy.syncIntervalMinutes).toBeGreaterThanOrEqual(1);
      expect(policy.cronExpression).toBeDefined();
    });

    it('provides staggered sync for multiple providers', () => {
      const policy = getSyncBudgetPolicy({
        launchModeEnabled: true,
        freeTierMode: true,
      });

      expect(policy.staggerDelayMs).toBeGreaterThan(0);
      expect(policy.staggerDelayMs).toBeLessThan(5000);
    });
  });
});