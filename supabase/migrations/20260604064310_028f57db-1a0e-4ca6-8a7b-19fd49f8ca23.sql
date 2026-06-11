DELETE FROM public.notificacoes 
WHERE sender_id IS NULL 
   OR video_id IS NULL 
   OR sender_id NOT IN (SELECT id FROM public.profiles)
   OR video_id NOT IN (SELECT id FROM public.videos);