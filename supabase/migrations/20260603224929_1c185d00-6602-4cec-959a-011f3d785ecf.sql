-- Drop the previously created policies
DROP POLICY IF EXISTS "Avatar images are viewable by authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Promotional banners are viewable by authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Videos are viewable by authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Partner images are viewable by authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Imagens are viewable by authenticated users" ON storage.objects;

-- Create admin-only SELECT policies
CREATE POLICY "Avatar images are listable by admins" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'avatars' AND (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')));

CREATE POLICY "Promotional banners are listable by admins" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'promotional-banners' AND (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')));

CREATE POLICY "Videos are listable by admins" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'videos' AND (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')));

CREATE POLICY "Partner images are listable by admins" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'partners' AND (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')));

CREATE POLICY "Imagens are listable by admins" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'imagens' AND (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')));
