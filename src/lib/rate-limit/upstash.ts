import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { getServerEnv, getUpstashCredentials, getRateLimitConfig } from '../config/env';

// Rate limit configuration from centralized env
function getRateLimits() {
  const config = getRateLimitConfig();
  return {
    globalRpm: config.globalRpm,
    providerRpm: config.providerRpm,
  };
}

// Redis client for rate limiting
let redisClient: Redis | null = null;

/**
 * Get Redis client for rate limiting.
 * Uses Vercel auto-generated Upstash Redis variables:
 * - KV_REST_API_URL (or legacy UPSTASH_REDIS_REST_URL)
 * - KV_REST_API_TOKEN (or legacy UPSTASH_REDIS_REST_TOKEN)
 */
function getRedisClient(): Redis {
  if (!redisClient) {
    // This will throw with clear error messages if env vars are missing
    const credentials = getUpstashCredentials();
    redisClient = new Redis({
      url: credentials.url,
      token: credentials.token,
    });
  }

  return redisClient;
}

// Global rate limiter (requests per minute from config)
let globalLimiter: Ratelimit | null = null;

function getGlobalLimiter(): Ratelimit {
  if (!globalLimiter) {
    const { globalRpm } = getRateLimits();
    globalLimiter = new Ratelimit({
      redis: getRedisClient(),
      limiter: Ratelimit.slidingWindow(globalRpm, '1 m'),
      analytics: true,
      prefix: 'ratelimit:global',
    });
  }
  return globalLimiter;
}

// Per-provider rate limiter (requests per minute from config)
let providerLimiter: Ratelimit | null = null;

function getProviderLimiter(): Ratelimit {
  if (!providerLimiter) {
    const { providerRpm } = getRateLimits();
    providerLimiter = new Ratelimit({
      redis: getRedisClient(),
      limiter: Ratelimit.slidingWindow(providerRpm, '1 m'),
      analytics: true,
      prefix: 'ratelimit:provider',
    });
  }
  return providerLimiter;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
}

export interface CombinedRateLimitResult {
  global: RateLimitResult;
  provider: RateLimitResult;
}

/**
 * Check both global and per-provider rate limits
 */
export async function checkBothLimits(
  providerSlug: string,
  identifier: string = 'global'
): Promise<CombinedRateLimitResult> {
  const [globalResult, providerResult] = await Promise.all([
    getGlobalLimiter().limit(identifier),
    getProviderLimiter().limit(`${providerSlug}:${identifier}`),
  ]);

  return {
    global: {
      success: globalResult.success,
      limit: globalResult.limit,
      remaining: globalResult.remaining,
      reset: new Date(globalResult.reset),
    },
    provider: {
      success: providerResult.success,
      limit: providerResult.limit,
      remaining: providerResult.remaining,
      reset: new Date(providerResult.reset),
    },
  };
}

/**
 * Get rate limiter instance with combined checks
 */
export function getRateLimiter() {
  return {
    checkBoth: checkBothLimits,
    checkGlobal: async (identifier: string = 'global'): Promise<RateLimitResult> => {
      const result = await getGlobalLimiter().limit(identifier);
      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: new Date(result.reset),
      };
    },
    checkProvider: async (providerSlug: string, identifier: string = 'global'): Promise<RateLimitResult> => {
      const result = await getProviderLimiter().limit(`${providerSlug}:${identifier}`);
      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: new Date(result.reset),
      };
    },
  };
}

/**
 * Create a custom rate limiter with specific configuration.
 * Uses Vercel auto-generated Upstash Redis variables.
 *
 * @param requests - Number of requests allowed
 * @param window - Time window (e.g., '1 m', '1 h')
 * @param prefix - Key prefix for this limiter
 */
export function createCustomLimiter(
  requests: number,
  window: string,
  prefix: string
): Ratelimit {
  return new Ratelimit({
    redis: getRedisClient(),
    limiter: Ratelimit.slidingWindow(requests, window as `${number} ${'ms' | 's' | 'm' | 'h' | 'd'}`),
    analytics: true,
    prefix: `ratelimit:${prefix}`,
  });
}

/**
 * Check if rate limiting is properly configured.
 * Useful for health checks and graceful degradation.
 */
export function isRateLimitConfigured(): boolean {
  try {
    const credentials = getUpstashCredentials();
    return !!(credentials.url && credentials.token);
  } catch {
    return false;
  }
}
