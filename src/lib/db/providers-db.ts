import { getSupabaseClient } from './client';
import type { DramaCard } from '../types';
import type { DbDrama } from './dramas';

export interface ProviderDetail {
    id: string;
    slug: string;
    name: string;
    logoUrl?: string;
    rating: number;
    dramaCount: number;
    episodeCount: number;
    websiteUrl?: string;
    description?: string;
    status: 'active' | 'maintenance' | 'disabled';
}

export interface ProviderWithDramas {
    provider: ProviderDetail;
    dramas: DramaCard[];
    genres: string[];
    total: number;
}

export interface ProviderCatalogCompleteness {
    isPossiblyIncomplete: boolean;
    reason: 'not_target_provider' | 'provider_inactive' | 'db_has_more' | 'db_only_partial_tail' | 'db_page_empty' | 'db_empty';
}

export function assessProviderCatalogCompleteness(params: {
    providerSlug: string;
    providerStatus: ProviderDetail['status'];
    page: number;
    limit: number;
    pageCount: number;
    total: number;
}): ProviderCatalogCompleteness {
    const { providerSlug, providerStatus, page, limit, pageCount, total } = params;

    const fallbackEligibleProviders = new Set(['goodshort', 'netshort']);
    if (!fallbackEligibleProviders.has(providerSlug)) {
        return { isPossiblyIncomplete: false, reason: 'not_target_provider' };
    }

    if (providerStatus !== 'active') {
        return { isPossiblyIncomplete: false, reason: 'provider_inactive' };
    }

    if (total === 0) {
        return { isPossiblyIncomplete: true, reason: 'db_empty' };
    }

    const dbHasMore = page * limit < total;
    if (dbHasMore) {
        return { isPossiblyIncomplete: false, reason: 'db_has_more' };
    }

    if (pageCount === 0) {
        return { isPossiblyIncomplete: true, reason: 'db_page_empty' };
    }

    if (pageCount < limit) {
        return { isPossiblyIncomplete: true, reason: 'db_only_partial_tail' };
    }

    return { isPossiblyIncomplete: false, reason: 'db_has_more' };
}

/**
 * Get provider by slug with full details
 */
export async function getProviderBySlug(slug: string): Promise<ProviderDetail | null> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('providers')
        .select('*')
        .eq('slug', slug)
        .single();

    if (error || !data) {
        return null;
    }

    // Get drama count
    const { count: dramaCount } = await supabase
        .from('dramas')
        .select('*', { count: 'exact', head: true })
        .eq('provider_slug', slug);

    // Get episode count
    const { count: episodeCount } = await supabase
        .from('episodes')
        .select('*', { count: 'exact', head: true })
        .eq('provider_slug', slug);

    // Calculate average rating from dramas
    const { data: ratingData } = await supabase
        .from('dramas')
        .select('popularity_score')
        .eq('provider_slug', slug)
        .not('popularity_score', 'is', null);

    let avgRating = 4.5;
    if (ratingData && ratingData.length > 0) {
        const scores = ratingData.map((d: { popularity_score: number | null }) => d.popularity_score || 0);
        avgRating = scores.reduce((a, b) => a + b, 0) / scores.length;
    }

    return {
        id: data.id,
        slug: data.slug,
        name: data.name,
        logoUrl: undefined, // Could be stored in providers table in the future
        rating: Math.round(avgRating * 10) / 10,
        dramaCount: dramaCount || 0,
        episodeCount: episodeCount || 0,
        websiteUrl: data.endpoints?.baseUrl,
        description: undefined,
        status: data.status,
    };
}

/**
 * Get dramas by provider with pagination and optional genre filter
 */
export async function getDramasByProvider(
    providerSlug: string,
    page: number = 1,
    limit: number = 20,
    genre?: string
): Promise<{ dramas: DramaCard[]; total: number }> {
    const supabase = getSupabaseClient();

    // First, check total count without any filters
    const { count: totalCount } = await supabase
        .from('dramas')
        .select('*', { count: 'exact', head: true })
        .eq('provider_slug', providerSlug);

    // eslint-disable-next-line no-console
    console.error(`[DEBUG DB COUNT] ${providerSlug}: totalCount=${totalCount || 0}`);

    let query = supabase
        .from('dramas')
        .select('*', { count: 'exact' })
        .eq('provider_slug', providerSlug);

    // Filter by genre if specified
    if (genre && genre !== 'all') {
        query = query.contains('genres', [genre]);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    query = query
        .order('popularity_score', { ascending: false })
        .range(from, from + limit - 1);

    const { data, error, count } = await query;

    // eslint-disable-next-line no-console
    console.error(`[DEBUG DB] ${providerSlug}: data=${data?.length || 0}, count=${count || 0}, error=${error?.message || 'none'}`);

    if (error) {
        throw new Error(`Failed to fetch provider dramas: ${error.message}`);
    }

    const dramas = (data as DbDrama[]).map((drama) => ({
        id: drama.id,
        providerSlug: drama.provider_slug,
        providerDramaId: drama.provider_drama_id,
        title: drama.title,
        coverUrl: drama.cover_url,
        episodeCount: drama.episode_count,
        rating: drama.popularity_score ? parseFloat(drama.popularity_score.toString()) : undefined,
        tags: drama.tags || [],
        isPremium: drama.is_premium,
        providerName: providerSlug,
        vipLevel: 'VIP9',
    }));

    return {
        dramas,
        total: count || 0,
    };
}

/**
 * Get all genres available for a provider
 */
export async function getProviderGenres(providerSlug: string): Promise<string[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('dramas')
        .select('genres')
        .eq('provider_slug', providerSlug);

    if (error) {
        throw new Error(`Failed to fetch provider genres: ${error.message}`);
    }

    const genres = new Set<string>();
    (data || []).forEach((row: { genres: string[] | null }) => {
        if (row.genres && Array.isArray(row.genres)) {
            row.genres.forEach((genre: string) => {
                const normalizedGenre = genre.trim();
                if (normalizedGenre) {
                    genres.add(normalizedGenre);
                }
            });
        }
    });

    return Array.from(genres).sort();
}

/**
 * Get all active providers
 */
export async function getActiveProviders(): Promise<ProviderDetail[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('providers')
        .select('*')
        .eq('status', 'active')
        .order('name');

    if (error) {
        throw new Error(`Failed to fetch providers: ${error.message}`);
    }

    return Promise.all(
        (data || []).map(async (provider) => {
            const { count: dramaCount } = await supabase
                .from('dramas')
                .select('*', { count: 'exact', head: true })
                .eq('provider_slug', provider.slug);

            return {
                id: provider.id,
                slug: provider.slug,
                name: provider.name,
                logoUrl: undefined,
                rating: 4.5,
                dramaCount: dramaCount || 0,
                episodeCount: 0,
                status: provider.status,
            };
        })
    );
}
