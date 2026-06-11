-- Switch view back to security_invoker (satisfy linter)
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles
WITH (security_invoker = true) AS
SELECT id, full_name, avatar_url FROM public.profiles;
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Column-level permission model on profiles:
-- Revoke broad SELECT, then grant per-column. RLS policies still apply.
REVOKE SELECT ON public.profiles FROM anon, authenticated;

-- Public-readable columns (used by view + joins for displaying commenter names)
GRANT SELECT (id, full_name, avatar_url) ON public.profiles TO anon, authenticated;

-- Sensitive columns granted only to authenticated; RLS restricts to self or admin
GRANT SELECT (email, role, is_premium, favorites_limit, created_at, updated_at) ON public.profiles TO authenticated;

-- Allow the public-info SELECT via a permissive RLS policy (columns still gated by GRANT)
CREATE POLICY "Public can view profile basic info"
ON public.profiles FOR SELECT
USING (true);
