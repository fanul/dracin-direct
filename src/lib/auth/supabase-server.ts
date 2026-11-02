import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './database.types';

/**
 * Supabase Auth client for Server Components and Server Actions.
 * 
 * This client handles session management via cookies and is designed
 * for use in Next.js App Router server-side code.
 * 
 * Usage in Server Components:
 * ```ts
 * const supabase = await createServerSupabaseClient();
 * const { data: { session } } = await supabase.auth.getSession();
 * ```
 * 
 * Usage in Server Actions:
 * ```ts
 * 'use server'
 * const supabase = await createServerSupabaseClient();
 * await supabase.auth.signInWithPassword({ email, password });
 * ```
 */
export async function createServerSupabaseClient() {
    const cookieStore = await cookies();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error(
            'Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required for auth.'
        );
    }

    return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options)
                    );
                } catch {
                    // The `setAll` method was called from a Server Component.
                    // This can be ignored if you have middleware refreshing sessions.
                }
            },
        },
    });
}

/**
 * Get the current session from server-side context.
 * Returns null if no session exists.
 */
export async function getServerSession() {
    const supabase = await createServerSupabaseClient();
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
        console.error('Error getting session:', error.message);
        return null;
    }

    return session;
}

/**
 * Get the current user from server-side context.
 * Returns null if no user is authenticated.
 */
export async function getServerUser() {
    const session = await getServerSession();
    return session?.user ?? null;
}

/**
 * Require authentication - throws if no user is authenticated.
 * Use in Server Components or Server Actions that require auth.
 */
export async function requireAuth() {
    const user = await getServerUser();

    if (!user) {
        throw new Error('Authentication required');
    }

    return user;
}