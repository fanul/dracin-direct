import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchDramaBoxDetail, fetchDramaBoxEpisodes, getDramaBoxPlayback } from '@/lib/providers/dramabox';

const json = (body: unknown) => ({ ok: true, json: vi.fn().mockResolvedValue(body) });
const episode = { chapterId: '701719273', chapterIndex: 0, chapterName: 'EP 1', viewingDuration: 80, cdnList: [{ isDefault: 1, videoPathList: [{ quality: 1080, videoPath: 'vip.encrypt.mp4', isVipEquity: 1 }, { quality: 720, videoPath: 'free.encrypt.mp4', isVipEquity: 0 }] }] };

describe('DramaBox Sansekai numeric IDs', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('uses one Sansekai contract from detail through playback', async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(json({ bookId: '42000029706', bookName: 'Lycan', coverWap: 'cover.jpg', chapterCount: 45, introduction: 'intro', tags: ['Dub'] }))
      .mockResolvedValueOnce(json([episode]))
      .mockResolvedValueOnce(json([episode]))
      .mockResolvedValueOnce(json({ streamUrl: 'https://api.sansekai.my.id/api/dramabox/decrypt-videos?url=x' }));
    vi.stubGlobal('fetch', fetch);

    expect(await fetchDramaBoxDetail('42000029706')).toMatchObject({ title: 'Lycan', episodeCount: 45 });
    expect(await fetchDramaBoxEpisodes('42000029706')).toEqual([expect.objectContaining({ episodeNo: 1, episodeId: '701719273', isLocked: false })]);
    expect(await getDramaBoxPlayback('42000029706', '1')).toMatchObject({ mimeType: 'video/mp4', streamUrl: expect.stringContaining('decrypt-videos') });
    expect(fetch).toHaveBeenLastCalledWith(expect.stringContaining('/dramabox/decrypt?url=free.encrypt.mp4'), expect.any(Object));
  });
});
