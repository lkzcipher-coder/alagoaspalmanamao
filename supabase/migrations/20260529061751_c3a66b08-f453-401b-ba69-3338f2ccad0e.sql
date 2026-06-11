-- Grant SELECT permissions to anon and authenticated roles
GRANT SELECT ON public.partners TO anon, authenticated;
GRANT SELECT ON public.avaliacoes TO anon, authenticated;
GRANT SELECT ON public.videos TO anon, authenticated;
GRANT SELECT ON public.coupons TO anon, authenticated;
GRANT SELECT ON public.configuracoes_vip TO anon, authenticated;
GRANT SELECT ON public.configuracoes_gerais TO anon, authenticated;
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT SELECT ON public.favoritos TO anon, authenticated;

-- Also grant to service_role just in case
GRANT ALL ON public.partners TO service_role;
GRANT ALL ON public.avaliacoes TO service_role;
GRANT ALL ON public.videos TO service_role;
GRANT ALL ON public.coupons TO service_role;
GRANT ALL ON public.configuracoes_vip TO service_role;
GRANT ALL ON public.configuracoes_gerais TO service_role;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.favoritos TO service_role;

-- Ensure RLS policies are truly public for SELECT
DROP POLICY IF EXISTS "Partners are viewable by everyone" ON public.partners;
CREATE POLICY "Partners are viewable by everyone" ON public.partners 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view ratings" ON public.avaliacoes;
CREATE POLICY "Anyone can view ratings" ON public.avaliacoes 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Videos are viewable by everyone" ON public.videos;
CREATE POLICY "Videos are viewable by everyone" ON public.videos 
FOR SELECT USING (true);

-- Ensure public profiles are indeed public
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles 
FOR SELECT USING (true);
