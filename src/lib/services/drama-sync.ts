import { getSupabaseClient } from '../db/client';
import { providerCatalog } from '../providers/catalog';
import { getAdapter } from '../providers/adapters';
import { createCaptainClient } from '../http/captain-client';
import { logger } from '../observability/logger';
import { normalizeNetshortVariantTitle, hasNetshortSubtitleSignal } from '../providers/netshort';
import type { DramaDetail } from '../types';

const captainToken = process.env.CAPTAIN_API_TOKEN || '';
const captainClient = createCaptainClient(captainToken);

// Generate a simple UUID v4
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function mapDbDramaToDetail(drama: any): DramaDetail {
  return {
    id: drama.id,
    providerSlug: drama.provider_slug,
    providerDramaId: drama.provider_drama_id,
    title: drama.title,
    coverUrl: drama.cover_url,
    episodeCount: drama.episode_count || 0,
    tags: drama.tags || [],
    isPremium: drama.is_premium || false,
    synopsis: drama.synopsis || '',
    genres: drama.genres || [],
    language: drama.language || '',
    lastUpdated: drama.last_updated_at || drama.updated_at || '',
    providerName: drama.providers?.name || drama.provider_slug,
    vipLevel: drama.vip_level || 'VIP0',
  };
}

/**
 * Sync a single drama from provider API to database
 */
export async function syncDramaFromProvider(
  providerSlug: string,
  providerDramaId: string,
  requestId: string = 'system'
): Promise<DramaDetail | null> {
  const startTime = Date.now();

  try {
    // Check if drama already exists in database
    const supabase = getSupabaseClient();
    const { data: existingDrama } = await supabase
      .from('dramas')
      .select('id')
      .eq('provider_slug', providerSlug)
      .eq('provider_drama_id', providerDramaId)
      .single();

    if (existingDrama) {
      logger.info('drama_sync_already_exists', {
        requestId,
        provider: providerSlug,
        providerDramaId,
        dramaId: existingDrama.id,
      });
      // Return existing drama
      const { data: fullDrama } = await supabase
        .from('dramas')
        .select('*, providers!inner(name)')
        .eq('id', existingDrama.id)
        .single();
      
      if (fullDrama) {
        return mapDbDramaToDetail(fullDrama);
      }
    }

    // Resolve drama detail endpoint
    const resolved = providerCatalog.resolveEndpoint(providerSlug, 'detail', {
      id: providerDramaId,
      dramaId: providerDramaId,
      bookId: providerDramaId,
      seriesId: providerDramaId,
      vid: providerDramaId,
      code: providerDramaId,
    });

    if (!resolved) {
      logger.warn('drama_sync_no_endpoint', {
        requestId,
        provider: providerSlug,
        providerDramaId,
      });
      return null;
    }

    // Fetch drama detail from provider API
    const response = await captainClient.get(resolved.url, {
      provider: providerSlug,
      requestId,
      timeout: 10000,
    });

    // Map response using adapter
    const adapter = getAdapter(providerSlug);
    if (!adapter) {
      logger.warn('drama_sync_no_adapter', {
        requestId,
        provider: providerSlug,
      });
      return null;
    }

    const dramaDetail = adapter.mapDramaDetail(response.data);

    if (providerSlug === 'netshort' && hasNetshortSubtitleSignal({ title: dramaDetail.title, tags: dramaDetail.tags })) {
      const normalizedTitle = normalizeNetshortVariantTitle(dramaDetail.title);
      if (normalizedTitle) {
        const { data: existingVariants } = await supabase
          .from('dramas')
          .select('id, title')
          .eq('provider_slug', providerSlug)
          .limit(200);

        const duplicateIds = (existingVariants || [])
          .filter((variant) => normalizeNetshortVariantTitle(String(variant.title || '')) === normalizedTitle)
          .map((variant) => variant.id)
          .filter((id): id is string => typeof id === 'string');

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

    // Insert drama into database
    const { data: newDrama, error } = await supabase
      .from('dramas')
      .insert({
        id: generateUUID(),
        provider_slug: providerSlug,
        provider_drama_id: providerDramaId,
        title: dramaDetail.title,
        cover_url: dramaDetail.coverUrl,
        episode_count: dramaDetail.episodeCount,
        synopsis: dramaDetail.synopsis,
        genres: dramaDetail.genres,
        tags: dramaDetail.tags,
        language: dramaDetail.language,
        is_premium: dramaDetail.isPremium,
        vip_level: dramaDetail.vipLevel,
        last_updated_at: dramaDetail.lastUpdated,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error || !newDrama) {
      logger.error('drama_sync_insert_failed', {
        requestId,
        provider: providerSlug,
        providerDramaId,
        error: error?.message,
      });
      return null;
    }

    logger.info('drama_sync_success', {
      requestId,
      provider: providerSlug,
      providerDramaId,
      dramaId: newDrama.id,
      title: dramaDetail.title,
      latencyMs: Date.now() - startTime,
    });

    // Return new drama
    const { data: fullDrama } = await supabase
      .from('dramas')
      .select('*, providers!inner(name)')
      .eq('id', newDrama.id)
      .single();

    if (fullDrama) {
      return mapDbDramaToDetail(fullDrama);
    }

    return null;
  } catch (error) {
    logger.error('drama_sync_failed', {
      requestId,
      provider: providerSlug,
      providerDramaId,
      error: error instanceof Error ? error.message : 'Unknown',
      latencyMs: Date.now() - startTime,
    });
    return null;
  }
}
