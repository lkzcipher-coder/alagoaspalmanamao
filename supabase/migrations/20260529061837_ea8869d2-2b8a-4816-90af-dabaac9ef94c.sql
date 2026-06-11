-- Grant SELECT on the view specifically
GRANT SELECT ON public.partner_stats TO anon, authenticated;

-- Ensure all tables related to the Home view are accessible
GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT SELECT ON public.comentarios TO anon, authenticated;
GRANT SELECT ON public.video_likes TO anon, authenticated;
GRANT SELECT ON public.user_favorites TO anon, authenticated;

-- Make sure RLS is enabled but permissive for SELECT
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- Final check on policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public select partners') THEN
        CREATE POLICY "Public select partners" ON public.partners FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public select avaliacoes') THEN
        CREATE POLICY "Public select avaliacoes" ON public.avaliacoes FOR SELECT USING (true);
    END IF;
END $$;
