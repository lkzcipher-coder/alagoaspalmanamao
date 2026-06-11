-- Check if the publication already exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

-- Add all relevant tables to the publication
-- This ensures that any change to these tables will be broadcast to subscribed clients
ALTER PUBLICATION supabase_realtime ADD TABLE public.partners;
ALTER PUBLICATION supabase_realtime ADD TABLE public.videos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notificacoes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.avaliacoes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comentarios;
ALTER PUBLICATION supabase_realtime ADD TABLE public.coupons;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.video_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.favoritos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.configuracoes_vip;
ALTER PUBLICATION supabase_realtime ADD TABLE public.configuracoes_gerais;
