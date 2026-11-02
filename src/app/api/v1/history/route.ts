import { NextResponse } from 'next/server';
import { getWatchHistory, deleteWatchHistoryEntry, clearAllWatchHistory, type GroupedHistory } from '@/lib/db/watch-history';
import { logger, generateRequestId } from '@/lib/observability/logger';
import type { ApiResponse } from '@/lib/types';

export interface HistoryResponse {
    history: GroupedHistory;
}

export const dynamic = 'force-dynamic';

// Handle OPTIONS for CORS preflight
export async function OPTIONS(): Promise<NextResponse> {
    return new NextResponse(null, { status: 204 });
}

// GET: Get watch history for a user
export async function GET(request: Request): Promise<NextResponse> {
    const requestId = generateRequestId();
    const startTime = Date.now();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '100', 10);

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
            const response: ApiResponse<HistoryResponse> = {
                data: {
                    history: {
                        today: [],
                        yesterday: [],
                        lastWeek: [],
                        lastMonth: [],
                        older: [],
                    },
                },
                meta: {
                    requestId,
                    timestamp: new Date().toISOString(),
                },
                error: null,
            };

            logger.info('history_guest_fallback', {
                requestId,
                userId,
                latencyMs: Date.now() - startTime,
            });

            return NextResponse.json(response);
        }

        const history = await getWatchHistory(userId, limit);

        const response: ApiResponse<HistoryResponse> = {
            data: { history },
            meta: {
                requestId,
                timestamp: new Date().toISOString(),
            },
            error: null,
        };

        const totalCount = history.today.length + history.yesterday.length +
            history.lastWeek.length + history.lastMonth.length + history.older.length;

        logger.info('history_fetched', {
            requestId,
            userId,
            totalCount,
            latencyMs: Date.now() - startTime,
        });

        return NextResponse.json(response);
    } catch (error) {
        logger.error('history_fetch_failed', {
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
                message: 'Failed to fetch watch history',
            },
        };

        return NextResponse.json(response, { status: 500 });
    }
}

// DELETE: Delete a specific history entry or clear all
export async function DELETE(request: Request): Promise<NextResponse> {
    const requestId = generateRequestId();
    const startTime = Date.now();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const historyId = searchParams.get('historyId');
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
            const response: ApiResponse<{ cleared?: boolean; deleted?: boolean }> = {
                data: clearAll ? { cleared: true } : { deleted: true },
                meta: {
                    requestId,
                    timestamp: new Date().toISOString(),
                },
                error: null,
            };

            logger.info('history_guest_delete_fallback', {
                requestId,
                userId,
                clearAll,
                historyId,
                latencyMs: Date.now() - startTime,
            });

            return NextResponse.json(response);
        }

        if (clearAll) {
            await clearAllWatchHistory(userId);

            logger.info('history_cleared', {
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
        } else if (historyId) {
            await deleteWatchHistoryEntry(userId, historyId);

            logger.info('history_entry_deleted', {
                requestId,
                userId,
                historyId,
                latencyMs: Date.now() - startTime,
            });

            const response: ApiResponse<{ deleted: boolean }> = {
                data: { deleted: true },
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
                    message: 'Missing historyId parameter or clearAll flag',
                },
            };
            return NextResponse.json(response, { status: 400 });
        }
    } catch (error) {
        logger.error('history_delete_failed', {
            requestId,
            userId,
            historyId,
            clearAll,
            error: error instanceof Error ? error.message : 'Unknown error',
            latencyMs: Date.now() - startTime,
        });

        const response: ApiResponse<null> = {
            data: null,
            meta: { requestId, timestamp: new Date().toISOString() },
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to delete watch history',
            },
        };

        return NextResponse.json(response, { status: 500 });
    }
}
