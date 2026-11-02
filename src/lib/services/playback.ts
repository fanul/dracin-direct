import { createCaptainClient } from '../http/captain-client';
import { providerCatalog } from '../providers/catalog';
import { getAdapter } from '../providers/adapters';
import { getRateLimiter } from '../rate-limit/upstash';
import { logger } from '../observability/logger';
import type { PlaybackResponse } from '../types';
import { getDramaBoxPlayback, getShortMaxPlayback } from '../providers/dramabox';

const captainToken = process.env.CAPTAIN_API_TOKEN || '';
const captainClient = createCaptainClient(captainToken);

function extractGoodshortChapterList(payload: unknown): Array<Record<string, unknown>> {
  if (!payload || typeof payload !== 'object') return [];

  const root = payload as Record<string, unknown>;
  const data = root.data;

  if (Array.isArray(data)) return data as Array<Record<string, unknown>>;
  if (Array.isArray(root.list)) return root.list as Array<Record<string, unknown>>;

  if (data && typeof data === 'object') {
    const nested = data as Record<string, unknown>;
    if (Array.isArray(nested.list)) return nested.list as Array<Record<string, unknown>>;
    if (Array.isArray(nested.chapters)) return nested.chapters as Array<Record<string, unknown>>;
  }

  return [];
}

function chapterStreamUrl(chapter: Record<string, unknown>): string | null {
  const multiVideos = chapter.multiVideos;
  if (Array.isArray(multiVideos) && multiVideos.length > 0) {
    const firstMv = multiVideos[0] as Record<string, unknown>;
    if (typeof firstMv.filePath === 'string' && firstMv.filePath.length > 0) return firstMv.filePath;

    const cdnList = firstMv.cdnList;
    if (Array.isArray(cdnList) && cdnList.length > 0) {
      const firstCdn = cdnList[0] as Record<string, unknown>;
      if (typeof firstCdn.videoPath === 'string' && firstCdn.videoPath.length > 0) return firstCdn.videoPath;
    }
  }

  if (typeof chapter.cdn === 'string' && chapter.cdn.length > 0) return chapter.cdn;

  const cdnList = chapter.cdnList;
  if (Array.isArray(cdnList) && cdnList.length > 0) {
    const firstCdn = cdnList[0] as Record<string, unknown>;
    if (typeof firstCdn.videoPath === 'string' && firstCdn.videoPath.length > 0) return firstCdn.videoPath;
  }

  return null;
}

function resolveGoodshortStreamFromChapters(payload: unknown, episodeToken: string): string | null {
  const chapters = extractGoodshortChapterList(payload);
  if (chapters.length === 0) return null;

  const numericEpisode = Number.parseInt(episodeToken, 10);
  const tokenLower = episodeToken.trim().toLowerCase();

  let target = chapters.find((chapter) => {
    const chapterId = String(chapter.chapterId ?? chapter.id ?? '').trim().toLowerCase();
    return chapterId.length > 0 && chapterId === tokenLower;
  });

  if (!target && Number.isFinite(numericEpisode)) {
    target = chapters.find((chapter, index) => {
      const chapterNameNo = Number.parseInt(String(chapter.chapterName ?? ''), 10);
      const indexNo = typeof chapter.index === 'number' ? chapter.index + 1 : index + 1;
      return chapterNameNo === numericEpisode || indexNo === numericEpisode;
    });
  }

  if (!target) {
    target = chapters[0];
  }

  return chapterStreamUrl(target);
}

export async function getPlaybackUrl(
  providerSlug: string,
  providerDramaId: string,
  providerEpisodeId: string,
  requestId: string
): Promise<PlaybackResponse> {
  const limiter = getRateLimiter();

  const limitCheck = await limiter.checkBoth(providerSlug);
  if (!limitCheck.global.success || !limitCheck.provider.success) {
    throw new Error('RATE_LIMITED');
  }

  if (providerSlug === 'dramabox') {
    return getDramaBoxPlayback(providerDramaId, providerEpisodeId);
  }
  if (providerSlug === 'shortmax') {
    return getShortMaxPlayback(providerDramaId, providerEpisodeId);
  }

  if (providerSlug === 'goodshort') {
    const episodesResolved = providerCatalog.resolveEndpoint(
      providerSlug,
      'episodes',
      {
        id: providerDramaId,
        code: providerDramaId,
        bookId: providerDramaId,
        dramaId: providerDramaId,
      },
    );

    if (episodesResolved) {
      const chaptersResponse = await captainClient.get(episodesResolved.url, {
        provider: providerSlug,
        requestId,
        timeout: 15000,
      });

      const chapterStream = resolveGoodshortStreamFromChapters(chaptersResponse.data, providerEpisodeId);

      if (chapterStream) {
        logger.info('playback_goodshort_chapter_stream_resolved', {
          requestId,
          provider: providerSlug,
          dramaId: providerDramaId,
          episodeId: providerEpisodeId,
        });

        return {
          streamUrl: chapterStream,
          expiresAt: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
        };
      }
    }
  }

  let requestUrl = '';

  if (providerSlug === 'netshort') {
    const providerMeta = providerCatalog.getProvider(providerSlug);
    if (!providerMeta) {
      throw new Error('PLAYBACK_ENDPOINT_NOT_FOUND');
    }
    requestUrl = `${providerMeta.baseUrl}/api/v1/episode/${encodeURIComponent(providerDramaId)}/${encodeURIComponent(providerEpisodeId)}`;
  } else {
    const resolved = providerCatalog.resolveEndpoint(
      providerSlug,
      'playback',
      {
        id: providerDramaId,
        code: providerDramaId,
        bookId: providerDramaId,
        dramaId: providerDramaId,
        seriesId: providerDramaId,
        playletId: providerDramaId,
        vid: providerDramaId,
        series_id: providerDramaId,
        episode: providerEpisodeId,
        episodeNo: providerEpisodeId,
        chapterId: providerEpisodeId,
        chapter: providerEpisodeId,
        ep: providerEpisodeId,
        section_id: providerEpisodeId,
      }
    );

    if (!resolved) {
      throw new Error('PLAYBACK_ENDPOINT_NOT_FOUND');
    }

    requestUrl = resolved.url;

    if (providerSlug === 'shortmax' && providerEpisodeId) {
      const sep = requestUrl.includes('?') ? '&' : '?';
      requestUrl = `${requestUrl}${sep}ep=${encodeURIComponent(providerEpisodeId)}`;
    }
  }

  logger.info('playback_resolved', {
    requestId,
    provider: providerSlug,
    url: requestUrl,
  });

  const response = await captainClient.get(requestUrl, {
    provider: providerSlug,
    requestId,
    timeout: 15000,
  });

  const adapter = getAdapter(providerSlug);
  if (!adapter) {
    throw new Error('ADAPTER_NOT_FOUND');
  }

  try {
    return adapter.mapPlayback(response.data);
  } catch (error) {
    logger.error('playback_map_failed', {
      requestId,
      provider: providerSlug,
      error: error instanceof Error ? error.message : 'Unknown',
    });
    throw new Error('PLAYBACK_MAP_FAILED');
  }
}
