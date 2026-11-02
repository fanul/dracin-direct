import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchShortMaxDetail, fetchShortMaxEpisodes, getShortMaxPlayback } from '@/lib/providers/dramabox';

const response = (body: unknown) => ({ ok: true, json: vi.fn().mockResolvedValue(body) });

describe('numeric ShortMax catalog IDs', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('uses Sansekai for detail, synthetic episodes, and HLS playback', async () => {
    const detail = { shortPlayName: 'Ibu Tiri', picUrl: 'cover.jpg', totalEpisodes: 146, summary: 'summary', labelResponseList: [] };
    const fetch = vi.fn()
      .mockResolvedValueOnce(response(detail))
      .mockResolvedValueOnce(response(detail))
      .mockResolvedValueOnce(response({ episode: { videoUrl: { video_720: '720.m3u8', video_1080: '1080.m3u8' } } }));
    vi.stubGlobal('fetch', fetch);

    expect(await fetchShortMaxDetail('46676')).toMatchObject({ title: 'Ibu Tiri', episodeCount: 146 });
    expect(await fetchShortMaxEpisodes('46676')).toHaveLength(146);
    expect(await getShortMaxPlayback('46676', '1')).toMatchObject({ mimeType: 'application/x-mpegURL', streamUrl: expect.stringContaining('1080.m3u8') });
    expect(fetch).toHaveBeenLastCalledWith(expect.stringContaining('shortPlayId=46676&episodeNumber=1'), expect.any(Object));
  });
});
