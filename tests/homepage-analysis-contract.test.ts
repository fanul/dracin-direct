import { describe, expect, it } from 'vitest';
import { computeHomepageQuality } from '@/lib/homepage/quality';
import type { DramaCard } from '@/lib/types';

function makeCard(id: string, overrides: Partial<DramaCard> = {}): DramaCard {
  return {
    id,
    providerSlug: 'reelshort',
    providerDramaId: id,
    title: 'Test',
    coverUrl: 'https://example.com/cover.jpg',
    episodeCount: 10,
    tags: [],
    isPremium: false,
    providerName: 'ReelShort',
    vipLevel: 'VIP9',
    ...overrides,
  };
}

describe('homepage analysis contract', () => {
  it('computes duplicate ratio and missing cover ratio correctly', () => {
    const cards: DramaCard[] = [
      makeCard('a'),
      makeCard('a'),
      makeCard('b', { coverUrl: '' }),
    ];

    const metrics = computeHomepageQuality(cards);

    expect(metrics.totalCards).toBe(3);
    expect(metrics.uniqueCards).toBe(2);
    expect(metrics.duplicateRatio).toBeCloseTo(1 - 2 / 3, 4);
    expect(metrics.missingCoverRatio).toBeCloseTo(1 / 3, 4);
  });

  it('returns zero ratios for empty input', () => {
    const metrics = computeHomepageQuality([]);

    expect(metrics.totalCards).toBe(0);
    expect(metrics.uniqueCards).toBe(0);
    expect(metrics.duplicateRatio).toBe(0);
    expect(metrics.missingCoverRatio).toBe(0);
    expect(metrics.missingTitleRatio).toBe(0);
  });
});
