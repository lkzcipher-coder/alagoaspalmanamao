-- Inserir notificações faltantes para todos os administradores baseando-se nos comentários existentes
INSERT INTO public.notificacoes (user_id, type, sender_id, video_id, content, source_id, read, created_at)
SELECT 
    p.id as user_id,
    'comment' as type,
    c.user_id as sender_id,
    c.video_id as video_id,
    c.content as content,
    c.id as source_id,
    false as read,
    c.created_at as created_at
FROM public.profiles p
CROSS JOIN public.comentarios c
WHERE p.role = 'admin'
AND NOT EXISTS (
    SELECT 1 FROM public.notificacoes n 
    WHERE n.user_id = p.id AND n.source_id = c.id AND n.type = 'comment'
);

-- Inserir notificações faltantes para todos os administradores baseando-se nas curtidas existentes
INSERT INTO public.notificacoes (user_id, type, sender_id, video_id, source_id, read, created_at)
SELECT 
    p.id as user_id,
    'like' as type,
    vl.user_id as sender_id,
    vl.video_id as video_id,
    vl.id as source_id,
    false as read,
    vl.created_at as created_at
FROM public.profiles p
CROSS JOIN public.video_likes vl
WHERE p.role = 'admin'
AND NOT EXISTS (
    SELECT 1 FROM public.notificacoes n 
    WHERE n.user_id = p.id AND n.source_id = vl.id AND n.type = 'like'
);

-- Garantir que não existam notificações órfãs (sem remetente ou sem vídeo)
DELETE FROM public.notificacoes 
WHERE sender_id IS NULL 
   OR video_id IS NULL 
   OR sender_id NOT IN (SELECT id FROM public.profiles)
   OR video_id NOT IN (SELECT id FROM public.videos);