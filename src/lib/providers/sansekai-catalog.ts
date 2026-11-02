import type { DramaCard, ProviderInfo } from '@/lib/types';

const API = 'https://api.sansekai.my.id/api';

type Config = { slug: string; name: string; path: string; category: string };

export const sansekaiProviders: Config[] = [
  { slug: 'pinedrama', name: 'PineDrama', path: '/pinedrama/foryou?lang=id', category: 'Untukmu' },
  { slug: 'dramabox', name: 'DramaBox', path: '/dramabox/foryou?page=1&lang=id', category: 'Untukmu' },
  { slug: 'reelshort', name: 'ReelShort', path: '/reelshort/homepage?lang=id', category: 'Pilihan' },
  { slug: 'shortmax', name: 'ShortMax', path: '/shortmax/foryou?page=1&lang=id', category: 'Untukmu' },
  { slug: 'goodshort', name: 'GoodShort', path: '/goodshort/foryou?page=1&lang=id', category: 'Untukmu' },
  { slug: 'netshort', name: 'NetShort', path: '/netshort/foryou?page=1&lang=id', category: 'Untukmu' },
  { slug: 'melolo', name: 'Melolo', path: '/melolo/foryou?offset=0&lang=id', category: 'Untukmu' },
  { slug: 'freereels', name: 'FreeReels', path: '/freereels/foryou?offset=0&lang=id', category: 'Untukmu' },
  { slug: 'flickreels', name: 'FlickReels', path: '/flickreels/foryou?page=1&lang=id', category: 'Untukmu' },
];

const first = (value: Record<string, unknown>, keys: string[]) => keys.map((key) => value[key]).find((item) => typeof item === 'string' || typeof item === 'number');
const strings = (value: unknown): string[] => Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

function objects(value: unknown, depth = 0): Record<string, unknown>[] {
  if (depth > 5 || value == null) return [];
  if (Array.isArray(value)) return value.flatMap((item) => objects(item, depth + 1));
  if (typeof value !== 'object') return [];
  const item = value as Record<string, unknown>;
  const own = first(item, ['collection_id', 'bookId', 'playlet_id', 'playletId', 'shortPlayId', 'book_id', 'key', 'id']) && first(item, ['title', 'bookName', 'name', 'book_name']) ? [item] : [];
  return [...own, ...Object.values(item).flatMap((child) => objects(child, depth + 1))];
}

export function normalizeSansekaiCatalog(payload: unknown, config: Config): DramaCard[] {
  const cards = objects(payload).flatMap((item): DramaCard[] => {
    const id = first(item, ['collection_id', 'bookId', 'playlet_id', 'playletId', 'shortPlayId', 'book_id', 'key', 'id']);
    const title = first(item, ['title', 'bookName', 'name', 'book_name']);
    if (id == null || title == null) return [];
    const cover = first(item, ['cover', 'coverWap', 'thumb_url', 'image', 'imageUrl', 'dynamic_cover']);
    const count = first(item, ['total_episodes', 'chapterCount', 'upload_num', 'totalEpisodes', 'serial_count', 'episode_count']);
    const tags = [config.category, ...strings(item.tags), ...strings(item.labels), ...strings(item.playlet_tag_name), ...strings(item.tagNames)];
    return [{ id: `${config.slug}:${id}`, providerSlug: config.slug, providerDramaId: String(id), title: String(title), coverUrl: cover == null ? '' : String(cover), episodeCount: Number(count) || 0, tags: [...new Set(tags)], isPremium: false, providerName: config.name, vipLevel: 'FREE' }];
  });
  return [...new Map(cards.map((card) => [card.providerDramaId, card])).values()];
}

export async function fetchSansekaiCatalog(config: Config): Promise<DramaCard[]> {
  const response = await fetch(`${API}${config.path}`, { cache: 'no-store', headers: { 'User-Agent': 'Mozilla/5.0 DracinHub/1.0' } });
  if (!response.ok) throw new Error(`SANSEKAI_${config.slug}_${response.status}`);
  return normalizeSansekaiCatalog(await response.json(), config);
}

export const sansekaiProviderInfo = (config: Config, count: number): ProviderInfo => ({ slug: config.slug, name: config.name, contentCount: count, isNew: true });
