-- Alterar a chave estrangeira de user_id para apontar para public.profiles
ALTER TABLE public.comentarios 
DROP CONSTRAINT IF EXISTS video_comments_user_id_fkey;

ALTER TABLE public.comentarios
ADD CONSTRAINT video_comments_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id)
ON DELETE CASCADE;
