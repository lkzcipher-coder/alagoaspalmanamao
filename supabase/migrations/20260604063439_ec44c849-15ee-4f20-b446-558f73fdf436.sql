CREATE OR REPLACE FUNCTION public.notify_admins_on_video_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 AS $function$
DECLARE
    admin_id UUID;
    notification_content TEXT;
    notif_type TEXT;
    v_sender_id UUID;
    v_video_id UUID;
    v_source_id UUID;
BEGIN
    -- Definir o tipo e o conteúdo da notificação
    IF TG_TABLE_NAME = 'comentarios' THEN
        notification_content := NEW.content;
        notif_type := 'comment';
        v_sender_id := NEW.user_id;
        v_video_id := NEW.video_id;
        v_source_id := NEW.id;
    ELSIF TG_TABLE_NAME = 'video_likes' THEN
        notification_content := NULL;
        notif_type := 'like';
        v_sender_id := NEW.user_id;
        v_video_id := NEW.video_id;
        v_source_id := NEW.id;
    ELSE
        RETURN NEW;
    END IF;

    -- Notificar todos os admins
    FOR admin_id IN SELECT id FROM public.profiles WHERE role = 'admin' LOOP
        -- Inserir notificação para o admin
        INSERT INTO public.notificacoes (user_id, type, sender_id, video_id, content, source_id, read)
        VALUES (
            admin_id, 
            notif_type,
            v_sender_id,
            v_video_id,
            notification_content,
            v_source_id,
            false
        );
    END LOOP;
    
    RETURN NEW;
END;
$function$;

-- Garantir que as triggers estejam configuradas corretamente
DROP TRIGGER IF EXISTS on_video_like_notify ON public.video_likes;
CREATE TRIGGER on_video_like_notify
    AFTER INSERT ON public.video_likes
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_admins_on_video_activity();

DROP TRIGGER IF EXISTS on_video_comment_notify ON public.comentarios;
CREATE TRIGGER on_video_comment_notify
    AFTER INSERT ON public.comentarios
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_admins_on_video_activity();
