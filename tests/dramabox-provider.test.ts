import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockFetch, mockLimiter } = vi.hoisted(() => ({
  mockFetch: vi.fn(),
  mockLimiter: vi.fn().mockResolvedValue({ global: { success: true }, provider: { success: true } }),
}));

vi.mock('@/lib/rate-limit/upstash', () => ({ getRateLimiter: () => ({ checkBoth: mockLimiter }) }));
vi.mock('@/lib/db/providers-db', () => ({
  getProviderBySlug: vi.fn(), getDramasByProvider: vi.fn(), getProviderGenres: vi.fn(), assessProviderCatalogCompleteness: vi.fn(),
}));
vi.mock('@/lib/observability/logger', () => ({
  generateRequestId: () => 'req-dramabox', logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const jsonResponse = (body: unknown) => ({ ok: true, json: vi.fn().mockResolvedValue(body) });
const drama = { title: 'Pion Cinta', slug: 'pion-cinta', synopsis: 'Sinopsis', cover_image_url: 'cover.jpg', details: { genres: ['Romance'] }, chapter_count: 2, is_vip_only: false, updatedAt: '2026-01-01T00:00:00.000Z' };
const episodes = [
  { _id: 'ep-1', episode_number: 1, title: 'EP 1', is_vip: true, videos: [{ quality: 360, url: '360.mp4' }, { quality: 1080, url: '1080.mp4' }, { quality: 720, url: '720.mp4' }] },
  { _id: 'ep-2', episode_number: 2, title: 'EP 2', videos: [{ quality: 720, url: 'ep2.mp4' }] },
];

describe('DramaBox direct provider', () => {
  beforeEach(() => { vi.clearAllMocks(); vi.stubGlobal('fetch', mockFetch); delete process.env.DRAMA_API_BASE_URL; });

  it('serves catalog without a provider DB row', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ success: true, data: [drama] }));
    const { GET } = await import('@/app/api/v1/providers/[slug]/route');
    const response = await GET(new Request('http://localhost/api/v1/providers/dramabox?page=2'), { params: Promise.resolve({ slug: 'dramabox' }) });
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledWith('https://api-all-drama-new.vercel.app/api/dramabox/terbaru?page=2', { cache: 'no-store' });
    expect(payload.data.provider.slug).toBe('dramabox');
    expect(payload.data.dramas[0]).toMatchObject({ providerDramaId: 'pion-cinta', episodeCount: 2 });
  });

  it('maps detail and episodes directly', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ success: true, data: drama }));
    const detailRoute = await import('@/app/api/v1/dramas/[id]/route');
    const detail = await detailRoute.GET(new Request('http://localhost'), { params: Promise.resolve({ id: 'dramabox:pion-cinta' }) });
    expect((await detail.json()).data.drama).toMatchObject({ title: 'Pion Cinta', synopsis: 'Sinopsis' });

    mockFetch.mockResolvedValueOnce(jsonResponse({ success: true, data: episodes }));
    const episodesRoute = await import('@/app/api/v1/dramas/[id]/episodes/route');
    const result = await episodesRoute.GET(new Request('http://localhost'), { params: Promise.resolve({ id: 'dramabox:pion-cinta' }) });
    expect((await result.json()).data).toEqual(expect.arrayContaining([expect.objectContaining({ episodeNo: 1, providerEpisodeId: '1', isLocked: false })]));
  });

  it('searches DramaBox and picks highest playback quality', async () => {
    const { searchDramaBox, getDramaBoxPlayback } = await import('@/lib/providers/dramabox');
    mockFetch.mockResolvedValueOnce(jsonResponse({ success: true, data: [drama] }));
    expect((await searchDramaBox('pion cinta'))[0].providerSlug).toBe('dramabox');
    expect(mockFetch).toHaveBeenLastCalledWith(expect.stringContaining('/api/dramabox/search?q=pion%20cinta'), { cache: 'no-store' });

    mockFetch.mockResolvedValueOnce(jsonResponse({ success: true, data: episodes }));
    expect((await getDramaBoxPlayback('pion-cinta', '1')).streamUrl).toBe('1080.mp4');
  });

  it('supports direct ShortMax catalog, search, and highest-quality playback', async () => {
    const { fetchShortMaxCatalog, searchShortMax, getShortMaxPlayback } = await import('@/lib/providers/dramabox');
    mockFetch.mockResolvedValueOnce(jsonResponse({ success: true, data: [drama] }));
    expect((await fetchShortMaxCatalog(3))[0].providerSlug).toBe('shortmax');
    expect(mockFetch).toHaveBeenLastCalledWith(expect.stringContaining('/api/shortmax/homepage?page=3'), { cache: 'no-store' });

    mockFetch.mockResolvedValueOnce(jsonResponse({ success: true, data: [drama] }));
    expect((await searchShortMax('cinta'))[0].providerName).toBe('ShortMax');
    expect(mockFetch).toHaveBeenLastCalledWith(expect.stringContaining('/api/shortmax/search?q=cinta'), { cache: 'no-store' });

    mockFetch.mockResolvedValueOnce(jsonResponse({ success: true, data: episodes }));
    expect((await getShortMaxPlayback('pion-cinta', '1')).streamUrl).toBe('1080.mp4');
  });
});
