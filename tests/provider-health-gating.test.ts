import { describe, expect, it, vi } from 'vitest';

const mockGet = vi.fn(async () => ({ data: [] }));

vi.mock('../src/lib/http/captain-client', () => ({
  createCaptainClient: () => ({
    get: mockGet,
  }),
}));

vi.mock('../src/lib/providers/catalog', () => ({
  providerCatalog: {
    getActiveProviders: () => ([
      {
        slug: 'testprovider',
        provider: 'Test Provider',
        baseUrl: 'https://example.com',
        status: 'active',
        vip: 'VIP1',
        endpoints: [{ method: 'GET', path: '/api/v1/home', pathParams: [] }],
      },
    ]),
    resolveEndpoint: () => ({
      provider: 'testprovider',
      intent: 'home',
      endpoint: { method: 'GET', path: '/api/v1/home', pathParams: [] },
      url: 'https://example.com/api/v1/home',
      missingParams: [],
    }),
  },
}));

vi.mock('../src/lib/providers/adapters', () => ({
  getAdapter: () => ({
    mapHome: () => [],
  }),
}));

vi.mock('../src/lib/rate-limit/upstash', () => ({
  getRateLimiter: () => ({
    checkBoth: async () => ({
      global: { success: true },
      provider: { success: true },
    }),
  }),
}));

vi.mock('../src/lib/observability/logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('provider health gating', () => {
  it('skips unavailable provider when health gate is enabled', async () => {
    const { fetchHomeFromProviders } = await import('../src/lib/services/provider-aggregator');

    const results = await fetchHomeFromProviders({
      requestId: 'req-1',
      healthGate: {
        enabled: true,
        unavailableSlugs: new Set(['testprovider']),
      },
    } as any);

    expect(results).toHaveLength(1);
    expect(results[0].error).toBe('provider_unavailable_by_health_gate');
    expect(results[0].success).toBe(false);
    expect(results[0].latencyMs).toBe(0);
    expect(mockGet).not.toHaveBeenCalled();
  });
});
