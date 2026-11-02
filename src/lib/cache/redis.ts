import { Redis } from '@upstash/redis';
import { getServerEnv, getRedisUrl, getUpstashCredentials } from '../config/env';

export class CacheManager {
  private redis: Redis;

  constructor(redisUrl: string, redisToken: string) {
    this.redis = new Redis({
      url: redisUrl,
      token: redisToken,
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      return value as T | null;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
      await this.redis.set(key, value, { ex: ttlSeconds });
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }
}

export function getCurrentDateBucket(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function createSearchKey(query: string, page: number, dateBucket = getCurrentDateBucket()): string {
  const normalizedQuery = query.toLowerCase().trim().replace(/\s+/g, '_');
  return `search:v1:${dateBucket}:${normalizedQuery}:page:${page}`;
}

export function createSearchMetaKey(query: string, dateBucket = getCurrentDateBucket()): string {
  const normalizedQuery = query.toLowerCase().trim().replace(/\s+/g, '_');
  return `search-meta:v1:${dateBucket}:${normalizedQuery}`;
}

export function createPlaybackKey(provider: string, dramaId: string, episodeId: string): string {
  return `playback:v1:${provider}:${dramaId}:${episodeId}`;
}

export function createProviderCatalogKey(): string {
  return 'provider:catalog';
}

export function createDramaEpisodesKey(dramaId: string): string {
  return `drama:${dramaId}:episodes`;
}

export const CACHE_TTL = {
  SEARCH: 86400,
  PLAYBACK: 90,
  PROVIDER_CATALOG: 3600,
  EPISODES: 7200,
} as const;

let cacheInstance: CacheManager | null = null;

/**
 * Get the CacheManager singleton.
 * Uses validated environment variables from centralized config.
 * Server-side only - validates secrets on first access.
 *
 * Uses Vercel auto-generated Upstash Redis variables:
 * - KV_REST_API_URL (or legacy UPSTASH_REDIS_REST_URL)
 * - KV_REST_API_TOKEN (or legacy UPSTASH_REDIS_REST_TOKEN)
 */
export function getCacheManager(): CacheManager {
  if (!cacheInstance) {
    // This will throw with clear error messages if env vars are missing
    const credentials = getUpstashCredentials();
    cacheInstance = new CacheManager(credentials.url, credentials.token);
  }

  return cacheInstance;
}

/**
 * Create a new CacheManager instance with explicit credentials.
 * Useful for testing or when you need multiple cache instances.
 *
 * Uses Vercel auto-generated Upstash Redis variables:
 * - KV_REST_API_URL (or legacy UPSTASH_REDIS_REST_URL)
 * - KV_REST_API_TOKEN (or legacy UPSTASH_REDIS_REST_TOKEN)
 */
export function createCacheManager(): CacheManager {
  const credentials = getUpstashCredentials();
  return new CacheManager(credentials.url, credentials.token);
}

/**
 * Get Redis URL for direct Redis connections.
 * Vercel auto-generates REDIS_URL or KV_URL (they are identical).
 * This is useful when you need to use a Redis client other than @upstash/redis.
 *
 * @returns The Redis connection URL or undefined if not configured
 */
export function getDirectRedisUrl(): string | undefined {
  return getRedisUrl();
}

/**
 * Check if Redis cache is properly configured.
 * Useful for health checks and graceful degradation.
 */
export function isCacheConfigured(): boolean {
  try {
    const credentials = getUpstashCredentials();
    return !!(credentials.url && credentials.token);
  } catch {
    return false;
  }
}
