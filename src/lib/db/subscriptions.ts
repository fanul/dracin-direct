import type { Subscription } from '../types';
import { getSupabaseClient } from './client';

export async function checkEntitlement(
  userId: string,
  dramaId: string,
  providerSlug?: string
): Promise<{ allowed: boolean; reason?: string }> {
  const supabase = getSupabaseClient();

  let { data: drama } = await supabase
    .from('dramas')
    .select('is_premium')
    .eq('id', dramaId)
    .single();

  if (!drama && providerSlug) {
    const { data: dramaByProviderId } = await supabase
      .from('dramas')
      .select('is_premium')
      .eq('provider_slug', providerSlug)
      .eq('provider_drama_id', dramaId)
      .single();

    drama = dramaByProviderId;
  }

  if (!drama) {
    return { allowed: false, reason: 'Drama not found' };
  }

  if (!drama.is_premium) {
    return { allowed: true };
  }

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (!subscription) {
    return { allowed: false, reason: 'Premium content requires subscription' };
  }

  const now = new Date();
  const endsAt = new Date(subscription.ends_at);

  if (endsAt < now) {
    return { allowed: false, reason: 'Subscription expired' };
  }

  return { allowed: true };
}

export async function getActiveSubscription(userId: string): Promise<Subscription | null> {
  const supabase = getSupabaseClient();

  const { data } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  return data;
}
