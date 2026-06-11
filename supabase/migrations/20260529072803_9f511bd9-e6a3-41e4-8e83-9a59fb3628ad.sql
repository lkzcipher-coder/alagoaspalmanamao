-- Adicionar source_id na tabela de notificações
ALTER TABLE public.notificacoes ADD COLUMN source_id UUID;

-- Atualizar função de notificação para incluir o source_id
CREATE OR REPLACE FUNCTION public.notify_admins_on_video_activity()
RETURNS TRIGGER AS $$
DECLARE
    admin_id UUID;
BEGIN
    -- Notificar todos os admins
    FOR admin_id IN SELECT id FROM public.profiles WHERE role = 'admin' LOOP
        INSERT INTO public.notificacoes (user_id, type, sender_id, video_id, content, source_id)
        VALUES (
            admin_id, 
            CASE WHEN TG_TABLE_NAME = 'video_likes' THEN 'like' ELSE 'comment' END,
            NEW.user_id,
            NEW.video_id,
            CASE WHEN TG_TABLE_NAME = 'comentarios' THEN NEW.content ELSE NULL END,
            NEW.id
        );
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
