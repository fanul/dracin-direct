import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { normalizeSansekaiCatalog, sansekaiProviders } from '@/lib/providers/sansekai-catalog';

const config = (slug: string) => sansekaiProviders.find((item) => item.slug === slug)!;

describe('Sansekai catalog normalization', () => {
  it.each([
    ['pinedrama', { collections: [{ collection_id: 'p1', title: 'Pine', cover: 'p.jpg', total_episodes: 12, tags: ['Romance'] }] }],
    ['goodshort', { data: { records: [{ items: [{ bookId: 'g1', bookName: 'Good', cover: 'g.jpg', chapterCount: 20, labels: ['Dub'] }] }] } }],
    ['melolo', { books: [{ book_id: 'm1', book_name: 'Melolo', thumb_url: 'm.jpg', serial_count: 30 }] }],
    ['freereels', { data: { items: [{ key: 'f1', title: 'Free', cover: 'f.jpg', episode_count: 40, content_tags: ['Drama'] }] } }],
  ])('maps %s cards', (slug, payload) => {
    const cards = normalizeSansekaiCatalog(payload, config(slug));
    expect(cards).toHaveLength(1);
    expect(cards[0]).toMatchObject({ providerSlug: slug, coverUrl: expect.any(String), episodeCount: expect.any(Number) });
  });

  it('publishes the nine active SekaiDrama providers', () => {
    expect(sansekaiProviders.map((item) => item.slug)).toEqual(['pinedrama', 'dramabox', 'reelshort', 'shortmax', 'goodshort', 'netshort', 'melolo', 'freereels', 'flickreels']);
  });

  it('does not publish providers with empty catalogs', () => {
    const home = readFileSync('src/app/api/v1/home/route.ts', 'utf8');
    expect(home).toContain('if (!item.dramas.length) continue');
    expect(home).toContain('providerResults[index] = replacement');
  });
});
