import { NextResponse } from 'next/server';
import {
    getUserBookmarks,
    addBookmark,
    removeBookmark,
    clearAllBookmarks,
    isDramaBookmarked
} from '@/lib/db/bookmarks';
import { logger, generateRequestId } from '@/lib/observability/logger';
import type { ApiResponse, DramaCard } from '@/lib/types';

export interface BookmarksResponse {
    bookmarks: DramaCard[];
    total: number;
}

export const dynamic = 'force-dynamic';

// Handle OPTIONS for CORS preflight
export async function OPTIONS(): Promise<NextResponse> {
    return new NextResponse(null, { status: 204 });
}

// GET: Get all bookmarks for a user
export async function GET(request: Request): Promise<NextResponse> {
    const requestId = generateRequestId();
    const startTime = Date.now();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        const response: ApiResponse<null> = {
            data: null,
            meta: { requestId, timestamp: new Date().toISOString() },
            error: {
                code: 'BAD_REQUEST',
                message: 'Missing userId parameter',
            },
        };
        return NextResponse.json(response, { status: 400 });
    }

    try {
        if (userId === 'guest') {
            const response: ApiResponse<BookmarksResponse> = {
                data: {
                    bookmarks: [],
                    total: 0,
                },
                meta: {
                    requestId,
                    timestamp: new Date().toISOString(),
                },
                error: null,
            };

            logger.info('bookmarks_guest_fallback', {
                requestId,
                userId,
                latencyMs: Date.now() - startTime,
            });

            return NextResponse.json(response);
        }

        const bookmarks = await getUserBookmarks(userId);

        const response: ApiResponse<BookmarksResponse> = {
            data: {
                bookmarks,
                total: bookmarks.length,
            },
            meta: {
                requestId,
                timestamp: new Date().toISOString(),
            },
            error: null,
        };

        logger.info('bookmarks_fetched', {
            requestId,
            userId,
            count: bookmarks.length,
            latencyMs: Date.now() - startTime,
        });

        return NextResponse.json(response);
    } catch (error) {
        logger.error('bookmarks_fetch_failed', {
            requestId,
            userId,
            error: error instanceof Error ? error.message : 'Unknown error',
            latencyMs: Date.now() - startTime,
        });

        const response: ApiResponse<null> = {
            data: null,
            meta: { requestId, timestamp: new Date().toISOString() },
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to fetch bookmarks',
            },
        };

        return NextResponse.json(response, { status: 500 });
    }
}

// POST: Add a bookmark
export async function POST(request: Request): Promise<NextResponse> {
    const requestId = generateRequestId();
    const startTime = Date.now();

    try {
        const body = await request.json();
        const { userId, dramaId } = body;

        if (!userId || !dramaId) {
            const response: ApiResponse<null> = {
                data: null,
                meta: { requestId, timestamp: new Date().toISOString() },
                error: {
                    code: 'BAD_REQUEST',
                    message: 'Missing userId or dramaId parameter',
                },
            };
            return NextResponse.json(response, { status: 400 });
        }

        if (userId === 'guest') {
            logger.info('bookmark_guest_add_fallback', {
                requestId,
                userId,
                dramaId,
                latencyMs: Date.now() - startTime,
            });

            const response: ApiResponse<{ added: boolean }> = {
                data: { added: true },
                meta: {
                    requestId,
                    timestamp: new Date().toISOString(),
                },
                error: null,
            };

            return NextResponse.json(response);
        }

        await addBookmark(userId, dramaId);

        logger.info('bookmark_added', {
            requestId,
            userId,
            dramaId,
            latencyMs: Date.now() - startTime,
        });

        const response: ApiResponse<{ added: boolean }> = {
            data: { added: true },
            meta: {
                requestId,
                timestamp: new Date().toISOString(),
            },
            error: null,
        };

        return NextResponse.json(response);
    } catch (error) {
        logger.error('bookmark_add_failed', {
            requestId,
            error: error instanceof Error ? error.message : 'Unknown error',
            latencyMs: Date.now() - startTime,
        });

        const response: ApiResponse<null> = {
            data: null,
            meta: { requestId, timestamp: new Date().toISOString() },
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to add bookmark',
            },
        };

        return NextResponse.json(response, { status: 500 });
    }
}

// DELETE: Remove a bookmark or clear all
export async function DELETE(request: Request): Promise<NextResponse> {
    const requestId = generateRequestId();
    const startTime = Date.now();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const dramaId = searchParams.get('dramaId');
    const clearAll = searchParams.get('clearAll') === 'true';

    if (!userId) {
        const response: ApiResponse<null> = {
            data: null,
            meta: { requestId, timestamp: new Date().toISOString() },
            error: {
                code: 'BAD_REQUEST',
                message: 'Missing userId parameter',
            },
        };
        return NextResponse.json(response, { status: 400 });
    }

    try {
        if (userId === 'guest') {
            const response: ApiResponse<{ cleared?: boolean; removed?: boolean }> = {
                data: clearAll ? { cleared: true } : { removed: true },
                meta: {
                    requestId,
                    timestamp: new Date().toISOString(),
                },
                error: null,
            };

            logger.info('bookmark_guest_delete_fallback', {
                requestId,
                userId,
                dramaId,
                clearAll,
                latencyMs: Date.now() - startTime,
            });

            return NextResponse.json(response);
        }

        if (clearAll) {
            await clearAllBookmarks(userId);

            logger.info('bookmarks_cleared', {
                requestId,
                userId,
                latencyMs: Date.now() - startTime,
            });

            const response: ApiResponse<{ cleared: boolean }> = {
                data: { cleared: true },
                meta: {
                    requestId,
                    timestamp: new Date().toISOString(),
                },
                error: null,
            };

            return NextResponse.json(response);
        } else if (dramaId) {
            await removeBookmark(userId, dramaId);

            logger.info('bookmark_removed', {
                requestId,
                userId,
                dramaId,
                latencyMs: Date.now() - startTime,
            });

            const response: ApiResponse<{ removed: boolean }> = {
                data: { removed: true },
                meta: {
                    requestId,
                    timestamp: new Date().toISOString(),
                },
                error: null,
            };

            return NextResponse.json(response);
        } else {
            const response: ApiResponse<null> = {
                data: null,
                meta: { requestId, timestamp: new Date().toISOString() },
                error: {
                    code: 'BAD_REQUEST',
                    message: 'Missing dramaId parameter or clearAll flag',
                },
            };
            return NextResponse.json(response, { status: 400 });
        }
    } catch (error) {
        logger.error('bookmark_delete_failed', {
            requestId,
            userId,
            dramaId,
            clearAll,
            error: error instanceof Error ? error.message : 'Unknown error',
            latencyMs: Date.now() - startTime,
        });

        const response: ApiResponse<null> = {
            data: null,
            meta: { requestId, timestamp: new Date().toISOString() },
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to delete bookmark',
            },
        };

        return NextResponse.json(response, { status: 500 });
    }
}
