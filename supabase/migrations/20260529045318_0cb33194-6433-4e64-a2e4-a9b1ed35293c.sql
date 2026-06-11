-- Create a table for favorites
CREATE TABLE public.favoritos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, partner_id)
);

-- Use GRANT to set permissions
GRANT SELECT, INSERT, DELETE ON public.favoritos TO authenticated;
GRANT ALL ON public.favoritos TO service_role;

-- Enable Row Level Security
ALTER TABLE public.favoritos ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own favorites" 
ON public.favoritos 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own favorites" 
ON public.favoritos 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" 
ON public.favoritos 
FOR DELETE 
USING (auth.uid() = user_id);

-- Optional: Migrate data from user_favorites if it exists and has data
-- (Assuming user_favorites has same structure)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_favorites' AND table_schema = 'public') THEN
        INSERT INTO public.favoritos (user_id, partner_id, created_at)
        SELECT user_id, partner_id, created_at FROM public.user_favorites
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
