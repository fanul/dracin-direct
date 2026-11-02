import { NextResponse } from 'next/server';
import { getDramaById, getDramaByProviderId, getRelatedDramas } from '@/lib/db/dramas';
import { upsertDramaFromProvider } from '@/lib/services/drama-upsert';
import { syncEpisodesFromProvider } from '@/lib/services/episode-sync';
import { logger, generateRequestId } from '@/lib/observability/logger';
import { validatePathParams, dramaDetailPathSchema } from '@/lib/validation/schemas';
import type { ApiResponse, DramaDetail, DramaCard } from '@/lib/types';
import { fetchDramaBoxDetail, fetchShortMaxDetail } from '@/lib/providers/dramabox';
import { fetchFlickReelsDetail, fetchFreeReelsDetail } from '@/lib/providers/sansekai-reels';
import { fetchSansekaiDetail, type SansekaiPlayableProvider } from '@/lib/providers/sansekai';

export interface DramaDetailResponse {
  drama: DramaDetail;
  related: DramaCard[];
}

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

  const { id } = validation.data;
  const normalizedId = (() => {
    try {
      return decodeURIComponent(id);
    } catch {
      return id;
    }
  })();

  try {
    if (normalizedId.startsWith('dramabox:')) {
      const drama = await fetchDramaBoxDetail(normalizedId.slice('dramabox:'.length));
      if (drama) return NextResponse.json({ data: { drama, related: [] }, meta: { requestId, timestamp: new Date().toISOString() }, error: null } satisfies ApiResponse<DramaDetailResponse>);
    }
    if (normalizedId.startsWith('shortmax:')) {
      const drama = await fetchShortMaxDetail(normalizedId.slice('shortmax:'.length));
      if (drama) return NextResponse.json({ data: { drama, related: [] }, meta: { requestId, timestamp: new Date().toISOString() }, error: null } satisfies ApiResponse<DramaDetailResponse>);
    }
    if (normalizedId.startsWith('flickreels:') || normalizedId.startsWith('freereels:')) {
      const flick = normalizedId.startsWith('flickreels:');
      const slug = normalizedId.slice((flick ? 'flickreels:' : 'freereels:').length);
      const drama = await (flick ? fetchFlickReelsDetail(slug) : fetchFreeReelsDetail(slug));
      if (drama) return NextResponse.json({ data: { drama, related: [] }, meta: { requestId, timestamp: new Date().toISOString() }, error: null } satisfies ApiResponse<DramaDetailResponse>);
    }
    const directProvider = ['pinedrama', 'goodshort', 'melolo', 'netshort', 'reelshort'].find((provider) => normalizedId.startsWith(`${provider}:`)) as SansekaiPlayableProvider | undefined;
    const directId = directProvider ? normalizedId.slice(directProvider.length + 1) : '';
    if (directProvider && /^\d+$/.test(directId)) {
      const drama = await fetchSansekaiDetail(directProvider, directId);
      if (drama) return NextResponse.json({ data: { drama, related: [] }, meta: { requestId, timestamp: new Date().toISOString() }, error: null } satisfies ApiResponse<DramaDetailResponse>);
    }

    let drama = await getDramaById(normalizedId);
    let providerSlug: string | undefined;
    let providerDramaId: string | undefined;

    // Parse provider:dramaId format
    if (!drama && normalizedId.includes(':')) {
      const [slug, ...dramaIdParts] = normalizedId.split(':');
      providerSlug = slug;
      providerDramaId = dramaIdParts.join(':');

      if (providerSlug && providerDramaId) {
        drama = await getDramaByProviderId(providerSlug, providerDramaId);
      }
    }

    // If not found in DB, try to fetch from provider API
    if (!drama && providerSlug && providerDramaId) {
      logger.info('drama_detail_fallback_to_provider', {
        requestId,
        provider: providerSlug,
        providerDramaId,
      });

      const upsertResult = await upsertDramaFromProvider(
        providerSlug,
        providerDramaId,
        requestId
      );

      if (upsertResult) {
        // Re-fetch from DB after upsert
        drama = await getDramaById(upsertResult.dramaId);

        // Sync episodes
        await syncEpisodesFromProvider(
          upsertResult.dramaId,
          providerSlug,
          providerDramaId,
          requestId
        );
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

    const related = await getRelatedDramas(drama.id, 8);

    const response: ApiResponse<DramaDetailResponse> = {
      data: {
        drama,
        related,
      },
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
      },
      error: null,
    };

    logger.info('drama_detail_fetched', {
      requestId,
      requestedDramaId: normalizedId,
      dramaId: drama.id,
      relatedCount: related.length,
      latencyMs: Date.now() - startTime,
    });

    return NextResponse.json(response);
  } catch (error) {
    logger.error('drama_detail_fetch_failed', {
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
        message: 'Failed to fetch drama details',
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}
