-- Create is_admin in private schema
CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update the policy to use the new function
ALTER POLICY "Admins can view all profiles" ON public.profiles 
USING (private.is_admin());

-- Now we can drop it from public
DROP FUNCTION IF EXISTS public.is_admin();
