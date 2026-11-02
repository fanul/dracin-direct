import { pgTable, uuid, text, timestamp, boolean, pgEnum, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { dramas, episodes } from './providers';

/**
 * Subscription tier enum
 */
export const subscriptionTierEnum = pgEnum('subscription_tier', ['free', 'premium', 'vip']);

/**
 * Subscription status enum
 */
export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'canceled', 'expired']);

/**
 * Report status enum
 */
export const reportStatusEnum = pgEnum('report_status', ['open', 'reviewing', 'resolved', 'rejected']);

/**
 * Profiles table - extends Supabase Auth users
 * 
 * This table is keyed by Supabase Auth user ID (auth.users.id).
 * Supabase Auth handles authentication, this table stores additional profile data.
 * 
 * IMPORTANT: The id column references auth.users.id via Supabase's built-in auth schema.
 * Do NOT create a separate users table - use auth.users for authentication.
 */
export const profiles = pgTable('profiles', {
    // This ID matches auth.users.id from Supabase Auth
    id: uuid('id').primaryKey(),
    email: text('email').unique(),
    display_name: text('display_name'),
    avatar_url: text('avatar_url'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Subscriptions table - internal monetization tracking
 */
export const subscriptions = pgTable('subscriptions', {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
    tier: subscriptionTierEnum('tier').notNull(),
    status: subscriptionStatusEnum('status').notNull(),
    started_at: timestamp('started_at', { withTimezone: true }),
    ends_at: timestamp('ends_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Watch history table - tracks user viewing progress
 */
export const watchHistory = pgTable('watch_history', {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
    drama_id: uuid('drama_id').notNull().references(() => dramas.id, { onDelete: 'cascade' }),
    episode_id: uuid('episode_id').references(() => episodes.id, { onDelete: 'set null' }),
    episode_number: integer('episode_number'),
    progress_seconds: integer('progress_seconds').default(0).notNull(),
    progress_percent: integer('progress_percent').default(0).notNull(),
    is_completed: boolean('is_completed').default(false).notNull(),
    last_watched_at: timestamp('last_watched_at', { withTimezone: true }).defaultNow().notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    userDramaEpisodeUnique: {
        columns: [table.user_id, table.drama_id, table.episode_id],
        name: 'watch_history_user_id_drama_id_episode_id_key',
    },
}));

/**
 * Reports table - user reports for content moderation
 */
export const reports = pgTable('reports', {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').references(() => profiles.id, { onDelete: 'set null' }),
    provider_slug: text('provider_slug'),
    provider_drama_id: text('provider_drama_id'),
    provider_episode_id: text('provider_episode_id'),
    reason: text('reason').notNull(),
    notes: text('notes'),
    status: reportStatusEnum('status').default('open').notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Bookmarks table - stores user's bookmarked dramas
 */
export const bookmarks = pgTable('bookmarks', {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
    drama_id: uuid('drama_id').notNull().references(() => dramas.id, { onDelete: 'cascade' }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    userDramaUnique: {
        columns: [table.user_id, table.drama_id],
        name: 'bookmarks_user_id_drama_id_key',
    },
}));

/**
 * Profile relations
 */
export const profilesRelations = relations(profiles, ({ many }) => ({
    subscriptions: many(subscriptions),
    watch_history: many(watchHistory),
    reports: many(reports),
    bookmarks: many(bookmarks),
}));

/**
 * Subscription relations
 */
export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
    user: one(profiles, {
        fields: [subscriptions.user_id],
        references: [profiles.id],
    }),
}));

/**
 * Watch history relations
 */
export const watchHistoryRelations = relations(watchHistory, ({ one }) => ({
    user: one(profiles, {
        fields: [watchHistory.user_id],
        references: [profiles.id],
    }),
    drama: one(dramas, {
        fields: [watchHistory.drama_id],
        references: [dramas.id],
    }),
    episode: one(episodes, {
        fields: [watchHistory.episode_id],
        references: [episodes.id],
    }),
}));

/**
 * Report relations
 */
export const reportsRelations = relations(reports, ({ one }) => ({
    user: one(profiles, {
        fields: [reports.user_id],
        references: [profiles.id],
    }),
}));

/**
 * Bookmarks relations
 */
export const bookmarksRelations = relations(bookmarks, ({ one }) => ({
    user: one(profiles, {
        fields: [bookmarks.user_id],
        references: [profiles.id],
    }),
    drama: one(dramas, {
        fields: [bookmarks.drama_id],
        references: [dramas.id],
    }),
}));

// Type exports
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type WatchHistoryEntry = typeof watchHistory.$inferSelect;
export type NewWatchHistoryEntry = typeof watchHistory.$inferInsert;
export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;
export type Bookmark = typeof bookmarks.$inferSelect;
export type NewBookmark = typeof bookmarks.$inferInsert;
