import { describe, expect, it } from 'vitest';
import { summarizeTierAResult } from '../src/lib/providers/tier-a-matrix';

describe('tier a provider matrix', () => {
  it('marks provider blocked when playback is not ready', () => {
    const summary = summarizeTierAResult({
      home: true,
      search: true,
      detail: true,
      episodes: true,
      playback: false,
      displayReady: true,
    });

    expect(summary.launchEligible).toBe(false);
    expect(summary.reason).toContain('playback');
  });
});