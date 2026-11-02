import type { DramaDetail, EpisodeItem, PlaybackResponse, SubtitleTrack } from '@/lib/types';

const API = 'https://api.sansekai.my.id/api';
const headers = { 'User-Agent': 'Mozilla/5.0 DracinHub/1.0' };
export type SansekaiPlayableProvider = 'pinedrama' | 'goodshort' | 'melolo' | 'netshort' | 'reelshort';

async function get(path: string): Promise<unknown> {
  const response = await fetch(`${API}${path}`, { cache: 'no-store', headers });
  if (!response.ok) throw new Error(`SANSEKAI_UPSTREAM_${response.status}`);
  return response.json();
}

const record = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const text = (value: unknown): string => typeof value === 'string' || typeof value === 'number' ? String(value) : '';
const list = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
const providerName = (provider: SansekaiPlayableProvider) => ({ pinedrama: 'PineDrama', goodshort: 'GoodShort', melolo: 'Melolo', netshort: 'NetShort', reelshort: 'ReelShort' })[provider];

async function payload(provider: SansekaiPlayableProvider, id: string): Promise<Record<string, unknown>> {
  const path = provider === 'pinedrama' ? `/pinedrama/detail?collection_id=${encodeURIComponent(id)}&lang=id`
    : provider === 'goodshort' ? `/goodshort/detail?bookId=${encodeURIComponent(id)}&lang=id`
    : provider === 'melolo' ? `/melolo/detail?book_id=${encodeURIComponent(id)}&lang=id`
    : provider === 'netshort' ? `/netshort/detail?shortPlayId=${encodeURIComponent(id)}&lang=id`
    : `/reelshort/get-detail?bookId=${encodeURIComponent(id)}&lang=id`;
  return record(await get(path));
}

function item(provider: SansekaiPlayableProvider, raw: Record<string, unknown>): Record<string, unknown> {
  if (provider === 'goodshort') return record(record(raw.data).book);
  if (provider === 'melolo') return record(record(raw.data).video_data);
  return raw;
}

export async function fetchSansekaiDetail(provider: SansekaiPlayableProvider, id: string): Promise<DramaDetail | null> {
  const value = item(provider, await payload(provider, id));
  const providerId = text(value.collection_id ?? value.bookId ?? value.book_id ?? value.shortPlayId ?? id);
  const title = text(value.title ?? value.bookName ?? value.book_name ?? value.shortPlayName);
  if (!providerId || !title) return null;
  const tags = list(value.tags ?? value.shortPlayLabels).filter((tag): tag is string => typeof tag === 'string');
  return {
    id: `${provider}:${providerId}`, providerSlug: provider, providerDramaId: providerId, title,
    coverUrl: text(value.cover ?? value.coverWap ?? value.thumb_url ?? value.shortPlayCover),
    episodeCount: Number(value.total_episodes ?? value.chapterCount ?? value.serial_count ?? value.totalEpisode ?? value.totalEpisodes) || 0,
    tags, genres: tags, isPremium: false, providerName: providerName(provider), vipLevel: 'FREE',
    synopsis: text(value.description ?? value.introduction ?? value.abstract ?? value.shotIntroduce), language: 'id', lastUpdated: text(value.updated_at ?? value.shelfTime) || new Date(0).toISOString(),
  };
}

function goodshortItems(value: unknown): Record<string, unknown>[] {
  return list(record(record(value).data).downloadList).map(record);
}

function episodeItems(provider: SansekaiPlayableProvider, raw: Record<string, unknown>): Record<string, unknown>[] {
  const value = item(provider, raw);
  if (provider === 'melolo') return list(value.video_list).map(record);
  if (provider === 'netshort') return list(value.shortPlayEpisodeInfos).map(record);
  if (provider === 'reelshort') return list(value.chapters).map(record);
  return [];
}

export async function fetchSansekaiEpisodes(provider: SansekaiPlayableProvider, id: string): Promise<EpisodeItem[]> {
  if (provider === 'pinedrama') {
    const count = (await fetchSansekaiDetail(provider, id))?.episodeCount || 0;
    return Array.from({ length: count }, (_, index) => ({ episodeId: String(index + 1), providerEpisodeId: String(index + 1), chapterId: String(index + 1), episodeNo: index + 1, title: `Episode ${index + 1}`, durationMs: 0, isLocked: false }));
  }
  const items = provider === 'goodshort' ? goodshortItems(await get(`/goodshort/get-allepisode?bookId=${encodeURIComponent(id)}&lang=id`)) : episodeItems(provider, await payload(provider, id));
  return items.map((entry, index) => {
    const episodeNo = Number(entry.vid_index ?? entry.episodeNo ?? entry.index ?? entry.serialNumber) || Number.parseInt(text(entry.chapterName), 10) || index + 1;
    const episodeId = text(entry.vid ?? entry.episodeId ?? entry.chapterId ?? entry.id) || String(episodeNo);
    return { episodeId, providerEpisodeId: ['melolo', 'goodshort'].includes(provider) ? episodeId : String(episodeNo), chapterId: episodeId, episodeNo, title: text(entry.title ?? entry.chapterName) || `Episode ${episodeNo}`, durationMs: Number(entry.duration) * (provider === 'netshort' ? 1000 : 1) || 0, isLocked: Boolean(entry.isLock ?? entry.isLocked) };
  });
}

const urls = (value: unknown): string[] => list(value).filter((url): url is string => typeof url === 'string' && url.length > 0);
const subtitles = (value: unknown): SubtitleTrack[] => list(value).map(record).flatMap((track): SubtitleTrack[] => {
  const src = text(track.url ?? track.subtitle); if (!src) return [];
  const language = text(track.subtitleLanguage ?? track.language) || 'id';
  return [{ src, srclang: language.replace('_', '-'), label: text(track.display_name) || language }];
});

export async function getSansekaiPlayback(provider: SansekaiPlayableProvider, id: string, episode: string): Promise<PlaybackResponse> {
  let streamUrl = ''; let tracks: SubtitleTrack[] | undefined;
  if (provider === 'pinedrama') {
    const value = record(await get(`/pinedrama/get-episodes?collection_id=${encodeURIComponent(id)}&episodeNumber=${encodeURIComponent(episode)}&lang=id`));
    const main = record(value.main); const alt = record(value.alt);
    streamUrl = [main.indo_hd_cdn_urls, main.indo_cdn_urls, main.cdn_urls, alt.indo_hd_cdn_urls, alt.indo_cdn_urls, alt.cdn_urls].flatMap(urls)[0] || '';
  } else if (provider === 'goodshort') {
    const items = goodshortItems(await get(`/goodshort/get-allepisode?bookId=${encodeURIComponent(id)}&lang=id`));
    const numeric = Number.parseInt(episode, 10);
    const chapter = items.find((entry, index) => text(entry.id ?? entry.chapterId) === episode || Number.parseInt(text(entry.chapterName), 10) === numeric || index + 1 === numeric);
    streamUrl = text(record(list(chapter?.multiVideos)[0]).filePath);
  } else if (provider === 'melolo') {
    const value = record(await get(`/melolo/get-episode?videoId=${encodeURIComponent(episode)}`));
    streamUrl = text(value.streamUrl) || text(record(list(value.qualities)[0]).streamUrl);
  } else if (provider === 'netshort') {
    const value = record(await get(`/netshort/get-episodes?shortPlayId=${encodeURIComponent(id)}&episodeNumber=${encodeURIComponent(episode)}&lang=id`));
    const entry = record(list(value.episodeList)[0]); streamUrl = text(entry.playVoucher ?? entry.playVoucherBak); tracks = subtitles(entry.subtitleList);
  } else {
    const value = record(await get(`/reelshort/get-episode?bookId=${encodeURIComponent(id)}&episodeNumber=${encodeURIComponent(episode)}&lang=id`));
    const videos = list(value.videoList).map(record);
    streamUrl = text((videos.find((video) => text(video.encode).toUpperCase() === 'H264') ?? videos[0])?.url);
  }
  if (!streamUrl) throw new Error('PLAYBACK_ENDPOINT_NOT_FOUND');
  return { streamUrl, mimeType: /\.m3u8(?:\?|$)/i.test(streamUrl) ? 'application/x-mpegURL' : 'video/mp4', ...(tracks?.length ? { subtitles: tracks } : {}), expiresAt: new Date(Date.now() + 2 * 60 * 1000).toISOString() };
}
