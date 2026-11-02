import { NextResponse } from 'next/server';
import { providerCatalog } from '@/lib/providers/catalog';
import { getAdapter } from '@/lib/providers/adapters';
import { createCaptainClient } from '@/lib/http/captain-client';
import { getCacheManager } from '@/lib/cache/redis';
import { logger, generateRequestId } from '@/lib/observability/logger';
import type { ApiResponse, DramaCard, ProviderSectionData } from '@/lib/types';

const captainToken = process.env.CAPTAIN_API_TOKEN || '';
const captainClient = createCaptainClient(captainToken);

export const dynamic = 'force-dynamic';

// Cache TTL for provider sections (30 minutes)
const CACHE_TTL = 30 * 60;

export async function GET(request: Request): Promise<NextResponse> {
  const requestId = generateRequestId();
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const cache = getCacheManager();
    const cacheKey = `home:providers:page:${page}:limit:${limit}`;

    // Try cache first
    const cached = await cache.get<ProviderSectionData[]>(cacheKey);
    if (cached) {
      const response: ApiResponse<ProviderSectionData[]> = {
        data: cached,
        meta: { requestId, timestamp: new Date().toISOString(), cache: 'hit' },
        error: null,
      };
      return NextResponse.json(response);
    }

    // Get active providers with pagination
    const activeProviders = providerCatalog.getActiveProviders();
    const from = (page - 1) * limit;
    const to = from + limit;
    const providersToFetch = activeProviders.slice(from, to);

    // Fetch from providers in parallel
    const sectionPromises = providersToFetch.map(async (provider) => {
      const providerStartTime = Date.now();

      try {
        const resolved = providerCatalog.resolveEndpoint(provider.slug, 'home');
        if (!resolved) {
          return null;
        }

        const response = await captainClient.get(resolved.url, {
          provider: provider.slug,
          requestId,
          timeout: 8000,
        });

        const adapter = getAdapter(provider.slug);
        if (!adapter) {
          return null;
        }

        const dramas = adapter.mapHome(response.data);

        logger.info('provider_section_fetched', {
          requestId,
          provider: provider.slug,
          dramaCount: dramas.length,
          latencyMs: Date.now() - providerStartTime,
        });

        return {
          provider: {
            slug: provider.slug,
            name: provider.provider,
            contentCount: dramas.length,
          },
          dramas: dramas.slice(0, 10),
          totalCount: dramas.length,
        } satisfies ProviderSectionData;
      } catch (error) {
        logger.error('provider_section_failed', {
          requestId,
          provider: provider.slug,
          error: error instanceof Error ? error.message : 'Unknown',
          latencyMs: Date.now() - providerStartTime,
        });
        return null;
      }
    });

    const sections = (await Promise.all(sectionPromises)).filter(
      (section): section is ProviderSectionData => section !== null
    );

    // Cache the result
    await cache.set(cacheKey, sections, CACHE_TTL);

    const response: ApiResponse<ProviderSectionData[]> = {
      data: sections,
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
        cache: 'miss',
        pagination: {
          page,
          pageSize: limit,
          total: activeProviders.length,
        },
      },
      error: null,
    };

    logger.info('home_providers_fetched', {
      requestId,
      page,
      limit,
      sectionsCount: sections.length,
      latencyMs: Date.now() - startTime,
    });

    return NextResponse.json(response);
  } catch (error) {
    logger.error('home_providers_failed', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown',
      latencyMs: Date.now() - startTime,
    });

    const response: ApiResponse<null> = {
      data: null,
      meta: { requestId, timestamp: new Date().toISOString() },
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch provider sections',
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}
