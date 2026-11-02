import type { ProviderCapabilities } from '@/lib/types';

export interface ProviderEndpoint {
  method?: string;
  path: string;
  pathParams: string[];
}

export type Intent = 'home' | 'search' | 'detail' | 'episodes' | 'playback' | 'subtitle' | 'unlock';

export interface ResolvedEndpoint {
  provider: string;
  intent: Intent;
  endpoint: ProviderEndpoint;
  url: string;
  missingParams: string[];
}

interface Provider {
  slug: string;
  provider: string;
  baseUrl: string;
  status: string;
  vip: string;
  endpoints: ProviderEndpoint[];
  capabilities?: ProviderCapabilities;
}

import catalogData from './catalog.json';

class ProviderCatalog {
  private providers: Map<string, Provider> = new Map();

  constructor() {
    for (const provider of catalogData.providers) {
      this.providers.set(provider.slug, provider as Provider);
    }
  }

  getAllProviders(): Provider[] {
    return Array.from(this.providers.values());
  }

  getActiveProviders(): Provider[] {
    return this.getAllProviders().filter(p => p.status === 'active');
  }

  getProvider(slug: string): Provider | undefined {
    return this.providers.get(slug);
  }

  getCapabilities(slug: string): ProviderCapabilities | undefined {
    const provider = this.getProvider(slug);
    if (!provider) {
      return undefined;
    }

    // Return explicit capabilities if they exist
    if (provider.capabilities) {
      return provider.capabilities;
    }

    // Derive capabilities from endpoints
    const endpoints = provider.endpoints || [];
    const paths = endpoints.map(e => e.path);
    const hasSearch = paths.some(p => /search/i.test(p));
    const hasHome = paths.some(p => /\/(home|foryou|feed|popular|ranking|rank|browse|discover|list|recommend)/i.test(p));
    const hasEpisodes = paths.some(p => /episodes?/i.test(p));
    const hasPlay = paths.some(p => /\/(play|stream|video)/i.test(p));
    const hasSubtitle = paths.some(p => /subtitle/i.test(p));
    const hasUnlock = paths.some(p => /unlock/i.test(p));

    return {
      supportsHome: hasHome,
      supportsSearch: hasSearch,
      supportsEpisodeList: hasEpisodes,
      supportsPlayback: hasPlay,
      supportsSubtitle: hasSubtitle,
      supportsUnlock: hasUnlock,
      playbackType: hasPlay ? 'play' : 'unknown',
    };
  }

  resolveEndpoint(
    slug: string,
    intent: Intent,
    params: Record<string, string> = {}
  ): ResolvedEndpoint | null {
    const provider = this.getProvider(slug);
    if (!provider || provider.status !== 'active') {
      return null;
    }

    let endpoint = this.findBestEndpoint(provider.endpoints, intent, params);
    if (!endpoint && intent === 'episodes' && slug === 'shortmax') {
      endpoint =
        provider.endpoints.find(ep => /\/api\/v1\/detail\/:code/i.test(ep.path))
        || provider.endpoints.find(ep => /\/api\/v1\/play\/:code/i.test(ep.path))
        || null;
    }
    if (!endpoint) {
      return null;
    }

    const missingParams: string[] = [];
    let url = endpoint.path;

    for (const param of endpoint.pathParams) {
      const value = params[param];
      if (!value) {
        missingParams.push(param);
        continue;
      }
      url = url.replace(`:${param}`, encodeURIComponent(value));
    }

    return {
      provider: slug,
      intent,
      endpoint,
      url: `${provider.baseUrl}${url}`,
      missingParams,
    };
  }

  private findBestEndpoint(
    endpoints: ProviderEndpoint[],
    intent: Intent,
    params: Record<string, string> = {}
  ): ProviderEndpoint | null {
    const patterns = this.getIntentPatterns(intent);
    const hasParams = Object.keys(params).length > 0;

    for (const pattern of patterns) {
      const matches = endpoints.filter(ep => {
        if (pattern.method && ep.method !== pattern.method) return false;
        return pattern.regex.test(ep.path);
      });

      if (matches.length === 0) continue;

      if (hasParams) {
        const parameterized = matches.find(ep =>
          ep.pathParams.some(pp => params[pp] !== undefined)
        );
        if (parameterized) return parameterized;
      }

      return matches[0];
    }

    return null;
  }

  private getIntentPatterns(intent: Intent): Array<{ method?: string; regex: RegExp }> {
    const homePattern = /\/(foryou|for-you|home|homepage|feed)/i;
    const tabsPattern = /\/(tabs|browsing)/i;
    const popularPattern = /\/(popular|hot|hot-rank|ranking|rank|browse|discover|list|recommend|dramas)$/i;
    const searchPattern = /search/i;
    const detailDramaPattern = new RegExp('/(drama|dramas|series|book)/:', 'i');
    const detailInfoPattern = new RegExp('/(detail|info)/:', 'i');
    const episodesPattern = /\/(episodes|chapters)/i;
    const bookEpisodesPattern = new RegExp('/book/.*/episodes', 'i');
    const playPattern = /\/(play|stream)/i;
    const videoPattern = /\/video/i;
    const epPlayPattern = /\/(episode|episodes)\/[^/]+/i;
    const subtitlePattern = /subtitle/i;
    const unlockPattern = /unlock/i;

    const patterns: Record<Intent, Array<{ method?: string; regex: RegExp }>> = {
      home: [
        { regex: homePattern },
        { regex: tabsPattern },
        { regex: popularPattern },
      ],
      search: [
        { regex: searchPattern },
      ],
      detail: [
        { regex: detailDramaPattern },
        { regex: detailInfoPattern },
      ],
      episodes: [
        { regex: episodesPattern },
        { regex: bookEpisodesPattern },
      ],
      playback: [
        { regex: playPattern },
        { regex: videoPattern },
        { regex: epPlayPattern },
      ],
      subtitle: [
        { regex: subtitlePattern },
      ],
      unlock: [
        { method: 'POST', regex: unlockPattern },
      ],
    };

    return patterns[intent] || [];
  }
}

export const providerCatalog = new ProviderCatalog();
