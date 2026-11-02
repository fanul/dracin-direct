import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file for database credentials
config({ path: resolve(process.cwd(), '.env.local') });

export default defineConfig({
    schema: './src/lib/db/schema/index.ts',
    out: './drizzle',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || '',
    },
    verbose: true,
    strict: true,
});
