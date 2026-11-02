import { getSupabaseClient } from '../db/client';
import { providerCatalog } from '../providers/catalog';
import { getAdapter } from '../providers/adapters';
import { createCaptainClient } from '../http/captain-client';
import { logger } from '../observability/logger';
import { normalizeNetshortVariantTitle, hasNetshortSubtitleSignal } from '../providers/netshort';
import type { DramaCard, DramaDetail } from '../types';

const captainToken = process.env.CAPTAIN_API_TOKEN || '';
const captainClient = createCaptainClient(captainToken);

export interface UpsertDramaResult {
  dramaId: string;
  isNew: boolean;
  isUpdated: boolean;
}

/**
 * Fetch drama detail from provider API and upsert to database
 */
export async function upsertDramaFromProvider(
  providerSlug: string,
  providerDramaId: string,
  requestId: string = 'system'
): Promise<UpsertDramaResult | null> {
  const startTime = Date.now();

  try {
    // Check if drama already exists
    const supabase = getSupabaseClient();
    const { data: existingDrama } = await supabase
      .from('dramas')
      .select('id, last_synced_at')
      .eq('provider_slug', providerSlug)
      .eq('provider_drama_id', providerDramaId)
      .single();

    // Resolve detail endpoint
    const resolved = providerCatalog.resolveEndpoint(providerSlug, 'detail', {
      id: providerDramaId,
      dramaId: providerDramaId,
      bookId: providerDramaId,
      seriesId: providerDramaId,
      vid: providerDramaId,
      code: providerDramaId,
    });

    if (!resolved) {
      logger.warn('drama_upsert_no_endpoint', {
        requestId,
        provider: providerSlug,
        providerDramaId,
      });
      return null;
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
      logger.warn('drama_upsert_no_adapter', {
        requestId,
        provider: providerSlug,
      });
      return null;
    }

    const dramaDetail = adapter.mapDramaDetail(response.data);

    // Upsert to database
    const result = await upsertDramaToDb(providerSlug, providerDramaId, dramaDetail, existingDrama?.id);

    logger.info('drama_upsert_success', {
      requestId,
      provider: providerSlug,
      providerDramaId,
      dramaId: result.dramaId,
      isNew: result.isNew,
      latencyMs: Date.now() - startTime,
    });

    return result;
  } catch (error) {
    logger.error('drama_upsert_failed', {
      requestId,
      provider: providerSlug,
      providerDramaId,
      error: error instanceof Error ? error.message : 'Unknown',
      latencyMs: Date.now() - startTime,
    });
    return null;
  }
}

/**
 * Upsert drama to database
 */
async function upsertDramaToDb(
  providerSlug: string,
  providerDramaId: string,
  dramaDetail: DramaDetail,
  existingId?: string
): Promise<UpsertDramaResult> {
  const supabase = getSupabaseClient();

  if (providerSlug === 'netshort' && hasNetshortSubtitleSignal({ title: dramaDetail.title, tags: dramaDetail.tags })) {
    const normalizedTitle = normalizeNetshortVariantTitle(dramaDetail.title);
    if (normalizedTitle) {
      const { data: existingVariants } = await supabase
        .from('dramas')
        .select('id, title, tags')
        .eq('provider_slug', providerSlug)
        .limit(200);

      const duplicateIds = (existingVariants || [])
        .filter((variant) => normalizeNetshortVariantTitle(String(variant.title || '')) === normalizedTitle)
        .map((variant) => variant.id)
        .filter((id): id is string => typeof id === 'string' && id !== existingId);

      if (duplicateIds.length > 0) {
        await supabase
          .from('episodes')
          .delete()
          .in('drama_id', duplicateIds);

        await supabase
          .from('dramas')
          .delete()
          .in('id', duplicateIds);
      }
    }
  }

  const dramaData = {
    provider_slug: providerSlug,
    provider_drama_id: providerDramaId,
    title: dramaDetail.title,
    synopsis: dramaDetail.synopsis,
    cover_url: dramaDetail.coverUrl,
    cover_urls: dramaDetail.coverUrl ? [dramaDetail.coverUrl] : [],
    language: dramaDetail.language,
    genres: dramaDetail.genres,
    tags: dramaDetail.tags,
    episode_count: dramaDetail.episodeCount,
    is_premium: dramaDetail.isPremium,
    popularity_score: dramaDetail.rating || 0,
    last_provider_update: new Date().toISOString(),
    last_synced_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (existingId) {
    // Update existing
    const { error } = await supabase
      .from('dramas')
      .update(dramaData)
      .eq('id', existingId);

    if (error) {
      throw new Error(`Failed to update drama: ${error.message}`);
    }

    return {
      dramaId: existingId,
      isNew: false,
      isUpdated: true,
    };
  } else {
    // Insert new
    const { data, error } = await supabase
      .from('dramas')
      .insert({
        ...dramaData,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error || !data) {
      throw new Error(`Failed to insert drama: ${error?.message || 'Unknown'}`);
    }

    return {
      dramaId: data.id,
      isNew: true,
      isUpdated: false,
    };
  }
}

/**
 * Batch upsert dramas from provider
 */
export async function batchUpsertDramasFromProvider(
  providerSlug: string,
  providerDramaIds: string[],
  requestId: string = 'system'
): Promise<UpsertDramaResult[]> {
  const results: UpsertDramaResult[] = [];

  // Process in batches of 5 to avoid overwhelming the API
  const batchSize = 5;
  for (let i = 0; i < providerDramaIds.length; i += batchSize) {
    const batch = providerDramaIds.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(id => upsertDramaFromProvider(providerSlug, id, requestId))
    );

    results.push(...batchResults.filter((r): r is UpsertDramaResult => r !== null));

    // Small delay between batches
    if (i + batchSize < providerDramaIds.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return results;
}

/**
 * Check if drama needs refresh (synced more than 24 hours ago)
 */
export async function shouldRefreshDrama(dramaId: string): Promise<boolean> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('dramas')
    .select('last_synced_at')
    .eq('id', dramaId)
    .single();

  if (error || !data) {
    return true; // Refresh if not found
  }

  const lastSynced = new Date(data.last_synced_at);
  const hoursSinceSync = (Date.now() - lastSynced.getTime()) / (1000 * 60 * 60);

  return hoursSinceSync > 24; // Refresh if older than 24 hours
}
