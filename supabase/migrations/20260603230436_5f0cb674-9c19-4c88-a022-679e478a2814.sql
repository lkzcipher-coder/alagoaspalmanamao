
-- Coupons: gate premium rows behind VIP/admin
DROP POLICY IF EXISTS "Coupons are viewable by everyone" ON public.coupons;
CREATE POLICY "Coupons visible based on premium status"
ON public.coupons FOR SELECT
USING (
  is_premium = false
  OR (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND (profiles.is_premium = true OR profiles.role = 'admin')
    )
  )
);

-- Videos: gate premium rows behind VIP/admin
DROP POLICY IF EXISTS "Videos are viewable by everyone" ON public.videos;
CREATE POLICY "Videos visible based on premium status"
ON public.videos FOR SELECT
USING (
  is_premium = false
  OR (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND (profiles.is_premium = true OR profiles.role = 'admin')
    )
  )
);

-- Payments: only admins may insert/update/delete; users only read their own
CREATE POLICY "Only admins can insert payments"
ON public.payments FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Only admins can update payments"
ON public.payments FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Only admins can delete payments"
ON public.payments FOR DELETE
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
