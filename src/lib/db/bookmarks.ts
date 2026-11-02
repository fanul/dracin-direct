import { getSupabaseClient } from './client';
import type { DramaCard } from '../types';
import type { DbDrama } from './dramas';

export interface BookmarkItem {
    id: string;
    dramaId: string;
    createdAt: string;
}

/**
 * Get all bookmarks for a user
 */
export async function getUserBookmarks(userId: string): Promise<DramaCard[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('bookmarks')
        .select(`
      id,
      created_at,
      dramas(
        id,
        provider_slug,
        provider_drama_id,
        title,
        cover_url,
        episode_count,
        popularity_score,
        tags,
        is_premium,
        providers!inner(name)
      )
    `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        throw new Error(`Failed to fetch bookmarks: ${error.message}`);
    }

    return (data || []).map((row: any) => {
        const drama = row.dramas;
        return {
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
        };
    });
}

/**
 * Check if a drama is bookmarked by the user
 */
export async function isDramaBookmarked(userId: string, dramaId: string): Promise<boolean> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', userId)
        .eq('drama_id', dramaId)
        .single();

    if (error) {
        return false;
    }

    return !!data;
}

/**
 * Add a drama to user's bookmarks
 */
export async function addBookmark(userId: string, dramaId: string): Promise<void> {
    const supabase = getSupabaseClient();

    const { error } = await supabase
        .from('bookmarks')
        .insert({
            user_id: userId,
            drama_id: dramaId,
        });

    if (error) {
        // Ignore unique constraint violations (already bookmarked)
        if (error.code === '23505') {
            return;
        }
        throw new Error(`Failed to add bookmark: ${error.message}`);
    }
}

/**
 * Remove a drama from user's bookmarks
 */
export async function removeBookmark(userId: string, dramaId: string): Promise<void> {
    const supabase = getSupabaseClient();

    const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', userId)
        .eq('drama_id', dramaId);

    if (error) {
        throw new Error(`Failed to remove bookmark: ${error.message}`);
    }
}

/**
 * Toggle bookmark status for a drama
 */
export async function toggleBookmark(userId: string, dramaId: string): Promise<boolean> {
    const isBookmarked = await isDramaBookmarked(userId, dramaId);

    if (isBookmarked) {
        await removeBookmark(userId, dramaId);
        return false;
    } else {
        await addBookmark(userId, dramaId);
        return true;
    }
}

/**
 * Clear all bookmarks for a user
 */
export async function clearAllBookmarks(userId: string): Promise<void> {
    const supabase = getSupabaseClient();

    const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', userId);

    if (error) {
        throw new Error(`Failed to clear bookmarks: ${error.message}`);
    }
}
