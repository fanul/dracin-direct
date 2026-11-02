/**
 * Drizzle ORM Schema Index
 * 
 * Exports all database schema definitions for use with Drizzle ORM.
 * This file is referenced by drizzle.config.ts for migrations.
 */

// Provider-related tables
export * from './providers';

// Auth-related tables (profiles, subscriptions, watch_history, reports)
export * from './auth';
