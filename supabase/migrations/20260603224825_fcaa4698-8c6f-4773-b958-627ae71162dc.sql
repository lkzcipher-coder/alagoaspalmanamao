-- Fix for avatars bucket listing
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are viewable by authenticated users" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'avatars');

-- Fix for promotional-banners bucket listing
DROP POLICY IF EXISTS "Public Access for Promotional Banners" ON storage.objects;
CREATE POLICY "Promotional banners are viewable by authenticated users" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'promotional-banners');

-- Fix for videos bucket listing
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Videos are viewable by authenticated users" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'videos');

-- Fix for partners bucket listing
DROP POLICY IF EXISTS "Public Access Partners" ON storage.objects;
CREATE POLICY "Partner images are viewable by authenticated users" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'partners');

-- Fix for imagens bucket listing
DROP POLICY IF EXISTS "Public Access Imagens" ON storage.objects;
CREATE POLICY "Imagens are viewable by authenticated users" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'imagens');
