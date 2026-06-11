-- Enable extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create secret tables to hold the "benefit" data
CREATE TABLE public.coupon_secrets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE UNIQUE,
    code TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.video_secrets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE UNIQUE,
    url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Migrate existing data
INSERT INTO public.coupon_secrets (coupon_id, code)
SELECT id, code FROM public.coupons WHERE code IS NOT NULL
ON CONFLICT (coupon_id) DO UPDATE SET code = EXCLUDED.code;

INSERT INTO public.video_secrets (video_id, url)
SELECT id, url FROM public.videos WHERE url IS NOT NULL
ON CONFLICT (video_id) DO UPDATE SET url = EXCLUDED.url;

-- 3. Remove sensitive data from main tables (to be replaced by NULLs or empty strings for public view)
-- We keep the columns for now to avoid breaking existing queries, but we will NULL them out for non-privileged users via RLS if possible, 
-- but since RLS is row-level, we'll actually rely on the app to fetch from secrets or we can use a View.
-- Actually, the cleanest is to keep the columns but NULL them for everyone and use the secrets table for privileged access.

ALTER TABLE public.coupons ALTER COLUMN code DROP NOT NULL;
ALTER TABLE public.videos ALTER COLUMN url DROP NOT NULL;

UPDATE public.coupons SET code = NULL;
UPDATE public.videos SET url = NULL;

-- 4. Set up RLS for main tables (Public visibility)
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coupons visible based on premium status" ON public.coupons;
CREATE POLICY "Coupons are viewable by everyone" ON public.coupons FOR SELECT USING (true);

DROP POLICY IF EXISTS "Videos visible based on premium status" ON public.videos;
CREATE POLICY "Videos are viewable by everyone" ON public.videos FOR SELECT USING (true);

-- 5. Set up RLS for secrets (VIP only)
ALTER TABLE public.coupon_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_secrets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Secrets viewable by VIPs and admins"
ON public.coupon_secrets FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.is_premium = true OR profiles.role = 'admin')
    )
  )
);

CREATE POLICY "Secrets viewable by VIPs and admins"
ON public.video_secrets FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.is_premium = true OR profiles.role = 'admin')
    )
  )
);

-- Allow service_role and authenticated to interact with secrets
GRANT ALL ON public.coupon_secrets TO service_role;
GRANT SELECT ON public.coupon_secrets TO authenticated;

GRANT ALL ON public.video_secrets TO service_role;
GRANT SELECT ON public.video_secrets TO authenticated;

-- 6. Helper function to fetch secrets easily
CREATE OR REPLACE FUNCTION public.get_coupon_code(target_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
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

-- 7. Add triggers to handle Insert/Update/Delete of main tables and keep secrets in sync (optional but good for data integrity)
-- However, we'll handle this in the app logic for now to keep it simple.
