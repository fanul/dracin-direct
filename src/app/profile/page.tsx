import { redirect } from 'next/navigation';
import { getServerUser, getUserProfile } from '@/lib/auth';
import ProfileClient from './ProfileClient';

/**
 * Profile Page (Server Component)
 * 
 * Protected route - redirects to login if not authenticated.
 */
export default async function ProfilePage() {
  const user = await getServerUser();

  if (!user) {
    redirect('/login');
  }

  // Get user profile from database
  const profile = await getUserProfile(user.id);

  return (
    <ProfileClient
      user={{
        id: user.id,
        email: user.email || null,
        displayName: profile?.display_name || null,
        avatarUrl: profile?.avatar_url || null,
      }}
    />
  );
}
