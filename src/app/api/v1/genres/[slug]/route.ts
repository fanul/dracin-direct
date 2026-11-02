import { NextResponse } from 'next/server';
import { getGenreBySlug, getDramasByGenre } from '@/lib/db/genres';
import { logger, generateRequestId } from '@/lib/observability/logger';
import type { ApiResponse, DramaCard } from '@/lib/types';

export interface GenreResponse {
    genre: {
        id: string;
        name: string;
        slug: string;
        description?: string;
        dramaCount: number;
    };
    dramas: DramaCard[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        hasMore: boolean;
    };
}

export const dynamic = 'force-dynamic';

// Handle OPTIONS for CORS preflight
export async function OPTIONS(): Promise<NextResponse> {
    return new NextResponse(null, { status: 204 });
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
    const requestId = generateRequestId();
    const startTime = Date.now();

    const { slug } = await params;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const sortBy = (searchParams.get('sortBy') as 'popular' | 'newest' | 'rating') || 'popular';
    const providerSlug = searchParams.get('provider') || undefined;

    try {
        // Get genre info
        const genre = await getGenreBySlug(slug);

        if (!genre) {
            const response: ApiResponse<null> = {
                data: null,
                meta: { requestId, timestamp: new Date().toISOString() },
                error: {
                    code: 'NOT_FOUND',
                    message: `Genre with slug ${slug} not found`,
                },
            };

            return NextResponse.json(response, { status: 404 });
        }

        // Get dramas for this genre
        const { dramas, total } = await getDramasByGenre(slug, page, limit, sortBy, providerSlug);

        const response: ApiResponse<GenreResponse> = {
            data: {
                genre: {
                    id: genre.id,
                    name: genre.name,
                    slug: genre.slug,
                    description: genre.description,
                    dramaCount: total,
                },
                dramas,
                pagination: {
                    page,
                    limit,
                    total,
                    hasMore: page * limit < total,
                },
            },
            meta: {
                requestId,
                timestamp: new Date().toISOString(),
            },
            error: null,
        };

        logger.info('genre_fetched', {
            requestId,
            slug,
            dramaCount: dramas.length,
            total,
            latencyMs: Date.now() - startTime,
        });

        return NextResponse.json(response);
    } catch (error) {
        logger.error('genre_fetch_failed', {
            requestId,
            slug,
            error: error instanceof Error ? error.message : 'Unknown error',
            latencyMs: Date.now() - startTime,
        });

        const response: ApiResponse<null> = {
            data: null,
            meta: { requestId, timestamp: new Date().toISOString() },
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to fetch genre',
            },
        };

        return NextResponse.json(response, { status: 500 });
    }
}
