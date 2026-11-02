import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  shouldCooldownProvider,
  getRequestBudgetPolicy,
  recordProviderFailure,
  recordProviderSuccess,
  getProviderCooldownState,
  type ProviderFailureRecord,
  type RequestBudgetPolicy,
} from '../src/lib/providers/request-budget';

describe('captain request budget', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('shouldCooldownProvider', () => {
    it('enters cooldown after timeout failures', () => {
      const result = shouldCooldownProvider({
        error: 'timeout',
        failureCount: 2,
        lastFailureTime: Date.now(),
      });

      expect(result).toBe(true);
    });

    it('does not cooldown on single failure', () => {
      const result = shouldCooldownProvider({
        error: 'timeout',
        failureCount: 1,
        lastFailureTime: Date.now(),
      });

      expect(result).toBe(false);
    });

    it('does not cooldown on 4xx errors', () => {
      const result = shouldCooldownProvider({
        error: '404',
        failureCount: 3,
        lastFailureTime: Date.now(),
      });

      expect(result).toBe(false);
    });

    it('exits cooldown after cooldown period expires', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const result = shouldCooldownProvider({
        error: 'timeout',
        failureCount: 2,
        lastFailureTime: now - 10 * 60 * 1000, // 10 minutes ago (cooldown is 5 min)
      });

      expect(result).toBe(false);
    });

    it('cooldowns on ECONNREFUSED', () => {
      const result = shouldCooldownProvider({
        error: 'ECONNREFUSED',
        failureCount: 1,
        lastFailureTime: Date.now(),
      });

      expect(result).toBe(true);
    });

    it('cooldowns on 5xx errors after threshold', () => {
      const result = shouldCooldownProvider({
        error: '503',
        failureCount: 2,
        lastFailureTime: Date.now(),
      });

      expect(result).toBe(true);
    });
  });

  describe('getRequestBudgetPolicy', () => {
    it('returns default policy for non-launch mode', () => {
      const policy = getRequestBudgetPolicy({ launchModeEnabled: false });

      expect(policy.maxConcurrentRequests).toBe(10);
      expect(policy.cooldownMinutes).toBe(5);
      expect(policy.failureThreshold).toBe(3);
      expect(policy.timeoutMs).toBe(15000);
    });

    it('returns conservative policy for launch mode', () => {
      const policy = getRequestBudgetPolicy({ launchModeEnabled: true });

      expect(policy.maxConcurrentRequests).toBe(5);
      expect(policy.cooldownMinutes).toBe(10);
      expect(policy.failureThreshold).toBe(2);
      expect(policy.timeoutMs).toBe(10000);
    });

    it('allows custom overrides', () => {
      const policy = getRequestBudgetPolicy({
        launchModeEnabled: true,
        overrides: {
          maxConcurrentRequests: 3,
        },
      });

      expect(policy.maxConcurrentRequests).toBe(3);
      expect(policy.cooldownMinutes).toBe(10); // Default for launch mode
    });
  });

  describe('provider failure tracking', () => {
    it('records failure and increments count', () => {
      const record: ProviderFailureRecord = {
        provider: 'reelshort',
        failureCount: 0,
        lastFailureTime: 0,
        lastError: null,
        cooldownUntil: 0,
      };

      const now = Date.now();
      vi.setSystemTime(now);

      const updated = recordProviderFailure(record, 'timeout', 5 * 60 * 1000);

      expect(updated.failureCount).toBe(1);
      expect(updated.lastFailureTime).toBe(now);
      expect(updated.lastError).toBe('timeout');
      expect(updated.cooldownUntil).toBe(now + 5 * 60 * 1000);
    });

    it('records success and resets failure count', () => {
      const record: ProviderFailureRecord = {
        provider: 'reelshort',
        failureCount: 3,
        lastFailureTime: Date.now(),
        lastError: 'timeout',
        cooldownUntil: Date.now() + 5 * 60 * 1000,
      };

      const updated = recordProviderSuccess(record);

      expect(updated.failureCount).toBe(0);
      expect(updated.lastError).toBe(null);
      expect(updated.cooldownUntil).toBe(0);
    });
  });

  describe('getProviderCooldownState', () => {
    it('returns active when cooldown has not expired', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const record: ProviderFailureRecord = {
        provider: 'reelshort',
        failureCount: 2,
        lastFailureTime: now - 2 * 60 * 1000, // 2 minutes ago
        lastError: 'timeout',
        cooldownUntil: now + 3 * 60 * 1000, // 3 minutes remaining
      };

      const state = getProviderCooldownState(record);

      expect(state.inCooldown).toBe(true);
      expect(state.remainingMs).toBe(3 * 60 * 1000);
      expect(state.canRetry).toBe(false);
    });

    it('returns expired when cooldown has passed', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const record: ProviderFailureRecord = {
        provider: 'reelshort',
        failureCount: 2,
        lastFailureTime: now - 10 * 60 * 1000, // 10 minutes ago
        lastError: 'timeout',
        cooldownUntil: now - 5 * 60 * 1000, // Expired 5 minutes ago
      };

      const state = getProviderCooldownState(record);

      expect(state.inCooldown).toBe(false);
      expect(state.remainingMs).toBe(0);
      expect(state.canRetry).toBe(true);
    });

    it('returns can retry when no cooldown', () => {
      const record: ProviderFailureRecord = {
        provider: 'reelshort',
        failureCount: 0,
        lastFailureTime: 0,
        lastError: null,
        cooldownUntil: 0,
      };

      const state = getProviderCooldownState(record);

      expect(state.inCooldown).toBe(false);
      expect(state.canRetry).toBe(true);
    });
  });

  describe('error classification', () => {
    it('classifies network errors as cooldown-worthy', () => {
      const networkErrors = [
        'ECONNREFUSED',
        'ECONNRESET',
        'ETIMEDOUT',
        'ENOTFOUND',
        'EAI_AGAIN',
      ];

      for (const error of networkErrors) {
        const result = shouldCooldownProvider({
          error,
          failureCount: 1,
          lastFailureTime: Date.now(),
        });

        expect(result).toBe(true);
      }
    });

    it('classifies timeout as cooldown-worthy after threshold', () => {
      const result = shouldCooldownProvider({
        error: 'timeout',
        failureCount: 2,
        lastFailureTime: Date.now(),
      });

      expect(result).toBe(true);
    });

    it('does not cooldown on rate limit (429)', () => {
      const result = shouldCooldownProvider({
        error: '429',
        failureCount: 5,
        lastFailureTime: Date.now(),
      });

      expect(result).toBe(false);
    });
  });
});