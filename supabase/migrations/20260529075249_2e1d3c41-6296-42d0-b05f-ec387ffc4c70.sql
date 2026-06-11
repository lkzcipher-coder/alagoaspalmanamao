-- Criar função para lidar com a exclusão de atividades (comentários/curtidas)
CREATE OR REPLACE FUNCTION public.handle_video_activity_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    DELETE FROM public.notificacoes WHERE source_id = OLD.id;
    RETURN OLD;
END;
$$;

-- Garantir que as funções não sejam públicas
REVOKE EXECUTE ON FUNCTION public.handle_video_activity_deletion() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_video_activity_deletion() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_video_activity_deletion() TO postgres;

-- Adicionar gatilho para exclusão de comentários
DROP TRIGGER IF EXISTS on_video_comment_delete ON public.comentarios;
CREATE TRIGGER on_video_comment_delete
AFTER DELETE ON public.comentarios
FOR EACH ROW
EXECUTE FUNCTION public.handle_video_activity_deletion();

-- Adicionar gatilho para exclusão de curtidas
DROP TRIGGER IF EXISTS on_video_like_delete ON public.video_likes;
CREATE TRIGGER on_video_like_delete
AFTER DELETE ON public.video_likes
FOR EACH ROW
EXECUTE FUNCTION public.handle_video_activity_deletion();
