-- Migration: Add profiles table for Supabase Auth integration
-- This table extends Supabase Auth users with additional profile data.
-- The id column references auth.users.id via Supabase's built-in auth schema.

-- Create profiles table keyed by Supabase Auth user ID
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to automatically create profile on user signup
-- This requires the Supabase auth schema to be available
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists to avoid errors
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Update existing users table to use auth.users.id
-- Note: The existing 'users' table can be migrated to 'profiles' or kept for backward compatibility
-- For now, we keep both tables separate to avoid breaking existing code

-- Add comments for documentation
COMMENT ON TABLE profiles IS 'User profiles extending Supabase Auth users. The id references auth.users.id.';
COMMENT ON COLUMN profiles.id IS 'References auth.users.id from Supabase Auth.';
COMMENT ON COLUMN profiles.email IS 'User email, synced from auth.users.email.';
COMMENT ON COLUMN profiles.display_name IS 'User display name, can be set by user.';
COMMENT ON COLUMN profiles.avatar_url IS 'URL to user avatar image.';
