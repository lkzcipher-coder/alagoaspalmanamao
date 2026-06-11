-- Create the promotional_banners table
CREATE TABLE public.promotional_banners (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    image_url TEXT NOT NULL,
    target_link TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Grant permissions
GRANT SELECT ON public.promotional_banners TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.promotional_banners TO authenticated;
GRANT ALL ON public.promotional_banners TO service_role;

-- Enable RLS
ALTER TABLE public.promotional_banners ENABLE ROW LEVEL SECURITY;

-- Policies for promotional_banners
-- Everyone (including anon and authenticated) can view active banners
CREATE POLICY "Anyone can view active banners" 
ON public.promotional_banners 
FOR SELECT 
USING (is_active = true);

-- Only admins can manage banners
CREATE POLICY "Admins can manage banners" 
ON public.promotional_banners 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- Setup Storage for banners
INSERT INTO storage.buckets (id, name, public) 
VALUES ('promotional-banners', 'promotional-banners', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for promotional-banners (with unique names)
CREATE POLICY "Public Access for Promotional Banners" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'promotional-banners');

CREATE POLICY "Admins can upload promotional banner images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
    bucket_id = 'promotional-banners' AND 
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

CREATE POLICY "Admins can update promotional banner images" 
ON storage.objects 
FOR UPDATE 
USING (
    bucket_id = 'promotional-banners' AND 
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

CREATE POLICY "Admins can delete promotional banner images" 
ON storage.objects 
FOR DELETE 
USING (
    bucket_id = 'promotional-banners' AND 
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);