import { getSupabaseClient } from '../lib/db/client';
import { getDramaByProviderId } from '../lib/db/dramas';
import { providerCatalog } from '../lib/providers/catalog';
import { getAdapter } from '../lib/providers/adapters';
import { createCaptainClient } from '../lib/http/captain-client';
import { getRateLimiter } from '../lib/rate-limit/upstash';
import { logger } from '../lib/observability/logger';
import { getServerEnv, preflightEnvCheck } from '../lib/config/env';
import type { EpisodeItem } from '../lib/types';

// Initialize captain client lazily to allow env validation first
let captainClientInstance: ReturnType<typeof createCaptainClient> | null = null;

function getCaptainClient() {
  if (!captainClientInstance) {
    const env = getServerEnv();
    captainClientInstance = createCaptainClient(env.CAPTAIN_API_TOKEN);
  }
  return captainClientInstance;
}

function unwrapCaptainPayload(payload: unknown): unknown {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return payload;
  }

  const raw = payload as Record<string, unknown>;
  const hasData = raw.data !== undefined;
  const isWrapper = hasData && (
    raw.success !== undefined
    || raw.code !== undefined
    || raw.cached !== undefined
    || raw.status !== undefined
    || raw.message !== undefined
  );

  return isWrapper ? raw.data : payload;
}

function extractEpisodesPayload(payload: unknown, intent: string): unknown {
  const unwrapped = unwrapCaptainPayload(payload);

  if (!unwrapped || typeof unwrapped !== 'object' || Array.isArray(unwrapped)) {
    return unwrapped;
  }

  const root = unwrapped as Record<string, unknown>;

  // Fix: Return array directly, not root object
  if (Array.isArray(root.episodes)) return root.episodes;
  if (Array.isArray(root.chapters)) return root.chapters;
  if (Array.isArray(root.list)) return root.list;


  if (intent === 'detail') {
    const detailNodes = [root.drama, root.detail, root.book, root.series, root.data];

    for (const node of detailNodes) {
      if (!node || typeof node !== 'object' || Array.isArray(node)) continue;
      const record = node as Record<string, unknown>;
      const nested = record.episodes || record.chapters || record.list || record.chapter_list;
      if (Array.isArray(nested)) {
        return nested;
      }
    }
  }

  return unwrapped;
}

export async function syncEpisodes(
  providerSlug: string,
  providerDramaId: string
): Promise<void> {
  const supabase = getSupabaseClient();
  const limiter = getRateLimiter();

  try {
    const limitCheck = await limiter.checkBoth(providerSlug);
    if (!limitCheck.global.success || !limitCheck.provider.success) {
      logger.warn('sync_episodes_rate_limited', { provider: providerSlug, dramaId: providerDramaId });
      return;
    }

    const endpointParams = {
      id: providerDramaId,
      code: providerDramaId,
      bookId: providerDramaId,
      dramaId: providerDramaId,
      seriesId: providerDramaId,
      series_id: providerDramaId,
      vid: providerDramaId,
      programId: providerDramaId,
      seasonId: providerDramaId,
      slug: providerDramaId,
    };

    let resolved = providerCatalog.resolveEndpoint(providerSlug, 'episodes', endpointParams);

    if (!resolved) {
      for (const fallback of ['detail', 'playback'] as const) {
        resolved = providerCatalog.resolveEndpoint(providerSlug, fallback, endpointParams);

        if (resolved) {
          logger.info('sync_episodes_fallback_intent', { provider: providerSlug, fallback });
          break;
        }
      }
    }

    if (!resolved) {
      logger.warn('sync_episodes_no_endpoint', { provider: providerSlug, dramaId: providerDramaId });
      return;
    }

    logger.info('sync_episodes_endpoint_selected', {
      provider: providerSlug,
      dramaId: providerDramaId,
      endpointPath: resolved.endpoint.path,
      endpointPathParams: resolved.endpoint.pathParams,
      missingParams: resolved.missingParams,
      resolvedUrl: resolved.url,
    });

    if (resolved.missingParams.length > 0) {
      logger.error('sync_episodes_endpoint_missing_params', {
        provider: providerSlug,
        dramaId: providerDramaId,
        endpointPath: resolved.endpoint.path,
        missingParams: resolved.missingParams,
      });
    }

    const response = await getCaptainClient().get(resolved.url, {
      provider: providerSlug,
      requestId: `sync-ep-${Date.now()}`,
    });

    const adapter = getAdapter(providerSlug);
    if (!adapter) {
      logger.warn('sync_episodes_no_adapter', { provider: providerSlug });
      return;
    }

    const episodesPayload = extractEpisodesPayload(response.data, resolved.intent);
    const episodes: EpisodeItem[] = adapter.mapEpisodes(episodesPayload);

    logger.info('sync_episodes_payload_mapped', {
      provider: providerSlug,
      dramaId: providerDramaId,
      intent: resolved.intent,
      endpointPath: resolved.endpoint.path,
      rawType: typeof response.data,
      rawKeys:
        response.data && typeof response.data === 'object'
          ? Object.keys(response.data as Record<string, unknown>).slice(0, 10)
          : [],
      extractedType: typeof episodesPayload,
      extractedKeys:
        episodesPayload && typeof episodesPayload === 'object' && !Array.isArray(episodesPayload)
          ? Object.keys(episodesPayload as Record<string, unknown>).slice(0, 10)
          : [],
      extractedIsArray: Array.isArray(episodesPayload),
      mappedCount: episodes.length,
    });

    const drama = await getDramaByProviderId(providerSlug, providerDramaId);
    if (!drama) {
      logger.warn('sync_episodes_drama_not_found', { provider: providerSlug, dramaId: providerDramaId });
      return;
    }

    const upsertPayload = episodes.map(episode => ({
      drama_id: drama.id,
      provider_slug: providerSlug,
      provider_episode_id: episode.providerEpisodeId,
      episode_no: episode.episodeNo,
      chapter_id: episode.chapterId,
      slug: episode.slug,
      title: episode.title,
      duration_ms: episode.durationMs,
      is_locked: episode.isLocked,
      last_synced_at: new Date().toISOString(),
    }));

    if (upsertPayload.length > 0) {
      const { error } = await supabase
        .from('episodes')
        .upsert(upsertPayload, {
          onConflict: 'drama_id,episode_no',
        });

      if (error) {
        const requiresFallback = /no unique or exclusion constraint matching the ON CONFLICT specification/i.test(error.message);

        logger.error('sync_episodes_bulk_failed', {
          provider: providerSlug,
          dramaId: providerDramaId,
          error: error.message,
          requiresFallback,
        });

        if (requiresFallback) {
          logger.warn('sync_episodes_bulk_fallback_replace_started', {
            provider: providerSlug,
            dramaId: providerDramaId,
            count: upsertPayload.length,
          });

          const { error: deleteError } = await supabase
            .from('episodes')
            .delete()
            .eq('drama_id', drama.id)
            .eq('provider_slug', providerSlug);

          if (deleteError) {
            logger.error('sync_episodes_bulk_fallback_delete_failed', {
              provider: providerSlug,
              dramaId: providerDramaId,
              error: deleteError.message,
            });
          } else {
            const { error: insertError } = await supabase
              .from('episodes')
              .insert(upsertPayload);

            if (insertError) {
              logger.error('sync_episodes_bulk_fallback_insert_failed', {
                provider: providerSlug,
                dramaId: providerDramaId,
                error: insertError.message,
              });
            } else {
              logger.info('sync_episodes_bulk_fallback_replace_completed', {
                provider: providerSlug,
                dramaId: providerDramaId,
                count: upsertPayload.length,
              });
            }
          }
        }
      }
    }

    logger.info('sync_episodes_completed', {
      provider: providerSlug,
      dramaId: providerDramaId,
      count: episodes.length,
    });
  } catch (error) {
    logger.error('sync_episodes_failed', {
      provider: providerSlug,
      dramaId: providerDramaId,
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

  const [provider, dramaId] = process.argv.slice(2);
  if (!provider || !dramaId) {
    console.error('Usage: ts-node sync-episodes.ts <provider> <dramaId>');
    process.exit(1);
  }
  syncEpisodes(provider, dramaId).catch(console.error);
}
