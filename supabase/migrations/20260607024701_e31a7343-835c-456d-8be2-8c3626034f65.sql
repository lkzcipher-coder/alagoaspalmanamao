-- Function to update video likes count
CREATE OR REPLACE FUNCTION public.update_video_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.videos SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = NEW.video_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.videos SET likes_count = GREATEST(0, COALESCE(likes_count, 0) - 1) WHERE id = OLD.video_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for video_likes
DROP TRIGGER IF EXISTS tr_video_likes_count ON public.video_likes;
CREATE TRIGGER tr_video_likes_count
AFTER INSERT OR DELETE ON public.video_likes
FOR EACH ROW EXECUTE FUNCTION public.update_video_likes_count();

-- Function to update video comments count
CREATE OR REPLACE FUNCTION public.update_video_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.videos SET comments_count = COALESCE(comments_count, 0) + 1 WHERE id = NEW.video_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.videos SET comments_count = GREATEST(0, COALESCE(comments_count, 0) - 1) WHERE id = OLD.video_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for comentarios
DROP TRIGGER IF EXISTS tr_video_comments_count ON public.comentarios;
CREATE TRIGGER tr_video_comments_count
AFTER INSERT OR DELETE ON public.comentarios
FOR EACH ROW EXECUTE FUNCTION public.update_video_comments_count();

-- Initialize current counts
UPDATE public.videos v
SET 
  likes_count = (SELECT count(*) FROM public.video_likes WHERE video_id = v.id),
  comments_count = (SELECT count(*) FROM public.comentarios WHERE video_id = v.id);

-- Ensure RLS allows viewing likes and comments correctly
DROP POLICY IF EXISTS "Authenticated users can view video likes" ON public.video_likes;
CREATE POLICY "Authenticated users can view video likes" ON public.video_likes FOR SELECT USING (true);

-- Grant necessary permissions
GRANT ALL ON public.video_likes TO authenticated;
GRANT ALL ON public.video_likes TO service_role;
GRANT ALL ON public.comentarios TO authenticated;
GRANT ALL ON public.comentarios TO service_role;
GRANT UPDATE ON public.videos TO authenticated;
GRANT UPDATE ON public.videos TO service_role;
