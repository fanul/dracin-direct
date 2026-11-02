/**
 * Tests for Environment Validation
 * 
 * Tests the env validation preflight and required-key failure behavior.
 * These tests verify that the centralized env validation in src/lib/config/env.ts
 * correctly identifies missing/invalid environment variables.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Store original env
const originalEnv = { ...process.env };

// Helper to reset modules and re-import
async function importFreshEnv() {
    // Clear module cache
    vi.resetModules();
    const env = await import('@/lib/config/env');
    return env;
}

describe('Environment Validation', () => {
    beforeEach(() => {
        // Reset process.env for each test
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        // Restore original env
        process.env = { ...originalEnv };
    });

    describe('preflightEnvCheck', () => {
        it('should return success: true when all required env vars are present', async () => {
            // Set all required env vars
            process.env = {
                ...process.env,
                NODE_ENV: 'test',
                NEXT_PUBLIC_SUPABASE_URL: 'https://test-project.supabase.co',
                NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
                SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
                UPSTASH_REDIS_REST_URL: 'https://test-redis.upstash.io',
                UPSTASH_REDIS_REST_TOKEN: 'test-redis-token',
                CAPTAIN_API_TOKEN: 'test-captain-token',
            };

            const { preflightEnvCheck } = await importFreshEnv();
            const result = preflightEnvCheck();

            expect(result.success).toBe(true);
            expect(result.errors).toHaveLength(0);
            expect(result.missingVars).toHaveLength(0);
        });

        it('should detect missing NEXT_PUBLIC_SUPABASE_URL', async () => {
            process.env = {
                ...process.env,
                NODE_ENV: 'test',
                // Missing NEXT_PUBLIC_SUPABASE_URL
                SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
                UPSTASH_REDIS_REST_URL: 'https://test-redis.upstash.io',
                UPSTASH_REDIS_REST_TOKEN: 'test-redis-token',
                CAPTAIN_API_TOKEN: 'test-captain-token',
            };
            delete process.env.NEXT_PUBLIC_SUPABASE_URL;

            const { preflightEnvCheck } = await importFreshEnv();
            const result = preflightEnvCheck();

            expect(result.success).toBe(false);
            expect(result.missingVars).toContain('NEXT_PUBLIC_SUPABASE_URL');
        });

        it('should detect missing SUPABASE_SERVICE_ROLE_KEY', async () => {
            process.env = {
                ...process.env,
                NODE_ENV: 'test',
                NEXT_PUBLIC_SUPABASE_URL: 'https://test-project.supabase.co',
                NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
                // Missing SUPABASE_SERVICE_ROLE_KEY
                UPSTASH_REDIS_REST_URL: 'https://test-redis.upstash.io',
                UPSTASH_REDIS_REST_TOKEN: 'test-redis-token',
                CAPTAIN_API_TOKEN: 'test-captain-token',
            };
            delete process.env.SUPABASE_SERVICE_ROLE_KEY;

            const { preflightEnvCheck } = await importFreshEnv();
            const result = preflightEnvCheck();

            expect(result.success).toBe(false);
            expect(result.missingVars).toContain('SUPABASE_SERVICE_ROLE_KEY');
        });

        it('should detect missing UPSTASH_REDIS_REST_URL', async () => {
            process.env = {
                ...process.env,
                NODE_ENV: 'test',
                NEXT_PUBLIC_SUPABASE_URL: 'https://test-project.supabase.co',
                NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
                SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
                // Missing UPSTASH_REDIS_REST_URL
                UPSTASH_REDIS_REST_TOKEN: 'test-redis-token',
                CAPTAIN_API_TOKEN: 'test-captain-token',
            };
            delete process.env.UPSTASH_REDIS_REST_URL;
            delete process.env.KV_REST_API_URL;

            const { preflightEnvCheck } = await importFreshEnv();
            const result = preflightEnvCheck();

            expect(result.success).toBe(false);
            expect(result.missingVars).toContain('KV_REST_API_URL or UPSTASH_REDIS_REST_URL');
        });

        it('should detect missing UPSTASH_REDIS_REST_TOKEN', async () => {
            process.env = {
                ...process.env,
                NODE_ENV: 'test',
                NEXT_PUBLIC_SUPABASE_URL: 'https://test-project.supabase.co',
                NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
                SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
                UPSTASH_REDIS_REST_URL: 'https://test-redis.upstash.io',
                // Missing UPSTASH_REDIS_REST_TOKEN
                CAPTAIN_API_TOKEN: 'test-captain-token',
            };
            delete process.env.UPSTASH_REDIS_REST_TOKEN;
            delete process.env.KV_REST_API_TOKEN;

            const { preflightEnvCheck } = await importFreshEnv();
            const result = preflightEnvCheck();

            expect(result.success).toBe(false);
            expect(result.missingVars).toContain('KV_REST_API_TOKEN or UPSTASH_REDIS_REST_TOKEN');
        });

        it('should detect missing CAPTAIN_API_TOKEN', async () => {
            process.env = {
                ...process.env,
                NODE_ENV: 'test',
                NEXT_PUBLIC_SUPABASE_URL: 'https://test-project.supabase.co',
                NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
                SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
                UPSTASH_REDIS_REST_URL: 'https://test-redis.upstash.io',
                UPSTASH_REDIS_REST_TOKEN: 'test-redis-token',
                // Missing CAPTAIN_API_TOKEN
            };
            delete process.env.CAPTAIN_API_TOKEN;

            const { preflightEnvCheck } = await importFreshEnv();
            const result = preflightEnvCheck();

            expect(result.success).toBe(false);
            expect(result.missingVars).toContain('CAPTAIN_API_TOKEN');
        });

        it('should detect multiple missing required env vars', async () => {
            process.env = {
                ...process.env,
                NODE_ENV: 'test',
                // Missing multiple required vars
                NEXT_PUBLIC_SUPABASE_URL: 'https://test-project.supabase.co',
                NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
                // Missing: SUPABASE_SERVICE_ROLE_KEY, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, CAPTAIN_API_TOKEN
            };
            delete process.env.SUPABASE_SERVICE_ROLE_KEY;
            delete process.env.UPSTASH_REDIS_REST_URL;
            delete process.env.UPSTASH_REDIS_REST_TOKEN;
            delete process.env.CAPTAIN_API_TOKEN;
            delete process.env.KV_REST_API_URL;
            delete process.env.KV_REST_API_TOKEN;

            const { preflightEnvCheck } = await importFreshEnv();
            const result = preflightEnvCheck();

            expect(result.success).toBe(false);
            expect(result.missingVars.length).toBeGreaterThanOrEqual(4);
        });

        it('should detect invalid URL format for NEXT_PUBLIC_SUPABASE_URL', async () => {
            process.env = {
                ...process.env,
                NODE_ENV: 'test',
                NEXT_PUBLIC_SUPABASE_URL: 'not-a-valid-url', // Invalid URL
                SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
                UPSTASH_REDIS_REST_URL: 'https://test-redis.upstash.io',
                UPSTASH_REDIS_REST_TOKEN: 'test-redis-token',
                CAPTAIN_API_TOKEN: 'test-captain-token',
            };

            const { preflightEnvCheck } = await importFreshEnv();
            const result = preflightEnvCheck();

            expect(result.success).toBe(false);
            expect(result.errors.some(e => e.includes('NEXT_PUBLIC_SUPABASE_URL'))).toBe(true);
        });

        it('should detect invalid URL format for UPSTASH_REDIS_REST_URL', async () => {
            process.env = {
                ...process.env,
                NODE_ENV: 'test',
                NEXT_PUBLIC_SUPABASE_URL: 'https://test-project.supabase.co',
                NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
                SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
                UPSTASH_REDIS_REST_URL: 'invalid-url', // Invalid URL
                UPSTASH_REDIS_REST_TOKEN: 'test-redis-token',
                CAPTAIN_API_TOKEN: 'test-captain-token',
            };

            const { preflightEnvCheck } = await importFreshEnv();
            const result = preflightEnvCheck();

            expect(result.success).toBe(false);
            expect(result.errors.some(e => e.includes('UPSTASH_REDIS_REST_URL'))).toBe(true);
        });

        it('should detect empty string for required keys', async () => {
            process.env = {
                ...process.env,
                NODE_ENV: 'test',
                NEXT_PUBLIC_SUPABASE_URL: 'https://test-project.supabase.co',
                NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
                SUPABASE_SERVICE_ROLE_KEY: '', // Empty string
                UPSTASH_REDIS_REST_URL: 'https://test-redis.upstash.io',
                UPSTASH_REDIS_REST_TOKEN: 'test-redis-token',
                CAPTAIN_API_TOKEN: 'test-captain-token',
            };

            const { preflightEnvCheck } = await importFreshEnv();
            const result = preflightEnvCheck();

            expect(result.success).toBe(false);
            expect(result.errors.some(e => e.includes('SUPABASE_SERVICE_ROLE_KEY'))).toBe(true);
        });
    });

    describe('getServerEnv', () => {
        it('should throw error when called on client side (window is defined)', async () => {
            process.env = {
                ...process.env,
                NODE_ENV: 'test',
                NEXT_PUBLIC_SUPABASE_URL: 'https://test-project.supabase.co',
                NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
                SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
                UPSTASH_REDIS_REST_URL: 'https://test-redis.upstash.io',
                UPSTASH_REDIS_REST_TOKEN: 'test-redis-token',
                CAPTAIN_API_TOKEN: 'test-captain-token',
            };

            // Mock window object to simulate client side
            (global as any).window = {};

            const { getServerEnv } = await importFreshEnv();

            expect(() => getServerEnv()).toThrow('getServerEnv() must only be called on the server side');

            // Cleanup
            delete (global as any).window;
        });

        it('should throw detailed error when validation fails', async () => {
            process.env = {
                ...process.env,
                NODE_ENV: 'test',
                // Missing all required vars
            };
            delete process.env.NEXT_PUBLIC_SUPABASE_URL;
            delete process.env.SUPABASE_SERVICE_ROLE_KEY;
            delete process.env.UPSTASH_REDIS_REST_URL;
            delete process.env.UPSTASH_REDIS_REST_TOKEN;
            delete process.env.CAPTAIN_API_TOKEN;
            delete process.env.KV_REST_API_URL;
            delete process.env.KV_REST_API_TOKEN;

            const { getServerEnv } = await importFreshEnv();

            expect(() => getServerEnv()).toThrow('Environment validation failed');
        });
    });

    describe('getOptionalEnv', () => {
        it('should return defaults for optional env vars', async () => {
            process.env = {
                ...process.env,
                NODE_ENV: 'test',
                // No optional vars set
            };

            const { getOptionalEnv } = await importFreshEnv();
            const result = getOptionalEnv();

            expect(result.NODE_ENV).toBe('test');
            expect(result.RATE_LIMIT_GLOBAL_RPM).toBe(45);
            expect(result.RATE_LIMIT_PROVIDER_RPM).toBe(10);
        });

        it('should use provided values for optional env vars', async () => {
            process.env = {
                ...process.env,
                NODE_ENV: 'production',
                CORS_ALLOWED_ORIGIN: 'https://example.com',
                RATE_LIMIT_GLOBAL_RPM: '100',
                RATE_LIMIT_PROVIDER_RPM: '20',
            };

            const { getOptionalEnv } = await importFreshEnv();
            const result = getOptionalEnv();

            expect(result.NODE_ENV).toBe('production');
            expect(result.CORS_ALLOWED_ORIGIN).toBe('https://example.com');
            expect(result.RATE_LIMIT_GLOBAL_RPM).toBe(100);
            expect(result.RATE_LIMIT_PROVIDER_RPM).toBe(20);
        });
    });

    describe('isProduction / isDevelopment', () => {
        it('should return true for isProduction when NODE_ENV is production', async () => {
            process.env = {
                ...process.env,
                NODE_ENV: 'production',
            };

            const { isProduction, isDevelopment } = await importFreshEnv();

            expect(isProduction()).toBe(true);
            expect(isDevelopment()).toBe(false);
        });

        it('should return true for isDevelopment when NODE_ENV is development', async () => {
            process.env = {
                ...process.env,
                NODE_ENV: 'development',
            };

            const { isProduction, isDevelopment } = await importFreshEnv();

            expect(isProduction()).toBe(false);
            expect(isDevelopment()).toBe(true);
        });
    });

    describe('getCorsOrigin', () => {
        it('should return configured CORS_ALLOWED_ORIGIN when set', async () => {
            process.env = {
                ...process.env,
                NODE_ENV: 'production',
                CORS_ALLOWED_ORIGIN: 'https://myapp.com',
            };

            const { getCorsOrigin } = await importFreshEnv();
            const result = getCorsOrigin();

            expect(result).toBe('https://myapp.com');
        });

        it('should return development default when not in production', async () => {
            process.env = {
                ...process.env,
                NODE_ENV: 'development',
            };

            const { getCorsOrigin } = await importFreshEnv();
            const result = getCorsOrigin();

            expect(result).toBe('http://localhost:3000');
        });
    });

    describe('getRateLimitConfig', () => {
        it('should return rate limit configuration from env', async () => {
            process.env = {
                ...process.env,
                NODE_ENV: 'test',
                RATE_LIMIT_GLOBAL_RPM: '60',
                RATE_LIMIT_PROVIDER_RPM: '15',
            };

            const { getRateLimitConfig } = await importFreshEnv();
            const result = getRateLimitConfig();

            expect(result.globalRpm).toBe(60);
            expect(result.providerRpm).toBe(15);
        });
    });
});
