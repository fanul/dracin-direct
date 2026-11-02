'use server';

import { signUp, signIn, signOut } from '@/lib/auth/service';
import { redirect } from 'next/navigation';

/**
 * Server Actions for Authentication
 * 
 * These actions handle login, signup, and logout flows.
 * They use the auth service layer which abstracts Supabase Auth.
 */

export interface ActionResult {
    success: boolean;
    error?: string;
}

/**
 * Sign up a new user
 */
export async function signupAction(
    email: string,
    password: string,
    displayName?: string
): Promise<ActionResult> {
    if (!email || !password) {
        return { success: false, error: 'Email and password are required' };
    }

    if (password.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters' };
    }

    const result = await signUp({ email, password, displayName });

    if (result.success) {
        redirect('/login?message=Account created successfully. Please sign in.');
    }

    return { success: false, error: result.error };
}

/**
 * Sign in an existing user
 */
export async function loginAction(
    email: string,
    password: string
): Promise<ActionResult> {
    if (!email || !password) {
        return { success: false, error: 'Email and password are required' };
    }

    const result = await signIn({ email, password });

    if (result.success) {
        redirect('/profile');
    }

    return { success: false, error: result.error };
}

/**
 * Sign out the current user
 */
export async function logoutAction(): Promise<ActionResult> {
    const result = await signOut();

    if (result.success) {
        redirect('/');
    }

    return { success: false, error: result.error };
}
