-- Limpar funções duplicadas para evitar conflitos
DROP FUNCTION IF EXISTS private.handle_video_like_change();
DROP FUNCTION IF EXISTS private.handle_video_comment_change();

-- Corrigir função de atualização de curtidas
CREATE OR REPLACE FUNCTION public.handle_video_like_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.videos
        SET likes_count = COALESCE(likes_count, 0) + 1
        WHERE id = NEW.video_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.videos
        SET likes_count = GREATEST(0, COALESCE(likes_count, 0) - 1)
        WHERE id = OLD.video_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Corrigir função de atualização de comentários
CREATE OR REPLACE FUNCTION public.handle_video_comment_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.videos
        SET comments_count = COALESCE(comments_count, 0) + 1
        WHERE id = NEW.video_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.videos
        SET comments_count = GREATEST(0, COALESCE(comments_count, 0) - 1)
        WHERE id = OLD.video_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Corrigir função de notificações para administradores
CREATE OR REPLACE FUNCTION public.notify_admins_on_video_activity()
RETURNS TRIGGER AS $$
DECLARE
    admin_id UUID;
BEGIN
    -- Notificar todos os admins
    FOR admin_id IN SELECT id FROM public.profiles WHERE role = 'admin' LOOP
        -- Verificar se o destinatário existe para evitar erros de FK
        IF EXISTS (SELECT 1 FROM public.profiles WHERE id = admin_id) THEN
            INSERT INTO public.notificacoes (user_id, type, sender_id, video_id, content, source_id)
            VALUES (
                admin_id, 
                CASE WHEN TG_TABLE_NAME = 'video_likes' THEN 'like' ELSE 'comment' END,
                NEW.user_id,
                NEW.video_id,
                CASE WHEN TG_TABLE_NAME = 'comentarios' THEN NEW.content ELSE NULL END,
                NEW.id
            );
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
