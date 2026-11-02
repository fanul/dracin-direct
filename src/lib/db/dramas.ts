import { getSupabaseClient } from './client';
import { normalizeNetshortVariantTitle, pickPreferredNetshortVariant } from '../providers/netshort';
import type { DramaCard, DramaDetail, DramaWithRank, EpisodeItem, FeaturedDrama, ProviderInfo, ProviderSectionData } from '../types';

export interface DbDrama {
  id: string;
  provider_slug: string;
  provider_drama_id: string;
  title: string;
  synopsis: string;
  cover_url: string;
  cover_urls: string[];
  language: string;
  genres: string[];
  tags: string[];
  episode_count: number;
  is_premium: boolean;
  popularity_score: number;
  last_provider_update: string;
  last_synced_at: string;
  created_at: string;
  updated_at: string;
  providers?: {
    name: string;
  };
}

export interface DbEpisode {
  id: string;
  drama_id: string;
  provider_slug: string;
  provider_episode_id: string;
  episode_no: number;
  chapter_id: string;
  slug: string;
  title: string;
  duration_ms: number;
  is_locked: boolean;
  thumbnail_url?: string;
  last_synced_at: string;
}

export async function getHomeDramas(limit: number = 20): Promise<DramaCard[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('dramas')
    .select(`
      *,
      providers!inner(name)
    `)
    .eq('providers.status', 'active')
    .order('popularity_score', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch home dramas: ${error.message}`);
  }

  return (data as DbDrama[]).map(mapDbDramaToCard);
}

export async function getDramaById(id: string): Promise<DramaDetail | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('dramas')
    .select(`
      *,
      providers!inner(name)
    `)
    .eq('id', id)
    .single();

  if (error || !data) {
    return null;
  }

  return mapDbDramaToDetail(data as DbDrama);
}

export async function getDramaByProviderId(
  providerSlug: string,
  providerDramaId: string
): Promise<DramaDetail | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('dramas')
    .select(`
      *,
      providers!inner(name)
    `)
    .eq('provider_slug', providerSlug)
    .eq('provider_drama_id', providerDramaId)
    .limit(1)
    .maybeSingle();

  if (!error && data) {
    return mapDbDramaToDetail(data as DbDrama);
  }

  if (providerSlug !== 'netshort') {
    return null;
  }

  const normalizedTitle = normalizeNetshortVariantTitle(providerDramaId);
  if (!normalizedTitle) {
    return null;
  }

  const { data: variants, error: variantsError } = await supabase
    .from('dramas')
    .select(`
      *,
      providers!inner(name)
    `)
    .eq('provider_slug', providerSlug)
    .limit(200);

  if (variantsError || !variants || variants.length === 0) {
    return null;
  }

  const matched = (variants as DbDrama[])
    .map(mapDbDramaToDetail)
    .filter((drama) => normalizeNetshortVariantTitle(drama.title) === normalizedTitle)
    .reduce<DramaDetail | null>((preferred, drama) => (
      preferred ? pickPreferredNetshortVariant(preferred, drama) : drama
    ), null);

  return matched;
}

export async function getEpisodesByDramaId(dramaId: string): Promise<EpisodeItem[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('episodes')
    .select('*')
    .eq('drama_id', dramaId)
    .order('episode_no', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch episodes: ${error.message}`);
  }

  return (data as DbEpisode[]).map(mapDbEpisodeToItem);
}

export async function searchDramas(query: string, limit: number = 20): Promise<DramaCard[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('dramas')
    .select(`
      *,
      providers!inner(name)
    `)
    .textSearch('title', query)
    .limit(limit);

  if (error) {
    throw new Error(`Failed to search dramas: ${error.message}`);
  }

  return (data as DbDrama[]).map(mapDbDramaToCard);
}

function mapDbDramaToCard(drama: DbDrama): DramaCard {
  return {
    id: drama.id,
    providerSlug: drama.provider_slug,
    providerDramaId: drama.provider_drama_id,
    title: drama.title,
    coverUrl: drama.cover_url,
    episodeCount: drama.episode_count,
    rating: drama.popularity_score,
    tags: drama.tags || [],
    isPremium: drama.is_premium,
    providerName: drama.providers?.name || drama.provider_slug,
    vipLevel: 'VIP9',
  };
}

function mapDbDramaToDetail(drama: DbDrama): DramaDetail {
  return {
    ...mapDbDramaToCard(drama),
    synopsis: drama.synopsis,
    genres: drama.genres || [],
    language: drama.language,
    lastUpdated: drama.last_synced_at,
    popularityScore: drama.popularity_score,
  };
}

function mapDbEpisodeToItem(episode: DbEpisode): EpisodeItem {
  return {
    episodeId: episode.id,
    providerEpisodeId: episode.provider_episode_id,
    episodeNo: episode.episode_no,
    chapterId: episode.chapter_id,
    slug: episode.slug,
    title: episode.title,
    durationMs: episode.duration_ms,
    isLocked: episode.is_locked,
    thumbnailUrl: episode.thumbnail_url,
  };
}

// Phase 2: Drama Detail Enhancement Queries

export async function getRelatedDramas(
  dramaId: string,
  limit: number = 8
): Promise<DramaCard[]> {
  const supabase = getSupabaseClient();

  // First, get the current drama's genres and provider
  const { data: currentDrama } = await supabase
    .from('dramas')
    .select('genres, provider_slug')
    .eq('id', dramaId)
    .single();

  if (!currentDrama) {
    return [];
  }

  // Build the query - find dramas with same provider or matching genres
  let query = supabase
    .from('dramas')
    .select(`
      *,
      providers!inner(name)
    `)
    .eq('providers.status', 'active')
    .neq('id', dramaId);

  // Filter by same provider
  query = query.eq('provider_slug', currentDrama.provider_slug);

  // Execute the query
  const { data, error } = await query
    .order('popularity_score', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch related dramas: ${error.message}`);
  }

  return (data as DbDrama[]).map(mapDbDramaToCard);
}

export async function getEpisodesWithThumbnails(dramaId: string): Promise<EpisodeItem[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('episodes')
    .select('*')
    .eq('drama_id', dramaId)
    .order('episode_no', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch episodes with thumbnails: ${error.message}`);
  }

  return (data as DbEpisode[]).map(mapDbEpisodeToItem);
}

export async function getFeaturedDramas(limit: number = 5): Promise<FeaturedDrama[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('dramas')
    .select(`
      *,
      providers!inner(name)
    `)
    .eq('providers.status', 'active')
    .order('popularity_score', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch featured dramas: ${error.message}`);
  }

  return (data as DbDrama[]).map(drama => ({
    ...mapDbDramaToCard(drama),
    synopsis: drama.synopsis,
    isNew: new Date(drama.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000,
  }));
}

export async function getTrendingDramas(limit: number = 10): Promise<DramaWithRank[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('dramas')
    .select(`
      *,
      providers!inner(name)
    `)
    .eq('providers.status', 'active')
    .order('popularity_score', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch trending dramas: ${error.message}`);
  }

  return (data as DbDrama[]).map((drama, index) => ({
    ...mapDbDramaToCard(drama),
    rank: index + 1,
  }));
}

export async function getNewReleases(limit: number = 20): Promise<DbDrama[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('dramas')
    .select(`
      *,
      providers!inner(name)
    `)
    .eq('providers.status', 'active')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch new releases: ${error.message}`);
  }

  return (data as DbDrama[]);
}

export async function getTopProviders(limit: number = 6): Promise<ProviderInfo[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('providers')
    .select('slug, name, vip_group')
    .eq('status', 'active')
    .order('vip_group', { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch top providers: ${error.message}`);
  }

  // Get content counts for each provider
  const providerSlugs = (data || []).map(p => p.slug);
  const { data: counts, error: countError } = await supabase
    .from('dramas')
    .select('provider_slug')
    .in('provider_slug', providerSlugs);

  if (countError) {
    throw new Error(`Failed to fetch provider counts: ${countError.message}`);
  }

  const countMap = new Map<string, number>();
  (counts || []).forEach(d => {
    countMap.set(d.provider_slug, (countMap.get(d.provider_slug) || 0) + 1);
  });

  return (data || []).map(provider => ({
    slug: provider.slug,
    name: provider.name,
    contentCount: countMap.get(provider.slug) || 0,
  }));
}

export async function getProviderSections(): Promise<ProviderSectionData[]> {
  const providers = (await getTopProvidersByContent(100)).filter(
    (provider) => provider.contentCount > 0
  );
  const supabase = getSupabaseClient();

  const sectionResults = await Promise.all(
    providers.map(async (provider) => {
      const { data: dramas, error } = await supabase
        .from('dramas')
        .select(`
          *,
          providers!inner(name)
        `)
        .eq('provider_slug', provider.slug)
        .order('popularity_score', { ascending: false })
        .limit(10);

      if (error) {
        return null;
      }

      return {
        provider: {
          slug: provider.slug,
          name: provider.name,
          contentCount: provider.contentCount,
        },
        dramas: (dramas as DbDrama[]).map(mapDbDramaToCard),
        totalCount: provider.contentCount,
      } satisfies ProviderSectionData;
    })
  );

  return sectionResults.filter((section): section is ProviderSectionData => section !== null);
}

export async function getAllProviders(): Promise<ProviderInfo[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('providers')
    .select('slug, name, vip_group')
    .eq('status', 'active')
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch providers: ${error.message}`);
  }

  return (data || []).map(provider => ({
    slug: provider.slug,
    name: provider.name,
    contentCount: 0,
  }));
}

export async function getTopProvidersByContent(limit: number = 10): Promise<ProviderInfo[]> {
  const supabase = getSupabaseClient();

  const { data: providersData, error: providersError } = await supabase
    .from('providers')
    .select('slug, name')
    .eq('status', 'active');

  if (providersError) {
    throw new Error(`Failed to fetch providers: ${providersError.message}`);
  }

  const { data: counts, error: countError } = await supabase
    .from('dramas')
    .select('provider_slug');

  if (countError) {
    throw new Error(`Failed to fetch provider counts: ${countError.message}`);
  }

  const countMap = new Map<string, number>();
  (counts || []).forEach((row) => {
    countMap.set(row.provider_slug, (countMap.get(row.provider_slug) || 0) + 1);
  });

  return (providersData || [])
    .map((provider) => ({
      slug: provider.slug,
      name: provider.name,
      contentCount: countMap.get(provider.slug) || 0,
    }))
    .sort((a, b) => b.contentCount - a.contentCount || a.name.localeCompare(b.name))
    .slice(0, limit);
}

export async function getForYouDramas(limit: number = 10): Promise<DramaCard[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('dramas')
    .select(`
      *,
      providers!inner(name)
    `)
    .eq('providers.status', 'active')
    .order('created_at', { ascending: false })
    .order('popularity_score', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch for-you dramas: ${error.message}`);
  }

  return (data as DbDrama[]).map(mapDbDramaToCard);
}

export async function getPaginatedTrendingDramas(page: number, limit: number): Promise<{ dramas: DramaWithRank[]; total: number }> {
  const supabase = getSupabaseClient();
  const from = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from('dramas')
    .select(`
      *,
      providers!inner(name)
    `, { count: 'exact' })
    .eq('providers.status', 'active')
    .order('popularity_score', { ascending: false })
    .range(from, from + limit - 1);

  if (error) {
    throw new Error(`Failed to fetch paginated trending dramas: ${error.message}`);
  }

  const dramas = (data as DbDrama[]).map((drama, index) => ({
    ...mapDbDramaToCard(drama),
    rank: from + index + 1,
  }));

  return {
    dramas,
    total: count || 0,
  };
}

export async function getPaginatedForYouDramas(page: number, limit: number): Promise<{ dramas: DramaCard[]; total: number }> {
  const supabase = getSupabaseClient();
  const from = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from('dramas')
    .select(`
      *,
      providers!inner(name)
    `, { count: 'exact' })
    .eq('providers.status', 'active')
    .order('created_at', { ascending: false })
    .order('popularity_score', { ascending: false })
    .range(from, from + limit - 1);

  if (error) {
    throw new Error(`Failed to fetch paginated for-you dramas: ${error.message}`);
  }

  return {
    dramas: (data as DbDrama[]).map(mapDbDramaToCard),
    total: count || 0,
  };
}

export async function getPaginatedNewReleases(page: number, limit: number): Promise<{ dramas: DramaCard[]; total: number }> {
  const supabase = getSupabaseClient();
  const from = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from('dramas')
    .select(`
      *,
      providers!inner(name)
    `, { count: 'exact' })
    .eq('providers.status', 'active')
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1);

  if (error) {
    throw new Error(`Failed to fetch paginated new releases: ${error.message}`);
  }

  return {
    dramas: (data as DbDrama[]).map(mapDbDramaToCard),
    total: count || 0,
  };
}
