-- 1. Atualizar contadores existentes para o estado atual real
UPDATE public.videos v
SET 
  likes_count = (SELECT count(*) FROM public.video_likes WHERE video_id = v.id),
  comments_count = (SELECT count(*) FROM public.comentarios WHERE video_id = v.id);

-- 2. Garantir que as tabelas tenham permissões corretas (caso não tenham)
GRANT UPDATE ON public.videos TO authenticated;
GRANT UPDATE ON public.videos TO service_role;

-- 3. Função para sincronizar curtidas
CREATE OR REPLACE FUNCTION public.handle_video_like_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.videos 
    SET likes_count = (SELECT count(*) FROM public.video_likes WHERE video_id = NEW.video_id)
    WHERE id = NEW.video_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.videos 
    SET likes_count = (SELECT count(*) FROM public.video_likes WHERE video_id = OLD.video_id)
    WHERE id = OLD.video_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Trigger para curtidas
DROP TRIGGER IF EXISTS tr_update_video_likes_count ON public.video_likes;
CREATE TRIGGER tr_update_video_likes_count
AFTER INSERT OR DELETE ON public.video_likes
FOR EACH ROW EXECUTE FUNCTION public.handle_video_like_change();

-- 5. Função para sincronizar comentários
CREATE OR REPLACE FUNCTION public.handle_video_comment_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.videos 
    SET comments_count = (SELECT count(*) FROM public.comentarios WHERE video_id = NEW.video_id)
    WHERE id = NEW.video_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.videos 
    SET comments_count = (SELECT count(*) FROM public.comentarios WHERE video_id = OLD.video_id)
    WHERE id = OLD.video_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Trigger para comentários
DROP TRIGGER IF EXISTS tr_update_video_comments_count ON public.comentarios;
CREATE TRIGGER tr_update_video_comments_count
AFTER INSERT OR DELETE ON public.comentarios
FOR EACH ROW EXECUTE FUNCTION public.handle_video_comment_change();
