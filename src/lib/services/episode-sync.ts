import { getSupabaseClient } from '../db/client';
import { providerCatalog } from '../providers/catalog';
import { getAdapter } from '../providers/adapters';
import { createCaptainClient } from '../http/captain-client';
import { logger } from '../observability/logger';
import type { EpisodeItem } from '../types';

const captainToken = process.env.CAPTAIN_API_TOKEN || '';
const captainClient = createCaptainClient(captainToken);

export interface SyncEpisodesResult {
  dramaId: string;
  episodesInserted: number;
  episodesUpdated: number;
  totalEpisodes: number;
}

/**
 * Sync episodes from provider API to database
 */
export async function syncEpisodesFromProvider(
  dramaId: string,
  providerSlug: string,
  providerDramaId: string,
  requestId: string = 'system'
): Promise<SyncEpisodesResult | null> {
  const startTime = Date.now();

  try {
    // Resolve episodes endpoint
    let resolved = providerCatalog.resolveEndpoint(providerSlug, 'episodes', {
      id: providerDramaId,
      dramaId: providerDramaId,
      bookId: providerDramaId,
      seriesId: providerDramaId,
      vid: providerDramaId,
      code: providerDramaId,
    });

    // Fallback to detail endpoint if episodes endpoint doesn't exist
    // (Some providers like DramaNova include episodes in detail response)
    if (!resolved) {
      resolved = providerCatalog.resolveEndpoint(providerSlug, 'detail', {
        id: providerDramaId,
        dramaId: providerDramaId,
        bookId: providerDramaId,
        seriesId: providerDramaId,
        vid: providerDramaId,
        code: providerDramaId,
      });

      if (!resolved) {
        logger.warn('episode_sync_no_endpoint', {
          requestId,
          provider: providerSlug,
          providerDramaId,
        });
        return null;
      }

      logger.info('episode_sync_using_detail_endpoint', {
        requestId,
        provider: providerSlug,
        providerDramaId,
      });
    }

    // Fetch from provider API
    const response = await captainClient.get(resolved.url, {
      provider: providerSlug,
      requestId,
      timeout: 10000,
    });

    // Map response using adapter
    const adapter = getAdapter(providerSlug);
    if (!adapter) {
      logger.warn('episode_sync_no_adapter', {
        requestId,
        provider: providerSlug,
      });
      return null;
    }

    const episodes = adapter.mapEpisodes(response.data);

    // Sync to database
    const result = await syncEpisodesToDb(dramaId, providerSlug, episodes);

    logger.info('episode_sync_success', {
      requestId,
      provider: providerSlug,
      providerDramaId,
      dramaId,
      ...result,
      latencyMs: Date.now() - startTime,
    });

    return {
      dramaId,
      ...result,
    };
  } catch (error) {
    logger.error('episode_sync_failed', {
      requestId,
      provider: providerSlug,
      providerDramaId,
      dramaId,
      error: error instanceof Error ? error.message : 'Unknown',
      latencyMs: Date.now() - startTime,
    });
    return null;
  }
}

/**
 * Sync episodes to database
 */
async function syncEpisodesToDb(
  dramaId: string,
  providerSlug: string,
  episodes: EpisodeItem[]
): Promise<{ episodesInserted: number; episodesUpdated: number; totalEpisodes: number }> {
  const supabase = getSupabaseClient();

  let inserted = 0;
  let updated = 0;

  // Get existing episodes
  const { data: existingEpisodes } = await supabase
    .from('episodes')
    .select('id, episode_no, provider_episode_id')
    .eq('drama_id', dramaId);

  const existingMap = new Map(
    (existingEpisodes || []).map(e => [
      e.episode_no,
      { id: e.id, providerEpisodeId: e.provider_episode_id }
    ])
  );

  for (const episode of episodes) {
    const episodeData = {
      drama_id: dramaId,
      provider_slug: providerSlug,
      provider_episode_id: episode.providerEpisodeId || episode.episodeId,
      episode_no: episode.episodeNo,
      chapter_id: episode.chapterId,
      slug: episode.slug,
      title: episode.title,
      duration_ms: episode.durationMs,
      is_locked: episode.isLocked,
      thumbnail_url: episode.thumbnailUrl,
      last_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const existing = existingMap.get(episode.episodeNo);

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('episodes')
        .update(episodeData)
        .eq('id', existing.id);

      if (!error) {
        updated++;
      }
    } else {
      // Insert new
      const { error } = await supabase
        .from('episodes')
        .insert({
          ...episodeData,
          created_at: new Date().toISOString(),
        });

      if (!error) {
        inserted++;
      }
    }
  }

  // Update episode count in dramas table
  const { count } = await supabase
    .from('episodes')
    .select('*', { count: 'exact', head: true })
    .eq('drama_id', dramaId);

  await supabase
    .from('dramas')
    .update({
      episode_count: count || episodes.length,
      updated_at: new Date().toISOString(),
    })
    .eq('id', dramaId);

  return {
    episodesInserted: inserted,
    episodesUpdated: updated,
    totalEpisodes: count || episodes.length,
  };
}

/**
 * Get episodes with fallback to provider API
 */
export async function getEpisodesWithFallback(
  dramaId: string,
  providerSlug: string,
  providerDramaId: string,
  requestId: string = 'system'
): Promise<EpisodeItem[]> {
  const supabase = getSupabaseClient();

  // First, try to get from database
  const { data: dbEpisodes } = await supabase
    .from('episodes')
    .select('*')
    .eq('drama_id', dramaId)
    .order('episode_no', { ascending: true });

  // If we have episodes in DB, return them
  if (dbEpisodes && dbEpisodes.length > 0) {
    return dbEpisodes.map(mapDbEpisodeToItem);
  }

  // Otherwise, sync from provider
  const syncResult = await syncEpisodesFromProvider(
    dramaId,
    providerSlug,
    providerDramaId,
    requestId
  );

  if (syncResult && syncResult.totalEpisodes > 0) {
    // Return freshly synced episodes
    const { data: freshEpisodes } = await supabase
      .from('episodes')
      .select('*')
      .eq('drama_id', dramaId)
      .order('episode_no', { ascending: true });

    return (freshEpisodes || []).map(mapDbEpisodeToItem);
  }

  return [];
}

function mapDbEpisodeToItem(episode: {
  id: string;
  provider_episode_id: string | null;
  episode_no: number;
  chapter_id: string | null;
  slug: string | null;
  title: string;
  duration_ms: number;
  is_locked: boolean;
  thumbnail_url: string | null;
}): EpisodeItem {
  return {
    episodeId: episode.id,
    providerEpisodeId: episode.provider_episode_id || undefined,
    episodeNo: episode.episode_no,
    chapterId: episode.chapter_id || undefined,
    slug: episode.slug || undefined,
    title: episode.title,
    durationMs: episode.duration_ms,
    isLocked: episode.is_locked,
    thumbnailUrl: episode.thumbnail_url || undefined,
  };
}
