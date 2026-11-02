import { describe, expect, it } from 'vitest';
import { createProviderHealthGate } from '@/lib/homepage/quality';

describe('home api health gate', () => {
  it('enables gate when report has unavailable providers', () => {
    const gate = createProviderHealthGate({
      providerSummary: [],
      unavailableProviders: ['reelshort', 'goodshort'],
    });

    expect(gate.enabled).toBe(true);
    expect(gate.unavailableSlugs.has('reelshort')).toBe(true);
    expect(gate.unavailableSlugs.has('goodshort')).toBe(true);
  });

  it('disables gate when unavailable providers list is empty', () => {
    const gate = createProviderHealthGate({
      providerSummary: [],
      unavailableProviders: [],
    });

    expect(gate.enabled).toBe(false);
    expect(gate.unavailableSlugs.size).toBe(0);
  });
});
