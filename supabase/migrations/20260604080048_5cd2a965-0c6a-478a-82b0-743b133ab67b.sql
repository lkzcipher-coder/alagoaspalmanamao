UPDATE public.profiles p
SET full_name = COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name')
FROM auth.users u
WHERE p.id = u.id 
AND (p.full_name IS NULL OR p.full_name = 'Usuário')
AND (u.raw_user_meta_data->>'full_name' IS NOT NULL OR u.raw_user_meta_data->>'name' IS NOT NULL);