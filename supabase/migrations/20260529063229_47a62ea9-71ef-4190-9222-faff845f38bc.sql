-- Add missing foreign keys to public.profiles for better PostgREST joins
ALTER TABLE public.avaliacoes
DROP CONSTRAINT IF EXISTS avaliacoes_usuario_id_fkey,
ADD CONSTRAINT avaliacoes_usuario_id_fkey 
FOREIGN KEY (usuario_id) 
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- Ensure video_likes also points to public.profiles if needed for joins (though currently not used for profiles)
ALTER TABLE public.video_likes
DROP CONSTRAINT IF EXISTS video_likes_user_id_fkey,
ADD CONSTRAINT video_likes_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- Grant permissions just in case
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT SELECT ON public.avaliacoes TO anon, authenticated;
