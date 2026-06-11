-- Add is_premium column to tide_destinations
ALTER TABLE public.tide_destinations ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;

-- Ensure RLS is enabled
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tide_destinations ENABLE ROW LEVEL SECURITY;

-- Drop existing SELECT policies to recreate them cleanly
DROP POLICY IF EXISTS "Coupons visible to public or VIP users" ON public.coupons;
DROP POLICY IF EXISTS "Videos visible to public or VIP users" ON public.videos;
DROP POLICY IF EXISTS "Destinations are viewable by everyone" ON public.tide_destinations;

-- Recreate SELECT policies with explicit premium check
-- For Coupons: Visible if (item is not premium) OR (user is authenticated AND (user is premium OR user is admin))
CREATE POLICY "Coupons visibility" ON public.coupons
FOR SELECT USING (
  is_premium = false OR (
    auth.uid() IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND (is_premium = true OR role = 'admin')
      )
    )
  )
);

-- For Videos (Offers): Same logic
CREATE POLICY "Videos visibility" ON public.videos
FOR SELECT USING (
  is_premium = false OR (
    auth.uid() IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND (is_premium = true OR role = 'admin')
      )
    )
  )
);

-- For Tide Destinations: Same logic
CREATE POLICY "Tide destinations visibility" ON public.tide_destinations
FOR SELECT USING (
  is_premium = false OR (
    auth.uid() IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND (is_premium = true OR role = 'admin')
      )
    )
  )
);

-- Grants
GRANT SELECT ON public.tide_destinations TO anon, authenticated;
GRANT SELECT ON public.coupons TO anon, authenticated;
GRANT SELECT ON public.videos TO anon, authenticated;
