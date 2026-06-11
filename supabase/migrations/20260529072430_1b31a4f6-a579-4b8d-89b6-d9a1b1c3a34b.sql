-- Criar tabela de notificações
CREATE TABLE public.notificacoes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('like', 'comment')),
    sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE,
    content TEXT,
    read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Permissões
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notificacoes TO authenticated;
GRANT ALL ON public.notificacoes TO service_role;

-- Habilitar RLS
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Admins can view their own notifications"
ON public.notificacoes
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can update their own notifications"
ON public.notificacoes
FOR UPDATE
USING (auth.uid() = user_id);

-- Função para notificar admins
CREATE OR REPLACE FUNCTION public.notify_admins_on_video_activity()
RETURNS TRIGGER AS $$
DECLARE
    admin_id UUID;
    sender_name TEXT;
    video_title TEXT;
BEGIN
    -- Obter nome do remetente
    SELECT full_name INTO sender_name FROM public.profiles WHERE id = (CASE WHEN TG_TABLE_NAME = 'video_likes' THEN NEW.user_id ELSE NEW.user_id END);
    
    -- Obter título do vídeo
    SELECT title INTO video_title FROM public.videos WHERE id = NEW.video_id;

    -- Notificar todos os admins
    FOR admin_id IN SELECT id FROM public.profiles WHERE role = 'admin' LOOP
        INSERT INTO public.notificacoes (user_id, type, sender_id, video_id, content)
        VALUES (
            admin_id, 
            CASE WHEN TG_TABLE_NAME = 'video_likes' THEN 'like' ELSE 'comment' END,
            CASE WHEN TG_TABLE_NAME = 'video_likes' THEN NEW.user_id ELSE NEW.user_id END,
            NEW.video_id,
            CASE WHEN TG_TABLE_NAME = 'comentarios' THEN NEW.content ELSE NULL END
        );
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers para notificações
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

-- Atualizar política de comentários para permitir que admins excluam
DROP POLICY IF EXISTS "Users can update/delete their own comments" ON public.comentarios;
CREATE POLICY "Users can update/delete their own comments"
ON public.comentarios
FOR ALL
USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
