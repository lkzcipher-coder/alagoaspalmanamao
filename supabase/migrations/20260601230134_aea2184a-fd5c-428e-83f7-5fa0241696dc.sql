-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Coupons visibility" ON public.coupons;

-- Create a new policy that allows everyone to see coupons
-- This is necessary so tourists can see VIP coupons in the list (as locked items)
CREATE POLICY "Coupons are viewable by everyone" 
ON public.coupons 
FOR SELECT 
USING (true);

-- Ensure correct grants
GRANT SELECT ON public.coupons TO anon, authenticated;
