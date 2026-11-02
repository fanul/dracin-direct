import { NextResponse } from 'next/server';
import { getEpisodesByDramaId, getDramaById, getDramaByProviderId } from '@/lib/db/dramas';
import { getEpisodesWithFallback } from '@/lib/services/episode-sync';
import { syncDramaFromProvider } from '@/lib/services/drama-sync';
import { syncEpisodes } from '@/jobs/sync-episodes';
import { logger, generateRequestId } from '@/lib/observability/logger';
import { validatePathParams, dramaDetailPathSchema } from '@/lib/validation/schemas';
import type { ApiResponse, EpisodeItem } from '@/lib/types';
import { fetchDramaBoxEpisodes, fetchShortMaxEpisodes } from '@/lib/providers/dramabox';

export const dynamic = 'force-dynamic';

// Handle OPTIONS for CORS preflight
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, { status: 204 });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const startTime = Date.now();

  // Validate path parameters
  const validation = await validatePathParams(params, dramaDetailPathSchema);

  if (!validation.success) {
    const response: ApiResponse<null> = {
      data: null,
      meta: { requestId, timestamp: new Date().toISOString() },
      error: validation.error,
    };
    return NextResponse.json(response, { status: 400 });
  }

  const { id: rawId } = validation.data;

  const normalizedId = (() => {
    try {
      return decodeURIComponent(rawId);
    } catch {
      return rawId;
    }
  })();

  try {
    if (normalizedId.startsWith('dramabox:') || normalizedId.startsWith('shortmax:')) {
      const isDramaBox = normalizedId.startsWith('dramabox:');
      const slug = normalizedId.slice((isDramaBox ? 'dramabox:' : 'shortmax:').length);
      const episodes = await (isDramaBox ? fetchDramaBoxEpisodes(slug) : fetchShortMaxEpisodes(slug));
      return NextResponse.json({ data: episodes, meta: { requestId, timestamp: new Date().toISOString(), pagination: { page: 1, pageSize: episodes.length, total: episodes.length } }, error: null } satisfies ApiResponse<EpisodeItem[]>);
    }

    let drama = await getDramaById(normalizedId);

    if (!drama && normalizedId.includes(':')) {
      const [providerSlug, ...dramaIdParts] = normalizedId.split(':');
      const providerDramaId = dramaIdParts.join(':');

      if (providerSlug && providerDramaId) {
        drama = await getDramaByProviderId(providerSlug, providerDramaId);

        // If drama not found in DB, try to sync from provider API
        if (!drama) {
          logger.info('drama_not_in_db_attempting_sync', {
            requestId,
            provider: providerSlug,
            providerDramaId,
          });

          drama = await syncDramaFromProvider(providerSlug, providerDramaId, requestId);
        }
      }
    }

    if (!drama) {
      const response: ApiResponse<null> = {
        data: null,
        meta: { requestId, timestamp: new Date().toISOString() },
        error: {
          code: 'NOT_FOUND',
          message: `Drama with id ${normalizedId} not found`,
        },
      };

      return NextResponse.json(response, { status: 404 });
    }

    let episodes: EpisodeItem[] = [];

    const isEpisodeUsable = (episode: EpisodeItem): boolean => {
      const hasEpisodeNo = Number.isFinite(episode.episodeNo);
      const hasProviderEpisodeRef = Boolean(episode.chapterId || episode.providerEpisodeId);
      return hasEpisodeNo && hasProviderEpisodeRef;
    };

    // Try to get episodes from DB first
    const dbEpisodes = await getEpisodesByDramaId(drama.id);
    const usableCount = dbEpisodes.filter(isEpisodeUsable).length;
    const hasCorruptedEpisodeRows = dbEpisodes.length > 0 && usableCount === 0;

    const expectedEpisodeCount = Math.max(1, drama.episodeCount || 0);
    const requiresNetshortResync = drama.providerSlug === 'netshort'
      && (hasCorruptedEpisodeRows || dbEpisodes.length < expectedEpisodeCount);

    if (requiresNetshortResync) {
      logger.info('episodes_netshort_resync_forced', {
        requestId,
        requestedDramaId: normalizedId,
        dramaId: drama.id,
        provider: drama.providerSlug,
        providerDramaId: drama.providerDramaId,
        dbCount: dbEpisodes.length,
        expectedEpisodeCount,
      });

      await syncEpisodes(drama.providerSlug, drama.providerDramaId);

      const refreshedEpisodes = await getEpisodesByDramaId(drama.id);
      if (refreshedEpisodes.length > 0) {
        episodes = refreshedEpisodes;
      }
    }

    if (episodes.length === 0) {
      if (dbEpisodes.length > 0 && !hasCorruptedEpisodeRows && !requiresNetshortResync) {
        episodes = dbEpisodes;
      } else {
        // Use fallback to provider API with auto-sync
        logger.info('episodes_fallback_to_provider', {
          requestId,
          requestedDramaId: normalizedId,
          dramaId: drama.id,
          provider: drama.providerSlug,
          providerDramaId: drama.providerDramaId,
          reason: dbEpisodes.length === 0
            ? 'empty'
            : (hasCorruptedEpisodeRows ? 'corrupted_rows' : 'forced_resync_empty'),
        });

        episodes = await getEpisodesWithFallback(
          drama.id,
          drama.providerSlug,
          drama.providerDramaId,
          requestId
        );
      }
    }

    const sanitizedEpisodes = episodes.filter(isEpisodeUsable);
    const dedupedEpisodes = (() => {
      const seen = new Set<string>();
      const unique: EpisodeItem[] = [];

      for (const episode of sanitizedEpisodes) {
        const identity = `${episode.episodeNo}:${episode.providerEpisodeId || ''}:${episode.chapterId || ''}`;
        if (seen.has(identity)) continue;
        seen.add(identity);
        unique.push(episode);
      }

      return unique.sort((a, b) => a.episodeNo - b.episodeNo);
    })();

    const normalizedEpisodes = drama.providerSlug === 'dramanova'
      ? dedupedEpisodes.map((episode) => ({ ...episode, isLocked: false }))
      : dedupedEpisodes;

    if (sanitizedEpisodes.length !== episodes.length) {
      logger.warn('episodes_filtered_invalid_rows', {
        requestId,
        requestedDramaId: normalizedId,
        dramaId: drama.id,
        beforeCount: episodes.length,
        afterCount: sanitizedEpisodes.length,
      });
    }

    const response: ApiResponse<EpisodeItem[]> = {
      data: normalizedEpisodes,
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
        pagination: {
          page: 1,
          pageSize: normalizedEpisodes.length,
          total: normalizedEpisodes.length,
        },
      },
      error: null,
    };

    logger.info('episodes_fetched', {
      requestId,
      requestedDramaId: normalizedId,
      dramaId: drama.id,
      count: normalizedEpisodes.length,
      latencyMs: Date.now() - startTime,
    });

    return NextResponse.json(response);
  } catch (error) {
    logger.error('episodes_fetch_failed', {
      requestId,
      dramaId: normalizedId,
      error: error instanceof Error ? error.message : 'Unknown error',
      latencyMs: Date.now() - startTime,
    });

    const response: ApiResponse<null> = {
      data: null,
      meta: { requestId, timestamp: new Date().toISOString() },
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch episodes',
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}
