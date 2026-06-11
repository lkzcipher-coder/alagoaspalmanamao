-- Add email and full_name to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Create a function to handle new user creation and sync data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, role, is_premium, full_name, email)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'role', 'user'),
    false,
    new.raw_user_meta_data->>'name',
    new.email
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill existing profiles
-- This uses a subquery to get data from auth.users which is accessible to superuser during migration
UPDATE public.profiles p
SET 
  email = u.email,
  full_name = u.raw_user_meta_data->>'name'
FROM auth.users u
WHERE p.id = u.id;
