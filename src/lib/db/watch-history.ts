import { getSupabaseClient } from './client';

export interface WatchHistoryEntry {
  userId: string;
  dramaId: string;
  episodeId: string; // Can be UUID or provider-specific ID
  progressSeconds: number;
  isCompleted: boolean;
}

/**
 * Resolve episode ID to database UUID if possible
 * 
 * The episodeId from the client can be:
 * 1. A UUID (already the database episode.id) - return as-is
 * 2. A provider-specific ID (episode number, slug, etc.) - look up in DB
 * 
 * Returns null if the episode cannot be found (progress saved without episode FK)
 */
async function resolveEpisodeId(
  dramaId: string,
  episodeId: string
): Promise<string | null> {
  // Check if it's already a UUID
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidPattern.test(episodeId)) {
    return episodeId;
  }

  const supabase = getSupabaseClient();

  // Try to resolve by episode_no (numeric string)
  const episodeNo = parseInt(episodeId, 10);
  if (!isNaN(episodeNo)) {
    const { data } = await supabase
      .from('episodes')
      .select('id')
      .eq('drama_id', dramaId)
      .eq('episode_no', episodeNo)
      .single();

    if (data) {
      return data.id;
    }
  }

  // Try to resolve by provider_episode_id
  const { data: byProviderId } = await supabase
    .from('episodes')
    .select('id')
    .eq('drama_id', dramaId)
    .eq('provider_episode_id', episodeId)
    .single();

  if (byProviderId) {
    return byProviderId.id;
  }

  // Try to resolve by slug
  const { data: bySlug } = await supabase
    .from('episodes')
    .select('id')
    .eq('drama_id', dramaId)
    .eq('slug', episodeId)
    .single();

  if (bySlug) {
    return bySlug.id;
  }

  // Try to resolve by chapter_id
  const { data: byChapter } = await supabase
    .from('episodes')
    .select('id')
    .eq('drama_id', dramaId)
    .eq('chapter_id', episodeId)
    .single();

  if (byChapter) {
    return byChapter.id;
  }

  // Episode not found - return null (progress saved without episode FK)
  return null;
}

export async function upsertWatchProgress(
  entry: WatchHistoryEntry
): Promise<void> {
  const supabase = getSupabaseClient();

  // Current schema requires watch_history.user_id as UUID; guest/non-UUID progress is accepted as no-op
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(entry.userId)) {
    return;
  }

  // Resolve provider-scoped drama id (e.g. "goodshort:31001143495") to DB uuid when possible
  let resolvedDramaId = entry.dramaId;
  if (!uuidPattern.test(resolvedDramaId)) {
    const [providerSlug, providerDramaId] = resolvedDramaId.split(':');
    if (providerSlug && providerDramaId) {
      const { data: dramaRow } = await supabase
        .from('dramas')
        .select('id')
        .eq('provider_slug', providerSlug)
        .eq('provider_drama_id', providerDramaId)
        .single();

      if (dramaRow?.id) {
        resolvedDramaId = dramaRow.id;
      } else {
        // Cannot persist when drama FK is unresolved in current schema
        return;
      }
    } else {
      // Unsupported drama id format for current schema; skip persistence safely
      return;
    }
  }

  // Resolve episode ID to UUID if possible
  const resolvedEpisodeId = await resolveEpisodeId(resolvedDramaId, entry.episodeId);

  const payload = {
    user_id: entry.userId,
    drama_id: resolvedDramaId,
    episode_id: resolvedEpisodeId, // null if episode not found
    progress_seconds: entry.progressSeconds,
    is_completed: entry.isCompleted,
    last_watched_at: new Date().toISOString(),
  };

  // Try update-first strategy to avoid fragile ON CONFLICT assumptions across environments
  let updateQuery = supabase
    .from('watch_history')
    .update(payload)
    .eq('user_id', entry.userId)
    .eq('drama_id', resolvedDramaId);

  updateQuery = resolvedEpisodeId
    ? updateQuery.eq('episode_id', resolvedEpisodeId)
    : updateQuery.is('episode_id', null);

  const { data: updatedRows, error: updateError } = await updateQuery.select('id').limit(1);

  if (updateError) {
    throw new Error(`Failed to save watch progress: ${updateError.message}`);
  }

  if (updatedRows && updatedRows.length > 0) {
    return;
  }

  const { error: insertError } = await supabase
    .from('watch_history')
    .insert(payload);

  if (insertError) {
    throw new Error(`Failed to save watch progress: ${insertError.message}`);
  }
}

export async function getContinueWatching(
  userId: string,
  limit: number = 10
): Promise<Array<{
  dramaId: string;
  dramaTitle: string;
  episodeId: string;
  episodeNo: number;
  progressSeconds: number;
  coverUrl: string;
}>> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('watch_history')
    .select(`
      drama_id,
      episode_id,
      progress_seconds,
      dramas(id, title, cover_url),
      episodes(id, episode_no)
    `)
    .eq('user_id', userId)
    .eq('is_completed', false)
    .order('last_watched_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch continue watching: ${error.message}`);
  }

  return (data || []).map((row: any) => ({
    dramaId: row.drama_id,
    dramaTitle: row.dramas?.title || '',
    episodeId: row.episode_id,
    episodeNo: row.episodes?.episode_no || 0,
    progressSeconds: row.progress_seconds,
    coverUrl: row.dramas?.cover_url || '',
  }));
}

// Phase 2: Drama Detail Enhancement - Get watch progress for a specific drama
export async function getWatchProgressForDrama(
  userId: string,
  dramaId: string
): Promise<{
  episodeId: string;
  episodeNo: number;
  episodeTitle?: string;
  progressSeconds: number;
  durationMs: number;
  coverUrl: string;
  lastWatchedAt: string;
} | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('watch_history')
    .select(`
      episode_id,
      progress_seconds,
      last_watched_at,
      episodes(id, episode_no, title, duration_ms),
      dramas(cover_url)
    `)
    .eq('user_id', userId)
    .eq('drama_id', dramaId)
    .eq('is_completed', false)
    .order('last_watched_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  // Supabase returns related data as arrays, get first item
  const episodes = (data as any).episodes;
  const dramas = (data as any).dramas;
  const episode = Array.isArray(episodes) ? episodes[0] : episodes;
  const drama = Array.isArray(dramas) ? dramas[0] : dramas;

  return {
    episodeId: data.episode_id,
    episodeNo: episode?.episode_no || 0,
    episodeTitle: episode?.title,
    progressSeconds: data.progress_seconds,
    durationMs: episode?.duration_ms || 0,
    coverUrl: drama?.cover_url || '',
    lastWatchedAt: data.last_watched_at,
  };
}

// Get all watched episodes for a drama
export async function getWatchedEpisodes(
  userId: string,
  dramaId: string
): Promise<number[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('watch_history')
    .select(`
      episodes(episode_no)
    `)
    .eq('user_id', userId)
    .eq('drama_id', dramaId);

  if (error || !data) {
    return [];
  }

  return (data as any[]).map(row => row.episodes?.episode_no).filter(Boolean);
}

// Watch History Types for History Page
export interface HistoryItem {
  id: string;
  dramaId: string;
  dramaTitle: string;
  coverUrl: string;
  episodeId: string;
  episodeNo: number;
  episodeTitle?: string;
  totalEpisodes: number;
  progressSeconds: number;
  durationMs: number;
  progressPercent: number;
  providerSlug: string;
  providerName: string;
  providerDramaId?: string;
  lastWatchedAt: string;
}

export interface GroupedHistory {
  today: HistoryItem[];
  yesterday: HistoryItem[];
  lastWeek: HistoryItem[];
  lastMonth: HistoryItem[];
  older: HistoryItem[];
}

/**
 * Get full watch history for a user, grouped by date
 */
export async function getWatchHistory(userId: string, limit: number = 100): Promise<GroupedHistory> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('watch_history')
    .select(`
      id,
      drama_id,
      episode_id,
      progress_seconds,
      last_watched_at,
      dramas(id, title, cover_url, episode_count, provider_slug, provider_drama_id),
      episodes(id, episode_no, title, duration_ms)
    `)
    .eq('user_id', userId)
    .order('last_watched_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch watch history: ${error.message}`);
  }

  const items: HistoryItem[] = (data || []).map((row: any) => {
    const drama = row.dramas;
    const episode = row.episodes;
    const durationMs = episode?.duration_ms || 0;
    const progressSeconds = row.progress_seconds || 0;
    const progressPercent = durationMs > 0
      ? Math.min(100, Math.round((progressSeconds * 1000 / durationMs) * 100))
      : 0;

    return {
      id: row.id,
      dramaId: row.drama_id,
      dramaTitle: drama?.title || 'Unknown Drama',
      coverUrl: drama?.cover_url || '',
      episodeId: row.episode_id,
      episodeNo: episode?.episode_no || 0,
      episodeTitle: episode?.title,
      totalEpisodes: drama?.episode_count || 0,
      progressSeconds,
      durationMs,
      progressPercent,
      providerSlug: drama?.provider_slug || '',
      providerName: drama?.provider_slug || '',
      providerDramaId: drama?.provider_drama_id || '',
      lastWatchedAt: row.last_watched_at,
    };
  });

  return groupHistoryByDate(items);
}

/**
 * Group history items by date categories
 */
function groupHistoryByDate(items: HistoryItem[]): GroupedHistory {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);
  const lastMonth = new Date(today);
  lastMonth.setDate(lastMonth.getDate() - 30);

  const grouped: GroupedHistory = {
    today: [],
    yesterday: [],
    lastWeek: [],
    lastMonth: [],
    older: [],
  };

  items.forEach((item) => {
    const watchedDate = new Date(item.lastWatchedAt);
    const watchedDay = new Date(watchedDate.getFullYear(), watchedDate.getMonth(), watchedDate.getDate());

    if (watchedDay.getTime() === today.getTime()) {
      grouped.today.push(item);
    } else if (watchedDay.getTime() === yesterday.getTime()) {
      grouped.yesterday.push(item);
    } else if (watchedDay.getTime() > lastWeek.getTime()) {
      grouped.lastWeek.push(item);
    } else if (watchedDay.getTime() > lastMonth.getTime()) {
      grouped.lastMonth.push(item);
    } else {
      grouped.older.push(item);
    }
  });

  return grouped;
}

/**
 * Delete a single watch history entry
 */
export async function deleteWatchHistoryEntry(userId: string, historyId: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('watch_history')
    .delete()
    .eq('id', historyId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete watch history: ${error.message}`);
  }
}

/**
 * Clear all watch history for a user
 */
export async function clearAllWatchHistory(userId: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('watch_history')
    .delete()
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to clear watch history: ${error.message}`);
  }
}
