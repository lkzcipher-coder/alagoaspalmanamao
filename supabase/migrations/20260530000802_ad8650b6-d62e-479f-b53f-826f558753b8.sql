-- Tornar as políticas de RLS mais restritivas
-- Agora que o trigger handle_new_user está robusto e é SECURITY DEFINER,
-- podemos restringir a inserção via API apenas ao próprio usuário.

ALTER POLICY "Users can insert their own profile" ON public.profiles 
WITH CHECK (auth.uid() = id);

ALTER POLICY "Users can insert their own payments" ON public.payments
WITH CHECK (auth.uid() = user_id);
