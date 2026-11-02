/**
 * Tests for Migration Artifact Compatibility
 * 
 * Verifies that the migration file contains required artifacts:
 * - Unique constraint for episode upsert (drama_id, episode_no)
 * - Unique indexes for watch_history
 * - Migration log table
 * 
 * These tests ensure the migration file is compatible with the codebase expectations.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('Migration Artifact Compatibility', () => {
    const migrationPath = join(process.cwd(), 'migrations', '001_initial_schema_constraints.sql');
    const dbSchemaPath = join(process.cwd(), 'DB_SCHEMA.sql');

    describe('Migration File Existence', () => {
        it('should have migration file 001_initial_schema_constraints.sql', () => {
            expect(existsSync(migrationPath)).toBe(true);
        });

        it('should have DB_SCHEMA.sql base schema file', () => {
            expect(existsSync(dbSchemaPath)).toBe(true);
        });
    });

    describe('Episode Upsert Constraint', () => {
        let migrationContent: string;

        beforeAll(() => {
            migrationContent = readFileSync(migrationPath, 'utf-8');
        });

        it('should contain unique index for episodes(drama_id, episode_no)', () => {
            // This is required for the sync-episodes job which uses onConflict: 'drama_id,episode_no'
            // The migration has multi-line format, so we check for the index name and table separately
            expect(migrationContent).toContain('idx_episodes_drama_no_unique');
            expect(migrationContent).toContain('ON episodes(drama_id, episode_no)');
        });

        it('should set episode_no to NOT NULL', () => {
            // Required for the unique constraint to work properly
            const pattern = /ALTER\s+TABLE\s+episodes\s+ALTER\s+COLUMN\s+episode_no\s+SET\s+NOT\s+NULL/i;
            expect(pattern.test(migrationContent)).toBe(true);
        });

        it('should handle NULL episode_no values before constraint', () => {
            // Should update NULL values to a sentinel value before adding NOT NULL
            const pattern = /UPDATE\s+episodes\s+SET\s+episode_no\s*=\s*999999\s+WHERE\s+episode_no\s+IS\s+NULL/i;
            expect(pattern.test(migrationContent)).toBe(true);
        });
    });

    describe('Watch History Constraints', () => {
        let migrationContent: string;

        beforeAll(() => {
            migrationContent = readFileSync(migrationPath, 'utf-8');
        });

        it('should have unique index for watch_history with non-null episode_id', () => {
            // Partial unique index for cases where episode_id is NOT NULL
            expect(migrationContent).toContain('idx_watch_history_user_drama_episode');
            expect(migrationContent).toContain('WHERE episode_id IS NOT NULL');
        });

        it('should have unique index for watch_history with null episode_id', () => {
            // Partial unique index for cases where episode_id is NULL
            expect(migrationContent).toContain('idx_watch_history_user_drama_null_episode');
            expect(migrationContent).toContain('WHERE episode_id IS NULL');
        });
    });

    describe('Performance Indexes', () => {
        let migrationContent: string;

        beforeAll(() => {
            migrationContent = readFileSync(migrationPath, 'utf-8');
        });

        it('should have index for provider episode lookups', () => {
            expect(migrationContent).toContain('idx_episodes_provider_episode');
            expect(migrationContent).toContain('ON episodes(provider_slug, provider_episode_id)');
        });

        it('should have index for chapter-based episode lookups', () => {
            expect(migrationContent).toContain('idx_episodes_chapter');
            expect(migrationContent).toContain('ON episodes(drama_id, chapter_id)');
        });

        it('should have index for slug-based episode lookups', () => {
            expect(migrationContent).toContain('idx_episodes_slug');
            expect(migrationContent).toContain('ON episodes(drama_id, slug)');
        });
    });

    describe('Migration Log Table', () => {
        let migrationContent: string;

        beforeAll(() => {
            migrationContent = readFileSync(migrationPath, 'utf-8');
        });

        it('should create migration_log table', () => {
            const pattern = /CREATE\s+TABLE.*migration_log/i;
            expect(pattern.test(migrationContent)).toBe(true);
        });

        it('should have migration_name column with unique constraint', () => {
            const pattern = /migration_name\s+TEXT\s+NOT\s+NULL\s+UNIQUE/i;
            expect(pattern.test(migrationContent)).toBe(true);
        });

        it('should have applied_at timestamp column', () => {
            const pattern = /applied_at\s+TIMESTAMPTZ\s+NOT\s+NULL\s+DEFAULT\s+NOW\(\)/i;
            expect(pattern.test(migrationContent)).toBe(true);
        });

        it('should insert migration record', () => {
            expect(migrationContent).toContain('INSERT INTO migration_log');
            expect(migrationContent).toContain('001_initial_schema_constraints');
        });

        it('should use ON CONFLICT DO NOTHING for idempotency', () => {
            const pattern = /ON\s+CONFLICT\s+\(migration_name\)\s+DO\s+NOTHING/i;
            expect(pattern.test(migrationContent)).toBe(true);
        });
    });

    describe('Rollback Section', () => {
        let migrationContent: string;

        beforeAll(() => {
            migrationContent = readFileSync(migrationPath, 'utf-8');
        });

        it('should include rollback commands as comments', () => {
            expect(migrationContent).toContain('ROLLBACK');
        });

        it('should have DROP INDEX commands in rollback', () => {
            const pattern = /DROP\s+INDEX\s+IF\s+EXISTS\s+idx_episodes_drama_no_unique/i;
            expect(pattern.test(migrationContent)).toBe(true);
        });
    });
});

describe('DB Schema Compatibility', () => {
    let dbSchemaContent: string;

    beforeAll(() => {
        const dbSchemaPath = join(process.cwd(), 'DB_SCHEMA.sql');
        dbSchemaContent = readFileSync(dbSchemaPath, 'utf-8');
    });

    describe('Required Tables', () => {
        it('should have providers table', () => {
            const pattern = /CREATE\s+TABLE.*providers/i;
            expect(pattern.test(dbSchemaContent)).toBe(true);
        });

        it('should have dramas table', () => {
            const pattern = /CREATE\s+TABLE.*dramas/i;
            expect(pattern.test(dbSchemaContent)).toBe(true);
        });

        it('should have episodes table', () => {
            const pattern = /CREATE\s+TABLE.*episodes/i;
            expect(pattern.test(dbSchemaContent)).toBe(true);
        });

        it('should have users table', () => {
            const pattern = /CREATE\s+TABLE.*users/i;
            expect(pattern.test(dbSchemaContent)).toBe(true);
        });

        it('should have watch_history table', () => {
            const pattern = /CREATE\s+TABLE.*watch_history/i;
            expect(pattern.test(dbSchemaContent)).toBe(true);
        });

        it('should have subscriptions table', () => {
            const pattern = /CREATE\s+TABLE.*subscriptions/i;
            expect(pattern.test(dbSchemaContent)).toBe(true);
        });
    });

    describe('Episodes Table Structure', () => {
        it('should have drama_id foreign key', () => {
            const pattern = /drama_id\s+UUID.*REFERENCES\s+dramas/i;
            expect(pattern.test(dbSchemaContent)).toBe(true);
        });

        it('should have episode_no column', () => {
            const pattern = /episode_no\s+INT/i;
            expect(pattern.test(dbSchemaContent)).toBe(true);
        });

        it('should have provider_slug column', () => {
            const pattern = /provider_slug\s+TEXT/i;
            expect(pattern.test(dbSchemaContent)).toBe(true);
        });

        it('should have provider_episode_id column', () => {
            const pattern = /provider_episode_id\s+TEXT/i;
            expect(pattern.test(dbSchemaContent)).toBe(true);
        });

        it('should have chapter_id column', () => {
            const pattern = /chapter_id\s+TEXT/i;
            expect(pattern.test(dbSchemaContent)).toBe(true);
        });

        it('should have slug column', () => {
            const pattern = /slug\s+TEXT/i;
            expect(pattern.test(dbSchemaContent)).toBe(true);
        });
    });

    describe('Watch History Table Structure', () => {
        it('should have user_id foreign key', () => {
            const pattern = /user_id\s+UUID.*REFERENCES\s+users/i;
            expect(pattern.test(dbSchemaContent)).toBe(true);
        });

        it('should have drama_id foreign key', () => {
            const pattern = /drama_id\s+UUID.*REFERENCES\s+dramas/i;
            expect(pattern.test(dbSchemaContent)).toBe(true);
        });

        it('should have episode_id column (nullable FK)', () => {
            const pattern = /episode_id\s+UUID.*REFERENCES\s+episodes/i;
            expect(pattern.test(dbSchemaContent)).toBe(true);
        });

        it('should have progress_seconds column', () => {
            const pattern = /progress_seconds\s+INT/i;
            expect(pattern.test(dbSchemaContent)).toBe(true);
        });

        it('should have is_completed column', () => {
            const pattern = /is_completed\s+BOOLEAN/i;
            expect(pattern.test(dbSchemaContent)).toBe(true);
        });

        it('should have last_watched_at column', () => {
            const pattern = /last_watched_at\s+TIMESTAMPTZ/i;
            expect(pattern.test(dbSchemaContent)).toBe(true);
        });
    });
});
