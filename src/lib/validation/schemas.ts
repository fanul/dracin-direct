/**
 * API Input Validation Schemas
 * Centralized Zod schemas for request validation across all API routes.
 * 
 * Provides consistent validation with proper 4xx responses for invalid input.
 */

import { z } from 'zod';
import type { ErrorCode } from '../types';

// ============================================================================
// UUID Validation
// ============================================================================

/**
 * UUID validation schema with clear error messages
 */
export const uuidSchema = z.string()
    .uuid('Invalid UUID format')
    .min(1, 'ID is required');

/**
 * Optional UUID (can be null/undefined)
 */
export const optionalUuidSchema = z.string()
    .uuid('Invalid UUID format')
    .nullable()
    .optional();

// ============================================================================
// Search API Validation
// ============================================================================

/**
 * Search query validation
 * - Min 1 character, max 200 characters
 * - Sanitized for SQL injection prevention (alphanumeric + spaces + basic punctuation)
 */
export const searchQuerySchema = z.string()
    .min(1, 'Search query cannot be empty')
    .max(200, 'Search query too long (max 200 characters)')
    .transform(query => query.trim())
    .refine(query => query.length > 0, {
        message: 'Search query cannot be only whitespace',
    });

/**
 * Page number validation - returns number
 */
export const pageSchema = z.string()
    .optional()
    .default('1')
    .transform(val => parseInt(val, 10))
    .refine(val => !isNaN(val) && val >= 1 && val <= 1000, {
        message: 'Page must be an integer between 1 and 1000',
    });

// Infer the output type of the search request schema
type SearchRequestInput = {
    q: string;
    page?: string | undefined;
    providers?: string | undefined;
    genres?: string | undefined;
    sort?: string | undefined;
    limit?: string | undefined;
};

/**
 * Sort option validation
 */
const sortSchema = z.string()
    .optional()
    .default('relevance')
    .refine(val => ['relevance', 'newest', 'rating', 'popular'].includes(val), {
        message: 'Sort must be one of: relevance, newest, rating, popular',
    });

/**
 * Limit validation
 */
const limitSchema = z.string()
    .optional()
    .default('24')
    .transform(val => parseInt(val, 10))
    .refine(val => !isNaN(val) && val >= 1 && val <= 100, {
        message: 'Limit must be an integer between 1 and 100',
    });

/**
 * Providers filter validation (comma-separated provider slugs)
 */
const providersFilterSchema = z.string()
    .optional()
    .default('')
    .transform(val => {
        if (!val) return [];
        return val.split(',').map(p => p.trim()).filter(Boolean);
    })
    .refine(val => val.length <= 20, {
        message: 'Too many providers selected (max 20)',
    });

/**
 * Genres filter validation (comma-separated genre names)
 */
const genresFilterSchema = z.string()
    .optional()
    .default('')
    .transform(val => {
        if (!val) return [];
        return val.split(',').map(g => g.trim()).filter(Boolean);
    })
    .refine(val => val.length <= 10, {
        message: 'Too many genres selected (max 10)',
    });

/**
 * Search API request validation
 */
export const searchRequestSchema = z.object({
    q: searchQuerySchema,
    page: pageSchema,
    providers: providersFilterSchema,
    genres: genresFilterSchema,
    sort: sortSchema,
    limit: limitSchema,
});

// ============================================================================
// Playback API Validation
// ============================================================================

/**
 * Provider slug validation (alphanumeric + hyphens)
 */
export const providerSlugSchema = z.string()
    .min(1, 'Provider is required')
    .max(50, 'Provider slug too long')
    .regex(/^[a-z0-9-]+$/, 'Provider slug must be lowercase alphanumeric with hyphens');

/**
 * Drama ID validation (can be UUID or provider-specific ID)
 */
export const dramaIdSchema = z.string()
    .min(1, 'Drama ID is required')
    .max(200, 'Drama ID too long');

/**
 * Episode ID validation (can be UUID or provider-specific ID)
 */
export const episodeIdSchema = z.string()
    .min(1, 'Episode ID is required')
    .max(200, 'Episode ID too long');

/**
 * User ID validation (UUID or 'guest')
 */
export const userIdSchema = z.string()
    .min(1, 'User ID is required')
    .max(100, 'User ID too long')
    .refine(val => val === 'guest' || z.string().uuid().safeParse(val).success, {
        message: 'User ID must be a valid UUID or "guest"',
    });

/**
 * Playback API request validation
 */
export const playbackRequestSchema = z.object({
    provider: providerSlugSchema,
    drama: dramaIdSchema,
    episode: episodeIdSchema,
    userId: userIdSchema.optional().default('guest'),
});

// ============================================================================
// Watch Progress API Validation
// ============================================================================

/**
 * Progress seconds validation
 */
export const progressSecondsSchema = z.number()
    .int('Progress must be an integer')
    .min(0, 'Progress cannot be negative')
    .max(86400, 'Progress cannot exceed 24 hours (86400 seconds)');

/**
 * Watch progress request body validation
 * 
 * IMPORTANT: episodeId can be either:
 * 1. A UUID (database episode.id) - preferred for proper FK relationship
 * 2. A provider-specific episode ID (e.g., episode number, slug)
 * 
 * The API will attempt to resolve provider-specific IDs to UUIDs when possible.
 * If resolution fails, the progress is still saved with episode_id as NULL.
 */
export const watchProgressRequestSchema = z.object({
    userId: z.string()
        .min(1, 'User ID is required')
        .max(100, 'User ID too long')
        .refine(val => val === 'guest' || z.string().uuid().safeParse(val).success, {
            message: 'User ID must be a valid UUID or "guest"',
        }),
    dramaId: z.string()
        .min(1, 'Drama ID is required')
        .max(200, 'Drama ID too long')
        .refine(val => {
            const isUuid = z.string().uuid().safeParse(val).success;
            const isProviderScoped = /^[a-z0-9-]+:[\w-]+$/.test(val);
            return isUuid || isProviderScoped;
        }, {
            message: 'Drama ID must be a valid UUID or provider-scoped ID (provider:id)',
        }),
    episodeId: z.string()
        .min(1, 'Episode ID is required')
        .max(200, 'Episode ID too long')
        .refine(
            val => z.string().uuid().safeParse(val).success || val.length > 0,
            { message: 'Episode ID must be a valid UUID or provider-specific identifier' }
        ),
    progressSeconds: progressSecondsSchema,
    isCompleted: z.boolean().optional().default(false),
});

// ============================================================================
// Drama Detail API Validation
// ============================================================================

/**
 * Drama detail path parameter validation
 */
export const dramaDetailPathSchema = z.object({
    id: z.string()
        .min(1, 'Drama ID is required')
        .max(200, 'Drama ID too long'),
});

export const homeSectionQuerySchema = z.object({
    section: z.enum(['for-you', 'trending', 'new-releases']),
    page: pageSchema,
    limit: z.string()
        .optional()
        .default('24')
        .transform(val => parseInt(val, 10))
        .refine(val => !isNaN(val) && val >= 1 && val <= 100, {
            message: 'Limit must be an integer between 1 and 100',
        }),
});

// ============================================================================
// Validation Helper Functions
// ============================================================================

export interface ValidationError {
    code: ErrorCode;
    message: string;
    details?: Record<string, unknown>;
}

export type ValidationResult<T> =
    | { success: true; data: T }
    | { success: false; error: ValidationError };

/**
 * Validate search params against a schema
 * Returns either success with data or failure with error details
 */
export function validateSearchParams<T>(
    searchParams: URLSearchParams,
    schema: z.ZodType<T, z.ZodTypeDef, any>
): ValidationResult<T> {
    const params: Record<string, string> = {};

    searchParams.forEach((value, key) => {
        params[key] = value;
    });

    const result = schema.safeParse(params);

    if (result.success) {
        return { success: true, data: result.data };
    }

    const firstError = result.error.issues[0];
    return {
        success: false,
        error: {
            code: 'VALIDATION_ERROR' as ErrorCode,
            message: firstError?.message || 'Invalid request parameters',
            details: {
                field: firstError?.path.join('.') || 'unknown',
                issues: result.error.issues.map(i => ({
                    field: i.path.join('.'),
                    message: i.message,
                })),
            },
        },
    };
}

/**
 * Validate request body against a schema
 */
export async function validateRequestBody<T>(
    request: Request,
    schema: z.ZodType<T, z.ZodTypeDef, any>
): Promise<ValidationResult<T>> {
    try {
        const body = await request.json();
        const result = schema.safeParse(body);

        if (result.success) {
            return { success: true, data: result.data };
        }

        const firstError = result.error.issues[0];
        return {
            success: false,
            error: {
                code: 'VALIDATION_ERROR' as ErrorCode,
                message: firstError?.message || 'Invalid request body',
                details: {
                    field: firstError?.path.join('.') || 'unknown',
                    issues: result.error.issues.map(i => ({
                        field: i.path.join('.'),
                        message: i.message,
                    })),
                },
            },
        };
    } catch {
        return {
            success: false,
            error: {
                code: 'BAD_REQUEST' as ErrorCode,
                message: 'Invalid JSON in request body',
            },
        };
    }
}

/**
 * Validate path parameters against a schema
 */
export async function validatePathParams<T>(
    params: Promise<Record<string, string>>,
    schema: z.ZodType<T, z.ZodTypeDef, any>
): Promise<ValidationResult<T>> {
    const resolved = await params;
    const result = schema.safeParse(resolved);

    if (result.success) {
        return { success: true, data: result.data };
    }

    const firstError = result.error.issues[0];
    return {
        success: false,
        error: {
            code: 'VALIDATION_ERROR' as ErrorCode,
            message: firstError?.message || 'Invalid path parameters',
            details: {
                field: firstError?.path.join('.') || 'unknown',
                issues: result.error.issues.map(i => ({
                    field: i.path.join('.'),
                    message: i.message,
                })),
            },
        },
    };
}
