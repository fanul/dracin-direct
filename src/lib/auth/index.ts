/**
 * Auth Module Index
 * 
 * Exports all auth-related utilities, services, and types.
 */

// Server-side auth utilities
export {
    createServerSupabaseClient,
    getServerSession,
    getServerUser,
    requireAuth,
} from './supabase-server';

// Client-side auth utilities
export {
    getBrowserSupabaseClient,
    getBrowserSession,
    getBrowserUser,
    subscribeToAuthChanges,
} from './supabase-browser';

// Auth middleware
export { authMiddleware } from './middleware';

// Auth service layer
export {
    signUp,
    signIn,
    signOut,
    getCurrentUser,
    isAuthenticated,
    getUserProfile,
    updateUserProfile,
    type AuthResult,
    type SignUpParams,
    type SignInParams,
} from './service';

// Database types
export type {
    Database,
    ProfileRow,
    ProfileInsert,
    ProfileUpdate,
    SubscriptionRow,
    SubscriptionInsert,
    SubscriptionUpdate,
    WatchHistoryRow,
    WatchHistoryInsert,
    WatchHistoryUpdate,
} from './database.types';