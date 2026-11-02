/**
 * Cron endpoint: Sync Dramas and Providers
 * Triggered by Vercel Cron once daily (free tier: 1 cron job limit)
 */

import { NextResponse } from 'next/server';
import { syncHomeDramas } from '@/jobs/sync-home-dramas';
import { syncProviders } from '@/jobs/sync-providers';
import { logger, generateRequestId } from '@/lib/observability/logger';
import { isProduction } from '@/lib/config/env';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: Request): Promise<NextResponse> {
    const requestId = generateRequestId();
    const startTime = Date.now();

    // Security check: Verify cron secret in production
    if (isProduction()) {
        const authHeader = request.headers.get('authorization');
        const expectedAuth = `Bearer ${process.env.CRON_SECRET || ''}`;

        if (!authHeader || authHeader !== expectedAuth) {
            logger.warn('cron_unauthorized', {
                requestId,
                endpoint: 'sync-dramas',
            });

            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }
    }

    const results = {
        providers: { success: false, message: '' },
        dramas: { success: false, message: '' },
    };

    try {
        logger.info('cron_sync_started', { requestId });

        // Sync providers first
        try {
            await syncProviders();
            results.providers = { success: true, message: 'Providers synced successfully' };
            logger.info('cron_sync_providers_completed', { requestId });
        } catch (error) {
            results.providers = {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error',
            };
            logger.error('cron_sync_providers_failed', {
                requestId,
                error: results.providers.message,
            });
        }

        // Sync dramas
        try {
            await syncHomeDramas();
            results.dramas = { success: true, message: 'Dramas synced successfully' };
            logger.info('cron_sync_dramas_completed', { requestId });
        } catch (error) {
            results.dramas = {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error',
            };
            logger.error('cron_sync_dramas_failed', {
                requestId,
                error: results.dramas.message,
            });
        }

        const latencyMs = Date.now() - startTime;
        logger.info('cron_sync_completed', {
            requestId,
            latencyMs,
            results,
        });

        const allSuccess = results.providers.success && results.dramas.success;

        return NextResponse.json({
            success: allSuccess,
            message: allSuccess ? 'All syncs completed successfully' : 'Some syncs failed',
            results,
            latencyMs,
        }, { status: allSuccess ? 200 : 207 });
    } catch (error) {
        const latencyMs = Date.now() - startTime;

        logger.error('cron_sync_failed', {
            requestId,
            error: error instanceof Error ? error.message : 'Unknown error',
            latencyMs,
        });

        return NextResponse.json(
            {
                success: false,
                error: 'Sync failed',
                message: error instanceof Error ? error.message : 'Unknown error',
                results,
            },
            { status: 500 }
        );
    }
}