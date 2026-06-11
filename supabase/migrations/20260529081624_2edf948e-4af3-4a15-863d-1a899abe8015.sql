-- Corrigir a função de notificação para lidar corretamente com diferentes tabelas (curtidas vs comentários)
CREATE OR REPLACE FUNCTION public.notify_admins_on_video_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    admin_id UUID;
    notification_content TEXT;
    notif_type TEXT;
BEGIN
    -- Definir o tipo e o conteúdo da notificação de forma segura
    IF TG_TABLE_NAME = 'comentarios' THEN
        notification_content := NEW.content;
        notif_type := 'comment';
    ELSE
        notification_content := NULL;
        notif_type := 'like';
    END IF;

    -- Notificar todos os admins
    FOR admin_id IN SELECT id FROM public.profiles WHERE role = 'admin' LOOP
        -- Verificar se o destinatário existe para evitar erros de FK
        IF EXISTS (SELECT 1 FROM public.profiles WHERE id = admin_id) THEN
            INSERT INTO public.notificacoes (user_id, type, sender_id, video_id, content, source_id)
            VALUES (
                admin_id, 
                notif_type,
                NEW.user_id,
                NEW.video_id,
                notification_content,
                NEW.id
            );
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$function$;

-- Re-garantir permissões
GRANT EXECUTE ON FUNCTION public.notify_admins_on_video_activity() TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_admins_on_video_activity() TO anon;
GRANT EXECUTE ON FUNCTION public.notify_admins_on_video_activity() TO service_role;
