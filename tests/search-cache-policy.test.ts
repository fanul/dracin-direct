import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockCacheGet,
  mockCacheSet,
  mockSearchAcrossProviders,
} = vi.hoisted(() => ({
  mockCacheGet: vi.fn(),
  mockCacheSet: vi.fn(),
  mockSearchAcrossProviders: vi.fn(),
}));

vi.mock('@/lib/services/search', () => ({
  searchAcrossProviders: mockSearchAcrossProviders,
}));

vi.mock('@/lib/cache/redis', () => ({
  CACHE_TTL: { SEARCH: 86400 },
  createSearchKey: (query: string, page: number) => `search:${query}:page:${page}`,
  createSearchMetaKey: (query: string) => `search-meta:${query}`,
  getCacheManager: () => ({
    get: mockCacheGet,
    set: mockCacheSet,
  }),
}));

vi.mock('@/lib/providers/catalog', () => ({
  providerCatalog: {
    getActiveProviders: () => ([{ slug: 'provider-a' }]),
    getCapabilities: () => ({ supportsSearch: true }),
  },
}));

vi.mock('@/lib/validation/schemas', () => ({
  searchRequestSchema: {},
  validateSearchParams: () => ({
    success: true,
    data: {
      q: 'love',
      page: 1,
      providers: [],
      genres: [],
      sort: 'relevance',
      limit: 20,
    },
  }),
}));

vi.mock('@/lib/observability/logger', () => ({
  generateRequestId: () => 'req-1',
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('search cache policy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCacheSet.mockResolvedValue(undefined);
  });

  it('calls provider API on first search of the day and caches data+meta', async () => {
    mockCacheGet
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    mockSearchAcrossProviders.mockResolvedValueOnce([
      {
        id: 'd1',
        providerSlug: 'provider-a',
        providerDramaId: 'pd1',
        title: 'Drama 1',
        coverUrl: 'https://example.com/cover1.jpg',
        episodeCount: 1,
        tags: [],
        isPremium: false,
        providerName: 'Provider A',
        vipLevel: 'VIP1',
      },
    ]);

    const { GET } = await import('@/app/api/v1/search/route');
    const response = await GET(new Request('http://localhost/api/v1/search?q=love'));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.meta.cache).toBe('miss');
    expect(mockSearchAcrossProviders).toHaveBeenCalledTimes(1);
    expect(mockCacheSet).toHaveBeenCalledTimes(2);
  });

  it('reuses empty cache result when last fetch is under 15 minutes', async () => {
    mockCacheGet
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce({
        lastFetchedAt: new Date(Date.now() - (5 * 60 * 1000)).toISOString(),
        resultCount: 0,
      });

    const { GET } = await import('@/app/api/v1/search/route');
    const response = await GET(new Request('http://localhost/api/v1/search?q=love'));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.meta.cache).toBe('hit');
    expect(payload.data).toEqual([]);
    expect(mockSearchAcrossProviders).not.toHaveBeenCalled();
  });

  it('retries provider API when empty cache is older than 15 minutes', async () => {
    mockCacheGet
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce({
        lastFetchedAt: new Date(Date.now() - (16 * 60 * 1000)).toISOString(),
        resultCount: 0,
      });
    mockSearchAcrossProviders.mockResolvedValueOnce([
      {
        id: 'd2',
        providerSlug: 'provider-a',
        providerDramaId: 'pd2',
        title: 'Drama 2',
        coverUrl: 'https://example.com/cover2.jpg',
        episodeCount: 10,
        tags: [],
        isPremium: false,
        providerName: 'Provider A',
        vipLevel: 'VIP1',
      },
    ]);

    const { GET } = await import('@/app/api/v1/search/route');
    const response = await GET(new Request('http://localhost/api/v1/search?q=love'));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.meta.cache).toBe('miss');
    expect(mockSearchAcrossProviders).toHaveBeenCalledTimes(1);
  });

  it('uses non-empty cache without hitting provider API', async () => {
    const cached = [
      {
        id: 'd3',
        providerSlug: 'provider-a',
        providerDramaId: 'pd3',
        title: 'Drama 3',
        coverUrl: 'https://example.com/cover3.jpg',
        episodeCount: 2,
        tags: [],
        isPremium: false,
        providerName: 'Provider A',
        vipLevel: 'VIP1',
      },
    ];

    mockCacheGet
      .mockResolvedValueOnce(cached)
      .mockResolvedValueOnce({
        lastFetchedAt: new Date().toISOString(),
        resultCount: 1,
      });

    const { GET } = await import('@/app/api/v1/search/route');
    const response = await GET(new Request('http://localhost/api/v1/search?q=love'));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.meta.cache).toBe('hit');
    expect(payload.data).toEqual(cached);
    expect(mockSearchAcrossProviders).not.toHaveBeenCalled();
  });
});
