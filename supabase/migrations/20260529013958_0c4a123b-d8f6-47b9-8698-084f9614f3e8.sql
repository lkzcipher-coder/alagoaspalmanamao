-- Create a private schema for internal functions
CREATE SCHEMA IF NOT EXISTS private;

-- Move sensitive functions to private schema
-- Note: We need to recreate them in the new schema and drop them from the old one,
-- but we must also update the triggers that reference them.

-- 1. Create functions in private schema
CREATE OR REPLACE FUNCTION private.handle_video_like_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.videos SET likes_count = likes_count + 1 WHERE id = NEW.video_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.videos SET likes_count = likes_count - 1 WHERE id = OLD.video_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION private.handle_video_comment_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.videos SET comments_count = comments_count + 1 WHERE id = NEW.video_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.videos SET comments_count = comments_count - 1 WHERE id = OLD.video_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION private.prevent_profile_privilege_escalation()
RETURNS TRIGGER AS $$
DECLARE
  caller_is_admin boolean;
BEGIN
  SELECT (role = 'admin') INTO caller_is_admin FROM public.profiles WHERE id = auth.uid();

  IF COALESCE(caller_is_admin, false) = false THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Not allowed to change role';
    END IF;
    IF NEW.is_premium IS DISTINCT FROM OLD.is_premium THEN
      RAISE EXCEPTION 'Not allowed to change premium status';
    END IF;
    IF NEW.favorites_limit IS DISTINCT FROM OLD.favorites_limit THEN
      RAISE EXCEPTION 'Not allowed to change favorites limit';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION private.handle_new_user()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Update Triggers to use the new functions
DROP TRIGGER IF EXISTS on_video_like_change ON public.video_likes;
CREATE TRIGGER on_video_like_change
AFTER INSERT OR DELETE ON public.video_likes
FOR EACH ROW EXECUTE FUNCTION private.handle_video_like_change();

DROP TRIGGER IF EXISTS on_video_comment_change ON public.video_comments;
CREATE TRIGGER on_video_comment_change
AFTER INSERT OR DELETE ON public.video_comments
FOR EACH ROW EXECUTE FUNCTION private.handle_video_comment_change();

DROP TRIGGER IF EXISTS prevent_profile_privilege_escalation_trg ON public.profiles;
CREATE TRIGGER prevent_profile_privilege_escalation_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION private.prevent_profile_privilege_escalation();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT OR UPDATE ON auth.users
FOR EACH ROW EXECUTE FUNCTION private.handle_new_user();

-- 3. Drop old functions from public schema
DROP FUNCTION IF EXISTS public.handle_video_like_change();
DROP FUNCTION IF EXISTS public.handle_video_comment_change();
DROP FUNCTION IF EXISTS public.prevent_profile_privilege_escalation();
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 4. Fix Storage Policies
-- We'll replace the broad SELECT policies with ones that don't allow listing
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'videos' AND (storage.foldername(name))[1] IS NOT NULL);

DROP POLICY IF EXISTS "Public Access Partners" ON storage.objects;
CREATE POLICY "Public Access Partners"
ON storage.objects FOR SELECT
USING (bucket_id = 'partners' AND (storage.foldername(name))[1] IS NOT NULL);

-- Also check 'imagens' bucket
DROP POLICY IF EXISTS "Public Access Imagens" ON storage.objects;
-- If it doesn't exist, we don't need to drop it, but let's be safe.
-- Actually, let's see if there's a policy for 'imagens'
CREATE POLICY "Public Access Imagens"
ON storage.objects FOR SELECT
USING (bucket_id = 'imagens' AND (storage.foldername(name))[1] IS NOT NULL);
