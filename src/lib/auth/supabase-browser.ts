import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './database.types';

/**
 * Supabase Auth client for Client Components.
 * 
 * This singleton client is designed for use in Next.js App Router client components.
 * It handles session management via cookies automatically.
 * 
 * Usage:
 * ```tsx
 * 'use client'
 * import { getBrowserSupabaseClient } from '@/lib/auth/supabase-browser';
 * 
 * const supabase = getBrowserSupabaseClient();
 * const { data: { session } } = await supabase.auth.getSession();
 * ```
 */

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

/**
 * Get the Supabase browser client singleton.
 * Safe to call from client components.
 */
export function getBrowserSupabaseClient() {
    if (browserClient) {
        return browserClient;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error(
            'Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required.'
        );
    }

    browserClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);

    return browserClient;
}

/**
 * Get the current session from client-side context.
 * Returns null if no session exists.
 */
export async function getBrowserSession() {
    const supabase = getBrowserSupabaseClient();
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
        console.error('Error getting session:', error.message);
        return null;
    }

    return session;
}

/**
 * Get the current user from client-side context.
 * Returns null if no user is authenticated.
 */
export async function getBrowserUser() {
    const session = await getBrowserSession();
    return session?.user ?? null;
}

/**
 * Subscribe to auth state changes.
 * Returns an unsubscribe function.
 * 
 * Usage:
 * ```tsx
 * useEffect(() => {
 *   const unsubscribe = subscribeToAuthChanges((event, session) => {
 *     console.log('Auth event:', event, session);
 *   });
 *   return unsubscribe;
 * }, []);
 * ```
 */
export function subscribeToAuthChanges(
    callback: (event: string, session: unknown) => void
) {
    const supabase = getBrowserSupabaseClient();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        callback(event, session);
    });

    return () => subscription.unsubscribe();
}
