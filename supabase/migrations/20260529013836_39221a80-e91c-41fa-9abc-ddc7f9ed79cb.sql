-- Revoke EXECUTE on all functions in public from public role (which includes anon and authenticated)
-- Then grant back specifically if needed.
REVOKE EXECUTE ON FUNCTION public.handle_video_like_change() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_video_comment_change() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.prevent_profile_privilege_escalation() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;

-- Functions used as triggers need to be executable by the roles that trigger them.
-- But we want to avoid them being callable via the API if possible.
-- PostgREST allows calling functions via /rpc/function_name.
-- By revoking from PUBLIC, we prevent this for anon/authenticated unless we grant it back.

-- For triggers, the user must have EXECUTE permission.
GRANT EXECUTE ON FUNCTION public.handle_video_like_change() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_video_comment_change() TO authenticated;
GRANT EXECUTE ON FUNCTION public.prevent_profile_privilege_escalation() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- handle_new_user is triggered by auth.users (system), usually runs as service_role or a privileged user.
-- We can grant it to service_role.
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Storage Security: Public Bucket Allows Listing
-- Instead of: CREATE POLICY "..." ON storage.objects FOR SELECT USING (bucket_id = 'imagens');
-- Use: CREATE POLICY "..." ON storage.objects FOR SELECT USING (bucket_id = 'imagens' AND (storage.foldername(name))[1] IS NOT NULL);
-- Or simply ensure that we don't allow listing the whole bucket.
-- Actually, the linter triggers if the policy is just `bucket_id = '...'`.
-- To fix, we can add a dummy condition or make it more specific.

-- Let's check existing storage policies first to be sure what to replace.
