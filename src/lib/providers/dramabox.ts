import type { DramaCard, DramaDetail, EpisodeItem, PlaybackResponse } from '@/lib/types';

const baseUrl = () => (process.env.DRAMA_API_BASE_URL || 'https://api-all-drama-new.vercel.app').replace(/\/$/, '');
type DirectProvider = 'dramabox' | 'shortmax';
type Drama = { title?: string; slug?: string; synopsis?: string; cover_image_url?: string; details?: { genres?: string[] }; chapter_count?: number; is_vip_only?: boolean; updatedAt?: string };
type Episode = { _id?: string; episode_number?: number; title?: string; videos?: Array<{ quality?: number | string; url?: string }>; is_vip?: boolean };
type SansekaiEpisode = { chapterId: string; chapterIndex: number; chapterName?: string; viewingDuration?: number; cdnList?: Array<{ isDefault?: number; videoPathList?: Array<{ quality?: number; videoPath?: string; isVipEquity?: number }> }> };
const sansekaiHeaders = { 'User-Agent': 'Mozilla/5.0 DracinHub/1.0' };

async function get<T>(path: string): Promise<T> {
  const response = await fetch(`${baseUrl()}${path}`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`DIRECT_DRAMA_UPSTREAM_${response.status}`);
  return response.json() as Promise<T>;
}

function mapDrama(item: Drama, provider: DirectProvider): DramaCard | null {
  if (!item.slug || !item.title) return null;
  return { id: `${provider}:${item.slug}`, providerSlug: provider, providerDramaId: item.slug, title: item.title, coverUrl: item.cover_image_url || '', episodeCount: item.chapter_count || 0, tags: item.details?.genres || [], isPremium: item.is_vip_only === true, providerName: provider === 'dramabox' ? 'DramaBox' : 'ShortMax', vipLevel: 'FREE' };
}

async function cards(provider: DirectProvider, path: string, category?: string): Promise<DramaCard[]> {
  const payload = await get<{ data?: Drama[] }>(path);
  return (payload.data || []).map((item) => mapDrama(item, provider)).filter((item): item is DramaCard => item !== null).map((item) => category && !item.tags.includes(category) ? { ...item, tags: [category, ...item.tags] } : item);
}

function dedupe(items: DramaCard[]): DramaCard[] {
  return [...new Map(items.map((item) => [item.providerDramaId, item])).values()];
}

async function detail(provider: DirectProvider, slug: string): Promise<DramaDetail | null> {
  if (provider === 'dramabox' && /^\d+$/.test(slug)) {
    const response = await fetch(`https://api.sansekai.my.id/api/dramabox/details?bookId=${encodeURIComponent(slug)}&lang=id`, { cache: 'no-store', headers: sansekaiHeaders });
    if (!response.ok) throw new Error(`DRAMABOX_DETAIL_UPSTREAM_${response.status}`);
    const item = await response.json() as { bookId?: string; bookName?: string; coverWap?: string; chapterCount?: number; introduction?: string; tags?: string[]; shelfTime?: string };
    if (!item.bookId || !item.bookName) return null;
    return { id: `dramabox:${item.bookId}`, providerSlug: 'dramabox', providerDramaId: item.bookId, title: item.bookName, coverUrl: item.coverWap || '', episodeCount: item.chapterCount || 0, tags: item.tags || [], isPremium: false, providerName: 'DramaBox', vipLevel: 'FREE', synopsis: item.introduction || '', genres: item.tags || [], language: 'id', lastUpdated: item.shelfTime || new Date(0).toISOString() };
  }
  const payload = await get<{ data?: Drama }>(`/api/${provider}/detail/${encodeURIComponent(slug)}`);
  const card = payload.data ? mapDrama(payload.data, provider) : null;
  if (!card || !payload.data) return null;
  return { ...card, synopsis: payload.data.synopsis || '', genres: payload.data.details?.genres || [], language: 'id', lastUpdated: payload.data.updatedAt || new Date(0).toISOString() };
}

async function rawEpisodes(provider: DirectProvider, slug: string): Promise<Episode[]> {
  return (await get<{ data?: Episode[] }>(`/api/${provider}/allepisodes/${encodeURIComponent(slug)}`)).data || [];
}

async function sansekaiDramaBoxEpisodes(bookId: string): Promise<SansekaiEpisode[]> {
  const response = await fetch(`https://api.sansekai.my.id/api/dramabox/get-allepisodes?bookId=${encodeURIComponent(bookId)}`, { cache: 'no-store', headers: sansekaiHeaders });
  if (!response.ok) throw new Error(`DRAMABOX_EPISODES_UPSTREAM_${response.status}`);
  return response.json() as Promise<SansekaiEpisode[]>;
}

function mapEpisodes(items: Episode[]): EpisodeItem[] {
  return items.flatMap((episode) => {
    if (!Number.isFinite(episode.episode_number)) return [];
    const episodeNo = episode.episode_number as number;
    return [{ episodeId: episode._id || String(episodeNo), providerEpisodeId: String(episodeNo), episodeNo, title: episode.title || `Episode ${episodeNo}`, durationMs: 0, isLocked: false }];
  });
}

async function playback(provider: DirectProvider, slug: string, token: string): Promise<PlaybackResponse> {
  const episodeNo = Number.parseInt(token, 10);
  if (provider === 'dramabox' && /^\d+$/.test(slug)) {
    const episode = (await sansekaiDramaBoxEpisodes(slug)).find((item) => item.chapterIndex + 1 === episodeNo || item.chapterId === token);
    const cdn = episode?.cdnList?.find((item) => item.isDefault === 1) || episode?.cdnList?.[0];
    const video = cdn?.videoPathList?.filter((item): item is { quality?: number; videoPath: string; isVipEquity?: number } => !!item.videoPath && item.isVipEquity !== 1).sort((a, b) => Number(b.quality || 0) - Number(a.quality || 0))[0];
    if (!video) throw new Error('PLAYBACK_ENDPOINT_NOT_FOUND');
    const response = await fetch(`https://api.sansekai.my.id/api/dramabox/decrypt?url=${encodeURIComponent(video.videoPath)}`, { cache: 'no-store', headers: sansekaiHeaders });
    if (!response.ok) throw new Error(`DRAMABOX_DECRYPT_UPSTREAM_${response.status}`);
    const payload = await response.json() as { streamUrl?: string };
    if (!payload.streamUrl) throw new Error('PLAYBACK_ENDPOINT_NOT_FOUND');
    return { streamUrl: payload.streamUrl, mimeType: 'video/mp4', expiresAt: new Date(Date.now() + 120_000).toISOString() };
  }
  if (provider === 'shortmax') {
    const legacyId = slug.match(/-(\d+)$/)?.[1];
    const shortPlayId = slug === 'kembalinya-pengantin-yang-ditolak-7906' ? '8714' : legacyId;
    if (!shortPlayId || !Number.isFinite(episodeNo)) throw new Error('PLAYBACK_ENDPOINT_NOT_FOUND');
    const response = await fetch(`https://api.sansekai.my.id/api/shortmax/get-episode?shortPlayId=${encodeURIComponent(shortPlayId)}&episodeNumber=${episodeNo}&lang=id`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`SHORTMAX_PLAYBACK_UPSTREAM_${response.status}`);
    const payload = await response.json() as { episode?: { duration?: number; videoUrl?: Record<string, string> } };
    const streams = Object.entries(payload.episode?.videoUrl || {}).filter((entry): entry is [string, string] => !!entry[1]);
    const stream = streams.sort((a, b) => Number(b[0].match(/\d+/)?.[0] || 0) - Number(a[0].match(/\d+/)?.[0] || 0))[0]?.[1];
    if (!stream) throw new Error('PLAYBACK_ENDPOINT_NOT_FOUND');
    return { streamUrl: `/api/v1/shortmax-hls?url=${encodeURIComponent(stream)}`, mimeType: 'application/x-mpegURL', expiresAt: new Date(Date.now() + 120_000).toISOString() };
  }

  const items = await rawEpisodes(provider, slug);
  const episode = items.find((item) => item.episode_number === episodeNo || item._id === token);
  const video = episode?.videos?.filter((item): item is { quality?: number | string; url: string } => !!item.url).sort((a, b) => Number(b.quality) - Number(a.quality))[0];
  if (!video) throw new Error('PLAYBACK_ENDPOINT_NOT_FOUND');
  return { streamUrl: video.url, mimeType: 'video/mp4', expiresAt: new Date(Date.now() + 120_000).toISOString() };
}

export const fetchDramaBoxRecommended = (page: number) => cards('dramabox', `/api/dramabox/recommended?page=${page}`, 'Untukmu');
export const fetchDramaBoxTrending = (page: number) => cards('dramabox', `/api/dramabox/trending?page=${page}`, 'Trending');
export const fetchDramaBoxDubIndo = (page: number) => cards('dramabox', `/api/dramabox/dubindo?page=${page}`, 'Dub Indonesia');
export const fetchDramaBoxLatest = (page: number) => cards('dramabox', `/api/dramabox/terbaru?page=${page}`, 'Terbaru');
export const fetchShortMaxRegular = (page: number) => cards('shortmax', `/api/shortmax/homepage?page=${page}`, 'Reguler');
export const fetchShortMaxVip = (page: number) => cards('shortmax', `/api/shortmax/vip?page=${page}`, 'VIP & Dub');
export const fetchDramaBoxCatalog = async (page: number) => dedupe((await Promise.all([fetchDramaBoxRecommended(page), fetchDramaBoxDubIndo(page), fetchDramaBoxTrending(page), fetchDramaBoxLatest(page)])).flat());
export const fetchShortMaxCatalog = async (page: number) => dedupe((await Promise.all([fetchShortMaxRegular(page), fetchShortMaxVip(page)])).flat());
export const searchDramaBox = (query: string) => cards('dramabox', `/api/dramabox/search?q=${encodeURIComponent(query)}`);
export const searchShortMax = (query: string) => cards('shortmax', `/api/shortmax/search?q=${encodeURIComponent(query)}`);
export const fetchDramaBoxDetail = (slug: string) => detail('dramabox', slug);
export const fetchShortMaxDetail = (slug: string) => detail('shortmax', slug);
export const fetchDramaBoxEpisodes = async (slug: string) => /^\d+$/.test(slug)
  ? (await sansekaiDramaBoxEpisodes(slug)).map((episode) => ({ episodeId: episode.chapterId, providerEpisodeId: String(episode.chapterIndex + 1), episodeNo: episode.chapterIndex + 1, title: episode.chapterName || `Episode ${episode.chapterIndex + 1}`, durationMs: (episode.viewingDuration || 0) * 1000, isLocked: false }))
  : mapEpisodes(await rawEpisodes('dramabox', slug));
export const fetchShortMaxEpisodes = async (slug: string) => mapEpisodes(await rawEpisodes('shortmax', slug));
export const getDramaBoxPlayback = (slug: string, token: string) => playback('dramabox', slug, token);
export const getShortMaxPlayback = (slug: string, token: string) => playback('shortmax', slug, token);

export const dramaBoxProvider = { id: 'dramabox', slug: 'dramabox', name: 'DramaBox', rating: 0, dramaCount: 0, episodeCount: 0, status: 'active' as const, description: 'DramaBox', logoUrl: undefined, websiteUrl: undefined };
export const shortMaxProvider = { ...dramaBoxProvider, id: 'shortmax', slug: 'shortmax', name: 'ShortMax', description: 'ShortMax' };
