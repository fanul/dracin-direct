import { describe, expect, it } from 'vitest';
import {
  emitProviderQualitySignal,
  getProviderQualitySummary,
  classifyProviderQualityIssue,
  type ProviderQualitySignal,
  type ProviderQualitySummary,
} from '../src/lib/providers/provider-quality-telemetry';

describe('provider quality telemetry', () => {
  describe('classifyProviderQualityIssue', () => {
    it('classifies empty payload from active provider as degradation', () => {
      const result = classifyProviderQualityIssue({
        providerSlug: 'reelshort',
        issueType: 'empty_payload',
        endpoint: 'home',
        isActive: true,
      });

      expect(result.severity).toBe('degradation');
      expect(result.actionable).toBe(true);
    });

    it('classifies mapping failure as error', () => {
      const result = classifyProviderQualityIssue({
        providerSlug: 'testprovider',
        issueType: 'mapping_failure',
        endpoint: 'detail',
        isActive: true,
      });

      expect(result.severity).toBe('error');
    });

    it('classifies timeout as warning', () => {
      const result = classifyProviderQualityIssue({
        providerSlug: 'testprovider',
        issueType: 'timeout',
        endpoint: 'playback',
        isActive: true,
      });

      expect(result.severity).toBe('warning');
    });

    it('classifies issues from inactive provider as info', () => {
      const result = classifyProviderQualityIssue({
        providerSlug: 'inactive',
        issueType: 'empty_payload',
        endpoint: 'home',
        isActive: false,
      });

      expect(result.severity).toBe('info');
      expect(result.actionable).toBe(false);
    });
  });

  describe('emitProviderQualitySignal', () => {
    it('emits signal for empty payload', () => {
      const signal = emitProviderQualitySignal({
        providerSlug: 'reelshort',
        issueType: 'empty_payload',
        endpoint: 'home',
        timestamp: Date.now(),
      });

      expect(signal.providerSlug).toBe('reelshort');
      expect(signal.issueType).toBe('empty_payload');
      expect(signal.signalId).toBeDefined();
    });

    it('includes context for debugging', () => {
      const signal = emitProviderQualitySignal({
        providerSlug: 'reelshort',
        issueType: 'mapping_failure',
        endpoint: 'detail',
        timestamp: Date.now(),
        context: {
          dramaId: 'abc123',
          expectedFields: ['title', 'cover'],
          missingFields: ['title'],
        },
      });

      expect(signal.context).toBeDefined();
      expect(signal.context?.missingFields).toContain('title');
    });
  });
  describe('getProviderQualitySummary', () => {
    it('aggregates quality signals by provider', () => {
      const signals: ProviderQualitySignal[] = [
        emitProviderQualitySignal({
          providerSlug: 'reelshort',
          issueType: 'empty_payload',
          endpoint: 'home',
          timestamp: Date.now(),
        }),
        emitProviderQualitySignal({
          providerSlug: 'reelshort',
          issueType: 'timeout',
          endpoint: 'playback',
          timestamp: Date.now(),
        }),
        emitProviderQualitySignal({
          providerSlug: 'goodshort',
          issueType: 'mapping_failure',
          endpoint: 'detail',
          timestamp: Date.now(),
        }),
      ];

      const summary = getProviderQualitySummary(signals);

      expect(summary.providerSummaries['reelshort'].totalSignals).toBe(2);
      expect(summary.providerSummaries['goodshort'].totalSignals).toBe(1);
    });

    it('counts signals by type', () => {
      const signals: ProviderQualitySignal[] = [
        emitProviderQualitySignal({
          providerSlug: 'reelshort',
          issueType: 'empty_payload',
          endpoint: 'home',
          timestamp: Date.now(),
        }),
        emitProviderQualitySignal({
          providerSlug: 'reelshort',
          issueType: 'empty_payload',
          endpoint: 'search',
          timestamp: Date.now(),
        }),
      ];

      const summary = getProviderQualitySummary(signals);

      expect(summary.providerSummaries['reelshort'].issueCounts['empty_payload']).toBe(2);
    });

    it('identifies degraded providers', () => {
      const signals: ProviderQualitySignal[] = [
        emitProviderQualitySignal({
          providerSlug: 'degraded',
          issueType: 'empty_payload',
          endpoint: 'home',
          timestamp: Date.now(),
        }),
        emitProviderQualitySignal({
          providerSlug: 'degraded',
          issueType: 'mapping_failure',
          endpoint: 'detail',
          timestamp: Date.now(),
        }),
        emitProviderQualitySignal({
          providerSlug: 'degraded',
          issueType: 'timeout',
          endpoint: 'playback',
          timestamp: Date.now(),
        }),
      ];

      const summary = getProviderQualitySummary(signals);

      expect(summary.degradedProviders).toContain('degraded');
    });

    it('returns empty summary for no signals', () => {
      const summary = getProviderQualitySummary([]);

      expect(summary.totalSignals).toBe(0);
      expect(summary.degradedProviders).toHaveLength(0);
    });
  });

  describe('quality signal thresholds', () => {
    it('marks provider as degraded after 3 signals', () => {
      const signals: ProviderQualitySignal[] = [
        emitProviderQualitySignal({
          providerSlug: 'test',
          issueType: 'empty_payload',
          endpoint: 'home',
          timestamp: Date.now(),
        }),
        emitProviderQualitySignal({
          providerSlug: 'test',
          issueType: 'timeout',
          endpoint: 'search',
          timestamp: Date.now(),
        }),
        emitProviderQualitySignal({
          providerSlug: 'test',
          issueType: 'mapping_failure',
          endpoint: 'detail',
          timestamp: Date.now(),
        }),
      ];

      const summary = getProviderQualitySummary(signals);

      expect(summary.degradedProviders).toContain('test');
    });

    it('does not mark provider as degraded with fewer signals', () => {
      const signals: ProviderQualitySignal[] = [
        emitProviderQualitySignal({
          providerSlug: 'test',
          issueType: 'empty_payload',
          endpoint: 'home',
          timestamp: Date.now(),
        }),
        emitProviderQualitySignal({
          providerSlug: 'test',
          issueType: 'timeout',
          endpoint: 'search',
          timestamp: Date.now(),
        }),
      ];

      const summary = getProviderQualitySummary(signals);

      expect(summary.degradedProviders).not.toContain('test');
    });
  });

  describe('signal deduplication', () => {
    it('deduplicates identical signals within time window', () => {
      const now = Date.now();
      const signals: ProviderQualitySignal[] = [
        emitProviderQualitySignal({
          providerSlug: 'reelshort',
          issueType: 'empty_payload',
          endpoint: 'home',
          timestamp: now,
        }),
        emitProviderQualitySignal({
          providerSlug: 'reelshort',
          issueType: 'empty_payload',
          endpoint: 'home',
          timestamp: now + 1000,
        }),
      ];

      const summary = getProviderQualitySummary(signals);

      expect(summary.providerSummaries['reelshort'].uniqueSignals).toBe(1);
    });
  });
});