-- Migration: 001_initial_schema_constraints
-- Version: 1.0.0
-- Date: 2026-02-24
-- Description: Adds missing unique constraints and indexes for production readiness
-- 
-- This migration addresses:
-- 1. Episode upsert conflict target compatibility (sync-episodes uses drama_id, episode_no)
-- 2. Watch history unique constraint alignment
-- 3. Performance indexes for common query patterns
--
-- Prerequisites: Run DB_SCHEMA.sql first to create base tables

-- ============================================================================
-- EPISODES TABLE: Add unique constraint for upsert conflict target
-- ============================================================================
-- The sync-episodes job uses onConflict: 'drama_id,episode_no'
-- This requires a unique constraint on (drama_id, episode_no)

-- First, handle potential NULL episode_no values by setting a default
-- Episodes without numeric ordering get a high sentinel value to avoid conflicts
UPDATE episodes 
SET episode_no = 999999 
WHERE episode_no IS NULL;

-- Add NOT NULL constraint to episode_no
ALTER TABLE episodes 
ALTER COLUMN episode_no SET NOT NULL;

-- Create unique constraint for episode ordering within a drama
-- This enables the upsert conflict target used in sync-episodes.ts
CREATE UNIQUE INDEX IF NOT EXISTS idx_episodes_drama_no_unique 
ON episodes(drama_id, episode_no);

-- ============================================================================
-- WATCH_HISTORY TABLE: Ensure unique constraint is properly named
-- ============================================================================
-- The watch_history table has unique(user_id, drama_id, episode_id)
-- but episode_id can be NULL which may cause issues with the constraint
-- We keep the existing constraint but add a partial index for non-null episodes

-- Add a partial unique index for cases where episode_id is NOT NULL
-- This ensures proper constraint enforcement for the upsert path
CREATE UNIQUE INDEX IF NOT EXISTS idx_watch_history_user_drama_episode 
ON watch_history(user_id, drama_id, episode_id) 
WHERE episode_id IS NOT NULL;

-- For cases where episode_id is NULL (watching drama without episode context)
-- we use a separate partial index
CREATE UNIQUE INDEX IF NOT EXISTS idx_watch_history_user_drama_null_episode 
ON watch_history(user_id, drama_id) 
WHERE episode_id IS NULL;

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================

-- Index for provider episode lookups
CREATE INDEX IF NOT EXISTS idx_episodes_provider_episode 
ON episodes(provider_slug, provider_episode_id);

-- Index for chapter-based episode lookups
CREATE INDEX IF NOT EXISTS idx_episodes_chapter 
ON episodes(drama_id, chapter_id) 
WHERE chapter_id IS NOT NULL;

-- Index for slug-based episode lookups
CREATE INDEX IF NOT EXISTS idx_episodes_slug 
ON episodes(drama_id, slug) 
WHERE slug IS NOT NULL;

-- ============================================================================
-- MIGRATION LOG
-- ============================================================================
CREATE TABLE IF NOT EXISTS migration_log (
  id SERIAL PRIMARY KEY,
  migration_name TEXT NOT NULL UNIQUE,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  checksum TEXT,
  notes TEXT
);

INSERT INTO migration_log (migration_name, notes)
VALUES ('001_initial_schema_constraints', 'Added unique constraints for episode upserts and watch history')
ON CONFLICT (migration_name) DO NOTHING;

-- ============================================================================
-- ROLLBACK (for reference - run manually if needed)
-- ============================================================================
-- DROP INDEX IF EXISTS idx_episodes_drama_no_unique;
-- DROP INDEX IF EXISTS idx_watch_history_user_drama_episode;
-- DROP INDEX IF EXISTS idx_watch_history_user_drama_null_episode;
-- DROP INDEX IF EXISTS idx_episodes_provider_episode;
-- DROP INDEX IF EXISTS idx_episodes_chapter;
-- DROP INDEX IF EXISTS idx_episodes_slug;
-- ALTER TABLE episodes ALTER COLUMN episode_no DROP NOT NULL;
-- DELETE FROM migration_log WHERE migration_name = '001_initial_schema_constraints';
