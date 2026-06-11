-- Função para atualizar o contador de comentários
CREATE OR REPLACE FUNCTION public.handle_video_comment_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.videos
        SET comments_count = COALESCE(comments_count, 0) + 1
        WHERE id = NEW.video_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.videos
        SET comments_count = GREATEST(0, COALESCE(comments_count, 0) - 1)
        WHERE id = OLD.video_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para comentários
DROP TRIGGER IF EXISTS on_video_comment_change ON public.comentarios;
CREATE TRIGGER on_video_comment_change
AFTER INSERT OR DELETE ON public.comentarios
FOR EACH ROW
EXECUTE FUNCTION public.handle_video_comment_change();

-- Função para atualizar o contador de curtidas
CREATE OR REPLACE FUNCTION public.handle_video_like_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.videos
        SET likes_count = COALESCE(likes_count, 0) + 1
        WHERE id = NEW.video_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.videos
        SET likes_count = GREATEST(0, COALESCE(likes_count, 0) - 1)
        WHERE id = OLD.video_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para curtidas
DROP TRIGGER IF EXISTS on_video_like_change ON public.video_likes;
CREATE TRIGGER on_video_like_change
AFTER INSERT OR DELETE ON public.video_likes
FOR EACH ROW
EXECUTE FUNCTION public.handle_video_like_change();

-- Sincronizar contadores existentes
UPDATE public.videos v
SET 
    comments_count = (SELECT count(*) FROM public.comentarios c WHERE c.video_id = v.id),
    likes_count = (SELECT count(*) FROM public.video_likes l WHERE l.video_id = v.id);
