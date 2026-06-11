-- 1. Update RLS policy for video_secrets to allow everyone to see NON-PREMIUM video URLs
DROP POLICY IF EXISTS "Secrets viewable by VIPs and admins" ON public.video_secrets;

CREATE POLICY "Video secrets viewable by everyone if not premium"
ON public.video_secrets FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.videos
    WHERE videos.id = video_secrets.video_id
    AND videos.is_premium = false
  )
  OR (
    auth.uid() IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND (profiles.is_premium = true OR profiles.role = 'admin')
      )
    )
  )
);

-- 2. Update RLS policy for coupon_secrets to allow everyone to see NON-PREMIUM coupon codes
DROP POLICY IF EXISTS "Secrets viewable by VIPs and admins" ON public.coupon_secrets;

CREATE POLICY "Coupon secrets viewable by everyone if not premium"
ON public.coupon_secrets FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.coupons
    WHERE coupons.id = coupon_secrets.coupon_id
    AND coupons.is_premium = false
  )
  OR (
    auth.uid() IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND (profiles.is_premium = true OR profiles.role = 'admin')
      )
    )
  )
);

-- 3. Update the helper functions to also allow non-premium content
CREATE OR REPLACE FUNCTION public.get_coupon_code(target_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.coupons 
    WHERE id = target_id AND is_premium = false
  ) OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.is_premium = true OR profiles.role = 'admin')
  ) THEN
    RETURN (SELECT code FROM public.coupon_secrets WHERE coupon_id = target_id);
  ELSE
    RETURN NULL;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_video_url(target_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.videos 
    WHERE id = target_id AND is_premium = false
  ) OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.is_premium = true OR profiles.role = 'admin')
  ) THEN
    RETURN (SELECT url FROM public.video_secrets WHERE video_id = target_id);
  ELSE
    RETURN NULL;
  END IF;
END;
$$;
