import { getSupabaseClient } from '../lib/db/client';
import { providerCatalog } from '../lib/providers/catalog';
import { getAdapter } from '../lib/providers/adapters';
import { createCaptainClient } from '../lib/http/captain-client';
import { getRateLimiter } from '../lib/rate-limit/upstash';
import { logger } from '../lib/observability/logger';
import { getServerEnv, preflightEnvCheck } from '../lib/config/env';
import type { DramaCard, DramaDetail } from '../lib/types';

type SyncIntent = 'home' | 'search' | 'detail';

interface SyncCandidate {
  intent: SyncIntent;
  url: string;
}

// Initialize captain client lazily to allow env validation first
let captainClientInstance: ReturnType<typeof createCaptainClient> | null = null;

function getCaptainClient() {
  if (!captainClientInstance) {
    const env = getServerEnv();
    captainClientInstance = createCaptainClient(env.CAPTAIN_API_TOKEN);
  }
  return captainClientInstance;
}

export async function syncHomeDramas(): Promise<void> {
  const supabase = getSupabaseClient();
  const limiter = getRateLimiter();

  const defaultHomeParams: Record<string, Record<string, string>> = {
    flextv: { name: 'Fokus' },
  };

  const defaultSearchParams: Record<string, Record<string, string>> = {
    dramanova: { q: 'love', query: 'love', keyword: 'love', page: '1' },
  };

  const toCardFromDetail = (detail: DramaDetail): DramaCard => ({
    id: detail.id,
    providerSlug: detail.providerSlug,
    providerDramaId: detail.providerDramaId,
    title: detail.title,
    coverUrl: detail.coverUrl,
    episodeCount: detail.episodeCount,
    rating: detail.popularityScore,
    tags: detail.tags,
    isPremium: detail.isPremium,
    providerName: detail.providerName,
    vipLevel: detail.vipLevel,
  });

  try {
    // Get ALL active providers (no longer limited to 10)
    const allActive = providerCatalog.getActiveProviders().filter(p => p.status === 'active');

    // Prioritize providers that have registered adapters
    const withAdapters = allActive.filter(p => getAdapter(p.slug));
    const withoutAdapters = allActive.filter(p => !getAdapter(p.slug));
    const activeProviders = [...withAdapters, ...withoutAdapters];

    logger.info('sync_home_providers_selected', {
      total: allActive.length,
      withAdapters: withAdapters.map(p => p.slug),
      selected: activeProviders.map(p => p.slug),
    });

    for (const provider of activeProviders) {
      const limitCheck = await limiter.checkBoth(provider.slug);
      if (!limitCheck.global.success || !limitCheck.provider.success) {
        logger.warn('sync_home_rate_limited', { provider: provider.slug });
        continue;
      }

      const adapter = getAdapter(provider.slug);
      if (!adapter) {
        logger.warn('sync_home_no_adapter', { provider: provider.slug });
        continue;
      }

      const candidates: SyncCandidate[] = [];

      const homeResolved = providerCatalog.resolveEndpoint(
        provider.slug,
        'home',
        defaultHomeParams[provider.slug] || {}
      );
      if (homeResolved) {
        candidates.push({ intent: 'home', url: homeResolved.url });
      }

      const searchResolved = providerCatalog.resolveEndpoint(
        provider.slug,
        'search',
        defaultSearchParams[provider.slug] || { q: 'love', query: 'love', keyword: 'love', page: '1' }
      );
      if (searchResolved) {
        candidates.push({ intent: 'search', url: searchResolved.url });
      }

      let dramas: DramaCard[] = [];

      for (const candidate of candidates) {
        try {
          const response = await getCaptainClient().get(candidate.url, {
            provider: provider.slug,
            requestId: `sync-home-${provider.slug}-${Date.now()}`,
            timeout: 12000,
          });

          if (candidate.intent === 'home') {
            dramas = adapter.mapHome(response.data);
          } else if (candidate.intent === 'search') {
            dramas = adapter.mapSearch(response.data);
          }

          if (dramas.length > 0) {
            logger.info('sync_home_source_success', {
              provider: provider.slug,
              intent: candidate.intent,
              count: dramas.length,
            });
            break;
          }
        } catch (err) {
          logger.warn('sync_home_source_failed', {
            provider: provider.slug,
            intent: candidate.intent,
            error: err instanceof Error ? err.message : 'Unknown',
          });
        }
      }

      // As a final fallback, try seeding details from up to 10 search/home cards and map details
      if (dramas.length > 0) {
        const seeded = dramas.slice(0, 50);
        for (const drama of seeded) {
          const { error } = await supabase
            .from('dramas')
            .upsert({
              provider_slug: drama.providerSlug,
              provider_drama_id: drama.providerDramaId,
              title: drama.title,
              cover_url: drama.coverUrl,
              episode_count: drama.episodeCount,
              is_premium: drama.isPremium,
              popularity_score: drama.rating || 0,
              last_synced_at: new Date().toISOString(),
            }, {
              onConflict: 'provider_slug,provider_drama_id',
            });

          if (error) {
            logger.error('sync_home_drama_failed', {
              provider: provider.slug,
              dramaId: drama.providerDramaId,
              error: error.message,
            });
          }
        }
      }

      logger.info('sync_home_provider_completed', {
        provider: provider.slug,
        count: dramas.length,
      });
    }

    logger.info('sync_home_completed', {
      providerCount: activeProviders.length,
    });
  } catch (error) {
    logger.error('sync_home_failed', {
      error: error instanceof Error ? error.message : 'Unknown',
    });
  }
}

if (require.main === module) {
  // Preflight env validation - fail fast with clear errors
  const preflight = preflightEnvCheck();
  if (!preflight.success) {
    console.error('Environment validation failed:');
    preflight.errors.forEach(err => console.error(`  - ${err}`));
    process.exit(1);
  }

  syncHomeDramas().catch(console.error);
}
