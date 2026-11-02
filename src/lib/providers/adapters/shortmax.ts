import { BaseProviderAdapter } from './base';
import type { DramaCard, DramaDetail, EpisodeItem, PlaybackResponse } from '@/lib/types';

// ShortMax API response interfaces
interface ShortMaxDrama {
  code: string;
  id?: string;
  _id?: string;
  title: string;
  name?: string;
  cover: string;
  poster?: string;
  thumbnail?: string;
  image?: string;
  episodeCount: number;
  totalEpisodes?: number;
  episodes?: number;
  rating?: number;
  score?: number;
  tags?: string[];
  genres?: string[];
  synopsis?: string;
  description?: string;
  intro?: string;
  status?: string;
  language?: string;
}

interface ShortMaxEpisode {
  code: string;
  id?: string;
  _id?: string;
  episodeId?: string;
  episode?: number;
  title?: string;
  name?: string;
  episodeNo?: number;
  number?: number;
  sequence?: number;
  duration?: number;
  durationMs?: number;
  isLocked?: boolean;
  locked?: boolean;
  thumbnail?: string;
  thumbnailUrl?: string;
}

interface ShortMaxVideo {
  videoUrl: string;
  playUrl?: string;
  streamUrl?: string;
  url?: string;
  expiresAt?: string;
  expireTime?: string;
  m3u8?: string;
  data?: {
    id?: number;
    name?: string;
    episode?: number;
    total?: number;
    video?: {
      video_1080?: string;
      video_720?: string;
      video_480?: string;
      url?: string;
    };
  };
}

interface ShortMaxHomeResponse {
  data?: ShortMaxDrama[];
  dramas?: ShortMaxDrama[];
  list?: ShortMaxDrama[];
  feed?: ShortMaxDrama[];
  recommend?: ShortMaxDrama[];
  foryou?: ShortMaxDrama[];
}

interface ShortMaxSearchResponse {
  data?: ShortMaxDrama[];
  results?: ShortMaxDrama[];
  list?: ShortMaxDrama[];
}

interface ShortMaxDetailResponse {
  data?: ShortMaxDrama;
  drama?: ShortMaxDrama;
  detail?: ShortMaxDrama;
}

interface ShortMaxEpisodesResponse {
  data?: ShortMaxEpisode[];
  episodes?: ShortMaxEpisode[];
  list?: ShortMaxEpisode[];
}

export class ShortMaxAdapter extends BaseProviderAdapter {
  readonly name = 'ShortMax';
  readonly slug = 'shortmax';

  mapHome(response: unknown): DramaCard[] {
    const unwrapped = this.unwrapResponse(response);
    const resp = unwrapped as ShortMaxHomeResponse;

    // Handle various response structures
    const items = resp?.list || resp?.data || resp?.dramas || resp?.feed || resp?.recommend || resp?.foryou || (Array.isArray(unwrapped) ? unwrapped as ShortMaxDrama[] : []);

    if (!Array.isArray(items)) {
      return [];
    }

    return items.map(item => this.mapDramaToCard(item));
  }

  private mapDramaToCard(item: ShortMaxDrama): DramaCard {
    const id = item.code || item.id || item._id || '';
    return {
      id: `${this.slug}:${id}`,
      providerDramaId: id,
      title: item.title || item.name || '',
      coverUrl: item.cover || item.poster || item.thumbnail || item.image || '',
      episodeCount: item.episodeCount || item.totalEpisodes || item.episodes || 0,
      rating: item.rating || item.score,
      tags: item.tags || item.genres || [],
      isPremium: false,
      ...this.extractProviderInfo(),
    };
  }

  mapSearch(response: unknown): DramaCard[] {
    const resp = response as ShortMaxSearchResponse;
    const items = resp?.data || resp?.results || resp?.list || (Array.isArray(response) ? response as ShortMaxDrama[] : []);

    return items.map(item => this.mapDramaToCard(item));
  }

  mapDramaDetail(response: unknown): DramaDetail {
    const resp = response as ShortMaxDetailResponse;
    const drama = resp?.data || resp?.drama || resp?.detail || response as ShortMaxDrama;
    const id = drama.code || drama.id || drama._id || '';

    return {
      id: `${this.slug}:${id}`,
      providerDramaId: id,
      title: drama.title || drama.name || '',
      coverUrl: drama.cover || drama.poster || drama.thumbnail || drama.image || '',
      episodeCount: drama.episodeCount || drama.totalEpisodes || drama.episodes || 0,
      rating: drama.rating || drama.score,
      tags: drama.tags || drama.genres || [],
      isPremium: false,
      synopsis: drama.synopsis || drama.description || drama.intro || '',
      genres: drama.genres || drama.tags || [],
      language: drama.language || 'en',
      lastUpdated: new Date().toISOString(),
      popularityScore: drama.rating || drama.score,
      ...this.extractProviderInfo(),
    };
  }

  mapEpisodes(response: unknown): EpisodeItem[] {
    const resp = response as ShortMaxEpisodesResponse & {
      chapterList?: ShortMaxEpisode[];
      chapter_list?: ShortMaxEpisode[];
      drama?: { episodes?: ShortMaxEpisode[]; list?: ShortMaxEpisode[] };
      detail?: { episodes?: ShortMaxEpisode[]; list?: ShortMaxEpisode[] };
      data?: ShortMaxEpisode[] | { episodes?: ShortMaxEpisode[]; list?: ShortMaxEpisode[]; chapters?: ShortMaxEpisode[] };
    };

    const nestedData: { episodes?: ShortMaxEpisode[]; list?: ShortMaxEpisode[]; chapters?: ShortMaxEpisode[] } | undefined =
      !Array.isArray(resp?.data) && resp?.data && typeof resp.data === 'object'
        ? (resp.data as { episodes?: ShortMaxEpisode[]; list?: ShortMaxEpisode[]; chapters?: ShortMaxEpisode[] })
        : undefined;

    const episodes =
      (Array.isArray(resp?.data) ? resp.data : undefined)
      || resp?.episodes
      || resp?.list
      || resp?.chapterList
      || resp?.chapter_list
      || nestedData?.episodes
      || nestedData?.list
      || nestedData?.chapters
      || resp?.drama?.episodes
      || resp?.drama?.list
      || resp?.detail?.episodes
      || resp?.detail?.list
      || (Array.isArray(response) ? response as ShortMaxEpisode[] : []);

    if (!Array.isArray(episodes)) {
      return [];
    }

    return episodes.map(ep => {
      const epId = ep.code || ep.id || ep._id || ep.episodeId || '';
      const epNo = ep.episode || ep.episodeNo || ep.number || ep.sequence || 0;
      return {
        episodeId: `${this.slug}:${epId}`,
        providerEpisodeId: epId,
        episodeNo: epNo,
        title: ep.title || ep.name || `Episode ${epNo}`,
        durationMs: ep.duration || ep.durationMs || 0,
        isLocked: ep.isLocked || ep.locked || false,
        thumbnailUrl: ep.thumbnail || ep.thumbnailUrl,
      };
    });
  }

  mapPlayback(response: unknown): PlaybackResponse {
    const root = response as Record<string, unknown>;
    const video = this.unwrapResponse(response) as ShortMaxVideo;
    const firstItem = Array.isArray(video) ? video[0] as Record<string, unknown> : undefined;

    const videoData = video.data;

    const streamUrl =
      video.videoUrl
      || video.playUrl
      || video.streamUrl
      || video.url
      || video.m3u8
      || videoData?.video?.video_1080
      || videoData?.video?.video_720
      || videoData?.video?.video_480
      || videoData?.video?.url
      || (typeof root.url === 'string' ? root.url : undefined)
      || (typeof root.streamUrl === 'string' ? root.streamUrl : undefined)
      || (typeof root.playUrl === 'string' ? root.playUrl : undefined)
      || (typeof root.videoUrl === 'string' ? root.videoUrl : undefined)
      || (typeof root.m3u8 === 'string' ? root.m3u8 : undefined)
      || ((root.data && typeof root.data === 'object' && !Array.isArray(root.data))
        ? ((root.data as { video?: { video_1080?: string; video_720?: string; video_480?: string; url?: string } }).video?.video_1080
          || (root.data as { video?: { video_1080?: string; video_720?: string; video_480?: string; url?: string } }).video?.video_720
          || (root.data as { video?: { video_1080?: string; video_720?: string; video_480?: string; url?: string } }).video?.video_480
          || (root.data as { video?: { video_1080?: string; video_720?: string; video_480?: string; url?: string } }).video?.url)
        : undefined)
      || (typeof firstItem?.url === 'string' ? firstItem.url : undefined)
      || (typeof firstItem?.streamUrl === 'string' ? firstItem.streamUrl : undefined)
      || (typeof firstItem?.playUrl === 'string' ? firstItem.playUrl : undefined)
      || (typeof firstItem?.videoUrl === 'string' ? firstItem.videoUrl : undefined)
      || '';

    return {
      streamUrl,
      expiresAt: video.expiresAt || video.expireTime || new Date(Date.now() + 2 * 60 * 1000).toISOString(),
    };
  }
}
