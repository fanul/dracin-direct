import { beforeEach, describe, expect, it, vi } from 'vitest';

const originalEnv = process.env.CAPTAIN_API_TOKEN;

const {
  mockGetProviderBySlug,
  mockGetDramasByProvider,
  mockGetProviderGenres,
  mockAssessCompleteness,
  mockCaptainGet,
  mockMapHome,
  mockResolveEndpoint,
  mockGetDramaById,
  mockGetDramaByProviderId,
  mockGetEpisodesByDramaId,
  mockGetEpisodesWithFallback,
  mockSyncEpisodes,
  mockCheckEntitlement,
  mockGetPlaybackUrl,
  mockCacheGet,
  mockCacheSet,
  mockFetch,
} = vi.hoisted(() => ({
  mockGetProviderBySlug: vi.fn(),
  mockGetDramasByProvider: vi.fn(),
  mockGetProviderGenres: vi.fn(),
  mockAssessCompleteness: vi.fn(),
  mockCaptainGet: vi.fn(),
  mockMapHome: vi.fn(),
  mockResolveEndpoint: vi.fn(),
  mockGetDramaById: vi.fn(),
  mockGetDramaByProviderId: vi.fn(),
  mockGetEpisodesByDramaId: vi.fn(),
  mockGetEpisodesWithFallback: vi.fn(),
  mockSyncEpisodes: vi.fn(),
  mockCheckEntitlement: vi.fn(),
  mockGetPlaybackUrl: vi.fn(),
  mockCacheGet: vi.fn(),
  mockCacheSet: vi.fn(),
  mockFetch: vi.fn(),
}));

vi.mock('@/lib/db/providers-db', () => ({
  getProviderBySlug: mockGetProviderBySlug,
  getDramasByProvider: mockGetDramasByProvider,
  getProviderGenres: mockGetProviderGenres,
  assessProviderCatalogCompleteness: mockAssessCompleteness,
}));

vi.mock('@/lib/http/captain-client', () => ({
  createCaptainClient: () => ({
    get: mockCaptainGet,
  }),
}));

vi.mock('@/lib/providers/catalog', () => ({
  providerCatalog: {
    resolveEndpoint: mockResolveEndpoint,
    getProvider: vi.fn(() => ({ baseUrl: 'https://captain.sapimu.au/netshort' })),
  },
}));

vi.mock('@/lib/providers/adapters', () => ({
  getAdapter: () => ({
    mapHome: mockMapHome,
  }),
}));

vi.mock('@/lib/observability/logger', () => ({
  generateRequestId: () => 'req-netshort',
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/db/dramas', () => ({
  getDramaById: mockGetDramaById,
  getDramaByProviderId: mockGetDramaByProviderId,
  getEpisodesByDramaId: mockGetEpisodesByDramaId,
}));

vi.mock('@/lib/services/episode-sync', () => ({
  getEpisodesWithFallback: mockGetEpisodesWithFallback,
}));

vi.mock('@/lib/services/drama-sync', () => ({
  syncDramaFromProvider: vi.fn(),
}));

vi.mock('@/jobs/sync-episodes', () => ({
  syncEpisodes: mockSyncEpisodes,
}));

vi.mock('@/lib/db/subscriptions', () => ({
  checkEntitlement: mockCheckEntitlement,
}));

vi.mock('@/lib/services/playback', () => ({
  getPlaybackUrl: mockGetPlaybackUrl,
}));

vi.mock('@/lib/cache/redis', () => ({
  CACHE_TTL: { PLAYBACK: 90 },
  createPlaybackKey: (provider: string, drama: string, episode: string) => `playback:${provider}:${drama}:${episode}`,
  getCacheManager: () => ({
    get: mockCacheGet,
    set: mockCacheSet,
    delete: vi.fn(),
  }),
}));

describe('netshort functional routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', mockFetch);
    process.env.CAPTAIN_API_TOKEN = 'token';
    mockCacheGet.mockResolvedValue(null);
    mockCacheSet.mockResolvedValue(undefined);
    mockGetDramaByProviderId.mockResolvedValue(null);
    mockGetEpisodesByDramaId.mockResolvedValue([]);
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue('WEBVTT\n\n00:00:00.000 --> 00:00:01.000\nHalo'),
      headers: {
        get: vi.fn().mockReturnValue('text/vtt'),
      },
    });
  });

  it('provider route uses netshort category union with subtitle and dubbed audio filters', async () => {
    mockGetProviderBySlug.mockResolvedValue({
      id: 'p1',
      slug: 'netshort',
      name: 'NetShort',
      rating: 4.5,
      dramaCount: 0,
      episodeCount: 0,
      status: 'active',
    });
    mockGetDramasByProvider.mockResolvedValue({ dramas: [], total: 0 });
    mockGetProviderGenres.mockResolvedValue([]);
    mockAssessCompleteness.mockReturnValue({ isPossiblyIncomplete: true, reason: 'db_empty' });
    mockCaptainGet
      .mockResolvedValueOnce({ data: { data: [{ id: '201', title: 'Drama Satu', cover: 'https://example.com/one.jpg', labels: ['Fantasy'], isFinished: true }] } })
      .mockResolvedValueOnce({ data: { data: [{ id: '201', title: 'Drama Satu', cover: 'https://example.com/one.jpg', labels: ['Fantasy'], isFinished: true }, { id: '202', title: '(Sulih suara) Drama Dua', cover: 'https://example.com/two.jpg', labels: ['Action'], isFinished: false }] } });

    const { GET } = await import('@/app/api/v1/providers/[slug]/route');
    const response = await GET(new Request('http://localhost/api/v1/providers/netshort?page=1&limit=20'), {
      params: Promise.resolve({ slug: 'netshort' }),
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(mockCaptainGet).toHaveBeenCalledTimes(2);
    const firstUrl = mockCaptainGet.mock.calls[0]?.[0] as string;
    const secondUrl = mockCaptainGet.mock.calls[1]?.[0] as string;
    expect(firstUrl).toContain('/api/v1/category/1');
    expect(firstUrl).toContain('region=0');
    expect(firstUrl).toContain('audio=1');
    expect(secondUrl).toContain('audio=2');
    expect(payload.data.dramas.length).toBe(2);
    expect(payload.data.dramas.some((drama: { tags: string[] }) => drama.tags.includes('Subtitle'))).toBe(true);
  });

  it('provider route prefers subtitle variant when title collides with dubbed variant', async () => {
    mockGetProviderBySlug.mockResolvedValue({
      id: 'p1',
      slug: 'netshort',
      name: 'NetShort',
      rating: 4.5,
      dramaCount: 0,
      episodeCount: 0,
      status: 'active',
    });
    mockGetDramasByProvider.mockResolvedValue({ dramas: [], total: 0 });
    mockGetProviderGenres.mockResolvedValue([]);
    mockAssessCompleteness.mockReturnValue({ isPossiblyIncomplete: true, reason: 'db_empty' });
    mockCaptainGet
      .mockResolvedValueOnce({ data: { data: [{ id: 'sub-1', title: 'Cinta Terlarang', cover: 'https://example.com/sub.jpg', labels: ['Romance'], isFinished: true }] } })
      .mockResolvedValueOnce({ data: { data: [{ id: 'dub-1', title: '(Sulih suara) Cinta Terlarang', cover: 'https://example.com/dub.jpg', labels: ['Romance'], isFinished: true }] } });

    const { GET } = await import('@/app/api/v1/providers/[slug]/route');
    const response = await GET(new Request('http://localhost/api/v1/providers/netshort?page=1&limit=20'), {
      params: Promise.resolve({ slug: 'netshort' }),
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.dramas).toHaveLength(1);
    expect(payload.data.dramas[0].providerDramaId).toBe('sub-1');
    expect(payload.data.dramas[0].tags).toContain('Subtitle');
  });

  it('episodes route forces netshort resync when db episodes are incomplete', async () => {
    mockGetDramaById.mockResolvedValue(null);
    mockGetDramaByProviderId.mockResolvedValue({
      id: 'uuid-drama-1',
      providerSlug: 'netshort',
      providerDramaId: 'net-123',
      episodeCount: 10,
    });
    mockGetEpisodesByDramaId
      .mockResolvedValueOnce([{ episodeNo: 1, chapterId: 'c1', providerEpisodeId: 'p1' }])
      .mockResolvedValueOnce([
        { episodeNo: 1, chapterId: 'c1', providerEpisodeId: 'p1' },
        { episodeNo: 2, chapterId: 'c2', providerEpisodeId: 'p2' },
      ]);
    mockSyncEpisodes.mockResolvedValue(undefined);

    const { GET } = await import('@/app/api/v1/dramas/[id]/episodes/route');
    const response = await GET(new Request('http://localhost/api/v1/dramas/netshort:net-123/episodes'), {
      params: Promise.resolve({ id: 'netshort:net-123' }),
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(mockSyncEpisodes).toHaveBeenCalledWith('netshort', 'net-123');
    expect(payload.data.length).toBe(2);
  });

  it.each(['netshort', 'dramabox', 'shortmax'])('playback route bypasses entitlement for %s guest', async (provider) => {
    mockGetPlaybackUrl.mockResolvedValue({
      streamUrl: 'https://cdn.example.com/stream.mp4',
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      subtitles: [
        {
          src: 'https://awscdn.netshort.com/subtitles/episode-1.vtt',
          srclang: 'id_ID',
          label: 'Indonesia',
          default: true,
        },
      ],
    });

    const { GET } = await import('@/app/api/v1/playback/route');
    const response = await GET(new Request(`http://localhost/api/v1/playback?provider=${provider}&drama=net-123&episode=1&userId=guest`));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(mockCheckEntitlement).not.toHaveBeenCalled();
    expect(mockGetPlaybackUrl).toHaveBeenCalledWith(provider, 'net-123', '1', 'req-netshort');
    expect(payload.data.streamUrl).toContain('https://cdn.example.com/stream');
    if (provider === 'netshort') expect(payload.data.subtitles[0].src).toContain('/api/v1/playback?subtitleUrl=');
  });

  it('playback route still works when episode DB resolution throws', async () => {
    mockGetDramaByProviderId.mockRejectedValueOnce(new Error('db unavailable'));
    mockGetPlaybackUrl.mockResolvedValueOnce({
      streamUrl: 'https://cdn.example.com/fallback.mp4',
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    });

    const { GET } = await import('@/app/api/v1/playback/route');
    const response = await GET(new Request('http://localhost/api/v1/playback?provider=netshort&drama=net-123&episode=1&userId=guest'));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(mockGetPlaybackUrl).toHaveBeenCalledWith('netshort', 'net-123', '1', 'req-netshort');
    expect(payload.data.streamUrl).toContain('fallback.mp4');
  });

  it('subtitle proxy returns proxied webvtt content', async () => {
    const { GET } = await import('@/app/api/v1/playback/route');
    const response = await GET(new Request('http://localhost/api/v1/playback?subtitleUrl=https%3A%2F%2Fawscdn.netshort.com%2Fsubtitles%2Fepisode-1.vtt'));
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(text).toContain('WEBVTT');
    expect(mockFetch).toHaveBeenCalledWith('https://awscdn.netshort.com/subtitles/episode-1.vtt', expect.objectContaining({
      method: 'GET',
      cache: 'no-store',
    }));
  });

});
