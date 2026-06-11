DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'video_comments' AND table_schema = 'public') THEN
        ALTER TABLE public.video_comments RENAME TO comentarios;
    END IF;
END $$;

-- Update trigger for the renamed table
DROP TRIGGER IF EXISTS on_video_comment_change ON public.comentarios;
CREATE TRIGGER on_video_comment_change
AFTER INSERT OR DELETE ON public.comentarios
FOR EACH ROW EXECUTE FUNCTION private.handle_video_comment_change();

-- Fix profiles SELECT policy
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Profiles are publicly viewable" 
ON public.profiles FOR SELECT USING (true);

-- Ensure correct grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comentarios TO authenticated;
GRANT SELECT ON public.comentarios TO anon;
GRANT ALL ON public.comentarios TO service_role;
