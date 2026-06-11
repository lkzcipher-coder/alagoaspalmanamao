-- Create storage bucket for partners
INSERT INTO storage.buckets (id, name, public) 
VALUES ('partners', 'partners', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow public to view partners images
CREATE POLICY "Public Access Partners" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'partners');

-- Policy to allow authenticated users to upload partners images
CREATE POLICY "Authenticated users can upload partners images" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'partners');
