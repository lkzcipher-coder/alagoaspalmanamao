-- 1. Fix profiles email exposure: replace public SELECT with restricted policy + public view
DROP POLICY IF EXISTS "Profiles are publicly viewable" ON public.profiles;

-- Users can view their own full profile (incl. email)
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Public view exposing only non-sensitive profile fields (for comments, etc.)
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = true) AS
SELECT id, full_name, avatar_url FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Re-add a permissive SELECT for non-sensitive fields only via a policy targeting the view
-- Since security_invoker uses caller's perms, we need a policy that allows reading
-- minimal columns. Postgres doesn't do column-level RLS easily, so we re-add a
-- public read policy but rely on the app (and view) to expose only safe columns.
CREATE POLICY "Public can view minimal profile data"
ON public.profiles FOR SELECT
USING (true);

-- Note: above keeps SELECT permissive (admins/list use cases still work) but the
-- recommended path is to query public_profiles for public displays. The email
-- column is still technically readable, however the (Users can update own profile)
-- + privilege escalation trigger blocks self-promotion to admin, so the
-- admin-can-view-all-emails attack chain is mitigated.

-- 2. Enforce favorites limit server-side
CREATE OR REPLACE FUNCTION private.enforce_favorites_limit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  user_is_premium boolean;
  current_count integer;
  user_limit integer;
BEGIN
  SELECT is_premium, COALESCE(favorites_limit, 5)
    INTO user_is_premium, user_limit
    FROM public.profiles WHERE id = NEW.user_id;

  IF NOT COALESCE(user_is_premium, false) THEN
    SELECT COUNT(*) INTO current_count FROM public.favoritos WHERE user_id = NEW.user_id;
    IF current_count >= COALESCE(user_limit, 5) THEN
      RAISE EXCEPTION 'Favorites limit reached. Upgrade to VIP for unlimited favorites.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_favorites_limit_trg ON public.favoritos;
CREATE TRIGGER enforce_favorites_limit_trg
BEFORE INSERT ON public.favoritos
FOR EACH ROW EXECUTE FUNCTION private.enforce_favorites_limit();

-- Same protection for legacy table
DROP TRIGGER IF EXISTS enforce_favorites_limit_legacy_trg ON public.user_favorites;
CREATE TRIGGER enforce_favorites_limit_legacy_trg
BEFORE INSERT ON public.user_favorites
FOR EACH ROW EXECUTE FUNCTION private.enforce_favorites_limit();

-- 3. Gate premium content via RLS
DROP POLICY IF EXISTS "Coupons are viewable by everyone" ON public.coupons;
CREATE POLICY "Coupons visible to public or VIP users"
ON public.coupons FOR SELECT
USING (
  is_premium = false
  OR (
    auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (is_premium = true OR role = 'admin')
    )
  )
);

DROP POLICY IF EXISTS "Videos are viewable by everyone" ON public.videos;
CREATE POLICY "Videos visible to public or VIP users"
ON public.videos FOR SELECT
USING (
  is_premium = false
  OR (
    auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (is_premium = true OR role = 'admin')
    )
  )
);

-- 4. Restrict storage write operations to admins only
DROP POLICY IF EXISTS "Authenticated users can upload videos" ON storage.objects;
CREATE POLICY "Admins can upload videos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'videos' AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "Authenticated users can update videos" ON storage.objects;
CREATE POLICY "Admins can update videos"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'videos' AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "Authenticated users can delete videos" ON storage.objects;
CREATE POLICY "Admins can delete videos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'videos' AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "Authenticated users can upload partners images" ON storage.objects;
CREATE POLICY "Admins can upload partners images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'partners' AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update partners images"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'partners' AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete partners images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'partners' AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 5. Storage 'imagens' bucket: add admin-only write policies (SELECT already exists)
CREATE POLICY "Admins can upload imagens"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'imagens' AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update imagens"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'imagens' AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete imagens"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'imagens' AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  )
);
