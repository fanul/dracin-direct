import { describe, expect, it } from 'vitest';
import { classifyProviderHealth } from '@/lib/providers/health';

describe('provider health model', () => {
  it('classifies as healthy when score >= 80', () => {
    expect(classifyProviderHealth(82)).toBe('healthy');
  });

  it('classifies as degraded when score is between 50 and 79', () => {
    expect(classifyProviderHealth(65)).toBe('degraded');
  });

  it('classifies as unavailable when score < 50', () => {
    expect(classifyProviderHealth(40)).toBe('unavailable');
  });
});
