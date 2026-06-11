-- Remover notificações de comentários que não existem mais
DELETE FROM public.notificacoes 
WHERE type = 'comment' 
AND source_id NOT IN (SELECT id FROM public.comentarios);

-- Também remover notificações de curtidas que não existem mais (por precaução)
DELETE FROM public.notificacoes 
WHERE type = 'like' 
AND source_id NOT IN (SELECT id FROM public.video_likes);
