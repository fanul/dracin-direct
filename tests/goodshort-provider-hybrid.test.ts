import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockGetProviderBySlug,
  mockGetDramasByProvider,
  mockGetProviderGenres,
  mockAssessCompleteness,
  mockCaptainGet,
  mockMapHome,
  mockResolveEndpoint,
  mockCacheGet,
  mockCacheSet,
} = vi.hoisted(() => ({
  mockGetProviderBySlug: vi.fn(),
  mockGetDramasByProvider: vi.fn(),
  mockGetProviderGenres: vi.fn(),
  mockAssessCompleteness: vi.fn(),
  mockCaptainGet: vi.fn(),
  mockMapHome: vi.fn(),
  mockResolveEndpoint: vi.fn(),
  mockCacheGet: vi.fn(),
  mockCacheSet: vi.fn(),
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
  },
}));

vi.mock('@/lib/providers/adapters', () => ({
  getAdapter: () => ({
    mapHome: mockMapHome,
  }),
}));

vi.mock('@/lib/cache/redis', () => ({
  getCacheManager: () => ({
    get: mockCacheGet,
    set: mockCacheSet,
  }),
}));

vi.mock('@/lib/observability/logger', () => ({
  generateRequestId: () => 'req-goodshort',
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('goodshort provider hybrid fallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CAPTAIN_API_TOKEN = 'token';
    mockCacheGet.mockResolvedValue(null);
    mockCacheSet.mockResolvedValue(undefined);

    mockGetProviderBySlug.mockResolvedValue({
      id: 'p1',
      slug: 'goodshort',
      name: 'GoodShort',
      rating: 4.5,
      dramaCount: 0,
      episodeCount: 0,
      status: 'active',
    });
    mockGetProviderGenres.mockResolvedValue([]);
    mockResolveEndpoint.mockReturnValue({
      url: 'https://example.com/goodshort/home',
      missingParams: [],
      endpoint: { method: 'GET', path: '/home', pathParams: [] },
    });
  });

  it('uses fallback API when goodshort db catalog is incomplete', async () => {
    mockGetDramasByProvider.mockResolvedValue({ dramas: [], total: 0 });
    mockAssessCompleteness.mockReturnValue({ isPossiblyIncomplete: true, reason: 'db_empty' });
    mockCaptainGet.mockResolvedValue({ data: { data: [] } });
    mockMapHome
      .mockReturnValueOnce([
        {
          id: 'goodshort:101',
          providerSlug: 'goodshort',
          providerDramaId: '101',
          title: 'Fallback Drama',
          coverUrl: 'https://example.com/cover.jpg',
          episodeCount: 8,
          tags: [],
          isPremium: false,
          providerName: 'GoodShort',
          vipLevel: 'VIP9',
        },
      ])
      .mockReturnValue([]);

    const { GET } = await import('@/app/api/v1/providers/[slug]/route');
    const response = await GET(new Request('http://localhost/api/v1/providers/goodshort?page=1&limit=20'), {
      params: Promise.resolve({ slug: 'goodshort' }),
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(mockCaptainGet).toHaveBeenCalledTimes(2);
    expect(payload.data.dramas).toHaveLength(1);
    expect(payload.data.dramas[0].providerDramaId).toBe('101');
  });

  it('uses fallback API when netshort db catalog is incomplete', async () => {
    mockGetProviderBySlug.mockResolvedValueOnce({
      id: 'p3',
      slug: 'netshort',
      name: 'NetShort',
      rating: 4.5,
      dramaCount: 0,
      episodeCount: 0,
      status: 'active',
    });
    mockGetDramasByProvider.mockResolvedValueOnce({ dramas: [], total: 0 });
    mockAssessCompleteness.mockReturnValueOnce({ isPossiblyIncomplete: true, reason: 'db_empty' });
    mockResolveEndpoint.mockReturnValue({
      url: 'https://example.com/netshort/api/v1/feed/1',
      missingParams: [],
      endpoint: { method: 'GET', path: '/api/v1/feed/:page', pathParams: ['page'] },
    });
    mockCaptainGet
      .mockResolvedValueOnce({
        data: {
          data: [
            {
              id: '201',
              title: 'NetShort Drama',
              cover: 'https://example.com/netshort.jpg',
              labels: ['Action'],
              isFinished: true,
            },
          ],
        },
      })
      .mockResolvedValueOnce({ data: { data: [] } });

    const { GET } = await import('@/app/api/v1/providers/[slug]/route');
    const response = await GET(new Request('http://localhost/api/v1/providers/netshort?page=1&limit=20'), {
      params: Promise.resolve({ slug: 'netshort' }),
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(mockCaptainGet).toHaveBeenCalledTimes(2);
    const firstNetshortUrl = mockCaptainGet.mock.calls[0]?.[0] as string;
    const secondNetshortUrl = mockCaptainGet.mock.calls[1]?.[0] as string;
    expect(firstNetshortUrl).toContain('/api/v1/category/1');
    expect(firstNetshortUrl).toContain('region=0');
    expect(firstNetshortUrl).toContain('audio=1');
    expect(secondNetshortUrl).toContain('audio=2');
    expect(payload.data.dramas).toHaveLength(1);
    expect(payload.data.dramas[0].providerDramaId).toBe('201');
  });

  it('does not use fallback when provider is not goodshort', async () => {
    mockGetProviderBySlug.mockResolvedValueOnce({
      id: 'p2',
      slug: 'reelshort',
      name: 'ReelShort',
      rating: 4.5,
      dramaCount: 1,
      episodeCount: 1,
      status: 'active',
    });
    mockGetDramasByProvider.mockResolvedValueOnce({
      dramas: [
        {
          id: 'reelshort:1',
          providerSlug: 'reelshort',
          providerDramaId: '1',
          title: 'DB Drama',
          coverUrl: 'https://example.com/db.jpg',
          episodeCount: 10,
          tags: [],
          isPremium: false,
          providerName: 'ReelShort',
          vipLevel: 'VIP9',
        },
      ],
      total: 1,
    });
    mockAssessCompleteness.mockReturnValueOnce({ isPossiblyIncomplete: false, reason: 'not_target_provider' });

    const { GET } = await import('@/app/api/v1/providers/[slug]/route');
    const response = await GET(new Request('http://localhost/api/v1/providers/reelshort?page=1&limit=20'), {
      params: Promise.resolve({ slug: 'reelshort' }),
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(mockCaptainGet).not.toHaveBeenCalled();
    expect(payload.data.dramas).toHaveLength(1);
    expect(payload.data.dramas[0].providerDramaId).toBe('1');
  });
});
