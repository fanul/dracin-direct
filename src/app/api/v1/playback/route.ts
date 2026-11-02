import { NextResponse } from 'next/server';
import { request as httpsRequest } from 'node:https';
import { getPlaybackUrl } from '@/lib/services/playback';
import { checkEntitlement } from '@/lib/db/subscriptions';
import { getDramaByProviderId, getEpisodesByDramaId } from '@/lib/db/dramas';
import { getCacheManager, createPlaybackKey, CACHE_TTL } from '@/lib/cache/redis';
import { logger, generateRequestId } from '@/lib/observability/logger';
import { validateSearchParams, playbackRequestSchema } from '@/lib/validation/schemas';
import type { ApiResponse, PlaybackResponse, SubtitleTrack } from '@/lib/types';
import { downloads } from '@/lib/downloads';

export const dynamic = 'force-dynamic';

async function hasUnsupportedOfflineKeyStream(
  streamUrl: string,
  provider: string,
  requestId: string,
): Promise<boolean> {
  if (!streamUrl || !/\.m3u8(\?|$)/i.test(streamUrl)) {
    return false;
  }

  try {
    const manifestResponse = await fetch(streamUrl, {
      method: 'GET',
      cache: 'no-store',
    });

    if (!manifestResponse.ok) {
      logger.warn('playback_manifest_probe_failed', {
        requestId,
        provider,
        streamUrl,
        status: manifestResponse.status,
      });
      return false;
    }

    const manifest = await manifestResponse.text();
    const hasOfflineKey = /URI=["']local:\/\/offline-key/i.test(manifest) || manifest.includes('local://offline-key');

    if (hasOfflineKey) {
      logger.warn('playback_manifest_offline_key_detected', {
        requestId,
        provider,
        streamUrl,
      });
    }

    return hasOfflineKey;
  } catch (error) {
    logger.warn('playback_manifest_probe_error', {
      requestId,
      provider,
      streamUrl,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

async function fetchSubtitleViaHttps(url: string): Promise<{ status: number; body: string; contentType: string | null }> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
    });

    return {
      status: response.status,
      body: await response.text(),
      contentType: response.headers.get('content-type'),
    };
  } catch {
    return new Promise((resolve, reject) => {
      const hostname = (() => {
        try {
          return new URL(url).hostname;
        } catch {
          return '';
        }
      })();

      const req = httpsRequest(url, {
        method: 'GET',
        rejectUnauthorized: hostname === 'awscdn.netshort.com' ? false : true,
      }, (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
        res.on('end', () => {
          resolve({
            status: res.statusCode || 502,
            body: Buffer.concat(chunks).toString('utf-8'),
            contentType: typeof res.headers['content-type'] === 'string' ? res.headers['content-type'] : null,
          });
        });
      });

      req.on('error', reject);
      req.end();
    });
  }
}

async function proxySubtitleTrack(track: SubtitleTrack, requestId: string): Promise<SubtitleTrack> {
  try {
    const sourceUrl = new URL(track.src);
    const proxyUrl = new URL('/api/v1/playback', 'http://local');
    proxyUrl.searchParams.set('subtitleUrl', sourceUrl.toString());
    proxyUrl.searchParams.set('requestId', requestId);
    proxyUrl.searchParams.set('srclang', track.srclang);
    proxyUrl.searchParams.set('label', track.label);
    if (track.default) {
      proxyUrl.searchParams.set('default', '1');
    }

    return {
      ...track,
      src: proxyUrl.pathname + proxyUrl.search,
    };
  } catch {
    return track;
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, { status: 204 });
}

export async function GET(request: Request): Promise<NextResponse> {
  const requestId = generateRequestId();
  const startTime = Date.now();

  const { searchParams } = new URL(request.url);

  const subtitleUrl = searchParams.get('subtitleUrl');
  if (subtitleUrl) {
    try {
      const upstream = await fetchSubtitleViaHttps(subtitleUrl);

      if (upstream.status < 200 || upstream.status >= 300) {
        return new NextResponse('Subtitle unavailable', { status: upstream.status });
      }

      return new NextResponse(upstream.body, {
        status: 200,
        headers: {
          'Content-Type': upstream.contentType || 'text/vtt; charset=utf-8',
          'Cache-Control': 'private, max-age=60',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (error) {
      logger.warn('playback_subtitle_proxy_failed', {
        requestId,
        subtitleUrl,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return new NextResponse('Subtitle unavailable', { status: 502 });
    }
  }

  // Validate input parameters
  const validation = validateSearchParams(searchParams, playbackRequestSchema);

  if (!validation.success) {
    const response: ApiResponse<null> = {
      data: null,
      meta: { requestId, timestamp: new Date().toISOString() },
      error: validation.error,
    };
    return NextResponse.json(response, { status: 400 });
  }

  const { provider, drama: dramaId, episode: rawEpisodeId, userId } = validation.data;
  const episodeId = rawEpisodeId.trim();

  const invalidEpisodeTokens = new Set(['', 'nan', 'undefined', 'null']);
  if (invalidEpisodeTokens.has(episodeId.toLowerCase())) {
    logger.warn('playback_invalid_episode_param', {
      requestId,
      provider,
      dramaId,
      rawEpisodeId,
    });

    const response: ApiResponse<null> = {
      data: null,
      meta: { requestId, timestamp: new Date().toISOString() },
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid episode identifier',
      },
    };

    return NextResponse.json(response, { status: 400 });
  }

  try {
    await downloads.ready();
    const localFile = /^\d+$/.test(episodeId) ? downloads.local(provider, dramaId, Number(episodeId)) : undefined;
    if (localFile) {
      const local: ApiResponse<PlaybackResponse> = {
        data: { streamUrl: `/api/v1/media?provider=${encodeURIComponent(provider)}&drama=${encodeURIComponent(dramaId)}&episode=${episodeId}`, expiresAt: new Date(Date.now() + 86_400_000).toISOString() },
        meta: { requestId, timestamp: new Date().toISOString(), cache: 'hit' }, error: null,
      };
      return NextResponse.json(local);
    }
    let resolvedEpisodeId = episodeId;

    if (/^\d+$/.test(episodeId)) {
      try {
        const drama = await getDramaByProviderId(provider, dramaId);
        if (drama) {
          const episodes = await getEpisodesByDramaId(drama.id);
          const numericEpisode = Number.parseInt(episodeId, 10);
          const matched = episodes.find((ep) => ep.episodeNo === numericEpisode);

          if (matched) {
            resolvedEpisodeId = ['dramanova', 'netshort', 'dramabox', 'shortmax'].includes(provider)
              ? String(matched.episodeNo)
              : (matched.chapterId || matched.providerEpisodeId || episodeId);

            logger.info('playback_episode_resolved', {
              requestId,
              provider,
              dramaId,
              requestedEpisodeId: episodeId,
              resolvedEpisodeId,
            });
          }
        }
      } catch (error) {
        logger.warn('playback_episode_resolution_skipped', {
          requestId,
          provider,
          dramaId,
          requestedEpisodeId: episodeId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    let cache: ReturnType<typeof getCacheManager> | null = null;
    try {
      cache = getCacheManager();
    } catch {
      cache = null;
    }

    const cacheKey = createPlaybackKey(provider, dramaId, resolvedEpisodeId);

    const cached = cache ? await cache.get<PlaybackResponse>(cacheKey) : null;
    if (cached) {
      if (await hasUnsupportedOfflineKeyStream(cached.streamUrl, provider, requestId)) {
        if (cache) {
          await cache.delete(cacheKey);
        }

        const blockedResponse: ApiResponse<null> = {
          data: null,
          meta: { requestId, timestamp: new Date().toISOString(), cache: 'hit' },
          error: {
            code: 'PROVIDER_UNAVAILABLE',
            message: 'Encrypted provider stream is not supported in web playback',
          },
        };

        return NextResponse.json(blockedResponse, { status: 502 });
      }

      logger.info('playback_cache_hit', { requestId, provider, dramaId, episodeId: resolvedEpisodeId });

      const response: ApiResponse<PlaybackResponse> = {
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

    const skipEntitlementForNetshortGuest = ['netshort', 'dramabox', 'shortmax', 'pinedrama', 'goodshort', 'melolo', 'reelshort'].includes(provider) && userId === 'guest';

    if (!skipEntitlementForNetshortGuest) {
      const entitlement = await checkEntitlement(userId, dramaId, provider);
      if (!entitlement.allowed) {
        logger.warn('playback_entitlement_denied', {
          requestId,
          userId,
          dramaId,
          reason: entitlement.reason,
        });

        const response: ApiResponse<null> = {
          data: null,
          meta: { requestId, timestamp: new Date().toISOString() },
          error: {
            code: 'FORBIDDEN_SUBSCRIPTION',
            message: entitlement.reason || 'Access denied',
          },
        };
        return NextResponse.json(response, { status: 403 });
      }

      logger.info('playback_entitlement_allowed', { requestId, userId, dramaId });
    } else {
      logger.info('playback_entitlement_bypassed', {
        requestId,
        provider,
        userId,
        dramaId,
      });
    }

    const playback = await getPlaybackUrl(provider, dramaId, resolvedEpisodeId, requestId);

    if (provider === 'netshort' && playback.subtitles && playback.subtitles.length > 0) {
      playback.subtitles = await Promise.all(
        playback.subtitles.map((track) => proxySubtitleTrack(track, requestId))
      );
    }

    if (await hasUnsupportedOfflineKeyStream(playback.streamUrl, provider, requestId)) {
      const blockedResponse: ApiResponse<null> = {
        data: null,
        meta: { requestId, timestamp: new Date().toISOString(), cache: 'miss' },
        error: {
          code: 'PROVIDER_UNAVAILABLE',
          message: 'Encrypted provider stream is not supported in web playback',
        },
      };

      return NextResponse.json(blockedResponse, { status: 502 });
    }

    if (cache) {
      await cache.set(cacheKey, playback, CACHE_TTL.PLAYBACK);
    }

    const response: ApiResponse<PlaybackResponse> = {
      data: playback,
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
        cache: 'miss',
      },
      error: null,
    };

    logger.info('playback_completed', {
      requestId,
      provider,
      dramaId,
      requestedEpisodeId: episodeId,
      episodeId: resolvedEpisodeId,
      latencyMs: Date.now() - startTime,
    });

    return NextResponse.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logger.error('playback_failed', {
      requestId,
      provider,
      dramaId,
      requestedEpisodeId: episodeId,
      error: errorMessage,
      latencyMs: Date.now() - startTime,
    });

    const errorCode = errorMessage === 'RATE_LIMITED' ? 'RATE_LIMITED' :
      errorMessage === 'PLAYBACK_ENDPOINT_NOT_FOUND' ? 'PROVIDER_UNAVAILABLE' :
        'INTERNAL_ERROR';

    const response: ApiResponse<null> = {
      data: null,
      meta: { requestId, timestamp: new Date().toISOString() },
      error: {
        code: errorCode,
        message: errorMessage === 'RATE_LIMITED' ? 'Rate limit exceeded, please try again' : 'Playback failed',
      },
    };

    return NextResponse.json(response, {
      status: errorCode === 'RATE_LIMITED' ? 429 : 500
    });
  }
}
