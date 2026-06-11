-- Drop existing select policy for videos
DROP POLICY IF EXISTS "Videos visibility" ON public.videos;

-- Create new select policy for videos (viewable by everyone)
CREATE POLICY "Videos are viewable by everyone" 
ON public.videos 
FOR SELECT 
USING (true);

-- Drop existing select policy for comments
DROP POLICY IF EXISTS "Comentários são públicos" ON public.comentarios;

-- Create new select policy for comments (viewable by everyone)
-- Note: Check if there was another policy for comments select.
-- Let's look at existing comments policies first to be safe.
