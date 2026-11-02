import { describe, expect, it } from 'vitest';
import {
  shouldGateProvider,
  getProviderEligibility,
  getEligibilityForIntent,
  type ProviderLifecycleState,
  type ProviderHealthInfo,
  type ProviderEligibilityResult,
} from '../src/lib/providers/provider-eligibility';

describe('provider lifecycle eligibility', () => {
  describe('shouldGateProvider', () => {
    it('does not gate active and healthy providers', () => {
      const result = shouldGateProvider({
        lifecycleState: 'active',
        healthScore: 85,
      });

      expect(result.gate).toBe(false);
      expect(result.reason).toBe('eligible');
    });

    it('gates disabled providers regardless of health', () => {
      const result = shouldGateProvider({
        lifecycleState: 'disabled',
        healthScore: 90,
      });

      expect(result.gate).toBe(true);
      expect(result.reason).toContain('disabled');
    });

    it('gates degraded providers with low health score', () => {
      const result = shouldGateProvider({
        lifecycleState: 'degraded',
        healthScore: 30,
      });

      expect(result.gate).toBe(true);
      expect(result.reason).toContain('health');
    });

    it('allows degraded providers with acceptable health for browse-only', () => {
      const result = shouldGateProvider({
        lifecycleState: 'degraded',
        healthScore: 60,
        allowDegraded: true,
      });

      expect(result.gate).toBe(false);
      expect(result.restrictions).toContain('browse_only');
    });

    it('gates maintenance providers', () => {
      const result = shouldGateProvider({
        lifecycleState: 'maintenance',
        healthScore: 80,
      });

      expect(result.gate).toBe(true);
      expect(result.reason).toContain('maintenance');
    });

    it('gates candidate providers not yet verified', () => {
      const result = shouldGateProvider({
        lifecycleState: 'candidate',
        healthScore: 90,
      });

      expect(result.gate).toBe(true);
      expect(result.reason).toContain('not_verified');
    });

    it('allows verified providers with good health', () => {
      const result = shouldGateProvider({
        lifecycleState: 'verified',
        healthScore: 75,
      });

      expect(result.gate).toBe(false);
    });
  });

  describe('getProviderEligibility', () => {
    it('returns full eligibility for Tier A verified provider', () => {
      const result = getProviderEligibility({
        slug: 'reelshort',
        lifecycleState: 'verified',
        supportTier: 'Tier A',
        healthScore: 90,
        capabilities: {
          supportsHome: true,
          supportsSearch: true,
          supportsPlayback: true,
        },
      });

      expect(result.eligible).toBe(true);
      expect(result.tier).toBe('Tier A');
      expect(result.allowedIntents).toContain('home');
      expect(result.allowedIntents).toContain('search');
      expect(result.allowedIntents).toContain('playback');
    });

    it('returns browse-only eligibility for Tier B provider', () => {
      const result = getProviderEligibility({
        slug: 'browseonly',
        lifecycleState: 'verified',
        supportTier: 'Tier B',
        healthScore: 80,
        capabilities: {
          supportsHome: true,
          supportsSearch: true,
          supportsPlayback: false,
        },
      });

      expect(result.eligible).toBe(true);
      expect(result.allowedIntents).toContain('home');
      expect(result.allowedIntents).not.toContain('playback');
    });

    it('returns no eligibility for disabled provider', () => {
      const result = getProviderEligibility({
        slug: 'disabled',
        lifecycleState: 'disabled',
        supportTier: 'Tier A',
        healthScore: 90,
        capabilities: {
          supportsHome: true,
          supportsPlayback: true,
        },
      });

      expect(result.eligible).toBe(false);
      expect(result.allowedIntents).toHaveLength(0);
    });

    it('returns restricted eligibility for degraded provider', () => {
      const result = getProviderEligibility({
        slug: 'degraded',
        lifecycleState: 'degraded',
        supportTier: 'Tier A',
        healthScore: 55,
        capabilities: {
          supportsHome: true,
          supportsPlayback: true,
        },
      });

      expect(result.eligible).toBe(true);
      expect(result.restrictions).toBeDefined();
    });
  });

  describe('getEligibilityForIntent', () => {
    it('allows home intent for active provider with home capability', () => {
      const result = getEligibilityForIntent({
        slug: 'reelshort',
        intent: 'home',
        lifecycleState: 'active',
        healthScore: 80,
        supportsIntent: true,
      });

      expect(result.allowed).toBe(true);
    });

    it('denies playback intent for degraded provider', () => {
      const result = getEligibilityForIntent({
        slug: 'degraded',
        intent: 'playback',
        lifecycleState: 'degraded',
        healthScore: 40,
        supportsIntent: true,
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('degraded');
    });

    it('denies intent for provider without capability', () => {
      const result = getEligibilityForIntent({
        slug: 'nohome',
        intent: 'home',
        lifecycleState: 'active',
        healthScore: 90,
        supportsIntent: false,
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('not_supported');
    });

    it('allows detail intent for browse-only degraded provider', () => {
      const result = getEligibilityForIntent({
        slug: 'browse',
        intent: 'detail',
        lifecycleState: 'degraded',
        healthScore: 60,
        supportsIntent: true,
        browseOnlyMode: true,
      });

      expect(result.allowed).toBe(true);
    });
  });

  describe('lifecycle state transitions', () => {
    it('recognizes all lifecycle states', () => {
      const states: ProviderLifecycleState[] = [
        'candidate',
        'verified',
        'active',
        'degraded',
        'maintenance',
        'disabled',
        'removed',
      ];

      for (const state of states) {
        const result = shouldGateProvider({
          lifecycleState: state,
          healthScore: 80,
        });

        expect(result).toBeDefined();
      }
    });

    it('treats removed providers as gated', () => {
      const result = shouldGateProvider({
        lifecycleState: 'removed',
        healthScore: 90,
      });

      expect(result.gate).toBe(true);
      expect(result.reason).toContain('removed');
    });
  });

  describe('health score integration', () => {
    it('gates providers with health score below threshold', () => {
      const result = shouldGateProvider({
        lifecycleState: 'active',
        healthScore: 20,
      });

      expect(result.gate).toBe(true);
      expect(result.reason).toContain('health');
    });

    it('uses different thresholds for different intents', () => {
      const homeResult = getEligibilityForIntent({
        slug: 'lowhealth',
        intent: 'home',
        lifecycleState: 'active',
        healthScore: 40,
        supportsIntent: true,
      });

      const playbackResult = getEligibilityForIntent({
        slug: 'lowhealth',
        intent: 'playback',
        lifecycleState: 'active',
        healthScore: 40,
        supportsIntent: true,
      });

      expect(homeResult.allowed).toBe(true);
      expect(playbackResult.allowed).toBe(false);
    });
  });
});