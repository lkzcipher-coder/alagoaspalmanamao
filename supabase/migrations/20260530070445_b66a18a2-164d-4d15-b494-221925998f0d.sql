
-- Fix 1: Remove overly permissive coupons policy
DROP POLICY IF EXISTS "Anyone can view coupons" ON public.coupons;

-- Fix 2: Remove broad profiles read policy
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- Fix 3: Lock down realtime.messages by enabling RLS without permissive policies
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;
