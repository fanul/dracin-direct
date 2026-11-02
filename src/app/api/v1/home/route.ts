import { NextResponse } from 'next/server';
import {
  getFeaturedDramas,
  getTrendingDramas,
  getNewReleases,
  getProviderSections,
  getForYouDramas,
  type DbDrama
} from '@/lib/db/dramas';
import { getActiveProviders } from '@/lib/db/providers-db';
import { getSupabaseClient } from '@/lib/db/client';
import { logger, generateRequestId } from '@/lib/observability/logger';
import { preflightEnvCheck, getLaunchModeConfig } from '@/lib/config/env';
import { getCacheManager } from '@/lib/cache/redis';
import { fetchHomeFromProviders } from '@/lib/services/provider-aggregator';
import { dramaBoxProvider, fetchDramaBoxCatalog, fetchDramaBoxLatest, fetchDramaBoxRecommended, fetchDramaBoxTrending, fetchShortMaxCatalog, fetchShortMaxRegular, shortMaxProvider } from '@/lib/providers/dramabox';
import { fetchSansekaiCatalog, sansekaiProviderInfo, sansekaiProviders } from '@/lib/providers/sansekai-catalog';
import { createProviderHealthGate, getLatestProviderHealthReport } from '@/lib/homepage/quality';
import { getLaunchCachePolicy } from '@/lib/providers/launch-cache-policy';
import type { ApiResponse, HomeResponseData, NewReleaseGroup, ContinueWatchingItem, GenreData, DramaCard, ProviderInfo } from '@/lib/types';

export const dynamic = 'force-dynamic';

// Cache TTLs in seconds
const CACHE_TTL = {
  HOME_SNAPSHOT: 15 * 60, // 15 minutes
  HOME_STALE: 60 * 60, // 1 hour stale fallback
  FEATURED: 5 * 60, // 5 minutes
  TRENDING: 10 * 60, // 10 minutes
  NEW_RELEASES: 15 * 60, // 15 minutes
  PROVIDERS: 30 * 60, // 30 minutes
  GENRES: 60 * 60, // 1 hour
};

export async function GET(request: Request): Promise<NextResponse> {
  const requestId = generateRequestId();
  const startTime = Date.now();

  // Get user ID from headers if available (for continue watching)
  const userId = request.headers.get('x-user-id');

  // Preflight environment check to catch configuration issues early
  const envCheck = preflightEnvCheck();
  if (!envCheck.success) {
    console.error(`[${requestId}] Environment validation failed:`, envCheck.errors);
    logger.error('home_env_validation_failed', {
      requestId,
      errors: envCheck.errors,
      missingVars: envCheck.missingVars,
    });

    const response: ApiResponse<null> = {
      data: null,
      meta: { requestId, timestamp: new Date().toISOString() },
      error: {
        code: 'VALIDATION_ERROR',
        message: `Environment configuration error: ${envCheck.missingVars.join(', ')}`,
      },
    };
    return NextResponse.json(response, { status: 500 });
  }

  try {
    const cache = getCacheManager();

    const userCacheScope = userId || 'guest';
    const freshCacheKey = `home:sections:v4:${userCacheScope}`;
    const staleCacheKey = `home:sections:v4:stale:${userCacheScope}`;

    // Fresh cache path
    const cached = await cache.get<HomeResponseData>(freshCacheKey);
    if (cached) {
      const response: ApiResponse<HomeResponseData> = {
        data: cached,
        meta: {
          requestId,
          timestamp: new Date().toISOString(),
          cache: 'hit',
        },
        error: null,
      };
      return NextResponse.json(response);
    }

    // Stale fallback to keep latency low while serving acceptable data
    const staleCached = await cache.get<HomeResponseData>(staleCacheKey);

    let homeData: HomeResponseData;
    let cacheState: 'hit' | 'miss';

    try {
      homeData = await buildHomeData(requestId, userId);
      cacheState = 'miss';

      await Promise.all([
        cache.set(freshCacheKey, homeData, CACHE_TTL.HOME_SNAPSHOT),
        cache.set(staleCacheKey, homeData, CACHE_TTL.HOME_STALE),
      ]);
    } catch (error) {
      if (!staleCached) {
        throw error;
      }

      logger.warn('home_served_stale', {
        requestId,
        userId: userCacheScope,
        reason: error instanceof Error ? error.message : 'Unknown error',
      });

      homeData = staleCached;
      cacheState = 'hit';

      // keep stale cache warm for the fallback path
      await cache.set(staleCacheKey, staleCached, CACHE_TTL.HOME_STALE);
    }

    const response: ApiResponse<HomeResponseData> = {
      data: homeData,
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
        cache: cacheState,
      },
      error: null,
    };

    logger.info('home_fetched', {
      requestId,
      latencyMs: Date.now() - startTime,
      userId: userId || 'guest',
    });

    return NextResponse.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    logger.error('home_fetch_failed', {
      requestId,
      error: errorMessage,
      errorStack,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      latencyMs: Date.now() - startTime,
    });

    console.error(`[${requestId}] Home fetch failed:`, errorMessage);
    if (errorStack) {
      console.error(`[${requestId}] Stack trace:`, errorStack);
    }

    const response: ApiResponse<null> = {
      data: null,
      meta: { requestId, timestamp: new Date().toISOString() },
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch home content',
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}

async function buildHomeData(
  requestId: string,
  userId: string | null
): Promise<HomeResponseData> {
  const providerHealthReport = await getLatestProviderHealthReport();
  const providerHealthGate = createProviderHealthGate(providerHealthReport);

  // Get launch mode configuration
  const launchConfig = getLaunchModeConfig();
  const launchPolicy = getLaunchCachePolicy({
    launchModeEnabled: launchConfig.enabled,
    tierAProvidersOnly: launchConfig.tierAOnly,
  });

  // Fetch provider content with launch-aware fan-out limits
  const providerResultsPromise = fetchHomeFromProviders({
    maxProviders: launchPolicy.maxProviderFanOut,
    shuffle: true,
    requestId,
    healthGate: providerHealthGate,
  });
  // Fetch all sections in parallel
  const [
    featured,
    trending,
    newReleasesData,
    providerSections,
    forYou,
    continueWatching,
    genres,
    providerResults,
  ] = await Promise.all([
    getCachedFeatured().catch(() => []),
    getCachedTrending().catch(() => []),
    getCachedNewReleases().catch(() => []),
    getProviderSections().catch(() => []),
    getForYouDramas(10).catch(() => []),
    userId ? getContinueWatching(userId).catch(() => []) : Promise.resolve(null),
    getGenres().catch(() => []),
    providerResultsPromise,
  ]);

  const [dramaBoxDramas, shortMaxDramas, directRecommended, directTrending, directLatest, directShortMax] = await Promise.all([
    fetchDramaBoxCatalog(1).catch(() => []),
    fetchShortMaxCatalog(1).catch(() => []),
    fetchDramaBoxRecommended(1).catch(() => []),
    fetchDramaBoxTrending(1).catch(() => []),
    fetchDramaBoxLatest(1).catch(() => []),
    fetchShortMaxRegular(1).catch(() => []),
  ]);
  providerResults.push(
    { provider: 'dramabox', providerName: 'DramaBox', dramas: dramaBoxDramas, success: dramaBoxDramas.length > 0, latencyMs: 0 },
    { provider: 'shortmax', providerName: 'ShortMax', dramas: shortMaxDramas, success: shortMaxDramas.length > 0, latencyMs: 0 },
  );

  const sansekaiCatalogs = await Promise.all(sansekaiProviders.map(async (provider) => {
    const cache = getCacheManager();
    const key = `sansekai:catalog:v1:${provider.slug}`;
    const cached = await cache.get<DramaCard[]>(key);
    if (cached?.length) return { provider, dramas: cached };
    try {
      const dramas = await fetchSansekaiCatalog(provider);
      if (dramas.length) await cache.set(key, dramas, 6 * 60 * 60);
      return { provider, dramas };
    } catch {
      return { provider, dramas: [] };
    }
  }));
  for (const item of sansekaiCatalogs) {
    if (!item.dramas.length) continue;
    const replacement = { provider: item.provider.slug, providerName: item.provider.name, dramas: item.dramas, success: true, latencyMs: 0 };
    const index = providerResults.findIndex((result) => result.provider === item.provider.slug);
    if (index >= 0) providerResults[index] = replacement;
    else providerResults.push(replacement);
  }

  // Build provider sections from fetched data
  const dynamicProviderSections = buildProviderSectionsFromResults(providerResults);

  // Group new releases by time period
  const newReleases = groupNewReleases(newReleasesData);
  if (directLatest.length > 0) newReleases.unshift({ period: 'today', label: 'Terbaru DramaBox', dramas: directLatest });

  // Merge static and dynamic provider sections with deduplication
  // Prefer dynamic sections (from API) over static sections (from DB)
  const sectionMap = new Map<string, typeof providerSections[0]>();

  // Add static sections first
  for (const section of providerSections) {
    sectionMap.set(section.provider.slug, section);
  }

  // Add dynamic sections (will override static if same provider)
  for (const section of dynamicProviderSections) {
    sectionMap.set(section.provider.slug, section);
  }

  const mergedProviderSections = Array.from(sectionMap.values());

  // Get all active providers with content count from database
  const allProviders = await getActiveProviders().catch(() => []);

  // Map to ProviderInfo type
  const providersInfo: ProviderInfo[] = allProviders.map(p => ({
    slug: p.slug,
    name: p.name,
    contentCount: p.dramaCount,
    isNew: false,
  }));
  for (const provider of [
    { ...dramaBoxProvider, dramaCount: dramaBoxDramas.length },
    { ...shortMaxProvider, dramaCount: shortMaxDramas.length },
  ]) {
    if (!providersInfo.some((item) => item.slug === provider.slug)) {
      providersInfo.push({ slug: provider.slug, name: provider.name, contentCount: provider.dramaCount, isNew: true });
    }
  }
  for (const item of sansekaiCatalogs) {
    if (!item.dramas.length) continue;
    const info = sansekaiProviderInfo(item.provider, item.dramas.length);
    const existing = providersInfo.find((provider) => provider.slug === info.slug);
    if (existing) Object.assign(existing, info);
    else providersInfo.push(info);
  }
  // Only advertise providers whose current catalog IDs pass detail → episodes → playback.
  const playableProviders = new Set(['dramabox', 'shortmax']);
  const activeSlugs = new Set(providerResults.filter((result) => result.dramas.length > 0 && playableProviders.has(result.provider)).map((result) => result.provider));
  const visibleProviders = providersInfo.filter((provider) => playableProviders.has(provider.slug) && (provider.contentCount > 0 || activeSlugs.has(provider.slug)));

  // Ensure every active provider appears on homepage sections
  const mergedSectionMap = new Map(
    mergedProviderSections.map((section) => [section.provider.slug, section])
  );

  const completeProviderSections = visibleProviders.map((provider) => {
    const existing = mergedSectionMap.get(provider.slug);
    if (existing) {
      return {
        ...existing,
        provider: {
          ...existing.provider,
          contentCount: provider.contentCount,
        },
      };
    }

    return {
      provider: {
        slug: provider.slug,
        name: provider.name,
        contentCount: provider.contentCount,
      },
      dramas: [],
      totalCount: 0,
    };
  });

  return {
    featured,
    continueWatching,
    forYou: forYou.length > 0 ? forYou : directRecommended,
    trending: trending.length > 0 ? trending : [...directTrending, ...directShortMax].slice(0, 20).map((drama, index) => ({ ...drama, rank: index + 1 })),
    newReleases,
    providerSections: completeProviderSections,
    genres,
    providers: visibleProviders,
  };
}

// Cached data fetchers
async function getCachedFeatured() {
  const cache = getCacheManager();
  const cacheKey = 'home:featured:v1';
  const cached = await cache.get<HomeResponseData['featured']>(cacheKey);
  if (cached) return cached;

  const data = await getFeaturedDramas(5);
  await cache.set(cacheKey, data, CACHE_TTL.FEATURED);
  return data;
}

async function getCachedTrending() {
  const cache = getCacheManager();
  const cacheKey = 'home:trending:v1';
  const cached = await cache.get<HomeResponseData['trending']>(cacheKey);
  if (cached) return cached;

  const data = await getTrendingDramas(10);
  await cache.set(cacheKey, data, CACHE_TTL.TRENDING);
  return data;
}

async function getCachedNewReleases() {
  const cache = getCacheManager();
  const cacheKey = 'home:new_releases:v1';
  const cached = await cache.get<DbDrama[]>(cacheKey);
  if (cached) return cached;

  const data = await getNewReleases(20);
  await cache.set(cacheKey, data, CACHE_TTL.NEW_RELEASES);
  return data;
}

// Group new releases by time period
function groupNewReleases(dramas: DbDrama[]): NewReleaseGroup[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const groups: NewReleaseGroup[] = [
    { period: 'today', label: 'Hari Ini', dramas: [] },
    { period: 'yesterday', label: 'Kemarin', dramas: [] },
    { period: 'this_week', label: 'Minggu Ini', dramas: [] },
  ];

  for (const drama of dramas) {
    const createdAt = new Date(drama.created_at);
    const card: DramaCard = {
      id: drama.id,
      providerSlug: drama.provider_slug,
      providerDramaId: drama.provider_drama_id,
      title: drama.title,
      coverUrl: drama.cover_url,
      episodeCount: drama.episode_count,
      rating: Number(drama.popularity_score) || 0,
      tags: drama.tags || [],
      isPremium: drama.is_premium,
      providerName: drama.providers?.name || drama.provider_slug,
      vipLevel: 'VIP9',
    };

    if (createdAt >= today) {
      groups[0].dramas.push(card);
    } else if (createdAt >= yesterday) {
      groups[1].dramas.push(card);
    } else if (createdAt >= weekAgo) {
      groups[2].dramas.push(card);
    }
  }

  // Only return groups that have dramas
  return groups.filter(g => g.dramas.length > 0);
}

// Get continue watching for user
async function getContinueWatching(userId: string): Promise<ContinueWatchingItem[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('watch_history')
    .select(`
      drama_id,
      episode_number,
      progress_percent,
      updated_at,
      dramas:drama_id (
        title,
        cover_url,
        provider_slug,
        providers!inner(name)
      ),
      episodes:episode_id (
        title,
        duration_ms
      )
    `)
    .eq('user_id', userId)
    .lt('progress_percent', 95)
    .order('updated_at', { ascending: false })
    .limit(6);

  if (error || !data) {
    return [];
  }

  return data.map((item: Record<string, unknown>) => {
    const drama = item.dramas as Record<string, unknown>;
    const episode = item.episodes as Record<string, unknown> || {};
    const durationMs = (episode.duration_ms as number) || 0;
    const progressPercent = (item.progress_percent as number) || 0;

    return {
      dramaId: item.drama_id as string,
      dramaTitle: drama.title as string,
      episodeId: item.episode_id as string,
      episodeNumber: item.episode_number as number,
      episodeTitle: episode.title as string,
      progressPercent,
      progressSeconds: (durationMs * progressPercent) / 100 / 1000,
      remainingSeconds: (durationMs * (100 - progressPercent)) / 100 / 1000,
      durationMs,
      coverUrl: drama.cover_url as string,
      provider: (drama.providers as { name: string })?.name || drama.provider_slug as string,
      providerSlug: drama.provider_slug as string,
      lastWatchedAt: item.updated_at as string,
    };
  });
}

// Get genres with sample posters
async function getGenres(): Promise<GenreData[]> {
  const supabase = getSupabaseClient();

  const { data: dramas, error } = await supabase
    .from('dramas')
    .select('genres, cover_url')
    .not('genres', 'is', null)
    .limit(500);

  if (error || !dramas) {
    return getDefaultGenres();
  }

  const genreMap = new Map<string, { count: number; posters: string[] }>();

  for (const drama of dramas) {
    const genres = (drama.genres || []) as string[];
    for (const genre of genres) {
      const existing = genreMap.get(genre);
      if (existing) {
        existing.count++;
        if (existing.posters.length < 3 && drama.cover_url) {
          existing.posters.push(drama.cover_url);
        }
      } else {
        genreMap.set(genre, {
          count: 1,
          posters: drama.cover_url ? [drama.cover_url] : [],
        });
      }
    }
  }

  const genreColors: Record<string, string> = {
    'Romance': '#f472b6',
    'Action': '#ef4444',
    'Comedy': '#fbbf24',
    'Drama': '#8b5cf6',
    'Thriller': '#374151',
    'Fantasy': '#a78bfa',
    'Mystery': '#6366f1',
    'Family': '#22c55e',
  };

  return Array.from(genreMap.entries())
    .map(([name, data]) => ({
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      posterUrls: data.posters,
      dramaCount: data.count,
      color: genreColors[name] || '#6b7280',
    }))
    .sort((a, b) => b.dramaCount - a.dramaCount)
    .slice(0, 8);
}

function getDefaultGenres(): GenreData[] {
  return [
    { id: 'romance', name: 'Romance', posterUrls: [], dramaCount: 0, color: '#f472b6' },
    { id: 'action', name: 'Action', posterUrls: [], dramaCount: 0, color: '#ef4444' },
    { id: 'comedy', name: 'Comedy', posterUrls: [], dramaCount: 0, color: '#fbbf24' },
    { id: 'drama', name: 'Drama', posterUrls: [], dramaCount: 0, color: '#8b5cf6' },
    { id: 'thriller', name: 'Thriller', posterUrls: [], dramaCount: 0, color: '#374151' },
    { id: 'fantasy', name: 'Fantasy', posterUrls: [], dramaCount: 0, color: '#a78bfa' },
  ];
}

// Build provider sections from aggregation results
function buildProviderSectionsFromResults(
  results: Awaited<ReturnType<typeof fetchHomeFromProviders>>
): { provider: { slug: string; name: string; contentCount: number }; dramas: DramaCard[]; totalCount: number }[] {
  const sections: { provider: { slug: string; name: string; contentCount: number }; dramas: DramaCard[]; totalCount: number }[] = [];

  for (const result of results) {
    if (result.success && result.dramas.length > 0) {
      // Deduplicate dramas by ID within this provider
      const seenIds = new Set<string>();
      const uniqueDramas = result.dramas.filter(drama => {
        if (seenIds.has(drama.id)) {
          return false;
        }
        seenIds.add(drama.id);
        return true;
      });

      sections.push({
        provider: {
          slug: result.provider,
          name: result.providerName,
          contentCount: uniqueDramas.length,
        },
        dramas: uniqueDramas.slice(0, 10), // Limit to 10 per section
        totalCount: uniqueDramas.length,
      });
    }
  }

  return sections;
}
