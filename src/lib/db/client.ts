import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getServerEnv } from '../config/env';

let supabaseClient: SupabaseClient | null = null;

/**
 * Get the Supabase client singleton.
 * Uses validated environment variables from centralized config.
 * Server-side only - validates secrets on first access.
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    // This will throw with clear error messages if env vars are missing
    const env = getServerEnv();

    supabaseClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
      },
    });
  }

  return supabaseClient;
}
