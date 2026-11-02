/**
 * Tests for API Input Validation
 * 
 * Tests the Zod validation schemas for key API endpoints:
 * - Search API (query validation)
 * - Playback API (parameter validation)
 * - Watch Progress API (body validation)
 * - Drama Detail API (path validation)
 */

import { describe, it, expect } from 'vitest';
import {
    searchQuerySchema,
    pageSchema,
    searchRequestSchema,
    providerSlugSchema,
    dramaIdSchema,
    episodeIdSchema,
    userIdSchema,
    playbackRequestSchema,
    watchProgressRequestSchema,
    uuidSchema,
    dramaDetailPathSchema,
    validateSearchParams,
    validateRequestBody,
} from '@/lib/validation/schemas';

describe('Search API Validation', () => {
    describe('searchQuerySchema', () => {
        it('should accept valid search query', () => {
            const result = searchQuerySchema.safeParse('love story');
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toBe('love story');
            }
        });

        it('should trim whitespace from query', () => {
            const result = searchQuerySchema.safeParse('  CEO romance  ');
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toBe('CEO romance');
            }
        });

        it('should reject empty query', () => {
            const result = searchQuerySchema.safeParse('');
            expect(result.success).toBe(false);
        });

        it('should reject whitespace-only query', () => {
            const result = searchQuerySchema.safeParse('   ');
            expect(result.success).toBe(false);
        });

        it('should reject query longer than 200 characters', () => {
            const longQuery = 'a'.repeat(201);
            const result = searchQuerySchema.safeParse(longQuery);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('200 characters');
            }
        });

        it('should accept query with exactly 200 characters', () => {
            const maxQuery = 'a'.repeat(200);
            const result = searchQuerySchema.safeParse(maxQuery);
            expect(result.success).toBe(true);
        });
    });

    describe('pageSchema', () => {
        it('should default to 1 when not provided', () => {
            const result = pageSchema.safeParse(undefined);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toBe(1);
            }
        });

        it('should parse valid page number', () => {
            const result = pageSchema.safeParse('5');
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toBe(5);
            }
        });

        it('should reject page less than 1', () => {
            const result = pageSchema.safeParse('0');
            expect(result.success).toBe(false);
        });

        it('should reject page greater than 1000', () => {
            const result = pageSchema.safeParse('1001');
            expect(result.success).toBe(false);
        });

        it('should accept page 1', () => {
            const result = pageSchema.safeParse('1');
            expect(result.success).toBe(true);
        });

        it('should accept page 1000', () => {
            const result = pageSchema.safeParse('1000');
            expect(result.success).toBe(true);
        });
    });

    describe('searchRequestSchema', () => {
        it('should validate complete search request', () => {
            const result = searchRequestSchema.safeParse({
                q: 'CEO',
                page: '2',
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.q).toBe('CEO');
                expect(result.data.page).toBe(2);
            }
        });

        it('should use default page when not provided', () => {
            const result = searchRequestSchema.safeParse({
                q: 'drama',
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.page).toBe(1);
            }
        });

        it('should reject missing query', () => {
            const result = searchRequestSchema.safeParse({
                page: '1',
            });
            expect(result.success).toBe(false);
        });
    });
});

describe('Playback API Validation', () => {
    describe('providerSlugSchema', () => {
        it('should accept valid provider slug', () => {
            const result = providerSlugSchema.safeParse('reelshort');
            expect(result.success).toBe(true);
        });

        it('should accept slug with hyphens', () => {
            const result = providerSlugSchema.safeParse('my-provider');
            expect(result.success).toBe(true);
        });

        it('should accept slug with numbers', () => {
            const result = providerSlugSchema.safeParse('provider123');
            expect(result.success).toBe(true);
        });

        it('should reject uppercase letters', () => {
            const result = providerSlugSchema.safeParse('ReelShort');
            expect(result.success).toBe(false);
        });

        it('should reject empty string', () => {
            const result = providerSlugSchema.safeParse('');
            expect(result.success).toBe(false);
        });

        it('should reject slug longer than 50 characters', () => {
            const longSlug = 'a'.repeat(51);
            const result = providerSlugSchema.safeParse(longSlug);
            expect(result.success).toBe(false);
        });

        it('should reject special characters', () => {
            const result = providerSlugSchema.safeParse('provider_name');
            expect(result.success).toBe(false);
        });
    });

    describe('dramaIdSchema', () => {
        it('should accept valid UUID', () => {
            const result = dramaIdSchema.safeParse('123e4567-e89b-12d3-a456-426614174000');
            expect(result.success).toBe(true);
        });

        it('should accept provider-specific ID', () => {
            const result = dramaIdSchema.safeParse('drama-12345');
            expect(result.success).toBe(true);
        });

        it('should reject empty string', () => {
            const result = dramaIdSchema.safeParse('');
            expect(result.success).toBe(false);
        });

        it('should reject ID longer than 200 characters', () => {
            const longId = 'a'.repeat(201);
            const result = dramaIdSchema.safeParse(longId);
            expect(result.success).toBe(false);
        });
    });

    describe('episodeIdSchema', () => {
        it('should accept valid episode ID', () => {
            const result = episodeIdSchema.safeParse('episode-1');
            expect(result.success).toBe(true);
        });

        it('should accept numeric episode number', () => {
            const result = episodeIdSchema.safeParse('15');
            expect(result.success).toBe(true);
        });

        it('should reject empty string', () => {
            const result = episodeIdSchema.safeParse('');
            expect(result.success).toBe(false);
        });
    });

    describe('userIdSchema', () => {
        it('should accept valid UUID', () => {
            const result = userIdSchema.safeParse('123e4567-e89b-12d3-a456-426614174000');
            expect(result.success).toBe(true);
        });

        it('should accept "guest"', () => {
            const result = userIdSchema.safeParse('guest');
            expect(result.success).toBe(true);
        });

        it('should reject invalid user ID', () => {
            const result = userIdSchema.safeParse('invalid-user-id');
            expect(result.success).toBe(false);
        });

        it('should reject empty string', () => {
            const result = userIdSchema.safeParse('');
            expect(result.success).toBe(false);
        });
    });

    describe('playbackRequestSchema', () => {
        it('should validate complete playback request', () => {
            const result = playbackRequestSchema.safeParse({
                provider: 'reelshort',
                drama: 'drama-123',
                episode: 'episode-1',
                userId: 'guest',
            });
            expect(result.success).toBe(true);
        });

        it('should default userId to guest', () => {
            const result = playbackRequestSchema.safeParse({
                provider: 'reelshort',
                drama: 'drama-123',
                episode: 'episode-1',
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.userId).toBe('guest');
            }
        });

        it('should reject missing provider', () => {
            const result = playbackRequestSchema.safeParse({
                drama: 'drama-123',
                episode: 'episode-1',
            });
            expect(result.success).toBe(false);
        });

        it('should reject missing drama', () => {
            const result = playbackRequestSchema.safeParse({
                provider: 'reelshort',
                episode: 'episode-1',
            });
            expect(result.success).toBe(false);
        });

        it('should reject missing episode', () => {
            const result = playbackRequestSchema.safeParse({
                provider: 'reelshort',
                drama: 'drama-123',
            });
            expect(result.success).toBe(false);
        });
    });
});

describe('Watch Progress API Validation', () => {
    describe('uuidSchema', () => {
        it('should accept valid UUID', () => {
            const result = uuidSchema.safeParse('123e4567-e89b-12d3-a456-426614174000');
            expect(result.success).toBe(true);
        });

        it('should reject invalid UUID', () => {
            const result = uuidSchema.safeParse('not-a-uuid');
            expect(result.success).toBe(false);
        });

        it('should reject empty string', () => {
            const result = uuidSchema.safeParse('');
            expect(result.success).toBe(false);
        });
    });

    describe('watchProgressRequestSchema', () => {
        it('should validate complete watch progress request', () => {
            const result = watchProgressRequestSchema.safeParse({
                userId: '123e4567-e89b-12d3-a456-426614174000',
                dramaId: '123e4567-e89b-12d3-a456-426614174001',
                episodeId: '123e4567-e89b-12d3-a456-426614174002',
                progressSeconds: 120,
                isCompleted: false,
            });
            expect(result.success).toBe(true);
        });

        it('should accept provider-specific episode ID', () => {
            const result = watchProgressRequestSchema.safeParse({
                userId: '123e4567-e89b-12d3-a456-426614174000',
                dramaId: '123e4567-e89b-12d3-a456-426614174001',
                episodeId: 'episode-15', // Provider-specific ID
                progressSeconds: 120,
            });
            expect(result.success).toBe(true);
        });

        it('should default isCompleted to false', () => {
            const result = watchProgressRequestSchema.safeParse({
                userId: '123e4567-e89b-12d3-a456-426614174000',
                dramaId: '123e4567-e89b-12d3-a456-426614174001',
                episodeId: '123e4567-e89b-12d3-a456-426614174002',
                progressSeconds: 120,
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.isCompleted).toBe(false);
            }
        });

        it('should reject progressSeconds less than 0', () => {
            const result = watchProgressRequestSchema.safeParse({
                userId: '123e4567-e89b-12d3-a456-426614174000',
                dramaId: '123e4567-e89b-12d3-a456-426614174001',
                episodeId: '123e4567-e89b-12d3-a456-426614174002',
                progressSeconds: -1,
            });
            expect(result.success).toBe(false);
        });

        it('should reject progressSeconds greater than 86400 (24 hours)', () => {
            const result = watchProgressRequestSchema.safeParse({
                userId: '123e4567-e89b-12d3-a456-426614174000',
                dramaId: '123e4567-e89b-12d3-a456-426614174001',
                episodeId: '123e4567-e89b-12d3-a456-426614174002',
                progressSeconds: 86401,
            });
            expect(result.success).toBe(false);
        });

        it('should accept progressSeconds of 0', () => {
            const result = watchProgressRequestSchema.safeParse({
                userId: '123e4567-e89b-12d3-a456-426614174000',
                dramaId: '123e4567-e89b-12d3-a456-426614174001',
                episodeId: '123e4567-e89b-12d3-a456-426614174002',
                progressSeconds: 0,
            });
            expect(result.success).toBe(true);
        });

        it('should accept progressSeconds of 86400', () => {
            const result = watchProgressRequestSchema.safeParse({
                userId: '123e4567-e89b-12d3-a456-426614174000',
                dramaId: '123e4567-e89b-12d3-a456-426614174001',
                episodeId: '123e4567-e89b-12d3-a456-426614174002',
                progressSeconds: 86400,
            });
            expect(result.success).toBe(true);
        });

        it('should reject non-integer progressSeconds', () => {
            const result = watchProgressRequestSchema.safeParse({
                userId: '123e4567-e89b-12d3-a456-426614174000',
                dramaId: '123e4567-e89b-12d3-a456-426614174001',
                episodeId: '123e4567-e89b-12d3-a456-426614174002',
                progressSeconds: 120.5,
            });
            expect(result.success).toBe(false);
        });

        it('should reject non-UUID userId', () => {
            const result = watchProgressRequestSchema.safeParse({
                userId: 'not-a-uuid',
                dramaId: '123e4567-e89b-12d3-a456-426614174001',
                episodeId: '123e4567-e89b-12d3-a456-426614174002',
                progressSeconds: 120,
            });
            expect(result.success).toBe(false);
        });

        it('should accept provider-scoped dramaId', () => {
            const result = watchProgressRequestSchema.safeParse({
                userId: '123e4567-e89b-12d3-a456-426614174000',
                dramaId: 'reelshort:rs-001',
                episodeId: '123e4567-e89b-12d3-a456-426614174002',
                progressSeconds: 120,
            });
            expect(result.success).toBe(true);
        });

        it('should reject invalid dramaId format', () => {
            const result = watchProgressRequestSchema.safeParse({
                userId: '123e4567-e89b-12d3-a456-426614174000',
                dramaId: 'not-a-uuid',
                episodeId: '123e4567-e89b-12d3-a456-426614174002',
                progressSeconds: 120,
            });
            expect(result.success).toBe(false);
        });

        it('should reject missing required fields', () => {
            const result = watchProgressRequestSchema.safeParse({
                userId: '123e4567-e89b-12d3-a456-426614174000',
                // Missing dramaId, episodeId, progressSeconds
            });
            expect(result.success).toBe(false);
        });
    });
});

describe('Drama Detail API Validation', () => {
    describe('dramaDetailPathSchema', () => {
        it('should accept valid UUID', () => {
            const result = dramaDetailPathSchema.safeParse({
                id: '123e4567-e89b-12d3-a456-426614174000',
            });
            expect(result.success).toBe(true);
        });

        it('should accept provider-specific ID', () => {
            const result = dramaDetailPathSchema.safeParse({
                id: 'drama-12345',
            });
            expect(result.success).toBe(true);
        });

        it('should reject empty id', () => {
            const result = dramaDetailPathSchema.safeParse({
                id: '',
            });
            expect(result.success).toBe(false);
        });

        it('should reject missing id', () => {
            const result = dramaDetailPathSchema.safeParse({});
            expect(result.success).toBe(false);
        });

        it('should reject id longer than 200 characters', () => {
            const longId = 'a'.repeat(201);
            const result = dramaDetailPathSchema.safeParse({
                id: longId,
            });
            expect(result.success).toBe(false);
        });
    });
});

describe('Validation Helper Functions', () => {
    describe('validateSearchParams', () => {
        it('should validate URLSearchParams correctly', () => {
            const params = new URLSearchParams();
            params.set('q', 'test query');
            params.set('page', '2');

            const result = validateSearchParams(params, searchRequestSchema);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.q).toBe('test query');
                expect(result.data.page).toBe(2);
            }
        });

        it('should return error for invalid params', () => {
            const params = new URLSearchParams();
            // Missing required 'q' param

            const result = validateSearchParams(params, searchRequestSchema);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe('VALIDATION_ERROR');
            }
        });

        it('should include field details in error', () => {
            const params = new URLSearchParams();
            params.set('q', ''); // Empty query

            const result = validateSearchParams(params, searchRequestSchema);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.details).toBeDefined();
            }
        });
    });

    describe('validateRequestBody', () => {
        it('should validate valid JSON body', async () => {
            const request = new Request('http://localhost/api', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: '123e4567-e89b-12d3-a456-426614174000',
                    dramaId: '123e4567-e89b-12d3-a456-426614174001',
                    episodeId: '123e4567-e89b-12d3-a456-426614174002',
                    progressSeconds: 100,
                }),
            });

            const result = await validateRequestBody(request, watchProgressRequestSchema);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.progressSeconds).toBe(100);
            }
        });

        it('should return error for invalid JSON', async () => {
            const request = new Request('http://localhost/api', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: 'not valid json',
            });

            const result = await validateRequestBody(request, watchProgressRequestSchema);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe('BAD_REQUEST');
                expect(result.error.message).toContain('Invalid JSON');
            }
        });

        it('should return error for validation failure', async () => {
            const request = new Request('http://localhost/api', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: 'not-a-uuid',
                    dramaId: 'not-a-uuid',
                    episodeId: 'episode-1',
                    progressSeconds: -1,
                }),
            });

            const result = await validateRequestBody(request, watchProgressRequestSchema);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.code).toBe('VALIDATION_ERROR');
            }
        });
    });
});
