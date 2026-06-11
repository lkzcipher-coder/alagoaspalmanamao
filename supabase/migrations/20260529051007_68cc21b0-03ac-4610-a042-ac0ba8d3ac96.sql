-- Remove the permissive SELECT that exposed emails
DROP POLICY IF EXISTS "Public can view minimal profile data" ON public.profiles;

-- Recreate view as SECURITY DEFINER so it can read profiles without granting
-- public SELECT on the full table
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles AS
SELECT id, full_name, avatar_url FROM public.profiles;

-- View runs with definer's perms; grant SELECT on the view itself
GRANT SELECT ON public.public_profiles TO anon, authenticated;
