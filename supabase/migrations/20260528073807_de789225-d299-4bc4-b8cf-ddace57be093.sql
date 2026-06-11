-- Create video_likes table
CREATE TABLE public.video_likes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(video_id, user_id)
);

-- Create video_comments table
CREATE TABLE public.video_comments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Use GRANT to set permissions
GRANT SELECT, INSERT, DELETE ON public.video_likes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.video_comments TO authenticated;
GRANT SELECT ON public.video_likes TO anon;
GRANT SELECT ON public.video_comments TO anon;
GRANT ALL ON public.video_likes TO service_role;
GRANT ALL ON public.video_comments TO service_role;

-- Enable Row Level Security
ALTER TABLE public.video_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_comments ENABLE ROW LEVEL SECURITY;

-- Create policies for video_likes
CREATE POLICY "Anyone can view video likes" 
ON public.video_likes FOR SELECT USING (true);

CREATE POLICY "Users can toggle their own likes" 
ON public.video_likes FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Create policies for video_comments
CREATE POLICY "Anyone can view video comments" 
ON public.video_comments FOR SELECT USING (true);

CREATE POLICY "Users can create their own comments" 
ON public.video_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update/delete their own comments" 
ON public.video_comments FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Add count columns to videos table
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;

-- Function to update likes count
CREATE OR REPLACE FUNCTION public.handle_video_like_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.videos SET likes_count = likes_count + 1 WHERE id = NEW.video_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.videos SET likes_count = likes_count - 1 WHERE id = OLD.video_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for likes count
CREATE TRIGGER on_video_like_change
AFTER INSERT OR DELETE ON public.video_likes
FOR EACH ROW EXECUTE FUNCTION public.handle_video_like_change();

-- Function to update comments count
CREATE OR REPLACE FUNCTION public.handle_video_comment_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.videos SET comments_count = comments_count + 1 WHERE id = NEW.video_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.videos SET comments_count = comments_count - 1 WHERE id = OLD.video_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for comments count
CREATE TRIGGER on_video_comment_change
AFTER INSERT OR DELETE ON public.video_comments
FOR EACH ROW EXECUTE FUNCTION public.handle_video_comment_change();
