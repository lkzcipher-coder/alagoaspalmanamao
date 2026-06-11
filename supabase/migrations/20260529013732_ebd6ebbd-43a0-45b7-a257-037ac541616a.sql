-- Fix search_path for public functions to prevent potential search_path injection
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.handle_video_comment_change() SET search_path = public;
ALTER FUNCTION public.prevent_profile_privilege_escalation() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.is_admin() SET search_path = public;
ALTER FUNCTION public.handle_video_like_change() SET search_path = public;

-- Ensure critical functions are SECURITY DEFINER if they need to bypass RLS, but with fixed search_path
-- update_updated_at_column is often SECURITY DEFINER to allow updates even if user can't update that column directly
-- handle_new_user is SECURITY DEFINER because it's called by auth hook

-- Reviewing storage policies for public buckets
-- WARN: Public Bucket Allows Listing
-- We should ensure SELECT policies on storage.objects are specific.

-- For 'imagens' bucket, if it's public, everyone should be able to see the files, 
-- but maybe not list the entire bucket if that was the concern.
-- However, for public assets, listing is often intentionally allowed or a byproduct of "public: true".
-- Let's check existing policies first.
