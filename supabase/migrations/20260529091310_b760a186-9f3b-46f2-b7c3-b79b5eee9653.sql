
-- Fix 1: Remove broad public SELECT on profiles to stop exposing emails/role/is_premium
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Public can view profile basic info" ON public.profiles;

-- Allow authenticated users to view profile rows (needed for joins on comments/reviews).
-- Owner-full-row and admin-full-row policies remain in place. Anonymous users must use
-- the public_profiles view (which only exposes id/full_name/avatar_url).
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Fix 2: Block self-promotion of role/is_premium at the RLS layer (defense in depth on top of trigger).
CREATE OR REPLACE FUNCTION private.profile_self_update_allowed(_new_role text, _new_premium boolean)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = _new_role
      AND is_premium = _new_premium
  );
$$;

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND private.profile_self_update_allowed(role, is_premium)
);

-- Fix 3: Remove unrestricted SELECT on videos so the premium gate is the only SELECT policy
DROP POLICY IF EXISTS "Videos are viewable by everyone" ON public.videos;

-- Fix 4: Lock down SECURITY DEFINER trigger functions so they cannot be called via the API
REVOKE EXECUTE ON FUNCTION public.handle_video_like_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_video_comment_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_video_activity_deletion() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_admins_on_video_activity() FROM PUBLIC, anon, authenticated;
