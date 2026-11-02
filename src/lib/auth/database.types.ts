/**
 * Supabase Database Types
 * 
 * These types describe the shape of your Supabase database.
 * They can be generated using: npx supabase gen types typescript --project-id your-project-id
 * 
 * For now, we provide a minimal type definition that works with auth.
 */

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    email: string | null
                    display_name: string | null
                    avatar_url: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email?: string | null
                    display_name?: string | null
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string | null
                    display_name?: string | null
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            subscriptions: {
                Row: {
                    id: string
                    user_id: string
                    tier: 'free' | 'premium' | 'vip'
                    status: 'active' | 'canceled' | 'expired'
                    started_at: string | null
                    ends_at: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    tier: 'free' | 'premium' | 'vip'
                    status: 'active' | 'canceled' | 'expired'
                    started_at?: string | null
                    ends_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    tier?: 'free' | 'premium' | 'vip'
                    status?: 'active' | 'canceled' | 'expired'
                    started_at?: string | null
                    ends_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            watch_history: {
                Row: {
                    id: string
                    user_id: string
                    drama_id: string
                    episode_id: string | null
                    progress_seconds: number
                    is_completed: boolean
                    last_watched_at: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    drama_id: string
                    episode_id?: string | null
                    progress_seconds?: number
                    is_completed?: boolean
                    last_watched_at?: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    drama_id?: string
                    episode_id?: string | null
                    progress_seconds?: number
                    is_completed?: boolean
                    last_watched_at?: string
                    created_at?: string
                    updated_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            subscription_tier: 'free' | 'premium' | 'vip'
            subscription_status: 'active' | 'canceled' | 'expired'
            report_status: 'open' | 'reviewing' | 'resolved' | 'rejected'
            provider_status: 'active' | 'maintenance' | 'disabled'
        }
    }
}

/**
 * Convenience type for the profiles table
 */
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

/**
 * Convenience type for the subscriptions table
 */
export type SubscriptionRow = Database['public']['Tables']['subscriptions']['Row'];
export type SubscriptionInsert = Database['public']['Tables']['subscriptions']['Insert'];
export type SubscriptionUpdate = Database['public']['Tables']['subscriptions']['Update'];

/**
 * Convenience type for the watch_history table
 */
export type WatchHistoryRow = Database['public']['Tables']['watch_history']['Row'];
export type WatchHistoryInsert = Database['public']['Tables']['watch_history']['Insert'];
export type WatchHistoryUpdate = Database['public']['Tables']['watch_history']['Update'];
