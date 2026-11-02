import { describe, expect, it } from 'vitest';

import {
  dedupeNetshortVariantsByTitle,
  hasNetshortSubtitleSignal,
  normalizeNetshortVariantTitle,
  pickPreferredNetshortVariant,
} from '@/lib/providers/netshort';

describe('netshort subtitle preference helpers', () => {
  it('normalizes dubbed markers from titles', () => {
    expect(normalizeNetshortVariantTitle('(Sulih suara) Cinta Terlarang')).toBe('cinta terlarang');
    expect(normalizeNetshortVariantTitle('Cinta Terlarang Subtitle')).toBe('cinta terlarang');
  });

  it('detects subtitle signal from tags', () => {
    expect(hasNetshortSubtitleSignal({ title: 'Cinta Terlarang', tags: ['Romance', 'Subtitle'] })).toBe(true);
    expect(hasNetshortSubtitleSignal({ title: '(Sulih suara) Cinta Terlarang', tags: ['Romance', 'Dubbed'] })).toBe(false);
  });

  it('prefers subtitle variant over dubbed variant', () => {
    const preferred = pickPreferredNetshortVariant(
      {
        providerDramaId: 'dub-1',
        title: '(Sulih suara) Cinta Terlarang',
        tags: ['Dubbed'],
        episodeCount: 10,
      },
      {
        providerDramaId: 'sub-1',
        title: 'Cinta Terlarang',
        tags: ['Subtitle'],
        episodeCount: 10,
      },
    );

    expect(preferred.providerDramaId).toBe('sub-1');
  });

  it('dedupes subtitle and dubbed variants by normalized title', () => {
    const results = dedupeNetshortVariantsByTitle([
      {
        providerDramaId: 'dub-1',
        title: '(Sulih suara) Cinta Terlarang',
        tags: ['Dubbed'],
        episodeCount: 10,
        coverUrl: 'https://example.com/dub.jpg',
      },
      {
        providerDramaId: 'sub-1',
        title: 'Cinta Terlarang',
        tags: ['Subtitle'],
        episodeCount: 10,
        coverUrl: 'https://example.com/sub.jpg',
      },
    ]);

    expect(results).toHaveLength(1);
    expect(results[0].providerDramaId).toBe('sub-1');
  });
});
