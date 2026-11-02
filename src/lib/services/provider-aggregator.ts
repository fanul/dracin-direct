import { createCaptainClient } from '../http/captain-client';
import { providerCatalog } from '../providers/catalog';
import { getAdapter } from '../providers/adapters';
import { getRateLimiter } from '../rate-limit/upstash';
import { logger } from '../observability/logger';
import type { DramaCard, Intent, ProviderInfo } from '../types';

const captainToken = process.env.CAPTAIN_API_TOKEN || '';
const captainClient = createCaptainClient(captainToken);

export interface AggregatedResult {
  provider: string;
  providerName: string;
  dramas: DramaCard[];
  success: boolean;
  error?: string;
  latencyMs: number;
}

export interface ProviderFetchOptions {
  maxProviders?: number;
  timeoutMs?: number;
  shuffle?: boolean;
  requestId: string;
  healthGate?: {
    enabled: boolean;
    unavailableSlugs: Set<string>;
  };
}

const DEFAULT_OPTIONS: Partial<ProviderFetchOptions> = {
  maxProviders: 41,
  timeoutMs: 15000,
  shuffle: true,
};

const GENERIC_HOME_PARAMS: Record<string, string> = {
  page: '1',
  tab: '1',
  id: '1',
  name: 'home',
  q: 'love',
  query: 'love',
  keyword: 'love',
};

const PROVIDER_HOME_PARAMS: Record<string, Record<string, string>> = {
  flextv: { name: 'Fokus' },
  netshort: { page: '1' },
  dramawave: { tab: '1' },
  dramadash: { id: '1' },
};

const PROVIDER_HOME_QUERY_SUFFIX: Array<{ matcher: RegExp; query: string }> = [
  { matcher: /\/dramanow\/api\/v1\/search$/i, query: 'query=love' },
  { matcher: /\/dreamshort\/search\/books$/i, query: 'keyword=love' },
  { matcher: /\/melolo\/api\/v1\/search$/i, query: 'query=love' },
];

function resolveHomeUrls(provider: ReturnType<typeof providerCatalog.getActiveProviders>[number]): string[] {
  const preferredParams = {
    ...GENERIC_HOME_PARAMS,
    ...(PROVIDER_HOME_PARAMS[provider.slug] || {}),
  };

  const urls: string[] = [];

  const resolved = providerCatalog.resolveEndpoint(provider.slug, 'home', preferredParams);
  if (resolved && resolved.missingParams.length === 0) {
    urls.push(resolved.url);
  }

  const scorePath = (path: string): number => {
    if (/(foryou|for-you|home|homepage)/i.test(path)) return 1;
    if (/(feed|popular|hot|rank|ranking|discover|browse|explore|releases|new|recommend|search)/i.test(path)) return 2;
    if (/(dramas|drama|series|video|bookmall)/i.test(path)) return 3;
    if (/(tabs|tab)/i.test(path)) return 4;
    if (/(categories|category|genres|labels)/i.test(path)) return 5;
    return 9;
  };

  const fallbackCandidates = provider.endpoints
    .filter((ep) => ep.method === 'GET')
    .sort((a, b) => scorePath(a.path) - scorePath(b.path));

  for (const endpoint of fallbackCandidates) {
    let path = endpoint.path;
    let canResolve = true;

    for (const param of endpoint.pathParams) {
      const value = preferredParams[param];
      if (!value) {
        canResolve = false;
        break;
      }
      path = path.replace(`:${param}`, encodeURIComponent(value));
    }

    if (canResolve) {
      let url = `${provider.baseUrl}${path}`;
      for (const { matcher, query } of PROVIDER_HOME_QUERY_SUFFIX) {
        if (matcher.test(url) && !url.includes('?')) {
          url = `${url}?${query}`;
          break;
        }
      }
      urls.push(url);
    }
  }

  return Array.from(new Set(urls));
}

/**
 * Fetch home/featured content from multiple providers in parallel
 * with graceful degradation for failed providers.
 */
export async function fetchHomeFromProviders(
  options: ProviderFetchOptions
): Promise<AggregatedResult[]> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const activeProviders = providerCatalog.getActiveProviders();

  // Select providers to fetch from
  let providersToFetch = activeProviders;
  if (opts.shuffle) {
    providersToFetch = [...activeProviders].sort(() => Math.random() - 0.5);
  }
  if (opts.maxProviders && opts.maxProviders < providersToFetch.length) {
    providersToFetch = providersToFetch.slice(0, opts.maxProviders);
  }

  const limiter = getRateLimiter();
  const results: AggregatedResult[] = [];

  // Fetch from all providers in parallel with individual timeouts
  const fetchPromises = providersToFetch.map(async (provider) => {
    const startTime = Date.now();

    try {
      if (opts.healthGate?.enabled && opts.healthGate.unavailableSlugs.has(provider.slug)) {
        return {
          provider: provider.slug,
          providerName: provider.provider,
          dramas: [],
          success: false,
          error: 'provider_unavailable_by_health_gate',
          latencyMs: 0,
        };
      }

      // Check rate limits
      const limitCheck = await limiter.checkBoth(provider.slug);
      if (!limitCheck.global.success || !limitCheck.provider.success) {
        logger.warn('provider_rate_limited', {
          requestId: opts.requestId,
          provider: provider.slug,
        });
        return {
          provider: provider.slug,
          providerName: provider.provider,
          dramas: [],
          success: false,
          error: 'rate_limited',
          latencyMs: Date.now() - startTime,
        };
      }

      // Resolve home endpoints with fallback strategy for providers whose feed endpoints vary
      const homeUrls = resolveHomeUrls(provider);
      if (homeUrls.length === 0) {
        return {
          provider: provider.slug,
          providerName: provider.provider,
          dramas: [],
          success: false,
          error: 'no_home_endpoint',
          latencyMs: Date.now() - startTime,
        };
      }

      // Map response using adapter
      const adapter = getAdapter(provider.slug);
      if (!adapter) {
        return {
          provider: provider.slug,
          providerName: provider.provider,
          dramas: [],
          success: false,
          error: 'no_adapter',
          latencyMs: Date.now() - startTime,
        };
      }

      let lastError = 'home_fetch_failed';
      for (const homeUrl of homeUrls) {
        try {
          const response = await Promise.race([
            captainClient.get(homeUrl, {
              provider: provider.slug,
              requestId: opts.requestId,
              timeout: opts.timeoutMs,
            }),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('timeout')), opts.timeoutMs)
            ),
          ]);

          const dramas = adapter.mapHome(response.data);
          if (dramas.length === 0) {
            lastError = 'empty_home_payload';
            continue;
          }

          logger.info('provider_home_success', {
            requestId: opts.requestId,
            provider: provider.slug,
            endpoint: homeUrl,
            dramaCount: dramas.length,
            latencyMs: Date.now() - startTime,
          });

          return {
            provider: provider.slug,
            providerName: provider.provider,
            dramas,
            success: true,
            latencyMs: Date.now() - startTime,
          };
        } catch (error) {
          lastError = error instanceof Error ? error.message : 'Unknown error';
        }
      }

      return {
        provider: provider.slug,
        providerName: provider.provider,
        dramas: [],
        success: false,
        error: lastError,
        latencyMs: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logger.error('provider_home_failed', {
        requestId: opts.requestId,
        provider: provider.slug,
        error: errorMessage,
        latencyMs: Date.now() - startTime,
      });

      return {
        provider: provider.slug,
        providerName: provider.provider,
        dramas: [],
        success: false,
        error: errorMessage,
        latencyMs: Date.now() - startTime,
      };
    }
  });

  const settledResults = await Promise.allSettled(fetchPromises);

  for (const result of settledResults) {
    if (result.status === 'fulfilled') {
      results.push(result.value);
    }
  }

  return results;
}

/**
 * Get provider info list for all active providers
 */
export function getAllProviderInfo(): ProviderInfo[] {
  const providers = providerCatalog.getActiveProviders();

  return providers.map(p => ({
    slug: p.slug,
    name: p.provider,
    contentCount: 0, // Will be populated from DB
    isNew: false,
  }));
}

/**
 * Fetch content from a specific provider by intent
 */
export async function fetchFromProvider(
  slug: string,
  intent: Intent,
  params: Record<string, string>,
  requestId: string
): Promise<DramaCard[] | null> {
  const startTime = Date.now();

  try {
    const resolved = providerCatalog.resolveEndpoint(slug, intent, params);
    if (!resolved || resolved.missingParams.length > 0) {
      logger.warn('provider_endpoint_not_found', {
        requestId,
        provider: slug,
        intent,
        params,
      });
      return null;
    }

    const limiter = getRateLimiter();
    const limitCheck = await limiter.checkBoth(slug);
    if (!limitCheck.global.success || !limitCheck.provider.success) {
      logger.warn('provider_rate_limited', { requestId, provider: slug });
      return null;
    }

    const response = await captainClient.get(resolved.url, {
      provider: slug,
      requestId,
    });

    const adapter = getAdapter(slug);
    if (!adapter) {
      logger.warn('provider_adapter_not_found', { requestId, provider: slug });
      return null;
    }

    let results: DramaCard[];

    switch (intent) {
      case 'home':
        results = adapter.mapHome(response.data);
        break;
      case 'search':
        results = adapter.mapSearch(response.data);
        break;
      default:
        return null;
    }

    logger.info('provider_fetch_success', {
      requestId,
      provider: slug,
      intent,
      resultCount: results.length,
      latencyMs: Date.now() - startTime,
    });

    return results;
  } catch (error) {
    logger.error('provider_fetch_failed', {
      requestId,
      provider: slug,
      intent,
      error: error instanceof Error ? error.message : 'Unknown',
      latencyMs: Date.now() - startTime,
    });
    return null;
  }
}

/**
 * Aggregate dramas from multiple providers with deduplication
 */
export async function aggregateDramas(
  providerSlugs: string[],
  intent: Intent,
  params: Record<string, string>,
  requestId: string,
  options: {
    maxResults?: number;
    shuffle?: boolean;
  } = {}
): Promise<DramaCard[]> {
  const { maxResults = 50, shuffle = true } = options;

  const fetchPromises = providerSlugs.map(slug =>
    fetchFromProvider(slug, intent, params, requestId)
  );

  const results = await Promise.allSettled(fetchPromises);

  const allDramas: DramaCard[] = [];
  const seenIds = new Set<string>();

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      for (const drama of result.value) {
        // Deduplicate by provider + drama ID
        const key = `${drama.providerSlug}:${drama.providerDramaId}`;
        if (!seenIds.has(key)) {
          seenIds.add(key);
          allDramas.push(drama);
        }
      }
    }
  }

  if (shuffle) {
    allDramas.sort(() => Math.random() - 0.5);
  }

  return allDramas.slice(0, maxResults);
}
