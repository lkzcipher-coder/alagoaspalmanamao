-- Create storage bucket for videos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('videos', 'videos', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow public to view videos
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'videos');

-- Policy to allow authenticated users to upload videos
CREATE POLICY "Authenticated users can upload videos" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'videos');

-- Policy to allow authenticated users to update their own videos
CREATE POLICY "Authenticated users can update videos" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'videos');

-- Policy to allow authenticated users to delete their own videos
CREATE POLICY "Authenticated users can delete videos" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'videos');
