
ALTER PUBLICATION supabase_realtime DROP TABLE public.profiles;
ALTER PUBLICATION supabase_realtime DROP TABLE public.coupons;
ALTER PUBLICATION supabase_realtime DROP TABLE public.notificacoes;
ALTER PUBLICATION supabase_realtime DROP TABLE public.favoritos;
ALTER PUBLICATION supabase_realtime DROP TABLE public.user_favorites;

DROP POLICY IF EXISTS "Anyone can view video likes" ON public.video_likes;
CREATE POLICY "Authenticated users can view video likes"
  ON public.video_likes FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own payments" ON public.payments;
