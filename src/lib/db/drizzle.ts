import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

/**
 * Drizzle ORM client for type-safe database operations.
 * 
 * This client uses the postgres.js driver for direct PostgreSQL connections.
 * Use this for server-side operations that benefit from Drizzle's type safety.
 * 
 * For Supabase Auth operations, use the Supabase client from './client.ts'.
 */

let drizzleClient: ReturnType<typeof drizzle> | null = null;

/**
 * Get the Drizzle ORM client singleton.
 * Uses DATABASE_URL or SUPABASE_DB_URL for connection.
 * Server-side only.
 */
export function getDrizzleClient() {
    if (!drizzleClient) {
        const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

        if (!connectionString) {
            throw new Error(
                'DATABASE_URL or SUPABASE_DB_URL is required for Drizzle client. ' +
                'Get the connection string from your Supabase project settings.'
            );
        }

        // For serverless environments (Vercel, etc.), use max: 1
        const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;

        const client = postgres(connectionString, {
            max: isServerless ? 1 : 10,
            idle_timeout: 20,
            connect_timeout: 10,
        });

        drizzleClient = drizzle(client, { schema });
    }

    return drizzleClient;
}

/**
 * Export schema for direct access
 */
export * from './schema';

/**
 * Export types
 */
export type DrizzleClient = ReturnType<typeof drizzle<typeof schema>>;
