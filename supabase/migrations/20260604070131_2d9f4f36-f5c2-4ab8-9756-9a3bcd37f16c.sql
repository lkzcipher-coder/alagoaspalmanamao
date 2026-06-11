CREATE OR REPLACE FUNCTION public.notify_admins_on_video_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 AS $function$
DECLARE
    admin_record RECORD;
    notification_content TEXT;
    notif_type TEXT;
    v_sender_id UUID;
    v_video_id UUID;
    v_source_id UUID;
    v_count INTEGER := 0;
BEGIN
    -- Log de início da trigger
    RAISE NOTICE 'Trigger notify_admins_on_video_activity iniciada para tabela %', TG_TABLE_NAME;

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
        RAISE WARNING 'Tabela desconhecida na trigger: %', TG_TABLE_NAME;
        RETURN NEW;
    END IF;

    -- Notificar todos os admins
    FOR admin_record IN SELECT id, email FROM public.profiles WHERE role = 'admin' LOOP
        BEGIN
            -- Inserir notificação para o admin
            INSERT INTO public.notificacoes (user_id, type, sender_id, video_id, content, source_id, read)
            VALUES (
                admin_record.id, 
                notif_type,
                v_sender_id,
                v_video_id,
                notification_content,
                v_source_id,
                false
            );
            v_count := v_count + 1;
            RAISE NOTICE 'Notificação % criada com sucesso para admin: % (%)', notif_type, admin_record.id, admin_record.email;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Erro ao criar notificação para admin %: %', admin_record.id, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Total de notificações criadas: %', v_count;
    
    RETURN NEW;
END;
$function$;