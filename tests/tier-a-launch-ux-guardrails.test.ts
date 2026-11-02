import { describe, expect, it } from 'vitest';
import {
  shouldShowPlayCTA,
  getProviderDisplayQuality,
  getLaunchUXGuardrails,
  type PlayCTADecision,
  type ProviderDisplayQuality,
  type LaunchUXGuardrailsConfig,
} from '../src/lib/providers/launch-ux-guardrails';

describe('tier a launch ux guardrails', () => {
  describe('shouldShowPlayCTA', () => {
    it('shows play CTA for verified Tier A provider', () => {
      const result = shouldShowPlayCTA({
        providerSlug: 'reelshort',
        isTierA: true,
        isVerified: true,
        playbackReady: true,
      });

      expect(result.show).toBe(true);
      expect(result.disabled).toBe(false);
    });

    it('disables play CTA for unverified provider', () => {
      const result = shouldShowPlayCTA({
        providerSlug: 'unknown',
        isTierA: false,
        isVerified: false,
        playbackReady: false,
      });

      expect(result.show).toBe(true);
      expect(result.disabled).toBe(true);
      expect(result.reason).toContain('unverified');
    });

    it('disables play CTA when playback is not ready', () => {
      const result = shouldShowPlayCTA({
        providerSlug: 'reelshort',
        isTierA: true,
        isVerified: true,
        playbackReady: false,
      });

      expect(result.disabled).toBe(true);
      expect(result.reason).toContain('playback');
    });

    it('shows disabled CTA with browse-only message for blocked provider', () => {
      const result = shouldShowPlayCTA({
        providerSlug: 'blockedprovider',
        isTierA: false,
        isVerified: false,
        playbackReady: false,
        isBlocked: true,
      });

      expect(result.disabled).toBe(true);
      expect(result.alternativeMessage).toContain('browse');
    });
  });

  describe('getProviderDisplayQuality', () => {
    it('returns high quality for verified Tier A provider', () => {
      const result = getProviderDisplayQuality({
        providerSlug: 'reelshort',
        isTierA: true,
        hasValidCover: true,
        hasValidTitle: true,
        hasValidEpisodes: true,
      });

      expect(result.quality).toBe('high');
      expect(result.score).toBeGreaterThanOrEqual(0.9);
    });

    it('returns low quality for missing cover', () => {
      const result = getProviderDisplayQuality({
        providerSlug: 'testprovider',
        isTierA: false,
        hasValidCover: false,
        hasValidTitle: true,
        hasValidEpisodes: true,
      });

      expect(result.quality).toBe('low');
      expect(result.issues).toContain('missing_cover');
    });

    it('returns medium quality for partial issues', () => {
      const result = getProviderDisplayQuality({
        providerSlug: 'testprovider',
        isTierA: false,
        hasValidCover: true,
        hasValidTitle: true,
        hasValidEpisodes: false,
      });

      expect(result.quality).toBe('medium');
      expect(result.issues).toContain('invalid_episodes');
    });

    it('returns below threshold when quality is too low for launch', () => {
      const result = getProviderDisplayQuality({
        providerSlug: 'badprovider',
        isTierA: false,
        hasValidCover: false,
        hasValidTitle: false,
        hasValidEpisodes: false,
      });

      expect(result.belowLaunchThreshold).toBe(true);
    });
  });

  describe('getLaunchUXGuardrails', () => {
    it('returns strict guardrails for launch mode', () => {
      const config: LaunchUXGuardrailsConfig = {
        launchModeEnabled: true,
        strictMode: true,
      };

      const guardrails = getLaunchUXGuardrails(config);

      expect(guardrails.minDisplayQuality).toBe('high');
      expect(guardrails.hideUnverifiedProviders).toBe(true);
      expect(guardrails.disablePlayCTAForUnverified).toBe(true);
    });

    it('returns relaxed guardrails for non-launch mode', () => {
      const config: LaunchUXGuardrailsConfig = {
        launchModeEnabled: false,
      };

      const guardrails = getLaunchUXGuardrails(config);

      expect(guardrails.minDisplayQuality).toBe('medium');
      expect(guardrails.hideUnverifiedProviders).toBe(false);
      expect(guardrails.disablePlayCTAForUnverified).toBe(false);
    });

    it('allows custom quality threshold', () => {
      const config: LaunchUXGuardrailsConfig = {
        launchModeEnabled: true,
        customThresholds: {
          minDisplayQuality: 'medium',
        },
      };

      const guardrails = getLaunchUXGuardrails(config);

      expect(guardrails.minDisplayQuality).toBe('medium');
    });
  });

  describe('play CTA messaging', () => {
    it('provides appropriate message for disabled CTA', () => {
      const result = shouldShowPlayCTA({
        providerSlug: 'testprovider',
        isTierA: false,
        isVerified: false,
        playbackReady: false,
      });

      expect(result.disabledMessage).toBeDefined();
      expect(result.disabledMessage).not.toContain('error');
    });

    it('provides retry suggestion for transient issues', () => {
      const result = shouldShowPlayCTA({
        providerSlug: 'reelshort',
        isTierA: true,
        isVerified: true,
        playbackReady: false,
        transientIssue: true,
      });

      expect(result.retrySuggestion).toBeDefined();
    });
  });

  describe('display quality scoring', () => {
    it('penalizes missing covers heavily', () => {
      const withCover = getProviderDisplayQuality({
        providerSlug: 'test',
        isTierA: false,
        hasValidCover: true,
        hasValidTitle: true,
        hasValidEpisodes: true,
      });

      const withoutCover = getProviderDisplayQuality({
        providerSlug: 'test',
        isTierA: false,
        hasValidCover: false,
        hasValidTitle: true,
        hasValidEpisodes: true,
      });

      expect(withoutCover.score).toBeLessThan(withCover.score - 0.2);
    });

    it('penalizes invalid episodes moderately', () => {
      const withEpisodes = getProviderDisplayQuality({
        providerSlug: 'test',
        isTierA: false,
        hasValidCover: true,
        hasValidTitle: true,
        hasValidEpisodes: true,
      });

      const withoutEpisodes = getProviderDisplayQuality({
        providerSlug: 'test',
        isTierA: false,
        hasValidCover: true,
        hasValidTitle: true,
        hasValidEpisodes: false,
      });

      expect(withoutEpisodes.score).toBeLessThan(withEpisodes.score);
    });
  });

  describe('provider content visibility', () => {
    it('hides provider content when below launch threshold in strict mode', () => {
      const quality = getProviderDisplayQuality({
        providerSlug: 'badprovider',
        isTierA: false,
        hasValidCover: false,
        hasValidTitle: false,
        hasValidEpisodes: false,
      });

      const guardrails = getLaunchUXGuardrails({
        launchModeEnabled: true,
        strictMode: true,
      });

      const shouldHide = quality.belowLaunchThreshold && guardrails.hideLowQualityContent;

      expect(shouldHide).toBe(true);
    });

    it('shows degraded content in non-strict mode', () => {
      const quality = getProviderDisplayQuality({
        providerSlug: 'mediumprovider',
        isTierA: false,
        hasValidCover: true,
        hasValidTitle: true,
        hasValidEpisodes: false,
      });

      const guardrails = getLaunchUXGuardrails({
        launchModeEnabled: false,
      });

      const shouldShow = !quality.belowLaunchThreshold || !guardrails.hideLowQualityContent;

      expect(shouldShow).toBe(true);
    });
  });
});