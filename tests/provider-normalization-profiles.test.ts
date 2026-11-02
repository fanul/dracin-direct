import { describe, expect, it } from 'vitest';
import { getNormalizationProfile } from '../src/lib/providers/normalization-profiles';

describe('provider normalization profiles', () => {
  it('returns an explicit normalization profile for launch-tier providers', () => {
    const profile = getNormalizationProfile('reelshort');
    expect(profile).toBeDefined();
    expect(profile.titleStrategy).toBeDefined();
    expect(profile.coverStrategy).toBeDefined();
    expect(profile.episodeNumberSource).toBeDefined();
  });
});