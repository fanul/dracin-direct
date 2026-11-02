import type { DramaCard, DramaDetail, EpisodeItem, PlaybackResponse } from '@/lib/types';

export interface ProviderAdapter {
  readonly name: string;
  readonly slug: string;

  mapHome(response: unknown): DramaCard[];
  mapSearch(response: unknown): DramaCard[];
  mapDramaDetail(response: unknown): DramaDetail;
  mapEpisodes(response: unknown): EpisodeItem[];
  mapPlayback(response: unknown): PlaybackResponse;
}

export abstract class BaseProviderAdapter implements ProviderAdapter {
  abstract readonly name: string;
  abstract readonly slug: string;

  abstract mapHome(response: unknown): DramaCard[];
  abstract mapSearch(response: unknown): DramaCard[];
  abstract mapDramaDetail(response: unknown): DramaDetail;
  abstract mapEpisodes(response: unknown): EpisodeItem[];
  abstract mapPlayback(response: unknown): PlaybackResponse;

  protected extractProviderInfo() {
    return {
      providerName: this.name,
      providerSlug: this.slug,
      vipLevel: 'VIP9',
    };
  }

  /**
   * Unwrap common outer wrappers from Captain API responses.
   * Handles: { success, data }, { code, data }, { data, cached }, etc.
   * Returns the inner data if an outer wrapper is detected.
   */
  protected unwrapResponse(response: unknown): unknown {
    if (!response || typeof response !== 'object' || Array.isArray(response)) {
      return response;
    }
    const raw = response as Record<string, unknown>;
    // Check for common wrapper patterns with a `data` field
    const hasData = raw.data !== undefined;
    const isWrapper = hasData && (
      raw.success !== undefined ||  // { success, data }
      raw.code !== undefined ||     // { code, data }
      raw.cached !== undefined ||   // { data, cached }
      raw.status !== undefined ||   // { data, status }
      raw.message !== undefined     // { data, message }
    );
    return isWrapper ? raw.data : response;
  }
}
