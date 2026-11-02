import { createServerSupabaseClient, getServerUser } from './supabase-server';
import { getDrizzleClient } from '../db/drizzle';
import { profiles } from '../db/schema';
import { eq } from 'drizzle-orm';
import type { User } from '@supabase/supabase-js';

/**
 * Auth Service Layer
 * 
 * Provides high-level authentication primitives for use in Server Actions
 * and API routes. This layer abstracts Supabase Auth operations and
 * handles profile synchronization.
 */

export interface AuthResult {
    success: boolean;
    error?: string;
    user?: User;
}

export interface SignUpParams {
    email: string;
    password: string;
    displayName?: string;
}

export interface SignInParams {
    email: string;
    password: string;
}

/**
 * Sign up a new user with email and password.
 * Creates both the auth user and a profile record.
 */
export async function signUp({ email, password, displayName }: SignUpParams): Promise<AuthResult> {
    try {
        const supabase = await createServerSupabaseClient();

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    display_name: displayName,
                },
            },
        });

        if (error) {
            return { success: false, error: error.message };
        }

        if (!data.user) {
            return { success: false, error: 'Failed to create user' };
        }

        // Create profile record
        await createProfile(data.user.id, email, displayName);

        return { success: true, user: data.user };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error during sign up';
        return { success: false, error: message };
    }
}

/**
 * Sign in an existing user with email and password.
 */
export async function signIn({ email, password }: SignInParams): Promise<AuthResult> {
    try {
        const supabase = await createServerSupabaseClient();

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return { success: false, error: error.message };
        }

        if (!data.user) {
            return { success: false, error: 'Failed to sign in' };
        }

        // Ensure profile exists (in case it wasn't created during signup)
        await ensureProfile(data.user.id, data.user.email);

        return { success: true, user: data.user };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error during sign in';
        return { success: false, error: message };
    }
}

/**
 * Sign out the current user.
 */
export async function signOut(): Promise<AuthResult> {
    try {
        const supabase = await createServerSupabaseClient();

        const { error } = await supabase.auth.signOut();

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error during sign out';
        return { success: false, error: message };
    }
}

/**
 * Get the current authenticated user.
 */
export async function getCurrentUser(): Promise<User | null> {
    return getServerUser();
}

/**
 * Check if the current user is authenticated.
 */
export async function isAuthenticated(): Promise<boolean> {
    const user = await getCurrentUser();
    return user !== null;
}

/**
 * Create a profile record for a user.
 */
async function createProfile(
    userId: string,
    email?: string,
    displayName?: string
): Promise<void> {
    try {
        const db = getDrizzleClient();

        await db.insert(profiles).values({
            id: userId,
            email: email || null,
            display_name: displayName || null,
        }).onConflictDoNothing();
    } catch (err) {
        console.error('Failed to create profile:', err);
        // Don't throw - profile can be created later
    }
}

/**
 * Ensure a profile exists for the user.
 * Creates one if it doesn't exist.
 */
async function ensureProfile(userId: string, email?: string): Promise<void> {
    try {
        const db = getDrizzleClient();

        const existing = await db.select()
            .from(profiles)
            .where(eq(profiles.id, userId))
            .limit(1);

        if (existing.length === 0) {
            await createProfile(userId, email);
        }
    } catch (err) {
        console.error('Failed to ensure profile:', err);
    }
}

/**
 * Get a user's profile from the database.
 */
export async function getUserProfile(userId: string) {
    try {
        const db = getDrizzleClient();

        const profile = await db.select()
            .from(profiles)
            .where(eq(profiles.id, userId))
            .limit(1);

        return profile[0] || null;
    } catch (err) {
        console.error('Failed to get user profile:', err);
        return null;
    }
}

/**
 * Update a user's profile.
 */
export async function updateUserProfile(
    userId: string,
    updates: { displayName?: string; avatarUrl?: string }
): Promise<AuthResult> {
    try {
        const db = getDrizzleClient();

        await db.update(profiles)
            .set({
                ...updates,
                updated_at: new Date(),
            })
            .where(eq(profiles.id, userId));

        return { success: true };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update profile';
        return { success: false, error: message };
    }
}