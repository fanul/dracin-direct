import type { DramaDetail, EpisodeItem, PlaybackResponse, SubtitleTrack } from '@/lib/types';

const API = 'https://api.sansekai.my.id/api';
const options = { cache: 'no-store' as const, headers: { 'User-Agent': 'Mozilla/5.0 DracinHub/1.0' } };
type Provider = 'flickreels' | 'freereels';
type FlickEpisode = { id?: string; name?: string; num?: number; unlock?: boolean; raw?: { duration?: string | number } };
type FreeEpisode = { id?: string; name?: string; index?: number; unlock?: boolean; duration?: number; video_url?: string; m3u8_url?: string; external_audio_h264_m3u8?: string; external_audio_h265_m3u8?: string; subtitle_list?: Array<{ language?: string; display_name?: string; subtitle?: string; vtt?: string }> };
type FlickPayload = { drama?: { title?: string; cover?: string; description?: string; chapterCount?: number; labels?: string[] }; episodes?: FlickEpisode[] };
type FreeInfo = { id?: string; name?: string; desc?: string; cover?: string; episode_count?: number; tag?: string[]; series_tag?: string[]; content_tags?: string[]; episode_list?: FreeEpisode[] };

async function json<T>(path: string): Promise<T> {
  const response = await fetch(`${API}${path}`, options);
  if (!response.ok) throw new Error(`SANSEKAI_REELS_UPSTREAM_${response.status}`);
  return response.json() as Promise<T>;
}

const tags = (...values: Array<string[] | undefined>) => [...new Set(values.flatMap((value) => value || []))];

async function flick(playletId: string): Promise<FlickPayload> {
  return json(`/flickreels/detail?playlet_id=${encodeURIComponent(playletId)}&lang=id`);
}

async function free(key: string): Promise<FreeInfo> {
  const payload = await json<{ data?: { info?: FreeInfo } }>(`/freereels/detailAndAllEpisode?key=${encodeURIComponent(key)}&lang=id`);
  if (!payload.data?.info) throw new Error('SANSEKAI_REELS_INVALID_RESPONSE');
  return payload.data.info;
}

export async function fetchFlickReelsDetail(id: string): Promise<DramaDetail | null> {
  const { drama, episodes = [] } = await flick(id);
  if (!drama?.title) return null;
  return { id: `flickreels:${id}`, providerSlug: 'flickreels', providerDramaId: id, title: drama.title, coverUrl: drama.cover || '', episodeCount: drama.chapterCount || episodes.length, tags: drama.labels || [], isPremium: false, providerName: 'FlickReels', vipLevel: 'FREE', synopsis: drama.description || '', genres: drama.labels || [], language: 'id', lastUpdated: new Date(0).toISOString() };
}

export async function fetchFlickReelsEpisodes(id: string): Promise<EpisodeItem[]> {
  const { episodes = [] } = await flick(id);
  return episodes.map((episode, index) => ({ episodeId: episode.id || String(index + 1), providerEpisodeId: String(episode.num || index + 1), episodeNo: episode.num || index + 1, title: episode.name || `Episode ${index + 1}`, durationMs: Number(episode.raw?.duration || 0) * 1000, isLocked: episode.unlock === false }));
}

export async function getFlickReelsPlayback(id: string, token: string): Promise<PlaybackResponse> {
  const episodeNumber = Number.parseInt(token, 10);
  if (!Number.isFinite(episodeNumber)) throw new Error('PLAYBACK_ENDPOINT_NOT_FOUND');
  const payload = await json<{ data?: { hls_url?: string; total_duration?: number } }>(`/flickreels/get-episode?playlet_id=${encodeURIComponent(id)}&episodeNumber=${episodeNumber}&lang=id`);
  if (!payload.data?.hls_url) throw new Error('PLAYBACK_ENDPOINT_NOT_FOUND');
  return { streamUrl: payload.data.hls_url, mimeType: 'application/x-mpegURL', expiresAt: new Date(Date.now() + 120_000).toISOString() };
}

export async function fetchFreeReelsDetail(id: string): Promise<DramaDetail | null> {
  const item = await free(id);
  if (!item.name) return null;
  const itemTags = tags(item.tag, item.series_tag, item.content_tags);
  return { id: `freereels:${id}`, providerSlug: 'freereels', providerDramaId: id, title: item.name, coverUrl: item.cover || '', episodeCount: item.episode_count || item.episode_list?.length || 0, tags: itemTags, isPremium: false, providerName: 'FreeReels', vipLevel: 'FREE', synopsis: item.desc || '', genres: itemTags, language: 'id', lastUpdated: new Date(0).toISOString() };
}

export async function fetchFreeReelsEpisodes(id: string): Promise<EpisodeItem[]> {
  const item = await free(id);
  return (item.episode_list || []).map((episode, index) => ({ episodeId: episode.id || String(index + 1), providerEpisodeId: String(episode.index || index + 1), episodeNo: episode.index || index + 1, title: episode.name || `Episode ${index + 1}`, durationMs: (episode.duration || 0) * 1000, isLocked: episode.unlock === false, thumbnailUrl: undefined }));
}

export async function getFreeReelsPlayback(id: string, token: string): Promise<PlaybackResponse> {
  const item = await free(id);
  const episodeNo = Number.parseInt(token, 10);
  const episode = item.episode_list?.find((value) => value.id === token || value.index === episodeNo);
  const streamUrl = episode?.external_audio_h264_m3u8 || episode?.m3u8_url || episode?.video_url || episode?.external_audio_h265_m3u8;
  if (!streamUrl) throw new Error('PLAYBACK_ENDPOINT_NOT_FOUND');
  const subtitles: SubtitleTrack[] = (episode?.subtitle_list || []).flatMap((track) => {
    const src = track.vtt || track.subtitle;
    return src ? [{ src, srclang: track.language || 'id', label: track.display_name || track.language || 'Subtitle' }] : [];
  });
  return { streamUrl, mimeType: streamUrl.includes('.m3u8') ? 'application/x-mpegURL' : 'video/mp4', expiresAt: new Date(Date.now() + 120_000).toISOString(), subtitles };
}

export const sansekaiReelsProviders: Provider[] = ['flickreels', 'freereels'];
