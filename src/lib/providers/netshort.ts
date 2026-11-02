import type { DramaCard, DramaDetail } from '@/lib/types';

type NetshortVariantLike = {
  title: string;
  tags?: string[];
  providerDramaId: string;
  episodeCount?: number;
  coverUrl?: string;
  rating?: number;
};

const SUBTITLE_PATTERNS = [/\bsubtitle\b/i, /\bsubbed\b/i];
const DUBBED_PATTERNS = [/\bdubbed\b/i, /sulih\s*suara/i];

function hasPattern(value: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(value));
}

export function normalizeNetshortVariantTitle(title: string): string {
  return title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\([^)]*(dubbed|subtitle|subbed|sulih\s*suara)[^)]*\)/gi, ' ')
    .replace(/\b(dubbed|subtitle|subbed|sulih\s*suara)\b/gi, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

export function hasNetshortSubtitleSignal(item: Pick<NetshortVariantLike, 'title' | 'tags'>): boolean {
  const tags = item.tags || [];
  return tags.some((tag) => hasPattern(tag, SUBTITLE_PATTERNS)) || hasPattern(item.title, SUBTITLE_PATTERNS);
}

export function hasNetshortDubbedSignal(item: Pick<NetshortVariantLike, 'title' | 'tags'>): boolean {
  const tags = item.tags || [];
  return tags.some((tag) => hasPattern(tag, DUBBED_PATTERNS)) || hasPattern(item.title, DUBBED_PATTERNS);
}

function scoreNetshortVariant(item: NetshortVariantLike): number {
  return (hasNetshortSubtitleSignal(item) ? 100 : 0)
    + (!hasNetshortDubbedSignal(item) ? 20 : 0)
    + ((item.episodeCount || 0) > 0 ? 10 : 0)
    + (item.coverUrl ? 5 : 0)
    + (item.rating ? 1 : 0);
}

export function pickPreferredNetshortVariant<T extends NetshortVariantLike>(
  existing: T,
  incoming: T,
): T {
  return scoreNetshortVariant(incoming) > scoreNetshortVariant(existing) ? incoming : existing;
}

export function dedupeNetshortVariantsByTitle<T extends NetshortVariantLike>(items: T[]): T[] {
  const byNormalizedTitle = new Map<string, T>();

  for (const item of items) {
    const normalizedTitle = normalizeNetshortVariantTitle(item.title) || `id:${item.providerDramaId}`;
    const existing = byNormalizedTitle.get(normalizedTitle);
    byNormalizedTitle.set(
      normalizedTitle,
      existing ? pickPreferredNetshortVariant(existing, item) : item,
    );
  }

  return Array.from(byNormalizedTitle.values());
}

export function findPreferredNetshortVariant<T extends DramaCard | DramaDetail>(items: T[]): T | null {
  const deduped = dedupeNetshortVariantsByTitle(items);
  return deduped[0] || null;
}
