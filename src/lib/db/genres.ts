import { getSupabaseClient } from './client';
import type { DramaCard } from '../types';
import type { DbDrama } from './dramas';

export interface GenreInfo {
    id: string;
    name: string;
    slug: string;
    description?: string;
    dramaCount: number;
}

export interface GenreWithDramas {
    genre: GenreInfo;
    dramas: DramaCard[];
    total: number;
}

/**
 * Get all available genres with drama counts
 */
export async function getAllGenres(): Promise<GenreInfo[]> {
    const supabase = getSupabaseClient();

    // Get all unique genres from dramas table
    const { data, error } = await supabase
        .from('dramas')
        .select('genres');

    if (error) {
        throw new Error(`Failed to fetch genres: ${error.message}`);
    }

    // Count dramas per genre
    const genreCounts = new Map<string, number>();
    const genreNames = new Set<string>();

    (data || []).forEach((row: { genres: string[] | null }) => {
        if (row.genres && Array.isArray(row.genres)) {
            row.genres.forEach((genre: string) => {
                const normalizedGenre = genre.trim();
                if (normalizedGenre) {
                    genreNames.add(normalizedGenre);
                    genreCounts.set(normalizedGenre, (genreCounts.get(normalizedGenre) || 0) + 1);
                }
            });
        }
    });

    // Create genre info objects with slugs
    return Array.from(genreNames)
        .sort()
        .map((name) => ({
            id: createGenreSlug(name),
            name,
            slug: createGenreSlug(name),
            dramaCount: genreCounts.get(name) || 0,
        }));
}

/**
 * Get genre info by slug
 */
export async function getGenreBySlug(slug: string): Promise<GenreInfo | null> {
    const genres = await getAllGenres();
    return genres.find((g) => g.slug === slug) || null;
}

/**
 * Get dramas by genre with pagination
 */
export async function getDramasByGenre(
    genreSlug: string,
    page: number = 1,
    limit: number = 20,
    sortBy: 'popular' | 'newest' | 'rating' = 'popular',
    providerSlug?: string
): Promise<{ dramas: DramaCard[]; total: number }> {
    const supabase = getSupabaseClient();

    // Find the genre name from the slug
    const genres = await getAllGenres();
    const genre = genres.find((g) => g.slug === genreSlug);

    if (!genre) {
        return { dramas: [], total: 0 };
    }

    // Build the query
    let query = supabase
        .from('dramas')
        .select(`
      *,
      providers!inner(name)
    `, { count: 'exact' })
        .eq('providers.status', 'active')
        .contains('genres', [genre.name]);

    // Filter by provider if specified
    if (providerSlug && providerSlug !== 'all') {
        query = query.eq('provider_slug', providerSlug);
    }

    // Apply sorting
    switch (sortBy) {
        case 'popular':
            query = query.order('popularity_score', { ascending: false });
            break;
        case 'newest':
            query = query.order('created_at', { ascending: false });
            break;
        case 'rating':
            query = query.order('popularity_score', { ascending: false });
            break;
        default:
            query = query.order('popularity_score', { ascending: false });
    }

    // Apply pagination
    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);

    const { data, error, count } = await query;

    if (error) {
        throw new Error(`Failed to fetch dramas by genre: ${error.message}`);
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
        providerName: drama.providers?.name || drama.provider_slug,
        vipLevel: 'VIP9',
    }));

    return {
        dramas,
        total: count || 0,
    };
}

/**
 * Create URL-friendly slug from genre name
 */
function createGenreSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
