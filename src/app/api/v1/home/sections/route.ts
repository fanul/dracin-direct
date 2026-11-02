import { NextResponse } from 'next/server';
import {
  getPaginatedForYouDramas,
  getPaginatedNewReleases,
  getPaginatedTrendingDramas,
} from '@/lib/db/dramas';
import { logger, generateRequestId } from '@/lib/observability/logger';
import { homeSectionQuerySchema, validateSearchParams } from '@/lib/validation/schemas';
import type { ApiResponse, HomeSectionResponse } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<NextResponse> {
  const requestId = generateRequestId();
  const startTime = Date.now();

  const { searchParams } = new URL(request.url);
  const validation = validateSearchParams(searchParams, homeSectionQuerySchema);

  if (!validation.success) {
    const response: ApiResponse<null> = {
      data: null,
      meta: { requestId, timestamp: new Date().toISOString() },
      error: validation.error,
    };
    return NextResponse.json(response, { status: 400 });
  }

  const { section, page, limit } = validation.data;

  try {
    let dramas: HomeSectionResponse['dramas'] = [];
    let total = 0;

    if (section === 'trending') {
      const result = await getPaginatedTrendingDramas(page, limit);
      dramas = result.dramas;
      total = result.total;
    } else if (section === 'for-you') {
      const result = await getPaginatedForYouDramas(page, limit);
      dramas = result.dramas;
      total = result.total;
    } else {
      const result = await getPaginatedNewReleases(page, limit);
      dramas = result.dramas;
      total = result.total;
    }

    const responseData: HomeSectionResponse = {
      section,
      dramas,
      pagination: {
        page,
        limit,
        total,
        hasMore: page * limit < total,
      },
    };

    const response: ApiResponse<HomeSectionResponse> = {
      data: responseData,
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
        pagination: {
          page,
          pageSize: limit,
          total,
        },
      },
      error: null,
    };

    logger.info('home_section_fetched', {
      requestId,
      section,
      page,
      limit,
      count: dramas.length,
      total,
      latencyMs: Date.now() - startTime,
    });

    return NextResponse.json(response);
  } catch (error) {
    logger.error('home_section_fetch_failed', {
      requestId,
      section,
      page,
      limit,
      error: error instanceof Error ? error.message : 'Unknown error',
      latencyMs: Date.now() - startTime,
    });

    const response: ApiResponse<null> = {
      data: null,
      meta: { requestId, timestamp: new Date().toISOString() },
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch home section',
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}
