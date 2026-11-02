import { beforeEach, describe, expect, it, vi } from 'vitest';

const fetchMock = vi.fn();
const response = (body: unknown) => ({ ok: true, json: vi.fn().mockResolvedValue(body) });

beforeEach(() => { vi.clearAllMocks(); vi.stubGlobal('fetch', fetchMock); });

describe('Sansekai reels providers', () => {
  it('maps FlickReels detail, episodes, and playback', async () => {
    const api = await import('@/lib/providers/sansekai-reels');
    const payload = { drama: { title: 'Berlabuh', cover: 'cover.jpg', description: 'desc', chapterCount: 2, labels: ['Drama'] }, episodes: [{ id: 'e1', name: 'EP.1', num: 1, unlock: true, raw: { duration: '119' } }, { id: 'e2', name: 'EP.2', num: 2, unlock: false, raw: { duration: '120' } }] };
    fetchMock.mockResolvedValueOnce(response(payload)).mockResolvedValueOnce(response(payload)).mockResolvedValueOnce(response({ data: { hls_url: 'https://cdn.example/one.m3u8', total_duration: 119 } }));
    expect(await api.fetchFlickReelsDetail('1937')).toMatchObject({ id: 'flickreels:1937', title: 'Berlabuh', episodeCount: 2 });
    expect(await api.fetchFlickReelsEpisodes('1937')).toEqual([expect.objectContaining({ episodeId: 'e1', episodeNo: 1, isLocked: false }), expect.objectContaining({ episodeId: 'e2', episodeNo: 2, isLocked: true })]);
    expect(await api.getFlickReelsPlayback('1937', '1')).toMatchObject({ streamUrl: 'https://cdn.example/one.m3u8', mimeType: 'application/x-mpegURL' });
    expect(fetchMock).toHaveBeenLastCalledWith(expect.stringContaining('get-episode?playlet_id=1937&episodeNumber=1'), expect.any(Object));
  });

  it('maps FreeReels detail, episodes, playback, and subtitles', async () => {
    const api = await import('@/lib/providers/sansekai-reels');
    const payload = { data: { info: { id: 'free1', name: 'Free', desc: 'desc', cover: 'cover.jpg', episode_count: 1, tag: ['Gratis'], episode_list: [{ id: 'ep1', name: 'Free', index: 1, unlock: true, duration: 108, external_audio_h264_m3u8: 'https://video.example/h264.m3u8', external_audio_h265_m3u8: 'https://video.example/h265.m3u8', subtitle_list: [{ language: 'id-ID', display_name: 'Indonesia', subtitle: 'https://video.example/id.srt' }] }] } } };
    fetchMock.mockResolvedValue(response(payload));
    expect(await api.fetchFreeReelsDetail('free1')).toMatchObject({ id: 'freereels:free1', title: 'Free', episodeCount: 1 });
    expect(await api.fetchFreeReelsEpisodes('free1')).toEqual([expect.objectContaining({ episodeId: 'ep1', providerEpisodeId: '1', episodeNo: 1 })]);
    expect(await api.getFreeReelsPlayback('free1', 'ep1')).toMatchObject({ streamUrl: 'https://video.example/h264.m3u8', mimeType: 'application/x-mpegURL', subtitles: [{ src: 'https://video.example/id.srt', srclang: 'id-ID', label: 'Indonesia' }] });
  });
});
