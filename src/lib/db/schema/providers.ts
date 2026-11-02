import { pgTable, uuid, text, timestamp, boolean, jsonb, integer, numeric, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * Provider status enum
 */
export const providerStatusEnum = pgEnum('provider_status', ['active', 'maintenance', 'disabled']);

/**
 * Providers table - stores streaming provider information
 */
export const providers = pgTable('providers', {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').unique().notNull(),
    name: text('name').notNull(),
    vip_group: text('vip_group'),
    status: providerStatusEnum('status').default('active').notNull(),
    endpoints: jsonb('endpoints'),
    capabilities: jsonb('capabilities'),
    last_synced_at: timestamp('last_synced_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
/**
 * Dramas table - stores drama/series information
 */
export const dramas = pgTable('dramas', {
    id: uuid('id').primaryKey().defaultRandom(),
    provider_slug: text('provider_slug').notNull().references(() => providers.slug),
    provider_drama_id: text('provider_drama_id').notNull(),
    title: text('title').notNull(),
    synopsis: text('synopsis'),
    cover_url: text('cover_url'),
    cover_urls: jsonb('cover_urls'),
    language: text('language'),
    genres: jsonb('genres'),
    tags: jsonb('tags'),
    episode_count: integer('episode_count'),
    is_premium: boolean('is_premium').default(false).notNull(),
    popularity_score: numeric('popularity_score'),
    last_provider_update: timestamp('last_provider_update', { withTimezone: true }),
    last_synced_at: timestamp('last_synced_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    providerDramaUnique: {
        columns: [table.provider_slug, table.provider_drama_id],
        name: 'dramas_provider_slug_provider_drama_id_key',
    },
}));

/**
 * Episodes table - stores episode information for dramas
 */
export const episodes = pgTable('episodes', {
    id: uuid('id').primaryKey().defaultRandom(),
    drama_id: uuid('drama_id').notNull().references(() => dramas.id, { onDelete: 'cascade' }),
    provider_slug: text('provider_slug').notNull().references(() => providers.slug),
    provider_episode_id: text('provider_episode_id'),
    episode_no: integer('episode_no'),
    chapter_id: text('chapter_id'),
    slug: text('slug'),
    title: text('title'),
    duration_ms: integer('duration_ms'),
    is_locked: boolean('is_locked').default(false).notNull(),
    last_synced_at: timestamp('last_synced_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Provider relations
 */
export const providersRelations = relations(providers, ({ many }) => ({
    dramas: many(dramas),
    episodes: many(episodes),
}));

/**
 * Drama relations
 */
export const dramasRelations = relations(dramas, ({ one, many }) => ({
    provider: one(providers, {
        fields: [dramas.provider_slug],
        references: [providers.slug],
    }),
    episodes: many(episodes),
}));

/**
 * Episode relations
 */
export const episodesRelations = relations(episodes, ({ one }) => ({
    drama: one(dramas, {
        fields: [episodes.drama_id],
        references: [dramas.id],
    }),
    provider: one(providers, {
        fields: [episodes.provider_slug],
        references: [providers.slug],
    }),
}));
