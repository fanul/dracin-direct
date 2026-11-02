import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchSansekaiDetail, fetchSansekaiEpisodes, getSansekaiPlayback } from '@/lib/providers/sansekai';
import { normalizeSansekaiCatalog, sansekaiProviders } from '@/lib/providers/sansekai-catalog';

const config = (slug: string) => sansekaiProviders.find((item) => item.slug === slug)!;
const melolo = { data: { video_data: { book_id: 'm1', book_name: 'Melolo', thumb_url: 'm.jpg', serial_count: 2, abstract: 'M', video_list: [{ vid: 'mv1', vid_index: 1 }, { vid: 'mv2', vid_index: 2 }] } } };
const netshort = { shortPlayId: 'n1', shortPlayName: 'Net', shortPlayCover: 'n.jpg', shotIntroduce: 'N', totalEpisode: 1, shortPlayLabels: ['Drama'], shortPlayEpisodeInfos: [{ episodeId: 'ne1', episodeNo: 1, duration: '10', isLock: false }] };
const reelshort = { success: true, bookId: 'r1', title: 'Reel', cover: 'r.jpg', description: 'R', totalEpisodes: 1, chapters: [{ chapterId: 're1', index: 1, title: 'Episode 1', isLocked: false }] };

beforeEach(() => vi.stubGlobal('fetch', vi.fn(async (input: string | URL | Request) => {
  const url = String(input);
  const body = url.includes('/melolo/detail') ? melolo
    : url.includes('/melolo/get-episode') ? { streamUrl: 'https://cdn/m.mp4', qualities: [] }
    : url.includes('/netshort/detail') ? netshort
    : url.includes('/netshort/get-episodes') ? { episodeList: [{ playVoucher: 'https://cdn/n.mp4', subtitleList: [] }] }
    : url.includes('/reelshort/get-detail') ? reelshort
    : { success: true, videoList: [{ url: 'https://cdn/r-h265.m3u8', encode: 'H265', quality: 720 }, { url: 'https://cdn/r-h264.m3u8', encode: 'H264', quality: 540 }] };
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
})));

describe('Melolo, NetShort, and ReelShort Sansekai adapters', () => {
  it('maps Melolo detail, episode vids, and playback', async () => {
    expect(await fetchSansekaiDetail('melolo', 'm1')).toMatchObject({ title: 'Melolo', episodeCount: 2 });
    expect(await fetchSansekaiEpisodes('melolo', 'm1')).toEqual([expect.objectContaining({ episodeId: 'mv1', episodeNo: 1 }), expect.objectContaining({ episodeId: 'mv2', episodeNo: 2 })]);
    expect(await getSansekaiPlayback('melolo', 'm1', 'mv1')).toMatchObject({ streamUrl: 'https://cdn/m.mp4', mimeType: 'video/mp4' });
  });

  it('maps NetShort detail, episodes, and media', async () => {
    expect(await fetchSansekaiDetail('netshort', 'n1')).toMatchObject({ title: 'Net', episodeCount: 1 });
    expect(await fetchSansekaiEpisodes('netshort', 'n1')).toEqual([expect.objectContaining({ episodeId: 'ne1', providerEpisodeId: '1' })]);
    expect(await getSansekaiPlayback('netshort', 'n1', '1')).toMatchObject({ streamUrl: 'https://cdn/n.mp4', mimeType: 'video/mp4' });
  });

  it('maps ReelShort and prefers browser-compatible H264 HLS', async () => {
    expect(await fetchSansekaiDetail('reelshort', 'r1')).toMatchObject({ title: 'Reel', episodeCount: 1 });
    expect(await fetchSansekaiEpisodes('reelshort', 'r1')).toEqual([expect.objectContaining({ episodeId: 're1', providerEpisodeId: '1' })]);
    expect(await getSansekaiPlayback('reelshort', 'r1', '1')).toMatchObject({ streamUrl: 'https://cdn/r-h264.m3u8', mimeType: 'application/x-mpegURL' });
  });

  it('extracts Melolo books instead of its titled section container', () => {
    const cards = normalizeSansekaiCatalog({ data: { cell: { id: 'section', title: 'Trending', cell_data: [{ books: [{ book_id: 'm1', book_name: 'Melolo', thumb_url: 'm.jpg', serial_count: 2 }] }] } } }, config('melolo'));
    expect(cards).toEqual([expect.objectContaining({ providerDramaId: 'm1', title: 'Melolo', episodeCount: 2 })]);
  });
});
