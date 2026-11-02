-- dracinhub DB Schema (Supabase Postgres) - migration v1
-- Note: assumes UUID extension available (gen_random_uuid).
--
-- IMPORTANT: After running this base schema, run migrations/001_initial_schema_constraints.sql
-- to add required unique constraints for production upsert operations.

-- Providers
create table if not exists providers (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  vip_group text,
  status text not null default 'active', -- active|maintenance|disabled
  endpoints jsonb, -- raw endpoints from catalog for debugging
  capabilities jsonb, -- capability matrix (supports_search, playback_type, etc.)
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_providers_status on providers(status);

-- Dramas (Series/Book/Drama)
create table if not exists dramas (
  id uuid primary key default gen_random_uuid(),
  provider_slug text not null references providers(slug),
  provider_drama_id text not null,
  title text not null,
  synopsis text,
  cover_url text,
  cover_urls jsonb, -- array of images
  language text,
  genres jsonb,
  tags jsonb,
  episode_count int,
  is_premium boolean not null default false, -- internal monetization flag
  popularity_score numeric,
  last_provider_update timestamptz,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider_slug, provider_drama_id)
);

create index if not exists idx_dramas_provider on dramas(provider_slug);
create index if not exists idx_dramas_popularity on dramas(popularity_score desc);
create index if not exists idx_dramas_updated on dramas(updated_at desc);

-- Episodes
-- NOTE: episode_no should be NOT NULL with unique constraint for upsert operations.
-- Run migrations/001_initial_schema_constraints.sql to add this constraint.
create table if not exists episodes (
  id uuid primary key default gen_random_uuid(),
  drama_id uuid not null references dramas(id) on delete cascade,
  provider_slug text not null references providers(slug),
  provider_episode_id text, -- if available
  episode_no int,          -- if numeric ordering exists (should be NOT NULL after migration)
  chapter_id text,         -- if provider uses chapterId
  slug text,               -- if provider uses slug
  title text,
  duration_ms int,
  is_locked boolean not null default false,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_episodes_drama on episodes(drama_id);
create index if not exists idx_episodes_order on episodes(drama_id, episode_no);
-- NOTE: Run migration to add unique index on (drama_id, episode_no) for upsert conflict target

-- Users
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Subscriptions (internal monetization)
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  tier text not null, -- free|premium|...
  status text not null, -- active|canceled|expired
  started_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_subscriptions_user on subscriptions(user_id, status);

-- Bookmarks
create table if not exists bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  drama_id uuid not null references dramas(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, drama_id)
);

create index if not exists idx_bookmarks_user_created on bookmarks(user_id, created_at desc);

-- Watch history / progress
-- NOTE: The unique constraint on (user_id, drama_id, episode_id) has a caveat:
-- episode_id can be NULL, which may cause issues. Run migration for partial indexes.
create table if not exists watch_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  drama_id uuid not null references dramas(id) on delete cascade,
  episode_id uuid references episodes(id) on delete set null,
  progress_seconds int not null default 0,
  is_completed boolean not null default false,
  last_watched_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, drama_id, episode_id)
);

create index if not exists idx_watch_user on watch_history(user_id, last_watched_at desc);
-- NOTE: Run migration to add partial unique indexes for proper NULL episode_id handling

-- Reports / Moderation
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  provider_slug text,
  provider_drama_id text,
  provider_episode_id text,
  reason text not null,
  notes text,
  status text not null default 'open', -- open|reviewing|resolved|rejected
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_reports_status on reports(status, created_at desc);
