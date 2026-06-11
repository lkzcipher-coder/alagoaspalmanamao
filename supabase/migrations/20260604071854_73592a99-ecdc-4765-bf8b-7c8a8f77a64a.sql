-- 1. Atualizar a restrição de tipos na tabela notificacoes
ALTER TABLE public.notificacoes DROP CONSTRAINT IF EXISTS notificacoes_type_check;
ALTER TABLE public.notificacoes ADD CONSTRAINT notificacoes_type_check CHECK (type = ANY (ARRAY['like'::text, 'comment'::text, 'review'::text, 'new_user'::text]));

-- 2. Garantir coluna source_id
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notificacoes' AND column_name = 'source_id') THEN
        ALTER TABLE public.notificacoes ADD COLUMN source_id UUID;
    END IF;
END $$;

-- 3. Função robusta para notificar administradores
CREATE OR REPLACE FUNCTION public.notify_all_admins(
    p_type TEXT,
    p_sender_id UUID,
    p_video_id UUID DEFAULT NULL,
    p_content TEXT DEFAULT NULL,
    p_source_id UUID DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    admin_record RECORD;
BEGIN
    FOR admin_record IN SELECT id FROM public.profiles WHERE role = 'admin' LOOP
        -- Verifica se já existe uma notificação idêntica para evitar spam/duplicatas
        IF NOT EXISTS (
            SELECT 1 FROM public.notificacoes 
            WHERE user_id = admin_record.id 
            AND type = p_type 
            AND (
                (source_id IS NOT NULL AND source_id = p_source_id) OR 
                (source_id IS NULL AND sender_id = p_sender_id AND type = 'new_user')
            )
        ) THEN
            INSERT INTO public.notificacoes (user_id, type, sender_id, video_id, content, source_id, read)
            VALUES (admin_record.id, p_type, p_sender_id, p_video_id, p_content, p_source_id, false);
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Gatilhos para Curtidas e Comentários
CREATE OR REPLACE FUNCTION public.handle_video_activity_trigger() RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'comentarios' THEN
        PERFORM public.notify_all_admins('comment', NEW.user_id, NEW.video_id, NEW.content, NEW.id);
    ELSIF TG_TABLE_NAME = 'video_likes' THEN
        PERFORM public.notify_all_admins('like', NEW.user_id, NEW.video_id, NULL, NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_video_comment_notify ON public.comentarios;
CREATE TRIGGER on_video_comment_notify AFTER INSERT ON public.comentarios FOR EACH ROW EXECUTE FUNCTION public.handle_video_activity_trigger();

DROP TRIGGER IF EXISTS on_video_like_notify ON public.video_likes;
CREATE TRIGGER on_video_like_notify AFTER INSERT ON public.video_likes FOR EACH ROW EXECUTE FUNCTION public.handle_video_activity_trigger();

-- 5. Gatilho para Avaliações (Reviews)
CREATE OR REPLACE FUNCTION public.handle_review_notify_trigger() RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.notify_all_admins('review', NEW.usuario_id, NULL, NEW.comentario, NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_review_notify ON public.avaliacoes;
CREATE TRIGGER on_review_notify AFTER INSERT ON public.avaliacoes FOR EACH ROW EXECUTE FUNCTION public.handle_review_notify_trigger();

-- 6. Gatilho para Novos Usuários
CREATE OR REPLACE FUNCTION public.handle_new_user_notify_trigger() RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.notify_all_admins('new_user', NEW.id, NULL, 'Novo usuário cadastrado', NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_user_notify ON public.profiles;
CREATE TRIGGER on_new_user_notify AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_notify_trigger();

-- 7. Gatilho para Limpeza Automática quando o item original é deletado
CREATE OR REPLACE FUNCTION public.handle_activity_deletion_trigger() RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.notificacoes WHERE source_id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_video_comment_delete ON public.comentarios;
CREATE TRIGGER on_video_comment_delete AFTER DELETE ON public.comentarios FOR EACH ROW EXECUTE FUNCTION public.handle_activity_deletion_trigger();

DROP TRIGGER IF EXISTS on_video_like_delete ON public.video_likes;
CREATE TRIGGER on_video_like_delete AFTER DELETE ON public.video_likes FOR EACH ROW EXECUTE FUNCTION public.handle_activity_deletion_trigger();

DROP TRIGGER IF EXISTS on_review_delete ON public.avaliacoes;
CREATE TRIGGER on_review_delete AFTER DELETE ON public.avaliacoes FOR EACH ROW EXECUTE FUNCTION public.handle_activity_deletion_trigger();

-- 8. Sincronização Retroativa de Dados
DO $$
DECLARE
    admin_rec RECORD;
    item_rec RECORD;
BEGIN
    FOR admin_rec IN SELECT id FROM public.profiles WHERE role = 'admin' LOOP
        -- Sincronizar Likes existentes
        FOR item_rec IN SELECT * FROM public.video_likes LOOP
            IF NOT EXISTS (SELECT 1 FROM public.notificacoes WHERE user_id = admin_rec.id AND source_id = item_rec.id) THEN
                INSERT INTO public.notificacoes (user_id, type, sender_id, video_id, source_id, read, created_at)
                VALUES (admin_rec.id, 'like', item_rec.user_id, item_rec.video_id, item_rec.id, false, item_rec.created_at);
            END IF;
        END LOOP;

        -- Sincronizar Comentários existentes
        FOR item_rec IN SELECT * FROM public.comentarios LOOP
            IF NOT EXISTS (SELECT 1 FROM public.notificacoes WHERE user_id = admin_rec.id AND source_id = item_rec.id) THEN
                INSERT INTO public.notificacoes (user_id, type, sender_id, video_id, content, source_id, read, created_at)
                VALUES (admin_rec.id, 'comment', item_rec.user_id, item_rec.video_id, item_rec.content, item_rec.id, false, item_rec.created_at);
            END IF;
        END LOOP;

        -- Sincronizar Avaliações existentes
        FOR item_rec IN SELECT * FROM public.avaliacoes LOOP
            IF NOT EXISTS (SELECT 1 FROM public.notificacoes WHERE user_id = admin_rec.id AND source_id = item_rec.id) THEN
                INSERT INTO public.notificacoes (user_id, type, sender_id, content, source_id, read, created_at)
                VALUES (admin_rec.id, 'review', item_rec.usuario_id, item_rec.comentario, item_rec.id, false, item_rec.created_at);
            END IF;
        END LOOP;

        -- Sincronizar Novos Usuários recentes (últimos 90 dias)
        FOR item_rec IN SELECT * FROM public.profiles WHERE created_at > now() - interval '90 days' LOOP
            IF NOT EXISTS (SELECT 1 FROM public.notificacoes WHERE user_id = admin_rec.id AND type = 'new_user' AND sender_id = item_rec.id) THEN
                INSERT INTO public.notificacoes (user_id, type, sender_id, content, source_id, read, created_at)
                VALUES (admin_rec.id, 'new_user', item_rec.id, 'Novo usuário: ' || COALESCE(item_rec.full_name, item_rec.email), item_rec.id, false, item_rec.created_at);
            END IF;
        END LOOP;
    END LOOP;
END;
$$;

GRANT ALL ON public.notificacoes TO authenticated;
GRANT ALL ON public.notificacoes TO service_role;
