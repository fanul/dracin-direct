import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchSansekaiDetail, fetchSansekaiEpisodes, getSansekaiPlayback } from '@/lib/providers/sansekai';

const pineDetail = { collection_id: '7668048624319927303', title: 'Pine', cover: 'pine.jpg', total_episodes: 2, description: 'Synopsis' };
const goodDetail = { data: { book: { bookId: '31001860496', bookName: 'Good', coverWap: 'good.jpg', chapterCount: 2, introduction: 'Intro', tags: ['Romance'] } } };
const goodEpisodes = { data: { downloadList: [
  { id: '69849637', chapterName: '1', multiVideos: [{ filePath: 'https://cdn/good-1.m3u8' }] },
  { id: '69849638', chapterName: '2', multiVideos: [{ filePath: 'https://cdn/good-2.m3u8' }] },
] } };

beforeEach(() => vi.stubGlobal('fetch', vi.fn(async (input: string | URL | Request) => {
  const url = String(input);
  const body = url.includes('/pinedrama/detail') ? pineDetail
    : url.includes('/pinedrama/get-episodes') ? { main: { indo_cdn_urls: ['https://cdn/pine.mp4'] } }
    : url.includes('/goodshort/detail') ? goodDetail : goodEpisodes;
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
})));

describe('PineDrama and GoodShort Sansekai adapters', () => {
  it('normalizes detail and episodes for both providers', async () => {
    expect((await fetchSansekaiDetail('pinedrama', '7668048624319927303'))?.episodeCount).toBe(2);
    expect((await fetchSansekaiEpisodes('pinedrama', '7668048624319927303')).map(e => e.providerEpisodeId)).toEqual(['1', '2']);
    expect((await fetchSansekaiDetail('goodshort', '31001860496'))?.title).toBe('Good');
    expect((await fetchSansekaiEpisodes('goodshort', '31001860496')).map(e => e.providerEpisodeId)).toEqual(['69849637', '69849638']);
  });

  it('resolves verified provider streams', async () => {
    expect((await getSansekaiPlayback('pinedrama', '7668048624319927303', '1')).streamUrl).toBe('https://cdn/pine.mp4');
    expect((await getSansekaiPlayback('goodshort', '31001860496', '69849638')).streamUrl).toBe('https://cdn/good-2.m3u8');
  });
});
